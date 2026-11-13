// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { CircleCheck, CircleDashed, Hand, KeyRound, Plug } from "lucide-react";
import { useBrain } from "../store";
import { so } from "../lib";

export const sv = {
  conectado: "Conectado",
  pronto: "Credencial pronta",
  pendente: "Falta configurar",
  manual: "Manual",
};
export function IconeIntegracao({ s: e }) {
  return e === "conectado" ? (
    <CircleCheck size={18} aria-hidden />
  ) : e === "pronto" ? (
    <KeyRound size={18} aria-hidden />
  ) : e === "manual" ? (
    <Hand size={18} aria-hidden />
  ) : (
    <CircleDashed size={18} aria-hidden />
  );
}
export function Integracoes() {
  const { state: e, setSim: a, live: t, checkIntegrations: r } = useBrain(),
    [o, s] = React.useState(false),
    i = (l) => e.integrations.filter((c) => c.state === l).length;
  return (
    <div className="page">
      <header className="page-head">
        <h1>Saúde das integrações</h1>
        <p>
          {i("conectado")}
          {" conectadas, "}
          {i("pronto")}
          {" com credencial pronta, "}
          {i("pendente")}
          {" pendentes e "}
          {i("manual")}
          {" manual. Os valores dos segredos nunca aparecem aqui, s\xF3 o nome."}
        </p>
      </header>
      {t ? (
        <p>
          <button
            type="button"
            className="btn"
            disabled={o}
            onClick={() => {
              (s(true), r().finally(() => s(false)));
            }}
          >
            {o ? "Testando\u2026" : "Testar conex\xF5es"}
          </button>
        </p>
      ) : (
        <label className="switch" htmlFor="sim">
          <input id="sim" type="checkbox" checked={e.simulateLive} onChange={(l) => a(l.target.checked)} />
          <span aria-hidden />
          <span>Simular tudo conectado, para ver como fica no dia a dia</span>
        </label>
      )}
      <ul className="integrations">
        {e.integrations.map((l) => (
          <li className={`int int-${l.state}`}>
            <header>
              <IconeIntegracao s={l.state} />
              <h2>{l.name}</h2>
              <span className="state">{sv[l.state]}</span>
            </header>
            <p>{l.detail}</p>
            <p className="muted">
              {"Libera: "}
              {l.unlocks}
            </p>
            {l.state === "conectado" && l.syncMinutes && !t ? (
              <p className="sync">
                {"\xDAltima leitura h\xE1 "}
                {l.syncMinutes}
                {" min (simulada)"}
              </p>
            ) : null}
            {l.secrets.length ? (
              <p className="secrets">
                <Plug size={14} aria-hidden />{" "}
                {l.secrets.map((c) => (
                  <code>{c}</code>
                ))}
              </p>
            ) : null}
            {l.state !== "conectado" ? (
              <p className="next">
                {"Pr\xF3ximo passo: "}
                {l.next}
              </p>
            ) : null}
            <p className="who">
              {l.agents
                .map((c) => so(c)?.name)
                .filter(Boolean)
                .join(" \xB7 ")}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
