import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { createHandler } from "../src/api";
import { createAuth, LoginLimiter, makeSession, verifySession } from "../src/auth";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";

const env = { BRAIN_PASSWORD: "senha-forte-123", SESSION_SECRET: "segredo-de-teste-com-bastante-entropia" };

function app(e: Record<string, string | undefined>, now = { t: 1_000_000 }) {
  const brain = new Brain(openDb(":memory:"));
  seedKnownFacts(brain);
  const auth = createAuth(e, new LoginLimiter(), () => now.t);
  const handle = createHandler({ brain, env: {}, authorize: auth.authorize });
  const call = async (path: string, init?: RequestInit) => (await handle(new Request(`https://brain.test${path}`, init)))!;
  const login = (password: string) => call("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
  return { call, login, now };
}

describe("login", () => {
  it("sem login a API responde 401 e não vaza dados", async () => {
    const { call } = app(env);
    const r = await call("/api/state");
    expect(r.status).toBe(401);
    expect(await r.text()).not.toContain("mrr");
  });
  it("senha certa abre a sessão; o cookie é HttpOnly, Strict e Secure", async () => {
    const { call, login } = app(env);
    const r = await login(env.BRAIN_PASSWORD);
    expect(r.status).toBe(200);
    const cookie = r.headers.get("set-cookie")!;
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Strict/);
    expect(cookie).toMatch(/Secure/);
    const ok = await call("/api/state", { headers: { cookie: cookie.split(";")[0]! } });
    expect(ok.status).toBe(200);
  });
  it("senha errada falha e 5 erros travam o login", async () => {
    const { login } = app(env);
    for (let i = 0; i < 5; i++) expect((await login("errada")).status).toBe(401);
    expect((await login(env.BRAIN_PASSWORD)).status).toBe(429);
  });
  it("cookie adulterado ou expirado não vale", async () => {
    const t = await makeSession(env.SESSION_SECRET, 1000);
    expect(await verifySession(env.SESSION_SECRET, t, 2000)).toBe(true);
    expect(await verifySession(env.SESSION_SECRET, t, 1000 + 8 * 24 * 3_600_000)).toBe(false);
    expect(await verifySession(env.SESSION_SECRET, t.replace(/.$/, "x"), 2000)).toBe(false);
    expect(await verifySession("outro-segredo", t, 2000)).toBe(false);
  });
  it("sem segredos configurados fecha tudo (503), salvo ALLOW_INSECURE_LOCAL", async () => {
    expect((await app({}).call("/api/state")).status).toBe(503);
    expect((await app({ ALLOW_INSECURE_LOCAL: "1" }).call("/api/state")).status).toBe(200);
  });
  it("origem de outro site é recusada mesmo com cookie", async () => {
    const { call, login } = app(env);
    const cookie = (await login(env.BRAIN_PASSWORD)).headers.get("set-cookie")!.split(";")[0]!;
    const r = await call("/api/actions", { method: "POST", headers: { cookie, origin: "https://evil.example", "content-type": "application/json" }, body: JSON.stringify({ action: { type: "kill_on" } }) });
    expect(r.status).toBe(403);
  });
});
