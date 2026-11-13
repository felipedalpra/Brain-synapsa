// Leitura do extrato do Banco Inter. Aceita o texto do PDF (layout "29 de Setembro de 2026 … Valor … Saldo")
// e o CSV (Data;Histórico;Descrição;Valor;Saldo). Só lê: quem grava é finImportarExtrato.
import type { ExtratoIn } from "./fin";
import { row, rows, type Db } from "./sql";
import { BrainError } from "./brain";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const r2 = (n: number) => Math.round(n * 100) / 100;

const brNum = (t: string): number => {
  const neg = /-/.test(t);
  const n = Number(t.replace(/[^\d,]/g, "").replace(",", "."));
  return neg ? -n : n;
};

export interface ExtratoLido {
  itens: ExtratoIn[];
  saldoFinal: number | null;
  periodo: { de: string; ate: string } | null;
}

/** Descrição limpa: tira o código "Cp :123-" que o Inter coloca antes do nome e aspas. */
function limpa(tipo: string, resto: string): string {
  const r = resto.replace(/^"|"$/g, "").replace(/^Cp\s*:\s*\d+-/i, "").trim();
  return (r ? `${tipo} - ${r}` : tipo).replace(/\s+/g, " ").slice(0, 200);
}

export function lerExtratoInterTexto(texto: string): ExtratoLido {
  const itens: ExtratoIn[] = [];
  let dia: string | null = null;
  const saldo = /Saldo total\s*\n?\s*(?:.*\n)?\s*R\$\s*([\d.]+,\d{2})/.exec(texto);
  const per = /Per[ií]odo:\s*(\d{2})\/(\d{2})\/(\d{4})\s*a\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(texto);
  for (const bruta of texto.split(/\r?\n/)) {
    const l = bruta.trim();
    if (!l) continue;
    const d = /^(\d{1,2}) de ([A-Za-zçÇ]+) de (\d{4})\b/.exec(l);
    if (d) {
      const m = MESES.indexOf(d[2]!.toLowerCase());
      if (m < 0) throw new BrainError("invalid", `Mês não reconhecido no extrato: "${d[2]}".`);
      dia = `${d[3]}-${String(m + 1).padStart(2, "0")}-${d[1]!.padStart(2, "0")}`;
      continue;
    }
    // Linha de lançamento: ... -R$ 157,00   R$ 1.238,62  (valor e saldo por transação)
    const t = /^(.*?)\s+(-?)R\$\s*([\d.]+,\d{2})\s+(-?)R\$\s*([\d.]+,\d{2})\s*$/.exec(l);
    if (!t || !dia) continue;
    const valor = r2((t[2] ? -1 : 1) * brNum(t[3]!));
    const corpo = t[1]!.trim();
    const q = /^([^":]+?):?\s*"(.*)"$/.exec(corpo);
    itens.push({ data: dia, descricao: q ? limpa(q[1]!.trim(), q[2]!) : limpa(corpo, ""), valor });
  }
  return {
    itens,
    saldoFinal: saldo ? brNum(saldo[1]!) : null,
    periodo: per ? { de: `${per[3]}-${per[2]}-${per[1]}`, ate: `${per[6]}-${per[5]}-${per[4]}` } : null,
  };
}

export function lerExtratoInterCsv(texto: string): ExtratoLido {
  const itens: ExtratoIn[] = [];
  for (const bruta of texto.split(/\r?\n/)) {
    const c = bruta.split(";").map((x) => x.trim().replace(/^"|"$/g, ""));
    if (c.length < 4) continue;
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(c[0]!);
    if (!m) continue;
    const valorTxt = c[c.length - 2]!;
    if (!/\d/.test(valorTxt)) continue;
    const hist = c[1] ?? "";
    const desc = c.length >= 5 ? c.slice(2, c.length - 2).join(" ") : "";
    itens.push({ data: `${m[3]}-${m[2]}-${m[1]}`, descricao: limpa(hist || "Lançamento", desc), valor: r2(brNum(valorTxt)) });
  }
  return { itens, saldoFinal: null, periodo: null };
}

export function lerExtratoInter(texto: string): ExtratoLido {
  if (texto.length > 1_500_000) throw new BrainError("invalid", "Arquivo grande demais para um extrato.");
  const r = /Per[ií]odo:|de Setembro|\d{1,2} de [A-Za-zç]+ de \d{4}/.test(texto) ? lerExtratoInterTexto(texto) : lerExtratoInterCsv(texto);
  if (!r.itens.length) throw new BrainError("invalid", "Não encontrei lançamentos nesse arquivo. Use o extrato do Inter em PDF (texto) ou CSV.");
  return r;
}

export interface ResumoImportacao {
  lidos: number;
  novos: number;
  jaExistiam: number;
  saldoDoExtrato: number | null;
  saldoNoBrain: number;
  confere: boolean | null;
}

/**
 * Importa sem duplicar o que já veio da planilha: um lançamento do arquivo é "já existente" quando há um
 * lançamento no Brain com a mesma data e o mesmo valor ainda não usado. A descrição do banco não é comparada,
 * porque a planilha usa nomes próprios.
 */
export function finImportarExtrato(db: Db, agora: number, lido: ExtratoLido, adicionar: (novos: ExtratoIn[]) => void): ResumoImportacao {
  const existentes = rows<{ data: string; valor: number }>(db, "select data, valor from fin_extrato");
  const usados = new Map<string, number>();
  for (const e of existentes) usados.set(`${e.data}|${r2(e.valor)}`, (usados.get(`${e.data}|${r2(e.valor)}`) ?? 0) + 1);
  const novos: ExtratoIn[] = [];
  for (const it of lido.itens) {
    const k = `${it.data}|${r2(it.valor)}`;
    const n = usados.get(k) ?? 0;
    if (n > 0) usados.set(k, n - 1);
    else novos.push(it);
  }
  if (novos.length) adicionar(novos);
  const s = row<{ s: number | null }>(db, "select sum(valor) as s from fin_extrato");
  const saldo = r2(s?.s ?? 0);
  return { lidos: lido.itens.length, novos: novos.length, jaExistiam: lido.itens.length - novos.length, saldoDoExtrato: lido.saldoFinal, saldoNoBrain: saldo, confere: lido.saldoFinal === null ? null : Math.abs(saldo - lido.saldoFinal) < 0.005 };
}
