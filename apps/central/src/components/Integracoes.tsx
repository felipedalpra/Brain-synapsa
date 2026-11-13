import { useState } from "react";
import { CircleCheck, CircleDashed, Hand, KeyRound, Plug } from "lucide-react";
import { agentById } from "../lib";
import { useBrain } from "../store";
import type { IntegrationState } from "../types";

const LABEL: Record<IntegrationState, string> = { conectado: "Conectado", pronto: "Credencial pronta", pendente: "Falta configurar", manual: "Manual" };

function Icon({ s }: { s: IntegrationState }) {
  if (s === "conectado") return <CircleCheck size={18} aria-hidden />;
  if (s === "pronto") return <KeyRound size={18} aria-hidden />;
  if (s === "manual") return <Hand size={18} aria-hidden />;
  return <CircleDashed size={18} aria-hidden />;
}

export function Integracoes() {
  const { state, setSim, live, checkIntegrations } = useBrain();
  const [busy, setBusy] = useState(false);
  const count = (s: IntegrationState) => state.integrations.filter((i) => i.state === s).length;
  return (
    <div className="page">
      <header className="page-head">
        <h1>Saúde das integrações</h1>
        <p>
          {count("conectado")} conectadas, {count("pronto")} com credencial pronta, {count("pendente")} pendentes e {count("manual")} manual. Os valores dos segredos nunca aparecem aqui, só o nome.
        </p>
      </header>

      {live ? (
        <p>
          <button type="button" className="btn" disabled={busy} onClick={() => { setBusy(true); void checkIntegrations().finally(() => setBusy(false)); }}>
            {busy ? "Testando…" : "Testar conexões"}
          </button>
        </p>
      ) : (
        <label className="switch" htmlFor="sim">
          <input id="sim" type="checkbox" checked={state.simulateLive} onChange={(e) => setSim(e.target.checked)} />
          <span aria-hidden />
          <span>Simular tudo conectado, para ver como fica no dia a dia</span>
        </label>
      )}

      <ul className="integrations">
        {state.integrations.map((i) => (
          <li key={i.id} className={`int int-${i.state}`}>
            <header>
              <Icon s={i.state} />
              <h2>{i.name}</h2>
              <span className="state">{LABEL[i.state]}</span>
            </header>
            <p>{i.detail}</p>
            <p className="muted">Libera: {i.unlocks}</p>
            {i.state === "conectado" && i.syncMinutes && !live ? <p className="sync">Última leitura há {i.syncMinutes} min (simulada)</p> : null}
            {i.secrets.length ? (
              <p className="secrets">
                <Plug size={14} aria-hidden /> {i.secrets.map((s) => <code key={s}>{s}</code>)}
              </p>
            ) : null}
            {i.state !== "conectado" ? <p className="next">Próximo passo: {i.next}</p> : null}
            <p className="who">{i.agents.map((id) => agentById(id)?.name).filter(Boolean).join(" · ")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
