import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { analiseAnuncios, analiseInstagram, lerPremissas, salvarPremissas } from "../src/midia";

const mk = () => new Brain(openDb(":memory:"));
const dia = (b: Brain, atras: number) => new Date(b.clock() - atras * 86_400_000).toISOString().slice(0, 10);

function post(b: Brain, id: string, tipo: string, atras: number, alcance: number, salvos: number, compart = 0, tema?: string) {
  b.db.prepare("insert into ig_post_metricas (media_id, tipo, publicado, permalink, legenda, curtidas, comentarios, alcance, salvos, compartilhados, views, interacoes, atualizado_em) values (?, ?, ?, ?, ?, 5, 1, ?, ?, ?, null, ?, ?)")
    .run(id, tipo, new Date(b.clock() - atras * 86_400_000).toISOString(), `https://ig/${id}`, `Legenda ${id}`, alcance, salvos, compart, salvos + compart + 6, b.clock());
  if (tema) b.db.prepare("insert into ig_posts (id, status, tema, pilar, legenda, agendado_para, criado_em, media_id) values (?, 'publicado', ?, 'p', 'x', 0, 0, ?)").run(`ig-${id}`, tema, id);
}

describe("analise do instagram", () => {
  it("sem métricas, pede para atualizar", () => {
    const a = analiseInstagram(mk());
    expect(a.posts_analisados).toBe(0);
    expect(a.leitura[0]!.titulo).toMatch(/métricas/i);
  });
  it("recomenda o formato e o tema que performam melhor, só com amostra suficiente", () => {
    const b = mk();
    for (let i = 0; i < 3; i++) post(b, `c${i}`, "CAROUSEL_ALBUM", i * 2 + 1, 300, 20, 5, "Faltas");
    for (let i = 0; i < 3; i++) post(b, `i${i}`, "IMAGE", i * 2 + 2, 100, 2, 0, "Burnout");
    const a = analiseInstagram(b);
    expect(a.por_formato[0]!.nome).toBe("Carrossel");
    expect(a.leitura.some((l) => l.nivel === "fazer" && /carrossel/i.test(l.titulo))).toBe(true);
    expect(a.leitura.some((l) => /Faltas/.test(l.titulo))).toBe(true);
    expect(a.melhores[0]!.alcance).toBe(300);
  });
  it("não compara formatos com menos de 3 posts", () => {
    const b = mk();
    post(b, "a", "CAROUSEL_ALBUM", 1, 500, 40);
    post(b, "b", "IMAGE", 2, 50, 1);
    expect(analiseInstagram(b).leitura.some((l) => l.nivel === "fazer" && /Priorize/.test(l.titulo))).toBe(false);
  });
});

describe("analise de anuncios", () => {
  const camp = (b: Brain, id: string, atras: number, spend: number, clicks: number, leads: number) =>
    b.db.prepare("insert into meta_ads_daily (day, ad_account_id, campaign_id, campaign_name, currency, spend, impressions, clicks, leads, updated_at) values (?, 'act_1', ?, ?, 'BRL', ?, ?, ?, ?, ?)").run(dia(b, atras), id, `Camp ${id}`, spend, clicks * 30, clicks, leads, b.clock());
  const cliente = (b: Brain, preco: number) => b.db.prepare("insert into subscriptions (source, external_id, label, list_price_brl, effective_price_brl, discount_ends_at, status, origin, updated_at) values ('manual', ?, 'c', ?, ?, null, 'active', 'informado', 0)").run(`m${Math.random()}`, preco, preco);

  it("sem gasto, diz o teto de custo por lead a partir das premissas", () => {
    const b = mk();
    cliente(b, 100);
    const a = analiseAnuncios(b);
    // ticket 100, 12 meses, LTV 1200, CAC máx 400, CPL máx 40
    expect(a.economia.cpl_maximo).toBe(40);
    expect(a.leitura.some((l) => /teto é R\$ 40,00/.test(l.titulo))).toBe(true);
  });
  it("manda pausar campanha sem lead e escalar a barata", () => {
    const b = mk();
    cliente(b, 100);
    camp(b, "ruim", 5, 80, 40, 0);
    camp(b, "cara", 4, 400, 100, 5); // CPL 80 > 40
    camp(b, "boa", 3, 100, 50, 10); // CPL 10 <= 24
    const a = analiseAnuncios(b);
    const v = Object.fromEntries(a.campanhas.map((c) => [c.id, c.veredito]));
    expect(v).toEqual({ ruim: "pausar", cara: "pausar", boa: "escalar" });
    expect(a.leitura.some((l) => /Aumentar verba/.test(l.titulo))).toBe(true);
  });
  it("compara com os 30 dias anteriores", () => {
    const b = mk();
    camp(b, "x", 10, 100, 20, 5);
    camp(b, "x", 40, 50, 10, 5);
    const a = analiseAnuncios(b);
    expect(a.variacao.gasto).toBe(100);
    expect(a.anterior.gasto).toBe(50);
  });
  it("premissas editáveis e limitadas", () => {
    const b = mk();
    expect(lerPremissas(b).conversaoLeadCliente).toBe(0.1);
    expect(salvarPremissas(b, { conversaoLeadCliente: 0.2, retencaoMeses: 6 }).retencaoMeses).toBe(6);
    expect(salvarPremissas(b, { conversaoLeadCliente: 5 }).conversaoLeadCliente).toBe(0.2);
  });
});
