// Financeiro do Brain: extrato do Inter (caixa real), contas a pagar e a receber, DRE e alertas.
// Tudo calculado de fatos lançados. Nada aqui fala com banco nem move dinheiro.
import type { FinFluxo, FinFluxoDia, FinAlerta, FinCobranca, FinConta, FinExtratoItem, FinPainel, FinPremissas } from "@brain/shared";
import { projetar, indicadores } from "./fin-proj";
import { BrainError, brtDay } from "./brain";
import { mrrBySource, isActive } from "./mrr";
import type { SubscriptionRow } from "./types";
import { row, rows, run, tx, type Db } from "./sql";

export const CATEGORIAS_RECEITA = ["Recorrência (Mensalidade)", "Implementação/Setup", "Outras Receitas"];
export const CATEGORIAS_DESPESA = ["Custos Diretos (CMV)", "Pessoal", "Marketing e Vendas", "Tecnologia/Ferramentas", "Administrativas", "Financeiras", "Impostos e Taxas", "Outras Despesas"];

const r2 = (n: number) => Math.round(n * 100) / 100;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const DIA = 86_400_000;

/** "Impostos" e "Impostos e Taxas" são a mesma coisa. Categoria desconhecida vira Outras. */
export function categoria(c: string | null | undefined, entrada: boolean): string {
  const t = (c ?? "").trim();
  if (entrada) return CATEGORIAS_RECEITA.find((x) => x.toLowerCase() === t.toLowerCase()) ?? "Outras Receitas";
  if (t.toLowerCase() === "impostos") return "Impostos e Taxas";
  return CATEGORIAS_DESPESA.find((x) => x.toLowerCase() === t.toLowerCase()) ?? "Outras Despesas";
}

const diaMs = (d: string) => Date.parse(`${d}T12:00:00-03:00`);
const mesDe = (d: string) => d.slice(0, 7);
function somaMeses(d: string, n: number): string {
  const [y, m, dia] = d.split("-").map(Number) as [number, number, number];
  const alvo = new Date(Date.UTC(y, m - 1 + n, 1));
  const ult = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  return `${alvo.getUTCFullYear()}-${String(alvo.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(dia, ult)).padStart(2, "0")}`;
}
const nomeMes = (ref: string) => {
  const [y, m] = ref.split("-") as [string, string];
  return `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(m) - 1]}/${y.slice(2)}`;
};

// ---- Configuração ---------------------------------------------------------

const PREMISSAS_PADRAO = { novos_por_mes: 2, preco_novo: 49, churn: 0.05 };

function cfgNum(db: Db, chave: string): number | null {
  const a = row<{ valor: string }>(db, "select valor from fin_config where chave = ?", chave);
  if (!a || a.valor === "") return null;
  const n = Number(a.valor);
  return Number.isFinite(n) ? n : null;
}

export function finConfig(db: Db): { aliquotaImpostos: number } {
  const n = cfgNum(db, "aliquota_impostos") ?? 0.16;
  return { aliquotaImpostos: n >= 0 && n < 1 ? n : 0.16 };
}

export function finSetAliquota(db: Db, aliquota: number): void {
  if (!(aliquota >= 0 && aliquota < 1)) throw new BrainError("invalid", "A alíquota é um número entre 0 e 1 (ex.: 0,16 para 16%).");
  run(db, "insert into fin_config (chave, valor) values ('aliquota_impostos', ?) on conflict(chave) do update set valor = excluded.valor", String(aliquota));
}

/** Premissas da projeção. `custoMensal` null = usar a média real (custoMensalAuto). */
export function finPremissas(db: Db, custoMensalAuto: number): FinPremissas {
  const novos = cfgNum(db, "novos_por_mes");
  const preco = cfgNum(db, "preco_novo");
  const churn = cfgNum(db, "churn");
  return {
    novosPorMes: novos !== null && novos >= 0 ? novos : PREMISSAS_PADRAO.novos_por_mes,
    precoNovo: preco !== null && preco > 0 ? preco : PREMISSAS_PADRAO.preco_novo,
    churn: churn !== null && churn >= 0 && churn < 1 ? churn : PREMISSAS_PADRAO.churn,
    custoMensal: cfgNum(db, "custo_mensal"),
    custoMensalAuto,
    aliquotaImpostos: finConfig(db).aliquotaImpostos,
  };
}

export function finSetPremissas(db: Db, p: Partial<{ novosPorMes: number; precoNovo: number; churn: number; custoMensal: number | null; aliquotaImpostos: number }>): void {
  const put = (k: string, v: string) => run(db, "insert into fin_config (chave, valor) values (?, ?) on conflict(chave) do update set valor = excluded.valor", k, v);
  if (p.novosPorMes !== undefined) {
    if (!(p.novosPorMes >= 0 && p.novosPorMes <= 200)) throw new BrainError("invalid", "Novos clientes por mês: número entre 0 e 200.");
    put("novos_por_mes", String(p.novosPorMes));
  }
  if (p.precoNovo !== undefined) {
    if (!(p.precoNovo > 0 && p.precoNovo <= 10_000)) throw new BrainError("invalid", "Preço do plano: valor positivo.");
    put("preco_novo", String(p.precoNovo));
  }
  if (p.churn !== undefined) {
    if (!(p.churn >= 0 && p.churn < 1)) throw new BrainError("invalid", "Churn mensal: número entre 0 e 1 (ex.: 0,05 para 5%).");
    put("churn", String(p.churn));
  }
  if (p.custoMensal !== undefined) {
    if (p.custoMensal !== null && !(p.custoMensal >= 0 && p.custoMensal <= 10_000_000)) throw new BrainError("invalid", "Custo mensal: valor positivo, ou vazio para usar a média real.");
    put("custo_mensal", p.custoMensal === null ? "" : String(p.custoMensal));
  }
  if (p.aliquotaImpostos !== undefined) finSetAliquota(db, p.aliquotaImpostos);
}

// ---- Cobranças recorrentes (mensalidades esperadas) ------------------------

export function finCobrancas(db: Db): FinCobranca[] {
  return rows<{ id: number; nome: string; valor: number; dia: number; forma: string; ativa: number }>(db, "select id, nome, valor, dia, forma, ativa from fin_cobrancas order by nome, id").map((c) => ({ ...c, ativa: c.ativa === 1 }));
}

export function finAddCobranca(db: Db, agora: number, c: { nome: string; valor: number; dia: number; forma?: string }): void {
  const nome = (c.nome ?? "").trim();
  if (!nome || nome.length > 120) throw new BrainError("invalid", "Dê um nome para a cobrança (até 120 caracteres).");
  if (!(c.valor > 0 && c.valor <= 1_000_000)) throw new BrainError("invalid", "O valor da cobrança é positivo.");
  if (!Number.isInteger(c.dia) || c.dia < 1 || c.dia > 31) throw new BrainError("invalid", "O dia da cobrança vai de 1 a 31 (em mês curto vale o último dia).");
  run(db, "insert into fin_cobrancas (nome, valor, dia, forma, ativa, criado_em) values (?, ?, ?, ?, 1, ?)", nome, r2(c.valor), c.dia, (c.forma ?? "pix").slice(0, 20), agora);
}

export function finSetCobranca(db: Db, id: number, ativa: boolean): void {
  if (!row(db, "select id from fin_cobrancas where id = ?", id)) throw new BrainError("not_found", "Cobrança não encontrada.");
  run(db, "update fin_cobrancas set ativa = ? where id = ?", ativa ? 1 : 0, id);
}

/** Remove a cobrança e as mensalidades futuras ainda não recebidas que ela gerou. */
export function finRemoverCobranca(db: Db, id: number): void {
  if (!row(db, "select id from fin_cobrancas where id = ?", id)) throw new BrainError("not_found", "Cobrança não encontrada.");
  tx(db, () => {
    run(db, "delete from fin_contas where grupo = ? and pago_em is null", `cob:${id}`);
    run(db, "delete from fin_cobrancas where id = ?", id);
  });
}

/** Garante a conta a receber do mês atual e dos 2 próximos para cada cobrança ativa. Idempotente. */
export function gerarCobrancas(db: Db, agora: number): number {
  const hoje = brtDay(agora);
  let n = 0;
  for (const c of finCobrancas(db).filter((x) => x.ativa)) {
    for (let k = 0; k < 3; k++) {
      const venc = somaMeses(`${mesDe(hoje)}-${String(c.dia).padStart(2, "0")}`, k);
      const jaTem = row(db, "select id from fin_contas where grupo = ? and substr(vencimento, 1, 7) = ?", `cob:${c.id}`, mesDe(venc));
      if (jaTem) continue;
      run(db, "insert into fin_contas (tipo, descricao, contraparte, categoria, vencimento, valor, pago_em, grupo, obs, criado_em) values ('receber', ?, ?, 'Recorrência (Mensalidade)', ?, ?, null, ?, ?, ?)", c.nome, c.nome, venc, c.valor, `cob:${c.id}`, `Cobrança recorrente (${c.forma})`, agora);
      n++;
    }
  }
  if (n) conciliar(db);
  return n;
}

// ---- Lançamento avulso no caixa -------------------------------------------

/** Entrada ou saída que não veio do extrato (dinheiro em espécie, ajuste). Conta no caixa e no resultado como qualquer lançamento. */
export function finAddManual(db: Db, agora: number, x: ExtratoIn): void {
  const v = validarExtrato(x, 0);
  run(db, "insert into fin_extrato (data, descricao, valor, categoria, fonte, hash, conta_id, criado_em) values (?, ?, ?, ?, 'avulso', ?, null, ?)", v.data, v.descricao, v.valor, v.categoria ?? null, `manual:${crypto.randomUUID()}`, agora);
  conciliar(db);
}

export function finRemoverManual(db: Db, id: number): void {
  const e = row<{ fonte: string; conta_id: number | null }>(db, "select fonte, conta_id from fin_extrato where id = ?", id);
  if (!e) throw new BrainError("not_found", "Lançamento não encontrado.");
  if (e.fonte !== "avulso") throw new BrainError("invalid", "Só lançamentos avulsos podem ser removidos aqui; os do extrato vêm do banco.");
  tx(db, () => {
    if (e.conta_id) run(db, "update fin_contas set extrato_id = null where id = ?", e.conta_id);
    run(db, "delete from fin_extrato where id = ?", id);
  });
}

// ---- Entrada de dados -----------------------------------------------------

export interface ExtratoIn {
  data: string;
  descricao: string;
  valor: number;
  categoria?: string | null;
}
export interface ContaIn {
  tipo: "pagar" | "receber";
  descricao: string;
  contraparte?: string | null;
  categoria: string;
  vencimento: string;
  valor?: number | null;
  pagoEm?: string | null;
  obs?: string | null;
  /** Repetir por N meses (inclui o primeiro). */
  recorrenciaMeses?: number;
}

function validarExtrato(x: ExtratoIn, i: number): ExtratoIn {
  if (!x || typeof x !== "object") throw new BrainError("invalid", `Extrato linha ${i + 1}: formato inválido.`);
  if (!DATA.test(String(x.data))) throw new BrainError("invalid", `Extrato linha ${i + 1}: data precisa ser AAAA-MM-DD.`);
  if (typeof x.valor !== "number" || !Number.isFinite(x.valor) || x.valor === 0) throw new BrainError("invalid", `Extrato linha ${i + 1}: valor inválido.`);
  const d = String(x.descricao ?? "").trim().slice(0, 200);
  if (!d) throw new BrainError("invalid", `Extrato linha ${i + 1}: falta a descrição.`);
  return { data: x.data, descricao: d, valor: r2(x.valor), categoria: x.categoria ?? null };
}

function validarConta(c: ContaIn, i: number): ContaIn {
  const p = `Conta ${i + 1}`;
  if (!c || typeof c !== "object") throw new BrainError("invalid", `${p}: formato inválido.`);
  if (c.tipo !== "pagar" && c.tipo !== "receber") throw new BrainError("invalid", `${p}: tipo precisa ser "pagar" ou "receber".`);
  const desc = String(c.descricao ?? "").trim().slice(0, 200);
  if (!desc) throw new BrainError("invalid", `${p}: falta a descrição.`);
  if (!DATA.test(String(c.vencimento))) throw new BrainError("invalid", `${p}: vencimento precisa ser AAAA-MM-DD.`);
  if (c.pagoEm != null && !DATA.test(String(c.pagoEm))) throw new BrainError("invalid", `${p}: data de pagamento precisa ser AAAA-MM-DD.`);
  if (c.valor != null && (typeof c.valor !== "number" || !Number.isFinite(c.valor) || c.valor <= 0)) throw new BrainError("invalid", `${p}: o valor é um número positivo (sem sinal).`);
  const n = c.recorrenciaMeses ?? 1;
  if (!Number.isInteger(n) || n < 1 || n > 60) throw new BrainError("invalid", `${p}: recorrência de 1 a 60 meses.`);
  return { ...c, descricao: desc, valor: c.valor == null ? null : r2(c.valor), recorrenciaMeses: n, categoria: categoria(c.categoria, c.tipo === "receber") };
}

/** Insere lançamentos do extrato. Importar o mesmo arquivo de novo não duplica. */
export function finAddExtrato(db: Db, agora: number, itens: ExtratoIn[], fonte = "manual"): { novos: number; repetidos: number } {
  if (!Array.isArray(itens) || itens.length === 0) throw new BrainError("invalid", "Nenhum lançamento para importar.");
  if (itens.length > 5000) throw new BrainError("invalid", "Importe no máximo 5.000 lançamentos por vez.");
  const ok = itens.map(validarExtrato);
  let novos = 0;
  tx(db, () => {
    const visto = new Map<string, number>();
    for (const x of ok) {
      const base = `${x.data}|${x.valor.toFixed(2)}|${x.descricao.toLowerCase()}`;
      const n = (visto.get(base) ?? 0) + 1; // dois Pix iguais no mesmo dia são dois lançamentos
      visto.set(base, n);
      const hash = `${base}#${n}`;
      if (row(db, "select id from fin_extrato where hash = ?", hash)) continue;
      run(db, "insert into fin_extrato (data, descricao, valor, categoria, fonte, hash, criado_em) values (?, ?, ?, ?, ?, ?, ?)", x.data, x.descricao, x.valor, x.valor > 0 ? categoria(x.categoria, true) : categoria(x.categoria, false), fonte, hash, agora);
      novos++;
    }
  });
  return { novos, repetidos: ok.length - novos };
}

/** Cria a conta (e as repetições mensais, se houver). Devolve quantas linhas nasceram. */
export function finAddConta(db: Db, agora: number, entrada: ContaIn): { criadas: number } {
  const c = validarConta(entrada, 0);
  const n = c.recorrenciaMeses ?? 1;
  const grupo = n > 1 ? crypto.randomUUID() : null;
  let criadas = 0;
  tx(db, () => {
    for (let k = 0; k < n; k++) {
      const venc = somaMeses(c.vencimento, k);
      const dup = row(db, "select id from fin_contas where tipo = ? and descricao = ? and vencimento = ? and coalesce(valor, -1) = coalesce(?, -1)", c.tipo, c.descricao, venc, c.valor ?? null);
      if (dup) continue;
      run(db, "insert into fin_contas (tipo, descricao, contraparte, categoria, vencimento, valor, pago_em, grupo, obs, criado_em) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", c.tipo, c.descricao, c.contraparte ?? null, c.categoria, venc, c.valor ?? null, k === 0 ? (c.pagoEm ?? null) : null, grupo, c.obs ?? null, agora);
      criadas++;
    }
  });
  return { criadas };
}

/** Marca como pago/recebido. O valor real pode diferir do previsto (ex.: Stripe líquido). */
export function finPagarConta(db: Db, id: number, pagoEm: string, valor?: number): void {
  if (!DATA.test(pagoEm)) throw new BrainError("invalid", "A data precisa ser AAAA-MM-DD.");
  const c = row<{ id: number; valor: number | null }>(db, "select id, valor from fin_contas where id = ?", id);
  if (!c) throw new BrainError("not_found", "Conta não encontrada.");
  if (valor !== undefined && (!Number.isFinite(valor) || valor <= 0)) throw new BrainError("invalid", "O valor é um número positivo.");
  run(db, "update fin_contas set pago_em = ?, valor = ? where id = ?", pagoEm, valor !== undefined ? r2(valor) : c.valor, id);
  conciliar(db);
}

export function finDesfazerPagamento(db: Db, id: number): void {
  const c = row<{ extrato_id: number | null }>(db, "select extrato_id from fin_contas where id = ?", id);
  if (!c) throw new BrainError("not_found", "Conta não encontrada.");
  tx(db, () => {
    if (c.extrato_id) run(db, "update fin_extrato set conta_id = null where id = ?", c.extrato_id);
    run(db, "update fin_contas set pago_em = null, extrato_id = null where id = ?", id);
  });
}

export function finRemoverConta(db: Db, id: number): void {
  const c = row<{ extrato_id: number | null }>(db, "select extrato_id from fin_contas where id = ?", id);
  if (!c) throw new BrainError("not_found", "Conta não encontrada.");
  tx(db, () => {
    if (c.extrato_id) run(db, "update fin_extrato set conta_id = null where id = ?", c.extrato_id);
    run(db, "delete from fin_contas where id = ?", id);
  });
}

/**
 * Liga lançamentos do extrato às contas: mesmo valor (ao centavo), mesmo sentido, até 7 dias de distância.
 * Quem tem data de pagamento compara com ela; quem não tem, com o vencimento. O mais próximo vence.
 */
export function conciliar(db: Db): number {
  const ext = rows<{ id: number; data: string; valor: number }>(db, "select id, data, valor from fin_extrato where conta_id is null order by data, id");
  const contas = rows<{ id: number; tipo: string; valor: number; ref: string; pago: number }>(db, "select id, tipo, valor, coalesce(pago_em, vencimento) as ref, case when pago_em is null then 0 else 1 end as pago from fin_contas where extrato_id is null and valor is not null");
  const usadas = new Set<number>();
  let n = 0;
  tx(db, () => {
    for (const e of ext) {
      const tipo = e.valor > 0 ? "receber" : "pagar";
      let melhor: (typeof contas)[number] | null = null;
      let dist = Infinity;
      for (const c of contas) {
        if (usadas.has(c.id) || c.tipo !== tipo || Math.round(c.valor * 100) !== Math.round(Math.abs(e.valor) * 100)) continue;
        const d = Math.abs(diaMs(c.ref) - diaMs(e.data)) / DIA;
        if (d <= 7 && d < dist) {
          melhor = c;
          dist = d;
        }
      }
      if (!melhor) continue;
      usadas.add(melhor.id);
      run(db, "update fin_contas set extrato_id = ?, pago_em = coalesce(pago_em, ?) where id = ?", e.id, e.data, melhor.id);
      run(db, "update fin_extrato set conta_id = ? where id = ?", melhor.id, e.id);
      n++;
    }
  });
  return n;
}

// ---- Leitura --------------------------------------------------------------

interface ContaRow {
  id: number;
  tipo: "pagar" | "receber";
  descricao: string;
  contraparte: string | null;
  categoria: string;
  vencimento: string;
  valor: number | null;
  pago_em: string | null;
  extrato_id: number | null;
  grupo: string | null;
  obs: string | null;
}
interface ExtRow {
  id: number;
  data: string;
  descricao: string;
  valor: number;
  categoria: string | null;
  conta_id: number | null;
  fonte: string;
}

export function finPainel(db: Db, agora: number): FinPainel {
  const hoje = brtDay(agora);
  const mesRef = mesDe(hoje);
  gerarCobrancas(db, agora);
  const ext = rows<ExtRow>(db, "select id, data, descricao, valor, categoria, conta_id, fonte from fin_extrato order by data, id");
  const contas = rows<ContaRow>(db, "select id, tipo, descricao, contraparte, categoria, vencimento, valor, pago_em, extrato_id, grupo, obs from fin_contas order by vencimento, id");
  const cfg = finConfig(db);

  const view = (c: ContaRow): FinConta => ({
    id: c.id,
    tipo: c.tipo,
    descricao: c.descricao,
    contraparte: c.contraparte,
    categoria: c.categoria,
    vencimento: c.vencimento,
    valor: c.valor,
    pagoEm: c.pago_em,
    foraDoInter: c.pago_em !== null && c.extrato_id === null,
    status: c.pago_em ? "pago" : c.vencimento < hoje ? "atrasado" : "pendente",
    recorrente: c.grupo !== null,
    cobranca: c.grupo !== null && c.grupo.startsWith("cob:"),
    obs: c.obs,
  });

  const saldoInter = r2(ext.reduce((s, e) => s + e.valor, 0));
  const ultimo = ext.length ? ext[ext.length - 1]!.data : null;

  // Fluxo por mês. Receita: o que entrou no extrato. Despesa: o que foi pago (contas) + saídas do extrato sem conta.
  type Mov = { data: string; valor: number; cat: string };
  const entradas: Mov[] = ext.filter((e) => e.valor > 0).map((e) => ({ data: e.data, valor: e.valor, cat: categoria(e.categoria, true) }));
  const despesas: Mov[] = [
    ...contas.filter((c) => c.tipo === "pagar" && c.pago_em && c.valor).map((c) => ({ data: c.pago_em!, valor: c.valor!, cat: categoria(c.categoria, false) })),
    ...ext.filter((e) => e.valor < 0 && e.conta_id === null).map((e) => ({ data: e.data, valor: -e.valor, cat: categoria(e.categoria, false) })),
  ];
  // Recebimentos marcados como recebidos sem lançamento no extrato (ex.: dinheiro fora do Inter) também são receita.
  for (const c of contas) if (c.tipo === "receber" && c.pago_em && c.valor && c.extrato_id === null) entradas.push({ data: c.pago_em, valor: c.valor, cat: categoria(c.categoria, true) });

  const meses = (n: number) => {
    const out: string[] = [];
    for (let i = n - 1; i >= 0; i--) out.push(mesDe(somaMeses(`${mesRef}-01`, -i)));
    return out;
  };
  const soma = (l: Mov[], mes: string, cat?: string) => r2(l.filter((m) => mesDe(m.data) === mes && (!cat || m.cat === cat)).reduce((s, m) => s + m.valor, 0));

  const serie = meses(6).map((m) => ({ mes: m, entradas: soma(entradas, m), saidas: soma(despesas, m), resultado: r2(soma(entradas, m) - soma(despesas, m)) }));
  const atual = serie[serie.length - 1]!;

  const mDre = meses(12);
  const linha = (label: string, tipo: "receita" | "despesa" | "total", f: (m: string) => number) => ({ label, tipo, valores: mDre.map(f) });
  const recBruta = (m: string) => soma(entradas, m);
  const imp = (m: string) => soma(despesas, m, "Impostos e Taxas");
  const dre = {
    meses: mDre.map(nomeMes),
    linhas: [
      ...CATEGORIAS_RECEITA.map((c) => linha(c, "receita", (m) => soma(entradas, m, c))),
      linha("Receita bruta", "total", recBruta),
      linha("(-) Impostos e Taxas", "despesa", imp),
      linha("Receita líquida", "total", (m) => r2(recBruta(m) - imp(m))),
      ...CATEGORIAS_DESPESA.filter((c) => c !== "Impostos e Taxas").map((c) => linha(`(-) ${c}`, "despesa", (m) => soma(despesas, m, c))),
      linha("Resultado", "total", (m) => r2(recBruta(m) - soma(despesas, m))),
    ],
  };

  // Fôlego: saldo do Inter contra a despesa média dos últimos 3 meses fechados.
  const fechados = meses(4).slice(0, 3).filter((m) => soma(despesas, m) > 0 || soma(entradas, m) > 0);
  const despesaMedia = fechados.length ? r2(fechados.reduce((s, m) => s + soma(despesas, m), 0) / fechados.length) : 0;
  const mesesDeCaixa = despesaMedia > 0 ? Math.round((saldoInter / despesaMedia) * 10) / 10 : null;

  // MRR vem das assinaturas (Stripe + Pix informado), a mesma fonte do dashboard.
  const subs = rows<SubscriptionRow>(db, "select source, external_id, professional_id, label, list_price_brl, effective_price_brl, discount_ends_at, status from subscriptions");
  const { total: mrr } = mrrBySource(subs);
  const ativos = subs.filter(isActive).length;

  const pendentes = contas.filter((c) => !c.pago_em).map(view);
  const aPagar = pendentes.filter((c) => c.tipo === "pagar");
  const aReceber = pendentes.filter((c) => c.tipo === "receber");
  const em30 = brtDay(agora + 30 * DIA);
  const soma30 = (l: FinConta[]) => r2(l.filter((c) => c.vencimento <= em30).reduce((s, c) => s + (c.valor ?? 0), 0));

  const foraMes = contas.filter((c) => c.tipo === "pagar" && c.pago_em && c.extrato_id === null && mesDe(c.pago_em) === mesRef).reduce((s, c) => s + (c.valor ?? 0), 0);
  const foraTotal = contas.filter((c) => c.tipo === "pagar" && c.pago_em && c.extrato_id === null).reduce((s, c) => s + (c.valor ?? 0), 0);

  // ---- Alertas (regras fixas, sem IA) ----
  const alertas: FinAlerta[] = [];
  const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const atrasPagar = aPagar.filter((c) => c.status === "atrasado");
  if (atrasPagar.length) alertas.push({ id: "pagar-atrasado", tom: "critico", titulo: `${atrasPagar.length} conta${atrasPagar.length > 1 ? "s" : ""} a pagar vencida${atrasPagar.length > 1 ? "s" : ""}`, detalhe: `${brl(atrasPagar.reduce((s, c) => s + (c.valor ?? 0), 0))} em aberto: ${atrasPagar.slice(0, 3).map((c) => c.descricao).join(", ")}.` });
  const em7 = brtDay(agora + 7 * DIA);
  const prox7 = aPagar.filter((c) => c.status === "pendente" && c.vencimento <= em7);
  if (prox7.length) alertas.push({ id: "pagar-7d", tom: "atencao", titulo: `${prox7.length} conta${prox7.length > 1 ? "s" : ""} vence${prox7.length > 1 ? "m" : ""} em 7 dias`, detalhe: `${brl(prox7.reduce((s, c) => s + (c.valor ?? 0), 0))}: ${prox7.slice(0, 3).map((c) => `${c.descricao} (${c.vencimento.slice(8)}/${c.vencimento.slice(5, 7)})`).join(", ")}.` });
  const atrasReceber = aReceber.filter((c) => c.status === "atrasado");
  if (atrasReceber.length) alertas.push({ id: "receber-atrasado", tom: "atencao", titulo: `${atrasReceber.length} recebimento${atrasReceber.length > 1 ? "s" : ""} atrasado${atrasReceber.length > 1 ? "s" : ""}`, detalhe: `${atrasReceber.slice(0, 3).map((c) => c.descricao).join(", ")}. Se já caiu no Inter, importe o extrato para conciliar.` });

  // Guia do Simples: vence dia 20 e cobre o mês anterior.
  const mesAnt = mesDe(somaMeses(`${mesRef}-01`, -1));
  const guiaPaga = contas.some((c) => c.tipo === "pagar" && c.categoria === "Impostos e Taxas" && c.pago_em && mesDe(c.pago_em) === mesRef);
  const recAnt = soma(entradas, mesAnt);
  if (!guiaPaga && recAnt > 0) {
    const dia = Number(hoje.slice(8));
    alertas.push({ id: "guia-simples", tom: dia > 20 ? "critico" : "atencao", titulo: dia > 20 ? "Guia do Simples sem pagamento lançado" : `Guia do Simples vence dia 20 (${20 - dia >= 0 ? `faltam ${20 - dia} dias` : "hoje"})`, detalhe: `Referente a ${nomeMes(mesAnt)}. Estimativa ${brl(r2(recAnt * cfg.aliquotaImpostos))} (${Math.round(cfg.aliquotaImpostos * 100)}% de ${brl(recAnt)}); o valor real sai do PGDAS.` });
  }
  if (mesesDeCaixa !== null && mesesDeCaixa < 3) alertas.push({ id: "caixa-baixo", tom: mesesDeCaixa < 1.5 ? "critico" : "atencao", titulo: `Caixa cobre ${mesesDeCaixa.toLocaleString("pt-BR")} ${mesesDeCaixa === 1 ? "mês" : "meses"} de despesa`, detalhe: `Saldo do Inter ${brl(saldoInter)} contra despesa média de ${brl(despesaMedia)} por mês.` });
  if (foraMes > 0) alertas.push({ id: "fora-inter", tom: "info", titulo: `${brl(r2(foraMes))} pagos fora do Inter neste mês`, detalhe: "Despesa paga no cartão ou do bolso. Entra no resultado, mas não mexe no saldo do Inter: acompanhe o que você precisa repor." });
  if (ultimo && (agora - diaMs(ultimo)) / DIA > 7) alertas.push({ id: "extrato-velho", tom: "info", titulo: "Extrato do Inter desatualizado", detalhe: `O último lançamento é de ${ultimo.slice(8)}/${ultimo.slice(5, 7)}. Importe o extrato recente para o saldo e a conciliação refletirem o banco.` });


  // ---- Projeção, indicadores e séries ----
  const fechadosSemImposto = meses(4).slice(0, 3).filter((m) => soma(despesas, m) > 0);
  const custoAuto = fechadosSemImposto.length ? r2(fechadosSemImposto.reduce((t, m) => t + soma(despesas, m) - soma(despesas, m, "Impostos e Taxas"), 0) / fechadosSemImposto.length) : 0;
  const premissas = finPremissas(db, custoAuto);
  const metaPol = row<{ value: string }>(db, "select value from policies where key = 'mrr_goal'");
  let meta = { valor: 1200, data: "31/12/2026" };
  try {
    const j = metaPol ? (JSON.parse(metaPol.value) as { value?: number; date?: string }) : null;
    if (j && typeof j.value === "number" && j.value > 0) meta = { valor: j.value, data: j.date ?? meta.data };
  } catch { /* política ilegível: fica o padrão */ }
  const projecao = projetar(r2(mrr), saldoInter, mesRef, premissas, meta.valor);

  const hist = rows<{ day: string; mrr_brl: number }>(db, "select day, mrr_brl from mrr_daily order by day");
  const porDia = new Map<string, number>();
  for (const h of hist) porDia.set(h.day, (porDia.get(h.day) ?? 0) + h.mrr_brl);
  const mrrSerie = [...porDia.entries()].map(([day, total]) => ({ day, total: r2(total) }));
  const tres = meses(4).slice(0, 3);
  const gastoMkt = tres.reduce((t, m) => t + soma(despesas, m, "Marketing e Vendas"), 0);
  const ind = indicadores({ mrr, clientes: ativos, mrrSerie, hoje, entradasMes: atual.entradas, resultadoMes: atual.resultado, churn: premissas.churn, meta, gastoMarketing3m: gastoMkt, clientesNovos3m: null });

  // Saldo diário do Inter nos últimos 90 dias.
  const desde = brtDay(agora - 90 * DIA);
  let acc = 0;
  const saldoPorDia = new Map<string, number>();
  for (const e of ext) { acc += e.valor; saldoPorDia.set(e.data, r2(acc)); }
  const saldoSerie: { data: string; saldo: number }[] = [];
  let ult = 0;
  for (let t = Date.parse(`${desde}T12:00:00Z`), fim = Date.parse(`${hoje}T12:00:00Z`); t <= fim; t += DIA) {
    const d = new Date(t).toISOString().slice(0, 10);
    if (d < (ext[0]?.data ?? "9999")) continue;
    ult = saldoPorDia.get(d) ?? ult;
    if (!saldoPorDia.has(d) && saldoSerie.length === 0) ult = [...saldoPorDia.entries()].filter(([k]) => k < d).map(([, v]) => v).pop() ?? 0;
    saldoSerie.push({ data: d, saldo: ult });
  }

  const despesasPorCategoria = CATEGORIAS_DESPESA.map((c) => ({ categoria: c, mes: soma(despesas, mesRef, c), tresMeses: r2(tres.reduce((t, m) => t + soma(despesas, m, c), 0) / 3) })).filter((x) => x.mes > 0 || x.tresMeses > 0).sort((a, b) => b.mes - a.mes || b.tresMeses - a.tresMeses);

  // ---- Fluxo de caixa diário: 30 dias para trás (extrato) e 150 para frente (contas em aberto) ----
  const fluxo = ((): FinFluxo => {
    const ini = brtDay(agora - 30 * DIA);
    const fim = brtDay(agora + 150 * DIA);
    const mov = new Map<string, { e: number; s: number; itens: { descricao: string; valor: number }[] }>();
    const slot = (d: string) => { let m = mov.get(d); if (!m) { m = { e: 0, s: 0, itens: [] }; mov.set(d, m); } return m; };
    for (const e of ext) if (e.data >= ini && e.data <= hoje) { const m = slot(e.data); if (e.valor >= 0) m.e += e.valor; else m.s += -e.valor; m.itens.push({ descricao: e.descricao, valor: e.valor }); }
    for (const c of contas) {
      if (c.pago_em || !c.valor) continue;
      // Atrasada ainda vai acontecer: entra hoje, não no passado.
      const d = c.vencimento < hoje ? hoje : c.vencimento;
      if (d > fim) continue;
      const m = slot(d);
      if (c.tipo === "receber") m.e += c.valor; else m.s += c.valor;
      m.itens.push({ descricao: `${c.descricao}${c.vencimento < hoje ? " (atrasada)" : ""}`, valor: c.tipo === "receber" ? c.valor : -c.valor });
    }
    // Saldo do dia ini-1 = soma do extrato até lá.
    let saldo = r2(ext.filter((e) => e.data < ini).reduce((t, e) => t + e.valor, 0));
    const dias: FinFluxoDia[] = [];
    for (let t = Date.parse(`${ini}T12:00:00Z`), f = Date.parse(`${fim}T12:00:00Z`); t <= f; t += DIA) {
      const d = new Date(t).toISOString().slice(0, 10);
      const m = mov.get(d);
      saldo = r2(saldo + (m ? m.e - m.s : 0));
      dias.push({ data: d, entradas: r2(m?.e ?? 0), saidas: r2(m?.s ?? 0), saldo, projetado: d > hoje, itens: m ? m.itens.slice(0, 8) : [] });
    }
    const fut = dias.filter((x) => x.data >= hoje);
    const menor = fut.length ? fut.reduce((a, b) => (b.saldo < a.saldo ? b : a)) : null;
    return {
      dias,
      saldoHoje: saldoInter,
      menorSaldo: menor ? { data: menor.data, valor: menor.saldo } : null,
      negativoEm: fut.find((x) => x.saldo < 0)?.data ?? null,
      notas: [
        "O passado vem do extrato do Inter; o futuro soma o saldo com as contas a pagar e a receber em aberto, no dia do vencimento. Atrasadas entram hoje.",
        "Mensalidades do Stripe e clientes sem cobrança cadastrada não entram no futuro: cadastre a cobrança recorrente para aparecerem.",
        "A guia do Simples só entra depois de lançada como conta a pagar.",
      ],
    };
  })();

  if (fluxo.negativoEm) alertas.unshift({ id: "caixa-negativo", tom: "critico", titulo: `Caixa fica negativo em ${fluxo.negativoEm.slice(8)}/${fluxo.negativoEm.slice(5, 7)}`, detalhe: `Com as contas em aberto, o saldo do Inter cai a ${brl(fluxo.menorSaldo?.valor ?? 0)}. Veja a aba Fluxo de caixa.` });

  return {
    agora,
    hoje,
    mesRef,
    vazio: ext.length === 0 && contas.length === 0,
    kpis: {
      saldoInter,
      ultimoLancamento: ultimo,
      entradasMes: atual.entradas,
      saidasMes: atual.saidas,
      resultadoMes: atual.resultado,
      mrr: r2(mrr),
      clientesAtivos: ativos,
      ticketMedio: ativos ? r2(mrr / ativos) : null,
      mesesDeCaixa,
      despesaMediaMensal: despesaMedia,
      pagoForaDoInterMes: r2(foraMes),
      pagoForaDoInterTotal: r2(foraTotal),
      aPagar30d: soma30(aPagar),
      aReceber30d: soma30(aReceber),
    },
    serie,
    dre,
    aPagar,
    aReceber,
    pagasRecentes: contas.filter((c) => c.pago_em).map(view).sort((a, b) => String(b.pagoEm).localeCompare(String(a.pagoEm))).slice(0, 12),
    extratoRecente: [...ext].reverse().slice(0, 15).map((e): FinExtratoItem => ({ id: e.id, data: e.data, descricao: e.descricao, valor: e.valor, categoria: e.categoria, conciliado: e.conta_id !== null, manual: e.fonte === "avulso" })),
    lancamentosManuais: ext.filter((e) => e.fonte === "avulso").reverse().slice(0, 15).map((e): FinExtratoItem => ({ id: e.id, data: e.data, descricao: e.descricao, valor: e.valor, categoria: e.categoria, conciliado: e.conta_id !== null, manual: true })),
    // Só saídas: entrada sem conta é normal (mensalidade que não tem conta a receber cadastrada).
    semConciliar: ext.filter((e) => e.valor < 0 && e.conta_id === null).length,
    alertas,
    config: cfg,
    fluxo,
    premissas,
    cobrancas: finCobrancas(db),
    saldoSerie,
    despesasPorCategoria,
    projecao,
    indicadores: ind,
    categoriasDespesa: CATEGORIAS_DESPESA,
    categoriasReceita: CATEGORIAS_RECEITA,
  };
}
