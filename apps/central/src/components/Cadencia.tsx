// @ts-nocheck
// Psicólogos autônomos achados na internet, na sequência de 5 e-mails (antigo "Fluxo Comercial v3" do n8n).
import * as React from "react";
import { api } from "../api";
import { avisos } from "./Avisos";

const dia = (ms) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const quando = (l) => (l.proximo === null ? "—" : l.proximo <= Date.now() ? "no próximo ciclo (7h)" : dia(l.proximo));

export function CadenciaPainel() {
  const [p, setP] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [cidade, setCidade] = React.useState("São Paulo, SP");
  const [sel, setSel] = React.useState(() => new Set());
  const carregar = React.useCallback(() => {
    api.autonomos().then((x) => { setP(x); setErro(null); }).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, []);
  React.useEffect(() => {
    carregar();
    const t = window.setInterval(carregar, 3e4);
    return () => window.clearInterval(t);
  }, [carregar]);
  const agir = async (fn, ok) => {
    setBusy(true);
    try {
      const r = await fn();
      avisos.push({ kind: "ok", title: r?.parou ?? (r?.enviados !== undefined ? `${r.enviados} e-mail(s) enviado(s)` : r?.novos !== undefined ? `${r.novos} rascunho(s) novo(s) e ${r.followups} follow-up(s)` : r?.message ?? ok) });
      setSel(new Set());
      carregar();
    } catch (e) {
      avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." });
    } finally {
      setBusy(false);
    }
  };
  if (erro) return <section className="panel"><p className="empty">{erro}</p></section>;
  if (!p) return null;
  const etapas = p.porEtapa.map((n, i) => (i === 0 ? `sem e-mail ainda: ${n}` : i === p.porEtapa.length - 1 ? `concluídos: ${n}` : `no e-mail ${i}: ${n}`)).join(" · ");
  const alterna = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <section className="panel">
      <h3>Psicólogos autônomos: sequência de 5 e-mails</h3>
      <p className="muted">
        O Brain busca psicólogos com consultório no Google Maps, lê o site de cada um e guarda quem divulga CRP e e-mail profissional. Cada um entra na sequência de 5 e-mails (o 1º logo, depois a cada 3 dias).
        Cada e-mail vira um rascunho aqui embaixo e só sai com o seu OK, pelo remetente de prospecção e dentro do limite diário. Quem responde, pede para sair ou tem rascunho recusado sai da sequência.
      </p>
      <p>
        <strong>{p.ativo ? "Ligado" : "Desligado"}</strong>
        {" · "}
        {p.descobertos} achados · {p.qualificados} com CRP e e-mail · {p.revisar} para revisar ({p.comEmailSemCrp} com e-mail mas sem CRP no site) · {p.responderam} responderam · {p.sairam} saíram
      </p>
      <p className="muted">
        {etapas} · hoje saíram {p.emails.enviadosHoje} de {p.emails.capDia} e-mails de prospecção
      </p>
      <p>
        <button className={p.ativo ? "btn" : "btn btn-go"} disabled={busy} onClick={() => agir(() => api.autonomosAtivar(!p.ativo), p.ativo ? "Desligado" : "Ligado")}>
          {p.ativo ? "Desligar" : "Ligar"}
        </button>{" "}
        <label>
          {"Cidade "}
          <input value={cidade} onChange={(e) => setCidade(e.target.value)} style={{ width: 160 }} />
        </label>{" "}
        <button className="btn" disabled={busy} onClick={() => agir(() => api.autonomosBuscar(cidade, 20), "Busca iniciada")}>Buscar autônomos</button>{" "}
        <button className="btn" disabled={busy || !p.ativo} onClick={() => agir(() => api.autonomosGerar(), "Pronto")}>Gerar rascunhos agora</button>
      </p>
      <p className="muted">Com a rotina de prospecção ligada (em Prospecções, acima), a busca diária alterna: um dia clínicas, no outro autônomos. Os rascunhos aparecem aqui às 7h. Depois de uma busca, leia os sites em Prospecções (ou deixe a rotina fazer).</p>
      {p.pendentes.length ? (
        <div>
          <h4>Esperando o seu OK ({p.pendentes.length})</h4>
          {p.pendentes.map((d) => (
            <details key={d.id} style={{ marginBottom: 6 }}>
              <summary>
                <input type="checkbox" checked={sel.has(d.id)} onChange={() => alterna(d.id)} onClick={(e) => e.stopPropagation()} />{" "}
                e-mail {d.etapa} · {d.nome} · <span className="muted">{d.para}</span>
              </summary>
              <p><strong>{d.assunto}</strong></p>
              <pre style={{ whiteSpace: "pre-wrap" }}>{d.corpo}</pre>
            </details>
          ))}
          <p>
            <button className="btn btn-go" disabled={busy || !sel.size || sel.size > 20} onClick={() => agir(() => api.prospeccaoEmailsEnviar([...sel]), "Enviado")}>
              Aprovar e enviar {sel.size || ""}
            </button>{" "}
            <button className="btn" disabled={busy} onClick={() => setSel(new Set(p.pendentes.slice(0, 20).map((d) => d.id)))}>Marcar os primeiros 20</button>
          </p>
        </div>
      ) : null}
      {p.leads.length ? (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr><th>Psicólogo</th><th>Cidade</th><th>Situação</th><th>Próximo e-mail</th></tr>
            </thead>
            <tbody>
              {p.leads.map((l) => (
                <tr key={l.id}>
                  <td>{l.nome}<div className="muted">{l.email}</div></td>
                  <td>{l.cidade ?? "—"}</td>
                  <td>{l.situacao}</td>
                  <td>{quando(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="empty">Ainda não há autônomos qualificados. Clique em Buscar autônomos e depois leia os sites.</p>
      )}
    </section>
  );
}
