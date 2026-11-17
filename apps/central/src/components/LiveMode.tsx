// @ts-nocheck
// Live Mode: conversa por voz com o Jarvis, contínua, como uma ligação. Ele ouve, pensa com os dados do Brain e responde em voz alta.
import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Headphones, Mic, MicOff, Square, X } from "lucide-react";
import { JarvisBot } from "./JarvisBot";
import { useBrain } from "../store";
import { criarOuvinte, falador, temMicrofone } from "../voz";

const ATALHOS = [
  "Me atualiza do dia",
  "O que está travando o MRR?",
  "O que eu preciso aprovar hoje?",
  "Como está o SEO e o diretório?",
  "Vamos trocar uma ideia sobre o próximo mês",
];
const ROTULO = { iniciando: "Iniciando…", ouvindo: "Ouvindo", pensando: "Pensando…", falando: "Falando", mudo: "Microfone desligado", erro: "Sem microfone" };

export function LiveMode({ onFechar }) {
  const { state, askVoz, confirm } = useBrain();
  const [fase, setFase] = React.useState("iniciando");
  const [parcial, setParcial] = React.useState("");
  const [voce, setVoce] = React.useState("");
  const [jarvis, setJarvis] = React.useState("");
  const [erro, setErro] = React.useState("");
  const [fone, setFone] = React.useState(() => { try { return localStorage.getItem("live_fone") === "1"; } catch { return false; } });
  const [mudo, setMudo] = React.useState(false);

  const R = React.useRef({ fase: "iniciando", fone, mudo: false, vivo: true, buffer: "", seq: 0, timer: 0, ouvinte: null, rodando: false });
  const mudarFase = (f) => { R.current.fase = f; setFase(f); };

  const parar = React.useCallback(() => {
    const r = R.current;
    r.rodando = false;
    try { r.ouvinte?.abort(); } catch { /* já parado */ }
  }, []);

  const ouvir = React.useCallback(() => {
    const r = R.current;
    if (!r.vivo || r.mudo || r.rodando || !temMicrofone) return;
    if (!r.ouvinte) {
      r.ouvinte = criarOuvinte({
        onParcial: (p) => {
          if (!p) return;
          // Com fone, dá para interromper o Jarvis falando por cima.
          if (R.current.fase === "falando" && R.current.fone && p.split(/\s+/).length >= 2) { falador.parar(); mudarFase("ouvindo"); }
          clearTimeout(R.current.timer);
          setParcial(`${R.current.buffer} ${p}`.trim());
        },
        onFinal: (t) => {
          if (!t || R.current.fase === "pensando" && !R.current.fone) return;
          if (R.current.fase === "falando" && !R.current.fone) return;
          R.current.buffer = `${R.current.buffer} ${t}`.trim();
          setParcial(R.current.buffer);
          clearTimeout(R.current.timer);
          R.current.timer = setTimeout(enviar, 1100); // espera um respiro para ver se ele ainda vai continuar
        },
        onErro: (e) => {
          if (e === "not-allowed" || e === "service-not-allowed") { setErro("O navegador bloqueou o microfone. Libere no cadeado da barra de endereço e clique em Tentar de novo."); mudarFase("erro"); R.current.vivo = true; }
          else if (e === "network") setErro("O reconhecimento de voz perdeu a conexão. Vou tentar de novo.");
          else if (e === "audio-capture") { setErro("Não encontrei um microfone neste computador."); mudarFase("erro"); }
        },
        onFim: () => {
          const x = R.current;
          x.rodando = false;
          if (x.vivo && !x.mudo && x.fase !== "erro" && (x.fase === "ouvindo" || x.fone)) setTimeout(ouvir, 250); // o navegador encerra sozinho de tempos em tempos
        },
      });
    }
    try { r.ouvinte.start(); r.rodando = true; } catch { /* já estava ouvindo */ }
  }, []);

  const enviar = React.useCallback(async () => {
    const r = R.current;
    const texto = r.buffer.trim();
    r.buffer = "";
    if (!texto || !r.vivo) return;
    const seq = ++r.seq;
    setVoce(texto);
    setParcial("");
    setErro("");
    falador.parar();
    mudarFase("pensando");
    if (!r.fone) parar(); // sem fone, o microfone fecha para não ouvir a própria voz do Jarvis
    const resp = await askVoz(texto);
    if (!r.vivo || seq !== r.seq) return; // chegou outra fala por cima, ou ele encerrou
    const fala = resp?.text || "Não consegui responder agora.";
    setJarvis(fala);
    mudarFase("falando");
    const falaComBotao = resp?.confirm ? `${fala} Deixei o botão de confirmar na tela.` : fala;
    const terminou = await falador.falar(falaComBotao);
    if (!r.vivo || seq !== r.seq) return;
    if (terminou || R.current.fase === "falando") { mudarFase(r.mudo ? "mudo" : "ouvindo"); ouvir(); }
  }, [askVoz, ouvir, parar]);

  R.current.fone = fone;
  R.current.mudo = mudo;

  React.useEffect(() => {
    const r = R.current;
    r.vivo = true;
    if (!temMicrofone) { setErro("Este navegador não tem reconhecimento de voz. Use o Chrome ou o Edge."); mudarFase("erro"); return; }
    mudarFase("ouvindo");
    ouvir();
    let trava = null;
    navigator.wakeLock?.request("screen").then((l) => { trava = l; }).catch(() => {});
    const tecla = (e) => { if (e.key === "Escape") onFechar(); };
    window.addEventListener("keydown", tecla);
    return () => {
      r.vivo = false;
      clearTimeout(r.timer);
      falador.parar();
      parar();
      try { r.ouvinte = null; } catch { /* nada */ }
      trava?.release?.();
      window.removeEventListener("keydown", tecla);
    };
  }, []);

  const alternarMudo = () => {
    const novo = !mudo;
    setMudo(novo);
    R.current.mudo = novo;
    if (novo) { parar(); falador.parar(); clearTimeout(R.current.timer); setParcial(""); R.current.buffer = ""; mudarFase("mudo"); }
    else { mudarFase("ouvindo"); setTimeout(ouvir, 100); }
  };
  const alternarFone = () => {
    const novo = !fone;
    setFone(novo);
    try { localStorage.setItem("live_fone", novo ? "1" : "0"); } catch { /* sem armazenamento */ }
  };
  const interromper = () => { falador.parar(); R.current.seq++; mudarFase(mudo ? "mudo" : "ouvindo"); setTimeout(ouvir, 100); };
  const tentarDeNovo = () => { setErro(""); mudarFase("ouvindo"); R.current.ouvinte = null; ouvir(); };
  const atalho = (t) => { R.current.buffer = t; clearTimeout(R.current.timer); enviar(); };

  const pendente = [...state.messages].reverse().find((m) => m.from === "jarvis" && m.confirm);
  const confirmacao = pendente && !pendente.confirm.done ? pendente : null;
  const mostrado = parcial || voce;

  return createPortal(
    <div className="live" role="dialog" aria-modal="true" aria-label="Conversa por voz com o Jarvis">
      <button type="button" className="live-x" onClick={onFechar} aria-label="Encerrar conversa por voz"><X size={20} aria-hidden /></button>
      <div className={`live-orb live-${fase}`} aria-hidden>
        <i /><i />
        <JarvisBot estado={fase === "erro" ? "mudo" : fase} size={150} decorativo />
        {fase === "ouvindo" ? <b className="live-mic"><Mic size={16} /></b> : fase === "mudo" ? <b className="live-mic"><MicOff size={16} /></b> : null}
      </div>
      <p className="live-estado" role="status">{ROTULO[fase]}</p>

      <div className="live-texto">
        {mostrado ? <p className={`live-voce${parcial ? " parcial" : ""}`}>{mostrado}</p> : <p className="live-dica">{fase === "erro" ? "" : "Pode falar. Eu respondo em voz alta."}</p>}
        {jarvis ? <p className="live-jarvis">{jarvis}</p> : null}
        {erro ? <p className="live-erro">{erro}</p> : null}
      </div>

      {confirmacao ? (
        <div className="confirm live-confirm">
          <button type="button" className="btn btn-primary" onClick={() => confirm(confirmacao.id, true)}><Check size={15} aria-hidden /> {confirmacao.confirm.label}</button>
          <button type="button" className="btn" onClick={() => confirm(confirmacao.id, false)}><X size={15} aria-hidden /> Cancelar</button>
        </div>
      ) : null}

      {fase === "ouvindo" && !voce && !jarvis ? (
        <div className="live-atalhos">{ATALHOS.map((a) => <button key={a} type="button" className="chip" onClick={() => atalho(a)}>{a}</button>)}</div>
      ) : null}

      <div className="live-controles">
        {fase === "erro" ? <button type="button" className="btn btn-primary" onClick={tentarDeNovo}>Tentar de novo</button> : null}
        <button type="button" className={`btn${mudo ? " on" : ""}`} onClick={alternarMudo} aria-pressed={mudo}>{mudo ? <><MicOff size={16} aria-hidden /> Ligar microfone</> : <><Mic size={16} aria-hidden /> Silenciar</>}</button>
        {fase === "falando" || fase === "pensando" ? <button type="button" className="btn" onClick={interromper}><Square size={14} aria-hidden /> Interromper</button> : null}
        <button type="button" className={`btn${fone ? " on" : ""}`} onClick={alternarFone} aria-pressed={fone} title="Com fone, você pode falar por cima e o Jarvis para. Sem fone, o microfone fecha enquanto ele fala, para não ouvir a própria voz."><Headphones size={16} aria-hidden /> {fone ? "De fone: pode me interromper" : "Estou sem fone"}</button>
        <button type="button" className="btn btn-primary" onClick={onFechar}>Encerrar</button>
      </div>
      <p className="live-nota">{falador.neural === false ? "Falando com a voz do navegador." : "Voz neural do Brain."} Esc encerra.</p>
    </div>,
    document.body,
  );
}
