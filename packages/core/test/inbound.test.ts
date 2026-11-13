import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { classificar, enderecoDe, textoNovo, tratarRecebido } from "../src/inbound";
import { run, row, rows } from "../src/sql";

const ENV = { RESEND_API_KEY: "re_teste", RESEND_FROM_PROSPECCAO: "Felipe <felipe@ola.synapsa.chat>", RESEND_REPLY_TO: "dono@gmail.com", RESEND_INBOUND: "respostas@ola.synapsa.chat" };
const mk = () => {
  const brain = new Brain(openDb(":memory:"), () => Date.parse("2026-11-12T15:00:00Z"));
  seedKnownFacts(brain);
  run(brain.db, "insert into prospects (id, place_id, nome, email, status, criado_em, atualizado_em) values (1, 'pl1', 'Clínica Alfa Psicologia', 'contato@alfa.com.br', 'qualificado', 0, 0)");
  return brain;
};
const fakeFetch = (texto: string, headers: Record<string, string> = {}) => {
  const sent: any[] = [];
  const f = (async (url: string, init?: any) => {
    if (String(url).includes("/emails/receiving/")) return new Response(JSON.stringify({ text: texto, headers }), { status: 200 });
    sent.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ id: "x" }), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, sent };
};

describe("classificação", () => {
  it("lê o endereço com nome", () => expect(enderecoDe("Ana Souza <Ana@Alfa.com.br>")).toBe("ana@alfa.com.br"));
  it("corta a citação", () => expect(textoNovo("Pode ser terça.\n\nEm qua, 11 de nov escreveu:\n> oi")).toBe("Pode ser terça."));
  it("resposta automática é ignorada", () => expect(classificar("Resposta automática: férias", "voltamos dia 20")).toBe("automatica"));
  it("cabeçalho Auto-Submitted conta como automática", () => expect(classificar("Re: oi", "ok", { "auto-submitted": "auto-replied" })).toBe("automatica"));
  it("pedido de saída", () => expect(classificar("Re: oi", "Por favor remover meu e-mail da lista")).toBe("sair"));
  it("SAIR só no assunto", () => expect(classificar("SAIR", "")).toBe("sair"));
  it("interesse é resposta", () => expect(classificar("Re: oi", "Tenho interesse, podemos falar terça?")).toBe("resposta"));
  it("'não' dentro da citação não vira saída", () => expect(classificar("Re: oi", "Pode ser sexta.\n> não quero perder tempo")).toBe("resposta"));
});

describe("resposta recebida", () => {
  it("interesse: marca respondeu, para a sequência, cria rascunho e encaminha", async () => {
    const brain = mk();
    const { f, sent } = fakeFetch("Oi! Quero ver a demo, pode ser terça?");
    const r = await tratarRecebido(brain, ENV, { email_id: "e1", from: "Ana <contato@alfa.com.br>", subject: "Re: Menos trabalho manual" }, f);
    expect(r).toMatchObject({ tipo: "resposta", prospectId: 1 });
    expect(row<{ respondeu: number }>(brain.db, "select respondeu from prospect_contato where prospect_id = 1")?.respondeu).toBe(1);
    const p = rows<{ kind: string; status: string; payload: string }>(brain.db, "select kind, status, payload from proposals where kind = 'resposta_lead'");
    expect(p).toHaveLength(1);
    expect(p[0]!.status).toBe("pendente");
    expect(JSON.parse(p[0]!.payload).envio).toMatchObject({ para: "contato@alfa.com.br", remetente: "prospeccao" });
    expect(sent[0]).toMatchObject({ to: ["dono@gmail.com"] });
    expect(sent[0].subject).toContain("[Resposta]");
  });
  it("SAIR: bloqueia o endereço e para tudo", async () => {
    const brain = mk();
    const { f } = fakeFetch("Remover por favor");
    const r = await tratarRecebido(brain, ENV, { email_id: "e2", from: "contato@alfa.com.br", subject: "Re: oi" }, f);
    expect(r.tipo).toBe("sair");
    expect(row(brain.db, "select 1 as x from email_suppression where email = 'contato@alfa.com.br'")).toBeTruthy();
    expect(row<{ sair: number }>(brain.db, "select sair from prospect_contato where prospect_id = 1")?.sair).toBe(1);
  });
  it("automática não muda nada", async () => {
    const brain = mk();
    const { f, sent } = fakeFetch("Estou fora", { "auto-submitted": "auto-replied" });
    expect((await tratarRecebido(brain, ENV, { email_id: "e3", from: "contato@alfa.com.br", subject: "Re: oi" }, f)).tipo).toBe("automatica");
    expect(row(brain.db, "select 1 as x from prospect_contato")).toBeFalsy();
    expect(sent).toHaveLength(0);
  });
  it("o mesmo e-mail duas vezes é tratado uma vez", async () => {
    const brain = mk();
    const { f } = fakeFetch("Quero sim");
    await tratarRecebido(brain, ENV, { email_id: "e4", from: "contato@alfa.com.br", subject: "Re: oi" }, f);
    expect((await tratarRecebido(brain, ENV, { email_id: "e4", from: "contato@alfa.com.br", subject: "Re: oi" }, f)).tipo).toBe("repetido");
    expect(rows(brain.db, "select 1 from proposals where kind = 'resposta_lead'")).toHaveLength(1);
  });
  it("ignora e-mail vindo do próprio Brain (evita laço)", async () => {
    const brain = mk();
    const { f } = fakeFetch("x");
    expect((await tratarRecebido(brain, ENV, { email_id: "e5", from: "felipe@ola.synapsa.chat", subject: "[Resposta] x" }, f)).tipo).toBe("interno");
  });
});
