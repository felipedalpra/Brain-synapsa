// @ts-nocheck
// Aba Instagram: fila dos posts prontos que a sessão agendada do Claude entrega. Você aprova, edita a legenda ou rejeita.
import * as React from "react";
import { api } from "../api";
import { useBrain } from "../store";
import { avisos } from "./Avisos";

const quando = (ms) => new Date(ms).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
const ROTULO = { pendente: "Aguardando você", aprovado: "Aprovado, na agenda", rejeitado: "Rejeitado", publicado: "Publicado", falhou: "Falhou ao publicar" };
const MATURIDADE = { existe: "Mostra o que já existe", piloto: "Fala de piloto", plano: "Fala de plano futuro", educativo: "Educativo" };

function Post({ p, agir, ocupado }) {
  const [i, setI] = React.useState(0);
  const [editando, setEditando] = React.useState(false);
  const [legenda, setLegenda] = React.useState(p.legenda);
  const [motivo, setMotivo] = React.useState("");
  const [rejeitando, setRejeitando] = React.useState(false);
  const n = p.midias.length;
  const vencido = p.agendadoPara <= Date.now();
  return (
    <article className={`ig-post ig-${p.status}`}>
      <div className="ig-visor">
        {n ? <img src={p.midias[i]} alt={`Slide ${i + 1} de ${n}: ${p.tema}`} loading="lazy" /> : <p className="empty">Imagens removidas.</p>}
        {n > 1 ? (
          <div className="ig-nav">
            <button type="button" aria-label="Slide anterior" disabled={i === 0} onClick={() => setI(i - 1)}>‹</button>
            <span>{i + 1} / {n}</span>
            <button type="button" aria-label="Próximo slide" disabled={i === n - 1} onClick={() => setI(i + 1)}>›</button>
          </div>
        ) : null}
        {n > 1 ? <div className="ig-tira">{p.midias.map((m, k) => <button key={m} type="button" className={k === i ? "on" : ""} aria-label={`Ver slide ${k + 1}`} onClick={() => setI(k)}><img src={m} alt="" loading="lazy" /></button>)}</div> : null}
      </div>
      <div className="ig-info">
        <div className="ig-tags">
          <span className={`ig-status ig-s-${p.status}`}>{ROTULO[p.status]}</span>
          {p.pilar ? <span className="seo-tag">{p.pilar}</span> : null}
          <span className="seo-tag" style={{ "--c": p.maturidade === "plano" || p.maturidade === "piloto" ? "var(--warn)" : "var(--ok)" }}>{MATURIDADE[p.maturidade] ?? p.maturidade}</span>
        </div>
        <h3>{p.tema}</h3>
        <p className="muted">{p.status === "publicado" ? `Publicado ${quando(p.publicadoEm)}` : `Agendado para ${quando(p.agendadoPara)}`}{p.permalink ? <> · <a href={p.permalink} target="_blank" rel="noreferrer">ver no Instagram</a></> : null}</p>
        {p.erro ? <p className="ig-erro">{p.erro}</p> : null}
        {editando ? (
          <>
            <textarea className="ig-legenda-edit" value={legenda} onChange={(e) => setLegenda(e.target.value)} rows={10} maxLength={2200} aria-label="Legenda" />
            <div className="ig-acoes">
              <button type="button" className="btn btn-go" disabled={ocupado} onClick={async () => { if (await agir(p.id, "legenda", { legenda })) setEditando(false); }}>Salvar legenda</button>
              <button type="button" className="btn" onClick={() => { setLegenda(p.legenda); setEditando(false); }}>Cancelar</button>
            </div>
          </>
        ) : <p className="ig-legenda">{p.legenda}</p>}
        {p.creditos ? <p className="muted ig-creditos">Fotos: {p.creditos}</p> : null}
        {rejeitando ? (
          <div className="ig-acoes">
            <input type="text" className="seo-busca" style={{ flex: 1 }} placeholder="Por que não? (ensina os próximos posts)" value={motivo} onChange={(e) => setMotivo(e.target.value)} aria-label="Motivo da rejeição" />
            <button type="button" className="btn" disabled={ocupado} onClick={() => agir(p.id, "rejeitar", { motivo })}>Confirmar rejeição</button>
            <button type="button" className="btn" onClick={() => setRejeitando(false)}>Voltar</button>
          </div>
        ) : !editando && (p.status === "pendente" || p.status === "aprovado" || p.status === "falhou") ? (
          <div className="ig-acoes">
            {p.status === "pendente" ? <button type="button" className="btn btn-go" disabled={ocupado} onClick={() => agir(p.id, "aprovar", {})}>{vencido ? "Aprovar" : "Aprovar para a data"}</button> : null}
            {p.status === "pendente" ? <button type="button" className="btn" disabled={ocupado} onClick={() => agir(p.id, "aprovar", { publicarAgora: true })}>Aprovar e publicar agora</button> : null}
            {p.status === "aprovado" ? <button type="button" className="btn" disabled={ocupado} onClick={() => agir(p.id, "publicar", {})}>Publicar agora</button> : null}
            {p.status === "falhou" ? <button type="button" className="btn" disabled={ocupado} onClick={() => agir(p.id, "publicar", {})}>Tentar de novo</button> : null}
            <button type="button" className="btn" onClick={() => setEditando(true)}>Editar legenda</button>
            <button type="button" className="btn" onClick={() => setRejeitando(true)}>Rejeitar</button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function Instagram() {
  const { live } = useBrain();
  const [d, setD] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [ocupado, setOcupado] = React.useState(false);
  const [filtro, setFiltro] = React.useState("fila");
  const carregar = React.useCallback(() => {
    if (!live) return;
    api.instagram().then((x) => { setD(x); setErro(null); }).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, [live]);
  React.useEffect(() => { carregar(); }, [carregar]);
  const agir = async (id, acao, corpo) => {
    setOcupado(true);
    try {
      const r = await api.instagramAcao(id, acao, corpo);
      setD(r);
      avisos.push({ kind: "ok", title: r.message || (acao === "aprovar" ? "Aprovado." : acao === "rejeitar" ? "Rejeitado." : acao === "legenda" ? "Legenda salva." : "Feito.") });
      return true;
    } catch (e) {
      avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." });
      carregar();
      return false;
    } finally { setOcupado(false); }
  };
  const auto = async (ligado) => {
    try { setD(await api.instagramAuto(ligado)); } catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); }
  };
  if (!live) return <p className="empty">O Instagram aparece quando o Brain está conectado.</p>;
  if (erro) return <p className="empty">{erro}</p>;
  if (!d) return <p className="empty">Carregando…</p>;
  const grupos = { fila: d.posts.filter((p) => p.status === "pendente" || p.status === "falhou"), agenda: d.posts.filter((p) => p.status === "aprovado"), publicados: d.posts.filter((p) => p.status === "publicado"), rejeitados: d.posts.filter((p) => p.status === "rejeitado") };
  const lista = grupos[filtro];
  return (
    <div className="stack">
      <section className="panel">
        <div className="seo-head">
          <h2>Instagram</h2>
          <label className="seo-check"><input type="checkbox" checked={d.auto} onChange={(e) => auto(e.target.checked)} /> Publicar sozinho (sem esperar minha aprovação)</label>
        </div>
        <p className="muted">
          Os posts chegam prontos toda semana, criados a partir do posicionamento da Synapsa. {d.auto
            ? "Automático ligado: o que ficar 12 horas na fila sem você rejeitar é publicado no horário agendado, no máximo 1 por dia."
            : "Nada vai ao ar sem a sua aprovação. Aprovado, o post sai sozinho no horário agendado."}
        </p>
        {!d.configurado ? <p className="ig-erro">Falta o token da Meta ou o ID do Instagram nos segredos do Brain: sem isso não dá para publicar.</p> : null}
        <div className="subtabs" role="tablist">
          {[["fila", "Para aprovar"], ["agenda", "Na agenda"], ["publicados", "Publicados"], ["rejeitados", "Rejeitados"]].map(([id, r]) => (
            <button key={id} type="button" role="tab" aria-selected={filtro === id} className={filtro === id ? "on" : ""} onClick={() => setFiltro(id)}>{r} ({grupos[id].length})</button>
          ))}
        </div>
      </section>
      {lista.length === 0 ? <p className="empty">{filtro === "fila" ? "Nenhum post esperando você." : "Nada aqui ainda."}</p> : lista.map((p) => <Post key={p.id + p.status + p.legenda.length} p={p} agir={agir} ocupado={ocupado} />)}
    </div>
  );
}
