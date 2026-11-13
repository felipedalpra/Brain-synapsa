import { DurableObject } from "cloudflare:workers";
import { Brain, avancar as prospAvancar, gerarRascunhos, rodarRotina, LoginLimiter, Runner, SCHEMA, complianceReviewer, createAuth, createHandler, integrationsView, llmChat, llmConfig, makeThinker, ruleChat, runChecks, seedKnownFacts } from "@brain/core";
import { doDb } from "./do-db";

export interface Env {
  BRAIN: DurableObjectNamespace<BrainDO>;
  ASSETS: Fetcher;
  [k: string]: unknown;
}

const strings = (env: Record<string, unknown>): Record<string, string | undefined> =>
  Object.fromEntries(Object.entries(env).filter((e): e is [string, string] => typeof e[1] === "string"));

/** O Brain inteiro vive aqui: um Durable Object com SQLite. Uma instância só ("brain"), então não há concorrência entre dois escritores. */
export class BrainDO extends DurableObject<Env> {
  private brain: Brain;
  private runner: Runner;
  private handle: ReturnType<typeof createHandler>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const e = strings(env as Record<string, unknown>);
    const brain = new Brain(doDb(ctx.storage as never, SCHEMA));
    brain.reviewer = complianceReviewer;
    const jarvisCfg = llmConfig(e, "jarvis");
    const agentCfg = llmConfig(e, "agent");
    brain.llm = jarvisCfg !== null;
    this.runner = new Runner(brain, e, agentCfg ? makeThinker(agentCfg) : undefined);
    seedKnownFacts(brain);
    // Trabalho novo ou mudança: garante um alarme para recuperar o que o reinício interromper.
    brain.on("queued", () => void this.arm(60_000));
    brain.on("prospeccao", () => void this.arm(20_000));

    const integrations = () => integrationsView(brain.db, e, brain.clock());
    const rules = ruleChat(brain, integrations);
    const auth = createAuth(e, new LoginLimiter());
    this.brain = brain;
    this.handle = createHandler({
      brain,
      env: e,
      authorize: auth.authorize,
      chat: jarvisCfg ? llmChat(brain, integrations, jarvisCfg, rules, fetch, e) : rules,
      checkIntegrations: async () => void (await runChecks(brain.db, e, brain.clock())),
    });
  }

  private async arm(ms: number) {
    const cur = await this.ctx.storage.getAlarm();
    if (cur === null || cur > Date.now() + ms) await this.ctx.storage.setAlarm(Date.now() + ms);
  }

  async fetch(req: Request): Promise<Response> {
    return (await this.handle(req)) ?? new Response(JSON.stringify({ error: "não encontrado" }), { status: 404, headers: { "content-type": "application/json" } });
  }

  /** Cron das 7h (Brasília) e alarmes: recupera o que ficou pendurado e roda a rotina do dia se for a hora. */
  async daily(): Promise<{ failed: number; resumed: number; started: boolean }> {
    const rec = this.runner.recover();
    try { gerarRascunhos(this.brain); } catch { /* follow-ups vencidos viram rascunho; erro aqui não pode parar a rotina */ }
    const started = this.runner.tick();
    await this.runner.idle();
    return { ...rec, started };
  }

  /** Dias úteis, 10h (Brasília): começa a busca do dia. Ler sites, CRM e rascunhos encadeiam sozinhos quando cada etapa termina. */
  async rotina(): Promise<string> {
    const msg = await rodarRotina(this.brain, strings(this.env as Record<string, unknown>));
    await this.arm(20_000);
    return msg;
  }

  async alarm(): Promise<void> {
    await this.daily();
    const busy = this.brain.db.prepare("select count(*) as n from agent_runs where status in ('queued','running')").get() as { n: number };
    if (busy.n > 0) await this.arm(60_000);
    // Rodadas do Apify em andamento: confere e processa o que terminou.
    const rod = this.brain.db.prepare("select count(*) as n from prospect_runs where status = 'rodando'").get() as { n: number };
    if (rod.n > 0) {
      const r = await prospAvancar(this.brain, strings(this.env as Record<string, unknown>)).catch(() => null);
      if (!r || r.pendentes > 0) await this.arm(30_000);
    }
  }
}
