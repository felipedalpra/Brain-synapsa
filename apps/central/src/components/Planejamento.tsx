// @ts-nocheck
// Planejamento semanal (subaba do CRM): posts de cada dia e tarefas com subtarefas, responsável, status e taxa de conclusão.
import * as React from "react";
import { api } from "../api";
import { useBrain } from "../store";
import { avisos } from "./Avisos";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const FORMATOS = ["carrossel", "reel", "imagem", "story"];
const dm = (d) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const pct = (x) => `${Math.round(x * 100)}%`;
const somaDias = (d, n) => new Date(Date.parse(`${d}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
const ROTULO = { pendente: "Pendente", andamento: "Em andamento", concluida: "Concluída" };

/** Caixa de três estados: clique marca como concluída; o menu ao lado escolhe "em andamento". */
function Marca({ item, agir }) {
  const feito = item.status === "concluida";
  return (
    <button type="button" className={`pl-marca pl-${item.status}`} role="checkbox" aria-checked={feito ? "true" : item.status === "andamento" ? "mixed" : "false"}
      aria-label={`${feito ? "Reabrir" : "Concluir"}: ${item.titulo}`} title={ROTULO[item.status]}
      onClick={() => agir({ acao: "status", id: item.id, status: feito ? "pendente" : "concluida" })}>
      {feito ? "✓" : item.status === "andamento" ? "–" : ""}
    </button>
  );
}

function Resp({ valor, lista, onChange, vazio = "Sem responsável" }) {
  return (
    <select className="pl-sel" value={valor} onChange={(e) => onChange(e.target.value)} aria-label="Responsável">
      <option value="">{vazio}</option>
      {lista.map((r) => <option key={r} value={r}>{r}</option>)}
      {valor && !lista.includes(valor) ? <option value={valor}>{valor}</option> : null}
    </select>
  );
}

function Titulo({ item, agir }) {
  const [ed, setEd] = React.useState(false);
  const [v, setV] = React.useState(item.titulo);
  const salvar = () => { setEd(false); if (v.trim() && v.trim() !== item.titulo) agir({ acao: "editar", id: item.id, titulo: v }); else setV(item.titulo); };
  if (ed) return <input className="pl-input pl-edit" autoFocus value={v} maxLength={300} onChange={(e) => setV(e.target.value)} onBlur={salvar} onKeyDown={(e) => { if (e.key === "Enter") salvar(); if (e.key === "Escape") { setV(item.titulo); setEd(false); } }} aria-label="Título" />;
  return <button type="button" className={`pl-titulo${item.status === "concluida" ? " feito" : ""}`} onClick={() => setEd(true)} title="Clique para editar">{item.titulo}</button>;
}

function Linha({ item, agir, resp, sub = false }) {
  const [aberto, setAberto] = React.useState(false);
  const [novo, setNovo] = React.useState("");
  const [conf, setConf] = React.useState(false);
  const feitas = item.subtarefas.filter((s) => s.status === "concluida").length;
  const addSub = () => { if (!novo.trim()) return; agir({ acao: "criar", pai: item.id, titulo: novo }); setNovo(""); };
  return (
    <li className={`pl-item${sub ? " sub" : ""}`}>
      <div className="pl-linha">
        <Marca item={item} agir={agir} />
        <div className="pl-corpo">
          <Titulo item={item} agir={agir} />
          <div className="pl-meta">
            {item.veioDe ? <span className="pl-chip">veio da semana anterior</span> : null}
            {item.status === "andamento" ? <span className="pl-chip amb">em andamento</span> : null}
            {!sub && item.subtarefas.length ? <span className="pl-chip">{feitas}/{item.subtarefas.length} subtarefas</span> : null}
          </div>
        </div>
        <Resp valor={item.responsavel} lista={resp} onChange={(r) => agir({ acao: "editar", id: item.id, responsavel: r })} />
        {item.status !== "concluida" && !item.subtarefas.length ? (
          <button type="button" className="pl-mini" onClick={() => agir({ acao: "status", id: item.id, status: item.status === "andamento" ? "pendente" : "andamento" })}>{item.status === "andamento" ? "Voltar a pendente" : "Em andamento"}</button>
        ) : null}
        {!sub ? <button type="button" className="pl-mini" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>{aberto ? "Fechar" : "Subtarefas"}</button> : null}
        {conf ? <button type="button" className="pl-mini perigo" onClick={() => agir({ acao: "remover", id: item.id })} onBlur={() => setConf(false)}>Confirmar</button>
          : <button type="button" className="pl-mini" aria-label={`Excluir: ${item.titulo}`} onClick={() => setConf(true)}>Excluir</button>}
      </div>
      {!sub && (aberto || item.subtarefas.length) ? (
        <ul className="pl-subs">
          {item.subtarefas.map((s) => <Linha key={s.id} item={s} agir={agir} resp={resp} sub />)}
          {aberto ? (
            <li className="pl-nova">
              <input className="pl-input" placeholder="Nova subtarefa" value={novo} maxLength={300} onChange={(e) => setNovo(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addSub(); }} aria-label="Nova subtarefa" />
              <button type="button" className="btn" onClick={addSub}>Adicionar</button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </li>
  );
}

function Barra({ t, cor = "var(--ok)" }) {
  return (
    <span className="pl-barra" title={`${t.concluidas} concluídas, ${t.andamento} em andamento, ${t.pendentes} pendentes`}>
      <i style={{ width: `${t.total ? (t.concluidas / t.total) * 100 : 0}%`, background: cor }} />
      <i style={{ width: `${t.total ? (t.andamento / t.total) * 100 : 0}%`, background: "var(--warn)" }} />
    </span>
  );
}

function Kpi({ rotulo, t }) {
  return (
    <div className="kpi">
      <span>{rotulo}</span>
      <b>{t.total ? pct(t.taxa) : "—"}</b>
      <small>{t.total ? `${t.concluidas} de ${t.total} concluídas` : "nada planejado"}</small>
      <Barra t={t} />
    </div>
  );
}

function Historico({ d, ir }) {
  const [h, setH] = React.useState(null);
  const sem = d.historico;
  return (
    <section className="panel">
      <h2>Histórico e taxa de conclusão</h2>
      <p className="muted">Cada coluna é uma semana. Passe o mouse para ver os números e clique para abrir a semana.</p>
      <div className="pl-hist" onMouseLeave={() => setH(null)}>
        {sem.map((s, i) => (
          <button key={s.semana} type="button" className={`pl-col${s.semana === d.semana ? " on" : ""}`} onMouseEnter={() => setH(i)} onFocus={() => setH(i)} onClick={() => ir(s.semana)}
            aria-label={`Semana de ${dm(s.semana)}: ${s.total ? pct(s.taxa) : "sem itens"}`}>
            <span className="pl-col-v">{s.total ? pct(s.taxa) : "—"}</span>
            <span className="pl-col-t"><i style={{ height: `${s.total ? Math.max(3, s.taxa * 100) : 0}%` }} /></span>
            <span className="pl-col-d">{dm(s.semana)}</span>
          </button>
        ))}
      </div>
      {h != null ? (
        <p className="pl-hist-det">
          <strong>{dm(sem[h].semana)} a {dm(somaDias(sem[h].semana, 6))}:</strong> {sem[h].concluidas} de {sem[h].total} concluídas ({sem[h].total ? pct(sem[h].taxa) : "—"}) · posts {sem[h].posts.concluidas}/{sem[h].posts.total} · tarefas {sem[h].tarefas.concluidas}/{sem[h].tarefas.total} · {sem[h].pendentes + sem[h].andamento} ficaram abertas
        </p>
      ) : <p className="pl-hist-det muted">Acumulado até hoje: {d.acumulado.geral.concluidas} de {d.acumulado.geral.total} concluídas ({d.acumulado.geral.total ? pct(d.acumulado.geral.taxa) : "—"}).</p>}
      {d.acumulado.porResponsavel.length ? (
        <div className="seo-scroll">
          <table className="seo-tab">
            <thead><tr><th>Responsável (acumulado)</th><th className="num">Concluídas</th><th className="num">Em andamento</th><th className="num">Pendentes</th><th className="num">Taxa</th><th style={{ width: "30%" }} /></tr></thead>
            <tbody>{d.acumulado.porResponsavel.map((r) => <tr key={r.nome}><td>{r.nome}</td><td className="num">{r.concluidas}</td><td className="num">{r.andamento}</td><td className="num">{r.pendentes}</td><td className="num"><strong>{pct(r.taxa)}</strong></td><td><Barra t={r} /></td></tr>)}</tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

export function Planejamento() {
  const { live } = useBrain();
  const [d, setD] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [filtro, setFiltro] = React.useState("todas");
  const [quem, setQuem] = React.useState("");
  const [tarefa, setTarefa] = React.useState({ titulo: "", responsavel: "" });
  const [post, setPost] = React.useState({ titulo: "", dia: "0", formato: "carrossel", responsavel: "" });
  const ir = React.useCallback((semana) => {
    if (!live) return;
    api.planejamento(semana).then((x) => { setD(x); setErro(null); }).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, [live]);
  React.useEffect(() => { ir(); }, [ir]);
  const agir = async (corpo) => {
    try { setD(await api.planejamentoAcao({ semana: d.semana, ...corpo })); return true; }
    catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); return false; }
  };
  if (!live) return <p className="empty">O planejamento aparece quando o Brain está conectado.</p>;
  if (erro) return <p className="empty">{erro}</p>;
  if (!d) return <p className="empty">Carregando…</p>;
  const passa = (i) => (filtro === "todas" || (filtro === "abertas" ? i.status !== "concluida" : i.status === "concluida")) && (!quem || i.responsavel === quem || i.subtarefas.some((s) => s.responsavel === quem));
  const tarefas = d.tarefas.filter(passa), posts = d.posts.filter(passa);
  const addTarefa = async () => { if (tarefa.titulo.trim() && await agir({ acao: "criar", tipo: "tarefa", ...tarefa })) setTarefa({ ...tarefa, titulo: "" }); };
  const addPost = async () => { if (post.titulo.trim() && await agir({ acao: "criar", tipo: "post", ...post })) setPost({ ...post, titulo: "", dia: String(Math.min(6, Number(post.dia) + 1)) }); };
  return (
    <div className="page">
      <header className="page-head">
        <h1>Planejamento da semana</h1>
        <p>Os posts de cada dia e as tarefas, com responsável e status. No domingo, monte a semana seguinte e traga o que ficou aberto.</p>
      </header>
      <div className="stack">
        <section className="panel">
          <div className="seo-head">
            <div className="pl-nav">
              <button type="button" className="btn" aria-label="Semana anterior" onClick={() => ir(somaDias(d.semana, -7))}>‹</button>
              <h2>{dm(d.semana)} a {dm(d.fim)}{d.ehAtual ? " · esta semana" : d.semana > d.atual ? " · próxima" : ""}</h2>
              <button type="button" className="btn" aria-label="Próxima semana" onClick={() => ir(somaDias(d.semana, 7))}>›</button>
              {!d.ehAtual ? <button type="button" className="btn" onClick={() => ir(d.atual)}>Ir para esta semana</button> : <button type="button" className="btn" onClick={() => ir(somaDias(d.atual, 7))}>Planejar a próxima</button>}
            </div>
            {d.pendentesAnterior > 0 ? <button type="button" className="btn btn-go" onClick={() => agir({ acao: "trazer_pendentes" })}>Trazer {d.pendentesAnterior} pendente{d.pendentesAnterior > 1 ? "s" : ""} da semana anterior</button> : null}
          </div>
          <div className="kpis seo-kpis" style={{ marginTop: 14 }}>
            <Kpi rotulo="Conclusão da semana" t={d.resumo.geral} />
            <Kpi rotulo="Posts" t={d.resumo.posts} />
            <Kpi rotulo="Tarefas" t={d.resumo.tarefas} />
            <div className="kpi">
              <span>Por responsável</span>
              {d.resumo.porResponsavel.length ? d.resumo.porResponsavel.map((r) => (
                <div key={r.nome} className="pl-resp"><span>{r.nome}</span><Barra t={r} /><strong>{r.concluidas}/{r.total}</strong></div>
              )) : <small>ninguém com item nesta semana</small>}
            </div>
          </div>
          <div className="seo-filtros" style={{ marginTop: 14 }}>
            <div className="seo-chips" role="group">
              {[["todas", "Tudo"], ["abertas", "Pendentes"], ["feitas", "Concluídas"]].map(([id, r]) => <button key={id} type="button" className={filtro === id ? "on" : ""} aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{r}</button>)}
            </div>
            <Resp valor={quem} lista={d.responsaveis} onChange={setQuem} vazio="Todos os responsáveis" />
          </div>
        </section>

        <section className="panel">
          <h2>Posts da semana</h2>
          <div className="pl-dias">
            {DIAS.map((nome, i) => {
              const doDia = posts.filter((p) => p.dia === i);
              return (
                <div key={nome} className={`pl-dia${doDia.length ? "" : " vazio"}`}>
                  <div className="pl-dia-n"><strong>{nome}</strong><span className="muted">{dm(somaDias(d.semana, i))}</span></div>
                  {doDia.length ? <ul className="pl-lista">{doDia.map((p) => (
                    <li key={p.id} className="pl-item">
                      <div className="pl-linha">
                        <Marca item={p} agir={agir} />
                        <div className="pl-corpo"><Titulo item={p} agir={agir} /><div className="pl-meta">{p.status === "andamento" ? <span className="pl-chip amb">em andamento</span> : null}{p.veioDe ? <span className="pl-chip">veio da semana anterior</span> : null}</div></div>
                        <select className="pl-sel" value={p.formato} onChange={(e) => agir({ acao: "editar", id: p.id, formato: e.target.value })} aria-label="Formato">
                          <option value="">formato</option>{FORMATOS.map((f) => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <Resp valor={p.responsavel} lista={d.responsaveis} onChange={(r) => agir({ acao: "editar", id: p.id, responsavel: r })} />
                        {p.status !== "concluida" ? <button type="button" className="pl-mini" onClick={() => agir({ acao: "status", id: p.id, status: p.status === "andamento" ? "pendente" : "andamento" })}>{p.status === "andamento" ? "Voltar a pendente" : "Em andamento"}</button> : null}
                        <button type="button" className="pl-mini" aria-label={`Excluir: ${p.titulo}`} onClick={() => agir({ acao: "remover", id: p.id })}>Excluir</button>
                      </div>
                    </li>
                  ))}</ul> : <span className="muted pl-sem">sem post</span>}
                </div>
              );
            })}
            {posts.filter((p) => p.dia == null).length ? (
              <div className="pl-dia"><div className="pl-dia-n"><strong>Sem dia</strong></div><ul className="pl-lista">{posts.filter((p) => p.dia == null).map((p) => <Linha key={p.id} item={p} agir={agir} resp={d.responsaveis} sub />)}</ul></div>
            ) : null}
          </div>
          <div className="pl-nova">
            <select className="pl-sel" value={post.dia} onChange={(e) => setPost({ ...post, dia: e.target.value })} aria-label="Dia do post">{DIAS.map((n, i) => <option key={n} value={i}>{n}</option>)}</select>
            <input className="pl-input" placeholder="Tema do post" value={post.titulo} maxLength={300} onChange={(e) => setPost({ ...post, titulo: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") addPost(); }} aria-label="Tema do post" />
            <select className="pl-sel" value={post.formato} onChange={(e) => setPost({ ...post, formato: e.target.value })} aria-label="Formato do post">{FORMATOS.map((f) => <option key={f} value={f}>{f}</option>)}</select>
            <Resp valor={post.responsavel} lista={d.responsaveis} onChange={(r) => setPost({ ...post, responsavel: r })} />
            <button type="button" className="btn btn-go" onClick={addPost}>Adicionar post</button>
          </div>
        </section>

        <section className="panel">
          <h2>Tarefas</h2>
          {tarefas.length ? <ul className="pl-lista">{tarefas.map((t) => <Linha key={t.id} item={t} agir={agir} resp={d.responsaveis} />)}</ul>
            : <p className="empty">{d.tarefas.length ? "Nenhuma tarefa com esse filtro." : "Nenhuma tarefa nesta semana. Adicione a primeira abaixo."}</p>}
          <div className="pl-nova">
            <input className="pl-input" placeholder="Nova tarefa" value={tarefa.titulo} maxLength={300} onChange={(e) => setTarefa({ ...tarefa, titulo: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") addTarefa(); }} aria-label="Nova tarefa" />
            <Resp valor={tarefa.responsavel} lista={d.responsaveis} onChange={(r) => setTarefa({ ...tarefa, responsavel: r })} />
            <button type="button" className="btn btn-go" onClick={addTarefa}>Adicionar tarefa</button>
          </div>
        </section>

        <Historico d={d} ir={ir} />
      </div>
    </div>
  );
}
