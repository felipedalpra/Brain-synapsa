import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { run } from "../src/sql";
import { codigoLead, idDoCodigo, utm } from "../src/utm";
import { avisarLeadsQuentes, linkWhatsapp, mensagemWhatsapp } from "../src/leads-quentes";
import { montarEmail } from "../src/prospeccao-email";
import { montarAutonomo } from "../src/autonomos-email";
import { respostaSobMedida } from "../src/inbound";

const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "content-type": "application/json" } });
function novo() {
  const brain = new Brain(openDb(":memory:"), () => Date.UTC(2026, 10, 27, 13));
  run(brain.db, "insert into prospects (id, place_id, nome, cidade, telefone, email, criado_em, atualizado_em, status) values (35, 'p1', 'CLÍNICA AURORA - PSICOLOGIA', 'Niterói', '(21) 99876-5432', 'contato@aurora.com.br', 1, 1, 'qualificado')");
  return brain;
}

describe("lead quente", () => {
  it("código do lead vai no link e volta para o id", () => {
    expect(codigoLead(35)).toBe("lz");
    expect(idDoCodigo("lz")).toBe(35);
    expect(idDoCodigo("x1")).toBeNull();
    expect(utm("https://a.com", "email", "prospeccao", "clinicas", "lz")).toBe("https://a.com?utm_source=email&utm_medium=prospeccao&utm_campaign=clinicas&utm_content=lz");
    expect(montarEmail({ id: 35, nome: "Aurora", cidade: null, crp_count: 4 }, 0).corpo).toContain("utm_content=lz");
    expect(montarAutonomo({ id: 35, nome: "Maria", cidade: null, siteHost: null, whatsapp: false }, 2).corpo).toContain("utm_content=lz");
    expect(montarAutonomo({ nome: "Maria", cidade: null, siteHost: null, whatsapp: false }, 2).corpo).not.toContain("utm_content");
  });

  it("monta o link do WhatsApp só para celular", () => {
    expect(linkWhatsapp("(21) 99876-5432", "oi")).toBe("https://wa.me/5521998765432?text=oi");
    expect(linkWhatsapp("(21) 3333-4444", "oi")).toBeNull();
    expect(linkWhatsapp(null, "oi")).toBeNull();
    expect(mensagemWhatsapp({ nome: "AURORA - X", autonomo: false })).toMatch(/pessoal da Aurora/);
  });

  it("avisa uma vez por visita nova e ignora quem respondeu", async () => {
    const brain = novo();
    run(brain.db, "insert into lead_clique (codigo, prospect_id, sessoes, ultimo, avisado, atualizado_em) values ('lz', 35, 2, '2026-11-26', 0, 1)");
    const corpos: any[] = [];
    const f = (async (_u: string, init: any) => { corpos.push(JSON.parse(init.body)); return json({ id: "r1" }); }) as unknown as typeof fetch;
    const env = { RESEND_API_KEY: "k", RESEND_FROM: "Brain <b@x.com>" };
    expect(await avisarLeadsQuentes(brain, env, f)).toBe(1);
    expect(corpos[0].to).toEqual(["felipeodriosolladalpra@gmail.com"]);
    expect(corpos[0].subject).toMatch(/Lead quente: Clínica Aurora/);
    expect(corpos[0].text).toMatch(/wa\.me\/5521998765432/);
    expect(corpos[0].text).toMatch(/2 visitas/);
    expect(await avisarLeadsQuentes(brain, env, f)).toBe(0);
    run(brain.db, "update lead_clique set sessoes = 3");
    run(brain.db, "insert into prospect_contato (prospect_id, respondeu, sair, atualizado_em) values (35, 1, 0, 1)");
    expect(await avisarLeadsQuentes(brain, env, f)).toBe(0);
    expect(corpos).toHaveLength(1);
  });

  it("resposta sob medida cai no texto fixo sem modelo", async () => {
    const r = await respostaSobMedida({}, "Clínica Aurora", "Quanto custa?", (async () => json({})) as unknown as typeof fetch);
    expect(r.intencao).toBe("outro");
    expect(r.rascunho).toMatch(/demonstração de 30 minutos/);
  });
});
