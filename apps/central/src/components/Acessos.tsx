// @ts-nocheck
// Acessos da equipe: cada pessoa entra com o próprio e-mail e senha e usa a Central com os mesmos acessos do dono.
import * as React from "react";
import { api } from "../api";
import { avisos } from "./Avisos";

const quando = (ms) => (ms ? new Date(ms).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "nunca entrou");

function MinhaSenha({ eu, aoTrocar }) {
  const [atual, setAtual] = React.useState("");
  const [nova, setNova] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  if (!eu || eu.dono) return <p className="muted">Você entra com a senha mestre do servidor (<code>BRAIN_PASSWORD</code>). Ela é trocada nas configurações do Worker, não aqui.</p>;
  const trocar = async (ev) => {
    ev.preventDefault();
    setBusy(true);
    try { await api.minhaSenha(atual, nova); avisos.push({ kind: "ok", title: "Senha trocada" }); setAtual(""); setNova(""); aoTrocar(); }
    catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); }
    finally { setBusy(false); }
  };
  return (
    <form className="ac-form" onSubmit={trocar}>
      <input type="password" autoComplete="current-password" placeholder="Senha atual" value={atual} onChange={(e) => setAtual(e.target.value)} aria-label="Senha atual" required />
      <input type="password" autoComplete="new-password" placeholder="Nova senha (mínimo 8 caracteres)" value={nova} onChange={(e) => setNova(e.target.value)} aria-label="Nova senha" minLength={8} required />
      <button className="btn btn-go" disabled={busy}>Trocar senha</button>
    </form>
  );
}

function Equipe() {
  const [lista, setLista] = React.useState(null);
  const [erro, setErro] = React.useState(null);
  const [novo, setNovo] = React.useState({ nome: "", email: "", papel: "membro" });
  const [cred, setCred] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [conf, setConf] = React.useState(null);
  React.useEffect(() => { api.usuarios().then((r) => setLista(r.usuarios)).catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar.")); }, []);
  const agir = async (corpo, mostrar = false) => {
    setBusy(true);
    try {
      const r = await api.usuarioAcao(corpo);
      setLista(r.usuarios);
      if (r.senhaTemporaria) setCred({ email: r.email, senha: r.senhaTemporaria, acao: corpo.acao });
      return true;
    } catch (e) { avisos.push({ kind: "erro", title: e instanceof Error ? e.message : "Não deu certo." }); return false; }
    finally { setBusy(false); }
  };
  const criar = async (ev) => { ev.preventDefault(); if (await agir({ acao: "criar", ...novo })) setNovo({ nome: "", email: "", papel: "membro" }); };
  const copiar = async (t) => { try { await navigator.clipboard.writeText(t); avisos.push({ kind: "ok", title: "Copiado" }); } catch { window.prompt("Copie:", t); } };
  if (erro) return <p className="empty">{erro}</p>;
  if (!lista) return <p className="muted">Carregando…</p>;
  const mensagem = cred ? `Seu acesso à Central Synapsa:\n${location.origin}\nE-mail: ${cred.email}\nSenha temporária: ${cred.senha}\nTroque a senha no primeiro acesso (menu Acessos).` : "";
  return (
    <>
      {cred ? (
        <div className="ac-cred" role="status">
          <strong>{cred.acao === "criar" ? "Conta criada." : "Senha redefinida."} Mande isto para a pessoa agora: a senha não aparece de novo.</strong>
          <pre>{mensagem}</pre>
          <div><button type="button" className="btn btn-go" onClick={() => copiar(mensagem)}>Copiar mensagem</button> <a className="btn" href={`https://wa.me/?text=${encodeURIComponent(mensagem)}`} target="_blank" rel="noreferrer">WhatsApp</a> <button type="button" className="btn" onClick={() => setCred(null)}>Já enviei</button></div>
        </div>
      ) : null}
      <table className="ac-tab">
        <thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Último acesso</th><th></th></tr></thead>
        <tbody>
          {lista.map((u) => (
            <tr key={u.id} className={u.ativo ? "" : "off"}>
              <td><b>{u.nome}</b>{!u.ativo ? <span className="pl-chip"> desativado</span> : null}{u.precisaTrocar && u.ativo ? <span className="pl-chip amb"> senha temporária</span> : null}</td>
              <td>{u.email}</td>
              <td>
                <select className="pl-sel" value={u.papel} disabled={busy} onChange={(e) => agir({ acao: "papel", id: u.id, papel: e.target.value })} aria-label={`Papel de ${u.nome}`}>
                  <option value="membro">Membro</option><option value="admin">Administrador</option>
                </select>
              </td>
              <td>{quando(u.ultimoAcesso)}</td>
              <td className="ac-acoes">
                {u.ativo ? (
                  <>
                    <button type="button" className="btn" disabled={busy} onClick={() => agir({ acao: "redefinir_senha", id: u.id })}>Nova senha</button>
                    {conf === u.id
                      ? <button type="button" className="btn perigo" onClick={() => { agir({ acao: "desativar", id: u.id }); setConf(null); }} onBlur={() => setConf(null)} autoFocus>Confirmar</button>
                      : <button type="button" className="btn" onClick={() => setConf(u.id)}>Desativar</button>}
                  </>
                ) : <button type="button" className="btn" disabled={busy} onClick={() => agir({ acao: "reativar", id: u.id })}>Reativar</button>}
              </td>
            </tr>
          ))}
          {!lista.length ? <tr><td colSpan={5} className="muted">Ninguém além de você ainda. Crie a primeira conta abaixo.</td></tr> : null}
        </tbody>
      </table>
      <h3>Nova conta</h3>
      <form className="ac-form" onSubmit={criar}>
        <input placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} aria-label="Nome" required maxLength={80} />
        <input type="email" placeholder="E-mail" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} aria-label="E-mail" required />
        <select className="pl-sel" value={novo.papel} onChange={(e) => setNovo({ ...novo, papel: e.target.value })} aria-label="Papel"><option value="membro">Membro</option><option value="admin">Administrador</option></select>
        <button className="btn btn-go" disabled={busy}>Criar conta</button>
      </form>
      <p className="muted">Membro e administrador veem e mexem em tudo na Central. A diferença é que só o administrador cria, redefine e desativa contas. Desativar derruba o acesso da pessoa na hora.</p>
    </>
  );
}

export function Acessos({ eu, aoTrocar }) {
  return (
    <div className="page">
      <header className="page-head">
        <h1>Acessos</h1>
        <p>{eu ? `Você está como ${eu.nome}${eu.dono ? " (dono)" : eu.papel === "admin" ? " (administrador)" : ""}.` : "Quem entra na Central."}</p>
      </header>
      <div className="stack">
        <section className="panel">
          <h2>Minha senha</h2>
          <MinhaSenha eu={eu} aoTrocar={aoTrocar} />
        </section>
        {eu?.papel === "admin" ? (
          <section className="panel">
            <h2>Equipe</h2>
            <Equipe />
          </section>
        ) : null}
      </div>
    </div>
  );
}
