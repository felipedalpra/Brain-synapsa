// @ts-nocheck
// Google Analytics 4 dentro da aba SEO: o que acontece depois do clique (visitas, engajamento, tempo, eventos-chave) por página e por psicólogo.
import * as React from "react";
import { api } from "../api";
import { avisos } from "./Avisos";
import { Barras, LinhaInterativa, dd, fmt, fmt1, pct } from "./seo-charts";
import { Chips, Delta, Kpi, normaliza, useOrdem } from "./seo-ui";

const dur = (s) => (!s || !isFinite(s) ? "0:00" : `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`);
const taxa = (a, b) => (b ? a / b : 0);
const CANAL = { "Organic Search": "Busca orgânica (Google etc.)", Direct: "Direto (digitou ou sem origem)", "Organic Social": "Redes sociais (orgânico)", "Paid Search": "Busca paga", "Paid Social": "Redes sociais (anúncio)", Referral: "Links de outros sites", Email: "E-mail", Unassigned: "Sem origem identificada", "Cross-network": "Várias redes", Display: "Display" };
const APARELHO = { mobile: "Celular", desktop: "Computador", tablet: "Tablet" };
const PAIS = { Brazil: "Brasil", Portugal: "Portugal", "United States": "Estados Unidos", Argentina: "Argentina", Mexico: "México", Spain: "Espanha" };
const EVENTO = { page_view: "Página vista", session_start: "Sessão iniciada", first_visit: "Primeira visita", user_engagement: "Tempo de leitura", scroll: "Rolagem até o fim", click: "Clique em link externo", form_start: "Começou formulário", form_submit: "Enviou formulário", file_download: "Download", sign_up: "Cadastro", generate_lead: "Lead gerado" };

const derivada = (x) => ({ ...x, engajamento: taxa(x.engajadas, x.sessoes), tempo: taxa(x.seg, x.usuarios) });

function Configurar({ ga, sites, onFeito }) {
  const [busy, setBusy] = React.useState(false);
  const [manual, setManual] = React.useState({});
  const rodar = async (corpo, ok) => {
    setBusy(true);
    try {
      const r = await api.seoGa(corpo);
      avisos.push({ kind: "ok", title: r.message ?? ok });
      onFeito();
    } catch (e) {
      avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." });
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="panel">
      <h2>Ligar o Google Analytics 4</h2>
      <p className="muted">O Brain lê o GA4 com a mesma conta de serviço do Search Console. Só leitura. Faltam três passos no Google:</p>
      <ol className="seo-passos">
        <li>No Google Cloud (projeto <b>synapsabrain</b>), ative <b>Google Analytics Data API</b> e <b>Google Analytics Admin API</b>.</li>
        <li>No GA4 de cada site, vá em Administrador, Acesso à propriedade, e adicione o e-mail da conta de serviço como <b>Leitor</b>.</li>
        <li>Clique em procurar abaixo. Se o Brain não achar sozinho, cole o número da propriedade (Administrador, Detalhes da propriedade).</li>
      </ol>
      {ga.ultimoErro ? <p className="empty">{ga.ultimoErro}</p> : null}
      <div className="seo-filtros">
        <button type="button" className="btn" disabled={busy} onClick={() => rodar({ descobrir: true }, "Procurei.")}>{busy ? "Procurando…" : "Procurar propriedades"}</button>
      </div>
      <div className="seo-manual">
        {sites.map((s) => (
          <label key={s.id}>
            <span>{s.rotulo}</span>
            <input type="text" inputMode="numeric" className="seo-busca" placeholder="Número da propriedade (só dígitos)" value={manual[s.id] ?? ""} onChange={(e) => setManual({ ...manual, [s.id]: e.target.value })} />
            <button type="button" className="btn" disabled={busy || !/^\d{6,14}$/.test((manual[s.id] ?? "").trim())} onClick={() => rodar({ site: s.id, propriedade: manual[s.id].trim() }, "Salvo.")}>Salvar</button>
          </label>
        ))}
      </div>
    </section>
  );
}

/** Tabela de páginas ou de entradas. Com `gsc`, cruza com os cliques do Google na mesma página. */
function Tabela({ itens, rotulo, gsc, pagina = false, filtros = true }) {
  const [filtro, setFiltro] = React.useState("todos");
  const [busca, setBusca] = React.useState("");
  const dados = React.useMemo(() => itens.map((i) => { const d = derivada(i); const g = gsc?.get(i.info?.caminho ?? i.chave); return { ...d, rotulo: i.info?.rotulo ?? i.chave, caminho: i.info?.caminho ?? i.chave, tipo: i.info?.tipo, cliquesGoogle: g?.clicks ?? 0, impGoogle: g?.impressions ?? 0 }; }), [itens, gsc]);
  const lista = dados.filter((d) => (filtro === "todos" ? true : filtro === "perfil" ? d.tipo === "perfil" : d.tipo !== "perfil") && (!busca || normaliza(d.rotulo + d.caminho).includes(normaliza(busca))));
  const { ordenadas, Th } = useOrdem(lista, pagina ? "views" : "sessoes");
  const temPerfil = dados.some((d) => d.tipo === "perfil");
  return (
    <div className="seo-bloco">
      <div className="seo-filtros">
        {filtros && temPerfil ? <Chips valor={filtro} onChange={setFiltro} opcoes={[{ id: "todos", rotulo: "Todas", n: dados.length }, { id: "perfil", rotulo: "Perfis dos psicólogos", n: dados.filter((d) => d.tipo === "perfil").length }, { id: "outras", rotulo: "Home e listas", n: dados.filter((d) => d.tipo !== "perfil").length }]} /> : <span />}
        <input type="search" className="seo-busca" placeholder="Filtrar pelo nome" aria-label="Filtrar pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      {ordenadas.length === 0 ? <p className="empty">Nada por aqui ainda.</p> : (
        <div className="seo-scroll">
          <table className="seo-tab">
            <thead>
              <tr>
                <Th k="rotulo" num={false}>{rotulo}</Th>
                {pagina ? <Th k="views">Visualizações</Th> : <Th k="sessoes">Visitas</Th>}
                <Th k="usuarios">Pessoas</Th>
                <Th k="engajamento">Engajamento</Th>
                <Th k="tempo">Tempo por pessoa</Th>
                <Th k="eventos">Eventos-chave</Th>
                {gsc ? <Th k="cliquesGoogle">Cliques no Google</Th> : null}
                <Th k={(d) => (d.anterior.sessoes ? (d.sessoes - d.anterior.sessoes) / d.anterior.sessoes : d.sessoes ? 9 : 0)}>vs. 28 dias antes</Th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((d) => (
                <tr key={d.chave}>
                  <td><strong>{d.rotulo}</strong><br /><span className="muted seo-url">{d.caminho}</span></td>
                  <td className="num">{fmt(pagina ? d.views : d.sessoes)}</td>
                  <td className="num">{fmt(d.usuarios)}</td>
                  <td className="num">{d.sessoes ? pct(d.engajamento) : "—"}</td>
                  <td className="num">{dur(d.tempo)}</td>
                  <td className="num">{fmt(d.eventos)}</td>
                  {gsc ? <td className="num">{d.cliquesGoogle ? fmt(d.cliquesGoogle) : <span className="muted">0</span>}</td> : null}
                  <td className="num"><Delta atual={d.sessoes} antes={d.anterior.sessoes} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function VisaoGa({ g, gsc }) {
  const [janela, setJanela] = React.useState(90);
  const [aba, setAba] = React.useState("canais");
  const gscMap = React.useMemo(() => new Map((gsc?.paginas ?? []).map((x) => [x.caminho, x])), [gsc]);
  if (!g.propriedade) return <p className="empty">Esse site ainda não tem propriedade do GA4 ligada.</p>;
  if (!g.serie.length) return <p className="empty">Propriedade {g.propriedade} ligada, sem dados ainda. Clique em "Sincronizar agora".</p>;
  const serie = g.serie.slice(-janela).map(derivada);
  const a = derivada(g.atual), p = derivada(g.anterior);
  const sub = [{ id: "canais", rotulo: "De onde vêm" }, { id: "entradas", rotulo: g.id === "diretorio" ? "Entradas e perfis" : "Páginas de entrada" }, { id: "paginas", rotulo: "Páginas vistas" }, { id: "eventos", rotulo: "Eventos" }, { id: "aparelho", rotulo: "Aparelho e país" }];
  return (
    <div className="stack">
      <div className="kpis seo-kpis">
        <Kpi rotulo="Visitas" valor={fmt(a.sessoes)} filho={<Delta atual={a.sessoes} antes={p.sessoes} />} nota="28 dias" />
        <Kpi rotulo="Pessoas" valor={fmt(a.usuarios)} filho={<Delta atual={a.usuarios} antes={p.usuarios} />} nota={`${fmt(a.novos)} novas`} />
        <Kpi rotulo="Visitas engajadas" valor={a.sessoes ? pct(a.engajamento) : "—"} filho={p.sessoes ? `antes: ${pct(p.engajamento)}` : "sem comparação"} nota="mais de 10 s, 2 páginas ou evento-chave" />
        <Kpi rotulo="Tempo por pessoa" valor={dur(a.tempo)} filho={p.usuarios ? `antes: ${dur(p.tempo)}` : "sem comparação"} nota="minutos:segundos" />
        <Kpi rotulo="Eventos-chave" valor={fmt(a.eventos)} filho={<Delta atual={a.eventos} antes={p.eventos} />} nota="conversões marcadas no GA4" />
      </div>
      {g.recados.length ? (
        <section className="panel seo-recados">
          <h2>O que isso quer dizer</h2>
          <ul>{g.recados.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </section>
      ) : null}
      <section className="panel">
        <div className="seo-head">
          <h2>Evolução por dia</h2>
          <Chips valor={janela} onChange={setJanela} opcoes={[{ id: 28, rotulo: "28 dias" }, { id: 60, rotulo: "60 dias" }, { id: 90, rotulo: "90 dias" }]} />
        </div>
        <LinhaInterativa titulo="Visitas e pessoas" dados={serie} series={[{ key: "sessoes", label: "Visitas", color: "var(--core-2)", eixo: "e" }, { key: "usuarios", label: "Pessoas", color: "var(--ok)", eixo: "e" }]} />
        <LinhaInterativa titulo="Visitas engajadas (%)" dados={serie.map((d) => ({ ...d, engajamento: d.engajamento * 100 }))} altura={190} series={[{ key: "engajamento", label: "Engajamento", color: "var(--warn)", eixo: "e", fmt: (v) => `${fmt1(v)}%` }]} />
        <p className="muted">Último dia fechado: {g.ultimoDia ? dd(g.ultimoDia) : "—"}. O GA4 pode ajustar os últimos dias nas próximas horas.</p>
      </section>
      <section className="panel">
        <div className="subtabs" role="tablist">
          {sub.map((t) => <button key={t.id} type="button" role="tab" aria-selected={aba === t.id} className={aba === t.id ? "on" : ""} onClick={() => setAba(t.id)}>{t.rotulo}</button>)}
        </div>
        {aba === "canais" ? (
          <div className="seo-bloco seo-duas">
            <section>
              <h3>Canais</h3>
              <Barras itens={g.canais.map((c) => ({ rotulo: CANAL[c.chave] ?? c.chave, valor: c.sessoes, detalhe: `${pct(taxa(c.engajadas, c.sessoes))} engajadas · ${fmt(c.usuarios)} pessoas · ${fmt(c.eventos)} eventos-chave` }))} />
            </section>
            <section>
              <h3>Campanhas (UTM)</h3>
              {g.campanhas && g.campanhas.length ? (
                <Barras itens={g.campanhas.slice(0, 15).map((c) => ({ rotulo: c.chave, valor: c.sessoes, detalhe: `${pct(taxa(c.engajadas, c.sessoes))} engajadas · ${fmt(c.eventos)} eventos-chave` }))} />
              ) : (
                <p className="muted">Ainda sem sessões com campanha. Aparece depois da próxima sincronização, quando alguém abrir um link com utm_campaign. O GA4 só conta quem aceita cookies e atrasa de 24 a 48 horas.</p>
              )}
            </section>
            <section>
              <h3>Origem e meio</h3>
              <Barras itens={g.origens.slice(0, 15).map((c) => ({ rotulo: c.chave, valor: c.sessoes, detalhe: `${pct(taxa(c.engajadas, c.sessoes))} engajadas · ${fmt(c.eventos)} eventos-chave` }))} />
            </section>
          </div>
        ) : null}
        {aba === "entradas" ? (
          <>
            <p className="muted">Página em que a pessoa começou a visita. A coluna "Cliques no Google" vem do Search Console: se um perfil tem cliques lá e poucas visitas aqui, a tag não está disparando nele.</p>
            <Tabela itens={g.entradas} rotulo={g.id === "diretorio" ? "Psicólogo ou página" : "Página"} gsc={gscMap} />
          </>
        ) : null}
        {aba === "paginas" ? <Tabela itens={g.paginas} rotulo="Página" pagina filtros={g.id === "diretorio"} /> : null}
        {aba === "eventos" ? (
          g.eventos.length ? (
            <div className="seo-bloco">
              <p className="muted">Tudo o que o GA4 registrou nos últimos 28 dias. Para medir cadastro e pedido de demo, marque o evento certo como evento-chave no GA4.</p>
              <Barras itens={g.eventos.map((e) => ({ rotulo: EVENTO[e.chave] ?? e.chave, valor: e.eventos, detalhe: `${fmt(e.usuarios)} pessoas · ${e.chave}` }))} />
            </div>
          ) : <p className="empty">Nenhum evento ainda.</p>
        ) : null}
        {aba === "aparelho" ? (
          <div className="seo-bloco seo-duas">
            <section>
              <h3>Aparelho</h3>
              <Barras itens={g.aparelhos.map((d) => ({ rotulo: APARELHO[d.chave] ?? d.chave, valor: d.sessoes, detalhe: `${pct(taxa(d.engajadas, d.sessoes))} engajadas · tempo ${dur(taxa(d.seg, d.usuarios))}` }))} />
            </section>
            <section>
              <h3>País</h3>
              <Barras itens={g.paises.map((d) => ({ rotulo: PAIS[d.chave] ?? d.chave, valor: d.sessoes, detalhe: `${pct(taxa(d.engajadas, d.sessoes))} engajadas` }))} />
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function Analytics({ ga, sites, site, onRecarregar }) {
  if (!ga) return <p className="empty">Carregando…</p>;
  if (!ga.configurado) return <Configurar ga={ga} sites={sites} onFeito={onRecarregar} />;
  const g = ga.sites.find((x) => x.id === site) ?? ga.sites[0];
  return (
    <div className="stack">
      {ga.ultimoErro ? <p className="empty">{ga.ultimoErro}</p> : null}
      <VisaoGa key={g.id} g={g} gsc={sites.find((s) => s.id === g.id)} />
      {ga.sites.some((x) => !x.propriedade) ? <Configurar ga={ga} sites={ga.sites.filter((x) => !x.propriedade)} onFeito={onRecarregar} /> : null}
    </div>
  );
}
