/** Clientes mínimos de OpenAI (Chat Completions) e Anthropic (Messages), com `fetch` injetável para teste. Tudo fala o formato interno de blocos. */
export interface ToolDef {
  name: string;
  description: string;
  input_schema: { type: "object"; properties: Record<string, unknown>; required?: string[] };
}

export type Block = { type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } | { type: "tool_result"; tool_use_id: string; content: string; is_error?: boolean };
export interface Msg {
  role: "user" | "assistant";
  content: string | Block[];
}

export interface LlmResponse {
  content: Block[];
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

export type Provider = "openai" | "anthropic";

export interface LlmConfig {
  provider: Provider;
  apiKey: string;
  model: string;
  /** USD por milhão de tokens e câmbio: estimativa de custo, ajustável por ambiente. */
  priceInUsd: number;
  priceOutUsd: number;
  usdBrl: number;
}

/** OpenAI tem prioridade se as duas chaves existirem; LLM_PROVIDER força uma. */
export function llmConfig(env: Record<string, string | undefined>, kind: "jarvis" | "agent"): LlmConfig | null {
  const forced = env.LLM_PROVIDER as Provider | undefined;
  const provider: Provider | null = forced === "openai" || forced === "anthropic" ? forced : env.OPENAI_API_KEY ? "openai" : env.ANTHROPIC_API_KEY ? "anthropic" : null;
  if (!provider) return null;
  const apiKey = provider === "openai" ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const override = kind === "jarvis" ? env.JARVIS_MODEL : env.AGENT_MODEL;
  const model = override ?? env.JARVIS_MODEL ?? (provider === "openai" ? (env.OPENAI_MODEL ?? "gpt-4.1") : "claude-sonnet-5-5");
  return {
    provider,
    apiKey,
    model,
    // Estimativa. Confira os preços do seu modelo e ajuste no .env.local.
    priceInUsd: Number(env.LLM_PRICE_IN_USD_PER_MTOK ?? (provider === "openai" ? 2 : 3)),
    priceOutUsd: Number(env.LLM_PRICE_OUT_USD_PER_MTOK ?? (provider === "openai" ? 8 : 15)),
    usdBrl: Number(env.USD_BRL ?? 5.5),
  };
}

export const costBrl = (c: LlmConfig, u: { input_tokens: number; output_tokens: number }): number => Math.round(((u.input_tokens * c.priceInUsd + u.output_tokens * c.priceOutUsd) / 1_000_000) * c.usdBrl * 10_000) / 10_000;

async function callAnthropic(c: LlmConfig, req: { system: string; messages: Msg[]; tools?: ToolDef[]; maxTokens?: number }, fetchFn: typeof fetch): Promise<LlmResponse> {
  const res = await fetchFn("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": c.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: c.model, max_tokens: req.maxTokens ?? 1024, system: req.system, messages: req.messages, ...(req.tools?.length ? { tools: req.tools } : {}) }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }
  return (await res.json()) as LlmResponse;
}

type OaMsg =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string };

/** Converte o formato interno de blocos para mensagens do Chat Completions. */
export function toOpenAi(system: string, messages: Msg[]): OaMsg[] {
  const out: OaMsg[] = [{ role: "system", content: system }];
  for (const m of messages) {
    if (typeof m.content === "string") {
      out.push(m.role === "user" ? { role: "user", content: m.content } : { role: "assistant", content: m.content });
      continue;
    }
    if (m.role === "assistant") {
      const calls = m.content.filter((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use");
      out.push({ role: "assistant", content: textOf(m.content) || null, ...(calls.length ? { tool_calls: calls.map((b) => ({ id: b.id, type: "function" as const, function: { name: b.name, arguments: JSON.stringify(b.input) } })) } : {}) });
    } else {
      for (const b of m.content) if (b.type === "tool_result") out.push({ role: "tool", tool_call_id: b.tool_use_id, content: b.is_error ? `Erro: ${b.content}` : b.content });
    }
  }
  return out;
}

async function callOpenAi(c: LlmConfig, req: { system: string; messages: Msg[]; tools?: ToolDef[]; maxTokens?: number }, fetchFn: typeof fetch): Promise<LlmResponse> {
  const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${c.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: c.model,
      max_completion_tokens: req.maxTokens ?? 1024,
      messages: toOpenAi(req.system, req.messages),
      ...(req.tools?.length ? { tools: req.tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } })) } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }
  const j = (await res.json()) as { choices: { message: { content: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] }; finish_reason: string }[]; usage?: { prompt_tokens: number; completion_tokens: number } };
  const msg = j.choices[0]?.message;
  const content: Block[] = [];
  if (msg?.content) content.push({ type: "text", text: msg.content });
  for (const t of msg?.tool_calls ?? []) {
    let input: Record<string, unknown> = {};
    try {
      input = JSON.parse(t.function.arguments || "{}") as Record<string, unknown>;
    } catch {
      /* argumentos inválidos viram objeto vazio; a ferramenta responde com erro de validação */
    }
    content.push({ type: "tool_use", id: t.id, name: t.function.name, input });
  }
  return { content, stop_reason: j.choices[0]?.finish_reason ?? "stop", usage: { input_tokens: j.usage?.prompt_tokens ?? 0, output_tokens: j.usage?.completion_tokens ?? 0 } };
}

export const callLlm = (c: LlmConfig, req: { system: string; messages: Msg[]; tools?: ToolDef[]; maxTokens?: number }, fetchFn: typeof fetch = fetch): Promise<LlmResponse> => (c.provider === "openai" ? callOpenAi(c, req, fetchFn) : callAnthropic(c, req, fetchFn));

export const textOf = (blocks: Block[]): string => blocks.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("\n").trim();

/** Laço de ferramentas: chama o modelo até ele parar de pedir ferramentas (ou estourar o limite de rodadas). */
export async function toolLoop(
  c: LlmConfig,
  req: { system: string; messages: Msg[]; tools: ToolDef[]; maxTokens?: number; maxRounds?: number },
  runTool: (name: string, input: Record<string, unknown>) => Promise<string> | string,
  fetchFn: typeof fetch = fetch,
): Promise<{ text: string; cost: number }> {
  const messages = [...req.messages];
  let cost = 0;
  for (let round = 0; round < (req.maxRounds ?? 6); round++) {
    const r = await callLlm(c, { ...req, messages }, fetchFn);
    cost += costBrl(c, r.usage);
    const uses = r.content.filter((b): b is Extract<Block, { type: "tool_use" }> => b.type === "tool_use");
    if (uses.length === 0) return { text: textOf(r.content), cost };
    messages.push({ role: "assistant", content: r.content });
    const results: Block[] = [];
    for (const u of uses) {
      try {
        results.push({ type: "tool_result", tool_use_id: u.id, content: await runTool(u.name, u.input) });
      } catch (e) {
        results.push({ type: "tool_result", tool_use_id: u.id, content: e instanceof Error ? e.message : "erro", is_error: true });
      }
    }
    messages.push({ role: "user", content: results });
  }
  return { text: "Não consegui concluir dentro do limite de passos. Tente pedir de forma mais direta.", cost };
}
