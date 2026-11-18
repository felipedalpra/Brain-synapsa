// @ts-nocheck
// DRE no formato padrão (vertical): receita bruta → deduções → receita líquida → custos → lucro bruto → despesas → EBITDA → resultado.
import * as React from "react";
import { _ } from "../lib";
import { GraficoLinhas } from "./charts";
import { FinDreMensal } from "./Financeiro";

const brl = (n) => (n < 0 ? `(${_(Math.abs(n))})` : _(n));
const pct = (n, base) => (base > 0 ? `${(Math.round((n / base) * 1000) / 10).toLocaleString("pt-BR")}%` : "—");
const r2 = (n) => Math.round(n * 100) / 100;
const OPEX = ["Pessoal", "Marketing e Vendas", "Tecnologia/Ferramentas", "Administrativas"];

export function FinDre({ d }) {
  const meses = d.dre.meses;
  const [sel, setSel] = React.useState(meses.length - 1);
  const linhas = Object.fromEntries(d.dre.linhas.map((l) => [l.label, l.valores]));
  const soma = (label, idx) => r2(idx.reduce((t, i) => t + (linhas[label]?.[i] ?? 0), 0));
  const ano = meses[sel].slice(-2);
  const ytd = meses.map((m, i) => i).filter((i) => i <= sel && meses[i].slice(-2) === ano);
  const colunas = [
    { rot: meses[sel], idx: [sel] },
    { rot: sel > 0 ? meses[sel - 1] : "—", idx: sel > 0 ? [sel - 1] : [] },
    { rot: `Acumulado 20${ano}`, idx: ytd },
  ];

  const calc = (idx) => {
    const v = (l) => soma(l, idx);
    const despesa = (cat) => v(`(-) ${cat}`);
    const rec = d.categoriasReceita.map((c) => ({ cat: c, v: v(c) }));
    const rb = v("Receita bruta");
    const ded = v("(-) Impostos e Taxas");
    const rl = r2(rb - ded);
    const cmv = despesa("Custos Diretos (CMV)");
    const lb = r2(rl - cmv);
    const opex = OPEX.map((c) => ({ cat: c, v: despesa(c) }));
    const opexT = r2(opex.reduce((t, x) => t + x.v, 0));
    const ebitda = r2(lb - opexT);
    const fin = despesa("Financeiras");
    const outras = despesa("Outras Despesas");
    const res = r2(ebitda - fin - outras);
    return { rec, rb, ded, rl, cmv, lb, opex, opexT, ebitda, fin, outras, res };
  };
  const C = colunas.map((c) => calc(c.idx));

  // cada linha: [rótulo, tipo, f(calc) com sinal para exibição]
  const L = [
    ["Receita bruta", "grupo", (c) => c.rb],
    ...d.categoriasReceita.map((cat, i) => [cat, "item", (c) => c.rec[i].v]),
    ["(−) Deduções: impostos e taxas", "grupo", (c) => -c.ded],
    ["= Receita líquida", "total", (c) => c.rl],
    ["(−) Custos diretos (CMV)", "grupo", (c) => -c.cmv],
    ["= Lucro bruto", "total", (c) => c.lb],
    ["(−) Despesas operacionais", "grupo", (c) => -c.opexT],
    ...OPEX.map((cat, i) => [cat, "item", (c) => -c.opex[i].v]),
    ["= EBITDA (resultado operacional)", "total", (c) => c.ebitda],
    ["(−) Despesas financeiras", "grupo", (c) => -c.fin],
    ["(−) Outras despesas", "grupo", (c) => -c.outras],
    ["= Resultado líquido", "final", (c) => c.res],
  ];

  const a = C[0];
  const serie = d.dre.linhas;
  const rb = serie.find((l) => l.label === "Receita bruta").valores;
  const rs = serie.find((l) => l.label === "Resultado").valores;

  return (
    <div className="dash-grid">
      <section className="panel span-3" aria-labelledby="dv-t">
        <div className="panel-head">
          <h2 id="dv-t">Demonstração do resultado (DRE)</h2>
          <div className="dre-ctrl">
            <label>
              <span className="muted">Mês </span>
              <select value={sel} onChange={(e) => setSel(Number(e.target.value))} aria-label="Mês da DRE">
                {meses.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="dre-resumo">
          <div>
            <span>Receita bruta</span>
            <b>{_(a.rb)}</b>
            <small>{meses[sel]}</small>
          </div>
          <div>
            <span>Lucro bruto</span>
            <b>{brl(a.lb)}</b>
            <small>margem {pct(a.lb, a.rb)}</small>
          </div>
          <div>
            <span>EBITDA</span>
            <b className={a.ebitda < 0 ? "t-crit" : ""}>{brl(a.ebitda)}</b>
            <small>margem {pct(a.ebitda, a.rb)}</small>
          </div>
          <div>
            <span>Resultado líquido</span>
            <b className={a.res < 0 ? "t-crit" : "t-ok"}>{brl(a.res)}</b>
            <small>margem {pct(a.res, a.rb)}</small>
          </div>
        </div>
        <div className="table-wrap">
          <table className="dre-v">
            <thead>
              <tr>
                <th>Em R$</th>
                <th>{colunas[0].rot}</th>
                <th>% rec.</th>
                <th>{colunas[1].rot}</th>
                <th>{colunas[2].rot}</th>
                <th>% rec.</th>
              </tr>
            </thead>
            <tbody>
              {L.map(([rot, tipo, f]) => {
                const v0 = f(C[0]);
                const v1 = f(C[1]);
                const v2 = f(C[2]);
                const cel = (v) => (v === 0 ? <span className="dv-zero">—</span> : brl(v));
                const cls = tipo === "grupo" ? "dv-grupo" : tipo === "item" ? "dv-item" : tipo === "total" ? "dv-total" : "dv-total dv-final";
                const neg = (v) => ((tipo === "total" || tipo === "final") && v < 0 ? "t-crit" : "");
                return (
                  <tr key={rot} className={cls}>
                    <td>{rot}</td>
                    <td className={neg(v0)}>{cel(v0)}</td>
                    <td className="dv-pct">{v0 === 0 ? "" : pct(Math.abs(v0), C[0].rb)}</td>
                    <td className={neg(v1)}>{colunas[1].idx.length ? cel(v1) : "—"}</td>
                    <td className={neg(v2)}>{cel(v2)}</td>
                    <td className="dv-pct">{v2 === 0 ? "" : pct(Math.abs(v2), C[2].rb)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted">
          Regime de caixa: receita é o que entrou (Inter e recebimentos marcados como recebidos); despesa é o que foi pago. Parcela a receber ainda não entra no resultado: ela aparece no fluxo de caixa e vira receita quando você marcar como recebida. Imposto é a guia paga, não estimativa.
        </p>
      </section>
      <section className="panel span-3" aria-labelledby="dv-g">
        <h2 id="dv-g">Receita bruta e resultado, mês a mês</h2>
        <GraficoLinhas
          label="Receita bruta e resultado por mês"
          money
          labels={meses}
          height={170}
          series={[
            { name: "Receita bruta", color: "var(--ok)", values: rb },
            { name: "Resultado", color: "var(--blue)", values: rs },
          ]}
        />
      </section>
      <details className="span-3 dre-mensal">
        <summary>Ver todos os meses lado a lado</summary>
        <FinDreMensal d={d} />
      </details>
    </div>
  );
}
