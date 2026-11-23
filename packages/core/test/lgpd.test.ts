import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { row, run } from "../src/sql";
import { aplicarRetencao, esquecerContato, esquecido } from "../src/lgpd";

const DAY = 86_400_000;
function base(now = Date.now()) {
  const brain = new Brain(openDb(":memory:"), () => now);
  const add = (placeId: string, email: string, atualizado: number, status = "novo", crm: string | null = null) =>
    run(brain.db, "insert into prospects (place_id, nome, cidade, telefone, email, status, crm_lead_id, criado_em, atualizado_em) values (?, 'Clínica X', 'SP', '(11) 99999-0000', ?, ?, ?, ?, ?)", placeId, email, status, crm, atualizado, atualizado);
  return { brain, add };
}

describe("LGPD", () => {
  it("esquecer anonimiza a clínica, apaga mensagens e bloqueia o e-mail", () => {
    const { brain, add } = base();
    add("p1", "a@clinica.com", Date.now());
    const id = row<{ id: number }>(brain.db, "select id from prospects where place_id = 'p1'")!.id;
    run(brain.db, "insert into inbound_emails (email_id, de, assunto, tipo, prospect_id, at) values ('e1', 'a@clinica.com', 'oi', 'resposta', ?, 1)", id);
    const r = esquecerContato(brain, { prospectId: id }, "voce");
    expect(r.prospects).toBe(1);
    expect(r.bloqueado).toBe(true);
    const p = row<{ nome: string; email: string | null; telefone: string | null; status: string; place_id: string }>(brain.db, "select * from prospects where id = ?", id)!;
    expect([p.nome, p.email, p.telefone, p.status, p.place_id]).toEqual(["Removido (LGPD)", null, null, "removido", "p1"]);
    expect(row(brain.db, "select 1 as x from inbound_emails where prospect_id = ?", id)).toBeUndefined();
    expect(row(brain.db, "select 1 as x from email_suppression where email = 'a@clinica.com'")).toBeDefined();
  });

  it("whatsapp esquecido não volta pela planilha do Instinct", () => {
    const { brain } = base();
    run(brain.db, "insert into instinct_leads (chave, nome, tipo, cidade, whatsapp, primeira, status, atualizado) values ('k1', 'Ana', 'influencer', 'RJ', '+55 21 98888-7777', null, 'abordado', null)");
    expect(esquecerContato(brain, { whatsapp: "5521988887777" }, "voce").instinct).toBe(1);
    expect(esquecido(brain, "whatsapp", "(55) 21 98888-7777")).toBe(true);
    expect(esquecido(brain, "instinct", "k1")).toBe(true);
    expect(row(brain.db, "select 1 as x from instinct_leads")).toBeUndefined();
  });

  it("retenção remove só lead frio com mais de 12 meses", () => {
    const now = Date.now();
    const { brain, add } = base(now);
    add("velho", "v@x.com", now - 400 * DAY);
    add("novo", "n@x.com", now - 30 * DAY);
    add("crm", "c@x.com", now - 400 * DAY, "no_crm", "L1");
    expect(aplicarRetencao(brain)).toBe(1);
    expect(row<{ status: string }>(brain.db, "select status from prospects where place_id = 'velho'")!.status).toBe("removido");
    expect(row<{ status: string }>(brain.db, "select status from prospects where place_id = 'novo'")!.status).toBe("novo");
    expect(row<{ status: string }>(brain.db, "select status from prospects where place_id = 'crm'")!.status).toBe("no_crm");
    expect(row(brain.db, "select 1 as x from email_suppression where email = 'v@x.com'")).toBeUndefined(); // retenção não é pedido de saída
  });

  it("auditoria troca 'voce' pelo usuário logado", () => {
    const { brain } = base();
    brain.operador = "Cassio";
    brain.audit("voce", "teste");
    expect(row<{ actor: string }>(brain.db, "select actor from audit_log order by id desc limit 1")!.actor).toBe("Cassio");
  });
});
