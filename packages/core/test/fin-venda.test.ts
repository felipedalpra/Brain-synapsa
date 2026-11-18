import { describe, expect, it } from "vitest";
import { openDb } from "../src/node-db";
import { finNovaVenda, finPainel } from "../src/fin";

const AGORA = Date.parse("2026-11-17T15:00:00Z");

describe("nova venda", () => {
  it("clínica de R$ 230 com primeiro mês em duas parcelas", () => {
    const db = openDb(":memory:");
    const r = finNovaVenda(db, AGORA, {
      cliente: "Clínica Teste",
      valorMensal: 230,
      inicio: "2026-11-17",
      parcelas: [
        { valor: 115, pagoEm: "2026-11-17" },
        { valor: 115, pagoEm: null, vencimento: "2026-11-30", nota: "na entrega" },
      ],
    });
    expect(r.mrr).toBe(true);
    expect(r.contas).toBe(2 + 11);
    const p = finPainel(db, AGORA);
    expect(p.kpis.mrr).toBe(230);
    expect(p.kpis.clientesAtivos).toBe(1);
    expect(p.kpis.entradasMes).toBe(115);
    expect(p.aReceber.some((c) => c.valor === 115 && c.vencimento === "2026-11-30")).toBe(true);
    expect(p.aReceber.filter((c) => c.valor === 230).length).toBe(11);
  });
  it("rejeita parcelas que não fecham e cliente repetido", () => {
    const db = openDb(":memory:");
    expect(() => finNovaVenda(db, AGORA, { cliente: "A", valorMensal: 230, inicio: "2026-11-17", parcelas: [{ valor: 100 }, { valor: 100 }] })).toThrow();
    finNovaVenda(db, AGORA, { cliente: "A", valorMensal: 100, inicio: "2026-11-17" });
    expect(() => finNovaVenda(db, AGORA, { cliente: "a", valorMensal: 100, inicio: "2026-11-17" })).toThrow();
  });
  it("venda única com setup não entra no MRR", () => {
    const db = openDb(":memory:");
    const r = finNovaVenda(db, AGORA, { cliente: "Projeto X", valorMensal: 500, inicio: "2026-11-17", recorrente: false, taxaSetup: 200, taxaSetupPaga: true });
    expect(r.contas).toBe(2);
    const p = finPainel(db, AGORA);
    expect(p.kpis.mrr).toBe(0);
    expect(p.kpis.entradasMes).toBe(200);
  });
});
