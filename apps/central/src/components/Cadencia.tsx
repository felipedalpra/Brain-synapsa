// @ts-nocheck
// Cadência de e-mail de quem se cadastrou no app (antigo "Fluxo Comercial v3" do n8n).
import * as React from "react";
import { api } from "../api";
import { avisos } from "./Avisos";

const dia = (ms) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

function quando(l) {
  if (l.proximo === null) return "—";
  return l.proximo <= Date.now() ? "no próximo ciclo (7h)" : dia(l.proximo);
}

export function CadenciaPainel() {
  const [p, setP] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const carregar = React.useCallback(() => {
    api.cadencia().then((x) => { setP(x); setErro(null); }).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, []);
  React.useEffect(() => {
    carregar();
    const t = window.setInterval(carregar, 6e4);
    return () => window.clearInterval(t);
  }, [carregar]);
  const agir = async (fn, ok) => {
    setBusy(true);
    try {
      const r = await fn();
      avisos.push({ kind: "ok", title: r?.rascunhos !== undefined ? `${r.rascunhos} rascunho(s) novo(s) em Aprovações` : ok });
      carregar();
    } catch (e) {
      avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." });
    } finally {
      setBusy(false);
    }
  };
  if (erro) return <section className="panel"><p className="empty">{erro}</p></section>;
  if (!p) return null;
  const etapas = p.porEtapa.map((n, i) => (i === 0 ? `aguardando 1º: ${n}` : i === p.porEtapa.length - 1 ? `concluídos: ${n}` : `no e-mail ${i}: ${n}`)).join(" · ");
  return (
    <section className="panel">
      <h3>Cadência de e-mail do cadastro</h3>
      <p className="muted">
        Cinco e-mails para quem se cadastrou no app e ainda não paga (1º logo, depois a cada 3 dias). Cada e-mail vira um rascunho em Aprovações e só sai com o seu OK.
        Quem assina o Essencial, pede para sair ou tem rascunho recusado fica de fora.
      </p>
      <p>
        <strong>{p.ativo ? "Ligada" : "Desligada"}</strong>
        {" · "}
        {p.total} pessoa(s) · {etapas} · fora da cadência: {p.excluidos}
      </p>
      <p>
        <button className={p.ativo ? "btn" : "btn btn-go"} disabled={busy} onClick={() => agir(() => api.cadenciaAtivar(!p.ativo), p.ativo ? "Cadência desligada" : "Cadência ligada")}>
          {p.ativo ? "Desligar" : "Ligar a cadência"}
        </button>{" "}
        <button className="btn" disabled={busy || !p.ativo} onClick={() => agir(() => api.cadenciaGerar(), "Pronto")}>
          Gerar rascunhos agora
        </button>
        {p.ativo ? null : <span className="muted"> Ligue só depois de desligar o fluxo equivalente no n8n, senão a pessoa recebe duas vezes.</span>}
      </p>
      {p.leads.length ? (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr><th>Pessoa</th><th>Plano</th><th>Situação</th><th>Próximo e-mail</th><th /></tr>
            </thead>
            <tbody>
              {p.leads.map((l) => (
                <tr key={l.email}>
                  <td>{l.nome || l.email}<div className="muted">{l.email}</div></td>
                  <td>{l.plano ?? "—"}</td>
                  <td>{l.situacao}</td>
                  <td>{quando(l)}</td>
                  <td>
                    {l.proximo !== null ? (
                      <button className="btn" disabled={busy} onClick={() => agir(() => api.cadenciaPausar(l.email, true), "Pausada")}>Pausar</button>
                    ) : l.situacao === "pausada por você" ? (
                      <button className="btn" disabled={busy} onClick={() => agir(() => api.cadenciaPausar(l.email, false), "Retomada")}>Retomar</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">Ninguém na cadência ainda.</p>
      )}
    </section>
  );
}
