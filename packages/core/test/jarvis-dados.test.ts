import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { planejar, verInstagram, verPlanejamento, verProspeccao, verSeo } from "../src/jarvis-dados";

const mk = () => { const b = new Brain(openDb(":memory:"), () => Date.parse("2026-11-17T21:00:00Z")); seedKnownFacts(b); return b; };

describe("acesso do Jarvis ao resto do Brain", () => {
  it("lê planejamento e escreve uma tarefa na semana atual", () => {
    const b = mk();
    expect(planejar(b, { titulo: "Gravar o reel da segunda", tipo: "post", dia: 0, formato: "reel", responsavel: "Felipe Dalpra" })).toMatch(/planejamento/);
    const p = verPlanejamento(b);
    expect(p.semana).toBe("2026-11-16");
    expect(p.posts[0]).toMatchObject({ titulo: "Gravar o reel da segunda", formato: "reel", responsavel: "Felipe Dalpra", status: "pendente" });
  });
  it("lê SEO, Instagram e prospecção mesmo vazios, sem quebrar", () => {
    const b = mk();
    const seo = verSeo(b, {});
    expect(seo.search_console.length).toBeGreaterThan(0);
    expect(typeof seo.google_analytics).toBe("string"); // GA4 ainda não ligado
    expect(verInstagram(b, {})).toMatchObject({ aguardando_sua_aprovacao: 0, posts: [] });
    expect(verProspeccao(b)).toMatchObject({ total: 0 });
  });
});
