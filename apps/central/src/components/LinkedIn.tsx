// @ts-nocheck
// Aba LinkedIn: o Brain escreve o post (segunda, quarta e sexta), você revisa, edita e aprova. Aprovado, ele publica na página da Synapsa.
import * as React from "react";
import { api } from "../api";
import { useBrain } from "../store";
import { avisos } from "./Avisos";

const quando = (ms) => new Date(ms).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const ROTULO = { pendente: "Aguardando você", aprovado: "Aprovado", rejeitado: "Rejeitado", publicado: "Publicado", falhou: "Falhou ao publicar" };

function Post({ p, agir, ocupado, configurado }) {
  const [editando, setEditando] = React.useState(false);
  const [texto, setTexto] = React.useState(p.texto);
  const [motivo, setMotivo] = React.useState("");
  const [rejeitando, setRejeitando] = React.useState(false);
  const copiar = async () => {
    try { await navigator.clipboard.writeText(p.texto); avisos.push({ kind: "ok", title: "Texto copiado." }); } catch { avisos.push({ kind: "erro", title: "Não consegui copiar: selecione o texto à mão." }); }
  };
  const aberto = p.status === "pendente" || p.status === "aprovado" || p.status === "falhou";
  return (
    <article className={`ig-post li-post ig-${p.status}`}>
      <div className="ig-info">
        <div className="ig-tags">
          <span className={`ig-status ig-s-${p.status}`}>{ROTULO[p.status]}</span>
          <span className="seo-tag">{p.categoria}</span>
        </div>
        <p className="muted">
          {p.status === "publicado" ? `${p.manual ? "Marcado como postado" : "Publicado"} ${quando(p.publicadoEm)}` : `Escrito ${quando(p.criadoEm)}`}
          {p.permalink ? <> · <a href={p.permalink} target="_blank" rel="noreferrer">ver no LinkedIn</a></> : null}
        </p>
        {p.erro ? <p className="ig-erro">{p.erro}</p> : null}
        {editando ? (
          <>
            <textarea className="ig-legenda-edit" value={texto} onChange={(e) => setTexto(e.target.value)} rows={14} maxLength={3000} aria-label="Texto do post" />
            <div className="ig-acoes">
              <button type="button" className="btn btn-go" disabled={ocupado} onClick={async () => { if (await agir(p.id, "texto", { texto })) setEditando(false); }}>Salvar texto</button>
              <button type="button" className="btn" onClick={() => { setTexto(p.texto); setEditando(false); }}>Cancelar</button>
            </div>
          </>
        ) : <p className="ig-legenda" style={{ maxHeight: "none" }}>{p.texto}</p>}
        <p className="muted">{p.texto.length} caracteres</p>
        {rejeitando ? (
          <div className="ig-acoes">
            <input type="text" className="seo-busca" style={{ flex: 1 }} placeholder="Por que não?" value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Motivo da rejeição" />
            <button type="button" className="btn" disabled={ocupado} onClick={() => agir(p.id, "rejeitar", { motivo })}>Confirmar rejeição</button>
            <button type="button" className="btn" onClick={() => setRejeitando(false)}>Voltar</button>
          </div>
        ) : !editando && aberto ? (
          <div className="ig-acoes">
            {p.status === "pendente" && configurado ? <button type="button" className="btn btn-go" disabled={ocupado} onClick={() => agir(p.id, "aprovar", { publicarAgora: true })}>Aprovar e publicar</button> : null}
            {p.status === "pendente" && !configurado ? <button type="button" className="btn btn-go" disabled={ocupado} onClick={() => agir(p.id, "aprovar", {})}>Aprovar</button> : null}
            {(p.status === "aprovado" || p.status === "falhou") && configurado ? <button type="button" className="btn btn-go" disabled={ocupado} onClick={() => agir(p.id, "publicar", {})}>{p.status === "falhou" ? "Tentar de novo" : "Publicar agora"}</button> : null}
            <button type="button" className="btn" onClick={copiar}>Copiar texto</button>
            {!configurado ? <button type="button" className="btn" disabled={ocupado} onClick={() => agir(p.id, "postei", {})}>Já postei</button> : null}
            <button type="button" className="btn" onClick={() => setEditando(true)}>Editar</button>
            <button type="button" className="btn" onClick={() => setRejeitando(true)}>Rejeitar</button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function LinkedIn() {
  const { live } = useBrain();
  const [d, setD] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [ocupado, setOcupado] = React.useState(false);
  const [filtro, setFiltro] = React.useState("fila");
  const carregar = React.useCallback(() => {
    if (!live) return;
    api.linkedin().then((x) => { setD(x); setErro(null); }).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, [live]);
  React.useEffect(() => { carregar(); }, [carregar]);
  const agir = async (id, acao, corpo) => {
    setOcupado(true);
    try {
      const r = await api.linkedinAcao(id, acao, corpo);
      setD(r);
      avisos.push({ kind: "ok", title: r.message || { aprovar: "Aprovado.", rejeitar: "Rejeitado.", texto: "Texto salvo.", postei: "Registrado como publicado." }[acao] || "Feito." });
      return true;
    } catch (e) {
      avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." });
      carregar();
      return false;
    } finally { setOcupado(false); }
  };
  const gerar = async () => {
    setOcupado(true);
    try { const r = await api.linkedinGerar(); setD(r); setFiltro("fila"); avisos.push({ kind: "ok", title: r.message || "Post novo." }); }
    catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); }
    finally { setOcupado(false); }
  };
  const conectar = async () => {
    setOcupado(true);
    try { const r = await api.linkedinConectar(); window.location.href = r.url; }
    catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); setOcupado(false); }
  };
  if (!live) return <p className="empty">O LinkedIn aparece quando o Brain está conectado.</p>;
  if (erro) return <p className="empty">{erro}</p>;
  if (!d) return <p className="empty">Carregando…</p>;
  const grupos = { fila: d.posts.filter((p) => p.status === "pendente" || p.status === "falhou"), aprovados: d.posts.filter((p) => p.status === "aprovado"), publicados: d.posts.filter((p) => p.status === "publicado"), rejeitados: d.posts.filter((p) => p.status === "rejeitado") };
  const lista = grupos[filtro];
  return (
    <div className="stack">
      <section className="panel">
        <div className="seo-head">
          <h2>LinkedIn</h2>
          <button type="button" className="btn" disabled={ocupado || !d.llm} onClick={gerar}>Escrever um post agora</button>
        </div>
        <p className="muted">O Brain escreve um post por {d.diasDePostar}, de manhã, girando entre 5 temas. Nada vai ao ar sem a sua aprovação.</p>
        {!d.llm ? <p className="ig-erro">Falta a chave do modelo (OpenAI ou Anthropic) nos segredos do Brain: sem ela ele não escreve.</p> : null}
        {d.configurado ? (
          <p className="muted">Conectado: publica na página da empresa (organização {d.organizacao}){d.expiraEm ? `. O login vale até ${new Date(d.expiraEm).toLocaleDateString("pt-BR")}.` : "."} <button type="button" className="btn" disabled={ocupado} onClick={conectar}>Reconectar</button></p>
        ) : d.appPronto ? (
          <p className="ig-erro">O LinkedIn ainda não está conectado. <button type="button" className="btn btn-go" disabled={ocupado} onClick={conectar}>Conectar LinkedIn</button> Enquanto isso, copie o texto, poste à mão e toque em "Já postei".</p>
        ) : <p className="ig-erro">Faltam LINKEDIN_CLIENT_ID e LINKEDIN_CLIENT_SECRET nos segredos do Brain.</p>}
        {new URLSearchParams(window.location.search).get("linkedin") === "erro" ? <p className="ig-erro">O login do LinkedIn não completou. Confira se a URL de retorno está cadastrada no app do LinkedIn e tente de novo.</p> : null}
        <div className="subtabs" role="tablist">
          {[["fila", "Para aprovar"], ["aprovados", "Aprovados"], ["publicados", "Publicados"], ["rejeitados", "Rejeitados"]].map(([id, r]) => (
            <button key={id} type="button" role="tab" aria-selected={filtro === id} className={filtro === id ? "on" : ""} onClick={() => setFiltro(id)}>{r} ({grupos[id].length})</button>
          ))}
        </div>
      </section>
      {lista.length === 0 ? <p className="empty">{filtro === "fila" ? "Nenhum post esperando você." : "Nada aqui ainda."}</p> : lista.map((p) => <Post key={p.id + p.status + p.texto.length} p={p} agir={agir} ocupado={ocupado} configurado={d.configurado} />)}
    </div>
  );
}
