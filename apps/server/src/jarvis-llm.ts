import { AGENTS, type ChatReply, type Integration, type JarvisAction } from "@brain/shared";
import { applyAction } from "./actions";
import { BrainError, type Brain } from "./brain";
import { run, rows } from "./db";
import { toolLoop, type LlmConfig, type Msg, type ToolDef } from "./llm";
import type { Chat } from "./jarvis";

const SYSTEM = `Você é o Jarvis, o comandante da Central Synapsa. Fala com Felipe Dalpra, fundador da Synapsa, plataforma de IA para psicólogos no Brasil.

Como responder: português do Brasil, direto, sem enrolação, sem abrir com elogio. Frases curtas e longas misturadas. Dê posição, não "depende". Tudo precisa ligar a MRR, retenção ou ativação.

Regras que você nunca quebra:
- Só afirme números e fatos que vieram das ferramentas. Se a ferramenta não tem o dado, diga que não tem (por exemplo, o funil depende da plataforma ligar o Brain).
- Nada sai para fora sozinho: agentes só propõem, e só o Felipe aprova e envia. Aprovar não envia nada.
- Nenhum agente oferece desconto. Fim de desconto vira contato do Felipe com o cliente.
- Ações que param ou liberam tudo, ou aprovam em lote, exigem confirmação do Felipe: use pedir_confirmacao, nunca execute direto.
- Pausar, retomar, dar tarefa a um agente e rodar a rotina você executa direto.
- Dados clínicos de paciente não existem no Brain.
Se a pergunta for sobre o estado do Brain, chame visao_geral antes de responder.`;

const TOOLS: ToolDef[] = [
  { name: "visao_geral", description: "Estado atual: MRR e meta, funil (pode ser nulo), fila de propostas, agentes trabalhando/pausados, integrações, atividade recente, botão de emergência.", input_schema: { type: "object", properties: {} } },
  { name: "ver_agente", description: "Ficha de um agente (missão, métrica, o que faz sozinho, o que propõe) mais estado atual e propostas dele na fila.", input_schema: { type: "object", properties: { agent_id: { type: "string" } }, required: ["agent_id"] } },
  { name: "listar_propostas", description: "Propostas pendentes na fila, ordenadas por impacto em reais, com texto pronto.", input_schema: { type: "object", properties: {} } },
  { name: "dar_tarefa", description: "Manda um agente trabalhar numa tarefa. Executa na hora.", input_schema: { type: "object", properties: { agent_id: { type: "string" }, tarefa: { type: "string" } }, required: ["agent_id", "tarefa"] } },
  { name: "pausar_agente", description: "Pausa um agente. Executa na hora.", input_schema: { type: "object", properties: { agent_id: { type: "string" } }, required: ["agent_id"] } },
  { name: "retomar_agente", description: "Retoma um agente pausado. Executa na hora.", input_schema: { type: "object", properties: { agent_id: { type: "string" } }, required: ["agent_id"] } },
  { name: "rodar_rotina_do_dia", description: "Dispara a rotina diária (Guardião, Financeiro, Mídia Paga e, por último, o briefing do Chief).", input_schema: { type: "object", properties: {} } },
  { name: "pedir_confirmacao", description: "Pede ao Felipe que confirme uma ação de impacto. NÃO executa. A ação roda só se ele clicar em confirmar.", input_schema: { type: "object", properties: { acao: { type: "string", enum: ["parar_tudo", "retomar_tudo", "aprovar_baixo_risco"] } }, required: ["acao"] } },
];

const CONFIRM: Record<string, { label: string; action: JarvisAction }> = {
  parar_tudo: { label: "Parar tudo", action: { type: "kill_on" } },
  retomar_tudo: { label: "Retomar tudo", action: { type: "kill_off" } },
  aprovar_baixo_risco: { label: "Aprovar as de baixo risco", action: { type: "approve_low_risk" } },
};

const agentList = () => AGENTS.map((a) => `${a.id} = ${a.name}`).join("; ");

/** Resumo enxuto do Brain para o modelo: nada de segredo, nada de dado clínico. */
export function overview(brain: Brain, integrations: Integration[]) {
  const s = brain.snapshot(integrations);
  const pend = s.proposals.filter((p) => p.status === "pendente");
  return {
    agora: new Date(s.now).toISOString(),
    botao_de_emergencia_ligado: s.kill,
    metas: { mrr: s.metrics.mrr, funil: s.metrics.funil, custo_ia: { mes_brl: s.metrics.llmSpentMonthBrl, teto_brl: s.metrics.llmCapMonthlyBrl } },
    fins_de_desconto: s.metrics.descontos,
    fila: { pendentes: pend.length, fora_do_teto: s.overflow, top: pend.slice(0, 8).map((p) => ({ id: p.id, agente: p.agentId, titulo: p.title, impacto_brl: p.impactoBrl, risco: p.risk, canal: p.channel })) },
    agentes: Object.fromEntries(Object.entries(s.runtime).filter(([, r]) => r.status !== "ocioso" || r.runsToday > 0).map(([id, r]) => [id, { status: r.status, ultima_acao: r.lastAction, execucoes_hoje: r.runsToday }])),
    integracoes: s.integrations.map((i) => ({ nome: i.name, estado: i.state, detalhe: i.detail })),
    atividade_recente: s.activity.slice(0, 12).map((a) => ({ quem: a.agentId, texto: a.text, tom: a.tone })),
  };
}

export function llmChat(brain: Brain, integrations: () => Integration[], cfg: LlmConfig, fallback: Chat, fetchFn: typeof fetch = fetch): Chat {
  return async (text) => {
    const history = rows<{ role: string; text: string }>(brain.db, "select role, text from chat order by id desc limit 12").reverse();
    const messages: Msg[] = [...history.map((h) => ({ role: (h.role === "voce" ? "user" : "assistant") as Msg["role"], content: h.text })), { role: "user", content: text }];
    // A API exige alternância; funde mensagens seguidas do mesmo papel.
    const merged: Msg[] = [];
    for (const m of messages) {
      const last = merged.at(-1);
      if (last && last.role === m.role && typeof last.content === "string" && typeof m.content === "string") last.content += `\n${m.content}`;
      else merged.push({ ...m });
    }
    if (merged[0]?.role === "assistant") merged.shift();

    const spent = brain.metrics();
    if (spent.llmSpentMonthBrl >= spent.llmCapMonthlyBrl) {
      const r = await fallback(text);
      return { ...r, text: `${r.text}\n\n(Teto mensal de IA atingido: respondi por regras.)` };
    }

    let confirm: ChatReply["confirm"];
    const agentOf = (id: unknown) => {
      const a = AGENTS.find((x) => x.id === id);
      if (!a) throw new Error(`Agente desconhecido: ${String(id)}. Válidos: ${agentList()}`);
      return a;
    };
    const exec = (a: JarvisAction) => applyAction(brain, a);
    try {
      const { text: out, cost } = await toolLoop(
        cfg,
        { system: `${SYSTEM}\n\nAgentes (id = nome): ${agentList()}.`, messages: merged, tools: TOOLS, maxTokens: 900 },
        (name, input) => {
          switch (name) {
            case "visao_geral":
              return JSON.stringify(overview(brain, integrations()));
            case "ver_agente": {
              const a = agentOf(input.agent_id);
              const s = brain.snapshot([]);
              return JSON.stringify({ id: a.id, nome: a.name, missao: a.mission, metrica: a.metric, faz_sozinho: a.auto, propoe: a.aprova, so_o_felipe: a.humano, estado: s.runtime[a.id], na_fila: s.proposals.filter((p) => p.agentId === a.id && p.status === "pendente").map((p) => p.title) });
            }
            case "listar_propostas":
              return JSON.stringify(brain.snapshot([]).proposals.filter((p) => p.status === "pendente").map((p) => ({ id: p.id, agente: p.agentId, titulo: p.title, por_que: p.why, texto_pronto: p.draft, impacto_brl: p.impactoBrl, risco: p.risk, canal: p.channel })));
            case "dar_tarefa":
              return exec({ type: "task", agentId: agentOf(input.agent_id).id, task: String(input.tarefa ?? "") });
            case "pausar_agente":
              return exec({ type: "pause", agentId: agentOf(input.agent_id).id });
            case "retomar_agente":
              return exec({ type: "resume", agentId: agentOf(input.agent_id).id });
            case "rodar_rotina_do_dia":
              return exec({ type: "daily" });
            case "pedir_confirmacao": {
              const c = CONFIRM[String(input.acao)];
              if (!c) throw new Error("Ação desconhecida.");
              confirm = c;
              return "Confirmação pedida ao Felipe. Explique em uma frase o que vai acontecer e espere o clique.";
            }
            default:
              throw new Error(`Ferramenta desconhecida: ${name}`);
          }
        },
        fetchFn,
      );
      run(brain.db, "insert into agent_runs (agent_id, task, status, requested_by, created_at, finished_at, cost_brl, result) values ('jarvis', 'Conversa com o Jarvis', 'done', 'voce', ?, ?, ?, 'chat')", brain.clock(), brain.clock(), cost);
      run(brain.db, "insert into chat (role, text, at) values ('voce', ?, ?)", text, brain.clock());
      run(brain.db, "insert into chat (role, text, at) values ('jarvis', ?, ?)", out, brain.clock());
      brain.emit("change");
      return { text: out || "Feito.", confirm };
    } catch (e) {
      if (e instanceof BrainError) return { text: e.message };
      const r = await fallback(text);
      return { ...r, text: `${r.text}\n\n(Não consegui falar com a IA agora: ${e instanceof Error ? e.message.slice(0, 90) : "erro"}. Respondi por regras.)` };
    }
  };
}
