import { AGENTS } from "./roster";
import { TEAMS } from "./teams";
import type { Agent, AgentRuntime, ChatMessage, Integration, JarvisAction, Metrics, Proposal } from "./types";

export interface BrainView {
  now: number;
  runtime: Record<string, AgentRuntime>;
  proposals: Proposal[];
  integrations: Integration[];
  kill: boolean;
  metrics: Metrics;
}

export interface Reply {
  text: string;
  /** Executa na hora (ações de baixo risco que não saem da casa). */
  action?: JarvisAction;
  /** Pede confirmação antes de executar. */
  confirm?: NonNullable<ChatMessage["confirm"]>;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n % 1 ? 2 : 0 });

const ALIASES: Record<string, string[]> = {
  chief: ["chief", "chefe de gabinete"],
  ativacao: ["ativacao do freemium", "freemium"],
  pagar: ["momento de pagar"],
  saude: ["saude da conta", "voz do cliente"],
  cobranca: ["cobranca"],
  escalonador: ["escalonador"],
  relclinica: ["relatorio da clinica"],
  guardiao: ["guardiao"],
  metricas: ["analista de metricas", "metricas"],
  experimentos: ["experimentos"],
  alocador: ["alocador"],
  prospeccao: ["prospeccao", "prospector"],
  conteudo: ["conteudo", "social"],
  indicacao: ["indicacao"],
  midia: ["midia paga", "midia", "anuncios"],
  inteligencia: ["inteligencia de mercado", "inteligencia"],
  descoberta: ["descoberta"],
  especificacao: ["especificacao"],
  uso: ["analista de uso"],
  lancamento: ["lancamento"],
  financeiro: ["financeiro"],
  compliance: ["conformidade", "lgpd", "compliance"],
  sdr: ["sdr"],
  closer: ["closer"],
};

export function findAgent(input: string): Agent | undefined {
  const q = norm(input);
  let best: { a: Agent; len: number } | undefined;
  for (const a of AGENTS) {
    for (const alias of ALIASES[a.id] ?? [norm(a.name)]) {
      if (q.includes(alias) && (!best || alias.length > best.len)) best = { a, len: alias.length };
    }
  }
  return best?.a;
}

const TASK_VERBS = /(faca|faz|rode|rodar|concilie|analise|prepare|monte|escreva|revise|verifique|pesquise|calcule|gere|audite|compile|atualize|levante|mande|manda|peca|pede|pedir|ordene)/;

function ago(now: number, at: number): string {
  const m = Math.max(1, Math.round((now - at) / 60_000));
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  return `há ${h} h`;
}

export function respond(input: string, v: BrainView): Reply {
  const M = v.metrics;
  const q = norm(input).trim();
  const pending = v.proposals.filter((p) => p.status === "pendente");
  const agent = findAgent(input);

  // 1. Parada geral
  if (/(parar|pare|desligar|desligue|pausar) tudo|kill ?switch|emergencia/.test(q)) {
    if (v.kill) return { text: "O botão de emergência já está ligado. Nada roda e nenhuma aprovação passa. Para religar, diga \"retomar tudo\"." };
    return { text: "Isso para todos os 24 agentes e bloqueia qualquer aprovação até você religar. Confirma?", confirm: { label: "Parar tudo", action: { type: "kill_on" } } };
  }
  if (/(retomar|religar|reativar|desativar) (tudo|o kill)|voltar ao normal/.test(q)) {
    if (!v.kill) return { text: "O botão de emergência está desligado. Os agentes já estão rodando normal." };
    return { text: "Isso religa os agentes e libera as aprovações. Confirma?", confirm: { label: "Retomar tudo", action: { type: "kill_off" } } };
  }

  // 1b. Rotina do dia
  if (/(rotina|ciclo) (do dia|diaria)|rode o dia|rodar o dia|atualize tudo/.test(q)) {
    if (v.kill) return { text: "O botão de emergência está ligado. Religue antes de rodar a rotina." };
    return { text: "Rotina do dia iniciada: Guardião fecha o MRR, Financeiro compara com a meta, Mídia Paga lê os anúncios e, por último, o Chief monta o briefing.", action: { type: "daily" } };
  }

  // 2. Pausar ou retomar um agente
  if (agent && /\b(pausar|pause|pare|suspenda)\b/.test(q)) {
    return { text: `${agent.name} pausado. Ele não roda nem propõe até você retomar.`, action: { type: "pause", agentId: agent.id } };
  }
  if (agent && /\b(retomar|retome|ligar|ligue|reative|volte)\b/.test(q)) {
    return { text: `${agent.name} de volta. Ele roda no próximo gatilho.`, action: { type: "resume", agentId: agent.id } };
  }

  // 3. Dar uma tarefa a um agente
  if (agent && (TASK_VERBS.test(q) || /\b(para|pra)\b/.test(q))) {
    if (v.kill) return { text: "O botão de emergência está ligado. Religue antes de dar tarefa a um agente." };
    const task = input.replace(/^(.*?)(para|pra|:)\s+/i, "").trim() || `trabalho pedido por você`;
    const needsApproval = agent.aprova.length > 0;
    return {
      text: `${agent.name} começou. ${needsApproval ? "O que ele preparar chega na sua fila para aprovação." : "É uma análise interna e o resultado aparece no feed de hoje."}`,
      action: { type: "task", agentId: agent.id, task },
    };
  }

  // 4. Aprovar as de baixo risco
  if (/aprov(e|ar|a)\b.*(baixo|simples|seguras|rotina)/.test(q)) {
    const low = pending.filter((p) => p.risk === "baixo");
    if (v.kill) return { text: "O botão de emergência está ligado, então nenhuma aprovação passa." };
    if (low.length === 0) return { text: "Não há propostas de baixo risco esperando." };
    const total = low.reduce((n, p) => n + p.impactoBrl, 0);
    return {
      text: `São ${low.length} propostas de baixo risco, somando ${brl(total)} de impacto. Aprovar não envia nada: você copia e manda cada mensagem. Confirma?`,
      confirm: { label: `Aprovar ${low.length}`, action: { type: "approve_low_risk" } },
    };
  }

  // 5. Relatório de um agente
  if (agent) {
    const r = v.runtime[agent.id];
    const mine = pending.filter((p) => p.agentId === agent.id).length;
    if (!r) return { text: `${agent.name} ainda não rodou.` };
    return {
      text: `${agent.name}: ${r.status === "trabalhando" ? "trabalhando agora" : r.status === "pausado" ? "pausado" : "aguardando o próximo gatilho"}. Última ação ${ago(v.now, r.lastAt)}: ${r.lastAction} Hoje rodou ${r.runsToday} vezes e custou ${brl(r.costBrl)}. ${mine ? `Tem ${mine} proposta(s) na sua fila.` : "Nada dele na sua fila."}`,
    };
  }

  // 6. Perguntas gerais
  if (/(desconto|reajuste|renova)/.test(q)) {
    const linhas = M.descontos.map((d) => `${d.quando}: ${d.contas} conta(s) sobem de ${brl(d.de)} para ${brl(d.para)}`).join("; ");
    return { text: `Fins de desconto à vista: ${linhas}. Quem entrou com R$ 79 também sobe para R$ 119 seis meses depois. O Brain abre um contato 30 dias antes de cada uma, para você ligar. Nenhum agente oferece desconto.` };
  }
  if (/(mrr|receita|faturamento|meta|1200|caixa)/.test(q)) {
    const { total, goal, stripe, pix, manual, essencialPrice } = M.mrr;
    const falta = Math.max(0, goal - total);
    const partes = [`${brl(stripe)} no Stripe`, `${brl(pix)} por Pix`, ...(manual ? [`${brl(manual)} lançados à mão`] : [])].join(", ");
    const limite = M.funil ? ` Há ${M.funil.noLimite} profissionais no limite de pacientes agora.` : "";
    return { text: `MRR de ${brl(total)}: ${partes}. Faltam ${brl(falta)} para os ${brl(goal)} de ${M.mrr.goalDate}, o que são cerca de ${Math.ceil(falta / essencialPrice)} Essenciais a ${brl(essencialPrice)}.${limite}` };
  }
  if (/(funil|ativa|cadastro|conversao|limite)/.test(q)) {
    const f = M.funil;
    if (!f) return { text: "Ainda não tenho o funil: a plataforma não está mandando cadastros e uso para o Brain. Quando o PR do mvp-v2 entrar, eu passo a responder isso." };
    return { text: `Funil de hoje: ${f.cadastros} cadastros, ${f.ativados} ativados, ${f.noLimite} no limite de 5 pacientes e ${f.pagantes} pagantes. Os ${f.noLimite} no limite são a conversão mais próxima. O Momento de Pagar já tem convite pronto para a fila.` };
  }
  if (/(integra|conect|credenc|api|saude das)/.test(q)) {
    const by = (s: Integration["state"]) => v.integrations.filter((i) => i.state === s);
    const pendentes = by("pendente").map((i) => i.name).join(", ");
    return { text: `${by("conectado").length} integrações ligadas, ${by("pronto").length} com credencial pronta esperando o Worker, ${by("manual").length} manual e ${by("pendente").length} pendentes${pendentes ? ` (${pendentes})` : ""}. As que travam mais agentes são Plataforma e Supabase.` };
  }
  if (/(custo|gasto|token|\bia\b)/.test(q)) {
    const dia = Object.values(v.runtime).reduce((n, r) => n + r.costBrl, 0);
    return { text: `Hoje os agentes custaram ${brl(dia)}. No mês: ${brl(M.llmSpentMonthBrl)} de ${brl(M.llmCapMonthlyBrl)} de teto, ${Math.round((M.llmSpentMonthBrl / M.llmCapMonthlyBrl) * 100)}% usado.` };
  }
  if (/(fila|aprova|pendente|propost|decis)/.test(q)) {
    if (pending.length === 0) return { text: "Fila vazia. Nada espera por você." };
    const top = [...pending].sort((a, b) => b.impactoBrl - a.impactoBrl).slice(0, 3);
    return { text: `${pending.length} propostas esperando. As maiores: ${top.map((p) => `${p.title} (${brl(p.impactoBrl)})`).join("; ")}. Diga "aprove as de baixo risco" ou abra a aba Aprovações.` };
  }
  if (/(quem|agentes|trabalhando|time|equipe)/.test(q)) {
    const work = AGENTS.filter((a) => v.runtime[a.id]?.status === "trabalhando");
    const paused = AGENTS.filter((a) => v.runtime[a.id]?.status === "pausado");
    const teams = TEAMS.map((t) => `${t.name} ${AGENTS.filter((a) => t.areas.includes(a.area)).length}`).join(", ");
    return { text: `24 agentes em 5 times (${teams}). Trabalhando agora: ${work.map((a) => a.name).join(", ") || "ninguém"}. ${paused.length ? `Pausados: ${paused.map((a) => a.name).join(", ")}.` : "Nenhum pausado."}` };
  }
  if (/(o que (aconteceu|rolou|fizeram)|resumo|hoje|enquanto|briefing|novidade)/.test(q)) {
    const recent = Object.values(v.runtime).reduce((n, r) => n + r.runsToday, 0);
    const alert = pending.filter((p) => p.risk !== "baixo").length;
    return { text: `Enquanto você esteve fora: ${recent} execuções dos agentes, MRR em ${brl(M.mrr.total)}, ${pending.length} propostas na fila (${alert} pedem atenção).${v.kill ? " O botão de emergência está ligado." : ""} Abra a aba Hoje para a linha do tempo.` };
  }

  return {
    text: "Posso resumir o dia, mostrar o MRR e o funil, listar a fila, checar integrações e custo. Também executo: \"peça ao Guardião para conciliar a base\", \"pause a Mídia Paga\", \"aprove as de baixo risco\", \"pare tudo\".",
  };
}
