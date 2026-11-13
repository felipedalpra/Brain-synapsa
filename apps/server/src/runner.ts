import { AGENTS, type Agent } from "@brain/shared";
import type { Brain } from "./brain";
import { brtDay } from "./brain";
import { row, run } from "./db";
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
  private inflight = new Set<Promise<void>>();

  constructor(
    private brain: Brain,
    private env: Env,
    private thinker?: Thinker,
  ) {
    brain.on("queued", (id: number) => void this.execute(id));
    brain.on("daily-requested", () => void this.runDaily());
  }

  /** Espera tudo que está rodando terminar (usado em testes e no desligamento). */
  async idle(): Promise<void> {
    while (this.inflight.size) await Promise.allSettled([...this.inflight]);
  }

  execute(runId: number): Promise<void> {
    const p = this.doExecute(runId).finally(() => this.inflight.delete(p));
    this.inflight.add(p);
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
          : { status: "blocked", result: `${agent.name} precisa raciocinar com a IA. Falta a OPENAI_API_KEY no .env.local. Sua tarefa ficou registrada.` };
      if (brain.killed()) return; // o botão de emergência já encerrou esta execução
      let made = 0;
      let barred = 0;
      for (const p of out.proposals ?? []) (brain.addProposal(p) ? made++ : barred++);
      const extra = made ? ` ${made} ${made === 1 ? "proposta nova" : "propostas novas"} na sua fila.` : "";
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

  /** Roda a rotina uma vez por dia, a partir das 7h de Brasília. Também recupera o dia se o computador estava desligado. */
  start(checkEveryMs = 60_000): () => void {
    const tick = () => {
      const hourBrt = (new Date(this.brain.clock()).getUTCHours() + 21) % 24;
      const last = this.brain.policy<string | null>("last_daily", null);
      if (hourBrt >= 7 && last !== brtDay(this.brain.clock()) && !this.brain.killed()) void this.runDaily();
    };
    const first = setTimeout(tick, 5_000);
    const t = setInterval(tick, checkEveryMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }
}
