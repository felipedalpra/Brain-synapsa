import type { Brain } from "./brain";
import { brtDay } from "./brain";
import { refreshDados } from "./data";
import { row, rows } from "./sql";

type Env = Record<string, string | undefined>;

const r2 = (n: number) => Math.round(n * 100) / 100;
const r1 = (n: number) => Math.round(n * 10) / 10;
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

export function analiseInstagram(brain: Brain) {
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

  const leitura: Leitura[] = [];
  const dias14 = brtDay(now - 14 * 86_400_000);
  const dias7 = brtDay(now - 7 * 86_400_000);
  const recentes14 = posts.filter((p) => p.dia >= dias14).length;
  const novosDia = brain.policy<{ novos: { day: string; novos: number }[] } | null>("cache_ig_novos", null)?.novos ?? [];
  const ganho7 = novosDia.filter((d) => d.day > dias7).reduce((n, d) => n + d.novos, 0);
  const ganhoAnt = novosDia.filter((d) => d.day <= dias7 && d.day > dias14).reduce((n, d) => n + d.novos, 0);

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

    const porTema = grupo(posts.filter((p) => p.tema), (p) => p.tema!).filter((g) => g.posts >= 2);
    if (porTema.length >= 2) {
      const t1 = porTema[0]!, resto = porTema.slice(1);
      const tn = resto.at(-1)!;
      if (t1.salvos_medio > tn.salvos_medio)
        leitura.push({ nivel: "fazer", titulo: `Tema que mais salva: ${t1.nome}`, detalhe: `${t1.salvos_medio} salvamentos por post contra ${tn.salvos_medio} em “${tn.nome}”. Salvar é o sinal mais forte de conteúdo útil: repita o ângulo.` });
    }

    const porDia = grupo(posts.filter((p) => p.dia), (p) => DIAS[p.diaSemana] ?? "").filter((g) => g.posts >= 2);
    if (porDia.length >= 3) {
      const melhorDia = porDia[0]!, piorDia = porDia.at(-1)!;
      if (piorDia.alcance_medio > 0 && melhorDia.alcance_medio / piorDia.alcance_medio >= 1.4)
        leitura.push({ nivel: "fazer", titulo: `Poste mais na ${melhorDia.nome}`, detalhe: `Alcance médio de ${melhorDia.alcance_medio} contra ${piorDia.alcance_medio} na ${piorDia.nome}.` });
    }

    const mediaAlcance = media(posts.map((p) => p.alcance)) ?? 0;
    const fracos = posts.filter((p) => p.alcance < mediaAlcance * 0.5 && p.dia >= brtDay(now - 30 * 86_400_000));
    if (fracos.length >= 2)
      leitura.push({ nivel: "atencao", titulo: `${fracos.length} posts recentes com menos da metade do alcance médio`, detalhe: `Média: ${Math.round(mediaAlcance)}. Veja o que eles têm em comum antes do próximo post: ${fracos.slice(0, 2).map((p) => `“${p.tituloCurto.slice(0, 40)}…”`).join(" e ")}.` });

    if (seguidores) {
      const alcanceSeg = mediaAlcance / seguidores;
      if (alcanceSeg < 0.5)
        leitura.push({ nivel: "atencao", titulo: "Seu conteúdo quase só alcança quem já te segue", detalhe: `O alcance médio (${Math.round(mediaAlcance)}) equivale a ${Math.round(alcanceSeg * 100)}% dos ${seguidores} seguidores. Para crescer, faça conteúdo para ser compartilhado e salvo, com gancho para quem ainda não te conhece.` });
    }
  }

  if (recentes14 < 6)
    leitura.push({ nivel: recentes14 < 3 ? "atencao" : "ok", titulo: `${recentes14} posts nos últimos 14 dias`, detalhe: recentes14 < 6 ? "Abaixo de 3 por semana. Constância pesa mais no alcance do que acertar o formato perfeito." : "" });
  if (novosDia.length >= 10)
    leitura.push({ nivel: ganho7 > ganhoAnt ? "ok" : ganho7 < ganhoAnt ? "atencao" : "ok", titulo: `${ganho7 >= 0 ? "+" : ""}${ganho7} seguidores em 7 dias`, detalhe: `Na semana anterior: ${ganhoAnt >= 0 ? "+" : ""}${ganhoAnt}.` });

  const top = [...posts].sort((a, b) => b.alcance - a.alcance).slice(0, 3);
  const fundo = [...posts].sort((a, b) => a.alcance - b.alcance).slice(0, 3);
  const slim = (p: PostWork) => ({ id: p.media_id, titulo: p.tituloCurto, formato: p.formato, tema: p.tema, dia: p.dia, link: p.permalink, alcance: p.alcance, salvos: p.salvos, compartilhados: p.compartilhados, curtidas: p.curtidas ?? 0, comentarios: p.comentarios ?? 0, views: p.views, interacao_pct: r1(p.taxaInteracao * 100), salvo_pct: r1(p.taxaSalvo * 100) });
  const atualizadoEm = row<{ u: number | null }>(brain.db, "select max(atualizado_em) as u from ig_post_metricas")?.u ?? null;

  return {
    seguidores,
    atualizado_em: atualizadoEm ? new Date(atualizadoEm).toISOString() : null,
    posts_analisados: posts.length,
    resumo: posts.length
      ? {
          alcance_medio: Math.round(media(posts.map((p) => p.alcance)) ?? 0),
          salvos_medio: r1(media(posts.map((p) => p.salvos)) ?? 0),
          compartilhados_medio: r1(media(posts.map((p) => p.compartilhados)) ?? 0),
          interacao_pct: r1((media(posts.map((p) => p.taxaInteracao)) ?? 0) * 100),
          posts_14d: recentes14,
          seguidores_novos_7d: novosDia.length >= 10 ? ganho7 : null,
          seguidores_novos_7d_anterior: novosDia.length >= 10 ? ganhoAnt : null,
        }
      : null,
    por_formato: grupo(posts, (p) => p.formato),
    por_tema: grupo(posts.filter((p) => p.tema), (p) => p.tema!),
    por_dia: grupo(posts.filter((p) => p.dia), (p) => DIAS[p.diaSemana] ?? ""),
    melhores: top.map(slim),
    piores: fundo.map(slim),
    posts: posts.slice(0, 30).map(slim),
    leitura,
  };
}

interface Camp { campaign_id: string; campaign_name: string; spend: number; impressions: number; clicks: number; leads: number; dias: number; ultimo_dia: string }

function totais(cs: { spend: number; impressions: number; clicks: number; leads: number }[]) {
  const t = cs.reduce((a, c) => ({ spend: a.spend + c.spend, impressions: a.impressions + c.impressions, clicks: a.clicks + c.clicks, leads: a.leads + c.leads }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });
  return { gasto: r2(t.spend), impressoes: t.impressions, cliques: t.clicks, leads: t.leads, ctr_pct: t.impressions ? r2((t.clicks / t.impressions) * 100) : null, cpc: t.clicks ? r2(t.spend / t.clicks) : null, cpl: t.leads ? r2(t.spend / t.leads) : null };
}
const delta = (a: number | null, b: number | null) => (a === null || b === null || b === 0 ? null : r1(((a - b) / b) * 100));

export function analiseAnuncios(brain: Brain) {
  const now = brain.clock();
  const d30 = brtDay(now - 30 * 86_400_000), d60 = brtDay(now - 60 * 86_400_000);
  const q = (de: string, ate: string | null) =>
    rows<Camp>(
      brain.db,
      `select campaign_id, campaign_name, sum(spend) as spend, sum(impressions) as impressions, sum(clicks) as clicks, sum(leads) as leads, count(*) as dias, max(case when spend > 0 then day end) as ultimo_dia
       from meta_ads_daily where day >= ? ${ate ? "and day < ?" : ""} group by campaign_id, campaign_name order by spend desc`,
      ...(ate ? [de, ate] : [de]),
    );
  const atual = q(d30, null);
  const anterior = q(d60, d30);
  const tAtual = totais(atual), tAnt = totais(anterior);

  // Premissas e limite de custo: quanto posso pagar por lead sem perder dinheiro.
  const premissas = lerPremissas(brain);
  const ativos = rows<{ preco: number }>(brain.db, "select effective_price_brl as preco from subscriptions where status in ('active','trialing','past_due')");
  const ticket = ativos.length ? ativos.reduce((n, a) => n + a.preco, 0) / ativos.length : null;
  const ltv = ticket ? ticket * premissas.retencaoMeses : null;
  const cacMax = ltv ? ltv / premissas.razaoLtvCac : null;
  const cplMax = cacMax ? cacMax * premissas.conversaoLeadCliente : null;
  const economia = { ticket_medio: ticket ? r2(ticket) : null, ltv: ltv ? r2(ltv) : null, cac_maximo: cacMax ? r2(cacMax) : null, cpl_maximo: cplMax ? r2(cplMax) : null, payback_meses_no_limite: ticket && cacMax ? r1(cacMax / ticket) : null };

  const campanhas = atual.map((c) => {
    const cpl = c.leads ? c.spend / c.leads : null;
    let veredito: "pausar" | "escalar" | "manter" | "cedo" = "cedo";
    let motivo = "Pouco gasto para concluir algo.";
    if (c.leads === 0 && c.spend >= 30) { veredito = "pausar"; motivo = `${brl(c.spend)} gastos sem nenhum lead.`; }
    else if (cpl !== null && cplMax && c.leads >= 3) {
      if (cpl > cplMax) { veredito = "pausar"; motivo = `Lead a ${brl(cpl)}, acima do limite de ${brl(cplMax)}.`; }
      else if (cpl <= cplMax * 0.6) { veredito = "escalar"; motivo = `Lead a ${brl(cpl)}, bem abaixo do limite de ${brl(cplMax)}.`; }
      else { veredito = "manter"; motivo = `Lead a ${brl(cpl)}, dentro do limite de ${brl(cplMax)}.`; }
    } else if (c.leads > 0 && c.leads < 3) motivo = `${c.leads} lead(s): poucos para decidir. Deixe chegar a 3.`;
    return {
      id: c.campaign_id, nome: c.campaign_name, gasto: r2(c.spend), impressoes: c.impressions, cliques: c.clicks, leads: c.leads,
      ctr_pct: c.impressions ? r2((c.clicks / c.impressions) * 100) : null, cpc: c.clicks ? r2(c.spend / c.clicks) : null, cpl: cpl ? r2(cpl) : null,
      ultimo_gasto: c.ultimo_dia, veredito, motivo,
    };
  });

  const ultimoGasto = row<{ d: string | null }>(brain.db, "select max(day) as d from meta_ads_daily where spend > 0")?.d ?? null;
  const diasParado = ultimoGasto ? Math.max(0, Math.round((Date.parse(`${brtDay(now)}T12:00:00Z`) - Date.parse(`${ultimoGasto}T12:00:00Z`)) / 86_400_000)) : null;

  const leitura: Leitura[] = [];
  if (tAtual.gasto === 0) {
    leitura.push({ nivel: "atencao", titulo: ultimoGasto ? `Sem anúncio rodando há ${diasParado} dias` : "Nunca houve gasto em anúncios nesta conta", detalhe: ultimoGasto ? `Último gasto em ${ultimoGasto.slice(8, 10)}/${ultimoGasto.slice(5, 7)}. Todo o crescimento hoje vem do orgânico.` : "Todo o crescimento hoje vem do orgânico." });
    if (cplMax)
      leitura.push({
        nivel: "fazer", titulo: `Se for testar anúncio, o teto é ${brl(cplMax)} por lead`,
        detalhe: `Com ticket de ${brl(ticket!)}, ${premissas.retencaoMeses} meses de retenção, LTV:CAC de ${premissas.razaoLtvCac}:1 e ${Math.round(premissas.conversaoLeadCliente * 100)}% dos leads virando cliente. Para validar o canal, junte uns 10 leads: no limite isso custa até ${brl(cplMax * 10)}.`,
      });
  } else {
    const dgasto = delta(tAtual.gasto, tAnt.gasto), dleads = delta(tAtual.leads, tAnt.leads);
    if (tAnt.gasto > 0 && dgasto !== null)
      leitura.push({ nivel: "ok", titulo: `Gasto ${dgasto >= 0 ? "subiu" : "caiu"} ${Math.abs(dgasto)}% e leads ${dleads === null ? "sem base de comparação" : `${dleads >= 0 ? "subiram" : "caíram"} ${Math.abs(dleads)}%`}`, detalhe: `Últimos 30 dias contra os 30 anteriores.` });
    if (tAtual.cpl && cplMax)
      leitura.push({ nivel: tAtual.cpl > cplMax ? "atencao" : "ok", titulo: `Custo por lead ${brl(tAtual.cpl)} (limite ${brl(cplMax)})`, detalhe: tAtual.cpl > cplMax ? "Acima do limite: cada cliente custa mais do que o que ele devolve. Corte as campanhas piores primeiro." : "Dentro do limite que se paga no tempo de vida do cliente." });
    for (const c of campanhas.filter((x) => x.veredito === "pausar").slice(0, 3)) leitura.push({ nivel: "fazer", titulo: `Pausar “${c.nome}”`, detalhe: c.motivo });
    for (const c of campanhas.filter((x) => x.veredito === "escalar").slice(0, 2)) leitura.push({ nivel: "fazer", titulo: `Aumentar verba de “${c.nome}”`, detalhe: c.motivo });
    if (tAtual.leads > 0 && tAtual.cliques > 0) {
      const cvr = (tAtual.leads / tAtual.cliques) * 100;
      if (cvr < 5) leitura.push({ nivel: "atencao", titulo: `Só ${r1(cvr)}% dos cliques viram lead`, detalhe: "O problema provavelmente está depois do anúncio: página de destino ou formulário. Mudar o criativo não resolve." });
    }
  }

  const porDia = rows<{ day: string; gasto: number; cliques: number; leads: number }>(brain.db, "select day, sum(spend) as gasto, sum(clicks) as cliques, sum(leads) as leads from meta_ads_daily where day >= ? group by day order by day", d30);
  const atualizado = row<{ u: number | null }>(brain.db, "select max(updated_at) as u from meta_ads_daily")?.u ?? null;
  return {
    atualizado_em: atualizado ? new Date(atualizado).toISOString() : null,
    atual: tAtual,
    anterior: tAnt,
    variacao: { gasto: delta(tAtual.gasto, tAnt.gasto), leads: delta(tAtual.leads, tAnt.leads), cpl: delta(tAtual.cpl, tAnt.cpl), ctr: delta(tAtual.ctr_pct, tAnt.ctr_pct) },
    premissas,
    economia,
    campanhas,
    por_dia: porDia,
    ultimo_gasto: ultimoGasto,
    dias_parado: diasParado,
    leitura,
  };
}

export function midiaPainel(brain: Brain) {
  return { instagram: analiseInstagram(brain), anuncios: analiseAnuncios(brain) };
}

/** Uma vez por dia: lê Meta e Instagram e guarda, para a análise não depender de alguém apertar o botão. */
export async function midiaRotina(brain: Brain, env: Env): Promise<void> {
  const hoje = brtDay(brain.clock());
  if (brain.policy<string>("midia_ultima_leitura", "") === hoje) return;
  if (!env.META_SYSTEM_USER_TOKEN) return;
  await refreshDados(brain, env);
  brain.setPolicy("midia_ultima_leitura", hoje);
}
