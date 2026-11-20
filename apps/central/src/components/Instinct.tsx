// @ts-nocheck
// Placar da prospecção no WhatsApp: o Instinct prospecta sozinho e preenche uma planilha; o Brain só lê e mostra.
import * as React from "react";
import { api } from "../api";
import { avisos } from "./Avisos";

const pct = (v) => (v === null || v === undefined ? "—" : `${String(v).replace(".", ",")}%`);
const dia = (iso) => (iso ? iso.split("-").reverse().slice(0, 2).join("/") : "—");
const ROTULO = { abordado: "abordado", respondeu: "respondeu", reuniao: "reunião", "conta gratuita": "conta gratuita", assinante: "assinante", "sem interesse": "sem interesse" };

function Quadro({ titulo, t }) {
  return (
    <tr>
      <td>{titulo}</td><td>{t.abordados}</td><td>{t.responderam} <span className="muted">({pct(t.taxaResposta)})</span></td>
      <td>{t.reunioes} <span className="muted">({pct(t.taxaReuniao)})</span></td><td>{t.contas}</td><td>{t.assinantes}</td><td>{pct(t.taxaConversao)}</td>
    </tr>
  );
}

export function InstinctPainel() {
  const [p, setP] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [link, setLink] = React.useState("");
  const carregar = React.useCallback(() => {
    api.instinct().then((x) => { setP(x); setErro(null); }).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, []);
  React.useEffect(() => { carregar(); const t = window.setInterval(carregar, 6e4); return () => window.clearInterval(t); }, [carregar]);
  const agir = async (fn, ok) => {
    setBusy(true);
    try { const r = await fn(); avisos.push({ kind: "ok", title: r?.message ?? ok }); carregar(); }
    catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); carregar(); }
    finally { setBusy(false); }
  };
  if (erro) return <section className="panel"><p className="empty">{erro}</p></section>;
  if (!p) return null;
  const t = p.ultimos30;
  const vazio = !p.dias.length && !p.leads.length;
  return (
    <section className="panel">
      <h3>Prospecção no WhatsApp (Instinct)</h3>
      <p className="muted">
        O Instinct acha os leads, aborda e marca reunião sozinho. O Brain não escolhe a quem ele fala: só lê o placar que ele preenche na planilha e mostra o funil aqui. A leitura roda todo dia às 7h.
      </p>
      <p>
        <a href={p.planilha.url} target="_blank" rel="noreferrer">Abrir a planilha</a>
        {" · "}
        {p.ultimaLeitura ? `lida em ${new Date(p.ultimaLeitura).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}` : "ainda não lida"}{" "}
        <button className="btn" disabled={busy} onClick={() => agir(() => api.instinctSincronizar(), "Lida")}>Ler agora</button>{" "}
        <button className="btn" disabled={busy} onClick={() => agir(() => api.instinctPreparar(), "Pronta")}>Preparar abas</button>
      </p>
      {p.erro ? <p className="empty">{p.erro}</p> : null}
      {p.planilha.conta ? <p className="muted">Para o Brain ler e preparar a planilha, ela precisa estar compartilhada como editora com <code>{p.planilha.conta}</code>.</p> : null}
      {vazio && !p.erro ? <p className="muted">Ainda não há dados. Quando o Instinct preencher as abas Dia e Leads, o funil aparece aqui.</p> : null}
      {!vazio ? (
        <div>
          <h4>Últimos 30 dias</h4>
          <table>
            <thead><tr><th></th><th>Abordados</th><th>Responderam</th><th>Reuniões</th><th>Conta gratuita</th><th>Assinantes</th><th>Conversão</th></tr></thead>
            <tbody>
              <Quadro titulo="Total" t={t.total} />
              <Quadro titulo="Clínicas" t={t.clinicas} />
              <Quadro titulo="Influenciadoras" t={t.influenciadoras} />
            </tbody>
          </table>
          <p className="muted">Conversão = (conta gratuita + assinantes) ÷ abordados, como o Instinct reporta. Acumulado: {p.acumulado.abordados} abordados, {p.acumulado.reunioes} reuniões, {p.acumulado.assinantes} assinantes.</p>
          {Object.keys(p.funil).length ? <p className="muted">Leads por status: {Object.entries(p.funil).map(([k, v]) => `${ROTULO[k] ?? k} ${v}`).join(" · ")}</p> : null}
          {p.dias.length ? (
            <details>
              <summary>Por dia (últimos {p.dias.length})</summary>
              <table>
                <thead><tr><th>Dia</th><th>Tipo</th><th>Abordados</th><th>Resp.</th><th>Reuniões</th><th>Conta</th><th>Assin.</th></tr></thead>
                <tbody>{p.dias.map((d) => <tr key={d.dia + d.tipo}><td>{dia(d.dia)}</td><td>{d.tipo === "clinica" ? "clínica" : "influenciadora"}</td><td>{d.abordados}</td><td>{d.responderam}</td><td>{d.reunioes}</td><td>{d.contas}</td><td>{d.assinantes}</td></tr>)}</tbody>
              </table>
            </details>
          ) : null}
          {p.leads.length ? (
            <details>
              <summary>Leads ({p.leads.length})</summary>
              <table>
                <thead><tr><th>Nome</th><th>Tipo</th><th>Cidade</th><th>Status</th><th>Atualizado</th></tr></thead>
                <tbody>{p.leads.map((l) => <tr key={l.chave}><td>{l.nome}</td><td>{l.tipo === "clinica" ? "clínica" : "influenciadora"}</td><td>{l.cidade}</td><td>{ROTULO[l.status] ?? l.status}</td><td>{dia(l.atualizado ?? l.primeira)}</td></tr>)}</tbody>
              </table>
            </details>
          ) : null}
        </div>
      ) : null}
      <p className="muted">
        Outra planilha? Cole o link:{" "}
        <input value={link} onChange={(e) => setLink(e.target.value)} style={{ width: 260 }} placeholder="https://docs.google.com/spreadsheets/d/…" />{" "}
        <button className="btn" disabled={busy || !link} onClick={() => agir(() => api.instinctConfig(link), "Planilha trocada").then(() => setLink(""))}>Trocar</button>
      </p>
    </section>
  );
}
