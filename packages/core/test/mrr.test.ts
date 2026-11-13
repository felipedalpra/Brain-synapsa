import { describe, expect, it } from "vitest";
import { discountEndsAt, effectiveMonthlyBrl, endingDiscounts, listMonthlyBrl, mrrBySource, reconcile, stripeToRow, type StripeSub } from "../src/mrr";
import type { SubscriptionRow } from "../src/types";

const sub = (over: Partial<StripeSub> = {}): StripeSub => ({
  id: "sub_1",
  status: "active",
  customer: "cus_1",
  items: { data: [{ quantity: 1, price: { unit_amount: 11900, recurring: { interval: "month" } } }] },
  discounts: [],
  ...over,
});

const row = (over: Partial<SubscriptionRow> = {}): SubscriptionRow => ({
  source: "stripe",
  external_id: "sub_1",
  professional_id: null,
  label: null,
  list_price_brl: 119,
  effective_price_brl: 79,
  discount_ends_at: null,
  status: "active",
  ...over,
});

describe("valor mensal", () => {
  it("tabela de R$ 119", () => expect(listMonthlyBrl(sub())).toBe(119));
  it("plano anual vira mensal", () => {
    const s = sub({ items: { data: [{ price: { unit_amount: 119000, recurring: { interval: "year" } } }] } });
    expect(listMonthlyBrl(s)).toBe(99.17);
  });
  it("desconto em valor: R$ 119 com R$ 40 off vira R$ 79", () => {
    expect(effectiveMonthlyBrl(sub({ discounts: [{ coupon: { amount_off: 4000 } }] }))).toBe(79);
  });
  it("desconto percentual", () => {
    expect(effectiveMonthlyBrl(sub({ discounts: [{ coupon: { percent_off: 50 } }] }))).toBe(59.5);
  });
  it("desconto nunca deixa o valor negativo", () => {
    expect(effectiveMonthlyBrl(sub({ discounts: [{ coupon: { amount_off: 99999 } }] }))).toBe(0);
  });
});

describe("fim do desconto", () => {
  it("pega a data mais próxima", () => {
    const s = sub({ discounts: [{ coupon: { amount_off: 4000 }, end: 1_800_000_000 }, { coupon: { amount_off: 1000 }, end: 1_700_000_000 }] });
    expect(discountEndsAt(s)).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });
  it("sem prazo devolve null", () => expect(discountEndsAt(sub({ discounts: [{ coupon: { amount_off: 4000 } }] }))).toBeNull());
  it("converte para linha de assinatura", () => {
    const r = stripeToRow(sub({ discounts: [{ coupon: { amount_off: 7000 }, end: 1_800_000_000 }] }));
    expect(r.list_price_brl).toBe(119);
    expect(r.effective_price_brl).toBe(49);
  });
});

describe("MRR", () => {
  it("soma Stripe + manual + Pix pelo valor efetivo e ignora canceladas e a plataforma", () => {
    const rows = [
      row({ external_id: "a", effective_price_brl: 49 }),
      row({ external_id: "b", effective_price_brl: 49 }),
      row({ external_id: "c", effective_price_brl: 49 }),
      row({ source: "pix", external_id: "p1", effective_price_brl: 49, list_price_brl: 119 }),
      row({ source: "pix", external_id: "p2", effective_price_brl: 300, list_price_brl: 300 }),
      row({ source: "platform", external_id: "a", effective_price_brl: 49 }),
      row({ external_id: "x", effective_price_brl: 79, status: "canceled" }),
    ];
    const r = mrrBySource(rows);
    expect(r.total).toBe(496); // bate com o MRR de R$ 496 informado
    expect(r.bySource.stripe.count).toBe(3);
  });
});

describe("conciliação", () => {
  it("aponta valor diferente e assinatura que falta de um lado", () => {
    const stripe = [row({ external_id: "a", effective_price_brl: 49 }), row({ external_id: "b", effective_price_brl: 79 })];
    const plat = [row({ source: "platform", external_id: "a", effective_price_brl: 119 }), row({ source: "platform", external_id: "c", effective_price_brl: 49 })];
    const ids = reconcile(stripe, plat).map((d) => d.external_id).sort();
    expect(ids).toEqual(["a", "b", "c"]);
  });
  it("não aponta quando bate", () => {
    expect(reconcile([row({ effective_price_brl: 49 })], [row({ source: "platform", effective_price_brl: 49 })])).toEqual([]);
  });
});

describe("descontos que acabam", () => {
  const now = new Date("2026-12-24T12:00:00Z");
  it("avisa 30 dias antes e calcula o ganho de MRR", () => {
    const r = [row({ external_id: "a", effective_price_brl: 49, discount_ends_at: "2027-01-23T12:00:00Z" })];
    const out = endingDiscounts(r, now, 30);
    expect(out).toHaveLength(1);
    expect(out[0]!.days_left).toBe(30);
    expect(out[0]!.mrr_gain_brl).toBe(70);
  });
  it("não avisa antes da janela nem depois de vencer", () => {
    const r = [row({ external_id: "a", discount_ends_at: "2027-03-02T12:00:00Z" }), row({ external_id: "b", discount_ends_at: "2026-12-01T12:00:00Z" })];
    expect(endingDiscounts(r, now, 30)).toEqual([]);
  });
});
