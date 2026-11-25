import { LOGIN_HTML, CSP, comNonce, createAuth } from "@brain/core";
import { BrainDO, type Env } from "./brain-do";

export { BrainDO };

const brain = (env: Env) => env.BRAIN.get(env.BRAIN.idFromName("brain"));

/** Cabeçalhos de segurança em toda resposta (páginas, API e link público). */
const CABECALHOS: Record<string, string> = {
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "no-referrer",
  "permissions-policy": "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "cross-origin-opener-policy": "same-origin",
  "cross-origin-resource-policy": "same-origin",
};
const protegida = (res: Response, req: Request): Response => {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(CABECALHOS)) out.headers.set(k, v);
  // Mídia dos posts precisa ser lida pelo Instagram; o resto fica restrito à própria origem.
  if (new URL(req.url).pathname.startsWith("/api/midia/")) out.headers.set("cross-origin-resource-policy", "cross-origin");
  // Resposta autenticada nunca vai para cache compartilhado.
  if (new URL(req.url).pathname.startsWith("/api/") && !out.headers.has("cache-control")) out.headers.set("cache-control", "no-store");
  return out;
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    return protegida(await tratar(req, env), req);
  },

  async scheduled(c: ScheduledController, env: Env): Promise<void> {
    if (c.cron === "0 13 * * 1-5") await brain(env).rotina(); // 10h em Brasília, dias úteis
    else if (c.cron === "0 17 * * 1") await brain(env).semanal(); // segunda, 14h em Brasília: relatório semanal
    else await brain(env).daily();
  },
} satisfies ExportedHandler<Env>;

async function tratar(req: Request, env: Env): Promise<Response> {
  {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return brain(env).fetch(req);

    if (url.pathname === "/privacidade" && req.method === "GET") return brain(env).fetch(new Request(`${url.origin}/api/privacidade`));

    // Link das tarefas da semana: página pública protegida pelo token do próprio link (sem login).
    const t = /^\/t\/([\w-]{1,80})\/?$/.exec(url.pathname);
    if (t && req.method === "GET") return brain(env).fetch(new Request(`${url.origin}/api/p/${t[1]}/pagina`));

    // Páginas: só depois do login. O Worker confere o cookie (assinatura), sem acordar o Durable Object.
    const auth = createAuth(env as unknown as Record<string, string | undefined>);
    const headers = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" };
    if (!auth.configured) return new Response("Login não configurado: defina BRAIN_PASSWORD e SESSION_SECRET (wrangler secret put).", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    if (!(await auth.isAuthed(req))) { const l = comNonce(LOGIN_HTML, CSP); return new Response(l.html, { status: 401, headers: { ...headers, "content-security-policy": l.csp } }); }
    const res = await env.ASSETS.fetch(req);
    if ((res.headers.get("content-type") ?? "").includes("text/html")) {
      const n = comNonce(await res.text(), CSP);
      const h = new Headers(res.headers); h.delete("content-length"); h.delete("etag");
      h.set("content-security-policy", n.csp); h.set("cache-control", "no-store"); h.set("x-content-type-options", "nosniff");
      return new Response(n.html, { status: res.status, headers: h });
    }
    const out = new Response(res.body, res);
    out.headers.set("content-security-policy", CSP);
    out.headers.set("cache-control", "no-store");
    out.headers.set("x-content-type-options", "nosniff");
    return out;
  }
}
