// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { Check, Copy, Pause, Play, Rocket, Send } from "lucide-react";
import { Q, Yf, Ze } from "../shared-inline";
import { useBrain } from "../store";
import { api } from "../api";
import { Ia, _ } from "../lib";

export const zh = {
  queued: "Na fila",
  running: "Trabalhando",
  done: "Conclu\xEDdo",
  blocked: "Travado",
  error: "Falhou",
};
export const Ah = {
  trabalhando: "Trabalhando",
  ocioso: "Aguardando",
  pausado: "Pausado",
};
export const Lh = (e) =>
  e
    .split(
      `
`,
    )[0]
    .slice(0, 120);
export const nr = (e) => Q.find((a) => a.id === e)?.name ?? e;
export const Th = (e) => e.passos.reduce((a, t) => a + (t.web ? 1.4 : 0.5), 0) + (e.sintese ? 0.6 : 0);
export function Equipes({ teamId: e, setTeamId: a, goApprovals: t }) {
  const { state: r, act: o, pending: s, live: i } = useBrain(),
    l = Ze.find((E) => E.id === e),
    c = React.useMemo(() => Q.filter((E) => l.areas.includes(E.area)), [l]),
    u = Yf.filter((E) => E.team === e),
    v = s.filter((E) => c.some((V) => V.id === E.agentId)),
    [g, x] = React.useState(null),
    [j, m] = React.useState(c[0].id),
    [N, h] = React.useState(""),
    [f, d] = React.useState(null),
    [p, S] = React.useState(null),
    [C, k] = React.useState(null);
  React.useEffect(() => {
    (m(c[0].id), x(null), d(null));
  }, [c]);
  const w = React.useCallback(() => {
    i &&
      api
        .teamFeed(e)
        .then(x)
        .catch(() => {});
  }, [i, e]);
  React.useEffect(() => {
    w();
    const E = window.setInterval(w, 6e3);
    return () => window.clearInterval(E);
  }, [w]);
  const y = (E) => {
      (S(E), window.setTimeout(() => S(null), 5e3), window.setTimeout(w, 800));
    },
    A = () => {
      const E = N.trim();
      E &&
        (o({
          type: "task",
          agentId: j,
          task: E,
        }),
        h(""),
        y(`Tarefa enviada para ${nr(j)}.`));
    },
    q = (E) => {
      (o({
        type: "playbook",
        id: E,
      }),
        d(null),
        y("Plano lan\xE7ado. Os resultados aparecem em Entregas conforme os agentes terminam."));
    },
    W = async (E, V) => {
      try {
        (await navigator.clipboard.writeText(V), k(E), window.setTimeout(() => k(null), 1800));
      } catch {}
    },
    Ce = g?.runs.filter((E) => E.status === "queued" || E.status === "running") ?? [];
  return (
    <div
      className="page"
      style={{
        "--team": `var(${l.hue})`,
      }}
    >
      <header className="page-head">
        <h1>Equipes</h1>
        <p>
          Cada equipe tem planos prontos, uma caixa de tarefas com as suas instruções e a lista do que os
          agentes entregaram.
        </p>
      </header>
      <div className="tabs" role="tablist" aria-label="Equipes">
        {Ze.map((E) => (
          <button
            type="button"
            role="tab"
            aria-selected={e === E.id}
            className={`tab ${e === E.id ? "on" : ""}`}
            style={{
              "--team": `var(${E.hue})`,
            }}
            onClick={() => a(E.id)}
          >
            <i className="tab-dot" aria-hidden /> {E.name}
          </button>
        ))}
      </div>
      <section className="team-head">
        <div>
          <h2>{l.name}</h2>
          <p className="muted">{l.blurb}</p>
        </div>
        <ul className="team-stats">
          <li>
            <b>{c.filter((E) => r.runtime[E.id]?.status === "trabalhando" && !r.kill).length}</b>
            {" trabalhando"}
          </li>
          <li>
            <b>{Ce.length}</b>
            {" tarefas em andamento"}
          </li>
          <li>
            <button type="button" className="link" onClick={t}>
              <b>{v.length}</b>
              {" propostas esperando voc\xEA"}
            </button>
          </li>
        </ul>
      </section>
      {p ? (
        <p className="banner banner-ok" role="status">
          {p}
        </p>
      ) : null}
      {r.kill ? (
        <p className="banner" role="alert">
          O botão de emergência está ligado: nenhuma tarefa nem plano roda até você retomar.
        </p>
      ) : null}
      <div className="team-grid">
        <section className="panel span-2" aria-labelledby="eq-planos">
          <h2 id="eq-planos">Planos prontos</h2>
          <p className="muted">
            Cada plano manda vários agentes trabalhar de uma vez e, no fim, o Chief junta tudo numa leitura
            só. Nada sai para fora: o que virar mensagem cai em Aprovações.
          </p>
          <ul className="plans">
            {u.map((E) => (
              <li className="plan">
                <div>
                  <h3>{E.titulo}</h3>
                  <p>{E.objetivo}</p>
                  <ol className="plan-steps">
                    {E.passos.map((V) => (
                      <li>
                        <b>{nr(V.agentId)}</b>
                        {": "}
                        {V.titulo}
                        {V.web ? <em className="tag">pesquisa na web</em> : null}
                      </li>
                    ))}
                    {E.sintese ? (
                      <li>
                        <b>Chief of Staff</b>: leitura única com as 3 ações de maior impacto
                      </li>
                    ) : null}
                  </ol>
                </div>
                <div className="plan-act">
                  {f === E.id ? (
                    <>
                      <span className="muted">
                        {"\u2248 "}
                        {_(Th(E))}
                        {" de IA (estimativa)"}
                      </span>
                      <button type="button" className="btn btn-go" onClick={() => q(E.id)}>
                        <Check size={15} aria-hidden />
                        {" Confirmar"}
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => d(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn" onClick={() => d(E.id)} disabled={r.kill}>
                      <Rocket size={15} aria-hidden />
                      {" Lan\xE7ar plano"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel" aria-labelledby="eq-tarefa">
          <h2 id="eq-tarefa">Nova tarefa</h2>
          <label className="field">
            <span>Quem faz</span>
            <select value={j} onChange={(E) => m(E.target.value)}>
              {c.map((E) => (
                <option value={E.id}>{E.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Instruções</span>
            <textarea
              value={N}
              onChange={(E) => h(E.target.value)}
              rows={7}
              maxLength={5e3}
              placeholder={`Primeira linha: o t\xEDtulo.
Depois: o que pesquisar, o que entregar, para quando e o que n\xE3o pode fazer.

Ex.: Compare os 5 maiores concorrentes em pre\xE7o e plano gr\xE1tis. Entregue tabela e 3 \xE2ngulos de mensagem.`}
            />
          </label>
          <button type="button" className="btn btn-go" onClick={A} disabled={!N.trim() || r.kill}>
            <Send size={15} aria-hidden />
            {" Enviar tarefa"}
          </button>
          <p className="muted">
            O agente consulta Stripe, Meta e Instagram e pesquisa na web quando precisa. Ele não envia nada
            sozinho.
          </p>
        </section>
        <section className="panel span-3" aria-labelledby="eq-ent">
          <h2 id="eq-ent">Entregas</h2>
          {i ? null : <p className="muted">Disponível com o Brain ligado.</p>}
          {i && g && g.deliverables.length === 0 ? (
            <p className="muted">
              Ainda não há entregas. Lance um plano ou mande uma tarefa: o documento completo aparece aqui.
            </p>
          ) : null}
          <ul className="deliv">
            {(g?.deliverables ?? []).map((E) => (
              <li>
                <details>
                  <summary>
                    <strong>{E.title}</strong>
                    <span className="muted">
                      {nr(E.agent_id)}
                      {" \xB7 h\xE1 "}
                      {Ia(r.now, E.at)}
                    </span>
                  </summary>
                  <div className="deliv-body">
                    <button type="button" className="btn btn-ghost" onClick={() => void W(E.id, E.body)}>
                      {C === E.id ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}{" "}
                      {C === E.id ? "Copiado" : "Copiar"}
                    </button>
                    <pre>{E.body}</pre>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel span-2" aria-labelledby="eq-hist">
          <h2 id="eq-hist">Em andamento e histórico</h2>
          {i && g && g.runs.length === 0 ? (
            <p className="muted">Nenhuma execução ainda nesta equipe.</p>
          ) : null}
          <ul className="runs">
            {(g?.runs ?? []).map((E) => (
              <li className={`run run-${E.status}`}>
                <span className="run-st">{zh[E.status] ?? E.status}</span>
                <div>
                  <strong>{nr(E.agent_id)}</strong>
                  {" \xB7 "}
                  {Lh(E.task)}
                  <p className="muted">{E.error ?? E.result ?? "\u2026"}</p>
                </div>
                <span className="muted run-meta">
                  {Ia(r.now, E.created_at)}
                  {E.cost_brl ? ` \xB7 ${_(E.cost_brl)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel" aria-labelledby="eq-ag">
          <h2 id="eq-ag">Agentes</h2>
          <ul className="team-agents">
            {c.map((E) => {
              const V = r.runtime[E.id],
                me = r.kill ? "pausado" : (V?.status ?? "ocioso");
              return (
                <li className={`st-${me}`}>
                  <div>
                    <strong>
                      <i className="agent-dot" aria-hidden /> {E.name}
                    </strong>
                    <p className="muted">
                      {Ah[me]}
                      {" \xB7 "}
                      {V?.lastAction ?? ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() =>
                      o({
                        type: me === "pausado" ? "resume" : "pause",
                        agentId: E.id,
                      })
                    }
                    disabled={r.kill}
                    aria-label={`${me === "pausado" ? "Retomar" : "Pausar"} ${E.name}`}
                  >
                    {me === "pausado" ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
