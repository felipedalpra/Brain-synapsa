import { describe, expect, it } from "vitest";
import { AGENTS } from "@brain/shared";
import { Brain } from "../src/brain";
import { runChecks } from "../src/checks";
import { complianceReviewer } from "../src/compliance";
import { openDb } from "../src/node-db";
import { integrationsView } from "../src/integrations";
import { ruleChat } from "../src/jarvis";
import { llmChat } from "../src/jarvis-llm";
import { llmConfig, type Block } from "../src/llm";
import { Runner } from "../src/runner";
import { seedKnownFacts } from "../src/seed";
import { makeThinker } from "../src/thinker";

const ENV = { ANTHROPIC_API_KEY: "sk-ant-TESTE", STRIPE_READ_KEY: "rk_live_SEGREDO" };
const cfg = llmConfig(ENV, "jarvis")!;

/** Anthropic de mentira: devolve as respostas na ordem e guarda o que recebeu. */
function fakeApi(script: (Block[] | { status: number })[]) {
  const seen: { url: string; headers: Record<string, string>; body: any }[] = [];
  let i = 0;
  const f = (async (url: string, init: RequestInit) => {
    seen.push({ url: String(url), headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
    const step = script[i++]!;
    if (!Array.isArray(step)) return new Response("boom", { status: step.status });
    return Response.json({ content: step, stop_reason: step.some((b) => b.type === "tool_use") ? "tool_use" : "end_turn", usage: { input_tokens: 1000, output_tokens: 200 } });
  }) as unknown as typeof fetch;
  return { f, seen };
}
const use = (name: string, input: Record<string, unknown> = {}, id = `t_${name}`): Block => ({ type: "tool_use", id, name, input });
const say = (text: string): Block[] => [{ type: "text", text }];

const mk = () => {
  const brain = new Brain(openDb(":memory:"), () => Date.parse("2026-10-16T15:00:00Z"));
  brain.reviewer = complianceReviewer;
  seedKnownFacts(brain);
  const integ = () => integrationsView(brain.db, ENV, brain.clock());
  const rules = ruleChat(brain, integ);
  return { brain, integ, rules };
};

describe("Jarvis com LLM", () => {
  it("consulta o Brain por ferramenta, responde com os números e registra o custo", async () => {
    const { brain, integ, rules } = mk();
    const api = fakeApi([[use("visao_geral")], say("MRR em R$ 496, 41% da meta.")]);
    const chat = llmChat(brain, integ, cfg, rules, api.f);
    const r = await chat("como estamos?");
    expect(r.text).toContain("R$ 496");
    expect(api.seen[0]!.url).toBe("https://api.anthropic.com/v1/messages");
    expect(api.seen[0]!.headers["x-api-key"]).toBe("sk-ant-TESTE");
    expect(api.seen[0]!.body.model).toBe("claude-sonnet-5-5");
    const result = api.seen[1]!.body.messages.at(-1).content[0];
    expect(result.type).toBe("tool_result");
    expect(JSON.parse(result.content).metas.mrr.total).toBe(496);
    const cost = (brain.db.prepare("select sum(cost_brl) as c from agent_runs where agent_id = 'jarvis'").get() as { c: number }).c;
    expect(cost).toBeGreaterThan(0);
    expect(brain.metrics().llmSpentMonthBrl).toBeGreaterThan(0);
  });

  it("nenhum segredo vai para a Anthropic", async () => {
    const { brain, integ, rules } = mk();
    const api = fakeApi([[use("visao_geral")], say("ok")]);
    await llmChat(brain, integ, cfg, rules, api.f)("integrações?");
    const all = JSON.stringify(api.seen.map((s) => s.body));
    expect(all).not.toContain("rk_live_SEGREDO");
    expect(all).not.toContain("sk-ant-TESTE");
  });

  it("pausar e dar tarefa executam; parar tudo só pede confirmação", async () => {
    const { brain, integ, rules } = mk();
    const api = fakeApi([[use("pausar_agente", { agent_id: "sdr" }, "a"), use("dar_tarefa", { agent_id: "financeiro", tarefa: "fechar o mês" }, "b"), use("pedir_confirmacao", { acao: "parar_tudo" }, "c")], say("Pausei o SDR, o Financeiro começou. Confirma parar tudo?")]);
    const r = await llmChat(brain, integ, cfg, rules, api.f)("pausa o sdr, manda o financeiro fechar o mês e para tudo");
    expect(brain.runtime().sdr!.status).toBe("pausado");
    expect(brain.runtime().financeiro!.status).toBe("trabalhando");
    expect(r.confirm?.action).toEqual({ type: "kill_on" });
    expect(brain.killed()).toBe(false);
  });

  it("erro de ferramenta volta ao modelo, que pode se corrigir", async () => {
    const { brain, integ, rules } = mk();
    const api = fakeApi([[use("ver_agente", { agent_id: "inexistente" })], say("Esse agente não existe.")]);
    const r = await llmChat(brain, integ, cfg, rules, api.f)("fale do agente x");
    expect(api.seen[1]!.body.messages.at(-1).content[0].is_error).toBe(true);
    expect(r.text).toBe("Esse agente não existe.");
  });

  it("se a Anthropic cair, responde por regras e avisa", async () => {
    const { brain, integ, rules } = mk();
    const api = fakeApi([{ status: 529 }]);
    const r = await llmChat(brain, integ, cfg, rules, api.f)("como está o MRR?");
    expect(r.text.replace(/ /g, " ")).toContain("R$ 496");
    expect(r.text).toMatch(/Respondi por regras/);
  });

  it("no teto mensal de IA, nem chama a Anthropic", async () => {
    const { brain, integ, rules } = mk();
    brain.db.prepare("insert into agent_runs (agent_id, task, status, created_at, cost_brl) values ('jarvis','x','done',?,300)").run(brain.clock());
    const api = fakeApi([]);
    const r = await llmChat(brain, integ, cfg, rules, api.f)("mrr");
    expect(api.seen).toHaveLength(0);
    expect(r.text).toMatch(/Teto mensal/);
  });
});

describe("Agente com LLM", () => {
  it("monta o prompt da ficha, propõe, passa pela Conformidade e conta o custo", async () => {
    const { brain } = mk();
    const api = fakeApi([
      [
        use("propor", { titulo: "Convite ao Essencial", por_que: "Bateu o limite", texto_pronto: "Oi! Quer ver o Essencial?", impacto_brl: 948, risco: "baixo", canal: "linkedin", contact_ref: "psi-9" }, "p1"),
        use("propor", { titulo: "Oferta", por_que: "x", texto_pronto: "Tenho um desconto de 50% para você", impacto_brl: 100, risco: "baixo", canal: "linkedin", contact_ref: "psi-10" }, "p2"),
      ],
      [use("relatorio", { resumo: "Preparei 2 abordagens." }, "r1")],
      say("fim"),
    ]);
    const runner = new Runner(brain, {}, makeThinker(llmConfig(ENV, "agent")!, api.f));
    brain.assignTask("pagar", "convidar quem chegou no limite");
    await runner.idle();
    const sys: string = api.seen[0]!.body.system;
    expect(sys).toContain(AGENTS.find((a) => a.id === "pagar")!.mission);
    expect(sys).toMatch(/Nunca ofereça desconto/);
    const snap = brain.snapshot([]);
    expect(snap.proposals.filter((p) => p.status === "pendente").map((p) => p.title)).toEqual(["Convite ao Essencial"]);
    expect(snap.activity.some((a) => a.agentId === "compliance" && a.text.includes("Oferta"))).toBe(true);
    expect(snap.runtime.pagar!.costBrl).toBeGreaterThan(0);
    expect(snap.runtime.pagar!.lastAction).toContain("Preparei 2 abordagens");
  });

  it("agente com rotina pode chamá-la como ferramenta", async () => {
    const { brain } = mk();
    const api = fakeApi([[use("rodar_rotina")], [use("relatorio", { resumo: "Fechei o MRR." })], say("ok")]);
    const runner = new Runner(brain, {}, makeThinker(llmConfig(ENV, "agent")!, api.f));
    brain.assignTask("guardiao", "conciliar a base");
    await runner.idle();
    expect((brain.db.prepare("select count(*) as n from mrr_daily").get() as { n: number }).n).toBeGreaterThan(0);
  });
});

describe("Testes de conexão", () => {
  const f = (async (url: string, init?: RequestInit) => {
    expect(init?.method).toBe("GET");
    const u = String(url);
    if (u.includes("stripe.com")) return Response.json({ object: "balance" });
    if (u.includes("graph.facebook.com") && u.includes("act_")) return Response.json({ error: { message: "Token expirado" } }, { status: 400 });
    if (u.includes("resend.com")) return Response.json({ name: "restricted_api_key", message: "This API key is restricted to only send emails" }, { status: 401 });
    return Response.json({}, { status: 500 });
  }) as unknown as typeof fetch;

  it("grava ok e falha por integração, sem chamar quem não tem credencial", async () => {
    const { brain } = mk();
    const env = { STRIPE_READ_KEY: "rk", META_SYSTEM_USER_TOKEN: "t", META_AD_ACCOUNT_ID: "1", RESEND_API_KEY: "re" };
    const out = await runChecks(brain.db, env, brain.clock(), f);
    expect(out).toMatchObject({ stripe: { ok: true }, meta: { ok: false }, resend: { ok: true } });
    expect(out.whatsapp).toBeUndefined();
    const view = integrationsView(brain.db, env, brain.clock());
    const by = (id: string) => view.find((i) => i.id === id)!;
    expect(by("stripe").state).toBe("conectado");
    expect(by("meta").state).toBe("pendente");
    expect(by("meta").detail).toMatch(/Token expirado/);
    expect(by("resend").state).toBe("conectado");
    expect(by("whatsapp").state).toBe("pendente");
    expect(by("whatsapp").detail).toMatch(/WHATSAPP_ACCESS_TOKEN/);
  });
});

describe("OpenAI", () => {
  const OENV = { OPENAI_API_KEY: "sk-proj-TESTE", STRIPE_READ_KEY: "rk_live_SEGREDO" };
  const ocfg = llmConfig(OENV, "jarvis")!;

  /** OpenAI de mentira (Chat Completions). */
  function fakeOpenAi(script: ({ content?: string; tool_calls?: { id: string; name: string; args: unknown }[] } | { status: number })[]) {
    const seen: { url: string; headers: Record<string, string>; body: any }[] = [];
    let i = 0;
    const f = (async (url: string, init: RequestInit) => {
      seen.push({ url: String(url), headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) });
      const step = script[i++]!;
      if ("status" in step) return new Response("boom", { status: step.status });
      return Response.json({
        choices: [{ finish_reason: step.tool_calls ? "tool_calls" : "stop", message: { content: step.content ?? null, tool_calls: step.tool_calls?.map((t) => ({ id: t.id, type: "function", function: { name: t.name, arguments: JSON.stringify(t.args) } })) } }],
        usage: { prompt_tokens: 1000, completion_tokens: 200 },
      });
    }) as unknown as typeof fetch;
    return { f, seen };
  }

  it("OpenAI tem prioridade e o modelo é configurável", () => {
    expect(ocfg.provider).toBe("openai");
    expect(llmConfig({ OPENAI_API_KEY: "a", ANTHROPIC_API_KEY: "b" }, "jarvis")!.provider).toBe("openai");
    expect(llmConfig({ OPENAI_API_KEY: "a", ANTHROPIC_API_KEY: "b", LLM_PROVIDER: "anthropic" }, "jarvis")!.provider).toBe("anthropic");
    expect(llmConfig({ OPENAI_API_KEY: "a", OPENAI_MODEL: "gpt-x" }, "agent")!.model).toBe("gpt-x");
    expect(llmConfig({}, "jarvis")).toBeNull();
  });

  it("Jarvis usa tool calls no formato da OpenAI e devolve os resultados como mensagens 'tool'", async () => {
    const { brain, rules } = mk();
    const integ = () => integrationsView(brain.db, OENV, brain.clock());
    const api = fakeOpenAi([{ tool_calls: [{ id: "c1", name: "visao_geral", args: {} }] }, { content: "MRR em R$ 496." }]);
    const r = await llmChat(brain, integ, ocfg, rules, api.f)("como estamos?");
    expect(r.text).toBe("MRR em R$ 496.");
    expect(api.seen[0]!.url).toBe("https://api.openai.com/v1/chat/completions");
    expect(api.seen[0]!.headers.authorization).toBe("Bearer sk-proj-TESTE");
    expect(api.seen[0]!.body.tools[0]).toMatchObject({ type: "function", function: { name: "visao_geral" } });
    expect(api.seen[0]!.body.messages[0].role).toBe("system");
    const second = api.seen[1]!.body.messages;
    expect(second.at(-2)).toMatchObject({ role: "assistant", tool_calls: [{ id: "c1", type: "function", function: { name: "visao_geral", arguments: "{}" } }] });
    expect(second.at(-1)).toMatchObject({ role: "tool", tool_call_id: "c1" });
    expect(JSON.parse(second.at(-1).content).metas.mrr.total).toBe(496);
    expect(brain.metrics().llmSpentMonthBrl).toBeGreaterThan(0);
  });

  it("confirmação de ação de impacto continua sem executar", async () => {
    const { brain, rules } = mk();
    const integ = () => integrationsView(brain.db, OENV, brain.clock());
    const api = fakeOpenAi([{ tool_calls: [{ id: "c1", name: "pedir_confirmacao", args: { acao: "parar_tudo" } }] }, { content: "Confirma parar tudo?" }]);
    const r = await llmChat(brain, integ, ocfg, rules, api.f)("pare tudo");
    expect(r.confirm?.action).toEqual({ type: "kill_on" });
    expect(brain.killed()).toBe(false);
  });

  it("argumentos quebrados não derrubam: a ferramenta responde com erro e o modelo segue", async () => {
    const { brain, rules } = mk();
    const integ = () => integrationsView(brain.db, OENV, brain.clock());
    const f = (async (_u: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      const first = body.messages.length < 3;
      return Response.json({
        choices: [{ finish_reason: "x", message: first ? { content: null, tool_calls: [{ id: "c1", type: "function", function: { name: "ver_agente", arguments: "{quebrado" } }] } : { content: "Sem agente informado." } }],
        usage: { prompt_tokens: 10, completion_tokens: 5 },
      });
    }) as unknown as typeof fetch;
    const r = await llmChat(brain, integ, ocfg, rules, f)("fale do agente");
    expect(r.text).toBe("Sem agente informado.");
  });

  it("erro da OpenAI cai nas regras com aviso, e nenhum segredo vai no corpo", async () => {
    const { brain, rules } = mk();
    const integ = () => integrationsView(brain.db, OENV, brain.clock());
    const api = fakeOpenAi([{ status: 429 }]);
    const r = await llmChat(brain, integ, ocfg, rules, api.f)("como está o MRR?");
    expect(r.text).toMatch(/Respondi por regras/);
    expect(JSON.stringify(api.seen.map((s) => s.body))).not.toContain("rk_live_SEGREDO");
  });

  it("agente raciocina pela OpenAI e passa pela Conformidade", async () => {
    const { brain } = mk();
    const api = fakeOpenAi([
      { tool_calls: [{ id: "p1", name: "propor", args: { titulo: "Convite", por_que: "limite", texto_pronto: "Oi, quer ver o Essencial?", impacto_brl: 500, risco: "baixo", canal: "linkedin", contact_ref: "psi-1" } }, { id: "p2", name: "propor", args: { titulo: "Oferta", por_que: "x", texto_pronto: "Garantimos cura", impacto_brl: 1, risco: "baixo", canal: "linkedin", contact_ref: "psi-2" } }] },
      { tool_calls: [{ id: "r1", name: "relatorio", args: { resumo: "Preparei 2." } }] },
      { content: "fim" },
    ]);
    const runner = new Runner(brain, {}, makeThinker(ocfg, api.f));
    brain.assignTask("pagar", "convidar");
    await runner.idle();
    expect(brain.snapshot([]).proposals.filter((p) => p.status === "pendente").map((p) => p.title)).toEqual(["Convite"]);
  });

  it("teste de conexão da OpenAI usa GET em /v1/models", async () => {
    const { brain } = mk();
    const f = (async (u: string, init?: RequestInit) => {
      expect(init?.method).toBe("GET");
      expect(String(u)).toBe("https://api.openai.com/v1/models");
      return Response.json({ data: [] });
    }) as unknown as typeof fetch;
    const out = await runChecks(brain.db, { OPENAI_API_KEY: "k" }, brain.clock(), f);
    expect(out.openai).toMatchObject({ ok: true });
    expect(integrationsView(brain.db, { OPENAI_API_KEY: "k" }, brain.clock()).find((i) => i.id === "openai")!.state).toBe("conectado");
  });
});
