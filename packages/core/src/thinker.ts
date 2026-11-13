import type { Agent } from "@brain/shared";
import type { Channel, Risk } from "@brain/shared";
import type { ProposalInput } from "./brain";
import { HANDLERS, type HandlerCtx, type HandlerResult } from "./handlers";
import { toolLoop, type LlmConfig, type ToolDef } from "./llm";
import { overview } from "./jarvis-llm";
import { DADOS_TOOL, consultarDados } from "./data";
import { WEB_TOOL, pesquisarWeb } from "./web";
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
- Só use fatos das ferramentas. Você TEM acesso a Stripe, Meta Ads, Instagram e ao CRM (só leitura) pela ferramenta consultar_dados: consulte antes de dizer que falta dado. Sem dado de verdade, diga o que falta e proponha como conseguir.
- Texto em português do Brasil, direto e curto.
Quando a tarefa pede um documento (pesquisa, plano, roteiro, análise), escreva-o inteiro no campo "entrega" do relatorio, não só um resumo. Use pesquisar_web com parcimônia (cada chamada custa) e só para mercado, concorrentes, preços e tendências, nunca para levantar dados pessoais de pessoas específicas.
Termine sempre chamando "relatorio" com 1 ou 2 frases do que fez.`;

const TOOLS = (a: Agent): ToolDef[] => [
  DADOS_TOOL as unknown as ToolDef,
  WEB_TOOL as unknown as ToolDef,
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
        email_para: { type: "string", description: "Só para e-mail que o Brain deve enviar depois do OK do Felipe: endereço do destinatário. O corpo vai em texto_pronto." },
        assunto: { type: "string", description: "Assunto do e-mail (junto com email_para)." },
        imagem_url: { type: "string", description: "Só para post no Instagram que o Brain deve publicar depois do OK: link https público da imagem. A legenda vai em texto_pronto. Sem imagem, não preencha." },
      },
      required: ["titulo", "por_que", "risco", "canal"],
    },
  },
  { name: "relatorio", description: "Encerra a tarefa. resumo: 1 ou 2 frases. entrega: o documento completo que o Felipe pediu (pesquisa, plano, texto), quando a tarefa pede um produto.", input_schema: { type: "object", properties: { resumo: { type: "string" }, entrega: { type: "string", description: "Documento completo, em texto com títulos curtos e listas." } }, required: ["resumo"] } },
];

/** Raciocínio de um agente: as fichas viram prompt, e tudo que ele quer fazer passa por ferramentas controladas. */
export function makeThinker(cfg: LlmConfig, fetchFn: typeof fetch = fetch): Thinker {
  return async (agent: Agent, task: string, ctx: HandlerCtx): Promise<HandlerResult> => {
    const spent = ctx.brain.metrics();
    if (spent.llmSpentMonthBrl >= spent.llmCapMonthlyBrl) return { status: "blocked", result: `Teto mensal de IA atingido (${spent.llmSpentMonthBrl} de ${spent.llmCapMonthlyBrl} reais). ${agent.name} só volta no mês que vem ou se você subir o teto.` };
    const proposals: ProposalInput[] = [];
    let report = "";
    let entrega = "";
    let extraCost = 0;
    let routine = "";
    const { cost, text } = await toolLoop(
      cfg,
      { system: systemFor(agent), messages: [{ role: "user", content: `Tarefa: ${task}` }], tools: TOOLS(agent), maxTokens: 3000, maxRounds: 12 },
      async (name, input) => {
        switch (name) {
          case "consultar_dados": {
            const t = JSON.stringify(await consultarDados({ brain: ctx.brain, env: ctx.env, fetchFn }, String(input.fonte), { dias: Number(input.dias) || undefined, atualizar: input.atualizar === true, filtros: typeof input.filtros === "object" && input.filtros ? (input.filtros as Record<string, unknown>) : undefined, pagina: Number(input.pagina) || undefined }));
            return t.length > 12_000 ? `${t.slice(0, 12_000)}…(cortado)` : t;
          }
          case "pesquisar_web": {
            const w = await pesquisarWeb(cfg, String(input.pergunta ?? ""), fetchFn);
            extraCost += w.costBrl;
            return `${w.texto}\n\nFontes:\n${w.fontes.map((f) => `- ${f.titulo}: ${f.url}`).join("\n")}`;
          }
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
              payload: {
                tarefa: task,
                ...(channel === "email" && input.email_para && input.assunto ? { envio: { tipo: "email", para: String(input.email_para).slice(0, 200), assunto: String(input.assunto).slice(0, 200) } } : {}),
                ...(channel === "instagram" && input.imagem_url ? { envio: { tipo: "instagram", imagemUrl: String(input.imagem_url).slice(0, 500) } } : {}),
              },
            });
            return "Proposta registrada para a Conformidade.";
          }
          case "relatorio":
            report = String(input.resumo ?? "");
            entrega = input.entrega ? String(input.entrega).slice(0, 20_000) : "";
            return "Relatório registrado.";
          default:
            throw new Error(`Ferramenta desconhecida: ${name}`);
        }
      },
      fetchFn,
    );
    return { status: "done", result: report || routine || text || "Concluiu.", proposals, costBrl: cost + extraCost, ...(entrega ? { entrega } : {}) };
  };
}
