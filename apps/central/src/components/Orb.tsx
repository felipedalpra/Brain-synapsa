// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { Q, Ze } from "../shared-inline";
import { An } from "../lib";

export const re = 400;
export const or = [138, 192, 246, 300, 352];
export function posicoesOrbita() {
  const e = [];
  return (
    Ze.forEach((a, t) => {
      const r = Q.filter((o) => a.areas.includes(o.area));
      r.forEach((o, s) =>
        e.push({
          id: o.id,
          ring: t,
          base: (s / r.length) * Math.PI * 2 + t * 0.7,
          hue: a.hue,
        }),
      );
    }),
    e
  );
}
export function Orb({ runtime: e, pendingBy: a, kill: t, thinking: r, selected: o, onSelect: s }) {
  const i = React.useMemo(posicoesOrbita, []),
    l = React.useRef({}),
    c = React.useRef({}),
    u = React.useRef(null),
    [v, g] = React.useState(null),
    [x, j] = React.useState(null),
    m = React.useRef(false),
    N = React.useRef(0),
    h = React.useRef({
      runtime: e,
      thinking: r,
    });
  ((h.current = {
    runtime: e,
    thinking: r,
  }),
    (m.current = v !== null),
    React.useEffect(() => {
      const C = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let k = 0,
        w = performance.now();
      const y = () => {
          for (const q of i) {
            const W = (0.05 + q.ring * 0.012) * (q.ring % 2 ? -1 : 1),
              Ce = q.base + N.current * W,
              E = re + Math.cos(Ce) * or[q.ring],
              V = re + Math.sin(Ce) * or[q.ring];
            l.current[q.id]?.setAttribute("transform", `translate(${E.toFixed(1)} ${V.toFixed(1)})`);
            const me = c.current[q.id];
            me && (me.setAttribute("x2", E.toFixed(1)), me.setAttribute("y2", V.toFixed(1)));
          }
        },
        A = (q) => {
          const W = Math.min(0.05, (q - w) / 1e3);
          ((w = q),
            !m.current && !C && (N.current += W * (h.current.thinking ? 3 : 1)),
            y(),
            (k = requestAnimationFrame(A)));
        };
      return (y(), C || (k = requestAnimationFrame(A)), () => cancelAnimationFrame(k));
    }, [i]));
  const f = (C) => {
      g(C);
      const k = l.current[C],
        w = u.current?.getBoundingClientRect();
      if (k && w) {
        const y = k.getBoundingClientRect();
        j({
          x: y.left + y.width / 2 - w.left,
          y: y.top - w.top,
        });
      }
    },
    d = () => {
      (g(null), j(null));
    },
    p = v ? Q.find((C) => C.id === v) : null,
    S = v ? e[v] : null;
  return (
    <div className={`orb ${t ? "orb-kill" : ""} ${r ? "orb-think" : ""}`} ref={u}>
      <svg viewBox="0 0 800 800" role="group" aria-label="Os 24 agentes ao redor do núcleo do Brain">
        <defs>
          <radialGradient id="core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--core-1)" stopOpacity="1" />
            <stop offset="38%" stopColor="var(--core-2)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--core-3)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--core-2)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--core-3)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={re} cy={re} r={390} fill="url(#halo)" />
        {or.map((C, k) => (
          <circle cx={re} cy={re} r={C} className="orb-ring" strokeDasharray={k % 2 ? "2 7" : "1 5"} />
        ))}
        <circle cx={re} cy={re} r={or[0] - 34} className="orb-ring orb-ring-inner" />
        {i.map((C) =>
          e[C.id]?.status === "trabalhando" && !t ? (
            <line
              ref={(k) => void (c.current[C.id] = k)}
              x1={re}
              y1={re}
              x2={re}
              y2={re}
              className="orb-link"
              style={{
                stroke: `var(${C.hue})`,
              }}
            />
          ) : null,
        )}
        <g className="orb-core">
          <circle cx={re} cy={re} r={112} fill="url(#core)" className="orb-breath" />
          <circle cx={re} cy={re} r={58} className="orb-eye" />
          <circle cx={re} cy={re} r={84} className="orb-eye-ring" />
          <circle cx={re} cy={re} r={84} className="orb-wave" />
          <circle cx={re} cy={re} r={84} className="orb-wave orb-wave-2" />
        </g>
        {i.map((C) => {
          const k = Q.find((q) => q.id === C.id),
            w = e[C.id],
            y = t ? "pausado" : (w?.status ?? "ocioso"),
            A = a[C.id] ?? 0;
          return (
            <g
              ref={(q) => void (l.current[C.id] = q)}
              className={`orb-node st-${y} ${o === C.id ? "is-selected" : ""}`}
              style={{
                color: `var(${C.hue})`,
              }}
              role="button"
              tabIndex={0}
              aria-label={`${k.name}, ${y}${A ? `, ${A} proposta(s) esperando` : ""}`}
              onMouseEnter={() => f(C.id)}
              onMouseLeave={d}
              onFocus={() => f(C.id)}
              onBlur={d}
              onClick={() => s(C.id)}
              onKeyDown={(q) => {
                (q.key === "Enter" || q.key === " ") && (q.preventDefault(), s(C.id));
              }}
            >
              <circle r={22} className="orb-hit" />
              <circle r={14} className="orb-pulse" />
              <circle r={7.5} className="orb-dot" />
              {A > 0 && y !== "pausado" ? <circle cx={9} cy={-9} r={4} className="orb-pend" /> : null}
              {o === C.id ? <circle r={15} className="orb-sel" /> : null}
            </g>
          );
        })}
      </svg>
      {p && x ? (
        <div
          className="orb-tip"
          style={{
            left: x.x,
            top: x.y,
          }}
          role="status"
        >
          <strong>{p.name}</strong>
          <span>
            {An(p).name}
            {" \xB7 "}
            {t
              ? "parado"
              : S?.status === "trabalhando"
                ? "trabalhando agora"
                : S?.status === "pausado"
                  ? "pausado"
                  : "aguardando gatilho"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
