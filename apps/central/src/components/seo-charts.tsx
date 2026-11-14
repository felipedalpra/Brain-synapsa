// @ts-nocheck
// Gráficos da aba SEO. Desenhados no tamanho real da tela (nada esticado) e com valores ao passar o mouse ou tocar.
import * as React from "react";

export const fmt = (x) => Math.round(x).toLocaleString("pt-BR");
export const fmt1 = (x) => x.toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
export const pct = (x) => `${(x * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
export const dd = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
export const diaLongo = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)} (${SEMANA[new Date(`${d}T12:00:00Z`).getUTCDay()]})`;

function useLargura(ref, padrao = 640) {
  const [w, setW] = React.useState(padrao);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(Math.max(280, Math.floor(el.getBoundingClientRect().width)));
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/** Marcas redondas para o eixo: 0, 5, 10… em vez de 0, 3,7, 7,3. */
function marcas(min, max, n = 4) {
  const span = Math.max(1e-9, max - min);
  const bruto = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= bruto) ?? 10 * mag;
  const ini = Math.floor(min / passo) * passo;
  const out = [];
  for (let v = ini; v <= max + passo * 0.001; v += passo) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

const media = (v, i, k) => {
  const ini = Math.max(0, i - k + 1);
  let s = 0;
  for (let j = ini; j <= i; j++) s += v[j];
  return s / (i - ini + 1);
};

/**
 * Linhas por dia com eixo esquerdo e direito, mira vertical e quadro com todos os valores do dia.
 * series: [{ key, label, color, eixo: "e" | "d", fmt }]. dados: [{ dia, ...valores }].
 */
export function LinhaInterativa({ dados, series, altura = 250, invertido = false, titulo }) {
  const box = React.useRef(null);
  const w = useLargura(box);
  const [off, setOff] = React.useState(() => new Set());
  const [suave, setSuave] = React.useState(false);
  const [hover, setHover] = React.useState(null);
  const id = React.useId().replace(/:/g, "");
  const n = dados.length;
  if (n < 2) return <p className="empty">Poucos dias de dados para desenhar o gráfico.</p>;
  const m = { l: 46, r: series.some((s) => s.eixo === "d") ? 50 : 14, t: 14, b: 28 };
  const iw = w - m.l - m.r, ih = altura - m.t - m.b;
  const vis = series.filter((s) => !off.has(s.key));
  const val = (s, i) => (suave ? media(dados.map((d) => d[s.key] ?? 0), i, 7) : dados[i][s.key] ?? 0);
  const todos = (eixo) => vis.filter((s) => s.eixo === eixo).flatMap((s) => dados.map((_, i) => val(s, i)));
  const escala = (eixo) => {
    const v = todos(eixo);
    if (!v.length) return null;
    let lo = invertido ? Math.floor(Math.min(...v) - 1) : 0, hi = invertido ? Math.ceil(Math.max(...v) + 1) : Math.max(1, Math.max(...v) * 1.08);
    if (invertido) lo = Math.max(1, lo);
    const ticks = marcas(lo, hi).filter((t) => !invertido || t >= 1);
    lo = Math.min(lo, ticks[0]); hi = Math.max(hi, ticks[ticks.length - 1]);
    const y = (x) => m.t + (invertido ? (x - lo) / (hi - lo || 1) : 1 - (x - lo) / (hi - lo || 1)) * ih;
    return { ticks, y };
  };
  const E = escala("e"), D = escala("d");
  const x = (i) => m.l + (i / (n - 1)) * iw;
  const caminho = (s, esc) => dados.map((_, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${esc.y(val(s, i)).toFixed(1)}`).join("");
  const passoX = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 62))));
  const mover = (ev) => {
    const r = ev.currentTarget.getBoundingClientRect();
    setHover(Math.min(n - 1, Math.max(0, Math.round(((ev.clientX - r.left - m.l) / iw) * (n - 1)))));
  };
  const hx = hover == null ? 0 : x(hover);
  const lado = hover != null && hx > w * 0.58;
  return (
    <figure className="seo-chart" ref={box}>
      <div className="seo-chart-top">
        {titulo ? <strong>{titulo}</strong> : <span />}
        <div className="seo-chart-ctl">
          {series.map((s) => (
            <button key={s.key} type="button" className={`seo-leg${off.has(s.key) ? " off" : ""}`} aria-pressed={!off.has(s.key)}
              onClick={() => setOff((o) => { const c = new Set(o); c.has(s.key) ? c.delete(s.key) : c.add(s.key); return c; })}>
              <i style={{ background: s.color }} />{s.label}
            </button>
          ))}
          <button type="button" className={`seo-leg${suave ? " on" : ""}`} aria-pressed={suave} onClick={() => setSuave((v) => !v)}>Média de 7 dias</button>
        </div>
      </div>
      <div className="seo-chart-area" style={{ height: altura }}>
        <svg width={w} height={altura} role="img" aria-label={titulo ?? "Gráfico por dia"} onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setHover(null)} style={{ touchAction: "pan-y" }}>
          <defs>
            <linearGradient id={`a${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={series[0].color} stopOpacity="0.28" /><stop offset="1" stopColor={series[0].color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {E ? E.ticks.map((t) => (
            <g key={`e${t}`}>
              <line x1={m.l} x2={w - m.r} y1={E.y(t)} y2={E.y(t)} className="chart-grid" />
              <text x={m.l - 8} y={E.y(t) + 4} textAnchor="end" className="chart-axis">{fmt(t)}</text>
            </g>
          )) : null}
          {D ? D.ticks.map((t) => (
            <text key={`d${t}`} x={w - m.r + 8} y={D.y(t) + 4} className="chart-axis">{fmt(t)}</text>
          )) : null}
          {dados.map((d, i) => (i % passoX === 0 || i === n - 1) && (n - 1 - i >= passoX * 0.6 || i === n - 1) ? (
            <text key={d.dia} x={x(i)} y={altura - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="chart-axis">{dd(d.dia)}</text>
          ) : null)}
          {E && !invertido && vis[0] && vis[0].eixo === "e" ? <path d={`${caminho(vis[0], E)}L${x(n - 1)},${E.y(0)}L${x(0)},${E.y(0)}Z`} fill={`url(#a${id})`} /> : null}
          {vis.map((s) => {
            const esc = s.eixo === "d" ? D : E;
            return esc ? (
              <g key={s.key}>
                <path d={caminho(s, esc)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {n <= 45 ? dados.map((_, i) => <circle key={i} cx={x(i)} cy={esc.y(val(s, i))} r="2.2" fill={s.color} opacity="0.75" />) : null}
              </g>
            ) : null;
          })}
          {hover != null ? (
            <g pointerEvents="none">
              <line x1={hx} x2={hx} y1={m.t} y2={altura - m.b} stroke="var(--text)" strokeOpacity="0.35" strokeDasharray="3 3" />
              {vis.map((s) => { const esc = s.eixo === "d" ? D : E; return esc ? <circle key={s.key} cx={hx} cy={esc.y(val(s, hover))} r="4.5" fill={s.color} stroke="var(--bg)" strokeWidth="2" /> : null; })}
            </g>
          ) : null}
        </svg>
        {hover != null ? (
          <div className="seo-tip" style={{ left: lado ? undefined : hx + 14, right: lado ? w - hx + 14 : undefined, top: m.t }}>
            <b>{diaLongo(dados[hover].dia)}</b>
            {series.map((s) => (
              <div key={s.key} style={off.has(s.key) ? { opacity: 0.4 } : null}>
                <i style={{ background: s.color }} />{s.label}{suave ? " (média 7d)" : ""}
                <em>{(s.fmt ?? fmt)(val(s, hover))}</em>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </figure>
  );
}

/** Barras horizontais com número ao lado e detalhe ao passar o mouse. itens: [{ rotulo, valor, detalhe, cor }]. */
export function Barras({ itens, formato = fmt, vazio = "Sem dados." }) {
  const max = Math.max(1, ...itens.map((i) => i.valor));
  if (!itens.length) return <p className="empty">{vazio}</p>;
  return (
    <ul className="seo-barras">
      {itens.map((i) => (
        <li key={i.rotulo} title={i.detalhe ?? `${i.rotulo}: ${formato(i.valor)}`}>
          <span className="seo-barra-rot">{i.rotulo}</span>
          <span className="seo-barra-trilho"><i style={{ width: `${Math.max(i.valor > 0 ? 2 : 0, (i.valor / max) * 100)}%`, background: i.cor ?? "var(--core-2)" }} /></span>
          <b>{formato(i.valor)}</b>
          {i.detalhe ? <small>{i.detalhe}</small> : null}
        </li>
      ))}
    </ul>
  );
}

/** 28 colunas, uma por dia. Cada coluna tem o valor do dia ao passar o mouse. */
export function Mini({ serie, chave = "impressions", cor = "var(--core-2)" }) {
  const max = Math.max(1, ...serie.map((s) => s[chave]));
  const W = 112, H = 26, g = 1, cw = (W - g * (serie.length - 1)) / serie.length;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Impressões dos últimos 28 dias" className="seo-mini">
      {serie.map((s, i) => {
        const h = s[chave] ? Math.max(2, (s[chave] / max) * (H - 2)) : 1;
        return (
          <rect key={s.dia} x={i * (cw + g)} y={H - h} width={cw} height={h} rx="1" fill={s.clicks > 0 ? "var(--ok)" : cor} opacity={s[chave] ? 0.95 : 0.25}>
            <title>{`${diaLongo(s.dia)}: ${fmt(s.impressions)} impressões, ${fmt(s.clicks)} cliques`}</title>
          </rect>
        );
      })}
    </svg>
  );
}

/** Etapas lado a lado com a taxa de passagem entre elas. */
export function Funil({ etapas }) {
  const max = Math.max(1, ...etapas.map((e) => e.valor));
  return (
    <ol className="seo-funil">
      {etapas.map((e, i) => (
        <li key={e.rotulo} title={e.nota}>
          <span>{e.rotulo}</span>
          <b>{fmt(e.valor)}</b>
          <i style={{ width: `${Math.max(3, (e.valor / max) * 100)}%`, background: e.cor ?? "var(--core-2)" }} />
          <small>{i > 0 && etapas[i - 1].valor > 0 ? `${pct(e.valor / etapas[i - 1].valor)} da etapa anterior` : e.nota ?? ""}</small>
        </li>
      ))}
    </ol>
  );
}
