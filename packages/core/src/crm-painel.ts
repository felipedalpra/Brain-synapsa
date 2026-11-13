// Monta o painel do CRM para a Central: só leitura, só números e nomes de lead.
// Telefone, e-mail e Instagram nunca entram aqui. Tudo é calculado de fatos do CRM, sem opinião de IA.
import type { CrmAcao, CrmLeadResumo, CrmPainel, CrmReuniaoResumo } from "@brain/shared";
import { CrmError, crmClient, type Activity, type Lead, type Meeting } from "./crm";
import { brtDay } from "./brain";

type Env = Record<string, string | undefined>;
const DIA = 86_400_000;
const STALE_DIAS = 7;

const ETAPA_PESO: Record<string, number> = { negociacao: 5, em_teste: 4, reuniao_realizada: 3, reuniao_agendada: 2, contato_feito: 1, novo_lead: 1 };
const ABERTAS = new Set(Object.keys(ETAPA_PESO));
const CLASSE_PESO: Record<string, number> = { super_quente: 3, quente: 2, morno: 1, frio: 0 };
const ROTULO_ORIGEM: Record<string, string> = { instagram: "Instagram", whatsapp: "WhatsApp", landing_page: "Landing page", indicacao: "Indicação", evento: "Evento", linkedin: "LinkedIn", facebook_meta: "Meta Ads", google: "Google", parceria: "Parceria", outbound: "Outbound", outro: "Outro" };
const ROTULO_STATUS_REUNIAO: Record<string, string> = { agendada: "Agendada", realizada: "Realizada", reagendada: "Reagendada", cancelada: "Cancelada", nao_compareceu: "Não compareceu" };

const ms = (iso: unknown): number | null => {
  const t = typeof iso === "string" ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : null;
};
const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const numOrNull = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);
const r1 = (n: number) => Math.round(n * 10) / 10;

/** Segunda-feira (BRT) da semana de um instante, como AAAA-MM-DD. */
function semanaDe(t: number): string {
  const d = new Date(`${brtDay(t)}T12:00:00-03:00`);
  const dow = (d.getUTCDay() + 6) % 7; // segunda = 0
  return brtDay(d.getTime() - dow * DIA);
}

let cache: { chave: string; at: number; painel: CrmPainel } | null = null;
const CACHE_MS = 60_000;

/** Painel com cache curto: protege o limite de 120 requisições por minuto do CRM. */
export async function crmPainel(env: Env, agora: number, f: typeof fetch, opts: { atualizar?: boolean } = {}): Promise<CrmPainel> {
  const c = crmClient(env, f);
  if (!c) return vazio(agora, "O CRM não está conectado: faltam SYNAPSA_CRM_API_KEY e SYNAPSA_CRM_API_BASE_URL nos secrets do Brain.");
  const chave = String(env.SYNAPSA_CRM_API_BASE_URL ?? env.CRM_API_BASE_URL);
  if (!opts.atualizar && cache && cache.chave === chave && agora - cache.at < CACHE_MS) return cache.painel;

  try {
    const [leadsR, reunioesR, atividadesR, stages, overview, funnel] = await Promise.all([
      c.all<Lead>("/leads", {}, 5),
      c.all<Meeting>("/meetings", {}, 5),
      c.all<Activity>("/activities", {}, 5),
      c.stages(),
      c.overview({ stale_days: STALE_DIAS }),
      c.funnel(),
    ]);
    const painel = montar({ agora, leads: leadsR.data, reunioes: reunioesR.data, atividades: atividadesR.data, truncado: leadsR.truncado || reunioesR.truncado || atividadesR.truncado, stages: stages.data, overview: overview.data as Record<string, any>, funnel: (funnel.data ?? {}) as Record<string, any> });
    cache = { chave, at: agora, painel };
    return painel;
  } catch (e) {
    if (e instanceof CrmError) throw new Error(`${e.message}${e.requestId ? ` (request_id ${e.requestId})` : ""}`);
    throw e;
  }
}

/** Para testes. */
export const limparCachePainel = () => {
  cache = null;
};

const vazio = (agora: number, indisponivel: string): CrmPainel => ({
  indisponivel,
  agora,
  geradoEm: agora,
  truncado: false,
  kpis: { totalLeads: 0, emAberto: 0, clientes: 0, perdidos: 0, pausados: 0, conversaoPct: 0, novos30d: 0, semContato: 0, staleDias: STALE_DIAS, atividadesAtrasadas: 0, atividadesPendentes: 0, reunioesHoje: 0, reunioes7d: 0, comparecimentoPct: null },
  etapas: [], origem: [], classificacao: [], tipos: [], motivosPerda: [], perdidosRecentes: [], clientesAtivos: [], leadsPorSemana: [], reunioesPorSemana: [], reunioesPorStatus: [],
  oportunidades: [], parados: [], followups: [], reunioesHoje: [], reunioesProximas: [], reunioesSemStatus: [],
  atividades: { hoje: 0, atrasadas: 0, proximas: 0, lista: [] }, tempoNaEtapa: [], acoes: [],
});

export interface Entrada {
  agora: number;
  leads: Lead[];
  reunioes: Meeting[];
  atividades: Activity[];
  truncado: boolean;
  stages: { id: string; label: string; position: number }[];
  overview: Record<string, any>;
  funnel: Record<string, any>;
}

export function montar(e: Entrada): CrmPainel {
  const { agora } = e;
  const hoje = brtDay(agora);
  const rotuloEtapa = (id: string) => e.stages.find((s) => s.id === id)?.label ?? id;
  const nomeLead = new Map(e.leads.map((l) => [l.id, l.name]));

  const diasSem = (l: Lead): number | null => {
    const t = ms(l.last_interaction_at) ?? ms(l.created_at);
    return t === null ? null : Math.max(0, Math.floor((agora - t) / DIA));
  };

  const resumo = (l: Lead, motivo: string): CrmLeadResumo => ({
    id: l.id,
    nome: l.name,
    etapa: rotuloEtapa(l.status),
    etapaId: l.status,
    classificacao: str(l.classification),
    tipo: str(l.lead_type),
    origem: str(l.origin),
    diasSemContato: diasSem(l),
    proximaAcao: str(l.next_action),
    followUp: str(l.follow_up_date),
    plano: str(l.plan_interest),
    profissionais: numOrNull(l.professionals_count),
    score: numOrNull(l.lead_score),
    motivo,
  });

  const abertos = e.leads.filter((l) => ABERTAS.has(l.status));
  const porEtapa = (id: string) => e.leads.filter((l) => l.status === id);
  const clientes = porEtapa("cliente_ativo");
  const perdidos = porEtapa("perdido");

  // Oportunidades: onde dinheiro está mais perto, com urgência crescente para quem esfriou.
  const prioridade = (l: Lead) => (ETAPA_PESO[l.status] ?? 0) * 10 + (CLASSE_PESO[String(l.classification)] ?? 0) * 5 + (numOrNull(l.lead_score) ?? 0) / 10 + Math.min(diasSem(l) ?? 0, 30) / 3;
  const frase = (l: Lead) => {
    const d = diasSem(l);
    const partes = [rotuloEtapa(l.status)];
    if (l.classification) partes.push(String(l.classification).replace("_", " "));
    if (d !== null) partes.push(d === 0 ? "contato hoje" : `${d} dia${d > 1 ? "s" : ""} sem contato`);
    return partes.join(" · ");
  };
  const oportunidades = abertos
    .filter((l) => (ETAPA_PESO[l.status] ?? 0) >= 2)
    .sort((a, b) => prioridade(b) - prioridade(a))
    .slice(0, 10)
    .map((l) => resumo(l, frase(l)));

  const parados = abertos
    .filter((l) => (diasSem(l) ?? 0) >= STALE_DIAS)
    .sort((a, b) => (ETAPA_PESO[b.status] ?? 0) - (ETAPA_PESO[a.status] ?? 0) || (diasSem(b) ?? 0) - (diasSem(a) ?? 0))
    .slice(0, 10)
    .map((l) => resumo(l, frase(l)));
  const totalParados = abertos.filter((l) => (diasSem(l) ?? 0) >= STALE_DIAS).length;

  const followupsTodos = abertos.filter((l) => typeof l.follow_up_date === "string" && l.follow_up_date <= hoje).sort((a, b) => String(a.follow_up_date).localeCompare(String(b.follow_up_date)));
  const followups = followupsTodos.slice(0, 10).map((l) => resumo(l, `Follow-up marcado para ${String(l.follow_up_date).split("-").reverse().join("/")}${l.next_action ? ` · ${l.next_action}` : ""}`));

  // Origem: de onde vêm os leads que fecham.
  const origemMap = new Map<string, { total: number; clientes: number; perdidos: number }>();
  for (const l of e.leads) {
    const k = str(l.origin) ?? "outro";
    const o = origemMap.get(k) ?? { total: 0, clientes: 0, perdidos: 0 };
    o.total++;
    if (l.status === "cliente_ativo") o.clientes++;
    if (l.status === "perdido") o.perdidos++;
    origemMap.set(k, o);
  }
  const origem = [...origemMap].map(([k, o]) => ({ origem: ROTULO_ORIGEM[k] ?? k, ...o, conversaoPct: o.total ? r1((o.clientes / o.total) * 100) : 0 })).sort((a, b) => b.total - a.total);

  const conta = (campo: (l: Lead) => string | null) => {
    const m = new Map<string, number>();
    for (const l of e.leads) {
      const k = campo(l);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  };

  // Reuniões.
  const reunioes = e.reunioes.map((m) => ({ m, t: ms(m.scheduled_at) })).filter((x): x is { m: Meeting; t: number } => x.t !== null);
  const rReun = (x: { m: Meeting; t: number }): CrmReuniaoResumo => ({
    id: x.m.id,
    leadId: x.m.lead_id,
    lead: nomeLead.get(x.m.lead_id) ?? "Lead",
    titulo: str(x.m.title) ?? "Reunião",
    quando: new Date(x.t).toISOString(),
    status: x.m.status,
    canal: str(x.m.channel),
    link: str(x.m.meeting_link),
    probabilidade: numOrNull(x.m.closing_probability),
  });
  const ativaReun = (x: { m: Meeting }) => x.m.status !== "cancelada";
  const reunioesHoje = reunioes.filter((x) => brtDay(x.t) === hoje && ativaReun(x)).sort((a, b) => a.t - b.t).map(rReun);
  const fim7 = agora + 7 * DIA;
  const reunioesProximas = reunioes.filter((x) => x.t > agora && x.t <= fim7 && brtDay(x.t) !== hoje && x.m.status === "agendada").sort((a, b) => a.t - b.t).map(rReun);
  // Reunião ainda "agendada" que já passou: alguém precisa marcar como realizada, não compareceu ou reagendada.
  const semStatusTodas = reunioes.filter((x) => x.m.status === "agendada" && x.t < agora - 2 * 3_600_000).sort((a, b) => b.t - a.t);
  const reunioesSemStatus = semStatusTodas.slice(0, 8).map(rReun);
  const statusMap = new Map<string, number>();
  for (const x of reunioes) statusMap.set(x.m.status, (statusMap.get(x.m.status) ?? 0) + 1);
  const realizadas = statusMap.get("realizada") ?? 0;
  const faltas = statusMap.get("nao_compareceu") ?? 0;
  const comparecimentoPct = realizadas + faltas > 0 ? r1((realizadas / (realizadas + faltas)) * 100) : null;

  // Semanas (8 mais recentes, incluindo a atual).
  const semanas: string[] = [];
  for (let i = 7; i >= 0; i--) semanas.push(semanaDe(agora - i * 7 * DIA));
  const leadsPorSemana = semanas.map((s) => ({ semana: s, novos: e.leads.filter((l) => { const t = ms(l.created_at); return t !== null && semanaDe(t) === s; }).length }));
  const reunioesPorSemana = semanas.map((s) => {
    const dela = reunioes.filter((x) => semanaDe(x.t) === s && ativaReun(x));
    return { semana: s, total: dela.length, realizadas: dela.filter((x) => x.m.status === "realizada").length };
  });

  // Atividades.
  const ativ = e.atividades;
  const atrasadas = ativ.filter((a) => a.status === "atrasada" || (a.status !== "concluida" && typeof a.scheduled_date === "string" && a.scheduled_date < hoje));
  const ativHoje = ativ.filter((a) => a.status !== "concluida" && a.scheduled_date === hoje);
  const ativProx = ativ.filter((a) => a.status !== "concluida" && typeof a.scheduled_date === "string" && a.scheduled_date > hoje && a.scheduled_date <= brtDay(agora + 7 * DIA));
  const listaAtiv = [...atrasadas, ...ativHoje, ...ativProx].slice(0, 12).map((a) => ({ id: a.id, lead: nomeLead.get(String(a.lead_id)) ?? "Lead", tipo: String(a.type ?? ""), quando: `${a.scheduled_date ?? ""} ${a.scheduled_time ?? ""}`.trim(), status: String(a.status ?? "") }));

  const mot = Array.isArray(e.funnel.loss_reasons) ? (e.funnel.loss_reasons as { reason: string; count: number }[]).map((x) => ({ motivo: x.reason, total: x.count })).sort((a, b) => b.total - a.total) : [];
  const tempo = Array.isArray(e.funnel.average_completed_time_in_stage)
    ? (e.funnel.average_completed_time_in_stage as { status: string; average_seconds: number; sample_size: number }[]).map((x) => ({ etapa: rotuloEtapa(x.status), dias: r1(x.average_seconds / 86_400), amostra: x.sample_size }))
    : [];

  const ov = e.overview;
  const novos30d = e.leads.filter((l) => { const t = ms(l.created_at); return t !== null && agora - t <= 30 * DIA; }).length;
  const emTesteParados = porEtapa("em_teste").filter((l) => (diasSem(l) ?? 0) >= STALE_DIAS).length;

  const acoes: CrmAcao[] = [];
  if (atrasadas.length) acoes.push({ id: "atrasadas", titulo: "Atividades atrasadas", detalhe: "Tarefas do CRM com data vencida e sem conclusão.", quantidade: atrasadas.length, tom: "critico", alvo: "atividades" });
  if (reunioesHoje.length) acoes.push({ id: "reunioes-hoje", titulo: "Reuniões hoje", detalhe: "Confira link e contexto antes de cada uma.", quantidade: reunioesHoje.length, tom: "info", alvo: "reunioes" });
  if (emTesteParados) acoes.push({ id: "teste-parado", titulo: "Leads em teste sem contato", detalhe: `Em teste há ${STALE_DIAS}+ dias sem interação: perto de fechar e esfriando.`, quantidade: emTesteParados, tom: "critico", alvo: "parados" });
  if (followupsTodos.length) acoes.push({ id: "followups", titulo: "Follow-ups vencidos ou de hoje", detalhe: "Leads com data de follow-up chegada.", quantidade: followupsTodos.length, tom: "atencao", alvo: "followups" });
  if (semStatusTodas.length) acoes.push({ id: "reuniao-sem-status", titulo: "Reuniões passadas ainda como agendadas", detalhe: "Marque no CRM se aconteceu, se o lead faltou ou se foi reagendada. Sem isso o comparecimento e a conversão ficam errados.", quantidade: semStatusTodas.length, tom: "atencao", alvo: "reunioes" });
  if (totalParados) acoes.push({ id: "parados", titulo: `Leads abertos sem contato há ${STALE_DIAS}+ dias`, detalhe: "Todas as etapas em aberto, das mais avançadas para as menos.", quantidade: totalParados, tom: "atencao", alvo: "parados" });
  const novoSemContato = porEtapa("novo_lead").length;
  if (novoSemContato) acoes.push({ id: "novos", titulo: "Novos leads sem primeiro contato", detalhe: "Estão na etapa Novo Lead.", quantidade: novoSemContato, tom: "info", alvo: "oportunidades" });

  return {
    agora,
    geradoEm: agora,
    truncado: e.truncado,
    kpis: {
      totalLeads: numOrNull(ov.total_leads) ?? e.leads.length,
      emAberto: numOrNull(ov.open_opportunities) ?? abertos.length,
      clientes: clientes.length,
      perdidos: numOrNull(ov.lost_leads) ?? perdidos.length,
      pausados: numOrNull(ov.paused_leads) ?? porEtapa("pausado").length,
      conversaoPct: numOrNull(ov.conversion_rate_percent) ?? 0,
      novos30d,
      semContato: numOrNull(ov.leads_without_recent_contact) ?? totalParados,
      staleDias: numOrNull(ov.stale_after_days) ?? STALE_DIAS,
      atividadesAtrasadas: numOrNull(ov.overdue_activities) ?? atrasadas.length,
      atividadesPendentes: numOrNull(ov.pending_activities) ?? 0,
      reunioesHoje: reunioesHoje.length,
      reunioes7d: reunioesProximas.length + reunioesHoje.filter((r) => Date.parse(r.quando) >= agora && r.status === "agendada").length,
      comparecimentoPct,
    },
    etapas: e.stages.map((s) => ({ id: s.id, label: s.label, count: porEtapa(s.id).length })),
    origem,
    classificacao: conta((l) => str(l.classification)).map((x) => ({ nome: x.nome, total: x.total })),
    tipos: conta((l) => str(l.lead_type)),
    motivosPerda: mot,
    perdidosRecentes: [...perdidos].sort((a, b) => (ms(b.updated_at) ?? 0) - (ms(a.updated_at) ?? 0)).slice(0, 8).map((l) => ({ id: l.id, nome: l.name, origem: str(l.origin), quando: str(l.updated_at) })),
    clientesAtivos: clientes.map((l) => ({ id: l.id, nome: l.name, plano: str(l.plan_interest), desde: str(l.updated_at) })),
    leadsPorSemana,
    reunioesPorSemana,
    reunioesPorStatus: [...statusMap].map(([status, total]) => ({ status: ROTULO_STATUS_REUNIAO[status] ?? status, total })).sort((a, b) => b.total - a.total),
    oportunidades,
    parados,
    followups,
    reunioesHoje,
    reunioesProximas,
    reunioesSemStatus,
    atividades: { hoje: ativHoje.length, atrasadas: atrasadas.length, proximas: ativProx.length, lista: listaAtiv },
    tempoNaEtapa: tempo,
    acoes,
  };
}
