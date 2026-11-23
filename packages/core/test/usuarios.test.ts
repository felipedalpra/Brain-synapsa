import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { createHandler } from "../src/api";
import { createAuth, LoginLimiter } from "../src/auth";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { armazemUsuarios } from "../src/usuarios";

const env = { BRAIN_PASSWORD: "senha-mestre-123", SESSION_SECRET: "segredo-de-teste-com-bastante-entropia" };

function app() {
  const brain = new Brain(openDb(":memory:"));
  seedKnownFacts(brain);
  const now = { t: 1_000_000 };
  const auth = createAuth(env, new LoginLimiter(), () => now.t, armazemUsuarios(brain));
  const handle = createHandler({ brain, env, authorize: auth.authorize });
  const call = async (path: string, init: RequestInit = {}, cookie?: string) =>
    (await handle(new Request(`https://brain.test${path}`, { ...init, headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}), ...(init.headers ?? {}) } })))!;
  const post = (path: string, body: unknown, cookie?: string) => call(path, { method: "POST", body: JSON.stringify(body) }, cookie);
  const entrar = async (body: Record<string, string>) => { const r = await post("/api/login", body); return { r, cookie: r.headers.get("set-cookie")?.split(";")[0] }; };
  return { call, post, entrar, now };
}

describe("usuários da equipe", () => {
  it("o dono cria uma conta, o membro entra com e-mail e senha e vê tudo, mas não gerencia usuários", async () => {
    const { call, post, entrar } = app();
    const dono = (await entrar({ password: env.BRAIN_PASSWORD })).cookie!;
    expect(await (await call("/api/me", {}, dono)).json()).toMatchObject({ dono: true, papel: "admin" });
    const c = await (await post("/api/usuarios", { acao: "criar", nome: "Cassio", email: "Cassio@Synapsa.com.br" }, dono)).json();
    expect(c.senhaTemporaria).toHaveLength(12);
    expect(c.usuarios[0]).toMatchObject({ email: "cassio@synapsa.com.br", papel: "membro", precisaTrocar: true });
    expect((JSON.stringify(c.usuarios))).not.toContain("pbkdf2");
    expect((await entrar({ email: "cassio@synapsa.com.br", password: "errada" })).r.status).toBe(401);
    const m = await entrar({ email: "CASSIO@synapsa.com.br", password: c.senhaTemporaria });
    expect(m.r.status).toBe(200);
    expect((await call("/api/state", {}, m.cookie)).status).toBe(200);
    expect(await (await call("/api/me", {}, m.cookie)).json()).toMatchObject({ nome: "Cassio", papel: "membro", dono: false });
    expect((await call("/api/usuarios", {}, m.cookie)).status).toBe(403);
    expect((await post("/api/usuarios", { acao: "criar", nome: "X", email: "x@y.com" }, m.cookie)).status).toBe(403);
  });
  it("desativar ou redefinir a senha derruba a sessão na hora; e-mail repetido é recusado", async () => {
    const { call, post, entrar } = app();
    const dono = (await entrar({ password: env.BRAIN_PASSWORD })).cookie!;
    const c = await (await post("/api/usuarios", { acao: "criar", nome: "Ana", email: "ana@x.com" }, dono)).json();
    expect((await post("/api/usuarios", { acao: "criar", nome: "Ana 2", email: "ana@x.com" }, dono)).status).toBe(409);
    const id = c.usuarios[0].id;
    const m = await entrar({ email: "ana@x.com", password: c.senhaTemporaria });
    expect((await call("/api/state", {}, m.cookie)).status).toBe(200);
    await post("/api/usuarios", { acao: "desativar", id }, dono);
    expect((await call("/api/state", {}, m.cookie)).status).toBe(401);
    expect((await entrar({ email: "ana@x.com", password: c.senhaTemporaria })).r.status).toBe(401);
    await post("/api/usuarios", { acao: "reativar", id }, dono);
    const novo = await (await post("/api/usuarios", { acao: "redefinir_senha", id }, dono)).json();
    expect((await call("/api/state", {}, m.cookie)).status).toBe(401);
    expect((await entrar({ email: "ana@x.com", password: novo.senhaTemporaria })).r.status).toBe(200);
  });
  it("a pessoa troca a própria senha; a antiga deixa de valer e o cookie novo funciona", async () => {
    const { call, post, entrar } = app();
    const dono = (await entrar({ password: env.BRAIN_PASSWORD })).cookie!;
    const c = await (await post("/api/usuarios", { acao: "criar", nome: "Bia", email: "bia@x.com" }, dono)).json();
    const m = await entrar({ email: "bia@x.com", password: c.senhaTemporaria });
    expect((await post("/api/minha-senha", { atual: "errada", nova: "outra-senha-123" }, m.cookie)).status).toBe(409);
    expect((await post("/api/minha-senha", { atual: c.senhaTemporaria, nova: "curta" }, m.cookie)).status).toBe(409);
    const t = await post("/api/minha-senha", { atual: c.senhaTemporaria, nova: "outra-senha-123" }, m.cookie);
    expect(t.status).toBe(200);
    const novoCookie = t.headers.get("set-cookie")!.split(";")[0]!;
    expect((await call("/api/state", {}, m.cookie)).status).toBe(401);
    expect((await call("/api/state", {}, novoCookie)).status).toBe(200);
    expect((await post("/api/minha-senha", { atual: env.BRAIN_PASSWORD, nova: "qualquer-coisa-1" }, dono)).status).toBe(409);
  });
  it("erros de um e-mail não travam o login dos outros nem o do dono", async () => {
    const { post, entrar } = app();
    for (let i = 0; i < 5; i++) await post("/api/login", { email: "alguem@x.com", password: "x" });
    expect((await post("/api/login", { email: "alguem@x.com", password: "x" })).status).toBe(429);
    expect((await entrar({ password: env.BRAIN_PASSWORD })).r.status).toBe(200);
  });
});
