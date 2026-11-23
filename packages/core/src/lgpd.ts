import { BrainError, type Brain } from "./brain";
import { row, rows, run } from "./sql";

const DAY = 86_400_000;
export const RETENCAO_MESES = 12;
const digitos = (s: string) => s.replace(/\D/g, "");

/** Quem já foi esquecido e não pode voltar pela planilha do Instinct. */
export const esquecido = (brain: Brain, tipo: "whatsapp" | "instinct", valor: string): boolean =>
  !!row(brain.db, "select 1 as x from lgpd_esquecidos where tipo = ? and valor = ?", tipo, tipo === "whatsapp" ? digitos(valor) : valor);

const marcar = (brain: Brain, tipo: string, valor: string) => {
  if (valor) run(brain.db, "insert or ignore into lgpd_esquecidos (tipo, valor, em) values (?, ?, ?)", tipo, valor, brain.clock());
};

export interface Esquecido { prospects: number; mensagens: number; instinct: number; bloqueado: boolean }

/**
 * Direito de eliminação (LGPD art. 18, VI). Anonimiza a clínica/profissional, apaga conversas e rascunhos ligados ao contato
 * e, se `bloquear`, mantém só o e-mail na lista de bloqueio, para ninguém escrever para essa pessoa de novo.
 * O CRM da Synapsa e a planilha do Instinct ficam fora do Brain: apague lá também.
 */
export function esquecerContato(brain: Brain, alvo: { prospectId?: number; email?: string; whatsapp?: string }, ator: string, bloquear = true): Esquecido {
  const emails = new Set<string>();
  const zaps = new Set<string>();
  const ids = new Set<number>();
  if (alvo.email) emails.add(alvo.email.trim().toLowerCase());
  if (alvo.whatsapp && digitos(alvo.whatsapp).length >= 8) zaps.add(digitos(alvo.whatsapp));
  if (alvo.prospectId) ids.add(alvo.prospectId);
  if (!emails.size && !zaps.size && !ids.size) throw new BrainError("invalid", "Informe o e-mail, o WhatsApp ou a clínica a esquecer.");

  for (const e of emails) for (const p of rows<{ id: number }>(brain.db, "select id from prospects where lower(email) = ?", e)) ids.add(p.id);
  for (const id of [...ids]) {
    const p = row<{ email: string | null; telefone: string | null }>(brain.db, "select email, telefone from prospects where id = ?", id);
    if (!p) { ids.delete(id); continue; }
    if (p.email) emails.add(p.email.toLowerCase());
    if (p.telefone && digitos(p.telefone).length >= 8) zaps.add(digitos(p.telefone));
  }

  let mensagens = 0;
  const agora = brain.clock();
  for (const id of ids) {
    for (const t of ["prospect_contato", "prospect_whatsapp", "prospect_autonomo"]) run(brain.db, `delete from ${t} where prospect_id = ?`, id);
    for (const r of rows<{ id: string }>(brain.db, "select id from proposals where dedupe_key like ? or dedupe_key like ?", `prosp-${id}-%`, `aut-${id}-%`)) { anonimizarProposta(brain, r.id); mensagens++; }
    run(brain.db, "delete from inbound_emails where prospect_id = ?", id);
    // Mantém a linha com o place_id para a busca do Google não trazer a mesma pessoa de volta.
    run(brain.db, "update prospects set nome = 'Removido (LGPD)', cidade = null, endereco = null, telefone = null, site = null, instagram = null, email = null, email_fonte = null, consulta = null, crm_lead_id = null, status = 'removido', atualizado_em = ? where id = ?", agora, id);
  }
  for (const e of emails) {
    for (const r of rows<{ id: string }>(brain.db, "select id from proposals where lower(contact_ref) = ?", e)) { anonimizarProposta(brain, r.id); mensagens++; }
    mensagens += rows(brain.db, "select email_id from inbound_emails where lower(de) = ?", e).length;
    run(brain.db, "delete from inbound_emails where lower(de) = ?", e);
    run(brain.db, "update envios set to_ref = '[removido]', detail = null where lower(to_ref) = ?", e);
    run(brain.db, "delete from contact_log where lower(contact_ref) = ?", e);
    run(brain.db, "delete from consents where lower(contact_ref) = ?", e);
    if (bloquear) run(brain.db, "insert into email_suppression (email, reason, at) values (?, 'pediu a exclusão dos dados (LGPD)', ?) on conflict(email) do update set reason = excluded.reason, at = excluded.at", e, agora);
  }

  let instinct = 0;
  for (const z of zaps) {
    for (const l of rows<{ chave: string; whatsapp: string | null }>(brain.db, "select chave, whatsapp from instinct_leads")) {
      if (l.whatsapp && digitos(l.whatsapp) === z) {
        run(brain.db, "delete from instinct_eventos where chave = ?", l.chave);
        run(brain.db, "delete from instinct_leads where chave = ?", l.chave);
        marcar(brain, "instinct", l.chave);
        instinct++;
      }
    }
    marcar(brain, "whatsapp", z);
  }
  brain.audit("voce", "lgpd_esquecer", ids.size ? [...ids].join(",") : undefined, { prospects: ids.size, mensagens, instinct, bloqueado: bloquear && emails.size > 0 });
  brain.emit("change");
  return { prospects: ids.size, mensagens, instinct, bloqueado: bloquear && emails.size > 0 };
}

function anonimizarProposta(brain: Brain, id: string): void {
  run(brain.db, "update proposals set title = '[removido — LGPD]', draft = null, why = '[removido]', contact_ref = null, payload = '{}', review_note = null where id = ?", id);
  run(brain.db, "update envios set to_ref = '[removido]', detail = null where proposal_id = ?", id);
}

/** Retenção: lead frio (sem resposta, sem CRM, sem pedido de saída) some depois de 12 meses sem movimento. Quem pediu para sair continua bloqueado. */
export function aplicarRetencao(brain: Brain): number {
  const corte = brain.clock() - RETENCAO_MESES * 30 * DAY;
  const frios = rows<{ id: number }>(brain.db,
    `select p.id from prospects p left join prospect_contato c on c.prospect_id = p.id
     where p.status not in ('removido', 'no_crm') and p.crm_lead_id is null and p.atualizado_em < ? and coalesce(c.respondeu, 0) = 0`, corte);
  for (const f of frios) esquecerContato(brain, { prospectId: f.id }, "sistema", false);
  // Conversas recebidas e envios antigos que sobraram: o texto da mensagem não precisa durar mais que a retenção.
  run(brain.db, "delete from inbound_emails where at < ?", corte);
  run(brain.db, "update envios set detail = null where at < ? and detail is not null", corte);
  if (frios.length) brain.audit("sistema", "lgpd_retencao", undefined, { removidos: frios.length, meses: RETENCAO_MESES });
  return frios.length;
}

export const POLITICA_HTML = (contato: string): string => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Política de Privacidade | Synapsa</title>
<style>:root{color-scheme:light dark}body{margin:0;font:16px/1.65 system-ui,-apple-system,Segoe UI,sans-serif;background:#0b0b12;color:#e8e8f0}main{max-width:720px;margin:0 auto;padding:40px 20px 80px}h1{font-size:28px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 6px;color:#b9a2ff}p,li{color:#c9c9d6}a{color:#8cc8ff}small{color:#8a8a9a}</style></head><body><main>
<h1>Política de Privacidade</h1><small>Synapsa · atualizada em novembro de 2026</small>
<h2>Quem somos</h2><p>A Synapsa é uma plataforma para psicólogos e clínicas. Somos a controladora dos dados descritos aqui. Contato para qualquer assunto de privacidade: <a href="mailto:${contato}">${contato}</a>.</p>
<h2>Quais dados usamos neste contato</h2><p>Quando escrevemos para uma clínica ou psicólogo, usamos só dados profissionais que a própria pessoa divulga publicamente: nome do consultório ou clínica, cidade, telefone, site, Instagram e e-mail comercial. Não coletamos nem tratamos dados de pacientes nessa prospecção.</p>
<h2>Para que usamos e por quê</h2><p>Para apresentar a Synapsa e oferecer uma conversa de 30 minutos. A base legal é o legítimo interesse (LGPD, art. 7º, IX): contato comercial entre empresas, com e-mail profissional público, limitado ao que é necessário e sempre com saída fácil.</p>
<h2>Como parar de receber</h2><p>Responda SAIR a qualquer e-mail nosso, ou escreva para o contato acima. Paramos na hora e guardamos apenas o seu e-mail numa lista de bloqueio, para não escrever de novo.</p>
<h2>Seus direitos</h2><p>Você pode pedir confirmação do tratamento, acesso, correção, anonimização ou eliminação dos seus dados, portabilidade, informação sobre com quem compartilhamos e a revogação do que tiver autorizado (LGPD, art. 18). Respondemos em até 15 dias. Pedidos de eliminação são feitos nos nossos sistemas e na ferramenta de prospecção.</p>
<h2>Por quanto tempo guardamos</h2><p>Contatos de prospecção sem resposta são eliminados após 12 meses sem interação. Quem pede para sair fica apenas na lista de bloqueio.</p>
<h2>Com quem compartilhamos</h2><p>Usamos fornecedores para operar o serviço: Cloudflare (hospedagem), Resend (envio de e-mail), Apify e Google (busca de dados públicos e planilhas), e provedores de IA que ajudam a redigir mensagens. Alguns ficam fora do Brasil; nesses casos a transferência ocorre com as garantias previstas no art. 33 da LGPD. Não vendemos dados.</p>
<h2>Segurança</h2><p>Acesso restrito por login, conexões criptografadas, registro de ações e revisão periódica de acessos.</p>
<h2>Reclamações</h2><p>Se não ficar satisfeito, você pode contatar a Autoridade Nacional de Proteção de Dados (gov.br/anpd).</p>
</main></body></html>`;
