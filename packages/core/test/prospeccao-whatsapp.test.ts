import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { run } from "../src/sql";
import { linkWhatsapp, marcarWhatsapp, mensagemWhatsapp, numeroWhatsapp, painelWhatsapp } from "../src/prospeccao-whatsapp";
import { marcarContato } from "../src/prospeccao-email";

const T0 = Date.parse("2026-11-12T15:00:00Z");
const mk = () => {
  let t = T0;
  const brain = new Brain(openDb(":memory:"), () => t);
  seedKnownFacts(brain);
  const add = (id: number, nome: string, tel: string | null, nota: number, extra = "", status = "qualificado") =>
    run(brain.db, `insert into prospects (id, place_id, nome, telefone, nota, status, email, criado_em, atualizado_em ${extra ? ", whatsapp_no_site" : ""}) values (?, ?, ?, ?, ?, ?, ?, 0, 0 ${extra ? ", 1" : ""})`, id, `p${id}`, nome, tel, nota, status, `c${id}@x.com.br`);
  return { brain, add, tick: (ms: number) => (t += ms) };
};

describe("número", () => {
  it("celular com máscara", () => expect(numeroWhatsapp("(11) 98765-4321")).toEqual({ numero: "5511987654321", celular: true }));
  it("com +55", () => expect(numeroWhatsapp("+55 21 99876-5432")?.numero).toBe("5521998765432"));
  it("fixo é reconhecido como não celular", () => expect(numeroWhatsapp("(51) 3333-4444")).toEqual({ numero: "555133334444", celular: false }));
  it("lixo é recusado", () => { expect(numeroWhatsapp("123")).toBeNull(); expect(numeroWhatsapp(null)).toBeNull(); expect(numeroWhatsapp("(11) 22222-2222")).toBeNull(); });
});

describe("mensagem", () => {
  it("fala de operação e inclui o site; nunca de abandono", () => {
    const m = mensagemWhatsapp("Clínica Alfa Psicologia", 0);
    expect(m).toContain("synapsa.com.br/clinicas");
    expect(m).toMatch(/centralizar|processos manuais|administrativas/);
    expect(m).not.toMatch(/abandono|acompanhamento|entre sess/i);
  });
  it("link codifica o texto", () => expect(linkWhatsapp("5511987654321", "a b&c")).toBe("https://wa.me/5511987654321?text=a%20b%26c"));
});

describe("fila", () => {
  it("só celular ou WhatsApp no site, melhor nota primeiro, respeita o limite diário", () => {
    const { brain, add } = mk();
    add(1, "A", "(11) 98765-4321", 70); add(2, "B", "(51) 3333-4444", 90); add(3, "C", "(21) 99876-5432", 80); add(4, "D", "(51) 3333-5555", 60, "wa");
    brain.setPolicy("prospect_whatsapp_daily", 2);
    const p = painelWhatsapp(brain);
    expect(p.capDia).toBe(2);
    expect(p.fila.map((x) => x.prospectId)).toEqual([3, 1]);
    brain.setPolicy("prospect_whatsapp_daily", 10);
    expect(painelWhatsapp(brain).fila.map((x) => x.prospectId)).toEqual([3, 1, 4]);
  });
  it("quem respondeu ou pediu sair sai da fila", () => {
    const { brain, add } = mk();
    add(1, "A", "(11) 98765-4321", 70); add(2, "B", "(21) 99876-5432", 80);
    marcarContato(brain, 1, "respondeu");
    expect(painelWhatsapp(brain).fila.map((x) => x.prospectId)).toEqual([2]);
  });
  it("marcar como enviado tira da fila, conta no dia e o follow-up volta em 4 dias", () => {
    const { brain, add, tick } = mk();
    add(1, "A", "(11) 98765-4321", 70);
    marcarWhatsapp(brain, 1, 0, "enviado");
    let p = painelWhatsapp(brain);
    expect(p.fila).toHaveLength(0);
    expect(p.enviadosHoje).toBe(1);
    tick(3 * 86_400_000);
    expect(painelWhatsapp(brain).fila).toHaveLength(0);
    tick(1.1 * 86_400_000);
    p = painelWhatsapp(brain);
    expect(p.fila).toHaveLength(1);
    expect(p.fila[0]).toMatchObject({ prospectId: 1, etapa: 1 });
    marcarWhatsapp(brain, 1, 1, "enviado");
    expect(painelWhatsapp(brain).fila).toHaveLength(0);
  });
  it("pular não conta como envio e não volta", () => {
    const { brain, add, tick } = mk();
    add(1, "A", "(11) 98765-4321", 70);
    marcarWhatsapp(brain, 1, 0, "pular");
    expect(painelWhatsapp(brain).enviadosHoje).toBe(0);
    tick(10 * 86_400_000);
    expect(painelWhatsapp(brain).fila).toHaveLength(0);
  });
});
