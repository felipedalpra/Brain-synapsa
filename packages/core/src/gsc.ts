// Google Search Console: o Brain puxa, uma vez por dia, cliques, impressões, CTR e posição das propriedades da Synapsa
// e guarda o histórico (o Search Console só mostra 16 meses). Só LEITURA. Acesso por conta de serviço (sem login que expira).
import { BrainError, brtDay, type Brain } from "./brain";
import { row, rows, run } from "./sql";

type Env = Record<string, string | undefined>;
const DAY = 86_400_000;
const ESCOPO = "https://www.googleapis.com/auth/webmasters.readonly";

export interface SiteGsc { id: string; rotulo: string; siteUrl: string; /** só páginas que começam assim (ex.: o diretório dentro de synapsa.chat) */ pagina?: string }

/** Padrão: as duas propriedades que a Synapsa acompanha. Troque pela política `gsc_sites` se o nome no Search Console for outro. */
export const SITES_PADRAO: SiteGsc[] = [
  { id: "site", rotulo: "synapsa.com.br", siteUrl: "sc-domain:synapsa.com.br" },
  { id: "diretorio", rotulo: "Diretório de psicólogos", siteUrl: "sc-domain:synapsa.chat", pagina: "https://synapsa.chat/psicologos" },
];
export const sitesGsc = (brain: Brain): SiteGsc[] => {
  const p = brain.policy<SiteGsc[] | null>("gsc_sites", null);
  return Array.isArray(p) && p.length ? p : SITES_PADRAO;
};

interface Chave { client_email: string; private_key: string; token_uri?: string }
export function lerChave(env: Env): Chave | null {
  const raw = env.GSC_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Chave;
    return j.client_email && j.private_key ? j : null;
  } catch {
    return null;
  }
}

const b64url = (b: ArrayBuffer | Uint8Array | string) => {
  const u = typeof b === "string" ? new TextEncoder().encode(b) : b instanceof Uint8Array ? b : new Uint8Array(b);
  let s = "";
  for (const x of u) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

let cache: { token: string; ate: number } | null = null;
export async function tokenGoogle(chave: Chave, agora: number, f: typeof fetch = fetch): Promise<string> {
  if (cache && cache.ate > agora + 60_000) return cache.token;
  const iat = Math.floor(agora / 1000);
  const aud = chave.token_uri ?? "https://oauth2.googleapis.com/token";
  const corpo = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({ iss: chave.client_email, scope: ESCOPO, aud, iat, exp: iat + 3600 }))}`;
  const pem = chave.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const k = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", k, new TextEncoder().encode(corpo));
  const r = await f(aud, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${corpo}.${b64url(sig)}` }) });
  const j = (await r.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!r.ok || !j.access_token) throw new BrainError("integration", `Google recusou a chave da conta de serviço: ${j.error_description ?? r.status}`);
  cache = { token: j.access_token, ate: agora + (j.expires_in ?? 3600) * 1000 };
  return j.access_token;
}

interface Linha { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number }
async function consultar(token: string, site: SiteGsc, body: Record<string, unknown>, f: typeof fetch): Promise<Linha[]> {
  const filtro = site.pagina ? { dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: site.pagina }] }] } : {};
  const r = await f(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/searchAnalytics/query`, {
    method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ ...body, ...filtro, dataState: "final" }),
  });
  if (!r.ok) {
    const e = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new BrainError("integration", r.status === 403 ? `Sem acesso a ${site.siteUrl}: adicione o e-mail da conta de serviço como usuário dessa propriedade no Search Console.` : `Search Console (${site.siteUrl}): ${e.error?.message ?? r.status}`);
  }
  return ((await r.json()) as { rows?: Linha[] }).rows ?? [];
}

const dia = (ms: number) => brtDay(ms);

export async function sincronizarGsc(brain: Brain, env: Env, f: typeof fetch = fetch, opt: { forcar?: boolean } = {}): Promise<string> {
  const chave = lerChave(env);
  if (!chave) return "Search Console não configurado (falta o segredo GSC_SERVICE_ACCOUNT).";
  const agora = brain.clock();
  const hoje = dia(agora);
  if (!opt.forcar && brain.policy<string>("gsc_ultima_sync", "") === hoje) return "Search Console já sincronizado hoje.";
  const token = await tokenGoogle(chave, agora, f);
  const fim = dia(agora - 2 * DAY); // o Google fecha os números com ~2 dias de atraso
  const falhas: string[] = [];
  let linhas = 0;
  for (const s of sitesGsc(brain)) {
    try {
      const ult = row<{ d: string | null }>(brain.db, "select max(dia) as d from gsc_dia where site = ?", s.id)?.d;
      const ini = ult ? dia(Date.parse(`${ult}T12:00:00Z`) - 4 * DAY) : dia(agora - 90 * DAY);
      for (const r of await consultar(token, s, { startDate: ini, endDate: fim, dimensions: ["date"], rowLimit: 500 }, f)) {
        run(brain.db, "insert into gsc_dia (site, dia, clicks, impressions, ctr, position) values (?, ?, ?, ?, ?, ?) on conflict(site, dia) do update set clicks = excluded.clicks, impressions = excluded.impressions, ctr = excluded.ctr, position = excluded.position", s.id, r.keys![0], r.clicks, r.impressions, r.ctr, r.position);
        linhas++;
      }
      const ini28 = dia(Date.parse(`${fim}T12:00:00Z`) - 27 * DAY);
      run(brain.db, "delete from gsc_top where site = ?", s.id);
      for (const [tipo, dim] of [["query", "query"], ["page", "page"]] as const)
        for (const r of await consultar(token, s, { startDate: ini28, endDate: fim, dimensions: [dim], rowLimit: 100 }, f))
          run(brain.db, "insert or replace into gsc_top (site, tipo, chave, clicks, impressions, ctr, position, atualizado_em) values (?, ?, ?, ?, ?, ?, ?, ?)", s.id, tipo, r.keys![0], r.clicks, r.impressions, r.ctr, r.position, agora);
    } catch (e) {
      falhas.push(e instanceof Error ? e.message : String(e));
    }
  }
  if (falhas.length === 0) brain.setPolicy("gsc_ultima_sync", hoje);
  else brain.setPolicy("gsc_ultimo_erro", falhas.join(" | ").slice(0, 400));
  brain.audit("sistema", "gsc_sincronizou", `${linhas} dias`, { falhas: falhas.length });
  brain.emit("change");
  return falhas.length ? `Search Console com problema: ${falhas.join(" | ")}` : `Search Console sincronizado (${linhas} dias atualizados).`;
}

export interface TopView { chave: string; clicks: number; impressions: number; ctr: number; position: number }
export interface SiteGscPainel {
  id: string; rotulo: string; siteUrl: string; ultimoDia: string | null;
  serie: { dia: string; clicks: number; impressions: number }[];
  atual: { clicks: number; impressions: number; ctr: number; position: number };
  anterior: { clicks: number; impressions: number };
  queries: TopView[]; paginas: TopView[]; oportunidades: TopView[];
}
export interface GscPainel { configurado: boolean; ultimoErro: string | null; ultimaSync: string | null; sites: SiteGscPainel[]; clinicas: { clicks: number; impressions: number } | null }

/** Oportunidade = busca com muita impressão, CTR baixo e posição que ainda dá para subir (4 a 20). */
export function oportunidades(queries: TopView[]): TopView[] {
  return queries.filter((q) => q.impressions >= 30 && q.ctr < 0.03 && q.position >= 4 && q.position <= 20).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
}

export function gscPainel(brain: Brain, env: Env): GscPainel {
  const sites = sitesGsc(brain).map((s): SiteGscPainel => {
    const dias = rows<{ dia: string; clicks: number; impressions: number; ctr: number; position: number }>(brain.db, "select dia, clicks, impressions, ctr, position from gsc_dia where site = ? order by dia desc limit 56", s.id).reverse();
    const ult = dias.slice(-28), ant = dias.slice(-56, -28);
    const soma = (a: typeof dias, k: "clicks" | "impressions") => a.reduce((t, x) => t + x[k], 0);
    const imp = soma(ult, "impressions");
    const topo = (tipo: string) => rows<{ chave: string; clicks: number; impressions: number; ctr: number; position: number }>(brain.db, "select chave, clicks, impressions, ctr, position from gsc_top where site = ? and tipo = ? order by clicks desc, impressions desc limit 15", s.id, tipo);
    const todasQ = rows<TopView>(brain.db, "select chave, clicks, impressions, ctr, position from gsc_top where site = ? and tipo = 'query'", s.id);
    return {
      id: s.id, rotulo: s.rotulo, siteUrl: s.siteUrl, ultimoDia: dias.at(-1)?.dia ?? null,
      serie: dias.map((x) => ({ dia: x.dia, clicks: x.clicks, impressions: x.impressions })),
      atual: { clicks: soma(ult, "clicks"), impressions: imp, ctr: imp ? soma(ult, "clicks") / imp : 0, position: imp ? ult.reduce((t, x) => t + x.position * x.impressions, 0) / imp : 0 },
      anterior: { clicks: soma(ant, "clicks"), impressions: soma(ant, "impressions") },
      queries: topo("query"), paginas: topo("page"), oportunidades: oportunidades(todasQ),
    };
  });
  const cl = row<{ c: number | null; i: number | null }>(brain.db, "select sum(clicks) as c, sum(impressions) as i from gsc_top where site = 'site' and tipo = 'page' and chave like '%/clinicas%'");
  return {
    configurado: !!lerChave(env), ultimoErro: brain.policy<string | null>("gsc_ultimo_erro", null), ultimaSync: brain.policy<string | null>("gsc_ultima_sync", null),
    sites, clinicas: cl && cl.i != null ? { clicks: cl.c ?? 0, impressions: cl.i } : null,
  };
}
