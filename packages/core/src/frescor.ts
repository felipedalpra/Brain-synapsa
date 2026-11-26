// Frescor dos dados: o Brain puxa cada fonte sozinho, no intervalo dela, sem botão.
// Cada fonte tem seu intervalo e roda em uma execução própria (o Workers limita as chamadas externas por execução),
// então um alarme atende a fonte mais atrasada e pede outro alarme se ainda houver atraso.
import type { Brain } from "./brain";
import { sincronizarGsc } from "./gsc";
import { sincronizarGa } from "./ga";
import { sincronizar as instinctSincronizar } from "./instinct";
import { refreshDados } from "./data";
import { sincronizarMidia } from "./midia-sync";
import { sincronizarMercado, sincronizarPacientes } from "./mercado";
import { crmPainel } from "./crm-painel";

type Env = Record<string, string | undefined>;

export interface FonteFrescor {
  id: string;
  nome: string;
  /** Intervalo entre leituras, em minutos. */
  cada: number;
  rodar: (brain: Brain, env: Env) => Promise<unknown>;
  /** Só roda se a fonte estiver ligada (chave presente). */
  ativa?: (env: Env) => boolean;
}

export const FONTES: FonteFrescor[] = [
  { id: "instinct", nome: "Instinct (planilha)", cada: 30, rodar: (b, e) => instinctSincronizar(b, e, fetch as typeof fetch) },
  {
    id: "meta",
    nome: "Meta Ads e Instagram",
    cada: 60,
    ativa: (e) => Boolean(e.META_SYSTEM_USER_TOKEN),
    rodar: async (b, e) => { await refreshDados(b, e); await sincronizarMidia(b, e, { dias: 14 }); b.setPolicy("midia_ultima_leitura", new Date(b.clock()).toISOString().slice(0, 10)); },
  },
  { id: "crm", nome: "CRM", cada: 30, rodar: (b, e) => crmPainel(e as never, b.clock(), fetch as typeof fetch, { atualizar: true }) },
  // Search Console e GA4 têm atraso de 1 a 2 dias na origem: a cada 6 horas basta.
  { id: "gsc", nome: "Search Console", cada: 360, rodar: (b, e) => sincronizarGsc(b, e, fetch as typeof fetch, { forcar: true }) },
  { id: "ga", nome: "Google Analytics", cada: 360, rodar: (b, e) => sincronizarGa(b, e, fetch as typeof fetch, { forcar: true }) },
  // Semanais: as próprias funções ignoram se já rodaram na semana.
  { id: "mercado", nome: "Radar do mercado", cada: 720, rodar: (b) => sincronizarMercado(b) },
  { id: "pacientes", nome: "Buscas por terapia", cada: 720, rodar: (b) => sincronizarPacientes(b) },
];

const chave = (id: string) => `fresco_${id}`;
interface Marca { ok: number; tentou: number; erro?: string }
const marca = (b: Brain, id: string): Marca => b.policy<Marca>(chave(id), { ok: 0, tentou: 0 });

/** Quanto falta (ms) para a fonte vencer; ≤ 0 = atrasada. Depois de erro, tenta de novo em 10 min, não a cada alarme. */
function falta(b: Brain, f: FonteFrescor, agora: number): number {
  const m = marca(b, f.id);
  if (m.erro && m.tentou > m.ok) return m.tentou + 10 * 60_000 - agora;
  return m.ok + f.cada * 60_000 - agora;
}

/** Atende a fonte mais atrasada (uma por execução). Devolve quanto falta, em ms, para a próxima fonte vencer. */
export async function atualizarDados(brain: Brain, env: Env): Promise<{ rodou: string | null; proxima: number }> {
  const agora = brain.clock();
  const lig = FONTES.filter((f) => !f.ativa || f.ativa(env));
  const atrasadas = lig.filter((f) => falta(brain, f, agora) <= 0).sort((a, b) => falta(brain, a, agora) - falta(brain, b, agora));
  let rodou: string | null = null;
  const f = atrasadas[0];
  if (f) {
    rodou = f.id;
    const m = marca(brain, f.id);
    try {
      await f.rodar(brain, env);
      brain.setPolicy(chave(f.id), { ok: agora, tentou: agora });
    } catch (e) {
      brain.setPolicy(chave(f.id), { ...m, tentou: agora, erro: e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200) });
    }
  }
  const depois = brain.clock();
  const faltas = lig.map((x) => falta(brain, x, depois));
  return { rodou, proxima: Math.max(Math.min(...faltas), 1_000) };
}

/** Para o painel: quando cada fonte foi atualizada pela última vez. */
export function estadoFrescor(brain: Brain, env: Env) {
  const agora = brain.clock();
  const fontes = FONTES.filter((f) => !f.ativa || f.ativa(env)).map((f) => {
    const m = marca(brain, f.id);
    return { id: f.id, nome: f.nome, ultimo: m.ok || null, erro: m.erro && m.tentou > m.ok ? m.erro : null, cadaMin: f.cada, atrasada: falta(brain, f, agora) <= 0 };
  });
  const lidos = fontes.map((x) => x.ultimo).filter((x): x is number => Boolean(x));
  return { fontes, maisAntigo: lidos.length ? Math.min(...lidos) : null, haAtraso: fontes.some((x) => x.atrasada) };
}
