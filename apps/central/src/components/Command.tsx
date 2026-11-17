// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { ArrowUp, Check, Mic, Radio, Volume2, VolumeX, X } from "lucide-react";
import { useBrain } from "../store";
import { criarOuvinte, falador, temMicrofone } from "../voz";
import { LiveMode } from "./LiveMode";

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
  const { state: a, ask: t, confirm: r, live: modoLive } = useBrain(),
    [liveAberto, setLiveAberto] = React.useState(false),
    [ler, setLer] = React.useState(() => { try { return localStorage.getItem("jarvis_ler") === "1"; } catch { return false; } }),
    [ditando, setDitando] = React.useState(false),
    ouvinteRef = React.useRef(null),
    falouAte = React.useRef(a.messages.at(-1)?.id ?? null),
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
  // Ler as respostas em voz alta (só as novas, nunca o histórico) e parar de falar ao sair da tela.
  React.useEffect(() => {
    const ult = a.messages.at(-1);
    if (!ult || ult.id === falouAte.current) return;
    falouAte.current = ult.id;
    if (ler && ult.from === "jarvis" && !liveAberto) falador.falar(ult.text);
  }, [a.messages.length, ler, liveAberto]);
  React.useEffect(() => () => { falador.parar(); try { ouvinteRef.current?.abort(); } catch { /* já parou */ } }, []);
  const alternarLer = () => {
    const novo = !ler;
    setLer(novo);
    if (!novo) falador.parar();
    try { localStorage.setItem("jarvis_ler", novo ? "1" : "0"); } catch { /* sem armazenamento */ }
  };
  const ditar = () => {
    if (ditando) { try { ouvinteRef.current?.stop(); } catch { /* já parou */ } return; }
    falador.parar();
    const ou = criarOuvinte({
      onFinal: (txt) => { if (txt) s((v) => `${v} ${txt}`.trim()); },
      onErro: () => setDitando(false),
      onFim: () => setDitando(false),
    });
    if (!ou) return;
    ou.continuous = false;
    ou.interimResults = false;
    ouvinteRef.current = ou;
    try { ou.start(); setDitando(true); } catch { setDitando(false); }
  };
  const c = (u) => {
    (u.preventDefault(), t(o), s(""));
  };
  return (
    <section className="chat" aria-label="Conversa com o Jarvis">
      <header className="chat-head">
        <h2>Jarvis</h2>
        <p>{a.thinking ? "pensando\u2026" : a.kill ? "agentes parados" : "pronto para comandar"}</p>
        <div className="chat-voz">
          <button type="button" className={`btn${ler ? " on" : ""}`} onClick={alternarLer} aria-pressed={ler} title="Ler as respostas do Jarvis em voz alta">
            {ler ? <Volume2 size={15} aria-hidden /> : <VolumeX size={15} aria-hidden />} {ler ? "Lendo em voz alta" : "Ler em voz alta"}
          </button>
          {modoLive && temMicrofone ? (
            <button type="button" className="btn btn-primary" onClick={() => { falador.parar(); setLiveAberto(true); }} title="Conversa contínua por voz com o Jarvis">
              <Radio size={15} aria-hidden /> Live
            </button>
          ) : null}
        </div>
      </header>
      {liveAberto ? <LiveMode onFechar={() => setLiveAberto(false)} /> : null}
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
        {temMicrofone ? (
          <button type="button" className={`mic${ditando ? " on" : ""}`} onClick={ditar} aria-label={ditando ? "Parar de ouvir" : "Ditar por voz"} aria-pressed={ditando} title="Ditar por voz">
            <Mic size={17} aria-hidden />
          </button>
        ) : null}
        <button type="submit" className="send" aria-label="Enviar" disabled={!o.trim()}>
          <ArrowUp size={18} aria-hidden />
        </button>
      </form>
    </section>
  );
}
