import { costBrl, type LlmConfig } from "./llm";

export interface WebResult {
  texto: string;
  fontes: { titulo: string; url: string }[];
  costBrl: number;
}

/** Custo estimado da ferramenta de busca da OpenAI por chamada (taxa fixa em reais, além dos tokens). */
export const WEB_FEE_BRL = 0.2;

/** Pesquisa na internet pela ferramenta de busca da OpenAI. Só para mercado, concorrentes e tendências. */
export async function pesquisarWeb(cfg: LlmConfig, pergunta: string, fetchFn: typeof fetch = fetch): Promise<WebResult> {
  if (cfg.provider !== "openai") throw new Error("A pesquisa na web usa a OpenAI. Configure OPENAI_API_KEY.");
  const q = pergunta.trim().slice(0, 600);
  if (!q) throw new Error("Pergunta vazia.");
  const call = (toolType: string) =>
    fetchFn("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        tools: [{ type: toolType }],
        input: `Pesquise na web e responda em português do Brasil, em até 350 palavras, com fatos e números verificáveis. Cite o nome da fonte ao lado de cada dado. Se não achar, diga que não achou. Pergunta: ${q}`,
        max_output_tokens: 1400,
      }),
    });
  let res = await call("web_search");
  if (res.status === 400) res = await call("web_search_preview");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Busca na web ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }
  const j = (await res.json()) as {
    output?: { type: string; content?: { type: string; text?: string; annotations?: { type: string; url?: string; title?: string }[] }[] }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  let texto = "";
  const fontes = new Map<string, string>();
  for (const o of j.output ?? []) {
    if (o.type !== "message") continue;
    for (const c of o.content ?? []) {
      if (c.type === "output_text" && c.text) texto += c.text;
      for (const a of c.annotations ?? []) if (a.type === "url_citation" && a.url) fontes.set(a.url.replace(/[?&]utm_[^&]*/g, ""), a.title ?? a.url);
    }
  }
  const cost = costBrl(cfg, { input_tokens: j.usage?.input_tokens ?? 0, output_tokens: j.usage?.output_tokens ?? 0 }) + WEB_FEE_BRL;
  return { texto: texto.trim() || "A busca não devolveu texto.", fontes: [...fontes].slice(0, 8).map(([url, titulo]) => ({ titulo, url })), costBrl: cost };
}

export const WEB_TOOL = {
  name: "pesquisar_web",
  description: "Pesquisa na internet (mercado, concorrentes, preços, tendências, notícias). Devolve texto com fontes. Use só para mercado: nunca para levantar dados pessoais de pessoas específicas. Cada chamada custa dinheiro: faça poucas, perguntas específicas.",
  input_schema: { type: "object", properties: { pergunta: { type: "string", description: "Pergunta específica e completa." } }, required: ["pergunta"] },
} as const;
