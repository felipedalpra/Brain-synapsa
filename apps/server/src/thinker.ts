import type { Agent } from "@brain/shared";
import type { Channel, Risk } from "@brain/shared";
import type { ProposalInput } from "./brain";
import { HANDLERS, type HandlerCtx, type HandlerResult } from "./handlers";
import { toolLoop, type LlmConfig, type ToolDef } from "./llm";
import { overview } from "./jarvis-llm";
import type { Thinker } from "./runner";

const RISKS: Risk[] = ["baixo", "medio", "alto"];
const CHANNELS: Channel[] = ["whatsapp", "email", "linkedin", "instagram", "tarefa", "interno"];

const systemFor = (a: Agent) => `Você é "${a.name}", um agente do Synapsa Brain, que opera a Synapsa (plataforma de IA para psicólogos no Brasil). Quem decide é o Felipe: você nunca envia nada, só prepara e propõe.

Sua missão: ${a.mission}
Métrica que você move: ${a.metric}
Você faz sozinho: ${a.auto.join("; ") || "nada"}.
Você propõe e espera a aprovação: ${a.aprova.join("; ") || "nada"}.
Só o Felipe faz: ${a.humano.join("; ") || "nada"}.
Limites: ${a.limits}
Subagentes de apoio (você os usa como etapas de raciocínio): ${a.subs.map((s) => `${s.name} (${s.does})`).join("; ")}.

Regras invioláveis:
- Nunca ofereça desconto, promoção ou preço diferente.
- Nunca prometa resultado clínico a pacientes nem cite dado clínico de ninguém.
- Mensagem externa precisa de contact_ref e respeita 3 dias entre contatos e consentimento. A Conformidade barra o que violar.
- Só use fatos das ferramentas. Sem dado, diga que não tem e proponha como conseguir.
- Texto em português do Brasil, direto e curto.
Termine sempre chamando "relatorio" com 1 ou 2 frases do que fez.`;

const TOOLS = (a: Agent): ToolDef[] => [
  { name: "contexto", description: "Estado atual do Brain (MRR, fila, agentes, integrações, atividade).", input_schema: { type: "object", properties: {} } },
  ...(HANDLERS[a.id] ? [{ name: "rodar_rotina", description: "Executa a rotina de código deste agente (leituras reais e cálculos).", input_schema: { type: "object", properties: {} } } as ToolDef] : []),
  {
    name: "propor",
    description: "Deixa uma proposta na fila do Felipe. Passa pela Conformidade antes.",
    input_schema: {
      type: "object",
      properties: {
        titulo: { type: "string" },
        por_que: { type: "string" },
        texto_pronto: { type: "string", description: "Mensagem pronta para o Felipe copiar. Vazio se não for mensagem." },
        impacto_brl: { type: "number", description: "Impacto estimado em reais por ano. 0 se não for medível." },
        risco: { type: "string", enum: RISKS },
        canal: { type: "string", enum: CHANNELS },
        contact_ref: { type: "string" },
      },
      required: ["titulo", "por_que", "risco", "canal"],
    },
  },
  { name: "relatorio", description: "Encerra a tarefa com o resumo do que foi feito.", input_schema: { type: "object", properties: { resumo: { type: "string" } }, required: ["resumo"] } },
];

/** Raciocínio de um agente: as fichas viram prompt, e tudo que ele quer fazer passa por ferramentas controladas. */
export function makeThinker(cfg: LlmConfig, fetchFn: typeof fetch = fetch): Thinker {
  return async (agent: Agent, task: string, ctx: HandlerCtx): Promise<HandlerResult> => {
    const spent = ctx.brain.metrics();
    if (spent.llmSpentMonthBrl >= spent.llmCapMonthlyBrl) return { status: "blocked", result: `Teto mensal de IA atingido (${spent.llmSpentMonthBrl} de ${spent.llmCapMonthlyBrl} reais). ${agent.name} só volta no mês que vem ou se você subir o teto.` };
    const proposals: ProposalInput[] = [];
    let report = "";
    let routine = "";
    const { cost, text } = await toolLoop(
      cfg,
      { system: systemFor(agent), messages: [{ role: "user", content: `Tarefa: ${task}` }], tools: TOOLS(agent), maxTokens: 1200, maxRounds: 8 },
      async (name, input) => {
        switch (name) {
          case "contexto":
            return JSON.stringify(overview(ctx.brain, []));
          case "rodar_rotina": {
            const h = HANDLERS[agent.id];
            if (!h) throw new Error("Este agente não tem rotina de código.");
            const r = await h(ctx);
            proposals.push(...(r.proposals ?? []));
            routine = r.result;
            return r.result;
          }
          case "propor": {
            const risk = RISKS.includes(input.risco as Risk) ? (input.risco as Risk) : "medio";
            const channel = CHANNELS.includes(input.canal as Channel) ? (input.canal as Channel) : "interno";
            proposals.push({
              agentId: agent.id,
              kind: "proposta_agente",
              title: String(input.titulo ?? "").slice(0, 160),
              why: String(input.por_que ?? "").slice(0, 600),
              draft: input.texto_pronto ? String(input.texto_pronto).slice(0, 1500) : null,
              impactoBrl: Math.max(0, Number(input.impacto_brl) || 0),
              risk,
              channel,
              contactRef: input.contact_ref ? String(input.contact_ref) : null,
              payload: { tarefa: task },
            });
            return "Proposta registrada para a Conformidade.";
          }
          case "relatorio":
            report = String(input.resumo ?? "");
            return "Relatório registrado.";
          default:
            throw new Error(`Ferramenta desconhecida: ${name}`);
        }
      },
      fetchFn,
    );
    return { status: "done", result: report || routine || text || "Concluiu.", proposals, costBrl: cost };
  };
}
