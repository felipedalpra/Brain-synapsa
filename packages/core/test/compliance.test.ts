import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { complianceReviewer } from "../src/compliance";
import { openDb } from "../src/node-db";
import { run } from "../src/sql";

const T0 = Date.parse("2026-10-16T15:00:00Z");
const mk = () => {
  let t = T0;
  const brain = new Brain(openDb(":memory:"), () => t);
  brain.reviewer = complianceReviewer;
  return { brain, tick: (ms: number) => (t += ms) };
};
const wa = (over = {}) => ({ agentId: "pagar", kind: "convite", title: "Convidar", draft: "Oi! Sua agenda está cheia. Quer ver o Essencial?", why: "limite", risk: "baixo" as const, channel: "whatsapp" as const, contactRef: "psi-1", ...over });
const consent = (b: Brain, ref = "psi-1", ch = "whatsapp") => run(b.db, "insert into consents (contact_ref, channel, granted_at) values (?, ?, ?)", ref, ch, T0 - 1000);
const notes = (b: Brain) => (b.db.prepare("select review_note as n from proposals where status = 'rejeitada'").all() as { n: string }[]).map((r) => r.n);

describe("Conformidade", () => {
  it.each([
    ["promessa de cura", "Nosso método garante cura em 3 meses"],
    ["resultado garantido", "Resultado garantido para seus pacientes"],
    ["desconto", "Tenho um desconto especial para você"],
    ["promoção", "Entre na promoção de outubro"],
    ["dado clínico", "Vi o prontuário da paciente Ana"],
    ["urgência artificial", "Só hoje: não perca"],
  ])("barra %s", (_n, draft) => {
    const { brain } = mk();
    consent(brain);
    expect(brain.addProposal(wa({ draft }))).toBeNull();
    expect(notes(brain)).toHaveLength(1);
  });

  it("não barra texto limpo com consentimento", () => {
    const { brain } = mk();
    consent(brain);
    expect(brain.addProposal(wa())).toBeTruthy();
  });

  it("'plano gratuito' e 'sem limite' não são falsos positivos", () => {
    const { brain } = mk();
    consent(brain);
    expect(brain.addProposal(wa({ draft: "O plano gratuito chega a 5 pacientes; o Essencial é sem limite." }))).toBeTruthy();
  });

  it("mensagem externa sem contato identificado é barrada", () => {
    const { brain } = mk();
    expect(brain.addProposal(wa({ contactRef: null }))).toBeNull();
    expect(notes(brain)[0]).toMatch(/sem identificar o contato/);
  });

  it("WhatsApp exige consentimento; LinkedIn não", () => {
    const { brain } = mk();
    expect(brain.addProposal(wa())).toBeNull();
    expect(notes(brain)[0]).toMatch(/consentimento/);
    expect(brain.addProposal(wa({ channel: "linkedin", contactRef: "psi-2" }))).toBeTruthy();
  });

  it("consentimento revogado barra", () => {
    const { brain } = mk();
    consent(brain);
    run(brain.db, "update consents set revoked_at = ?", T0);
    expect(brain.addProposal(wa())).toBeNull();
  });

  it("respeita 3 dias entre contatos e libera depois", () => {
    const { brain, tick } = mk();
    consent(brain);
    const id = brain.addProposal(wa())!;
    brain.decide(id, "aprovada"); // registra o contato
    tick(2 * 86_400_000);
    expect(brain.addProposal(wa({ title: "outro" }))).toBeNull();
    expect(notes(brain).at(-1)).toMatch(/menos de 3 dias/);
    tick(1.5 * 86_400_000);
    expect(brain.addProposal(wa({ title: "outro 2" }))).toBeTruthy();
  });

  it("tarefa interna não passa por checagem de contato", () => {
    const { brain } = mk();
    expect(brain.addProposal({ agentId: "midia", kind: "x", title: "Revisar campanha", why: "w", risk: "baixo", channel: "interno" })).toBeTruthy();
  });
});
