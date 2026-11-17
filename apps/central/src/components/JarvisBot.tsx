// @ts-nocheck
// O Jarvis desenhado no traço da Lyra (mascote da Synapsa): corpo roxo de cérebro, antenas com bolinha verde, contorno azul-marinho
// grosso, olhos sorridentes e bochechas rosa, mas em versão robô: viseira de vidro, circuitos no lugar das dobras do cérebro,
// portas laterais e um núcleo verde no peito. As cores são as da Lyra, não as do tema da plataforma.
import * as React from "react";

const C = { contorno: "#3a3f9a", roxoA: "#c4aaf8", roxoB: "#8c6fe4", azulA: "#bfe5fb", azulB: "#7fb7ea", verde: "#3fe0a5", visor: "#171a4d", led: "#b4f4ff", rosa: "#ff9ec7" };

/** estado: idle | ouvindo | pensando | falando | mudo | kill */
export function JarvisBot({ estado = "idle", size = 160, compacto = false, className = "", titulo = "Jarvis", x, y, decorativo = false }) {
  const u = React.useId().replace(/:/g, "");
  const vb = compacto ? "18 4 164 136" : "0 0 200 214";
  const alt = compacto ? Math.round((size * 136) / 164) : Math.round((size * 214) / 200);
  return (
    <svg className={`jv jv-${estado} ${compacto ? "jv-compacto" : ""} ${className}`} viewBox={vb} width={size} height={alt} x={x} y={y} {...(decorativo ? { "aria-hidden": true } : { role: "img", "aria-label": titulo })} focusable="false">
      <defs>
        <linearGradient id={`${u}r`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.roxoA} /><stop offset="1" stopColor={C.roxoB} /></linearGradient>
        <linearGradient id={`${u}a`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={C.azulA} /><stop offset="1" stopColor={C.azulB} /></linearGradient>
        <radialGradient id={`${u}v`} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#d6fff0" /><stop offset="0.45" stopColor={C.verde} /><stop offset="1" stopColor="#14a778" /></radialGradient>
      </defs>
      <ellipse className="jv-sombra" cx="100" cy="208" rx="46" ry="5" fill="#000" opacity="0.28" />
      <g className="jv-corpo">
        {/* pernas e pés */}
        <rect x="72" y="190" width="24" height="16" rx="8" fill={`url(#${u}a)`} stroke={C.contorno} strokeWidth="5" />
        <rect x="104" y="190" width="24" height="16" rx="8" fill={`url(#${u}a)`} stroke={C.contorno} strokeWidth="5" />
        {/* braços */}
        <ellipse cx="52" cy="164" rx="11" ry="19" transform="rotate(18 52 164)" fill={`url(#${u}a)`} stroke={C.contorno} strokeWidth="5" />
        <ellipse cx="148" cy="164" rx="11" ry="19" transform="rotate(-18 148 164)" fill={`url(#${u}a)`} stroke={C.contorno} strokeWidth="5" />
        {/* tronco */}
        <rect x="62" y="134" width="76" height="62" rx="28" fill={`url(#${u}a)`} stroke={C.contorno} strokeWidth="6" />
        <path d="M74 146 Q78 141 88 141" stroke="#fff" strokeOpacity="0.65" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {/* núcleo do peito: o espiral verde da Lyra, em forma de reator */}
        <circle cx="100" cy="168" r="21" fill={C.visor} stroke={C.contorno} strokeWidth="3.5" />
        <circle className="jv-anel jv-anel-1" cx="100" cy="168" r="15" fill="none" stroke={C.verde} strokeWidth="3.5" strokeDasharray="22 9" strokeLinecap="round" />
        <circle className="jv-anel jv-anel-2" cx="100" cy="168" r="9" fill="none" stroke={C.verde} strokeWidth="3" strokeDasharray="10 7" strokeLinecap="round" />
        <circle className="jv-miolo" cx="100" cy="168" r="3.6" fill={C.verde} />
      </g>
      <g className="jv-cabeca">
        {/* pescoço */}
        <rect x="86" y="126" width="28" height="12" rx="4" fill="#5a60c4" stroke={C.contorno} strokeWidth="4" />
        {/* antenas */}
        <g className="jv-antena jv-antena-e">
          <path d="M78 46 Q70 28 58 20" stroke={C.contorno} strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <circle className="jv-bulbo jv-bulbo-e" cx="55" cy="17" r="8.5" fill={`url(#${u}v)`} stroke={C.contorno} strokeWidth="4" />
          <circle cx="52" cy="14" r="2.2" fill="#fff" opacity="0.9" />
        </g>
        <g className="jv-antena jv-antena-d">
          <path d="M122 46 Q130 28 142 20" stroke={C.contorno} strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <circle className="jv-bulbo jv-bulbo-d" cx="145" cy="17" r="8.5" fill={`url(#${u}v)`} stroke={C.contorno} strokeWidth="4" />
          <circle cx="142" cy="14" r="2.2" fill="#fff" opacity="0.9" />
        </g>
        {/* portas laterais */}
        <rect x="22" y="72" width="16" height="32" rx="7" fill={`url(#${u}a)`} stroke={C.contorno} strokeWidth="4.5" />
        <rect x="162" y="72" width="16" height="32" rx="7" fill={`url(#${u}a)`} stroke={C.contorno} strokeWidth="4.5" />
        <circle className="jv-ouvido" cx="30" cy="88" r="3" fill={C.verde} />
        <circle className="jv-ouvido" cx="170" cy="88" r="3" fill={C.verde} />
        {/* cabeça de cérebro */}
        <rect x="33" y="40" width="134" height="92" rx="46" fill={`url(#${u}r)`} stroke={C.contorno} strokeWidth="6.5" />
        <path d="M52 56 Q64 44 82 43" stroke="#fff" strokeOpacity="0.55" strokeWidth="4" strokeLinecap="round" fill="none" />
        {/* dobras do cérebro viradas circuito */}
        <g className="jv-circuito" fill="none" stroke="#efe6ff" strokeOpacity="0.85" strokeWidth="2.6" strokeLinecap="round">
          <path className="jv-fio" d="M60 62 C70 50 84 50 92 60 S112 70 122 58 S140 52 146 62" />
          <path className="jv-fio" d="M70 76 C80 68 90 72 98 66 S118 60 130 70" />
          <path d="M100 44 C95 53 105 61 100 69" strokeOpacity="0.6" />
        </g>
        <g fill="#fff">
          <circle cx="92" cy="60" r="2.6" /><circle cx="122" cy="58" r="2.6" /><circle cx="98" cy="66" r="2.2" /><circle cx="60" cy="62" r="2.2" /><circle cx="146" cy="62" r="2.2" />
        </g>
        {/* viseira de vidro com olhos sorridentes em LED */}
        <rect x="50" y="78" width="100" height="46" rx="21" fill={C.visor} stroke={C.contorno} strokeWidth="4" />
        <path d="M58 86 Q66 82 78 83" stroke="#fff" strokeOpacity="0.28" strokeWidth="3" strokeLinecap="round" fill="none" />
        <g className="jv-olhos">
          <g className="jv-olho"><path d="M66 102 Q75 89 84 102" stroke={C.led} strokeWidth="5.5" strokeLinecap="round" fill="none" /></g>
          <g className="jv-olho"><path d="M116 102 Q125 89 134 102" stroke={C.led} strokeWidth="5.5" strokeLinecap="round" fill="none" /></g>
        </g>
        <ellipse cx="62" cy="111" rx="7.5" ry="4.2" fill={C.rosa} opacity="0.85" />
        <ellipse cx="138" cy="111" rx="7.5" ry="4.2" fill={C.rosa} opacity="0.85" />
        <path className="jv-boca" d="M91 108 Q100 117 109 108" stroke={C.led} strokeWidth="3.8" strokeLinecap="round" fill="none" />
        <ellipse className="jv-boca-fala" cx="100" cy="112" rx="8" ry="6" fill={C.rosa} stroke={C.led} strokeWidth="2.5" />
      </g>
    </svg>
  );
}
