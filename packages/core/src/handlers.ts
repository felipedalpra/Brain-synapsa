import { mrrBySource, stripeToRow } from "./mrr";
import { planGuardiao, fetchStripeSubs } from "./guardiao";
import { syncMeta } from "./data";
import { wastedSpend } from "./meta";
import type { SubscriptionRow } from "./types";
import { Brain, brtDay, type ProposalInput } from "./brain";
import { row, rows, run, tx } from "./sql";

export type Env = Record<string, string | undefined>;

export interface HandlerResult {
  status: "done" | "blocked";
  result: string;
  proposals?: ProposalInput[];
  costBrl?: number;
  /** Documento completo que o agente entrega (pesquisa, plano, texto). */
  entrega?: string;
}

export interface HandlerCtx {
  brain: Brain;
  env: Env;
  now: number;
}

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n % 1 ? 2 : 0 }).replace(/ /g, " ");

const allSubs = (brain: Brain) => rows<SubscriptionRow>(brain.db, "select source, external_id, professional_id, label, list_price_brl, effective_price_brl, discount_ends_at, status from subscriptions");

/** Guardião de Dados: sincroniza o Stripe (se houver chave), fecha o MRR do dia e aponta divergência e fim de desconto. */
export async function guardiao({ brain, env, now }: HandlerCtx): Promise<HandlerResult> {
  let note = "";
  const day = brtDay(now);
  if (env.STRIPE_READ_KEY) {
    const synced = (await fetchStripeSubs(env.STRIPE_READ_KEY)).map(stripeToRow);
    tx(brain.db, () => {
      run(brain.db, "delete from subscriptions where source = 'stripe' and origin = 'informado'");
      for (const r of synced) {
        run(brain.db, `insert into subscriptions (source, external_id, professional_id, label, list_price_brl, effective_price_brl, discount_ends_at, status, origin, updated_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, 'sincronizado', ?)
          on conflict(source, external_id) do update set list_price_brl = excluded.list_price_brl, effective_price_brl = excluded.effective_price_brl, discount_ends_at = excluded.discount_ends_at, status = excluded.status, origin = 'sincronizado', updated_at = excluded.updated_at`,
          r.source, r.external_id, r.professional_id, r.label, r.list_price_brl, r.effective_price_brl, r.discount_ends_at, r.status, now);
      }
    });
    // Propostas abertas sobre as assinaturas "informadas" perdem o sentido depois do Stripe real.
    run(brain.db, "update proposals set status = 'rejeitada', decided_at = ?, review_note = 'substituída pela leitura real do Stripe' where status = 'pendente' and dedupe_key like 'fim_desconto:stripe:informado-%'", now);
    note = ` Stripe sincronizado: ${synced.length} assinaturas.`;
  } else {
    note = " Sem STRIPE_READ_KEY: usei os valores que você informou.";
  }

  const all = allSubs(brain);
  const { bySource, total } = mrrBySource(all);
  for (const [source, v] of Object.entries({ ...bySource, total: { mrr: total, count: Object.values(bySource).reduce((n, x) => n + x.count, 0) } })) {
    run(brain.db, "insert into mrr_daily (day, source, mrr_brl, subs_count) values (?, ?, ?, ?) on conflict(day, source) do update set mrr_brl = excluded.mrr_brl, subs_count = excluded.subs_count", day, source, v.mrr, v.count);
  }
  const plan = planGuardiao({ stripeRows: all.filter((r) => r.source === "stripe"), others: all.filter((r) => r.source !== "stripe"), all, now: new Date(now), windowDays: 30, day });
  const proposals: ProposalInput[] = plan.proposals.map((p) => ({
    agentId: "guardiao",
    kind: p.kind,
    title: p.title,
    why:
      p.kind === "retencao_fim_desconto"
        ? `O desconto acaba e o plano volta ao preço cheio. Fale com a pessoa antes. Regra: nenhum agente oferece desconto, você decide o que dizer.`
        : `Stripe e plataforma registram valores diferentes para a mesma assinatura. Confira antes de fechar o MRR.`,
    impactoBrl: p.impacto_brl,
    risk: p.risk,
    channel: p.channel,
    payload: p.payload,
    dedupeKey: p.dedupe_key,
  }));
  return { status: "done", result: `MRR fechado em ${brl(total)}.${note}`, proposals };
}

/** Financeiro: onde o MRR está frente à meta. Só leitura e só análise. */
export async function financeiro({ brain }: HandlerCtx): Promise<HandlerResult> {
  const m = brain.metrics();
  const falta = Math.max(0, m.mrr.goal - m.mrr.total);
  const pct = Math.round((m.mrr.total / m.mrr.goal) * 100);
  const d = m.descontos.map((x) => `${x.contas} em ${x.quando}`).join(", ");
  return { status: "done", result: `MRR de ${brl(m.mrr.total)}, ${pct}% de ${brl(m.mrr.goal)}. Faltam ${brl(falta)}, cerca de ${Math.ceil(falta / m.mrr.essencialPrice)} Essenciais a ${brl(m.mrr.essencialPrice)}.${d ? ` Reajustes à vista: ${d}.` : ""}` };
}

/** Mídia Paga: lê anúncios e Instagram. Campanha sem lead vira proposta de revisão. Nunca pausa. */
export async function midia({ brain, env, now }: HandlerCtx): Promise<HandlerResult> {
  const token = env.META_SYSTEM_USER_TOKEN;
  const acct = env.META_AD_ACCOUNT_ID;
  if (!token || !acct) return { status: "blocked", result: "Falta META_SYSTEM_USER_TOKEN ou META_AD_ACCOUNT_ID nos secrets do Brain para ler os anúncios." };
  const m = await syncMeta(brain, env, now, 7);
  if (m.adsErro && (m.igErro || !env.META_IG_ID)) throw new Error(m.adsErro);
  const ads = m.ads ?? [];
  const ig = m.ig ? ` Instagram: ${m.ig.followers ?? "?"} seguidores.` : m.igErro ? ` Instagram falhou: ${m.igErro}.` : "";
  const adsNote = m.adsErro ? ` Anúncios falharam: ${m.adsErro}.` : "";
  const spend = ads.reduce((n, r) => n + r.spend, 0);
  const leads = ads.reduce((n, r) => n + r.leads, 0);
  const day = brtDay(now);
  const proposals: ProposalInput[] = wastedSpend(ads, 50).map((c) => ({
    agentId: "midia",
    kind: "revisar_campanha",
    title: `Revisar campanha "${c.campaign_name}": ${brl(c.spend)} sem lead em 7 dias`,
    why: `Gastou ${brl(c.spend)}, teve ${c.clicks} cliques e nenhum lead. O Brain nunca pausa sozinho: você decide pausar, trocar o criativo ou manter.`,
    impactoBrl: c.spend,
    risk: "baixo",
    channel: "interno",
    payload: { ...c },
    dedupeKey: `campanha_sem_lead:${c.campaign_id}:${day}`,
  }));
  return { status: "done", result: m.adsErro ? `${adsNote.trim()}${ig}` : `Leu os anúncios dos últimos 7 dias: ${brl(spend)} gastos e ${leads} leads.${ig}`, proposals };
}

/** Chief of Staff: o briefing do dia a partir do que o Brain já sabe. */
export async function chief({ brain }: HandlerCtx): Promise<HandlerResult> {
  const snap = brain.snapshot([]);
  const pend = snap.proposals.filter((p) => p.status === "pendente");
  const top = pend.slice(0, 3).map((p) => `${p.title} (${brl(p.impactoBrl)})`);
  const m = snap.metrics;
  const soon = m.descontos.length ? ` Próximo reajuste: ${m.descontos[0]!.quando}.` : "";
  const blocked = row<{ n: number }>(brain.db, "select count(*) as n from agent_runs where status = 'blocked' and created_at >= ?", now0(brain))?.n ?? 0;
  return {
    status: "done",
    result: pend.length === 0 ? `Briefing: fila vazia. MRR em ${brl(m.mrr.total)}.${soon}` : `Briefing: ${pend.length} propostas esperando você${snap.overflow ? ` (+${snap.overflow} fora do teto)` : ""}. Primeiras: ${top.join("; ")}. MRR em ${brl(m.mrr.total)}.${soon}${blocked ? ` ${blocked} tarefas travadas por falta de integração.` : ""}`,
  };
}

const now0 = (brain: Brain) => Date.parse(`${brtDay(brain.clock())}T00:00:00-03:00`);

/** Agentes com rotina de código. Os demais dependem do raciocínio da IA. */
export const HANDLERS: Record<string, (c: HandlerCtx) => Promise<HandlerResult>> = { guardiao, financeiro, midia, chief };

