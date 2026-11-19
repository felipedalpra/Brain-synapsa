import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { row, rows, run } from "../src/sql";
import { complianceReviewer } from "../src/compliance";
import { cadenciaAtivar, cadenciaImportar, cadenciaPainel, gerarCadencia, montarCadencia, primeiroNomeCad } from "../src/cadencia";
import { sendApproved, suppress } from "../src/dispatch";

const T0 = Date.parse("2026-11-19T10:00:00Z");
const DAY = 86_400_000;
const mk = () => {
  let t = T0;
  const brain = new Brain(openDb(":memory:"), () => t);
  brain.reviewer = complianceReviewer;
  seedKnownFacts(brain);
  return { brain, tick: (ms: number) => (t += ms) };
};
const env = { RESEND_API_KEY: "k", RESEND_FROM: "Felipe <oi@synapsa.chat>" };
const okFetch = (async () => new Response(JSON.stringify({ id: "r1" }), { status: 200 })) as unknown as typeof fetch;

describe("textos", () => {
  it("primeiro nome", () => { expect(primeiroNomeCad("LARISSA DE OLIVEIRA")).toBe("Larissa"); expect(primeiroNomeCad("")).toBe(""); });
  it("os cinco e-mails passam nas regras de conformidade do Brain", () => {
    for (const e of [1, 2, 3, 4, 5] as const) {
      const m = montarCadencia("Ana Souza", e);
      expect(m.assunto).toContain("Ana");
      const r = complianceReviewer({ agentId: "ativacao", kind: "cadencia_email", channel: "email", risk: "baixo", title: "x", draft: m.corpo, why: "x", contactRef: "a@b.com", payload: {} }, { db: seedKnownFactsDb(), now: T0 });
      expect(r.ok, `e-mail ${e}: ${r.note}`).toBe(true);
    }
  });
});
function seedKnownFactsDb() { const b = new Brain(openDb(":memory:"), () => T0); seedKnownFacts(b); run(b.db, "insert into consents (contact_ref, channel, granted_at) values ('a@b.com','email',0)"); return b.db; }

describe("cadência", () => {
  it("desligada não cria nada", () => {
    const { brain } = mk();
    cadenciaImportar(brain, [{ nome: "Ana", email: "ana@x.com", plano: "gratuito" }]);
    expect(gerarCadencia(brain).rascunhos).toBe(0);
  });
  it("novo cadastro recebe o 1º; o 2º só depois da espera (mínimo 3 dias da política)", async () => {
    const { brain, tick } = mk();
    cadenciaImportar(brain, [{ nome: "Ana Souza", email: "Ana@x.com", plano: "gratuito", entrouEm: T0 }]);
    cadenciaAtivar(brain, true);
    expect(gerarCadencia(brain).rascunhos).toBe(1);
    expect(gerarCadencia(brain).rascunhos).toBe(0); // não duplica
    const p = row<{ id: string }>(brain.db, "select id from proposals where dedupe_key = 'cad-ana@x.com-e1'")!;
    brain.decide(p.id, "aprovada");
    await sendApproved(brain, env, p.id, okFetch);
    tick(2 * DAY);
    expect(gerarCadencia(brain).rascunhos).toBe(0); // 2 dias não bastam: política exige 3
    tick(1 * DAY);
    expect(gerarCadencia(brain).rascunhos).toBe(1);
    expect(cadenciaPainel(brain).leads[0]!.step).toBe(1);
  });
  it("importado no meio da sequência continua de onde estava", () => {
    const { brain } = mk();
    cadenciaImportar(brain, [{ nome: "Bia", email: "bia@x.com", plano: "gratuito", step: 4, ultimaAcao: T0 - 5 * DAY }]);
    cadenciaAtivar(brain, true);
    gerarCadencia(brain);
    expect(row(brain.db, "select 1 as x from proposals where dedupe_key = 'cad-bia@x.com-e5'")).toBeTruthy();
    expect(row(brain.db, "select 1 as x from proposals where dedupe_key = 'cad-bia@x.com-e1'")).toBeFalsy();
  });
  it("quem paga, pediu para sair ou concluiu fica de fora", () => {
    const { brain } = mk();
    cadenciaImportar(brain, [
      { nome: "Paga", email: "paga@x.com", plano: "essencial" },
      { nome: "Saiu", email: "saiu@x.com", plano: "gratuito" },
      { nome: "Fim", email: "fim@x.com", plano: "gratuito", step: 5, ultimaAcao: T0 - 30 * DAY },
    ]);
    suppress(brain, "saiu@x.com", "pediu para sair");
    cadenciaAtivar(brain, true);
    expect(gerarCadencia(brain).rascunhos).toBe(0);
    const p = cadenciaPainel(brain);
    expect(p.leads.find((l) => l.email === "paga@x.com")!.situacao).toMatch(/Essencial/);
    expect(p.leads.find((l) => l.email === "saiu@x.com")!.situacao).toMatch(/sair/);
    expect(p.concluidos).toBe(1);
  });
  it("rascunho recusado pausa a pessoa", () => {
    const { brain } = mk();
    cadenciaImportar(brain, [{ nome: "Cid", email: "cid@x.com", plano: "gratuito" }]);
    cadenciaAtivar(brain, true);
    gerarCadencia(brain);
    const p = row<{ id: string }>(brain.db, "select id from proposals where dedupe_key = 'cad-cid@x.com-e1'")!;
    brain.decide(p.id, "rejeitada");
    expect(cadenciaPainel(brain).leads[0]!.situacao).toMatch(/barrado ou recusado/);
    expect(rows(brain.db, "select 1 from cadencia_email where pausada = 1").length).toBe(1);
  });
  it("importar não sobrescreve e recusa e-mail inválido", () => {
    const { brain } = mk();
    expect(cadenciaImportar(brain, [{ nome: "Di", email: "di@x.com" }, { nome: "x", email: "invalido" }])).toEqual({ novos: 1, jaExistiam: 0, invalidos: 1 });
    expect(cadenciaImportar(brain, [{ nome: "Di", email: "DI@x.com", step: 3 }])).toEqual({ novos: 0, jaExistiam: 1, invalidos: 0 });
  });
});
