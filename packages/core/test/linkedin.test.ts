import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { liCallback, liUrlAutorizar, diaDePostar, escaparLinkedIn, liDecidir, liGerar, liPainel, liPublicar, liRotina, proximoTema } from "../src/linkedin";

const mk = () => new Brain(openDb(":memory:"));
const ENV = { OPENAI_API_KEY: "sk-teste", LINKEDIN_ACCESS_TOKEN: "tok" };
const llm = (texto: string): typeof fetch => (async () => new Response(JSON.stringify({ choices: [{ message: { content: texto }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 10 } }), { status: 200 })) as unknown as typeof fetch;

describe("linkedin", () => {
  it("dias de postar: segunda, quarta e sexta", () => {
    expect(diaDePostar(Date.parse("2026-11-18T12:00:00Z"))).toBe(true); // quarta
    expect(diaDePostar(Date.parse("2026-11-19T12:00:00Z"))).toBe(false); // quinta
    expect(diaDePostar(Date.parse("2026-11-20T12:00:00Z"))).toBe(true); // sexta
  });
  it("gera um post pendente, um por dia, e gira o tema", async () => {
    const b = mk();
    const r = await liGerar(b, ENV, llm("Texto do post sobre a terapia além da sessão. #psicologia"));
    expect(r?.categoria).toBeTruthy();
    expect(await liGerar(b, ENV, llm("outro"))).toBeNull();
    const forcado = await liGerar(b, ENV, llm("Segundo texto. #psicologia"), { forcar: true });
    expect(forcado?.categoria).not.toBe(r?.categoria);
    expect(liPainel(b, ENV).posts.length).toBe(2);
    expect(proximoTema(b).categoria).not.toBe(forcado?.categoria);
  });
  it("a conformidade barra promessa de resultado", async () => {
    const b = mk();
    await expect(liGerar(b, ENV, llm("Com a Synapsa você tem resultado 100% garantido."))).rejects.toThrow();
  });
  it("só publica depois de aprovado, escapa o texto e guarda o link", async () => {
    const b = mk();
    const r = (await liGerar(b, ENV, llm("Post (teste) com _marcas_ #psicologia")))!;
    await expect(liPublicar(b, ENV, r.id)).rejects.toThrow(/aprovado/);
    liDecidir(b, r.id, "aprovar");
    let corpo: any;
    const f = (async (_u: string, i: RequestInit) => { corpo = JSON.parse(String(i.body)); return new Response("{}", { status: 201, headers: { "x-restli-id": "urn:li:share:123" } }); }) as unknown as typeof fetch;
    await liPublicar(b, ENV, r.id, f);
    expect(corpo.author).toBe("urn:li:organization:134663896");
    expect(corpo.commentary).toBe("Post \\(teste\\) com \\_marcas\\_ #psicologia");
    expect(liPainel(b, ENV).posts[0]!.permalink).toContain("urn:li:share:123");
    await expect(liPublicar(b, ENV, r.id, f)).rejects.toThrow();
  });
  it("sem token explica o que fazer e a rotina só roda em dia de postar", async () => {
    const b = mk();
    const r = (await liGerar(b, { OPENAI_API_KEY: "x" }, llm("Texto. #psicologia")))!;
    liDecidir(b, r.id, "aprovar");
    await expect(liPublicar(b, { OPENAI_API_KEY: "x" }, r.id)).rejects.toThrow(/não está conectado/);
    expect(escaparLinkedIn("a|b*c")).toBe("a\\|b\\*c");
    const c = mk();
    c.clock = () => Date.parse("2026-11-19T12:00:00Z"); // quinta
    expect(await liRotina(c, ENV, llm("x"))).toBeNull();
  });
  it("login do LinkedIn: state de uso único, guarda o token e publica com ele", async () => {
    const b = mk();
    const env = { OPENAI_API_KEY: "x", LINKEDIN_CLIENT_ID: "cid", LINKEDIN_CLIENT_SECRET: "sec" };
    const url = new URL(liUrlAutorizar(b, env, "https://brain.exemplo"));
    expect(url.searchParams.get("redirect_uri")).toBe("https://brain.exemplo/api/linkedin/callback");
    expect(url.searchParams.get("scope")).toBe("openid profile w_member_social");
    const state = url.searchParams.get("state")!;
    const tk = (async (u: string) => (String(u).includes("userinfo") ? new Response(JSON.stringify({ sub: "abc123", name: "Felipe" }), { status: 200 }) : new Response(JSON.stringify({ access_token: "AT", refresh_token: "RT", expires_in: 3600 }), { status: 200 }))) as unknown as typeof fetch;
    await expect(liCallback(b, env, tk, "https://brain.exemplo", "code", "errado")).rejects.toThrow();
    const url2 = new URL(liUrlAutorizar(b, env, "https://brain.exemplo"));
    await liCallback(b, env, tk, "https://brain.exemplo", "code", url2.searchParams.get("state")!);
    await expect(liCallback(b, env, tk, "https://brain.exemplo", "code", state)).rejects.toThrow();
    expect(liPainel(b, env).configurado).toBe(true);
    const r = (await liGerar(b, env, llm("Texto. #psicologia")))!;
    liDecidir(b, r.id, "aprovar");
    let auth = "";
    let autor = "";
    const f = (async (_u: string, i: RequestInit) => { auth = (i.headers as Record<string, string>).authorization!; autor = JSON.parse(String(i.body)).author; return new Response("{}", { status: 201, headers: { "x-restli-id": "urn:li:share:9" } }); }) as unknown as typeof fetch;
    await liPublicar(b, env, r.id, f);
    expect(auth).toBe("Bearer AT");
    expect(autor).toBe("urn:li:person:abc123");
    expect(liPainel(b, env).destino).toContain("Felipe");
  });
});
