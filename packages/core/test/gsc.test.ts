import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { gscPainel, lerChave, oportunidades, sincronizarGsc } from "../src/gsc";
import { classificarBusca, classificarPagina, cobertura } from "../src/gsc-analise";
import { rows } from "../src/sql";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const KEY = JSON.stringify({ client_email: "brain@proj.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) });
const T0 = Date.parse("2026-11-13T15:00:00Z");
const mk = () => { const b = new Brain(openDb(":memory:"), () => T0); seedKnownFacts(b); return b; };

const SITEMAP = `<urlset><url><loc>https://www.synapsa.chat/psicologo/gabriel-ramalho</loc></url><url><loc>https://www.synapsa.chat/psicologo/maria-sem-impressao</loc></url><url><loc>https://www.synapsa.chat/psicologos</loc></url></urlset>`;
function google(opts: { negarSite?: string } = {}) {
  const chamadas: { url: string; body?: any }[] = [];
  const f = (async (url: string, init?: any) => {
    const u = String(url);
    if (u.includes("oauth2.googleapis.com")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
    if (u.endsWith("sitemap.xml")) return new Response(SITEMAP, { status: 200 });
    const body = JSON.parse(init.body);
    chamadas.push({ url: u, body });
    if (opts.negarSite && u.includes(encodeURIComponent(opts.negarSite))) return new Response(JSON.stringify({ error: { message: "forbidden" } }), { status: 403 });
    const d = body.dimensions.join("+");
    const chat = u.includes("synapsa.chat");
    const R = (rows: any[]) => new Response(JSON.stringify({ rows }), { status: 200 });
    if (d === "date") return R([{ keys: ["2026-11-10"], clicks: 5, impressions: 200, ctr: 0.025, position: 9.5 }, { keys: ["2026-11-11"], clicks: 7, impressions: 300, ctr: 0.0233, position: 8.9 }]);
    if (d === "date+page") return R(chat ? [{ keys: ["2026-11-10", "https://www.synapsa.chat/psicologo/gabriel-ramalho"], clicks: 1, impressions: 9, ctr: 0.11, position: 6 }] : [{ keys: ["2026-11-10", "https://synapsa.com.br/clinicas"], clicks: 4, impressions: 250, ctr: 0.016, position: 6 }]);
    if (d === "query") return R([{ keys: ["software para clínica de psicologia"], clicks: 3, impressions: 400, ctr: 0.0075, position: 7.2 }, { keys: ["psicólogo em porto alegre"], clicks: 10, impressions: 100, ctr: 0.1, position: 2 }, { keys: ["synapsa"], clicks: 20, impressions: 60, ctr: 0.33, position: 1.2 }]);
    if (d === "page") return R(chat ? [{ keys: ["https://www.synapsa.chat/psicologo/gabriel-ramalho"], clicks: 1, impressions: 9, ctr: 0.11, position: 6.2 }] : [{ keys: ["https://synapsa.com.br/clinicas"], clicks: 4, impressions: 250, ctr: 0.016, position: 6 }]);
    if (d === "device") return R([{ keys: ["MOBILE"], clicks: 3, impressions: 100, ctr: 0.03, position: 8 }]);
    if (d === "country") return R([{ keys: ["bra"], clicks: 3, impressions: 100, ctr: 0.03, position: 8 }]);
    return R([{ keys: ["https://www.synapsa.chat/psicologo/gabriel-ramalho", "psicólogo em porto alegre"], clicks: 1, impressions: 4, ctr: 0.25, position: 5 }]);
  }) as unknown as typeof fetch;
  return { f, chamadas };
}

describe("search console", () => {
  it("sem chave não faz nada e diz o que falta", async () => {
    expect(await sincronizarGsc(mk(), {})).toMatch(/GSC_SERVICE_ACCOUNT/);
    expect(lerChave({ GSC_SERVICE_ACCOUNT: "não é json" })).toBeNull();
  });
  it("sincroniza as duas propriedades, sem filtrar o diretório, e só roda uma vez por dia", async () => {
    const brain = mk();
    const { f, chamadas } = google();
    expect(await sincronizarGsc(brain, { GSC_SERVICE_ACCOUNT: KEY }, f)).toMatch(/sincronizado/);
    expect(rows(brain.db, "select 1 from gsc_dia where site = 'diretorio'").length).toBe(2);
    expect(rows(brain.db, "select 1 from gsc_pagina_dia where site = 'diretorio'").length).toBe(1);
    expect(chamadas.every((c) => c.body.dimensionFilterGroups === undefined)).toBe(true);
    const n = chamadas.length;
    expect(await sincronizarGsc(brain, { GSC_SERVICE_ACCOUNT: KEY }, f)).toMatch(/já sincronizado/);
    expect(chamadas.length).toBe(n);
  });
  it("painel: totais, marca x não marca, oportunidades, página /clinicas e perfis que o Google não mostrou", async () => {
    const brain = mk();
    await sincronizarGsc(brain, { GSC_SERVICE_ACCOUNT: KEY }, google().f);
    const p = gscPainel(brain, { GSC_SERVICE_ACCOUNT: KEY });
    const site = p.sites.find((s) => s.id === "site")!;
    expect(site.atual).toMatchObject({ clicks: 12, impressions: 500 });
    expect(site.marca).toMatchObject({ clicks: 20, impressions: 60 });
    expect(site.naoMarca.impressions).toBe(500);
    expect(site.oportunidades.map((o) => o.chave)).toContain("software para clínica de psicologia");
    expect(site.oportunidades.map((o) => o.chave)).not.toContain("synapsa");
    expect(p.clinicas).toEqual({ clicks: 4, impressions: 250 });
    const dir = p.sites.find((s) => s.id === "diretorio")!;
    expect(dir.perfis).toMatchObject({ comImpressao: 1, comClique: 1, total: 2, esperados: 2 });
    expect(dir.perfis!.semImpressao).toEqual([{ url: "/psicologo/maria-sem-impressao", nome: "Maria Sem Impressao" }]);
    const perfil = dir.paginas.find((x) => x.tipo === "perfil")!;
    expect(perfil).toMatchObject({ rotulo: "Gabriel Ramalho", status: "clique" });
    expect(perfil.buscas[0]).toMatchObject({ busca: "psicólogo em porto alegre", impressions: 4 });
    expect(perfil.serie).toHaveLength(28);
    expect(dir.recados.length).toBeGreaterThan(0);
    expect(p.configurado).toBe(true);
  });
  it("403 explica o que fazer e não marca o dia como sincronizado", async () => {
    const brain = mk();
    const msg = await sincronizarGsc(brain, { GSC_SERVICE_ACCOUNT: KEY }, google({ negarSite: "sc-domain:synapsa.chat" }).f);
    expect(msg).toMatch(/adicione o e-mail da conta de serviço/);
    expect(gscPainel(brain, { GSC_SERVICE_ACCOUNT: KEY }).ultimaSync).toBeNull();
  });
  it("oportunidade exige impressão, CTR baixo e posição alcançável, e ignora a marca", () => {
    const l = oportunidades([{ chave: "a psicologo", clicks: 0, impressions: 10, ctr: 0.01, position: 8 }, { chave: "b psicologo", clicks: 1, impressions: 100, ctr: 0.2, position: 25 }, { chave: "sinapsa", clicks: 0, impressions: 50, ctr: 0, position: 12 }, { chave: "c psicologo", clicks: 0, impressions: 1, ctr: 0, position: 8 }]);
    expect(l.map((x) => x.chave)).toEqual(["a psicologo"]);
    expect(l[0]!.acao).toMatch(/título e descrição/);
  });
});

describe("classificação", () => {
  it("páginas do diretório e do site", () => {
    expect(classificarPagina("https://www.synapsa.chat/psicologo/ana-carolina-hartung-catelan")).toMatchObject({ tipo: "perfil", rotulo: "Ana Carolina Hartung Catelan" });
    expect(classificarPagina("https://www.synapsa.chat/psicologos").tipo).toBe("listagem");
    expect(classificarPagina("https://www.synapsa.chat/").tipo).toBe("home");
    expect(classificarPagina("https://synapsa.com.br/software-para-psicologos").tipo).toBe("produto");
    expect(classificarPagina("https://synapsa.com.br/politica-de-cookies").tipo).toBe("legal");
  });
  it("buscas: marca com erro de grafia, cidade, tema, software", () => {
    for (const q of ["synapsa", "sinapsa", "psynaps", "sanapsy", "sinappsy", "synapsa ai"]) expect(classificarBusca(q).categoria).toBe("marca");
    expect(classificarBusca("psicólogo em porto alegre")).toMatchObject({ categoria: "psicologo_local", cidade: "Porto Alegre" });
    expect(classificarBusca("psicólogos em bh")).toMatchObject({ categoria: "psicologo_local", cidade: "Belo Horizonte" });
    expect(classificarBusca("psicólogo pirassununga")).toMatchObject({ categoria: "psicologo_local", cidade: "Pirassununga" });
    expect(classificarBusca("psicóloga para ansiedade")).toMatchObject({ categoria: "psicologo_tema", tema: "ansiedade" });
    expect(classificarBusca("melhor software para psicólogos").categoria).toBe("software");
    expect(classificarBusca("gestão financeira para psicólogos").categoria).toBe("software");
    expect(classificarBusca("consultapsi").categoria).toBe("concorrente");
    expect(classificarBusca("valores").categoria).toBe("outra");
    expect(classificarBusca("sinapses neurônios").categoria).toBe("outra");
  });
  it("cobertura mostra as capitais sem presença", () => {
    const c = cobertura([{ chave: "psicólogo em porto alegre", clicks: 0, impressions: 8, ctr: 0, position: 80 }]);
    expect(c.cidades[0]).toMatchObject({ nome: "Porto Alegre", impressions: 8 });
    expect(c.cidades.find((x) => x.nome === "Curitiba")!.impressions).toBe(0);
  });
});
