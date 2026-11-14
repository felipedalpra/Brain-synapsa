// Google Search Console: o Brain puxa, uma vez por dia, cliques, impressões, CTR e posição das propriedades da Synapsa
// e guarda o histórico (o Search Console só mostra 16 meses). Só LEITURA. Acesso por conta de serviço (sem login que expira).
import { BrainError, brtDay, type Brain } from "./brain";
import { row, rows, run } from "./sql";
import { crmClient, type Lead } from "./crm";
import { classificarBusca, classificarPagina, cobertura, oportunidades, porCategoria, recados, ehMarca, type Categoria, type Cobertura, type Metrica, type Oportunidade, type PaginaInfo, type TopView } from "./gsc-analise";
export { oportunidades } from "./gsc-analise";

type Env = Record<string, string | undefined>;
const DAY = 86_400_000;
const ESCOPO = "https://www.googleapis.com/auth/webmasters.readonly";

export interface SiteGsc { id: string; rotulo: string; siteUrl: string; tipo?: "site" | "diretorio"; /** mapa do site, para achar perfis que o Google ainda não mostrou */ sitemap?: string; /** só páginas que começam assim (ex.: o diretório dentro de synapsa.chat) */ pagina?: string }

/** Padrão: as duas propriedades que a Synapsa acompanha (conferidas no Search Console em 14/11/2026). Troque pela política `gsc_sites` se o nome no Search Console for outro. */
export const SITES_PADRAO: SiteGsc[] = [
  { id: "site", rotulo: "synapsa.com.br", siteUrl: "sc-domain:synapsa.com.br", tipo: "site" },
  // O diretório vive em www.synapsa.chat/psicologos (lista) e /psicologo/<nome> (perfil). A home do synapsa.chat entra junto: é onde a marca é buscada.
  { id: "diretorio", rotulo: "Diretório de psicólogos (synapsa.chat)", siteUrl: "sc-domain:synapsa.chat", tipo: "diretorio", sitemap: "https://www.synapsa.chat/sitemap.xml" },
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
  const todas: Linha[] = [];
  for (let startRow = 0; startRow < 100_000; startRow += 25_000) {
    const r = await f(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/searchAnalytics/query`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ rowLimit: 25_000, ...body, ...filtro, startRow, dataState: "final" }),
    });
    if (!r.ok) {
      const e = (await r.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new BrainError("integration", r.status === 403 ? `Sem acesso a ${site.siteUrl}: adicione o e-mail da conta de serviço como usuário dessa propriedade no Search Console.` : `Search Console (${site.siteUrl}): ${e.error?.message ?? r.status}`);
    }
    const pg = ((await r.json()) as { rows?: Linha[] }).rows ?? [];
    todas.push(...pg);
    if (pg.length < 25_000 || typeof body.rowLimit === "number") break;
  }
  return todas;
}

const dia = (ms: number) => brtDay(ms);
const SEM_FILTRO_PAGINA = "";
/** Lê as URLs do mapa do site (segue índice de mapas). Melhor esforço: sem mapa, só não lista os perfis invisíveis. */
export async function lerSitemap(url: string, f: typeof fetch, nivel = 0): Promise<string[]> {
  const r = await f(url, { headers: { "user-agent": "SynapsaBrain/1.0" } });
  if (!r.ok) return [];
  const xml = await r.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));
  if (/<sitemapindex/i.test(xml) && nivel < 2) return (await Promise.all(locs.slice(0, 8).map((u) => lerSitemap(u, f, nivel + 1).catch(() => [] as string[])))).flat();
  return locs;
}

export async function sincronizarGsc(brain: Brain, env: Env, f: typeof fetch = fetch, opt: { forcar?: boolean } = {}): Promise<string> {
  const chave = lerChave(env);
  if (!chave) return "Search Console não configurado (falta o segredo GSC_SERVICE_ACCOUNT).";
  const agora = brain.clock();
  const hoje = dia(agora);
  if (!opt.forcar && brain.policy<string>("gsc_ultima_sync", "") === hoje) return "Search Console já sincronizado hoje.";
  const token = await tokenGoogle(chave, agora, f);
  const fim = dia(agora - 2 * DAY); // o Google fecha os números com ~2 dias de atraso
  const fimMs = Date.parse(`${fim}T12:00:00Z`);
  const janela = { atual: [dia(fimMs - 27 * DAY), fim], anterior: [dia(fimMs - 55 * DAY), dia(fimMs - 28 * DAY)] } as const;
  const falhas: string[] = [];
  let linhas = 0;
  for (const s of sitesGsc(brain)) {
    try {
      const ult = row<{ d: string | null }>(brain.db, "select max(dia) as d from gsc_dia where site = ?", s.id)?.d;
      const ini = ult ? dia(Date.parse(`${ult}T12:00:00Z`) - 4 * DAY) : dia(agora - 90 * DAY);
      const diario = await consultar(token, s, { startDate: ini, endDate: fim, dimensions: ["date"], rowLimit: 500 }, f);
      const ultP = row<{ d: string | null }>(brain.db, "select max(dia) as d from gsc_pagina_dia where site = ?", s.id)?.d;
      const iniP = ultP ? dia(Date.parse(`${ultP}T12:00:00Z`) - 4 * DAY) : dia(agora - 90 * DAY);
      const porPagina = await consultar(token, s, { startDate: iniP, endDate: fim, dimensions: ["date", "page"] }, f);
      // topo: 28 dias atuais e 28 anteriores, para mostrar quem subiu e quem caiu
      const agg: { tipo: string; periodo: string; k1: string; k2: string; r: Linha }[] = [];
      for (const periodo of ["atual", "anterior"] as const) {
        const [startDate, endDate] = janela[periodo];
        for (const dim of ["query", "page", "device", "country"] as const)
          for (const r of await consultar(token, s, { startDate, endDate, dimensions: [dim], rowLimit: dim === "query" || dim === "page" ? 1000 : 50 }, f)) agg.push({ tipo: dim, periodo, k1: r.keys![0]!, k2: SEM_FILTRO_PAGINA, r });
      }
      for (const r of await consultar(token, s, { startDate: janela.atual[0], endDate: janela.atual[1], dimensions: ["page", "query"], rowLimit: 5000 }, f)) agg.push({ tipo: "page_query", periodo: "atual", k1: r.keys![0]!, k2: r.keys![1]!, r });
      let perfis: string[] | null = null;
      if (s.sitemap) perfis = (await lerSitemap(s.sitemap, f).catch(() => [])).filter((u) => classificarPagina(u).tipo === "perfil");
      // tudo coletado: agora grava (se algo acima falhou, o que já estava salvo fica)
      for (const r of diario) {
        run(brain.db, "insert into gsc_dia (site, dia, clicks, impressions, ctr, position) values (?, ?, ?, ?, ?, ?) on conflict(site, dia) do update set clicks = excluded.clicks, impressions = excluded.impressions, ctr = excluded.ctr, position = excluded.position", s.id, r.keys![0]!, r.clicks, r.impressions, r.ctr, r.position);
        linhas++;
      }
      for (const r of porPagina) run(brain.db, "insert into gsc_pagina_dia (site, pagina, dia, clicks, impressions, position) values (?, ?, ?, ?, ?, ?) on conflict(site, pagina, dia) do update set clicks = excluded.clicks, impressions = excluded.impressions, position = excluded.position", s.id, r.keys![1]!, r.keys![0]!, r.clicks, r.impressions, r.position);
      run(brain.db, "delete from gsc_agg where site = ?", s.id);
      for (const a of agg) run(brain.db, "insert or replace into gsc_agg (site, tipo, periodo, chave, chave2, clicks, impressions, ctr, position) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", s.id, a.tipo, a.periodo, a.k1, a.k2, a.r.clicks, a.r.impressions, a.r.ctr, a.r.position);
      if (perfis && perfis.length) brain.setPolicy(`gsc_perfis_${s.id}`, perfis);
    } catch (e) {
      falhas.push(e instanceof Error ? e.message : String(e));
    }
  }
  if (falhas.length === 0) brain.setPolicy("gsc_ultima_sync", hoje);
  else brain.setPolicy("gsc_ultimo_erro", falhas.join(" | ").slice(0, 400));
  if (falhas.length === 0) brain.setPolicy("gsc_ultimo_erro", null);
  brain.audit("sistema", "gsc_sincronizou", `${linhas} dias`, { falhas: falhas.length });
  brain.emit("change");
  return falhas.length ? `Search Console com problema: ${falhas.join(" | ")}` : `Search Console sincronizado (${linhas} dias atualizados).`;
}

// ---------- painel ----------
export interface BuscaView extends TopView { anterior: { clicks: number; impressions: number }; categoria: string; cidade?: string; tema?: string }
export interface BuscaDaPagina { busca: string; clicks: number; impressions: number; position: number }
export interface PaginaView extends Metrica, PaginaInfo { url: string; anterior: { clicks: number; impressions: number }; serie: { dia: string; clicks: number; impressions: number }[]; buscas: BuscaDaPagina[]; status: "clique" | "visto" }
export interface Dimensao extends Metrica { chave: string }
export interface SiteGscPainel {
  id: string; rotulo: string; siteUrl: string; tipo: "site" | "diretorio"; ultimoDia: string | null;
  serie: { dia: string; clicks: number; impressions: number; position: number }[];
  atual: Metrica; anterior: Metrica; marca: Metrica; naoMarca: Metrica;
  queries: BuscaView[]; paginas: PaginaView[]; oportunidades: Oportunidade[]; categorias: Categoria[];
  cobertura: { cidades: Cobertura[]; temas: Cobertura[] };
  dispositivos: Dimensao[]; paises: Dimensao[]; recados: string[];
  /** só no diretório: perfis de psicólogos, incluindo os que o Google ainda não mostrou (pelo mapa do site) */
  perfis: { total: number; esperados: number | null; comImpressao: number; comClique: number; semImpressao: { url: string; nome: string }[] } | null;
}
export interface FunilSite { periodo: string; cliquesGoogle: number; leads: number; leadsGoogle: number; clientes: number }
export interface GscPainel { configurado: boolean; ultimoErro: string | null; ultimaSync: string | null; sites: SiteGscPainel[]; clinicas: { clicks: number; impressions: number } | null; funil: FunilSite | null }

type AggRow = { tipo: string; periodo: string; chave: string; chave2: string; clicks: number; impressions: number; ctr: number; position: number };
const soma = (a: Metrica[]): Metrica => {
  const clicks = a.reduce((t, x) => t + x.clicks, 0), impressions = a.reduce((t, x) => t + x.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? a.reduce((t, x) => t + x.position * x.impressions, 0) / impressions : 0 };
};

export function gscPainel(brain: Brain, env: Env): GscPainel {
  const sites = sitesGsc(brain).map((s): SiteGscPainel => {
    const tipoSite = s.tipo ?? (s.id === "diretorio" ? "diretorio" : "site");
    const dias = rows<{ dia: string; clicks: number; impressions: number; ctr: number; position: number }>(brain.db, "select dia, clicks, impressions, ctr, position from gsc_dia where site = ? order by dia desc limit 90", s.id).reverse();
    const ult = dias.slice(-28), ant = dias.slice(-56, -28);
    const agg = rows<AggRow>(brain.db, "select tipo, periodo, chave, chave2, clicks, impressions, ctr, position from gsc_agg where site = ?", s.id);
    const de = (tipo: string, periodo: string) => agg.filter((a) => a.tipo === tipo && a.periodo === periodo);
    const antQ = new Map(de("query", "anterior").map((a) => [a.chave, a]));
    const antP = new Map(de("page", "anterior").map((a) => [a.chave, a]));
    const qAtual: TopView[] = de("query", "atual").map((a) => ({ chave: a.chave, clicks: a.clicks, impressions: a.impressions, ctr: a.ctr, position: a.position }));
    const pq = de("page_query", "atual");
    const paginaDaBusca = new Map<string, string>();
    for (const a of [...pq].sort((x, y) => y.impressions - x.impressions)) if (!paginaDaBusca.has(a.chave2)) paginaDaBusca.set(a.chave2, a.chave);
    const queries: BuscaView[] = [...qAtual].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 300).map((q) => {
      const i = classificarBusca(q.chave);
      const a = antQ.get(q.chave);
      return { ...q, anterior: { clicks: a?.clicks ?? 0, impressions: a?.impressions ?? 0 }, categoria: i.categoria, cidade: i.cidade, tema: i.tema };
    });
    const marcaQ = qAtual.filter((q) => ehMarca(q.chave)), naoQ = qAtual.filter((q) => !ehMarca(q.chave));
    const marca = soma(marcaQ), naoMarca = soma(naoQ);
    const categorias = porCategoria(qAtual);
    const cob = cobertura(qAtual);
    const ops = oportunidades(qAtual, paginaDaBusca);

    // páginas, com mini-série dos 28 dias e as buscas que levam até cada uma
    const serieP = new Map<string, Map<string, { clicks: number; impressions: number }>>();
    const iniSerie = dias.length ? dia(Date.parse(`${dias[dias.length - 1]!.dia}T12:00:00Z`) - 27 * DAY) : "0000-00-00";
    for (const r of rows<{ pagina: string; dia: string; clicks: number; impressions: number }>(brain.db, "select pagina, dia, clicks, impressions from gsc_pagina_dia where site = ? and dia >= ?", s.id, iniSerie)) {
      const m = serieP.get(r.pagina) ?? new Map();
      m.set(r.dia, { clicks: r.clicks, impressions: r.impressions });
      serieP.set(r.pagina, m);
    }
    const diasJanela = dias.length ? Array.from({ length: 28 }, (_, i) => dia(Date.parse(`${iniSerie}T12:00:00Z`) + i * DAY)) : [];
    const buscasPorPagina = new Map<string, BuscaDaPagina[]>();
    for (const a of pq) buscasPorPagina.set(a.chave, [...(buscasPorPagina.get(a.chave) ?? []), { busca: a.chave2, clicks: a.clicks, impressions: a.impressions, position: a.position }]);
    const paginas: PaginaView[] = de("page", "atual").sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 400).map((a) => {
      const info = classificarPagina(a.chave);
      const m = serieP.get(a.chave);
      const p = antP.get(a.chave);
      return {
        url: a.chave, ...info, clicks: a.clicks, impressions: a.impressions, ctr: a.ctr, position: a.position, anterior: { clicks: p?.clicks ?? 0, impressions: p?.impressions ?? 0 },
        serie: diasJanela.map((d) => ({ dia: d, ...(m?.get(d) ?? { clicks: 0, impressions: 0 }) })),
        buscas: (buscasPorPagina.get(a.chave) ?? []).sort((x, y) => y.impressions - x.impressions).slice(0, 8),
        status: a.clicks > 0 ? "clique" : "visto",
      };
    });

    let perfis: SiteGscPainel["perfis"] = null;
    if (tipoSite === "diretorio") {
      const vistos = paginas.filter((p) => p.tipo === "perfil");
      const mapa = brain.policy<string[] | null>(`gsc_perfis_${s.id}`, null);
      const caminhosVistos = new Set(vistos.map((p) => p.caminho));
      const sem = (mapa ?? []).map((u) => classificarPagina(u)).filter((i) => !caminhosVistos.has(i.caminho));
      const unicos = [...new Map(sem.map((i) => [i.caminho, i])).values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
      perfis = { total: vistos.length + (mapa ? unicos.length : 0), esperados: mapa ? new Set(mapa.map((u) => classificarPagina(u).caminho)).size : null, comImpressao: vistos.length, comClique: vistos.filter((p) => p.clicks > 0).length, semImpressao: unicos.map((i) => ({ url: i.caminho, nome: i.rotulo })) };
    }
    const atual = soma(ult.map((x) => ({ ...x })));
    const base: SiteGscPainel = {
      id: s.id, rotulo: s.rotulo, siteUrl: s.siteUrl, tipo: tipoSite, ultimoDia: dias.at(-1)?.dia ?? null,
      serie: dias.map((x) => ({ dia: x.dia, clicks: x.clicks, impressions: x.impressions, position: x.position })),
      atual, anterior: soma(ant.map((x) => ({ ...x }))), marca, naoMarca, queries, paginas, oportunidades: ops, categorias, cobertura: cob,
      dispositivos: de("device", "atual").map((a) => ({ chave: a.chave, clicks: a.clicks, impressions: a.impressions, ctr: a.ctr, position: a.position })).sort((a, b) => b.impressions - a.impressions),
      paises: de("country", "atual").map((a) => ({ chave: a.chave, clicks: a.clicks, impressions: a.impressions, ctr: a.ctr, position: a.position })).sort((a, b) => b.impressions - a.impressions).slice(0, 12),
      recados: [], perfis,
    };
    base.recados = recados({ rotuloSite: s.rotulo, tipoSite, atual, marca, naoMarca, categorias, ops, cobertura: cob, perfis: perfis ? { total: perfis.total, esperados: perfis.esperados, comImpressao: perfis.comImpressao, comClique: perfis.comClique, semImpressao: [] as never[] } as never : undefined });
    return base;
  });
  const cl = row<{ c: number | null; i: number | null }>(brain.db, "select sum(clicks) as c, sum(impressions) as i from gsc_agg where site = 'site' and tipo = 'page' and periodo = 'atual' and chave like '%/clinicas%'");
  return {
    configurado: !!lerChave(env), ultimoErro: brain.policy<string | null>("gsc_ultimo_erro", null), ultimaSync: brain.policy<string | null>("gsc_ultima_sync", null),
    sites, clinicas: cl && cl.i != null ? { clicks: cl.c ?? 0, impressions: cl.i } : null, funil: null,
  };
}

/** Do clique ao cliente: cliques do Google no site contra leads e clientes do CRM no mesmo período. É correlação, não atribuição exata. */
export async function gscPainelCompleto(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<GscPainel> {
  const p = gscPainel(brain, env);
  const site = p.sites.find((s) => s.tipo === "site");
  const c = crmClient(env, f);
  if (!site || !c || !site.ultimoDia) return p;
  try {
    const fim = Date.parse(`${site.ultimoDia}T23:59:59-03:00`), ini = fim - 28 * DAY;
    const leads = (await c.all<Lead>("/leads", {}, 5)).data.filter((l) => { const t = Date.parse(String(l.created_at)); return t >= ini && t <= fim; });
    p.funil = {
      periodo: `${dia(ini)} a ${site.ultimoDia}`, cliquesGoogle: site.atual.clicks, leads: leads.length,
      leadsGoogle: leads.filter((l) => ["google", "landing_page"].includes(String(l.origin))).length,
      clientes: leads.filter((l) => l.status === "cliente_ativo").length,
    };
  } catch { /* o CRM fora do ar não derruba o painel de SEO */ }
  return p;
}
