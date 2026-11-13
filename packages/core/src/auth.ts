/** Login por senha única + cookie assinado (HMAC-SHA256). Só Web Crypto: roda no Worker e no Node. */
const enc = new TextEncoder();
export const COOKIE = "brain_session";
const TTL_MS = 7 * 24 * 3_600_000;

const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Comparação em tempo constante (compara os hashes, não os textos). */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const A = new Uint8Array(x);
  const B = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < A.length; i++) d |= A[i]! ^ B[i]!;
  return d === 0;
}

export async function makeSession(secret: string, now: number): Promise<string> {
  const exp = String(now + TTL_MS);
  return `${exp}.${await hmac(secret, exp)}`;
}

export async function verifySession(secret: string, token: string | undefined, now: number): Promise<boolean> {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  return safeEqual(sig, await hmac(secret, exp));
}

export const readCookie = (req: Request, name = COOKIE): string | undefined =>
  req.headers.get("cookie")?.split(/;\s*/).map((c) => c.split("=") as [string, string]).find(([k]) => k === name)?.[1];

export const sessionCookie = (token: string, secure: boolean) => `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TTL_MS / 1000}${secure ? "; Secure" : ""}`;
export const clearCookie = (secure: boolean) => `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? "; Secure" : ""}`;

export interface AuthEnv {
  BRAIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  ALLOW_INSECURE_LOCAL?: string;
}

const j = (status: number, body: unknown, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });

/** Limite de tentativas: 5 erros em 10 minutos travam o login por 10 minutos. Estado em memória do Durable Object. */
export class LoginLimiter {
  private fails: number[] = [];
  constructor(private max = 5, private windowMs = 600_000) {}
  blocked(now: number): boolean {
    this.fails = this.fails.filter((t) => now - t < this.windowMs);
    return this.fails.length >= this.max;
  }
  fail(now: number) {
    this.fails.push(now);
  }
  reset() {
    this.fails = [];
  }
}

export const LOGIN_HTML = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synapsa Brain</title>
<style>:root{color-scheme:light dark;--bg:#f6f5f2;--fg:#17201d;--mut:#66706b;--ac:#1f6b55;--bd:#d6d9d4}@media(prefers-color-scheme:dark){:root{--bg:#0f1513;--fg:#e8ede9;--mut:#8b9791;--ac:#4fb391;--bd:#2a3531}}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:15px system-ui,sans-serif;padding:16px}
form{width:min(340px,100%);display:grid;gap:12px}h1{font-size:20px;margin:0}p{margin:0;color:var(--mut)}
input,button{font:inherit;padding:11px 12px;border-radius:8px;border:1px solid var(--bd);background:transparent;color:var(--fg)}button{background:var(--ac);border-color:var(--ac);color:#fff;font-weight:600;cursor:pointer}#e{color:#c0392b;min-height:1.2em}</style>
<form id="f"><h1>Synapsa Brain</h1><p>Acesso restrito.</p><input id="p" type="password" placeholder="Senha" autocomplete="current-password" autofocus required><button>Entrar</button><div id="e" role="alert"></div></form>
<script>f.onsubmit=async e=>{e.preventDefault();const r=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:p.value})});if(r.ok)location.reload();else document.getElementById('e').textContent=r.status===429?'Muitas tentativas. Espere 10 minutos.':r.status===503?'Login não configurado no servidor.':'Senha incorreta.'}</script></html>`;

export function createAuth(env: AuthEnv, limiter = new LoginLimiter(), clock: () => number = Date.now) {
  const open = env.ALLOW_INSECURE_LOCAL === "1";
  const configured = Boolean(env.BRAIN_PASSWORD && env.SESSION_SECRET);

  const isAuthed = async (req: Request) => open || (configured && (await verifySession(env.SESSION_SECRET!, readCookie(req), clock())));

  /** Para o hook `authorize` da API. */
  const authorize = async (req: Request, url: URL): Promise<Response | null> => {
    if (url.pathname === "/api/login" && req.method === "POST") return login(req, url);
    if (url.pathname === "/api/logout" && req.method === "POST") return j(200, { ok: true }, { "set-cookie": clearCookie(url.protocol === "https:") });
    if (!open && !configured) return j(503, { error: "Login não configurado: defina BRAIN_PASSWORD e SESSION_SECRET.", code: "not_configured" });
    if (await isAuthed(req)) return null;
    return j(401, { error: "Faça login.", code: "auth" });
  };

  async function login(req: Request, url: URL): Promise<Response> {
    if (!configured) return j(503, { error: "Login não configurado.", code: "not_configured" });
    const now = clock();
    if (limiter.blocked(now)) return j(429, { error: "Muitas tentativas.", code: "rate_limited" });
    let pw = "";
    try {
      pw = String(((await req.json()) as { password?: unknown }).password ?? "");
    } catch {
      /* corpo inválido conta como senha errada */
    }
    if (!pw || !(await safeEqual(pw, env.BRAIN_PASSWORD!))) {
      limiter.fail(now);
      return j(401, { error: "Senha incorreta.", code: "auth" });
    }
    limiter.reset();
    return j(200, { ok: true }, { "set-cookie": sessionCookie(await makeSession(env.SESSION_SECRET!, now), url.protocol === "https:") });
  }

  return { authorize, isAuthed, configured: configured || open };
}
