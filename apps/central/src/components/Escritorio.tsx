// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { Clapperboard, ClipboardCheck, Pause, Play, RotateCcw, Send, Sparkles, X } from "lucide-react";
import { useBrain } from "../store";
import { Ao, Q, Ze, nh, th, zi } from "../shared-inline";
import { An, Ia, Vl, _, _s } from "../lib";
import { api } from "../api";
import { avisos } from "./Avisos";

export const L = "#2b2f6b";
export const Do = {
  chief: (
    <path
      d="M27 17 l4 -9 l5 6 l4 -9 l4 9 l5 -6 l4 9 z"
      fill="#f4c95d"
      stroke={L}
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  ),
  guardiao: (
    <g>
      <rect x="35" y="55" width="10" height="8" rx="2" fill="#f4c95d" stroke={L} strokeWidth="1.4" />
      <path d="M37 55 v-3 a3 3 0 0 1 6 0 v3" fill="none" stroke={L} strokeWidth="1.4" />
    </g>
  ),
  metricas: (
    <g fill="rgba(255,255,255,.25)" stroke={L} strokeWidth="1.6">
      <circle cx="33" cy="33" r="6.5" />
      <circle cx="47" cy="33" r="6.5" />
      <path d="M39.5 33 h1" />
    </g>
  ),
  experimentos: (
    <g>
      <path
        d="M54 56 h8 l-2 6 a4 4 0 0 0 -4 0 z M56 56 v-5 h4 v5"
        fill="#8be0c8"
        stroke={L}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </g>
  ),
  alocador: (
    <g stroke={L} strokeWidth="1.2" fill="#8be0c8">
      <rect x="55" y="58" width="4" height="6" />
      <rect x="60" y="53" width="4" height="11" />
      <rect x="65" y="56" width="4" height="8" />
    </g>
  ),
  financeiro: (
    <g>
      <circle cx="61" cy="58" r="7" fill="#f4c95d" stroke={L} strokeWidth="1.6" />
      <text x="61" y="61" textAnchor="middle" fontSize="8" fontWeight="700" fill={L}>
        R$
      </text>
    </g>
  ),
  compliance: (
    <g>
      <path
        d="M40 52 l8 3 v6 q0 6 -8 9 q-8 -3 -8 -9 v-6 z"
        fill="#8bb4f2"
        stroke={L}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M36 61 l3 3 l5 -6" fill="none" stroke={L} strokeWidth="1.8" strokeLinecap="round" />
    </g>
  ),
  prospeccao: (
    <g>
      <rect x="52" y="54" width="14" height="12" rx="3" fill="#6ea1f2" stroke={L} strokeWidth="1.5" />
      <text x="59" y="63.5" textAnchor="middle" fontSize="8" fontWeight="700" fill="#fff">
        in
      </text>
    </g>
  ),
  conteudo: (
    <g>
      <path
        d="M54 56 l12 -7 v18 l-12 -7 z"
        fill="#f4c95d"
        stroke={L}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="50" y="54" width="5" height="6" rx="1" fill="#f08fa8" stroke={L} strokeWidth="1.2" />
    </g>
  ),
  indicacao: (
    <path
      d="M61 70 c-9 -6 -9 -13 -4 -14 a4 4 0 0 1 4 2 a4 4 0 0 1 4 -2 c5 1 5 8 -4 14 z"
      fill="#f08fa8"
      stroke={L}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  ),
  midia: (
    <g stroke={L} strokeWidth="1.3">
      <circle cx="61" cy="60" r="8" fill="#fff" />
      <circle cx="61" cy="60" r="5" fill="#f2808e" />
      <circle cx="61" cy="60" r="2" fill="#fff" />
    </g>
  ),
  inteligencia: (
    <g fill="none" stroke={L} strokeWidth="2">
      <circle cx="59" cy="57" r="6" fill="rgba(255,255,255,.35)" />
      <path d="M63 62 l6 7" strokeLinecap="round" />
    </g>
  ),
  descoberta: (
    <g>
      <path
        d="M40 5 a6 6 0 0 1 4 10 v3 h-8 v-3 a6 6 0 0 1 4 -10 z"
        fill="#ffe28a"
        stroke={L}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </g>
  ),
  especificacao: (
    <g>
      <path
        d="M54 70 l2 -8 l10 -10 l4 4 l-10 10 z"
        fill="#f4c95d"
        stroke={L}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </g>
  ),
  uso: (
    <g fill="rgba(255,255,255,.25)" stroke={L} strokeWidth="1.6">
      <rect x="27" y="28" width="12" height="10" rx="3" />
      <rect x="41" y="28" width="12" height="10" rx="3" />
    </g>
  ),
  lancamento: (
    <g>
      <path
        d="M61 52 q6 4 3 14 l-3 3 l-3 -3 q-3 -10 3 -14 z"
        fill="#fff"
        stroke={L}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="61" cy="59" r="2" fill="#6ea1f2" stroke={L} strokeWidth="1" />
      <path d="M58 66 l-4 4 l5 -1 z M64 66 l4 4 l-5 -1 z" fill="#f2808e" stroke={L} strokeWidth="1" />
    </g>
  ),
  ativacao: (
    <path
      d="M61 51 l2.5 6 l6.5 .5 l-5 4.2 l1.6 6.3 l-5.6 -3.5 l-5.6 3.5 l1.6 -6.3 l-5 -4.2 l6.5 -.5 z"
      fill="#ffe28a"
      stroke={L}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  ),
  pagar: (
    <g>
      <circle cx="61" cy="58" r="7" fill="#f4c95d" stroke={L} strokeWidth="1.6" />
      <text x="61" y="61" textAnchor="middle" fontSize="8" fontWeight="700" fill={L}>
        79
      </text>
    </g>
  ),
  sdr: (
    <g fill="none" stroke={L} strokeWidth="2.6" strokeLinecap="round">
      <path d="M18 33 a22 21 0 0 1 44 0" />
      <path d="M18 31 v8 M62 31 v8" strokeWidth="5" />
      <path d="M18 42 q2 9 14 9" strokeWidth="1.8" />
    </g>
  ),
  closer: (
    <path
      d="M36 52 h8 l-2 5 l3 12 l-5 3 l-5 -3 l3 -12 z"
      fill="#f2808e"
      stroke={L}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  ),
  saude: (
    <path
      d="M56 62 h4 v-4 h4 v4 h4 v4 h-4 v4 h-4 v-4 h-4 z"
      fill="#f2808e"
      stroke={L}
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  ),
  cobranca: (
    <g>
      <path
        d="M53 52 h14 v18 l-3.5 -2.5 l-3.5 2.5 l-3.5 -2.5 l-3.5 2.5 z"
        fill="#fff"
        stroke={L}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M56 58 h8 M56 62 h8" stroke={L} strokeWidth="1.2" />
    </g>
  ),
  escalonador: (
    <path
      d="M54 70 l9 -9 a5 5 0 1 1 3 3 l-9 9 z"
      fill="#c9d3ee"
      stroke={L}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  ),
  relclinica: (
    <g>
      <rect x="53" y="52" width="14" height="18" rx="2" fill="#fff" stroke={L} strokeWidth="1.5" />
      <rect x="57" y="50" width="6" height="4" rx="1" fill="#f4c95d" stroke={L} strokeWidth="1.2" />
      <path d="M56 59 h8 M56 63 h8" stroke={L} strokeWidth="1.2" />
    </g>
  ),
};
export function Bicho({ agentId: e, especie: a, cor: t, humor: r, size: o = 96 }) {
  const s =
      r === "trabalhando" ? (
        <g className="b-eyes" fill={L}>
          <circle cx="33" cy="34" r="2.6" />
          <circle cx="47" cy="34" r="2.6" />
        </g>
      ) : r === "erro" ? (
        <g stroke={L} strokeWidth="2" strokeLinecap="round" fill={L}>
          <circle cx="33" cy="36" r="2.3" stroke="none" />
          <circle cx="47" cy="36" r="2.3" stroke="none" />
          <path d="M29 30 l7 -2 M51 30 l-7 -2" fill="none" />
        </g>
      ) : r === "pausado" ? (
        <g stroke={L} strokeWidth="2" strokeLinecap="round">
          <path d="M30 35 h6 M44 35 h6" />
        </g>
      ) : (
        <g fill="none" stroke={L} strokeWidth="2.2" strokeLinecap="round">
          <path d="M30 35 q3 -5 6 0" />
          <path d="M44 35 q3 -5 6 0" />
        </g>
      ),
    i =
      r === "erro" ? (
        <path d="M34 45 q3 -4 6 0 q3 4 6 0" fill="none" stroke={L} strokeWidth="2" strokeLinecap="round" />
      ) : r === "pausado" ? (
        <path d="M36 43 h8" stroke={L} strokeWidth="2" strokeLinecap="round" />
      ) : r === "trabalhando" ? (
        <path d="M36 42 q4 3 8 0" fill="none" stroke={L} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M35 41 q5 7 10 0 z" fill="#f2808e" stroke={L} strokeWidth="1.8" strokeLinejoin="round" />
      );
  return (
    <svg className={`bicho b-${r}`} viewBox="0 0 80 80" width={o} height={o} aria-hidden>
      <defs>
        <radialGradient id={`g-${e}`} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" />
          <stop offset=".45" stopColor={t} />
          <stop offset="1" stopColor={t} />
        </radialGradient>
      </defs>
      <path
        className="b-body"
        d="M22 80 v-10 q0 -16 18 -16 q18 0 18 16 v10 z"
        fill={t}
        stroke={L}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <g className="b-head">
        {a === "cerebro" ? (
          <>
            <path
              d="M31 17 q-3 -7 -6 -11 M49 17 q3 -7 6 -11"
              stroke={L}
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
            <circle cx="25" cy="6" r="3.2" fill="#5fd3b0" stroke={L} strokeWidth="1.6" />
            <circle cx="55" cy="6" r="3.2" fill="#5fd3b0" stroke={L} strokeWidth="1.6" />
            <ellipse cx="40" cy="34" rx="23" ry="20" fill={`url(#g-${e})`} stroke={L} strokeWidth="2.4" />
            <path
              d="M28 22 q4 -5 8 -1 q4 4 8 -1 q4 -3 7 1 M27 28 q4 -4 7 0 M46 28 q4 -4 7 0"
              fill="none"
              stroke={L}
              strokeWidth="1.3"
              strokeLinecap="round"
              opacity=".35"
            />
          </>
        ) : (
          <>
            <ellipse cx="40" cy="34" rx="24" ry="21" fill={`url(#g-${e})`} stroke={L} strokeWidth="2.4" />
            <ellipse cx="29" cy="24" rx="6" ry="3.4" transform="rotate(-28 29 24)" fill="#fff" opacity=".7" />
          </>
        )}
        <circle cx="26" cy="40" r="3.4" fill="#f08fa8" opacity=".55" />
        <circle cx="54" cy="40" r="3.4" fill="#f08fa8" opacity=".55" />
        {s}
        {i}
        {r === "erro" ? (
          <path d="M61 26 q3 5 0 8 q-3 -3 0 -8 z" fill="#8bd3f5" stroke={L} strokeWidth="1.2" />
        ) : null}
        {e === "uso" || e === "metricas" || e === "sdr" || e === "chief" || e === "descoberta" ? Do[e] : null}
      </g>
      {Do[e] && !["uso", "metricas", "sdr", "chief", "descoberta"].includes(e) ? (
        <g className="b-item">{Do[e]}</g>
      ) : null}
    </svg>
  );
}
export const Au = {
  marketing: "cerebro",
  estrategia: "cerebro",
  produto: "cerebro",
  comercial: "gota",
  sucesso: "gota",
};
export const Lu = {
  marketing: "#b79af2",
  comercial: "#86b4f5",
  estrategia: "#82dfe9",
  produto: "#f2a8d2",
  sucesso: "#aee59a",
};
export const Tu = {
  trabalhando: "Trabalhando",
  ocioso: "Aguardando",
  pausado: "Pausado",
  erro: "Deu erro",
};
export const nc = {
  queued: "Na fila",
  running: "Trabalhando",
  done: "Conclu\xEDdo",
  blocked: "Travado",
  error: "Falhou",
};
export const rr = (e) =>
  e
    .split(
      `
`,
    )[0]
    .slice(0, 110);
export const av = [
  ["marketing", "estrategia"],
  ["comercial", "produto", "sucesso"],
];
export const Iu = "brain_erros_vistos";
export const tv = () => {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(Iu) ?? "[]"));
  } catch {
    return /* @__PURE__ */ new Set();
  }
};
export function Escritorio({ goApprovals: e, sel: a, setSel: t }) {
  const { state: r, pending: o, act: s, live: i } = useBrain(),
    [l, c] = React.useState(tv),
    [u, v] = React.useState({}),
    g = (y) => {
      (v((A) => ({
        ...A,
        [y]: Date.now(),
      })),
        window.setTimeout(
          () =>
            v((A) => {
              const q = {
                ...A,
              };
              return (delete q[y], q);
            }),
          15e3,
        ));
    },
    x = (y) =>
      c((A) => {
        const q = new Set(A).add(y);
        try {
          window.localStorage.setItem(Iu, JSON.stringify([...q].slice(-200)));
        } catch {}
        return q;
      }),
    [j, m] = React.useState(false),
    [N, h] = React.useState(false),
    [f, d] = React.useState(/* @__PURE__ */ new Set());
  (React.useEffect(() => {
    if (!j) {
      d(/* @__PURE__ */ new Set());
      return;
    }
    const y = () =>
      d(
        new Set(
          [...Q]
            .sort(() => Math.random() - 0.5)
            .slice(0, 8)
            .map((q) => q.id),
        ),
      );
    y();
    const A = window.setInterval(y, 3200);
    return () => window.clearInterval(A);
  }, [j]),
    React.useEffect(() => {
      document.body.classList.toggle("rec-mode", N);
      const y = (A) => A.key === "Escape" && h(false);
      return (
        window.addEventListener("keydown", y),
        () => {
          (document.body.classList.remove("rec-mode"), window.removeEventListener("keydown", y));
        }
      );
    }, [N]));
  const p = React.useCallback(
      (y) => {
        if (r.kill) return "pausado";
        const A = r.runtime[y.id],
          q = A?.status ?? "ocioso";
        if (q === "pausado") return "pausado";
        if (q === "trabalhando" || (u[y.id] && !(A?.lastRun && A.lastRun.at > u[y.id]))) return "trabalhando";
        const W = A?.lastRun;
        return W && W.status !== "done" && !l.has(W.id) && r.now - W.at < 6 * 36e5
          ? "erro"
          : j && f.has(y.id)
            ? "trabalhando"
            : "ocioso";
      },
      [r.kill, r.runtime, r.now, j, f, u, l],
    ),
    S = React.useMemo(() => {
      const y = {};
      for (const A of o) y[A.agentId] = (y[A.agentId] ?? 0) + 1;
      return y;
    }, [o]),
    C = Q.filter((y) => p(y) === "trabalhando").length,
    k = Q.filter((y) => p(y) === "erro").length,
    w = Q.find((y) => y.id === a) ?? null;
  return (
    <div className={`office ${N ? "rec" : ""} ${w ? "has-sel" : ""}`}>
      <header className="page-head office-head">
        <div>
          <h1>Escritório</h1>
          <p>Cada agente na sua cadeira. Clique em um para ver o que ele está fazendo e mandar uma tarefa.</p>
        </div>
        <div className="office-tools">
          <button
            type="button"
            className={`btn ${j ? "btn-go" : ""}`}
            aria-pressed={j}
            onClick={() => m((y) => !y)}
            title="Anima a sala para gravar vídeo. Não mostra trabalho real."
          >
            <Sparkles size={15} aria-hidden />
            {" Vitrine"}
          </button>
          <button
            type="button"
            className="btn"
            onClick={() => h(true)}
            title="Esconde o menu para gravar a tela. Esc sai."
          >
            <Clapperboard size={15} aria-hidden />
            {" Modo v\xEDdeo"}
          </button>
        </div>
      </header>
      <p className="office-line" role="status">
        {r.kill ? "Todos os agentes parados." : `${C} trabalhando agora`}
        {k ? (
          <em className="chip-erro">
            {k}
            {" com erro"}
          </em>
        ) : null}
        <span>
          {o.length}
          {" esperando voc\xEA"}
        </span>
        {j ? (
          <em className="chip-vitrine">Vitrine: animação de demonstração, não é o trabalho real</em>
        ) : null}
      </p>
      {N ? (
        <button type="button" className="rec-exit" onClick={() => h(false)}>
          <X size={14} aria-hidden />
          {" Sair do modo v\xEDdeo (Esc)"}
        </button>
      ) : null}
      <div className="floor">
        {av.map((y, A) => (
          <div className={`floor-row row-${y.length}`}>
            {y.map((q) => {
              const W = Ze.find((E) => E.id === q),
                Ce = Q.filter((E) => W.areas.includes(E.area));
              return (
                <Sala
                  team={W}
                  agents={Ce}
                  humorOf={p}
                  pendingBy={S}
                  sel={a}
                  onSel={t}
                  lastAt={(E) => r.runtime[E]?.lastAction ?? ""}
                />
              );
            })}
          </div>
        ))}
      </div>
      {w ? (
        <AgenteDetalhe
          agent={w}
          humor={p(w)}
          onClose={() => t(null)}
          act={s}
          live={i}
          goApprovals={e}
          onKick={() => g(w.id)}
          onAck={x}
        />
      ) : null}
    </div>
  );
}
export function Sala({ team: e, agents: a, humorOf: t, pendingBy: r, sel: o, onSel: s, lastAt: i }) {
  const l = a.filter((c) => t(c) === "trabalhando").length;
  return (
    <section
      className="room"
      style={{
        "--team": `var(${e.hue})`,
      }}
      aria-label={`Sala ${e.name}`}
    >
      <header className="room-wall">
        <h2>{e.name}</h2>
        <span className="room-count">{l ? `${l} de ${a.length} trabalhando` : `${a.length} agentes`}</span>
        <i className="room-window" aria-hidden />
      </header>
      <ul className="desks">
        {a.map((c) => {
          const u = t(c),
            v = r[c.id] ?? 0;
          return (
            <li>
              <button
                type="button"
                className={`desk st-${u} ${o === c.id ? "on" : ""}`}
                onClick={() => s(c.id)}
                aria-pressed={o === c.id}
                title={`${c.name}: ${i(c.id)}`}
              >
                <span className="desk-stage">
                  {u === "trabalhando" ? (
                    <span className="bubble" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : null}
                  {u === "pausado" ? (
                    <span className="bubble zz" aria-hidden>
                      zZ
                    </span>
                  ) : null}
                  {u === "erro" ? (
                    <span className="bubble err" aria-hidden>
                      !
                    </span>
                  ) : null}
                  <Bicho agentId={c.id} especie={Au[e.id]} cor={Lu[e.id]} humor={u} />
                  <span className="monitor" aria-hidden>
                    <i />
                  </span>
                  <span className="hand l" aria-hidden />
                  <span className="hand r" aria-hidden />
                  <span className="desk-top" aria-hidden />
                  <span className="desk-front" aria-hidden />
                  {v ? (
                    <em className="badge desk-badge" aria-label={`${v} propostas esperando`}>
                      {v}
                    </em>
                  ) : null}
                </span>
                <span className="desk-name">{c.name}</span>
                <span className="desk-state">{Tu[u]}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
export function AgenteDetalhe({
  agent: e,
  humor: a,
  onClose: t,
  act: r,
  live: o,
  goApprovals: s,
  onKick: i,
  onAck: l,
}) {
  const { state: c, pending: u } = useBrain(),
    v = An(e),
    g = c.runtime[e.id],
    x = th(e.id),
    [j, m] = React.useState(null),
    [N, h] = React.useState(null),
    [f, d] = React.useState([]),
    [p, S] = React.useState(""),
    C = u.filter(($) => $.agentId === e.id).length,
    k = React.useCallback(() => {
      o &&
        api
          .teamFeed(v.id)
          .then(m)
          .catch(() => {});
    }, [o, v.id]);
  (React.useEffect(() => {
    k();
    const $ = window.setInterval(k, 5e3);
    return () => window.clearInterval($);
  }, [k]),
    React.useEffect(() => {
      const $ = (De) => De.key === "Escape" && t();
      return (window.addEventListener("keydown", $), () => window.removeEventListener("keydown", $));
    }, [t]));
  const w = (j?.runs ?? []).filter(($) => $.agent_id === e.id).slice(0, 5),
    y = w.find(($) => $.status === "running" || $.status === "queued"),
    A = (j?.deliverables ?? []).filter(($) => $.agent_id === e.id).slice(0, 3),
    q = ($, De) => {
      (r({
        type: "task",
        agentId: e.id,
        task: De,
      }),
        i(),
        avisos.push({
          kind: "info",
          title: `${e.name} come\xE7ou`,
          text: $,
        }),
        window.setTimeout(k, 1200),
        t());
    },
    W = ($, De) => {
      const M = Vl($, De);
      M &&
        q(
          $.label,
          `${$.label}

${M}`,
        );
    },
    Ce = () => {
      const $ = p.trim();
      $ && q(rr($), $);
    },
    E = c.runtime[e.id]?.lastRun,
    V =
      a === "erro" && E && E.status !== "done"
        ? {
            run: E,
            why: _s(E.detail, E.status),
            full: (j?.runs ?? []).find(($) => $.id === E.id),
          }
        : null,
    me = a === "pausado" && c.runtime[e.id]?.status === "pausado";
  return (
    <aside
      className="sheet"
      aria-label={`Agente ${e.name}`}
      style={{
        "--team": `var(${v.hue})`,
      }}
    >
      <button type="button" className="sheet-x" onClick={t} aria-label="Fechar">
        <X size={18} aria-hidden />
      </button>
      <header className="sheet-head">
        <span className={`sheet-pet st-${a}`}>
          <Bicho agentId={e.id} especie={Au[v.id]} cor={Lu[v.id]} humor={a} size={88} />
        </span>
        <div>
          <h2>{e.name}</h2>
          <p className="muted">
            {v.name}
            {" \xB7 "}
            {zi.find(($) => $.id === e.area)?.name}
          </p>
          <span className={`status-pill sp-${a}`}>{Tu[a]}</span>
        </div>
      </header>
      <p className="sheet-mission">{e.mission}</p>
      <section>
        <h3>Agora</h3>
        {y ? (
          <p className="sheet-now">
            <b>{nc[y.status]}:</b> {rr(y.task)}
          </p>
        ) : (
          <p className="sheet-now">
            {g.lastAction}
            <span className="muted">
              {" \xB7 h\xE1 "}
              {Ia(c.now, g.lastAt)}
            </span>
          </p>
        )}
        <p className="muted">
          {g.runsToday}
          {" execu\xE7\xF5es hoje \xB7 "}
          {_(g.costBrl)}
          {" de IA"}
        </p>
      </section>
      {V ? (
        <section className="sheet-err" role="alert">
          <strong>{V.why.titulo}</strong>
          <p>{V.why.motivo}</p>
          <p>
            <b>O que fazer:</b> {V.why.acao}
          </p>
          <div className="acts">
            <button
              type="button"
              className="btn btn-go"
              disabled={!V.full}
              onClick={() => V.full && q(rr(V.full.task), V.full.task)}
            >
              <RotateCcw size={14} aria-hidden />
              {" Tentar de novo"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                (l(V.run.id), t());
              }}
            >
              Entendi
            </button>
          </div>
        </section>
      ) : null}
      <section>
        <h3>Tarefas prontas (um clique manda)</h3>
        {x.length ? (
          <ul className="cmds">
            {x.map(($) => {
              const De = nh($);
              return (
                <li className={N === $.id ? "on" : ""}>
                  <div className="cmd-row">
                    <button
                      type="button"
                      className="cmd"
                      disabled={c.kill || me}
                      onClick={() => (De ? W($, Ao($)) : (h(N === $.id ? null : $.id), d(Ao($))))}
                    >
                      <b>{$.label}</b>
                      <span>{$.hint}</span>
                      {$.web ? <em className="cmd-tag">pesquisa na web, custa um pouco mais</em> : null}
                    </button>
                    {$.campos && De ? (
                      <button
                        type="button"
                        className="cmd-adj"
                        disabled={c.kill || me}
                        onClick={() => {
                          (h(N === $.id ? null : $.id), d(Ao($)));
                        }}
                      >
                        Ajustar
                      </button>
                    ) : null}
                  </div>
                  {N === $.id && $.campos ? (
                    <form
                      className="cmd-form"
                      onSubmit={(M) => {
                        (M.preventDefault(), W($, f));
                      }}
                    >
                      {$.campos.map((M, I) => (
                        <label className="field">
                          <span>
                            {M.label}
                            {M.opcional ? " (opcional)" : ""}
                          </span>
                          {M.opcoes ? (
                            <select
                              value={f[I] ?? M.padrao}
                              onChange={(D) =>
                                d((K) => {
                                  const Z = [...K];
                                  return ((Z[I] = D.target.value), Z);
                                })
                              }
                            >
                              {M.opcoes.map((D) => (
                                <option value={D}>{D}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={f[I] ?? ""}
                              onChange={(D) =>
                                d((K) => {
                                  const Z = [...K];
                                  return ((Z[I] = D.target.value), Z);
                                })
                              }
                              placeholder={M.placeholder ?? M.padrao}
                              maxLength={1500}
                              autoFocus={I === 0 && !M.padrao}
                            />
                          )}
                        </label>
                      ))}
                      <button type="submit" className="btn btn-go" disabled={!Vl($, f)}>
                        <Send size={14} aria-hidden />
                        {" Mandar"}
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">Sem tarefa pronta para este agente. Use a instrução livre abaixo.</p>
        )}
        <label className="field">
          <span>Instrução livre</span>
          <textarea
            rows={4}
            value={p}
            onChange={($) => S($.target.value)}
            maxLength={5e3}
            placeholder="O que pesquisar, o que entregar, para quando e o que não pode fazer."
          />
        </label>
        <button type="button" className="btn btn-go" onClick={Ce} disabled={!p.trim() || c.kill || me}>
          <Send size={14} aria-hidden />
          {" Enviar tarefa"}
        </button>
        <p className="muted">Nada sai para fora: o que virar mensagem ou post cai em Aprovações.</p>
      </section>
      {C ? (
        <button type="button" className="btn" onClick={s}>
          <ClipboardCheck size={15} aria-hidden /> {C}{" "}
          {C === 1 ? "proposta esperando" : "propostas esperando"}
          {" voc\xEA"}
        </button>
      ) : null}
      <section>
        <h3>Últimas execuções</h3>
        {o ? null : <p className="muted">Disponível com o Brain ligado.</p>}
        {o && w.length === 0 ? <p className="muted">Nenhuma execução recente.</p> : null}
        <ul className="sheet-runs">
          {w.map(($) => (
            <li>
              <b>{nc[$.status]}</b> {rr($.task)}
              <span className="muted">
                {" \xB7 h\xE1 "}
                {Ia(c.now, $.created_at)}
              </span>
              {$.status === "error" || $.status === "blocked" ? (
                <span className="run-err">
                  {_s($.status === "error" ? $.error : $.result, $.status).titulo}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        {A.map(($) => (
          <details className="sheet-deliv">
            <summary>{$.title.slice(0, 90)}</summary>
            <pre>{$.body}</pre>
          </details>
        ))}
      </section>
      <footer className="sheet-foot">
        <button
          type="button"
          className="btn"
          onClick={() =>
            r({
              type: me ? "resume" : "pause",
              agentId: e.id,
            })
          }
        >
          {me ? (
            <>
              <Play size={15} aria-hidden />
              {" Retomar"}
            </>
          ) : (
            <>
              <Pause size={15} aria-hidden />
              {" Pausar"}
            </>
          )}
        </button>
        <span className="muted">
          {x.length}
          {" tarefas prontas"}
        </span>
      </footer>
    </aside>
  );
}
