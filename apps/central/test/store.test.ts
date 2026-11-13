import { describe, expect, it } from "vitest";
import { initial, reducer } from "../src/store";

const now = Date.UTC(2026, 9, 15, 15, 0);

describe("store", () => {
  it("aprovar em massa só mexe em risco baixo e não envia nada", () => {
    const s0 = initial(now);
    const s1 = reducer(s0, { t: "exec", a: { type: "approve_low_risk" }, at: now });
    const medio = s1.proposals.filter((p) => p.risk !== "baixo");
    expect(medio.every((p) => p.status === "pendente")).toBe(true);
    expect(s1.proposals.filter((p) => p.risk === "baixo").every((p) => p.status === "aprovada")).toBe(true);
  });

  it("com o kill switch ligado ninguém aprova", () => {
    let s = initial(now);
    s = reducer(s, { t: "kill", on: true, at: now });
    const id = s.proposals[0]!.id;
    const s2 = reducer(s, { t: "decide", id, to: "aprovada", at: now });
    expect(s2.proposals.find((p) => p.id === id)?.status).toBe("pendente");
    expect(Object.values(s.runtime).some((r) => r.status === "trabalhando")).toBe(false);
  });

  it("tarefa concluída de agente que propõe cria proposta na fila", () => {
    const s0 = initial(now);
    const s1 = reducer(s0, { t: "task_done", agentId: "conteudo", task: "pauta da semana", at: now });
    expect(s1.proposals.length).toBe(s0.proposals.length + 1);
    expect(s1.runtime.conteudo?.status).toBe("ocioso");
  });
});
