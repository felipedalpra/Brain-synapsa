import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { run } from "../src/sql";
import { igDesempenho, igContexto } from "../src/instagram";

describe("desempenho do Instagram por formato e tipo", () => {
  it("soma taxa de ação por tipo de estático e por formato", () => {
    const brain = new Brain(openDb(":memory:"), () => Date.UTC(2026, 10, 30));
    const post = (id: string, pilar: string, media: string, tipo: string, alcance: number, salvos: number, comp: number, com: number) => {
      run(brain.db, "insert into ig_posts (id, chave, status, tema, pilar, legenda, agendado_para, criado_em, media_id) values (?, ?, 'publicado', 't', ?, 'l', 1, 1, ?)", id, id, pilar, media);
      run(brain.db, "insert into ig_post_metricas (media_id, tipo, alcance, salvos, compartilhados, comentarios, curtidas, atualizado_em) values (?, ?, ?, ?, ?, ?, 0, 1)", media, tipo, alcance, salvos, comp, com);
    };
    post("a", "Jornada do psicólogo | estático · frase de colega", "m1", "IMAGE", 200, 10, 5, 5);   // 10%
    post("b", "Jornada do psicólogo | estático · frase de colega", "m2", "IMAGE", 100, 4, 2, 4);    // 10%
    post("c", "Crescimento e gestão | estático · mito vs. realidade", "m3", "IMAGE", 300, 3, 0, 0); // 1%
    post("d", "crescimento", "m4", "CAROUSEL_ALBUM", 400, 20, 10, 10);       // 10%
    const d = igDesempenho(brain);
    expect(d.formatos.carrossel).toEqual({ n: 1, alcanceMedio: 400, taxaAcao: 0.1 });
    expect(d.formatos.estatico.n).toBe(3);
    expect(d.tipos[0]).toEqual({ tipo: "frase de colega", n: 2, alcanceMedio: 150, taxaAcao: 0.1 });
    expect(d.tipos[1]!.tipo).toBe("mito vs. realidade");
    expect(igContexto(brain).desempenho.tipos).toHaveLength(2);
  });
});
