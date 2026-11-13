import { afterEach, describe, expect, it, vi } from "vitest";
import { Brain } from "../src/brain";
import { complianceReviewer } from "../src/compliance";
import { openDb } from "../src/db";
import { Runner } from "../src/runner";
import { seedKnownFacts } from "../src/seed";

afterEach(() => vi.unstubAllGlobals());

const mk = (env: Record<string, string | undefined> = {}, now = "2026-10-16T15:00:00Z", thinker?: ConstructorParameters<typeof Runner>[2]) => {
  let t = Date.parse(now);
  const brain = new Brain(openDb(":memory:"), () => t);
  brain.reviewer = complianceReviewer;
  seedKnownFacts(brain);
  const runner = new Runner(brain, env, thinker);
  return { brain, runner, setNow: (iso: string) => (t = Date.parse(iso)) };
};
const lastRun = (b: Brain, agent: string) => b.db.prepare("select * from agent_runs where agent_id = ? order by id desc limit 1").get(agent) as { status: string; result: string; error: string | null };

describe("Runner", () => {
  it("Guardião fecha o MRR do dia sem chave do Stripe e avisa que usou o informado", async () => {
    const { brain, runner } = mk();
    brain.assignTask("guardiao", "conciliar");
    await runner.idle();
    expect(lastRun(brain, "guardiao")).toMatchObject({ status: "done" });
    expect(lastRun(brain, "guardiao").result).toMatch(/R\$ 496/);
    expect(lastRun(brain, "guardiao").result).toMatch(/Sem STRIPE_READ_KEY/);
    const day = brain.db.prepare("select mrr_brl from mrr_daily where source = 'total'").get() as { mrr_brl: number };
    expect(day.mrr_brl).toBe(496);
    expect(brain.runtime().guardiao!.status).toBe("ocioso");
  });

  it("abre contato de retenção quando faltam 30 dias ou menos, sem oferecer desconto", async () => {
    const { brain, runner } = mk({}, "2026-12-30T15:00:00Z"); // 24 dias para 23/01/2027
    brain.assignTask("guardiao", "x");
    await runner.idle();
    const props = brain.snapshot([]).proposals.filter((p) => p.status === "pendente");
    expect(props).toHaveLength(2);
    expect(props[0]!.channel).toBe("tarefa");
    expect(props[0]!.why).toMatch(/nenhum agente oferece desconto/);
    expect(props.every((p) => !/desconto de|cupom/i.test(p.draft ?? ""))).toBe(true);
    // rodar de novo não duplica
    brain.assignTask("guardiao", "x");
    await runner.idle();
    expect(brain.snapshot([]).proposals.filter((p) => p.status === "pendente")).toHaveLength(2);
  });

  it("com STRIPE_READ_KEY troca as assinaturas informadas pelas reais e só faz GET", async () => {
    const calls: { url: string; method?: string }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string, init?: RequestInit) => {
      calls.push({ url: String(u), method: init?.method });
      return Response.json({ has_more: false, data: [{ id: "sub_1", status: "active", customer: "cus_1", items: { data: [{ quantity: 1, price: { unit_amount: 11900, recurring: { interval: "month" } } }] }, discounts: [{ coupon: { percent_off: 58.8 }, end: Math.floor(Date.parse("2027-01-23T12:00:00Z") / 1000) }] }] });
    }));
    const { brain, runner } = mk({ STRIPE_READ_KEY: "rk_test_x" });
    brain.assignTask("guardiao", "x");
    await runner.idle();
    expect(calls.every((c) => !c.method || c.method === "GET")).toBe(true);
    const subs = brain.db.prepare("select source, external_id, origin from subscriptions where source = 'stripe'").all() as { external_id: string; origin: string }[];
    expect(subs).toEqual([{ source: "stripe", external_id: "sub_1", origin: "sincronizado" }]);
    expect(brain.metrics().mrr.stripe).toBeCloseTo(49, 0);
  });

  it("erro do Stripe vira falha registrada e não apaga os dados informados", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 401 })));
    const { brain, runner } = mk({ STRIPE_READ_KEY: "rk_bad" });
    brain.assignTask("guardiao", "x");
    await runner.idle();
    expect(lastRun(brain, "guardiao")).toMatchObject({ status: "error" });
    expect(brain.metrics().mrr.stripe).toBe(147);
    expect(brain.snapshot([]).activity[0]!.text).toMatch(/Falhou/);
  });

  it("Mídia Paga sem token fica bloqueada com motivo claro", async () => {
    const { brain, runner } = mk();
    brain.assignTask("midia", "ler anúncios");
    await runner.idle();
    expect(lastRun(brain, "midia")).toMatchObject({ status: "blocked" });
    expect(lastRun(brain, "midia").result).toMatch(/META_SYSTEM_USER_TOKEN/);
  });

  it("Mídia Paga com token abre proposta para campanha sem lead e só faz GET", async () => {
    const methods: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (u: string, init?: RequestInit) => {
      methods.push(init?.method ?? "GET");
      const url = String(u);
      if (url.includes("act_1/insights")) return Response.json({ data: [{ date_start: "2026-10-15", campaign_id: "c1", campaign_name: "Autônomos", account_currency: "BRL", spend: "84", impressions: "5000", clicks: "212", actions: [] }] });
      if (url.includes("ig1/insights")) return Response.json({ data: [] });
      return Response.json({ followers_count: 400 });
    }));
    const { brain, runner } = mk({ META_SYSTEM_USER_TOKEN: "t", META_AD_ACCOUNT_ID: "act_1", META_IG_ID: "ig1" });
    brain.assignTask("midia", "ler anúncios");
    await runner.idle();
    expect(methods.every((m) => m === "GET")).toBe(true);
    const p = brain.snapshot([]).proposals.find((x) => x.agentId === "midia")!;
    expect(p).toMatchObject({ status: "pendente", channel: "interno", impactoBrl: 84 });
    expect(p.title).toMatch(/Autônomos/);
  });

  it("agente sem rotina e sem LLM fica bloqueado, sem inventar resultado", async () => {
    const { brain, runner } = mk();
    brain.assignTask("sdr", "responder o lead");
    await runner.idle();
    expect(lastRun(brain, "sdr")).toMatchObject({ status: "blocked" });
    expect(lastRun(brain, "sdr").result).toMatch(/OPENAI_API_KEY/);
    expect(brain.snapshot([]).proposals).toHaveLength(0);
  });

  it("com raciocínio disponível, proposta passa pela Conformidade e custo entra no dia", async () => {
    const thinker = async () => ({
      status: "done" as const,
      result: "Preparei 2 mensagens.",
      costBrl: 0.42,
      proposals: [
        { agentId: "sdr", kind: "resposta", title: "Responder lead", draft: "Oi, posso te mostrar em 5 min?", why: "pediu", risk: "baixo" as const, channel: "linkedin" as const, contactRef: "lead-1" },
        { agentId: "sdr", kind: "resposta", title: "Prometer", draft: "Garantimos resultado em 30 dias", why: "x", risk: "baixo" as const, channel: "linkedin" as const, contactRef: "lead-2" },
      ],
    });
    const { brain, runner } = mk({}, undefined, thinker);
    brain.assignTask("sdr", "responder");
    await runner.idle();
    const snap = brain.snapshot([]);
    expect(snap.proposals.filter((p) => p.status === "pendente").map((p) => p.title)).toEqual(["Responder lead"]);
    expect(snap.activity.some((a) => a.agentId === "compliance" && a.text.includes("Prometer"))).toBe(true);
    expect(snap.runtime.sdr).toMatchObject({ runsToday: 1, costBrl: 0.42 });
  });

  it("botão de emergência no meio da execução descarta o resultado", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const thinker = async () => {
      await gate;
      return { status: "done" as const, result: "pronto", proposals: [{ agentId: "sdr", kind: "x", title: "Não deve entrar", why: "w", risk: "baixo" as const, channel: "interno" as const }] };
    };
    const { brain, runner } = mk({}, undefined, thinker);
    brain.assignTask("sdr", "x");
    brain.setKill(true);
    release();
    await runner.idle();
    expect(brain.snapshot([]).proposals).toHaveLength(0);
    expect(lastRun(brain, "sdr").status).toBe("error");
  });

  it("rotina diária roda os coletores e termina com o briefing do Chief", async () => {
    const { brain, runner } = mk();
    await runner.runDaily();
    await runner.idle();
    for (const a of ["guardiao", "financeiro", "midia", "chief"]) expect(lastRun(brain, a)).toBeTruthy();
    expect(lastRun(brain, "chief").result).toMatch(/Briefing/);
    expect(brain.policy("last_daily", null)).toBe("2026-10-16");
  });

  it("rotina diária pula agente pausado e não roda com o kill switch ligado", async () => {
    const { brain, runner } = mk();
    brain.setPaused("financeiro", true);
    await runner.runDaily();
    expect(brain.db.prepare("select count(*) as n from agent_runs where agent_id = 'financeiro'").get()).toEqual({ n: 0 });
    brain.setKill(true);
    const before = (brain.db.prepare("select count(*) as n from agent_runs").get() as { n: number }).n;
    await runner.runDaily();
    expect((brain.db.prepare("select count(*) as n from agent_runs").get() as { n: number }).n).toBe(before);
  });

  it("agendador roda uma vez por dia depois das 7h de Brasília", async () => {
    vi.useFakeTimers();
    const { brain, runner, setNow } = mk({}, "2026-10-16T09:00:00Z"); // 06:00 BRT
    const stop = runner.start(1000);
    await vi.advanceTimersByTimeAsync(6000);
    expect(brain.policy("last_daily", null)).toBeNull();
    setNow("2026-10-16T10:30:00Z"); // 07:30 BRT
    await vi.advanceTimersByTimeAsync(2000);
    expect(brain.policy("last_daily", null)).toBe("2026-10-16");
    const n = (brain.db.prepare("select count(*) as n from agent_runs").get() as { n: number }).n;
    await vi.advanceTimersByTimeAsync(5000);
    expect((brain.db.prepare("select count(*) as n from agent_runs").get() as { n: number }).n).toBe(n);
    stop();
    vi.useRealTimers();
  });
});
