// Ferramentas de leitura que completam o acesso do Jarvis ao Brain: SEO/GA4, fila do Instagram, planejamento da semana e prospecção.
// Só leitura (o planejamento tem uma escrita interna e reversível, no fim). Nada de e-mail ou telefone de prospect.
import type { Brain } from "./brain";
import { row, rows } from "./sql";
import { gscPainel } from "./gsc";
import { gaPainel } from "./ga";
import { planAcao, planPainel } from "./planejamento";

type Env = Record<string, string | undefined>;
const dia = (ms: number | null | undefined) => (ms ? new Date(ms - 3 * 3_600_000).toISOString().slice(0, 10) : null);

export function verSeo(brain: Brain, env: Env) {
  const g = gscPainel(brain, env);
  const a = gaPainel(brain, env);
  return {
    search_console: g.sites.map((s) => ({
      site: s.rotulo, ultimo_dia: s.ultimoDia, cliques_28d: s.atual.clicks, impressoes_28d: s.atual.impressions, posicao_media: Math.round(s.atual.position * 10) / 10,
      antes: { cliques: s.anterior.clicks, impressoes: s.anterior.impressions },
      cliques_de_marca: s.marca.clicks, cliques_sem_marca: s.naoMarca.clicks,
      top_buscas: s.queries.slice(0, 10).map((q) => ({ busca: q.chave, cliques: q.clicks, impressoes: q.impressions, posicao: Math.round(q.position * 10) / 10 })),
      top_paginas: s.paginas.slice(0, 10).map((p) => ({ pagina: p.caminho, cliques: p.clicks, impressoes: p.impressions })),
      oportunidades: s.oportunidades.slice(0, 6),
      perfis: s.perfis ? { vistos: s.perfis.comImpressao, com_clique: s.perfis.comClique, no_mapa_do_site: s.perfis.esperados } : null,
      leitura: s.recados,
    })),
    google_analytics: a.configurado ? a.sites.filter((s) => s.propriedade).map((s) => ({
      site: s.rotulo, ultimo_dia: s.ultimoDia, visitas_28d: s.atual.sessoes, pessoas_28d: s.atual.usuarios, visitas_engajadas: s.atual.engajadas, eventos_chave: s.atual.eventos,
      antes: { visitas: s.anterior.sessoes, pessoas: s.anterior.usuarios },
      canais: s.canais.slice(0, 6).map((c) => ({ canal: c.chave, visitas: c.sessoes })),
      top_entradas: s.entradas.slice(0, 10).map((e) => ({ pagina: e.chave, visitas: e.sessoes, engajadas: e.engajadas })),
      leitura: s.recados,
    })) : `GA4 ainda não ligado${a.ultimoErro ? `: ${a.ultimoErro}` : "."}`,
  };
}

export function verInstagram(brain: Brain, env: Env) {
  const ls = rows<{ id: string; status: string; tema: string; pilar: string; maturidade: string; legenda: string; agendado_para: number; publicado_em: number | null; permalink: string | null; erro: string | null }>(brain.db, "select id, status, tema, pilar, maturidade, legenda, agendado_para, publicado_em, permalink, erro from ig_posts order by criado_em desc limit 20");
  return {
    publicacao_automatica: brain.policy<boolean>("ig_auto_publicar", false) === true,
    configurado: !!(env.META_SYSTEM_USER_TOKEN && env.META_IG_ID),
    aguardando_sua_aprovacao: ls.filter((l) => l.status === "pendente").length,
    posts: ls.map((l) => ({ tema: l.tema, pilar: l.pilar, status: l.status, para: dia(l.agendado_para), publicado_em: dia(l.publicado_em), link: l.permalink, motivo: l.erro, legenda_inicio: l.legenda.slice(0, 140) })),
  };
}

export function verPlanejamento(brain: Brain, semana?: string) {
  const p = planPainel(brain, semana);
  const it = (x: any) => ({ id: x.id, titulo: x.titulo, tipo: x.tipo, dia: x.dia, formato: x.formato || undefined, responsavel: x.responsavel || "sem responsável", status: x.status, subtarefas: (x.subtarefas ?? []).map((s: any) => ({ titulo: s.titulo, status: s.status })) });
  return { semana: p.semana, resumo: p.resumo, posts: p.posts.map(it), tarefas: p.tarefas.map(it), historico_taxas: p.historico.slice(0, 8), pendentes_da_semana_anterior: p.pendentesAnterior };
}

export function verProspeccao(brain: Brain) {
  const porStatus = rows<{ status: string; n: number }>(brain.db, "select status, count(*) as n from prospects group by status").map((r) => ({ status: r.status, quantidade: r.n }));
  const topo = rows<{ nome: string; cidade: string | null; uf: string | null; nota: number; status: string; instagram: string | null }>(brain.db, "select nome, cidade, uf, nota, status, instagram from prospects where status in ('qualificado','revisar') order by nota desc limit 10");
  const total = row<{ n: number }>(brain.db, "select count(*) as n from prospects")?.n ?? 0;
  return { total, por_status: porStatus, melhores_para_abordar: topo.map((t) => ({ nome: t.nome, cidade: t.cidade ? `${t.cidade}${t.uf ? `/${t.uf}` : ""}` : null, nota: t.nota, status: t.status, tem_instagram: !!t.instagram })) };
}

/** Escrita interna e reversível: põe um post ou tarefa na semana. Não sai nada para fora. */
export function planejar(brain: Brain, i: { titulo: string; tipo?: string; dia?: number; formato?: string; responsavel?: string }) {
  const tipo = i.tipo === "post" ? "post" : "tarefa";
  planAcao(brain, { acao: "criar", tipo, titulo: i.titulo, ...(Number.isInteger(i.dia) ? { dia: i.dia } : {}), formato: i.formato ?? "", responsavel: i.responsavel ?? "" });
  return `Lancei no planejamento da semana: ${i.titulo}.`;
}
