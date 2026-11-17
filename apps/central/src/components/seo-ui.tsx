// @ts-nocheck
// Peças compartilhadas pelas abas Search Console e Google Analytics.
import * as React from "react";

export const normaliza = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function Delta({ atual, antes, inverso = false, sufixo = "" }) {
  if (!antes) return <span className="seo-delta">{atual ? "novo" : "—"}</span>;
  const d = ((atual - antes) / antes) * 100;
  const bom = inverso ? d < 0 : d > 0;
  return <span className={`seo-delta ${Math.abs(d) < 1 ? "" : bom ? "up" : "down"}`}>{d > 0 ? "+" : ""}{Math.round(d)}%{sufixo}</span>;
}

export function Kpi({ rotulo, valor, filho, nota }) {
  return (
    <div className="kpi">
      <span>{rotulo}</span>
      <b>{valor}</b>
      <small>{filho}{nota ? <> · {nota}</> : null}</small>
    </div>
  );
}

export function useOrdem(linhas, inicial, desc = true) {
  const [ord, setOrd] = React.useState({ k: inicial, desc });
  const ordenadas = React.useMemo(() => {
    const val = (l) => { const v = typeof ord.k === "function" ? ord.k(l) : l[ord.k]; return typeof v === "string" ? normaliza(v) : v ?? 0; };
    return [...linhas].sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (ord.desc ? -1 : 1); });
  }, [linhas, ord]);
  const Th = ({ k, children, num = true }) => (
    <th className={num ? "num" : ""} aria-sort={ord.k === k ? (ord.desc ? "descending" : "ascending") : "none"}>
      <button type="button" className="seo-th" onClick={() => setOrd((o) => ({ k, desc: o.k === k ? !o.desc : k !== "position" }))}>
        {children}{ord.k === k ? (ord.desc ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );
  return { ordenadas, Th };
}

export function Chips({ opcoes, valor, onChange }) {
  return (
    <div className="seo-chips" role="group">
      {opcoes.map((o) => (
        <button key={o.id} type="button" className={valor === o.id ? "on" : ""} aria-pressed={valor === o.id} onClick={() => onChange(o.id)}>
          {o.rotulo}{o.n != null ? <em>{o.n}</em> : null}
        </button>
      ))}
    </div>
  );
}

