import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { fatos, gerarLeitura, lerResposta, leituraPainel } from "../src/leitura";
import { mercadoPainel, semanaDe, sincronizarMercado } from "../src/mercado";
import { row } from "../src/sql";

const json = (o: unknown) => new Response(JSON.stringify(o), { status: 200 });

describe("mercado", () => {
  it("guarda o autocomplete e marca o que é novo na semana seguinte", async () => {
    let agora = Date.UTC(2026, 10, 23, 15);
    const brain = new Brain(openDb(":memory:"), () => agora);
    let n = 0;
    const f = (async () => json(["x", n++ < 40 ? ["sistema para psicólogo", "agenda online psicólogo"] : ["sistema para psicólogo", "ia para prontuário psicólogo"]])) as unknown as typeof fetch;
    expect(await sincronizarMercado(brain, f)).toMatch(/atualizado/);
    expect(await sincronizarMercado(brain, f)).toMatch(/já atualizado/);
    agora += 8 * 86_400_000;
    await sincronizarMercado(brain, f);
    const p = mercadoPainel(brain, {});
    expect(p.novas.map((x) => x.texto)).toContain("ia para prontuário psicólogo");
    expect(semanaDe(Date.UTC(2026, 10, 25, 15))).toBe("2026-11-23");
  });
});

describe("leitura do dia", () => {
  it("lê JSON do modelo, mesmo com cerca de markdown, e rejeita resposta sem decisão", () => {
    const r = lerResposta('```json\n{"resumo":"ok","decisoes":[{"titulo":"Ajuste a página","porque":"14 visitas","acao":"revisar","onde":"seo","impacto":"alto"}]}\n```');
    expect(r.decisoes[0]!.impacto).toBe("alto");
    expect(() => lerResposta('{"resumo":"x","decisoes":[]}')).toThrow();
  });

  it("gera uma por dia e guarda os fatos usados", async () => {
    const brain = new Brain(openDb(":memory:"), () => Date.UTC(2026, 10, 24, 15));
    const f = (async () => json({ choices: [{ message: { content: '{"resumo":"r","decisoes":[{"titulo":"t","porque":"p","acao":"a","onde":"mercado","impacto":"baixo"}]}' }, finish_reason: "stop" }], usage: { prompt_tokens: 10, completion_tokens: 10 } })) as unknown as typeof fetch;
    const env = { OPENAI_API_KEY: "k", LLM_PROVIDER: "openai" };
    expect(await gerarLeitura(brain, env, f)).not.toBeNull();
    expect(await gerarLeitura(brain, env, f)).toBeNull(); // já tem a de hoje
    expect(leituraPainel(brain).atual?.decisoes).toHaveLength(1);
    expect(row(brain.db, "select fatos from leituras")).toBeDefined();
    expect(fatos(brain, env)).toHaveProperty("prospeccao_clinicas");
  });
});
