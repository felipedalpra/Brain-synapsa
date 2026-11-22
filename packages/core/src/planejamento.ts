// Planejamento semanal: os posts da semana (um por dia) e as tarefas, com subtarefas, responsável e status.
// Substitui o documento "Cronograma posts semanal". A semana é identificada pela segunda-feira (AAAA-MM-DD).
import { BrainError, brtDay, type Brain } from "./brain";
import { row, rows, run } from "./sql";

export const RESPONSAVEIS_PADRAO = ["Felipe Dalpra", "Cassio", "Felipe Augusto"];
export type PlanStatus = "pendente" | "andamento" | "concluida";
export type PlanTipo = "post" | "tarefa";
const STATUS = new Set<PlanStatus>(["pendente", "andamento", "concluida"]);
const DAY = 86_400_000;

/** Um link por semana e por responsável (vazio = equipe toda). O token é o segredo: quem tem o link vê e marca. */
export function criarLink(brain: Brain, semana: string, responsavel: string): string {
  const ja = row<{ token: string }>(brain.db, "select token from plan_links where semana = ? and responsavel = ? and revogado = 0", semana, responsavel);
  if (ja) return ja.token;
  const b = crypto.getRandomValues(new Uint8Array(24));
  const token = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  run(brain.db, "insert into plan_links (token, semana, responsavel, criado_em) values (?, ?, ?, ?)", token, semana, responsavel, brain.clock());
  brain.audit("voce", "plan_link_criado", semana, { responsavel });
  return token;
}

export interface PlanItem {
  id: string; semana: string; tipo: PlanTipo; titulo: string; dia: number | null; formato: string; responsavel: string;
  status: PlanStatus; pai: string | null; ordem: number; notas: string; criadoEm: number; concluidoEm: number | null; veioDe: string | null;
  concluidoPor: string | null;
  subtarefas: PlanItem[];
}
type Linha = { id: string; semana: string; tipo: PlanTipo; titulo: string; dia: number | null; formato: string; responsavel: string; status: PlanStatus; pai: string | null; ordem: number; notas: string; criado_em: number; concluido_em: number | null; veio_de: string | null };

/** Segunda-feira da semana de uma data (horário de Brasília). */
export function segundaDe(dia: string): string {
  const d = new Date(`${dia}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new BrainError("invalid", "Semana inválida.");
  const dow = (d.getUTCDay() + 6) % 7; // 0 = segunda
  return new Date(d.getTime() - dow * DAY).toISOString().slice(0, 10);
}
export const semanaAtual = (brain: Brain): string => segundaDe(brtDay(brain.clock()));
const somaDias = (dia: string, n: number) => new Date(Date.parse(`${dia}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);
export const responsaveis = (brain: Brain): string[] => brain.policy<string[]>("plan_responsaveis", RESPONSAVEIS_PADRAO);

const ver = (l: Linha): PlanItem => ({ id: l.id, semana: l.semana, tipo: l.tipo, titulo: l.titulo, dia: l.dia, formato: l.formato, responsavel: l.responsavel, status: l.status, pai: l.pai, ordem: l.ordem, notas: l.notas, criadoEm: l.criado_em, concluidoEm: l.concluido_em, veioDe: l.veio_de, concluidoPor: null, subtarefas: [] });

export function itensDa(brain: Brain, semana: string): PlanItem[] {
  const todos = rows<Linha>(brain.db, "select * from plan_itens where semana = ? order by ordem, criado_em", semana).map(ver);
  const porId = new Map(todos.map((i) => [i.id, i]));
  for (const m of rows<{ item_id: string; quem: string }>(brain.db, "select m.item_id, m.quem from plan_marcas m join plan_itens i on i.id = m.item_id where i.semana = ?", semana)) { const it = porId.get(m.item_id); if (it && it.status === "concluida") it.concluidoPor = m.quem; }
  for (const i of todos) if (i.pai) porId.get(i.pai)?.subtarefas.push(i);
  return todos.filter((i) => !i.pai);
}

export interface Taxa { total: number; concluidas: number; andamento: number; pendentes: number; taxa: number }
/** O que conta para a taxa: tarefa com subtarefas conta pelas subtarefas; sem subtarefas conta ela mesma. */
export const folhas = (itens: PlanItem[]): PlanItem[] => itens.flatMap((i) => (i.subtarefas.length ? i.subtarefas : [i]));
export function taxa(itens: PlanItem[]): Taxa {
  const f = folhas(itens);
  const concluidas = f.filter((i) => i.status === "concluida").length, andamento = f.filter((i) => i.status === "andamento").length;
  return { total: f.length, concluidas, andamento, pendentes: f.length - concluidas - andamento, taxa: f.length ? concluidas / f.length : 0 };
}

export interface PlanPainel {
  semana: string; fim: string; atual: string; ehAtual: boolean; responsaveis: string[];
  posts: PlanItem[]; tarefas: PlanItem[];
  resumo: { geral: Taxa; posts: Taxa; tarefas: Taxa; porResponsavel: (Taxa & { nome: string })[] };
  historico: (Taxa & { semana: string; posts: Taxa; tarefas: Taxa })[];
  acumulado: { geral: Taxa; porResponsavel: (Taxa & { nome: string })[] };
  pendentesAnterior: number;
  links: { token: string; responsavel: string }[];
}

const porResp = (itens: PlanItem[]): (Taxa & { nome: string })[] => {
  const g = new Map<string, PlanItem[]>();
  for (const i of folhas(itens)) { const n = i.responsavel || "Sem responsável"; g.set(n, [...(g.get(n) ?? []), { ...i, subtarefas: [] }]); }
  return [...g].map(([nome, l]) => ({ nome, ...taxa(l) })).sort((a, b) => b.total - a.total);
};

export function planPainel(brain: Brain, semanaPedida?: string): PlanPainel {
  const atual = semanaAtual(brain);
  const semana = semanaPedida ? segundaDe(semanaPedida) : atual;
  const itens = itensDa(brain, semana);
  const posts = itens.filter((i) => i.tipo === "post").sort((a, b) => (a.dia ?? 9) - (b.dia ?? 9) || a.ordem - b.ordem);
  const tarefas = itens.filter((i) => i.tipo === "tarefa");
  const semanas = rows<{ semana: string }>(brain.db, "select distinct semana from plan_itens order by semana desc limit 26").map((s) => s.semana);
  if (!semanas.includes(atual)) semanas.unshift(atual);
  const historico = semanas.slice(0, 12).map((s) => { const l = itensDa(brain, s); return { semana: s, ...taxa(l), posts: taxa(l.filter((i) => i.tipo === "post")), tarefas: taxa(l.filter((i) => i.tipo === "tarefa")) }; }).reverse();
  const tudo = semanas.filter((s) => s <= atual).flatMap((s) => itensDa(brain, s));
  const anterior = itensDa(brain, somaDias(semana, -7));
  const jaTrazidos = new Set(itens.map((i) => i.veioDe).filter(Boolean));
  return {
    semana, fim: somaDias(semana, 6), atual, ehAtual: semana === atual, responsaveis: responsaveis(brain), posts, tarefas,
    resumo: { geral: taxa(itens), posts: taxa(posts), tarefas: taxa(tarefas), porResponsavel: porResp(itens) },
    historico, acumulado: { geral: taxa(tudo), porResponsavel: porResp(tudo) },
    pendentesAnterior: anterior.filter((i) => i.status !== "concluida" && !jaTrazidos.has(i.id)).length,
    links: rows<{ token: string; responsavel: string }>(brain.db, "select token, responsavel from plan_links where semana = ? and revogado = 0 order by responsavel", semana),
  };
}

const texto = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
function pegar(brain: Brain, id: unknown): Linha {
  const l = row<Linha>(brain.db, "select * from plan_itens where id = ?", String(id ?? ""));
  if (!l) throw new BrainError("not_found", "Item não encontrado.");
  return l;
}
/** Tarefa com subtarefas: o status acompanha as subtarefas (todas feitas = concluída; alguma mexida = em andamento). */
function sincronizarPai(brain: Brain, pai: string | null): void {
  if (!pai) return;
  const subs = rows<{ status: PlanStatus }>(brain.db, "select status from plan_itens where pai = ?", pai);
  if (!subs.length) return;
  const st: PlanStatus = subs.every((s) => s.status === "concluida") ? "concluida" : subs.some((s) => s.status !== "pendente") ? "andamento" : "pendente";
  run(brain.db, "update plan_itens set status = ?, concluido_em = ? where id = ?", st, st === "concluida" ? brain.clock() : null, pai);
}

export function planAcao(brain: Brain, body: Record<string, unknown>): PlanPainel {
  const acao = String(body.acao ?? "");
  const agora = brain.clock();
  let semana = body.semana ? segundaDe(String(body.semana)) : semanaAtual(brain);
  if (acao === "criar") {
    const titulo = texto(body.titulo, 300);
    if (!titulo) throw new BrainError("invalid", "Escreva o título.");
    const pai = body.pai ? pegar(brain, body.pai) : null;
    if (pai?.pai) throw new BrainError("invalid", "Subtarefa não pode ter subtarefa.");
    const tipo: PlanTipo = pai ? pai.tipo : body.tipo === "post" ? "post" : "tarefa";
    if (pai) semana = pai.semana;
    const dia = tipo === "post" && body.dia != null && body.dia !== "" ? Math.min(6, Math.max(0, Number(body.dia) | 0)) : null;
    const resp = texto(body.responsavel, 60) || pai?.responsavel || "";
    const ordem = (row<{ m: number | null }>(brain.db, "select max(ordem) as m from plan_itens where semana = ?", semana)?.m ?? 0) + 1;
    run(brain.db, "insert into plan_itens (id, semana, tipo, titulo, dia, formato, responsavel, status, pai, ordem, notas, criado_em) values (?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, '', ?)", crypto.randomUUID(), semana, tipo, titulo, dia, texto(body.formato, 30), resp, pai?.id ?? null, ordem, agora);
    sincronizarPai(brain, pai?.id ?? null);
  } else if (acao === "editar") {
    const l = pegar(brain, body.id);
    semana = l.semana;
    const titulo = body.titulo !== undefined ? texto(body.titulo, 300) : l.titulo;
    if (!titulo) throw new BrainError("invalid", "O título não pode ficar vazio.");
    const dia = body.dia !== undefined ? (body.dia === null || body.dia === "" ? null : Math.min(6, Math.max(0, Number(body.dia) | 0))) : l.dia;
    run(brain.db, "update plan_itens set titulo = ?, dia = ?, formato = ?, responsavel = ?, notas = ? where id = ?", titulo, dia, body.formato !== undefined ? texto(body.formato, 30) : l.formato, body.responsavel !== undefined ? texto(body.responsavel, 60) : l.responsavel, body.notas !== undefined ? texto(body.notas, 2000) : l.notas, l.id);
  } else if (acao === "status") {
    const l = pegar(brain, body.id);
    semana = l.semana;
    const st = String(body.status) as PlanStatus;
    if (!STATUS.has(st)) throw new BrainError("invalid", "Status inválido.");
    run(brain.db, "update plan_itens set status = ?, concluido_em = ? where id = ?", st, st === "concluida" ? agora : null, l.id);
    // marcar a tarefa-mãe como concluída (ou reabrir) leva as subtarefas junto
    const filhos = !l.pai && st !== "andamento" ? rows<{ id: string }>(brain.db, "select id from plan_itens where pai = ?", l.id).map((f) => f.id) : [];
    if (filhos.length) run(brain.db, "update plan_itens set status = ?, concluido_em = ? where pai = ?", st, st === "concluida" ? agora : null, l.id);
    sincronizarPai(brain, l.pai);
    // quem concluiu: só aparece quando veio pelo link compartilhado; mexer pelo Central apaga a marca
    const quem = body.via === "link" ? texto(body.quem, 60) : "";
    for (const id of [l.id, ...filhos, ...(l.pai ? [l.pai] : [])]) {
      const atual = row<{ status: PlanStatus }>(brain.db, "select status from plan_itens where id = ?", id);
      if (quem && atual?.status === "concluida") run(brain.db, "insert or replace into plan_marcas (item_id, quem, em) values (?, ?, ?)", id, quem, agora);
      else run(brain.db, "delete from plan_marcas where item_id = ?", id);
    }
  } else if (acao === "remover") {
    const l = pegar(brain, body.id);
    semana = l.semana;
    run(brain.db, "delete from plan_marcas where item_id = ? or item_id in (select id from plan_itens where pai = ?)", l.id, l.id);
    run(brain.db, "delete from plan_itens where id = ? or pai = ?", l.id, l.id);
    sincronizarPai(brain, l.pai);
  } else if (acao === "trazer_pendentes") {
    // copia para esta semana o que ficou aberto na anterior (o original fica lá, como registro do que não foi feito)
    const ja = new Set(rows<{ v: string | null }>(brain.db, "select veio_de as v from plan_itens where semana = ?", semana).map((r) => r.v));
    let ordem = row<{ m: number | null }>(brain.db, "select max(ordem) as m from plan_itens where semana = ?", semana)?.m ?? 0;
    for (const i of itensDa(brain, somaDias(semana, -7))) {
      if (i.status === "concluida" || ja.has(i.id)) continue;
      const novo = crypto.randomUUID();
      run(brain.db, "insert into plan_itens (id, semana, tipo, titulo, dia, formato, responsavel, status, pai, ordem, notas, criado_em, veio_de) values (?, ?, ?, ?, ?, ?, ?, 'pendente', null, ?, ?, ?, ?)", novo, semana, i.tipo, i.titulo, i.dia, i.formato, i.responsavel, ++ordem, i.notas, agora, i.id);
      for (const s of i.subtarefas) if (s.status !== "concluida") run(brain.db, "insert into plan_itens (id, semana, tipo, titulo, dia, formato, responsavel, status, pai, ordem, notas, criado_em, veio_de) values (?, ?, ?, ?, null, '', ?, 'pendente', ?, ?, '', ?, ?)", crypto.randomUUID(), semana, s.tipo, s.titulo, s.responsavel, novo, ++ordem, agora, s.id);
    }
  } else if (acao === "compartilhar") {
    criarLink(brain, semana, texto(body.responsavel, 60));
  } else if (acao === "compartilhar_todos") {
    criarLink(brain, semana, "");
    const nomes = new Set([...responsaveis(brain), ...folhas(itensDa(brain, semana)).map((i) => i.responsavel).filter(Boolean)]);
    for (const n of nomes) criarLink(brain, semana, n);
  } else if (acao === "revogar_links") {
    run(brain.db, "update plan_links set revogado = 1 where semana = ?", semana);
    brain.audit("voce", "plan_links_revogados", semana);
  } else throw new BrainError("invalid", "Ação desconhecida.");
  brain.emit("change");
  return planPainel(brain, semana);
}
