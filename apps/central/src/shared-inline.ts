// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.

export const zi = [
  {
    id: "comando",
    name: "Comando",
    goal: "Seu tempo concentrado no que move o MRR.",
  },
  {
    id: "ativacao",
    name: "Ativa\xE7\xE3o e convers\xE3o",
    goal: "Do cadastro ao Essencial: perfil publicado, primeiro paciente, limite de 5 pacientes.",
  },
  {
    id: "sucesso",
    name: "Sucesso e reten\xE7\xE3o",
    goal: "Nenhum pagante cancela. Todo feedback vira a\xE7\xE3o.",
  },
  {
    id: "clinica",
    name: "Cl\xEDnica",
    goal: "Conta estrat\xE9gica: erros resolvidos antes de vender outra cl\xEDnica.",
  },
  {
    id: "growth",
    name: "Growth e dados",
    goal: "Funil medido, n\xFAmeros confi\xE1veis, testes que terminam em decis\xE3o.",
  },
  {
    id: "aquisicao",
    name: "Aquisi\xE7\xE3o de aut\xF4nomos",
    goal: "Cadastros ativados por semana. Canais: LinkedIn, indica\xE7\xE3o e Instagram.",
  },
  {
    id: "produto",
    name: "Produto",
    goal: "Prioridade por impacto em R$: financeiro e estabilidade da cl\xEDnica v\xEAm primeiro.",
  },
  {
    id: "financeiro",
    name: "Financeiro e conformidade",
    goal: "Caminho at\xE9 R$ 1.200 e zero risco regulat\xF3rio.",
  },
  {
    id: "comercial",
    name: "Comercial consultivo",
    goal: "Prepara reuni\xF5es e conversas. Sem prospec\xE7\xE3o ativa de cl\xEDnica at\xE9 a atual estabilizar.",
  },
];
export const Q = [
  {
    id: "chief",
    area: "comando",
    ready: "pronto",
    name: "Chief of Staff",
    mission: "Reunir tudo que precisa de voc\xEA num briefing e numa fila ordenada por impacto em R$.",
    metric: "Minutos por dia na fila de aprova\xE7\xE3o, sem perder receita",
    needs: "Propostas e resultados dos outros agentes.",
    triggers: [
      "Todo dia \xE0s 7h",
      "Proposta de alto impacto chegou",
      "Dois agentes querem falar com a mesma pessoa",
    ],
    subs: [
      {
        name: "Priorizador",
        tier: "forte",
        does: "Ordena a fila pelo impacto estimado no MRR",
      },
      {
        name: "Resolvedor de conflitos",
        tier: "leve",
        does: "Define o dono da conversa e respeita o intervalo entre contatos",
      },
      {
        name: "Redator do briefing",
        tier: "forte",
        does: "Resume o dia em decis\xF5es, n\xE3o em relat\xF3rios",
      },
    ],
    auto: ["Montar o briefing", "Ordenar a fila", "Atribuir o dono de cada conversa"],
    aprova: [],
    humano: ["Toda decis\xE3o que sai da fila"],
    limits: "N\xE3o envia nada para fora. Entrega no m\xE1ximo cerca de 15 itens por dia na fila.",
    learns: "Registra o que voc\xEA aprova primeiro e o que deixa parado, e reordena a fila com isso.",
    note: null,
  },
  {
    id: "ativacao",
    area: "ativacao",
    ready: "parcial",
    name: "Ativa\xE7\xE3o do Freemium",
    mission: "Levar cada cadastro at\xE9 perfil publicado e primeiro paciente real.",
    metric: "Cadastros ativados (hoje cerca de 20 de 35)",
    needs:
      "Cadastros, pacientes e consultas da plataforma. Perfil publicado e \xFAltimo acesso ainda n\xE3o chegam como evento.",
    triggers: [
      "Cadastro novo",
      "48h sem perfil publicado",
      "Perfil publicado e nenhum paciente em 7 dias",
      "Primeiro paciente chegou",
    ],
    subs: [
      {
        name: "Rastreador de marcos",
        tier: "leve",
        does: "Acompanha perfil publicado, agenda, primeiro paciente, primeira consulta e link divulgado",
      },
      {
        name: "Concierge de perfil p\xFAblico",
        tier: "forte",
        does: "Ajuda a escrever a bio e o texto do site, pensando em ser encontrado",
      },
      {
        name: "Redator",
        tier: "forte",
        does: "Mensagem curta, no tom da Synapsa",
      },
    ],
    auto: ["Boas-vindas e parab\xE9ns pelo 1\xBA paciente, com modelos que voc\xEA j\xE1 aprovou"],
    aprova: ["Ajuda para montar o perfil", "Dicas para divulgar o link"],
    humano: [],
    limits:
      "1 contato a cada 3 dias. Para quando a pessoa responde. S\xF3 com aceite de WhatsApp. Entre 9h e 19h.",
    learns: "Guarda as mensagens aprovadas sem edi\xE7\xE3o como modelo e o que voc\xEA corta nas outras.",
    note: null,
  },
  {
    id: "pagar",
    area: "ativacao",
    ready: "parcial",
    name: "Momento de Pagar",
    mission: "Convidar para o Essencial na hora em que o limite de 5 pacientes aperta.",
    metric: "Convers\xE3o do gratuito para o Essencial",
    needs:
      "Contagem de pacientes e plano, na plataforma. Falta registrar a tentativa de usar recurso bloqueado.",
    triggers: [
      "4 de 5 pacientes (cerca de 80% do limite)",
      "Limite batido",
      "Tentou usar recurso bloqueado",
      "Ativo h\xE1 14 dias ou mais sem bater o limite",
    ],
    subs: [
      {
        name: "Detector de inten\xE7\xE3o",
        tier: "leve",
        does: "D\xE1 nota de inten\xE7\xE3o de compra a cada sinal",
      },
      {
        name: "Calculador de limite",
        tier: "leve",
        does: "Mede o uso do limite de pacientes",
      },
      {
        name: "Gestor do trial de 14 dias",
        tier: "forte",
        does: "Cuida de quem chega com mais de 5 pacientes: abre, acompanha e fecha o trial",
      },
      {
        name: "Redator",
        tier: "forte",
        does: "Convite de valor, sem press\xE3o",
      },
    ],
    auto: [],
    aprova: ["Convite de valor", "Convite imediato com link de assinatura", "Abertura do trial de 14 dias"],
    humano: ["Qualquer desconto", "Pergunta de pre\xE7o ou obje\xE7\xE3o"],
    limits: "Nunca oferece desconto. 1 contato a cada 3 dias. Para quando a pessoa responde.",
    learns: "Qual sinal e qual mensagem antecederam cada assinatura.",
    note: "O sinal de recurso bloqueado ainda precisa ser registrado pela plataforma.",
  },
  {
    id: "saude",
    area: "sucesso",
    ready: "pronto",
    name: "Sa\xFAde da Conta e Voz do Cliente",
    mission: "Nenhum pagante cancela, e todo feedback chega a quem pode agir.",
    metric: "Churn dos pagantes (meta: zero)",
    needs: "Uso e assinatura na plataforma, mais o feedback que voc\xEA repassar.",
    triggers: ["Queda de uso", "Pagante sem login h\xE1 7 dias", "Reclama\xE7\xE3o ou NPS baixo"],
    subs: [
      {
        name: "Radar de risco",
        tier: "leve",
        does: "D\xE1 nota de risco a cada pagante",
      },
      {
        name: "Detetive de causa",
        tier: "forte",
        does: "Explica por que a conta est\xE1 em risco, por exemplo uma queixa sobre o financeiro",
      },
      {
        name: "Coletor de feedback",
        tier: "leve",
        does: "Pede e organiza o que os pagantes dizem",
      },
      {
        name: "Redator",
        tier: "forte",
        does: "Contato de cuidado, humano e direto",
      },
    ],
    auto: ["Calcular risco", "Registrar feedback"],
    aprova: ["Contato de cuidado", "Pedido de feedback"],
    humano: ["Conversa com a conta em risco", "Qualquer concess\xE3o"],
    limits: "Pagante s\xF3 recebe contato com a sua aprova\xE7\xE3o.",
    learns: "Quais sinais antecederam um cancelamento ou uma reclama\xE7\xE3o.",
    note: "Os feedbacks que se repetem v\xE3o direto para o agente de Descoberta, no Produto.",
  },
  {
    id: "cobranca",
    area: "sucesso",
    ready: "parcial",
    name: "Cobran\xE7a",
    mission: "Recuperar pagamentos que falharam sem desgastar o cliente.",
    metric: "Valor recuperado de pagamentos falhados",
    needs:
      "Status de pagamento vem da assinatura na plataforma. O Stripe direto deixa a leitura mais precisa.",
    triggers: ["Pagamento falhou", "Cart\xE3o perto do vencimento", "Prazo da r\xE9gua venceu"],
    subs: [
      {
        name: "R\xE9gua de cobran\xE7a",
        tier: "leve",
        does: "Define o pr\xF3ximo lembrete e o prazo",
      },
      {
        name: "Redator",
        tier: "forte",
        does: "Lembrete educado com o link de atualiza\xE7\xE3o",
      },
    ],
    auto: [],
    aprova: ["Lembrete com link de atualiza\xE7\xE3o"],
    humano: ["Negociar, parcelar ou estornar"],
    limits:
      "O lembrete padr\xE3o pode virar autom\xE1tico depois de cerca de 20 aprova\xE7\xF5es sem edi\xE7\xE3o.",
    learns: "Quanto tempo depois do lembrete o pagamento volta.",
    note: null,
  },
  {
    id: "escalonador",
    area: "clinica",
    ready: "parcial",
    name: "Escalonador T\xE9cnico",
    mission: "Transformar cada erro da cl\xEDnica em tarefa clara, com passos para reproduzir.",
    metric: "Erros abertos por semana e tempo para resolver",
    needs:
      "Precisa de um lugar para a cl\xEDnica relatar o erro e de uma ferramenta de tarefas para o desenvolvedor.",
    triggers: ["Mensagem da cl\xEDnica relatando problema", "Erro registrado na plataforma"],
    subs: [
      {
        name: "Classificador",
        tier: "leve",
        does: "Separa bug, d\xFAvida e pedido, e a urg\xEAncia",
      },
      {
        name: "Reprodutor",
        tier: "forte",
        does: "Descreve os passos para reproduzir o erro",
      },
      {
        name: "Redator de tarefa",
        tier: "leve",
        does: "Abre a tarefa pronta para o desenvolvedor",
      },
    ],
    auto: ["Classificar", "Abrir tarefa com contexto"],
    aprova: ["Resposta \xE0 cl\xEDnica"],
    humano: ["Prioridade final", "Decidir a corre\xE7\xE3o"],
    limits:
      "Sem acesso a conte\xFAdo cl\xEDnico de paciente. S\xF3 a descri\xE7\xE3o do erro e identificadores.",
    learns: "Tipos de erro que se repetem.",
    note: null,
  },
  {
    id: "relclinica",
    area: "clinica",
    ready: "pronto",
    name: "Relat\xF3rio da Cl\xEDnica",
    mission: "Mostrar \xE0 cl\xEDnica, toda semana, o que foi resolvido e o que est\xE1 em andamento.",
    metric: "Satisfa\xE7\xE3o da cl\xEDnica",
    needs: "Tarefas e corre\xE7\xF5es registradas pelo Escalonador T\xE9cnico.",
    triggers: ["Toda sexta-feira"],
    subs: [
      {
        name: "Compilador",
        tier: "leve",
        does: "Junta o que foi resolvido e o que segue aberto",
      },
      {
        name: "Redator",
        tier: "forte",
        does: "Escreve em linguagem simples, sem jarg\xE3o t\xE9cnico",
      },
    ],
    auto: ["Compilar os dados"],
    aprova: ["Envio do relat\xF3rio"],
    humano: ["Conversa de alinhamento com a cl\xEDnica"],
    limits: "N\xE3o promete prazo que voc\xEA n\xE3o confirmou.",
    learns: "O que a cl\xEDnica mais pergunta.",
    note: null,
  },
  {
    id: "guardiao",
    area: "growth",
    ready: "pronto",
    name: "Guardi\xE3o de Dados",
    mission: "Garantir que cada n\xFAmero usado pelos agentes esteja certo.",
    metric: "Campos cr\xEDticos preenchidos e diverg\xEAncias abertas",
    needs: "Leitura do banco da plataforma, do CRM e das assinaturas.",
    triggers: ["Toda noite", "Cadastro novo", "Mudan\xE7a de plano"],
    subs: [
      {
        name: "Auditor de qualidade",
        tier: "leve",
        does: "Acha campo vazio, duplicata e valor imposs\xEDvel",
      },
      {
        name: "Reconciliador",
        tier: "leve",
        does: "Cruza Stripe, plataforma e CRM e liga cada lead ao profissional certo",
      },
    ],
    auto: ["Auditar e alertar"],
    aprova: ["Corrigir um dado", "Confirmar liga\xE7\xE3o entre lead e profissional"],
    humano: ["Qualquer altera\xE7\xE3o no banco de produ\xE7\xE3o"],
    limits: "Leitura apenas no banco da plataforma.",
    learns: "Quais erros de dado se repetem e de onde v\xEAm.",
    note: "Primeiros alvos: \xFAltimo acesso e data de fim do trial vazios na base.",
  },
  {
    id: "metricas",
    area: "growth",
    ready: "parcial",
    name: "Analista de M\xE9tricas",
    mission: "Medir o funil (cadastro, ativado, no limite, pago) e o MRR todo dia.",
    metric: "N\xFAmero confi\xE1vel em cada etapa do funil",
    needs: "O funil depende dos dados que o Guardi\xE3o corrige: \xFAltimo acesso e fim do trial.",
    triggers: ["Todo dia", "Toda segunda-feira"],
    subs: [
      {
        name: "Calculador de m\xE9tricas",
        tier: "leve",
        does: "MRR, convers\xE3o por etapa e coortes",
      },
      {
        name: "Redator de relat\xF3rio",
        tier: "forte",
        does: "O que mudou, por que e o que fazer",
      },
    ],
    auto: ["Calcular", "Relat\xF3rio semanal"],
    aprova: [],
    humano: ["Decidir o que mudar"],
    limits: "Usa s\xF3 dados validados pelo Guardi\xE3o.",
    learns: "Quais m\xE9tricas voc\xEA abre e quais ignora.",
    note: null,
  },
  {
    id: "experimentos",
    area: "growth",
    ready: "pronto",
    name: "Experimentos",
    mission: "Testar uma coisa por vez e decidir: escalar ou encerrar.",
    metric: "Testes conclu\xEDdos com decis\xE3o",
    needs: "Funil e convers\xE3o do Analista de M\xE9tricas.",
    triggers: ["Hip\xF3tese aprovada", "Teste chegou ao tamanho m\xEDnimo"],
    subs: [
      {
        name: "Desenhista de teste",
        tier: "forte",
        does: "Define hip\xF3tese, grupo, m\xE9trica e dura\xE7\xE3o",
      },
      {
        name: "Leitor de resultado",
        tier: "forte",
        does: "Diz se o resultado \xE9 confi\xE1vel ou s\xF3 ru\xEDdo",
      },
    ],
    auto: ["Medir os resultados"],
    aprova: ["In\xEDcio de teste", "Escalar ou encerrar"],
    humano: [],
    limits: "Um teste por etapa do funil ao mesmo tempo.",
    learns: "O que j\xE1 foi testado, para n\xE3o repetir.",
    note: "Primeiro teste: 14 dias de Essencial para quem chega com mais de 5 pacientes, contra o limite fixo.",
  },
  {
    id: "alocador",
    area: "growth",
    ready: "parcial",
    name: "Alocador de Or\xE7amento",
    mission: "Comparar canais por custo de aquisi\xE7\xE3o e retorno e propor onde p\xF4r o dinheiro.",
    metric: "Custo por pagante",
    needs: "Meta j\xE1 sincroniza no CRM atual. Falta Google e o custo por canal do LinkedIn.",
    triggers: ["Fechamento mensal"],
    subs: [
      {
        name: "Comparador de canal",
        tier: "forte",
        does: "Custo por cadastro, por ativado e por pagante em cada canal",
      },
    ],
    auto: ["Comparar canais"],
    aprova: ["Mudan\xE7a de or\xE7amento"],
    humano: ["Gastos novos"],
    limits: "Sugest\xE3o: s\xF3 compara canais com 30 dias de dados.",
    learns: "Quais canais trazem pagantes que ficam.",
    note: null,
  },
  {
    id: "prospeccao",
    area: "aquisicao",
    ready: "pronto",
    name: "Prospec\xE7\xE3o de Aut\xF4nomos",
    mission: "Encontrar psic\xF3logos no perfil certo no LinkedIn e preparar a abordagem de cada um.",
    metric: "Cadastros ativados por semana",
    needs: "Base de leads (Vibe Prospecting e LinkedIn). O envio \xE9 manual.",
    triggers: ["Lista semanal de leads", "Resposta recebida no LinkedIn"],
    subs: [
      {
        name: "Ca\xE7ador de leads",
        tier: "leve",
        does: "Acha psic\xF3logos pelo perfil e tira duplicados",
      },
      {
        name: "Qualificador",
        tier: "leve",
        does: "Separa rec\xE9m-formado de experiente e d\xE1 nota",
      },
      {
        name: "Redator de abordagem",
        tier: "forte",
        does: "Uma mensagem por perfil: captar pacientes, ou ganhar tempo na gest\xE3o",
      },
    ],
    auto: ["Pesquisar e pontuar leads"],
    aprova: ["Primeira mensagem", "Follow-up", "Convite para o cadastro"],
    humano: ["Enviar no LinkedIn"],
    limits:
      "S\xF3 passa para o WhatsApp depois que a pessoa pedir contato e aceitar. Sem abordagem fria por WhatsApp.",
    learns: "Taxa de resposta por vers\xE3o de mensagem e por perfil.",
    note: null,
  },
  {
    id: "conteudo",
    area: "aquisicao",
    ready: "pronto",
    name: "Conte\xFAdo e Social",
    mission: "Atrair psic\xF3logos com conte\xFAdo sobre captar pacientes e organizar o consult\xF3rio.",
    metric: "Cadastros vindos do Instagram",
    needs: "Instagram sincronizado no CRM e as skills de conte\xFAdo que voc\xEA j\xE1 tem.",
    triggers: ["Calend\xE1rio semanal", "Post com desempenho acima da m\xE9dia"],
    subs: [
      {
        name: "Estrategista de pautas",
        tier: "forte",
        does: "Escolhe temas a partir do que performou",
      },
      {
        name: "Produtor",
        tier: "forte",
        does: "Carrossel, roteiro de reel e legenda",
      },
      {
        name: "Moderador",
        tier: "leve",
        does: "Responde coment\xE1rios simples e separa quem \xE9 lead",
      },
    ],
    auto: ["Planejar pautas"],
    aprova: ["Pe\xE7a pronta", "Resposta a coment\xE1rio e DM"],
    humano: ["Publicar"],
    limits: "Passa pelo Revisor de conformidade antes de chegar na sua fila.",
    learns: "Formato e tema que mais trazem cadastro.",
    note: "J\xE1 existe em parte nas skills synapsa-carrossel e synapsa-conteudo.",
  },
  {
    id: "indicacao",
    area: "aquisicao",
    ready: "pronto",
    name: "Indica\xE7\xE3o",
    mission: "Fazer pagantes e ativos satisfeitos trazerem colegas.",
    metric: "Cadastros por indica\xE7\xE3o",
    needs: "Uso e satisfa\xE7\xE3o dos pagantes e ativados.",
    triggers: ["Pagante ou ativo satisfeito", "Marco atingido, como o 10\xBA paciente"],
    subs: [
      {
        name: "Detector de promotor",
        tier: "leve",
        does: "Acha quem est\xE1 satisfeito e usando",
      },
      {
        name: "Redator de convite",
        tier: "forte",
        does: "Pede a indica\xE7\xE3o com um texto pronto para encaminhar",
      },
    ],
    auto: [],
    aprova: ["Pedido de indica\xE7\xE3o"],
    humano: ["Qualquer benef\xEDcio ou recompensa"],
    limits: "Pede no m\xE1ximo uma vez a cada 60 dias.",
    learns: "Quem indica de fato e depois de quais marcos.",
    note: null,
  },
  {
    id: "midia",
    area: "aquisicao",
    ready: "parcial",
    name: "M\xEDdia Paga",
    mission: "Ler Meta e Google todo dia e cortar gasto sem retorno.",
    metric: "Custo por cadastro ativado",
    needs: "Meta sincroniza no CRM atual. Google Ads ainda n\xE3o.",
    triggers: ["Todo dia de manh\xE3", "Gasto acima do teto sem cadastro"],
    subs: [
      {
        name: "Analista de campanha",
        tier: "leve",
        does: "Gasto, cliques e cadastros por an\xFAncio",
      },
      {
        name: "Criativo de an\xFAncio",
        tier: "forte",
        does: "Texto e imagem de novos testes",
      },
      {
        name: "Otimizador de or\xE7amento",
        tier: "forte",
        does: "Prop\xF5e pausar, escalar ou testar",
      },
    ],
    auto: ["Ler as m\xE9tricas"],
    aprova: ["Pausar", "Escalar", "Novo criativo"],
    humano: ["Aumentar o teto de gasto"],
    limits: "Teto di\xE1rio de gasto definido por voc\xEA.",
    learns: "Criativos que baixam o custo por cadastro.",
    note: "Meta Ads e Instagram j\xE1 sincronizam no CRM atual.",
  },
  {
    id: "inteligencia",
    area: "aquisicao",
    ready: "pronto",
    name: "Intelig\xEAncia de Mercado",
    mission: "Acompanhar concorrentes, tend\xEAncias e busca para sugerir \xE2ngulos de mensagem.",
    metric: "\xC2ngulos novos aprovados por m\xEAs",
    needs: "Fontes p\xFAblicas da web.",
    triggers: ["Toda semana", "Mudan\xE7a relevante em concorrente"],
    subs: [
      {
        name: "Radar de concorr\xEAncia",
        tier: "leve",
        does: "Pre\xE7o, recurso e mensagem dos concorrentes",
      },
      {
        name: "Analista de SEO",
        tier: "forte",
        does: "Termos que psic\xF3logos buscam e lacunas de conte\xFAdo",
      },
    ],
    auto: ["Monitorar e resumir"],
    aprova: ["Novo \xE2ngulo de mensagem"],
    humano: [],
    limits: "S\xF3 fontes p\xFAblicas.",
    learns: "Quais \xE2ngulos viraram conte\xFAdo que funcionou.",
    note: null,
  },
  {
    id: "descoberta",
    area: "produto",
    ready: "pronto",
    name: "Descoberta",
    mission: "Juntar feedback, reclama\xE7\xF5es e uso, e ordenar o que construir por impacto em R$.",
    metric: "Itens priorizados que viram entrega",
    needs: "Feedback do Sucesso, tarefas da cl\xEDnica e uso da plataforma.",
    triggers: ["Feedback novo", "Fechamento semanal"],
    subs: [
      {
        name: "Agrupador",
        tier: "leve",
        does: "Junta pedidos parecidos num tema",
      },
      {
        name: "Priorizador",
        tier: "forte",
        does: "Ordena por reten\xE7\xE3o e receita em risco",
      },
    ],
    auto: ["Agrupar", "Priorizar"],
    aprova: ["Item entra no backlog"],
    humano: ["Decis\xE3o final do que construir"],
    limits: "Financeiro e estabilidade da cl\xEDnica entram na frente de recurso novo.",
    learns: "Quais itens entregues de fato melhoraram a reten\xE7\xE3o.",
    note: null,
  },
  {
    id: "especificacao",
    area: "produto",
    ready: "pronto",
    name: "Especifica\xE7\xE3o",
    mission: "Escrever a spec de cada item priorizado, com crit\xE9rio de aceite e rascunho de tela.",
    metric: "Specs aprovadas e entregues",
    needs: "Backlog priorizado pela Descoberta.",
    triggers: ["Item aprovado no backlog"],
    subs: [
      {
        name: "Redator de spec",
        tier: "forte",
        does: "Problema, solu\xE7\xE3o e crit\xE9rio de aceite",
      },
      {
        name: "Prototipador",
        tier: "forte",
        does: "Rascunho de tela para validar r\xE1pido",
      },
    ],
    auto: [],
    aprova: ["Spec", "Rascunho de tela"],
    humano: ["Prazo e escopo"],
    limits: "Uma spec por vez.",
    learns: "Onde voc\xEA costuma cortar escopo.",
    note: null,
  },
  {
    id: "uso",
    area: "produto",
    ready: "nova",
    name: "Analista de Uso",
    mission: "Mostrar onde o usu\xE1rio trava dentro do produto e quais recursos ele usa.",
    metric: "Etapas do produto com queda identificada",
    needs:
      "Exige que a plataforma emita eventos de uso: perfil publicado, paciente criado, recurso bloqueado.",
    triggers: ["Toda semana"],
    subs: [
      {
        name: "Analista de funil",
        tier: "leve",
        does: "Em que passo as pessoas desistem",
      },
      {
        name: "Analista de recurso",
        tier: "leve",
        does: "O que \xE9 usado, por quem e com que frequ\xEAncia",
      },
    ],
    auto: ["Analisar"],
    aprova: ["Hip\xF3tese de melhoria enviada ao Produto"],
    humano: [],
    limits: "S\xF3 dados agregados por profissional. Nada de conte\xFAdo de paciente.",
    learns: "Quais hip\xF3teses viraram melhoria real.",
    note: "Depende de a plataforma registrar eventos de uso.",
  },
  {
    id: "lancamento",
    area: "produto",
    ready: "pronto",
    name: "Lan\xE7amento",
    mission: "Comunicar cada novidade ao cliente com changelog e tutorial.",
    metric: "Recursos novos que os clientes de fato usam",
    needs: "Entregas e tarefas conclu\xEDdas.",
    triggers: ["Entrega publicada"],
    subs: [
      {
        name: "Redator de changelog",
        tier: "forte",
        does: "O que mudou, na linguagem do psic\xF3logo",
      },
      {
        name: "Criador de tutorial",
        tier: "forte",
        does: "Passo a passo curto",
      },
    ],
    auto: [],
    aprova: ["Changelog", "Tutorial", "Aviso aos clientes"],
    humano: ["Publicar"],
    limits: "Passa pelo Revisor de conformidade.",
    learns: "Quais avisos geram uso.",
    note: null,
  },
  {
    id: "financeiro",
    area: "financeiro",
    ready: "parcial",
    name: "Financeiro",
    mission: "Acompanhar o caminho at\xE9 R$ 1.200 e o custo de cada usu\xE1rio gratuito.",
    metric: "MRR e margem",
    needs: "Assinaturas v\xEAm da plataforma. Faltam Stripe e extrato banc\xE1rio.",
    triggers: ["Todo dia", "Fechamento mensal"],
    subs: [
      {
        name: "Ponte do MRR",
        tier: "forte",
        does: "Mostra quanto falta e de onde vai vir",
      },
      {
        name: "Controlador de custo",
        tier: "leve",
        does: "Custo de IA e infraestrutura por agente e por usu\xE1rio",
      },
      {
        name: "Conciliador",
        tier: "leve",
        does: "Cruza Stripe, plataforma e banco",
      },
    ],
    auto: ["Calcular", "Conciliar"],
    aprova: [],
    humano: ["Qualquer pagamento", "Mudan\xE7a de pre\xE7o"],
    limits: "Somente leitura.",
    learns: "Quais custos crescem mais r\xE1pido que a receita.",
    note: null,
  },
  {
    id: "compliance",
    area: "financeiro",
    ready: "pronto",
    name: "Conformidade e LGPD",
    mission: "Revisar tudo que sai antes de chegar na sua fila e vigiar o que cada agente acessa.",
    metric: "Propostas com problema barradas antes de chegar a voc\xEA",
    needs: "Toda proposta de mensagem e conte\xFAdo, mais o registro de acessos.",
    triggers: ["Toda proposta de mensagem ou conte\xFAdo", "Um agente pediu acesso novo"],
    subs: [
      {
        name: "Revisor de conformidade",
        tier: "forte",
        does: "Promessa indevida, publicidade em psicologia e tom",
      },
      {
        name: "Guardi\xE3o de consentimento",
        tier: "leve",
        does: "Confere o aceite de contato por WhatsApp",
      },
      {
        name: "Auditor de acesso",
        tier: "leve",
        does: "Garante que nenhum agente toca dado cl\xEDnico de paciente",
      },
    ],
    auto: ["Bloquear ou sinalizar"],
    aprova: ["Mudan\xE7a de pol\xEDtica de dados"],
    humano: ["Liberar uma exce\xE7\xE3o"],
    limits: "Filtro obrigat\xF3rio: nenhuma mensagem externa chega na fila sem passar por ele.",
    learns: "Regras novas que voc\xEA pedir viram checagem permanente.",
    note: null,
  },
  {
    id: "sdr",
    area: "comercial",
    ready: "parcial",
    name: "SDR",
    mission: "Conduzir a conversa de venda de cl\xEDnicas e de planos maiores.",
    metric: "Reuni\xF5es realizadas",
    needs: "Conversas ficam no CRM. WhatsApp oficial s\xF3 quando o volume justificar.",
    triggers: ["Resposta de lead", "Reuni\xE3o sem comparecimento"],
    subs: [
      {
        name: "Pesquisador de lead",
        tier: "leve",
        does: "Dossi\xEA curto antes do contato",
      },
      {
        name: "Respondedor",
        tier: "forte",
        does: "Sugere a resposta no WhatsApp",
      },
      {
        name: "Tratador de obje\xE7\xF5es",
        tier: "forte",
        does: "Usa o playbook para cada obje\xE7\xE3o",
      },
      {
        name: "Agendador",
        tier: "leve",
        does: "Prop\xF5e hor\xE1rios e lembra da reuni\xE3o",
      },
    ],
    auto: [],
    aprova: ["Resposta a lead", "Convite de reuni\xE3o"],
    humano: ["Pre\xE7o, obje\xE7\xE3o e negocia\xE7\xE3o"],
    limits: "N\xE3o prospecta cl\xEDnica nova at\xE9 a atual estabilizar. Atende quem j\xE1 chegou.",
    learns: "Obje\xE7\xF5es mais comuns e as respostas que funcionaram.",
    note: null,
  },
  {
    id: "closer",
    area: "comercial",
    ready: "pronto",
    name: "Closer Assist",
    mission: "Preparar cada reuni\xE3o e fechar o que ficou aberto depois dela.",
    metric: "Fechamentos",
    needs: "Agenda, reuni\xF5es e transcri\xE7\xF5es do CRM atual.",
    triggers: ["Reuni\xE3o marcada", "Reuni\xE3o conclu\xEDda"],
    subs: [
      {
        name: "Preparador",
        tier: "forte",
        does: "Dossi\xEA de uma p\xE1gina antes da reuni\xE3o",
      },
      {
        name: "Analista de reuni\xE3o",
        tier: "forte",
        does: "Resumo, obje\xE7\xF5es e pr\xF3ximo passo a partir da transcri\xE7\xE3o",
      },
      {
        name: "Montador de proposta",
        tier: "forte",
        does: "Proposta de plano com base no que a pessoa disse",
      },
    ],
    auto: ["Dossi\xEA", "Resumo da reuni\xE3o"],
    aprova: ["Proposta", "Follow-up"],
    humano: ["Condi\xE7\xF5es comerciais"],
    limits: "Prepara e resume. N\xE3o abre venda de cl\xEDnica nova at\xE9 a atual estabilizar.",
    learns: "O que as reuni\xF5es que fecharam tinham em comum.",
    note: "O CRM atual j\xE1 tem agenda e an\xE1lise de reuni\xE3o com IA.",
  },
];
export const Ze = [
  {
    id: "marketing",
    name: "Marketing",
    blurb: "Atrai psic\xF3logos: LinkedIn, Instagram, an\xFAncios, indica\xE7\xE3o e mercado.",
    areas: ["aquisicao"],
    hue: "--t-marketing",
  },
  {
    id: "comercial",
    name: "Comercial",
    blurb: "Ativa o cadastro, converte no limite de 5 pacientes e conduz as conversas de venda.",
    areas: ["ativacao", "comercial"],
    hue: "--t-comercial",
  },
  {
    id: "estrategia",
    name: "Estrat\xE9gia",
    blurb: "Prioriza o seu dia, mede o funil, cuida do caixa e da conformidade.",
    areas: ["comando", "growth", "financeiro"],
    hue: "--t-estrategia",
  },
  {
    id: "produto",
    name: "Produto",
    blurb: "Transforma feedback e uso em backlog, spec e lan\xE7amento.",
    areas: ["produto"],
    hue: "--t-produto",
  },
  {
    id: "sucesso",
    name: "Sucesso",
    blurb: "Segura os pagantes, cobra o que falhou e cuida da cl\xEDnica.",
    areas: ["sucesso", "clinica"],
    hue: "--t-sucesso",
  },
];
export const Ai = 6e4;
export function Ru(e) {
  const a = (t, r, o, s, i = "normal") => ({
    id: t,
    agentId: r,
    at: e - o * Ai,
    text: s,
    tone: i,
  });
  return [
    a(
      "a1",
      "chief",
      22,
      "Montou o briefing de hoje: 3 decis\xF5es novas e 5 que j\xE1 esperavam por voc\xEA.",
    ),
    a("a2", "compliance", 41, "Barrou 2 mensagens do LinkedIn por prometer resultado a pacientes.", "alerta"),
    a(
      "a3",
      "midia",
      58,
      "Leu o Meta Ads: 1 campanha gastou R$ 84 em 7 dias sem nenhum lead. Abriu proposta de revis\xE3o.",
      "alerta",
    ),
    a(
      "a4",
      "prospeccao",
      96,
      "Pontuou 18 psic\xF3logos novos. 6 combinam com o perfil de quem tem agenda cheia e gest\xE3o bagun\xE7ada.",
    ),
    a(
      "a5",
      "guardiao",
      140,
      "Auditou a base: 11 perfis sem \xFAltimo acesso. Pediu sua confirma\xE7\xE3o para corrigir.",
      "alerta",
    ),
    a(
      "a6",
      "financeiro",
      175,
      "Conciliou Stripe, Pix e plataforma: MRR de R$ 496, sem diverg\xEAncia.",
      "ok",
    ),
    a("a7", "metricas", 181, "Fechou o funil do dia: 35 cadastros, 20 ativados, 4 no limite, 5 pagantes."),
    a("a8", "conteudo", 230, "Planejou as pautas da semana e deixou 1 carrossel pronto para revis\xE3o."),
    a("a9", "descoberta", 262, "Agrupou 4 feedbacks sobre o financeiro do consult\xF3rio num tema s\xF3."),
    a("a10", "saude", 310, "Calculou o risco dos 5 pagantes: nenhum em alerta.", "ok"),
    a(
      "a11",
      "escalonador",
      355,
      "Abriu 1 tarefa para o desenvolvedor, com passos para reproduzir o erro da cl\xEDnica.",
    ),
    a("a12", "cobranca", 402, "Detectou 1 pagamento falho no Stripe e preparou o lembrete."),
    a(
      "a13",
      "inteligencia",
      440,
      "Viu que um concorrente mudou o pre\xE7o do plano de entrada. Resumo na sua fila.",
    ),
  ];
}
export function Df(e) {
  const a = {},
    t = Ru(e);
  for (const r of Q) {
    const o = t.find((s) => s.agentId === r.id);
    a[r.id] = {
      status: "ocioso",
      lastAction: o?.text ?? "Aguardando o pr\xF3ximo gatilho.",
      lastAt: o?.at ?? e - 12 * 60 * Ai,
      runsToday: o ? 2 + (r.id.length % 4) : 1,
      costBrl: Math.round((0.12 + (r.id.length % 7) * 0.09) * 100) / 100,
    };
  }
  for (const r of ["prospeccao", "midia", "metricas"]) {
    const o = a[r];
    o && (o.status = "trabalhando");
  }
  return a;
}
export function Of(e) {
  const a = (t, r, o, s) => ({
    id: t,
    agentId: r,
    at: e - o * Ai,
    status: "pendente",
    review: s.review ?? "aprovada pela conformidade",
    ...s,
  });
  return [
    a("p1", "pagar", 30, {
      title: "Convidar psic\xF3loga com 5 de 5 pacientes para o Essencial",
      draft:
        "Oi, tudo bem? Vi que sua agenda na Synapsa j\xE1 est\xE1 cheia: voc\xEA chegou nos 5 pacientes do plano gratuito. O Essencial libera pacientes sem limite e o financeiro completo. Quer que eu te mostre em 5 minutos como fica?",
      why: "Bateu o limite hoje e abriu o painel financeiro 3 vezes. \xC9 o sinal mais forte de compra.",
      impactoBrl: 948,
      risk: "baixo",
      channel: "whatsapp",
    }),
    a("p2", "cobranca", 65, {
      title: "Lembrete de pagamento falho (assinatura no Stripe)",
      draft:
        "Oi! O pagamento da sua assinatura da Synapsa n\xE3o passou hoje. Pode ser o cart\xE3o vencido. Esse link atualiza em um minuto: [link do portal]. Qualquer d\xFAvida, me chama.",
      why: "Falha de cart\xE3o responde por boa parte dos cancelamentos evit\xE1veis. Esta conta paga R$ 49 por m\xEAs.",
      impactoBrl: 588,
      risk: "baixo",
      channel: "whatsapp",
    }),
    a("p3", "midia", 58, {
      title: 'Revisar campanha "Aut\xF4nomos \u2013 Capta\xE7\xE3o": R$ 84 sem lead em 7 dias',
      draft: null,
      why: "Gastou R$ 84, teve 212 cliques e nenhum cadastro. O Brain nunca pausa sozinho: voc\xEA decide pausar, trocar o criativo ou manter.",
      impactoBrl: 84,
      risk: "baixo",
      channel: "interno",
    }),
    a("p4", "prospeccao", 96, {
      title: "Abordagem no LinkedIn: psic\xF3loga com 4 anos de CRP em Porto Alegre",
      draft:
        "Oi! Vi seu trabalho com terapia de casal e achei muito bem posicionado. Estou construindo a Synapsa, uma plataforma que organiza agenda, financeiro e retorno de pacientes para psic\xF3logos aut\xF4nomos. Posso te mandar um v\xEDdeo de 1 minuto? Sem compromisso.",
      why: "Perfil publicado, sem site pr\xF3prio e com sinais de agenda cheia. Mensagem curta, sem promessa de resultado.",
      impactoBrl: 948,
      risk: "baixo",
      channel: "linkedin",
    }),
    a("p5", "guardiao", 140, {
      title: "Corrigir \xFAltimo acesso vazio em 11 perfis",
      draft: null,
      why: "Sem esse campo o Analista de M\xE9tricas n\xE3o separa ativo de inativo e o funil fica impreciso.",
      impactoBrl: 0,
      risk: "medio",
      channel: "tarefa",
    }),
    a("p6", "conteudo", 230, {
      title: 'Carrossel: "Agenda cheia sem depender de indica\xE7\xE3o"',
      draft:
        "Legenda: Quem tem consult\xF3rio sabe: a agenda enche e esvazia sem aviso. 5 passos simples para deixar o fluxo de pacientes mais previs\xEDvel. Salve para aplicar na segunda. (7 slides prontos em anexo)",
      why: "O formato carrossel com tema de gest\xE3o teve o dobro de salvamentos nos \xFAltimos 30 dias.",
      impactoBrl: 150,
      risk: "baixo",
      channel: "instagram",
    }),
    a("p7", "inteligencia", 440, {
      title: "Concorrente mudou o pre\xE7o do plano de entrada: ajustar o \xE2ngulo da mensagem",
      draft: null,
      why: "Refor\xE7a o argumento de pre\xE7o \xFAnico e financeiro incluso. Sem mudan\xE7a no seu pre\xE7o.",
      impactoBrl: 0,
      risk: "baixo",
      channel: "interno",
      review: "aprovada pela conformidade",
    }),
    a("p8", "closer", 300, {
      title: "Dossi\xEA da reuni\xE3o de quinta com a cl\xEDnica interessada",
      draft:
        "Resumo: cl\xEDnica com 6 profissionais, usa planilha para agenda e cobran\xE7a. Dor principal: faltas sem aviso. Perguntar: quantos atendem por semana? Quem cuida do financeiro?",
      why: "Reuni\xE3o em 2 dias. O Closer Assist s\xF3 prepara e n\xE3o abre venda de cl\xEDnica nova.",
      impactoBrl: 3600,
      risk: "medio",
      channel: "interno",
    }),
  ];
}
export function Ff() {
  const e = (a) => a;
  return [
    e({
      id: "plataforma",
      name: "Plataforma Synapsa",
      state: "pendente",
      detail:
        "O mvp-v2 ainda n\xE3o grava os eventos do Brain. O PR com a tabela de eventos e as views de leitura n\xE3o foi aberto.",
      unlocks: "Cadastros, pacientes, uso e limite de 5 pacientes em tempo real.",
      secrets: ["BRAIN_RO_DATABASE_URL"],
      next: "Autorizar push no reposit\xF3rio mvp-v2 e criar o papel brain_ro.",
      syncMinutes: 4,
      agents: ["ativacao", "pagar", "saude", "metricas"],
    }),
    e({
      id: "stripe",
      name: "Stripe",
      state: "pronto",
      detail: "Chave restrita recebida e guardada no cofre. Ainda n\xE3o est\xE1 nos secrets do Cloudflare.",
      unlocks: "MRR pelo valor com desconto, pagamentos falhos e fim de desconto.",
      secrets: ["STRIPE_READ_KEY"],
      next: "Colar a chave em wrangler secret put STRIPE_READ_KEY quando o Worker existir.",
      syncMinutes: 9,
      agents: ["financeiro", "cobranca", "guardiao"],
    }),
    e({
      id: "meta",
      name: "Meta Ads",
      state: "pronto",
      detail:
        "IDs da conta de an\xFAncios, P\xE1gina e app registrados. Token do usu\xE1rio de sistema guardado no cofre.",
      unlocks: "Gasto, cliques e leads por campanha. Proposta de revis\xE3o quando gasta sem lead.",
      secrets: ["META_SYSTEM_USER_TOKEN"],
      next: "Colar o token nos secrets do Cloudflare. Trocar por um token s\xF3 de leitura antes do executor.",
      syncMinutes: 14,
      agents: ["midia", "alocador"],
    }),
    e({
      id: "instagram",
      name: "Instagram",
      state: "pronto",
      detail: "Conta profissional vinculada \xE0 P\xE1gina. Usa o mesmo token da Meta.",
      unlocks:
        "Seguidores, alcance e visitas ao perfil. Publica o post que voc\xEA aprovar (precisa da permiss\xE3o instagram_content_publish no token e de imagem em link https).",
      secrets: ["META_SYSTEM_USER_TOKEN"],
      next: "Mesmo passo da Meta.",
      syncMinutes: 14,
      agents: ["conteudo"],
    }),
    e({
      id: "whatsapp",
      name: "WhatsApp Business",
      state: "pendente",
      detail:
        "Conta ainda n\xE3o criada. Hoje voc\xEA envia pelo seu pr\xF3prio WhatsApp com o texto que o Brain prepara.",
      unlocks: "Receber respostas dos leads e registrar o aceite de contato.",
      secrets: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET"],
      next: "Criar a conta e verificar o neg\xF3cio na Meta. Depois ligar o webhook de entrada.",
      syncMinutes: null,
      agents: ["sdr", "ativacao", "pagar"],
    }),
    e({
      id: "crm",
      name: "CRM Synapsa",
      state: "pendente",
      detail:
        "API REST do CRM Synapsa. Falta cadastrar SYNAPSA_CRM_API_BASE_URL e SYNAPSA_CRM_API_KEY nos secrets.",
      unlocks:
        "Leads, funil de vendas, atividades, reuni\xF5es e m\xE9tricas do CRM para o Comercial e o Chief. Os agentes s\xF3 leem; criar, editar e excluir existem no cliente do backend e s\xF3 rodam com ordem sua (exclus\xE3o, s\xF3 com confirma\xE7\xE3o).",
      secrets: ["SYNAPSA_CRM_API_KEY", "SYNAPSA_CRM_API_BASE_URL"],
      next: "Cadastrar os dois como Secret no Cloudflare. A chave expira em 27/10/2027.",
      syncMinutes: null,
      agents: ["sdr", "closer", "ativacao", "metricas", "chief"],
    }),
    e({
      id: "apify",
      name: "Apify (prospec\xE7\xE3o)",
      state: "pendente",
      detail:
        "L\xEA o Google Maps e os sites das cl\xEDnicas. S\xF3 pesquisa, n\xE3o envia nada a ningu\xE9m.",
      unlocks:
        "Lista de cl\xEDnicas de SP, RJ e MG com equipe, e-mail p\xFAblico e nota, pronta para o CRM depois do seu OK.",
      secrets: ["APIFY_TOKEN"],
      next: "Criar o token em console.apify.com > Settings > API & Integrations e guardar como APIFY_TOKEN.",
      syncMinutes: null,
      agents: [],
    }),
    e({
      id: "resend",
      name: "Resend (e-mail)",
      state: "pendente",
      detail: "Dom\xEDnio synapsa.chat definido. Falta verificar o subdom\xEDnio de envio e criar a chave.",
      unlocks: "E-mail de reten\xE7\xE3o e de fim de desconto, enviado s\xF3 depois da sua aprova\xE7\xE3o.",
      secrets: ["RESEND_API_KEY", "RESEND_FROM"],
      next: "Criar a chave (Sending access) e o secret RESEND_FROM, ex.: Felipe da Synapsa <felipe@mail.synapsa.chat>. Opcional: RESEND_REPLY_TO.",
      syncMinutes: null,
      agents: ["cobranca", "saude", "lancamento"],
    }),
    e({
      id: "linkedin",
      name: "LinkedIn",
      state: "manual",
      detail: "Sem API. O Brain prepara a mensagem e voc\xEA envia pelo seu perfil.",
      unlocks: "Fila de abordagens prontas, com a resposta de cada lead registrada \xE0 m\xE3o.",
      secrets: [],
      next: 'Nada a colar. Marque "enviada" na fila para o Brain acompanhar.',
      syncMinutes: null,
      agents: ["prospeccao", "sdr"],
    }),
    e({
      id: "google",
      name: "Google (Calendar, GA4, Search Console)",
      state: "pendente",
      detail: "Ainda n\xE3o conectado.",
      unlocks: "Reuni\xF5es do Closer Assist, tr\xE1fego do site e termos de busca para o SEO.",
      secrets: ["GOOGLE_OAUTH_REFRESH_TOKEN"],
      next: "Criar o acesso OAuth com escopos s\xF3 de leitura.",
      syncMinutes: 30,
      agents: ["closer", "inteligencia", "metricas"],
    }),
    e({
      id: "openai",
      name: "OpenAI API",
      state: "pendente",
      detail: "Chave ainda n\xE3o criada. Crie uma com limite mensal de gasto.",
      unlocks: "O racioc\xEDnio de todos os agentes e do Jarvis.",
      secrets: ["OPENAI_API_KEY"],
      next: "Criar a chave em platform.openai.com e definir um teto mensal de R$ 300.",
      syncMinutes: 1,
      agents: ["chief"],
    }),
    e({
      id: "supabase",
      name: "Supabase do Brain",
      state: "pendente",
      detail: "Migrations prontas e testadas. O projeto ainda n\xE3o existe.",
      unlocks: "Guardar propostas, aprova\xE7\xF5es, auditoria e o kill switch.",
      secrets: ["SUPABASE_SERVICE_KEY"],
      next: "Escolher a organiza\xE7\xE3o e criar o projeto em sa-east-1.",
      syncMinutes: 1,
      agents: ["chief", "compliance"],
    }),
    e({
      id: "cloudflare",
      name: "Cloudflare Workers",
      state: "pendente",
      detail: "C\xF3digo do worker pronto e testado. Falta a conta paga e o token de deploy.",
      unlocks: "Rodar os agentes todo dia \xE0s 7h e a leitura de Stripe e Meta.",
      secrets: ["CLOUDFLARE_API_TOKEN"],
      next: "Ativar o plano pago e criar um token restrito.",
      syncMinutes: 1,
      agents: ["guardiao"],
    }),
  ];
}
export const Bf = {
  mrr: {
    stripe: 147,
    pix: 349,
    manual: 0,
    total: 496,
    goal: 1200,
    goalDate: "31/12/2026",
    essencialPrice: 79,
  },
  funil: {
    cadastros: 35,
    ativados: 20,
    noLimite: 4,
    pagantes: 5,
  },
  llmCapMonthlyBrl: 300,
  llmSpentMonthBrl: 61.4,
  descontos: [
    {
      quando: "23/01/2027",
      contas: 2,
      de: 49,
      para: 119,
    },
    {
      quando: "02/03/2027",
      contas: 1,
      de: 49,
      para: 119,
    },
  ],
};
export const $s = (e) => e.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
export const xe = (e) =>
  e.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: e % 1 ? 2 : 0,
  });
export const Uf = {
  chief: ["chief", "chefe de gabinete"],
  ativacao: ["ativacao do freemium", "freemium"],
  pagar: ["momento de pagar"],
  saude: ["saude da conta", "voz do cliente"],
  cobranca: ["cobranca"],
  escalonador: ["escalonador"],
  relclinica: ["relatorio da clinica"],
  guardiao: ["guardiao"],
  metricas: ["analista de metricas", "metricas"],
  experimentos: ["experimentos"],
  alocador: ["alocador"],
  prospeccao: ["prospeccao", "prospector"],
  conteudo: ["conteudo", "social"],
  indicacao: ["indicacao"],
  midia: ["midia paga", "midia", "anuncios"],
  inteligencia: ["inteligencia de mercado", "inteligencia"],
  descoberta: ["descoberta"],
  especificacao: ["especificacao"],
  uso: ["analista de uso"],
  lancamento: ["lancamento"],
  financeiro: ["financeiro"],
  compliance: ["conformidade", "lgpd", "compliance"],
  sdr: ["sdr"],
  closer: ["closer"],
};
export function Wf(e) {
  const a = $s(e);
  let t;
  for (const r of Q)
    for (const o of Uf[r.id] ?? [$s(r.name)])
      a.includes(o) &&
        (!t || o.length > t.len) &&
        (t = {
          a: r,
          len: o.length,
        });
  return t?.a;
}
export const Vf =
  /(faca|faz|rode|rodar|concilie|analise|prepare|monte|escreva|revise|verifique|pesquise|calcule|gere|audite|compile|atualize|levante|mande|manda|peca|pede|pedir|ordene)/;
export function Hf(e, a) {
  const t = Math.max(1, Math.round((e - a) / 6e4));
  return t < 60 ? `h\xE1 ${t} min` : `h\xE1 ${Math.round(t / 60)} h`;
}
export function Qf(e, a) {
  const t = a.metrics,
    r = $s(e).trim(),
    o = a.proposals.filter((i) => i.status === "pendente"),
    s = Wf(e);
  if (/(parar|pare|desligar|desligue|pausar) tudo|kill ?switch|emergencia/.test(r))
    return a.kill
      ? {
          text: 'O bot\xE3o de emerg\xEAncia j\xE1 est\xE1 ligado. Nada roda e nenhuma aprova\xE7\xE3o passa. Para religar, diga "retomar tudo".',
        }
      : {
          text: "Isso para todos os 24 agentes e bloqueia qualquer aprova\xE7\xE3o at\xE9 voc\xEA religar. Confirma?",
          confirm: {
            label: "Parar tudo",
            action: {
              type: "kill_on",
            },
          },
        };
  if (/(retomar|religar|reativar|desativar) (tudo|o kill)|voltar ao normal/.test(r))
    return a.kill
      ? {
          text: "Isso religa os agentes e libera as aprova\xE7\xF5es. Confirma?",
          confirm: {
            label: "Retomar tudo",
            action: {
              type: "kill_off",
            },
          },
        }
      : {
          text: "O bot\xE3o de emerg\xEAncia est\xE1 desligado. Os agentes j\xE1 est\xE3o rodando normal.",
        };
  if (/(rotina|ciclo) (do dia|diaria)|rode o dia|rodar o dia|atualize tudo/.test(r))
    return a.kill
      ? {
          text: "O bot\xE3o de emerg\xEAncia est\xE1 ligado. Religue antes de rodar a rotina.",
        }
      : {
          text: "Rotina do dia iniciada: Guardi\xE3o fecha o MRR, Financeiro compara com a meta, M\xEDdia Paga l\xEA os an\xFAncios e, por \xFAltimo, o Chief monta o briefing.",
          action: {
            type: "daily",
          },
        };
  if (s && /\b(pausar|pause|pare|suspenda)\b/.test(r))
    return {
      text: `${s.name} pausado. Ele n\xE3o roda nem prop\xF5e at\xE9 voc\xEA retomar.`,
      action: {
        type: "pause",
        agentId: s.id,
      },
    };
  if (s && /\b(retomar|retome|ligar|ligue|reative|volte)\b/.test(r))
    return {
      text: `${s.name} de volta. Ele roda no pr\xF3ximo gatilho.`,
      action: {
        type: "resume",
        agentId: s.id,
      },
    };
  if (s && (Vf.test(r) || /\b(para|pra)\b/.test(r))) {
    if (a.kill)
      return {
        text: "O bot\xE3o de emerg\xEAncia est\xE1 ligado. Religue antes de dar tarefa a um agente.",
      };
    const i = e.replace(/^(.*?)(para|pra|:)\s+/i, "").trim() || "trabalho pedido por voc\xEA",
      l = s.aprova.length > 0;
    return {
      text: `${s.name} come\xE7ou. ${l ? "O que ele preparar chega na sua fila para aprova\xE7\xE3o." : "\xC9 uma an\xE1lise interna e o resultado aparece no feed de hoje."}`,
      action: {
        type: "task",
        agentId: s.id,
        task: i,
      },
    };
  }
  if (/aprov(e|ar|a)\b.*(baixo|simples|seguras|rotina)/.test(r)) {
    const i = o.filter((c) => c.risk === "baixo");
    if (a.kill)
      return {
        text: "O bot\xE3o de emerg\xEAncia est\xE1 ligado, ent\xE3o nenhuma aprova\xE7\xE3o passa.",
      };
    if (i.length === 0)
      return {
        text: "N\xE3o h\xE1 propostas de baixo risco esperando.",
      };
    const l = i.reduce((c, u) => c + u.impactoBrl, 0);
    return {
      text: `S\xE3o ${i.length} propostas de baixo risco, somando ${xe(l)} de impacto. Aprovar n\xE3o envia nada: voc\xEA copia e manda cada mensagem. Confirma?`,
      confirm: {
        label: `Aprovar ${i.length}`,
        action: {
          type: "approve_low_risk",
        },
      },
    };
  }
  if (s) {
    const i = a.runtime[s.id],
      l = o.filter((c) => c.agentId === s.id).length;
    return i
      ? {
          text: `${s.name}: ${i.status === "trabalhando" ? "trabalhando agora" : i.status === "pausado" ? "pausado" : "aguardando o pr\xF3ximo gatilho"}. \xDAltima a\xE7\xE3o ${Hf(a.now, i.lastAt)}: ${i.lastAction} Hoje rodou ${i.runsToday} vezes e custou ${xe(i.costBrl)}. ${l ? `Tem ${l} proposta(s) na sua fila.` : "Nada dele na sua fila."}`,
        }
      : {
          text: `${s.name} ainda n\xE3o rodou.`,
        };
  }
  if (/(desconto|reajuste|renova)/.test(r))
    return {
      text: `Fins de desconto \xE0 vista: ${t.descontos.map((l) => `${l.quando}: ${l.contas} conta(s) sobem de ${xe(l.de)} para ${xe(l.para)}`).join("; ")}. Quem entrou com R$ 79 tamb\xE9m sobe para R$ 119 seis meses depois. O Brain abre um contato 30 dias antes de cada uma, para voc\xEA ligar. Nenhum agente oferece desconto.`,
    };
  if (/(mrr|receita|faturamento|meta|1200|caixa)/.test(r)) {
    const { total: i, goal: l, stripe: c, pix: u, manual: v, essencialPrice: g } = t.mrr,
      x = Math.max(0, l - i),
      j = [`${xe(c)} no Stripe`, `${xe(u)} por Pix`, ...(v ? [`${xe(v)} lan\xE7ados \xE0 m\xE3o`] : [])].join(
        ", ",
      ),
      m = t.funil ? ` H\xE1 ${t.funil.noLimite} profissionais no limite de pacientes agora.` : "";
    return {
      text: `MRR de ${xe(i)}: ${j}. Faltam ${xe(x)} para os ${xe(l)} de ${t.mrr.goalDate}, o que s\xE3o cerca de ${Math.ceil(x / g)} Essenciais a ${xe(g)}.${m}`,
    };
  }
  if (/(funil|ativa|cadastro|conversao|limite)/.test(r)) {
    const i = t.funil;
    return i
      ? {
          text: `Funil de hoje: ${i.cadastros} cadastros, ${i.ativados} ativados, ${i.noLimite} no limite de 5 pacientes e ${i.pagantes} pagantes. Os ${i.noLimite} no limite s\xE3o a convers\xE3o mais pr\xF3xima. O Momento de Pagar j\xE1 tem convite pronto para a fila.`,
        }
      : {
          text: "Ainda n\xE3o tenho o funil: a plataforma n\xE3o est\xE1 mandando cadastros e uso para o Brain. Quando o PR do mvp-v2 entrar, eu passo a responder isso.",
        };
  }
  if (/(integra|conect|credenc|api|saude das)/.test(r)) {
    const i = (c) => a.integrations.filter((u) => u.state === c),
      l = i("pendente")
        .map((c) => c.name)
        .join(", ");
    return {
      text: `${i("conectado").length} integra\xE7\xF5es ligadas, ${i("pronto").length} com credencial pronta esperando o Worker, ${i("manual").length} manual e ${i("pendente").length} pendentes${l ? ` (${l})` : ""}. As que travam mais agentes s\xE3o Plataforma e Supabase.`,
    };
  }
  if (/(custo|gasto|token|\bia\b)/.test(r)) {
    const i = Object.values(a.runtime).reduce((l, c) => l + c.costBrl, 0);
    return {
      text: `Hoje os agentes custaram ${xe(i)}. No m\xEAs: ${xe(t.llmSpentMonthBrl)} de ${xe(t.llmCapMonthlyBrl)} de teto, ${Math.round((t.llmSpentMonthBrl / t.llmCapMonthlyBrl) * 100)}% usado.`,
    };
  }
  if (/(fila|aprova|pendente|propost|decis)/.test(r)) {
    if (o.length === 0)
      return {
        text: "Fila vazia. Nada espera por voc\xEA.",
      };
    const i = [...o].sort((l, c) => c.impactoBrl - l.impactoBrl).slice(0, 3);
    return {
      text: `${o.length} propostas esperando. As maiores: ${i.map((l) => `${l.title} (${xe(l.impactoBrl)})`).join("; ")}. Diga "aprove as de baixo risco" ou abra a aba Aprova\xE7\xF5es.`,
    };
  }
  if (/(quem|agentes|trabalhando|time|equipe)/.test(r)) {
    const i = Q.filter((u) => a.runtime[u.id]?.status === "trabalhando"),
      l = Q.filter((u) => a.runtime[u.id]?.status === "pausado");
    return {
      text: `24 agentes em 5 times (${Ze.map((u) => `${u.name} ${Q.filter((v) => u.areas.includes(v.area)).length}`).join(", ")}). Trabalhando agora: ${i.map((u) => u.name).join(", ") || "ningu\xE9m"}. ${l.length ? `Pausados: ${l.map((u) => u.name).join(", ")}.` : "Nenhum pausado."}`,
    };
  }
  if (/(o que (aconteceu|rolou|fizeram)|resumo|hoje|enquanto|briefing|novidade)/.test(r)) {
    const i = Object.values(a.runtime).reduce((c, u) => c + u.runsToday, 0),
      l = o.filter((c) => c.risk !== "baixo").length;
    return {
      text: `Enquanto voc\xEA esteve fora: ${i} execu\xE7\xF5es dos agentes, MRR em ${xe(t.mrr.total)}, ${o.length} propostas na fila (${l} pedem aten\xE7\xE3o).${a.kill ? " O bot\xE3o de emerg\xEAncia est\xE1 ligado." : ""} Abra a aba Hoje para a linha do tempo.`,
    };
  }
  return {
    text: 'Posso resumir o dia, mostrar o MRR e o funil, listar a fila, checar integra\xE7\xF5es e custo. Tamb\xE9m executo: "pe\xE7a ao Guardi\xE3o para conciliar a base", "pause a M\xEDdia Paga", "aprove as de baixo risco", "pare tudo".',
  };
}
export const Gf =
  "Contexto fixo: a Synapsa \xE9 uma plataforma de IA para psic\xF3logos aut\xF4nomos e cl\xEDnicas no Brasil. Plano gr\xE1tis at\xE9 5 pacientes; plano Essencial a R$ 79 (R$ 119 de tabela). Meta: R$ 1.200 de MRR at\xE9 31/12/2026. Nunca ofere\xE7a desconto, nunca prometa resultado cl\xEDnico, nunca cite paciente. Use consultar_dados antes de afirmar qualquer n\xFAmero do neg\xF3cio.";
export const Kf =
  'Entregue pelo relatorio: "resumo" com 1 ou 2 frases e "entrega" com o documento completo em texto (t\xEDtulos curtos, listas, n\xFAmeros com a fonte). Se faltar dado, diga o que falta e como obter. Termine com "Pr\xF3ximas 3 a\xE7\xF5es" ordenadas por impacto em R$.';
export const ee = (e, a, t, r = false) => ({
  agentId: e,
  titulo: a,
  instrucao: `${t}

${Gf}
${Kf}`,
  web: r,
});
export const Yf = [
  {
    id: "mkt-mercado",
    team: "marketing",
    titulo: "Mapa de mercado e concorrentes",
    objetivo:
      "Saber contra quem a Synapsa compete, como se posiciona e que \xE2ngulo de mensagem est\xE1 livre.",
    sintese: true,
    passos: [
      ee(
        "inteligencia",
        "Concorrentes e pre\xE7os",
        "Pesquise na web as plataformas e softwares de gest\xE3o de consult\xF3rio e prontu\xE1rio para psic\xF3logos no Brasil. Para cada uma (m\xEDnimo 6): pre\xE7o, plano gr\xE1tis, promessa principal, pontos fracos citados por usu\xE1rios, e como se vendem. Monte uma tabela comparativa com a Synapsa e aponte 3 \xE2ngulos de mensagem que ningu\xE9m est\xE1 usando.",
        true,
      ),
      ee(
        "inteligencia",
        "Demanda e busca",
        "Pesquise na web o que psic\xF3logos aut\xF4nomos buscam sobre captar pacientes, organizar consult\xF3rio, agenda, prontu\xE1rio e IA. Liste 15 temas por relev\xE2ncia, com a dor por tr\xE1s de cada um e um t\xEDtulo de conte\xFAdo para cada.",
        true,
      ),
    ],
  },
  {
    id: "mkt-semana",
    team: "marketing",
    titulo: "Plano de conte\xFAdo da semana",
    objetivo: "Cinco posts prontos para o Instagram, baseados no que j\xE1 funcionou no perfil.",
    sintese: false,
    passos: [
      ee(
        "conteudo",
        "Calend\xE1rio e textos",
        "Consulte os dados do Instagram (posts recentes, curtidas, coment\xE1rios) e identifique os 2 formatos e temas que mais engajaram. Monte 5 posts para a pr\xF3xima semana (gancho, roteiro ou legenda pronta, chamada para a\xE7\xE3o sem prometer resultado). Proponha cada um com a ferramenta propor (canal instagram), para eu aprovar e publicar.",
      ),
    ],
  },
  {
    id: "mkt-anuncios",
    team: "marketing",
    titulo: "Revis\xE3o de an\xFAncios e teste de campanha",
    objetivo: "Decidir se vale rodar an\xFAncio agora, com que oferta e que or\xE7amento de teste.",
    sintese: true,
    passos: [
      ee(
        "midia",
        "Leitura dos an\xFAncios",
        "Consulte os dados de an\xFAncios dos \xFAltimos 30 dias (com atualizar=true). Diga quanto gastou, o custo por lead e o que funcionou ou n\xE3o. Se a conta est\xE1 parada, diga isso sem rodeio e descreva o que precisa existir antes de voltar (p\xE1gina de destino, oferta do plano gr\xE1tis at\xE9 5 pacientes, evento de lead).",
      ),
      ee(
        "alocador",
        "Onde p\xF4r o dinheiro",
        "Com os dados de receita e de an\xFAncios, proponha como dividir um or\xE7amento de teste de R$ 1.500 a R$ 3.000 entre an\xFAncios (Meta), conte\xFAdo, indica\xE7\xE3o e prospec\xE7\xE3o, com custo de aquisi\xE7\xE3o esperado por canal e o crit\xE9rio para escalar ou encerrar em 14 dias. Seja expl\xEDcito sobre o que \xE9 estimativa.",
      ),
    ],
  },
  {
    id: "mkt-prospeccao",
    team: "marketing",
    titulo: "Esteira de prospec\xE7\xE3o no LinkedIn",
    objetivo: "Definir quem abordar, com que mensagem e em que cad\xEAncia, sem lista de pessoas.",
    sintese: false,
    passos: [
      ee(
        "prospeccao",
        "Perfil ideal e abordagem",
        "Defina o perfil ideal de psic\xF3logo aut\xF4nomo para a Synapsa (tempo de carreira, n\xFAmero de pacientes, dores) e os crit\xE9rios para filtrar no LinkedIn. Escreva 3 mensagens de abordagem (conex\xE3o, primeira conversa, follow-up em 3 dias) sem prometer resultado e sem desconto. Descreva a cad\xEAncia e a m\xE9trica de sucesso. N\xE3o monte lista de pessoas: eu fa\xE7o a busca e o envio.",
        true,
      ),
    ],
  },
  {
    id: "mkt-indicacao",
    team: "marketing",
    titulo: "Programa de indica\xE7\xE3o",
    objetivo: "Fazer os 7 clientes atuais trazerem colegas, sem oferecer desconto.",
    sintese: false,
    passos: [
      ee(
        "indicacao",
        "Desenho do programa",
        "Desenhe um programa de indica\xE7\xE3o para os clientes atuais que n\xE3o envolva desconto: como pedir, em que momento, mensagem pronta para eu enviar por WhatsApp, e como medir. Use consultar_dados clientes para saber quem s\xE3o. Proponha as mensagens com a ferramenta propor (canal whatsapp, com contact_ref do cliente).",
      ),
    ],
  },
  {
    id: "com-clinicas",
    team: "comercial",
    titulo: "Playbook de venda para cl\xEDnicas",
    objetivo: "Roteiro completo para vender a cl\xEDnicas, com obje\xE7\xF5es e cad\xEAncia.",
    sintese: false,
    passos: [
      ee(
        "sdr",
        "Roteiro e obje\xE7\xF5es",
        "Escreva o playbook de venda para cl\xEDnicas de psicologia: perguntas de qualifica\xE7\xE3o, roteiro da primeira conversa, as 8 obje\xE7\xF5es mais prov\xE1veis com resposta, cad\xEAncia de follow-up (m\xEDnimo 3 dias entre contatos) e crit\xE9rios para desistir. Use o caso da cl\xEDnica que j\xE1 \xE9 cliente (consultar_dados clientes) como refer\xEAncia de valor, sem expor dados dela.",
        true,
      ),
    ],
  },
  {
    id: "com-fechamento",
    team: "comercial",
    titulo: "Preparar reuni\xE3o e fechamento",
    objetivo: "Checklist e material para qualquer reuni\xE3o de venda.",
    sintese: false,
    passos: [
      ee(
        "closer",
        "Kit de reuni\xE3o",
        "Monte o kit de reuni\xE3o de venda: pauta de 30 minutos, perguntas, demonstra\xE7\xE3o sugerida do produto, como tratar pre\xE7o (sem desconto: mostre valor e o plano gr\xE1tis at\xE9 5 pacientes), proposta de pr\xF3ximos passos e e-mail de resumo p\xF3s-reuni\xE3o para eu enviar.",
      ),
    ],
  },
  {
    id: "com-ativacao",
    team: "comercial",
    titulo: "Ativa\xE7\xE3o do plano gr\xE1tis",
    objetivo:
      "Levar cadastro at\xE9 perfil publicado e primeiro paciente, e preparar o convite ao Essencial.",
    sintese: true,
    passos: [
      ee(
        "ativacao",
        "Sequ\xEAncia de ativa\xE7\xE3o",
        "Desenhe a sequ\xEAncia de mensagens do cadastro at\xE9 o primeiro paciente real (dia 0, 1, 3, 7), com o texto de cada uma. Diga quais dados do funil faltam para medir cada etapa (a plataforma ainda n\xE3o alimenta o Brain com cadastros) e como instrumentar.",
      ),
      ee(
        "pagar",
        "Convite ao Essencial",
        "Desenhe o gatilho e o texto do convite ao Essencial quando o psic\xF3logo chega perto do limite de 5 pacientes. Sem desconto e sem press\xE3o artificial. Diga o que precisa existir na plataforma para o Brain detectar o momento.",
      ),
    ],
  },
  {
    id: "est-mrr",
    team: "estrategia",
    titulo: "Plano para R$ 1.200 de MRR at\xE9 31/12",
    objetivo: "Caminho num\xE9rico da receita atual at\xE9 a meta, com cen\xE1rios e prazos.",
    sintese: true,
    passos: [
      ee(
        "financeiro",
        "Conta e cen\xE1rios",
        "Consulte receita e clientes. Calcule quantos clientes novos do Essencial a R$ 79 faltam, quantos por semana at\xE9 31/12, o efeito dos fins de desconto (quem passa de R$ 49 para R$ 119,99 e o risco de cancelar) e monte 3 cen\xE1rios (conservador, base, agressivo) com a premissa de cada um.",
      ),
      ee(
        "alocador",
        "Canais para chegar l\xE1",
        "Dado o n\xFAmero de clientes novos necess\xE1rio, diga quantos cadastros, ativa\xE7\xF5es e convers\xF5es isso exige com taxas realistas de SaaS B2B pequeno (marque como estimativa) e que canal entrega isso ao menor custo.",
      ),
    ],
  },
  {
    id: "est-semana",
    team: "estrategia",
    titulo: "Revis\xE3o semanal do neg\xF3cio",
    objetivo: "Uma leitura \xFAnica: receita, clientes, an\xFAncios, Instagram, fila e o que fazer primeiro.",
    sintese: true,
    passos: [
      ee(
        "metricas",
        "N\xFAmeros da semana",
        "Consulte receita, clientes, an\xFAncios (atualizar=true) e Instagram (atualizar=true). Resuma o que mudou, o que preocupa e o que est\xE1 funcionando, com n\xFAmeros.",
      ),
      ee(
        "experimentos",
        "Experimento da semana",
        "Escolha UM experimento para a semana com hip\xF3tese, m\xE9trica, dura\xE7\xE3o e crit\xE9rio de escalar ou encerrar, ligado a ativa\xE7\xE3o ou receita.",
      ),
    ],
  },
  {
    id: "est-conformidade",
    team: "estrategia",
    titulo: "Auditoria de conformidade e LGPD",
    objetivo: "Conferir o que o Brain acessa e o que sai, e o que falta para operar com seguran\xE7a.",
    sintese: false,
    passos: [
      ee(
        "compliance",
        "Auditoria",
        "Revise o que o Brain l\xEA (Stripe, Meta, Instagram), onde ficam os dados, quem acessa, e o que as regras de Conformidade barram. Aponte riscos de LGPD para uma plataforma que atende psic\xF3logos (dados de pacientes ficam fora do Brain) e liste ajustes por prioridade.",
        true,
      ),
    ],
  },
  {
    id: "prod-mercado",
    team: "produto",
    titulo: "Recursos que o mercado oferece",
    objetivo: "O que concorrentes e psic\xF3logos esperam do produto e onde a Synapsa pode ganhar.",
    sintese: true,
    passos: [
      ee(
        "descoberta",
        "Pesquisa de recursos",
        "Pesquise na web os recursos de plataformas de gest\xE3o para psic\xF3logos no Brasil (agenda, prontu\xE1rio, cobran\xE7a, teleatendimento, IA, ades\xE3o do paciente). Monte uma matriz recurso x concorrente, aponte lacunas e o que os psic\xF3logos mais reclamam.",
        true,
      ),
      ee(
        "especificacao",
        "Spec do item mais promissor",
        "Pegue o recurso de maior impacto em reten\xE7\xE3o e ades\xE3o do paciente (foco da Synapsa) e escreva a especifica\xE7\xE3o: problema, usu\xE1rio, crit\xE9rios de aceite, rascunho de tela em texto e como medir sucesso.",
      ),
    ],
  },
  {
    id: "prod-uso",
    team: "produto",
    titulo: "Onde o usu\xE1rio trava",
    objetivo: "Diagn\xF3stico de uso e plano para medir.",
    sintese: false,
    passos: [
      ee(
        "uso",
        "Diagn\xF3stico",
        "Diga o que j\xE1 d\xE1 para saber do uso (hoje a plataforma ainda n\xE3o envia eventos ao Brain), quais eventos precisam ser enviados (cadastro, perfil publicado, primeiro paciente, limite de 5) e escreva a lista de eventos com nome e propriedades para o time de produto implementar.",
      ),
    ],
  },
  {
    id: "prod-lancamento",
    team: "produto",
    titulo: "Plano de lan\xE7amento de novidade",
    objetivo: "Changelog, tutorial e aviso para cada lan\xE7amento.",
    sintese: false,
    passos: [
      ee(
        "lancamento",
        "Kit de lan\xE7amento",
        "Monte o modelo de lan\xE7amento: changelog curto, roteiro de tutorial em 60 segundos, mensagem de aviso para os clientes (WhatsApp e e-mail) e post para o Instagram. Deixe os campos a preencher claros para eu usar a cada novidade.",
      ),
    ],
  },
  {
    id: "suc-saude",
    team: "sucesso",
    titulo: "Sa\xFAde dos pagantes e risco de cancelar",
    objetivo: "Plano de contato com cada cliente, principalmente os que t\xEAm desconto acabando.",
    sintese: false,
    passos: [
      ee(
        "saude",
        "Plano por cliente",
        "Consulte clientes e receita. Para cada cliente ativo diga o risco de cancelar (e por qu\xEA), o melhor momento de contato antes do fim do desconto e o roteiro da conversa (sem oferecer desconto, mostrando valor). Proponha o contato dos 3 mais urgentes com a ferramenta propor (canal tarefa).",
      ),
    ],
  },
  {
    id: "suc-cobranca",
    team: "sucesso",
    titulo: "Recupera\xE7\xE3o de pagamentos",
    objetivo: "Fluxo para pagamento que falha, sem desgastar o cliente.",
    sintese: false,
    passos: [
      ee(
        "cobranca",
        "Fluxo de cobran\xE7a",
        "Desenhe o fluxo para pagamento falho (Stripe) e atraso de Pix: mensagens nos dias 0, 3 e 7, tom, o que nunca dizer, e quando eu entro pessoalmente. Considere que hoje o Pix \xE9 informado por mim e n\xE3o lido de um banco.",
      ),
    ],
  },
  {
    id: "suc-clinica",
    team: "sucesso",
    titulo: "Conta da cl\xEDnica",
    objetivo: "Cuidar da conta de R$ 300 por m\xEAs: o que reportar e como crescer dentro dela.",
    sintese: false,
    passos: [
      ee(
        "relclinica",
        "Relat\xF3rio e expans\xE3o",
        "Monte o modelo do relat\xF3rio semanal para a cl\xEDnica (o que foi resolvido, em andamento, pr\xF3ximos passos) e um plano de expans\xE3o dentro da conta (mais profissionais usando) sem desconto. Sem dado cl\xEDnico.",
      ),
    ],
  },
];
export const Xf =
  "Contexto fixo: a Synapsa \xE9 uma plataforma de IA para psic\xF3logos aut\xF4nomos e cl\xEDnicas no Brasil. Plano gr\xE1tis at\xE9 5 pacientes; Essencial a R$ 79 (R$ 119 de tabela). A Lyra \xE9 a assistente que acompanha o paciente entre as sess\xF5es. Quem assina os textos \xE9 o Felipe Dalpra, fundador da Synapsa, que n\xE3o \xE9 psic\xF3logo. Meta: R$ 1.200 de MRR at\xE9 31/12/2026.";
export const Zf =
  "Regras: nunca ofere\xE7a desconto, nunca prometa resultado cl\xEDnico, nunca cite paciente. Texto escrito em meu nome n\xE3o finge que sou psic\xF3logo, n\xE3o inventa experi\xEAncia em comum, nem diz que vi o perfil ou o trabalho da pessoa. Use consultar_dados antes de afirmar qualquer n\xFAmero do neg\xF3cio e diga a fonte. Se faltar dado, diga o que falta e como obter.";
export const Jf =
  'Entregue pelo relatorio: "resumo" com 1 ou 2 frases e "entrega" com o documento completo, pronto para usar (t\xEDtulos curtos, listas, n\xFAmeros com a fonte).';
export const eh = 'Termine com "Pr\xF3ximas 3 a\xE7\xF5es" por impacto em R$.';
export const we =
  "Texto que vai sair para algu\xE9m: deixe na fila com a ferramenta propor (texto_pronto). Nada sai sem o meu OK.";
export const ar = (e, ...a) => ({
  label: "Quantidade",
  padrao: e,
  opcoes: [e, ...a],
});
export const P = (e, a, t, r, o, s, i = false) => ({
  id: `${e}:${a}`,
  agentId: e,
  label: t,
  hint: r,
  task: `${o}

${Xf}
${Zf}
${Jf}${o.includes("Pr\xF3ximas 3 a\xE7\xF5es") ? "" : ` ${eh}`}`,
  campos: s,
  web: i,
});
export const ah = [
  P(
    "chief",
    "briefing",
    "Briefing de agora",
    "MRR, o que mudou e o que depende de voc\xEA.",
    "Monte o briefing de agora: MRR e varia\xE7\xE3o, o que mudou desde ontem, o que travou e as decis\xF5es que dependem de mim, ordenadas por impacto em reais. M\xE1ximo de 15 linhas.",
  ),
  P(
    "chief",
    "semana",
    "Plano da semana",
    "3 apostas ligadas \xE0 meta.",
    "Monte o plano da semana: no m\xE1ximo 3 apostas que mais aproximam o MRR da meta, cada uma com dono (agente), entrega, n\xFAmero-alvo e como medir na sexta.",
  ),
  P(
    "chief",
    "sexta",
    "Fechamento da semana",
    "O que andou, o que n\xE3o andou.",
    "Fa\xE7a o fechamento da semana: o que cada time entregou, o que ficou parado e por qu\xEA, o que repetir e o que cortar na pr\xF3xima semana.",
  ),
  P(
    "chief",
    "risco",
    "Onde estou perdendo dinheiro",
    "Vazamentos de receita e de tempo.",
    "Procure onde a Synapsa est\xE1 perdendo receita ou tempo agora (cancelamentos, descontos acabando, cadastros parados, an\xFAncio sem retorno) e ordene por R$.",
  ),
  P(
    "conteudo",
    "post",
    "Gerar post pronto",
    "Legenda e ideia de imagem na fila.",
    "Crie 1 post de Instagram para psic\xF3logos aut\xF4nomos. Tema: {0}. Veja os posts recentes (consultar_dados instagram) para n\xE3o repetir e seguir o que engajou. Entregue gancho, legenda (at\xE9 900 caracteres), 5 hashtags e a ideia da imagem. {1} " +
      we +
      " Se eu informar o link https da imagem, use imagem_url na proposta com canal instagram para eu aprovar e publicar. Link da imagem: {2}.",
    [
      {
        label: "Tema",
        padrao: "o tema que o perfil ainda n\xE3o cobriu e que mais atrai psic\xF3logo aut\xF4nomo",
        placeholder: "ex.: como cobrar a sess\xE3o sem constrangimento",
      },
      {
        label: "Formato",
        padrao: "imagem \xFAnica",
        opcoes: ["imagem \xFAnica", "carrossel", "reels"],
      },
      {
        label: "Link https da imagem (para publicar)",
        padrao: "",
        opcional: true,
        https: true,
        placeholder: "opcional",
      },
    ],
  ),
  P(
    "conteudo",
    "ideias",
    "Ideias de post",
    "Lista de temas com gancho.",
    "Liste {0} ideias de post para psic\xF3logos aut\xF4nomos, cada uma com gancho de 1 linha, formato sugerido e a dor do psic\xF3logo que ela toca. Evite o que j\xE1 foi postado (consultar_dados instagram).",
    [ar("10", "5", "20")],
  ),
  P(
    "conteudo",
    "criativo",
    "Briefing do criativo",
    "Conceito, texto na arte e prompt de imagem.",
    "Fa\xE7a o briefing de um criativo de {0} sobre: {1}. Entregue conceito visual, texto exato que vai na arte (curto), formato em pixels, paleta (roxo e azul da Synapsa, estilo Lyra: bichinhos arredondados, contorno azul-marinho), e um prompt de imagem pronto para colar no gerador. N\xE3o invente depoimento nem n\xFAmero.",
    [
      {
        label: "Pe\xE7a",
        padrao: "post de feed",
        opcoes: ["post de feed", "story", "an\xFAncio de capta\xE7\xE3o", "capa de carrossel"],
      },
      {
        label: "Assunto",
        padrao: "criar o perfil na Synapsa e come\xE7ar com 5 pacientes gr\xE1tis",
        placeholder: "o que o criativo comunica",
      },
    ],
  ),
  P(
    "conteudo",
    "carrossel",
    "Carrossel completo",
    "Texto de cada slide.",
    "Escreva um carrossel de {0} slides sobre: {1}. Slide 1 \xE9 gancho, o \xFAltimo \xE9 chamada para a\xE7\xE3o sem press\xE3o. D\xEA o texto de cada slide (m\xE1x. 25 palavras) e a legenda. " +
      we,
    [
      {
        label: "Slides",
        padrao: "8",
        opcoes: ["6", "8", "10"],
      },
      {
        label: "Assunto",
        padrao: "um erro comum de quem come\xE7a a atender e como evitar",
        placeholder: "tema do carrossel",
      },
    ],
  ),
  P(
    "conteudo",
    "reels",
    "Roteiro de reels",
    "Fala, cenas e legenda.",
    "Escreva o roteiro de um reels de 30 a 40 segundos sobre: {0}. Gancho nos 3 primeiros segundos, fala palavra por palavra, o que aparece na tela, texto na tela e legenda.",
    [
      {
        label: "Assunto",
        padrao: "como a Lyra acompanha o paciente entre as sess\xF5es sem tomar o lugar do psic\xF3logo",
        placeholder: "tema do reels",
      },
    ],
  ),
  P(
    "conteudo",
    "semana",
    "Calend\xE1rio da semana",
    "5 posts planejados.",
    "Planeje 5 posts para a semana (dia, formato, tema, gancho e legenda curta), baseados no que j\xE1 funcionou no perfil. Misture dor, prova de uso real (sem citar paciente) e produto.",
  ),
  P(
    "conteudo",
    "analise",
    "Como est\xE1 o Instagram",
    "Seguidores, alcance e o que funcionou.",
    "Analise o Instagram @synapsa.ai: seguidores e crescimento, alcance, os posts que mais engajaram e o que repetir ou cortar nas pr\xF3ximas duas semanas.",
  ),
  P(
    "prospeccao",
    "lote",
    "Lote de mensagens de LinkedIn",
    "Mensagens prontas para voc\xEA enviar hoje.",
    "Prepare o lote do dia de {0} mensagens de LinkedIn para psic\xF3logos aut\xF4nomos, divididas por perfil (rec\xE9m-formado, consult\xF3rio pr\xF3prio, atende online, cl\xEDnica pequena). Para cada uma: nota de conex\xE3o de at\xE9 200 caracteres e a primeira mensagem de at\xE9 400. Tom de colega, uma pergunta s\xF3, sem vender na primeira. N\xE3o use nomes de pessoas (n\xE3o h\xE1 lista): deixe [Nome] onde entra o nome. Entregue pelo relatorio, n\xE3o pela fila. Lembre no fim o limite seguro de convites por dia (cerca de 20) e que o envio \xE9 manual pelo meu perfil.",
    [ar("10", "5", "20")],
  ),
  P(
    "prospeccao",
    "followup",
    "Follow-ups",
    "Sequ\xEAncia para quem n\xE3o respondeu.",
    "Escreva a sequ\xEAncia de follow-up para quem aceitou a conex\xE3o e n\xE3o respondeu: mensagem do dia 3, do dia 7 e a de encerramento educado. Curtas, sem press\xE3o, cada uma com um motivo novo para responder.",
  ),
  P(
    "prospeccao",
    "perfil",
    "Meu perfil de LinkedIn",
    "Ajustes que aumentam aceite.",
    "Revise o que o meu perfil de LinkedIn precisa ter para quem \xE9 psic\xF3logo aceitar e responder: t\xEDtulo, sobre, destaque e post fixado. Entregue o texto sugerido de cada parte.",
    void 0,
    true,
  ),
  P(
    "prospeccao",
    "icp",
    "Quem abordar primeiro",
    "Perfil ideal e onde achar.",
    "Defina o perfil ideal de psic\xF3logo aut\xF4nomo para a Synapsa abordar primeiro (tempo de carreira, como capta, sinais de dor) e os 5 lugares onde achar esse perfil (grupos, eventos, hashtags). Sem lista de pessoas.",
    void 0,
    true,
  ),
  P(
    "prospeccao",
    "resposta",
    "Responder um lead",
    "Resposta para o que ele escreveu.",
    `Escreva a resposta para esta mensagem de um psic\xF3logo no LinkedIn, no meu tom, sem vender de cara e sem desconto:
{0}`,
    [
      {
        label: "Mensagem recebida",
        padrao: "",
        placeholder: "cole o que a pessoa respondeu",
      },
    ],
  ),
  P(
    "indicacao",
    "convite",
    "Convite de indica\xE7\xE3o",
    "Texto para os clientes atuais.",
    "Escreva o convite para os clientes atuais indicarem colegas: sem desconto, com um benef\xEDcio que n\xE3o seja dinheiro (ex.: prioridade em novidades). Duas vers\xF5es, WhatsApp e e-mail. " +
      we,
  ),
  P(
    "indicacao",
    "programa",
    "Desenhar o programa",
    "Regras, ganho e como medir.",
    "Desenhe o programa de indica\xE7\xE3o: quem pode indicar, o que a pessoa ganha (sem desconto), como registrar a indica\xE7\xE3o, como medir e a meta de indica\xE7\xF5es por m\xEAs.",
  ),
  P(
    "indicacao",
    "mensagem",
    "Mensagem para o indicado",
    "Texto que o cliente repassa.",
    "Escreva o texto curto que o cliente atual pode encaminhar ao colega, em primeira pessoa, natural, com o link do cadastro gr\xE1tis.",
  ),
  P(
    "midia",
    "metricas",
    "M\xE9tricas do Meta Ads",
    "Gasto, cliques, leads e custo por lead.",
    "Leia o Meta Ads dos \xFAltimos {0} e mostre gasto, cliques, leads, custo por lead e campanhas sem retorno. Se a conta estiver parada, diga e recomende se vale voltar.",
    [
      {
        label: "Per\xEDodo",
        padrao: "30 dias",
        opcoes: ["7 dias", "30 dias"],
      },
    ],
  ),
  P(
    "midia",
    "campanha",
    "Montar teste de campanha",
    "Oferta, p\xFAblico e or\xE7amento de teste.",
    "Proponha um teste de campanha no Meta para captar cadastros de psic\xF3logos aut\xF4nomos com or\xE7amento de teste de {0} reais: oferta, p\xFAblico, 3 criativos (texto de cada), teto di\xE1rio, regra de parar e o que decide escalar. Sem prometer resultado. O que for estimativa, marque.",
    [
      {
        label: "Or\xE7amento de teste (R$)",
        padrao: "300",
        opcoes: ["150", "300", "600", "1000"],
      },
    ],
  ),
  P(
    "midia",
    "copy",
    "Textos de an\xFAncio",
    "Varia\xE7\xF5es para testar.",
    "Escreva {0} varia\xE7\xF5es de texto de an\xFAncio para psic\xF3logos aut\xF4nomos (t\xEDtulo de at\xE9 40 caracteres, texto principal de at\xE9 125), cada uma com um \xE2ngulo diferente (tempo, organiza\xE7\xE3o, acompanhamento do paciente, plano gr\xE1tis). Respeite as regras de propaganda do CFP.",
    [ar("6", "3", "10")],
  ),
  P(
    "midia",
    "corte",
    "O que cortar",
    "Gasto sem retorno.",
    "Veja o gasto por campanha e diga o que cortar ou pausar agora e o que manter, com o n\xFAmero que justifica.",
  ),
  P(
    "inteligencia",
    "concorrentes",
    "Mapa de concorrentes",
    "Pre\xE7o, plano gr\xE1tis e posicionamento.",
    "Pesquise na web {0} concorrentes da Synapsa para psic\xF3logos no Brasil: pre\xE7o, plano gr\xE1tis, posicionamento, o que prometem e que \xE2ngulo de mensagem est\xE1 livre. Cite a fonte de cada fato.",
    [ar("5", "3", "8")],
    true,
  ),
  P(
    "inteligencia",
    "demanda",
    "O que psic\xF3logos procuram",
    "Dores e termos de busca.",
    "Pesquise na web as d\xFAvidas e dores de psic\xF3logos aut\xF4nomos sobre captar pacientes, organizar consult\xF3rio e IA, e transforme em 8 temas de conte\xFAdo, cada um com a dor e o termo que a pessoa busca.",
    void 0,
    true,
  ),
  P(
    "inteligencia",
    "tendencias",
    "Tend\xEAncias do setor",
    "O que mudou no mercado.",
    "Pesquise na web o que mudou nos \xFAltimos meses em IA e tecnologia para psicologia no Brasil (regras do CFP, concorrentes novos, comportamento do psic\xF3logo) e diga o que isso muda para a Synapsa.",
    void 0,
    true,
  ),
  P(
    "inteligencia",
    "ads",
    "An\xFAncios dos concorrentes",
    "\xC2ngulos que eles usam.",
    "Pesquise na web como os concorrentes anunciam para psic\xF3logos (\xE2ngulos, ofertas, tom) e traga 5 \xE2ngulos que a Synapsa pode usar e 2 que deve evitar.",
    void 0,
    true,
  ),
  P(
    "ativacao",
    "parados",
    "Cadastros parados",
    "Onde o cadastro trava.",
    "Veja o funil e liste onde os cadastros travam (cadastro, perfil publicado, primeiro paciente). Escreva a mensagem de ativa\xE7\xE3o para cada ponto, curta e \xFAtil. " +
      we,
  ),
  P(
    "ativacao",
    "boasvindas",
    "Sequ\xEAncia de boas-vindas",
    "3 mensagens para o primeiro dia.",
    "Escreva a sequ\xEAncia de boas-vindas de 3 mensagens (hora 0, dia 1, dia 3) que leva o psic\xF3logo ao perfil publicado e ao primeiro paciente. Canal: e-mail e WhatsApp, vers\xE3o de cada.",
  ),
  P(
    "ativacao",
    "checklist",
    "Checklist de ativa\xE7\xE3o",
    "Passo a passo dentro do produto.",
    "Monte o checklist de ativa\xE7\xE3o do psic\xF3logo (5 passos no m\xE1ximo), com o motivo de cada passo e como saber que ele concluiu.",
  ),
  P(
    "pagar",
    "limite",
    "Convite no limite de 5",
    "Texto para quem chegou ao limite.",
    "Escreva o convite ao Essencial (R$ 79) para quem chega no limite de 5 pacientes: sem desconto, focado em tempo e organiza\xE7\xE3o, uma chamada s\xF3. WhatsApp e e-mail. " +
      we,
  ),
  P(
    "pagar",
    "objecoes",
    "Obje\xE7\xF5es ao pagar",
    "Respostas prontas.",
    "Liste as 6 obje\xE7\xF5es mais prov\xE1veis ao assinar o Essencial (pre\xE7o, 'j\xE1 uso outra coisa', 'n\xE3o preciso agora') e a resposta honesta de cada uma, sem desconto.",
  ),
  P(
    "pagar",
    "pagina",
    "Texto da p\xE1gina de planos",
    "Gr\xE1tis vs Essencial.",
    "Escreva o texto da compara\xE7\xE3o entre o plano gr\xE1tis e o Essencial: o que muda, para quem serve cada um, sem exagero.",
  ),
  P(
    "sdr",
    "roteiro",
    "Roteiro de conversa",
    "Conversa de venda para cl\xEDnica.",
    "Monte o roteiro da conversa de venda para cl\xEDnicas: abertura, 8 perguntas de descoberta, obje\xE7\xF5es e pr\xF3ximo passo. Sem prospec\xE7\xE3o ativa at\xE9 a cl\xEDnica atual estabilizar.",
  ),
  P(
    "sdr",
    "whats",
    "Mensagens de WhatsApp",
    "Primeira abordagem e retomada.",
    "Escreva 3 mensagens de WhatsApp para retomar contato com quem j\xE1 conversou e sumiu, cada uma com um motivo novo de contato. Sem desconto. " +
      we,
  ),
  P(
    "sdr",
    "qualificar",
    "Perguntas de qualifica\xE7\xE3o",
    "Quem vale a reuni\xE3o.",
    "Monte as 6 perguntas para saber se uma cl\xEDnica vale uma reuni\xE3o (tamanho, sistema atual, quem decide, dor) e a regra de quando descartar.",
  ),
  P(
    "closer",
    "reuniao",
    "Preparar reuni\xE3o",
    "Contexto e perguntas.",
    "Prepare a reuni\xE3o com {0}: contexto, perguntas de descoberta, obje\xE7\xF5es prov\xE1veis e o pr\xF3ximo passo a pedir.",
    [
      {
        label: "Com quem",
        padrao: "a pr\xF3xima reuni\xE3o da minha agenda",
        placeholder: "nome da cl\xEDnica ou psic\xF3logo",
      },
    ],
  ),
  P(
    "closer",
    "ata",
    "Resumo p\xF3s-reuni\xE3o",
    "O que ficou combinado.",
    `Transforme estas anota\xE7\xF5es em resumo da reuni\xE3o, decis\xF5es, pend\xEAncias com dono e a mensagem de acompanhamento:
{0}`,
    [
      {
        label: "Anota\xE7\xF5es",
        padrao: "",
        placeholder: "cole o que anotou",
      },
    ],
  ),
  P(
    "closer",
    "proposta",
    "Proposta comercial",
    "Documento para a cl\xEDnica.",
    "Escreva a proposta comercial para {0}: problema, solu\xE7\xE3o, plano, pre\xE7o de tabela (sem desconto), prazo de implanta\xE7\xE3o e pr\xF3ximos passos.",
    [
      {
        label: "Cliente",
        padrao: "uma cl\xEDnica pequena (3 a 5 psic\xF3logos)",
        placeholder: "nome ou perfil",
      },
    ],
  ),
  P(
    "closer",
    "fechar",
    "Fechar o que ficou aberto",
    "Quem est\xE1 esperando resposta.",
    "Liste as conversas abertas que dependem de mim, o que falta para cada uma fechar e a mensagem de retomada. " +
      we,
  ),
  P(
    "financeiro",
    "meta",
    "Conta da meta",
    "Quantos clientes faltam e cen\xE1rios.",
    "Calcule quantos Essenciais a R$ 79 faltam para a meta, quantos por semana at\xE9 31/12, o efeito dos fins de desconto e 3 cen\xE1rios (conservador, base, agressivo) com a premissa de cada um.",
  ),
  P(
    "financeiro",
    "custo",
    "Custo do usu\xE1rio gr\xE1tis",
    "Quanto cada cadastro custa.",
    "Estime o custo mensal de cada usu\xE1rio gratuito (IA, infraestrutura) e quantos gr\xE1tis o caixa aguenta por pagante. Marque o que \xE9 estimativa e o que dado falta.",
  ),
  P(
    "financeiro",
    "caixa",
    "Fluxo dos pr\xF3ximos 90 dias",
    "Entradas, descontos acabando e custos.",
    "Projete as entradas dos pr\xF3ximos 90 dias com base em Stripe e Pix informados, incluindo os fins de desconto, e liste os custos fixos conhecidos.",
  ),
  P(
    "alocador",
    "orcamento",
    "Propor or\xE7amento",
    "Onde p\xF4r o dinheiro, com teto.",
    "Proponha o or\xE7amento mensal de aquisi\xE7\xE3o de {0} reais: quanto em cada canal (an\xFAncio, conte\xFAdo, ferramenta), custo por cadastro estimado, quando parar e o que cada real precisa render. Marque o que \xE9 estimativa.",
    [
      {
        label: "Or\xE7amento do m\xEAs (R$)",
        padrao: "500",
        opcoes: ["300", "500", "1000", "2000"],
      },
    ],
  ),
  P(
    "alocador",
    "estrategia",
    "Propor estrat\xE9gia",
    "Canal mais barato para a meta.",
    "Proponha a estrat\xE9gia de aquisi\xE7\xE3o at\xE9 31/12: quantos cadastros, ativa\xE7\xF5es e pagantes s\xE3o necess\xE1rios com taxas realistas (marque como estimativa) e que canal entrega isso ao menor custo.",
  ),
  P(
    "alocador",
    "canais",
    "Comparar canais",
    "Custo por cadastro de cada um.",
    "Compare LinkedIn, Instagram, indica\xE7\xE3o e an\xFAncio pago por custo por cadastro e por esfor\xE7o, com o dado real quando existir e estimativa marcada quando n\xE3o.",
  ),
  P(
    "metricas",
    "funil",
    "Funil de hoje",
    "Cadastro, ativado, no limite, pago.",
    "Mostre o funil e o MRR de hoje, o que mudou na semana e onde est\xE1 o gargalo.",
  ),
  P(
    "metricas",
    "semana",
    "Relat\xF3rio semanal",
    "N\xFAmeros que importam.",
    "Monte o relat\xF3rio semanal: MRR, clientes, Instagram, an\xFAncios e funil, cada n\xFAmero com a fonte e a varia\xE7\xE3o contra a semana anterior.",
  ),
  P(
    "metricas",
    "meta",
    "Estou no ritmo?",
    "Compara com o que falta.",
    "Compare o ritmo atual de MRR com o necess\xE1rio para chegar na meta e diga, com n\xFAmero, se estou adiantado ou atrasado.",
  ),
  P(
    "experimentos",
    "teste",
    "Desenhar um teste",
    "Uma hip\xF3tese, uma m\xE9trica.",
    "Desenhe 1 experimento para subir {0}: hip\xF3tese, o que muda, m\xE9trica, tamanho m\xEDnimo, dura\xE7\xE3o e a regra de decidir (escalar ou encerrar).",
    [
      {
        label: "Objetivo",
        padrao: "ativa\xE7\xE3o dos cadastros",
        opcoes: [
          "ativa\xE7\xE3o dos cadastros",
          "convers\xE3o para o Essencial",
          "resposta no LinkedIn",
          "cliques no an\xFAncio",
        ],
      },
    ],
  ),
  P(
    "experimentos",
    "ideias",
    "Backlog de testes",
    "10 testes ordenados.",
    "Liste 10 experimentos poss\xEDveis, ordenados por impacto esperado dividido por esfor\xE7o, cada um com a m\xE9trica.",
  ),
  P(
    "experimentos",
    "resultado",
    "Ler o resultado de um teste",
    "Escalar ou encerrar.",
    `Leia o resultado deste teste e diga se escala ou encerra, com o motivo estat\xEDstico em linguagem simples:
{0}`,
    [
      {
        label: "Dados do teste",
        padrao: "",
        placeholder: "cole os n\xFAmeros",
      },
    ],
  ),
  P(
    "compliance",
    "revisar",
    "Revisar um texto",
    "Checa LGPD, CFP e promessas.",
    `Revise o texto a seguir quanto a LGPD, \xE9tica do CFP, promessa de resultado, desconto e uso de dado de paciente, e devolva a vers\xE3o corrigida com o que mudou:
{0}`,
    [
      {
        label: "Texto",
        padrao: "",
        placeholder: "cole a mensagem ou o post",
      },
    ],
  ),
  P(
    "compliance",
    "auditoria",
    "Auditar o que saiu",
    "Mensagens e acessos recentes.",
    "Audite as propostas e envios dos \xFAltimos 7 dias contra as regras (consentimento, intervalo entre contatos, desconto, dado de paciente) e liste qualquer desvio.",
  ),
  P(
    "compliance",
    "lgpd",
    "Checklist de LGPD",
    "O que falta para estar em dia.",
    "Monte o checklist de LGPD da Synapsa para o que ela faz hoje (cadastro de psic\xF3logo, dados do paciente na plataforma, e-mails e an\xFAncios) e marque o que sei que est\xE1 feito e o que falta confirmar.",
  ),
  P(
    "guardiao",
    "dados",
    "Conferir os n\xFAmeros",
    "Stripe, Pix e MRR batem?",
    "Confira se MRR, clientes e descontos batem entre Stripe e o que foi informado, e aponte qualquer diverg\xEAncia.",
  ),
  P(
    "guardiao",
    "acessos",
    "O que cada agente acessa",
    "Fontes e permiss\xF5es.",
    "Liste a que fontes de dado cada agente tem acesso hoje e se alguma permiss\xE3o \xE9 maior do que o necess\xE1rio.",
  ),
  P(
    "descoberta",
    "backlog",
    "O que construir agora",
    "Backlog por impacto em R$.",
    "Ordene o que construir agora por impacto em R$, com o motivo de cada item e o que fica de fora. M\xE1ximo de 7 itens.",
  ),
  P(
    "descoberta",
    "feedback",
    "Resumo do feedback",
    "O que os clientes pedem.",
    "Junte o feedback e as reclama\xE7\xF5es conhecidos em temas, com quantas vezes aparecem e o que fazer com cada um.",
  ),
  P(
    "descoberta",
    "lyra",
    "Ideias para a Lyra",
    "Melhorias que aumentam reten\xE7\xE3o.",
    "Proponha 5 melhorias na Lyra que aumentem o uso do paciente entre sess\xF5es e, com isso, a reten\xE7\xE3o do psic\xF3logo, cada uma com esfor\xE7o e o que medir.",
  ),
  P(
    "especificacao",
    "spec",
    "Escrever uma spec",
    "Crit\xE9rio de aceite incluso.",
    "Escreva a spec de: {0}. Problema, solu\xE7\xE3o, fluxo, crit\xE9rios de aceite, o que fica fora, riscos e como medir.",
    [
      {
        label: "Funcionalidade",
        padrao: "o item de maior prioridade do backlog",
        placeholder: "ex.: lembrete de sess\xE3o pela Lyra",
      },
    ],
  ),
  P(
    "especificacao",
    "texto",
    "Textos da interface",
    "Mensagens e vazios do produto.",
    "Escreva os textos de interface (bot\xF5es, estados vazios, erros) para: {0}. Portugu\xEAs claro, voz ativa, sem jarg\xE3o.",
    [
      {
        label: "Tela",
        padrao: "o primeiro acesso do psic\xF3logo",
        placeholder: "qual tela",
      },
    ],
  ),
  P(
    "uso",
    "travas",
    "Onde o usu\xE1rio trava",
    "Uso dentro do produto.",
    "Mostre onde o usu\xE1rio trava dentro do produto e quais recursos usa, o que d\xE1 para saber hoje e o que falta instrumentar.",
  ),
  P(
    "uso",
    "eventos",
    "Eventos a instrumentar",
    "O que medir primeiro.",
    "Liste os 10 eventos que a plataforma precisa registrar para medir ativa\xE7\xE3o e reten\xE7\xE3o, com nome, quando dispara e o que responde.",
  ),
  P(
    "lancamento",
    "novidade",
    "Comunicar novidade",
    "Changelog e e-mail.",
    "Escreva o changelog e o e-mail curto para clientes sobre: {0}. " + we,
    [
      {
        label: "Novidade",
        padrao: "",
        placeholder: "o que mudou no produto",
      },
    ],
  ),
  P(
    "lancamento",
    "tutorial",
    "Tutorial passo a passo",
    "Para o cliente seguir.",
    "Escreva o tutorial passo a passo de: {0}, com no m\xE1ximo 6 passos e o resultado esperado de cada um.",
    [
      {
        label: "Recurso",
        padrao: "criar e publicar o perfil",
        placeholder: "qual recurso",
      },
    ],
  ),
  P(
    "lancamento",
    "post",
    "Post de lan\xE7amento",
    "Instagram e LinkedIn.",
    "Escreva o post de lan\xE7amento de: {0}, uma vers\xE3o para Instagram e uma para LinkedIn. " + we,
    [
      {
        label: "Novidade",
        padrao: "",
        placeholder: "o que lan\xE7ou",
      },
    ],
  ),
  P(
    "saude",
    "contas",
    "Sa\xFAde das contas",
    "Quem corre risco de cancelar.",
    "Veja a sa\xFAde das contas pagantes e diga quem corre risco de cancelar e a a\xE7\xE3o para cada uma. " +
      we,
  ),
  P(
    "saude",
    "checkin",
    "Check-in com pagantes",
    "Mensagem de acompanhamento.",
    "Escreva a mensagem de check-in para pagantes (30 dias de uso): pergunta de uma linha sobre o que est\xE1 funcionando e o que falta. " +
      we,
  ),
  P(
    "saude",
    "nps",
    "Pesquisa de satisfa\xE7\xE3o",
    "Perguntas curtas.",
    "Monte a pesquisa de satisfa\xE7\xE3o de 3 perguntas para os pagantes e como ler a resposta de cada uma.",
  ),
  P(
    "cobranca",
    "falhas",
    "Pagamentos que falharam",
    "Mensagem de recupera\xE7\xE3o.",
    "Veja pagamentos falhos no Stripe e escreva a mensagem de recupera\xE7\xE3o, cordial e sem press\xE3o, com o link para atualizar o cart\xE3o. " +
      we,
  ),
  P(
    "cobranca",
    "desconto",
    "Aviso de fim de desconto",
    "Contato 30 dias antes.",
    "Prepare o aviso para as contas cujo desconto acaba nos pr\xF3ximos 60 dias: o que muda, quando, e o valor novo, com transpar\xEAncia. Sem oferecer desconto. " +
      we,
  ),
  P(
    "cobranca",
    "cancelamento",
    "Resposta a pedido de cancelamento",
    "Sa\xEDda respeitosa.",
    "Escreva a resposta a quem pede cancelamento: entender o motivo em uma pergunta, facilitar a sa\xEDda e deixar a porta aberta. Sem contraoferta de desconto.",
  ),
  P(
    "escalonador",
    "erro",
    "Abrir tarefa de erro",
    "Passos para reproduzir.",
    `Transforme este relato de erro da cl\xEDnica em tarefa t\xE9cnica clara, com passos para reproduzir, impacto e prioridade:
{0}`,
    [
      {
        label: "Relato do erro",
        padrao: "",
        placeholder: "o que a cl\xEDnica reportou",
      },
    ],
  ),
  P(
    "escalonador",
    "abertos",
    "Erros em aberto",
    "Fila por gravidade.",
    "Liste os erros da cl\xEDnica ainda abertos por gravidade e o que bloqueia cada um.",
  ),
  P(
    "relclinica",
    "semana",
    "Relat\xF3rio da cl\xEDnica",
    "O que foi resolvido na semana.",
    "Escreva o relat\xF3rio semanal para a cl\xEDnica: o que foi resolvido, o que est\xE1 em andamento e o pr\xF3ximo passo, em tom de parceria. " +
      we,
  ),
  P(
    "relclinica",
    "reuniao",
    "Pauta da reuni\xE3o com a cl\xEDnica",
    "Pontos e perguntas.",
    "Monte a pauta da pr\xF3xima reuni\xE3o com a cl\xEDnica: o que mostrar, o que perguntar e o que pedir a eles.",
  ),
];
export const th = (e) => ah.filter((a) => a.agentId === e);
export const nh = (e) => (e.campos ?? []).every((a) => a.opcional || a.padrao.trim() !== "");
export const Ao = (e) => (e.campos ?? []).map((a) => a.padrao);
