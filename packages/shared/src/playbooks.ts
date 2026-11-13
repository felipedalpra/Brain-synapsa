import type { Playbook } from "./types";

const CONTEXTO = `Contexto fixo: a Synapsa é uma plataforma de IA para psicólogos autônomos e clínicas no Brasil. Plano grátis até 5 pacientes; plano Essencial a R$ 79 (R$ 119 de tabela). Meta: R$ 1.200 de MRR até 31/12/2026. Nunca ofereça desconto, nunca prometa resultado clínico, nunca cite paciente. Use consultar_dados antes de afirmar qualquer número do negócio.`;

const ENTREGA = `Entregue pelo relatorio: "resumo" com 1 ou 2 frases e "entrega" com o documento completo em texto (títulos curtos, listas, números com a fonte). Se faltar dado, diga o que falta e como obter. Termine com "Próximas 3 ações" ordenadas por impacto em R$.`;

const step = (agentId: string, titulo: string, instrucao: string, web = false) => ({ agentId, titulo, instrucao: `${instrucao}\n\n${CONTEXTO}\n${ENTREGA}`, web });

export const PLAYBOOKS: Playbook[] = [
  // ───────── Marketing
  {
    id: "mkt-mercado",
    team: "marketing",
    titulo: "Mapa de mercado e concorrentes",
    objetivo: "Saber contra quem a Synapsa compete, como se posiciona e que ângulo de mensagem está livre.",
    sintese: true,
    passos: [
      step("inteligencia", "Concorrentes e preços", "Pesquise na web as plataformas e softwares de gestão de consultório e prontuário para psicólogos no Brasil. Para cada uma (mínimo 6): preço, plano grátis, promessa principal, pontos fracos citados por usuários, e como se vendem. Monte uma tabela comparativa com a Synapsa e aponte 3 ângulos de mensagem que ninguém está usando.", true),
      step("inteligencia", "Demanda e busca", "Pesquise na web o que psicólogos autônomos buscam sobre captar pacientes, organizar consultório, agenda, prontuário e IA. Liste 15 temas por relevância, com a dor por trás de cada um e um título de conteúdo para cada.", true),
    ],
  },
  {
    id: "mkt-semana",
    team: "marketing",
    titulo: "Plano de conteúdo da semana",
    objetivo: "Cinco posts prontos para o Instagram, baseados no que já funcionou no perfil.",
    sintese: false,
    passos: [step("conteudo", "Calendário e textos", "Consulte os dados do Instagram (posts recentes, curtidas, comentários) e identifique os 2 formatos e temas que mais engajaram. Monte 5 posts para a próxima semana (gancho, roteiro ou legenda pronta, chamada para ação sem prometer resultado). Proponha cada um com a ferramenta propor (canal instagram), para eu aprovar e publicar.")],
  },
  {
    id: "mkt-anuncios",
    team: "marketing",
    titulo: "Revisão de anúncios e teste de campanha",
    objetivo: "Decidir se vale rodar anúncio agora, com que oferta e que orçamento de teste.",
    sintese: true,
    passos: [
      step("midia", "Leitura dos anúncios", "Consulte os dados de anúncios dos últimos 30 dias (com atualizar=true). Diga quanto gastou, o custo por lead e o que funcionou ou não. Se a conta está parada, diga isso sem rodeio e descreva o que precisa existir antes de voltar (página de destino, oferta do plano grátis até 5 pacientes, evento de lead)."),
      step("alocador", "Onde pôr o dinheiro", "Com os dados de receita e de anúncios, proponha como dividir um orçamento de teste de R$ 1.500 a R$ 3.000 entre anúncios (Meta), conteúdo, indicação e prospecção, com custo de aquisição esperado por canal e o critério para escalar ou encerrar em 14 dias. Seja explícito sobre o que é estimativa."),
    ],
  },
  {
    id: "mkt-prospeccao",
    team: "marketing",
    titulo: "Esteira de prospecção no LinkedIn",
    objetivo: "Definir quem abordar, com que mensagem e em que cadência, sem lista de pessoas.",
    sintese: false,
    passos: [step("prospeccao", "Perfil ideal e abordagem", "Defina o perfil ideal de psicólogo autônomo para a Synapsa (tempo de carreira, número de pacientes, dores) e os critérios para filtrar no LinkedIn. Escreva 3 mensagens de abordagem (conexão, primeira conversa, follow-up em 3 dias) sem prometer resultado e sem desconto. Descreva a cadência e a métrica de sucesso. Não monte lista de pessoas: eu faço a busca e o envio.", true)],
  },
  {
    id: "mkt-indicacao",
    team: "marketing",
    titulo: "Programa de indicação",
    objetivo: "Fazer os 7 clientes atuais trazerem colegas, sem oferecer desconto.",
    sintese: false,
    passos: [step("indicacao", "Desenho do programa", "Desenhe um programa de indicação para os clientes atuais que não envolva desconto: como pedir, em que momento, mensagem pronta para eu enviar por WhatsApp, e como medir. Use consultar_dados clientes para saber quem são. Proponha as mensagens com a ferramenta propor (canal whatsapp, com contact_ref do cliente).")],
  },

  // ───────── Comercial
  {
    id: "com-clinicas",
    team: "comercial",
    titulo: "Playbook de venda para clínicas",
    objetivo: "Roteiro completo para vender a clínicas, com objeções e cadência.",
    sintese: false,
    passos: [step("sdr", "Roteiro e objeções", "Escreva o playbook de venda para clínicas de psicologia: perguntas de qualificação, roteiro da primeira conversa, as 8 objeções mais prováveis com resposta, cadência de follow-up (mínimo 3 dias entre contatos) e critérios para desistir. Use o caso da clínica que já é cliente (consultar_dados clientes) como referência de valor, sem expor dados dela.", true)],
  },
  {
    id: "com-fechamento",
    team: "comercial",
    titulo: "Preparar reunião e fechamento",
    objetivo: "Checklist e material para qualquer reunião de venda.",
    sintese: false,
    passos: [step("closer", "Kit de reunião", "Monte o kit de reunião de venda: pauta de 30 minutos, perguntas, demonstração sugerida do produto, como tratar preço (sem desconto: mostre valor e o plano grátis até 5 pacientes), proposta de próximos passos e e-mail de resumo pós-reunião para eu enviar.")],
  },
  {
    id: "com-ativacao",
    team: "comercial",
    titulo: "Ativação do plano grátis",
    objetivo: "Levar cadastro até perfil publicado e primeiro paciente, e preparar o convite ao Essencial.",
    sintese: true,
    passos: [
      step("ativacao", "Sequência de ativação", "Desenhe a sequência de mensagens do cadastro até o primeiro paciente real (dia 0, 1, 3, 7), com o texto de cada uma. Diga quais dados do funil faltam para medir cada etapa (a plataforma ainda não alimenta o Brain com cadastros) e como instrumentar."),
      step("pagar", "Convite ao Essencial", "Desenhe o gatilho e o texto do convite ao Essencial quando o psicólogo chega perto do limite de 5 pacientes. Sem desconto e sem pressão artificial. Diga o que precisa existir na plataforma para o Brain detectar o momento."),
    ],
  },

  // ───────── Estratégia
  {
    id: "est-mrr",
    team: "estrategia",
    titulo: "Plano para R$ 1.200 de MRR até 31/12",
    objetivo: "Caminho numérico da receita atual até a meta, com cenários e prazos.",
    sintese: true,
    passos: [
      step("financeiro", "Conta e cenários", "Consulte receita e clientes. Calcule quantos clientes novos do Essencial a R$ 79 faltam, quantos por semana até 31/12, o efeito dos fins de desconto (quem passa de R$ 49 para R$ 119,99 e o risco de cancelar) e monte 3 cenários (conservador, base, agressivo) com a premissa de cada um."),
      step("alocador", "Canais para chegar lá", "Dado o número de clientes novos necessário, diga quantos cadastros, ativações e conversões isso exige com taxas realistas de SaaS B2B pequeno (marque como estimativa) e que canal entrega isso ao menor custo."),
    ],
  },
  {
    id: "est-semana",
    team: "estrategia",
    titulo: "Revisão semanal do negócio",
    objetivo: "Uma leitura única: receita, clientes, anúncios, Instagram, fila e o que fazer primeiro.",
    sintese: true,
    passos: [
      step("metricas", "Números da semana", "Consulte receita, clientes, anúncios (atualizar=true) e Instagram (atualizar=true). Resuma o que mudou, o que preocupa e o que está funcionando, com números."),
      step("experimentos", "Experimento da semana", "Escolha UM experimento para a semana com hipótese, métrica, duração e critério de escalar ou encerrar, ligado a ativação ou receita."),
    ],
  },
  {
    id: "est-conformidade",
    team: "estrategia",
    titulo: "Auditoria de conformidade e LGPD",
    objetivo: "Conferir o que o Brain acessa e o que sai, e o que falta para operar com segurança.",
    sintese: false,
    passos: [step("compliance", "Auditoria", "Revise o que o Brain lê (Stripe, Meta, Instagram), onde ficam os dados, quem acessa, e o que as regras de Conformidade barram. Aponte riscos de LGPD para uma plataforma que atende psicólogos (dados de pacientes ficam fora do Brain) e liste ajustes por prioridade.", true)],
  },

  // ───────── Produto
  {
    id: "prod-mercado",
    team: "produto",
    titulo: "Recursos que o mercado oferece",
    objetivo: "O que concorrentes e psicólogos esperam do produto e onde a Synapsa pode ganhar.",
    sintese: true,
    passos: [
      step("descoberta", "Pesquisa de recursos", "Pesquise na web os recursos de plataformas de gestão para psicólogos no Brasil (agenda, prontuário, cobrança, teleatendimento, IA, adesão do paciente). Monte uma matriz recurso x concorrente, aponte lacunas e o que os psicólogos mais reclamam.", true),
      step("especificacao", "Spec do item mais promissor", "Pegue o recurso de maior impacto em retenção e adesão do paciente (foco da Synapsa) e escreva a especificação: problema, usuário, critérios de aceite, rascunho de tela em texto e como medir sucesso."),
    ],
  },
  {
    id: "prod-uso",
    team: "produto",
    titulo: "Onde o usuário trava",
    objetivo: "Diagnóstico de uso e plano para medir.",
    sintese: false,
    passos: [step("uso", "Diagnóstico", "Diga o que já dá para saber do uso (hoje a plataforma ainda não envia eventos ao Brain), quais eventos precisam ser enviados (cadastro, perfil publicado, primeiro paciente, limite de 5) e escreva a lista de eventos com nome e propriedades para o time de produto implementar.")],
  },
  {
    id: "prod-lancamento",
    team: "produto",
    titulo: "Plano de lançamento de novidade",
    objetivo: "Changelog, tutorial e aviso para cada lançamento.",
    sintese: false,
    passos: [step("lancamento", "Kit de lançamento", "Monte o modelo de lançamento: changelog curto, roteiro de tutorial em 60 segundos, mensagem de aviso para os clientes (WhatsApp e e-mail) e post para o Instagram. Deixe os campos a preencher claros para eu usar a cada novidade.")],
  },

  // ───────── Sucesso
  {
    id: "suc-saude",
    team: "sucesso",
    titulo: "Saúde dos pagantes e risco de cancelar",
    objetivo: "Plano de contato com cada cliente, principalmente os que têm desconto acabando.",
    sintese: false,
    passos: [step("saude", "Plano por cliente", "Consulte clientes e receita. Para cada cliente ativo diga o risco de cancelar (e por quê), o melhor momento de contato antes do fim do desconto e o roteiro da conversa (sem oferecer desconto, mostrando valor). Proponha o contato dos 3 mais urgentes com a ferramenta propor (canal tarefa).")],
  },
  {
    id: "suc-cobranca",
    team: "sucesso",
    titulo: "Recuperação de pagamentos",
    objetivo: "Fluxo para pagamento que falha, sem desgastar o cliente.",
    sintese: false,
    passos: [step("cobranca", "Fluxo de cobrança", "Desenhe o fluxo para pagamento falho (Stripe) e atraso de Pix: mensagens nos dias 0, 3 e 7, tom, o que nunca dizer, e quando eu entro pessoalmente. Considere que hoje o Pix é informado por mim e não lido de um banco.")],
  },
  {
    id: "suc-clinica",
    team: "sucesso",
    titulo: "Conta da clínica",
    objetivo: "Cuidar da conta de R$ 300 por mês: o que reportar e como crescer dentro dela.",
    sintese: false,
    passos: [step("relclinica", "Relatório e expansão", "Monte o modelo do relatório semanal para a clínica (o que foi resolvido, em andamento, próximos passos) e um plano de expansão dentro da conta (mais profissionais usando) sem desconto. Sem dado clínico.")],
  },
];

export const playbookById = (id: string) => PLAYBOOKS.find((p) => p.id === id);
