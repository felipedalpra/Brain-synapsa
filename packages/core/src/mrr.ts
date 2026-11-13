import type { SubscriptionRow, SubSource } from "./types";

/** Subconjunto do objeto de assinatura do Stripe que usamos. */
export interface StripeSub {
  id: string;
  status: string;
  customer: string;
  items: { data: { quantity?: number; price: { unit_amount: number | null; recurring?: { interval: string; interval_count?: number } } }[] };
  discounts?: StripeDiscount[];
}

type Coupon = { percent_off?: number | null; amount_off?: number | null; duration?: string };
/** Desconto do Stripe. Nas versões novas da API o cupom vem em `source.coupon`; nas antigas, em `coupon`. */
export interface StripeDiscount {
  coupon?: Coupon | string | null;
  source?: { type?: string; coupon?: Coupon | string | null } | null;
  end?: number | null;
}

const couponOf = (d: StripeDiscount): Coupon | null => {
  const c = d.source?.coupon ?? d.coupon;
  return c && typeof c === "object" ? c : null;
};

const ACTIVE = new Set(["active", "trialing", "past_due"]);

/** Valor mensal de tabela, em reais. Anual divide por 12. */
export function listMonthlyBrl(sub: StripeSub): number {
  let cents = 0;
  for (const it of sub.items.data) {
    const unit = it.price.unit_amount ?? 0;
    const qty = it.quantity ?? 1;
    const interval = it.price.recurring?.interval ?? "month";
    const count = it.price.recurring?.interval_count ?? 1;
    const months = interval === "year" ? 12 * count : interval === "month" ? count : interval === "week" ? count / 4.345 : 1;
    cents += (unit * qty) / months;
  }
  return round2(cents / 100);
}

/** Valor mensal efetivo: tabela com o desconto aplicado. */
export function effectiveMonthlyBrl(sub: StripeSub): number {
  let value = listMonthlyBrl(sub);
  for (const d of sub.discounts ?? []) {
    const c = couponOf(d);
    if (!c) continue;
    if (c.percent_off) value *= 1 - c.percent_off / 100;
    else if (c.amount_off) value -= c.amount_off / 100;
  }
  return round2(Math.max(value, 0));
}

/** Quando o desconto acaba (ISO) ou null se não houver prazo. */
export function discountEndsAt(sub: StripeSub): string | null {
  const ends = (sub.discounts ?? []).map((d) => d.end).filter((e): e is number => typeof e === "number");
  if (ends.length === 0) return null;
  return new Date(Math.min(...ends) * 1000).toISOString();
}

export function stripeToRow(sub: StripeSub): SubscriptionRow {
  return {
    source: "stripe",
    external_id: sub.id,
    professional_id: null,
    label: sub.customer,
    list_price_brl: listMonthlyBrl(sub),
    effective_price_brl: effectiveMonthlyBrl(sub),
    discount_ends_at: discountEndsAt(sub),
    status: sub.status,
  };
}

export function isActive(row: Pick<SubscriptionRow, "status">): boolean {
  return ACTIVE.has(row.status);
}

/** MRR efetivo somando apenas assinaturas ativas, por fonte e total. */
export function mrrBySource(rows: SubscriptionRow[]): { bySource: Record<SubSource, { mrr: number; count: number }>; total: number } {
  const bySource: Record<SubSource, { mrr: number; count: number }> = {
    stripe: { mrr: 0, count: 0 },
    platform: { mrr: 0, count: 0 },
    manual: { mrr: 0, count: 0 },
    pix: { mrr: 0, count: 0 },
  };
  for (const r of rows) {
    if (!isActive(r)) continue;
    bySource[r.source].mrr = round2(bySource[r.source].mrr + r.effective_price_brl);
    bySource[r.source].count += 1;
  }
  // A plataforma é espelho: as assinaturas do Stripe já aparecem nela. Total = stripe + manual + pix.
  const total = round2(bySource.stripe.mrr + bySource.manual.mrr + bySource.pix.mrr);
  return { bySource, total };
}

export interface Divergence {
  external_id: string;
  stripe_brl: number | null;
  platform_brl: number | null;
}

/** Compara Stripe com o que a plataforma registra como assinatura paga por Stripe. */
export function reconcile(stripeRows: SubscriptionRow[], platformRows: SubscriptionRow[], toleranceBrl = 0.5): Divergence[] {
  const s = new Map(stripeRows.filter(isActive).map((r) => [r.external_id, r.effective_price_brl]));
  const p = new Map(platformRows.filter(isActive).map((r) => [r.external_id, r.effective_price_brl]));
  const out: Divergence[] = [];
  for (const id of new Set([...s.keys(), ...p.keys()])) {
    const a = s.get(id) ?? null;
    const b = p.get(id) ?? null;
    if (a === null || b === null || Math.abs(a - b) > toleranceBrl) out.push({ external_id: id, stripe_brl: a, platform_brl: b });
  }
  return out;
}

export interface EndingDiscount {
  row: SubscriptionRow;
  days_left: number;
  mrr_gain_brl: number; // quanto o MRR sobe se o cliente ficar
}

/** Assinaturas cujo desconto termina nos próximos `windowDays` dias. */
export function endingDiscounts(rows: SubscriptionRow[], now: Date, windowDays: number): EndingDiscount[] {
  const out: EndingDiscount[] = [];
  for (const r of rows) {
    if (!isActive(r) || !r.discount_ends_at) continue;
    const ms = new Date(r.discount_ends_at).getTime() - now.getTime();
    const days = Math.ceil(ms / 86_400_000);
    if (days < 0 || days > windowDays) continue;
    out.push({ row: r, days_left: days, mrr_gain_brl: round2(r.list_price_brl - r.effective_price_brl) });
  }
  return out.sort((a, b) => a.days_left - b.days_left);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
