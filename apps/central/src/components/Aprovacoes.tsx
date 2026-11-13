// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { Check, Copy, Send, ShieldCheck, X } from "lucide-react";
import { useBrain } from "../store";
import { An, Ia, Mu, _, so } from "../lib";

export function Aprovacoes() {
  const { state: e, decide: a, enviar: t } = useBrain(),
    r = [...e.proposals].sort(
      (c, u) =>
        (c.status === "pendente" ? 0 : 1) - (u.status === "pendente" ? 0 : 1) || u.impactoBrl - c.impactoBrl,
    ),
    [o, s] = React.useState(null),
    i = r.find((c) => c.id === o) ?? r[0] ?? null,
    l = r.filter((c) => c.status === "pendente").length;
  return (
    <div className="page">
      <header className="page-head">
        <h1>Aprovações</h1>
        <p>
          {l ? `${l} esperando voc\xEA, ordenadas por impacto em reais.` : "Fila vazia."}
          {
            ' Aprovar n\xE3o envia nada por conta pr\xF3pria. E-mail e post do Instagram saem s\xF3 pelo bot\xE3o "Aprovar e enviar"; o resto voc\xEA copia e manda.'
          }
        </p>
      </header>
      {e.overflow > 0 ? (
        <p className="muted">
          {"Mais "}
          {e.overflow}
          {" ficaram fora do teto de hoje e entram quando voc\xEA esvaziar a fila."}
        </p>
      ) : null}
      {e.kill ? (
        <p className="banner" role="alert">
          Botão de emergência ligado. Nenhuma aprovação passa até você religar.
        </p>
      ) : null}
      <div className="split">
        <ul className="queue" aria-label="Propostas">
          {r.map((c) => {
            const u = so(c.agentId);
            return (
              <li>
                <button
                  type="button"
                  className={`q-item ${i?.id === c.id ? "on" : ""} q-${c.status}`}
                  onClick={() => s(c.id)}
                  style={{
                    "--team": u ? `var(${An(u).hue})` : void 0,
                  }}
                >
                  <span className="q-title">{c.title}</span>
                  <span className="q-meta">
                    {u?.name}
                    {" \xB7 "}
                    {Mu[c.channel]}
                    {" \xB7 risco "}
                    {c.risk} {c.status !== "pendente" ? `\xB7 ${c.status}` : ""}
                  </span>
                  <span className="q-money">{c.impactoBrl > 0 ? _(c.impactoBrl) : "sem receita direta"}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {i ? <AprovacaoCartao p={i} killed={e.kill} onDecide={a} onSend={t} /> : null}
      </div>
    </div>
  );
}
export function AprovacaoCartao({ p: e, killed: a, onDecide: t, onSend: r }) {
  const o = so(e.agentId),
    [s, i] = React.useState(false),
    [l, c] = React.useState(false),
    [u, v] = React.useState(null),
    g = async (m) => {
      (c(true), v(null), v(await m()), c(false));
    },
    x = e.envio
      ? e.envio.tipo === "email"
        ? `E-mail para ${e.envio.para} \xB7 assunto "${e.envio.assunto}"`
        : `Post no Instagram @synapsa.ai \xB7 imagem ${e.envio.imagemUrl}`
      : null,
    j = async () => {
      if (e.draft)
        try {
          (await navigator.clipboard.writeText(e.draft), i(true), window.setTimeout(() => i(false), 1800));
        } catch {
          i(false);
        }
    };
  return (
    <article className="detail" aria-live="polite">
      <header>
        <h2>{e.title}</h2>
        <p className="muted">
          {o?.name}
          {" \xB7 "}
          {Mu[e.channel]}
          {" \xB7 "}
          {Ia(Date.now(), e.at)}
          {" atr\xE1s"}
        </p>
      </header>
      <p className="review">
        <ShieldCheck size={16} aria-hidden />
        {" Conformidade: "}
        {e.review}
      </p>
      <section>
        <h3>Por que o agente propôs</h3>
        <p>{e.why}</p>
      </section>
      {e.draft ? (
        <section>
          <h3>Texto pronto</h3>
          <blockquote>{e.draft}</blockquote>
        </section>
      ) : null}
      {x ? (
        <section>
          <h3>Envio automático</h3>
          <p>{x}</p>
          <p className="muted">
            {"Sai s\xF3 quando voc\xEA clicar. "}
            {e.envio.tipo === "email"
              ? "O Brain acrescenta o rodap\xE9 com a sa\xEDda (SAIR) e respeita o limite di\xE1rio."
              : "A legenda \xE9 o texto pronto acima."}
          </p>
        </section>
      ) : null}
      {u?.ok ? (
        <p className="banner banner-ok" role="status">
          {u.ok}
        </p>
      ) : null}
      {u?.erro ? (
        <p className="banner" role="alert">
          {u.erro}
        </p>
      ) : null}
      <footer>
        {e.status === "pendente" ? (
          <>
            {e.envio ? (
              <button
                type="button"
                className="btn btn-primary"
                disabled={a || l}
                onClick={() => void g(() => t(e.id, "aprovada", true))}
              >
                <Send size={15} aria-hidden /> {l ? "Enviando\u2026" : "Aprovar e enviar"}
              </button>
            ) : null}
            <button
              type="button"
              className={`btn ${e.envio ? "" : "btn-primary"}`}
              disabled={a || l}
              onClick={() => void g(() => t(e.id, "aprovada"))}
            >
              <Check size={15} aria-hidden /> {e.envio ? "S\xF3 aprovar" : "Aprovar"}
            </button>
            <button
              type="button"
              className="btn"
              disabled={l}
              onClick={() => void g(() => t(e.id, "rejeitada"))}
            >
              <X size={15} aria-hidden />
              {" Rejeitar"}
            </button>
          </>
        ) : (
          <>
            <span className={`status-pill ${e.status}`}>
              {e.status === "aprovada" ? "Aprovada" : "Rejeitada"}
            </span>
            {e.status === "aprovada" && e.envio ? (
              e.envio.enviado ? (
                <span className="status-pill aprovada">Enviada</span>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={a || l}
                  onClick={() => void g(() => r(e.id))}
                >
                  <Send size={15} aria-hidden /> {l ? "Enviando\u2026" : "Enviar agora"}
                </button>
              )
            ) : null}
            {e.status === "aprovada" && e.draft ? (
              <button type="button" className="btn btn-primary" onClick={j}>
                <Copy size={15} aria-hidden /> {s ? "Copiado" : "Copiar texto"}
              </button>
            ) : null}
          </>
        )}
      </footer>
    </article>
  );
}
