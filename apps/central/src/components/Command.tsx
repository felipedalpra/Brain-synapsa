import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, Check, X } from "lucide-react";
import { useBrain } from "../store";

const SUGGESTIONS = ["O que aconteceu hoje?", "Como está o MRR?", "O que está na fila?", "Como estão as integrações?", "Peça ao Guardião para conciliar a base", "Aprove as de baixo risco", "Rode a rotina do dia"];
const typed = new Set<string>(["m0"]);

function Typed({ id, text }: { id: string; text: string }) {
  const [n, setN] = useState(typed.has(id) ? text.length : 0);
  useEffect(() => {
    if (typed.has(id)) {
      setN(text.length);
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      typed.add(id);
      setN(text.length);
      return;
    }
    const t = window.setInterval(() => {
      setN((v) => {
        const next = Math.min(text.length, v + 3);
        if (next >= text.length) {
          typed.add(id);
          window.clearInterval(t);
        }
        return next;
      });
    }, 16);
    return () => window.clearInterval(t);
  }, [id, text]);
  return <>{text.slice(0, n)}</>;
}

export function Command({ presetAgent }: { presetAgent?: string | null }) {
  const { state, ask, confirm } = useBrain();
  const [value, setValue] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [state.messages.length, state.thinking]);

  useEffect(() => {
    if (presetAgent) {
      setValue(`${presetAgent}: `);
      input.current?.focus();
    }
  }, [presetAgent]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    ask(value);
    setValue("");
  };

  return (
    <section className="chat" aria-label="Conversa com o Jarvis">
      <header className="chat-head">
        <h2>Jarvis</h2>
        <p>{state.thinking ? "pensando…" : state.kill ? "agentes parados" : "pronto para comandar"}</p>
      </header>

      <div className="chat-log" role="log" aria-live="polite">
        {state.messages.map((m) => (
          <div key={m.id} className={`msg msg-${m.from}`}>
            <p>{m.from === "jarvis" ? <Typed id={m.id} text={m.text} /> : m.text}</p>
            {m.confirm ? (
              <div className="confirm">
                {m.confirm.done ? (
                  <span className={`confirm-done ${m.confirm.done}`}>{m.confirm.done === "ok" ? "Confirmado" : "Cancelado"}</span>
                ) : (
                  <>
                    <button type="button" className="btn btn-primary" onClick={() => confirm(m.id, true)}>
                      <Check size={15} aria-hidden /> {m.confirm.label}
                    </button>
                    <button type="button" className="btn" onClick={() => confirm(m.id, false)}>
                      <X size={15} aria-hidden /> Cancelar
                    </button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {state.thinking ? (
          <div className="msg msg-jarvis" aria-hidden>
            <p className="dots">
              <i />
              <i />
              <i />
            </p>
          </div>
        ) : null}
        <div ref={end} />
      </div>

      <div className="chips" role="list">
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" role="listitem" className="chip" onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>

      <form className="chat-input" onSubmit={submit}>
        <label htmlFor="cmd" className="sr-only">
          Mensagem para o Jarvis
        </label>
        <input id="cmd" ref={input} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Pergunte ou mande um agente fazer algo" autoComplete="off" />
        <button type="submit" className="send" aria-label="Enviar" disabled={!value.trim()}>
          <ArrowUp size={18} aria-hidden />
        </button>
      </form>
    </section>
  );
}
