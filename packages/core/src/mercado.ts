import { BrainError, brtDay, type Brain } from "./brain";
import { row, rows, run } from "./sql";
import { gscPainel } from "./gsc";
type Env = Record<string, string | undefined>;

/** Termos com que psicólogos e clínicas procuram o que a Synapsa vende. Mexa aqui para ampliar o radar. */
export const SEMENTES = [
  "sistema para psicólogo", "software para clínica de psicologia", "agenda para psicólogo", "prontuário psicólogo",
  "cobrança de pacientes psicólogo", "como atrair pacientes psicólogo", "psicólogo online", "gestão de clínica de psicologia", "inteligência artificial para psicólogos",
];
const VARIACOES = ["", " preço", " para"];
const DAY = 86_400_000;

/** Semana ISO simples (segunda a domingo), na data de Brasília. */
export function semanaDe(agora: number): string {
  const d = new Date(`${brtDay(agora)}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return brtDay(d.getTime() - dow * DAY);
}

async function sugestoes(f: typeof fetch, q: string): Promise<string[]> {
  const r = await f(`https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=br&q=${encodeURIComponent(q)}`, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!r.ok) throw new BrainError("invalid", `Autocomplete do Google respondeu ${r.status}.`);
  const j = (await r.json()) as [string, string[]];
  return (Array.isArray(j?.[1]) ? j[1] : []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
}

/** Uma vez por semana: guarda o que o Google sugere para cada termo. A diferença para a semana anterior é o que está subindo. */
export async function sincronizarMercado(brain: Brain, f: typeof fetch = fetch, opt: { forcar?: boolean } = {}): Promise<string> {
  const semana = semanaDe(brain.clock());
  if (!opt.forcar && row(brain.db, "select 1 as x from mercado_sugestoes where semana = ? limit 1", semana)) return "Radar do mercado já atualizado nesta semana.";
  let n = 0, falhas = 0;
  for (const semente of SEMENTES) {
    const vistos = new Set<string>();
    for (const v of VARIACOES) {
      try {
        (await sugestoes(f, semente + v)).forEach((s, i) => {
          if (vistos.has(s)) return;
          vistos.add(s);
          run(brain.db, "insert or replace into mercado_sugestoes (semana, semente, sugestao, pos) values (?, ?, ?, ?)", semana, semente, s, i);
          n++;
        });
      } catch { falhas++; }
    }
  }
  brain.setPolicy("mercado_estado", { ultima: brain.clock(), erro: n === 0 ? "O Google não devolveu sugestões. Tente de novo mais tarde." : null });
  if (!n) throw new BrainError("invalid", "O Google não devolveu sugestões. Tente de novo mais tarde.");
  brain.emit("change");
  return `Radar do mercado atualizado: ${n} buscas sugeridas${falhas ? ` (${falhas} consultas falharam)` : ""}.`;
}

export interface MercadoPainel {
  semana: string | null; ultima: number | null; erro: string | null;
  grupos: { semente: string; itens: { texto: string; nova: boolean }[] }[];
  novas: { texto: string; semente: string }[];
  /** Buscas que já trazem gente ao seu site e cresceram nas impressões. */
  subindo: { texto: string; site: string; impressoes: number; antes: number; posicao: number; cliques: number }[];
}

export function mercadoPainel(brain: Brain, env: Env): MercadoPainel {
  const est = brain.policy<{ ultima?: number | null; erro?: string | null }>("mercado_estado", {});
  const sem = row<{ semana: string }>(brain.db, "select max(semana) as semana from mercado_sugestoes")?.semana ?? null;
  const ant = sem ? row<{ semana: string }>(brain.db, "select max(semana) as semana from mercado_sugestoes where semana < ?", sem)?.semana ?? null : null;
  const atual = sem ? rows<{ semente: string; sugestao: string; pos: number }>(brain.db, "select semente, sugestao, pos from mercado_sugestoes where semana = ? order by semente, pos", sem) : [];
  const antes = new Set(ant ? rows<{ sugestao: string }>(brain.db, "select sugestao from mercado_sugestoes where semana = ?", ant).map((x) => x.sugestao) : []);
  const grupos = SEMENTES.map((semente) => ({ semente, itens: atual.filter((a) => a.semente === semente).map((a) => ({ texto: a.sugestao, nova: !!ant && !antes.has(a.sugestao) })) })).filter((g) => g.itens.length);
  const novas = ant ? atual.filter((a) => !antes.has(a.sugestao)).slice(0, 30).map((a) => ({ texto: a.sugestao, semente: a.semente })) : [];
  const subindo: MercadoPainel["subindo"] = [];
  try {
    for (const s of gscPainel(brain, env).sites) for (const q of s.queries) {
      const a = q.anterior?.impressions ?? 0;
      if (q.impressions >= 5 && q.impressions >= a * 1.5) subindo.push({ texto: q.chave, site: s.rotulo, impressoes: q.impressions, antes: a, posicao: Math.round(q.position * 10) / 10, cliques: q.clicks });
    }
  } catch { /* sem Search Console, só o radar do Google */ }
  subindo.sort((x, y) => y.impressoes - x.impressoes);
  return { semana: sem, ultima: est.ultima ?? null, erro: est.erro ?? null, grupos, novas, subindo: subindo.slice(0, 15) };
}
