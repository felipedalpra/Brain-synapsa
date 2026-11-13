import type { Activity, AgentRuntime, Integration, Metrics, Proposal } from "./types";
import { AGENTS } from "./roster";

const MIN = 60_000;

/** Atividade de demonstração: o que os agentes fizeram nas últimas horas. */
export function mockActivity(now: number): Activity[] {
  const a = (id: string, agentId: string, minAgo: number, text: string, tone: Activity["tone"] = "normal"): Activity => ({ id, agentId, at: now - minAgo * MIN, text, tone });
  return [
    a("a1", "chief", 22, "Montou o briefing de hoje: 3 decisões novas e 5 que já esperavam por você."),
    a("a2", "compliance", 41, "Barrou 2 mensagens do LinkedIn por prometer resultado a pacientes.", "alerta"),
    a("a3", "midia", 58, "Leu o Meta Ads: 1 campanha gastou R$ 84 em 7 dias sem nenhum lead. Abriu proposta de revisão.", "alerta"),
    a("a4", "prospeccao", 96, "Pontuou 18 psicólogos novos. 6 combinam com o perfil de quem tem agenda cheia e gestão bagunçada."),
    a("a5", "guardiao", 140, "Auditou a base: 11 perfis sem último acesso. Pediu sua confirmação para corrigir.", "alerta"),
    a("a6", "financeiro", 175, "Conciliou Stripe, Pix e plataforma: MRR de R$ 496, sem divergência.", "ok"),
    a("a7", "metricas", 181, "Fechou o funil do dia: 35 cadastros, 20 ativados, 4 no limite, 5 pagantes."),
    a("a8", "conteudo", 230, "Planejou as pautas da semana e deixou 1 carrossel pronto para revisão."),
    a("a9", "descoberta", 262, "Agrupou 4 feedbacks sobre o financeiro do consultório num tema só."),
    a("a10", "saude", 310, "Calculou o risco dos 5 pagantes: nenhum em alerta.", "ok"),
    a("a11", "escalonador", 355, "Abriu 1 tarefa para o desenvolvedor, com passos para reproduzir o erro da clínica."),
    a("a12", "cobranca", 402, "Detectou 1 pagamento falho no Stripe e preparou o lembrete."),
    a("a13", "inteligencia", 440, "Viu que um concorrente mudou o preço do plano de entrada. Resumo na sua fila."),
  ];
}

export function mockRuntime(now: number): Record<string, AgentRuntime> {
  const base: Record<string, AgentRuntime> = {};
  const lastFor = mockActivity(now);
  for (const g of AGENTS) {
    const last = lastFor.find((x) => x.agentId === g.id);
    base[g.id] = {
      status: "ocioso",
      lastAction: last?.text ?? "Aguardando o próximo gatilho.",
      lastAt: last?.at ?? now - 12 * 60 * MIN,
      runsToday: last ? 2 + (g.id.length % 4) : 1,
      costBrl: Math.round((0.12 + (g.id.length % 7) * 0.09) * 100) / 100,
    };
  }
  // Quem está no meio de uma tarefa agora.
  for (const id of ["prospeccao", "midia", "metricas"]) {
    const r = base[id];
    if (r) r.status = "trabalhando";
  }
  return base;
}

export function mockProposals(now: number): Proposal[] {
  const p = (id: string, agentId: string, minAgo: number, v: Omit<Proposal, "id" | "agentId" | "at" | "status" | "review"> & { review?: Proposal["review"] }): Proposal => ({
    id,
    agentId,
    at: now - minAgo * MIN,
    status: "pendente",
    review: v.review ?? "aprovada pela conformidade",
    ...v,
  });
  return [
    p("p1", "pagar", 30, {
      title: "Convidar psicóloga com 5 de 5 pacientes para o Essencial",
      draft: "Oi, tudo bem? Vi que sua agenda na Synapsa já está cheia: você chegou nos 5 pacientes do plano gratuito. O Essencial libera pacientes sem limite e o financeiro completo. Quer que eu te mostre em 5 minutos como fica?",
      why: "Bateu o limite hoje e abriu o painel financeiro 3 vezes. É o sinal mais forte de compra.",
      impactoBrl: 948,
      risk: "baixo",
      channel: "whatsapp",
    }),
    p("p2", "cobranca", 65, {
      title: "Lembrete de pagamento falho (assinatura no Stripe)",
      draft: "Oi! O pagamento da sua assinatura da Synapsa não passou hoje. Pode ser o cartão vencido. Esse link atualiza em um minuto: [link do portal]. Qualquer dúvida, me chama.",
      why: "Falha de cartão responde por boa parte dos cancelamentos evitáveis. Esta conta paga R$ 49 por mês.",
      impactoBrl: 588,
      risk: "baixo",
      channel: "whatsapp",
    }),
    p("p3", "midia", 58, {
      title: "Revisar campanha \"Autônomos – Captação\": R$ 84 sem lead em 7 dias",
      draft: null,
      why: "Gastou R$ 84, teve 212 cliques e nenhum cadastro. O Brain nunca pausa sozinho: você decide pausar, trocar o criativo ou manter.",
      impactoBrl: 84,
      risk: "baixo",
      channel: "interno",
    }),
    p("p4", "prospeccao", 96, {
      title: "Abordagem no LinkedIn: psicóloga com 4 anos de CRP em Porto Alegre",
      draft: "Oi! Vi seu trabalho com terapia de casal e achei muito bem posicionado. Estou construindo a Synapsa, uma plataforma que organiza agenda, financeiro e retorno de pacientes para psicólogos autônomos. Posso te mandar um vídeo de 1 minuto? Sem compromisso.",
      why: "Perfil publicado, sem site próprio e com sinais de agenda cheia. Mensagem curta, sem promessa de resultado.",
      impactoBrl: 948,
      risk: "baixo",
      channel: "linkedin",
    }),
    p("p5", "guardiao", 140, {
      title: "Corrigir último acesso vazio em 11 perfis",
      draft: null,
      why: "Sem esse campo o Analista de Métricas não separa ativo de inativo e o funil fica impreciso.",
      impactoBrl: 0,
      risk: "medio",
      channel: "tarefa",
    }),
    p("p6", "conteudo", 230, {
      title: "Carrossel: \"Agenda cheia sem depender de indicação\"",
      draft: "Legenda: Quem tem consultório sabe: a agenda enche e esvazia sem aviso. 5 passos simples para deixar o fluxo de pacientes mais previsível. Salve para aplicar na segunda. (7 slides prontos em anexo)",
      why: "O formato carrossel com tema de gestão teve o dobro de salvamentos nos últimos 30 dias.",
      impactoBrl: 150,
      risk: "baixo",
      channel: "instagram",
    }),
    p("p7", "inteligencia", 440, {
      title: "Concorrente mudou o preço do plano de entrada: ajustar o ângulo da mensagem",
      draft: null,
      why: "Reforça o argumento de preço único e financeiro incluso. Sem mudança no seu preço.",
      impactoBrl: 0,
      risk: "baixo",
      channel: "interno",
      review: "aprovada pela conformidade",
    }),
    p("p8", "closer", 300, {
      title: "Dossiê da reunião de quinta com a clínica interessada",
      draft: "Resumo: clínica com 6 profissionais, usa planilha para agenda e cobrança. Dor principal: faltas sem aviso. Perguntar: quantos atendem por semana? Quem cuida do financeiro?",
      why: "Reunião em 2 dias. O Closer Assist só prepara e não abre venda de clínica nova.",
      impactoBrl: 3600,
      risk: "medio",
      channel: "interno",
    }),
  ];
}

export function mockIntegrations(): Integration[] {
  const i = (x: Integration): Integration => x;
  return [
    i({ id: "plataforma", name: "Plataforma Synapsa", state: "pendente", detail: "O mvp-v2 ainda não grava os eventos do Brain. O PR com a tabela de eventos e as views de leitura não foi aberto.", unlocks: "Cadastros, pacientes, uso e limite de 5 pacientes em tempo real.", secrets: ["BRAIN_RO_DATABASE_URL"], next: "Autorizar push no repositório mvp-v2 e criar o papel brain_ro.", syncMinutes: 4, agents: ["ativacao", "pagar", "saude", "metricas"] }),
    i({ id: "stripe", name: "Stripe", state: "pronto", detail: "Chave restrita recebida e guardada no cofre. Ainda não está nos secrets do Cloudflare.", unlocks: "MRR pelo valor com desconto, pagamentos falhos e fim de desconto.", secrets: ["STRIPE_READ_KEY"], next: "Colar a chave em wrangler secret put STRIPE_READ_KEY quando o Worker existir.", syncMinutes: 9, agents: ["financeiro", "cobranca", "guardiao"] }),
    i({ id: "meta", name: "Meta Ads", state: "pronto", detail: "IDs da conta de anúncios, Página e app registrados. Token do usuário de sistema guardado no cofre.", unlocks: "Gasto, cliques e leads por campanha. Proposta de revisão quando gasta sem lead.", secrets: ["META_SYSTEM_USER_TOKEN"], next: "Colar o token nos secrets do Cloudflare. Trocar por um token só de leitura antes do executor.", syncMinutes: 14, agents: ["midia", "alocador"] }),
    i({ id: "instagram", name: "Instagram", state: "pronto", detail: "Conta profissional vinculada à Página. Usa o mesmo token da Meta.", unlocks: "Seguidores, alcance e visitas ao perfil. Publica o post que você aprovar (precisa da permissão instagram_content_publish no token e de imagem em link https).", secrets: ["META_SYSTEM_USER_TOKEN"], next: "Mesmo passo da Meta.", syncMinutes: 14, agents: ["conteudo"] }),
    i({ id: "whatsapp", name: "WhatsApp Business", state: "pendente", detail: "Conta ainda não criada. Hoje você envia pelo seu próprio WhatsApp com o texto que o Brain prepara.", unlocks: "Receber respostas dos leads e registrar o aceite de contato.", secrets: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET"], next: "Criar a conta e verificar o negócio na Meta. Depois ligar o webhook de entrada.", syncMinutes: null, agents: ["sdr", "ativacao", "pagar"] }),
    i({ id: "crm", name: "CRM Synapsa", state: "pendente", detail: "API REST do CRM Synapsa. Falta cadastrar SYNAPSA_CRM_API_BASE_URL e SYNAPSA_CRM_API_KEY nos secrets.", unlocks: "Leads, funil de vendas, atividades, reuniões e métricas do CRM para o Comercial e o Chief. Os agentes só leem; criar, editar e excluir existem no cliente do backend e só rodam com ordem sua (exclusão, só com confirmação).", secrets: ["SYNAPSA_CRM_API_KEY", "SYNAPSA_CRM_API_BASE_URL"], next: "Cadastrar os dois como Secret no Cloudflare. A chave expira em 27/10/2027.", syncMinutes: null, agents: ["sdr", "closer", "ativacao", "metricas", "chief"] }),
    i({ id: "apify", name: "Apify (prospecção)", state: "pendente", detail: "Lê o Google Maps e os sites das clínicas. Só pesquisa, não envia nada a ninguém.", unlocks: "Lista de clínicas de SP, RJ e MG com equipe, e-mail público e nota, pronta para o CRM depois do seu OK.", secrets: ["APIFY_TOKEN"], next: "Criar o token em console.apify.com > Settings > API & Integrations e guardar como APIFY_TOKEN.", syncMinutes: null, agents: [] }),
    i({ id: "resend", name: "Resend (e-mail)", state: "pendente", detail: "Domínio synapsa.chat definido. Falta verificar o subdomínio de envio e criar a chave.", unlocks: "E-mail de retenção e de fim de desconto, enviado só depois da sua aprovação.", secrets: ["RESEND_API_KEY", "RESEND_FROM"], next: "Criar a chave (Sending access) e o secret RESEND_FROM, ex.: Felipe da Synapsa <felipe@mail.synapsa.chat>. Opcional: RESEND_REPLY_TO.", syncMinutes: null, agents: ["cobranca", "saude", "lancamento"] }),
    i({ id: "linkedin", name: "LinkedIn", state: "manual", detail: "Sem API. O Brain prepara a mensagem e você envia pelo seu perfil.", unlocks: "Fila de abordagens prontas, com a resposta de cada lead registrada à mão.", secrets: [], next: "Nada a colar. Marque \"enviada\" na fila para o Brain acompanhar.", syncMinutes: null, agents: ["prospeccao", "sdr"] }),
    i({ id: "google", name: "Google (Calendar, GA4, Search Console)", state: "pendente", detail: "Ainda não conectado.", unlocks: "Reuniões do Closer Assist, tráfego do site e termos de busca para o SEO.", secrets: ["GOOGLE_OAUTH_REFRESH_TOKEN"], next: "Criar o acesso OAuth com escopos só de leitura.", syncMinutes: 30, agents: ["closer", "inteligencia", "metricas"] }),
    i({ id: "openai", name: "OpenAI API", state: "pendente", detail: "Chave ainda não criada. Crie uma com limite mensal de gasto.", unlocks: "O raciocínio de todos os agentes e do Jarvis.", secrets: ["OPENAI_API_KEY"], next: "Criar a chave em platform.openai.com e definir um teto mensal de R$ 300.", syncMinutes: 1, agents: ["chief"] }),
    i({ id: "supabase", name: "Supabase do Brain", state: "pendente", detail: "Migrations prontas e testadas. O projeto ainda não existe.", unlocks: "Guardar propostas, aprovações, auditoria e o kill switch.", secrets: ["SUPABASE_SERVICE_KEY"], next: "Escolher a organização e criar o projeto em sa-east-1.", syncMinutes: 1, agents: ["chief", "compliance"] }),
    i({ id: "cloudflare", name: "Cloudflare Workers", state: "pendente", detail: "Código do worker pronto e testado. Falta a conta paga e o token de deploy.", unlocks: "Rodar os agentes todo dia às 7h e a leitura de Stripe e Meta.", secrets: ["CLOUDFLARE_API_TOKEN"], next: "Ativar o plano pago e criar um token restrito.", syncMinutes: 1, agents: ["guardiao"] }),
  ];
}

/** Números de demonstração, coerentes com o que o Felipe informou. */
export const DEMO_METRICS: Metrics = {
  mrr: { stripe: 147, pix: 349, manual: 0, total: 496, goal: 1200, goalDate: "31/12/2026", essencialPrice: 79 },
  funil: { cadastros: 35, ativados: 20, noLimite: 4, pagantes: 5 },
  llmCapMonthlyBrl: 300,
  llmSpentMonthBrl: 61.4,
  descontos: [
    { quando: "23/01/2027", contas: 2, de: 49, para: 119 },
    { quando: "02/03/2027", contas: 1, de: 49, para: 119 },
  ],
};
