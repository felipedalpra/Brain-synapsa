import type { Brain } from "./brain";
import { brtDay } from "./brain";
import { refreshDados } from "./data";
import { sincronizarMidia } from "./midia-sync";
import { row, rows } from "./sql";

type Env = Record<string, string | undefined>;

const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number) => Math.round(n * 10) / 10;
const mediana = (xs: number[]) => { const o = [...xs].sort((a, b) => a - b); const m = Math.floor(o.length / 2); return o.length ? (o.length % 2 ? o[m]! : (o[m - 1]! + o[m]!) / 2) : 0; };
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const DIAS = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const brl = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;
/** Com menos posts que isso, a comparação é ruído: não vira recomendação. */
const AMOSTRA_MIN = 3;

export type Leitura = { nivel: "fazer" | "atencao" | "ok"; titulo: string; detalhe: string };

export interface Premissas {
  /** Fração dos leads que viram cliente pagante. */
  conversaoLeadCliente: number;
  /** Quantos meses o cliente fica, em média. */
  retencaoMeses: number;
  /** LTV : CAC mínimo aceitável. */
  razaoLtvCac: number;
}
export const PREMISSAS_PADRAO: Premissas = { conversaoLeadCliente: 0.1, retencaoMeses: 12, razaoLtvCac: 3 };

export function lerPremissas(brain: Brain): Premissas {
  const p = brain.policy<Partial<Premissas>>("midia_premissas", {});
  return {
    conversaoLeadCliente: num(p.conversaoLeadCliente, PREMISSAS_PADRAO.conversaoLeadCliente, 0.005, 1),
    retencaoMeses: num(p.retencaoMeses, PREMISSAS_PADRAO.retencaoMeses, 1, 120),
    razaoLtvCac: num(p.razaoLtvCac, PREMISSAS_PADRAO.razaoLtvCac, 1, 20),
  };
}
const num = (v: unknown, padrao: number, min: number, max: number) => (typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : padrao);

export function salvarPremissas(brain: Brain, entrada: Partial<Premissas>): Premissas {
  const atual = lerPremissas(brain);
  const novo: Premissas = {
    conversaoLeadCliente: num(entrada.conversaoLeadCliente, atual.conversaoLeadCliente, 0.005, 1),
    retencaoMeses: num(entrada.retencaoMeses, atual.retencaoMeses, 1, 120),
    razaoLtvCac: num(entrada.razaoLtvCac, atual.razaoLtvCac, 1, 20),
  };
  brain.setPolicy("midia_premissas", novo);
  brain.audit("voce", "midia_premissas", "premissas de anúncio", novo as unknown as Record<string, unknown>);
  return novo;
}

export interface Periodo { de: string; ate: string; dias: number; anterior: { de: string; ate: string } }

const somaDias = (d: string, n: number) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const difDias = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
const dataValida = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Período pedido (de/até, inclusive). Sem pedido: últimos 30 dias. O anterior tem o mesmo tamanho e vem logo antes. */
export function periodoDe(brain: Brain, de?: unknown, ate?: unknown): Periodo {
  const hoje = brtDay(brain.clock());
  let fim = dataValida(ate) ? (ate > hoje ? hoje : ate) : hoje;
  let ini = dataValida(de) ? de : somaDias(fim, -29);
  if (ini > fim) [ini, fim] = [fim, ini];
  if (difDias(ini, fim) > 400) ini = somaDias(fim, -400);
  const dias = difDias(ini, fim) + 1;
  return { de: ini, ate: fim, dias, anterior: { de: somaDias(ini, -dias), ate: somaDias(ini, -1) } };
}

const formato = (t: string | null) => (t === "CAROUSEL_ALBUM" ? "Carrossel" : t === "VIDEO" || t === "REELS" ? "Reel" : t === "IMAGE" ? "Imagem" : (t ?? "Outro"));

interface PostLinha {
  media_id: string; tipo: string | null; publicado: string | null; permalink: string | null; legenda: string | null;
  curtidas: number | null; comentarios: number | null; alcance: number | null; salvos: number | null; compartilhados: number | null; views: number | null; interacoes: number | null;
  tema: string | null; pilar: string | null;
}

function grupo(posts: PostWork[], chave: (p: PostWork) => string) {
  const m = new Map<string, PostWork[]>();
  for (const p of posts) m.set(chave(p), [...(m.get(chave(p)) ?? []), p]);
  return [...m.entries()]
    .map(([nome, ps]) => ({
      nome,
      posts: ps.length,
      alcance_medio: Math.round(media(ps.map((p) => p.alcance)) ?? 0),
      salvos_medio: r1(media(ps.map((p) => p.salvos)) ?? 0),
      compartilhados_medio: r1(media(ps.map((p) => p.compartilhados)) ?? 0),
      interacao_pct: r1((media(ps.map((p) => p.taxaInteracao)) ?? 0) * 100),
    }))
    .sort((a, b) => b.alcance_medio - a.alcance_medio);
}

interface PostWork extends PostLinha { alcance: number; salvos: number; compartilhados: number; interacoesN: number; taxaInteracao: number; taxaSalvo: number; dia: string; diaSemana: number; formato: string; tituloCurto: string }

export function analiseInstagram(brain: Brain, per: Periodo = periodoDe(brain)) {
  const now = brain.clock();
  const seg = rows<{ day: string; followers: number | null }>(brain.db, "select day, followers from instagram_daily order by day");
  const seguidores = seg.at(-1)?.followers ?? null;
  const brutos = rows<PostLinha>(
    brain.db,
    `select m.media_id, m.tipo, m.publicado, m.permalink, m.legenda, m.curtidas, m.comentarios, m.alcance, m.salvos, m.compartilhados, m.views, m.interacoes, p.tema, p.pilar
     from ig_post_metricas m left join ig_posts p on p.media_id = m.media_id order by m.publicado desc`,
  );
  const comMetrica = brutos.filter((p) => p.alcance !== null);
  const posts: PostWork[] = comMetrica.map((p) => {
    const alcance = p.alcance ?? 0;
    const interacoesN = p.interacoes ?? (p.curtidas ?? 0) + (p.comentarios ?? 0) + (p.salvos ?? 0) + (p.compartilhados ?? 0);
    const dia = p.publicado ? brtDay(Date.parse(p.publicado)) : "";
    return {
      ...p, alcance, salvos: p.salvos ?? 0, compartilhados: p.compartilhados ?? 0, interacoesN,
      taxaInteracao: alcance ? interacoesN / alcance : 0, taxaSalvo: alcance ? (p.salvos ?? 0) / alcance : 0,
      dia, diaSemana: dia ? new Date(`${dia}T12:00:00-03:00`).getDay() : 0, formato: formato(p.tipo),
      tituloCurto: (p.legenda ?? "").replace(/\s+/g, " ").slice(0, 70),
    };
  });
  const noPeriodo = posts.filter((p) => p.dia >= per.de && p.dia <= per.ate);

  const leitura: Leitura[] = [];
  const dias14 = brtDay(now - 14 * 86_400_000);
  const recentes14 = posts.filter((p) => p.dia >= dias14).length;

  // Dia a dia do período (alcance, visitas, toques no link, seguidores novos).
  const dd = rows<{ day: string; reach: number | null; profile_views: number | null; link_taps: number | null; interacoes: number | null; novos: number | null }>(
    brain.db, "select day, reach, profile_views, link_taps, interacoes, novos from ig_dia where day >= ? and day <= ? order by day", per.de, per.ate,
  );
  const ddAnt = rows<{ day: string; reach: number | null; profile_views: number | null; link_taps: number | null; novos: number | null }>(
    brain.db, "select day, reach, profile_views, link_taps, novos from ig_dia where day >= ? and day <= ?", per.anterior.de, per.anterior.ate,
  );
  const soma = (xs: (number | null)[]) => xs.reduce<number>((n, v) => n + (v ?? 0), 0);
  const temDia = (k: "reach" | "profile_views" | "link_taps" | "novos") => dd.some((r) => r[k] !== null);
  const segPeriodo = seg.filter((r) => r.day >= per.de && r.day <= per.ate && r.followers !== null);
  const segIni = segPeriodo[0]?.followers ?? null, segFim = segPeriodo.at(-1)?.followers ?? null;
  const visitas = temDia("profile_views") ? soma(dd.map((r) => r.profile_views)) : null;
  const toques = temDia("link_taps") ? soma(dd.map((r) => r.link_taps)) : null;
  const novos = temDia("novos") ? soma(dd.map((r) => r.novos)) : null;
  const novosAnt = ddAnt.some((r) => r.novos !== null) ? soma(ddAnt.map((r) => r.novos)) : null;

  if (!posts.length) {
    leitura.push({ nivel: "atencao", titulo: "Ainda não tenho métricas por post", detalhe: "Toque em “Atualizar dados”. Se continuar vazio, o token da Meta precisa da permissão instagram_manage_insights." });
  } else {
    const porFormato = grupo(posts, (p) => p.formato);
    const validos = porFormato.filter((g) => g.posts >= AMOSTRA_MIN);
    if (validos.length >= 2) {
      const melhor = validos[0]!, resto = validos.slice(1);
      const pior = resto.at(-1)!;
      if (pior.alcance_medio > 0 && melhor.alcance_medio / pior.alcance_medio >= 1.3)
        leitura.push({ nivel: "fazer", titulo: `Priorize ${melhor.nome.toLowerCase()}`, detalhe: `Alcança ${Math.round(melhor.alcance_medio)} pessoas por post, ${r1(melhor.alcance_medio / pior.alcance_medio)}× mais que ${pior.nome.toLowerCase()} (${pior.alcance_medio}). Base: ${melhor.posts} e ${pior.posts} posts.` });
    } else if (porFormato.length >= 2) {
      leitura.push({ nivel: "ok", titulo: "Formatos ainda sem amostra para comparar", detalhe: `Preciso de pelo menos ${AMOSTRA_MIN} posts de cada formato. Hoje: ${porFormato.map((g) => `${g.nome} ${g.posts}`).join(", ")}.` });
    }

    const porTema = grupo(posts.filter((p) => p.pilar), (p) => p.pilar!).filter((g) => g.posts >= 2);
    if (porTema.length >= 2) {
      const t1 = porTema[0]!, resto = porTema.slice(1);
      const tn = resto.at(-1)!;
      if (t1.salvos_medio > tn.salvos_medio)
        leitura.push({ nivel: "fazer", titulo: `Pilar que mais salva: ${t1.nome}`, detalhe: `${t1.salvos_medio} salvamentos por post contra ${tn.salvos_medio} em “${tn.nome}”. Salvar é o sinal mais forte de conteúdo útil: repita o ângulo.` });
    }

    const porDia = grupo(posts.filter((p) => p.dia), (p) => DIAS[p.diaSemana] ?? "").filter((g) => g.posts >= 2);
    if (porDia.length >= 3) {
      const melhorDia = porDia[0]!, piorDia = porDia.at(-1)!;
      if (piorDia.alcance_medio > 0 && melhorDia.alcance_medio / piorDia.alcance_medio >= 1.4)
        leitura.push({ nivel: "fazer", titulo: `Poste mais na ${melhorDia.nome}`, detalhe: `Alcance médio de ${melhorDia.alcance_medio} contra ${piorDia.alcance_medio} na ${piorDia.nome}.` });
    }

    // Mediana, não média: um post viral puxa a média para cima e faz o resto parecer fraco.
    const tipico = mediana(posts.map((p) => p.alcance));
    const fracos = posts.filter((p) => p.alcance < tipico * 0.5 && p.dia >= brtDay(now - 30 * 86_400_000));
    if (fracos.length >= 3)
      leitura.push({ nivel: "atencao", titulo: `${fracos.length} posts recentes com menos da metade do alcance típico`, detalhe: `Alcance típico (mediana): ${Math.round(tipico)}. Veja o que eles têm em comum antes do próximo post: ${fracos.slice(0, 2).map((p) => `“${p.tituloCurto.slice(0, 40)}…”`).join(" e ")}.` });

    const salvosMed = media(posts.map((p) => p.salvos)) ?? 0, compartMed = media(posts.map((p) => p.compartilhados)) ?? 0;
    if (posts.length >= 8 && salvosMed < 1 && compartMed < 1)
      leitura.push({ nivel: "fazer", titulo: "Quase ninguém salva ou compartilha seus posts", detalhe: `Média de ${r1(salvosMed)} salvamentos e ${r1(compartMed)} compartilhamentos por post. A curtida mostra que gostaram, mas o Instagram só empurra para quem não te segue o que é salvo e enviado. Termine o post com algo para guardar (checklist, modelo, passo a passo) e peça o envio para uma colega.` });
    if (seguidores) {
      const alcanceSeg = tipico / seguidores;
      if (alcanceSeg < 0.5)
        leitura.push({ nivel: "atencao", titulo: "Seu conteúdo quase só alcança quem já te segue", detalhe: `O alcance típico (${Math.round(tipico)}) equivale a ${Math.round(alcanceSeg * 100)}% dos ${seguidores} seguidores. Para crescer, faça conteúdo para ser compartilhado e salvo, com gancho para quem ainda não te conhece.` });
    }
  }

  if (visitas !== null && toques !== null && visitas >= 50) {
    const taxa = (toques / visitas) * 100;
    if (taxa < 8)
      leitura.push({ nivel: "fazer", titulo: `Só ${r1(taxa)}% de quem visita o perfil toca no link da bio`, detalhe: `${visitas} visitas ao perfil e ${toques} toques no link no período. Reescreva a bio com uma frase de benefício para o psicólogo e uma chamada clara antes do link: é o passo entre o Instagram e o seu site.` });
    else leitura.push({ nivel: "ok", titulo: `${r1(taxa)}% das visitas ao perfil viram toque no link`, detalhe: `${visitas} visitas e ${toques} toques no período.` });
  }
  if (recentes14 < 6)
    leitura.push({ nivel: recentes14 < 3 ? "atencao" : "ok", titulo: `${recentes14} posts nos últimos 14 dias`, detalhe: recentes14 < 6 ? "Abaixo de 3 por semana. Constância pesa mais no alcance do que acertar o formato perfeito." : "" });
  if (novos !== null)
    leitura.push({ nivel: novosAnt !== null && novos < novosAnt ? "atencao" : "ok", titulo: `${novos >= 0 ? "+" : ""}${novos} seguidores no período`, detalhe: novosAnt !== null ? `No período anterior: ${novosAnt >= 0 ? "+" : ""}${novosAnt}.` : "" });

  const top = [...noPeriodo.length ? noPeriodo : posts].sort((a, b) => b.alcance - a.alcance).slice(0, 3);
  const fundo = [...noPeriodo.length ? noPeriodo : posts].sort((a, b) => a.alcance - b.alcance).slice(0, 3);
  const slim = (p: PostWork) => ({ id: p.media_id, titulo: p.tituloCurto, formato: p.formato, tema: p.tema, pilar: p.pilar, dia: p.dia, link: p.permalink, alcance: p.alcance, salvos: p.salvos, compartilhados: p.compartilhados, curtidas: p.curtidas ?? 0, comentarios: p.comentarios ?? 0, views: p.views, interacao_pct: r1(p.taxaInteracao * 100), salvo_pct: r1(p.taxaSalvo * 100) });
  const atualizadoEm = row<{ u: number | null }>(brain.db, "select max(atualizado_em) as u from ig_post_metricas")?.u ?? null;

  return {
    seguidores,
    atualizado_em: atualizadoEm ? new Date(atualizadoEm).toISOString() : null,
    posts_analisados: posts.length,
    periodo: {
      posts: noPeriodo.length,
      alcance_post_medio: noPeriodo.length ? Math.round(media(noPeriodo.map((p) => p.alcance)) ?? 0) : null,
      salvos: noPeriodo.reduce((n, p) => n + p.salvos, 0),
      compartilhamentos: noPeriodo.reduce((n, p) => n + p.compartilhados, 0),
      interacao_pct: noPeriodo.length ? r1((media(noPeriodo.map((p) => p.taxaInteracao)) ?? 0) * 100) : null,
      seguidores_inicio: segIni, seguidores_fim: segFim,
      seguidores_novos: novos, seguidores_novos_anterior: novosAnt,
      visitas_perfil: visitas, visitas_perfil_anterior: ddAnt.some((r) => r.profile_views !== null) ? soma(ddAnt.map((r) => r.profile_views)) : null,
      toques_link: toques, toques_link_anterior: ddAnt.some((r) => r.link_taps !== null) ? soma(ddAnt.map((r) => r.link_taps)) : null,
      alcance_diario_medio: temDia("reach") ? Math.round(soma(dd.map((r) => r.reach)) / Math.max(1, dd.filter((r) => r.reach !== null).length)) : null,
      posts_14d: recentes14,
    },
    serie: dd.map((r) => ({ day: r.day, alcance: r.reach, visitas: r.profile_views, toques: r.link_taps, novos: r.novos })),
    seguidores_serie: segPeriodo.map((r) => ({ day: r.day, seguidores: r.followers })),
    por_formato: grupo(noPeriodo.length >= 3 ? noPeriodo : posts, (p) => p.formato),
    por_tema: grupo((noPeriodo.length >= 3 ? noPeriodo : posts).filter((p) => p.pilar), (p) => p.pilar!),
    por_dia: grupo((noPeriodo.length >= 3 ? noPeriodo : posts).filter((p) => p.dia), (p) => DIAS[p.diaSemana] ?? ""),
    melhores: top.map(slim),
    piores: fundo.map(slim),
    posts: posts.slice(0, 30).map(slim),
    leitura,
  };
}

// ---------- Anúncios ----------

interface LinhaAd { campaign_id: string; campaign_name: string; spend: number; impressions: number; reach: number; clicks: number; link_clicks: number; leads: number; ultimo_dia: string | null }
interface Soma { spend: number; impressions: number; clicks: number; leads: number }

function totais(cs: Soma[]) {
  const t = cs.reduce((a, c) => ({ spend: a.spend + c.spend, impressions: a.impressions + c.impressions, clicks: a.clicks + c.clicks, leads: a.leads + c.leads }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });
  return { gasto: r2(t.spend), impressoes: t.impressions, cliques: t.clicks, leads: t.leads, ctr_pct: t.impressions ? r2((t.clicks / t.impressions) * 100) : null, cpc: t.clicks ? r2(t.spend / t.clicks) : null, cpl: t.leads ? r2(t.spend / t.leads) : null, cpm: t.impressions ? r2((t.spend / t.impressions) * 1000) : null };
}
const delta = (a: number | null, b: number | null) => (a === null || b === null || b === 0 ? null : r1(((a - b) / b) * 100));

/** Campanhas no intervalo. Usa o dado por anúncio; se ainda não houver, cai no por campanha. */
function campanhasEm(brain: Brain, de: string, ate: string): LinhaAd[] {
  const porAnuncio = row<{ n: number }>(brain.db, "select count(*) as n from meta_ad_dia")!.n > 0;
  if (porAnuncio)
    return rows<LinhaAd>(brain.db, `select campaign_id, campaign_name, sum(spend) as spend, sum(impressions) as impressions, sum(reach) as reach, sum(clicks) as clicks, sum(link_clicks) as link_clicks, sum(leads) as leads, max(case when spend > 0 then day end) as ultimo_dia from meta_ad_dia where day >= ? and day <= ? group by campaign_id, campaign_name order by spend desc`, de, ate);
  return rows<LinhaAd>(brain.db, `select campaign_id, campaign_name, sum(spend) as spend, sum(impressions) as impressions, 0 as reach, sum(clicks) as clicks, sum(clicks) as link_clicks, sum(leads) as leads, max(case when spend > 0 then day end) as ultimo_dia from meta_ads_daily where day >= ? and day <= ? group by campaign_id, campaign_name order by spend desc`, de, ate);
}

function economiaDe(brain: Brain) {
  const premissas = lerPremissas(brain);
  const ativos = rows<{ preco: number }>(brain.db, "select effective_price_brl as preco from subscriptions where status in ('active','trialing','past_due')");
  const ticket = ativos.length ? ativos.reduce((n, a) => n + a.preco, 0) / ativos.length : null;
  const ltv = ticket ? ticket * premissas.retencaoMeses : null;
  const cacMax = ltv ? ltv / premissas.razaoLtvCac : null;
  const cplMax = cacMax ? cacMax * premissas.conversaoLeadCliente : null;
  return { premissas, ticket, cplMax, economia: { ticket_medio: ticket ? r2(ticket) : null, ltv: ltv ? r2(ltv) : null, cac_maximo: cacMax ? r2(cacMax) : null, cpl_maximo: cplMax ? r2(cplMax) : null, payback_meses_no_limite: ticket && cacMax ? r1(cacMax / ticket) : null } };
}

type Veredito = "pausar" | "escalar" | "manter" | "cedo";
function veredito(spend: number, leads: number, cplMax: number | null): { veredito: Veredito; motivo: string } {
  const cpl = leads ? spend / leads : null;
  if (leads === 0 && spend >= 30) return { veredito: "pausar", motivo: `${brl(spend)} gastos sem nenhum lead.` };
  if (cpl !== null && cplMax && leads >= 3) {
    if (cpl > cplMax) return { veredito: "pausar", motivo: `Lead a ${brl(cpl)}, acima do limite de ${brl(cplMax)}.` };
    if (cpl <= cplMax * 0.6) return { veredito: "escalar", motivo: `Lead a ${brl(cpl)}, bem abaixo do limite de ${brl(cplMax)}.` };
    return { veredito: "manter", motivo: `Lead a ${brl(cpl)}, dentro do limite de ${brl(cplMax)}.` };
  }
  if (leads > 0 && leads < 3) return { veredito: "cedo", motivo: `${leads} lead(s): poucos para decidir. Deixe chegar a 3.` };
  return { veredito: "cedo", motivo: "Pouco gasto para concluir algo." };
}

export function analiseAnuncios(brain: Brain, per: Periodo = periodoDe(brain)) {
  const now = brain.clock();
  const atual = campanhasEm(brain, per.de, per.ate);
  const anterior = campanhasEm(brain, per.anterior.de, per.anterior.ate);
  const tAtual = totais(atual), tAnt = totais(anterior);
  const { premissas, ticket, cplMax, economia } = economiaDe(brain);

  const campanhas = atual.map((c) => {
    const v = veredito(c.spend, c.leads, cplMax);
    return {
      id: c.campaign_id, nome: c.campaign_name, gasto: r2(c.spend), impressoes: c.impressions, cliques: c.clicks, leads: c.leads,
      ctr_pct: c.impressions ? r2((c.clicks / c.impressions) * 100) : null, cpc: c.clicks ? r2(c.spend / c.clicks) : null, cpl: c.leads ? r2(c.spend / c.leads) : null,
      ultimo_gasto: c.ultimo_dia, ...v,
    };
  });

  const ultimoGasto = row<{ d: string | null }>(brain.db, "select max(d) as d from (select max(day) as d from meta_ads_daily where spend > 0 union all select max(day) from meta_ad_dia where spend > 0)")?.d ?? null;
  const diasParado = ultimoGasto ? Math.max(0, difDias(ultimoGasto, brtDay(now))) : null;

  const leitura: Leitura[] = [];
  if (tAtual.gasto === 0) {
    leitura.push({ nivel: "atencao", titulo: ultimoGasto ? `Sem anúncio rodando há ${diasParado} dias` : "Nenhum gasto em anúncios nos dados lidos", detalhe: ultimoGasto ? `Último gasto em ${ultimoGasto.slice(8, 10)}/${ultimoGasto.slice(5, 7)}. Todo o crescimento hoje vem do orgânico.` : "Todo o crescimento recente vem do orgânico." });
    if (cplMax)
      leitura.push({
        nivel: "fazer", titulo: `Se for testar anúncio, o teto é ${brl(cplMax)} por lead`,
        detalhe: `Com ticket de ${brl(ticket!)}, ${premissas.retencaoMeses} meses de retenção, LTV:CAC de ${premissas.razaoLtvCac}:1 e ${Math.round(premissas.conversaoLeadCliente * 100)}% dos leads virando cliente. Para validar o canal, junte uns 10 leads: no limite isso custa até ${brl(cplMax * 10)}.`,
      });
  } else {
    const dgasto = delta(tAtual.gasto, tAnt.gasto), dleads = delta(tAtual.leads, tAnt.leads);
    if (tAnt.gasto > 0 && dgasto !== null)
      leitura.push({ nivel: "ok", titulo: `Gasto ${dgasto >= 0 ? "subiu" : "caiu"} ${Math.abs(dgasto)}% e leads ${dleads === null ? "sem base de comparação" : `${dleads >= 0 ? "subiram" : "caíram"} ${Math.abs(dleads)}%`}`, detalhe: "Contra o período anterior de mesmo tamanho." });
    if (tAtual.cpl && cplMax)
      leitura.push({ nivel: tAtual.cpl > cplMax ? "atencao" : "ok", titulo: `Custo por lead ${brl(tAtual.cpl)} (limite ${brl(cplMax)})`, detalhe: tAtual.cpl > cplMax ? "Acima do limite: cada cliente custa mais do que o que ele devolve. Corte as campanhas piores primeiro." : "Dentro do limite que se paga no tempo de vida do cliente." });
    for (const c of campanhas.filter((x) => x.veredito === "pausar").slice(0, 3)) leitura.push({ nivel: "fazer", titulo: `Pausar “${c.nome}”`, detalhe: c.motivo });
    for (const c of campanhas.filter((x) => x.veredito === "escalar").slice(0, 2)) leitura.push({ nivel: "fazer", titulo: `Aumentar verba de “${c.nome}”`, detalhe: c.motivo });
    if (tAtual.leads > 0 && tAtual.cliques > 0) {
      const cvr = (tAtual.leads / tAtual.cliques) * 100;
      if (cvr < 5) leitura.push({ nivel: "atencao", titulo: `Só ${r1(cvr)}% dos cliques viram lead`, detalhe: "O problema provavelmente está depois do anúncio: página de destino ou formulário. Mudar o criativo não resolve." });
    }
  }

  const porAnuncio = row<{ n: number }>(brain.db, "select count(*) as n from meta_ad_dia")!.n > 0;
  const porDia = rows<{ day: string; gasto: number; cliques: number; leads: number; impressoes: number }>(
    brain.db,
    porAnuncio
      ? "select day, sum(spend) as gasto, sum(clicks) as cliques, sum(leads) as leads, sum(impressions) as impressoes from meta_ad_dia where day >= ? and day <= ? group by day order by day"
      : "select day, sum(spend) as gasto, sum(clicks) as cliques, sum(leads) as leads, sum(impressions) as impressoes from meta_ads_daily where day >= ? and day <= ? group by day order by day",
    per.de, per.ate,
  );
  const atualizado = row<{ u: number | null }>(brain.db, "select max(u) as u from (select max(updated_at) as u from meta_ads_daily union all select max(updated_at) from meta_ad_dia)")?.u ?? null;
  return {
    atualizado_em: atualizado ? new Date(atualizado).toISOString() : null,
    atual: tAtual,
    anterior: tAnt,
    variacao: { gasto: delta(tAtual.gasto, tAnt.gasto), leads: delta(tAtual.leads, tAnt.leads), cpl: delta(tAtual.cpl, tAnt.cpl), ctr: delta(tAtual.ctr_pct, tAnt.ctr_pct), cliques: delta(tAtual.cliques, tAnt.cliques) },
    premissas,
    economia,
    campanhas,
    por_dia: porDia,
    ultimo_gasto: ultimoGasto,
    dias_parado: diasParado,
    leitura,
  };
}

// ---------- Criativos ----------

export function analiseCriativos(brain: Brain, per: Periodo = periodoDe(brain)) {
  const { cplMax } = economiaDe(brain);
  const meio = somaDias(per.de, Math.floor(per.dias / 2));
  const linhas = rows<{ ad_id: string; ad_name: string; campanha: string; conjunto: string; spend: number; impressions: number; reach: number; clicks: number; link_clicks: number; leads: number; dias: number; ultimo: string | null }>(
    brain.db,
    "select ad_id, max(ad_name) as ad_name, max(campaign_name) as campanha, max(adset_name) as conjunto, sum(spend) as spend, sum(impressions) as impressions, sum(reach) as reach, sum(clicks) as clicks, sum(link_clicks) as link_clicks, sum(leads) as leads, count(case when spend > 0 then 1 end) as dias, max(case when spend > 0 then day end) as ultimo from meta_ad_dia where day >= ? and day <= ? group by ad_id order by spend desc",
    per.de, per.ate,
  );
  const ctrMetade = (id: string, de: string, ate: string) => {
    const r = row<{ i: number; c: number }>(brain.db, "select sum(impressions) as i, sum(clicks) as c from meta_ad_dia where ad_id = ? and day >= ? and day <= ?", id, de, ate);
    return r && r.i >= 500 ? (r.c / r.i) * 100 : null;
  };
  const cri = new Map(rows<{ ad_id: string; nome: string; status: string; criado: string | null; campanha: string | null; conjunto: string | null; miniatura: string | null; imagem: string | null; texto: string | null; titulo: string | null; cta: string | null; link_ig: string | null }>(brain.db, "select * from meta_criativo").map((c) => [c.ad_id, c]));
  const vistos = new Set<string>();
  const itens = linhas.map((l) => {
    vistos.add(l.ad_id);
    const c = cri.get(l.ad_id);
    const v = veredito(l.spend, l.leads, cplMax);
    const freq = l.reach ? l.impressions / l.reach : null;
    const ctr1 = ctrMetade(l.ad_id, per.de, somaDias(meio, -1)), ctr2 = ctrMetade(l.ad_id, meio, per.ate);
    const cansado = freq !== null && freq >= 2.5 && ctr1 !== null && ctr2 !== null && ctr2 < ctr1 * 0.75;
    return {
      id: l.ad_id, nome: c?.nome ?? l.ad_name, campanha: l.campanha, conjunto: l.conjunto, status: c?.status ?? "", miniatura: c?.miniatura ?? null, imagem: c?.imagem ?? null,
      texto: c?.texto ?? null, titulo: c?.titulo ?? null, cta: c?.cta ?? null, link_ig: c?.link_ig ?? null,
      gasto: r2(l.spend), impressoes: l.impressions, alcance: l.reach, frequencia: freq ? r2(freq) : null, cliques: l.clicks, cliques_link: l.link_clicks,
      ctr_pct: l.impressions ? r2((l.clicks / l.impressions) * 100) : null, cpc: l.clicks ? r2(l.spend / l.clicks) : null, leads: l.leads, cpl: l.leads ? r2(l.spend / l.leads) : null,
      dias_veiculando: l.dias, ultimo_gasto: l.ultimo, cansado, ...v,
    };
  });
  // Criativos que existem mas não veicularam no período: aparecem no fim, para você saber o que já foi testado.
  const parados = [...cri.values()].filter((c) => !vistos.has(c.ad_id)).map((c) => ({
    id: c.ad_id, nome: c.nome, campanha: c.campanha ?? "", conjunto: c.conjunto ?? "", status: c.status, miniatura: c.miniatura, imagem: c.imagem, texto: c.texto, titulo: c.titulo, cta: c.cta, link_ig: c.link_ig,
    gasto: 0, impressoes: 0, alcance: 0, frequencia: null, cliques: 0, cliques_link: 0, ctr_pct: null, cpc: null, leads: 0, cpl: null, dias_veiculando: 0, ultimo_gasto: null, cansado: false, veredito: "cedo" as Veredito, motivo: "Não veiculou no período.",
  }));

  const leitura: Leitura[] = [];
  const comLead = itens.filter((i) => i.leads >= 3 && i.cpl !== null).sort((a, b) => a.cpl! - b.cpl!);
  if (comLead.length >= 2) {
    const m = comLead[0]!, p = comLead.at(-1)!;
    if (p.cpl! / m.cpl! >= 1.5) leitura.push({ nivel: "fazer", titulo: `Faça mais como “${m.nome}”`, detalhe: `Lead a ${brl(m.cpl!)} contra ${brl(p.cpl!)} em “${p.nome}” (${r1(p.cpl! / m.cpl!)}× mais caro). Copie o ângulo do primeiro no próximo teste.` });
  }
  for (const i of itens.filter((x) => x.cansado).slice(0, 3)) leitura.push({ nivel: "atencao", titulo: `“${i.nome}” está cansando`, detalhe: `Frequência ${i.frequencia} e o CTR caiu mais de 25% na segunda metade do período. Troque o criativo antes de pagar mais por menos clique.` });
  for (const i of itens.filter((x) => x.veredito === "pausar").slice(0, 3)) leitura.push({ nivel: "fazer", titulo: `Pausar “${i.nome}”`, detalhe: i.motivo });
  if (!itens.length && !parados.length) leitura.push({ nivel: "ok", titulo: "Nenhum criativo encontrado", detalhe: "A conta não tem anúncios, ou a leitura ainda não rodou. Toque em “Atualizar dados”." });
  return { itens, parados, leitura };
}

// ---------- Pixel e rastreio ----------

const FUNIL = ["PageView", "ViewContent", "InitiateCheckout", "Lead", "CompleteRegistration", "Subscribe", "Purchase"];

export function analisePixel(brain: Brain, per: Periodo = periodoDe(brain)) {
  const now = brain.clock();
  const pixels = rows<{ pixel_id: string; nome: string; ultimo_disparo: string | null; indisponivel: number }>(brain.db, "select pixel_id, nome, ultimo_disparo, indisponivel from meta_pixel order by nome");
  const soma = (de: string, ate: string) => Object.fromEntries(rows<{ evento: string; t: number }>(brain.db, "select evento, sum(total) as t from meta_pixel_dia where day >= ? and day <= ? group by evento", de, ate).map((r) => [r.evento, r.t]));
  const atual = soma(per.de, per.ate) as Record<string, number>;
  const ant = soma(per.anterior.de, per.anterior.ate) as Record<string, number>;
  const eventos = Object.keys({ ...atual, ...ant }).map((e) => ({ evento: e, total: atual[e] ?? 0, anterior: ant[e] ?? 0, variacao: delta(atual[e] ?? 0, ant[e] ?? 0) })).sort((a, b) => b.total - a.total);
  const ordemFunil = FUNIL.filter((e) => atual[e] !== undefined);
  const funil = ordemFunil.map((e, i) => ({ evento: e, total: atual[e]!, do_anterior_pct: i === 0 ? null : atual[ordemFunil[i - 1]!]! > 0 ? r1((atual[e]! / atual[ordemFunil[i - 1]!]!) * 100) : null }));
  const topo = eventos.filter((e) => e.total > 0).slice(0, 4).map((e) => e.evento);
  const serie = rows<{ day: string; evento: string; total: number }>(brain.db, "select day, evento, sum(total) as total from meta_pixel_dia where day >= ? and day <= ? group by day, evento order by day", per.de, per.ate).filter((r) => topo.includes(r.evento));

  const ads = totais(campanhasEm(brain, per.de, per.ate));
  const cliquesLink = campanhasEm(brain, per.de, per.ate).reduce((n, c) => n + c.link_clicks, 0);
  const leitura: Leitura[] = [];
  if (!pixels.length) {
    leitura.push({ nivel: "atencao", titulo: "Nenhum pixel encontrado na conta de anúncios", detalhe: "Sem pixel, a Meta não enxerga o que acontece no seu site: não dá para medir lead, nem otimizar anúncio para conversão. Se você já instalou um, o token precisa de ads_read, ou o pixel está em outra conta." });
  } else {
    for (const p of pixels) {
      const horas = p.ultimo_disparo ? (now - Date.parse(p.ultimo_disparo)) / 3_600_000 : null;
      if (p.indisponivel) leitura.push({ nivel: "atencao", titulo: `Pixel “${p.nome}” indisponível`, detalhe: "A Meta marcou o pixel como indisponível. Abra o Gerenciador de Eventos para ver o motivo." });
      else if (horas === null) leitura.push({ nivel: "atencao", titulo: `Pixel “${p.nome}” nunca disparou`, detalhe: "O código não está no site, ou está num lugar que não carrega. Instale e teste com a extensão Meta Pixel Helper." });
      else if (horas > 48) leitura.push({ nivel: "atencao", titulo: `Pixel “${p.nome}” parado há ${Math.round(horas / 24)} dias`, detalhe: "O último disparo foi há mais de 48 horas. Se o site recebe visita todo dia, o código saiu do ar: confira a página inicial e a de agradecimento." });
      else leitura.push({ nivel: "ok", titulo: `Pixel “${p.nome}” ativo`, detalhe: `Último disparo há ${horas < 1 ? "menos de 1 hora" : `${Math.round(horas)} horas`}.` });
    }
    const pv = atual.PageView ?? 0, ld = atual.Lead ?? 0;
    if (pv > 0 && ld === 0 && !atual.CompleteRegistration && !atual.Subscribe && !atual.Purchase)
      leitura.push({ nivel: "fazer", titulo: "O pixel vê visitas, mas nenhuma conversão", detalhe: `${pv} visitas e nenhum evento de Lead, cadastro ou compra no período. Sem isso, os anúncios não aprendem quem vira cliente. Configure o evento Lead na página de agradecimento ou no clique de “Agendar demonstração”.` });
    if (pv > 0 && ld > 0) leitura.push({ nivel: "ok", titulo: `${r1((ld / pv) * 100)}% das visitas viram lead`, detalhe: `${ld} leads em ${pv} visitas no período.` });
    if (ads.gasto > 0 && ads.leads > 0 && ld < ads.leads * 0.5)
      leitura.push({ nivel: "atencao", titulo: `A Meta conta ${ads.leads} leads e o pixel só ${ld}`, detalhe: "Parte dos leads vem de formulário da própria Meta e não passa pelo seu site, ou o evento do site está falhando. Confira qual formulário cada anúncio usa." });
    if (ads.gasto > 0 && cliquesLink >= 30 && pv < cliquesLink * 0.6)
      leitura.push({ nivel: "fazer", titulo: `Perdendo ${Math.round((1 - pv / cliquesLink) * 100)}% dos cliques antes da página carregar`, detalhe: `${cliquesLink} cliques no link e ${pv} visitas no pixel. Página lenta, bloqueador de rastreio ou link quebrado. Teste a velocidade da página de destino no celular.` });
  }
  return { pixels: pixels.map((p) => ({ ...p, indisponivel: !!p.indisponivel })), eventos, funil, serie, ads_leads: ads.leads, cliques_link: cliquesLink, leitura };
}

// ---------- Públicos e posicionamentos ----------

export function analisePublicos(brain: Brain, per: Periodo = periodoDe(brain)) {
  const { cplMax } = economiaDe(brain);
  const linhas = rows<{ tipo: string; chave: string; spend: number; impressions: number; clicks: number; leads: number }>(brain.db, "select tipo, chave, sum(spend) as spend, sum(impressions) as impressions, sum(clicks) as clicks, sum(leads) as leads from meta_quebra_dia where day >= ? and day <= ? group by tipo, chave order by spend desc", per.de, per.ate);
  const porTipo = (t: string) => {
    const ls = linhas.filter((l) => l.tipo === t);
    const total = ls.reduce((n, l) => n + l.spend, 0);
    return ls.map((l) => ({ chave: l.chave, gasto: r2(l.spend), parte_pct: total ? r1((l.spend / total) * 100) : 0, impressoes: l.impressions, cliques: l.clicks, ctr_pct: l.impressions ? r2((l.clicks / l.impressions) * 100) : null, leads: l.leads, cpl: l.leads ? r2(l.spend / l.leads) : null }));
  };
  const out = { posicionamento: porTipo("posicionamento"), idade_genero: porTipo("idade_genero"), dispositivo: porTipo("dispositivo") };
  const leitura: Leitura[] = [];
  const rotulo: Record<string, string> = { posicionamento: "posicionamento", idade_genero: "público", dispositivo: "dispositivo" };
  for (const [tipo, ls] of Object.entries(out)) {
    const gastoTotal = ls.reduce((n, l) => n + l.gasto, 0);
    for (const l of ls.filter((x) => x.leads === 0 && x.parte_pct >= 15 && x.gasto >= 30).slice(0, 2))
      leitura.push({ nivel: "fazer", titulo: `Tire ${rotulo[tipo]} “${l.chave}”`, detalhe: `${l.parte_pct}% da verba (${brl(l.gasto)}) e nenhum lead.` });
    const comLead = ls.filter((x) => x.leads >= 3 && x.cpl !== null).sort((a, b) => a.cpl! - b.cpl!);
    if (comLead.length >= 2 && gastoTotal > 0) {
      const m = comLead[0]!, p = comLead.at(-1)!;
      if (p.cpl! / m.cpl! >= 1.5) leitura.push({ nivel: "fazer", titulo: `Concentre verba em ${rotulo[tipo]} “${m.chave}”`, detalhe: `Lead a ${brl(m.cpl!)} contra ${brl(p.cpl!)} em “${p.chave}”${cplMax ? ` (limite ${brl(cplMax)})` : ""}.` });
    }
  }
  return { ...out, leitura };
}

export function midiaPainel(brain: Brain, de?: unknown, ate?: unknown) {
  const per = periodoDe(brain, de, ate);
  return {
    periodo: per,
    instagram: analiseInstagram(brain, per),
    anuncios: analiseAnuncios(brain, per),
    criativos: analiseCriativos(brain, per),
    pixel: analisePixel(brain, per),
    publicos: analisePublicos(brain, per),
    diagnostico: brain.policy<{ at: number; itens: { parte: string; ok: boolean; linhas?: number; erro?: string }[] } | null>("midia_diagnostico", null),
  };
}

/** Uma vez por dia: lê Meta e Instagram e guarda, para a análise não depender de alguém apertar o botão. */
export async function midiaRotina(brain: Brain, env: Env): Promise<void> {
  const hoje = brtDay(brain.clock());
  if (brain.policy<string>("midia_ultima_leitura", "") === hoje) return;
  if (!env.META_SYSTEM_USER_TOKEN) return;
  await refreshDados(brain, env);
  await sincronizarMidia(brain, env, { dias: 90 });
  brain.setPolicy("midia_ultima_leitura", hoje);
}
