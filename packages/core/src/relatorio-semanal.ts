import { BrainError, brtDay, type Brain } from "./brain";
import { callLlm, llmConfig, textOf } from "./llm";
import { row, rows } from "./sql";
import { gscPainel } from "./gsc";
import { gaPainel } from "./ga";
import { tendenciasPacientes, semanaDe } from "./mercado";
import { lerResposta, type Decisao } from "./leitura";
import { sendEmail } from "./dispatch";

type Env = Record<string, string | undefined>;
const DAY = 86_400_000;

/** Quem recebe o relatório. Pode ser trocado pela política `relatorio_email`. */
export const DESTINO_PADRAO = "felipeodriosolladalpra@gmail.com";

const SISTEMA = `Você é o analista de tráfego e aquisição da Synapsa, plataforma para psicólogos e clínicas no Brasil, e do diretório de psicólogos (synapsa.chat). Fala com o Felipe, fundador. Português, direto, sem corporativês.
Receba o bloco FATOS (semana atual contra a anterior) e devolva até 3 decisões sobre tráfego e aquisição: de onde vem gente, o que cresceu ou caiu, onde investir tempo ou dinheiro.
Regras: use SÓ os números de FATOS e não invente nenhum; escreva em linguagem de gente, sem nomes de campos nem caminhos; se a amostra for pequena, diga que é pouco dado em vez de concluir; lembre que o GA4 do diretório só conta quem aceita cookies (é um piso); o GA4 atrasa 24 a 48 horas; não sugira ângulo de abandono de paciente.
Responda APENAS com JSON válido, sem markdown:
{"resumo":"2 frases sobre o que mudou no tráfego esta semana","decisoes":[{"titulo":"curto, no imperativo","porque":"evidência com número","acao":"o que fazer, concreto","onde":"seo|analytics|meta|diretorio|mercado","impacto":"alto|medio|baixo"}]}`;

const n = (x: number) => Math.round(x).toLocaleString("pt-BR");
const r1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString("pt-BR");
const brl = (x: number) => `R$ ${x.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
/** Variação em texto: "+12%", "-8%", "novo" ou "sem base". */
export function variacao(atual: number, anterior: number): string {
  if (!anterior) return atual ? "novo" : "sem dados";
  const v = Math.round(((atual - anterior) / anterior) * 100);
  return `${v > 0 ? "+" : ""}${v}%`;
}
const dd = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

interface Par { atual: number; anterior: number }
const par = (a: number, b: number): Par => ({ atual: a, anterior: b });

export interface DadosSemana {
  periodo: { de: string; ate: string };
  google: { site: string; cliques: Par; impressoes: Par; topBuscas: { busca: string; cliques: number; impressoes: number; posicao: number }[] }[];
  visitas: { site: string; sessoes: Par; ultimoDia: string | null; canais: { canal: string; sessoes: number; antes: number }[]; campanhas: { campanha: string; sessoes: number; antes: number }[] }[];
  meta: { anuncios: { gasto: Par; impressoes: Par; alcance: Par; cliquesNoLink: Par; leads: Par; campanhas: { nome: string; gasto: number; cliquesNoLink: number; leads: number }[] } | null; instagram: { alcance: Par; visitasAoPerfil: Par; cliquesNoLink: Par } | null };
  diretorio: { sessoes: Par; perfisMaisVistos: { perfil: string; sessoes: number; antes: number }[]; perfisComVisita: number; perfisNoGoogle: { total: number; comImpressao: number; comClique: number } | null } | null;
  tendencias: { primeiraLeitura: boolean; novas: string[]; destaques: { tema: string; buscas: string[] }[] };
}

function somaDias<T extends Record<string, number>>(serie: ({ dia: string } & T)[], campo: keyof T): Par {
  const l = serie.slice(-14);
  const a = l.slice(-7).reduce((t, x) => t + Number(x[campo] ?? 0), 0);
  const b = l.slice(0, Math.max(0, l.length - 7)).reduce((t, x) => t + Number(x[campo] ?? 0), 0);
  return par(a, b);
}

export function dadosDaSemana(brain: Brain, env: Env): DadosSemana {
  const hoje = brain.clock();
  const ate = brtDay(hoje - DAY);
  const de = brtDay(hoje - 7 * DAY);
  const d: DadosSemana = { periodo: { de, ate }, google: [], visitas: [], meta: { anuncios: null, instagram: null }, diretorio: null, tendencias: { primeiraLeitura: true, novas: [], destaques: [] } };

  let gsc: ReturnType<typeof gscPainel> | null = null;
  try { gsc = gscPainel(brain, env); } catch { /* sem Search Console */ }
  for (const s of gsc?.sites ?? []) {
    d.google.push({
      site: s.rotulo,
      cliques: somaDias(s.serie as never, "clicks"), impressoes: somaDias(s.serie as never, "impressions"),
      topBuscas: s.queries.slice(0, 5).map((q) => ({ busca: q.chave, cliques: q.clicks, impressoes: q.impressions, posicao: Math.round(q.position * 10) / 10 })),
    });
  }

  let ga: ReturnType<typeof gaPainel> | null = null;
  try { ga = gaPainel(brain, env); } catch { /* sem GA4 */ }
  for (const s of ga?.sites ?? []) {
    d.visitas.push({
      site: s.rotulo, sessoes: somaDias(s.serie as never, "sessoes"), ultimoDia: s.ultimoDia,
      canais: s.canais.slice(0, 6).map((c) => ({ canal: c.chave, sessoes: c.sessoes, antes: c.anterior.sessoes })),
      campanhas: s.campanhas.slice(0, 8).map((c) => ({ campanha: c.chave, sessoes: c.sessoes, antes: c.anterior.sessoes })),
    });
    if (s.id === "diretorio") {
      const perfis = s.paginas.filter((p) => p.chave.startsWith("/psicologo/"));
      const perfisGoogle = gsc?.sites.find((x) => x.id === "diretorio")?.perfis ?? null;
      d.diretorio = {
        sessoes: somaDias(s.serie as never, "sessoes"),
        perfisMaisVistos: perfis.slice(0, 6).map((p) => ({ perfil: p.chave.replace("/psicologo/", ""), sessoes: p.sessoes, antes: p.anterior.sessoes })),
        perfisComVisita: perfis.filter((p) => p.sessoes > 0).length,
        perfisNoGoogle: perfisGoogle ? { total: perfisGoogle.total, comImpressao: perfisGoogle.comImpressao, comClique: perfisGoogle.comClique } : null,
      };
    }
  }

  try {
    const ini1 = brtDay(hoje - 7 * DAY), ini0 = brtDay(hoje - 14 * DAY), fim0 = brtDay(hoje - 8 * DAY);
    const soma = (a: string, b: string) => row<{ g: number; i: number; r: number; l: number; ld: number }>(brain.db, "select coalesce(sum(spend),0) as g, coalesce(sum(impressions),0) as i, coalesce(sum(reach),0) as r, coalesce(sum(link_clicks),0) as l, coalesce(sum(leads),0) as ld from meta_ad_dia where day >= ? and day <= ?", a, b)!;
    const a = soma(ini1, ate), b = soma(ini0, fim0);
    if (a.g || b.g || a.i || b.i) {
      d.meta!.anuncios = {
        gasto: par(a.g, b.g), impressoes: par(a.i, b.i), alcance: par(a.r, b.r), cliquesNoLink: par(a.l, b.l), leads: par(a.ld, b.ld),
        campanhas: rows<{ nome: string; g: number; l: number; ld: number }>(brain.db, "select campaign_name as nome, sum(spend) as g, sum(link_clicks) as l, sum(leads) as ld from meta_ad_dia where day >= ? and day <= ? group by campaign_id order by g desc limit 4", ini1, ate).map((c) => ({ nome: c.nome, gasto: c.g, cliquesNoLink: c.l, leads: c.ld })),
      };
    }
    const ig = (x: string, y: string) => row<{ r: number; p: number; l: number; c: number }>(brain.db, "select coalesce(sum(reach),0) as r, coalesce(sum(profile_views),0) as p, coalesce(sum(link_taps),0) as l, count(*) as c from ig_dia where day >= ? and day <= ?", x, y)!;
    const i1 = ig(ini1, ate), i0 = ig(ini0, fim0);
    if (i1.c || i0.c) d.meta!.instagram = { alcance: par(i1.r, i0.r), visitasAoPerfil: par(i1.p, i0.p), cliquesNoLink: par(i1.l, i0.l) };
  } catch { /* sem Meta */ }

  try {
    const t = tendenciasPacientes(brain);
    d.tendencias = {
      primeiraLeitura: !t.novas.length && !!t.semana && !row(brain.db, "select 1 as x from mercado_sugestoes where semana < ? limit 1", t.semana),
      novas: t.novas.slice(0, 12).map((x) => x.texto),
      destaques: t.porTema.filter((g) => ["terapia online", "quanto custa terapia", "como escolher um psicólogo", "psicólogo perto de mim"].includes(g.semente)).map((g) => ({ tema: g.semente, buscas: g.itens.slice(0, 4).map((x) => x.texto) })),
    };
  } catch { /* sem radar de pacientes */ }
  return d;
}

const linhaPar = (rot: string, p: Par, fmt: (x: number) => string = n) => `- ${rot}: ${fmt(p.atual)} (${variacao(p.atual, p.anterior)} contra ${fmt(p.anterior)})`;

/** Texto do e-mail: os números vêm direto do banco; só o resumo e as decisões vêm do modelo. */
export function montarTexto(d: DadosSemana, leitura: { resumo: string; decisoes: Decisao[] } | null): { assunto: string; corpo: string } {
  const secs: string[] = [];
  if (leitura) {
    secs.push(`Resumo\n${leitura.resumo}`);
    secs.push(`3 decisões para esta semana\n${leitura.decisoes.slice(0, 3).map((x, i) => `${i + 1}. ${x.titulo}\nPor quê: ${x.porque}\nO que fazer: ${x.acao}`).join("\n\n")}`);
  }
  if (d.google.length) {
    secs.push(`Google (busca orgânica)\n${d.google.map((g) => `${g.site}\n${linhaPar("Cliques", g.cliques)}\n${linhaPar("Impressões", g.impressoes)}${g.topBuscas.length ? `\nBuscas que mais trazem gente: ${g.topBuscas.slice(0, 3).map((q) => `${q.busca} (${q.cliques} cliques, posição ${r1(q.posicao)})`).join("; ")}` : ""}`).join("\n\n")}`);
  }
  if (d.visitas.length) {
    secs.push(`De onde vêm as visitas (GA4)\n${d.visitas.map((v) => `${v.site}\n${linhaPar("Visitas na semana", v.sessoes)}${v.ultimoDia ? `\nDado até ${dd(v.ultimoDia)} (o GA4 atrasa 24 a 48 horas)` : ""}${v.canais.length ? `\nCanais (28 dias): ${v.canais.slice(0, 4).map((c) => `${c.canal} ${n(c.sessoes)} (${variacao(c.sessoes, c.antes)})`).join("; ")}` : ""}${v.campanhas.length ? `\nCampanhas com UTM (28 dias): ${v.campanhas.slice(0, 5).map((c) => `${c.campanha} ${n(c.sessoes)}`).join("; ")}` : "\nAinda sem visitas com campanha marcada."}`).join("\n\n")}\n\nO diretório só conta quem aceita cookies: o número é um piso, não o total.`);
  }
  if (d.meta?.anuncios || d.meta?.instagram) {
    const m = d.meta!;
    const partes: string[] = [];
    if (m.anuncios) {
      const a = m.anuncios;
      partes.push(`Anúncios\n${linhaPar("Gasto", a.gasto, brl)}\n${linhaPar("Alcance (soma dos dias)", a.alcance)}\n${linhaPar("Cliques no link", a.cliquesNoLink)}\n${linhaPar("Leads", a.leads)}${a.campanhas.length ? `\nCampanhas: ${a.campanhas.map((c) => `${c.nome} (${brl(c.gasto)}, ${c.cliquesNoLink} cliques, ${c.leads} leads)`).join("; ")}` : ""}`);
    }
    if (m.instagram) partes.push(`Instagram\n${linhaPar("Alcance", m.instagram.alcance)}\n${linhaPar("Visitas ao perfil", m.instagram.visitasAoPerfil)}\n${linhaPar("Cliques no link da bio", m.instagram.cliquesNoLink)}`);
    secs.push(`Meta\n${partes.join("\n\n")}`);
  }
  if (d.diretorio) {
    const x = d.diretorio;
    secs.push(`Diretório de psicólogos\n${linhaPar("Visitas na semana", x.sessoes)}\nPerfis com visita (28 dias): ${x.perfisComVisita}${x.perfisNoGoogle ? `\nNo Google: ${x.perfisNoGoogle.comImpressao} de ${x.perfisNoGoogle.total} perfis aparecem em buscas, ${x.perfisNoGoogle.comClique} já recebem clique` : ""}${x.perfisMaisVistos.length ? `\nPerfis mais vistos (28 dias): ${x.perfisMaisVistos.slice(0, 5).map((p) => `${p.perfil} ${p.sessoes} (${variacao(p.sessoes, p.antes)})`).join("; ")}` : ""}`);
  }
  const t = d.tendencias;
  if (t.novas.length || t.destaques.length) {
    secs.push(`O que as pessoas buscam sobre terapia\n${t.novas.length ? `Buscas novas esta semana: ${t.novas.slice(0, 10).join("; ")}` : t.primeiraLeitura ? "Primeira leitura: na próxima semana eu mostro o que é novo e o que subiu." : "Nenhuma busca nova nos termos monitorados."}${t.destaques.length ? `\n\n${t.destaques.map((g) => `Quem digita "${g.tema}" vê: ${g.buscas.join("; ")}`).join("\n")}` : ""}`);
  }
  return { assunto: `Synapsa · tráfego da semana (${dd(d.periodo.de)} a ${dd(d.periodo.ate)})`, corpo: secs.join("\n\n") };
}

export async function interpretar(brain: Brain, env: Env, d: DadosSemana, f: typeof fetch): Promise<{ resumo: string; decisoes: Decisao[] } | null> {
  const cfg = llmConfig(env, "agent");
  if (!cfg) return null;
  for (let t = 0; t < 2; t++) {
    try {
      const r = await callLlm(cfg, { system: SISTEMA, messages: [{ role: "user", content: `FATOS:\n${JSON.stringify(d)}` }], maxTokens: 1000 }, f);
      return lerResposta(textOf(r.content));
    } catch { /* tenta de novo uma vez */ }
  }
  return null;
}

/** Envia o relatório da semana. Uma vez por semana, a menos que `forcar`. Vai só para o endereço do Felipe. */
export async function enviarRelatorioSemanal(brain: Brain, env: Env, f: typeof fetch = fetch, opt: { forcar?: boolean } = {}): Promise<string> {
  if (brain.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado.");
  const semana = semanaDe(brain.clock());
  if (!opt.forcar && brain.policy<string>("relatorio_semanal_ultimo", "") === semana) return "O relatório desta semana já foi enviado.";
  const para = brain.policy<string>("relatorio_email", DESTINO_PADRAO);
  const dados = dadosDaSemana(brain, env);
  const leitura = await interpretar(brain, env, dados, f);
  const { assunto, corpo } = montarTexto(dados, leitura);
  const id = opt.forcar ? `relatorio-${semana}-${brain.clock()}` : `relatorio-${semana}`;
  await sendEmail(brain, env, { id, to: para, subject: assunto, body: corpo, html: true, interno: true }, f);
  brain.setPolicy("relatorio_semanal_ultimo", semana);
  brain.audit("sistema", "relatorio_semanal_enviou", semana);
  return `Relatório enviado para ${para}${leitura ? "" : " (sem a interpretação: falta a chave do modelo ou ele não respondeu)"}.`;
}
