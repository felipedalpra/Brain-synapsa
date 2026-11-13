// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { ArrowUp, Check, X } from "lucide-react";
import { useBrain } from "../store";

export const SUGESTOES = [
  "O que aconteceu hoje?",
  "Como est\xE1 o MRR?",
  "O que est\xE1 na fila?",
  "Como est\xE3o as integra\xE7\xF5es?",
  "Pe\xE7a ao Guardi\xE3o para conciliar a base",
  "Aprove as de baixo risco",
  "Rode a rotina do dia",
];
export const jaDigitados = /* @__PURE__ */ new Set(["m0"]);
export function Digitando({ id: e, text: a }) {
  const [t, r] = React.useState(jaDigitados.has(e) ? a.length : 0);
  return (
    React.useEffect(() => {
      if (jaDigitados.has(e)) {
        r(a.length);
        return;
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        (jaDigitados.add(e), r(a.length));
        return;
      }
      const o = window.setInterval(() => {
        r((s) => {
          const i = Math.min(a.length, s + 3);
          return (i >= a.length && (jaDigitados.add(e), window.clearInterval(o)), i);
        });
      }, 16);
      return () => window.clearInterval(o);
    }, [e, a]),
    (<>{a.slice(0, t)}</>)
  );
}
export function Comando({ presetAgent: e }) {
  const { state: a, ask: t, confirm: r } = useBrain(),
    [o, s] = React.useState(""),
    i = React.useRef(null),
    l = React.useRef(null);
  (React.useEffect(() => {
    i.current?.scrollIntoView({
      block: "end",
      behavior: "smooth",
    });
  }, [a.messages.length, a.thinking]),
    React.useEffect(() => {
      e && (s(`${e}: `), l.current?.focus());
    }, [e]));
  const c = (u) => {
    (u.preventDefault(), t(o), s(""));
  };
  return (
    <section className="chat" aria-label="Conversa com o Jarvis">
      <header className="chat-head">
        <h2>Jarvis</h2>
        <p>{a.thinking ? "pensando\u2026" : a.kill ? "agentes parados" : "pronto para comandar"}</p>
      </header>
      <div className="chat-log" role="log" aria-live="polite">
        {a.messages.map((u) => (
          <div className={`msg msg-${u.from}`}>
            <p>{u.from === "jarvis" ? <Digitando id={u.id} text={u.text} /> : u.text}</p>
            {u.confirm ? (
              <div className="confirm">
                {u.confirm.done ? (
                  <span className={`confirm-done ${u.confirm.done}`}>
                    {u.confirm.done === "ok" ? "Confirmado" : "Cancelado"}
                  </span>
                ) : (
                  <>
                    <button type="button" className="btn btn-primary" onClick={() => r(u.id, true)}>
                      <Check size={15} aria-hidden /> {u.confirm.label}
                    </button>
                    <button type="button" className="btn" onClick={() => r(u.id, false)}>
                      <X size={15} aria-hidden />
                      {" Cancelar"}
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {a.thinking ? (
          <div className="msg msg-jarvis" aria-hidden>
            <p className="dots">
              <i />
              <i />
              <i />
            </p>
          </div>
        ) : null}
        <div ref={i} />
      </div>
      <div className="chips" role="list">
        {SUGESTOES.map((u) => (
          <button type="button" role="listitem" className="chip" onClick={() => t(u)}>
            {u}
          </button>
        ))}
      </div>
      <form className="chat-input" onSubmit={c}>
        <label htmlFor="cmd" className="sr-only">
          Mensagem para o Jarvis
        </label>
        <input
          id="cmd"
          ref={l}
          value={o}
          onChange={(u) => s(u.target.value)}
          placeholder="Pergunte ou mande um agente fazer algo"
          autoComplete="off"
        />
        <button type="submit" className="send" aria-label="Enviar" disabled={!o.trim()}>
          <ArrowUp size={18} aria-hidden />
        </button>
      </form>
    </section>
  );
}
