import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { createHandler } from "../src/api";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { ruleChat } from "../src/jarvis";
import { integrationsView } from "../src/integrations";

const setup = (extra: Partial<Parameters<typeof createHandler>[0]> = {}) => {
  const brain = new Brain(openDb(":memory:"));
  seedKnownFacts(brain);
  const handle = createHandler({ brain, env: {}, chat: ruleChat(brain, () => integrationsView(brain.db, {}, brain.clock())), ...extra });
  const call = (path: string, init?: RequestInit) => handle(new Request(`https://brain.test${path}`, init));
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) => call(path, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  return { brain, call, post };
};

describe("API em padrão Fetch", () => {
  it("devolve o estado e o MRR", async () => {
    const { call } = setup();
    const s = (await (await call("/api/state"))!.json()) as any;
    expect(s.mode).toBe("live");
    expect(s.metrics.mrr.total).toBe(496);
  });
  it("só aceita a própria origem", async () => {
    const { post, brain } = setup();
    expect((await post("/api/actions", { action: { type: "kill_on" } }, { origin: "https://evil.example" }))!.status).toBe(403);
    expect(brain.killed()).toBe(false);
    expect((await post("/api/actions", { action: { type: "kill_on" } }, { origin: "https://brain.test" }))!.status).toBe(200);
    expect(brain.killed()).toBe(true);
  });
  it("o hook authorize barra antes de qualquer coisa", async () => {
    const { call } = setup({ authorize: () => new Response("no", { status: 401 }) });
    expect((await call("/api/state"))!.status).toBe(401);
  });
  it("valida entrada e deixa /api/events para o adaptador", async () => {
    const { call, post } = setup();
    expect((await post("/api/proposals/x/decide", { to: "talvez" }))!.status).toBe(409);
    expect((await post("/api/proposals/nada/decide", { to: "aprovada" }))!.status).toBe(404);
    expect(await call("/api/events")).toBeNull();
  });
});
