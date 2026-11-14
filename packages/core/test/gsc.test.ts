import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { gscPainel, lerChave, oportunidades, sincronizarGsc } from "../src/gsc";
import { rows } from "../src/sql";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const KEY = JSON.stringify({ client_email: "brain@proj.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) });
const T0 = Date.parse("2026-11-13T15:00:00Z");
const mk = () => { const b = new Brain(openDb(":memory:"), () => T0); seedKnownFacts(b); return b; };

function google(opts: { negarSite?: string } = {}) {
  const chamadas: { url: string; body?: any }[] = [];
  const f = (async (url: string, init?: any) => {
    const u = String(url);
    if (u.includes("oauth2.googleapis.com")) return new Response(JSON.stringify({ access_token: "tok", expires_in: 3600 }), { status: 200 });
    const body = JSON.parse(init.body);
    chamadas.push({ url: u, body });
    if (opts.negarSite && u.includes(encodeURIComponent(opts.negarSite))) return new Response(JSON.stringify({ error: { message: "forbidden" } }), { status: 403 });
    if (body.dimensions[0] === "date") return new Response(JSON.stringify({ rows: [{ keys: ["2026-11-10"], clicks: 5, impressions: 200, ctr: 0.025, position: 9.5 }, { keys: ["2026-11-11"], clicks: 7, impressions: 300, ctr: 0.0233, position: 8.9 }] }), { status: 200 });
    if (body.dimensions[0] === "query") return new Response(JSON.stringify({ rows: [{ keys: ["software para clínica de psicologia"], clicks: 3, impressions: 400, ctr: 0.0075, position: 7.2 }, { keys: ["psicólogo em porto alegre"], clicks: 10, impressions: 100, ctr: 0.1, position: 2 }] }), { status: 200 });
    return new Response(JSON.stringify({ rows: [{ keys: ["https://synapsa.com.br/clinicas"], clicks: 4, impressions: 250, ctr: 0.016, position: 6 }] }), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, chamadas };
}

describe("search console", () => {
  it("sem chave não faz nada e diz o que falta", async () => {
    expect(await sincronizarGsc(mk(), {})).toMatch(/GSC_SERVICE_ACCOUNT/);
    expect(lerChave({ GSC_SERVICE_ACCOUNT: "não é json" })).toBeNull();
  });
  it("sincroniza as duas propriedades, guarda histórico e topo e só roda uma vez por dia", async () => {
    const brain = mk();
    const { f, chamadas } = google();
    const msg = await sincronizarGsc(brain, { GSC_SERVICE_ACCOUNT: KEY }, f);
    expect(msg).toMatch(/sincronizado/);
    expect(rows(brain.db, "select 1 from gsc_dia where site = 'diretorio'").length).toBe(2);
    const dir = chamadas.find((c) => c.url.includes("synapsa.chat") && c.body.dimensions[0] === "date")!;
    expect(dir.body.dimensionFilterGroups[0].filters[0]).toMatchObject({ dimension: "page", expression: "https://synapsa.chat/psicologos" });
    expect(chamadas.find((c) => c.url.includes("synapsa.com.br"))!.body.dimensionFilterGroups).toBeUndefined();
    const n = chamadas.length;
    expect(await sincronizarGsc(brain, { GSC_SERVICE_ACCOUNT: KEY }, f)).toMatch(/já sincronizado/);
    expect(chamadas.length).toBe(n);
  });
  it("painel: totais dos últimos 28 dias, oportunidades e a página /clinicas", async () => {
    const brain = mk();
    await sincronizarGsc(brain, { GSC_SERVICE_ACCOUNT: KEY }, google().f);
    const p = gscPainel(brain, { GSC_SERVICE_ACCOUNT: KEY });
    const site = p.sites.find((s) => s.id === "site")!;
    expect(site.atual).toMatchObject({ clicks: 12, impressions: 500 });
    expect(site.oportunidades.map((o) => o.chave)).toEqual(["software para clínica de psicologia"]);
    expect(p.clinicas).toEqual({ clicks: 4, impressions: 250 });
    expect(p.configurado).toBe(true);
  });
  it("403 explica o que fazer e não marca o dia como sincronizado", async () => {
    const brain = mk();
    const msg = await sincronizarGsc(brain, { GSC_SERVICE_ACCOUNT: KEY }, google({ negarSite: "sc-domain:synapsa.chat" }).f);
    expect(msg).toMatch(/adicione o e-mail da conta de serviço/);
    expect(gscPainel(brain, { GSC_SERVICE_ACCOUNT: KEY }).ultimaSync).toBeNull();
  });
  it("oportunidade exige volume, CTR baixo e posição alcançável", () => {
    expect(oportunidades([{ chave: "a", clicks: 0, impressions: 10, ctr: 0.01, position: 8 }, { chave: "b", clicks: 1, impressions: 100, ctr: 0.01, position: 25 }, { chave: "c", clicks: 1, impressions: 100, ctr: 0.01, position: 8 }])).toHaveLength(1);
  });
});
