// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { Check, Info, TriangleAlert, X } from "lucide-react";
import { useBrain } from "../store";
import { Q } from "../shared-inline";
import { _s } from "../lib";

export let Jt = [];
export let jh = 0;
export const avisosOuvintes = /* @__PURE__ */ new Set();
export const avisosNotificar = () => avisosOuvintes.forEach((e) => e());
export const avisos = {
  push(e) {
    const a = {
      ...e,
      id: ++jh,
    };
    ((Jt = [...Jt, a].slice(-5)),
      avisosNotificar(),
      e.sticky || window.setTimeout(() => avisos.close(a.id), e.kind === "info" ? 3500 : 9e3));
  },
  close(e) {
    ((Jt = Jt.filter((a) => a.id !== e)), avisosNotificar());
  },
};
export const avisosAssinar = (e) => (avisosOuvintes.add(e), () => void avisosOuvintes.delete(e));
export const avisosLer = () => Jt;
export function useAvisosDoRuntime() {
  const { state: e, live: a } = useBrain(),
    t = React.useRef(null);
  React.useEffect(() => {
    if (a) {
      if (!t.current) {
        t.current = new Map(Object.entries(e.runtime).map(([r, o]) => [r, o.lastRun?.id ?? 0]));
        return;
      }
      for (const [r, o] of Object.entries(e.runtime)) {
        const s = o.lastRun;
        if (!s || t.current.get(r) === s.id) continue;
        t.current.set(r, s.id);
        const i = Q.find((l) => l.id === r)?.name ?? r;
        if (s.status === "done")
          avisos.push({
            kind: "ok",
            title: `${i} terminou`,
            text: s.detail.slice(0, 170),
            agentId: r,
          });
        else {
          const l = _s(s.detail, s.status);
          avisos.push({
            kind: "erro",
            title: `${i} n\xE3o conseguiu: ${l.titulo}`,
            text: `${l.motivo} ${l.acao}`,
            agentId: r,
            sticky: true,
          });
        }
      }
    }
  }, [e.runtime, a]);
}
export function Avisos({ onOpen: e }) {
  const a = React.useSyncExternalStore(avisosAssinar, avisosLer, avisosLer);
  return (
    useAvisosDoRuntime(),
    a.length ? (
      <div className="toasts" role="region" aria-label="Avisos">
        {a.map((t) => (
          <div className={`toast toast-${t.kind}`} role={t.kind === "erro" ? "alert" : "status"}>
            <span className="toast-ico" aria-hidden>
              {t.kind === "ok" ? (
                <Check size={16} />
              ) : t.kind === "erro" ? (
                <TriangleAlert size={16} />
              ) : (
                <Info size={16} />
              )}
            </span>
            <div className="toast-body">
              <strong>{t.title}</strong>
              {t.text ? <p>{t.text}</p> : null}
              {t.agentId && t.kind !== "info" ? (
                <button
                  type="button"
                  className="link"
                  onClick={() => {
                    (e(t.agentId), avisos.close(t.id));
                  }}
                >
                  Abrir no escritório
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="toast-x"
              onClick={() => avisos.close(t.id)}
              aria-label="Fechar aviso"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        ))}
      </div>
    ) : null
  );
}
