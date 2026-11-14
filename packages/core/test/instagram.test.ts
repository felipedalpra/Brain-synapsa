import { describe, expect, it } from "vitest";
import { Brain } from "../src/brain";
import { openDb } from "../src/node-db";
import { seedKnownFacts } from "../src/seed";
import { decidirPost, igContexto, igPainel, publicarDevidos, publicarPost, receberPost, servirMidia, tokenValido } from "../src/instagram";

const T0 = Date.parse("2026-11-14T15:00:00Z");
const mk = () => { let t = T0; const b = new Brain(openDb(":memory:"), () => t); seedKnownFacts(b); return Object.assign(b, { avancar: (ms: number) => { t += ms; } }); };
const JPG = "/9j/" + "A".repeat(40);
const ENV = { META_SYSTEM_USER_TOKEN: "tok", META_IG_ID: "178", IG_INGEST_TOKEN: "x".repeat(32) };
const post = (extra: Record<string, unknown> = {}) => ({ tema: "Fases da carreira", pilar: "Jornada", maturidade: "educativo", legenda: "A carreira tem fases.", textos: "slide 1", slides: [JPG, JPG, JPG], ...extra });

function meta(falhar = false) {
  const chamadas: string[] = [];
  let n = 0;
  const f = (async (url: string, init?: any) => {
    const u = String(url);
    chamadas.push(`${init?.method} ${u.split("/v23.0/")[1]!.split("?")[0]} ${init?.body ? String(init.body) : ""}`);
    if (falhar && u.endsWith("media_publish")) return new Response(JSON.stringify({ error: { message: "sem permissão" } }), { status: 400 });
    if (init?.method === "GET") return new Response(JSON.stringify({ status_code: "FINISHED", permalink: "https://instagram.com/p/abc" }), { status: 200 });
    return new Response(JSON.stringify({ id: `c${++n}` }), { status: 200 });
  }) as unknown as typeof fetch;
  return { f, chamadas };
}

describe("instagram", () => {
  it("token de entrega: exige o segredo certo", () => {
    const req = (h: string) => new Request("https://b/api/instagram/entrega", { headers: { authorization: h } });
    expect(tokenValido(ENV, req(`Bearer ${"x".repeat(32)}`))).toBe(true);
    expect(tokenValido(ENV, req("Bearer errado"))).toBe(false);
    expect(tokenValido({}, req("Bearer "))).toBe(false);
  });
  it("recebe, guarda as imagens e não duplica pela chave", () => {
    const b = mk();
    const r = receberPost(b, post({ chave: "s1-fases" }), "https://brain.dev");
    expect(r.status).toBe("pendente");
    expect(receberPost(b, post({ chave: "s1-fases" }), "https://brain.dev").id).toBe(r.id);
    const p = igPainel(b, ENV);
    expect(p.posts).toHaveLength(1);
    expect(p.posts[0]!.midias).toHaveLength(3);
    const img = servirMidia(b, p.posts[0]!.midias[0]!.split("/").pop()!);
    expect(img.status).toBe(200);
    expect(img.headers.get("content-type")).toBe("image/jpeg");
    expect(servirMidia(b, "../x.jpg").status).toBe(404);
    expect(igContexto(b).recentes[0]).toMatchObject({ tema: "Fases da carreira", status: "pendente" });
  });
  it("conformidade barra promessa, desconto e formato errado", () => {
    const b = mk();
    expect(() => receberPost(b, post({ legenda: "Resultado garantido para seus pacientes" }), "https://b")).toThrow(/conformidade/);
    expect(() => receberPost(b, post({ textos: "20% off só hoje" }), "https://b")).toThrow(/conformidade/);
    expect(() => receberPost(b, post({ textos: "o CPF do paciente" }), "https://b")).toThrow(/conformidade/);
    expect(receberPost(b, post({ chave: "ok", textos: "Agenda, prontuário e financeiro" }), "https://b").status).toBe("pendente");
    expect(() => receberPost(b, post({ slides: ["iVBORw0KGgo"] }), "https://b")).toThrow(/JPEG/);
    expect(() => receberPost(b, post({ maturidade: "lancado" }), "https://b")).toThrow(/maturidade/);
  });
  it("só publica o aprovado; carrossel cria um item por imagem", async () => {
    const b = mk();
    const { id } = receberPost(b, post(), "https://brain.dev");
    const m = meta();
    await expect(publicarPost(b, ENV, id, m.f)).rejects.toThrow(/aprovado/);
    decidirPost(b, id, "aprovar");
    expect(await publicarPost(b, ENV, id, m.f, async () => {})).toMatch(/Publicado/);
    expect(m.chamadas.filter((c) => c.includes("is_carousel_item=true"))).toHaveLength(3);
    expect(m.chamadas.some((c) => c.includes("media_type=CAROUSEL") && c.includes("children=c1%2Cc2%2Cc3"))).toBe(true);
    expect(m.chamadas.some((c) => c.includes("image_url=https%3A%2F%2Fbrain.dev%2Fapi%2Fmidia%2F"))).toBe(true);
    expect(igPainel(b, ENV).posts[0]).toMatchObject({ status: "publicado", permalink: "https://instagram.com/p/abc" });
    await expect(publicarPost(b, ENV, id, m.f)).rejects.toThrow(/Já foi/);
  });
  it("falha do Instagram fica registrada no post", async () => {
    const b = mk();
    const { id } = receberPost(b, post({ slides: [JPG] }), "https://brain.dev");
    decidirPost(b, id, "aprovar");
    await expect(publicarPost(b, ENV, id, meta(true).f, async () => {})).rejects.toThrow(/sem permissão/);
    expect(igPainel(b, ENV).posts[0]).toMatchObject({ status: "falhou" });
  });
  it("cron: sem o automático não toca em pendente; com ele, espera as horas e publica 1 por dia", async () => {
    const b = mk();
    receberPost(b, post({ chave: "a" }), "https://brain.dev");
    receberPost(b, post({ chave: "b", tema: "Outro" }), "https://brain.dev");
    const m = meta();
    expect(await publicarDevidos(b, ENV, m.f)).toBeNull();
    b.setPolicy("ig_auto_publicar", true);
    expect(await publicarDevidos(b, ENV, m.f)).toBeNull(); // ainda dentro da janela de espera
    b.avancar(13 * 3_600_000);
    expect(await publicarDevidos(b, ENV, m.f)).toMatch(/Publicado/);
    expect(await publicarDevidos(b, ENV, m.f)).toBeNull(); // 1 por dia
    expect(igPainel(b, ENV).posts.filter((p) => p.status === "publicado")).toHaveLength(1);
  });
  it("rejeitar tira as imagens do ar e o botão de emergência bloqueia tudo", async () => {
    const b = mk();
    const { id } = receberPost(b, post(), "https://brain.dev");
    const nome = igPainel(b, ENV).posts[0]!.midias[0]!.split("/").pop()!;
    decidirPost(b, id, "rejeitar", "fora do posicionamento");
    expect(servirMidia(b, nome).status).toBe(404);
    expect(igContexto(b).recentes[0]!.motivoRejeicao).toBe("fora do posicionamento");
  });
});
