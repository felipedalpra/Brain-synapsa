import { BrainError, type Brain } from "./brain";
import { row, run } from "./sql";
import { envioOf, EMAIL_RE, type Envio } from "./envio";
export { envioOf, EMAIL_RE, type Envio };

type Env = Record<string, string | undefined>;
const DAY = 86_400_000;

export function suppress(brain: Brain, email: string, reason: string): void {
  run(brain.db, "insert into email_suppression (email, reason, at) values (?, ?, ?) on conflict(email) do update set reason = excluded.reason, at = excluded.at", email.trim().toLowerCase(), reason, brain.clock());
}

/** Rodapé fixo: identifica quem manda e dá a saída. Sem isso o Brain não envia. */
export const footer = (env: Env, prospeccao = false) =>
  `\n\n--\n${env.RESEND_SENDER_NAME ?? "Felipe Dalpra"}, Synapsa\n` +
  (prospeccao ? "Escrevi para o contato que a sua clínica divulga publicamente. Para não receber mais e-mails meus, responda SAIR." : "Para não receber mais e-mails meus, responda SAIR.");

export async function sendEmail(brain: Brain, env: Env, p: { id: string; to: string; subject: string; body: string; prospeccao?: boolean }, f: typeof fetch = fetch): Promise<string> {
  const from = p.prospeccao ? env.RESEND_FROM_PROSPECCAO : env.RESEND_FROM;
  if (!env.RESEND_API_KEY || !from) throw new BrainError("invalid", "Falta RESEND_API_KEY e RESEND_FROM nos secrets do Brain.");
  const to = p.to.trim().toLowerCase();
  if (!EMAIL_RE.test(to)) throw new BrainError("invalid", "E-mail do destinatário inválido.");
  if (!p.subject.trim()) throw new BrainError("invalid", "Falta o assunto.");
  if (row(brain.db, "select 1 as x from email_suppression where email = ?", to)) throw new BrainError("invalid", "Esse contato pediu para sair ou deu erro de entrega. Não envio.");
  const now = brain.clock();
  const cap = brain.policy("email_daily_cap", 20);
  const today = row<{ n: number }>(brain.db, "select count(*) as n from envios where channel = 'email' and status = 'enviado' and at > ?", now - DAY)?.n ?? 0;
  if (today >= cap) throw new BrainError("invalid", `Limite de ${cap} e-mails por dia atingido. Ele sobe aos poucos para proteger o domínio.`);
  // Prospecção: as respostas chegam no Resend (RESEND_INBOUND) e o Brain as lê; sem isso, volta para o seu Gmail.
  const replyTo = (p.prospeccao && env.RESEND_INBOUND) || env.RESEND_REPLY_TO;
  const res = await f("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json", "idempotency-key": `brain-${p.id}` },
    body: JSON.stringify({
      from,
      to: [to],
      subject: p.subject.slice(0, 200),
      text: p.body + footer(env, p.prospeccao === true),
      ...(replyTo ? { reply_to: replyTo } : {}),
      headers: { "List-Unsubscribe": `<mailto:${replyTo ?? "sair@synapsa.chat"}?subject=SAIR>` },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  const ok = res.ok;
  run(brain.db, "insert into envios (proposal_id, channel, to_ref, status, detail, at) values (?, 'email', ?, ?, ?, ?)", p.id, to, ok ? "enviado" : "falhou", ok ? (body.id ?? "") : `${res.status} ${body.message ?? ""}`.trim(), now);
  if (!ok) throw new BrainError("invalid", `O Resend recusou o envio (${res.status}): ${body.message ?? "erro"}.`);
  return `E-mail enviado para ${to}.`;
}

export async function publishInstagram(brain: Brain, env: Env, p: { id: string; imageUrl: string; caption: string }, f: typeof fetch = fetch): Promise<string> {
  const token = env.META_SYSTEM_USER_TOKEN;
  const ig = env.META_IG_ID;
  if (!token || !ig) throw new BrainError("invalid", "Falta META_SYSTEM_USER_TOKEN ou META_IG_ID nos secrets do Brain.");
  if (!/^https:\/\//.test(p.imageUrl)) throw new BrainError("invalid", "O Instagram só aceita imagem em link https público.");
  const v = env.META_GRAPH_VERSION ?? "v23.0";
  const call = async (path: string, params: Record<string, string>) => {
    const res = await f(`https://graph.facebook.com/${v}/${path}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params) });
    const body = (await res.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
    if (!res.ok || !body.id) throw new BrainError("invalid", `Instagram recusou (${res.status}): ${body.error?.message ?? "erro"}. O token precisa da permissão instagram_content_publish.`);
    return body.id;
  };
  const now = brain.clock();
  try {
    const creation = await call(`${ig}/media`, { image_url: p.imageUrl, caption: p.caption.slice(0, 2200) });
    const mediaId = await call(`${ig}/media_publish`, { creation_id: creation });
    run(brain.db, "insert into envios (proposal_id, channel, to_ref, status, detail, at) values (?, 'instagram', ?, 'enviado', ?, ?)", p.id, ig, mediaId, now);
    return "Post publicado no Instagram.";
  } catch (e) {
    run(brain.db, "insert into envios (proposal_id, channel, to_ref, status, detail, at) values (?, 'instagram', ?, 'falhou', ?, ?)", p.id, ig, (e as Error).message.slice(0, 300), now);
    throw e;
  }
}

/** Envia o que a proposta aprovada pede. Chamado só por você, na Central, nunca por agente. */
export async function sendApproved(brain: Brain, env: Env, proposalId: string, f: typeof fetch = fetch): Promise<string> {
  if (brain.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado.");
  const p = row<{ id: string; status: string; draft: string | null; payload: string; kind: string }>(brain.db, "select id, status, draft, payload, kind from proposals where id = ?", proposalId);
  if (!p) throw new BrainError("not_found", "Proposta não encontrada.");
  if (p.status !== "aprovada") throw new BrainError("invalid", "Só envio o que você aprovou.");
  const e = envioOf(p.payload);
  if (!e) throw new BrainError("invalid", "Essa proposta não tem envio automático: copie e mande você.");
  if (row(brain.db, "select 1 as x from envios where proposal_id = ? and status = 'enviado'", p.id)) throw new BrainError("already_decided", "Já foi enviada.");
  if (!p.draft?.trim()) throw new BrainError("invalid", "A proposta não tem texto.");
  const prosp = e.tipo === "email" && e.remetente === "prospeccao";
  if (prosp && p.kind !== "resposta_lead") {
    const cap = Number(brain.policy("prospect_email_daily_cap", 10));
    const hoje = row<{ n: number }>(brain.db, "select count(*) as n from envios e join proposals pr on pr.id = e.proposal_id where e.status = 'enviado' and e.at > ? and pr.kind like 'prospeccao%'", brain.clock() - DAY)?.n ?? 0;
    if (hoje >= cap) throw new BrainError("invalid", `Limite de ${cap} e-mails de prospecção por dia atingido. Ele sobe aos poucos para proteger o domínio novo.`);
  }
  const msg = e.tipo === "email"
    ? await sendEmail(brain, env, { id: p.id, to: e.para ?? "", subject: e.assunto ?? "", body: p.draft, prospeccao: prosp }, f)
    : await publishInstagram(brain, env, { id: p.id, imageUrl: e.imagemUrl ?? "", caption: p.draft }, f);
  brain.audit("voce", "enviou", `${e.tipo}:${p.id}`);
  brain.emit("change");
  return msg;
}
