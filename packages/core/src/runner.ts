import { AGENTS, playbookById, type Agent } from "@brain/shared";
import type { Brain } from "./brain";
import { brtDay } from "./brain";
import { row, rows, run } from "./sql";
import { HANDLERS, type Env, type HandlerCtx, type HandlerResult } from "./handlers";

/** Raciocínio por LLM para quem não tem rotina de código. Entra na fase 4. */
export type Thinker = (agent: Agent, task: string, ctx: HandlerCtx) => Promise<HandlerResult>;

interface RunRow {
  id: number;
  agent_id: string;
  task: string;
  status: string;
  requested_by: string;
}

export class Runner {
  private inflight = new Map<number, Promise<void>>();

  constructor(
    private brain: Brain,
    private env: Env,
    private thinker?: Thinker,
  ) {
    brain.on("queued", (id: number) => void this.execute(id));
    brain.on("daily-requested", () => void this.runDaily());
    brain.on("playbook-requested", (id: string) => void this.runPlaybook(id));
  }

  /** Espera tudo que está rodando terminar (usado em testes e no desligamento). */
  async idle(): Promise<void> {
    while (this.inflight.size) await Promise.allSettled([...this.inflight.values()]);
  }

  /** Executa a tarefa. Se já está rodando (o evento "queued" dispara sozinho), devolve a mesma promessa, para quem espera de fato esperar. */
  execute(runId: number): Promise<void> {
    const cur = this.inflight.get(runId);
    if (cur) return cur;
    const p = this.doExecute(runId).finally(() => this.inflight.delete(runId));
    this.inflight.set(runId, p);
    return p;
  }

  private async doExecute(runId: number): Promise<void> {
    const { brain } = this;
    const r = row<RunRow>(brain.db, "select id, agent_id, task, status, requested_by from agent_runs where id = ?", runId);
    if (!r || r.status !== "queued") return;
    const agent = AGENTS.find((a) => a.id === r.agent_id);
    if (!agent) return;
    run(brain.db, "update agent_runs set status = 'running' where id = ?", runId);
    const ctx: HandlerCtx = { brain, env: this.env, now: brain.clock() };
    try {
      const routine = HANDLERS[agent.id];
      const useThinker = this.thinker && !(routine && r.requested_by === "rotina");
      const out: HandlerResult = useThinker
        ? await this.thinker!(agent, r.task, ctx)
        : routine
          ? await routine(ctx)
          : { status: "blocked", result: `${agent.name} precisa raciocinar com a IA. Falta a OPENAI_API_KEY nos secrets. Sua tarefa ficou registrada.` };
      if (brain.killed()) return; // o botão de emergência já encerrou esta execução
      let made = 0;
      let barred = 0;
      for (const p of out.proposals ?? []) (brain.addProposal(p) ? made++ : barred++);
      const extra = made ? ` ${made} ${made === 1 ? "proposta nova" : "propostas novas"} na sua fila.` : "";
      if (out.entrega) run(brain.db, "insert into deliverables (run_id, agent_id, title, body, at) values (?, ?, ?, ?, ?)", runId, agent.id, r.task.split("\n")[0]!.slice(0, 160), out.entrega.slice(0, 20_000), brain.clock());
      brain.finishRun(runId, { status: out.status, result: out.result + extra, costBrl: out.costBrl });
      brain.log(agent.id, out.result + extra, out.status === "blocked" ? "alerta" : "ok");
      void barred;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      brain.finishRun(runId, { status: "error", error: msg.slice(0, 300) });
      if (!brain.killed()) brain.log(agent.id, `Falhou: ${msg.slice(0, 160)}`, "alerta");
    }
  }

  /** Rotina diária: os três coletores em paralelo e, por último, o briefing do Chief. */
  async runDaily(): Promise<void> {
    const { brain } = this;
    if (brain.killed()) return;
    brain.setPolicy("last_daily", brtDay(brain.clock()));
    const queue = (agent: string, task: string) => {
      try {
        return this.execute(brain.assignTask(agent, task, "rotina"));
      } catch {
        return Promise.resolve(); // agente pausado: pula
      }
    };
    await Promise.all([queue("guardiao", "Rotina diária: fechar o MRR e checar fins de desconto"), queue("financeiro", "Rotina diária: comparar o MRR com a meta"), queue("midia", "Rotina diária: ler anúncios e Instagram")]);
    await queue("chief", "Rotina diária: montar o briefing");
  }

  /** Lança um plano pronto: os passos rodam em paralelo e, se houver síntese, o Chief junta tudo por último. */
  async runPlaybook(id: string): Promise<void> {
    const { brain } = this;
    const pb = playbookById(id);
    if (!pb || brain.killed()) return;
    const by = `plano:${pb.id}`;
    const queue = (agent: string, task: string) => {
      try {
        return this.execute(brain.assignTask(agent, task, by));
      } catch {
        return Promise.resolve(); // agente pausado: pula
      }
    };
    await Promise.all(pb.passos.map((s) => queue(s.agentId, `${pb.titulo}: ${s.titulo}\n\n${s.instrucao}`)));
    if (pb.sintese && !brain.killed()) {
      await queue("chief", `${pb.titulo}: síntese\n\nObjetivo do plano: ${pb.objetivo}\nLeia as entregas dos agentes (consultar_dados, fonte "entregas") e escreva a leitura única para o Felipe: o que descobrimos, o que decidir agora e as 3 ações de maior impacto em R$, com números. Entregue pelo relatorio, com "entrega" completa.`);
    }
  }

  /** Roda a rotina do dia se já passou das 7h de Brasília e ainda não rodou hoje. Devolve true se disparou. */
  tick(): boolean {
    const hourBrt = (new Date(this.brain.clock()).getUTCHours() + 21) % 24;
    const last = this.brain.policy<string | null>("last_daily", null);
    if (hourBrt >= 7 && last !== brtDay(this.brain.clock()) && !this.brain.killed()) {
      void this.runDaily();
      return true;
    }
    return false;
  }

  /** Depois de um reinício: o que ficou "rodando" há mais de staleMs falhou; o que ficou na fila volta a rodar. */
  recover(staleMs = 15 * 60_000): { failed: number; resumed: number } {
    const { brain } = this;
    if (brain.killed()) return { failed: 0, resumed: 0 };
    const now = brain.clock();
    const stale = rows<{ id: number; agent_id: string }>(brain.db, "select id, agent_id from agent_runs where status = 'running' and created_at < ?", now - staleMs);
    for (const r of stale) brain.finishRun(r.id, { status: "error", error: "Interrompida por reinício do Brain" });
    const queued = rows<{ id: number }>(brain.db, "select id from agent_runs where status = 'queued'");
    for (const r of queued) void this.execute(r.id);
    return { failed: stale.length, resumed: queued.length };
  }

  /** Servidor local: confere a cada minuto. Na Cloudflare quem chama tick/recover é o alarme do Durable Object. */
  start(checkEveryMs = 60_000): () => void {
    const first = setTimeout(() => this.tick(), 5_000);
    const t = setInterval(() => this.tick(), checkEveryMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }
}
