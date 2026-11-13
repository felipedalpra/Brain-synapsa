import { AGENTS, type ChatReply, type Integration, type JarvisAction } from "@brain/shared";
import { applyAction } from "./actions";
import { BrainError, type Brain } from "./brain";
import { run, rows } from "./sql";
import { toolLoop, type LlmConfig, type Msg, type ToolDef } from "./llm";
import type { Chat } from "./jarvis";
import { DADOS_TOOL, consultarDados } from "./data";
import { WEB_TOOL, pesquisarWeb } from "./web";
import { PLAYBOOKS } from "@brain/shared";
import { finPainel } from "./fin";
import { CRM_OPS, validarProposta } from "./crm-acao";
import { crmPainel } from "./crm-painel";

const cap = (x: unknown, n = 12_000) => {
  const t = JSON.stringify(x);
  return t.length > n ? `${t.slice(0, n)}…(cortado)` : t;
};

const SYSTEM = `Você é o Jarvis, o comandante da Central Synapsa. Fala com Felipe Dalpra, fundador da Synapsa, plataforma de IA para psicólogos no Brasil.

Como responder: português do Brasil, direto, sem enrolação, sem abrir com elogio. Frases curtas e longas misturadas. Dê posição, não "depende". Tudo precisa ligar a MRR, retenção ou ativação.

Regras que você nunca quebra:
- Só afirme números e fatos que vieram das ferramentas. Se a ferramenta não tem o dado, diga que não tem (por exemplo, o funil depende da plataforma ligar o Brain).
- Você TEM acesso a Stripe (assinaturas e MRR), Meta Ads (campanhas, gasto, cliques, leads) e Instagram (seguidores, alcance, posts) pela ferramenta consultar_dados. Nunca diga que não tem acesso sem antes consultar. Se a consulta devolver aviso de erro, repita o aviso ao Felipe com as palavras exatas e diga o que falta.
- Para perguntas de números, análise ou "como estamos", consulte primeiro, depois dê a leitura e a ação que mais move o MRR.
- Quando o Felipe pedir um plano ou uma frente de trabalho, use dar_tarefa com instruções completas (o que pesquisar, o que entregar), ou lancar_plano se existir plano pronto da equipe.
- Nada sai para fora sozinho: agentes só propõem, e só o Felipe aprova e envia. Aprovar não envia nada.
- Nenhum agente oferece desconto. Fim de desconto vira contato do Felipe com o cliente.
- Ações que param ou liberam tudo, ou aprovam em lote, exigem confirmação do Felipe: use pedir_confirmacao, nunca execute direto.
- Pausar, retomar, dar tarefa a um agente e rodar a rotina você executa direto.
- Dados clínicos de paciente não existem no Brain.
- Caixa, contas, DRE, projeção e meta de MRR: use ver_financeiro. CRM (funil, reuniões do dia, leads parados, oportunidades): use ver_crm. ver_financeiro e ver_crm são leitura. Você não lança pagamento nem cadastra conta financeira. No CRM você PROPÕE escritas com propor_crm (criar lead, mover etapa, registrar atividade, agendar reunião): isso não executa nada, só mostra um botão de confirmar ao Felipe, e só o clique dele grava. Nunca exclua nada no CRM. Se faltar campo obrigatório (por exemplo telefone), pergunte ao Felipe antes de propor; nunca invente telefone, nome ou data. Depois de propor, diga em uma frase o que vai acontecer ao confirmar.
- Os números do financeiro são do Inter (caixa real) e das contas lançadas; MRR vem das assinaturas. CAC só existe quando a ferramenta devolver número.
Se a pergunta for sobre o estado do Brain, chame visao_geral antes de responder.`;

const TOOLS: ToolDef[] = [
  DADOS_TOOL as unknown as ToolDef,
  WEB_TOOL as unknown as ToolDef,
  { name: "ver_financeiro", description: "Financeiro da Synapsa (só leitura): saldo do Inter, resultado do mês, MRR, contas a pagar e a receber, alertas, DRE, indicadores e projeção de 36 meses em 3 cenários com o mês em que cada um bate a meta de MRR.", input_schema: { type: "object", properties: {} } },
  { name: "ver_crm", description: "CRM da Synapsa (só leitura): KPIs do funil, etapas, oportunidades a explorar, reuniões de hoje e próximas, leads parados e follow-ups. Sem telefone nem e-mail.", input_schema: { type: "object", properties: { atualizar: { type: "boolean", description: "Ignora o cache de 60 s." } } } },
  { name: "propor_crm", description: "Propõe uma escrita no CRM e pede confirmação ao Felipe. NÃO executa. Operações: criar_lead (dados: name, lead_type = psicologo_individual|clinica|parceiro, phone, origin = instagram|whatsapp|landing_page|indicacao|evento|linkedin|facebook_meta|google|parceria|outbound|outro, classification opcional frio|morno|quente|super_quente); mover_etapa (dados: lead_id, status = novo_lead|contato_feito|reuniao_agendada|reuniao_realizada|em_teste|negociacao|cliente_ativo|perdido|pausado; se perdido, loss_reason {reasons[], details}); registrar_atividade (dados: lead_id, type = enviar_mensagem|ligar|agendar_reuniao|followup, scheduled_date AAAA-MM-DD, scheduled_time HH:MM, observations opcional); agendar_reuniao (dados: lead_id, title, scheduled_at ISO com fuso, channel/notes_before/duration_minutes opcionais). lead_id vem de ver_crm.", input_schema: { type: "object", properties: { op: { type: "string", enum: [...CRM_OPS] }, dados: { type: "object" }, resumo: { type: "string", description: "Rótulo curto do botão, ex.: 'Cadastrar lead TESTE'." } }, required: ["op", "dados", "resumo"] } },
  { name: "listar_planos", description: "Planos prontos por equipe (id, equipe, título, objetivo, passos).", input_schema: { type: "object", properties: {} } },
  { name: "lancar_plano", description: "Lança um plano pronto: os agentes dele começam na hora. Executa direto.", input_schema: { type: "object", properties: { plano_id: { type: "string" } }, required: ["plano_id"] } },
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

export function llmChat(brain: Brain, integrations: () => Integration[], cfg: LlmConfig, fallback: Chat, fetchFn: typeof fetch = fetch, env: Record<string, string | undefined> = {}): Chat {
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
        { system: `${SYSTEM}\n\nAgentes (id = nome): ${agentList()}.`, messages: merged, tools: TOOLS, maxTokens: 1100, maxRounds: 8 },
        async (name, input) => {
          switch (name) {
            case "consultar_dados":
              return cap(await consultarDados({ brain, env, fetchFn }, String(input.fonte), { dias: Number(input.dias) || undefined, atualizar: input.atualizar === true, filtros: typeof input.filtros === "object" && input.filtros ? (input.filtros as Record<string, unknown>) : undefined, pagina: Number(input.pagina) || undefined }));
            case "pesquisar_web":
              return await pesquisarWeb(cfg, String(input.pergunta ?? ""), fetchFn).then((w) => `${w.texto}\n\nFontes:\n${w.fontes.map((f) => `- ${f.titulo}: ${f.url}`).join("\n")}`);
            case "ver_financeiro": {
              const f = finPainel(brain.db, brain.clock());
              const { mrrSerie: _m, ...ind } = f.indicadores;
              return cap({
                hoje: f.hoje, kpis: f.kpis, alertas: f.alertas.map((a) => ({ tom: a.tom, titulo: a.titulo, detalhe: a.detalhe })),
                a_pagar: f.aPagar.slice(0, 10).map((c) => ({ descricao: c.descricao, vencimento: c.vencimento, valor: c.valor, status: c.status, categoria: c.categoria })),
                a_receber: f.aReceber.slice(0, 10).map((c) => ({ descricao: c.descricao, vencimento: c.vencimento, valor: c.valor, status: c.status })),
                dre: f.dre, entradas_saidas_6_meses: f.serie, despesas_por_categoria: f.despesasPorCategoria, indicadores: ind, premissas: f.premissas,
                projecao: f.projecao.cenarios.map((c) => ({ cenario: c.id, novos_por_mes: c.novosPorMes, churn: c.churn, mes_da_meta: c.mesDaMeta, mrr_em_12_meses: c.mrr[11], mrr_em_36_meses: c.mrr[35], caixa_em_12_meses: c.saldo[11], caixa_em_36_meses: c.saldo[35] })),
              });
            }
            case "ver_crm": {
              const c = await crmPainel(env, brain.clock(), fetchFn, { atualizar: input.atualizar === true });
              if (c.indisponivel) return `CRM indisponível: ${c.indisponivel}`;
              const lead = (l: (typeof c.oportunidades)[number]) => ({ lead_id: l.id, nome: l.nome, etapa: l.etapa, classificacao: l.classificacao, dias_sem_contato: l.diasSemContato, proxima_acao: l.proximaAcao, motivo: l.motivo });
              const reu = (r: (typeof c.reunioesHoje)[number]) => ({ lead_id: r.leadId, lead: r.lead, quando: r.quando, status: r.status, canal: r.canal });
              return cap({ kpis: c.kpis, etapas: c.etapas, origem: c.origem, oportunidades: c.oportunidades.slice(0, 8).map(lead), parados: c.parados.slice(0, 8).map(lead), followups: c.followups.slice(0, 8).map(lead), reunioes_hoje: c.reunioesHoje.map(reu), reunioes_proximas: c.reunioesProximas.slice(0, 8).map(reu), reunioes_sem_status: c.reunioesSemStatus.length, acoes: c.acoes.slice(0, 6) });
            }
            case "propor_crm": {
              const op = String(input.op) as (typeof CRM_OPS)[number];
              if (!CRM_OPS.includes(op)) throw new Error("Operação desconhecida.");
              const dados = input.dados && typeof input.dados === "object" && !Array.isArray(input.dados) ? (input.dados as Record<string, unknown>) : {};
              const erros = validarProposta(op, dados);
              if (erros.length) return `O CRM recusaria isso: ${erros.slice(0, 6).join("; ")}. Pergunte ao Felipe o que falta; não invente.`;
              confirm = { label: String(input.resumo ?? "Confirmar no CRM").slice(0, 60), action: { type: "crm", op, dados, chave: crypto.randomUUID() } };
              return "Confirmação pedida ao Felipe. Nada foi gravado. Diga em uma frase o que vai acontecer e espere o clique.";
            }
            case "listar_planos":
              return JSON.stringify(PLAYBOOKS.map((p) => ({ id: p.id, equipe: p.team, titulo: p.titulo, objetivo: p.objetivo, passos: p.passos.map((s) => `${s.agentId}: ${s.titulo}`) })));
            case "lancar_plano":
              return exec({ type: "playbook", id: String(input.plano_id ?? "") });
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
