import { describe, expect, it } from "vitest";
import { respond, findAgent, type BrainView } from "../src/jarvis";
import { DEMO_METRICS, mockIntegrations, mockProposals, mockRuntime } from "../src/demo";

const now = Date.UTC(2026, 9, 15, 15, 0);
const view = (over: Partial<BrainView> = {}): BrainView => {
  return { now, runtime: mockRuntime(now), proposals: mockProposals(now), integrations: mockIntegrations(), kill: false, metrics: DEMO_METRICS, ...over };
};

describe("Jarvis", () => {
  it("reconhece agentes pelo nome e pelo apelido", () => {
    expect(findAgent("peça ao guardião para conciliar")?.id).toBe("guardiao");
    expect(findAgent("como está a mídia paga?")?.id).toBe("midia");
    expect(findAgent("o que o closer fez")?.id).toBe("closer");
    expect(findAgent("bom dia")).toBeUndefined();
  });

  it("responde o MRR com os números certos", () => {
    const text = respond("como está o MRR?", view()).text.replace(/\u00a0/g, " ");
    expect(text).toContain("R$ 496");
    expect(text).toContain("R$ 704");
  });

  it("dar tarefa devolve ação, não texto solto", () => {
    const r = respond("peça ao Guardião para conciliar a base", view());
    expect(r.action).toMatchObject({ type: "task", agentId: "guardiao" });
  });

  it("não dá tarefa com o kill switch ligado", () => {
    const r = respond("peça ao Guardião para conciliar a base", view({ kill: true }));
    expect(r.action).toBeUndefined();
    expect(r.text).toMatch(/emergência/);
  });

  it("parar tudo exige confirmação e nunca executa sozinho", () => {
    const r = respond("pare tudo", view());
    expect(r.action).toBeUndefined();
    expect(r.confirm?.action.type).toBe("kill_on");
  });

  it("aprovar as de baixo risco pede confirmação e informa o impacto", () => {
    const r = respond("aprove as de baixo risco", view());
    expect(r.confirm?.action.type).toBe("approve_low_risk");
    expect(r.text).toMatch(/baixo risco/);
  });

  it("pausar um agente é imediato", () => {
    expect(respond("pause a mídia paga", view()).action).toEqual({ type: "pause", agentId: "midia" });
  });

  it("nenhum agente oferece desconto: a resposta sobre descontos reafirma isso", () => {
    expect(respond("e os descontos?", view()).text).toMatch(/Nenhum agente oferece desconto/);
  });
});

describe("Jarvis sem funil", () => {
  it("diz que não tem o funil quando a plataforma não liga o Brain", () => {
    const r = respond("como está o funil?", view({ metrics: { ...DEMO_METRICS, funil: null } }));
    expect(r.text).toMatch(/plataforma não está mandando/);
  });
  it("MRR não cita limite de pacientes sem funil", () => {
    expect(respond("mrr", view({ metrics: { ...DEMO_METRICS, funil: null } })).text).not.toMatch(/limite de pacientes/);
  });
});
