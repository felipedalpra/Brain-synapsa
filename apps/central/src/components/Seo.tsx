// @ts-nocheck
// Aba SEO: Search Console do diretório de psicólogos (synapsa.chat) e do site (synapsa.com.br), com detalhe por página e por busca.
import * as React from "react";
import { api } from "../api";
import { useBrain } from "../store";
import { avisos } from "./Avisos";
import { Barras, Funil, LinhaInterativa, Mini, dd, fmt, fmt1, pct } from "./seo-charts";

const curto = (u) => u.replace(/^https?:\/\/(www\.)?/, "");
const normaliza = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Delta({ atual, antes, inverso = false, sufixo = "" }) {
  if (!antes) return <span className="seo-delta">{atual ? "novo" : "—"}</span>;
  const d = ((atual - antes) / antes) * 100;
  const bom = inverso ? d < 0 : d > 0;
  return <span className={`seo-delta ${Math.abs(d) < 1 ? "" : bom ? "up" : "down"}`}>{d > 0 ? "+" : ""}{Math.round(d)}%{sufixo}</span>;
}

function Kpi({ rotulo, valor, filho, nota }) {
  return (
    <div className="kpi">
      <span>{rotulo}</span>
      <b>{valor}</b>
      <small>{filho}{nota ? <> · {nota}</> : null}</small>
    </div>
  );
}

function useOrdem(linhas, inicial, desc = true) {
  const [ord, setOrd] = React.useState({ k: inicial, desc });
  const ordenadas = React.useMemo(() => {
    const val = (l) => { const v = typeof ord.k === "function" ? ord.k(l) : l[ord.k]; return typeof v === "string" ? normaliza(v) : v ?? 0; };
    return [...linhas].sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * (ord.desc ? -1 : 1); });
  }, [linhas, ord]);
  const Th = ({ k, children, num = true }) => (
    <th className={num ? "num" : ""} aria-sort={ord.k === k ? (ord.desc ? "descending" : "ascending") : "none"}>
      <button type="button" className="seo-th" onClick={() => setOrd((o) => ({ k, desc: o.k === k ? !o.desc : k !== "position" }))}>
        {children}{ord.k === k ? (ord.desc ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );
  return { ordenadas, Th };
}

function Chips({ opcoes, valor, onChange }) {
  return (
    <div className="seo-chips" role="group">
      {opcoes.map((o) => (
        <button key={o.id} type="button" className={valor === o.id ? "on" : ""} aria-pressed={valor === o.id} onClick={() => onChange(o.id)}>
          {o.rotulo}{o.n != null ? <em>{o.n}</em> : null}
        </button>
      ))}
    </div>
  );
}

/** Páginas (perfis do diretório, páginas do site). Clique na linha para ver as buscas que levaram até ela. */
function TabelaPaginas({ paginas, rotuloPrimeira, semImpressao = [] }) {
  const [filtro, setFiltro] = React.useState("todos");
  const [busca, setBusca] = React.useState("");
  const [aberta, setAberta] = React.useState(null);
  const lista = paginas.filter((p) => (filtro === "clique" ? p.clicks > 0 : filtro === "visto" ? p.clicks === 0 : true) && (!busca || normaliza(p.rotulo + p.caminho).includes(normaliza(busca))));
  const { ordenadas, Th } = useOrdem(lista, "impressions");
  const sem = filtro === "sem" ? semImpressao.filter((p) => !busca || normaliza(p.nome).includes(normaliza(busca))) : [];
  return (
    <div className="seo-bloco">
      <div className="seo-filtros">
        <Chips valor={filtro} onChange={setFiltro} opcoes={[
          { id: "todos", rotulo: "Todos", n: paginas.length },
          { id: "clique", rotulo: "Com clique", n: paginas.filter((p) => p.clicks > 0).length },
          { id: "visto", rotulo: "Vistos, sem clique", n: paginas.filter((p) => p.clicks === 0).length },
          ...(semImpressao.length ? [{ id: "sem", rotulo: "Ainda não apareceram", n: semImpressao.length }] : []),
        ]} />
        <input type="search" className="seo-busca" placeholder="Filtrar pelo nome" aria-label="Filtrar pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      {filtro === "sem" ? (
        sem.length ? (
          <ul className="seo-sem">
            {sem.map((p) => <li key={p.url}><strong>{p.nome}</strong><span className="muted">{p.url}</span></li>)}
          </ul>
        ) : <p className="empty">Nenhum perfil nessa situação.</p>
      ) : ordenadas.length === 0 ? (
        <p className="empty">Nada por aqui ainda.</p>
      ) : (
        <div className="seo-scroll">
          <table className="seo-tab">
            <thead>
              <tr>
                <Th k="rotulo" num={false}>{rotuloPrimeira}</Th>
                <Th k="clicks">Cliques</Th>
                <Th k="impressions">Impressões</Th>
                <Th k="ctr">CTR</Th>
                <Th k="position">Posição</Th>
                <Th k={(p) => (p.anterior.impressions ? (p.impressions - p.anterior.impressions) / p.anterior.impressions : p.impressions ? 9 : 0)}>vs. 28 dias antes</Th>
                <th>28 dias</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((p) => (
                <React.Fragment key={p.url}>
                  <tr className={`seo-linha${aberta === p.url ? " aberta" : ""}`} onClick={() => setAberta(aberta === p.url ? null : p.url)} tabIndex={0} aria-expanded={aberta === p.url}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setAberta(aberta === p.url ? null : p.url); } }}>
                    <td><strong>{p.rotulo}</strong><br /><span className="muted seo-url">{p.caminho}</span></td>
                    <td className="num">{fmt(p.clicks)}</td>
                    <td className="num">{fmt(p.impressions)}</td>
                    <td className="num">{pct(p.ctr)}</td>
                    <td className="num">{fmt1(p.position)}</td>
                    <td className="num"><Delta atual={p.impressions} antes={p.anterior.impressions} /></td>
                    <td><Mini serie={p.serie} /></td>
                  </tr>
                  {aberta === p.url ? (
                    <tr className="seo-detalhe">
                      <td colSpan={7}>
                        {p.buscas.length ? (
                          <>
                            <p className="muted">Buscas que mostraram essa página (últimos 28 dias). O Google esconde buscas raras, então a soma pode ficar abaixo do total.</p>
                            <table className="seo-tab seo-tab-int">
                              <thead><tr><th>Busca</th><th className="num">Cliques</th><th className="num">Impressões</th><th className="num">Posição</th></tr></thead>
                              <tbody>{p.buscas.map((b) => <tr key={b.busca}><td>{b.busca}</td><td className="num">{fmt(b.clicks)}</td><td className="num">{fmt(b.impressions)}</td><td className="num">{fmt1(b.position)}</td></tr>)}</tbody>
                            </table>
                          </>
                        ) : <p className="muted">O Google não informou as buscas dessa página (volume baixo demais).</p>}
                        <p className="muted seo-url">{curto(p.url)}</p>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const CORES_CAT = { marca: "var(--core-2)", concorrente: "var(--warn)", software: "var(--t-comercial)", psicologo_local: "var(--ok)", psicologo_tema: "var(--t-produto)", psicologo_geral: "var(--t-estrategia)", outra: "var(--muted)" };
const ROTULO_CAT = { marca: "Marca", concorrente: "Concorrente", software: "Software", psicologo_local: "Psicólogo + local", psicologo_tema: "Psicólogo + tema", psicologo_geral: "Psicólogo (geral)", outra: "Outras" };

function TabelaBuscas({ buscas }) {
  const [cat, setCat] = React.useState("todas");
  const [semMarca, setSemMarca] = React.useState(false);
  const [busca, setBusca] = React.useState("");
  const cats = [...new Set(buscas.map((b) => b.categoria))];
  const lista = buscas.filter((b) => (cat === "todas" || b.categoria === cat) && !(semMarca && b.categoria === "marca") && (!busca || normaliza(b.chave).includes(normaliza(busca))));
  const { ordenadas, Th } = useOrdem(lista, "impressions");
  return (
    <div className="seo-bloco">
      <div className="seo-filtros">
        <Chips valor={cat} onChange={setCat} opcoes={[{ id: "todas", rotulo: "Todas", n: buscas.length }, ...cats.map((c) => ({ id: c, rotulo: ROTULO_CAT[c] ?? c, n: buscas.filter((b) => b.categoria === c).length }))]} />
        <label className="seo-check"><input type="checkbox" checked={semMarca} onChange={(e) => setSemMarca(e.target.checked)} /> Esconder a marca</label>
        <input type="search" className="seo-busca" placeholder="Filtrar buscas" aria-label="Filtrar buscas" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      {ordenadas.length === 0 ? <p className="empty">Nenhuma busca com esse filtro.</p> : (
        <div className="seo-scroll">
          <table className="seo-tab">
            <thead>
              <tr><Th k="chave" num={false}>Busca</Th><th>Tipo</th><Th k="clicks">Cliques</Th><Th k="impressions">Impressões</Th><Th k="ctr">CTR</Th><Th k="position">Posição</Th><Th k={(b) => (b.anterior.impressions ? (b.impressions - b.anterior.impressions) / b.anterior.impressions : b.impressions ? 9 : 0)}>vs. 28 dias antes</Th></tr>
            </thead>
            <tbody>
              {ordenadas.slice(0, 300).map((b) => (
                <tr key={b.chave}>
                  <td style={{ wordBreak: "break-word" }}>{b.chave}</td>
                  <td><span className="seo-tag" style={{ "--c": CORES_CAT[b.categoria] }}>{ROTULO_CAT[b.categoria] ?? b.categoria}{b.cidade ? `: ${b.cidade}` : b.tema ? `: ${b.tema}` : ""}</span></td>
                  <td className="num">{fmt(b.clicks)}</td>
                  <td className="num">{fmt(b.impressions)}</td>
                  <td className="num">{pct(b.ctr)}</td>
                  <td className="num">{fmt1(b.position)}</td>
                  <td className="num"><Delta atual={b.impressions} antes={b.anterior.impressions} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PalavrasChave({ s }) {
  const cats = s.categorias.map((c) => ({ rotulo: ROTULO_CAT[c.categoria] ?? c.rotulo, valor: c.impressions, cor: CORES_CAT[c.categoria], detalhe: `${fmt(c.buscas)} buscas · ${fmt(c.clicks)} cliques · posição média ${fmt1(c.position)}` }));
  const cidades = s.cobertura.cidades.filter((c) => c.impressions > 0);
  const semCidade = s.cobertura.cidades.filter((c) => c.impressions === 0);
  const temas = s.cobertura.temas.filter((c) => c.impressions > 0);
  const semTema = s.cobertura.temas.filter((c) => c.impressions === 0);
  return (
    <div className="seo-bloco seo-duas">
      <section>
        <h3>O que as pessoas buscam quando a Synapsa aparece</h3>
        <p className="muted">Impressões por tipo de busca nos últimos 28 dias. Passe o mouse para ver cliques e posição.</p>
        <Barras itens={cats} vazio="Ainda sem buscas registradas." />
      </section>
      <section>
        <h3>Onde investir primeiro</h3>
        <p className="muted">Buscas em que já aparecemos, sem clique, e o que fazer em cada uma.</p>
        {s.oportunidades.length === 0 ? <p className="empty">Nenhuma oportunidade clara ainda. Com mais impressões, as candidatas aparecem aqui.</p> : (
          <ol className="seo-ops">
            {s.oportunidades.slice(0, 8).map((o) => (
              <li key={o.chave}>
                <strong>{o.chave}</strong>
                <span className="muted">{fmt(o.impressions)} impressões · posição {fmt1(o.position)} · {fmt(o.clicks)} cliques</span>
                <p>{o.acao}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
      {s.tipo === "diretorio" ? (
        <section>
          <h3>Cidades</h3>
          <p className="muted">Impressões por cidade ou bairro citado na busca.</p>
          <Barras itens={cidades.map((c) => ({ rotulo: c.nome, valor: c.impressions, cor: c.position <= 10 ? "var(--ok)" : c.position <= 30 ? "var(--warn)" : "var(--crit)", detalhe: `posição média ${fmt1(c.position)} · ${fmt(c.clicks)} cliques` }))} vazio="Nenhuma busca com cidade ainda." />
          {semCidade.length ? <p className="muted seo-sem-pres">Sem nenhuma presença: {semCidade.map((c) => c.nome).join(", ")}.</p> : null}
        </section>
      ) : null}
      <section>
        <h3>Temas</h3>
        <p className="muted">Ansiedade, casal, infantil e outros assuntos que aparecem na busca por psicólogo.</p>
        <Barras itens={temas.map((c) => ({ rotulo: c.nome, valor: c.impressions, detalhe: `posição média ${fmt1(c.position)} · ${fmt(c.clicks)} cliques` }))} vazio="Nenhuma busca com tema ainda." />
        {semTema.length && s.tipo === "diretorio" ? <p className="muted seo-sem-pres">Sem presença: {semTema.map((c) => c.nome).join(", ")}.</p> : null}
      </section>
      <p className="muted seo-nota">Limite do Search Console: ele só mostra buscas em que a Synapsa apareceu, então não diz quantas pessoas buscam por um termo no Brasil inteiro. Para volume de mercado, o Planejador de Palavras-chave do Google Ads traz esse número.</p>
    </div>
  );
}

function Dispositivos({ s }) {
  const rot = { MOBILE: "Celular", DESKTOP: "Computador", TABLET: "Tablet" };
  const nomePais = (c) => { const a2 = ISO3[c]; try { return a2 ? new Intl.DisplayNames(["pt-BR"], { type: "region" }).of(a2) : c.toUpperCase(); } catch { return c.toUpperCase(); } };
  return (
    <div className="seo-bloco seo-duas">
      <section>
        <h3>Aparelho</h3>
        <Barras itens={s.dispositivos.map((d) => ({ rotulo: rot[d.chave] ?? d.chave, valor: d.impressions, detalhe: `${fmt(d.clicks)} cliques · CTR ${pct(d.ctr)} · posição ${fmt1(d.position)}` }))} />
      </section>
      <section>
        <h3>País</h3>
        <Barras itens={s.paises.map((d) => ({ rotulo: nomePais(d.chave), valor: d.impressions, detalhe: `${fmt(d.clicks)} cliques · CTR ${pct(d.ctr)} · posição ${fmt1(d.position)}` }))} />
      </section>
    </div>
  );
}
const ISO3 = { bra: "BR", mex: "MX", arg: "AR", usa: "US", prt: "PT", esp: "ES", deu: "DE", can: "CA", are: "AE", ago: "AO", ecu: "EC", col: "CO", chl: "CL", per: "PE", ury: "UY", pry: "PY", gbr: "GB", fra: "FR", ita: "IT", moz: "MZ", jpn: "JP", ind: "IN", chn: "CN" };

function VisaoSite({ s, funil }) {
  const [janela, setJanela] = React.useState(90);
  const sub = s.tipo === "diretorio"
    ? [{ id: "perfis", rotulo: "Perfis dos psicólogos" }, { id: "paginas", rotulo: "Home e listas" }, { id: "buscas", rotulo: "Buscas" }, { id: "chaves", rotulo: "Palavras-chave" }, { id: "aparelho", rotulo: "Aparelho e país" }]
    : [{ id: "paginas", rotulo: "Páginas" }, { id: "buscas", rotulo: "Buscas" }, { id: "chaves", rotulo: "Palavras-chave" }, { id: "aparelho", rotulo: "Aparelho e país" }];
  const [aba, setAba] = React.useState(sub[0].id);
  const serie = s.serie.slice(-janela);
  const perfis = s.paginas.filter((p) => p.tipo === "perfil");
  const outras = s.paginas.filter((p) => p.tipo !== "perfil");
  const pos = s.atual.position, posAnt = s.anterior.position;
  if (s.serie.length === 0) return <p className="empty">Sem dados ainda. Clique em "Sincronizar agora".</p>;
  return (
    <div className="stack">
      <div className="kpis seo-kpis">
        <Kpi rotulo="Cliques vindos do Google" valor={fmt(s.atual.clicks)} filho={<Delta atual={s.atual.clicks} antes={s.anterior.clicks} />} nota="28 dias" />
        <Kpi rotulo="Vezes que apareceu" valor={fmt(s.atual.impressions)} filho={<Delta atual={s.atual.impressions} antes={s.anterior.impressions} />} nota="impressões" />
        <Kpi rotulo="Taxa de clique" valor={pct(s.atual.ctr)} filho={`antes: ${pct(s.anterior.ctr)}`} nota="CTR" />
        <Kpi rotulo="Posição média" valor={fmt1(pos)} filho={posAnt ? `antes: ${fmt1(posAnt)}` : "sem comparação"} nota={pos && posAnt ? (pos < posAnt ? "subiu" : pos > posAnt ? "caiu" : "estável") : null} />
      </div>

      {s.recados.length ? (
        <section className="panel seo-recados">
          <h2>O que isso quer dizer</h2>
          <ul>{s.recados.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>
      ) : null}

      {s.tipo === "site" && funil ? (
        <section className="panel">
          <h2>Do clique ao cliente</h2>
          <p className="muted">Cliques do Google no synapsa.com.br contra os leads que entraram no CRM no mesmo período ({funil.periodo.replace(/(\d{4})-(\d\d)-(\d\d)/g, "$3/$2")}). É comparação de volumes, não rastreio de cada pessoa: o Search Console não vê o que acontece dentro do site.</p>
          <Funil etapas={[
            { rotulo: "Apareceram no Google", valor: s.atual.impressions, cor: "var(--muted)", nota: "impressões" },
            { rotulo: "Clicaram para o site", valor: funil.cliquesGoogle, cor: "var(--core-2)" },
            { rotulo: "Leads no CRM (todas as origens)", valor: funil.leads, cor: "var(--blue)", nota: "mistura outbound, Instagram etc." },
            { rotulo: "Leads com origem Google ou site", valor: funil.leadsGoogle, cor: "var(--ok)", nota: "origem 'google' ou 'landing page'" },
          ]} />
          <p className="muted">Para medir cadastro e demo por página (entrou, saiu, clicou em "agendar"), falta ligar o Google Analytics 4 ao Brain; é o mesmo processo da conta de serviço.</p>
        </section>
      ) : null}

      <section className="panel">
        <div className="seo-head">
          <h2>Evolução por dia</h2>
          <Chips valor={janela} onChange={setJanela} opcoes={[{ id: 28, rotulo: "28 dias" }, { id: 60, rotulo: "60 dias" }, { id: 90, rotulo: "90 dias" }]} />
        </div>
        <LinhaInterativa titulo="Cliques e impressões" dados={serie}
          series={[{ key: "clicks", label: "Cliques", color: "var(--ok)", eixo: "e" }, { key: "impressions", label: "Impressões", color: "var(--core-2)", eixo: "d" }]} />
        <LinhaInterativa titulo="Posição média (1 é o topo)" dados={serie} invertido altura={190}
          series={[{ key: "position", label: "Posição", color: "var(--warn)", eixo: "e", fmt: fmt1 }]} />
        <p className="muted">O Google fecha os números com cerca de 2 dias de atraso. Último dia: {s.ultimoDia ? dd(s.ultimoDia) : "—"}.</p>
      </section>

      <section className="panel">
        <div className="subtabs" role="tablist">
          {sub.map((t) => <button key={t.id} type="button" role="tab" aria-selected={aba === t.id} className={aba === t.id ? "on" : ""} onClick={() => setAba(t.id)}>{t.rotulo}</button>)}
        </div>
        {aba === "perfis" ? (
          <>
            {s.perfis ? (
              <p className="seo-resumo">
                <strong>{fmt(s.perfis.comImpressao)}</strong> perfis apareceram no Google · <strong>{fmt(s.perfis.comClique)}</strong> receberam clique
                {s.perfis.esperados != null ? <> · <strong>{fmt(s.perfis.esperados)}</strong> no mapa do site</> : <span className="muted"> · o mapa do site não pôde ser lido, então perfis sem aparição não são listados</span>}
              </p>
            ) : null}
            <TabelaPaginas paginas={perfis} rotuloPrimeira="Psicólogo" semImpressao={s.perfis?.semImpressao ?? []} />
          </>
        ) : null}
        {aba === "paginas" ? <TabelaPaginas paginas={s.tipo === "diretorio" ? outras : s.paginas} rotuloPrimeira="Página" /> : null}
        {aba === "buscas" ? <TabelaBuscas buscas={s.queries} /> : null}
        {aba === "chaves" ? <PalavrasChave s={s} /> : null}
        {aba === "aparelho" ? <Dispositivos s={s} /> : null}
      </section>
    </div>
  );
}

export function Seo() {
  const { live } = useBrain();
  const [dados, setDados] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [site, setSite] = React.useState("diretorio");
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
  const ordem = ["diretorio", "site"];
  const sites = [...dados.sites].sort((a, b) => ordem.indexOf(a.id) - ordem.indexOf(b.id));
  const atual = sites.find((s) => s.id === site) ?? sites[0];
  return (
    <div className="stack">
      <section className="panel">
        <div className="seo-head">
          <h2>Search Console</h2>
          <button type="button" className="btn" disabled={busy} onClick={sincronizar}>{busy ? "Sincronizando…" : "Sincronizar agora"}</button>
        </div>
        <p className="muted">
          Últimos 28 dias contra os 28 anteriores. Sincroniza sozinho todo dia{dados.ultimaSync ? `; última vez em ${dd(dados.ultimaSync)}` : ""}.
        </p>
        {dados.ultimoErro ? <p className="empty">{dados.ultimoErro}</p> : null}
        <div className="subtabs" role="tablist">
          {sites.map((s) => <button key={s.id} type="button" role="tab" aria-selected={atual.id === s.id} className={atual.id === s.id ? "on" : ""} onClick={() => setSite(s.id)}>{s.rotulo}</button>)}
        </div>
      </section>
      <VisaoSite key={atual.id} s={atual} funil={dados.funil} />
    </div>
  );
}
