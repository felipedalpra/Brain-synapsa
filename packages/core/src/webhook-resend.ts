// Avisos do Resend (bounce, reclamação de spam, resposta recebida). Rota pública: quem manda é o Resend, então a assinatura (Svix) é a única porta.
import type { Brain } from "./brain";
import { suppress } from "./dispatch";
import { rows } from "./sql";
import { marcarContato } from "./prospeccao-email";
import { tratarRecebido, type Recebido } from "./inbound";

const b64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toB64 = (u: Uint8Array): string => btoa(String.fromCharCode(...u));

/** Confere a assinatura Svix: HMAC-SHA256 de "id.timestamp.corpo" com o segredo whsec_… e janela de 5 minutos. */
export async function assinaturaValida(secret: string, headers: Headers, raw: string, agoraMs: number): Promise<boolean> {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sig = headers.get("svix-signature");
  if (!id || !ts || !sig || !secret.startsWith("whsec_")) return false;
  if (!Number.isFinite(Number(ts)) || Math.abs(agoraMs / 1000 - Number(ts)) > 300) return false;
  try {
    const key = await crypto.subtle.importKey("raw", b64(secret.slice(6)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const esperado = toB64(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${raw}`))));
    return sig.split(" ").some((p) => p.startsWith("v1,") && p.slice(3) === esperado);
  } catch {
    return false;
  }
}

const MOTIVO: Record<string, string> = { "email.bounced": "bounce (endereço não entrega)", "email.complained": "marcou como spam" };

/** Bounce ou reclamação: bloqueia o endereço para sempre e para a sequência de prospecção dessa clínica. */
export function tratarEvento(brain: Brain, evento: { type?: string; data?: { to?: string[] | string } }): number {
  const motivo = evento.type ? MOTIVO[evento.type] : undefined;
  if (!motivo) return 0;
  const to = ([] as string[]).concat(evento.data?.to ?? []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  for (const email of to) {
    for (const p of rows<{ id: number }>(brain.db, "select id from prospects where lower(email) = ?", email)) marcarContato(brain, p.id, "sair");
    suppress(brain, email, motivo); // depois, para o motivo real (bounce/spam) ficar registrado
    brain.audit("sistema", "resend_evento", email, { tipo: evento.type });
  }
  if (to.length) brain.emit("change");
  return to.length;
}

export async function receberWebhook(brain: Brain, env: Record<string, string | undefined>, req: Request): Promise<Response> {
  const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (!secret) return json(503, { error: "RESEND_WEBHOOK_SECRET não configurado." });
  const raw = await req.text();
  if (raw.length > 100_000 || !(await assinaturaValida(secret, req.headers, raw, brain.clock()))) return json(401, { error: "assinatura inválida" });
  try {
    const ev = JSON.parse(raw) as { type?: string; data?: unknown };
    if (ev.type === "email.received") return json(200, { ok: true, ...(await tratarRecebido(brain, env, (ev.data ?? {}) as Recebido)) });
    return json(200, { ok: true, tratados: tratarEvento(brain, ev as Parameters<typeof tratarEvento>[1]) });
  } catch {
    return json(400, { error: "corpo inválido" });
  }
}
