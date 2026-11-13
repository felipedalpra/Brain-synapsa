import { CrmError, crmClient } from "./crm";
import { run, type Db } from "./sql";

type Env = Record<string, string | undefined>;
interface Result {
  ok: boolean;
  detail: string;
}

const get = async (url: string, headers: Record<string, string>, f: typeof fetch) => {
  const res = await f(url, { method: "GET", headers, signal: AbortSignal.timeout(10_000) });
  return { res, body: (await res.json().catch(() => ({}))) as Record<string, any> };
};

/** Testes de conexão: só GET, só leitura, nada que gaste crédito ou mude algo. */
export const CHECKS: Record<string, (env: Env, f: typeof fetch) => Promise<Result | null>> = {
  async stripe(env, f) {
    if (!env.STRIPE_READ_KEY) return null;
    const { res } = await get("https://api.stripe.com/v1/balance", { authorization: `Bearer ${env.STRIPE_READ_KEY}` }, f);
    return res.ok ? { ok: true, detail: "Chave de leitura válida" } : { ok: false, detail: `Stripe respondeu ${res.status}` };
  },
  async meta(env, f) {
    if (!env.META_SYSTEM_USER_TOKEN || !env.META_AD_ACCOUNT_ID) return null;
    const acct = env.META_AD_ACCOUNT_ID.startsWith("act_") ? env.META_AD_ACCOUNT_ID : `act_${env.META_AD_ACCOUNT_ID}`;
    const { res, body } = await get(`https://graph.facebook.com/${env.META_GRAPH_VERSION ?? "v23.0"}/${acct}?fields=name,account_status`, { authorization: `Bearer ${env.META_SYSTEM_USER_TOKEN}` }, f);
    return res.ok ? { ok: true, detail: `Conta de anúncios "${body.name ?? acct}"` } : { ok: false, detail: `Meta respondeu ${res.status}: ${body.error?.message ?? "erro"}` };
  },
  async instagram(env, f) {
    if (!env.META_SYSTEM_USER_TOKEN || !env.META_IG_ID) return null;
    const { res, body } = await get(`https://graph.facebook.com/${env.META_GRAPH_VERSION ?? "v23.0"}/${env.META_IG_ID}?fields=username`, { authorization: `Bearer ${env.META_SYSTEM_USER_TOKEN}` }, f);
    return res.ok ? { ok: true, detail: `Perfil @${body.username ?? env.META_IG_ID}` } : { ok: false, detail: `Instagram respondeu ${res.status}: ${body.error?.message ?? "erro"}` };
  },
  async openai(env, f) {
    if (!env.OPENAI_API_KEY) return null;
    const { res } = await get("https://api.openai.com/v1/models", { authorization: `Bearer ${env.OPENAI_API_KEY}` }, f);
    return res.ok ? { ok: true, detail: "Chave válida" } : { ok: false, detail: `OpenAI respondeu ${res.status}` };
  },
  async anthropic(env, f) {
    if (!env.ANTHROPIC_API_KEY) return null;
    const { res } = await get("https://api.anthropic.com/v1/models?limit=1", { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, f);
    return res.ok ? { ok: true, detail: "Chave válida" } : { ok: false, detail: `Anthropic respondeu ${res.status}` };
  },
  async resend(env, f) {
    if (!env.RESEND_API_KEY) return null;
    const { res, body } = await get("https://api.resend.com/domains", { authorization: `Bearer ${env.RESEND_API_KEY}` }, f);
    if (res.ok) return { ok: true, detail: `${(body.data as unknown[] | undefined)?.length ?? 0} domínio(s) na conta` };
    // Chave só de envio não lista domínios: isso é o desejado, não um erro.
    if (res.status === 401 && /restricted/i.test(String(body.name ?? body.message ?? ""))) return { ok: true, detail: "Chave só de envio (não lista domínios)" };
    return { ok: false, detail: `Resend respondeu ${res.status}` };
  },
  async apify(env, f) {
    if (!env.APIFY_TOKEN) return null;
    const { res } = await get("https://api.apify.com/v2/users/me", { authorization: `Bearer ${env.APIFY_TOKEN}` }, f);
    return res.ok ? { ok: true, detail: "Token válido" } : { ok: false, detail: `Apify respondeu ${res.status}` };
  },
  async crm(env, f) {
    const cli = crmClient(env, f);
    if (!cli) return null;
    try {
      const r = await cli.stages();
      return { ok: true, detail: `API do CRM respondeu 200 (${r.data.length} etapas do funil)` };
    } catch (e) {
      return { ok: false, detail: e instanceof CrmError ? `CRM: ${e.message}${e.requestId ? ` (request_id ${e.requestId})` : ""}` : "CRM: erro de rede" };
    }
  },
  async whatsapp(env, f) {
    if (!env.WHATSAPP_ACCESS_TOKEN) return null;
    const { res, body } = await get(`https://graph.facebook.com/${env.META_GRAPH_VERSION ?? "v23.0"}/me?fields=id,name`, { authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` }, f);
    return res.ok ? { ok: true, detail: `Token válido (${body.name ?? body.id})` } : { ok: false, detail: `WhatsApp respondeu ${res.status}: ${body.error?.message ?? "erro"}` };
  },
};

export async function runChecks(db: Db, env: Env, now: number, f: typeof fetch = fetch): Promise<Record<string, Result>> {
  const out: Record<string, Result> = {};
  await Promise.all(
    Object.entries(CHECKS).map(async ([id, check]) => {
      let r: Result | null;
      try {
        r = await check(env, f);
      } catch (e) {
        r = { ok: false, detail: e instanceof Error ? e.message.slice(0, 120) : "erro de rede" };
      }
      if (!r) return;
      out[id] = r;
      run(db, "insert into integration_checks (integration_id, ok, detail, at) values (?, ?, ?, ?) on conflict(integration_id) do update set ok = excluded.ok, detail = excluded.detail, at = excluded.at", id, r.ok ? 1 : 0, r.detail, now);
    }),
  );
  return out;
}
