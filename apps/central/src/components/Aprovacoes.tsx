import { useState } from "react";
import { Check, Copy, ShieldCheck, X } from "lucide-react";
import { CHANNEL_LABEL, ago, agentById, brl, teamOf } from "../lib";
import { useBrain } from "../store";
import type { Proposal } from "../types";

export function Aprovacoes() {
  const { state, decide } = useBrain();
  const sorted = [...state.proposals].sort((a, b) => (a.status === "pendente" ? 0 : 1) - (b.status === "pendente" ? 0 : 1) || b.impactoBrl - a.impactoBrl);
  const [sel, setSel] = useState<string | null>(null);
  const current = sorted.find((p) => p.id === sel) ?? sorted[0] ?? null;
  const pending = sorted.filter((p) => p.status === "pendente").length;

  return (
    <div className="page">
      <header className="page-head">
        <h1>Aprovações</h1>
        <p>
          {pending ? `${pending} esperando você, ordenadas por impacto em reais.` : "Fila vazia."} Aprovar não envia nada: você copia o texto e manda pelo seu WhatsApp, LinkedIn ou Instagram.
        </p>
      </header>

      {state.overflow > 0 ? <p className="muted">Mais {state.overflow} ficaram fora do teto de hoje e entram quando você esvaziar a fila.</p> : null}
      {state.kill ? <p className="banner" role="alert">Botão de emergência ligado. Nenhuma aprovação passa até você religar.</p> : null}

      <div className="split">
        <ul className="queue" aria-label="Propostas">
          {sorted.map((p) => {
            const ag = agentById(p.agentId);
            return (
              <li key={p.id}>
                <button type="button" className={`q-item ${current?.id === p.id ? "on" : ""} q-${p.status}`} onClick={() => setSel(p.id)} style={{ ["--team" as string]: ag ? `var(${teamOf(ag).hue})` : undefined }}>
                  <span className="q-title">{p.title}</span>
                  <span className="q-meta">
                    {ag?.name} · {CHANNEL_LABEL[p.channel]} · risco {p.risk} {p.status !== "pendente" ? `· ${p.status}` : ""}
                  </span>
                  <span className="q-money">{p.impactoBrl > 0 ? brl(p.impactoBrl) : "sem receita direta"}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {current ? <Detail p={current} killed={state.kill} onDecide={decide} /> : null}
      </div>
    </div>
  );
}

function Detail({ p, killed, onDecide }: { p: Proposal; killed: boolean; onDecide: (id: string, to: "aprovada" | "rejeitada") => void }) {
  const ag = agentById(p.agentId);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!p.draft) return;
    try {
      await navigator.clipboard.writeText(p.draft);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  return (
    <article className="detail" aria-live="polite">
      <header>
        <h2>{p.title}</h2>
        <p className="muted">
          {ag?.name} · {CHANNEL_LABEL[p.channel]} · {ago(Date.now(), p.at)} atrás
        </p>
      </header>

      <p className="review">
        <ShieldCheck size={16} aria-hidden /> Conformidade: {p.review}
      </p>

      <section>
        <h3>Por que o agente propôs</h3>
        <p>{p.why}</p>
      </section>

      {p.draft ? (
        <section>
          <h3>Texto pronto</h3>
          <blockquote>{p.draft}</blockquote>
        </section>
      ) : null}

      <footer>
        {p.status === "pendente" ? (
          <>
            <button type="button" className="btn btn-primary" disabled={killed} onClick={() => onDecide(p.id, "aprovada")}>
              <Check size={15} aria-hidden /> Aprovar
            </button>
            <button type="button" className="btn" onClick={() => onDecide(p.id, "rejeitada")}>
              <X size={15} aria-hidden /> Rejeitar
            </button>
          </>
        ) : (
          <>
            <span className={`status-pill ${p.status}`}>{p.status === "aprovada" ? "Aprovada" : "Rejeitada"}</span>
            {p.status === "aprovada" && p.draft ? (
              <button type="button" className="btn btn-primary" onClick={copy}>
                <Copy size={15} aria-hidden /> {copied ? "Copiado" : "Copiar texto"}
              </button>
            ) : null}
          </>
        )}
      </footer>
    </article>
  );
}
