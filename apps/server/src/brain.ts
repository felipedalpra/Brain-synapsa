import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { AGENTS, type Activity, type AgentRuntime, type Channel, type Metrics, type Proposal, type Risk, type Snapshot } from "@brain/shared";
import { mrrBySource } from "../../worker/src/mrr";
import type { SubscriptionRow } from "../../worker/src/types";
import { row, rows, run, type Db } from "./db";

export class BrainError extends Error {
  constructor(
    readonly code: "kill_switch" | "not_found" | "invalid" | "paused" | "already_decided",
    message: string,
  ) {
    super(message);
  }
}

/** Dia no fuso de Brasília (UTC-3), formato AAAA-MM-DD. */
export const brtDay = (ms: number): string => new Date(ms - 3 * 3_600_000).toISOString().slice(0, 10);
export const brtStartOfDay = (ms: number): number => Date.parse(`${brtDay(ms)}T00:00:00-03:00`);
const brtStartOfMonth = (ms: number): number => Date.parse(`${brtDay(ms).slice(0, 8)}01T00:00:00-03:00`);

export interface ProposalInput {
  agentId: string;
  kind: string;
  title: string;
  draft?: string | null;
  why: string;
  impactoBrl?: number;
  risk: Risk;
  channel: Channel;
  contactRef?: string | null;
  payload?: Record<string, unknown>;
  dedupeKey?: string;
}

export type Reviewer = (p: ProposalInput, ctx: { db: Db; now: number }) => { ok: boolean; note?: string };

interface ProposalRow {
  id: string;
  agent_id: string;
  title: string;
  draft: string | null;
  why: string;
  impacto_brl: number;
  risk: Risk;
  channel: Channel;
  status: "pendente" | "aprovada" | "rejeitada";
  review: Proposal["review"];
  created_at: number;
}

const EXTERNAL: Channel[] = ["whatsapp", "email", "linkedin", "instagram"];

export class Brain extends EventEmitter {
  reviewer: Reviewer = () => ({ ok: true });
  llm = false;

  constructor(
    readonly db: Db,
    readonly clock: () => number = Date.now,
  ) {
    super();
    this.init();
  }

  private init(): void {
    const now = this.clock();
    for (const a of AGENTS) run(this.db, "insert or ignore into agent_state (agent_id) values (?)", a.id);
    run(this.db, "insert or ignore into kill_switch (id, engaged, changed_at) values (1, 0, ?)", now);
    const defaults: Record<string, unknown> = {
      daily_proposal_cap: 15,
      monthly_llm_cap_brl: 300,
      contact_policy: { start_hour: 9, end_hour: 19, min_days_between: 3 },
      mrr_goal: { value: 1200, date: "31/12/2026" },
      essencial_price: 79,
    };
    for (const [k, v] of Object.entries(defaults)) run(this.db, "insert or ignore into policies (key, value) values (?, ?)", k, JSON.stringify(v));
  }

  policy<T>(key: string, fallback: T): T {
    const r = row<{ value: string }>(this.db, "select value from policies where key = ?", key);
    return r ? (JSON.parse(r.value) as T) : fallback;
  }

  setPolicy(key: string, value: unknown): void {
    run(this.db, "insert into policies (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", key, JSON.stringify(value));
    this.emit("change");
  }

  audit(actor: string, action: string, ref?: string, detail?: unknown): void {
    run(this.db, "insert into audit_log (at, actor, action, ref, detail) values (?, ?, ?, ?, ?)", this.clock(), actor, action, ref ?? null, detail === undefined ? null : JSON.stringify(detail));
  }

  log(agentId: Activity["agentId"], text: string, tone: Activity["tone"] = "normal"): void {
    run(this.db, "insert into activity (agent_id, text, tone, at) values (?, ?, ?, ?)", agentId, text, tone, this.clock());
    this.emit("change");
  }

  agentName(id: string): string {
    return AGENTS.find((a) => a.id === id)?.name ?? id;
  }

  // ---- Kill switch -------------------------------------------------------

  killed(): boolean {
    return (row<{ engaged: number }>(this.db, "select engaged from kill_switch where id = 1")?.engaged ?? 1) === 1;
  }

  setKill(on: boolean, actor = "voce"): void {
    const now = this.clock();
    run(this.db, "update kill_switch set engaged = ?, changed_at = ? where id = 1", on ? 1 : 0, now);
    if (on) {
      run(this.db, "update agent_state set status = 'ocioso' where status = 'trabalhando'");
      run(this.db, "update agent_runs set status = 'error', error = 'Interrompida pelo botão de emergência', finished_at = ? where status in ('queued','running')", now);
    }
    this.audit(actor, on ? "kill_on" : "kill_off");
    this.log("sistema", on ? "Botão de emergência ligado. Todos os agentes pararam." : "Botão de emergência desligado. Agentes liberados.", on ? "alerta" : "ok");
    this.emit("kill", on);
  }

  // ---- Agentes -----------------------------------------------------------

  private requireAgent(id: string): void {
    if (!AGENTS.some((a) => a.id === id)) throw new BrainError("not_found", `Agente desconhecido: ${id}`);
  }

  setPaused(agentId: string, paused: boolean, actor = "voce"): void {
    this.requireAgent(agentId);
    run(this.db, "update agent_state set paused = ?, status = case when ? = 1 then 'ocioso' else status end where agent_id = ?", paused ? 1 : 0, paused ? 1 : 0, agentId);
    this.audit(actor, paused ? "pause" : "resume", agentId);
    this.log("voce", paused ? `Pausou ${this.agentName(agentId)}.` : `Retomou ${this.agentName(agentId)}.`);
  }

  /** Enfileira uma tarefa. Quem executa é o runtime (ouve o evento `queued`). */
  assignTask(agentId: string, task: string, requestedBy = "voce"): number {
    this.requireAgent(agentId);
    const clean = task.trim();
    if (!clean) throw new BrainError("invalid", "Tarefa vazia.");
    if (this.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado.");
    const st = row<{ paused: number }>(this.db, "select paused from agent_state where agent_id = ?", agentId);
    if (st?.paused) throw new BrainError("paused", `${this.agentName(agentId)} está pausado.`);
    const res = run(this.db, "insert into agent_runs (agent_id, task, status, requested_by, created_at) values (?, ?, 'queued', ?, ?)", agentId, clean, requestedBy, this.clock());
    const id = Number(res.lastInsertRowid);
    run(this.db, "update agent_state set status = 'trabalhando' where agent_id = ?", agentId);
    this.audit(requestedBy, "task", agentId, { task: clean, run: id });
    this.log(requestedBy === "voce" ? "voce" : "sistema", `${requestedBy === "voce" ? "Pediu a" : "Acionou"} ${this.agentName(agentId)}: ${clean}`);
    this.emit("queued", id);
    return id;
  }

  finishRun(runId: number, r: { status: "done" | "blocked" | "error"; result?: string; error?: string; costBrl?: number }): void {
    const now = this.clock();
    const cur = row<{ agent_id: string; status: string }>(this.db, "select agent_id, status from agent_runs where id = ?", runId);
    if (!cur || cur.status === "error") return; // já interrompida (kill switch)
    run(this.db, "update agent_runs set status = ?, result = ?, error = ?, cost_brl = ?, finished_at = ? where id = ?", r.status, r.result ?? null, r.error ?? null, r.costBrl ?? 0, now, runId);
    const others = row<{ n: number }>(this.db, "select count(*) as n from agent_runs where agent_id = ? and status in ('queued','running')", cur.agent_id)?.n ?? 0;
    run(this.db, "update agent_state set status = ?, last_action = ?, last_at = ? where agent_id = ?", others > 0 ? "trabalhando" : "ocioso", r.status === "done" ? (r.result ?? "Concluiu.") : r.status === "blocked" ? (r.result ?? "Não conseguiu rodar.") : `Falhou: ${r.error ?? "erro"}`, now, cur.agent_id);
    this.emit("change");
  }

  // ---- Propostas ---------------------------------------------------------

  /** Cria a proposta depois da Conformidade. Devolve o id, ou null se for duplicada ou barrada. */
  addProposal(p: ProposalInput): string | null {
    const now = this.clock();
    this.requireAgent(p.agentId);
    if (p.dedupeKey && row(this.db, "select 1 as x from proposals where dedupe_key = ?", p.dedupeKey)) return null;
    const verdict = this.reviewer(p, { db: this.db, now });
    const id = randomUUID();
    run(
      this.db,
      `insert into proposals (id, agent_id, kind, title, draft, why, impacto_brl, risk, channel, status, review, review_note, contact_ref, payload, dedupe_key, created_at, decided_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, p.agentId, p.kind, p.title, p.draft ?? null, p.why, p.impactoBrl ?? 0, p.risk, p.channel,
      verdict.ok ? "pendente" : "rejeitada",
      verdict.ok ? "aprovada pela conformidade" : "sinalizada",
      verdict.note ?? null, p.contactRef ?? null, JSON.stringify(p.payload ?? {}), p.dedupeKey ?? null, now, verdict.ok ? null : now,
    );
    if (verdict.ok) this.log(p.agentId, `Deixou na sua fila: ${p.title}`);
    else this.log("compliance", `Barrou "${p.title}" (${this.agentName(p.agentId)}): ${verdict.note ?? "fora da política"}`, "alerta");
    return verdict.ok ? id : null;
  }

  /** Fila do dia: pendentes por impacto em reais, até o teto diário. */
  queueIds(): string[] {
    const cap = this.policy("daily_proposal_cap", 15);
    return rows<{ id: string }>(this.db, "select id from proposals where status = 'pendente' order by impacto_brl desc, created_at asc limit ?", cap).map((r) => r.id);
  }

  decide(id: string, to: "aprovada" | "rejeitada", actor = "voce"): void {
    const p = row<ProposalRow & { contact_ref: string | null }>(this.db, "select * from proposals where id = ?", id);
    if (!p) throw new BrainError("not_found", "Proposta não encontrada.");
    if (p.status !== "pendente") throw new BrainError("already_decided", "Essa proposta já foi decidida.");
    if (to === "aprovada" && this.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado: aprovações bloqueadas.");
    const now = this.clock();
    run(this.db, "update proposals set status = ?, decided_at = ? where id = ?", to, now, id);
    run(this.db, "insert into approvals (proposal_id, decision, actor, at) values (?, ?, ?, ?)", id, to, actor, now);
    if (to === "aprovada" && p.contact_ref && EXTERNAL.includes(p.channel)) run(this.db, "insert into contact_log (contact_ref, channel, proposal_id, at) values (?, ?, ?, ?)", p.contact_ref, p.channel, id, now);
    this.audit(actor, to === "aprovada" ? "approve" : "reject", id);
    this.log("voce", `${to === "aprovada" ? "Aprovou" : "Rejeitou"}: ${p.title} (${this.agentName(p.agent_id)})`, to === "aprovada" ? "ok" : "normal");
    this.emit("decided", id, to);
  }

  approveLowRisk(actor = "voce"): number {
    if (this.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado: aprovações bloqueadas.");
    const queue = new Set(this.queueIds());
    const low = rows<{ id: string }>(this.db, "select id from proposals where status = 'pendente' and risk = 'baixo'").filter((r) => queue.has(r.id));
    for (const r of low) this.decide(r.id, "aprovada", actor);
    return low.length;
  }

  // ---- Leitura -----------------------------------------------------------

  metrics(): Metrics {
    const subs = rows<SubscriptionRow>(this.db, "select source, external_id, professional_id, label, list_price_brl, effective_price_brl, discount_ends_at, status from subscriptions");
    const { bySource, total } = mrrBySource(subs);
    const goal = this.policy("mrr_goal", { value: 1200, date: "31/12/2026" });
    const groups = new Map<string, { quando: string; contas: number; de: number; para: number }>();
    for (const s of subs) {
      if (!s.discount_ends_at || !["active", "trialing", "past_due"].includes(s.status)) continue;
      const d = new Date(s.discount_ends_at);
      if (d.getTime() < this.clock()) continue;
      const quando = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const k = `${quando}|${s.effective_price_brl}|${s.list_price_brl}`;
      const g = groups.get(k) ?? { quando, contas: 0, de: s.effective_price_brl, para: s.list_price_brl };
      g.contas += 1;
      groups.set(k, g);
    }
    const spent = row<{ s: number | null }>(this.db, "select sum(cost_brl) as s from agent_runs where created_at >= ?", brtStartOfMonth(this.clock()))?.s ?? 0;
    return {
      mrr: { stripe: bySource.stripe.mrr, pix: bySource.pix.mrr, manual: bySource.manual.mrr, total, goal: goal.value, goalDate: goal.date, essencialPrice: this.policy("essencial_price", 79) },
      funil: this.policy<Metrics["funil"]>("funil", null),
      llmCapMonthlyBrl: this.policy("monthly_llm_cap_brl", 300),
      llmSpentMonthBrl: Math.round(spent * 100) / 100,
      descontos: [...groups.values()].sort((a, b) => a.quando.split("/").reverse().join().localeCompare(b.quando.split("/").reverse().join())),
    };
  }

  runtime(): Record<string, AgentRuntime> {
    const since = brtStartOfDay(this.clock());
    const today = new Map(rows<{ agent_id: string; n: number; c: number }>(this.db, "select agent_id, count(*) as n, coalesce(sum(cost_brl),0) as c from agent_runs where created_at >= ? group by agent_id", since).map((r) => [r.agent_id, r]));
    const out: Record<string, AgentRuntime> = {};
    for (const s of rows<{ agent_id: string; paused: number; status: string; last_action: string | null; last_at: number | null }>(this.db, "select * from agent_state")) {
      const t = today.get(s.agent_id);
      out[s.agent_id] = {
        status: s.paused ? "pausado" : s.status === "trabalhando" ? "trabalhando" : "ocioso",
        lastAction: s.last_action ?? "Aguardando o próximo gatilho.",
        lastAt: s.last_at ?? 0,
        runsToday: t?.n ?? 0,
        costBrl: Math.round((t?.c ?? 0) * 100) / 100,
      };
    }
    return out;
  }

  snapshot(integrations: Snapshot["integrations"]): Snapshot {
    const queue = this.queueIds();
    const pendingTotal = row<{ n: number }>(this.db, "select count(*) as n from proposals where status = 'pendente'")?.n ?? 0;
    const toProposal = (r: ProposalRow): Proposal => ({ id: r.id, agentId: r.agent_id, title: r.title, draft: r.draft, why: r.why, impactoBrl: r.impacto_brl, risk: r.risk, channel: r.channel, status: r.status, at: r.created_at, review: r.review });
    const pending = queue.length ? rows<ProposalRow>(this.db, `select * from proposals where id in (${queue.map(() => "?").join(",")}) order by impacto_brl desc, created_at asc`, ...queue) : [];
    const decided = rows<ProposalRow>(this.db, "select * from proposals where status != 'pendente' order by coalesce(decided_at, created_at) desc limit 20");
    const activity = rows<{ id: number; agent_id: string; text: string; tone: Activity["tone"]; at: number }>(this.db, "select * from activity order by at desc, id desc limit 80").map((a) => ({ id: `a${a.id}`, agentId: a.agent_id, text: a.text, tone: a.tone, at: a.at }));
    return {
      now: this.clock(),
      mode: "live",
      runtime: this.runtime(),
      proposals: [...pending, ...decided].map(toProposal),
      overflow: Math.max(0, pendingTotal - queue.length),
      activity,
      integrations,
      kill: this.killed(),
      metrics: this.metrics(),
      llm: this.llm,
    };
  }
}
