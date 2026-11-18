// @ts-nocheck
// Anúncios e Instagram: tudo que a Meta entrega num só lugar, por período, com a leitura do que fazer em cada parte.
import * as React from "react";
import { RefreshCw, ExternalLink } from "lucide-react";
import { api } from "../api";
import { useBrain } from "../store";
import { _ } from "../lib";
import { avisos } from "./Avisos";
import { GraficoBarras, GraficoLinhas } from "./charts";

const n0 = (v) => (v === null || v === undefined ? "–" : Math.round(v).toLocaleString("pt-BR"));
const n1 = (v) => (v === null || v === undefined ? "–" : v.toLocaleString("pt-BR", { maximumFractionDigits: 1 }));
const pct = (v) => (v === null || v === undefined ? "–" : `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`);
const brl = (v) => (v === null || v === undefined ? "–" : _(v));
const dm = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : "–");
const dmy = (d) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}` : "–");
const NIVEL = { fazer: "Fazer", atencao: "Atenção", ok: "Ok" };
const CORES = ["var(--core-2)", "var(--ok)", "var(--warn)", "var(--violet)"];

const hojeBrt = () => new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 10);
const soma = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
const PRESETS = [
  { id: "7", rotulo: "7 dias" },
  { id: "14", rotulo: "14 dias" },
  { id: "30", rotulo: "30 dias" },
  { id: "90", rotulo: "90 dias" },
  { id: "mes", rotulo: "Este mês" },
  { id: "mesant", rotulo: "Mês passado" },
  { id: "365", rotulo: "12 meses" },
  { id: "custom", rotulo: "Escolher datas" },
];
function intervalo(preset, custom) {
  const hoje = hojeBrt();
  if (preset === "mes") return { de: `${hoje.slice(0, 8)}01`, ate: hoje };
  if (preset === "mesant") {
    const ini = soma(`${hoje.slice(0, 8)}01`, -1);
    return { de: `${ini.slice(0, 8)}01`, ate: ini };
  }
  if (preset === "custom") return custom;
  return { de: soma(hoje, -(Number(preset) - 1)), ate: hoje };
}

function Delta({ atual, ant, inverso = false }) {
  if (atual === null || atual === undefined || ant === null || ant === undefined || ant === 0) return null;
  const v = Math.round(((atual - ant) / Math.abs(ant)) * 1000) / 10;
  const bom = inverso ? v <= 0 : v >= 0;
  return <small className={bom ? "mid-bom" : "mid-ruim"}>{v >= 0 ? "▲" : "▼"} {Math.abs(v)}% vs período anterior</small>;
}
const Kpi = ({ titulo, valor, extra, children }) => (
  <div><span>{titulo}</span><b>{valor}</b>{extra ? <small className="muted">{extra}</small> : null}{children}</div>
);

function Leitura({ itens, vazio = "Sem recomendações por enquanto." }) {
  if (!itens.length) return <p className="muted">{vazio}</p>;
  return (
    <ul className="mid-leitura">
      {itens.map((l, i) => (
        <li key={i} className={`mid-l-${l.nivel}`}>
          <span className="mid-badge">{l.de ?? NIVEL[l.nivel]}</span>
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
          <div className="mid-linha-top"><span title={g.nome}>{g.nome}</span><b>{n0(g.alcance_medio)}</b></div>
          <div className="mid-barra"><i style={{ width: `${(g.alcance_medio / max) * 100}%` }} /></div>
          <small className="muted">{g.posts} post{g.posts > 1 ? "s" : ""} · {n1(g.salvos_medio)} salvos · {n1(g.compartilhados_medio)} compart.</small>
        </div>
      ))}
    </div>
  );
}

function PostLinha({ p }) {
  return (
    <div className="mid-post">
      <div>
        {p.link ? <a href={p.link} target="_blank" rel="noreferrer">{p.titulo || "(sem legenda)"}</a> : <span>{p.titulo}</span>}
        <small className="muted">{dm(p.dia)} · {p.formato}{p.pilar ? ` · ${p.pilar}` : ""}</small>
      </div>
      <div className="mid-post-n"><b>{n0(p.alcance)}</b><small className="muted">{p.salvos} salvos · {p.compartilhados} compart.</small></div>
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
          <Kpi titulo="Ticket médio" valor={brl(e.ticket_medio)} />
          <Kpi titulo="Vale um cliente (LTV)" valor={brl(e.ltv)} />
          <Kpi titulo="Custo máx. por cliente" valor={brl(e.cac_maximo)} />
          <Kpi titulo="Custo máx. por lead" valor={brl(e.cpl_maximo)} />
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

const ROT_VEREDITO = { pausar: "Pausar", escalar: "Aumentar verba", manter: "Manter", cedo: "Cedo demais" };
const Veredito = ({ v }) => <span className={`mid-v mid-v-${v}`}>{ROT_VEREDITO[v]}</span>;

/* ---------------- abas ---------------- */

function Resumo({ d, ir }) {
  const ig = d.instagram.periodo, ad = d.anuncios, px = d.pixel;
  const pv = px.eventos.find((e) => e.evento === "PageView"), ld = px.eventos.find((e) => e.evento === "Lead");
  const todas = [
    ...d.instagram.leitura.map((l) => ({ ...l, de: "Instagram" })),
    ...d.anuncios.leitura.map((l) => ({ ...l, de: "Anúncios" })),
    ...d.criativos.leitura.map((l) => ({ ...l, de: "Criativos" })),
    ...d.pixel.leitura.map((l) => ({ ...l, de: "Pixel" })),
    ...d.publicos.leitura.map((l) => ({ ...l, de: "Públicos" })),
  ];
  const prioridade = { fazer: 0, atencao: 1, ok: 2 };
  const agir = todas.filter((l) => l.nivel !== "ok").sort((a, b) => prioridade[a.nivel] - prioridade[b.nivel]);
  const diag = d.diagnostico;
  const falhas = diag ? diag.itens.filter((i) => !i.ok) : [];
  return (
    <>
      <section className="panel">
        <h2>O que fazer agora</h2>
        {agir.length ? <Leitura itens={agir} /> : <p className="muted">Nada urgente neste período. Continue postando e volte depois de atualizar os dados.</p>}
      </section>
      <section className="panel">
        <h2>Visão geral do período</h2>
        <div className="mini-kpis">
          <Kpi titulo="Seguidores novos" valor={ig.seguidores_novos === null ? "–" : `${ig.seguidores_novos >= 0 ? "+" : ""}${ig.seguidores_novos}`} extra={ig.seguidores_fim ? `${n0(ig.seguidores_fim)} no total` : null}><Delta atual={ig.seguidores_novos} ant={ig.seguidores_novos_anterior} /></Kpi>
          <Kpi titulo="Alcance diário médio" valor={n0(ig.alcance_diario_medio)} extra="pessoas por dia no Instagram" />
          <Kpi titulo="Visitas ao perfil" valor={n0(ig.visitas_perfil)}><Delta atual={ig.visitas_perfil} ant={ig.visitas_perfil_anterior} /></Kpi>
          <Kpi titulo="Toques no link da bio" valor={n0(ig.toques_link)}><Delta atual={ig.toques_link} ant={ig.toques_link_anterior} /></Kpi>
          <Kpi titulo="Posts publicados" valor={ig.posts} extra={ig.alcance_post_medio ? `${n0(ig.alcance_post_medio)} de alcance por post` : null} />
          <Kpi titulo="Gasto em anúncios" valor={brl(ad.atual.gasto)}><Delta atual={ad.atual.gasto} ant={ad.anterior.gasto} inverso /></Kpi>
          <Kpi titulo="Leads dos anúncios" valor={n0(ad.atual.leads)}><Delta atual={ad.atual.leads} ant={ad.anterior.leads} /></Kpi>
          <Kpi titulo="Visitas no site (pixel)" valor={n0(pv?.total ?? null)}>{pv ? <Delta atual={pv.total} ant={pv.anterior} /> : null}</Kpi>
          <Kpi titulo="Leads no site (pixel)" valor={n0(ld?.total ?? null)}>{ld ? <Delta atual={ld.total} ant={ld.anterior} /> : null}</Kpi>
        </div>
        {ig.toques_link !== null && pv ? <p className="muted">Toques no link da bio ({n0(ig.toques_link)}) e visitas no site ({n0(pv.total)}) são medidos em lugares diferentes e não se encaixam 1 a 1: parte das visitas vem de anúncio, busca e acesso direto. Para saber quanto do Instagram vira visita, coloque um parâmetro (utm_source=instagram) no link da bio.</p> : null}
      </section>
      <section className="panel">
        <h2>Coleta de dados</h2>
        {!diag ? <p className="muted">Ainda não li a Meta. Toque em “Atualizar dados”.</p> : (
          <>
            <p className="muted">Última leitura: {new Date(diag.at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })}.{falhas.length ? ` ${falhas.length} parte(s) com problema:` : " Tudo foi lido."}</p>
            <ul className="mid-diag">
              {diag.itens.map((i) => (
                <li key={i.parte} className={i.ok ? "ok" : "erro"}>
                  <span>{i.ok ? "✓" : "✕"}</span>
                  <div><strong>{i.parte}</strong>{i.ok ? <small className="muted"> {i.linhas ?? 0} registros</small> : <p>{i.erro}</p>}</div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}

function AbaInstagram({ d }) {
  const ig = d.instagram, p = ig.periodo;
  const [ordem, setOrdem] = React.useState("data");
  const noPeriodo = ig.posts.filter((x) => x.dia >= d.periodo.de && x.dia <= d.periodo.ate);
  const posts = [...noPeriodo].sort((a, b) => (ordem === "data" ? (b.dia > a.dia ? 1 : -1) : ordem === "alcance" ? b.alcance - a.alcance : ordem === "salvos" ? b.salvos - a.salvos : b.interacao_pct - a.interacao_pct));
  const z = (v) => v ?? 0;
  return (
    <>
      <section className="panel">
        <h2>Instagram @synapsa.ai</h2>
        <div className="mini-kpis">
          <Kpi titulo="Seguidores" valor={n0(ig.seguidores)} extra={p.seguidores_novos !== null ? `${p.seguidores_novos >= 0 ? "+" : ""}${p.seguidores_novos} no período` : null}><Delta atual={p.seguidores_novos} ant={p.seguidores_novos_anterior} /></Kpi>
          <Kpi titulo="Alcance diário médio" valor={n0(p.alcance_diario_medio)} />
          <Kpi titulo="Visitas ao perfil" valor={n0(p.visitas_perfil)}><Delta atual={p.visitas_perfil} ant={p.visitas_perfil_anterior} /></Kpi>
          <Kpi titulo="Toques no link da bio" valor={n0(p.toques_link)}><Delta atual={p.toques_link} ant={p.toques_link_anterior} /></Kpi>
          <Kpi titulo="Posts no período" valor={p.posts} extra={p.alcance_post_medio !== null ? `${n0(p.alcance_post_medio)} de alcance por post` : "nenhum post publicado"} />
          <Kpi titulo="Salvos e compartilhados" valor={`${p.salvos} · ${p.compartilhamentos}`} extra="soma dos posts do período" />
          <Kpi titulo="Interação" valor={pct(p.interacao_pct)} extra="do alcance, por post" />
        </div>
        <Leitura itens={ig.leitura} />
        {ig.serie.length >= 2 ? (
          <div className="mid-graficos">
            <div><h3>Alcance por dia</h3><GraficoLinhas label="Alcance por dia" labels={ig.serie.map((x) => dm(x.day))} series={[{ name: "Alcance", color: "var(--core-2)", values: ig.serie.map((x) => z(x.alcance)) }]} /></div>
            <div><h3>Visitas ao perfil e toques no link</h3><GraficoLinhas label="Visitas e toques" labels={ig.serie.map((x) => dm(x.day))} series={[{ name: "Visitas", color: "var(--ok)", values: ig.serie.map((x) => z(x.visitas)) }, { name: "Toques", color: "var(--warn)", values: ig.serie.map((x) => z(x.toques)) }]} /></div>
            {ig.seguidores_serie.length >= 2 ? <div><h3>Seguidores</h3><GraficoLinhas label="Seguidores" labels={ig.seguidores_serie.map((x) => dm(x.day))} series={[{ name: "Seguidores", color: "var(--violet)", values: ig.seguidores_serie.map((x) => x.seguidores) }]} /></div> : null}
            {ig.serie.some((x) => x.novos !== null) ? <div><h3>Seguidores novos por dia</h3><GraficoBarras label="Seguidores novos" labels={ig.serie.map((x) => dm(x.day))} values={ig.serie.map((x) => Math.max(0, z(x.novos)))} color="var(--ok)" /></div> : null}
          </div>
        ) : <p className="muted">O dia a dia do Instagram começa a ser guardado agora: em poucos dias aparecem os gráficos de alcance, visitas e seguidores.</p>}
      </section>
      <section className="panel">
        <h2>O que funciona</h2>
        <div className="mid-grupos">
          <Grupo titulo="Alcance por formato" linhas={ig.por_formato} vazio="Sem posts ainda." />
          <Grupo titulo="Alcance por pilar" linhas={ig.por_tema} vazio="Só os posts publicados pelo Brain têm pilar." />
          <Grupo titulo="Alcance por dia da semana" linhas={ig.por_dia} vazio="Sem posts ainda." />
        </div>
        <div className="mid-top">
          <div><h3>Os que mais alcançaram</h3>{ig.melhores.map((x) => <PostLinha key={x.id} p={x} />)}</div>
          <div><h3>Os que menos alcançaram</h3>{ig.piores.map((x) => <PostLinha key={x.id} p={x} />)}</div>
        </div>
      </section>
      <section className="panel">
        <h2>Posts do período ({noPeriodo.length})</h2>
        {noPeriodo.length === 0 ? <p className="muted">Nenhum post publicado neste período.</p> : (
          <>
            <div className="subtabs" role="tablist" aria-label="Ordenar">
              {[["data", "Mais recentes"], ["alcance", "Alcance"], ["salvos", "Salvos"], ["taxa", "Interação"]].map(([k, t]) => (
                <button key={k} type="button" className={ordem === k ? "on" : ""} onClick={() => setOrdem(k)}>{t}</button>
              ))}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Dia</th><th>Formato</th><th>Post</th><th className="num">Alcance</th><th className="num">Curtidas</th><th className="num">Coment.</th><th className="num">Salvos</th><th className="num">Compart.</th><th className="num">Interação</th></tr></thead>
                <tbody>
                  {posts.map((x) => (
                    <tr key={x.id}>
                      <td>{dm(x.dia)}</td><td>{x.formato}</td>
                      <td>{x.link ? <a href={x.link} target="_blank" rel="noreferrer">{x.titulo || "(sem legenda)"} <ExternalLink size={12} aria-hidden /></a> : x.titulo}</td>
                      <td className="num">{n0(x.alcance)}</td><td className="num">{n0(x.curtidas)}</td><td className="num">{n0(x.comentarios)}</td><td className="num">{n0(x.salvos)}</td><td className="num">{n0(x.compartilhados)}</td><td className="num">{pct(x.interacao_pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}

function AbaAnuncios({ d, salvar, ocupado }) {
  const ad = d.anuncios;
  return (
    <>
      <section className="panel">
        <h2>Anúncios (Meta)</h2>
        <div className="mini-kpis">
          <Kpi titulo="Gasto" valor={brl(ad.atual.gasto)}><Delta atual={ad.atual.gasto} ant={ad.anterior.gasto} inverso /></Kpi>
          <Kpi titulo="Leads" valor={n0(ad.atual.leads)}><Delta atual={ad.atual.leads} ant={ad.anterior.leads} /></Kpi>
          <Kpi titulo="Custo por lead" valor={brl(ad.atual.cpl)}><Delta atual={ad.atual.cpl} ant={ad.anterior.cpl} inverso /></Kpi>
          <Kpi titulo="CTR" valor={pct(ad.atual.ctr_pct)}><Delta atual={ad.atual.ctr_pct} ant={ad.anterior.ctr_pct} /></Kpi>
          <Kpi titulo="Custo por clique" valor={brl(ad.atual.cpc)}><Delta atual={ad.atual.cpc} ant={ad.anterior.cpc} inverso /></Kpi>
          <Kpi titulo="Custo por mil impressões" valor={brl(ad.atual.cpm)}><Delta atual={ad.atual.cpm} ant={ad.anterior.cpm} inverso /></Kpi>
          <Kpi titulo="Impressões" valor={n0(ad.atual.impressoes)}><Delta atual={ad.atual.impressoes} ant={ad.anterior.impressoes} /></Kpi>
          <Kpi titulo="Cliques" valor={n0(ad.atual.cliques)}><Delta atual={ad.atual.cliques} ant={ad.anterior.cliques} /></Kpi>
        </div>
        <Leitura itens={ad.leitura} />
        {ad.por_dia.length >= 2 && ad.atual.gasto > 0 ? (
          <div className="mid-graficos">
            <div><h3>Gasto por dia</h3><GraficoBarras label="Gasto por dia" labels={ad.por_dia.map((x) => dm(x.day))} values={ad.por_dia.map((x) => x.gasto)} money /></div>
            <div><h3>Cliques e leads por dia</h3><GraficoLinhas label="Cliques e leads" labels={ad.por_dia.map((x) => dm(x.day))} series={[{ name: "Cliques", color: "var(--core-2)", values: ad.por_dia.map((x) => x.cliques) }, { name: "Leads", color: "var(--ok)", values: ad.por_dia.map((x) => x.leads) }]} /></div>
          </div>
        ) : null}
        {ad.campanhas.length ? (
          <>
            <h3 style={{ marginTop: 20 }}>Campanhas</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Campanha</th><th className="num">Gasto</th><th className="num">Impr.</th><th className="num">Cliques</th><th className="num">CTR</th><th className="num">CPC</th><th className="num">Leads</th><th className="num">Custo/lead</th><th>O que fazer</th></tr></thead>
                <tbody>
                  {ad.campanhas.map((c) => (
                    <tr key={c.id}>
                      <td>{c.nome}</td><td className="num">{brl(c.gasto)}</td><td className="num">{n0(c.impressoes)}</td><td className="num">{n0(c.cliques)}</td><td className="num">{pct(c.ctr_pct)}</td><td className="num">{brl(c.cpc)}</td><td className="num">{n0(c.leads)}</td><td className="num">{brl(c.cpl)}</td>
                      <td><Veredito v={c.veredito} /> <small className="muted">{c.motivo}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : <p className="muted" style={{ marginTop: 16 }}>Nenhuma campanha com gasto neste período.</p>}
      </section>
      <section className="panel"><Premissas a={ad} salvar={salvar} ocupado={ocupado} /></section>
    </>
  );
}

function Criativo({ c }) {
  const [semFoto, setSemFoto] = React.useState(false);
  const foto = c.imagem || c.miniatura;
  return (
    <article className="mid-cri">
      <div className="mid-cri-foto">
        {foto && !semFoto ? <img src={foto} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setSemFoto(true)} /> : <span className="muted">sem imagem</span>}
      </div>
      <div className="mid-cri-corpo">
        <div className="mid-cri-tags">
          <Veredito v={c.veredito} />
          {c.cansado ? <span className="mid-v mid-v-pausar">Cansando</span> : null}
          {c.status ? <span className="seo-tag">{c.status === "ACTIVE" ? "Ativo" : c.status === "PAUSED" ? "Pausado" : c.status.toLowerCase()}</span> : null}
        </div>
        <h3 title={c.nome}>{c.nome}</h3>
        <small className="muted">{c.campanha}{c.conjunto ? ` · ${c.conjunto}` : ""}</small>
        {c.titulo ? <p className="mid-cri-titulo">{c.titulo}</p> : null}
        {c.texto ? <p className="mid-cri-texto">{c.texto}</p> : null}
        <div className="mid-cri-n">
          <div><span>Gasto</span><b>{brl(c.gasto)}</b></div>
          <div><span>Leads</span><b>{n0(c.leads)}</b></div>
          <div><span>Custo/lead</span><b>{brl(c.cpl)}</b></div>
          <div><span>CTR</span><b>{pct(c.ctr_pct)}</b></div>
          <div><span>CPC</span><b>{brl(c.cpc)}</b></div>
          <div><span>Frequência</span><b>{n1(c.frequencia)}</b></div>
          <div><span>Alcance</span><b>{n0(c.alcance)}</b></div>
          <div><span>Dias no ar</span><b>{c.dias_veiculando}</b></div>
        </div>
        <small className="muted">{c.motivo}</small>
        {c.link_ig ? <a className="mid-cri-link" href={c.link_ig} target="_blank" rel="noreferrer">Ver no Instagram <ExternalLink size={12} aria-hidden /></a> : null}
      </div>
    </article>
  );
}

function AbaCriativos({ d }) {
  const cr = d.criativos;
  const [ordem, setOrdem] = React.useState("gasto");
  const itens = [...cr.itens].sort((a, b) => (ordem === "gasto" ? b.gasto - a.gasto : ordem === "leads" ? b.leads - a.leads : ordem === "ctr" ? (b.ctr_pct ?? -1) - (a.ctr_pct ?? -1) : (a.cpl ?? 1e9) - (b.cpl ?? 1e9)));
  return (
    <>
      <section className="panel">
        <h2>Criativos</h2>
        <Leitura itens={cr.leitura} />
        {cr.itens.length ? (
          <div className="subtabs" role="tablist" aria-label="Ordenar criativos">
            {[["gasto", "Mais gasto"], ["leads", "Mais leads"], ["cpl", "Menor custo/lead"], ["ctr", "Maior CTR"]].map(([k, t]) => (
              <button key={k} type="button" className={ordem === k ? "on" : ""} onClick={() => setOrdem(k)}>{t}</button>
            ))}
          </div>
        ) : null}
        {cr.itens.length ? <div className="mid-cri-grid">{itens.map((c) => <Criativo key={c.id} c={c} />)}</div> : <p className="muted">Nenhum criativo veiculou neste período.</p>}
      </section>
      {cr.parados.length ? (
        <section className="panel">
          <h2>Já criados, sem veicular no período ({cr.parados.length})</h2>
          <p className="muted">O que já foi testado: antes de criar um anúncio novo, veja se não é repetido.</p>
          <div className="mid-cri-grid">{cr.parados.map((c) => <Criativo key={c.id} c={c} />)}</div>
        </section>
      ) : null}
    </>
  );
}

function AbaPixel({ d }) {
  const px = d.pixel;
  const maxFunil = Math.max(1, ...px.funil.map((f) => f.total));
  const dias = [...new Set(px.serie.map((s) => s.day))].sort();
  const nomes = [...new Set(px.serie.map((s) => s.evento))];
  return (
    <>
      <section className="panel">
        <h2>Pixel e rastreio</h2>
        <Leitura itens={px.leitura} />
        {px.pixels.length ? (
          <div className="mini-kpis">
            {px.pixels.map((p) => <Kpi key={p.pixel_id} titulo={p.nome} valor={p.indisponivel ? "Indisponível" : p.ultimo_disparo ? "Ativo" : "Nunca disparou"} extra={p.ultimo_disparo ? `último disparo ${new Date(p.ultimo_disparo).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" })} · ID ${p.pixel_id}` : `ID ${p.pixel_id}`} />)}
          </div>
        ) : null}
      </section>
      {px.funil.length ? (
        <section className="panel">
          <h2>Funil do site</h2>
          <div className="mid-funil">
            {px.funil.map((f) => (
              <div key={f.evento} className="mid-linha">
                <div className="mid-linha-top"><span>{f.evento}</span><b>{n0(f.total)}</b></div>
                <div className="mid-barra"><i style={{ width: `${(f.total / maxFunil) * 100}%` }} /></div>
                {f.do_anterior_pct !== null ? <small className="muted">{pct(f.do_anterior_pct)} da etapa anterior</small> : <small className="muted">entrada do funil</small>}
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {px.eventos.length ? (
        <section className="panel">
          <h2>Eventos recebidos</h2>
          {dias.length >= 2 ? (
            <GraficoLinhas label="Eventos por dia" labels={dias.map(dm)} series={nomes.map((n, i) => ({ name: n, color: CORES[i % CORES.length], values: dias.map((dia) => px.serie.find((s) => s.day === dia && s.evento === n)?.total ?? 0) }))} />
          ) : null}
          <div className="mid-legenda">{nomes.map((n, i) => <span key={n}><i style={{ background: CORES[i % CORES.length] }} />{n}</span>)}</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Evento</th><th className="num">No período</th><th className="num">Período anterior</th><th className="num">Variação</th></tr></thead>
              <tbody>
                {px.eventos.map((e) => (
                  <tr key={e.evento}><td>{e.evento}</td><td className="num">{n0(e.total)}</td><td className="num">{n0(e.anterior)}</td><td className="num">{e.variacao === null ? "–" : `${e.variacao >= 0 ? "+" : ""}${e.variacao}%`}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : px.pixels.length ? <section className="panel"><p className="muted">O pixel existe, mas não recebeu eventos neste período.</p></section> : null}
    </>
  );
}

function TabelaPublico({ titulo, linhas, dica }) {
  if (!linhas.length) return null;
  return (
    <section className="panel">
      <h2>{titulo}</h2>
      {dica ? <p className="muted">{dica}</p> : null}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Grupo</th><th className="num">Gasto</th><th>Parte da verba</th><th className="num">Cliques</th><th className="num">CTR</th><th className="num">Leads</th><th className="num">Custo/lead</th></tr></thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.chave}>
                <td>{l.chave}</td><td className="num">{brl(l.gasto)}</td>
                <td><div className="mid-barra" style={{ minWidth: 80 }}><i style={{ width: `${l.parte_pct}%` }} /></div><small className="muted">{pct(l.parte_pct)}</small></td>
                <td className="num">{n0(l.cliques)}</td><td className="num">{pct(l.ctr_pct)}</td><td className="num">{n0(l.leads)}</td><td className="num">{brl(l.cpl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AbaPublicos({ d }) {
  const p = d.publicos;
  const vazio = !p.posicionamento.length && !p.idade_genero.length && !p.dispositivo.length;
  return (
    <>
      <section className="panel">
        <h2>Públicos e posicionamentos</h2>
        <Leitura itens={p.leitura} vazio={vazio ? "Sem anúncio com gasto neste período, então não há público para comparar." : "Nada para ajustar por enquanto."} />
      </section>
      <TabelaPublico titulo="Idade e gênero" linhas={p.idade_genero} dica="Quem está vendo e clicando nos seus anúncios." />
      <TabelaPublico titulo="Onde o anúncio aparece" linhas={p.posicionamento} dica="Feed, stories, reels, Facebook, Audience Network." />
      <TabelaPublico titulo="Dispositivo" linhas={p.dispositivo} />
    </>
  );
}

/* ---------------- tela ---------------- */

const ABAS = [
  { id: "resumo", rotulo: "Resumo" },
  { id: "instagram", rotulo: "Instagram" },
  { id: "anuncios", rotulo: "Anúncios" },
  { id: "criativos", rotulo: "Criativos" },
  { id: "pixel", rotulo: "Pixel" },
  { id: "publicos", rotulo: "Públicos" },
];

export function Midia() {
  const { state: estado } = useBrain();
  const [d, setD] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [lendo, setLendo] = React.useState(false);
  const [carregando, setCarregando] = React.useState(false);
  const [alertas, setAlertas] = React.useState([]);
  const [aba, setAba] = React.useState("resumo");
  const [preset, setPreset] = React.useState("30");
  const [custom, setCustom] = React.useState({ de: soma(hojeBrt(), -29), ate: hojeBrt() });
  const iv = intervalo(preset, custom);

  const carregar = React.useCallback((de, ate) => {
    setCarregando(true);
    return api.midia(de, ate).then((r) => { setD(r); setErro(null); }).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar.")).finally(() => setCarregando(false));
  }, []);
  React.useEffect(() => { if (iv.de && iv.ate) carregar(iv.de, iv.ate); }, [iv.de, iv.ate, carregar]);

  const atualizar = (dias = 90) => {
    setLendo(true);
    setAlertas([]);
    api.refreshData({ dias, de: iv.de, ate: iv.ate })
      .then((r) => { setAlertas(r.avisos ?? []); if (r.midia) setD(r.midia); })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao atualizar."))
      .finally(() => setLendo(false));
  };
  const salvarPremissas = (b) =>
    api.midiaPremissas({ ...b, de: iv.de, ate: iv.ate }).then((r) => { setD(r); avisos.push({ kind: "ok", title: "Premissas salvas." }); }).catch(() => avisos.push({ kind: "erro", title: "Não consegui salvar as premissas." }));

  if (!estado) return <div className="page"><header className="page-head"><h1>Anúncios e Instagram</h1><p>Abra a Central com o Brain ligado para ver.</p></header></div>;
  if (!d) return <div className="page"><header className="page-head"><h1>Anúncios e Instagram</h1><p>{erro ?? "Carregando…"}</p></header></div>;

  return (
    <div className="page">
      <header className="page-head head-row">
        <div>
          <h1>Anúncios e Instagram</h1>
          <p>Tudo que a Meta entrega, por período, com o que fazer em cada parte. Os dados são lidos todo dia de manhã.</p>
        </div>
        <div className="mid-ref">
          <button type="button" className="btn" onClick={() => atualizar(90)} disabled={lendo}>
            <RefreshCw size={15} aria-hidden className={lendo ? "spin" : ""} /> {lendo ? "Lendo a Meta…" : "Atualizar dados"}
          </button>
          <button type="button" className="btn-link" onClick={() => atualizar(365)} disabled={lendo} title="Busca os anúncios, o pixel e os públicos dos últimos 12 meses">Buscar 12 meses</button>
        </div>
      </header>
      {alertas.length ? <p className="banner" role="alert">{alertas.join(" · ")}</p> : null}

      <div className="mid-periodo">
        <div className="chips-inline" role="group" aria-label="Período">
          {PRESETS.map((p) => <button key={p.id} type="button" className={`chip ${preset === p.id ? "chip-on" : ""}`} onClick={() => setPreset(p.id)}>{p.rotulo}</button>)}
        </div>
        {preset === "custom" ? (
          <div className="mid-datas">
            <label>De<input type="date" value={custom.de} max={custom.ate} onChange={(e) => e.target.value && setCustom({ ...custom, de: e.target.value })} /></label>
            <label>Até<input type="date" value={custom.ate} min={custom.de} max={hojeBrt()} onChange={(e) => e.target.value && setCustom({ ...custom, ate: e.target.value })} /></label>
          </div>
        ) : null}
        <small className="muted">{dmy(d.periodo.de)} a {dmy(d.periodo.ate)} ({d.periodo.dias} dias), comparado com {dmy(d.periodo.anterior.de)} a {dmy(d.periodo.anterior.ate)}{carregando ? " · atualizando…" : ""}</small>
      </div>

      <div className="subtabs" role="tablist" aria-label="Seções">
        {ABAS.map((a) => <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} className={aba === a.id ? "on" : ""} onClick={() => setAba(a.id)}>{a.rotulo}</button>)}
      </div>

      {aba === "resumo" ? <Resumo d={d} /> : null}
      {aba === "instagram" ? <AbaInstagram d={d} /> : null}
      {aba === "anuncios" ? <AbaAnuncios d={d} salvar={salvarPremissas} ocupado={lendo} /> : null}
      {aba === "criativos" ? <AbaCriativos d={d} /> : null}
      {aba === "pixel" ? <AbaPixel d={d} /> : null}
      {aba === "publicos" ? <AbaPublicos d={d} /> : null}
    </div>
  );
}
