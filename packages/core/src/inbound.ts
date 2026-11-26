import { utm } from "./utm";
// Respostas dos leads de prospecção. O Resend recebe em respostas@<domínio de prospecção> e avisa por webhook (email.received).
// O Brain lê, classifica, para a sequência de follow-up, encaminha pro seu Gmail e deixa um rascunho de resposta esperando o seu OK.
import type { Brain } from "./brain";
import { suppress } from "./dispatch";
import { row, rows, run } from "./sql";
import { callLlm, llmConfig, textOf } from "./llm";
import { linkWhatsapp } from "./leads-quentes";
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
  return `Olá! Obrigado por responder.\n\nVamos marcar a demonstração de 30 minutos da Synapsa para a ${nomeCurto(nome)}? Me diga o dia e o horário que ficam melhores para vocês que eu encaixo na minha agenda. Se preferirem ver antes, o site é ${utm(SITE_CLINICAS, "email", "resposta", "clinicas")}.\n\nAbraço,\nFelipe Dalpra`;
}

export type Intencao = "quer_demo" | "duvida_preco" | "duvida_produto" | "adiar" | "outro";
const ROTULO_INTENCAO: Record<Intencao, string> = { quer_demo: "quer ver a plataforma", duvida_preco: "perguntou de preço", duvida_produto: "tem dúvida sobre o produto", adiar: "pediu para falar depois", outro: "respondeu" };

const SISTEMA_RESPOSTA = `Você escreve a resposta do Felipe Dalpra, fundador da Synapsa, a um lead de prospecção que respondeu o e-mail. A Synapsa é o ecossistema de desenvolvimento profissional do psicólogo (perfil público, agenda, ficha de entrada, financeiro, evolução com dados) e, para clínicas, centraliza a operação e tira processo manual.
Regras: português, 3 a 6 linhas, tom humano e direto; responda ao que a pessoa escreveu; proponha a próxima etapa (demonstração de 15 a 30 minutos) e peça dia e horário; NÃO invente preço, desconto, prazo, funcionalidade ou número (se perguntarem preço, diga que o plano Essencial libera a plataforma inteira e que explica os valores na conversa); NÃO fale de abandono de paciente, adesão ou acompanhamento entre sessões; termine com "Abraço," e "Felipe Dalpra".
Responda APENAS com JSON: {"intencao":"quer_demo|duvida_preco|duvida_produto|adiar|outro","resposta":"texto da resposta"}`;

/** Lê o que o lead escreveu e devolve a intenção e uma resposta sob medida. Sem modelo ou com erro, cai no texto fixo. */
export async function respostaSobMedida(env: Env, nome: string, texto: string, f: typeof fetch): Promise<{ intencao: Intencao; rascunho: string }> {
  const padrao = { intencao: "outro" as Intencao, rascunho: rascunhoResposta(nome) };
  const cfg = llmConfig(env, "agent");
  if (!cfg || !texto.trim()) return padrao;
  try {
    const r = await callLlm(cfg, { system: SISTEMA_RESPOSTA, messages: [{ role: "user", content: `Lead: ${nomeCurto(nome)}\nO que ele escreveu:\n${texto.slice(0, 1200)}` }], maxTokens: 500 }, f);
    const bruto = textOf(r.content).trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const j = JSON.parse(bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1)) as { intencao?: string; resposta?: string };
    const resposta = String(j.resposta ?? "").trim().slice(0, 1200);
    if (resposta.length < 20) return padrao;
    const intencao = (j.intencao && j.intencao in ROTULO_INTENCAO ? j.intencao : "outro") as Intencao;
    return { intencao, rascunho: resposta };
  } catch {
    return padrao;
  }
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
  const { intencao, rascunho } = await respostaSobMedida(env, nome, textoNovo(text), f);
  const tel = p ? row<{ telefone: string | null }>(brain.db, "select telefone from prospects where id = ?", p.id)?.telefone ?? null : null;
  const wa = linkWhatsapp(tel, `Oi! Aqui é o Felipe, da Synapsa. Vi sua resposta ao meu e-mail e queria combinar a conversa por aqui. Qual dia e horário ficam bons para você?`);
  brain.addProposal({
    agentId: "prospeccao", kind: "resposta_lead", channel: "email", risk: "medio", impactoBrl: 79,
    title: `Responder ${nomeCurto(nome)} (${ROTULO_INTENCAO[intencao]})`,
    draft: rascunho,
    why: `${nomeCurto(nome)} respondeu o e-mail de prospecção (${ROTULO_INTENCAO[intencao]}): “${trecho.slice(0, 220).replace(/\s+/g, " ")}”. A resposta foi escrita a partir do que ele disse. Revise antes de aprovar.`,
    contactRef: de,
    payload: { envio: { tipo: "email", para: de, assunto: assunto.toLowerCase().startsWith("re:") ? assunto : `Re: ${assunto || "Synapsa"}`, remetente: "prospeccao" }, prospeccao: { prospectId: p?.id ?? null, resposta: true, intencao }, base: "legitimo_interesse_b2b" },
    dedupeKey: `resp-${id}`,
  });
  await encaminhar(env, `[Resposta] ${nome}: ${ROTULO_INTENCAO[intencao]}`, de, `${nome} respondeu (${ROTULO_INTENCAO[intencao]}):\n\n${trecho}\n\nResposta sugerida (já está em Aprovações na Central, é só revisar e aprovar):\n\n${rascunho}${wa ? `\n\nOu chame no WhatsApp, a mensagem já vai pronta:\n${wa}` : ""}`, f);
  brain.audit("sistema", "prospeccao_respondeu_por_email", de, { prospectId: p?.id });
  brain.emit("change");
  return { tipo, prospectId: p?.id };
}
