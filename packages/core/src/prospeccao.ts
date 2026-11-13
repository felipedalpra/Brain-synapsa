// Prospecção de clínicas: descobre no Google Maps (Apify), lê o site de cada uma, pontua e só então vai ao CRM.
// O Brain só PESQUISA e ORGANIZA. Nada é enviado a ninguém daqui; ir ao CRM exige o clique do Felipe.
import { painelWhatsapp } from "./prospeccao-whatsapp";
import type { ProspectStatus, ProspectView, ProspeccaoPainel, ProspectRunView } from "@brain/shared";
import { BrainError, type Brain } from "./brain";
import { crmClient, CrmError, type NewLead } from "./crm";
import { emailsResumo, gerarRascunhos, rascunhosPendentes } from "./prospeccao-email";
import { row, rows, run, type Db } from "./sql";

type Env = Record<string, string | undefined>;
const API = "https://api.apify.com/v2";
export const ATORES = { maps: "compass~crawler-google-places", site: "apify~website-content-crawler" };
export const REGIOES = ["São Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Campinas, SP", "Niterói, RJ", "Santo André, SP", "Uberlândia, MG", "Juiz de Fora, MG"];

const r2 = (n: number) => Math.round(n * 100) / 100;
const mes = (now: number) => new Date(now - 3 * 3_600_000).toISOString().slice(0, 7);

// ---- Orçamento ------------------------------------------------------------

export function orcamento(brain: Brain): { mesUsd: number; gastoUsd: number; porRodadaUsd: number } {
  const mesUsd = Number(brain.policy("apify_budget_usd_month", 5));
  const porRodadaUsd = Number(brain.policy("apify_budget_usd_run", 1.5));
  const ini = Date.parse(`${mes(brain.clock())}-01T00:00:00-03:00`);
  const g = row<{ s: number | null }>(brain.db, "select sum(custo_usd) as s from prospect_runs where criado_em >= ?", ini)?.s ?? 0;
  return { mesUsd, gastoUsd: r2(g), porRodadaUsd };
}

function tetoDaRodada(brain: Brain): number {
  const o = orcamento(brain);
  // Rodadas em andamento contam pelo teto delas, não pelo custo ainda zerado.
  const emAndamento = row<{ n: number }>(brain.db, "select count(*) as n from prospect_runs where status = 'rodando'")?.n ?? 0;
  const livre = o.mesUsd - o.gastoUsd - emAndamento * o.porRodadaUsd;
  if (livre <= 0.05) throw new BrainError("invalid", `Orçamento do Apify do mês esgotado (US$ ${o.mesUsd}). Aumente a política apify_budget_usd_month se quiser continuar.`);
  return r2(Math.min(o.porRodadaUsd, livre));
}

// ---- Cliente Apify --------------------------------------------------------

async function apify<T>(env: Env, f: typeof fetch, path: string, init: RequestInit = {}): Promise<T> {
  const token = env.APIFY_TOKEN?.trim();
  if (!token) throw new BrainError("invalid", "Falta o APIFY_TOKEN nos secrets do Brain.");
  const res = await f(`${API}${path}`, { ...init, headers: { ...(init.headers as Record<string, string>), authorization: `Bearer ${token}`, "content-type": "application/json" } });
  const raw = (await res.json().catch(() => ({}))) as unknown;
  if (res.ok && Array.isArray(raw)) return raw as T; // itens do dataset vêm como lista pura, sem {data}
  const body = raw as { data?: unknown; error?: { message?: string; type?: string } };
  if (!res.ok) {
    const m = body.error?.message ?? "erro";
    throw new BrainError("invalid", res.status === 401 ? "O Apify recusou o token (401)." : res.status === 402 ? "Sem crédito no Apify (402)." : `Apify respondeu ${res.status}: ${m.slice(0, 160)}`);
  }
  return body.data as T;
}

interface RunInfo { id: string; status: string; defaultDatasetId?: string; usageTotalUsd?: number; statusMessage?: string }

async function iniciar(env: Env, f: typeof fetch, ator: string, input: unknown, tetoUsd: number): Promise<RunInfo> {
  return apify<RunInfo>(env, f, `/acts/${ator}/runs?maxTotalChargeUsd=${tetoUsd}&timeout=600`, { method: "POST", body: JSON.stringify(input) });
}
const statusDe = (env: Env, f: typeof fetch, id: string) => apify<RunInfo>(env, f, `/actor-runs/${encodeURIComponent(id)}`);
const itens = async (env: Env, f: typeof fetch, ds: string, limit = 500): Promise<Record<string, unknown>[]> => {
  const r = await apify<unknown>(env, f, `/datasets/${encodeURIComponent(ds)}/items?clean=true&limit=${limit}&format=json`);
  return Array.isArray(r) ? (r as Record<string, unknown>[]) : [];
};

// ---- Descoberta -----------------------------------------------------------

export interface DescobertaIn { regiao: string; busca?: string; maximo?: number }

export async function iniciarDescoberta(brain: Brain, env: Env, d: DescobertaIn, f: typeof fetch = fetch): Promise<string> {
  const regiao = (d.regiao ?? "").trim();
  if (regiao.length < 3 || regiao.length > 80) throw new BrainError("invalid", "Diga a cidade, ex.: São Paulo, SP.");
  const busca = (d.busca ?? "").trim().slice(0, 80);
  const termos = busca ? [busca] : ["clínica de psicologia", "centro de psicologia", "clínica multidisciplinar psicologia"];
  const maximo = Math.min(Math.max(Math.floor(d.maximo ?? 20), 1), 60);
  const teto = tetoDaRodada(brain);
  const r = await iniciar(env, f, ATORES.maps, { searchStringsArray: termos, locationQuery: `${regiao}, Brasil`, maxCrawledPlacesPerSearch: maximo, language: "pt-BR", skipClosedPlaces: true, scrapePlaceDetailPage: false }, teto);
  run(brain.db, "insert into prospect_runs (tipo, apify_run_id, dataset_id, status, consulta, criado_em) values ('descoberta', ?, ?, 'rodando', ?, ?)", r.id, r.defaultDatasetId ?? null, `${termos.length > 1 ? "clínicas de psicologia" : busca} · ${regiao}`, brain.clock());
  brain.audit("voce", "prospeccao_descoberta", regiao);
  brain.emit("prospeccao");
  return `Busca iniciada: ${termos[0]} em ${regiao} (até ${maximo} lugares, teto US$ ${teto}).`;
}

const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const host = (u: string | null): string | null => {
  try { return u ? new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, "") : null; } catch { return null; }
};

/** Nomes que não são clínica-alvo: clube, serviço público, hospital, escola, consultório individual. */
const NAO_CLINICA = /\b(clube|caps\b|capsi|ubs\b|hospital|escola|col[eé]gio|universidade|faculdade|prefeitura|igreja|academia|cemp|detran|psic[oó]log[oa]\s+[A-ZÀ-Ú]|psiconew|consult[oó]rio\s+(de\s+)?psicologia\s+[A-ZÀ-Ú][a-zà-ú]+\s+[A-ZÀ-Ú])/i;
export const ehAlvo = (nome: string): boolean => !NAO_CLINICA.test(nome);

/** Sites que não são o site da clínica (rede social, agenda de terceiros). Não adianta ler. */
const SITE_RUIM = /(instagram|facebook|linktr\.ee|wa\.me|whatsapp|doctoralia|google|youtube|tiktok|linkedin)/i;

export function ingerirDescoberta(brain: Brain, itens_: Record<string, unknown>[], consulta: string): { novos: number; repetidos: number } {
  let novos = 0, repetidos = 0;
  const agora = brain.clock();
  for (const it of itens_) {
    const placeId = s(it.placeId);
    const nome = s(it.title);
    if (!placeId || !nome) continue;
    if (row(brain.db, "select id from prospects where place_id = ?", placeId)) { repetidos++; continue; }
    const site = s(it.website);
    const ig = site && /instagram\.com/i.test(site) ? site : null;
    run(brain.db, "insert into prospects (place_id, nome, cidade, uf, endereco, telefone, site, instagram, avaliacoes, nota_google, status, consulta, criado_em, atualizado_em) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      placeId, nome.slice(0, 200), s(it.city), s(it.state)?.slice(0, 40) ?? null, s(it.address)?.slice(0, 300) ?? null, s(it.phone) ?? s(it.phoneUnformatted), site && !SITE_RUIM.test(site) ? site : null, ig, n(it.reviewsCount), n(it.totalScore), ehAlvo(nome) ? "novo" : "descartado", consulta, agora, agora);
    novos++;
  }
  return { novos, repetidos };
}

// ---- Enriquecimento (site) ------------------------------------------------

export async function iniciarEnriquecimento(brain: Brain, env: Env, ids: number[] | null, f: typeof fetch = fetch): Promise<string> {
  const alvo = rows<{ id: number; site: string }>(brain.db, "select id, site from prospects where site is not null and status = 'novo' and crp_count is null order by id limit 40").filter((p) => !ids || ids.includes(p.id));
  if (!alvo.length) throw new BrainError("invalid", "Nenhuma clínica nova com site para ler.");
  const teto = tetoDaRodada(brain);
  const r = await iniciar(env, f, ATORES.site, {
    startUrls: alvo.map((p) => ({ url: p.site.startsWith("http") ? p.site : `https://${p.site}` })),
    maxCrawlDepth: 1, maxCrawlPages: alvo.length * 5, crawlerType: "cheerio", removeCookieWarnings: true,
  }, teto);
  run(brain.db, "insert into prospect_runs (tipo, apify_run_id, dataset_id, status, consulta, prospect_ids, criado_em) values ('enriquecimento', ?, ?, 'rodando', ?, ?, ?)", r.id, r.defaultDatasetId ?? null, `${alvo.length} sites`, JSON.stringify(alvo.map((p) => p.id)), brain.clock());
  for (const p of alvo) run(brain.db, "update prospects set status = 'enriquecendo' where id = ?", p.id);
  brain.audit("voce", "prospeccao_enriquecer", String(alvo.length));
  brain.emit("prospeccao");
  return `Lendo ${alvo.length} sites (teto US$ ${teto}).`;
}

const GENERICO = /^(contato|atendimento|recepcao|recepção|clinica|clínica|comercial|secretaria|agendamento|agenda|sac|adm|administrativo|psicologia|ola|olá|oi|faleconosco)/i;
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const LIXO = /\.(png|jpe?g|gif|webp|svg|css|js)$|wixpress|sentry|example\.|seudominio|email\.com$|@2x/i;

/** Lê o texto das páginas de um site e tira sinais. Só dados públicos da própria clínica. */
export function lerSinais(paginas: string[], siteHost: string | null): { crp: number; emails: string[]; instagram: string | null; whatsapp: boolean; agenda: boolean } {
  const texto = paginas.join("\n");
  const crps = new Set([...texto.matchAll(/CRP[\s:.-]*(\d{2})\s*[\/-]\s*(\d{3,6})/gi)].map((m) => `${m[1]}/${m[2]}`));
  const emails = [...new Set((texto.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase().replace(/[.,;)]+$/, "")).filter((e) => !LIXO.test(e)))];
  const doDominio = emails.filter((e) => siteHost && e.endsWith(`@${siteHost}`));
  const genericos = emails.filter((e) => GENERICO.test(e.split("@")[0]!));
  const ordenados = [...new Set([...doDominio.filter((e) => GENERICO.test(e.split("@")[0]!)), ...genericos, ...doDominio])];
  const ig = /instagram\.com\/([A-Za-z0-9._]{3,30})/i.exec(texto);
  const igOk = ig && !/^(p|reel|reels|explore|accounts|stories|tv)$/i.test(ig[1]!) ? `https://instagram.com/${ig[1]}` : null;
  return { crp: crps.size, emails: ordenados.slice(0, 3), instagram: igOk, whatsapp: /wa\.me|api\.whatsapp\.com|whatsapp/i.test(texto), agenda: /agende (sua|uma)|agendamento online|agendar online|agende online/i.test(texto) };
}

export interface Pontuacao { nota: number; status: Extract<ProspectStatus, "qualificado" | "revisar" | "descartado"> }

/** Regras fixas, sem IA. Equipe grande pesa mais: é onde adesão e retenção aparecem. */
export function pontuar(p: { crp: number | null; email: string | null; whatsapp: boolean | null; instagram: string | null; avaliacoes: number | null; notaGoogle: number | null }): Pontuacao {
  const crp = p.crp ?? 0;
  let nota = crp >= 8 ? 50 : crp >= 4 ? 35 : crp >= 2 ? 15 : crp === 1 ? 5 : 0;
  if (p.email) nota += 15;
  if (p.whatsapp) nota += 10;
  if (p.instagram) nota += 5;
  if ((p.avaliacoes ?? 0) >= 100) nota += 10;
  if ((p.notaGoogle ?? 0) >= 4.5) nota += 5;
  const status = p.crp === null ? "revisar" : crp >= 4 ? "qualificado" : crp >= 2 ? "revisar" : "descartado";
  return { nota: Math.min(100, nota), status };
}

export function ingerirEnriquecimento(brain: Brain, itens_: Record<string, unknown>[], ids: number[]): { lidos: number; semSite: number } {
  const alvo = ids.map((id) => row<{ id: number; site: string; telefone: string | null; avaliacoes: number | null; nota_google: number | null; instagram: string | null }>(brain.db, "select id, site, telefone, avaliacoes, nota_google, instagram from prospects where id = ?", id)).filter((x): x is NonNullable<typeof x> => !!x);
  const porHost = new Map<string, string[]>();
  for (const it of itens_) {
    const h = host(s(it.url));
    const t = s(it.text);
    if (!h || !t) continue;
    const base = h;
    porHost.set(base, [...(porHost.get(base) ?? []), t.slice(0, 60_000)]);
  }
  let lidos = 0, semSite = 0;
  const agora = brain.clock();
  for (const p of alvo) {
    const h = host(p.site);
    const paginas = h ? porHost.get(h) ?? [] : [];
    if (!paginas.length) {
      semSite++;
      run(brain.db, "update prospects set status = 'revisar', atualizado_em = ? where id = ?", agora, p.id);
      continue;
    }
    const sin = lerSinais(paginas, h);
    const email = sin.emails[0] ?? null;
    const instagram = p.instagram ?? sin.instagram;
    const pt = pontuar({ crp: sin.crp, email, whatsapp: sin.whatsapp, instagram, avaliacoes: p.avaliacoes, notaGoogle: p.nota_google });
    run(brain.db, "update prospects set crp_count = ?, email = ?, email_fonte = ?, instagram = ?, whatsapp_no_site = ?, agenda_online = ?, nota = ?, status = ?, atualizado_em = ? where id = ?", sin.crp, email, email ? "site" : null, instagram, sin.whatsapp ? 1 : 0, sin.agenda ? 1 : 0, pt.nota, pt.status, agora, p.id);
    lidos++;
  }
  return { lidos, semSite };
}

// ---- Avanço das rodadas ---------------------------------------------------

/** Consulta as rodadas em andamento e processa as que terminaram. Seguro de chamar várias vezes. */
export async function avancar(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<{ pendentes: number; concluidas: number }> {
  const pend = rows<{ id: number; tipo: string; apify_run_id: string; dataset_id: string | null; consulta: string | null; prospect_ids: string | null }>(brain.db, "select id, tipo, apify_run_id, dataset_id, consulta, prospect_ids from prospect_runs where status = 'rodando'");
  let concluidas = 0;
  const ok = new Set<string>();
  for (const r of pend) {
    let info: RunInfo;
    try { info = await statusDe(env, f, r.apify_run_id); } catch (e) { run(brain.db, "update prospect_runs set detalhe = ? where id = ?", e instanceof Error ? e.message.slice(0, 200) : "erro", r.id); continue; }
    if (["READY", "RUNNING", "ABORTING", "TIMING-OUT"].includes(info.status)) continue;
    const agora = brain.clock();
    const custo = r2(info.usageTotalUsd ?? 0);
    if (info.status !== "SUCCEEDED") {
      run(brain.db, "update prospect_runs set status = 'falhou', custo_usd = ?, detalhe = ?, finalizado_em = ? where id = ?", custo, `Apify: ${info.status}${info.statusMessage ? ` · ${info.statusMessage.slice(0, 120)}` : ""}`, agora, r.id);
      if (r.tipo === "enriquecimento") for (const id of JSON.parse(r.prospect_ids ?? "[]") as number[]) run(brain.db, "update prospects set status = 'novo' where id = ? and status = 'enriquecendo'", id);
      concluidas++;
      continue;
    }
    const ds = info.defaultDatasetId ?? r.dataset_id;
    let dados: Record<string, unknown>[] = [];
    try { dados = ds ? await itens(env, f, ds, r.tipo === "descoberta" ? 200 : 600) : []; } catch (e) {
      const tent = (Number(/tentativa (\d+)/.exec(String((row<{ detalhe: string | null }>(brain.db, "select detalhe from prospect_runs where id = ?", r.id))?.detalhe ?? ""))?.[1]) || 0) + 1;
      if (tent < 4) { run(brain.db, "update prospect_runs set detalhe = ? where id = ?", `tentativa ${tent}: ${e instanceof Error ? e.message.slice(0, 120) : "erro ao ler resultados"}`, r.id); continue; }
      run(brain.db, "update prospect_runs set status = 'falhou', custo_usd = ?, detalhe = ?, finalizado_em = ? where id = ?", custo, `Não consegui ler os resultados: ${e instanceof Error ? e.message.slice(0, 120) : "erro"}`, agora, r.id);
      if (r.tipo === "enriquecimento") for (const id of JSON.parse(r.prospect_ids ?? "[]") as number[]) run(brain.db, "update prospects set status = 'novo' where id = ? and status = 'enriquecendo'", id);
      concluidas++;
      continue;
    }
    const detalhe = r.tipo === "descoberta"
      ? (() => { const x = ingerirDescoberta(brain, dados, r.consulta ?? ""); return `${x.novos} novas, ${x.repetidos} já conhecidas`; })()
      : (() => { const x = ingerirEnriquecimento(brain, dados, JSON.parse(r.prospect_ids ?? "[]") as number[]); return `${x.lidos} sites lidos, ${x.semSite} sem conteúdo`; })();
    run(brain.db, "update prospect_runs set status = 'pronto', custo_usd = ?, detalhe = ?, finalizado_em = ? where id = ?", custo, detalhe, agora, r.id);
    ok.add(r.tipo);
    concluidas++;
  }
  if (concluidas) await autoCrm(brain, env, f);
  if (rotinaConfig(brain).ativo) {
    // Com a rotina ligada: terminou a busca, lê os sites; terminou a leitura, gera os rascunhos (que esperam o seu OK).
    if (ok.has("descoberta")) await iniciarEnriquecimento(brain, env, null, f).catch(() => undefined);
    if (ok.has("enriquecimento")) { try { gerarRascunhos(brain); } catch { /* não derruba o avanço */ } }
  }
  if (concluidas) brain.emit("change");
  return { pendentes: pend.length - concluidas, concluidas };
}

// ---- Registro automático no CRM ----

export interface AutoCrm { ativo: boolean; notaMin: number; limiteDia: number }
export const autoConfig = (brain: Brain): AutoCrm => {
  const c = brain.policy<Partial<AutoCrm>>("prospect_auto_crm", {});
  return { ativo: c.ativo === true, notaMin: Math.min(100, Math.max(0, Number(c.notaMin ?? 60))), limiteDia: Math.min(40, Math.max(1, Math.floor(Number(c.limiteDia ?? 10)))) };
};
export function autoSet(brain: Brain, c: Partial<AutoCrm>): AutoCrm {
  const novo = { ...autoConfig(brain), ...(c.ativo !== undefined ? { ativo: c.ativo === true } : {}), ...(c.notaMin !== undefined ? { notaMin: Number(c.notaMin) } : {}), ...(c.limiteDia !== undefined ? { limiteDia: Number(c.limiteDia) } : {}) };
  brain.setPolicy("prospect_auto_crm", novo);
  brain.audit("voce", novo.ativo ? "prospeccao_auto_on" : "prospeccao_auto_off", undefined, novo);
  return autoConfig(brain);
}
const hojeIni = (now: number) => Date.parse(`${new Date(now - 3 * 3_600_000).toISOString().slice(0, 10)}T00:00:00-03:00`);
const enviadasHoje = (brain: Brain) => row<{ n: number }>(brain.db, "select count(*) as n from audit_log where action = 'prospeccao_crm_auto' and at >= ?", hojeIni(brain.clock()))?.n ?? 0;

/** Com o interruptor ligado, manda ao CRM as qualificadas acima da nota mínima, respeitando o limite do dia. */
export async function autoCrm(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<{ criados: number }> {
  const c = autoConfig(brain);
  if (!c.ativo) return { criados: 0 };
  const sobra = c.limiteDia - enviadasHoje(brain);
  if (sobra <= 0) return { criados: 0 };
  const ids = rows<{ id: number }>(brain.db, "select id from prospects where status = 'qualificado' and nota >= ? and telefone is not null order by nota desc, id limit ?", c.notaMin, sobra).map((x) => x.id);
  if (!ids.length) return { criados: 0 };
  try {
    const r = await enviarAoCrm(brain, env, ids, f);
    if (r.criados > 0) brain.audit("sistema", "prospeccao_crm_auto", undefined, r);
    for (let i = 1; i < r.criados; i++) brain.audit("sistema", "prospeccao_crm_auto");
    return { criados: r.criados };
  } catch (e) {
    brain.audit("sistema", "prospeccao_crm_auto_erro", undefined, e instanceof Error ? e.message.slice(0, 160) : "erro");
    return { criados: 0 };
  }
}

// ---- Rotina diária (dias úteis, 10h) ----

export interface Rotina { ativo: boolean; maximo: number; indice: number; ultimaData: string | null }
export const rotinaConfig = (brain: Brain): Rotina => {
  const c = brain.policy<Partial<Rotina>>("prospect_rotina", {});
  return { ativo: c.ativo === true, maximo: Math.min(60, Math.max(5, Math.floor(Number(c.maximo ?? 20)))), indice: Math.max(0, Math.floor(Number(c.indice ?? 0))), ultimaData: typeof c.ultimaData === "string" ? c.ultimaData : null };
};
export function rotinaSet(brain: Brain, c: Partial<Pick<Rotina, "ativo" | "maximo">>): Rotina {
  const novo = { ...rotinaConfig(brain), ...(c.ativo !== undefined ? { ativo: c.ativo === true } : {}), ...(c.maximo !== undefined ? { maximo: Number(c.maximo) } : {}) };
  brain.setPolicy("prospect_rotina", novo);
  brain.audit("voce", novo.ativo ? "prospeccao_rotina_on" : "prospeccao_rotina_off", undefined, novo);
  return rotinaConfig(brain);
}
export const proximaCidade = (brain: Brain): string => REGIOES[rotinaConfig(brain).indice % REGIOES.length]!;

/** Começa a busca do dia na próxima cidade da lista. O resto (ler sites, CRM, rascunhos) encadeia em avancar(). */
export async function rodarRotina(brain: Brain, env: Env, f: typeof fetch = fetch, opts: { forcar?: boolean } = {}): Promise<string> {
  const c = rotinaConfig(brain);
  if (!c.ativo && !opts.forcar) return "Rotina desligada.";
  const hoje = new Date(brain.clock() - 3 * 3_600_000).toISOString().slice(0, 10);
  if (!opts.forcar && c.ultimaData === hoje) return "Já rodou hoje.";
  if (row<{ n: number }>(brain.db, "select count(*) as n from prospect_runs where status = 'rodando'")?.n) return "Já existe uma rodada em andamento.";
  const cidade = REGIOES[c.indice % REGIOES.length]!;
  brain.setPolicy("prospect_rotina", { ...c, indice: (c.indice + 1) % REGIOES.length, ultimaData: hoje });
  try {
    const m = await iniciarDescoberta(brain, env, { regiao: cidade, maximo: c.maximo }, f);
    brain.audit("sistema", "prospeccao_rotina", cidade);
    return m;
  } catch (e) {
    brain.audit("sistema", "prospeccao_rotina_erro", cidade, e instanceof Error ? e.message.slice(0, 160) : "erro");
    return e instanceof Error ? e.message : "Não consegui iniciar a busca.";
  }
}

// ---- CRM ------------------------------------------------------------------

const digitos = (t: string | null) => (t ?? "").replace(/\D/g, "");
const emBR = (t: string | null) => { const d = digitos(t); return d.startsWith("55") && d.length >= 12 ? d.slice(2) : d; };

/** Cria no CRM as clínicas escolhidas (clique do Felipe). Pula as que já estão lá pelo telefone. Nunca apaga nada. */
export async function enviarAoCrm(brain: Brain, env: Env, ids: number[], f: typeof fetch = fetch): Promise<{ criados: number; jaNoCrm: number; semTelefone: number }> {
  const crm = crmClient(env, f);
  if (!crm) throw new BrainError("invalid", "O CRM não está conectado.");
  if (!ids.length || ids.length > 40) throw new BrainError("invalid", "Escolha de 1 a 40 clínicas por vez.");
  const existentes = new Set<string>();
  try {
    const todos = await crm.all<Record<string, unknown>>("/leads", {}, 10);
    for (const l of todos.data) { const t = emBR(typeof l.phone === "string" ? l.phone : null); if (t.length >= 8) existentes.add(t.slice(-9)); }
  } catch (e) {
    throw new BrainError("invalid", e instanceof CrmError ? e.message : "Não consegui conferir o CRM antes de criar. Nada foi criado.");
  }
  let criados = 0, jaNoCrm = 0, semTelefone = 0;
  for (const id of ids) {
    const p = row<{ id: number; nome: string; telefone: string | null; email: string | null; instagram: string | null; site: string | null; crp_count: number | null; cidade: string | null; uf: string | null; status: string }>(brain.db, "select id, nome, telefone, email, instagram, site, crp_count, cidade, uf, status from prospects where id = ?", id);
    if (!p || p.status === "no_crm") continue;
    const tel = emBR(p.telefone);
    if (tel.length < 8) { semTelefone++; continue; }
    if (existentes.has(tel.slice(-9))) { jaNoCrm++; run(brain.db, "update prospects set status = 'no_crm', atualizado_em = ? where id = ?", brain.clock(), p.id); continue; }
    const lead: NewLead = {
      name: p.nome.slice(0, 200), lead_type: "clinica", phone: p.telefone!.slice(0, 30), origin: "outbound", classification: "frio",
      ...(p.email ? { email: p.email } : {}), ...(p.instagram ? { instagram: p.instagram } : {}),
      ...(p.crp_count ? { professionals_count: p.crp_count } : {}),
      observations: `Prospecção automática (Maps + site).${p.site ? ` Site: ${p.site}.` : ""}${p.crp_count ? ` ${p.crp_count} psicólogos com CRP no site.` : ""}`,
    };
    try {
      const r = await crm.createLead(lead, { idempotencyKey: `mega-brain-prospect-${p.id}` });
      const novoId = (r.data as { id?: string }).id ?? null;
      run(brain.db, "update prospects set status = 'no_crm', crm_lead_id = ?, atualizado_em = ? where id = ?", novoId, brain.clock(), p.id);
      criados++;
    } catch (e) {
      throw new BrainError("invalid", `${e instanceof CrmError ? e.message : "Falha ao criar no CRM"} (${criados} criados antes do erro).`);
    }
  }
  brain.audit("voce", "prospeccao_crm", undefined, { criados, jaNoCrm, semTelefone });
  brain.emit("change");
  return { criados, jaNoCrm, semTelefone };
}

export function descartar(brain: Brain, id: number, descartar_: boolean): void {
  if (!row(brain.db, "select id from prospects where id = ?", id)) throw new BrainError("not_found", "Clínica não encontrada.");
  run(brain.db, "update prospects set status = ?, atualizado_em = ? where id = ? and status != 'no_crm'", descartar_ ? "descartado" : "revisar", brain.clock(), id);
}

// ---- Painel ---------------------------------------------------------------

export function prospeccaoPainel(brain: Brain, env: Env): ProspeccaoPainel {
  const db: Db = brain.db;
  // Limpa o que já estava na lista antes do filtro existir (idempotente).
  for (const x of rows<{ id: number; nome: string }>(db, "select id, nome from prospects where status = 'novo'")) if (!ehAlvo(x.nome)) run(db, "update prospects set status = 'descartado' where id = ?", x.id);
  const ps = rows<Record<string, unknown>>(db, "select * from prospects order by nota desc, id desc limit 400");
  const contagem: Record<ProspectStatus, number> = { novo: 0, enriquecendo: 0, qualificado: 0, revisar: 0, descartado: 0, no_crm: 0 };
  for (const p of ps) contagem[p.status as ProspectStatus]++;
  const etapas = new Map<number, number>();
  for (const r of rows<{ k: string }>(db, "select pr.dedupe_key as k from proposals pr join envios e on e.proposal_id = pr.id where e.status = 'enviado' and pr.dedupe_key like 'prosp-%'")) {
    const m = /^prosp-(\d+)-e(\d)$/.exec(r.k);
    if (m) etapas.set(Number(m[1]), Math.max(etapas.get(Number(m[1])) ?? -1, Number(m[2])));
  }
  const resp = new Set(rows<{ prospect_id: number }>(db, "select prospect_id from prospect_contato where respondeu = 1 or sair = 1").map((x) => x.prospect_id));
  const rs = rows<{ id: number; tipo: string; status: string; consulta: string | null; custo_usd: number; detalhe: string | null; criado_em: number }>(db, "select id, tipo, status, consulta, custo_usd, detalhe, criado_em from prospect_runs order by id desc limit 10");
  return {
    configurado: !!env.APIFY_TOKEN?.trim(),
    orcamento: orcamento(brain),
    contagem,
    prospects: ps.map((p): ProspectView => ({
      id: p.id as number, nome: p.nome as string, cidade: (p.cidade as string) ?? null, uf: (p.uf as string) ?? null, telefone: (p.telefone as string) ?? null,
      site: (p.site as string) ?? null, instagram: (p.instagram as string) ?? null, email: (p.email as string) ?? null,
      equipe: p.crp_count === null || p.crp_count === undefined ? null : (p.crp_count as number),
      whatsappNoSite: p.whatsapp_no_site === null || p.whatsapp_no_site === undefined ? null : p.whatsapp_no_site === 1,
      agendaOnline: p.agenda_online === null || p.agenda_online === undefined ? null : p.agenda_online === 1,
      avaliacoes: (p.avaliacoes as number) ?? null, nota: p.nota as number, status: p.status as ProspectStatus, noCrm: p.status === "no_crm", emailEtapa: etapas.get(p.id as number) ?? null, respondeu: resp.has(p.id as number),
    })),
    rodadas: rs.map((r): ProspectRunView => ({ id: r.id, tipo: r.tipo as "descoberta" | "enriquecimento", status: r.status as "rodando" | "pronto" | "falhou", consulta: r.consulta, custoUsd: r.custo_usd, detalhe: r.detalhe, criadoEm: r.criado_em })),
    regioes: REGIOES,
    atores: ATORES,
    auto: { ...autoConfig(brain), hoje: enviadasHoje(brain) },
    rotina: { ativo: rotinaConfig(brain).ativo, maximo: rotinaConfig(brain).maximo, proxima: proximaCidade(brain), ultimaData: rotinaConfig(brain).ultimaData },
    emails: { pendentes: rascunhosPendentes(brain), ...emailsResumo(brain), remetenteOk: !!env.RESEND_API_KEY && !!env.RESEND_FROM_PROSPECCAO },
    whatsapp: painelWhatsapp(brain),
  };
}
