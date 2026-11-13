import { useEffect, useMemo, useRef, useState } from "react";
import { AGENTS } from "../data/roster";
import { TEAMS } from "../data/teams";
import { teamOf } from "../lib";
import type { AgentRuntime } from "../types";

interface Props {
  runtime: Record<string, AgentRuntime>;
  pendingBy: Record<string, number>;
  kill: boolean;
  thinking: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
}

const C = 400;
const RADII = [138, 192, 246, 300, 352];

interface NodeDef {
  id: string;
  ring: number;
  base: number;
  hue: string;
}

/** Um anel por time; cada agente é um ponto girando devagar ao redor do núcleo. */
function layout(): NodeDef[] {
  const out: NodeDef[] = [];
  TEAMS.forEach((t, ring) => {
    const members = AGENTS.filter((a) => t.areas.includes(a.area));
    members.forEach((a, i) => out.push({ id: a.id, ring, base: (i / members.length) * Math.PI * 2 + ring * 0.7, hue: t.hue }));
  });
  return out;
}

export function Orb({ runtime, pendingBy, kill, thinking, selected, onSelect }: Props) {
  const nodes = useMemo(layout, []);
  const nodeRefs = useRef<Record<string, SVGGElement | null>>({});
  const lineRefs = useRef<Record<string, SVGLineElement | null>>({});
  const stage = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const frozen = useRef(false);
  const clock = useRef(0);
  const live = useRef({ runtime, thinking });
  live.current = { runtime, thinking };
  frozen.current = hover !== null;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    const place = () => {
      for (const n of nodes) {
        const speed = (0.05 + n.ring * 0.012) * (n.ring % 2 ? -1 : 1);
        const ang = n.base + clock.current * speed;
        const x = C + Math.cos(ang) * RADII[n.ring]!;
        const y = C + Math.sin(ang) * RADII[n.ring]!;
        nodeRefs.current[n.id]?.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        const l = lineRefs.current[n.id];
        if (l) {
          l.setAttribute("x2", x.toFixed(1));
          l.setAttribute("y2", y.toFixed(1));
        }
      }
    };
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!frozen.current && !reduce) clock.current += dt * (live.current.thinking ? 3 : 1);
      place();
      raf = requestAnimationFrame(tick);
    };
    place();
    if (!reduce) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nodes]);

  const showTip = (id: string) => {
    setHover(id);
    const el = nodeRefs.current[id];
    const box = stage.current?.getBoundingClientRect();
    if (el && box) {
      const r = el.getBoundingClientRect();
      setTip({ x: r.left + r.width / 2 - box.left, y: r.top - box.top });
    }
  };
  const hideTip = () => {
    setHover(null);
    setTip(null);
  };

  const hovered = hover ? AGENTS.find((a) => a.id === hover) : null;
  const hr = hover ? runtime[hover] : null;

  return (
    <div className={`orb ${kill ? "orb-kill" : ""} ${thinking ? "orb-think" : ""}`} ref={stage}>
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

        <circle cx={C} cy={C} r={390} fill="url(#halo)" />
        {RADII.map((r, i) => (
          <circle key={r} cx={C} cy={C} r={r} className="orb-ring" strokeDasharray={i % 2 ? "2 7" : "1 5"} />
        ))}
        <circle cx={C} cy={C} r={RADII[0]! - 34} className="orb-ring orb-ring-inner" />

        {nodes.map((n) =>
          runtime[n.id]?.status === "trabalhando" && !kill ? <line key={n.id} ref={(el) => void (lineRefs.current[n.id] = el)} x1={C} y1={C} x2={C} y2={C} className="orb-link" style={{ stroke: `var(${n.hue})` }} /> : null,
        )}

        <g className="orb-core">
          <circle cx={C} cy={C} r={112} fill="url(#core)" className="orb-breath" />
          <circle cx={C} cy={C} r={58} className="orb-eye" />
          <circle cx={C} cy={C} r={84} className="orb-eye-ring" />
          <circle cx={C} cy={C} r={84} className="orb-wave" />
          <circle cx={C} cy={C} r={84} className="orb-wave orb-wave-2" />
        </g>

        {nodes.map((n) => {
          const a = AGENTS.find((x) => x.id === n.id)!;
          const r = runtime[n.id];
          const status = kill ? "pausado" : (r?.status ?? "ocioso");
          const pend = pendingBy[n.id] ?? 0;
          return (
            <g
              key={n.id}
              ref={(el) => void (nodeRefs.current[n.id] = el)}
              className={`orb-node st-${status} ${selected === n.id ? "is-selected" : ""}`}
              style={{ color: `var(${n.hue})` }}
              role="button"
              tabIndex={0}
              aria-label={`${a.name}, ${status}${pend ? `, ${pend} proposta(s) esperando` : ""}`}
              onMouseEnter={() => showTip(n.id)}
              onMouseLeave={hideTip}
              onFocus={() => showTip(n.id)}
              onBlur={hideTip}
              onClick={() => onSelect(n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(n.id);
                }
              }}
            >
              <circle r={22} className="orb-hit" />
              <circle r={14} className="orb-pulse" />
              <circle r={7.5} className="orb-dot" />
              {pend > 0 && status !== "pausado" ? <circle cx={9} cy={-9} r={4} className="orb-pend" /> : null}
              {selected === n.id ? <circle r={15} className="orb-sel" /> : null}
            </g>
          );
        })}
      </svg>

      {hovered && tip ? (
        <div className="orb-tip" style={{ left: tip.x, top: tip.y }} role="status">
          <strong>{hovered.name}</strong>
          <span>
            {teamOf(hovered).name} · {kill ? "parado" : hr?.status === "trabalhando" ? "trabalhando agora" : hr?.status === "pausado" ? "pausado" : "aguardando gatilho"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
