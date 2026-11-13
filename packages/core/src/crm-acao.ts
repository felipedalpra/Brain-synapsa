// Escritas no CRM pedidas pelo Jarvis. Ele só PROPÕE; esta função roda quando o Felipe clica em confirmar.
// Nunca exclui nada. Falhas citam campo e regra, nunca valores.
import type { JarvisAction } from "@brain/shared";
import { CRM_CONTRACT } from "./crm-contract";
import { validar } from "./crm-validate";
import { BrainError } from "./brain";
import { CrmError, crmClient, type NewActivity, type NewLead, type NewMeeting, type StageMove } from "./crm";

export const CRM_OPS = ["criar_lead", "mover_etapa", "registrar_atividade", "agendar_reuniao"] as const;
type Op = (typeof CRM_OPS)[number];
type CrmAcao = Extract<JarvisAction, { type: "crm" }>;

const CONTRATO = { criar_lead: "CreateLead", mover_etapa: "MoveStage", registrar_atividade: "CreateActivity", agendar_reuniao: "CreateMeeting" } as const;

/** Corpo que vai ao CRM (mover_etapa separa o id do lead do resto). */
function corpo(op: Op, dados: Record<string, unknown>): { id?: string; body: Record<string, unknown> } {
  if (op !== "mover_etapa") return { body: dados };
  const { lead_id, ...resto } = dados;
  return { id: typeof lead_id === "string" ? lead_id : undefined, body: resto };
}

/** Lista de problemas (vazia = pode propor). Não toca na rede. */
export function validarProposta(op: Op, dados: Record<string, unknown>): string[] {
  const { id, body } = corpo(op, dados);
  const erros = validar(CRM_CONTRACT[CONTRATO[op]] as any, body);
  if (op === "mover_etapa" && !id) erros.push("lead_id: obrigatório");
  return erros;
}

export async function executarCrm(env: Record<string, string | undefined>, f: typeof fetch, a: CrmAcao): Promise<string> {
  const erros = validarProposta(a.op, a.dados);
  if (erros.length) throw new BrainError("invalid", `O CRM recusaria isso: ${erros.slice(0, 5).join("; ")}.`);
  const crm = crmClient(env, f);
  if (!crm) throw new BrainError("invalid", "O CRM não está conectado (faltam as variáveis da API).");
  const o = { idempotencyKey: `mega-brain-confirm-${a.chave}` };
  const { id, body } = corpo(a.op, a.dados);
  try {
    switch (a.op) {
      case "criar_lead": await crm.createLead(body as unknown as NewLead, o); return "Lead cadastrado no CRM.";
      case "mover_etapa": await crm.moveLeadStage(id!, body as unknown as StageMove, o); return "Lead movido de etapa no CRM.";
      case "registrar_atividade": await crm.createActivity(body as unknown as NewActivity, o); return "Atividade registrada no CRM.";
      case "agendar_reuniao": await crm.createMeeting(body as unknown as NewMeeting, o); return "Reunião agendada no CRM.";
    }
  } catch (e) {
    if (e instanceof CrmError) throw new BrainError("invalid", e.message);
    throw e;
  }
}
