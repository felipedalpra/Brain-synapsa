// Respostas dos leads de prospecção. O Resend recebe em respostas@<domínio de prospecção> e avisa por webhook (email.received).
// O Brain lê, classifica, para a sequência de follow-up, encaminha pro seu Gmail e deixa um rascunho de resposta esperando o seu OK.
import type { Brain } from "./brain";
import { suppress } from "./dispatch";
import { row, rows, run } from "./sql";
import { marcarContato, nomeCurto, SITE_CLINICAS } from "./prospeccao-email";

type Env = Record<string, string | undefined>;
export type TipoResposta = "automatica" | "sair" | "resposta";

export interface Recebido {
  email_id?: string;
  from?: string;
  to?: string[] | string;
  subject?: string;
}

const DOMINIOS_LIVRES = new Set(["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.br", "icloud.com", "uol.com.br", "bol.com.br", "live.com", "terra.com.br"]);

/** "Nome <a@b.com>" ou "a@b.com" → "a@b.com" em minúsculas. */
export function enderecoDe(from: string | undefined): string {
  const m = /<([^>]+)>/.exec(from ?? "");
  return (m?.[1] ?? from ?? "").trim().toLowerCase();
}

/** Só o que a pessoa escreveu: corta a citação do e-mail original e a assinatura. */
export function textoNovo(texto: string): string {
  const linhas: string[] = [];
  for (const l of texto.replace(/\r/g, "").split("\n")) {
    if (/^>/.test(l) || /^(Em .{5,80}escreveu:|On .{5,80}wrote:|-{2,}\s*(Mensagem original|Original Message)|De:\s|From:\s)/i.test(l.trim())) break;
    linhas.push(l);
  }
  return linhas.join("\n").trim();
}

const AUTO_ASSUNTO = /resposta autom[aá]tica|autom[aá]tic[ao]|out of office|fora do escrit[oó]rio|auto.?reply|undeliver|delivery status|mail delivery|n[aã]o entregue/i;
const SAIR_RE = /\b(sair|remover|remova|descadastr\w*|cancelar (o )?(envio|inscri\w+)|pare de (me )?(enviar|mandar)|n[aã]o (quero|tenho interesse|desejo)|sem interesse|n[aã]o me (envie|mande))\b/i;

export function classificar(assunto: string, texto: string, headers: Record<string, string> = {}): TipoResposta {
  const auto = (headers["auto-submitted"] ?? "no").toLowerCase() !== "no" || /bulk|auto_reply|junk/i.test(headers["precedence"] ?? "") || headers["x-autoreply"] || headers["x-autorespond"];
  if (auto || AUTO_ASSUNTO.test(assunto)) return "automatica";
  const novo = `${assunto}\n${textoNovo(texto).slice(0, 400)}`;
  return SAIR_RE.test(novo) ? "sair" : "resposta";
}

/** Acha a clínica pelo e-mail exato; se não, pelo domínio (quando não é caixa pessoal tipo gmail). */
export function acharProspect(brain: Brain, de: string): { id: number; nome: string; email: string | null } | null {
  const exato = row<{ id: number; nome: string; email: string | null }>(brain.db, "select id, nome, email from prospects where lower(email) = ? order by id desc limit 1", de);
  if (exato) return exato;
  const dom = de.split("@")[1];
  if (!dom || DOMINIOS_LIVRES.has(dom)) return null;
  return rows<{ id: number; nome: string; email: string | null }>(brain.db, "select id, nome, email from prospects where lower(email) like ? order by id desc limit 2", `%@${dom}`).slice(0, 2).length === 1
    ? row<{ id: number; nome: string; email: string | null }>(brain.db, "select id, nome, email from prospects where lower(email) like ? order by id desc limit 1", `%@${dom}`)
    : null;
}

export function rascunhoResposta(nome: string): string {
  return `Olá! Obrigado por responder.\n\nVamos marcar a demonstração de 30 minutos da Synapsa para a ${nomeCurto(nome)}? Me diga o dia e o horário que ficam melhores para vocês que eu encaixo na minha agenda. Se preferirem ver antes, o site é ${SITE_CLINICAS}.\n\nAbraço,\nFelipe Dalpra`;
}

async function buscarCorpo(env: Env, id: string, f: typeof fetch): Promise<{ text: string; html: string; headers: Record<string, string> }> {
  try {
    const r = await f(`https://api.resend.com/emails/receiving/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${env.RESEND_API_KEY}` } });
    if (!r.ok) return { text: "", html: "", headers: {} };
    const j = (await r.json()) as { text?: string; html?: string; headers?: Record<string, string> | { name: string; value: string }[] };
    const h: Record<string, string> = {};
    if (Array.isArray(j.headers)) for (const x of j.headers) h[String(x.name).toLowerCase()] = String(x.value);
    else for (const [k, v] of Object.entries(j.headers ?? {})) h[k.toLowerCase()] = String(v);
    const html = j.html ?? "";
    return { text: j.text ?? html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>|<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " "), html, headers: h };
  } catch {
    return { text: "", html: "", headers: {} };
  }
}

/** Manda o aviso pro seu Gmail (RESEND_REPLY_TO), pelo remetente de prospecção. Falhar aqui nunca desfaz o registro da resposta. */
async function encaminhar(env: Env, titulo: string, de: string, corpo: string, f: typeof fetch): Promise<boolean> {
  const destino = env.RESEND_REPLY_TO;
  const from = env.RESEND_FROM_PROSPECCAO;
  if (!destino || !from || !env.RESEND_API_KEY) return false;
  try {
    const r = await f("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [destino], reply_to: de, subject: titulo.slice(0, 200), text: corpo.slice(0, 20_000) }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function tratarRecebido(brain: Brain, env: Env, d: Recebido, f: typeof fetch = fetch): Promise<{ tipo: TipoResposta | "repetido" | "interno"; prospectId?: number }> {
  const id = d.email_id ?? "";
  const de = enderecoDe(d.from);
  if (!id || !de) return { tipo: "interno" };
  if (row(brain.db, "select 1 as x from inbound_emails where email_id = ?", id)) return { tipo: "repetido" };
  const meu = [env.RESEND_FROM_PROSPECCAO, env.RESEND_FROM, env.RESEND_REPLY_TO].map(enderecoDe);
  if (meu.includes(de)) return { tipo: "interno" }; // evita laço com o próprio encaminhamento
  const assunto = String(d.subject ?? "").slice(0, 200);
  const { text, headers } = await buscarCorpo(env, id, f);
  const tipo = classificar(assunto, text, headers);
  const p = acharProspect(brain, de);
  const agora = brain.clock();
  run(brain.db, "insert into inbound_emails (email_id, de, assunto, tipo, prospect_id, at) values (?, ?, ?, ?, ?, ?)", id, de, assunto, tipo, p?.id ?? null, agora);

  if (tipo === "automatica") {
    brain.audit("sistema", "resposta_automatica_ignorada", de);
    return { tipo, prospectId: p?.id };
  }
  const trecho = textoNovo(text).slice(0, 1500) || "(sem texto; abra no Resend)";
  if (tipo === "sair") {
    if (p) marcarContato(brain, p.id, "sair");
    suppress(brain, de, "pediu para sair (respondeu o e-mail)");
    brain.audit("sistema", "prospeccao_sair_por_resposta", de, { prospectId: p?.id });
    await encaminhar(env, `[SAIR] ${p?.nome ?? de}: ${assunto}`, de, `${de} pediu para sair. Já bloqueei o endereço e parei a sequência.\n\n${trecho}`, f);
    brain.emit("change");
    return { tipo, prospectId: p?.id };
  }
  // Resposta de verdade: para os follow-ups, avisa você e deixa o rascunho de retorno para aprovar.
  if (p) marcarContato(brain, p.id, "respondeu");
  const nome = p?.nome ?? de;
  const rascunho = rascunhoResposta(nome);
  brain.addProposal({
    agentId: "prospeccao", kind: "resposta_lead", channel: "email", risk: "medio", impactoBrl: 79,
    title: `Responder ${nomeCurto(nome)}`,
    draft: rascunho,
    why: `${nomeCurto(nome)} respondeu o e-mail de prospecção: “${trecho.slice(0, 220).replace(/\s+/g, " ")}”. Rascunho para marcar a demonstração de 30 minutos. Ajuste antes de aprovar.`,
    contactRef: de,
    payload: { envio: { tipo: "email", para: de, assunto: assunto.toLowerCase().startsWith("re:") ? assunto : `Re: ${assunto || "Synapsa"}`, remetente: "prospeccao" }, prospeccao: { prospectId: p?.id ?? null, resposta: true }, base: "legitimo_interesse_b2b" },
    dedupeKey: `resp-${id}`,
  });
  await encaminhar(env, `[Resposta] ${nome}: ${assunto}`, de, `${de} respondeu:\n\n${trecho}\n\nO rascunho de retorno já está em Aprovações na Central.`, f);
  brain.audit("sistema", "prospeccao_respondeu_por_email", de, { prospectId: p?.id });
  brain.emit("change");
  return { tipo, prospectId: p?.id };
}
