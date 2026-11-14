// Instagram: fila de posts prontos (carrossel ou imagem única) que chegam de fora já renderizados.
// Quem cria o conteúdo é uma sessão agendada do Claude (Fable), fora do Brain; ela entrega aqui por um token que só ENFILEIRA.
// Publicar continua sendo decisão sua: aprovação na Central ou, se você ligar, publicação automática no horário agendado.
import { BrainError, type Brain } from "./brain";
import { TEXT_RULES } from "./compliance";
import { row, rows, run } from "./sql";

type Env = Record<string, string | undefined>;
const MAX_SLIDES = 10; // limite do carrossel da API do Instagram
const MAX_B64 = 1_300_000; // ~950 KB por imagem; cada uma vira uma linha (limite de 2 MB por linha no SQLite do Durable Object)

export type IgStatus = "pendente" | "aprovado" | "rejeitado" | "publicado" | "falhou";
export interface IgPost {
  id: string; status: IgStatus; tema: string; pilar: string; maturidade: string; legenda: string; textos: string; creditos: string;
  agendadoPara: number; criadoEm: number; publicadoEm: number | null; permalink: string | null; erro: string | null; midias: string[];
}
type Linha = { id: string; status: IgStatus; tema: string; pilar: string; maturidade: string; legenda: string; textos: string; creditos: string; agendado_para: number; criado_em: number; publicado_em: number | null; permalink: string | null; erro: string | null };

const igual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};
/** O token de entrega só enfileira e lê o histórico de temas. Não aprova nem publica. */
export function tokenValido(env: Env, req: Request): boolean {
  const t = env.IG_INGEST_TOKEN?.trim();
  const h = req.headers.get("authorization") ?? "";
  return !!t && t.length >= 24 && igual(h, `Bearer ${t}`);
}

/** As mesmas regras de texto das propostas (sem promessa de resultado, sem desconto, sem dado clínico, sem pressão). */
export function revisarTexto(texto: string): string | null {
  // Em post público, "prontuário" é nome de funcionalidade, não dado de paciente: aqui a regra clínica barra só o que identifica alguém.
  if (/\b(cpf|diagn[oó]stico d[eao] (meu|minha|um|uma) paciente|cid[- ]?\d|laudo d[eao])\b/i.test(texto)) return "cita dado clínico de paciente, que nunca entra no Brain";
  for (const r of TEXT_RULES) if (r.id !== "clinico" && r.test.test(texto)) return r.why;
  return null;
}

const MATURIDADES = new Set(["existe", "piloto", "plano", "educativo"]);

export function receberPost(brain: Brain, body: Record<string, unknown>, origem: string): { id: string; status: IgStatus; agendadoPara: number } {
  const s = (k: string, max: number) => String(body[k] ?? "").trim().slice(0, max);
  const legenda = s("legenda", 2200), tema = s("tema", 160), pilar = s("pilar", 60), textos = s("textos", 6000), creditos = s("creditos", 600), chave = s("chave", 120);
  const maturidade = s("maturidade", 20) || "educativo";
  const slides = Array.isArray(body.slides) ? (body.slides as unknown[]).map(String) : [];
  if (!legenda || !tema) throw new BrainError("invalid", "Faltou tema ou legenda.");
  if (!MATURIDADES.has(maturidade)) throw new BrainError("invalid", "maturidade deve ser existe, piloto, plano ou educativo.");
  if (slides.length < 1 || slides.length > MAX_SLIDES) throw new BrainError("invalid", `Mande de 1 a ${MAX_SLIDES} imagens.`);
  for (const b of slides) {
    if (b.length > MAX_B64) throw new BrainError("invalid", "Imagem grande demais: exporte em JPEG com até ~900 KB.");
    if (!b.startsWith("/9j/")) throw new BrainError("invalid", "As imagens devem ser JPEG em base64 (o Instagram só aceita JPEG).");
  }
  const motivo = revisarTexto(`${legenda}\n${textos}`);
  if (motivo) throw new BrainError("invalid", `A conformidade barrou esse post: ${motivo}. Reescreva e mande de novo.`);
  if (chave) {
    const ja = row<{ id: string; status: IgStatus; agendado_para: number }>(brain.db, "select id, status, agendado_para from ig_posts where chave = ?", chave);
    if (ja) return { id: ja.id, status: ja.status, agendadoPara: ja.agendado_para };
  }
  const agora = brain.clock();
  const ag = Date.parse(String(body.agendar_para ?? ""));
  const agendado = Number.isFinite(ag) && ag > agora ? ag : agora;
  const id = crypto.randomUUID();
  brain.db.transaction(() => {
    run(brain.db, "insert into ig_posts (id, chave, status, tema, pilar, maturidade, legenda, textos, creditos, agendado_para, criado_em) values (?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?, ?)", id, chave || null, tema, pilar, maturidade, legenda, textos, creditos, agendado, agora);
    slides.forEach((b, i) => run(brain.db, "insert into ig_midia (id, post_id, ordem, b64) values (?, ?, ?, ?)", crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8), id, i, b));
  });
  brain.setPolicy("ig_origem", origem);
  brain.audit("sistema", "ig_recebeu", tema, { slides: slides.length, maturidade });
  brain.emit("change");
  return { id, status: "pendente", agendadoPara: agendado };
}

/** A imagem pública que o Instagram vai buscar. O id é aleatório (160 bits) e só existe para posts da fila. */
export function servirMidia(brain: Brain, nome: string): Response {
  const m = nome.match(/^([a-f0-9]{40})\.jpg$/);
  const r = m ? row<{ b64: string }>(brain.db, "select b64 from ig_midia where id = ?", m[1]!) : undefined;
  if (!r) return new Response("não encontrado", { status: 404 });
  const bin = Uint8Array.from(atob(r.b64), (c) => c.charCodeAt(0));
  return new Response(bin, { status: 200, headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400" } });
}

const ver = (brain: Brain, l: Linha): IgPost => ({
  id: l.id, status: l.status, tema: l.tema, pilar: l.pilar, maturidade: l.maturidade, legenda: l.legenda, textos: l.textos, creditos: l.creditos,
  agendadoPara: l.agendado_para, criadoEm: l.criado_em, publicadoEm: l.publicado_em, permalink: l.permalink, erro: l.erro,
  midias: rows<{ id: string }>(brain.db, "select id from ig_midia where post_id = ? order by ordem", l.id).map((m) => `/api/midia/${m.id}.jpg`),
});

export interface IgPainel { configurado: boolean; tokenEntrega: boolean; auto: boolean; posts: IgPost[] }
export function igPainel(brain: Brain, env: Env): IgPainel {
  const ls = rows<Linha>(brain.db, "select * from ig_posts order by case status when 'pendente' then 0 when 'falhou' then 1 when 'aprovado' then 2 else 3 end, agendado_para desc limit 60");
  return { configurado: !!(env.META_SYSTEM_USER_TOKEN && env.META_IG_ID), tokenEntrega: !!env.IG_INGEST_TOKEN, auto: brain.policy<boolean>("ig_auto_publicar", false) === true, posts: ls.map((l) => ver(brain, l)) };
}

/** Para a sessão que cria o conteúdo não repetir tema: o que já foi feito e o que está na fila. Sem imagens. */
export function igContexto(brain: Brain): { recentes: { tema: string; pilar: string; maturidade: string; status: IgStatus; dia: string; motivoRejeicao?: string }[]; pendentes: number; proximoLivre: number } {
  const ls = rows<Linha>(brain.db, "select * from ig_posts order by criado_em desc limit 60");
  const fila = ls.filter((l) => l.status === "pendente" || l.status === "aprovado");
  return {
    recentes: ls.map((l) => ({ tema: l.tema, pilar: l.pilar, maturidade: l.maturidade, status: l.status, dia: new Date(l.agendado_para).toISOString().slice(0, 10), ...(l.status === "rejeitado" && l.erro ? { motivoRejeicao: l.erro } : {}) })),
    pendentes: fila.length, proximoLivre: Math.max(brain.clock(), ...fila.map((l) => l.agendado_para)),
  };
}

export function decidirPost(brain: Brain, id: string, acao: "aprovar" | "rejeitar", motivo = ""): void {
  const p = row<Linha>(brain.db, "select * from ig_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post não encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Esse post já foi publicado.");
  if (acao === "aprovar" && brain.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado: aprovações bloqueadas.");
  run(brain.db, "update ig_posts set status = ?, erro = ?, decidido_em = ? where id = ?", acao === "aprovar" ? "aprovado" : "rejeitado", acao === "rejeitar" ? motivo.slice(0, 300) || null : null, brain.clock(), id);
  if (acao === "rejeitar") run(brain.db, "delete from ig_midia where post_id = ?", id); // imagem rejeitada sai do ar na hora
  brain.audit("voce", acao === "aprovar" ? "ig_aprovou" : "ig_rejeitou", p.tema);
  brain.emit("change");
}

export function editarLegenda(brain: Brain, id: string, legenda: string): void {
  const p = row<Linha>(brain.db, "select * from ig_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post não encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Esse post já foi publicado.");
  const t = legenda.trim().slice(0, 2200);
  if (!t) throw new BrainError("invalid", "A legenda não pode ficar vazia.");
  const motivo = revisarTexto(t);
  if (motivo) throw new BrainError("invalid", `A conformidade barrou essa legenda: ${motivo}.`);
  run(brain.db, "update ig_posts set legenda = ? where id = ?", t, id);
  brain.emit("change");
}

async function graph(env: Env, f: typeof fetch, metodo: "GET" | "POST", caminho: string, params: Record<string, string>): Promise<Record<string, any>> {
  const v = env.META_GRAPH_VERSION ?? "v23.0";
  const qs = new URLSearchParams(params);
  const res = await f(`https://graph.facebook.com/${v}/${caminho}${metodo === "GET" ? `?${qs}` : ""}`, { method: metodo, headers: { authorization: `Bearer ${env.META_SYSTEM_USER_TOKEN}`, ...(metodo === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}) }, ...(metodo === "POST" ? { body: qs } : {}) });
  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok) throw new BrainError("invalid", `Instagram recusou (${res.status}): ${body.error?.message ?? "erro"}`);
  return body;
}

/** Publica um post aprovado: 1 imagem vira post simples; 2 a 10 viram carrossel. */
export async function publicarPost(brain: Brain, env: Env, id: string, f: typeof fetch = fetch, espera: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms))): Promise<string> {
  if (brain.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado.");
  const p = row<Linha>(brain.db, "select * from ig_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post não encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Já foi publicado.");
  if (p.status !== "aprovado" && p.status !== "falhou") throw new BrainError("invalid", "Só publico o que foi aprovado.");
  const ig = env.META_IG_ID;
  if (!env.META_SYSTEM_USER_TOKEN || !ig) throw new BrainError("invalid", "Falta META_SYSTEM_USER_TOKEN ou META_IG_ID nos secrets do Brain.");
  const origem = env.BRAIN_PUBLIC_URL ?? brain.policy<string>("ig_origem", "");
  if (!/^https:\/\//.test(origem)) throw new BrainError("invalid", "Não sei o endereço público do Brain para o Instagram buscar as imagens.");
  const midias = rows<{ id: string }>(brain.db, "select id from ig_midia where post_id = ? order by ordem", id).map((m) => `${origem}/api/midia/${m.id}.jpg`);
  if (!midias.length) throw new BrainError("invalid", "Esse post não tem imagem.");
  // marca antes de chamar: se a resposta se perder, não publica duas vezes
  run(brain.db, "update ig_posts set status = 'falhou', erro = 'publicação interrompida: confira o perfil antes de tentar de novo' where id = ?", id);
  try {
    const pronto = async (container: string) => {
      for (let i = 0; i < 10; i++) {
        const st = await graph(env, f, "GET", container, { fields: "status_code" });
        if (st.status_code === "FINISHED" || st.status_code === undefined) return;
        if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw new BrainError("invalid", `O Instagram não processou a imagem (${st.status_code}).`);
        await espera(2000);
      }
    };
    let criacao: string;
    if (midias.length === 1) {
      criacao = (await graph(env, f, "POST", `${ig}/media`, { image_url: midias[0]!, caption: p.legenda })).id;
    } else {
      const filhos: string[] = [];
      for (const u of midias) {
        const c = (await graph(env, f, "POST", `${ig}/media`, { image_url: u, is_carousel_item: "true" })).id as string;
        await pronto(c);
        filhos.push(c);
      }
      criacao = (await graph(env, f, "POST", `${ig}/media`, { media_type: "CAROUSEL", children: filhos.join(","), caption: p.legenda })).id;
    }
    await pronto(criacao);
    const mediaId = (await graph(env, f, "POST", `${ig}/media_publish`, { creation_id: criacao })).id as string;
    const link = await graph(env, f, "GET", mediaId, { fields: "permalink" }).then((r) => (r.permalink as string) ?? null).catch(() => null);
    run(brain.db, "update ig_posts set status = 'publicado', publicado_em = ?, media_id = ?, permalink = ?, erro = null where id = ?", brain.clock(), mediaId, link, id);
    brain.audit("sistema", "ig_publicou", p.tema, { mediaId });
    brain.emit("change");
    return "Publicado no Instagram.";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    run(brain.db, "update ig_posts set status = 'falhou', erro = ? where id = ?", msg.slice(0, 300), id);
    brain.emit("change");
    throw e;
  }
}

/** Roda no cron: publica o que está aprovado e com horário vencido (no máximo 1 por rodada). Com o automático ligado, aprova sozinho o que chegou há mais de `ig_auto_espera_h` horas. */
export async function publicarDevidos(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<string | null> {
  if (brain.killed()) return null;
  const agora = brain.clock();
  if (brain.policy<boolean>("ig_auto_publicar", false) === true) {
    const esperaMs = Number(brain.policy("ig_auto_espera_h", 12)) * 3_600_000;
    for (const p of rows<{ id: string; tema: string }>(brain.db, "select id, tema from ig_posts where status = 'pendente' and agendado_para <= ? and criado_em <= ?", agora, agora - esperaMs)) {
      run(brain.db, "update ig_posts set status = 'aprovado', decidido_em = ? where id = ?", agora, p.id);
      brain.audit("sistema", "ig_aprovou_automatico", p.tema);
    }
  }
  const hoje = row<{ n: number }>(brain.db, "select count(*) as n from ig_posts where status = 'publicado' and publicado_em > ?", agora - 20 * 3_600_000)?.n ?? 0;
  if (hoje >= Number(brain.policy("ig_max_por_dia", 1))) return null;
  const prox = row<{ id: string }>(brain.db, "select id from ig_posts where status = 'aprovado' and agendado_para <= ? order by agendado_para asc limit 1", agora);
  if (!prox) return null;
  try { return await publicarPost(brain, env, prox.id, f); } catch (e) { return e instanceof Error ? e.message : String(e); }
}
