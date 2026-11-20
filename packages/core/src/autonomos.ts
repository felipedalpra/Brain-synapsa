// Psicólogos autônomos achados na internet (Google Maps + site): entram na sequência de 5 e-mails do antigo "Fluxo Comercial v3".
// Abordagem fria: base legítimo interesse (contato profissional público), remetente de prospecção, limite diário próprio,
// cada e-mail vira rascunho para o seu OK e a pessoa sai da sequência ao responder, pedir para sair ou ser recusada.
import type { Brain } from "./brain";
import { AUT_ESPERAS as CAD_ESPERAS, AUT_TOTAL as CAD_TOTAL, montarAutonomo } from "./autonomos-email";
import { emailsResumo } from "./prospeccao-email";
import { row, rows, run } from "./sql";

const DAY = 86_400_000;
const AGENTE = "prospeccao";
const GENERICO = /^(consult[oó]rio|espa[cç]o|cl[ií]nica|atendimento|psicologia|psic[oó]log[oa]s|centro|instituto|n[uú]cleo|terapia)$/i;

/** "Dra. Maria Souza - Psicóloga Clínica" vira "Maria". Sem nome pessoal reconhecível, vira "" (o e-mail abre só com "Olá"). */
export function nomeAutonomo(nome: string): string {
  let n = nome.split(/\s[-–|·]\s/)[0]!.trim();
  for (let i = 0; i < 3; i++) n = n.replace(/^(dr\.?|dra\.?|psic[oó]log[oa]|psi\.?|psic\.?|prof\.?|profa\.?)\s+/i, "").trim();
  const primeiro = n.split(/\s+/)[0] ?? "";
  if (!/^\p{L}{2,}$/u.test(primeiro) || GENERICO.test(primeiro)) return "";
  return primeiro.charAt(0).toUpperCase() + primeiro.slice(1).toLowerCase();
}

export interface AutonomosConfig { ativo: boolean }
export const autonomosConfig = (brain: Brain): AutonomosConfig => ({ ativo: brain.policy<Partial<AutonomosConfig>>("prospect_autonomos", {}).ativo === true });
export function autonomosAtivar(brain: Brain, ativo: boolean): AutonomosConfig {
  brain.setPolicy("prospect_autonomos", { ativo });
  brain.audit("voce", ativo ? "autonomos_on" : "autonomos_off");
  brain.emit("change");
  return autonomosConfig(brain);
}

const chave = (id: number, etapa: number) => `aut-${id}-e${etapa}`;
const minDias = (brain: Brain) => Math.max(0, Number(brain.policy<{ min_days_between?: number }>("contact_policy", { min_days_between: 3 }).min_days_between ?? 3));
const suprimido = (brain: Brain, email: string) => !!row(brain.db, "select 1 as x from email_suppression where email = ?", email.toLowerCase());

interface Estado { etapa: number; status: string; enviadoEm: number | null }
/** Último e-mail de cada pessoa: qual etapa, em que situação e quando saiu. */
function estados(brain: Brain): Map<number, Estado> {
  const m = new Map<number, Estado>();
  for (const r of rows<{ k: string; st: string; at: number | null }>(brain.db, "select pr.dedupe_key as k, pr.status as st, (select max(e.at) from envios e where e.proposal_id = pr.id and e.status = 'enviado') as at from proposals pr where pr.dedupe_key like 'aut-%'")) {
    const x = /^aut-(\d+)-e(\d)$/.exec(r.k);
    if (!x) continue;
    const id = Number(x[1]), etapa = Number(x[2]);
    const cur = m.get(id);
    if (!cur || etapa > cur.etapa) m.set(id, { etapa, status: r.st, enviadoEm: r.at });
  }
  return m;
}

interface Alvo { id: number; nome: string; cidade: string | null; uf: string | null; email: string; nota: number; site: string | null; whatsapp_no_site: number | null; respondeu: number | null; sair: number | null }
const alvosSql = `select p.id, p.nome, p.cidade, p.uf, p.email, p.nota, p.site, p.whatsapp_no_site, c.respondeu, c.sair from prospects p join prospect_autonomo a on a.prospect_id = p.id
  left join prospect_contato c on c.prospect_id = p.id where p.email is not null and p.status in ('qualificado', 'no_crm') order by p.nota desc, p.id`;

/** Cria os rascunhos que venceram. Só roda com os autônomos ligados. Seguro de chamar várias vezes. */
export function gerarAutonomos(brain: Brain): { novos: number; followups: number } {
  if (!autonomosConfig(brain).ativo) return { novos: 0, followups: 0 };
  const agora = brain.clock();
  const min = minDias(brain);
  const st = estados(brain);
  const limiteNovos = Math.max(1, Number(brain.policy("autonomo_novos_dia", 10)));
  let novosHoje = row<{ n: number }>(brain.db, "select count(*) as n from proposals where dedupe_key like 'aut-%-e1' and created_at > ?", agora - DAY)?.n ?? 0;
  let novos = 0, followups = 0;
  for (const a of rows<Alvo>(brain.db, alvosSql)) {
    const parou = !!(a.respondeu || a.sair) || suprimido(brain, a.email);
    const ult = st.get(a.id);
    if (parou) {
      // Quem respondeu ou saiu não recebe o rascunho que já estava na fila.
      if (ult && ult.status === "pendente") for (const r of rows<{ id: string }>(brain.db, "select id from proposals where status = 'pendente' and dedupe_key like ?", `aut-${a.id}-e%`)) brain.decide(r.id, "rejeitada", "sistema");
      continue;
    }
    let etapa: number;
    if (!ult) { if (novosHoje >= limiteNovos) continue; etapa = 1; }
    else {
      if (ult.status === "rejeitada" || ult.etapa >= CAD_TOTAL || ult.enviadoEm === null) continue; // recusado, concluído ou esperando o seu OK
      if (agora - ult.enviadoEm < Math.max(CAD_ESPERAS[ult.etapa]!, min) * DAY) continue;
      etapa = ult.etapa + 1;
    }
    const host = (() => { try { return a.site ? new URL(a.site.startsWith("http") ? a.site : `https://${a.site}`).hostname.replace(/^www\./, "") : null; } catch { return null; } })();
    const m = montarAutonomo({ nome: nomeAutonomo(a.nome), cidade: a.cidade, siteHost: host, whatsapp: a.whatsapp_no_site === 1 }, etapa as 1 | 2 | 3 | 4 | 5);
    const email = a.email.toLowerCase();
    const id = brain.addProposal({
      agentId: AGENTE, kind: "prospeccao_autonomo", channel: "email", risk: "medio", impactoBrl: 79,
      title: `Autônomo ${etapa}/${CAD_TOTAL}: ${nomeAutonomo(a.nome) || a.nome.slice(0, 40)}`,
      draft: m.corpo,
      why: `Psicólogo autônomo com CRP e e-mail profissional públicos no próprio site${a.cidade ? ` (${a.cidade})` : ""}. E-mail ${etapa} de ${CAD_TOTAL}. Base: legítimo interesse B2B, com saída (SAIR) no rodapé. Para quando responde, pede para sair ou você recusa.`,
      contactRef: email,
      payload: { envio: { tipo: "email", para: email, assunto: m.assunto, remetente: "prospeccao", perfil: "autonomo", html: true }, prospeccao: { prospectId: a.id, etapa }, base: "legitimo_interesse_b2b" },
      dedupeKey: chave(a.id, etapa),
    });
    if (id) { if (etapa === 1) { novos++; novosHoje++; } else followups++; }
  }
  if (novos + followups) brain.emit("change");
  return { novos, followups };
}

export interface AutonomoLinha { id: number; nome: string; cidade: string | null; email: string; etapa: number; situacao: string; proximo: number | null }
export interface AutonomosPainel {
  ativo: boolean; descobertos: number; qualificados: number; revisar: number; comEmailSemCrp: number;
  porEtapa: number[]; concluidos: number; responderam: number; sairam: number;
  emails: { enviadosHoje: number; capDia: number; enviadosTotal: number };
  pendentes: { id: string; nome: string; para: string; assunto: string; corpo: string; etapa: number }[];
  leads: AutonomoLinha[];
}

export function autonomosPainel(brain: Brain): AutonomosPainel {
  const min = minDias(brain);
  const st = estados(brain);
  const cont = (sql: string) => row<{ n: number }>(brain.db, sql)?.n ?? 0;
  const porEtapa = Array.from({ length: CAD_TOTAL + 1 }, () => 0);
  let responderam = 0, sairam = 0;
  const leads = rows<Alvo>(brain.db, alvosSql).map((a): AutonomoLinha => {
    const ult = st.get(a.id);
    const enviada = ult && ult.enviadoEm !== null ? ult.etapa : ult && ult.etapa > 1 ? ult.etapa - 1 : 0;
    porEtapa[enviada] = (porEtapa[enviada] ?? 0) + 1;
    let situacao: string, proximo: number | null = null;
    if (a.respondeu) { responderam++; situacao = "respondeu"; }
    else if (a.sair || suprimido(brain, a.email)) { sairam++; situacao = "pediu para sair"; }
    else if (ult?.status === "rejeitada") situacao = "rascunho recusado ou barrado";
    else if (ult && ult.etapa >= CAD_TOTAL && ult.enviadoEm !== null) situacao = "sequência concluída";
    else if (!ult) { situacao = "aguardando o 1º e-mail"; proximo = 0; }
    else if (ult.enviadoEm === null) situacao = `e-mail ${ult.etapa} esperando o seu OK`;
    else { situacao = `${ult.etapa} de ${CAD_TOTAL} enviados`; proximo = ult.enviadoEm + Math.max(CAD_ESPERAS[ult.etapa]!, min) * DAY; }
    return { id: a.id, nome: a.nome, cidade: a.cidade, email: a.email, etapa: enviada, situacao, proximo };
  });
  const pendentes = rows<{ id: string; draft: string | null; payload: string }>(brain.db, "select id, draft, payload from proposals where status = 'pendente' and kind = 'prospeccao_autonomo' order by created_at, id limit 100").flatMap((r) => {
    try {
      const pl = JSON.parse(r.payload) as { envio?: { para?: string; assunto?: string }; prospeccao?: { prospectId?: number; etapa?: number } };
      const pid = pl.prospeccao?.prospectId;
      return pid && pl.envio?.para ? [{ id: r.id, nome: row<{ nome: string }>(brain.db, "select nome from prospects where id = ?", pid)?.nome ?? "", para: pl.envio.para, assunto: pl.envio.assunto ?? "", corpo: r.draft ?? "", etapa: pl.prospeccao?.etapa ?? 1 }] : [];
    } catch { return []; }
  });
  return {
    ativo: autonomosConfig(brain).ativo,
    descobertos: cont("select count(*) as n from prospect_autonomo"),
    qualificados: cont("select count(*) as n from prospects p join prospect_autonomo a on a.prospect_id = p.id where p.status in ('qualificado','no_crm')"),
    revisar: cont("select count(*) as n from prospects p join prospect_autonomo a on a.prospect_id = p.id where p.status = 'revisar'"),
    comEmailSemCrp: cont("select count(*) as n from prospects p join prospect_autonomo a on a.prospect_id = p.id where p.status = 'revisar' and p.email is not null"),
    porEtapa, concluidos: porEtapa[CAD_TOTAL] ?? 0, responderam, sairam,
    emails: emailsResumo(brain), pendentes, leads: leads.slice(0, 150),
  };
}
