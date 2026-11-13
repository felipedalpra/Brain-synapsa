// Projeção e indicadores do financeiro. Funções puras: recebem números, devolvem números.
import type { FinCenario, FinIndicadores, FinPremissas } from "@brain/shared";

const r2 = (n: number) => Math.round(n * 100) / 100;
export const HORIZONTE_MESES = 36;

function mesMais(ref: string, n: number): string {
  const [y, m] = ref.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

const CENARIOS = [
  { id: "conservador", label: "Conservador", novos: 0.5, churn: 1.5 },
  { id: "base", label: "Base", novos: 1, churn: 1 },
  { id: "otimista", label: "Otimista", novos: 1.5, churn: 0.5 },
] as const;

/**
 * Cada mês: MRR' = MRR − MRR×churn + novos×preço. Entradas = MRR; saídas = custo fixo + imposto sobre o MRR.
 * Os cenários só escalam novos clientes e churn da premissa base (conservador 0,5× / 1,5×; otimista 1,5× / 0,5×).
 */
export function projetar(mrrAtual: number, saldoInicial: number, mesRef: string, p: FinPremissas, meta: number): { meses: string[]; saldoInicial: number; cenarios: FinCenario[] } {
  const custo = p.custoMensal ?? p.custoMensalAuto;
  const meses = Array.from({ length: HORIZONTE_MESES }, (_, i) => mesMais(mesRef, i + 1));
  const cenarios = CENARIOS.map((c): FinCenario => {
    const novos = p.novosPorMes * c.novos;
    const churn = Math.min(0.99, p.churn * c.churn);
    let mrr = mrrAtual;
    let saldo = saldoInicial;
    const out: FinCenario = { id: c.id, label: c.label, novosPorMes: r2(novos), churn, mrr: [], entradas: [], saidas: [], saldo: [], mesDaMeta: null };
    meses.forEach((mes, i) => {
      mrr = mrr - mrr * churn + novos * p.precoNovo;
      const entradas = mrr;
      const saidas = custo + mrr * p.aliquotaImpostos;
      saldo += entradas - saidas;
      out.mrr.push(r2(mrr));
      out.entradas.push(r2(entradas));
      out.saidas.push(r2(saidas));
      out.saldo.push(r2(saldo));
      if (out.mesDaMeta === null && mrr >= meta) out.mesDaMeta = meses[i]!;
    });
    return out;
  });
  return { meses, saldoInicial: r2(saldoInicial), cenarios };
}

export interface IndicadoresIn {
  mrr: number;
  clientes: number;
  /** Série diária do MRR total (um ponto por dia, ordenada). */
  mrrSerie: { day: string; total: number }[];
  hoje: string;
  entradasMes: number;
  resultadoMes: number;
  churn: number;
  meta: { valor: number; data: string };
  gastoMarketing3m: number;
  clientesNovos3m: number | null;
}

function diaMenos(hoje: string, n: number): string {
  return new Date(Date.parse(`${hoje}T12:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10);
}

export function indicadores(i: IndicadoresIn): FinIndicadores {
  const notas: string[] = [];
  const ticket = i.clientes ? r2(i.mrr / i.clientes) : null;

  // Crescimento: MRR de hoje contra o último ponto registrado até 30 dias atrás.
  const alvo = diaMenos(i.hoje, 30);
  const base = [...i.mrrSerie].reverse().find((p) => p.day <= alvo);
  let cresc: number | null = null;
  if (base && base.total > 0) cresc = Math.round(((i.mrr - base.total) / base.total) * 1000) / 10;
  else notas.push("Crescimento de 30 dias aparece quando o histórico de MRR tiver 30 dias.");

  const margem = i.entradasMes > 0 ? Math.round((i.resultadoMes / i.entradasMes) * 1000) / 10 : null;

  // LTV = ticket ÷ churn mensal. CAC só existe com gasto de aquisição E clientes novos conhecidos.
  const ltv = ticket !== null && i.churn > 0 ? r2(ticket / i.churn) : null;
  let cac: number | null = null;
  if (i.gastoMarketing3m > 0 && i.clientesNovos3m && i.clientesNovos3m > 0) cac = r2(i.gastoMarketing3m / i.clientesNovos3m);
  else notas.push("CAC precisa de gasto em Marketing e Vendas pago e de clientes novos contados no período.");
  const ltvCac = ltv !== null && cac ? Math.round((ltv / cac) * 10) / 10 : null;
  const payback = cac !== null && ticket ? Math.round((cac / ticket) * 10) / 10 : null;
  notas.push(`LTV usa o churn de ${Math.round(i.churn * 1000) / 10}% ao mês das premissas, não um churn medido.`);

  return {
    mrr: r2(i.mrr),
    arr: r2(i.mrr * 12),
    clientesAtivos: i.clientes,
    ticketMedio: ticket,
    crescimentoMrr30dPct: cresc,
    margemMesPct: margem,
    cac,
    ltv,
    ltvCac,
    paybackMeses: payback,
    mrrSerie: i.mrrSerie,
    metaMrr: { valor: i.meta.valor, data: i.meta.data, falta: r2(Math.max(0, i.meta.valor - i.mrr)) },
    notas,
  };
}
