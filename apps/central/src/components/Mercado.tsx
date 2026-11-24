// @ts-nocheck
import * as React from "react";
import { api } from "../api";
import { avisos } from "./Avisos";

const data = (t: number | null) => (t ? new Date(t).toLocaleDateString("pt-BR") : "nunca");

/** Radar do mercado: o que as pessoas digitam no Google sobre o que a Synapsa resolve, e o que já cresce no seu próprio site. */
export function Mercado() {
  const [d, setD] = React.useState<any>(null);
  const [busy, setBusy] = React.useState(false);
  const carregar = React.useCallback(() => { api.mercado().then(setD).catch(() => setD(null)); }, []);
  React.useEffect(() => { carregar(); }, [carregar]);
  const atualizar = async () => {
    setBusy(true);
    try {
      const r = await api.mercadoSincronizar();
      avisos.push({ kind: r.message.startsWith("Radar") ? "ok" : "erro", title: r.message });
      carregar();
    } catch (e) {
      avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." });
    } finally {
      setBusy(false);
    }
  };
  if (!d) return <p className="empty">Carregando…</p>;
  return (
    <div className="stack">
      <section className="panel">
        <div className="seo-head">
          <h2>O que o mercado procura</h2>
          <button type="button" className="btn" disabled={busy} onClick={atualizar}>{busy ? "Consultando o Google…" : "Atualizar agora"}</button>
        </div>
        <p className="muted">
          Sugestões do Google (as buscas que as pessoas realmente digitam) para os termos do seu mercado. Atualiza sozinho toda semana; última vez: {data(d.ultima)}.
          O Google não informa o volume de cada busca: a ordem é a da lista dele, e "nova" marca o que não existia na semana anterior.
        </p>
        {d.erro ? <p className="empty">{d.erro}</p> : null}
      </section>
      {d.subindo.length ? (
        <section className="panel">
          <h2>Subindo no seu site</h2>
          <p className="muted">Buscas que já trazem gente do Google e cresceram nas impressões contra os 28 dias anteriores.</p>
          <table className="tbl">
            <thead><tr><th>Busca</th><th>Site</th><th>Impressões</th><th>Antes</th><th>Posição</th><th>Cliques</th></tr></thead>
            <tbody>{d.subindo.map((s, i) => <tr key={i}><td>{s.texto}</td><td>{s.site}</td><td>{s.impressoes}</td><td>{s.antes}</td><td>{s.posicao}</td><td>{s.cliques}</td></tr>)}</tbody>
          </table>
        </section>
      ) : null}
      {d.novas.length ? (
        <section className="panel">
          <h2>Buscas novas esta semana</h2>
          <p>{d.novas.map((n, i) => <span key={i} className="chip" title={n.semente}>{n.texto}</span>)}</p>
        </section>
      ) : null}
      {d.grupos.length ? d.grupos.map((g) => (
        <section className="panel" key={g.semente}>
          <h2>{g.semente}</h2>
          <p>{g.itens.map((x, i) => <span key={i} className={`chip${x.nova ? " on" : ""}`}>{x.texto}{x.nova ? " · nova" : ""}</span>)}</p>
        </section>
      )) : <p className="empty">Ainda não há leitura do Google. Clique em "Atualizar agora".</p>}
    </div>
  );
}
