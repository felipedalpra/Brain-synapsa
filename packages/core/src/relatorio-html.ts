import { esc } from "./email-html";
import type { AcaoRel, DadosSemana } from "./relatorio-semanal";

const VIOLETA = "#8B5CF6", AZUL = "#38BDF8", TINTA = "#1F2937", SUAVE = "#6B7280", LINHA = "#EDE9FE";
const TITULO = "Poppins, 'Segoe UI', Helvetica, Arial, sans-serif";
const TEXTO = "Lato, 'Segoe UI', Helvetica, Arial, sans-serif";
const COR_IMPACTO = { alto: "#DC2626", medio: "#D97706", baixo: "#6B7280" } as const;
const ROT_IMPACTO = { alto: "Impacto alto", medio: "Impacto médio", baixo: "Impacto baixo" } as const;

const n = (x: number) => Math.round(x).toLocaleString("pt-BR");
const r1 = (x: number) => (Math.round(x * 10) / 10).toLocaleString("pt-BR");
const brl = (x: number) => `R$ ${x.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dd = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
interface Par { atual: number; anterior: number }

function delta(p: Par, neutro = false): string {
  let txt = "sem base", cor = SUAVE;
  if (p.anterior) {
    const v = Math.round(((p.atual - p.anterior) / p.anterior) * 100);
    txt = `${v > 0 ? "+" : ""}${v}%`;
    if (!neutro && v !== 0) cor = v > 0 ? "#16A34A" : "#DC2626";
  } else if (p.atual) { txt = "novo"; if (!neutro) cor = "#16A34A"; }
  return `<span style="font:700 13px ${TITULO};color:${cor}">${txt}</span>`;
}

const secao = (titulo: string, corpo: string) =>
  `<tr><td style="padding:26px 0 0"><div style="font:700 18px ${TITULO};color:${TINTA};padding:0 0 10px;border-bottom:2px solid ${LINHA}">${esc(titulo)}</div>${corpo}</td></tr>`;
const sub = (t: string) => `<div style="font:700 13px ${TITULO};color:${VIOLETA};margin:14px 0 6px">${esc(t)}</div>`;
const nota = (t: string) => `<div style="font:400 13px/1.5 ${TEXTO};color:${SUAVE};margin:8px 0 0">${esc(t)}</div>`;

function tabela(linhas: { rot: string; p: Par; fmt?: (x: number) => string; neutro?: boolean }[]): string {
  const th = (t: string, al = "right") => `<td align="${al}" style="font:700 11px ${TITULO};color:${SUAVE};padding:6px 8px;letter-spacing:.3px">${t}</td>`;
  const td = (t: string, al = "right", extra = "") => `<td align="${al}" style="font:400 15px ${TEXTO};color:${TINTA};padding:9px 8px;border-top:1px solid ${LINHA};${extra}">${t}</td>`;
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0"><tr>${th("MÉTRICA", "left")}${th("ESTA SEMANA")}${th("ANTERIOR")}${th("VARIAÇÃO")}</tr>${linhas.map((l) => {
    const f = l.fmt ?? n;
    return `<tr>${td(esc(l.rot), "left")}${td(`<strong>${f(l.p.atual)}</strong>`)}${td(f(l.p.anterior), "right", `color:${SUAVE}`)}${td(delta(l.p, l.neutro))}</tr>`;
  }).join("")}</table>`;
}

function lista(itens: string[]): string {
  if (!itens.length) return "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itens.map((t) => `<tr><td style="font:400 14px/1.5 ${TEXTO};color:${TINTA};padding:5px 0;border-top:1px solid ${LINHA}">${t}</td></tr>`).join("")}</table>`;
}

function cartaoAcao(a: AcaoRel, i: number): string {
  const cor = COR_IMPACTO[a.impacto] ?? SUAVE;
  const passos = a.passos?.length ? a.passos : a.acao ? [a.acao] : [];
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 14px;border:1px solid ${LINHA};border-left:5px solid ${cor};border-radius:12px;background:#ffffff"><tr><td style="padding:16px 18px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
<td width="34" valign="top"><div style="width:28px;height:28px;border-radius:14px;background:${VIOLETA};color:#fff;font:700 14px/28px ${TITULO};text-align:center">${i + 1}</div></td>
<td valign="top"><div style="font:700 16px/1.35 ${TITULO};color:${TINTA}">${esc(a.titulo)}</div><div style="margin-top:5px"><span style="display:inline-block;font:700 11px ${TITULO};color:${cor};border:1px solid ${cor};border-radius:999px;padding:2px 9px">${ROT_IMPACTO[a.impacto] ?? ""}</span></div></td>
</tr></table>
<div style="font:700 11px ${TITULO};color:${SUAVE};letter-spacing:.3px;margin:14px 0 4px">O QUE ESTÁ ACONTECENDO</div>
<div style="font:400 15px/1.55 ${TEXTO};color:${TINTA}">${esc(a.porque)}</div>
<div style="font:700 11px ${TITULO};color:${SUAVE};letter-spacing:.3px;margin:14px 0 4px">O QUE FAZER</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${passos.map((p, k) => `<tr><td width="26" valign="top" style="font:700 14px/1.55 ${TITULO};color:${VIOLETA};padding:3px 0">${k + 1}.</td><td style="font:400 15px/1.55 ${TEXTO};color:${TINTA};padding:3px 0">${esc(p)}</td></tr>`).join("")}</table>
${a.sucesso ? `<div style="margin-top:14px;background:#F0FDF4;border-radius:8px;padding:10px 12px;font:400 14px/1.5 ${TEXTO};color:#166534"><strong>Deu certo quando:</strong> ${esc(a.sucesso)}</div>` : ""}
</td></tr></table>`;
}

export function relatorioHtml(d: DadosSemana, resumo: string, acoes: AcaoRel[]): string {
  const blocos: string[] = [];
  if (resumo) blocos.push(`<tr><td style="padding:22px 0 0"><div style="background:#F5F3FF;border-radius:12px;padding:16px 18px"><div style="font:700 11px ${TITULO};color:${VIOLETA};letter-spacing:.3px;margin-bottom:6px">RESUMO DA SEMANA</div><div style="font:400 16px/1.6 ${TEXTO};color:${TINTA}">${esc(resumo)}</div></div></td></tr>`);
  blocos.push(secao("O que fazer esta semana", acoes.length
    ? `<div style="margin-top:14px">${acoes.map(cartaoAcao).join("")}</div>`
    : nota("Nada urgente nos números desta semana. Siga o plano e confira de novo na próxima segunda.")));

  if (d.google.length) blocos.push(secao("Google (busca orgânica)", d.google.map((g) => `${sub(g.site)}${tabela([{ rot: "Cliques", p: g.cliques }, { rot: "Impressões", p: g.impressoes }])}${g.topBuscas.length ? sub("Buscas que mais trazem gente") + lista(g.topBuscas.slice(0, 4).map((q) => `${esc(q.busca)} <span style="color:${SUAVE}">· ${n(q.cliques)} cliques · posição ${r1(q.posicao)}</span>`)) : ""}`).join("")));

  if (d.visitas.length) blocos.push(secao("De onde vêm as visitas (GA4)", d.visitas.map((v) => `${sub(v.site)}${tabela([{ rot: "Visitas na semana", p: v.sessoes }])}${v.canais.length ? sub("Canais (28 dias)") + lista(v.canais.slice(0, 5).map((c) => `${esc(c.canal)} <span style="color:${SUAVE}">· ${n(c.sessoes)}</span> ${delta({ atual: c.sessoes, anterior: c.antes })}`)) : ""}${v.campanhas.length ? sub("Campanhas com UTM (28 dias)") + lista(v.campanhas.slice(0, 6).map((c) => `${esc(c.campanha)} <span style="color:${SUAVE}">· ${n(c.sessoes)}</span>`)) : nota("Ainda sem visitas com campanha marcada.")}${v.ultimoDia ? nota(`Dado até ${dd(v.ultimoDia)}. O GA4 atrasa 24 a 48 horas.`) : ""}`).join("") + nota("O diretório só conta quem aceita cookies: o número é um piso, não o total.")));

  const m = d.meta;
  if (m?.anuncios) {
    const a = m.anuncios;
    blocos.push(secao("Anúncios (Meta)", `<div style="margin-top:10px">${tabela([{ rot: "Gasto", p: a.gasto, fmt: brl, neutro: true }, { rot: "Alcance (soma dos dias)", p: a.alcance }, { rot: "Cliques no link", p: a.cliquesNoLink }, { rot: "Leads", p: a.leads }])}</div>${a.campanhas.length ? sub("Campanhas") + lista(a.campanhas.map((c) => `${esc(c.nome)} <span style="color:${SUAVE}">· ${brl(c.gasto)} · ${n(c.cliquesNoLink)} cliques · ${n(c.leads)} leads</span>`)) : ""}`));
  }
  if (m?.instagram) blocos.push(secao("Instagram", `<div style="margin-top:10px">${tabela([{ rot: "Alcance", p: m.instagram.alcance }, { rot: "Visitas ao perfil", p: m.instagram.visitasAoPerfil }, { rot: "Cliques no link da bio", p: m.instagram.cliquesNoLink }])}</div>`));

  const x = d.diretorio;
  if (x) blocos.push(secao("Diretório de psicólogos", `<div style="margin-top:10px">${tabela([{ rot: "Visitas na semana", p: x.sessoes }])}</div>${x.perfisNoGoogle ? sub("No Google") + lista([`<strong>${x.perfisNoGoogle.comImpressao} de ${x.perfisNoGoogle.total}</strong> perfis aparecem em buscas`, `<strong>${x.perfisNoGoogle.comClique}</strong> já recebem clique`]) : ""}${x.perfisMaisVistos.length ? sub("Perfis mais vistos (28 dias)") + lista(x.perfisMaisVistos.slice(0, 5).map((p) => `${esc(p.perfil)} <span style="color:${SUAVE}">· ${n(p.sessoes)}</span> ${delta({ atual: p.sessoes, anterior: p.antes })}`)) : ""}`));

  const t = d.tendencias;
  if (t.novas.length || t.destaques.length) blocos.push(secao("O que as pessoas buscam sobre terapia", `${t.novas.length ? sub("Buscas novas esta semana") + lista(t.novas.slice(0, 8).map(esc)) : nota(t.primeiraLeitura ? "Primeira leitura: na próxima semana eu mostro o que é novo e o que subiu." : "Nenhuma busca nova nos termos monitorados.")}${t.destaques.map((g) => sub(`Quem digita "${g.tema}" vê`) + lista(g.buscas.map(esc))).join("")}`));

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Poppins:wght@600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F5F3FF"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F3FF"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:${VIOLETA};background-image:linear-gradient(135deg,${VIOLETA},${AZUL});padding:24px 32px"><div style="font:700 24px ${TITULO};color:#ffffff">Tráfego da semana</div><div style="font:400 14px ${TEXTO};color:rgba(255,255,255,.92);margin-top:3px">Synapsa · ${dd(d.periodo.de)} a ${dd(d.periodo.ate)}</div></td></tr>
<tr><td style="padding:0 32px 8px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0">${blocos.join("")}</table></td></tr>
<tr><td style="padding:18px 32px 24px;font:400 12px/1.6 ${TEXTO};color:${SUAVE}">Relatório automático do Synapsa Brain. Chega toda segunda às 14h.</td></tr>
</table></td></tr></table></body></html>`;
}
