// LinkedIn: posts da página da Synapsa. O Brain escreve (segunda, quarta e sexta), você aprova na Central e ele publica pela API do LinkedIn.
// Substitui os workflows do n8n (gerador, publicador e callback). Nada sai sem a sua aprovação.
import { BrainError, brtDay, type Brain } from "./brain";
import { revisarTexto } from "./instagram";
import { callLlm, llmConfig, textOf } from "./llm";
import { row, rows, run } from "./sql";

type Env = Record<string, string | undefined>;
export type LiStatus = "pendente" | "aprovado" | "rejeitado" | "publicado" | "falhou";
export interface LiPost { id: string; status: LiStatus; categoria: string; texto: string; criadoEm: number; publicadoEm: number | null; permalink: string | null; erro: string | null; manual: boolean }
type Linha = { id: string; status: LiStatus; categoria: string; texto: string; criado_em: number; publicado_em: number | null; permalink: string | null; erro: string | null; manual: number };

const ORG_PADRAO = "134663896";
const MAX = 3000; // limite de caracteres do LinkedIn

export const TEMAS: { categoria: string; prompt: string }[] = [
  { categoria: "Urgência de Mercado", prompt: "Escreva um post para LinkedIn voltado para psicólogos brasileiros sobre a transformação digital na saúde: prontuário único, Datasus, RDNS. O argumento central: os psicólogos que não tiverem dados organizados e tecnologia no processo vão ficar para trás. Tom: direto, urgente mas não alarmista, posicionamento de futuro. Não mencione a Synapsa diretamente. Termine com uma pergunta para engajar." },
  { categoria: "Qualidade Clínica", prompt: "Escreva um post para LinkedIn voltado para psicólogos brasileiros sobre a lacuna entre sessões de terapia: o que acontece com o paciente nos outros 6 dias da semana. Argumento: a terapia acontece além da sessão. Fale sobre diário emocional, escalas clínicas, acompanhamento de evolução. Tom: clínico, reflexivo, humanizado. Não mencione a Synapsa diretamente." },
  { categoria: "Tempo e Produtividade", prompt: "Escreva um post para LinkedIn voltado para psicólogos brasileiros sobre o tempo perdido com tarefas administrativas: agendamento, cobrança, WhatsApp, reagendamentos. Argumento: o psicólogo não estudou anos para virar assistente administrativo de si mesmo. Tom: direto, provocativo mas construtivo. Pode mencionar a Synapsa no final como solução." },
  { categoria: "IA na Psicologia", prompt: "Escreva um post para LinkedIn voltado para psicólogos brasileiros sobre inteligência artificial na prática clínica. Argumento central: a IA não substitui o psicólogo, ela é a assistente de pesquisa que o psicólogo nunca teve. Fale sobre escalas automáticas, análise de evolução, Lyra (apoio ao paciente entre sessões). Tom: equilibrado, desmistificador, humanizado. Pode mencionar a Synapsa." },
  { categoria: "Abandono de Pacientes", prompt: "Escreva um post para LinkedIn voltado para psicólogos brasileiros sobre abandono de pacientes na terapia. Argumento: uma parcela relevante dos pacientes abandona antes de atingir seus objetivos, e a maioria dos psicólogos não recebe nenhum sinal antes. Fale sobre engajamento, acompanhamento, sinais de risco. Não cite porcentagem se não for citar a fonte. Tom: clínico, empático, reflexivo. Não mencione a Synapsa diretamente. Termine com uma pergunta." },
];

const SISTEMA = `Você é Felipe Dalpra, fundador da Synapsa, plataforma para psicólogos. Escreve posts autênticos, diretos e humanos para o LinkedIn. Sua voz é de quem entende o mercado de psicologia e saúde mental, fala com clareza sobre tecnologia e nunca usa linguagem corporativa. Tagline: Clínica + tecnológica + humana. Missão: fazer a terapia acontecer além da sessão. Sempre em português do Brasil.
Regras: máximo 1200 caracteres; 3 a 5 hashtags no final; frases curtas; nada de "você sabia?"; sem emoji em excesso (no máximo 2).
Proibido: prometer resultado clínico, cura ou garantia; desconto, promoção ou urgência artificial; dado ou caso clínico de paciente; estatística ou número inventado (só use número se for citar quem publicou e o ano); citar concorrente; dizer que a Synapsa garante conformidade com a NR 1.
Responda só com o texto do post, sem título nem explicação.`;

const row2 = (l: Linha): LiPost => ({ id: l.id, status: l.status, categoria: l.categoria, texto: l.texto, criadoEm: l.criado_em, publicadoEm: l.publicado_em, permalink: l.permalink, erro: l.erro, manual: l.manual === 1 });

/** Segunda (1), quarta (3) e sexta (5), no horário de Brasília. */
export const diaDePostar = (agora: number): boolean => [1, 3, 5].includes(new Date(`${brtDay(agora)}T12:00:00Z`).getUTCDay());

/** O tema que ficou mais tempo sem sair (nunca usado vem primeiro). */
export function proximoTema(brain: Brain): { categoria: string; prompt: string } {
  const ult = new Map(rows<{ categoria: string; u: number }>(brain.db, "select categoria, max(criado_em) as u from li_posts group by categoria").map((r) => [r.categoria, r.u]));
  return [...TEMAS].sort((a, b) => (ult.get(a.categoria) ?? 0) - (ult.get(b.categoria) ?? 0))[0]!;
}

export function liConfigurado(env: Env): boolean { return !!env.LINKEDIN_ACCESS_TOKEN; }

export interface LiPainel { configurado: boolean; organizacao: string; llm: boolean; diasDePostar: string; posts: LiPost[] }
export function liPainel(brain: Brain, env: Env): LiPainel {
  const ls = rows<Linha>(brain.db, "select * from li_posts order by case status when 'pendente' then 0 when 'falhou' then 1 when 'aprovado' then 2 else 3 end, criado_em desc limit 40");
  return { configurado: liConfigurado(env), organizacao: env.LINKEDIN_ORG_ID ?? ORG_PADRAO, llm: !!llmConfig(env, "agent"), diasDePostar: "segunda, quarta e sexta", posts: ls.map(row2) };
}

/** Escreve um post novo e deixa pendente. Um por dia (a menos que `forcar`). */
export async function liGerar(brain: Brain, env: Env, f: typeof fetch = fetch, opts: { forcar?: boolean } = {}): Promise<{ id: string; categoria: string } | null> {
  if (brain.killed()) return null;
  const agora = brain.clock();
  const dia = brtDay(agora);
  if (!opts.forcar && row(brain.db, "select id from li_posts where chave = ?", dia)) return null;
  const cfg = llmConfig(env, "agent");
  if (!cfg) throw new BrainError("invalid", "Falta a chave do modelo (OPENAI_API_KEY ou ANTHROPIC_API_KEY) nos secrets do Brain.");
  const tema = proximoTema(brain);
  let texto = "";
  let aviso = "";
  for (let t = 0; t < 2; t++) {
    const r = await callLlm(cfg, { system: SISTEMA, messages: [{ role: "user", content: `${tema.prompt}${aviso}` }], maxTokens: 900 }, f);
    texto = textOf(r.content).trim().slice(0, MAX);
    const motivo = texto ? revisarTexto(texto) : "texto vazio";
    if (!motivo) { aviso = ""; break; }
    aviso = `\n\nA versão anterior foi barrada: ${motivo}. Reescreva sem isso.`;
    texto = "";
  }
  if (!texto) throw new BrainError("invalid", "O modelo não entregou um texto aprovado pela conformidade. Tente gerar de novo.");
  const id = crypto.randomUUID();
  run(brain.db, "insert into li_posts (id, chave, status, categoria, texto, criado_em) values (?, ?, 'pendente', ?, ?, ?)", id, opts.forcar ? `${dia}#${id.slice(0, 6)}` : dia, tema.categoria, texto, agora);
  brain.audit("sistema", "li_gerou", tema.categoria);
  brain.emit("change");
  return { id, categoria: tema.categoria };
}

export function liDecidir(brain: Brain, id: string, acao: "aprovar" | "rejeitar", motivo = ""): void {
  const p = row<Linha>(brain.db, "select * from li_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post não encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Esse post já foi publicado.");
  if (acao === "aprovar" && brain.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado: aprovações bloqueadas.");
  run(brain.db, "update li_posts set status = ?, erro = ?, decidido_em = ? where id = ?", acao === "aprovar" ? "aprovado" : "rejeitado", acao === "rejeitar" ? motivo.slice(0, 300) || null : null, brain.clock(), id);
  brain.audit("voce", acao === "aprovar" ? "li_aprovou" : "li_rejeitou", p.categoria);
  brain.emit("change");
}

export function liEditar(brain: Brain, id: string, texto: string): void {
  const p = row<Linha>(brain.db, "select * from li_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post não encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Esse post já foi publicado.");
  const t = texto.trim().slice(0, MAX);
  if (!t) throw new BrainError("invalid", "O texto não pode ficar vazio.");
  const motivo = revisarTexto(t);
  if (motivo) throw new BrainError("invalid", `A conformidade barrou esse texto: ${motivo}.`);
  run(brain.db, "update li_posts set texto = ? where id = ?", t, id);
  brain.emit("change");
}

/** Você mesmo postou no LinkedIn (sem token configurado): só registra. */
export function liMarcarPublicado(brain: Brain, id: string): void {
  const p = row<Linha>(brain.db, "select * from li_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post não encontrado.");
  if (p.status === "publicado") return;
  run(brain.db, "update li_posts set status = 'publicado', manual = 1, publicado_em = ?, erro = null where id = ?", brain.clock(), id);
  brain.audit("voce", "li_marcou_publicado", p.categoria);
  brain.emit("change");
}

/** O LinkedIn trata esses caracteres como formatação no campo de texto; com barra eles aparecem como texto normal. O # fica livre para virar hashtag. */
export const escaparLinkedIn = (t: string): string => t.replace(/([\\|{}@\[\]()<>*_~])/g, "\\$1");

export async function liPublicar(brain: Brain, env: Env, id: string, f: typeof fetch = fetch): Promise<string> {
  if (brain.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado.");
  const p = row<Linha>(brain.db, "select * from li_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post não encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Já foi publicado.");
  if (p.status !== "aprovado" && p.status !== "falhou") throw new BrainError("invalid", "Só publico o que foi aprovado.");
  const token = env.LINKEDIN_ACCESS_TOKEN;
  if (!token) throw new BrainError("invalid", "Falta o LINKEDIN_ACCESS_TOKEN nos secrets do Brain. Enquanto isso, copie o texto, poste no LinkedIn e use \"Já postei\".");
  const org = env.LINKEDIN_ORG_ID ?? ORG_PADRAO;
  // marca antes de chamar: se a resposta se perder, não publica duas vezes
  run(brain.db, "update li_posts set status = 'falhou', erro = 'publicação interrompida: confira a página antes de tentar de novo' where id = ?", id);
  try {
    const res = await f("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-restli-protocol-version": "2.0.0", "linkedin-version": env.LINKEDIN_VERSION ?? "202511" },
      body: JSON.stringify({ author: `urn:li:organization:${org}`, commentary: escaparLinkedIn(p.texto), visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false }),
    });
    if (!res.ok) {
      const b = (await res.json().catch(() => ({}))) as { message?: string };
      throw new BrainError("invalid", `LinkedIn recusou (${res.status}): ${b.message ?? "erro"}${res.status === 401 ? ". O token venceu: gere outro." : ""}`);
    }
    const urn = res.headers.get("x-restli-id") ?? "";
    const link = urn ? `https://www.linkedin.com/feed/update/${urn}/` : null;
    run(brain.db, "update li_posts set status = 'publicado', publicado_em = ?, urn = ?, permalink = ?, erro = null where id = ?", brain.clock(), urn || null, link, id);
    brain.audit("sistema", "li_publicou", p.categoria, { urn });
    brain.emit("change");
    return "Publicado no LinkedIn.";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    run(brain.db, "update li_posts set status = 'falhou', erro = ? where id = ?", msg.slice(0, 300), id);
    brain.emit("change");
    throw e;
  }
}

/** Roda no cron das 7h: nos dias de postar, deixa o post do dia pronto para você aprovar. */
export async function liRotina(brain: Brain, env: Env, f: typeof fetch = fetch): Promise<string | null> {
  if (brain.policy<boolean>("li_gerar", true) === false || !diaDePostar(brain.clock())) return null;
  try { const r = await liGerar(brain, env, f); return r ? `Post do LinkedIn pronto: ${r.categoria}.` : null; } catch (e) { return e instanceof Error ? e.message : String(e); }
}
