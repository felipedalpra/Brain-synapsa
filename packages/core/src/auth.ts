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

/** Cookie: `uid.versao.expira.assinatura`. uid "0" é o dono (senha mestre). Mudar a senha ou desativar a conta sobe a versão e derruba as sessões antigas. */
export async function makeSession(secret: string, now: number, uid = "0", ver = 0): Promise<string> {
  const corpo = `${uid}.${ver}.${now + TTL_MS}`;
  return `${corpo}.${await hmac(secret, corpo)}`;
}

export interface SessaoLida { uid: string; ver: number }
export async function lerSessao(secret: string, token: string | undefined, now: number): Promise<SessaoLida | null> {
  if (!token) return null;
  const p = token.split(".");
  // formato antigo (expira.assinatura): era sempre o dono
  const [uid, ver, exp, sig] = p.length === 2 ? ["0", "0", p[0]!, p[1]!] : p.length === 4 ? (p as [string, string, string, string]) : [];
  if (!uid || !ver || !exp || !sig || !/^\d+$/.test(exp) || !/^\d+$/.test(ver) || !/^[\w-]{1,40}$/.test(uid) || Number(exp) < now) return null;
  const corpo = p.length === 2 ? exp : `${uid}.${ver}.${exp}`;
  return (await safeEqual(sig, await hmac(secret, corpo))) ? { uid, ver: Number(ver) } : null;
}
export async function verifySession(secret: string, token: string | undefined, now: number): Promise<boolean> {
  return (await lerSessao(secret, token, now)) !== null;
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

/** Limite de tentativas: 5 erros em 10 minutos travam aquele login por 10 minutos (cada e-mail tem a sua conta, para um colega não travar o outro). */
export class LoginLimiter {
  private fails = new Map<string, number[]>();
  constructor(private max = 5, private windowMs = 600_000) {}
  private recentes(now: number, k: string): number[] {
    const l = (this.fails.get(k) ?? []).filter((t) => now - t < this.windowMs);
    if (l.length) this.fails.set(k, l); else this.fails.delete(k);
    return l;
  }
  blocked(now: number, k = ""): boolean {
    return this.recentes(now, k).length >= this.max;
  }
  fail(now: number, k = "") {
    this.fails.set(k, [...this.recentes(now, k), now]);
  }
  reset(k = "") {
    this.fails.delete(k);
  }
}

// ---------- senhas (PBKDF2-SHA256 do Web Crypto, 100 mil voltas: o máximo que o Workers aceita) ----------
const hex = (u: Uint8Array) => [...u].map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (h: string) => new Uint8Array((h.match(/../g) ?? []).map((x) => parseInt(x, 16)));
async function pbkdf2(senha: string, sal: Uint8Array, voltas: number): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: voltas }, k, 256));
}
export async function hashSenha(senha: string): Promise<string> {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$100000$${hex(sal)}$${hex(await pbkdf2(senha, sal, 100_000))}`;
}
export async function conferirSenha(senha: string, guardado: string | null | undefined): Promise<boolean> {
  const [alg, voltas, sal, h] = (guardado ?? "pbkdf2$100000$00000000000000000000000000000000$").split("$");
  const calc = hex(await pbkdf2(senha, unhex(sal ?? ""), Number(voltas) || 100_000));
  return alg === "pbkdf2" && !!guardado && (await safeEqual(calc, h ?? ""));
}

export interface Usuario { id: string; nome: string; email: string; papel: "admin" | "membro"; dono: boolean; precisaTrocar: boolean }
export interface UsuarioGuardado extends Usuario { hash: string; ativo: boolean; versao: number }
/** O que o login precisa saber dos usuários; quem guarda é o Brain (SQLite). */
export interface Usuarios {
  porEmail(email: string): UsuarioGuardado | null;
  porId(id: string): UsuarioGuardado | null;
  entrou(id: string, quando: number): void;
  nomeDoDono(): string;
}
const quemPorRequisicao = new WeakMap<Request, Usuario>();
export const usuarioAtual = (req: Request): Usuario | null => quemPorRequisicao.get(req) ?? null;

export const LOGIN_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Central Synapsa</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>:root{color-scheme:dark;--bg:#060a18;--panel:#0e1630;--line:rgba(138,156,214,.2);--line2:rgba(138,156,214,.4);--text:#e7ecfb;--mut:#93a0c8;--core:#7c9ce8;--ind:#5667d6}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;color:var(--text);font:15px "Hanken Grotesk","Segoe UI",system-ui,sans-serif;padding:16px;background:var(--bg) radial-gradient(1100px 700px at 30% -10%,rgba(86,103,214,.28),transparent 60%);background-image:radial-gradient(1100px 700px at 30% -10%,rgba(86,103,214,.28),transparent 60%),linear-gradient(rgba(138,156,214,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(138,156,214,.045) 1px,transparent 1px);background-size:auto,44px 44px,44px 44px}
form{width:min(380px,100%);display:grid;gap:12px;background:linear-gradient(160deg,var(--panel),#0a1126);border:1px solid var(--line);border-radius:18px;padding:26px}
.m{display:flex;align-items:center;gap:10px}.m b{font:700 19px "Chakra Petch","Segoe UI",sans-serif}p{margin:0;color:var(--mut);font-size:14px}
label{display:grid;gap:5px;color:var(--mut);font-size:13px}
input,button{font:inherit;padding:11px 12px;border-radius:10px;border:1px solid var(--line2);background:#060a18;color:var(--text);min-width:0}input:focus{outline:2px solid var(--core);outline-offset:1px}
button{background:linear-gradient(135deg,var(--ind),#6a8bd7);border-color:transparent;color:#fff;font-weight:600;cursor:pointer}button:disabled{opacity:.6}#e{color:#f2808e;min-height:1.2em;font-size:14px}</style></head><body>
<form id="f"><div class="m"><svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><defs><radialGradient id="o" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#eaf1ff"/><stop offset=".45" stop-color="#7c9ce8"/><stop offset="1" stop-color="#5667d6"/></radialGradient></defs><circle cx="17" cy="17" r="15" fill="url(#o)"/><circle cx="12.5" cy="15" r="2.2" fill="#0a1126"/><circle cx="21.5" cy="15" r="2.2" fill="#0a1126"/></svg><b>Central Synapsa</b></div>
<p>Acesso da equipe.</p>
<label>E-mail<input id="u" type="email" autocomplete="username" placeholder="voce@synapsa.com.br" autofocus></label>
<label>Senha<input id="p" type="password" autocomplete="current-password" required></label>
<button id="b">Entrar</button><div id="e" role="alert"></div></form>
<script>f.onsubmit=async e=>{e.preventDefault();b.disabled=true;try{const r=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:u.value.trim(),password:p.value})});if(r.ok)location.reload();else document.getElementById('e').textContent=r.status===429?'Muitas tentativas. Espere 10 minutos.':r.status===503?'Login não configurado no servidor.':'E-mail ou senha incorretos.'}finally{b.disabled=false}}</script></body></html>`;

export function createAuth(env: AuthEnv, limiter = new LoginLimiter(), clock: () => number = Date.now, users?: Usuarios) {
  const open = env.ALLOW_INSECURE_LOCAL === "1";
  const configured = Boolean(env.BRAIN_PASSWORD && env.SESSION_SECRET);
  const dono = (): Usuario => ({ id: "0", nome: users?.nomeDoDono() ?? "Felipe", email: "", papel: "admin", dono: true, precisaTrocar: false });

  const isAuthed = async (req: Request) => open || (configured && (await verifySession(env.SESSION_SECRET!, readCookie(req), clock())));

  /** Quem é, com a conta conferida no banco (desativada ou com senha trocada deixa de valer na hora). */
  async function quem(req: Request): Promise<Usuario | null> {
    if (open) return dono();
    if (!configured) return null;
    const s = await lerSessao(env.SESSION_SECRET!, readCookie(req), clock());
    if (!s) return null;
    if (s.uid === "0") return dono();
    const u = users?.porId(s.uid);
    if (!u || !u.ativo || u.versao !== s.ver) return null;
    const { hash: _h, ativo: _a, versao: _v, ...pub } = u;
    return pub;
  }

  /** Para o hook `authorize` da API. */
  const authorize = async (req: Request, url: URL): Promise<Response | null> => {
    if (url.pathname === "/api/login" && req.method === "POST") return login(req, url);
    if (url.pathname === "/api/logout" && req.method === "POST") return j(200, { ok: true }, { "set-cookie": clearCookie(url.protocol === "https:") });
    if (!open && !configured) return j(503, { error: "Login não configurado: defina BRAIN_PASSWORD e SESSION_SECRET.", code: "not_configured" });
    const u = await quem(req);
    if (!u) return j(401, { error: "Faça login.", code: "auth" });
    quemPorRequisicao.set(req, u);
    return null;
  };

  async function login(req: Request, url: URL): Promise<Response> {
    if (!configured) return j(503, { error: "Login não configurado.", code: "not_configured" });
    const now = clock();
    let pw = "", email = "";
    try {
      const b = (await req.json()) as { password?: unknown; email?: unknown };
      pw = String(b.password ?? "");
      email = String(b.email ?? "").trim().toLowerCase().slice(0, 120);
    } catch {
      /* corpo inválido conta como senha errada */
    }
    const chave = email || "mestre";
    if (limiter.blocked(now, chave)) return j(429, { error: "Muitas tentativas.", code: "rate_limited" });
    const secure = url.protocol === "https:";
    if (email) {
      const u = users?.porEmail(email) ?? null;
      // confere a senha mesmo se o e-mail não existir, para o tempo de resposta não revelar quem tem conta
      const certo = pw ? await conferirSenha(pw, u?.hash) : false;
      if (!u || !u.ativo || !certo) { limiter.fail(now, chave); return j(401, { error: "E-mail ou senha incorretos.", code: "auth" }); }
      limiter.reset(chave);
      users!.entrou(u.id, now);
      return j(200, { ok: true }, { "set-cookie": sessionCookie(await makeSession(env.SESSION_SECRET!, now, u.id, u.versao), secure) });
    }
    if (!pw || !(await safeEqual(pw, env.BRAIN_PASSWORD!))) {
      limiter.fail(now, chave);
      return j(401, { error: "Senha incorreta.", code: "auth" });
    }
    limiter.reset(chave);
    return j(200, { ok: true }, { "set-cookie": sessionCookie(await makeSession(env.SESSION_SECRET!, now), secure) });
  }

  return { authorize, isAuthed, quem, configured: configured || open };
}
