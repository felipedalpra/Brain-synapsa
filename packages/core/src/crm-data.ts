import { CrmError, crmClient, type Lead } from "./crm";

type Env = Record<string, string | undefined>;

export const FONTES_CRM = ["crm_resumo", "crm_leads", "crm_atividades", "crm_reunioes", "crm_funil"] as const;

// Filtros aceitos por cada lista, conforme o OpenAPI do CRM.
const FILTROS: Record<string, string[]> = {
  crm_leads: ["search", "status", "origin", "responsible_id", "classification", "lead_type", "created_from", "created_to", "sort", "order"],
  crm_atividades: ["lead_id", "status", "type", "responsible_id", "scheduled_from", "scheduled_to"],
  crm_reunioes: ["lead_id", "status", "scheduled_from", "scheduled_to"],
  crm_resumo: ["from", "to", "stale_days"],
  crm_funil: ["from", "to"],
};

// Campos que o CRM devolve para leads. Telefone, e-mail e Instagram não vão para a IA: só se existem.
const LEAD_CAMPOS = ["id", "name", "lead_type", "origin", "responsible_id", "classification", "status", "position", "next_action", "follow_up_date", "lead_score", "last_interaction_at", "plan_interest", "professionals_count", "current_system", "main_challenge", "decision_timeline", "is_decision_maker", "created_at", "updated_at"];

export function leadSeguro(l: Lead): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of LEAD_CAMPOS) if (l[k] !== undefined) out[k] = l[k];
  out.tem_telefone = !!l.phone;
  out.tem_email = !!l.email;
  out.tem_instagram = !!l.instagram;
  return out;
}

const limpar = (fonte: string, f: Record<string, unknown> | undefined) => {
  const ok = new Set(FILTROS[fonte] ?? []);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(f ?? {})) if (ok.has(k) && (typeof v === "string" || typeof v === "number")) out[k] = String(v).slice(0, 100);
  return out;
};

const NAO_CONFIGURADO = { indisponivel: "O CRM não está conectado: faltam SYNAPSA_CRM_API_KEY e SYNAPSA_CRM_API_BASE_URL nos secrets do Brain." };

/** Leitura do CRM para o Jarvis e os agentes. Só GET, sem telefone nem e-mail, sem escrita. */
export async function crmDados(env: Env, fonte: string, opts: { filtros?: Record<string, unknown>; pagina?: number; tamanho?: number } = {}, f: typeof fetch = fetch): Promise<unknown> {
  const cli = crmClient(env, f);
  if (!cli) return NAO_CONFIGURADO;
  const filtros = limpar(fonte, opts.filtros);
  const page = Math.max(1, Math.round(opts.pagina ?? 1));
  const page_size = Math.min(Math.max(Math.round(opts.tamanho ?? 25), 1), 50);
  try {
    switch (fonte) {
      case "crm_resumo": {
        const [overview, stages, summary] = await Promise.all([cli.overview({ stale_days: 7, ...filtros }), cli.stages(), cli.pipelineSummary({ from: filtros.from, to: filtros.to })]);
        return { visao_geral: overview.data, etapas_do_funil: stages.data, resumo_do_pipeline: summary.data, fonte: "CRM Synapsa (leitura)" };
      }
      case "crm_leads": {
        const r = await cli.leads({ ...filtros, page, page_size });
        return { leads: r.data.map(leadSeguro), pagina: r.meta.page, por_pagina: r.meta.page_size, total: r.meta.total, total_de_paginas: r.meta.total_pages, observacao: "Telefone, e-mail e Instagram ficam fora desta leitura." };
      }
      case "crm_atividades": {
        const r = await cli.activities({ ...filtros, page, page_size });
        return { atividades: r.data, pagina: r.meta.page, total: r.meta.total, total_de_paginas: r.meta.total_pages };
      }
      case "crm_reunioes": {
        const r = await cli.meetings({ ...filtros, page, page_size });
        return { reunioes: r.data, pagina: r.meta.page, total: r.meta.total, total_de_paginas: r.meta.total_pages };
      }
      case "crm_funil": {
        const [funil, evolucao] = await Promise.all([cli.funnel(filtros), cli.pipelineEvolution(filtros)]);
        return { funil: funil.data, evolucao: evolucao.data };
      }
      default:
        throw new Error(`Fonte do CRM desconhecida: ${fonte}.`);
    }
  } catch (e) {
    if (e instanceof CrmError) throw new Error(`${e.message}${e.requestId ? ` (request_id ${e.requestId})` : ""}`);
    throw e;
  }
}
