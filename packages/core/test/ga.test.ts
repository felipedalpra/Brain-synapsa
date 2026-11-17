import { describe, expect, it } from "vitest";
import { recadosGa, traduzir } from "../src/ga";

const m = (o: Partial<Record<string, number>> = {}) => ({ sessoes: 0, usuarios: 0, novos: 0, engajadas: 0, views: 0, seg: 0, eventos: 0, ...o });
const item = (chave: string, o = {}) => ({ chave, ...m(o), anterior: { sessoes: 0, usuarios: 0, eventos: 0 } });

describe("GA4", () => {
  it("explica o que fazer quando a API está desligada ou sem acesso", () => {
    expect(traduzir(403, "Google Analytics Data API has not been used in project 1 before or it is disabled.", "https://analyticsdata.googleapis.com/x")).toMatch(/Ative a "Google Analytics Data API"/);
    expect(traduzir(403, "User does not have sufficient permissions for this property.")).toMatch(/Leitor/);
    expect(traduzir(404, "not found")).toMatch(/não encontrada/);
  });
  it("sem visitas, diz para conferir a tag", () => {
    expect(recadosGa({ atual: m(), anterior: m(), canais: [], entradas: [], eventos: [] })[0]).toMatch(/tag/);
  });
  it("avisa de origem perdida, falta de evento-chave e página que não engaja", () => {
    const r = recadosGa({
      atual: m({ sessoes: 100, usuarios: 80, engajadas: 40 }), anterior: m(),
      canais: [item("Direct", { sessoes: 70 }), item("Organic Search", { sessoes: 20 })],
      entradas: [item("/psicologo/ana", { sessoes: 30, engajadas: 5 })],
      eventos: [item("page_view", { eventos: 300 })],
    }).join(" | ");
    expect(r).toMatch(/UTM/);
    expect(r).toMatch(/evento-chave/i);
    expect(r).toMatch(/\/psicologo\/ana/);
    expect(r).toMatch(/Busca orgânica trouxe 20/);
  });
});
