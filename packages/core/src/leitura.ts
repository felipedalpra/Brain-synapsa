import { BrainError, brtDay, type Brain } from "./brain";
import { callLlm, llmConfig, textOf } from "./llm";
import { row, rows, run } from "./sql";
import { gscPainel } from "./gsc";
import { gaPainel } from "./ga";
import { painel as instinctPainel } from "./instinct";
import { mercadoPainel } from "./mercado";
import { mrrBySource } from "./mrr";
import type { SubscriptionRow } from "./types";

type Env = Record<string, string | undefined>;

export interface Decisao { titulo: string; porque: string; acao: string; onde: string; impacto: "alto" | "medio" | "baixo" }
export interface Leitura { dia: string; resumo: string; decisoes: Decisao[]; criadoEm: number }

const SISTEMA = `Você é o analista de crescimento da Synapsa, plataforma para psicólogos e clínicas no Brasil. Fala com o Felipe, fundador. Escreva em português, direto, sem enrolação, sem corporativês.
Posicionamento: ecossistema de desenvolvimento profissional do psicólogo, e para clínicas centralizar a operação e tirar processo manual. Nunca sugira o ângulo de abandono de paciente, adesão ou acompanhamento entre sessões.
Meta atual: MRR de R$1.200 até o fim de dezembro de 2026. Todo conselho precisa ajudar a chegar nisso: receita, aquisição ou retenção.
Regras: use SÓ os números do bloco FATOS, sem citar nomes de campos nem caminhos do JSON (escreva em linguagem de gente); não repita nada de ja_resolvido; nunca invente número, nome ou fonte. Cada decisão cita a evidência com o número. Se o dado for pouco (amostra pequena), diga isso em vez de concluir. Ordene por impacto. No máximo 5 decisões.
Responda APENAS com JSON válido neste formato, sem markdown:
{"resumo":"2 frases sobre o momento do negócio","decisoes":[{"titulo":"curto, no imperativo","porque":"evidência com número","acao":"o que fazer hoje ou nesta semana, concreto","onde":"seo|analytics|prospeccao|instinct|financeiro|mercado","impacto":"alto|medio|baixo"}]}`;

/** Junta o que o Brain já sabe em um bloco pequeno, sem dado pessoal de lead nem de paciente. */
export function fatos(brain: Brain, env: Env): Record<string, unknown> {
  const f: Record<string, unknown> = {
    hoje: brtDay(brain.clock()),
    // Contexto que o Felipe já tratou: o modelo não deve pedir de novo.
    ja_resolvido: ["O evento-chave do GA4 é 'purchase'; ele só registra quando há compra, então fica vazio sem venda recente. Não sugira criar outro evento-chave.", "Links de e-mail, WhatsApp e resposta do Brain já saem com UTM; falta só UTM nos links manuais (bio, DM, Instinct)."],
  };
  try {
    f.search_console = gscPainel(brain, env).sites.map((s) => ({
      site: s.rotulo, atual: s.atual, anterior: s.anterior, marca: s.marca.clicks, semMarca: s.naoMarca.clicks,
      topBuscas: s.queries.slice(0, 8).map((q) => ({ busca: q.chave, cliques: q.clicks, impressoes: q.impressions, posicao: Math.round(q.position * 10) / 10 })),
      oportunidades: s.oportunidades.slice(0, 5).map((o) => ({ busca: o.chave, impressoes: o.impressions, posicao: Math.round(o.position * 10) / 10, acao: o.acao })),
      recados: s.recados.slice(0, 4),
    }));
  } catch { /* sem Search Console */ }
  try {
    f.analytics = gaPainel(brain, env).sites.map((s) => ({ site: s.rotulo, atual: s.atual, anterior: s.anterior, canais: s.canais.slice(0, 4).map((c) => ({ canal: c.chave, sessoes: c.sessoes })), recados: s.recados.slice(0, 4) }));
  } catch { /* sem GA4 */ }
  try {
    const i = instinctPainel(brain, env as never);
    f.instinct_whatsapp = { ultimos30: i.ultimos30.total, anteriores30: i.anteriores30, clinicas: i.ultimos30.clinicas, influenciadoras: i.ultimos30.influenciadoras, funil: i.funil };
  } catch { /* sem Instinct */ }
  const st: Record<string, number> = {};
  for (const r of rows<{ status: string; n: number }>(brain.db, "select status, count(*) as n from prospects group by status")) st[r.status] = r.n;
  f.prospeccao_clinicas = { porStatus: st, respostas: row<{ n: number }>(brain.db, "select count(*) as n from prospect_contato where coalesce(respondeu,0) = 1")?.n ?? 0 };
  try {
    const subs = rows<SubscriptionRow>(brain.db, "select * from subscriptions");
    const m = mrrBySource(subs);
    f.mrr = { total: Math.round(m.total * 100) / 100, clientesAtivos: Object.values(m.bySource).reduce((a, x) => a + x.count, 0), meta: 1200 };
  } catch { /* sem assinaturas */ }
  try {
    const m = mercadoPainel(brain, env);
    f.mercado = { novasBuscasNoGoogle: m.novas.slice(0, 12).map((n) => n.texto), buscasSubindoNoSeuSite: m.subindo.slice(0, 6) };
  } catch { /* sem radar */ }
  return f;
}

const IMPACTOS = new Set(["alto", "medio", "baixo"]);
export function lerResposta(txt: string): { resumo: string; decisoes: Decisao[] } {
  const bruto = txt.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const j = JSON.parse(bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1)) as { resumo?: unknown; decisoes?: unknown };
  const decisoes = (Array.isArray(j.decisoes) ? j.decisoes : []).slice(0, 5).map((d: any): Decisao => ({
    titulo: String(d?.titulo ?? "").slice(0, 120), porque: String(d?.porque ?? "").slice(0, 400), acao: String(d?.acao ?? "").slice(0, 400),
    onde: String(d?.onde ?? "").slice(0, 20), impacto: IMPACTOS.has(d?.impacto) ? d.impacto : "medio",
  })).filter((d: Decisao) => d.titulo && d.acao);
  if (!decisoes.length) throw new Error("sem decisões");
  return { resumo: String(j.resumo ?? "").slice(0, 400), decisoes };
}

/** Uma leitura por dia. Fica salva: o painel só mostra, não gasta de novo. */
export async function gerarLeitura(brain: Brain, env: Env, f: typeof fetch = fetch, opt: { forcar?: boolean } = {}): Promise<Leitura | null> {
  if (brain.killed()) return null;
  const dia = brtDay(brain.clock());
  if (!opt.forcar && row(brain.db, "select 1 as x from leituras where dia = ?", dia)) return null;
  const cfg = llmConfig(env, "agent");
  if (!cfg) throw new BrainError("invalid", "Falta a chave do modelo (OPENAI_API_KEY ou ANTHROPIC_API_KEY) nos secrets do Brain.");
  const base = fatos(brain, env);
  let saida: { resumo: string; decisoes: Decisao[] } | null = null;
  for (let t = 0; t < 2 && !saida; t++) {
    const r = await callLlm(cfg, { system: SISTEMA, messages: [{ role: "user", content: `FATOS:\n${JSON.stringify(base)}` }], maxTokens: 1200 }, f);
    try { saida = lerResposta(textOf(r.content)); } catch { /* tenta de novo uma vez */ }
  }
  if (!saida) throw new BrainError("invalid", "O modelo não devolveu uma leitura válida. Tente de novo.");
  const agora = brain.clock();
  run(brain.db, "insert or replace into leituras (dia, resumo, decisoes, fatos, criado_em) values (?, ?, ?, ?, ?)", dia, saida.resumo, JSON.stringify(saida.decisoes), JSON.stringify(base), agora);
  brain.audit("sistema", "leitura_gerou", dia);
  brain.emit("change");
  return { dia, ...saida, criadoEm: agora };
}

export function leituraPainel(brain: Brain): { atual: Leitura | null; anteriores: { dia: string; resumo: string }[]; temChave: boolean } {
  const l = row<{ dia: string; resumo: string; decisoes: string; criado_em: number }>(brain.db, "select * from leituras order by dia desc limit 1");
  const anteriores = rows<{ dia: string; resumo: string }>(brain.db, "select dia, resumo from leituras order by dia desc limit 8 offset 1");
  return { atual: l ? { dia: l.dia, resumo: l.resumo, decisoes: JSON.parse(l.decisoes) as Decisao[], criadoEm: l.criado_em } : null, anteriores, temChave: true };
}
