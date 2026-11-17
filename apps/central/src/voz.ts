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
  let neural = null; // null = ainda não sei; false = sem voz neural nesta sessão
  const ouvintes = new Set();
  const avisar = (falando) => ouvintes.forEach((f) => f(falando));

  async function buscar(texto, sinal) {
    const r = await fetch("/api/voz/falar", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ texto }), signal: sinal });
    if (r.status === 501 || r.status === 429) { neural = false; return null; }
    if (!r.ok) return null;
    return URL.createObjectURL(await r.blob());
  }
  function tocar(url, t, velocidade) {
    return new Promise((res) => {
      const a = new Audio(url);
      audio = a;
      a.playbackRate = velocidade;
      const fim = () => { URL.revokeObjectURL(url); res(); };
      a.onended = fim;
      a.onerror = fim;
      a.onpause = () => { if (t !== token) fim(); };
      a.play().catch(fim);
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
      W.speechSynthesis.speak(u);
    });
  }

  return {
    get neural() { return neural; },
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
        if (url) await tocar(url, t, velocidade);
        else await navegador(lista[i], velocidade);
      }
      if (t === token) avisar(false);
      return t === token;
    },
  };
}
export const falador = criarFalador();
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
