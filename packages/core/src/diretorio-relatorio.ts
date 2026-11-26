// Relatório de presença digital de cada psicólogo do diretório: quantas pessoas viram o perfil, quantas vezes ele apareceu no Google
// e para quais buscas. Sai por um link secreto por psicólogo, que o Felipe manda por WhatsApp. Sem login, sem dado de outro psicólogo.
import { BrainError, type Brain } from "./brain";
import { gscPainel } from "./gsc";
import { gaPainel } from "./ga";
import { classificarPagina } from "./gsc-analise";
import { esc } from "./email-html";
import { row, rows, run } from "./sql";

type Env = Record<string, string | undefined>;
export interface PerfilPsi {
  slug: string; nome: string;
  visitas: number; visitasAntes: number;
  impressoes: number; impressoesAntes: number;
  cliques: number; cliquesAntes: number; posicao: number | null;
  buscas: { busca: string; cliques: number; impressoes: number; posicao: number }[];
}

/** Todos os perfis que apareceram no GA4 ou no Google nos últimos 28 dias, do mais visto ao menos visto. */
export function perfisDoDiretorio(brain: Brain, env: Env): { perfis: PerfilPsi[]; ultimoDiaGoogle: string | null; ultimoDiaGa: string | null } {
  const mapa = new Map<string, PerfilPsi>();
  const pega = (caminho: string, rotulo: string): PerfilPsi => {
    const slug = decodeURIComponent(caminho.replace(/^\/psicologo\//, ""));
    let p = mapa.get(slug);
    if (!p) { p = { slug, nome: rotulo, visitas: 0, visitasAntes: 0, impressoes: 0, impressoesAntes: 0, cliques: 0, cliquesAntes: 0, posicao: null, buscas: [] }; mapa.set(slug, p); }
    return p;
  };
  let ultimoDiaGoogle: string | null = null, ultimoDiaGa: string | null = null;
  try {
    const s = gscPainel(brain, env).sites.find((x) => x.tipo === "diretorio");
    ultimoDiaGoogle = s?.ultimoDia ?? null;
    for (const pg of s?.paginas ?? []) {
      if (pg.tipo !== "perfil") continue;
      const p = pega(pg.caminho, pg.rotulo);
      p.impressoes = pg.impressions; p.impressoesAntes = pg.anterior.impressions; p.cliques = pg.clicks; p.cliquesAntes = pg.anterior.clicks; p.posicao = pg.impressions ? pg.position : null;
      p.buscas = pg.buscas.slice(0, 6).map((b) => ({ busca: b.busca, cliques: b.clicks, impressoes: b.impressions, posicao: b.position }));
    }
  } catch { /* sem Search Console */ }
  try {
    const s = gaPainel(brain, env).sites.find((x) => x.id === "diretorio");
    ultimoDiaGa = s?.ultimoDia ?? null;
    for (const pg of s?.paginas ?? []) {
      const info = classificarPagina(pg.chave);
      if (info.tipo !== "perfil") continue;
      const p = pega(info.caminho, info.rotulo);
      p.visitas += pg.sessoes; p.visitasAntes += pg.anterior.sessoes;
    }
  } catch { /* sem GA4 */ }
  return { perfis: [...mapa.values()].sort((a, b) => b.visitas - a.visitas || b.impressoes - a.impressoes || a.nome.localeCompare(b.nome, "pt-BR")), ultimoDiaGoogle, ultimoDiaGa };
}

const tokenNovo = () => [...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Cria (ou devolve) o link secreto do relatório de um psicólogo. */
export function linkDoPsicologo(brain: Brain, env: Env, slug: string): { token: string; slug: string } {
  const s = slug.trim();
  if (!/^[\w%.\-]{1,120}$/.test(s)) throw new BrainError("invalid", "Perfil inválido.");
  if (!perfisDoDiretorio(brain, env).perfis.some((p) => p.slug === s)) throw new BrainError("not_found", "Esse perfil ainda não aparece nos dados do diretório.");
  const ja = row<{ token: string }>(brain.db, "select token from dir_links where slug = ? and revogado = 0 order by criado_em desc limit 1", s);
  if (ja) return { token: ja.token, slug: s };
  const token = tokenNovo();
  run(brain.db, "insert into dir_links (token, slug, criado_em, revogado) values (?, ?, ?, 0)", token, s, brain.clock());
  brain.audit("voce", "diretorio_link_criou", s);
  return { token, slug: s };
}

export function revogarLinkDoPsicologo(brain: Brain, slug: string): void {
  run(brain.db, "update dir_links set revogado = 1 where slug = ?", slug);
  brain.audit("voce", "diretorio_link_revogou", slug);
}

export function linksDosPsicologos(brain: Brain): Record<string, string> {
  return Object.fromEntries(rows<{ slug: string; token: string }>(brain.db, "select slug, token from dir_links where revogado = 0 order by criado_em").map((r) => [r.slug, r.token]));
}

const n = (x: number) => Math.round(x).toLocaleString("pt-BR");
const dd = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : "");
function variacao(a: number, b: number): string {
  if (!b) return a ? "novo" : "—";
  const v = Math.round(((a - b) / b) * 100);
  return `${v > 0 ? "+" : ""}${v}% contra os 28 dias anteriores`;
}

/** Página do relatório de um psicólogo (HTML pronto). O token é o segredo: quem tem o link vê só esse perfil. */
export function paginaDoPsicologo(brain: Brain, env: Env, token: string): string {
  const l = /^[0-9a-f]{48}$/.test(token) ? row<{ slug: string; revogado: number }>(brain.db, "select slug, revogado from dir_links where token = ?", token) : undefined;
  if (!l || l.revogado) throw new BrainError("not_found", "Este link não existe mais. Peça um novo.");
  const { perfis, ultimoDiaGoogle, ultimoDiaGa } = perfisDoDiretorio(brain, env);
  const p = perfis.find((x) => x.slug === l.slug);
  if (!p) throw new BrainError("not_found", "Ainda não há dados deste perfil.");
  const caixa = (titulo: string, valor: string, nota: string) => `<div class="c"><div class="t">${esc(titulo)}</div><div class="v">${esc(valor)}</div><div class="n">${esc(nota)}</div></div>`;
  const buscas = p.buscas.length
    ? `<h2>Buscas que levaram ao seu perfil</h2><table>${p.buscas.map((b) => `<tr><td>${esc(b.busca)}</td><td class="r">${n(b.impressoes)} ${b.impressoes === 1 ? "vez" : "vezes"}</td><td class="r">${n(b.cliques)} ${b.cliques === 1 ? "clique" : "cliques"}</td></tr>`).join("")}</table>`
    : `<h2>Buscas que levaram ao seu perfil</h2><p class="m">Ainda não há buscas suficientes para listar. Elas aparecem conforme o Google mostra o seu perfil.</p>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Presença digital de ${esc(p.nome)}</title>
<style>*{box-sizing:border-box}body{margin:0;background:#F5F3FF;color:#1F2937;font:16px/1.6 -apple-system,'Segoe UI',Helvetica,Arial,sans-serif}.w{max-width:640px;margin:0 auto;padding:20px 14px 40px}.h{background:linear-gradient(135deg,#8B5CF6,#38BDF8);color:#fff;border-radius:16px 16px 0 0;padding:24px 22px}.h b{font-size:13px;opacity:.9;letter-spacing:.3px}.h h1{margin:6px 0 2px;font-size:24px;line-height:1.25}.h p{margin:0;opacity:.92;font-size:14px}.b{background:#fff;border-radius:0 0 16px 16px;padding:22px}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}.c{border:1px solid #EDE9FE;border-radius:12px;padding:14px}.t{font-size:12px;color:#6B7280;font-weight:700;letter-spacing:.3px;text-transform:uppercase}.v{font-size:32px;font-weight:700;margin:4px 0;color:#7C3AED}.n{font-size:13px;color:#6B7280}h2{font-size:17px;margin:26px 0 8px;padding-bottom:6px;border-bottom:2px solid #EDE9FE}table{width:100%;border-collapse:collapse}td{padding:9px 6px;border-top:1px solid #EDE9FE;font-size:15px}.r{text-align:right;color:#6B7280;white-space:nowrap}.m{color:#6B7280;font-size:14px}ul{padding-left:20px}li{margin:6px 0}.f{font-size:12px;color:#6B7280;margin-top:24px}</style></head>
<body><div class="w"><div class="h"><b>SYNAPSA · DIRETÓRIO DE PSICÓLOGOS</b><h1>Presença digital de ${esc(p.nome)}</h1><p>Últimos 28 dias${ultimoDiaGoogle ? ` · dados do Google até ${dd(ultimoDiaGoogle)}` : ""}</p></div>
<div class="b"><div class="g">${caixa("Visitas ao perfil", n(p.visitas), variacao(p.visitas, p.visitasAntes))}${caixa("Apareceu no Google", `${n(p.impressoes)}`, `${p.impressoes === 1 ? "vez" : "vezes"} · ${variacao(p.impressoes, p.impressoesAntes)}`)}${caixa("Cliques do Google", n(p.cliques), p.posicao ? `Posição média ${(Math.round(p.posicao * 10) / 10).toLocaleString("pt-BR")}` : "Ainda sem posição")}</div>
${buscas}
<h2>Como atrair mais pacientes</h2><ul><li>Complete o perfil: foto, abordagem, público atendido e cidade. Perfil completo aparece mais.</li><li>Coloque o link do seu perfil na bio do Instagram e na assinatura do e-mail.</li><li>Peça a pacientes e colegas que compartilhem o seu perfil quando indicarem você.</li></ul>
<p class="f">As visitas contam quem aceitou cookies, então o número real é igual ou maior. Os dados do Google e do site atrasam de 1 a 2 dias${ultimoDiaGa ? ` (visitas até ${dd(ultimoDiaGa)})` : ""}. Este link é só seu: não o compartilhe publicamente.</p></div></div></body></html>`;
}
