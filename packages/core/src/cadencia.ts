// Cadência de e-mail para quem se cadastrou no app (o antigo "Fluxo Comercial v3 (Playbook 2026)" do n8n).
// Cinco e-mails em sequência. O Brain só escreve rascunhos: cada um vai para Aprovações e só sai com o seu OK.
// Quem já paga (plano Essencial), pediu para sair ou teve um rascunho barrado/recusado não recebe o próximo.
import type { Brain } from "./brain";
import { EMAIL_RE } from "./envio";
import { row, rows, run } from "./sql";

const DAY = 86_400_000;
const AGENTE = "ativacao";
/** Dias de espera antes de cada e-mail, contados do anterior (o 1º sai logo). O contato mínimo da política (3 dias) vale como piso. */
export const CAD_ESPERAS = [0, 2, 2, 3, 3] as const;
export const CAD_TOTAL = CAD_ESPERAS.length;
const WA = "https://wa.me/5551991897471";
const demo = `${WA}?text=Ol%C3%A1%2C%20Felipe!%20Gostaria%20de%20agendar%20uma%20demo%20da%20Synapsa.`;
const trial = `${WA}?text=Ol%C3%A1%2C%20Felipe!%20Quero%20testar%20a%20Synapsa%20por%2014%20dias%20gr%C3%A1tis.`;

/** "LARISSA DE OLIVEIRA" vira "Larissa". */
export function primeiroNomeCad(nome: string): string {
  const p = nome.trim().split(/\s+/)[0] ?? "";
  return p ? p.charAt(0).toUpperCase() + p.slice(1).toLowerCase() : "";
}

/** Texto simples (o envio do Brain é texto). Fiel ao fluxo antigo, sem o que a conformidade barra (a palavra "prontuário", urgência artificial). */
export function montarCadencia(nomeCompleto: string, etapa: 1 | 2 | 3 | 4 | 5): { assunto: string; corpo: string } {
  const n = primeiroNomeCad(nomeCompleto) || "Olá";
  const abre = nomeCompleto.trim() ? `Olá, ${n}.` : "Olá.";
  const fecha = "Abraço,\nFelipe\nSynapsa";
  if (etapa === 1) return {
    assunto: `${n}, o mercado de saúde está mudando. Você está preparado?`,
    corpo: `${abre}\n\nAntes de falar da Synapsa, deixa eu te contar o que está acontecendo na saúde no Brasil.\n\nO governo está integrando os dados de saúde do país em um registro digital único, a RNDS. Isso não é especulação: está acontecendo agora.\n\nO psicólogo que tiver a operação organizada, dados estruturados e souber usar tecnologia sai na frente. Quem não tiver vai ficar para trás.\n\nA Synapsa foi criada para isso: te colocar nesse futuro sem você precisar correr atrás de cada atualização. A plataforma se atualiza, você só precisa atender bem.\n\nPosso te mostrar como funciona em 15 minutos? É só responder este e-mail ou chamar no WhatsApp:\n${demo}\n\n${fecha}`,
  };
  if (etapa === 2) return {
    assunto: `${n}, o que acontece com seu paciente nos outros 6 dias?`,
    corpo: `${abre}\n\nVocê atende seu paciente 1 hora por semana. E nos outros 6 dias e 23 horas? A maioria dos psicólogos não tem visibilidade nenhuma disso, e isso afeta o resultado do tratamento.\n\nO que a Synapsa faz entre as sessões:\n\n- Diário emocional: o paciente registra como se sente e você acompanha em tempo real.\n- Escalas clínicas: PHQ-9, GAD-7 e BDI aplicadas automaticamente, com a IA analisando e te entregando o resultado.\n- Evolução: um gráfico claro de como cada paciente evoluiu ao longo dos meses.\n- Trilhas de bem-estar: exercícios enviados ao paciente entre as sessões.\n\nVocê estudou anos para ser um excelente psicólogo. A Synapsa faz o paciente sentir isso não só na sessão, mas todos os dias da semana.\n\nQuer ver na prática? Responda este e-mail ou chame no WhatsApp:\n${demo}\n\n${fecha}`,
  };
  if (etapa === 3) return {
    assunto: `${n}, você não estudou anos pra virar assistente administrativo`,
    corpo: `${abre}\n\nQuantas horas por semana você perde com isto:\n\n- Mensagens no WhatsApp confirmando sessão\n- Cobrança manual e link de pagamento\n- Reagendamentos e conflitos de agenda\n- Follow-up de pacientes que sumiram\n\nA Synapsa automatiza tudo isso:\n\n- WhatsApp automático: lembretes, confirmações e follow-ups pós-sessão, sem você digitar nada.\n- Cobrança automatizada: boleto gerado, link enviado, confirmação registrada. Você para de ser cobrador.\n- Agenda inteligente: sem conflitos, sem horário duplicado, com perfil público para novos pacientes te encontrarem.\n- Financeiro completo: emissão de nota fiscal, relatórios e controle de receita, tudo integrado.\n\nQuer recuperar esse tempo? Responda este e-mail ou chame no WhatsApp:\n${demo}\n\n${fecha}`,
  };
  if (etapa === 4) return {
    assunto: `${n}, respondendo as dúvidas que eu ouço toda semana`,
    corpo: `${abre}\n\nEstas são as dúvidas que mais ouço de psicólogos antes de conhecerem a Synapsa:\n\n"Já uso um sistema para guardar os registros dos atendimentos, não preciso de mais uma ferramenta."\nA maioria desses sistemas é um repositório. A Synapsa é operação clínica ativa: ela guarda, e também manda mensagem para o paciente, aplica escala, analisa a evolução e te avisa quando há risco de abandono. São coisas diferentes.\n\n"Meus pacientes não vão usar."\nSeus pacientes já usam WhatsApp todos os dias. A Synapsa funciona dentro do WhatsApp deles: não precisa baixar app nem criar conta. Chega como mensagem.\n\n"Não tenho tempo para aprender uma ferramenta nova."\nÉ exatamente a razão de a Synapsa existir. Em 30 minutos de onboarding a plataforma já está rodando, e o que ela faz depois, faz sozinha.\n\n"IA em saúde mental é perigoso."\nA IA não toma decisão clínica e não substitui você. Ela organiza informação, aplica escalas validadas e detecta padrões, e te entrega tudo pronto para você decidir. Quem trata é você.\n\nPosso agendar uma demonstração? Responda este e-mail ou chame no WhatsApp:\n${demo}\n\n${fecha}`,
  };
  return {
    assunto: `${n}, vou ser honesto contigo`,
    corpo: `${abre}\n\nTe enviei alguns e-mails nas últimas semanas. Normalmente, quando alguém para de responder, é porque não viu valor suficiente ou porque o momento não é agora. Se não for o momento, tudo bem.\n\nMas se a questão é valor, me responde uma coisa: o problema que você tem hoje (cobrança manual, paciente sumindo, horas perdidas no administrativo) existe há quanto tempo? Se já existe há meses e você ainda não resolveu, qual vai ser o gatilho para o momento certo chegar?\n\nPara você testar com calma: 14 dias grátis com onboarding ao vivo, plataforma completa (WhatsApp automático, escalas clínicas, Lyra, financeiro com nota fiscal, agenda pública). Se não gostar, cancela com um clique.\n\nQuer testar? Responda este e-mail ou chame no WhatsApp:\n${trial}\n\nEste é o meu último e-mail da sequência.\n\n${fecha}`,
  };
}

// ---- estado ----

export interface CadenciaConfig { ativo: boolean }
export const cadenciaConfig = (brain: Brain): CadenciaConfig => ({ ativo: brain.policy<Partial<CadenciaConfig>>("cadencia_email", {}).ativo === true });
export function cadenciaAtivar(brain: Brain, ativo: boolean): CadenciaConfig {
  brain.setPolicy("cadencia_email", { ativo });
  brain.audit("voce", ativo ? "cadencia_on" : "cadencia_off");
  brain.emit("change");
  return cadenciaConfig(brain);
}

export interface LeadIn { nome: string; email: string; plano?: string | null; origem?: string | null; entrouEm?: number | null; step?: number | null; ultimaAcao?: number | null }

/** Entra na cadência quem se cadastrou (ou foi importado com o ponto em que já estava). Não mexe em quem já está na tabela.
 *  O cadastro no app é a base do contato: grava o aceite de e-mail na data do cadastro, que a conformidade exige. */
export function cadenciaImportar(brain: Brain, linhas: LeadIn[]): { novos: number; jaExistiam: number; invalidos: number } {
  let novos = 0, jaExistiam = 0, invalidos = 0;
  const agora = brain.clock();
  for (const l of linhas) {
    const email = String(l.email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) { invalidos++; continue; }
    if (row(brain.db, "select 1 as x from cadencia_email where email = ?", email)) { jaExistiam++; continue; }
    const step = Math.min(CAD_TOTAL, Math.max(0, Math.floor(Number(l.step ?? 0)) || 0));
    const entrou = l.entrouEm && Number.isFinite(l.entrouEm) ? l.entrouEm : agora;
    run(brain.db, "insert into cadencia_email (email, nome, plano, origem, entrou_em, step, ultima_acao, pausada, motivo) values (?, ?, ?, ?, ?, ?, ?, 0, null)",
      email, String(l.nome ?? "").trim().slice(0, 120), l.plano ? String(l.plano).trim().toLowerCase() : null, l.origem ?? null, entrou, step, step > 0 ? (l.ultimaAcao ?? agora) : null);
    run(brain.db, "insert into consents (contact_ref, channel, granted_at, revoked_at) values (?, 'email', ?, null) on conflict(contact_ref, channel) do nothing", email, entrou);
    novos++;
  }
  if (novos) brain.emit("change");
  return { novos, jaExistiam, invalidos };
}

export function cadenciaPausar(brain: Brain, email: string, pausar: boolean): void {
  run(brain.db, "update cadencia_email set pausada = ?, motivo = ? where email = ?", pausar ? 1 : 0, pausar ? "pausada por você" : null, email.trim().toLowerCase());
  brain.audit("voce", pausar ? "cadencia_pausar" : "cadencia_retomar", email);
  brain.emit("change");
}

const chave = (email: string, etapa: number) => `cad-${email}-e${etapa}`;
const suprimido = (brain: Brain, email: string) => !!row(brain.db, "select 1 as x from email_suppression where email = ?", email);
const minDias = (brain: Brain) => Math.max(0, Number(brain.policy<{ min_days_between?: number }>("contact_policy", { min_days_between: 3 }).min_days_between ?? 3));

/** Traz para a tabela o que já saiu (ou foi barrado ou recusado). Seguro de chamar várias vezes. */
export function sincronizarEnvios(brain: Brain): void {
  for (const r of rows<{ k: string; at: number }>(brain.db, "select pr.dedupe_key as k, e.at as at from proposals pr join envios e on e.proposal_id = pr.id where e.status = 'enviado' and pr.dedupe_key like 'cad-%'")) {
    const m = /^cad-(.+)-e(\d)$/.exec(r.k);
    if (m) run(brain.db, "update cadencia_email set step = ?, ultima_acao = ? where email = ? and step < ?", Number(m[2]), r.at, m[1]!, Number(m[2]));
  }
  for (const r of rows<{ k: string; note: string | null }>(brain.db, "select dedupe_key as k, review_note as note from proposals where status = 'rejeitada' and dedupe_key like 'cad-%'")) {
    const m = /^cad-(.+)-e(\d)$/.exec(r.k);
    if (m) run(brain.db, "update cadencia_email set pausada = 1, motivo = ? where email = ? and pausada = 0 and step < ?", `e-mail ${m[2]} barrado ou recusado${r.note ? `: ${r.note}` : ""}`, m[1]!, Number(m[2]));
  }
}

interface Lead { email: string; nome: string; plano: string | null; step: number; ultima_acao: number | null; pausada: number; motivo: string | null; entrou_em: number }

/** Quando sai o próximo e-mail (null se acabou). */
export function cadProximoEm(l: Pick<Lead, "step" | "ultima_acao">, min: number): number | null {
  if (l.step >= CAD_TOTAL) return null;
  if (l.step === 0 || !l.ultima_acao) return 0;
  return l.ultima_acao + Math.max(CAD_ESPERAS[l.step]!, min) * DAY;
}

const pagante = (plano: string | null) => plano === "essencial";

/** Cria os rascunhos que venceram. Só roda com a cadência ligada. */
export function gerarCadencia(brain: Brain): { rascunhos: number } {
  if (!cadenciaConfig(brain).ativo) return { rascunhos: 0 };
  sincronizarEnvios(brain);
  const agora = brain.clock();
  const min = minDias(brain);
  const limite = Math.max(1, Number(brain.policy("email_daily_cap", 20)));
  let rascunhos = 0;
  for (const l of rows<Lead>(brain.db, "select * from cadencia_email where pausada = 0 and step < ? order by entrou_em", CAD_TOTAL)) {
    if (rascunhos >= limite) break;
    if (pagante(l.plano) || suprimido(brain, l.email)) continue;
    const quando = cadProximoEm(l, min);
    if (quando === null || quando > agora) continue;
    const etapa = (l.step + 1) as 1 | 2 | 3 | 4 | 5;
    const m = montarCadencia(l.nome, etapa);
    const id = brain.addProposal({
      agentId: AGENTE, kind: "cadencia_email", channel: "email", risk: "baixo", impactoBrl: 79,
      title: `Cadência ${etapa}/${CAD_TOTAL}: ${primeiroNomeCad(l.nome) || l.email}`,
      draft: m.corpo,
      why: `Cadastrou-se no app${l.plano ? ` (plano ${l.plano})` : ""} e ainda não paga. E-mail ${etapa} de ${CAD_TOTAL} da cadência comercial. Para quando assina, pede para sair ou responde.`,
      contactRef: l.email,
      payload: { envio: { tipo: "email", para: l.email, assunto: m.assunto }, cadencia: { etapa } },
      dedupeKey: chave(l.email, etapa),
    });
    if (id) rascunhos++;
  }
  if (rascunhos) brain.emit("change");
  return { rascunhos };
}

export interface CadenciaLinha { email: string; nome: string; plano: string | null; step: number; proximo: number | null; situacao: string }
export interface CadenciaPainel { ativo: boolean; total: number; porEtapa: number[]; concluidos: number; excluidos: number; leads: CadenciaLinha[] }

export function cadenciaPainel(brain: Brain): CadenciaPainel {
  sincronizarEnvios(brain);
  const min = minDias(brain);
  const todos = rows<Lead>(brain.db, "select * from cadencia_email order by entrou_em desc");
  const porEtapa = Array.from({ length: CAD_TOTAL + 1 }, () => 0);
  let excluidos = 0;
  const leads = todos.map((l): CadenciaLinha => {
    porEtapa[l.step] = (porEtapa[l.step] ?? 0) + 1;
    let situacao: string;
    if (l.pausada) { excluidos++; situacao = l.motivo ?? "pausada"; }
    else if (pagante(l.plano)) { excluidos++; situacao = "já paga (Essencial): fora da cadência"; }
    else if (suprimido(brain, l.email)) { excluidos++; situacao = "pediu para sair"; }
    else if (l.step >= CAD_TOTAL) situacao = "sequência concluída";
    else situacao = l.step === 0 ? "aguardando o 1º e-mail" : `${l.step} de ${CAD_TOTAL} enviados`;
    const parado = l.pausada || pagante(l.plano) || suprimido(brain, l.email);
    return { email: l.email, nome: l.nome, plano: l.plano, step: l.step, proximo: parado ? null : cadProximoEm(l, min), situacao };
  });
  return { ativo: cadenciaConfig(brain).ativo, total: todos.length, porEtapa, concluidos: todos.filter((l) => l.step >= CAD_TOTAL).length, excluidos, leads };
}
