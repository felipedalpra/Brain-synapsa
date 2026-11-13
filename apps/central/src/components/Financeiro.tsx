// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { Check, Clock, Info, Plus, Target, TriangleAlert, Undo2, X } from "lucide-react";
import { _ } from "../lib";
import { api } from "../api";
import { GraficoLinhas, Ranking } from "./charts";
import { jaDigitados } from "./Command";
import { th } from "../shared-inline";
import { useBrain } from "../store";
import { avisos } from "./Avisos";

export const Qt = (e) =>
  `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(e.slice(5, 7)) - 1]}/${e.slice(2, 4)}`;
export const Dh = (e) => (e < 0 ? `-${_(Math.abs(e))}` : _(e));
export const Xl = (e) => `${(Math.round(e * 1e3) / 10).toLocaleString("pt-BR")}%`;
export const Zl = {
  conservador: "var(--warn)",
  base: "var(--blue)",
  otimista: "var(--ok)",
};
export const Gt = (e) => Number(e.replace(",", "."));
export function FinProjecao({ d: e, rodar: a }) {
  const t = e.projecao,
    r = e.premissas,
    [o, s] = React.useState({
      novos: String(r.novosPorMes),
      preco: String(r.precoNovo),
      churn: String(Math.round(r.churn * 1e3) / 10),
      custo: r.custoMensal === null ? "" : String(r.custoMensal),
      aliq: String(Math.round(r.aliquotaImpostos * 1e3) / 10),
    }),
    i = (j) => {
      (j.preventDefault(),
        a(
          () =>
            api.finPremissas({
              novosPorMes: Gt(o.novos),
              precoNovo: Gt(o.preco),
              churn: Gt(o.churn) / 100,
              aliquotaImpostos: Gt(o.aliq) / 100,
              custoMensal: o.custo.trim() === "" ? null : Gt(o.custo),
            }),
          "Premissas salvas",
        ));
    },
    l = (j) => j < t.meses.length,
    c = [11, 23, 35].filter(l),
    u = e.indicadores.metaMrr,
    v = t.cenarios.find((j) => j.id === "base"),
    g = t.meses.map(Qt),
    x = r.custoMensal ?? r.custoMensalAuto;
  return (
    <div className="dash-grid">
      <section className="panel span-3" aria-labelledby="p-prem">
        <h2 id="p-prem">Premissas</h2>
        <form className="conta-grid prem-grid" onSubmit={i}>
          <label>
            Novos clientes por mês
            <input
              inputMode="decimal"
              value={o.novos}
              onChange={(j) =>
                s({
                  ...o,
                  novos: j.target.value,
                })
              }
            />
          </label>
          <label>
            Preço do plano novo (R$)
            <input
              inputMode="decimal"
              value={o.preco}
              onChange={(j) =>
                s({
                  ...o,
                  preco: j.target.value,
                })
              }
            />
          </label>
          <label>
            Churn mensal (%)
            <input
              inputMode="decimal"
              value={o.churn}
              onChange={(j) =>
                s({
                  ...o,
                  churn: j.target.value,
                })
              }
            />
          </label>
          <label>
            Custo mensal (R$)
            <input
              inputMode="decimal"
              value={o.custo}
              onChange={(j) =>
                s({
                  ...o,
                  custo: j.target.value,
                })
              }
              placeholder={`m\xE9dia real: ${r.custoMensalAuto.toLocaleString("pt-BR")}`}
            />
          </label>
          <label>
            Imposto sobre receita (%)
            <input
              inputMode="decimal"
              value={o.aliq}
              onChange={(j) =>
                s({
                  ...o,
                  aliq: j.target.value,
                })
              }
            />
          </label>
          <div className="conta-acoes">
            <button type="submit" className="btn btn-go">
              Salvar e recalcular
            </button>
          </div>
        </form>
        <p className="muted">
          {"Base: "}
          {r.novosPorMes.toLocaleString("pt-BR")}
          {" novos por m\xEAs a "}
          {_(r.precoNovo)}
          {", churn de "}
          {Xl(r.churn)}
          {", custo de "}
          {_(x)}/mês{r.custoMensal === null ? " (m\xE9dia dos \xFAltimos 3 meses, sem imposto)" : ""}.
          Conservador usa metade dos novos e 1,5× o churn; otimista usa 1,5× os novos e metade do churn. Custo
          é fixo: não cresce com o MRR.
        </p>
      </section>
      <section className="panel span-2" aria-labelledby="p-mrr">
        <h2 id="p-mrr">MRR projetado, 36 meses</h2>
        <GraficoLinhas
          label="MRR projetado por cenário"
          money
          labels={g}
          series={[
            ...t.cenarios.map((j) => ({
              name: j.label,
              color: Zl[j.id],
              values: j.mrr,
            })),
            {
              name: `Meta ${_(u.valor)}`,
              color: "var(--muted)",
              values: t.meses.map(() => u.valor),
            },
          ]}
          height={190}
        />
      </section>
      <section className="panel" aria-labelledby="p-meta">
        <h2 id="p-meta">
          <Target size={15} aria-hidden />
          {" Meta de "}
          {_(u.valor)}
        </h2>
        <ul className="plain meta-lista">
          {t.cenarios.map((j) => (
            <li>
              <span>{j.label}</span>
              <b className={j.mesDaMeta ? "t-ok" : "t-crit"}>
                {j.mesDaMeta ? Qt(j.mesDaMeta) : "n\xE3o chega em 36 meses"}
              </b>
            </li>
          ))}
        </ul>
        <p className="muted">
          {"Hoje o MRR \xE9 "}
          {_(u.valor - u.falta)}
          {"; faltam "}
          {_(u.falta)}
          {" at\xE9 "}
          {u.data}
          {". No cen\xE1rio base, em "}
          {v.mesDaMeta ? Qt(v.mesDaMeta) : "\u2014"}
          {" o MRR cruza a meta."}
        </p>
      </section>
      <section className="panel span-3" aria-labelledby="p-saldo">
        <h2 id="p-saldo">Saldo de caixa projetado</h2>
        <GraficoLinhas
          label="Saldo de caixa projetado por cenário"
          money
          labels={g}
          series={t.cenarios.map((j) => ({
            name: j.label,
            color: Zl[j.id],
            values: j.saldo,
          }))}
          height={170}
        />
        <p className="muted">
          Parte do saldo atual do Inter ({_(t.saldoInicial)}). Entradas = MRR do mês; saídas = custo mensal +
          imposto sobre o MRR.
        </p>
      </section>
      <section className="panel span-3" aria-labelledby="p-tab">
        <h2 id="p-tab">Cenários em números</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <jaDigitados>
                <th>Cenário</th>
                <th className="num">Novos/mês</th>
                <th className="num">Churn</th>
                {c.map((j) => (
                  <th className="num">
                    {"MRR em "}
                    {Qt(t.meses[j])}
                  </th>
                ))}
                {c.map((j) => (
                  <th className="num">
                    {"Caixa em "}
                    {Qt(t.meses[j])}
                  </th>
                ))}
              </jaDigitados>
            </thead>
            <tbody>
              {t.cenarios.map((j) => (
                <jaDigitados>
                  <td>{j.label}</td>
                  <td className="num">{j.novosPorMes.toLocaleString("pt-BR")}</td>
                  <td className="num">{Xl(j.churn)}</td>
                  {c.map((m) => (
                    <td className="num">{_(j.mrr[m])}</td>
                  ))}
                  {c.map((m) => (
                    <td className={`num ${j.saldo[m] < 0 ? "t-crit" : ""}`}>{Dh(j.saldo[m])}</td>
                  ))}
                </jaDigitados>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
export function FinMrr({ d: e }) {
  const a = e.indicadores,
    t = a.mrrSerie.slice(-90),
    r = (o, s) => (o === null ? "\u2014" : s(o));
  return (
    <div className="dash-grid">
      <section className="kpis fin-kpis span-3" aria-label="Indicadores">
        <div className="kpi kpi-hero">
          <span>MRR</span>
          <b>{_(a.mrr)}</b>
          <small>
            {"Meta "}
            {_(a.metaMrr.valor)}
            {" em "}
            {a.metaMrr.data}
            {"; faltam "}
            {_(a.metaMrr.falta)}
          </small>
        </div>
        <div className="kpi">
          <span>ARR</span>
          <b>{_(a.arr)}</b>
          <small>MRR × 12</small>
        </div>
        <div className="kpi">
          <span>Clientes ativos</span>
          <b>{a.clientesAtivos}</b>
          <small>
            {"Ticket m\xE9dio "}
            {r(a.ticketMedio, _)}
          </small>
        </div>
        <div className="kpi">
          <span>Crescimento em 30 dias</span>
          <b className={a.crescimentoMrr30dPct !== null && a.crescimentoMrr30dPct < 0 ? "t-crit" : ""}>
            {r(a.crescimentoMrr30dPct, (o) => `${o > 0 ? "+" : ""}${o.toLocaleString("pt-BR")}%`)}
          </b>
          <small>MRR de hoje contra 30 dias atrás</small>
        </div>
        <div className="kpi">
          <span>Margem do mês</span>
          <b className={a.margemMesPct !== null && a.margemMesPct < 0 ? "t-crit" : ""}>
            {r(a.margemMesPct, (o) => `${o.toLocaleString("pt-BR")}%`)}
          </b>
          <small>Resultado ÷ entradas</small>
        </div>
        <div className="kpi">
          <span>LTV</span>
          <b>{r(a.ltv, _)}</b>
          <small>Ticket ÷ churn mensal</small>
        </div>
        <div className="kpi">
          <span>CAC</span>
          <b>{r(a.cac, _)}</b>
          <small>
            {"LTV:CAC "}
            {r(a.ltvCac, (o) => `${o.toLocaleString("pt-BR")}\xD7`)}
            {" \xB7 payback "}
            {r(a.paybackMeses, (o) => `${o.toLocaleString("pt-BR")} meses`)}
          </small>
        </div>
      </section>
      <section className="panel span-2" aria-labelledby="i-mrr">
        <h2 id="i-mrr">MRR, últimos 90 dias</h2>
        {t.length > 1 ? (
          <GraficoLinhas
            label="MRR dos últimos 90 dias"
            money
            labels={t.map((o) => o.day.slice(5).split("-").reverse().join("/"))}
            series={[
              {
                name: "MRR",
                color: "var(--blue)",
                values: t.map((o) => o.total),
              },
            ]}
          />
        ) : (
          <p className="muted">O histórico de MRR começa a aparecer conforme os dias são registrados.</p>
        )}
      </section>
      <section className="panel" aria-labelledby="i-notas">
        <h2 id="i-notas">Como ler</h2>
        <ul className="plain notas">
          {a.notas.map((o) => (
            <li>{o}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
export const Jl = (e) => (e < 0 ? `-${_(Math.abs(e))}` : _(e));
export function FinDre({ d: e }) {
  const [a, t] = React.useState(6),
    [r, o] = React.useState(false),
    s = e.dre.meses.length - a,
    i = e.dre.meses.slice(s),
    l = e.dre.linhas.map((N) => ({
      ...N,
      valores: N.valores.slice(s),
    })),
    c = l.find((N) => N.label === "Receita bruta"),
    u = l.find((N) => N.label === "Resultado"),
    v = (N) => Math.round(N.reduce((h, f) => h + f, 0) * 100) / 100,
    g = v(c.valores),
    x = (N, h) => (h > 0 ? `${(Math.round((N / h) * 1e3) / 10).toLocaleString("pt-BR")}%` : "\u2014"),
    j = u.valores.map((N, h) => (c.valores[h] > 0 ? Math.round((N / c.valores[h]) * 1e3) / 10 : 0)),
    m = c.valores.map((N, h) => Math.round((N - u.valores[h]) * 100) / 100);
  return (
    <div className="dash-grid">
      <section className="panel span-3" aria-labelledby="dre-g">
        <div className="panel-head">
          <h2 id="dre-g">Receita, despesa e resultado</h2>
          <div className="seg" role="group" aria-label="Período da DRE">
            {[3, 6, 12].map((N) => (
              <button
                type="button"
                aria-pressed={a === N}
                className={a === N ? "on" : ""}
                onClick={() => t(N)}
              >
                {N}
                {" meses"}
              </button>
            ))}
          </div>
        </div>
        <GraficoLinhas
          label="Receita, despesa e resultado por mês"
          money
          labels={i}
          height={170}
          series={[
            {
              name: "Receita bruta",
              color: "var(--ok)",
              values: c.valores,
            },
            {
              name: "Despesa total",
              color: "var(--crit)",
              values: m,
            },
            {
              name: "Resultado",
              color: "var(--blue)",
              values: u.valores,
            },
          ]}
        />
      </section>
      <section className="panel span-3" aria-labelledby="dre-t">
        <div className="panel-head">
          <h2 id="dre-t">DRE por mês</h2>
          <label className="chk">
            <input type="checkbox" checked={r} onChange={(N) => o(N.target.checked)} />
            {" Mostrar % da receita bruta"}
          </label>
        </div>
        <div className="table-wrap">
          <table className="dre-tab">
            <thead>
              <jaDigitados>
                <th>Linha</th>
                {i.map((N) => (
                  <th className="num">{N}</th>
                ))}
                <th className="num dre-soma">
                  {"Total "}
                  {a}m
                </th>
              </jaDigitados>
            </thead>
            <tbody>
              {l.map((N, h) => {
                const f = v(N.valores),
                  d = N.tipo === "total" && h > 0 ? "dre-sep" : "";
                return (
                  <jaDigitados className={`${N.tipo === "total" ? "dre-total" : ""} ${d}`}>
                    <td>{N.label}</td>
                    {N.valores.map((p, S) => (
                      <td className={`num ${N.tipo === "total" && p < 0 ? "t-crit" : ""}`}>
                        {p === 0 ? "\u2014" : r ? x(p, c.valores[S]) : Jl(p)}
                      </td>
                    ))}
                    <td className={`num dre-soma ${N.tipo === "total" && f < 0 ? "t-crit" : ""}`}>
                      {f === 0 ? "\u2014" : r ? x(f, g) : Jl(f)}
                    </td>
                  </jaDigitados>
                );
              })}
              <jaDigitados className="dre-margem">
                <td>Margem do resultado</td>
                {j.map((N, h) => (
                  <td className={`num ${N < 0 ? "t-crit" : ""}`}>
                    {c.valores[h] > 0 ? `${N.toLocaleString("pt-BR")}%` : "\u2014"}
                  </td>
                ))}
                <td className="num dre-soma">{x(v(u.valores), g)}</td>
              </jaDigitados>
            </tbody>
          </table>
        </div>
        <p className="muted">
          Regime de caixa: receita é o que entrou no Inter (mais recebimentos marcados fora dele); despesa é o
          que foi pago, inclusive no cartão. Imposto é a guia do Simples paga, não estimativa.
        </p>
      </section>
    </div>
  );
}
export const Ja = (e) => `${e.slice(8, 10)}/${e.slice(5, 7)}`;
export const Uh = (e) =>
  `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(e.slice(5, 7)) - 1]}/${e.slice(2, 4)}`;
export const ka = (e) => (e < 0 ? `-${_(Math.abs(e))}` : _(e));
export const Wh = (e) =>
  e.toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });
export function Vh(e) {
  const a = /* @__PURE__ */ new Date(`${e}T12:00:00Z`),
    t = (a.getUTCDay() + 6) % 7;
  return (a.setUTCDate(a.getUTCDate() - t), a.toISOString().slice(0, 10));
}
export function Hh(e, a) {
  if (a === "dia")
    return e.map((r) => ({
      chave: r.data,
      rotulo: Ja(r.data),
      entradas: r.entradas,
      saidas: r.saidas,
      saldo: r.saldo,
      projetado: r.projetado,
      itens: r.itens,
      dias: 1,
    }));
  const t = /* @__PURE__ */ new Map();
  for (const r of e) {
    const o = a === "semana" ? Vh(r.data) : r.data.slice(0, 7),
      s = t.get(o) ?? {
        chave: o,
        rotulo: a === "semana" ? `sem. ${Ja(o)}` : Uh(`${o}-01`),
        entradas: 0,
        saidas: 0,
        saldo: 0,
        projetado: false,
        itens: [],
        dias: 0,
      };
    ((s.entradas += r.entradas),
      (s.saidas += r.saidas),
      (s.saldo = r.saldo),
      (s.projetado = s.projetado || r.projetado),
      s.itens.push(...r.itens),
      s.dias++,
      t.set(o, s));
  }
  return [...t.values()];
}
export function Qh({ dias: e, hoje: a }) {
  const [t, r] = React.useState(null),
    o = 900,
    s = 230,
    i = {
      l: 56,
      r: 12,
      t: 12,
      b: 24,
    },
    l = e.map((h) => h.saldo),
    c = Math.max(1, ...l),
    u = Math.min(0, ...l),
    v = (h) => i.l + (h / Math.max(1, e.length - 1)) * (o - i.l - i.r),
    g = (h) => i.t + (1 - (h - u) / (c - u || 1)) * (s - i.t - i.b),
    x = Math.max(
      0,
      e.findIndex((h) => h.data === a),
    ),
    j = (h, f) =>
      e
        .slice(h, f + 1)
        .map((d, p) => `${v(h + p)},${g(d.saldo)}`)
        .join(" "),
    m = [u, (u + c) / 2, c],
    N = t !== null ? e[t] : null;
  return (
    <figure className="chart fluxo-chart">
      <svg
        viewBox={`0 0 ${o} ${s}`}
        role="img"
        aria-label="Saldo diário do Inter, realizado e projetado"
        preserveAspectRatio="none"
        style={{
          height: s,
        }}
        onMouseMove={(h) => {
          const f = h.currentTarget.getBoundingClientRect(),
            d = ((h.clientX - f.left) / f.width) * o;
          r(Math.min(e.length - 1, Math.max(0, Math.round(((d - i.l) / (o - i.l - i.r)) * (e.length - 1)))));
        }}
        onMouseLeave={() => r(null)}
      >
        {m.map((h) => (
          <g>
            <line x1={i.l} x2={o - i.r} y1={g(h)} y2={g(h)} className="chart-grid" />
            <text x={i.l - 6} y={g(h) + 4} textAnchor="end" className="chart-axis">
              {"R$ "}
              {Wh(h)}
            </text>
          </g>
        ))}
        {u < 0 ? (
          <line
            x1={i.l}
            x2={o - i.r}
            y1={g(0)}
            y2={g(0)}
            stroke="var(--crit)"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
        <line
          x1={v(x)}
          x2={v(x)}
          y1={i.t}
          y2={s - i.b}
          stroke="var(--line-strong)"
          vectorEffect="non-scaling-stroke"
        />
        <text x={v(x)} y={s - 6} textAnchor="middle" className="chart-axis">
          hoje
        </text>
        <polyline
          fill="none"
          stroke="var(--blue)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          points={j(0, x)}
        />
        <polyline
          fill="none"
          stroke="var(--violet)"
          strokeWidth="2.2"
          strokeDasharray="6 4"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          points={j(x, e.length - 1)}
        />
        <text x={i.l} y={s - 6} className="chart-axis">
          {Ja(e[0].data)}
        </text>
        <text x={o - i.r} y={s - 6} textAnchor="end" className="chart-axis">
          {Ja(e[e.length - 1].data)}
        </text>
        {N && t !== null ? <circle cx={v(t)} cy={g(N.saldo)} r="4" fill="var(--text)" /> : null}
      </svg>
      <figcaption className="legend">
        <span>
          <i
            className="dot"
            style={{
              background: "var(--blue)",
            }}
          />
          {" Realizado (extrato)"}
        </span>
        <span>
          <i
            className="dot"
            style={{
              background: "var(--violet)",
            }}
          />
          {" Projetado (contas em aberto)"}
        </span>
        {N ? (
          <span className="fluxo-hover">
            <b>{Ja(N.data)}</b>
            {" saldo "}
            {ka(N.saldo)}
            {N.entradas || N.saidas ? ` \xB7 +${_(N.entradas)} / \u2212${_(N.saidas)}` : ""}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
export function FinSaldoInter({ d: e }) {
  const a = e.fluxo,
    [t, r] = React.useState("semana"),
    [o, s] = React.useState(60),
    [i, l] = React.useState(null),
    [c, u] = React.useState(false),
    v = React.useMemo(
      () =>
        a.dias.filter(
          (h) => h.data <= new Date(Date.parse(`${e.hoje}T12:00:00Z`) + o * 864e5).toISOString().slice(0, 10),
        ),
      [a.dias, e.hoje, o],
    ),
    g = React.useMemo(
      () => Hh(v, t).filter((h) => t !== "dia" || c || h.entradas || h.saidas || h.chave === e.hoje),
      [v, t, c, e.hoje],
    ),
    x = (h) => {
      const f = new Date(Date.parse(`${e.hoje}T12:00:00Z`) + h * 864e5).toISOString().slice(0, 10);
      return a.dias.find((d) => d.data === f)?.saldo ?? null;
    },
    j = v.filter((h) => h.projetado),
    m = j.reduce((h, f) => h + f.entradas, 0),
    N = j.reduce((h, f) => h + f.saidas, 0);
  return (
    <div className="dash-grid">
      <section className="kpis fin-kpis span-3" aria-label="Resumo do fluxo">
        <div className="kpi kpi-hero">
          <span>Saldo hoje</span>
          <b>{ka(a.saldoHoje)}</b>
          <small>Inter, até o último lançamento</small>
        </div>
        <div className="kpi">
          <span>Saldo em 30 dias</span>
          <b className={(x(30) ?? 0) < 0 ? "t-crit" : ""}>{x(30) === null ? "\u2014" : ka(x(30))}</b>
          <small>com as contas em aberto</small>
        </div>
        <div className="kpi">
          <span>Saldo em 90 dias</span>
          <b className={(x(90) ?? 0) < 0 ? "t-crit" : ""}>{x(90) === null ? "\u2014" : ka(x(90))}</b>
          <small>só o que já está cadastrado</small>
        </div>
        <div className="kpi">
          <span>Menor saldo projetado</span>
          <b className={(a.menorSaldo?.valor ?? 0) < 0 ? "t-crit" : ""}>
            {a.menorSaldo ? ka(a.menorSaldo.valor) : "\u2014"}
          </b>
          <small>{a.menorSaldo ? `em ${Ja(a.menorSaldo.data)}` : ""}</small>
        </div>
        <div className="kpi">
          <span>
            {"A entrar \xB7 "}
            {o}
            {" dias"}
          </span>
          <b className="t-ok">{_(m)}</b>
          <small>contas a receber</small>
        </div>
        <div className="kpi">
          <span>
            {"A sair \xB7 "}
            {o}
            {" dias"}
          </span>
          <b>{_(N)}</b>
          <small>contas a pagar</small>
        </div>
      </section>
      {a.negativoEm ? (
        <p className="banner span-3" role="alert">
          <TriangleAlert size={15} aria-hidden />
          {" O saldo fica negativo em "}
          {Ja(a.negativoEm)}
          {" se nada mais entrar. Antecipe recebimentos ou renegocie vencimentos."}
        </p>
      ) : null}
      <section className="panel span-3" aria-labelledby="fx-graf">
        <div className="panel-head">
          <h2 id="fx-graf">Saldo diário do Inter</h2>
          <div className="seg" role="group" aria-label="Horizonte">
            {[30, 60, 90, 150].map((h) => (
              <button
                type="button"
                aria-pressed={o === h}
                className={o === h ? "on" : ""}
                onClick={() => s(h)}
              >
                {h}
                {" dias"}
              </button>
            ))}
          </div>
        </div>
        <Qh dias={v} hoje={e.hoje} />
      </section>
      <section className="panel span-3" aria-labelledby="fx-tab">
        <div className="panel-head">
          <h2 id="fx-tab">Movimentação</h2>
          <div className="seg" role="group" aria-label="Agrupar por">
            {[
              ["dia", "Dia"],
              ["semana", "Semana"],
              ["mes", "M\xEAs"],
            ].map(([h, f]) => (
              <button
                type="button"
                aria-pressed={t === h}
                className={t === h ? "on" : ""}
                onClick={() => r(h)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        {t === "dia" ? (
          <label className="chk">
            <input type="checkbox" checked={c} onChange={(h) => u(h.target.checked)} />
            {" Mostrar dias sem movimento"}
          </label>
        ) : null}
        <div className="table-wrap">
          <table className="fluxo-tab">
            <thead>
              <jaDigitados>
                <th>Período</th>
                <th className="num">Entradas</th>
                <th className="num">Saídas</th>
                <th className="num">Líquido</th>
                <th className="num">Saldo final</th>
              </jaDigitados>
            </thead>
            <tbody>
              {g.map((h) => {
                const f = h.entradas - h.saidas,
                  d = i === h.chave;
                return (
                  <React.Fragment>
                    <jaDigitados
                      className={`${h.projetado ? "fx-proj" : ""} ${h.chave === e.hoje ? "fx-hoje" : ""} ${h.itens.length ? "fx-clic" : ""}`}
                      onClick={() => h.itens.length && l(d ? null : h.chave)}
                    >
                      <td>
                        {h.rotulo}
                        {h.projetado ? <em className="tag">projetado</em> : null}
                        {h.chave === e.hoje ? <em className="tag">hoje</em> : null}
                      </td>
                      <td className="num t-ok">{h.entradas ? _(h.entradas) : "\u2014"}</td>
                      <td className="num">{h.saidas ? _(h.saidas) : "\u2014"}</td>
                      <td className={`num ${f < 0 ? "t-crit" : ""}`}>{f ? ka(f) : "\u2014"}</td>
                      <td className={`num ${h.saldo < 0 ? "t-crit" : ""}`}>
                        <b>{ka(h.saldo)}</b>
                      </td>
                    </jaDigitados>
                    {d ? (
                      <jaDigitados className="fx-itens">
                        <td colSpan={5}>
                          <ul className="plain">
                            {h.itens.slice(0, 20).map((p, S) => (
                              <li>
                                <span>{p.descricao}</span>
                                <b className={p.valor >= 0 ? "t-ok" : ""}>{ka(p.valor)}</b>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </jaDigitados>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="plain notas">
          {a.notas.map((h) => (
            <li>{h}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
export const yt = (e) => `${e.slice(8, 10)}/${e.slice(5, 7)}`;
export const ec = (e) =>
  `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(e.slice(5, 7)) - 1]}/${e.slice(2, 4)}`;
export const an = (e) => (e < 0 ? `-${_(Math.abs(e))}` : _(e));
export const Kh = {
  critico: TriangleAlert,
  atencao: Clock,
  info: Info,
};
export function Financeiro() {
  const { live: e } = useBrain(),
    [a, t] = React.useState(null),
    [r, o] = React.useState(null),
    [s, i] = React.useState(null),
    [l, c] = React.useState(false),
    [u, v] = React.useState("resumo"),
    g = React.useCallback(() => {
      e &&
        api
          .financeiro()
          .then((h) => {
            (t(h), o(null));
          })
          .catch((h) => o(h instanceof Error ? h.message : "Erro ao carregar."));
    }, [e]);
  React.useEffect(() => {
    g();
    const h = window.setInterval(g, 6e4);
    return () => window.clearInterval(h);
  }, [g]);
  const x = async (h, f) => {
    try {
      const d = await h();
      (t(d.painel),
        avisos.push({
          kind: "ok",
          title: f,
        }));
    } catch (d) {
      avisos.push({
        kind: "erro",
        title: "N\xE3o deu certo",
        text: d instanceof Error ? d.message : "Erro desconhecido.",
        sticky: true,
      });
    }
  };
  if (!e)
    return (
      <div className="page">
        <header className="page-head">
          <h1>Financeiro</h1>
          <p>O financeiro guarda lançamentos reais. Abra a Central com o Brain ligado para ver.</p>
        </header>
      </div>
    );
  if (!a)
    return (
      <div className="page">
        <header className="page-head">
          <h1>Financeiro</h1>
          <p>{r ?? "Carregando\u2026"}</p>
        </header>
      </div>
    );
  if (a.vazio)
    return (
      <div className="page">
        <header className="page-head">
          <h1>Financeiro</h1>
          <p>
            Ainda não há lançamentos. Importe a planilha ou o extrato do Inter, ou cadastre a primeira conta.
          </p>
        </header>
        <NovaContaForm
          d={a}
          onSalvar={(h) => x(() => api.finConta(h), "Conta cadastrada")}
          aberto
          onFechar={() => {}}
        />
      </div>
    );
  const j = a.kpis,
    m = a.serie,
    N = j.mesesDeCaixa;
  return (
    <div className="page">
      <header className="page-head head-row">
        <div>
          <h1>Financeiro</h1>
          <p>
            {"Caixa do Inter, resultado, contas e alertas. Saldo at\xE9 "}
            {j.ultimoLancamento ? yt(j.ultimoLancamento) : "\u2014"}; o MRR vem das assinaturas (Stripe e
            Pix).
          </p>
        </div>
        <button type="button" className="btn" onClick={() => c((h) => !h)}>
          <Plus size={15} aria-hidden />
          {" Nova conta"}
        </button>
      </header>
      {r ? (
        <p className="banner" role="alert">
          {r}
        </p>
      ) : null}
      <NovaContaForm
        d={a}
        aberto={l}
        onFechar={() => c(false)}
        onSalvar={async (h) => {
          (await x(() => api.finConta(h), "Conta cadastrada"), c(false));
        }}
      />
      <nav className="subtabs" aria-label="Seções do financeiro">
        {[
          ["resumo", "Resumo"],
          ["dre", "DRE"],
          ["fluxo", "Fluxo de caixa"],
          ["contas", "Contas"],
          ["projecao", "Proje\xE7\xE3o"],
          ["indicadores", "Indicadores"],
          ["cadastros", "Cadastros"],
        ].map(([h, f]) => (
          <button type="button" aria-pressed={u === h} className={u === h ? "on" : ""} onClick={() => v(h)}>
            {f}
          </button>
        ))}
      </nav>
      {u === "resumo" ? (
        <>
          <section className="kpis fin-kpis" aria-label="Números principais">
            <div className="kpi kpi-hero">
              <span>Saldo no Inter</span>
              <b>{an(j.saldoInter)}</b>
              <small>
                {N === null
                  ? "Sem despesa m\xE9dia ainda"
                  : `Cobre ${N.toLocaleString("pt-BR")} ${N === 1 ? "m\xEAs" : "meses"} de despesa (m\xE9dia ${_(j.despesaMediaMensal)}/m\xEAs)`}
              </small>
            </div>
            <div className="kpi">
              <span>
                {"Resultado de "}
                {ec(`${a.mesRef}-01`)}
              </span>
              <b className={j.resultadoMes >= 0 ? "t-ok" : "t-crit"}>{an(j.resultadoMes)}</b>
              <small>
                {_(j.entradasMes)}
                {" entrou \xB7 "}
                {_(j.saidasMes)}
                {" saiu"}
              </small>
            </div>
            <div className="kpi">
              <span>MRR</span>
              <b>{_(j.mrr)}</b>
              <small>
                {j.clientesAtivos}
                {" clientes \xB7 ticket "}
                {j.ticketMedio === null ? "\u2014" : _(j.ticketMedio)}
              </small>
            </div>
            <div className="kpi">
              <span>A pagar em 30 dias</span>
              <b>{_(j.aPagar30d)}</b>
              <small>
                {a.aPagar.length}
                {" em aberto"}
              </small>
            </div>
            <div className="kpi">
              <span>A receber em 30 dias</span>
              <b>{_(j.aReceber30d)}</b>
              <small>
                {a.aReceber.length}
                {" em aberto"}
              </small>
            </div>
            <div className="kpi">
              <span>Pago fora do Inter</span>
              <b className={j.pagoForaDoInterTotal ? "t-warn" : ""}>{_(j.pagoForaDoInterTotal)}</b>
              <small>Cartão ou do bolso, no total</small>
            </div>
          </section>
          <div className="dash-grid">
            <section className="panel span-3" aria-labelledby="f-alertas">
              <h2 id="f-alertas">Alertas</h2>
              {a.alertas.length === 0 ? <p className="muted">Nada pedindo atenção agora.</p> : null}
              <ul className="acoes">
                {a.alertas.map((h) => (
                  <Xh a={h} />
                ))}
              </ul>
            </section>
            <section className="panel span-2" aria-labelledby="f-serie">
              <h2 id="f-serie">Entradas e saídas, 6 meses</h2>
              <GraficoLinhas
                label="Entradas e saídas por mês"
                money
                labels={m.map((h) => ec(`${h.mes}-01`))}
                series={[
                  {
                    name: "Entradas",
                    color: "var(--ok)",
                    values: m.map((h) => h.entradas),
                  },
                  {
                    name: "Sa\xEDdas",
                    color: "var(--crit)",
                    values: m.map((h) => h.saidas),
                  },
                ]}
              />
              <p className="muted">
                Entradas são o que caiu no Inter. Saídas são o que foi pago, inclusive no cartão.
              </p>
            </section>
            <section className="panel" aria-labelledby="f-extrato">
              <h2 id="f-extrato">Extrato recente</h2>
              <ul className="plain ext">
                {a.extratoRecente.slice(0, 9).map((h) => (
                  <li>
                    <span>
                      <b className={h.valor >= 0 ? "t-ok" : "t-crit"}>{an(h.valor)}</b>{" "}
                      <small className="muted">{yt(h.data)}</small>
                    </span>
                    <span className="ext-d">
                      {h.descricao}
                      {h.valor < 0 && !h.conciliado ? <em className="tag">sem conta</em> : null}
                    </span>
                  </li>
                ))}
              </ul>
              {a.semConciliar ? (
                <p className="muted">
                  {a.semConciliar}
                  {" sa\xEDda"}
                  {a.semConciliar > 1 ? "s" : ""}
                  {" do extrato sem conta a pagar vinculada."}
                </p>
              ) : null}
            </section>
            <section className="panel span-2" aria-labelledby="f-saldo">
              <h2 id="f-saldo">Saldo do Inter, 90 dias</h2>
              {a.saldoSerie.length > 1 ? (
                <GraficoLinhas
                  label="Saldo diário do Inter"
                  money
                  labels={a.saldoSerie.map((h) => yt(h.data))}
                  series={[
                    {
                      name: "Saldo",
                      color: "var(--blue)",
                      values: a.saldoSerie.map((h) => h.saldo),
                    },
                  ]}
                />
              ) : (
                <p className="muted">Importe o extrato para ver a evolução do saldo.</p>
              )}
            </section>
            <section className="panel" aria-labelledby="f-cat">
              <h2 id="f-cat">Despesas por categoria</h2>
              {a.despesasPorCategoria.length ? (
                <Ranking
                  label="Despesas do mês por categoria"
                  rows={a.despesasPorCategoria.map((h) => ({
                    label: h.categoria,
                    value: h.mes,
                    note: `${_(h.mes)} \xB7 m\xE9dia 3m ${_(h.tresMeses)}`,
                  }))}
                />
              ) : (
                <p className="muted">Sem despesas neste mês.</p>
              )}
            </section>
          </div>
        </>
      ) : null}
      {u === "contas" ? (
        <div className="dash-grid">
          <ListaContas
            titulo="A pagar"
            id="f-pagar"
            itens={a.aPagar}
            vazio="Nenhuma conta a pagar em aberto."
            aberta={s}
            setAberta={i}
            onPagar={(h, f, d) => x(() => api.finPagar(h.id, f, d), "Pagamento registrado")}
            onRemover={(h) => x(() => api.finRemover(h.id), "Conta removida")}
            verbo="Paguei"
          />
          <ListaContas
            titulo="A receber"
            id="f-receber"
            itens={a.aReceber}
            vazio="Nenhum recebimento avulso em aberto. Mensalidades entram pelo extrato."
            aberta={s}
            setAberta={i}
            onPagar={(h, f, d) => x(() => api.finPagar(h.id, f, d), "Recebimento registrado")}
            onRemover={(h) => x(() => api.finRemover(h.id), "Conta removida")}
            verbo="Recebi"
          />
          <section className="panel span-3" aria-labelledby="f-pagas">
            <h2 id="f-pagas">Pagas e recebidas recentemente</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <jaDigitados>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Quando</th>
                    <th className="num">Valor</th>
                    <th />
                  </jaDigitados>
                </thead>
                <tbody>
                  {a.pagasRecentes.map((h) => (
                    <jaDigitados>
                      <td>
                        {h.descricao}
                        {h.foraDoInter ? <em className="tag">fora do Inter</em> : null}
                      </td>
                      <td>{h.categoria}</td>
                      <td>{h.pagoEm ? yt(h.pagoEm) : "\u2014"}</td>
                      <td className="num">
                        {h.valor === null ? "\u2014" : an(h.tipo === "pagar" ? -h.valor : h.valor)}
                      </td>
                      <td className="num">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          aria-label={`Desfazer o pagamento de ${h.descricao}`}
                          onClick={() => x(() => api.finDesfazer(h.id), "Pagamento desfeito")}
                        >
                          <Undo2 size={14} aria-hidden />
                        </button>
                      </td>
                    </jaDigitados>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
      {u === "dre" ? <FinDre d={a} /> : null}
      {u === "fluxo" ? <FinSaldoInter d={a} /> : null}
      {u === "cadastros" ? (
        <div className="dash-grid">
          <RecorrenteForm d={a} rodar={x} />
          <ImportarExtrato rodar={x} />
          <LancamentoForm d={a} rodar={x} />
        </div>
      ) : null}
      {u === "projecao" ? <FinProjecao d={a} rodar={x} /> : null}
      {u === "indicadores" ? <FinMrr d={a} /> : null}
    </div>
  );
}
export function Xh({ a: e }) {
  const CompA = Kh[e.tom];
  return (
    <li>
      <div className={`acao acao-${e.tom} acao-estatica`}>
        <span className="acao-ico" aria-hidden>
          <a size={17} />
        </span>
        <span className="acao-txt">
          <strong>{e.titulo}</strong>
          <small>{e.detalhe}</small>
        </span>
      </div>
    </li>
  );
}
export function ListaContas({
  titulo: e,
  id: a,
  itens: t,
  vazio: r,
  aberta: o,
  setAberta: s,
  onPagar: i,
  onRemover: l,
  verbo: c,
}) {
  const u = /* @__PURE__ */ new Date().toLocaleDateString("sv-SE", {
      timeZone: "America/Sao_Paulo",
    }),
    [v, g] = React.useState(u),
    [x, j] = React.useState("");
  return (
    <section className="panel span-3 f-lista" aria-labelledby={a}>
      <h2 id={a}>
        {e} <small className="muted">({t.length})</small>
      </h2>
      {t.length === 0 ? <p className="muted">{r}</p> : null}
      <ul className="contas">
        {t.slice(0, 12).map((m) => (
          <li className={m.status === "atrasado" ? "conta-atrasada" : ""}>
            <div className="conta-linha">
              <b className="conta-dia">{yt(m.vencimento)}</b>
              <span className="conta-desc">
                {m.descricao}
                <small className="muted">
                  {" \xB7 "}
                  {m.categoria}
                  {m.recorrente ? " \xB7 recorrente" : ""}
                </small>
                {m.status === "atrasado" ? <em className="tag tag-crit">atrasada</em> : null}
              </span>
              <b className="num">{m.valor === null ? "\u2014" : _(m.valor)}</b>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  (s(o === m.id ? null : m.id), g(u), j(m.valor === null ? "" : String(m.valor)));
                }}
              >
                <Check size={14} aria-hidden /> {c}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                aria-label={`Remover ${m.descricao}`}
                onClick={() => l(m)}
              >
                <X size={14} aria-hidden />
              </button>
            </div>
            {o === m.id ? (
              <form
                className="conta-form"
                onSubmit={(N) => {
                  (N.preventDefault(), i(m, v, x === "" ? void 0 : Number(x.replace(",", "."))), s(null));
                }}
              >
                <label>
                  Data
                  <input type="date" value={v} onChange={(N) => g(N.target.value)} required />
                </label>
                <label>
                  Valor real (R$)
                  <input
                    inputMode="decimal"
                    value={x}
                    onChange={(N) => j(N.target.value)}
                    placeholder="igual ao previsto"
                  />
                </label>
                <button type="submit" className="btn btn-go">
                  Confirmar
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
      {t.length > 12 ? (
        <p className="muted">
          {"Mostrando as 12 primeiras de "}
          {t.length}.
        </p>
      ) : null}
    </section>
  );
}
export function NovaContaForm({ d: e, aberto: a, onFechar: t, onSalvar: r }) {
  const [o, s] = React.useState("pagar"),
    [i, l] = React.useState(""),
    [c, u] = React.useState(e.categoriasDespesa[0] ?? ""),
    [v, g] = React.useState(e.hoje),
    [x, j] = React.useState(""),
    [m, N] = React.useState("1");
  if (!a) return null;
  const h = o === "pagar" ? e.categoriasDespesa : e.categoriasReceita,
    f = (d) => {
      (d.preventDefault(),
        r({
          tipo: o,
          descricao: i,
          categoria: h.includes(c) ? c : h[0],
          vencimento: v,
          valor: x === "" ? null : Number(x.replace(",", ".")),
          recorrenciaMeses: Number(m) || 1,
        }),
        l(""),
        j(""));
    };
  return (
    <form className="panel conta-novo" onSubmit={f} aria-label="Nova conta">
      <h2>Nova conta</h2>
      <div className="conta-grid">
        <label>
          Tipo
          <select
            value={o}
            onChange={(d) => {
              const p = d.target.value;
              (s(p), u((p === "pagar" ? e.categoriasDespesa : e.categoriasReceita)[0]));
            }}
          >
            <option value="pagar">A pagar</option>
            <option value="receber">A receber</option>
          </select>
        </label>
        <label>
          Descrição
          <input
            value={i}
            onChange={(d) => l(d.target.value)}
            required
            maxLength={200}
            placeholder="Ex.: Contador, Railway"
          />
        </label>
        <label>
          Categoria
          <select value={h.includes(c) ? c : h[0]} onChange={(d) => u(d.target.value)}>
            {h.map((d) => (
              <option>{d}</option>
            ))}
          </select>
        </label>
        <label>
          Vencimento
          <input type="date" value={v} onChange={(d) => g(d.target.value)} required />
        </label>
        <label>
          Valor (R$)
          <input inputMode="decimal" value={x} onChange={(d) => j(d.target.value)} placeholder="0,00" />
        </label>
        <label>
          Repetir por (meses)
          <input type="number" min={1} max={60} value={m} onChange={(d) => N(d.target.value)} />
        </label>
      </div>
      <div className="conta-acoes">
        <button type="submit" className="btn btn-go">
          Salvar conta
        </button>
        <button type="button" className="btn btn-ghost" onClick={t}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
export function RecorrenteForm({ d: e, rodar: a }) {
  const [t, r] = React.useState(""),
    [o, s] = React.useState(""),
    [i, l] = React.useState("10"),
    c = (v) => {
      (v.preventDefault(),
        a(
          () =>
            api.finCobranca({
              nome: t,
              valor: Number(o.replace(",", ".")),
              dia: Number(i),
              forma: "pix",
            }),
          "Cobran\xE7a cadastrada",
        ).then(() => {
          (r(""), s(""));
        }));
    },
    u = e.cobrancas.filter((v) => v.ativa).reduce((v, g) => v + g.valor, 0);
  return (
    <section className="panel span-3" aria-labelledby="f-cob">
      <h2 id="f-cob">
        {"Cobran\xE7as recorrentes "}
        <small className="muted">({e.cobrancas.length})</small>
      </h2>
      <p className="muted">
        {
          "Quem paga todo m\xEAs por Pix. Cada cobran\xE7a ativa gera o receb\xEDvel do m\xEAs e dos 2 seguintes, que concilia sozinho quando o Pix cai no extrato. Ativas somam "
        }
        {_(u)}/mês.
      </p>
      {e.cobrancas.length ? (
        <ul className="contas">
          {e.cobrancas.map((v) => (
            <li>
              <div className="conta-linha">
                <b className="conta-dia">
                  {"dia "}
                  {v.dia}
                </b>
                <span className="conta-desc">
                  {v.nome}
                  <small className="muted">
                    {" \xB7 "}
                    {v.forma}
                  </small>
                  {v.ativa ? null : <em className="tag">pausada</em>}
                </span>
                <b className="num">{_(v.valor)}</b>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() =>
                    a(
                      () => api.finCobrancaAtivar(v.id, !v.ativa),
                      v.ativa ? "Cobran\xE7a pausada" : "Cobran\xE7a reativada",
                    )
                  }
                >
                  {v.ativa ? "Pausar" : "Reativar"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={`Remover a cobran\xE7a de ${v.nome}`}
                  onClick={() => a(() => api.finCobrancaRemover(v.id), "Cobran\xE7a removida")}
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">Nenhuma cobrança cadastrada. Ex.: Antera, R$ 300, dia 10.</p>
      )}
      <form className="conta-grid cob-grid" onSubmit={c} aria-label="Nova cobrança recorrente">
        <label>
          Quem paga
          <input
            value={t}
            onChange={(v) => r(v.target.value)}
            required
            maxLength={120}
            placeholder="Ex.: Antera"
          />
        </label>
        <label>
          Valor (R$)
          <input
            inputMode="decimal"
            value={o}
            onChange={(v) => s(v.target.value)}
            required
            placeholder="0,00"
          />
        </label>
        <label>
          Dia do mês
          <input type="number" min={1} max={31} value={i} onChange={(v) => l(v.target.value)} required />
        </label>
        <div className="conta-acoes">
          <button type="submit" className="btn btn-go">
            <Plus size={14} aria-hidden />
            {" Cadastrar cobran\xE7a"}
          </button>
        </div>
      </form>
    </section>
  );
}
export function LancamentoForm({ d: e, rodar: a }) {
  const [t, r] = React.useState("saida"),
    [o, s] = React.useState(e.hoje),
    [i, l] = React.useState(""),
    [c, u] = React.useState(""),
    [v, g] = React.useState(""),
    x = t === "entrada" ? e.categoriasReceita : e.categoriasDespesa,
    j = (m) => {
      m.preventDefault();
      const N = Math.abs(Number(c.replace(",", ".")));
      a(
        () =>
          api.finLancamento({
            data: o,
            descricao: i,
            valor: t === "entrada" ? N : -N,
            categoria: x.includes(v) ? v : x[0],
          }),
        "Lan\xE7amento registrado",
      ).then(() => {
        (l(""), u(""));
      });
    };
  return (
    <section className="panel span-3" aria-labelledby="f-avulso">
      <h2 id="f-avulso">Lançamento avulso no caixa</h2>
      <p className="muted">
        Para o que não veio do extrato do Inter (dinheiro em espécie, ajuste). Entra no saldo e no resultado
        do mês.
      </p>
      <form className="conta-grid" onSubmit={j} aria-label="Novo lançamento avulso">
        <label>
          Tipo
          <select
            value={t}
            onChange={(m) => {
              (r(m.target.value), g(""));
            }}
          >
            <option value="saida">Saída</option>
            <option value="entrada">Entrada</option>
          </select>
        </label>
        <label>
          Data
          <input type="date" value={o} onChange={(m) => s(m.target.value)} required />
        </label>
        <label>
          Descrição
          <input value={i} onChange={(m) => l(m.target.value)} required maxLength={200} />
        </label>
        <label>
          Categoria
          <select value={x.includes(v) ? v : x[0]} onChange={(m) => g(m.target.value)}>
            {x.map((m) => (
              <option>{m}</option>
            ))}
          </select>
        </label>
        <label>
          Valor (R$)
          <input
            inputMode="decimal"
            value={c}
            onChange={(m) => u(m.target.value)}
            required
            placeholder="0,00"
          />
        </label>
        <div className="conta-acoes">
          <button type="submit" className="btn btn-go">
            Registrar
          </button>
        </div>
      </form>
      {e.lancamentosManuais.length ? (
        <ul className="contas">
          {e.lancamentosManuais.map((m) => (
            <li>
              <div className="conta-linha">
                <b className="conta-dia">{yt(m.data)}</b>
                <span className="conta-desc">
                  {m.descricao}
                  <small className="muted">
                    {" \xB7 "}
                    {m.categoria ?? "sem categoria"}
                  </small>
                </span>
                <b className={`num ${m.valor >= 0 ? "t-ok" : "t-crit"}`}>{an(m.valor)}</b>
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label={`Remover o lan\xE7amento ${m.descricao}`}
                  onClick={() => a(() => api.finLancamentoRemover(m.id), "Lan\xE7amento removido")}
                >
                  <X size={14} aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
export function ImportarExtrato({ rodar: e }) {
  const [a, t] = React.useState(""),
    [r, o] = React.useState(null),
    s = async () => {
      try {
        const i = await api.finImportarExtrato(a),
          l = i.resumo;
        (o(
          `${l.lidos} lan\xE7amentos lidos: ${l.novos} novos, ${l.jaExistiam} j\xE1 existiam. ${l.confere === null ? "" : l.confere ? "O saldo do Brain bate com o do extrato." : `Aten\xE7\xE3o: o saldo do Brain (${_(l.saldoNoBrain)}) n\xE3o bate com o do extrato (${_(l.saldoDoExtrato ?? 0)}).`}`,
        ),
          await e(
            async () => ({
              painel: i.painel,
            }),
            "Extrato importado",
          ),
          t(""));
      } catch (i) {
        o(i instanceof Error ? i.message : "N\xE3o consegui ler o arquivo.");
      }
    };
  return (
    <section className="panel span-3" aria-labelledby="f-imp">
      <h2 id="f-imp">Importar extrato do Inter</h2>
      <p className="muted">
        Escolha o CSV do extrato (ou cole o texto copiado do PDF). Lançamentos que já existem com a mesma data
        e valor não duplicam, e o saldo é conferido com o do arquivo.
      </p>
      <div className="conta-grid">
        <label>
          Arquivo
          <input
            type="file"
            accept=".csv,.txt"
            onChange={(i) => {
              const l = i.target.files?.[0];
              l && l.text().then(t);
            }}
          />
        </label>
        <label className="imp-texto">
          Ou cole o texto
          <textarea rows={4} value={a} onChange={(i) => t(i.target.value)} />
        </label>
        <div className="conta-acoes">
          <button type="button" className="btn btn-go" disabled={!a.trim()} onClick={() => void s()}>
            Importar
          </button>
        </div>
      </div>
      {r ? <p role="status">{r}</p> : null}
    </section>
  );
}
