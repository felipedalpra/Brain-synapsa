// Google Analytics 4: o que as pessoas fazem DENTRO do site e do diretório (visitas, tempo, engajamento, eventos-chave).
// Complementa o Search Console, que só vê até o clique. Só LEITURA, pela mesma conta de serviço do Search Console.
import { BrainError, brtDay, type Brain } from "./brain";
import { row, rows, run } from "./sql";
import { lerChave, sitesGsc, tokenGoogle } from "./gsc";
import { classificarPagina, type PaginaInfo } from "./gsc-analise";

type Env = Record<string, string | undefined>;
const DAY = 86_400_000;
const ESCOPO = "https://www.googleapis.com/auth/analytics.readonly";
const DATA = "https://analyticsdata.googleapis.com/v1beta";
const ADMIN = "https://analyticsadmin.googleapis.com/v1beta";
const dia = (ms: number) => brtDay(ms);

const METRICAS = ["sessions", "totalUsers", "newUsers", "engagedSessions", "screenPageViews", "userEngagementDuration", "keyEvents"] as const;
interface M { sessoes: number; usuarios: number; novos: number; engajadas: number; views: number; seg: number; eventos: number }
const ZERO: M = { sessoes: 0, usuarios: 0, novos: 0, engajadas: 0, views: 0, seg: 0, eventos: 0 };
const daLinha = (v: { value?: string }[]): M => ({ sessoes: +(v[0]?.value ?? 0), usuarios: +(v[1]?.value ?? 0), novos: +(v[2]?.value ?? 0), engajadas: +(v[3]?.value ?? 0), views: +(v[4]?.value ?? 0), seg: +(v[5]?.value ?? 0), eventos: +(v[6]?.value ?? 0) });

/** Propriedade GA4 de cada site do SEO (id do site -> número da propriedade). Vem da política `ga_propriedades`, preenchida à mão ou pela descoberta automática. */
export const propriedadesGa = (brain: Brain): Record<string, string> => {
  const p = brain.policy<Record<string, string> | null>("ga_propriedades", null);
  return p && typeof p === "object" ? p : {};
};

async function chamar<T>(f: typeof fetch, token: string, url: string, init: RequestInit = {}): Promise<T> {
  const r = await f(url, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers ?? {}) } });
  const txt = await r.text();
  let j: any = {};
  try { j = txt ? JSON.parse(txt) : {}; } catch { /* corpo não é JSON */ }
  if (!r.ok) throw new BrainError("integration", traduzir(r.status, j?.error?.message ?? txt.slice(0, 200), url));
  return j as T;
}

/** Traduz os erros mais comuns do Google para o que falta fazer. */
export function traduzir(status: number, msg: string, url = ""): string {
  const api = /analyticsadmin/.test(url) ? "Google Analytics Admin API" : "Google Analytics Data API";
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg)) return `Ative a "${api}" no projeto do Google Cloud (APIs e serviços > Biblioteca) e tente de novo em alguns minutos.`;
  if (status === 403 || /permission|does not have sufficient/i.test(msg)) return "A conta de serviço não tem acesso a essa propriedade do GA4: adicione o e-mail dela como Leitor em Administrador > Acesso à propriedade.";
  if (status === 404 || /not found/i.test(msg)) return "Propriedade do GA4 não encontrada: confira o número em Administrador > Detalhes da propriedade.";
  return `GA4 respondeu ${status}: ${msg.slice(0, 160)}`;
}

interface Relatorio { rows?: { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] }[] }
async function relatorio(f: typeof fetch, token: string, prop: string, ini: string, fim: string, dims: string[], metricas: readonly string[] = METRICAS, limite = 1000): Promise<{ dims: string[]; m: M }[]> {
  const j = await chamar<Relatorio>(f, token, `${DATA}/properties/${prop}:runReport`, {
    method: "POST",
    body: JSON.stringify({ dateRanges: [{ startDate: ini, endDate: fim }], dimensions: dims.map((name) => ({ name })), metrics: metricas.map((name) => ({ name })), limit: String(limite), keepEmptyRows: false }),
  });
  return (j.rows ?? []).map((r) => ({ dims: (r.dimensionValues ?? []).map((d) => d.value ?? ""), m: daLinha(r.metricValues ?? []) }));
}

/** Procura, entre as propriedades que a conta de serviço enxerga, a que mede cada site (pelo endereço do fluxo de dados). */
export async function descobrirPropriedades(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<{ achadas: Record<string, string>; vistas: { id: string; nome: string; enderecos: string[] }[] }> {
  const chave = lerChave(env);
  if (!chave) throw new BrainError("integration", "Falta o segredo GSC_SERVICE_ACCOUNT.");
  const token = await tokenGoogle(chave, brain.clock(), f, ESCOPO);
  const resumo = await chamar<{ accountSummaries?: { propertySummaries?: { property: string; displayName: string }[] }[] }>(f, token, `${ADMIN}/accountSummaries?pageSize=200`);
  const vistas: { id: string; nome: string; enderecos: string[] }[] = [];
  for (const c of resumo.accountSummaries ?? []) for (const p of c.propertySummaries ?? []) {
    const id = p.property.replace("properties/", "");
    const fluxos = await chamar<{ dataStreams?: { webStreamData?: { defaultUri?: string } }[] }>(f, token, `${ADMIN}/properties/${id}/dataStreams`).catch(() => ({ dataStreams: [] }));
    vistas.push({ id, nome: p.displayName, enderecos: (fluxos.dataStreams ?? []).map((d) => d.webStreamData?.defaultUri ?? "").filter(Boolean) });
  }
  const achadas: Record<string, string> = {};
  for (const s of sitesGsc(brain)) {
    const dominio = s.siteUrl.replace(/^sc-domain:/, "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
    const v = vistas.find((x) => x.enderecos.some((e) => e.includes(dominio)) || x.nome.toLowerCase().includes(dominio));
    if (v) achadas[s.id] = v.id;
  }
  return { achadas, vistas };
}

/** Visitas dos últimos 28 dias por código de lead (utm_content) no site principal. Uma só chamada ao GA4. */
export async function gaConteudoPorLead(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<{ codigo: string; sessoes: number; ultimo: string }[]> {
  const chave = lerChave(env);
  const props = propriedadesGa(brain);
  const site = sitesGsc(brain).find((s) => s.tipo !== "diretorio" && props[s.id]);
  if (!chave || !site) return [];
  const agora = brain.clock();
  const token = await tokenGoogle(chave, agora, f, ESCOPO);
  const r = await relatorio(f, token, props[site.id]!, dia(agora - 27 * DAY), dia(agora), ["sessionManualAdContent", "date"], ["sessions"], 1000);
  const por = new Map<string, { sessoes: number; ultimo: string }>();
  for (const l of r) {
    const codigo = l.dims[0] ?? "", d = l.dims[1] ?? "";
    if (!/^l[0-9a-z]{1,8}$/.test(codigo)) continue;
    const data = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
    const x = por.get(codigo) ?? { sessoes: 0, ultimo: "" };
    x.sessoes += l.m.sessoes;
    if (data > x.ultimo) x.ultimo = data;
    por.set(codigo, x);
  }
  return [...por].map(([codigo, v]) => ({ codigo, ...v }));
}

export async function sincronizarGa(brain: Brain, env: Env, f: typeof fetch = fetch, opt: { forcar?: boolean } = {}): Promise<string> {
  const chave = lerChave(env);
  if (!chave) return "GA4 não configurado (falta o segredo GSC_SERVICE_ACCOUNT).";
  const agora = brain.clock();
  const hoje = dia(agora);
  if (!opt.forcar && brain.policy<string>("ga_ultima_sync", "") === hoje) return "GA4 já sincronizado hoje.";
  let props = propriedadesGa(brain);
  const falhas: string[] = [];
  if (!Object.keys(props).length) {
    try {
      const d = await descobrirPropriedades(brain, env, f);
      if (Object.keys(d.achadas).length) { props = d.achadas; brain.setPolicy("ga_propriedades", props); }
      else { brain.setPolicy("ga_ultimo_erro", d.vistas.length ? `A conta de serviço enxerga ${d.vistas.length} propriedade(s), mas nenhuma mede synapsa.com.br ou synapsa.chat. Informe o número da propriedade de cada site.` : "A conta de serviço ainda não enxerga nenhuma propriedade do GA4: adicione o e-mail dela como Leitor em Administrador > Acesso à propriedade."); return "GA4: nenhuma propriedade encontrada ainda."; }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      brain.setPolicy("ga_ultimo_erro", m.slice(0, 400));
      return `GA4 com problema: ${m}`;
    }
  }
  const token = await tokenGoogle(chave, agora, f, ESCOPO);
  const fim = dia(agora - DAY); // o GA4 fecha o dia com pouco atraso
  const fimMs = Date.parse(`${fim}T12:00:00Z`);
  const janela = { atual: [dia(fimMs - 27 * DAY), fim], anterior: [dia(fimMs - 55 * DAY), dia(fimMs - 28 * DAY)] } as const;
  let dias = 0;
  for (const s of sitesGsc(brain)) {
    const prop = props[s.id];
    if (!prop) continue;
    try {
      const ult = row<{ d: string | null }>(brain.db, "select max(dia) as d from ga_dia where site = ?", s.id)?.d;
      const ini = ult ? dia(Date.parse(`${ult}T12:00:00Z`) - 3 * DAY) : dia(agora - 90 * DAY);
      const diario = await relatorio(f, token, prop, ini, fim, ["date"], METRICAS, 500);
      const agg: { tipo: string; periodo: string; k1: string; k2: string; m: M }[] = [];
      for (const periodo of ["atual", "anterior"] as const) {
        const [a, b] = janela[periodo];
        for (const r of await relatorio(f, token, prop, a, b, [])) agg.push({ tipo: "total", periodo, k1: "total", k2: "", m: r.m });
        const grupos: [string, string][] = [["canal", "sessionDefaultChannelGroup"], ["origem", "sessionSourceMedium"], ["entrada", "landingPage"], ["pagina", "pagePath"], ["aparelho", "deviceCategory"], ["pais", "country"]];
        for (const [tipo, dim] of grupos) for (const r of await relatorio(f, token, prop, a, b, [dim], METRICAS, tipo === "entrada" || tipo === "pagina" ? 1000 : 60)) agg.push({ tipo, periodo, k1: r.dims[0] || "(não informado)", k2: "", m: r.m });
        // Campanha (utm_campaign) junto da origem/meio: separa clínicas de autônomos, WhatsApp de e-mail. Só entra o que tem campanha marcada.
        for (const r of await relatorio(f, token, prop, a, b, ["sessionSourceMedium", "sessionCampaignName"], METRICAS, 100)) {
          const camp = r.dims[1] ?? "";
          if (!camp || camp === "(not set)" || camp === "(direct)" || camp === "(organic)" || camp === "(referral)") continue;
          agg.push({ tipo: "campanha", periodo, k1: `${r.dims[0] || "(não informado)"} · ${camp}`, k2: "", m: r.m });
        }
        for (const r of await relatorio(f, token, prop, a, b, ["eventName"], ["eventCount", "totalUsers"], 100)) agg.push({ tipo: "evento", periodo, k1: r.dims[0]!, k2: "", m: { ...ZERO, eventos: r.m.sessoes, usuarios: r.m.usuarios } });
      }
      for (const r of diario) {
        const d = r.dims[0]!, data = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        run(brain.db, "insert into ga_dia (site, dia, sessoes, usuarios, novos, engajadas, views, seg, eventos) values (?, ?, ?, ?, ?, ?, ?, ?, ?) on conflict(site, dia) do update set sessoes = excluded.sessoes, usuarios = excluded.usuarios, novos = excluded.novos, engajadas = excluded.engajadas, views = excluded.views, seg = excluded.seg, eventos = excluded.eventos", s.id, data, r.m.sessoes, r.m.usuarios, r.m.novos, r.m.engajadas, r.m.views, r.m.seg, r.m.eventos);
        dias++;
      }
      run(brain.db, "delete from ga_agg where site = ?", s.id);
      for (const a of agg) run(brain.db, "insert or replace into ga_agg (site, tipo, periodo, chave, chave2, sessoes, usuarios, novos, engajadas, views, seg, eventos) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", s.id, a.tipo, a.periodo, a.k1, a.k2, a.m.sessoes, a.m.usuarios, a.m.novos, a.m.engajadas, a.m.views, a.m.seg, a.m.eventos);
    } catch (e) {
      falhas.push(`${s.rotulo}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (falhas.length === 0) { brain.setPolicy("ga_ultima_sync", hoje); brain.setPolicy("ga_ultimo_erro", null); }
  else brain.setPolicy("ga_ultimo_erro", falhas.join(" | ").slice(0, 400));
  brain.audit("sistema", "ga_sincronizou", `${dias} dias`, { falhas: falhas.length });
  brain.emit("change");
  return falhas.length ? `GA4 com problema: ${falhas.join(" | ")}` : `GA4 sincronizado (${dias} dias atualizados).`;
}

// ---------- painel ----------
export interface GaItem extends M { chave: string; anterior: { sessoes: number; usuarios: number; eventos: number }; info?: PaginaInfo }
export interface GaSite {
  id: string; rotulo: string; propriedade: string | null; ultimoDia: string | null;
  serie: ({ dia: string } & M)[]; atual: M; anterior: M;
  canais: GaItem[]; origens: GaItem[]; campanhas: GaItem[]; entradas: GaItem[]; paginas: GaItem[]; aparelhos: GaItem[]; paises: GaItem[]; eventos: GaItem[];
  recados: string[];
}
export interface GaPainel { configurado: boolean; ultimoErro: string | null; ultimaSync: string | null; sites: GaSite[] }

const taxa = (a: number, b: number) => (b ? a / b : 0);
export function recadosGa(s: { atual: M; anterior: M; canais: GaItem[]; entradas: GaItem[]; eventos: GaItem[] }): string[] {
  const out: string[] = [];
  const { atual: a, anterior: p } = s;
  if (!a.sessoes) return ["O GA4 está ligado, mas ainda não registrou visitas neste período. Confira se a tag está publicada e espere 24 a 48 horas."];
  const eng = taxa(a.engajadas, a.sessoes);
  out.push(`${a.sessoes} visitas e ${a.usuarios} pessoas em 28 dias${p.sessoes ? ` (${p.sessoes} antes)` : ""}. ${Math.round(eng * 100)}% das visitas foram engajadas (mais de 10 segundos, 2 páginas ou um evento-chave).`);
  const direto = s.canais.find((c) => /direct|unassigned/i.test(c.chave));
  if (direto && taxa(direto.sessoes, a.sessoes) > 0.5) out.push(`${Math.round(taxa(direto.sessoes, a.sessoes) * 100)}% das visitas vêm sem origem identificada (direto ou não atribuído). Link de bio, WhatsApp e e-mail precisam de UTM para você saber o que traz gente.`);
  const org = s.canais.find((c) => /organic search/i.test(c.chave));
  if (org) out.push(`Busca orgânica trouxe ${org.sessoes} visitas (${Math.round(taxa(org.sessoes, a.sessoes) * 100)}%).`);
  if (!a.eventos && !s.eventos.some((e) => /sign_up|generate_lead|cadastro|agendar|demo|whatsapp/i.test(e.chave))) out.push("Nenhum evento-chave registrado. Sem ele não dá para medir cadastro ou pedido de demo: marque no GA4 (Administrador > Eventos) o evento que representa a conversão e eu passo a mostrar o funil.");
  const ruins = s.entradas.filter((e) => e.sessoes >= 10 && taxa(e.engajadas, e.sessoes) < 0.35).sort((x, y) => y.sessoes - x.sessoes).slice(0, 2);
  for (const r of ruins) out.push(`${r.chave} recebe ${r.sessoes} visitas, mas só ${Math.round(taxa(r.engajadas, r.sessoes) * 100)}% engajam: é a página para revisar primeiro.`);
  return out;
}

export function gaPainel(brain: Brain, env: Env): GaPainel {
  const props = propriedadesGa(brain);
  const sites = sitesGsc(brain).map((s): GaSite => {
    const serie = rows<{ dia: string } & M>(brain.db, "select dia, sessoes, usuarios, novos, engajadas, views, seg, eventos from ga_dia where site = ? order by dia desc limit 90", s.id).reverse();
    const agg = rows<{ tipo: string; periodo: string; chave: string; sessoes: number; usuarios: number; novos: number; engajadas: number; views: number; seg: number; eventos: number }>(brain.db, "select tipo, periodo, chave, sessoes, usuarios, novos, engajadas, views, seg, eventos from ga_agg where site = ?", s.id);
    const total = (periodo: string): M => { const t = agg.find((a) => a.tipo === "total" && a.periodo === periodo); return t ? { sessoes: t.sessoes, usuarios: t.usuarios, novos: t.novos, engajadas: t.engajadas, views: t.views, seg: t.seg, eventos: t.eventos } : { ...ZERO }; };
    const lista = (tipo: string, limite: number, info = false): GaItem[] => {
      const ant = new Map(agg.filter((a) => a.tipo === tipo && a.periodo === "anterior").map((a) => [a.chave, a]));
      return agg.filter((a) => a.tipo === tipo && a.periodo === "atual").sort((x, y) => (tipo === "evento" ? y.eventos - x.eventos : y.sessoes - x.sessoes || y.views - x.views)).slice(0, limite).map((a) => {
        const b = ant.get(a.chave);
        return { chave: a.chave, sessoes: a.sessoes, usuarios: a.usuarios, novos: a.novos, engajadas: a.engajadas, views: a.views, seg: a.seg, eventos: a.eventos, anterior: { sessoes: b?.sessoes ?? 0, usuarios: b?.usuarios ?? 0, eventos: b?.eventos ?? 0 }, ...(info ? { info: classificarPagina(a.chave) } : {}) };
      });
    };
    const base = { atual: total("atual"), anterior: total("anterior"), canais: lista("canal", 12), entradas: lista("entrada", 300, true), eventos: lista("evento", 30) };
    return { id: s.id, rotulo: s.rotulo, propriedade: props[s.id] ?? null, ultimoDia: serie.at(-1)?.dia ?? null, serie, ...base, origens: lista("origem", 30), campanhas: lista("campanha", 30), paginas: lista("pagina", 300, true), aparelhos: lista("aparelho", 6), paises: lista("pais", 12), recados: serie.length ? recadosGa(base) : [] };
  });
  return { configurado: !!lerChave(env) && Object.keys(props).length > 0, ultimoErro: brain.policy<string | null>("ga_ultimo_erro", null), ultimaSync: brain.policy<string | null>("ga_ultima_sync", null), sites };
}
