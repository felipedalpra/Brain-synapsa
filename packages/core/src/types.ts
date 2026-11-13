export type SubSource = "stripe" | "platform" | "manual" | "pix";

export interface SubscriptionRow {
  source: SubSource;
  external_id: string;
  professional_id: string | null;
  label: string | null;
  list_price_brl: number;
  effective_price_brl: number; // por mês, depois do desconto
  discount_ends_at: string | null; // ISO
  status: string;
}

export interface ProposalInsert {
  agent_id: string;
  kind: string;
  title: string;
  payload: Record<string, unknown>;
  impacto_brl: number;
  risk: "baixo" | "medio" | "alto";
  channel: "tarefa" | "interno";
  dedupe_key: string;
}

export interface AlertInsert {
  kind: string;
  severity: "info" | "atencao" | "critico";
  ref: string;
  payload: Record<string, unknown>;
  dedupe_key: string;
}
