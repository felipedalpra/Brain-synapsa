// @ts-nocheck
// Anúncios e Instagram: não só os números, mas o que fazer com eles. A "leitura" de cada painel vem pronta do Brain.
import * as React from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { api } from "../api";
import { useBrain } from "../store";
import { _ } from "../lib";
import { avisos } from "./Avisos";
import { GraficoBarras } from "./charts";

const n0 = (v) => (v === null || v === undefined ? "–" : Math.round(v).toLocaleString("pt-BR"));
const n1 = (v) => (v === null || v === undefined ? "–" : v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }));
const pct = (v) => (v === null || v === undefined ? "–" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
const dm = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "–");
const NIVEL = { fazer: "Fazer", atencao: "Atenção", ok: "Ok" };

function Variacao({ v, inverso = false, mostrar = true }) {
  if (!mostrar) return null;
  if (v === null || v === undefined) return <small className="muted">sem base para comparar</small>;
  const bom = inverso ? v <= 0 : v >= 0;
  return <small className={bom ? "mid-bom" : "mid-ruim"}>{v >= 0 ? "▲" : "▼"} {Math.abs(v)}% vs 30 dias antes</small>;
}

function Leitura({ itens }) {
  if (!itens.length) return <p className="muted">Sem recomendações por enquanto.</p>;
  return (
    <ul className="mid-leitura">
      {itens.map((l, i) => (
        <li key={i} className={`mid-l-${l.nivel}`}>
          <span className="mid-badge">{NIVEL[l.nivel]}</span>
          <div>
            <strong>{l.titulo}</strong>
            {l.detalhe ? <p>{l.detalhe}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Grupo({ titulo, linhas, vazio }) {
  const max = Math.max(1, ...linhas.map((g) => g.alcance_medio));
  return (
    <div className="mid-grupo">
      <h3>{titulo}</h3>
      {linhas.length === 0 ? <p className="muted">{vazio}</p> : null}
      {linhas.map((g) => (
        <div className="mid-linha" key={g.nome}>
          <div className="mid-linha-top">
            <span title={g.nome}>{g.nome}</span>
            <b>{n0(g.alcance_medio)}</b>
          </div>
          <div className="mid-barra"><i style={{ width: `${(g.alcance_medio / max) * 100}%` }} /></div>
          <small className="muted">{g.posts} post{g.posts > 1 ? "s" : ""} · {n1(g.salvos_medio)} salvos · {n1(g.compartilhados_medio)} compart.</small>
        </div>
      ))}
    </div>
  );
}

function Premissas({ a, salvar, ocupado }) {
  const p = a.premissas;
  const [conv, setConv] = React.useState(String(Math.round(p.conversaoLeadCliente * 1000) / 10));
  const [ret, setRet] = React.useState(String(p.retencaoMeses));
  const [razao, setRazao] = React.useState(String(p.razaoLtvCac));
  const e = a.economia;
  return (
    <div className="mid-econ">
      <h3>Quanto posso pagar por lead</h3>
      {e.ticket_medio === null ? (
        <p className="muted">Sem clientes ativos para calcular o ticket médio.</p>
      ) : (
        <div className="mini-kpis">
          <div><span>Ticket médio</span><b>{_(e.ticket_medio)}</b></div>
          <div><span>Vale um cliente (LTV)</span><b>{_(e.ltv)}</b></div>
          <div><span>Custo máx. por cliente</span><b>{_(e.cac_maximo)}</b></div>
          <div><span>Custo máx. por lead</span><b>{_(e.cpl_maximo)}</b></div>
        </div>
      )}
      <form
        className="mid-form"
        onSubmit={(ev) => {
          ev.preventDefault();
          salvar({ conversaoLeadCliente: Number(conv.replace(",", ".")) / 100, retencaoMeses: Number(ret), razaoLtvCac: Number(razao.replace(",", ".")) });
        }}
      >
        <label>Leads que viram cliente (%)<input inputMode="decimal" value={conv} onChange={(x) => setConv(x.target.value)} /></label>
        <label>Meses que o cliente fica<input inputMode="numeric" value={ret} onChange={(x) => setRet(x.target.value)} /></label>
        <label>Retorno mínimo (LTV ÷ custo)<input inputMode="decimal" value={razao} onChange={(x) => setRazao(x.target.value)} /></label>
        <button type="submit" className="btn" disabled={ocupado}>Recalcular</button>
      </form>
      <p className="muted">São premissas minhas, não medidas. Troque pelos números reais quando tiver 10 ou mais clientes vindos de anúncio.</p>
    </div>
  );
}

export function Midia() {
  const { state: estado } = useBrain();
  const [d, setD] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [lendo, setLendo] = React.useState(false);
  const [alertas, setAlertas] = React.useState([]);
  const [ordem, setOrdem] = React.useState("data");

  const carregar = React.useCallback(() => api.midia().then(setD).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar.")), []);
  React.useEffect(() => { carregar(); }, [carregar]);

  const atualizar = () => {
    setLendo(true);
    setAlertas([]);
    api.refreshData()
      .then((r) => { setAlertas(r.avisos ?? []); if (r.midia) setD(r.midia); })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao atualizar."))
      .finally(() => setLendo(false));
  };
  const salvarPremissas = (b) =>
    api.midiaPremissas(b).then((r) => { setD(r); avisos.push({ kind: "ok", title: "Premissas salvas." }); }).catch(() => avisos.push({ kind: "erro", title: "Não consegui salvar as premissas." }));

  if (!estado) return <div className="page"><header className="page-head"><h1>Anúncios e Instagram</h1><p>Abra a Central com o Brain ligado para ver.</p></header></div>;
  if (!d) return <div className="page"><header className="page-head"><h1>Anúncios e Instagram</h1><p>{erro ?? "Carregando…"}</p></header></div>;

  const ig = d.instagram, ad = d.anuncios;
  const todas = [...ig.leitura.map((l) => ({ ...l, de: "Instagram" })), ...ad.leitura.map((l) => ({ ...l, de: "Anúncios" }))];
  const prioridade = { fazer: 0, atencao: 1, ok: 2 };
  const agir = todas.filter((l) => l.nivel !== "ok").sort((a, b) => prioridade[a.nivel] - prioridade[b.nivel]);
  const posts = [...ig.posts].sort((a, b) => (ordem === "data" ? (b.dia > a.dia ? 1 : -1) : ordem === "alcance" ? b.alcance - a.alcance : ordem === "salvos" ? b.salvos - a.salvos : b.interacao_pct - a.interacao_pct));
  const r = ig.resumo;

  return (
    <div className="page">
      <header className="page-head head-row">
        <div>
          <h1>Anúncios e Instagram</h1>
          <p>O que está funcionando, o que não está e o que fazer em seguida. Dados da Meta, lidos todo dia de manhã.</p>
        </div>
        <button type="button" className="btn" onClick={atualizar} disabled={lendo}>
          <RefreshCw size={15} aria-hidden className={lendo ? "spin" : ""} /> {lendo ? "Lendo a Meta…" : "Atualizar dados"}
        </button>
      </header>
      {alertas.length ? <p className="banner" role="alert">{alertas.join(" · ")}</p> : null}

      <section className="panel" aria-labelledby="m-agir">
        <h2 id="m-agir">O que fazer agora</h2>
        {agir.length ? (
          <ul className="mid-leitura">
            {agir.map((l, i) => (
              <li key={i} className={`mid-l-${l.nivel}`}>
                <span className="mid-badge">{l.de}</span>
                <div><strong>{l.titulo}</strong><p>{l.detalhe}</p></div>
              </li>
            ))}
          </ul>
        ) : <p className="muted">Nada urgente. Continue postando e volte aqui depois de atualizar os dados.</p>}
      </section>

      <section className="panel" aria-labelledby="m-ig">
        <h2 id="m-ig">Instagram @synapsa.ai</h2>
        {!r ? <Leitura itens={ig.leitura} /> : (
          <>
            <div className="mini-kpis">
              <div><span>Seguidores</span><b>{n0(ig.seguidores)}</b>{r.seguidores_novos_7d !== null ? <small className="muted">{r.seguidores_novos_7d >= 0 ? "+" : ""}{r.seguidores_novos_7d} em 7 dias (antes: {r.seguidores_novos_7d_anterior >= 0 ? "+" : ""}{r.seguidores_novos_7d_anterior})</small> : null}</div>
              <div><span>Alcance por post</span><b>{n0(r.alcance_medio)}</b><small className="muted">média de {ig.posts_analisados} posts</small></div>
              <div><span>Salvamentos por post</span><b>{n1(r.salvos_medio)}</b><small className="muted">sinal de conteúdo útil</small></div>
              <div><span>Compartilhamentos</span><b>{n1(r.compartilhados_medio)}</b><small className="muted">por post</small></div>
              <div><span>Interação</span><b>{pct(r.interacao_pct)}</b><small className="muted">do alcance</small></div>
              <div><span>Posts em 14 dias</span><b>{r.posts_14d}</b><small className="muted">meta: 6</small></div>
            </div>
            <Leitura itens={ig.leitura} />
            <div className="mid-grupos">
              <Grupo titulo="Alcance por formato" linhas={ig.por_formato} vazio="Sem posts ainda." />
              <Grupo titulo="Alcance por pilar" linhas={ig.por_tema} vazio="Só os posts publicados pelo Brain têm pilar." />
              <Grupo titulo="Alcance por dia da semana" linhas={ig.por_dia} vazio="Sem posts ainda." />
            </div>
            <div className="mid-top">
              <div>
                <h3>Os que mais alcançaram</h3>
                {ig.melhores.map((p) => <PostLinha key={p.id} p={p} />)}
              </div>
              <div>
                <h3>Os que menos alcançaram</h3>
                {ig.piores.map((p) => <PostLinha key={p.id} p={p} />)}
              </div>
            </div>
            <details className="mid-todos">
              <summary>Todos os posts ({ig.posts.length})</summary>
              <div className="subtabs" role="tablist" aria-label="Ordenar">
                {[["data", "Mais recentes"], ["alcance", "Alcance"], ["salvos", "Salvos"], ["taxa", "Interação"]].map(([k, t]) => (
                  <button key={k} type="button" className={ordem === k ? "on" : ""} onClick={() => setOrdem(k)}>{t}</button>
                ))}
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Dia</th><th>Formato</th><th>Post</th><th className="num">Alcance</th><th className="num">Salvos</th><th className="num">Compart.</th><th className="num">Interação</th></tr></thead>
                  <tbody>
                    {posts.map((p) => (
                      <tr key={p.id}>
                        <td>{dm(p.dia)}</td><td>{p.formato}</td>
                        <td>{p.link ? <a href={p.link} target="_blank" rel="noreferrer">{p.titulo || "(sem legenda)"} <ExternalLink size={12} aria-hidden /></a> : p.titulo}</td>
                        <td className="num">{n0(p.alcance)}</td><td className="num">{n0(p.salvos)}</td><td className="num">{n0(p.compartilhados)}</td><td className="num">{pct(p.interacao_pct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </section>

      <section className="panel" aria-labelledby="m-ads">
        <h2 id="m-ads">Anúncios (Meta), 30 dias</h2>
        <div className="mini-kpis">
          <div><span>Gasto</span><b>{_(ad.atual.gasto)}</b><Variacao v={ad.variacao.gasto} inverso mostrar={ad.anterior.gasto > 0} /></div>
          <div><span>Leads</span><b>{n0(ad.atual.leads)}</b><Variacao v={ad.variacao.leads} mostrar={ad.anterior.gasto > 0} /></div>
          <div><span>Custo por lead</span><b>{ad.atual.cpl === null ? "–" : _(ad.atual.cpl)}</b><Variacao v={ad.variacao.cpl} inverso mostrar={ad.anterior.gasto > 0} /></div>
          <div><span>CTR</span><b>{pct(ad.atual.ctr_pct)}</b><Variacao v={ad.variacao.ctr} mostrar={ad.anterior.gasto > 0} /></div>
          <div><span>Custo por clique</span><b>{ad.atual.cpc === null ? "–" : _(ad.atual.cpc)}</b></div>
        </div>
        <Leitura itens={ad.leitura} />
        <Premissas a={ad} salvar={salvarPremissas} ocupado={lendo} />
        {ad.campanhas.length ? (
          <>
            <h3>Campanhas</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Campanha</th><th className="num">Gasto</th><th className="num">Cliques</th><th className="num">CTR</th><th className="num">Leads</th><th className="num">Custo/lead</th><th>O que fazer</th></tr></thead>
                <tbody>
                  {ad.campanhas.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nome}</td><td className="num">{_(c.gasto)}</td><td className="num">{n0(c.cliques)}</td><td className="num">{pct(c.ctr_pct)}</td><td className="num">{n0(c.leads)}</td><td className="num">{c.cpl === null ? "–" : _(c.cpl)}</td>
                      <td><span className={`mid-v mid-v-${c.veredito}`}>{{ pausar: "Pausar", escalar: "Aumentar verba", manter: "Manter", cedo: "Cedo demais" }[c.veredito]}</span> <small className="muted">{c.motivo}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {ad.por_dia.length >= 2 ? <GraficoBarras values={ad.por_dia.map((x) => x.gasto)} labels={ad.por_dia.map((x) => dm(x.day))} money label="Gasto por dia" /> : null}
          </>
        ) : null}
      </section>
    </div>
  );
}

function PostLinha({ p }) {
  return (
    <div className="mid-post">
      <div>
        {p.link ? <a href={p.link} target="_blank" rel="noreferrer">{p.titulo || "(sem legenda)"}</a> : <span>{p.titulo}</span>}
        <small className="muted">{dm(p.dia)} · {p.formato}{p.tema ? ` · ${p.tema}` : ""}</small>
      </div>
      <div className="mid-post-n"><b>{n0(p.alcance)}</b><small className="muted">{p.salvos} salvos · {p.compartilhados} compart.</small></div>
    </div>
  );
}
