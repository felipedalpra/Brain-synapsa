import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { row, rows, run } from "../src/sql";
import { complianceReviewer } from "../src/compliance";
import { sendApproved } from "../src/dispatch";
import { autonomosAtivar, autonomosPainel, gerarAutonomos, nomeAutonomo } from "../src/autonomos";
import { ehAlvoAutonomo, ingerirDescoberta, ingerirEnriquecimento, lerSinais, pontuarAutonomo } from "../src/prospeccao";
import { gerarRascunhos, marcarContato } from "../src/prospeccao-email";

const T0 = Date.parse("2026-11-20T10:00:00Z");
const DAY = 86_400_000;
const env = { RESEND_API_KEY: "k", RESEND_FROM: "a@x.com", RESEND_FROM_PROSPECCAO: "Felipe <p@x.com>", RESEND_INBOUND: "in@x.com" };
const okFetch = (async () => new Response(JSON.stringify({ id: "r1" }), { status: 200 })) as unknown as typeof fetch;
const mk = () => {
  let t = T0;
  const brain = new Brain(openDb(":memory:"), () => t);
  brain.reviewer = complianceReviewer;
  seedKnownFacts(brain);
  const add = (id: number, nome: string, email: string | null, status = "qualificado", crp = 1) => {
    run(brain.db, "insert into prospects (id, place_id, nome, email, crp_count, nota, status, criado_em, atualizado_em) values (?, ?, ?, ?, ?, 70, ?, 0, 0)", id, `p${id}`, nome, email, crp, status);
    run(brain.db, "insert into prospect_autonomo (prospect_id) values (?)", id);
  };
  return { brain, add, tick: (ms: number) => (t += ms) };
};

describe("nome", () => {
  it("tira título e cargo", () => {
    expect(nomeAutonomo("Dra. Maria Souza - Psicóloga Clínica")).toBe("Maria");
    expect(nomeAutonomo("Psicólogo João Pereira")).toBe("João");
    expect(nomeAutonomo("ANA LIMA")).toBe("Ana");
  });
  it("sem nome pessoal fica vazio", () => { expect(nomeAutonomo("Consultório de Psicologia")).toBe(""); expect(nomeAutonomo("Psicologia Integrada")).toBe(""); });
});

describe("descoberta e leitura do site", () => {
  it("autônomo: fica de fora instituição e clínica, e o resto é marcado", () => {
    expect(ehAlvoAutonomo("Clínica Mente Sã")).toBe(false);
    expect(ehAlvoAutonomo("CAPS Centro")).toBe(false);
    expect(ehAlvoAutonomo("Maria Souza Psicóloga")).toBe(true);
    const { brain } = mk();
    const r = ingerirDescoberta(brain, [{ placeId: "a", title: "Maria Souza Psicóloga", city: "Niterói", website: "mariapsi.com.br" }, { placeId: "b", title: "Clínica Alfa", city: "Niterói" }], "autônomos · Niterói, RJ");
    expect(r.novos).toBe(2);
    expect(rows(brain.db, "select 1 from prospect_autonomo").length).toBe(2);
    expect(row<{ status: string }>(brain.db, "select status from prospects where place_id = 'b'")!.status).toBe("descartado");
    expect(row<{ status: string }>(brain.db, "select status from prospects where place_id = 'a'")!.status).toBe("novo");
  });
  it("e-mail pessoal do próprio site vale para autônomo, mas não e-mail de terceiros", () => {
    const pag = ["Psicóloga CRP 05/12345. Contato: maria.psi@gmail.com. Site por designer@agenciaweb.com.br"];
    expect(lerSinais(pag, "mariapsi.com.br").emails).toEqual([]);
    expect(lerSinais(pag, "mariapsi.com.br", true).emails).toEqual(["maria.psi@gmail.com"]);
  });
  it("qualifica com CRP e e-mail; só um dos dois vai para revisão", () => {
    const base = { whatsapp: false, instagram: null, avaliacoes: 0, notaGoogle: null };
    expect(pontuarAutonomo({ crp: 1, email: "a@b.com", ...base }).status).toBe("qualificado");
    expect(pontuarAutonomo({ crp: 0, email: "a@b.com", ...base }).status).toBe("revisar");
    expect(pontuarAutonomo({ crp: 1, email: null, ...base }).status).toBe("revisar");
    expect(pontuarAutonomo({ crp: 0, email: null, ...base }).status).toBe("descartado");
  });
  it("enriquecimento usa a regra de autônomo", () => {
    const { brain } = mk();
    run(brain.db, "insert into prospects (id, place_id, nome, site, status, criado_em, atualizado_em) values (1, 'x', 'Maria Souza', 'https://mariapsi.com.br', 'enriquecendo', 0, 0)");
    run(brain.db, "insert into prospect_autonomo (prospect_id) values (1)");
    ingerirEnriquecimento(brain, [{ url: "https://mariapsi.com.br", text: "Maria Souza, CRP 05/12345. maria.psi@gmail.com" }], [1]);
    const p = row<{ status: string; email: string | null }>(brain.db, "select status, email from prospects where id = 1")!;
    expect(p).toEqual({ status: "qualificado", email: "maria.psi@gmail.com" });
  });
});

describe("sequência de 5 e-mails", () => {
  it("desligada não cria nada", () => {
    const { brain, add } = mk();
    add(1, "Maria Souza", "maria@x.com");
    expect(gerarAutonomos(brain)).toEqual({ novos: 0, followups: 0 });
  });
  it("1º e-mail passa na conformidade sem consentimento (legítimo interesse) e não duplica", () => {
    const { brain, add } = mk();
    add(1, "Dra. Maria Souza - Psicóloga", "maria@x.com");
    autonomosAtivar(brain, true);
    expect(gerarAutonomos(brain).novos).toBe(1);
    expect(gerarAutonomos(brain).novos).toBe(0);
    const p = row<{ status: string; draft: string; payload: string }>(brain.db, "select status, draft, payload from proposals where dedupe_key = 'aut-1-e1'")!;
    expect(p.status).toBe("pendente");
    expect(p.draft).toContain("Olá, Maria.");
    expect(p.draft).toContain("Sou o Felipe, fundador da Synapsa");
    expect(JSON.parse(p.payload).envio).toMatchObject({ remetente: "prospeccao", perfil: "autonomo" });
  });
  it("follow-up só depois de enviado e de 3 dias; cinco e-mails no total", async () => {
    const { brain, add, tick } = mk();
    add(1, "Maria Souza", "maria@x.com");
    autonomosAtivar(brain, true);
    const enviar = async (etapa: number) => {
      const id = row<{ id: string }>(brain.db, `select id from proposals where dedupe_key = 'aut-1-e${etapa}'`)!.id;
      brain.decide(id, "aprovada");
      await sendApproved(brain, env, id, okFetch);
    };
    gerarAutonomos(brain);
    tick(10 * DAY);
    expect(gerarAutonomos(brain).followups).toBe(0); // 1º ainda não foi enviado
    await enviar(1);
    tick(2 * DAY);
    expect(gerarAutonomos(brain).followups).toBe(0);
    tick(1 * DAY);
    expect(gerarAutonomos(brain).followups).toBe(1);
    for (const e of [2, 3, 4]) { await enviar(e); tick(3 * DAY); gerarAutonomos(brain); }
    await enviar(5);
    tick(30 * DAY);
    expect(gerarAutonomos(brain)).toEqual({ novos: 0, followups: 0 });
    expect(rows(brain.db, "select 1 from proposals where dedupe_key like 'aut-1-e%'").length).toBe(5);
    expect(autonomosPainel(brain).concluidos).toBe(1);
  });
  it("resposta ou saída para a sequência e limpa o rascunho da fila", () => {
    const { brain, add } = mk();
    add(1, "Maria Souza", "maria@x.com");
    autonomosAtivar(brain, true);
    gerarAutonomos(brain);
    marcarContato(brain, 1, "respondeu");
    expect(row<{ status: string }>(brain.db, "select status from proposals where dedupe_key = 'aut-1-e1'")!.status).toBe("rejeitada");
    expect(autonomosPainel(brain).responderam).toBe(1);
  });
  it("recusar um rascunho encerra a sequência dessa pessoa", () => {
    const { brain, add, tick } = mk();
    add(1, "Maria Souza", "maria@x.com");
    autonomosAtivar(brain, true);
    gerarAutonomos(brain);
    brain.decide(row<{ id: string }>(brain.db, "select id from proposals where dedupe_key = 'aut-1-e1'")!.id, "rejeitada");
    tick(30 * DAY);
    expect(gerarAutonomos(brain).followups).toBe(0);
  });
  it("respeita o limite de novos por dia e só pega quem tem e-mail e está qualificado", () => {
    const { brain, add } = mk();
    brain.setPolicy("autonomo_novos_dia", 2);
    add(1, "A Silva", "a@x.com"); add(2, "B Silva", "b@x.com"); add(3, "C Silva", "c@x.com"); add(4, "D Silva", null); add(5, "E Silva", "e@x.com", "revisar");
    autonomosAtivar(brain, true);
    expect(gerarAutonomos(brain).novos).toBe(2);
  });
  it("não entra no fluxo de clínicas", () => {
    const { brain, add } = mk();
    add(1, "Maria Souza", "maria@x.com", "qualificado", 5);
    expect(gerarRascunhos(brain)).toEqual({ novos: 0, followups: 0 });
  });
});

import { TEXT_RULES } from "../src/compliance";
import { montarAutonomo, ASSINATURA, AUT_TOTAL } from "../src/autonomos-email";
import { emailHtml } from "../src/email-html";
import { sendEmail } from "../src/dispatch";

const dados = { nome: "Maria", cidade: "Niterói", siteHost: "mariapsi.com.br", whatsapp: true };

describe("texto dos e-mails (posicionamento novo)", () => {
  const todos = ([1, 2, 3, 4, 5] as const).map((e) => ({ e, ...montarAutonomo(dados, e) }));
  it("passa nas regras de texto da conformidade e não usa desconto, promoção nem o ângulo de abandono/adesão", () => {
    for (const m of todos) {
      for (const r of TEXT_RULES) expect(r.test.test(m.corpo), `e-mail ${m.e} bate na regra ${r.id}`).toBe(false);
      expect(m.corpo, `e-mail ${m.e}`).not.toMatch(/abandon|ades[aã]o|entre (as )?sess|prontu[aá]rio|desconto|promo[cç]/i);
      expect(m.corpo + m.assunto).not.toMatch(/RNDS|Datasus/);
    }
  });
  it("todos assinam com a marca e há cinco etapas", () => {
    expect(todos).toHaveLength(AUT_TOTAL);
    for (const m of todos) expect(m.corpo).toContain(ASSINATURA);
  });
  it("personaliza com o que se sabe e cai em texto genérico quando falta", () => {
    expect(montarAutonomo(dados, 1).corpo).toContain("em Niterói e o seu site (mariapsi.com.br)");
    expect(montarAutonomo(dados, 1).assunto).toBe("Maria, uma ideia para a sua prática em Niterói");
    expect(montarAutonomo(dados, 3).corpo).toContain("Vi que você atende pelo WhatsApp");
    const vazio = montarAutonomo({ nome: "", cidade: null, siteHost: null, whatsapp: false }, 1);
    expect(vazio.assunto).toBe("Uma ideia para a sua prática");
    expect(vazio.corpo.startsWith("Olá.")).toBe(true);
    expect(vazio.corpo).not.toMatch(/undefined|null|Vi o seu site/);
    expect(montarAutonomo({ ...dados, whatsapp: false }, 3).corpo).toContain("espalhados entre WhatsApp");
  });
});

describe("HTML com a identidade da Synapsa", () => {
  const corpo = montarAutonomo(dados, 1).corpo;
  const html = emailHtml(corpo, "Felipe Dalpra, Synapsa\nPara não receber mais e-mails meus, responda SAIR.");
  it("tem a marca, as cores, o botão e a saída", () => {
    expect(html).toContain("Synapsa");
    expect(html).toContain("Onde a prática evolui.");
    expect(html).toContain("#8B5CF6");
    expect(html).toContain("#38BDF8");
    expect(html).toContain("Conhecer a Synapsa");
    expect(html).toContain("responda SAIR");
    expect(html).toContain("<ul");
  });
  it("escapa o que vem de fora (nome do Maps)", () => {
    const h = emailHtml("Olá, <script>alert(1)</script>.\n\nAbraço,\nFelipe", "rodapé");
    expect(h).not.toContain("<script>");
    expect(h).toContain("&lt;script&gt;");
  });
  it("o envio manda texto e HTML juntos, com o rodapé nos dois", async () => {
    const { brain } = mk();
    let enviado: Record<string, unknown> = {};
    const f = (async (_u: string, i: RequestInit) => { enviado = JSON.parse(String(i.body)); return new Response(JSON.stringify({ id: "r" }), { status: 200 }); }) as unknown as typeof fetch;
    await sendEmail(brain, env, { id: "x1", to: "maria@x.com", subject: "Oi", body: corpo, prospeccao: true, autonomo: true, html: true }, f);
    expect(String(enviado.text)).toContain("responda SAIR");
    expect(String(enviado.html)).toContain("Onde a prática evolui.");
    expect(String(enviado.html)).toContain("contato profissional que você divulga publicamente");
    expect(String(enviado.text)).not.toContain("<");
  });
});
