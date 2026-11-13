// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { MessageSquare, Pause, Play, X } from "lucide-react";
import { useBrain } from "../store";
import { Q, Ze, zi } from "../shared-inline";
import { An, Ia, _, oh } from "../lib";

export const ESTADO_AGENTE = {
  trabalhando: "Trabalhando",
  ocioso: "Aguardando gatilho",
  pausado: "Pausado",
};
export function Agentes({ openId: e, setOpenId: a, talkTo: t }) {
  const { state: r, act: o, pending: s } = useBrain(),
    [i, l] = React.useState("todos"),
    c = React.useMemo(
      () => Q.filter((g) => i === "todos" || Ze.find((x) => x.id === i)?.areas.includes(g.area)),
      [i],
    ),
    u = Q.find((g) => g.id === e) ?? null,
    v = Ze.find((g) => g.id === i);
  return (
    <div className="page">
      <header className="page-head">
        <h1>Os 24 agentes</h1>
        <p>
          {v
            ? v.blurb
            : "Cinco times, cada um ligado \xE0 sua \xE1rea do neg\xF3cio. Clique em um agente para ver a ficha e dar ordens."}
        </p>
      </header>
      <div className="tabs" role="tablist" aria-label="Times">
        {[
          {
            id: "todos",
            name: "Todos",
            n: Q.length,
          },
          ...Ze.map((g) => ({
            id: g.id,
            name: g.name,
            n: Q.filter((x) => g.areas.includes(x.area)).length,
          })),
        ].map((g) => (
          <button
            type="button"
            role="tab"
            aria-selected={i === g.id}
            className={`tab ${i === g.id ? "on" : ""}`}
            onClick={() => l(g.id)}
          >
            {g.name} <span>{g.n}</span>
          </button>
        ))}
      </div>
      <ul className="agents">
        {c.map((g) => {
          const x = r.runtime[g.id],
            j = r.kill ? "pausado" : x.status,
            m = s.filter((h) => h.agentId === g.id).length,
            N = An(g);
          return (
            <li>
              <button
                type="button"
                className={`agent st-${j}`}
                onClick={() => a(g.id)}
                style={{
                  "--team": `var(${N.hue})`,
                }}
              >
                <span className="agent-top">
                  <i className="agent-dot" aria-hidden />
                  <strong>{g.name}</strong>
                  {m ? <em className="badge">{m}</em> : null}
                </span>
                <span className="agent-area">{zi.find((h) => h.id === g.area)?.name}</span>
                <span className="agent-last">{x.lastAction}</span>
                <span className="agent-meta">
                  {ESTADO_AGENTE[j]}
                  {" \xB7 "}
                  {Ia(r.now, x.lastAt)}
                  {" atr\xE1s \xB7 "}
                  {x.runsToday}
                  {" exec \xB7 "}
                  {_(x.costBrl)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {u ? (
        <AgenteFicha
          agent={u}
          close={() => a(null)}
          talkTo={t}
          paused={r.runtime[u.id]?.status === "pausado"}
          toggle={() =>
            o({
              type: r.runtime[u.id]?.status === "pausado" ? "resume" : "pause",
              agentId: u.id,
            })
          }
        />
      ) : null}
    </div>
  );
}
export function AgenteFicha({ agent: e, close: a, talkTo: t, paused: r, toggle: o }) {
  const s = An(e);
  return (
    <>
      <div className="scrim" onClick={a} aria-hidden />
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha de ${e.name}`}
        style={{
          "--team": `var(${s.hue})`,
        }}
      >
        <header>
          <div>
            <h2>{e.name}</h2>
            <p>
              {s.name}
              {" \xB7 "}
              {zi.find((i) => i.id === e.area)?.name}
              {" \xB7 "}
              {oh[e.ready]}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={a} aria-label="Fechar">
            <X size={18} aria-hidden />
          </button>
        </header>
        <div className="drawer-actions">
          <button type="button" className="btn btn-primary" onClick={() => t(e.name)}>
            <MessageSquare size={15} aria-hidden />
            {" Falar com "}
            {e.name.split(" ")[0]}
          </button>
          <button type="button" className="btn" onClick={o}>
            {r ? <Play size={15} aria-hidden /> : <Pause size={15} aria-hidden />} {r ? "Retomar" : "Pausar"}
          </button>
        </div>
        <div className="drawer-body">
          <section>
            <h3>Missão</h3>
            <p>{e.mission}</p>
            <p className="muted">
              {"M\xE9trica: "}
              {e.metric}
            </p>
          </section>
          <section>
            <h3>Quando age</h3>
            <ul>
              {e.triggers.map((i) => (
                <li>{i}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Subagentes</h3>
            <ul className="subs">
              {e.subs.map((i) => (
                <li>
                  <b>{i.name}</b>{" "}
                  <span className={`tier tier-${i.tier}`}>
                    {i.tier === "forte" ? "modelo forte" : "modelo leve"}
                  </span>
                  <p>{i.does}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="autonomy">
            <h3>Autonomia</h3>
            {e.auto.length ? (
              <div>
                <h4>Faz sozinho</h4>
                <ul>
                  {e.auto.map((i) => (
                    <li>{i}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {e.aprova.length ? (
              <div>
                <h4>Propõe e espera você</h4>
                <ul>
                  {e.aprova.map((i) => (
                    <li>{i}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {e.humano.length ? (
              <div>
                <h4>Só você</h4>
                <ul>
                  {e.humano.map((i) => (
                    <li>{i}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
          <section>
            <h3>Limites</h3>
            <p>{e.limits}</p>
          </section>
          <section>
            <h3>Dados de que precisa</h3>
            <p>{e.needs}</p>
            {e.note ? <p className="muted">{e.note}</p> : null}
          </section>
          <section>
            <h3>Como aprende</h3>
            <p>{e.learns}</p>
          </section>
        </div>
      </aside>
    </>
  );
}
