import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchStripeSubs, planGuardiao } from "../src/guardiao";
import { stripeToRow } from "../src/mrr";

const stripeSub = (id: string, endUnix: number) => ({
  id,
  status: "active",
  customer: `cus_${id}`,
  items: { data: [{ quantity: 1, price: { unit_amount: 11900, recurring: { interval: "month" } } }] },
  discounts: [{ coupon: { amount_off: 7000 }, end: endUnix }],
});

afterEach(() => vi.unstubAllGlobals());

describe("Guardião de Dados (núcleo)", () => {
  it("lê o Stripe só com GET e cria contato de retenção sem oferecer desconto", async () => {
    const methods: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init?: RequestInit) => {
        methods.push(init?.method ?? "GET");
        return Response.json({ data: [stripeSub("sub_a", Math.floor(new Date("2027-01-23T12:00:00Z").getTime() / 1000))], has_more: false });
      }),
    );
    const subs = await fetchStripeSubs("rk_test");
    expect(methods.every((m) => m === "GET")).toBe(true);
    const stripeRows = subs.map(stripeToRow);
    const plan = planGuardiao({ stripeRows, others: [], all: stripeRows, now: new Date("2026-12-24T12:00:00Z"), windowDays: 30, day: "2026-12-24" });
    expect(plan.proposals).toHaveLength(1);
    expect(plan.proposals[0]!.kind).toBe("retencao_fim_desconto");
    expect(plan.proposals[0]!.channel).toBe("tarefa");
    expect(JSON.stringify(plan.proposals[0])).not.toMatch(/cupom|promo[çc]ão/i);
  });

  it("sem desconto acabando não propõe nada", () => {
    const plan = planGuardiao({ stripeRows: [], others: [], all: [], now: new Date("2026-12-24T12:00:00Z"), windowDays: 30, day: "2026-12-24" });
    expect(plan.proposals).toHaveLength(0);
  });
});
