import { LOGIN_HTML, CSP, createAuth } from "@brain/core";
import { BrainDO, type Env } from "./brain-do";

export { BrainDO };

const brain = (env: Env) => env.BRAIN.get(env.BRAIN.idFromName("brain"));

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return brain(env).fetch(req);

    // Páginas: só depois do login. O Worker confere o cookie (assinatura), sem acordar o Durable Object.
    const auth = createAuth(env as unknown as Record<string, string | undefined>);
    const headers = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": CSP, "x-content-type-options": "nosniff" };
    if (!auth.configured) return new Response("Login não configurado: defina BRAIN_PASSWORD e SESSION_SECRET (wrangler secret put).", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    if (!(await auth.isAuthed(req))) return new Response(LOGIN_HTML, { status: 401, headers });
    const res = await env.ASSETS.fetch(req);
    const out = new Response(res.body, res);
    out.headers.set("content-security-policy", CSP);
    out.headers.set("cache-control", "no-store");
    out.headers.set("x-content-type-options", "nosniff");
    return out;
  },

  async scheduled(c: ScheduledController, env: Env): Promise<void> {
    if (c.cron === "0 13 * * 1-5") await brain(env).rotina(); // 10h em Brasília, dias úteis
    else await brain(env).daily();
  },
} satisfies ExportedHandler<Env>;
