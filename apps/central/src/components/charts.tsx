// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";

export const fmtInt = (e) =>
  e.toLocaleString("pt-BR", {
    maximumFractionDigits: 0,
  });
export function GraficoLinhas({ series: e, labels: a, height: t = 150, money: r = false, label: o }) {
  const s = React.useId(),
    i = 600,
    l = t,
    c = {
      l: 44,
      r: 8,
      t: 10,
      b: 22,
    },
    u = e.flatMap((d) => d.values),
    v = Math.max(1, ...u),
    g = Math.min(0, ...u),
    x = Math.max(1, a.length - 1),
    j = (d) => c.l + (d / x) * (i - c.l - c.r),
    m = (d) => c.t + (1 - (d - g) / (v - g || 1)) * (l - c.t - c.b),
    N = (d) => (r ? `R$ ${fmtInt(d)}` : fmtInt(d)),
    h = [g, (g + v) / 2, v],
    f = e[0];
  return (
    <figure className="chart">
      <svg
        viewBox={`0 0 ${i} ${l}`}
        role="img"
        aria-label={o}
        preserveAspectRatio="none"
        style={{
          height: t,
        }}
      >
        {h.map((d) => (
          <g>
            <line x1={c.l} x2={i - c.r} y1={m(d)} y2={m(d)} className="chart-grid" />
            <text x={c.l - 6} y={m(d) + 4} textAnchor="end" className="chart-axis">
              {N(d)}
            </text>
          </g>
        ))}
        {f && f.values.length > 1 ? (
          <>
            <defs>
              <linearGradient id={`g${s}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={f.color} stopOpacity="0.32" />
                <stop offset="1" stopColor={f.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              fill={`url(#g${s})`}
              points={`${j(0)},${m(g)} ${f.values.map((d, p) => `${j(p)},${m(d)}`).join(" ")} ${j(f.values.length - 1)},${m(g)}`}
            />
          </>
        ) : null}
        {e.map((d) =>
          d.values.length > 1 ? (
            <polyline
              fill="none"
              stroke={d.color}
              strokeWidth="2.2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              points={d.values.map((p, S) => `${j(S)},${m(p)}`).join(" ")}
            />
          ) : (
            d.values.map((p, S) => <circle cx={j(S)} cy={m(p)} r="4" fill={d.color} />)
          ),
        )}
        {a.length > 0 ? (
          <>
            <text x={c.l} y={l - 4} className="chart-axis">
              {a[0]}
            </text>
            {a.length > 1 ? (
              <text x={i - c.r} y={l - 4} textAnchor="end" className="chart-axis">
                {a[a.length - 1]}
              </text>
            ) : null}
          </>
        ) : null}
      </svg>
      {e.length > 1 ? (
        <figcaption className="legend">
          {e.map((d) => (
            <span>
              <i
                className="dot"
                style={{
                  background: d.color,
                }}
              />{" "}
              {d.name}
            </span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  );
}
export function GraficoBarras({
  values: e,
  labels: a,
  color: t,
  height: r = 120,
  money: o = false,
  label: s,
}) {
  const i = Math.max(1, ...e);
  return (
    <figure className="chart">
      <div
        className="bars"
        role="img"
        aria-label={s}
        style={{
          height: r,
        }}
      >
        {e.map((l, c) => (
          <span className="bar-col" title={`${a[c]}: ${o ? "R$ " : ""}${fmtInt(l)}`}>
            <i
              style={{
                height: `${Math.max(2, (l / i) * 100)}%`,
                background: t,
              }}
            />
          </span>
        ))}
      </div>
      <figcaption className="chart-foot">
        <span>{a[0]}</span>
        <span>{a.length > 1 ? a[a.length - 1] : ""}</span>
      </figcaption>
    </figure>
  );
}
export function Ranking({ rows: e, label: a, suffix: t = "" }) {
  const r = Math.max(1, ...e.map((o) => o.value));
  return (
    <ul className="hbars" aria-label={a}>
      {e.map((o) => (
        <li>
          <span className="hb-label">{o.label}</span>
          <span className="hb-track" aria-hidden>
            <i
              style={{
                width: `${o.value ? Math.max(3, (o.value / r) * 100) : 0}%`,
                background: o.color ?? "var(--core-2)",
              }}
            />
          </span>
          <b className="hb-val">
            {fmtInt(o.value)}
            {t}
          </b>
          {o.note ? <small className="hb-note">{o.note}</small> : null}
        </li>
      ))}
    </ul>
  );
}
