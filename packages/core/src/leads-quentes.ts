// Lead quente: quem clicou no link do e-mail de prospecção. O link leva um código do lead (utm_content), o GA4 conta a visita,
// e o Brain avisa você com os dados do lead e uma mensagem de WhatsApp pronta. Só enxerga quem aceita cookies: é um piso.
import { BrainError, type Brain } from "./brain";
import { sendEmail } from "./dispatch";
import { gaConteudoPorLead } from "./ga";
import { row, rows, run } from "./sql";
import { idDoCodigo } from "./utm";
import { nomeCurto } from "./prospeccao-email";
import { DESTINO_PADRAO } from "./relatorio-semanal";

type Env = Record<string, string | undefined>;
const MAX_AVISOS = 8;

interface Lead { id: number; nome: string; cidade: string | null; email: string | null; telefone: string | null; site: string | null; autonomo: number; respondeu: number | null; sair: number | null }

/** Número de celular com DDD vira link do WhatsApp; fixo ou número incompleto, não. */
export function linkWhatsapp(telefone: string | null, texto: string): string | null {
  let d = (telefone ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  if (d.length !== 11 || d[2] !== "9") return null;
  return `https://wa.me/55${d}?text=${encodeURIComponent(texto)}`;
}

export function mensagemWhatsapp(l: { nome: string; autonomo: boolean }): string {
  const nome = nomeCurto(l.nome);
  return l.autonomo
    ? `Oi${nome ? `, ${nome.split(" ")[0]}` : ""}! Aqui é o Felipe, da Synapsa. Vi que você deu uma olhada na plataforma depois do meu e-mail. Posso te mostrar em 15 minutos como ficaria na sua prática? Qual horário é melhor para você?`
    : `Oi, pessoal da ${nome}! Aqui é o Felipe, da Synapsa. Vi que alguém da equipe deu uma olhada na plataforma depois do meu e-mail. Posso mostrar em 30 minutos como ela centraliza a operação da clínica? Qual dia e horário ficam bons?`;
}

/** Lê os cliques no GA4 e guarda quantas visitas cada lead já fez. */
export async function sincronizarCliques(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<number> {
  const lista = await gaConteudoPorLead(brain, env, f);
  let n = 0;
  const agora = brain.clock();
  for (const c of lista) {
    const id = idDoCodigo(c.codigo);
    if (!id || !row(brain.db, "select 1 as x from prospects where id = ?", id)) continue;
    run(brain.db, "insert into lead_clique (codigo, prospect_id, sessoes, ultimo, avisado, atualizado_em) values (?, ?, ?, ?, 0, ?) on conflict(codigo) do update set sessoes = excluded.sessoes, ultimo = excluded.ultimo, atualizado_em = excluded.atualizado_em", c.codigo, id, c.sessoes, c.ultimo, agora);
    n++;
  }
  return n;
}

const dd = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Avisa você de cada lead com visita nova que ainda não respondeu nem saiu. No máximo 8 por rodada; o resto fica para a próxima. */
export async function avisarLeadsQuentes(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<number> {
  if (brain.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado.");
  const pend = rows<{ codigo: string; prospect_id: number; sessoes: number; ultimo: string }>(brain.db, "select codigo, prospect_id, sessoes, ultimo from lead_clique where sessoes > avisado order by ultimo desc limit ?", MAX_AVISOS);
  const para = brain.policy<string>("relatorio_email", DESTINO_PADRAO);
  let avisados = 0;
  for (const c of pend) {
    const l = row<Lead>(brain.db, `select p.id, p.nome, p.cidade, p.email, p.telefone, p.site, (select count(*) from prospect_autonomo a where a.prospect_id = p.id) as autonomo, c.respondeu, c.sair
      from prospects p left join prospect_contato c on c.prospect_id = p.id where p.id = ?`, c.prospect_id);
    if (!l || l.sair || l.respondeu) { run(brain.db, "update lead_clique set avisado = sessoes where codigo = ?", c.codigo); continue; }
    const wa = linkWhatsapp(l.telefone, mensagemWhatsapp({ nome: l.nome, autonomo: l.autonomo > 0 }));
    const nome = nomeCurto(l.nome);
    const corpo = [
      `${nome} clicou no link do seu e-mail e visitou a plataforma (${c.sessoes} ${c.sessoes === 1 ? "visita" : "visitas"} nos últimos 28 dias, a última em ${dd(c.ultimo)}).`,
      `Quem é\n- ${l.autonomo > 0 ? "Psicólogo autônomo" : "Clínica"}: ${l.nome}${l.cidade ? ` (${l.cidade})` : ""}\n${l.email ? `- E-mail: ${l.email}\n` : ""}${l.telefone ? `- Telefone: ${l.telefone}\n` : ""}${l.site ? `- Site: ${l.site}` : ""}`.trimEnd(),
      `O que fazer agora\n- Quem clica e some costuma esfriar em 1 ou 2 dias: chame hoje.\n${wa ? "- Abra o link abaixo, que já leva a mensagem pronta no WhatsApp." : "- Sem celular válido para WhatsApp: responda o e-mail dele ou ligue."}`,
      ...(wa ? [wa] : []),
      `Mensagem sugerida\n${mensagemWhatsapp({ nome: l.nome, autonomo: l.autonomo > 0 })}`,
      `O GA4 só conta quem aceita cookies, então pode haver mais gente que clicou e não aparece aqui.`,
    ].join("\n\n");
    try {
      await sendEmail(brain, env, { id: `lead-quente-${c.codigo}-${c.sessoes}`, to: para, subject: `Lead quente: ${nome} visitou a Synapsa`, body: corpo, html: true, interno: true }, f);
      run(brain.db, "update lead_clique set avisado = sessoes where codigo = ?", c.codigo);
      brain.audit("sistema", "lead_quente_avisou", String(l.id), { sessoes: c.sessoes });
      avisados++;
    } catch (e) {
      if (e instanceof BrainError) break; // sem chave de e-mail ou limite: tenta de novo na próxima rodada
      throw e;
    }
  }
  if (avisados) brain.emit("change");
  return avisados;
}

/** Rotina: lê os cliques e avisa. Falha de um lado não derruba o outro. */
export async function rotinaLeadsQuentes(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<string> {
  let lidos = 0;
  try { lidos = await sincronizarCliques(brain, env, f); } catch (e) { return `Cliques: ${e instanceof Error ? e.message : String(e)}`; }
  const avisados = await avisarLeadsQuentes(brain, env, f).catch(() => 0);
  return `${lidos} leads com visita; ${avisados} avisos enviados.`;
}
