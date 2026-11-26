import { BrainError, brtDay, type Brain } from "./brain";
import { callLlm, llmConfig, textOf } from "./llm";
import { row, rows } from "./sql";
import { gscPainel } from "./gsc";
import { gaPainel } from "./ga";
import { tendenciasPacientes, semanaDe } from "./mercado";
import { type Decisao } from "./leitura";
import { sendEmail } from "./dispatch";
import { relatorioHtml } from "./relatorio-html";

type Env = Record<string, string | undefined>;
const DAY = 86_400_000;

/** Quem recebe o relatório. Pode ser trocado pela política `relatorio_email`. */
export const DESTINO_PADRAO = "felipeodriosolladalpra@gmail.com";

const SISTEMA = `Você é o analista de tráfego e aquisição da Synapsa, plataforma para psicólogos e clínicas no Brasil, e do diretório de psicólogos (synapsa.chat). Fala com o Felipe, fundador. Português, direto, sem corporativês.
Receba o bloco FATOS (semana atual contra a anterior) e a lista acoesJaIdentificadas (o que o sistema já mandou o Felipe fazer). Devolva o resumo e, só se houver algo que essa lista NÃO cobre, até 2 ações extras. Se a lista já cobre tudo, devolva "decisoes": [].
Cada ação é uma tarefa que o Felipe consegue executar sozinho esta semana: "passos" com 2 a 4 frases curtas, cada uma começando por verbo e dizendo a tela ou ferramenta exata (Search Console, Gerenciador de Anúncios, Central, Instagram, GA4); "sucesso" diz o número que mostra que deu certo e em quanto tempo.
Regras: use SÓ os números de FATOS e não invente nenhum; linguagem de gente, sem nomes de campos nem caminhos; se a amostra for pequena, diga que é pouco dado em vez de concluir; o GA4 do diretório só conta quem aceita cookies (é um piso) e atrasa 24 a 48 horas; não sugira ângulo de abandono de paciente.
Responda APENAS com JSON válido, sem markdown:
{"resumo":"2 frases sobre o que mudou no tráfego esta semana","decisoes":[{"titulo":"curto, no imperativo","porque":"evidência com número","passos":["1º passo","2º passo"],"sucesso":"número e prazo","onde":"seo|analytics|meta|diretorio|mercado","impacto":"alto|medio|baixo"}]}`;

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

/** Uma tarefa para o Felipe: o problema com número, os passos em ordem e o sinal de que deu certo. */
export interface AcaoRel extends Omit<Decisao, "acao"> { acao?: string; passos?: string[]; sucesso?: string }
const PESO: Record<string, number> = { alto: 0, medio: 1, baixo: 2 };
const dias = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / DAY);

/** Regras fixas sobre os números da semana: o que está errado e exatamente o que fazer. Sem modelo, então sempre sai. */
export function acoesDaSemana(d: DadosSemana): AcaoRel[] {
  const a: AcaoRel[] = [];
  const m = d.meta?.anuncios;
  if (m && m.gasto.atual > 0 && m.cliquesNoLink.atual >= 15 && m.leads.atual === 0) a.push({
    titulo: "Descubra por que os anúncios não geram lead",
    porque: `Foram ${brl(m.gasto.atual)} e ${n(m.cliquesNoLink.atual)} cliques no link na semana, e nenhum lead.`,
    passos: [
      "Abra o Gerenciador de Eventos da Meta, escolha o pixel e veja se o evento Lead disparou nos últimos 7 dias. Se não disparou, o pixel ou o formulário quebrou.",
      "Entre no site pelo link de um anúncio, faça um cadastro de teste e confirme que o Lead aparece em tempo real no Gerenciador de Eventos.",
      "Enquanto não corrigir, pause a campanha de maior gasto e deixe rodando só a de menor custo por clique.",
    ],
    sucesso: "O evento Lead volta a aparecer no Gerenciador de Eventos e a próxima semana registra pelo menos 1 lead.",
    onde: "meta", impacto: "alto",
  });
  else if (m && m.cliquesNoLink.atual >= 15 && m.cliquesNoLink.anterior >= 15 && m.gasto.atual > 0 && m.gasto.anterior > 0) {
    const cpc1 = m.gasto.atual / m.cliquesNoLink.atual, cpc0 = m.gasto.anterior / m.cliquesNoLink.anterior;
    if (cpc1 > cpc0 * 1.3) a.push({
      titulo: "O clique no anúncio ficou mais caro",
      porque: `O custo por clique no link foi de ${brl(cpc0)} para ${brl(cpc1)} (${variacao(cpc1, cpc0)}).`,
      passos: [
        "Abra o Gerenciador de Anúncios, ordene os anúncios por gasto e pause os que têm custo por clique acima da média.",
        "Duplique o anúncio de menor custo por clique e troque só a imagem ou a primeira frase, para testar um criativo novo.",
        "Não mexa no público nos mesmos dias: mude uma coisa por vez para saber o que funcionou.",
      ],
      sucesso: `Custo por clique de volta a ${brl(cpc0)} ou menos na próxima semana.`,
      onde: "meta", impacto: "medio",
    });
  }

  for (const v of d.visitas) {
    if (v.sessoes.atual >= 20 && !v.campanhas.length) a.push({
      titulo: `Marque os links com UTM (${v.site})`,
      porque: `${n(v.sessoes.atual)} visitas na semana em ${v.site} e nenhuma veio de campanha marcada. Sem isso você não sabe qual e-mail, post ou anúncio trouxe gente.`,
      passos: [
        'Abra o Doc "Links com UTM da Synapsa" e copie o link certo para cada lugar.',
        "Troque o link da bio do Instagram e os links dos e-mails, do WhatsApp e do Instinct pelos links com UTM.",
        "No Gerenciador de Anúncios, preencha os parâmetros de URL de cada anúncio com o utm_source=meta.",
      ],
      sucesso: 'Na próxima segunda, "Campanhas com UTM" lista pelo menos instagram, email e meta.',
      onde: "analytics", impacto: "alto",
    });
    if (v.ultimoDia && dias(d.periodo.ate, v.ultimoDia) >= 3) a.push({
      titulo: `O GA4 está sem dado novo (${v.site})`,
      porque: `O último dia com dado é ${dd(v.ultimoDia)}, ${dias(d.periodo.ate, v.ultimoDia)} dias antes do fim da semana. Os números de visita podem estar defasados.`,
      passos: [
        'No Central, abra Analytics e clique em "Sincronizar agora".',
        "Se aparecer erro, reconecte a conta do Google do GA4 e sincronize de novo.",
      ],
      sucesso: "O último dia com dado volta a ser ontem.",
      onde: "analytics", impacto: "medio",
    });
  }

  for (const g of d.google) {
    if (g.cliques.anterior >= 10 && g.cliques.atual <= g.cliques.anterior * 0.8) a.push({
      titulo: `Descubra por que o Google trouxe menos gente (${g.site})`,
      porque: `Cliques vindos do Google: ${n(g.cliques.atual)} contra ${n(g.cliques.anterior)} (${variacao(g.cliques.atual, g.cliques.anterior)}).`,
      passos: [
        "Abra o Search Console, entre em Desempenho e compare os últimos 7 dias com os 7 anteriores.",
        "Na aba Páginas, veja qual página mais perdeu clique e abra essa página no navegador para ver se mudou ou saiu do ar.",
        "Na aba Consultas, veja se a perda foi numa busca só. Se foi, refaça o título e o primeiro parágrafo da página dessa busca.",
      ],
      sucesso: `Cliques de volta a ${n(g.cliques.anterior)} ou mais em duas semanas.`,
      onde: "seo", impacto: "alto",
    });
    const oportunidade = g.topBuscas.filter((q) => q.posicao >= 5 && q.posicao <= 15 && q.impressoes >= 20).sort((x, y) => y.impressoes - x.impressoes)[0];
    if (oportunidade) a.push({
      titulo: `Suba a busca "${oportunidade.busca}" para o top 5 (${g.site})`,
      porque: `Ela aparece ${n(oportunidade.impressoes)} vezes na semana e está na posição ${r1(oportunidade.posicao)}: perto o bastante para render clique com um ajuste.`,
      passos: [
        "No Search Console, abra Desempenho, clique nessa busca e veja na aba Páginas qual página aparece para ela.",
        "Nessa página, ponha a busca exata no título e na primeira linha (H1).",
        "Acrescente 3 perguntas e respostas curtas sobre o tema no fim da página.",
        "Coloque link para essa página em 3 outras páginas ou posts do site.",
      ],
      sucesso: "A posição média da busca abaixo de 5 em 4 semanas.",
      onde: "seo", impacto: "medio",
    });
    const semClique = g.topBuscas.filter((q) => q.impressoes >= 50 && q.cliques === 0).sort((x, y) => y.impressoes - x.impressoes)[0];
    if (semClique) a.push({
      titulo: `Reescreva o título da busca "${semClique.busca}" (${g.site})`,
      porque: `Ela apareceu ${n(semClique.impressoes)} vezes e ninguém clicou. As pessoas veem o resultado e passam direto.`,
      passos: [
        "No Search Console, ache a página que aparece para essa busca (Desempenho, clique na busca, aba Páginas).",
        "Reescreva o título e a descrição da página com a promessa direta que a pessoa procurou, usando a busca nas primeiras palavras.",
        "Peça a reindexação dessa página em Inspeção de URL, Solicitar indexação.",
      ],
      sucesso: "Pelo menos 1 clique a cada 50 aparições dessa busca em 2 semanas.",
      onde: "seo", impacto: "medio",
    });
  }

  const x = d.diretorio;
  if (x?.perfisNoGoogle && x.perfisNoGoogle.total >= 5 && x.perfisNoGoogle.comImpressao < x.perfisNoGoogle.total * 0.6) a.push({
    titulo: "Faça os perfis do diretório aparecerem no Google",
    porque: `Só ${x.perfisNoGoogle.comImpressao} de ${x.perfisNoGoogle.total} perfis apareceram em buscas e ${x.perfisNoGoogle.comClique} receberam clique. Perfil que o Google não mostra não gera visita para o psicólogo.`,
    passos: [
      'No Central, abra SEO, no bloco do diretório, e filtre "Ainda não apareceram".',
      "No Search Console, use Inspeção de URL, cole o endereço de cada perfil dessa lista e clique em Solicitar indexação. Comece pelos 10 primeiros.",
      "Confira em Search Console, Sitemaps, se o mapa do diretório está enviado e sem erro.",
    ],
    sucesso: `Perfis com aparição subindo de ${x.perfisNoGoogle.comImpressao} para ${Math.ceil(x.perfisNoGoogle.total * 0.8)} em 3 semanas.`,
    onde: "diretorio", impacto: "alto",
  });
  if (x && x.sessoes.atual < 30) a.push({
    titulo: "Leve mais gente ao diretório",
    porque: `O diretório teve ${n(x.sessoes.atual)} visitas na semana (${variacao(x.sessoes.atual, x.sessoes.anterior)}). É um piso, mas é pouco para mostrar resultado aos psicólogos.`,
    passos: [
      "Mande a cada psicólogo do diretório o link do próprio perfil e peça para ele pôr na bio do Instagram e na assinatura de e-mail.",
      "Acrescente ao link do perfil ?utm_source=psicologo&utm_medium=perfil para você enxergar quanto veio dessa divulgação.",
      "Publique 1 post por semana no Instagram que aponte para o diretório, com o link e UTM.",
    ],
    sucesso: `Visitas do diretório acima de ${n(Math.max(x.sessoes.atual * 2, 20))} na semana.`,
    onde: "diretorio", impacto: "alto",
  });

  const ig = d.meta?.instagram;
  if (ig && ig.visitasAoPerfil.atual >= 30 && ig.cliquesNoLink.atual / ig.visitasAoPerfil.atual < 0.08) a.push({
    titulo: "Pouca gente que visita o perfil clica no link",
    porque: `${n(ig.visitasAoPerfil.atual)} visitas ao perfil e só ${n(ig.cliquesNoLink.atual)} cliques no link da bio.`,
    passos: [
      "Reescreva a primeira linha da bio dizendo o que a pessoa ganha ao clicar e para onde o link leva.",
      "Confirme que o link da bio tem UTM (utm_source=instagram&utm_medium=bio).",
      "Fixe no topo o post que mais trouxe visita ao perfil e termine a legenda dele mandando clicar no link da bio.",
    ],
    sucesso: "Cliques no link de pelo menos 10% das visitas ao perfil na próxima semana.",
    onde: "meta", impacto: "medio",
  });
  else if (ig && ig.alcance.anterior >= 100 && ig.alcance.atual <= ig.alcance.anterior * 0.7) a.push({
    titulo: "O alcance do Instagram caiu",
    porque: `Alcance de ${n(ig.alcance.atual)} contra ${n(ig.alcance.anterior)} (${variacao(ig.alcance.atual, ig.alcance.anterior)}).`,
    passos: [
      "No Central, abra Instagram e compare os posts das duas semanas.",
      "Repita o formato e o tema do post que mais alcançou, trocando só o gancho da capa.",
      "Responda os comentários na primeira hora depois de postar.",
    ],
    sucesso: `Alcance de volta a ${n(ig.alcance.anterior)} ou mais na próxima semana.`,
    onde: "meta", impacto: "medio",
  });

  if (d.tendencias.novas.length) a.push({
    titulo: "Veja se as buscas novas viram página no diretório",
    porque: `Buscas novas sobre terapia esta semana: ${d.tendencias.novas.slice(0, 4).join("; ")}.`,
    passos: [
      "Escolha 1 busca que seja um tema de atendimento (por exemplo ansiedade, casal ou adolescente).",
      "Confira se o diretório tem a página desse tema em synapsa.chat/psicologos. Se não tiver, anote para criar.",
      "Avise os psicólogos do diretório que atendem esse tema de que há procura nova por ele.",
    ],
    sucesso: "A página do tema existe e passa a aparecer no Google em 4 semanas.",
    onde: "mercado", impacto: "baixo",
  });
  return a;
}

function lerAcoes(txt: string): { resumo: string; decisoes: AcaoRel[] } {
  const bruto = txt.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const j = JSON.parse(bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1)) as { resumo?: unknown; decisoes?: unknown };
  const decisoes = (Array.isArray(j.decisoes) ? j.decisoes : []).slice(0, 2).map((x: any): AcaoRel => ({
    titulo: String(x?.titulo ?? "").slice(0, 120), porque: String(x?.porque ?? "").slice(0, 400),
    passos: (Array.isArray(x?.passos) ? x.passos : []).map((p: unknown) => String(p).slice(0, 300)).filter(Boolean).slice(0, 4),
    sucesso: String(x?.sucesso ?? "").slice(0, 300), acao: "", onde: String(x?.onde ?? "").slice(0, 20),
    impacto: x?.impacto === "alto" || x?.impacto === "baixo" ? x.impacto : "medio",
  })).filter((x: AcaoRel) => x.titulo && x.passos?.length);
  const resumo = String(j.resumo ?? "").slice(0, 400);
  if (!resumo) throw new Error("sem resumo");
  return { resumo, decisoes };
}

/** Junta as regras fixas com as extras do modelo: no máximo 5, as de maior impacto primeiro. */
export function ordenarAcoes(a: AcaoRel[]): AcaoRel[] {
  return a.map((x, i) => ({ x, i })).sort((p, q) => (PESO[p.x.impacto] ?? 1) - (PESO[q.x.impacto] ?? 1) || p.i - q.i).map((e) => e.x).slice(0, 5);
}

const linhaPar = (rot: string, p: Par, fmt: (x: number) => string = n) => `- ${rot}: ${fmt(p.atual)} (${variacao(p.atual, p.anterior)} contra ${fmt(p.anterior)})`;

/** Texto do e-mail: os números vêm direto do banco; só o resumo e as decisões vêm do modelo. */
export function montarTexto(d: DadosSemana, leitura: { resumo: string; decisoes: AcaoRel[] } | null): { assunto: string; corpo: string } {
  const secs: string[] = [];
  if (leitura?.resumo) secs.push(`Resumo\n${leitura.resumo}`);
  const acoes = (leitura?.decisoes ?? []) as AcaoRel[];
  if (acoes.length) {
    secs.push(`O que fazer esta semana (em ordem de prioridade)`);
    acoes.slice(0, 5).forEach((x, i) => {
      secs.push(`${i + 1}. ${x.titulo} [impacto ${x.impacto === "alto" ? "alto" : x.impacto === "baixo" ? "baixo" : "médio"}]\nO que está acontecendo: ${x.porque}\nO que fazer:`);
      secs.push((x.passos?.length ? x.passos : [x.acao]).map((p) => `- ${p}`).join("\n"));
      if (x.sucesso) secs.push(`Deu certo quando: ${x.sucesso}`);
    });
  } else if (leitura) secs.push("O que fazer esta semana\nNada urgente nos números desta semana. Siga o plano e confira de novo na próxima segunda.");
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

export async function interpretar(brain: Brain, env: Env, d: DadosSemana, f: typeof fetch): Promise<{ resumo: string; decisoes: AcaoRel[] } | null> {
  const cfg = llmConfig(env, "agent");
  if (!cfg) return null;
  for (let t = 0; t < 2; t++) {
    try {
      const r = await callLlm(cfg, { system: SISTEMA, messages: [{ role: "user", content: `FATOS:\n${JSON.stringify(d)}\n\nacoesJaIdentificadas:\n${JSON.stringify(acoesDaSemana(d).map((x) => x.titulo))}` }], maxTokens: 1400 }, f);
      return lerAcoes(textOf(r.content));
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
  const acoes = ordenarAcoes([...acoesDaSemana(dados), ...(leitura?.decisoes ?? [])]);
  const { assunto, corpo } = montarTexto(dados, { resumo: leitura?.resumo ?? "", decisoes: acoes });
  const id = opt.forcar ? `relatorio-${semana}-${brain.clock()}` : `relatorio-${semana}`;
  await sendEmail(brain, env, { id, to: para, subject: assunto, body: corpo, htmlPronto: relatorioHtml(dados, leitura?.resumo ?? "", acoes), interno: true }, f);
  brain.setPolicy("relatorio_semanal_ultimo", semana);
  brain.audit("sistema", "relatorio_semanal_enviou", semana);
  return `Relatório enviado para ${para}${leitura ? "" : " (sem a interpretação: falta a chave do modelo ou ele não respondeu)"}.`;
}
