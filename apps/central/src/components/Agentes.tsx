import { useMemo, useState } from "react";
import { MessageSquare, Pause, Play, X } from "lucide-react";
import { AGENTS, AREAS } from "../data/roster";
import { TEAMS } from "../data/teams";
import { READY_LABEL, ago, brl, teamOf } from "../lib";
import { useBrain } from "../store";
import type { Agent, TeamId } from "../types";

interface Props {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  talkTo: (agentName: string) => void;
}

const STATUS = { trabalhando: "Trabalhando", ocioso: "Aguardando gatilho", pausado: "Pausado" } as const;

export function Agentes({ openId, setOpenId, talkTo }: Props) {
  const { state, act, pending } = useBrain();
  const [team, setTeam] = useState<TeamId | "todos">("todos");
  const list = useMemo(() => AGENTS.filter((a) => team === "todos" || TEAMS.find((t) => t.id === team)?.areas.includes(a.area)), [team]);
  const open = AGENTS.find((a) => a.id === openId) ?? null;
  const t = TEAMS.find((x) => x.id === team);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Os 24 agentes</h1>
        <p>{t ? t.blurb : "Cinco times, cada um ligado à sua área do negócio. Clique em um agente para ver a ficha e dar ordens."}</p>
      </header>

      <div className="tabs" role="tablist" aria-label="Times">
        {[{ id: "todos", name: "Todos", n: AGENTS.length }, ...TEAMS.map((x) => ({ id: x.id, name: x.name, n: AGENTS.filter((a) => x.areas.includes(a.area)).length }))].map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={team === x.id} className={`tab ${team === x.id ? "on" : ""}`} onClick={() => setTeam(x.id as TeamId | "todos")}>
            {x.name} <span>{x.n}</span>
          </button>
        ))}
      </div>

      <ul className="agents">
        {list.map((a) => {
          const r = state.runtime[a.id]!;
          const status = state.kill ? "pausado" : r.status;
          const mine = pending.filter((p) => p.agentId === a.id).length;
          const tm = teamOf(a);
          return (
            <li key={a.id}>
              <button type="button" className={`agent st-${status}`} onClick={() => setOpenId(a.id)} style={{ ["--team" as string]: `var(${tm.hue})` }}>
                <span className="agent-top">
                  <i className="agent-dot" aria-hidden />
                  <strong>{a.name}</strong>
                  {mine ? <em className="badge">{mine}</em> : null}
                </span>
                <span className="agent-area">{AREAS.find((x) => x.id === a.area)?.name}</span>
                <span className="agent-last">{r.lastAction}</span>
                <span className="agent-meta">
                  {STATUS[status]} · {ago(state.now, r.lastAt)} atrás · {r.runsToday} exec · {brl(r.costBrl)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {open ? <Ficha agent={open} close={() => setOpenId(null)} talkTo={talkTo} paused={state.runtime[open.id]?.status === "pausado"} toggle={() => act({ type: state.runtime[open.id]?.status === "pausado" ? "resume" : "pause", agentId: open.id })} /> : null}
    </div>
  );
}

function Ficha({ agent: a, close, talkTo, paused, toggle }: { agent: Agent; close: () => void; talkTo: (n: string) => void; paused: boolean; toggle: () => void }) {
  const tm = teamOf(a);
  return (
    <>
      <div className="scrim" onClick={close} aria-hidden />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Ficha de ${a.name}`} style={{ ["--team" as string]: `var(${tm.hue})` }}>
        <header>
          <div>
            <h2>{a.name}</h2>
            <p>
              {tm.name} · {AREAS.find((x) => x.id === a.area)?.name} · {READY_LABEL[a.ready]}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={close} aria-label="Fechar">
            <X size={18} aria-hidden />
          </button>
        </header>

        <div className="drawer-actions">
          <button type="button" className="btn btn-primary" onClick={() => talkTo(a.name)}>
            <MessageSquare size={15} aria-hidden /> Falar com {a.name.split(" ")[0]}
          </button>
          <button type="button" className="btn" onClick={toggle}>
            {paused ? <Play size={15} aria-hidden /> : <Pause size={15} aria-hidden />} {paused ? "Retomar" : "Pausar"}
          </button>
        </div>

        <div className="drawer-body">
          <section>
            <h3>Missão</h3>
            <p>{a.mission}</p>
            <p className="muted">Métrica: {a.metric}</p>
          </section>
          <section>
            <h3>Quando age</h3>
            <ul>{a.triggers.map((x) => <li key={x}>{x}</li>)}</ul>
          </section>
          <section>
            <h3>Subagentes</h3>
            <ul className="subs">
              {a.subs.map((s) => (
                <li key={s.name}>
                  <b>{s.name}</b> <span className={`tier tier-${s.tier}`}>{s.tier === "forte" ? "modelo forte" : "modelo leve"}</span>
                  <p>{s.does}</p>
                </li>
              ))}
            </ul>
          </section>
          <section className="autonomy">
            <h3>Autonomia</h3>
            {a.auto.length ? (
              <div>
                <h4>Faz sozinho</h4>
                <ul>{a.auto.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ) : null}
            {a.aprova.length ? (
              <div>
                <h4>Propõe e espera você</h4>
                <ul>{a.aprova.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ) : null}
            {a.humano.length ? (
              <div>
                <h4>Só você</h4>
                <ul>{a.humano.map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ) : null}
          </section>
          <section>
            <h3>Limites</h3>
            <p>{a.limits}</p>
          </section>
          <section>
            <h3>Dados de que precisa</h3>
            <p>{a.needs}</p>
            {a.note ? <p className="muted">{a.note}</p> : null}
          </section>
          <section>
            <h3>Como aprende</h3>
            <p>{a.learns}</p>
          </section>
        </div>
      </aside>
    </>
  );
}
