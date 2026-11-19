import type { Brain } from "./brain";
import { brtDay } from "./brain";
import { rows, run, tx } from "./sql";

interface StripeInvoice {
  id: string;
  customer: string | null;
  customer_name: string | null;
  customer_email: string | null;
  amount_paid: number;
  currency: string;
  created: number;
  status: string;
  status_transitions?: { paid_at: number | null };
}

/** Lê as faturas pagas do Stripe (só GET, chave de leitura). */
export async function fetchFaturasPagas(key: string, f: typeof fetch = fetch): Promise<StripeInvoice[]> {
  const out: StripeInvoice[] = [];
  let after: string | undefined;
  for (let page = 0; page < 30; page++) {
    const qs = new URLSearchParams({ status: "paid", limit: "100" });
    if (after) qs.set("starting_after", after);
    const res = await f(`https://api.stripe.com/v1/invoices?${qs}`, { headers: { authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`stripe invoices: ${res.status}${res.status === 403 || res.status === 401 ? " (a chave de leitura precisa da permissão Invoices: leitura)" : ""}`);
    const body = (await res.json()) as { data: StripeInvoice[]; has_more: boolean };
    out.push(...body.data);
    if (!body.has_more || body.data.length === 0) break;
    after = body.data[body.data.length - 1]!.id;
  }
  return out;
}

/** Guarda uma linha por fatura paga, para a DRE por competência trazer todos os clientes do Stripe. */
export async function sincronizarFaturasStripe(brain: Brain, env: Record<string, string | undefined>, f: typeof fetch = fetch): Promise<{ ok: boolean; faturas: number; erro?: string }> {
  if (!env.STRIPE_READ_KEY) return { ok: false, faturas: 0, erro: "Sem STRIPE_READ_KEY." };
  try {
    const inv = (await fetchFaturasPagas(env.STRIPE_READ_KEY, f)).filter((i) => i.currency.toLowerCase() === "brl" && i.amount_paid > 0);
    const agora = brain.clock();
    tx(brain.db, () => {
      for (const i of inv) {
        const quando = (i.status_transitions?.paid_at ?? i.created) * 1000;
        run(brain.db, `insert into fin_stripe_fatura (id, cliente_id, nome, data, valor, atualizado_em) values (?, ?, ?, ?, ?, ?)
          on conflict(id) do update set cliente_id = excluded.cliente_id, nome = excluded.nome, data = excluded.data, valor = excluded.valor, atualizado_em = excluded.atualizado_em`,
          i.id, i.customer, i.customer_name || i.customer_email || i.customer || "Cliente Stripe", brtDay(quando), i.amount_paid / 100, agora);
      }
    });
    return { ok: true, faturas: inv.length };
  } catch (e) {
    return { ok: false, faturas: 0, erro: e instanceof Error ? e.message : String(e) };
  }
}

export interface FaturaRow { id: string; cliente_id: string | null; nome: string; data: string; valor: number }
export const faturasStripe = (db: Brain["db"]) => rows<FaturaRow>(db, "select id, cliente_id, nome, data, valor from fin_stripe_fatura order by data, id");
