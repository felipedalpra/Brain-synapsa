import { FONTES_CRM, crmDados } from "./crm-data";
import { AGENTS, TEAMS } from "@brain/shared";
import type { Brain } from "./brain";
import { brtDay } from "./brain";
import { fetchAdsInsights, fetchIgFollowerSeries, fetchIgPosts, fetchInstagram } from "./meta";
import { row, rows, run } from "./sql";
import type { SubscriptionRow } from "./types";

type Env = Record<string, string | undefined>;

export const FONTES = ["resumo", "receita", "clientes", "anuncios", "instagram", "execucoes", "propostas", "entregas", ...FONTES_CRM] as const;
export type Fonte = (typeof FONTES)[number];

const r2 = (n: number) => Math.round(n * 100) / 100;
const ACTIVE = ["active", "trialing", "past_due"];

const metaEnv = (env: Env) => {
  const token = env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error("Falta META_SYSTEM_USER_TOKEN nos secrets do Brain.");
  return { token, version: env.META_GRAPH_VERSION ?? "v23.0" };
};

/** Lê os anúncios da Meta e grava no banco. */
export async function syncAds(brain: Brain, env: Env, now: number, days = 7) {
  const { token, version } = metaEnv(env);
  const acct = env.META_AD_ACCOUNT_ID;
  if (!acct) throw new Error("Falta META_AD_ACCOUNT_ID.");
  const ads = await fetchAdsInsights(version, acct, token, days);
  for (const r of ads) {
    run(brain.db, `insert into meta_ads_daily (day, ad_account_id, campaign_id, campaign_name, currency, spend, impressions, clicks, leads, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(day, campaign_id) do update set spend = excluded.spend, impressions = excluded.impressions, clicks = excluded.clicks, leads = excluded.leads, updated_at = excluded.updated_at`,
      r.day, r.ad_account_id, r.campaign_id, r.campaign_name, r.currency, r.spend, r.impressions, r.clicks, r.leads, now);
  }
  return ads;
}

/** Lê seguidores, alcance e visitas do Instagram e grava no banco. */
export async function syncIg(brain: Brain, env: Env, now: number) {
  const { token, version } = metaEnv(env);
  const igId = env.META_IG_ID;
  if (!igId) throw new Error("Falta META_IG_ID.");
  const ig = await fetchInstagram(version, igId, token, new Date(now));
  run(brain.db, `insert into instagram_daily (day, ig_id, followers, reach, profile_views, updated_at) values (?, ?, ?, ?, ?, ?)
    on conflict(day, ig_id) do update set followers = excluded.followers, reach = excluded.reach, profile_views = excluded.profile_views, updated_at = excluded.updated_at`, ig.day, ig.ig_id, ig.followers, ig.reach, ig.profile_views, now);
  return ig;
}

/** Os dois juntos (rotina da Mídia Paga). Anúncios e Instagram falham separados: um erro não esconde o outro. */
export async function syncMeta(brain: Brain, env: Env, now: number, days = 7) {
  const [ads, ig] = await Promise.allSettled([syncAds(brain, env, now, days), env.META_IG_ID ? syncIg(brain, env, now) : Promise.resolve(null)]);
  return { ads: ads.status === "fulfilled" ? ads.value : null, adsErro: ads.status === "rejected" ? (ads.reason as Error).message : null, ig: ig.status === "fulfilled" ? ig.value : null, igErro: ig.status === "rejected" ? (ig.reason as Error).message : null };
}

const since = (days: number, now: number) => brtDay(now - days * 86_400_000);

function receita(brain: Brain, dias: number) {
  const now = brain.clock();
  const m = brain.metrics();
  const hist = rows<{ day: string; source: string; mrr_brl: number; subs_count: number }>(brain.db, "select day, source, mrr_brl, subs_count from mrr_daily where day >= ? order by day, source", since(dias, now));
  const subs = rows<SubscriptionRow & { origin: string }>(brain.db, "select source, external_id, label, status, list_price_brl, effective_price_brl, discount_ends_at, origin from subscriptions");
  const ativos = subs.filter((s) => ACTIVE.includes(s.status));
  const reajuste = ativos.filter((s) => s.discount_ends_at).reduce((n, s) => n + (s.list_price_brl - s.effective_price_brl), 0);
  return {
    mrr_atual: m.mrr,
    falta_para_meta_brl: r2(Math.max(0, m.mrr.goal - m.mrr.total)),
    clientes_ativos: ativos.length,
    clientes_cancelados: subs.filter((s) => s.status === "canceled").length,
    ticket_medio_brl: ativos.length ? r2(m.mrr.total / ativos.length) : 0,
    mrr_quando_todos_os_descontos_acabarem_brl: r2(m.mrr.total + reajuste),
    fins_de_desconto: m.descontos,
    historico_mrr_por_dia: hist,
    observacao: hist.length < 2 ? "O Brain só guarda o histórico desde que a rotina diária começou; ainda há poucos dias." : undefined,
  };
}

function clientes(brain: Brain) {
  const subs = rows<SubscriptionRow & { origin: string }>(brain.db, "select source, external_id, label, status, list_price_brl, effective_price_brl, discount_ends_at, origin from subscriptions order by source, status, external_id");
  return {
    total_ativos: subs.filter((s) => ACTIVE.includes(s.status)).length,
    lista: subs.map((s) => ({ fonte: s.source, id: s.external_id, nome: s.label, status: s.status, preco_cheio_brl: s.list_price_brl, preco_efetivo_brl: s.effective_price_brl, desconto_acaba_em: s.discount_ends_at, origem_do_dado: s.origin })),
    aviso: "Fonte 'pix' é informada por você, não lida de um banco. Fonte 'stripe' é lida do Stripe.",
  };
}

async function anuncios(brain: Brain, env: Env, dias: number, atualizar: boolean) {
  const now = brain.clock();
  const avisos: string[] = [];
  const have = row<{ n: number; u: number | null }>(brain.db, "select count(*) as n, max(updated_at) as u from meta_ads_daily")!;
  const stale = !have.u || now - have.u > 3 * 3_600_000;
  if ((atualizar || stale) && (atualizar || env.META_SYSTEM_USER_TOKEN)) {
    try {
      await syncAds(brain, env, now, dias > 7 ? 30 : 7);
    } catch (e) {
      avisos.push(`Não consegui atualizar da Meta: ${e instanceof Error ? e.message : String(e)}. Usei o último dado guardado.`);
    }
  }
  const camp = rows<{ campaign_id: string; campaign_name: string; spend: number; impressions: number; clicks: number; leads: number; dias: number }>(
    brain.db,
    "select campaign_id, campaign_name, sum(spend) as spend, sum(impressions) as impressions, sum(clicks) as clicks, sum(leads) as leads, count(*) as dias from meta_ads_daily where day >= ? group by campaign_id, campaign_name order by spend desc",
    since(dias, now),
  );
  const tot = camp.reduce((a, c) => ({ spend: a.spend + c.spend, impressions: a.impressions + c.impressions, clicks: a.clicks + c.clicks, leads: a.leads + c.leads }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });
  const atualizado = row<{ u: number | null }>(brain.db, "select max(updated_at) as u from meta_ads_daily")?.u;
  return {
    periodo_dias: dias,
    atualizado_em: atualizado ? new Date(atualizado).toISOString() : null,
    total: { gasto_brl: r2(tot.spend), impressoes: tot.impressions, cliques: tot.clicks, leads: tot.leads, ctr_pct: tot.impressions ? r2((tot.clicks / tot.impressions) * 100) : null, custo_por_lead_brl: tot.leads ? r2(tot.spend / tot.leads) : null, cpc_brl: tot.clicks ? r2(tot.spend / tot.clicks) : null },
    campanhas: camp.map((c) => ({ id: c.campaign_id, nome: c.campaign_name, gasto_brl: r2(c.spend), impressoes: c.impressions, cliques: c.clicks, leads: c.leads, custo_por_lead_brl: c.leads ? r2(c.spend / c.leads) : null, dias_com_dado: c.dias })),
    por_dia: rows(brain.db, "select day, sum(spend) as gasto_brl, sum(clicks) as cliques, sum(leads) as leads from meta_ads_daily where day >= ? group by day order by day", since(dias, now)),
    avisos: avisos.length ? avisos : undefined,
    nota: camp.length === 0 ? "A conta de anúncios não teve gasto nesse período." : undefined,
  };
}

/** Lê tudo do Instagram agora (seguidores, posts, seguidores novos por dia) e guarda para o dashboard. Devolve os avisos de erro. */
export async function refreshInstagram(brain: Brain, env: Env, dias = 30): Promise<string[]> {
  const avisos: string[] = [];
  const token = env.META_SYSTEM_USER_TOKEN;
  const igId = env.META_IG_ID;
  if (!token || !igId) return ["Falta META_SYSTEM_USER_TOKEN ou META_IG_ID nos secrets."];
  const version = env.META_GRAPH_VERSION ?? "v23.0";
  const now = brain.clock();
  await syncIg(brain, env, now).catch((e) => avisos.push(`Seguidores: ${e instanceof Error ? e.message : String(e)}`));
  const posts = await fetchIgPosts(version, igId, token, 12).catch((e) => (avisos.push(`Posts: ${e instanceof Error ? e.message : String(e)}`), null));
  if (posts) brain.setPolicy("cache_ig_posts", { at: now, posts });
  const novos = await fetchIgFollowerSeries(version, igId, token, Math.min(dias, 30), new Date(now)).catch((e) => (avisos.push(`Seguidores por dia: ${e instanceof Error ? e.message : String(e)}`), null));
  if (novos) brain.setPolicy("cache_ig_novos", { at: now, novos });
  return avisos;
}

function instagramGuardado(brain: Brain, dias: number) {
  const now = brain.clock();
  const hist = rows<{ day: string; followers: number | null; reach: number | null; profile_views: number | null }>(brain.db, "select day, followers, reach, profile_views from instagram_daily where day >= ? order by day", since(dias, now));
  const posts = brain.policy<{ at: number; posts: Awaited<ReturnType<typeof fetchIgPosts>> } | null>("cache_ig_posts", null);
  const novos = brain.policy<{ at: number; novos: { day: string; novos: number }[] } | null>("cache_ig_novos", null);
  const eng = posts?.posts.length ? posts.posts.reduce((n, p) => n + (p.curtidas ?? 0) + (p.comentarios ?? 0), 0) / posts.posts.length : null;
  return {
    seguidores_hoje: hist.at(-1)?.followers ?? null,
    historico_guardado: hist,
    seguidores_novos_por_dia: novos?.novos,
    ultimos_posts: posts?.posts,
    engajamento_medio_por_post: eng === null ? null : r2(eng),
    atualizado_em: posts?.at ? new Date(posts.at).toISOString() : null,
  };
}

async function instagram(brain: Brain, env: Env, dias: number, atualizar: boolean) {
  const now = brain.clock();
  let avisos: string[] = [];
  const fresh = brain.policy<{ at: number } | null>("cache_ig_posts", null);
  if (atualizar || !fresh || now - fresh.at > 3 * 3_600_000) avisos = await refreshInstagram(brain, env, dias);
  return { ...instagramGuardado(brain, dias), avisos: avisos.length ? avisos : undefined };
}

function execucoes(brain: Brain, equipe?: string) {
  const areas = TEAMS.find((t) => t.id === equipe)?.areas;
  const ids = AGENTS.filter((a) => !areas || areas.includes(a.area)).map((a) => a.id);
  const q = rows<{ id: number; agent_id: string; task: string; status: string; requested_by: string; created_at: number; cost_brl: number; result: string | null; error: string | null }>(
    brain.db,
    "select id, agent_id, task, status, requested_by, created_at, cost_brl, result, error from agent_runs where agent_id != 'jarvis' order by id desc limit 60",
  ).filter((r) => ids.includes(r.agent_id));
  return q.slice(0, 25).map((r) => ({ id: r.id, agente: r.agent_id, tarefa: r.task, status: r.status, pedido_por: r.requested_by, quando: new Date(r.created_at).toISOString(), custo_brl: r.cost_brl, resultado: r.result ?? r.error }));
}

function entregas(brain: Brain, equipe?: string) {
  const areas = TEAMS.find((t) => t.id === equipe)?.areas;
  const ids = AGENTS.filter((a) => !areas || areas.includes(a.area)).map((a) => a.id);
  return rows<{ id: number; agent_id: string; title: string; body: string; at: number }>(brain.db, "select id, agent_id, title, body, at from deliverables order by id desc limit 40")
    .filter((d) => ids.includes(d.agent_id))
    .slice(0, 10)
    .map((d) => ({ id: d.id, agente: d.agent_id, titulo: d.title, quando: new Date(d.at).toISOString(), texto: d.body.slice(0, 2500) }));
}

function propostas(brain: Brain) {
  return rows(brain.db, "select id, agent_id as agente, title as titulo, status, impacto_brl, risk as risco, channel as canal, review_note, created_at from proposals order by created_at desc limit 30");
}

function resumo(brain: Brain) {
  return { receita: receita(brain, 30), propostas_pendentes: propostas(brain).filter((p: any) => p.status === "pendente").length };
}

export interface DataCtx {
  brain: Brain;
  env: Env;
  fetchFn?: typeof fetch;
}

/** Entrega dados reais do Brain ao Jarvis e aos agentes. Só leitura; segredos nunca saem daqui. */
export async function consultarDados(ctx: DataCtx, fonte: string, opts: { dias?: number; atualizar?: boolean; equipe?: string; filtros?: Record<string, unknown>; pagina?: number } = {}): Promise<unknown> {
  const dias = Math.min(Math.max(Math.round(opts.dias ?? 14), 1), 90);
  switch (fonte) {
    case "resumo":
      return resumo(ctx.brain);
    case "receita":
      return receita(ctx.brain, dias);
    case "clientes":
      return clientes(ctx.brain);
    case "anuncios":
      return anuncios(ctx.brain, ctx.env, dias, opts.atualizar === true);
    case "instagram":
      return instagram(ctx.brain, ctx.env, dias, opts.atualizar === true);
    case "execucoes":
      return execucoes(ctx.brain, opts.equipe);
    case "propostas":
      return propostas(ctx.brain);
    case "entregas":
      return entregas(ctx.brain, opts.equipe);
    case "crm_resumo":
    case "crm_leads":
    case "crm_atividades":
    case "crm_reunioes":
    case "crm_funil":
      return crmDados(ctx.env, fonte, { filtros: opts.filtros, pagina: opts.pagina }, ctx.fetchFn);
    default:
      throw new Error(`Fonte desconhecida: ${fonte}. Use: ${FONTES.join(", ")}.`);
  }
}

export const DADOS_TOOL = {
  name: "consultar_dados",
  description:
    "Dados reais e atuais do negócio. fonte: receita (MRR, histórico, clientes ativos, fins de desconto, projeção), clientes (lista de assinaturas Stripe e Pix), anuncios (Meta Ads por campanha: gasto, cliques, leads, custo por lead), instagram (seguidores, alcance, posts recentes com curtidas e comentários), execucoes (o que cada agente fez), propostas (fila e histórico), entregas (documentos completos que os agentes produziram), crm_resumo (CRM: leads, funil, conversão, atividades atrasadas), crm_leads (lista de leads do CRM, com filtros), crm_atividades, crm_reunioes, crm_funil. O CRM é só leitura e não devolve telefone nem e-mail. Use atualizar=true para ler de novo da Meta agora. Sempre consulte antes de dizer que não tem um dado.",
  input_schema: {
    type: "object",
    properties: {
      fonte: { type: "string", enum: [...FONTES] },
      dias: { type: "number", description: "Janela em dias (1 a 90). Anúncios só têm 7 ou 30 dias na Meta." },
      atualizar: { type: "boolean", description: "Lê da Meta agora em vez de usar o último dado guardado." },
      filtros: { type: "object", description: "Só para fontes crm_*. crm_leads: search, status, origin, classification, lead_type, created_from, created_to. crm_atividades: lead_id, status, type, scheduled_from, scheduled_to. crm_reunioes: lead_id, status, scheduled_from, scheduled_to. crm_resumo/crm_funil: from, to, stale_days.", additionalProperties: { type: "string" } },
      pagina: { type: "number", description: "Página (25 por página) para crm_leads, crm_atividades e crm_reunioes." },
    },
    required: ["fonte"],
  },
} as const;

/** Tudo que o dashboard mostra, só do que o Brain já guardou (nenhuma chamada externa). */
export function dashboardData(brain: Brain) {
  const now = brain.clock();
  const serie = rows<{ day: string; source: string; mrr_brl: number }>(brain.db, "select day, source, mrr_brl from mrr_daily where day >= ? order by day", since(60, now));
  const byDay = new Map<string, { day: string; stripe: number; pix: number; manual: number; total: number }>();
  for (const r of serie) {
    const d = byDay.get(r.day) ?? { day: r.day, stripe: 0, pix: 0, manual: 0, total: 0 };
    if (r.source === "total") d.total = r.mrr_brl;
    else if (r.source === "stripe" || r.source === "pix" || r.source === "manual") d[r.source] = r.mrr_brl;
    byDay.set(r.day, d);
  }
  const camp = rows<{ campaign_id: string; campaign_name: string; spend: number; impressions: number; clicks: number; leads: number }>(
    brain.db,
    "select campaign_id, campaign_name, sum(spend) as spend, sum(impressions) as impressions, sum(clicks) as clicks, sum(leads) as leads from meta_ads_daily where day >= ? group by campaign_id, campaign_name order by spend desc",
    since(30, now),
  );
  const tot = camp.reduce((a, c) => ({ spend: a.spend + c.spend, clicks: a.clicks + c.clicks, leads: a.leads + c.leads, impressions: a.impressions + c.impressions }), { spend: 0, clicks: 0, leads: 0, impressions: 0 });
  const adsAt = row<{ u: number | null }>(brain.db, "select max(updated_at) as u from meta_ads_daily")?.u ?? null;
  return {
    agora: now,
    receita: receita(brain, 60),
    mrrSerie: [...byDay.values()],
    clientes: clientes(brain),
    anuncios: {
      atualizadoEm: adsAt,
      gasto: r2(tot.spend),
      cliques: tot.clicks,
      leads: tot.leads,
      impressoes: tot.impressions,
      custoPorLead: tot.leads ? r2(tot.spend / tot.leads) : null,
      campanhas: camp.map((c) => ({ id: c.campaign_id, nome: c.campaign_name, gasto: r2(c.spend), cliques: c.clicks, leads: c.leads })),
      porDia: rows<{ day: string; gasto: number; leads: number }>(brain.db, "select day, sum(spend) as gasto, sum(leads) as leads from meta_ads_daily where day >= ? group by day order by day", since(30, now)),
    },
    instagram: instagramGuardado(brain, 60),
    custoIa: { mes: brain.metrics().llmSpentMonthBrl, teto: brain.metrics().llmCapMonthlyBrl },
  };
}

/** Lê Meta e Instagram agora e guarda. Chamado pelo botão "Atualizar dados". */
export async function refreshDados(brain: Brain, env: Env): Promise<string[]> {
  const avisos: string[] = [];
  await syncAds(brain, env, brain.clock(), 30).catch((e) => avisos.push(`Anúncios: ${e instanceof Error ? e.message : String(e)}`));
  avisos.push(...(await refreshInstagram(brain, env, 30)));
  brain.emit("change");
  return avisos;
}
