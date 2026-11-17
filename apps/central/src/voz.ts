// @ts-nocheck
// Voz do Jarvis: ouvir (reconhecimento de fala do navegador, em português) e falar (voz neural do Brain, com a voz do navegador de reserva).

const W = typeof window !== "undefined" ? window : ({} as any);
export const SR = W.SpeechRecognition || W.webkitSpeechRecognition || null;
export const temMicrofone = !!SR;

/** Tira o que não se fala: markdown, links, símbolos. Números de dinheiro e porcentagem viram palavras. */
export function paraFala(t: string): string {
  return String(t ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "o link")
    .replace(/R\$\s*(\d[\d.]*(?:,\d+)?)/g, "$1 reais")
    .replace(/(\d)\s*%/g, "$1 por cento")
    .replace(/[*_`#>|~]/g, "")
    .replace(/^\s*[-•]\s+/gm, "")
    .replace(/\s*\n+\s*/g, ". ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Quebra em pedaços de frase (até ~230 caracteres) para começar a falar enquanto o resto ainda carrega. */
export function pedacos(texto: string, max = 230): string[] {
  const frases = texto.split(/(?<=[.!?…])\s+/).filter(Boolean);
  const out: string[] = [];
  let atual = "";
  for (const f of frases) {
    if (atual && (atual + " " + f).length > max) { out.push(atual); atual = f; }
    else atual = atual ? `${atual} ${f}` : f;
    if (atual.length >= 90 && /[.!?…]$/.test(atual) && out.length === 0) { out.push(atual); atual = ""; } // o primeiro pedaço sai cedo
  }
  if (atual) out.push(atual);
  return out.length ? out : [texto];
}

// 0,05 s de silêncio (WAV) para destravar o áudio
const SILENCIO = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
let vozNavegador = null;
function escolherVoz() {
  if (vozNavegador || !W.speechSynthesis) return vozNavegador;
  const v = W.speechSynthesis.getVoices().filter((x) => /^pt(-|_)BR/i.test(x.lang));
  vozNavegador = v.find((x) => /google|luciana|felipe|microsoft/i.test(x.name)) ?? v[0] ?? null;
  return vozNavegador;
}

/** Um falador só para a Central inteira: quem começa a falar interrompe quem falava. */
function criarFalador() {
  let token = 0;
  let audio = null;
  let ctrl = null;
  let audioEl = null;
  let destravado = false;
  let erroAudio = "";
  let neural = null; // null = ainda não sei; false = sem voz neural nesta sessão
  const ouvintes = new Set();
  const avisar = (falando) => ouvintes.forEach((f) => f(falando));

  async function buscar(texto, sinal) {
    const r = await fetch("/api/voz/falar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texto }), signal: sinal });
    if (r.status === 501 || r.status === 429) { neural = false; return null; }
    if (!r.ok) return null;
    return URL.createObjectURL(await r.blob());
  }
  // Um único elemento de áudio, "destravado" no primeiro toque/tecla: o navegador só deixa tocar som depois de um gesto do usuário.
  function elemento() {
    if (!audioEl) { audioEl = new Audio(); audioEl.preload = "auto"; }
    return audioEl;
  }
  function destravar() {
    if (destravado) return;
    destravado = true;
    try {
      const a = elemento();
      a.src = SILENCIO;
      a.volume = 0.01;
      const p = a.play();
      (p && p.then ? p : Promise.resolve()).then(() => { a.pause(); a.volume = 1; }).catch(() => { destravado = false; a.volume = 1; });
    } catch { destravado = false; }
  }
  function tocar(url, t, velocidade) {
    // true = tocou até o fim; false = o navegador não deixou tocar (aí falo com a voz do navegador)
    return new Promise((res) => {
      const a = elemento();
      audio = a;
      let comecou = false;
      const fim = (ok) => { a.onended = a.onerror = a.onpause = a.onplaying = null; URL.revokeObjectURL(url); res(ok); };
      a.onplaying = () => { comecou = true; };
      a.onended = () => fim(true);
      a.onerror = () => fim(comecou);
      a.onpause = () => { if (t !== token) fim(true); };
      a.src = url;
      a.playbackRate = velocidade;
      a.volume = 1;
      a.muted = false;
      const p = a.play();
      if (p && p.catch) p.catch((e) => { erroAudio = e?.name || "erro"; fim(false); });
    });
  }
  function navegador(texto, velocidade) {
    return new Promise((res) => {
      if (!W.speechSynthesis) return res();
      const u = new SpeechSynthesisUtterance(texto);
      u.lang = "pt-BR";
      u.rate = velocidade;
      const v = escolherVoz();
      if (v) u.voice = v;
      u.onend = () => res();
      u.onerror = () => res();
      try { W.speechSynthesis.resume(); } catch { /* segue */ }
      W.speechSynthesis.speak(u);
    });
  }

  return {
    get neural() { return neural; },
    get erroAudio() { return erroAudio; },
    destravar,
    aoMudar(f) { ouvintes.add(f); return () => ouvintes.delete(f); },
    parar() {
      token++;
      ctrl?.abort();
      if (audio) { try { audio.pause(); } catch { /* já parou */ } audio = null; }
      W.speechSynthesis?.cancel();
      avisar(false);
    },
    /** Fala o texto até o fim. Devolve true se terminou, false se foi interrompido. */
    async falar(texto, { velocidade = 1.08 } = {}) {
      this.parar();
      const t = token;
      const lista = pedacos(paraFala(texto));
      if (!lista.length || !lista[0]) return true;
      ctrl = new AbortController();
      const sinal = ctrl.signal;
      avisar(true);
      let proximo = neural === false ? null : buscar(lista[0], sinal).catch(() => null);
      for (let i = 0; i < lista.length; i++) {
        if (t !== token) return false;
        let url = null;
        if (neural !== false) {
          url = await proximo;
          if (i + 1 < lista.length && neural !== false) proximo = buscar(lista[i + 1], sinal).catch(() => null);
        }
        if (t !== token) { if (url) URL.revokeObjectURL(url); return false; }
        const tocou = url ? await tocar(url, t, velocidade) : false;
        if (!tocou && t === token) await navegador(lista[i], velocidade);
      }
      if (t === token) avisar(false);
      return t === token;
    },
  };
}
export const falador = criarFalador();
if (typeof document !== "undefined") {
  const abrir = () => { falador.destravar(); };
  document.addEventListener("pointerdown", abrir, { once: true, capture: true });
  document.addEventListener("keydown", abrir, { once: true, capture: true });
}
if (W.speechSynthesis) W.speechSynthesis.onvoiceschanged = () => { vozNavegador = null; };

/** Reconhecimento de fala contínuo, com resultados parciais. */
export function criarOuvinte({ onParcial, onFinal, onErro, onFim }) {
  if (!SR) return null;
  const r = new SR();
  r.lang = "pt-BR";
  r.continuous = true;
  r.interimResults = true;
  r.maxAlternatives = 1;
  r.onresult = (e) => {
    let parcial = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const txt = e.results[i][0].transcript;
      if (e.results[i].isFinal) onFinal?.(txt.trim());
      else parcial += txt;
    }
    onParcial?.(parcial.trim());
  };
  r.onerror = (e) => onErro?.(e.error);
  r.onend = () => onFim?.();
  return r;
}
