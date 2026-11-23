// Contas da equipe: cada pessoa entra com o próprio e-mail e senha e vê e mexe em tudo, como o dono.
// Só o admin cria, redefine e desativa contas. A senha mestre (do servidor) continua valendo como a conta do dono.
import { BrainError, type Brain } from "./brain";
import { conferirSenha, hashSenha, type Usuarios, type UsuarioGuardado } from "./auth";
import { row, rows, run } from "./sql";

interface Linha { id: string; email: string; nome: string; hash: string; papel: "admin" | "membro"; ativo: number; versao: number; precisa_trocar: number; criado_em: number; ultimo_acesso: number | null }
const guardado = (l: Linha): UsuarioGuardado => ({ id: l.id, email: l.email, nome: l.nome, hash: l.hash, papel: l.papel, ativo: l.ativo === 1, versao: l.versao, dono: false, precisaTrocar: l.precisa_trocar === 1 });

export const armazemUsuarios = (brain: Brain): Usuarios => ({
  porEmail: (email) => { const l = row<Linha>(brain.db, "select * from usuarios where email = ?", email.toLowerCase()); return l ? guardado(l) : null; },
  porId: (id) => { const l = row<Linha>(brain.db, "select * from usuarios where id = ?", id); return l ? guardado(l) : null; },
  entrou: (id, quando) => run(brain.db, "update usuarios set ultimo_acesso = ? where id = ?", quando, id),
  nomeDoDono: () => brain.policy<{ nome?: string }>("dono", {}).nome || "Felipe",
});

export interface UsuarioView { id: string; nome: string; email: string; papel: "admin" | "membro"; ativo: boolean; precisaTrocar: boolean; criadoEm: number; ultimoAcesso: number | null }
export function listarUsuarios(brain: Brain): UsuarioView[] {
  return rows<Linha>(brain.db, "select * from usuarios order by ativo desc, nome collate nocase").map((l) => ({ id: l.id, nome: l.nome, email: l.email, papel: l.papel, ativo: l.ativo === 1, precisaTrocar: l.precisa_trocar === 1, criadoEm: l.criado_em, ultimoAcesso: l.ultimo_acesso }));
}

const ALFABETO = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function gerarSenha(): string {
  const b = crypto.getRandomValues(new Uint8Array(12));
  return [...b].map((x) => ALFABETO[x % ALFABETO.length]).join("");
}
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const pegar = (brain: Brain, id: unknown): Linha => {
  const l = row<Linha>(brain.db, "select * from usuarios where id = ?", String(id ?? ""));
  if (!l) throw new BrainError("not_found", "Usuário não encontrado.");
  return l;
};

/** Ações do admin. Devolve a senha temporária uma única vez (criar e redefinir); depois ela só existe como hash. */
export async function usuarioAcao(brain: Brain, body: Record<string, unknown>): Promise<{ usuarios: UsuarioView[]; senhaTemporaria?: string; email?: string }> {
  const acao = String(body.acao ?? "");
  let temp: string | undefined, email: string | undefined;
  if (acao === "criar") {
    const nome = String(body.nome ?? "").trim().slice(0, 80);
    email = String(body.email ?? "").trim().toLowerCase();
    if (!nome) throw new BrainError("invalid", "Escreva o nome.");
    if (!EMAIL.test(email)) throw new BrainError("invalid", "E-mail inválido.");
    if (row(brain.db, "select 1 from usuarios where email = ?", email)) throw new BrainError("invalid", "Já existe uma conta com esse e-mail.");
    temp = gerarSenha();
    const id = crypto.randomUUID().slice(0, 12);
    run(brain.db, "insert into usuarios (id, email, nome, hash, papel, criado_em) values (?, ?, ?, ?, ?, ?)", id, email, nome, await hashSenha(temp), body.papel === "admin" ? "admin" : "membro", brain.clock());
    brain.audit("voce", "usuario_criado", id, { email, papel: body.papel === "admin" ? "admin" : "membro" });
  } else if (acao === "redefinir_senha") {
    const l = pegar(brain, body.id);
    temp = gerarSenha();
    email = l.email;
    run(brain.db, "update usuarios set hash = ?, versao = versao + 1, precisa_trocar = 1 where id = ?", await hashSenha(temp), l.id);
    brain.audit("voce", "usuario_senha_redefinida", l.id);
  } else if (acao === "desativar" || acao === "reativar") {
    const l = pegar(brain, body.id);
    run(brain.db, "update usuarios set ativo = ?, versao = versao + 1 where id = ?", acao === "reativar" ? 1 : 0, l.id);
    brain.audit("voce", acao === "reativar" ? "usuario_reativado" : "usuario_desativado", l.id);
  } else if (acao === "papel") {
    const l = pegar(brain, body.id);
    run(brain.db, "update usuarios set papel = ? where id = ?", body.papel === "admin" ? "admin" : "membro", l.id);
    brain.audit("voce", "usuario_papel", l.id, { papel: body.papel });
  } else throw new BrainError("invalid", "Ação desconhecida.");
  brain.emit("change");
  return { usuarios: listarUsuarios(brain), ...(temp ? { senhaTemporaria: temp, email } : {}) };
}

/** A própria pessoa troca a senha. Sobe a versão (derruba os outros aparelhos); quem chama emite um cookie novo. */
export async function trocarSenha(brain: Brain, id: string, atual: string, nova: string): Promise<number> {
  const l = pegar(brain, id);
  if (!(await conferirSenha(atual, l.hash))) throw new BrainError("invalid", "A senha atual não confere.");
  if (nova.length < 8) throw new BrainError("invalid", "A nova senha precisa de pelo menos 8 caracteres.");
  if (nova === atual) throw new BrainError("invalid", "Escolha uma senha diferente da atual.");
  run(brain.db, "update usuarios set hash = ?, versao = versao + 1, precisa_trocar = 0 where id = ?", await hashSenha(nova), l.id);
  brain.audit(l.nome, "senha_trocada", l.id);
  return l.versao + 1;
}
