import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { analiseAnuncios, analiseInstagram, lerPremissas, salvarPremissas } from "../src/midia";

const mk = () => new Brain(openDb(":memory:"));
const dia = (b: Brain, atras: number) => new Date(b.clock() - atras * 86_400_000).toISOString().slice(0, 10);

function post(b: Brain, id: string, tipo: string, atras: number, alcance: number, salvos: number, compart = 0, tema?: string) {
  b.db.prepare("insert into ig_post_metricas (media_id, tipo, publicado, permalink, legenda, curtidas, comentarios, alcance, salvos, compartilhados, views, interacoes, atualizado_em) values (?, ?, ?, ?, ?, 5, 1, ?, ?, ?, null, ?, ?)")
    .run(id, tipo, new Date(b.clock() - atras * 86_400_000).toISOString(), `https://ig/${id}`, `Legenda ${id}`, alcance, salvos, compart, salvos + compart + 6, b.clock());
  if (tema) b.db.prepare("insert into ig_posts (id, status, tema, pilar, legenda, agendado_para, criado_em, media_id) values (?, 'publicado', ?, ?, 'x', 0, 0, ?)").run(`ig-${id}`, tema, tema, id);
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
    expect(a.leitura.some((l) => /Pilar que mais salva: Faltas/.test(l.titulo))).toBe(true);
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

import { analiseCriativos, analisePixel, analisePublicos, midiaPainel, periodoDe } from "../src/midia";
import { sincronizarMidia } from "../src/midia-sync";

const diaDe = (b: Brain, atras: number) => new Date(b.clock() - atras * 86_400_000).toISOString().slice(0, 10);
const adDia = (b: Brain, ad: string, atras: number, spend: number, impr: number, reach: number, clicks: number, leads: number) =>
  b.db.prepare("insert into meta_ad_dia (day, ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name, spend, impressions, reach, clicks, link_clicks, leads, updated_at) values (?, ?, ?, 's1', 'Conjunto', 'c1', 'Campanha', ?, ?, ?, ?, ?, ?, ?)")
    .run(diaDe(b, atras), ad, `Anúncio ${ad}`, spend, impr, reach, clicks, clicks, leads, b.clock());
const clienteMrr = (b: Brain, preco = 100) => b.db.prepare("insert into subscriptions (source, external_id, label, list_price_brl, effective_price_brl, discount_ends_at, status, origin, updated_at) values ('manual', 'm1', 'c', ?, ?, null, 'active', 'informado', 0)").run(preco, preco);

describe("período", () => {
  it("usa 30 dias por padrão, e o anterior tem o mesmo tamanho", () => {
    const p = periodoDe(mk());
    expect(p.dias).toBe(30);
    expect(p.anterior.ate < p.de).toBe(true);
  });
  it("aceita intervalo, corrige a ordem e não passa de hoje", () => {
    const b = mk();
    const p = periodoDe(b, "2026-05-10", "2026-05-01");
    expect(p.de).toBe("2026-05-01");
    expect(p.dias).toBe(10);
    expect(periodoDe(b, "2026-05-01", "2999-01-01").ate).toBe(diaDe(b, 0));
  });
});

describe("criativos", () => {
  it("compara anúncios, manda pausar o ruim e aponta o cansado", () => {
    const b = mk();
    clienteMrr(b);
    for (let i = 1; i <= 10; i++) adDia(b, "bom", i, 10, 1000, 800, 30, 1); // CPL 10, 10 leads
    for (let i = 1; i <= 10; i++) adDia(b, "ruim", i, 10, 1000, 900, 10, 0); // sem lead, R$100
    for (let i = 20; i >= 15; i--) adDia(b, "cansado", i, 10, 1000, 300, 30, 1); // 1ª metade: CTR 3%, freq alta
    for (let i = 10; i >= 1; i--) adDia(b, "cansado", i, 10, 1000, 300, 10, 1); // 2ª metade: CTR 1%
    b.db.prepare("insert into meta_criativo (ad_id, nome, status, miniatura, atualizado_em) values ('parado', 'Antigo', 'PAUSED', 'http://x/y.jpg', 0)").run();
    const c = analiseCriativos(b);
    const por = Object.fromEntries(c.itens.map((i) => [i.id, i]));
    expect(por.bom!.veredito).toBe("escalar");
    expect(por.ruim!.veredito).toBe("pausar");
    expect(por.cansado!.cansado).toBe(true);
    expect(c.parados.map((p) => p.id)).toEqual(["parado"]);
    expect(c.leitura.some((l) => /Pausar “Anúncio ruim”/.test(l.titulo))).toBe(true);
  });
});

describe("pixel e rastreio", () => {
  const evento = (b: Brain, atras: number, ev: string, total: number) => b.db.prepare("insert into meta_pixel_dia (day, pixel_id, evento, total) values (?, 'p1', ?, ?)").run(diaDe(b, atras), ev, total);
  it("sem pixel, avisa", () => {
    expect(analisePixel(mk()).leitura[0]!.titulo).toMatch(/Nenhum pixel/);
  });
  it("vê visita sem conversão, pixel parado e cliques perdidos", () => {
    const b = mk();
    b.db.prepare("insert into meta_pixel (pixel_id, nome, ultimo_disparo, indisponivel, atualizado_em) values ('p1', 'Site', ?, 0, 0)").run(new Date(b.clock() - 5 * 86_400_000).toISOString());
    evento(b, 3, "PageView", 40);
    for (let i = 1; i <= 5; i++) adDia(b, "a", i, 20, 1000, 900, 20, 0); // 100 cliques no link, 40 visitas
    const t = analisePixel(b).leitura.map((l) => l.titulo).join("|");
    expect(t).toMatch(/parado há 5 dias/);
    expect(t).toMatch(/nenhuma conversão/);
    expect(t).toMatch(/Perdendo 60%/);
  });
  it("calcula o funil e a taxa visita→lead", () => {
    const b = mk();
    b.db.prepare("insert into meta_pixel (pixel_id, nome, ultimo_disparo, indisponivel, atualizado_em) values ('p1', 'Site', ?, 0, 0)").run(new Date(b.clock()).toISOString());
    evento(b, 2, "PageView", 200);
    evento(b, 2, "Lead", 10);
    const p = analisePixel(b);
    expect(p.funil.map((f) => f.evento)).toEqual(["PageView", "Lead"]);
    expect(p.funil[1]!.do_anterior_pct).toBe(5);
    expect(p.leitura.some((l) => /5% das visitas viram lead/.test(l.titulo))).toBe(true);
  });
});

describe("públicos", () => {
  it("manda tirar posicionamento caro sem lead e concentrar no que rende", () => {
    const b = mk();
    clienteMrr(b);
    const q = (tipo: string, chave: string, spend: number, leads: number) => b.db.prepare("insert into meta_quebra_dia (day, tipo, chave, spend, impressions, clicks, leads) values (?, ?, ?, ?, 1000, 20, ?)").run(diaDe(b, 3), tipo, chave, spend, leads);
    q("posicionamento", "facebook · feed", 70, 0);
    q("posicionamento", "instagram · stories", 30, 6);
    q("idade_genero", "25-34 · mulheres", 40, 8);
    q("idade_genero", "45-54 · homens", 60, 3);
    const l = analisePublicos(b).leitura.map((x) => x.titulo).join("|");
    expect(l).toMatch(/Tire posicionamento “facebook · feed”/);
    expect(l).toMatch(/Concentre verba em público “25-34 · mulheres”/);
  });
});

describe("sincronização", () => {
  it("cada parte falha sozinha e o diagnóstico explica a permissão", async () => {
    const b = mk();
    const orig = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      const u = String(url);
      if (u.includes("/adspixels")) return new Response("{}", { status: 403 });
      if (u.includes("/insights") && u.includes("level=ad")) return new Response(JSON.stringify({ data: [{ date_start: diaDe(b, 1), ad_id: "9", ad_name: "A", adset_id: "1", adset_name: "S", campaign_id: "2", campaign_name: "C", spend: "12.5", impressions: "1000", reach: "800", clicks: "30", inline_link_clicks: "25", actions: [{ action_type: "lead", value: "2" }] }] }), { status: 200 });
      if (u.includes("/ads?")) return new Response(JSON.stringify({ data: [{ id: "9", name: "A", effective_status: "ACTIVE", creative: { thumbnail_url: "http://t/1.jpg", body: "Texto" } }] }), { status: 200 });
      return new Response(JSON.stringify({ data: [] }), { status: 200 });
    }) as typeof fetch;
    try {
      const d = await sincronizarMidia(b, { META_SYSTEM_USER_TOKEN: "t", META_AD_ACCOUNT_ID: "123" }, { dias: 30 });
      expect(d.find((x) => x.parte === "Anúncios por criativo")).toMatchObject({ ok: true, linhas: 1 });
      expect(d.find((x) => x.parte === "Criativos")).toMatchObject({ ok: true, linhas: 1 });
      const px = d.find((x) => x.parte === "Pixel")!;
      expect(px.ok).toBe(false);
      expect(px.erro).toMatch(/ads_read/);
    } finally { globalThis.fetch = orig; }
    const p = midiaPainel(b);
    expect(p.criativos.itens[0]!.miniatura).toBe("http://t/1.jpg");
    expect(p.anuncios.atual.gasto).toBe(12.5);
    expect(p.diagnostico?.itens.length).toBeGreaterThan(2);
  });
});
