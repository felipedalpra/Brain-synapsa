// @ts-nocheck
// Painel de SEO: dados do Google Search Console (synapsa.com.br e diretório de psicólogos).
import * as React from "react";
import { api } from "../api";
import { useBrain } from "../store";
import { avisos } from "./Avisos";
import { GraficoLinhas, fmtInt } from "./charts";

const pct = (x) => `${(x * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
const dec = (x) => x.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const variacao = (atual, antes) => (antes > 0 ? `${atual >= antes ? "+" : ""}${Math.round(((atual - antes) / antes) * 100)}%` : "novo");
const curto = (u) => u.replace(/^https?:\/\/(www\.)?/, "");
const dd = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function Tabela({ titulo, linhas, rotulo }) {
  return (
    <div>
      <h3>{titulo}</h3>
      {linhas.length === 0 ? (
        <p className="empty">Sem dados ainda.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>{rotulo}</th>
                <th>Cliques</th>
                <th>Impressões</th>
                <th>CTR</th>
                <th>Posição</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.chave}>
                  <td style={{ wordBreak: "break-word" }}>{rotulo === "Página" ? curto(l.chave) : l.chave}</td>
                  <td>{fmtInt(l.clicks)}</td>
                  <td>{fmtInt(l.impressions)}</td>
                  <td>{pct(l.ctr)}</td>
                  <td>{dec(l.position)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function Seo() {
  const { live } = useBrain();
  const [dados, setDados] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const carregar = React.useCallback(() => {
    if (!live) return;
    api.seo().then((d) => { setDados(d); setErro(null); }).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, [live]);
  React.useEffect(() => { carregar(); }, [carregar]);
  const sincronizar = async () => {
    setBusy(true);
    try {
      const r = await api.seoSincronizar();
      avisos.push({ kind: r.message.includes("problema") ? "erro" : "ok", title: r.message });
      carregar();
    } catch (e) {
      avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." });
    } finally {
      setBusy(false);
    }
  };
  if (!live) return <p className="empty">O SEO aparece quando o Brain está conectado.</p>;
  if (erro) return <p className="empty">{erro}</p>;
  if (!dados) return <p className="empty">Carregando…</p>;
  if (!dados.configurado)
    return (
      <section className="panel">
        <h2>Falta ligar o Search Console</h2>
        <p className="muted">
          Crie a conta de serviço no Google Cloud, adicione o e-mail dela como usuário (leitura) nas duas propriedades
          do Search Console e guarde a chave JSON no segredo GSC_SERVICE_ACCOUNT do Brain. O Brain só lê; não altera nada.
        </p>
      </section>
    );
  return (
    <div className="stack">
      <section className="panel">
        <h2>Search Console</h2>
        <p className="muted">
          Últimos 28 dias contra os 28 anteriores. O Google fecha os números com cerca de 2 dias de atraso.
          {dados.ultimaSync ? ` Última sincronização: ${dd(dados.ultimaSync)}.` : ""}
        </p>
        {dados.ultimoErro ? <p className="empty">{dados.ultimoErro}</p> : null}
        {dados.clinicas ? (
          <p>
            <strong>synapsa.com.br/clinicas</strong> (a página dos e-mails de prospecção): {fmtInt(dados.clinicas.clicks)} cliques
            e {fmtInt(dados.clinicas.impressions)} impressões em 28 dias.
          </p>
        ) : null}
        <button type="button" className="btn" disabled={busy} onClick={sincronizar}>
          {busy ? "Sincronizando…" : "Sincronizar agora"}
        </button>
      </section>
      {dados.sites.map((s) => (
        <section className="panel" key={s.id}>
          <h2>{s.rotulo}</h2>
          {s.serie.length === 0 ? (
            <p className="empty">Sem dados ainda. Clique em "Sincronizar agora".</p>
          ) : (
            <>
              <p>
                <strong>{fmtInt(s.atual.clicks)}</strong> cliques ({variacao(s.atual.clicks, s.anterior.clicks)}) ·{" "}
                <strong>{fmtInt(s.atual.impressions)}</strong> impressões ({variacao(s.atual.impressions, s.anterior.impressions)}) · CTR{" "}
                {pct(s.atual.ctr)} · posição média {dec(s.atual.position)}
              </p>
              <GraficoLinhas
                label={`Cliques e impressões por dia, de ${dd(s.serie[0].dia)} a ${dd(s.serie[s.serie.length - 1].dia)}`}
                labels={s.serie.map((x) => dd(x.dia))}
                series={[
                  { name: "Cliques", color: "var(--core-2)", values: s.serie.map((x) => x.clicks) },
                  { name: "Impressões", color: "var(--core-1)", values: s.serie.map((x) => x.impressions) },
                ]}
              />
              {s.oportunidades.length ? (
                <Tabela titulo="Oportunidades: muita impressão, pouco clique, posição que dá para subir" linhas={s.oportunidades} rotulo="Busca" />
              ) : null}
              <Tabela titulo="Buscas que mais trazem gente" linhas={s.queries} rotulo="Busca" />
              <Tabela titulo="Páginas mais vistas no Google" linhas={s.paginas} rotulo="Página" />
            </>
          )}
        </section>
      ))}
    </div>
  );
}
