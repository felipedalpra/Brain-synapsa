import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { run } from "../src/sql";
import { linkDoPsicologo, paginaDoPsicologo, perfisDoDiretorio, revogarLinkDoPsicologo } from "../src/diretorio-relatorio";

describe("relatório por psicólogo", () => {
  it("junta visitas do GA4 e Google, cria link secreto e não mostra outro perfil", () => {
    const brain = new Brain(openDb(":memory:"), () => Date.UTC(2026, 10, 30));
    brain.setPolicy("ga_propriedades", { diretorio: "1" });
    const ga = (chave: string, periodo: string, sessoes: number) => run(brain.db, "insert into ga_agg (site, tipo, periodo, chave, chave2, sessoes, usuarios, novos, engajadas, views, seg, eventos) values ('diretorio', 'pagina', ?, ?, '', ?, 0, 0, 0, ?, 0, 0)", periodo, chave, sessoes, sessoes);
    ga("/psicologo/maria-silva", "atual", 30); ga("/psicologo/maria-silva", "anterior", 20); ga("/psicologo/joao-souza", "atual", 5);
    run(brain.db, "insert into ga_dia (site, dia, sessoes, usuarios, novos, engajadas, views, seg, eventos) values ('diretorio', '2026-11-28', 1, 1, 1, 1, 1, 0, 0)");
    const r = perfisDoDiretorio(brain, {});
    const maria = r.perfis.find((p) => p.slug === "maria-silva")!;
    expect(maria).toMatchObject({ visitas: 30, visitasAntes: 20, nome: "Maria Silva" });
    expect(r.perfis[0]!.slug).toBe("maria-silva");
    const { token } = linkDoPsicologo(brain, {}, "maria-silva");
    expect(token).toMatch(/^[0-9a-f]{48}$/);
    expect(linkDoPsicologo(brain, {}, "maria-silva").token).toBe(token);
    const html = paginaDoPsicologo(brain, {}, token);
    expect(html).toContain("Presença digital de Maria Silva");
    expect(html).toContain("+50% contra os 28 dias anteriores");
    expect(html).not.toContain("João");
    expect(html).toContain('content="noindex,nofollow"');
    expect(() => linkDoPsicologo(brain, {}, "ninguem")).toThrow(/ainda não aparece/);
    revogarLinkDoPsicologo(brain, "maria-silva");
    expect(() => paginaDoPsicologo(brain, {}, token)).toThrow(/não existe mais/);
    expect(() => paginaDoPsicologo(brain, {}, "abc")).toThrow();
  });
});
