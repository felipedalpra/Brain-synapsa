import { describe, expect, it } from "vitest";
import { openDb } from "../src/node-db";
import { finAddExtrato, finDetalhe, finIgnorarExtrato, finNovaVenda, finPainel } from "../src/fin";

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

describe("ignorar movimentação de outro negócio", () => {
  it("sai da DRE e do caixa, mas o saldo do banco continua somando tudo", () => {
    const db = openDb(":memory:");
    finAddExtrato(db, AGORA, [
      { data: "2026-11-04", descricao: "Pix recebido - X", valor: 547 },
      { data: "2026-11-04", descricao: "Pix enviado - Y", valor: -547 },
      { data: "2026-11-06", descricao: "Pix enviado - Z", valor: -50 },
    ]);
    const ids = (db.prepare("select id from fin_extrato order by id").all() as { id: number }[]).map((r) => r.id);
    finIgnorarExtrato(db, ids[0]!, true);
    finIgnorarExtrato(db, ids[1]!, true);
    const p = finPainel(db, AGORA);
    expect(p.kpis.entradasMes).toBe(0);
    expect(p.kpis.saidasMes).toBe(50);
    expect(valorDre(p, "(-) Outras Despesas")).toBe(50);
    expect(p.kpis.saldoInter).toBe(-50);
    finIgnorarExtrato(db, ids[0]!, false);
    expect(finPainel(db, AGORA).kpis.entradasMes).toBe(547);
  });
});

describe("faturas do Stripe", () => {
  it("trazem todos os clientes e substituem as contas 'Stripe' lançadas à mão", async () => {
    const { Brain } = await import("../src/brain");
    const { sincronizarFaturasStripe } = await import("../src/fin-stripe");
    const db = openDb(":memory:");
    const brain = new Brain(db, () => AGORA);
    db.prepare("insert into fin_contas (tipo, descricao, categoria, vencimento, valor, pago_em) values ('receber','Stripe','Recorrência (Mensalidade)','2026-11-05',45.96,'2026-11-05')".replace("pago_em)", "pago_em, criado_em)").replace("'2026-11-05')", "'2026-11-05', 1)")).run();
    const t = (d: string) => Math.floor(Date.parse(d) / 1000);
    const inv = (id: string, nome: string, d: string) => ({ id, customer: `cus_${id}`, customer_name: nome, customer_email: null, amount_paid: 4900, currency: "brl", created: t(d), status: "paid" });
    const f = (async () => new Response(JSON.stringify({ has_more: false, data: [inv("a", "Ana", "2026-11-03T12:00:00Z"), inv("b", "Beto", "2026-11-10T12:00:00Z"), inv("c", "Cris", "2026-11-12T12:00:00Z")] }))) as unknown as typeof fetch;
    const r = await sincronizarFaturasStripe(brain, { STRIPE_READ_KEY: "rk_test" }, f);
    expect(r.faturas).toBe(3);
    const p = finPainel(db, AGORA);
    expect(valorDre(p, "Receita bruta")).toBe(147);
  });
});
