import { endingDiscounts, reconcile, type StripeDiscount, type StripeSub } from "./mrr";
import type { AlertInsert, ProposalInsert, SubscriptionRow } from "./types";

const AGENT_ID = "guardiao-de-dados";

/** Lê todas as assinaturas do Stripe com a chave de leitura. Só faz GET. */
export async function fetchStripeSubs(key: string): Promise<StripeSub[]> {
  const out: StripeSub[] = [];
  let after: string | undefined;
  for (let page = 0; page < 50; page++) {
    const qs = new URLSearchParams({ status: "all", limit: "100" });
    qs.append("expand[]", "data.discounts");
    qs.append("expand[]", "data.discount");
    qs.append("expand[]", "data.discounts.source.coupon");
    qs.append("expand[]", "data.discount.source.coupon");
    if (after) qs.set("starting_after", after);
    const res = await fetch(`https://api.stripe.com/v1/subscriptions?${qs}`, { headers: { authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`stripe subscriptions: ${res.status}`);
    const body = (await res.json()) as { data: (StripeSub & { discount?: StripeDiscount })[]; has_more: boolean };
    for (const s of body.data) {
      const discounts = s.discounts && s.discounts.length > 0 ? s.discounts : s.discount ? [s.discount] : [];
      out.push({ ...s, discounts });
    }
    if (!body.has_more || body.data.length === 0) break;
    after = body.data[body.data.length - 1]!.id;
  }
  return out;
}

export interface GuardiaoPlan {
  proposals: ProposalInsert[];
  alerts: AlertInsert[];
}

/** Regra do Guardião, pura: recebe as assinaturas e devolve alertas e propostas. Usada pelo Worker e pelo servidor local. */
export function planGuardiao(i: { stripeRows: SubscriptionRow[]; others: SubscriptionRow[]; all: SubscriptionRow[]; now: Date; windowDays: number; day: string }): GuardiaoPlan {
  const { stripeRows, others, all, now, windowDays, day } = i;
  const proposals: ProposalInsert[] = [];
  const alerts: AlertInsert[] = [];

  // 1) Divergência Stripe x plataforma (só roda quando a plataforma já espelha assinaturas).
  const platformRows = others.filter((r) => r.source === "platform");
  if (platformRows.length > 0) {
    for (const d of reconcile(stripeRows, platformRows)) {
      const diff = Math.abs((d.stripe_brl ?? 0) - (d.platform_brl ?? 0));
      alerts.push({ kind: "divergencia_receita", severity: "atencao", ref: d.external_id, payload: { ...d }, dedupe_key: `div:${d.external_id}:${day}` });
      proposals.push({
        agent_id: AGENT_ID,
        kind: "divergencia_receita",
        title: `Conferir assinatura ${d.external_id}: Stripe e plataforma não batem`,
        payload: { ...d },
        impacto_brl: diff,
        risk: "baixo",
        channel: "interno",
        dedupe_key: `div:${d.external_id}:${day}`,
      });
    }
  }

  // 2) Fim de desconto em até N dias: contato de retenção para o Felipe. Nunca oferece desconto.
  for (const e of endingDiscounts(all, now, windowDays)) {
    const endDay = e.row.discount_ends_at!.slice(0, 10);
    const key = `fim_desconto:${e.row.source}:${e.row.external_id}:${endDay}`;
    alerts.push({ kind: "fim_desconto", severity: "info", ref: e.row.external_id, payload: { termina_em: endDay, dias: e.days_left }, dedupe_key: key });
    proposals.push({
      agent_id: AGENT_ID,
      kind: "retencao_fim_desconto",
      title: `Desconto termina em ${e.days_left} dias (${endDay}): falar com o cliente antes do reajuste`,
      payload: {
        fonte: e.row.source,
        assinatura: e.row.external_id,
        preco_atual_brl: e.row.effective_price_brl,
        preco_cheio_brl: e.row.list_price_brl,
        regra: "nao oferecer desconto",
      },
      impacto_brl: Math.round(e.row.list_price_brl * 12 * 100) / 100,
      risk: "medio",
      channel: "tarefa",
      dedupe_key: key,
    });
  }
  return { proposals, alerts };
}
