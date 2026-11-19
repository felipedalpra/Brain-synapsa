import { describe, expect, it } from "vitest";
import { openDb } from "../src/node-db";
import { finAddExtrato, finDetalhe, finNovaVenda, finPainel } from "../src/fin";

const AGORA = Date.parse("2026-11-17T15:00:00Z");
const valorDre = (p: ReturnType<typeof finPainel>, label: string) => p.dre.linhas.find((l) => l.label === label)!.valores.at(-1)!;

describe("DRE por competência", () => {
  it("receita é o que foi lançado no mês, recebido ou não; entrada do extrato sem lançamento fica fora", () => {
    const db = openDb(":memory:");
    finNovaVenda(db, AGORA, { cliente: "Clínica Teste", valorMensal: 230, inicio: "2026-11-17", parcelas: [{ valor: 115, pagoEm: "2026-11-17" }, { valor: 115, pagoEm: null, vencimento: "2026-11-30" }] });
    // Pix de outra empresa, só no extrato, sem lançamento
    finAddExtrato(db, AGORA, [{ data: "2026-11-04", descricao: "Pix recebido - Outra Empresa", valor: 547 }]);
    const p = finPainel(db, AGORA);
    // competência: as duas parcelas vencem em novembro, mesmo a 2ª ainda não recebida
    expect(valorDre(p, "Receita bruta")).toBe(230);
    // caixa continua mostrando o que entrou de fato
    expect(p.kpis.entradasMes).toBe(115 + 547);
    const comp = finDetalhe(db, AGORA, "Receita bruta", "2026-11");
    expect(comp.total).toBe(230);
    expect(comp.itens.some((i) => i.desc.includes("Outra Empresa"))).toBe(false);
    expect(comp.itens.map((i) => i.situacao).sort()).toEqual(["a vencer", "pago"]);
    const caixa = finDetalhe(db, AGORA, "Receita bruta", "2026-11", "caixa");
    expect(caixa.total).toBe(662);
  });
});
