import { describe, expect, it } from "vitest";
import { Brain, BrainError, brtDay } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";

const mk = (start = Date.parse("2026-10-16T15:00:00Z")) => {
  let t = start;
  const brain = new Brain(openDb(":memory:"), () => t);
  seedKnownFacts(brain);
  return { brain, tick: (ms: number) => (t += ms) };
};
const prop = (over: Partial<Parameters<Brain["addProposal"]>[0]> = {}) => ({ agentId: "pagar", kind: "x", title: "Convidar", why: "porque", risk: "baixo" as const, channel: "whatsapp" as const, ...over });

describe("MRR e metas", () => {
  it("soma Stripe informado + Pix pelo valor efetivo", () => {
    const m = mk().brain.metrics();
    expect(m.mrr).toMatchObject({ stripe: 147, pix: 349, total: 496, goal: 1200 });
  });
  it("agrupa os fins de desconto por data", () => {
    const d = mk().brain.metrics().descontos;
    expect(d).toEqual([
      { quando: "23/01/2027", contas: 2, de: 49, para: 119 },
      { quando: "02/03/2027", contas: 1, de: 49, para: 119 },
    ]);
  });
  it("funil fica nulo até a plataforma ligar", () => expect(mk().brain.metrics().funil).toBeNull());
});

describe("propostas", () => {
  it("fila ordena por impacto e respeita o teto de 15", () => {
    const { brain } = mk();
    for (let i = 0; i < 20; i++) brain.addProposal(prop({ title: `p${i}`, impactoBrl: i }));
    const snap = brain.snapshot([]);
    const pending = snap.proposals.filter((p) => p.status === "pendente");
    expect(pending).toHaveLength(15);
    expect(pending[0]!.impactoBrl).toBe(19);
    expect(snap.overflow).toBe(5);
  });
  it("não duplica pela chave de dedupe", () => {
    const { brain } = mk();
    expect(brain.addProposal(prop({ dedupeKey: "k" }))).toBeTruthy();
    expect(brain.addProposal(prop({ dedupeKey: "k" }))).toBeNull();
  });
  it("conformidade barra e registra, sem entrar na fila", () => {
    const { brain } = mk();
    brain.reviewer = () => ({ ok: false, note: "promete resultado" });
    expect(brain.addProposal(prop())).toBeNull();
    const snap = brain.snapshot([]);
    expect(snap.proposals.filter((p) => p.status === "pendente")).toHaveLength(0);
    expect(snap.proposals[0]).toMatchObject({ status: "rejeitada", review: "sinalizada" });
    expect(snap.activity[0]!.text).toContain("Barrou");
  });
  it("aprovar registra decisão, auditoria e contato", () => {
    const { brain } = mk();
    const id = brain.addProposal(prop({ contactRef: "psi-1" }))!;
    brain.decide(id, "aprovada");
    expect(() => brain.decide(id, "rejeitada")).toThrowError(BrainError);
    const n = (t: string) => (brain.db.prepare(`select count(*) as n from ${t}`).get() as { n: number }).n;
    expect(n("approvals")).toBe(1);
    expect(n("contact_log")).toBe(1);
    expect(n("audit_log")).toBeGreaterThan(0);
  });
  it("aprovar em lote só pega baixo risco", () => {
    const { brain } = mk();
    brain.addProposal(prop({ title: "a" }));
    brain.addProposal(prop({ title: "b", risk: "medio" }));
    expect(brain.approveLowRisk()).toBe(1);
    expect(brain.snapshot([]).proposals.filter((p) => p.status === "pendente").map((p) => p.title)).toEqual(["b"]);
  });
});

describe("botão de emergência", () => {
  it("bloqueia aprovação e tarefa, interrompe o que roda, e libera ao desligar", () => {
    const { brain } = mk();
    const id = brain.addProposal(prop())!;
    const runId = brain.assignTask("guardiao", "conciliar");
    brain.setKill(true);
    expect(() => brain.decide(id, "aprovada")).toThrowError(/emergência/);
    expect(() => brain.assignTask("pagar", "x")).toThrowError(/emergência/);
    expect((brain.db.prepare("select status from agent_runs where id = ?").get(runId) as { status: string }).status).toBe("error");
    expect(brain.runtime().guardiao!.status).toBe("ocioso");
    brain.decide(id, "rejeitada"); // rejeitar continua permitido
    brain.setKill(false);
    expect(() => brain.assignTask("pagar", "x")).not.toThrow();
  });
});

describe("agentes", () => {
  it("pausar impede tarefa", () => {
    const { brain } = mk();
    brain.setPaused("sdr", true);
    expect(brain.runtime().sdr!.status).toBe("pausado");
    expect(() => brain.assignTask("sdr", "x")).toThrowError(/pausado/);
    brain.setPaused("sdr", false);
    expect(() => brain.assignTask("sdr", "x")).not.toThrow();
  });
  it("tarefa vira 'trabalhando' e volta a ocioso ao terminar, contando custo do dia", () => {
    const { brain } = mk();
    const r = brain.assignTask("metricas", "fechar o funil");
    expect(brain.runtime().metricas!.status).toBe("trabalhando");
    brain.finishRun(r, { status: "done", result: "Fechou.", costBrl: 0.2 });
    expect(brain.runtime().metricas).toMatchObject({ status: "ocioso", runsToday: 1, costBrl: 0.2, lastAction: "Fechou." });
  });
  it("agente desconhecido e tarefa vazia são recusados", () => {
    const { brain } = mk();
    expect(() => brain.assignTask("nao-existe", "x")).toThrowError(BrainError);
    expect(() => brain.assignTask("sdr", "  ")).toThrowError(BrainError);
  });
  it("o elenco inteiro (24) está no estado", () => expect(Object.keys(mk().brain.runtime())).toHaveLength(24));
});

describe("fuso", () => {
  it("dia de Brasília vira à meia-noite local, não UTC", () => {
    expect(brtDay(Date.parse("2026-10-16T02:30:00Z"))).toBe("2026-10-15");
    expect(brtDay(Date.parse("2026-10-16T03:30:00Z"))).toBe("2026-10-16");
  });
});
