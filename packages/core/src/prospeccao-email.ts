// E-mail de prospecção: o Brain só escreve rascunhos. Cada um vai para Aprovações e só sai depois do seu OK.
// Modelo fixo (sem IA): previsível, passa pelo compliance e é fácil de ajustar aqui.
import type { Brain } from "./brain";
import { BrainError } from "./brain";
import { sendApproved } from "./dispatch";
import { EMAIL_RE } from "./envio";
import { row, rows, run } from "./sql";

const DAY = 86_400_000;
export const ETAPAS = [0, 3, 7] as const; // dias depois do primeiro e-mail
const AGENTE = "prospeccao";

/** "PSIQUÉ - CLÍNICA DE PSICOLOGIA GRAJAÚ" vira "Psiqué"; corta no primeiro separador e tira o CAPS LOCK. */
export function nomeCurto(nome: string): string {
  let n = nome.split(/\s[-–|·]\s/)[0]!.trim();
  if (n.length > 4 && n === n.toUpperCase()) n = n.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase());
  return n.slice(0, 60);
}

export interface Alvo { id: number; nome: string; cidade: string | null; crp_count: number | null }

export const SITE_CLINICAS = "synapsa.com.br/clinicas";

/** Posicionamento para clínicas: centralizar a operação, tirar processo manual, ganhar tempo, automatizar o administrativo.
 *  Não falar de abandono, adesão ou acompanhamento entre sessões: esse não é o posicionamento da Synapsa. */
export function montarEmail(a: Alvo, etapa: 0 | 1 | 2): { assunto: string; corpo: string } {
  const nome = nomeCurto(a.nome);
  const equipe = (a.crp_count ?? 0) >= 2 ? ` Vi que a equipe tem ${a.crp_count} psicólogos${a.cidade ? ` em ${a.cidade}` : ""}.` : "";
  if (etapa === 0) {
    return {
      assunto: `Menos trabalho manual na operação da ${nome}`,
      corpo: `Olá, pessoal da ${nome}!\n\nSou o Felipe, fundador da Synapsa.${equipe} Em clínicas desse tamanho, boa parte do tempo da equipe vai para tarefas administrativas feitas à mão, com agenda, financeiro, cadastros e controles espalhados em lugares diferentes.\n\nA Synapsa centraliza toda a operação da clínica em uma só plataforma, tira os processos manuais do dia a dia e automatiza as tarefas administrativas, para a equipe gastar menos tempo com burocracia.\n\nVocês podem conhecer em ${SITE_CLINICAS}. Se quiserem ver na prática, posso mostrar em uma demonstração de 30 minutos. É só responder com um dia e horário que funcionem para vocês.\n\nAbraço,\nFelipe Dalpra`,
    };
  }
  if (etapa === 1) {
    return {
      assunto: `Voltando ao meu e-mail sobre a ${nome}`,
      corpo: `Olá, pessoal da ${nome}!\n\nPassando só para retomar meu e-mail de alguns dias atrás. Se centralizar a operação da clínica e reduzir o trabalho manual da equipe é um tema para vocês, dá para ver como funciona em ${SITE_CLINICAS}.\n\nPosso também mostrar na prática em 30 minutos. Me diga qual dia e horário ficam bons.\n\nAbraço,\nFelipe Dalpra`,
    };
  }
  return {
    assunto: `Último contato sobre a ${nome}`,
    corpo: `Olá, pessoal da ${nome}!\n\nEste é meu último e-mail, para não encher a caixa de vocês. Se em algum momento quiserem ver como a Synapsa centraliza a operação e automatiza as tarefas administrativas de uma clínica, o site é ${SITE_CLINICAS}, e a demonstração de 30 minutos é só responder aqui.\n\nDesejo uma ótima semana para a equipe.\n\nAbraço,\nFelipe Dalpra`,
  };
}

const chave = (id: number, etapa: number) => `prosp-${id}-e${etapa}`;

function criar(brain: Brain, a: Alvo & { email: string }, etapa: 0 | 1 | 2): boolean {
  const m = montarEmail(a, etapa);
  const id = brain.addProposal({
    agentId: AGENTE, kind: "prospeccao_email", channel: "email", risk: "medio", impactoBrl: 79,
    title: `${etapa === 0 ? "E-mail de prospecção" : etapa === 1 ? "Follow-up (D+3)" : "Último follow-up (D+7)"}: ${nomeCurto(a.nome)}`,
    draft: m.corpo,
    why: `Clínica qualificada pelo site${a.crp_count ? ` (${a.crp_count} psicólogos com CRP)` : ""}, com e-mail comercial público. Oferece demonstração de 30 minutos. Base: legítimo interesse B2B, com saída (SAIR) no rodapé.`,
    contactRef: a.email.toLowerCase(),
    payload: { envio: { tipo: "email", para: a.email.toLowerCase(), assunto: m.assunto, remetente: "prospeccao" }, prospeccao: { prospectId: a.id, etapa }, base: "legitimo_interesse_b2b" },
    dedupeKey: chave(a.id, etapa),
  });
  return id !== null;
}

/** Rascunhos que ainda esperam o seu OK passam a usar o texto vigente (assim uma mudança de modelo vale para a fila também). */
export function atualizarPendentes(brain: Brain): number {
  let n = 0;
  for (const r of rows<{ id: string; draft: string | null; payload: string }>(brain.db, "select id, draft, payload from proposals where status = 'pendente' and kind = 'prospeccao_email'")) {
    try {
      const pl = JSON.parse(r.payload) as { envio?: { assunto?: string }; prospeccao?: { prospectId?: number; etapa?: number } };
      const pid = pl.prospeccao?.prospectId;
      const etapa = pl.prospeccao?.etapa;
      if (!pid || (etapa !== 0 && etapa !== 1 && etapa !== 2) || !pl.envio) continue;
      const a = row<Alvo>(brain.db, "select id, nome, cidade, crp_count from prospects where id = ?", pid);
      if (!a) continue;
      const m = montarEmail(a, etapa);
      if (m.corpo === r.draft && m.assunto === pl.envio.assunto) continue;
      pl.envio.assunto = m.assunto;
      run(brain.db, "update proposals set draft = ?, payload = ? where id = ?", m.corpo, JSON.stringify(pl), r.id);
      n++;
    } catch { /* rascunho ilegível fica como está */ }
  }
  return n;
}

const suprimido = (brain: Brain, email: string) => !!row(brain.db, "select 1 as x from email_suppression where email = ?", email.toLowerCase());

/** Cria rascunhos do primeiro e-mail e dos follow-ups que já venceram. Seguro de chamar várias vezes. */
export function gerarRascunhos(brain: Brain): { novos: number; followups: number } {
  atualizarPendentes(brain);
  const agora = brain.clock();
  let novos = 0, followups = 0;
  const alvos = rows<Alvo & { email: string; respondeu: number | null; sair: number | null }>(brain.db,
    `select p.id, p.nome, p.cidade, p.crp_count, p.email, c.respondeu, c.sair from prospects p left join prospect_contato c on c.prospect_id = p.id
     where p.email is not null and p.crp_count >= 4 and p.status in ('qualificado', 'no_crm') order by p.nota desc, p.id`);
  const enviados = new Map<string, number>(); // chave -> quando saiu
  for (const r of rows<{ k: string; at: number }>(brain.db, "select pr.dedupe_key as k, e.at as at from proposals pr join envios e on e.proposal_id = pr.id where e.status = 'enviado' and pr.dedupe_key like 'prosp-%'")) enviados.set(r.k, r.at);
  for (const a of alvos) {
    if (a.respondeu || a.sair || !EMAIL_RE.test(a.email) || suprimido(brain, a.email)) continue;
    if (!enviados.has(chave(a.id, 0))) { if (criar(brain, a, 0)) novos++; continue; }
    const t0 = enviados.get(chave(a.id, 0))!;
    if (!enviados.has(chave(a.id, 1)) && agora - t0 >= ETAPAS[1] * DAY) { if (criar(brain, a, 1)) followups++; continue; }
    if (enviados.has(chave(a.id, 1)) && !enviados.has(chave(a.id, 2)) && agora - t0 >= ETAPAS[2] * DAY) { if (criar(brain, a, 2)) followups++; }
  }
  if (novos + followups) brain.emit("change");
  return { novos, followups };
}

export function marcarContato(brain: Brain, prospectId: number, acao: "respondeu" | "sair"): void {
  const p = row<{ email: string | null }>(brain.db, "select email from prospects where id = ?", prospectId);
  if (!p) throw new BrainError("not_found", "Clínica não encontrada.");
  const agora = brain.clock();
  run(brain.db, "insert into prospect_contato (prospect_id, respondeu, sair, atualizado_em) values (?, ?, ?, ?) on conflict(prospect_id) do update set respondeu = max(respondeu, excluded.respondeu), sair = max(sair, excluded.sair), atualizado_em = excluded.atualizado_em", prospectId, acao === "respondeu" ? 1 : 0, acao === "sair" ? 1 : 0, agora);
  if (acao === "sair" && p.email) run(brain.db, "insert into email_suppression (email, reason, at) values (?, 'pediu para sair', ?) on conflict(email) do update set reason = excluded.reason, at = excluded.at", p.email.toLowerCase(), agora);
  // Rascunhos pendentes dessa clínica deixam de fazer sentido.
  for (const r of rows<{ id: string }>(brain.db, "select id from proposals where status = 'pendente' and dedupe_key like ?", `prosp-${prospectId}-e%`)) brain.decide(r.id, "rejeitada", "sistema");
  brain.audit("voce", acao === "sair" ? "prospeccao_sair" : "prospeccao_respondeu", String(prospectId));
  brain.emit("change");
}

export interface RascunhoView { id: string; prospectId: number; nome: string; para: string; assunto: string; corpo: string; etapa: number }

export function rascunhosPendentes(brain: Brain): RascunhoView[] {
  return rows<{ id: string; draft: string | null; payload: string }>(brain.db, "select id, draft, payload from proposals where status = 'pendente' and kind = 'prospeccao_email' order by created_at, id limit 100").flatMap((r) => {
    try {
      const pl = JSON.parse(r.payload) as { envio?: { para?: string; assunto?: string }; prospeccao?: { prospectId?: number; etapa?: number } };
      const pid = pl.prospeccao?.prospectId;
      const nome = pid ? row<{ nome: string }>(brain.db, "select nome from prospects where id = ?", pid)?.nome : null;
      return pid && pl.envio?.para ? [{ id: r.id, prospectId: pid, nome: nome ?? "", para: pl.envio.para, assunto: pl.envio.assunto ?? "", corpo: r.draft ?? "", etapa: pl.prospeccao?.etapa ?? 0 }] : [];
    } catch { return []; }
  });
}

export function emailsResumo(brain: Brain): { enviadosHoje: number; capDia: number; enviadosTotal: number } {
  const hoje = row<{ n: number }>(brain.db, "select count(*) as n from envios e join proposals pr on pr.id = e.proposal_id where e.status = 'enviado' and e.at > ? and pr.kind like 'prospeccao%'", brain.clock() - DAY)?.n ?? 0;
  const total = row<{ n: number }>(brain.db, "select count(*) as n from envios e join proposals pr on pr.id = e.proposal_id where e.status = 'enviado' and pr.kind like 'prospeccao%'")?.n ?? 0;
  return { enviadosHoje: hoje, capDia: Number(brain.policy("prospect_email_daily_cap", 10)), enviadosTotal: total };
}

/** Aprova e envia os rascunhos escolhidos (clique seu). Para no primeiro limite ou erro e diz o que saiu. */
export async function aprovarEEnviar(brain: Brain, env: Record<string, string | undefined>, ids: string[], f: typeof fetch = fetch): Promise<{ enviados: number; parou?: string }> {
  if (!ids.length || ids.length > 20) throw new BrainError("invalid", "Escolha de 1 a 20 e-mails por vez.");
  let enviados = 0;
  const r0 = emailsResumo(brain);
  const sobra = Math.max(r0.capDia - r0.enviadosHoje, 0);
  if (sobra === 0) return { enviados, parou: `Limite de ${r0.capDia} e-mails de prospecção por dia atingido. Ele sobe aos poucos para proteger o domínio novo.` };
  for (const id of ids.slice(0, sobra)) {
    const p = row<{ status: string; kind: string }>(brain.db, "select status, kind from proposals where id = ?", id);
    if (!p || p.kind !== "prospeccao_email") continue;
    try {
      if (p.status === "pendente") brain.decide(id, "aprovada");
      await sendApproved(brain, env, id, f);
      enviados++;
    } catch (e) {
      if (e instanceof BrainError) return { enviados, parou: e.message };
      throw e;
    }
  }
  return ids.length > sobra ? { enviados, parou: `Enviei ${enviados}: o limite de hoje é ${r0.capDia}. Os outros ficam na fila para amanhã.` } : { enviados };
}
