// Fila diária de WhatsApp: o Brain monta a lista e a mensagem; quem abre o WhatsApp e envia é você, um por um.
// Sem API de WhatsApp de propósito: o envio manual protege o seu número contra banimento.
import { BrainError, brtDay, type Brain } from "./brain";
import { row, rows, run } from "./sql";
import { nomeCurto, SITE_CLINICAS } from "./prospeccao-email";

const DAY = 86_400_000;
export const DIAS_FOLLOWUP = 4;

export interface ItemWhatsapp { prospectId: number; nome: string; cidade: string | null; telefone: string; etapa: 0 | 1; texto: string; link: string; nota: number }
export interface PainelWhatsapp { fila: ItemWhatsapp[]; enviadosHoje: number; capDia: number; restanteHoje: number }

/** Telefone brasileiro → "55DDNNNNNNNNN" (só dígitos). Aceita 10 ou 11 dígitos, com ou sem +55/0. */
export function numeroWhatsapp(tel: string | null | undefined): { numero: string; celular: boolean } | null {
  let d = String(tel ?? "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  d = d.replace(/^0+/, "");
  if (d.length !== 10 && d.length !== 11) return null;
  if (/^(\d)\1+$/.test(d)) return null;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  const celular = d.length === 11 ? d[2] === "9" : /[6-9]/.test(d[2]!);
  if (d.length === 11 && d[2] !== "9") return null;
  return { numero: `55${d}`, celular };
}

export function mensagemWhatsapp(nome: string, etapa: 0 | 1): string {
  const n = nomeCurto(nome);
  return etapa === 0
    ? `Olá, tudo bem? Aqui é o Felipe, da Synapsa. Ajudamos clínicas de psicologia como a ${n} a centralizar toda a operação num só lugar, tirar processos manuais e automatizar as tarefas administrativas, para a equipe ganhar tempo. Posso te mostrar em uma demonstração de 30 minutos? Mais detalhes em ${SITE_CLINICAS}`
    : `Oi! Só retomando minha mensagem sobre a ${n}. Se fizer sentido ver a demonstração de 30 minutos, é só me avisar o melhor dia e horário. Se não for o momento, sem problema algum.`;
}

export const linkWhatsapp = (numero: string, texto: string) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

const capDia = (brain: Brain) => Math.max(1, Math.min(30, Number(brain.policy("prospect_whatsapp_daily", 10)) || 10));

function enviadosHoje(brain: Brain): number {
  const dia = brtDay(brain.clock());
  return rows<{ enviado_em: number }>(brain.db, "select enviado_em from prospect_whatsapp where pulado = 0 and enviado_em > ?", brain.clock() - 2 * DAY).filter((r) => brtDay(r.enviado_em) === dia).length;
}

export function painelWhatsapp(brain: Brain): PainelWhatsapp {
  const cap = capDia(brain);
  const feitos = enviadosHoje(brain);
  const restante = Math.max(0, cap - feitos);
  const agora = brain.clock();
  const ps = rows<{ id: number; nome: string; cidade: string | null; telefone: string | null; whatsapp_no_site: number | null; nota: number }>(
    brain.db,
    `select p.id, p.nome, p.cidade, p.telefone, p.whatsapp_no_site, p.nota from prospects p
     left join prospect_contato c on c.prospect_id = p.id
     where p.status in ('qualificado','no_crm') and p.telefone is not null and coalesce(c.respondeu, 0) = 0 and coalesce(c.sair, 0) = 0
     order by p.nota desc, p.id desc limit 300`,
  );
  const fila: ItemWhatsapp[] = [];
  for (const p of ps) {
    const n = numeroWhatsapp(p.telefone);
    if (!n || !(n.celular || p.whatsapp_no_site === 1)) continue;
    const feitas = rows<{ etapa: number; enviado_em: number; pulado: number }>(brain.db, "select etapa, enviado_em, pulado from prospect_whatsapp where prospect_id = ?", p.id);
    const e0 = feitas.find((x) => x.etapa === 0);
    const e1 = feitas.find((x) => x.etapa === 1);
    let etapa: 0 | 1 | null = null;
    if (!e0) etapa = 0;
    else if (!e1 && e0.pulado === 0 && agora - e0.enviado_em >= DIAS_FOLLOWUP * DAY) etapa = 1;
    if (etapa === null) continue;
    const texto = mensagemWhatsapp(p.nome, etapa);
    fila.push({ prospectId: p.id, nome: p.nome, cidade: p.cidade, telefone: p.telefone!, etapa, texto, link: linkWhatsapp(n.numero, texto), nota: p.nota });
  }
  // Follow-ups primeiro (já esquentaram), depois os melhores por nota.
  fila.sort((a, b) => b.etapa - a.etapa || b.nota - a.nota);
  return { fila: fila.slice(0, restante), enviadosHoje: feitos, capDia: cap, restanteHoje: restante };
}

export function marcarWhatsapp(brain: Brain, prospectId: number, etapa: number, acao: "enviado" | "pular"): void {
  if (etapa !== 0 && etapa !== 1) throw new BrainError("invalid", "Etapa inválida.");
  if (!row(brain.db, "select 1 as x from prospects where id = ?", prospectId)) throw new BrainError("not_found", "Clínica não encontrada.");
  run(brain.db, "insert into prospect_whatsapp (prospect_id, etapa, enviado_em, pulado) values (?, ?, ?, ?) on conflict(prospect_id, etapa) do update set enviado_em = excluded.enviado_em, pulado = excluded.pulado", prospectId, etapa, brain.clock(), acao === "pular" ? 1 : 0);
  brain.audit("voce", acao === "pular" ? "whatsapp_pulou" : "whatsapp_enviou", String(prospectId), { etapa });
  brain.emit("change");
}
