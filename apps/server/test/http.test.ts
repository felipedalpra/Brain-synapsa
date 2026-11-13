import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { Brain, seedKnownFacts, ruleChat, integrationsView } from "@brain/core";
import { openDb } from "@brain/core/src/node-db";
import { createApp } from "../src/http";

let server: Server;
let base = "";
let brain: Brain;

beforeAll(async () => {
  brain = new Brain(openDb(":memory:"));
  seedKnownFacts(brain);
  server = createApp({ brain, env: {}, chat: ruleChat(brain, () => integrationsView(brain.db, {}, brain.clock())) }, 0);
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => server.close());

const post = (path: string, body: unknown, headers: Record<string, string> = {}) => fetch(base + path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

describe("API local", () => {
  it("devolve o estado completo", async () => {
    const s = (await (await fetch(`${base}/api/state`)).json()) as any;
    expect(s.mode).toBe("live");
    expect(Object.keys(s.runtime)).toHaveLength(24);
    expect(s.integrations.length).toBe(11);
    expect(s.metrics.mrr.total).toBe(496);
  });
  it("não vaza valor de segredo, só o nome", async () => {
    const b = createApp({ brain, env: { STRIPE_READ_KEY: "rk_live_SEGREDO123" } }, 0);
    await new Promise<void>((r) => b.listen(0, "127.0.0.1", r));
    const txt = await (await fetch(`http://127.0.0.1:${(b.address() as AddressInfo).port}/api/state`)).text();
    b.close();
    expect(txt).not.toContain("SEGREDO123");
    expect(txt).toContain("STRIPE_READ_KEY");
  });
  it("recusa ordens vindas de outro site", async () => {
    const r = await post("/api/actions", { action: { type: "kill_on" } }, { origin: "https://evil.example" });
    expect(r.status).toBe(403);
    expect(brain.killed()).toBe(false);
  });
  it("kill switch via ação bloqueia aprovação com 409", async () => {
    const id = brain.addProposal({ agentId: "pagar", kind: "x", title: "T", why: "w", risk: "baixo", channel: "whatsapp" })!;
    expect((await post("/api/actions", { action: { type: "kill_on" } })).status).toBe(200);
    const r = await post(`/api/proposals/${id}/decide`, { to: "aprovada" });
    expect(r.status).toBe(409);
    expect(((await r.json()) as any).code).toBe("kill_switch");
    await post("/api/actions", { action: { type: "kill_off" } });
    expect((await post(`/api/proposals/${id}/decide`, { to: "aprovada" })).status).toBe(200);
  });
  it("valida entrada", async () => {
    expect((await post("/api/actions", { action: { type: "task", agentId: "sdr" } })).status).toBe(409);
    expect((await post("/api/proposals/x/decide", { to: "talvez" })).status).toBe(409);
    expect((await post("/api/proposals/inexistente/decide", { to: "aprovada" })).status).toBe(404);
  });
  it("tarefa pelo Jarvis entra no estado", async () => {
    await post("/api/actions", { action: { type: "task", agentId: "guardiao", task: "conciliar a base" } });
    const s = (await (await fetch(`${base}/api/state`)).json()) as any;
    expect(s.runtime.guardiao.status).toBe("trabalhando");
    expect(s.activity[0].text).toContain("conciliar a base");
  });
  it("Jarvis responde o MRR real e executa ordem de pausar", async () => {
    const a = (await (await post("/api/chat", { text: "como está o MRR?" })).json()) as any;
    expect(a.reply.text.replace(/\u00a0/g, " ")).toContain("R$ 496");
    const b = (await (await post("/api/chat", { text: "pause a mídia paga" })).json()) as any;
    expect(b.snapshot.runtime.midia.status).toBe("pausado");
    const c = (await (await post("/api/chat", { text: "pare tudo" })).json()) as any;
    expect(c.reply.confirm.action.type).toBe("kill_on");
    expect(brain.killed()).toBe(false); // só confirma depois
  });
  it("sem chave da Anthropic, o Jarvis não finge que um agente sem rotina trabalhou", async () => {
    const r = (await (await post("/api/chat", { text: "peça ao SDR para responder os leads" })).json()) as any;
    expect(r.reply.text).toMatch(/OPENAI_API_KEY/);
    expect(r.reply.text).not.toMatch(/começou/);
  });
});
