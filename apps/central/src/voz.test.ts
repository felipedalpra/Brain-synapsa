import { describe, expect, it } from "vitest";
import { paraFala, pedacos } from "./voz";

describe("voz do Jarvis", () => {
  it("tira markdown e fala dinheiro e porcentagem", () => {
    expect(paraFala("**MRR** está em R$ 1.200, 40% da meta. Veja https://x.com/a")).toBe("MRR está em 1.200 reais, 40 por cento da meta. Veja o link");
    expect(paraFala("- um\n- dois")).toBe("um. dois");
  });
  it("quebra em frases e solta o primeiro pedaço cedo", () => {
    const t = "Primeiro, o MRR está parado e isso preocupa porque a meta de dezembro está longe de ser batida. Segundo, a fila tem cinco propostas. Terceiro, o Instagram segue publicando um post por dia sem falhas.";
    const p = pedacos(t);
    expect(p.length).toBeGreaterThan(1);
    expect(p[0]!.endsWith(".")).toBe(true);
    expect(p.join(" ")).toBe(t);
  });
  it("texto curto vira um pedaço só", () => {
    expect(pedacos("Feito.")).toEqual(["Feito."]);
  });
});
