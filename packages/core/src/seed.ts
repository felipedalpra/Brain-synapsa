import { AGENTS, mockActivity, mockProposals } from "@brain/shared";
import type { Brain } from "./brain";
import { row, run } from "./sql";

/**
 * Assinaturas que o Felipe informou na conversa. Marcadas como `informado`:
 * quando o Stripe sincronizar de verdade, as linhas de Stripe informadas saem de cena.
 * Os ids de Stripe aqui são provisórios. Datas de fim de desconto vêm do que ele disse.
 */
export function seedKnownFacts(brain: Brain): void {
  const has = row<{ n: number }>(brain.db, "select count(*) as n from subscriptions")?.n ?? 0;
  if (has > 0) return;
  const now = brain.clock();
  const ins = (source: string, id: string, label: string, list: number, eff: number, ends: string | null) =>
    run(brain.db, "insert into subscriptions (source, external_id, label, list_price_brl, effective_price_brl, discount_ends_at, status, origin, updated_at) values (?, ?, ?, ?, ?, ?, 'active', 'informado', ?)", source, id, label, list, eff, ends, now);
  ins("stripe", "informado-stripe-1", "Assinatura Stripe 1 (informada)", 119, 49, "2027-01-23T12:00:00-03:00");
  ins("stripe", "informado-stripe-2", "Assinatura Stripe 2 (informada)", 119, 49, "2027-01-23T12:00:00-03:00");
  ins("stripe", "informado-stripe-3", "Assinatura Stripe 3 (informada)", 119, 49, "2027-03-02T12:00:00-03:00");
  ins("pix", "pix-mirelle", "Mirelle (Pix)", 119, 49, null);
  ins("pix", "pix-antera", "Clínica Antera (Pix)", 300, 300, null);
}

/** Modo demonstração: popula a fila e a atividade com o mesmo enredo da prévia. Só quando o banco está vazio. */
export function seedDemo(brain: Brain): void {
  if ((row<{ n: number }>(brain.db, "select count(*) as n from proposals")?.n ?? 0) > 0) return;
  const now = brain.clock();
  for (const a of mockActivity(now).reverse()) run(brain.db, "insert into activity (agent_id, text, tone, at) values (?, ?, ?, ?)", a.agentId, a.text, a.tone, a.at);
  for (const p of mockProposals(now)) {
    run(
      brain.db,
      "insert into proposals (id, agent_id, kind, title, draft, why, impacto_brl, risk, channel, status, review, payload, created_at) values (?, ?, 'demo', ?, ?, ?, ?, ?, ?, 'pendente', ?, '{}', ?)",
      p.id, p.agentId, p.title, p.draft, p.why, p.impactoBrl, p.risk, p.channel, p.review, p.at,
    );
  }
  for (const g of AGENTS) {
    const last = mockActivity(now).find((x) => x.agentId === g.id);
    if (last) run(brain.db, "update agent_state set last_action = ?, last_at = ? where agent_id = ?", last.text, last.at, g.id);
  }
}
