// Instinct (agente de WhatsApp do Felipe): ele acha os leads, aborda e conversa. O Brain NÃO manda nele.
// O Instinct só preenche uma planilha do Google com o placar; o Brain lê (somente leitura dos dados) e mostra o funil.
import { BrainError, brtDay, type Brain } from "./brain";
import { row, rows, run } from "./sql";
import { lerChave, tokenGoogle } from "./gsc";

type Env = Record<string, string | undefined>;
const ESCOPO_LER = "https://www.googleapis.com/auth/spreadsheets.readonly";
const ESCOPO_ESCREVER = "https://www.googleapis.com/auth/spreadsheets";
export const PLANILHA_PADRAO = "1qS7vSVuU-5mLeo9E5hqfvIipZ_T3N1X0D0EOXFEKIeo";
export const COLUNAS_DIA = ["Data", "Tipo", "Abordados", "Responderam", "Reuniões marcadas", "Viraram conta gratuita", "Viraram assinante"];
export const COLUNAS_LEADS = ["Nome", "Tipo", "Cidade", "WhatsApp", "Primeira abordagem", "Status", "Atualizado em"];
export const STATUS = ["abordado", "respondeu", "reunião", "conta gratuita", "assinante", "sem interesse"] as const;

export const planilhaId = (brain: Brain): string => {
  const p = brain.policy<{ id?: string }>("instinct_planilha", {}).id;
  return typeof p === "string" && p ? p : PLANILHA_PADRAO;
};
/** Aceita o link inteiro da planilha ou só o id. */
export const extrairId = (txt: string): string | null => /\/d\/([\w-]{20,})/.exec(txt)?.[1] ?? (/^[\w-]{20,}$/.test(txt.trim()) ? txt.trim() : null);

const n = (v: unknown): number => { const x = Number(String(v ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "")); return Number.isFinite(x) ? x : 0; };
export function dataIso(v: unknown): string | null {
  const s = String(v ?? "").trim();
  let m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/.exec(s);
  if (m) return `${m[3]!.length === 2 ? "20" + m[3] : m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}
export const tipoDe = (v: unknown): "clinica" | "influenciadora" | null => { const s = String(v ?? "").toLowerCase(); return /cl[ií]nic/.test(s) ? "clinica" : /influenc/.test(s) ? "influenciadora" : null; };
export function statusDe(v: unknown): string | null {
  const s = String(v ?? "").toLowerCase().trim();
  if (!s) return null;
  if (/assin/.test(s)) return "assinante";
  if (/conta|gratu|cadastr/.test(s)) return "conta gratuita";
  if (/reuni|demo|marcad/.test(s)) return "reuniao";
  if (/respond|retorn/.test(s)) return "respondeu";
  if (/sem interesse|recus|n[aã]o quer|descart|sair|bloque/.test(s)) return "sem interesse";
  return /abord|enviad|cont[ae]t/.test(s) ? "abordado" : "abordado";
}

export interface LinhaDia { dia: string; tipo: "clinica" | "influenciadora"; abordados: number; responderam: number; reunioes: number; contas: number; assinantes: number }
export interface LeadInstinct { chave: string; nome: string; tipo: string; cidade: string; whatsapp: string; primeira: string | null; status: string; atualizado: string | null }

/** Lê as linhas cruas das duas abas e devolve o que dá para aproveitar (ignora linha vazia ou sem data/tipo). */
export function interpretar(dia: unknown[][], leads: unknown[][]): { dias: LinhaDia[]; leads: LeadInstinct[]; ignoradas: number } {
  let ignoradas = 0;
  const dias: LinhaDia[] = [];
  for (const r of dia) {
    if (!r.some((c) => String(c ?? "").trim())) continue;
    const d = dataIso(r[0]), t = tipoDe(r[1]);
    if (!d || !t) { ignoradas++; continue; }
    dias.push({ dia: d, tipo: t, abordados: n(r[2]), responderam: n(r[3]), reunioes: n(r[4]), contas: n(r[5]), assinantes: n(r[6]) });
  }
  const vistos = new Map<string, LeadInstinct>();
  for (const r of leads) {
    if (!r.some((c) => String(c ?? "").trim())) continue;
    const nome = String(r[0] ?? "").trim(), t = tipoDe(r[1]), st = statusDe(r[5]);
    if (!nome || !t || !st) { ignoradas++; continue; }
    const whats = String(r[3] ?? "").replace(/\D/g, "").replace(/^55(\d{10,11})$/, "$1");
    const chave = whats.length >= 10 ? whats : `${t}:${nome.toLowerCase()}`;
    vistos.set(chave, { chave, nome: nome.slice(0, 120), tipo: t, cidade: String(r[2] ?? "").trim().slice(0, 60), whatsapp: whats, primeira: dataIso(r[4]), status: st, atualizado: dataIso(r[6]) });
  }
  return { dias, leads: [...vistos.values()], ignoradas };
}

async function chamar(env: Env, f: typeof fetch, escopo: string, url: string, init: RequestInit = {}): Promise<any> {
  const chave = lerChave(env);
  if (!chave) throw new BrainError("invalid", "Falta a conta de serviço do Google (GSC_SERVICE_ACCOUNT).");
  const tk = await tokenGoogle(chave, Date.now(), f, escopo);
  const r = await f(url, { ...init, headers: { authorization: `Bearer ${tk}`, "content-type": "application/json", ...(init.headers ?? {}) } });
  const j = (await r.json().catch(() => ({}))) as { error?: { message?: string; status?: string } };
  if (!r.ok) {
    if (r.status === 403 || r.status === 404) throw new BrainError("integration", `Sem acesso à planilha: compartilhe com ${chave.client_email} (editor) e ligue a API do Google Sheets no projeto da conta de serviço. ${j.error?.message ?? ""}`.trim());
    throw new BrainError("integration", `Google Sheets: ${j.error?.message ?? r.status}`);
  }
  return j;
}

/** Cria as abas "Dia" e "Leads" com cabeçalho, se ainda não existirem. */
export async function preparar(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<string> {
  const id = planilhaId(brain);
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${id}`;
  const meta = await chamar(env, f, ESCOPO_ESCREVER, `${base}?fields=sheets.properties`);
  const abas = (meta.sheets ?? []).map((s: any) => s.properties as { sheetId: number; title: string });
  const reqs: unknown[] = [];
  if (!abas.some((a) => a.title === "Dia")) {
    if (abas.length === 1 && /^(sheet1|planilha1|p[aá]gina1)$/i.test(abas[0]!.title)) reqs.push({ updateSheetProperties: { properties: { sheetId: abas[0]!.sheetId, title: "Dia", gridProperties: { frozenRowCount: 1 } }, fields: "title,gridProperties.frozenRowCount" } });
    else reqs.push({ addSheet: { properties: { title: "Dia", gridProperties: { frozenRowCount: 1 } } } });
  }
  if (!abas.some((a) => a.title === "Leads")) reqs.push({ addSheet: { properties: { title: "Leads", gridProperties: { frozenRowCount: 1 } } } });
  if (reqs.length) await chamar(env, f, ESCOPO_ESCREVER, `${base}:batchUpdate`, { method: "POST", body: JSON.stringify({ requests: reqs }) });
  await chamar(env, f, ESCOPO_ESCREVER, `${base}/values:batchUpdate`, { method: "POST", body: JSON.stringify({ valueInputOption: "RAW", data: [{ range: "Dia!A1:G1", values: [COLUNAS_DIA] }, { range: "Leads!A1:G1", values: [COLUNAS_LEADS] }] }) });
  brain.audit("sistema", "instinct_planilha_preparada", id);
  return "Abas Dia e Leads prontas.";
}

export async function sincronizar(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<string> {
  const id = planilhaId(brain);
  try {
    const j = await chamar(env, f, ESCOPO_LER, `https://sheets.googleapis.com/v4/spreadsheets/${id}/values:batchGet?ranges=${encodeURIComponent("Dia!A2:G")}&ranges=${encodeURIComponent("Leads!A2:G")}&valueRenderOption=FORMATTED_VALUE`);
    const [d, l] = (j.valueRanges ?? []) as { values?: unknown[][] }[];
    const { dias, leads, ignoradas } = interpretar(d?.values ?? [], l?.values ?? []);
    run(brain.db, "delete from instinct_dia");
    run(brain.db, "delete from instinct_leads");
    for (const x of dias) run(brain.db, "insert or replace into instinct_dia (dia, tipo, abordados, responderam, reunioes, contas, assinantes) values (?, ?, ?, ?, ?, ?, ?)", x.dia, x.tipo, x.abordados, x.responderam, x.reunioes, x.contas, x.assinantes);
    for (const x of leads) run(brain.db, "insert or replace into instinct_leads (chave, nome, tipo, cidade, whatsapp, primeira, status, atualizado) values (?, ?, ?, ?, ?, ?, ?, ?)", x.chave, x.nome, x.tipo, x.cidade, x.whatsapp, x.primeira, x.status, x.atualizado);
    brain.setPolicy("instinct_estado", { ultima: brain.clock(), erro: null, ignoradas });
    brain.emit("change");
    return `Planilha lida: ${dias.length} linha(s) de dia e ${leads.length} lead(s)${ignoradas ? `; ${ignoradas} linha(s) sem data, tipo ou status foram ignoradas` : ""}.`;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const ant = brain.policy<{ ultima?: number }>("instinct_estado", {});
    brain.setPolicy("instinct_estado", { ultima: ant.ultima ?? null, erro: msg.slice(0, 300), ignoradas: 0 });
    throw e;
  }
}

export function configurar(brain: Brain, txt: string): { planilha: string } {
  const id = extrairId(txt);
  if (!id) throw new BrainError("invalid", "Não achei o id da planilha nesse link.");
  brain.setPolicy("instinct_planilha", { id });
  brain.audit("voce", "instinct_planilha", id);
  return { planilha: id };
}

const taxa = (a: number, b: number): number | null => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
interface Soma { abordados: number; responderam: number; reunioes: number; contas: number; assinantes: number; taxaResposta: number | null; taxaReuniao: number | null; taxaConversao: number | null }
const soma = (xs: LinhaDia[]): Soma => {
  const s = { abordados: 0, responderam: 0, reunioes: 0, contas: 0, assinantes: 0 };
  for (const x of xs) { s.abordados += x.abordados; s.responderam += x.responderam; s.reunioes += x.reunioes; s.contas += x.contas; s.assinantes += x.assinantes; }
  return { ...s, taxaResposta: taxa(s.responderam, s.abordados), taxaReuniao: taxa(s.reunioes, s.abordados), taxaConversao: taxa(s.contas + s.assinantes, s.abordados) };
};

export function painel(brain: Brain, env: Env) {
  const todas = rows<LinhaDia>(brain.db, "select dia, tipo, abordados, responderam, reunioes, contas, assinantes from instinct_dia order by dia desc, tipo");
  const hoje = brtDay(brain.clock());
  const corte = brtDay(brain.clock() - 30 * 86_400_000);
  const ult30 = todas.filter((x) => x.dia > corte && x.dia <= hoje);
  const porTipo = (xs: LinhaDia[], t: string) => soma(xs.filter((x) => x.tipo === t));
  const leads = rows<LeadInstinct>(brain.db, "select chave, nome, tipo, cidade, whatsapp, primeira, status, atualizado from instinct_leads order by coalesce(atualizado, primeira) desc, nome limit 200");
  const funil: Record<string, number> = {};
  for (const l of rows<{ status: string; n: number }>(brain.db, "select status, count(*) as n from instinct_leads group by status")) funil[l.status] = l.n;
  const est = brain.policy<{ ultima?: number | null; erro?: string | null; ignoradas?: number }>("instinct_estado", {});
  const id = planilhaId(brain);
  return {
    planilha: { id, url: `https://docs.google.com/spreadsheets/d/${id}/edit`, conta: lerChave(env)?.client_email ?? null },
    ultimaLeitura: est.ultima ?? null, erro: est.erro ?? null, ignoradas: est.ignoradas ?? 0,
    ultimos30: { total: soma(ult30), clinicas: porTipo(ult30, "clinica"), influenciadoras: porTipo(ult30, "influenciadora") },
    acumulado: soma(todas),
    dias: todas.slice(0, 28),
    funil, leads,
  };
}
