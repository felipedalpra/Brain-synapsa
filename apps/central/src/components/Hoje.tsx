import { AGENTS } from "../data/roster";
import { ago, agentById, brl, teamOf } from "../lib";
import { useBrain } from "../store";

export function Hoje() {
  const { state, pending } = useBrain();
  const M = state.metrics;
  const { total, goal, stripe, pix, manual, essencialPrice } = M.mrr;
  const falta = Math.max(0, goal - total);
  const runs = Object.values(state.runtime).reduce((n, r) => n + r.runsToday, 0);
  const cost = Object.values(state.runtime).reduce((n, r) => n + r.costBrl, 0);
  const f = M.funil;
  const funnel = f
    ? [
        { label: "Cadastros", v: f.cadastros },
        { label: "Ativados", v: f.ativados },
        { label: "No limite de 5", v: f.noLimite },
        { label: "Pagantes", v: f.pagantes },
      ]
    : [];
  const away = state.activity.filter((a) => a.at > state.now - 8 * 3600_000);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Enquanto você esteve fora</h1>
        <p>
          {runs} execuções, {pending.length} propostas esperando você e nenhuma mensagem enviada para fora. Gasto de IA hoje: {brl(cost)}. {state.mode === "live" ? `No mês: ${brl(M.llmSpentMonthBrl)} de ${brl(M.llmCapMonthlyBrl)}.` : null}
        </p>
      </header>

      <div className="hoje-grid">
        <section className="panel panel-mrr" aria-labelledby="mrr-t">
          <h2 id="mrr-t">Caminho até {brl(goal)}</h2>
          <p className="big">
            {brl(total)}
            <span> de MRR hoje</span>
          </p>
          <div className="bar" role="img" aria-label={`${Math.round((total / goal) * 100)}% da meta: ${brl(stripe)} no Stripe e ${brl(pix)} por Pix`}>
            <i className="bar-stripe" style={{ width: `${(stripe / goal) * 100}%` }} />
            <i className="bar-pix" style={{ width: `${((pix + manual) / goal) * 100}%` }} />
          </div>
          <ul className="legend">
            <li>
              <i className="dot dot-stripe" /> Stripe {brl(stripe)}
            </li>
            <li>
              <i className="dot dot-pix" /> Pix {brl(pix + manual)}
            </li>
            <li>
              <i className="dot dot-gap" /> Falta {brl(falta)}
            </li>
          </ul>
          <p className="muted">
            Faltam cerca de {Math.ceil(falta / essencialPrice)} Essenciais a {brl(essencialPrice)} até {M.mrr.goalDate}. O desconto de {brl(essencialPrice)} dura 6 meses e depois o plano volta a R$ 119.
          </p>
        </section>

        <section className="panel" aria-labelledby="fun-t">
          <h2 id="fun-t">Funil de hoje</h2>
          {!f ? (
            <p className="muted">Sem dados ainda. A plataforma precisa mandar cadastros e uso para o Brain: isso depende do PR no mvp-v2.</p>
          ) : null}
          <ul className="funnel">
            {funnel.map((x, i) => (
              <li key={x.label}>
                <span className="funnel-label">{x.label}</span>
                <span className="funnel-bar">
                  <i style={{ width: `${(x.v / Math.max(1, funnel[0]!.v)) * 100}%` }} />
                </span>
                <b>{x.v}</b>
                {i > 0 ? <em>{Math.round((x.v / funnel[i - 1]!.v) * 100)}%</em> : <em />}
              </li>
            ))}
          </ul>
          {f ? <p className="muted">Os {f.noLimite} no limite são a conversão mais próxima.</p> : null}
        </section>

        <section className="panel" aria-labelledby="desc-t">
          <h2 id="desc-t">Fins de desconto à vista</h2>
          <ul className="plain">
            {M.descontos.map((d) => (
              <li key={d.quando}>
                <b>{d.quando}</b> · {d.contas} {d.contas > 1 ? "contas sobem" : "conta sobe"} de {brl(d.de)} para {brl(d.para)}
              </li>
            ))}
          </ul>
          <p className="muted">O Brain abre um contato para você 30 dias antes de cada data. Nenhum agente oferece desconto.</p>
        </section>

        <section className="panel panel-feed" aria-labelledby="feed-t">
          <h2 id="feed-t">O que cada agente fez</h2>
          {away.length === 0 ? <p className="muted">Nada aconteceu nas últimas 8 horas. Peça algo ao Jarvis para começar.</p> : null}
          <ol className="feed">
            {away.map((a) => {
              const ag = agentById(a.agentId);
              const team = ag ? teamOf(ag) : null;
              return (
                <li key={a.id} className={`feed-${a.tone}`}>
                  <span className="feed-time">{ago(Date.now(), a.at)}</span>
                  <div>
                    <strong style={team ? { color: `var(${team.hue})` } : undefined}>{a.agentId === "voce" ? "Você" : a.agentId === "sistema" ? "Sistema" : (ag?.name ?? a.agentId)}</strong>
                    <p>{a.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="muted">{AGENTS.length} agentes monitorados.{state.mode === "demo" ? " Dados de demonstração." : ""}</p>
        </section>
      </div>
    </div>
  );
}
