// @ts-nocheck
import * as React from "react";
import { api } from "../api";
import { avisos } from "./Avisos";
import { dd } from "./seo-charts";

const num = (x) => Math.round(x).toLocaleString("pt-BR");
const delta = (a, b) => (!b ? (a ? "novo" : "") : `${a >= b ? "+" : ""}${Math.round(((a - b) / b) * 100)}%`);

/** Presença digital de cada psicólogo do diretório. Cada um tem um link secreto com o relatório dele, para você mandar por WhatsApp. */
export function Psicologos() {
  const [d, setD] = React.useState<any>(null);
  const [busca, setBusca] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const carregar = React.useCallback(() => { api.psicologos().then(setD).catch(() => setD({ perfis: [], links: {} })); }, []);
  React.useEffect(() => { carregar(); }, [carregar]);
  const url = (token) => `${location.origin}/d/${token}`;
  const copiar = async (texto, ok) => {
    try { await navigator.clipboard.writeText(texto); avisos.push({ kind: "ok", title: ok }); } catch { avisos.push({ kind: "erro", title: "Não consegui copiar. Selecione o link e copie à mão." }); }
  };
  const gerar = async (p, copiarDepois) => {
    setBusy(p.slug);
    try {
      const r = await api.psicologoLink(p.slug);
      carregar();
      if (copiarDepois) await copiar(`Olá, ${p.nome.split(" ")[0]}! Aqui está o relatório da sua presença digital no diretório da Synapsa (visitas ao seu perfil e aparições no Google nos últimos 28 dias): ${url(r.token)}`, "Mensagem copiada, é só colar no WhatsApp.");
    } catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); }
    finally { setBusy(""); }
  };
  const revogar = async (p) => {
    setBusy(p.slug);
    try { await api.psicologoLink(p.slug, true); carregar(); avisos.push({ kind: "ok", title: "Link desativado." }); } catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); }
    finally { setBusy(""); }
  };
  if (!d) return <p className="empty">Carregando…</p>;
  const lista = d.perfis.filter((p) => !busca || p.nome.toLowerCase().includes(busca.toLowerCase()));
  return (
    <div className="stack">
      <section className="panel">
        <div className="seo-head">
          <h2>Psicólogos do diretório</h2>
          <input type="search" className="seo-busca" aria-label="Buscar psicólogo" placeholder="Buscar psicólogo" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <p className="muted">
          Últimos 28 dias contra os 28 anteriores{d.ultimoDiaGoogle ? `; Google até ${dd(d.ultimoDiaGoogle)}` : ""}{d.ultimoDiaGa ? `, visitas até ${dd(d.ultimoDiaGa)}` : ""}. "Gerar relatório" cria um link secreto só desse psicólogo e copia a mensagem pronta para o WhatsApp. As visitas contam só quem aceita cookies: é um piso.
        </p>
        {!d.perfis.length ? <p className="empty">Nenhum perfil com dado ainda. Sincronize o Google Analytics e o Search Console.</p> : (
          <div className="seo-scroll">
            <table className="seo-tab">
              <thead><tr><th>Psicólogo</th><th>Visitas</th><th>Apareceu no Google</th><th>Cliques</th><th>Posição</th><th>Relatório</th></tr></thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.slug}>
                    <td>{p.nome}</td>
                    <td>{num(p.visitas)} <span className="muted">{delta(p.visitas, p.visitasAntes)}</span></td>
                    <td>{num(p.impressoes)} <span className="muted">{delta(p.impressoes, p.impressoesAntes)}</span></td>
                    <td>{num(p.cliques)}</td>
                    <td>{p.posicao ? (Math.round(p.posicao * 10) / 10).toLocaleString("pt-BR") : "—"}</td>
                    <td>
                      {d.links[p.slug] ? (
                        <>
                          <a className="btn" href={url(d.links[p.slug])} target="_blank" rel="noreferrer">Abrir</a>{" "}
                          <button type="button" className="btn" disabled={busy === p.slug} onClick={() => copiar(`Olá, ${p.nome.split(" ")[0]}! Aqui está o relatório da sua presença digital no diretório da Synapsa (visitas ao seu perfil e aparições no Google nos últimos 28 dias): ${url(d.links[p.slug])}`, "Mensagem copiada, é só colar no WhatsApp.")}>Copiar mensagem</button>{" "}
                          <button type="button" className="btn" disabled={busy === p.slug} onClick={() => revogar(p)}>Desativar</button>
                        </>
                      ) : <button type="button" className="btn" disabled={busy === p.slug} onClick={() => gerar(p, true)}>{busy === p.slug ? "Gerando…" : "Gerar relatório"}</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
