// Elenco dos 24 agentes do Synapsa Brain. Fonte: documento técnico (fichas dos agentes).
import type { Agent, Area } from "./types";

export const AREAS: Area[] = [
  {
    "id": "comando",
    "name": "Comando",
    "goal": "Seu tempo concentrado no que move o MRR."
  },
  {
    "id": "ativacao",
    "name": "Ativação e conversão",
    "goal": "Do cadastro ao Essencial: perfil publicado, primeiro paciente, limite de 5 pacientes."
  },
  {
    "id": "sucesso",
    "name": "Sucesso e retenção",
    "goal": "Nenhum pagante cancela. Todo feedback vira ação."
  },
  {
    "id": "clinica",
    "name": "Clínica",
    "goal": "Conta estratégica: erros resolvidos antes de vender outra clínica."
  },
  {
    "id": "growth",
    "name": "Growth e dados",
    "goal": "Funil medido, números confiáveis, testes que terminam em decisão."
  },
  {
    "id": "aquisicao",
    "name": "Aquisição de autônomos",
    "goal": "Cadastros ativados por semana. Canais: LinkedIn, indicação e Instagram."
  },
  {
    "id": "produto",
    "name": "Produto",
    "goal": "Prioridade por impacto em R$: financeiro e estabilidade da clínica vêm primeiro."
  },
  {
    "id": "financeiro",
    "name": "Financeiro e conformidade",
    "goal": "Caminho até R$ 1.200 e zero risco regulatório."
  },
  {
    "id": "comercial",
    "name": "Comercial consultivo",
    "goal": "Prepara reuniões e conversas. Sem prospecção ativa de clínica até a atual estabilizar."
  }
];

export const AGENTS: Agent[] = [
  {
    "id": "chief",
    "area": "comando",
    "ready": "pronto",
    "name": "Chief of Staff",
    "mission": "Reunir tudo que precisa de você num briefing e numa fila ordenada por impacto em R$.",
    "metric": "Minutos por dia na fila de aprovação, sem perder receita",
    "needs": "Propostas e resultados dos outros agentes.",
    "triggers": [
      "Todo dia às 7h",
      "Proposta de alto impacto chegou",
      "Dois agentes querem falar com a mesma pessoa"
    ],
    "subs": [
      {
        "name": "Priorizador",
        "tier": "forte",
        "does": "Ordena a fila pelo impacto estimado no MRR"
      },
      {
        "name": "Resolvedor de conflitos",
        "tier": "leve",
        "does": "Define o dono da conversa e respeita o intervalo entre contatos"
      },
      {
        "name": "Redator do briefing",
        "tier": "forte",
        "does": "Resume o dia em decisões, não em relatórios"
      }
    ],
    "auto": [
      "Montar o briefing",
      "Ordenar a fila",
      "Atribuir o dono de cada conversa"
    ],
    "aprova": [],
    "humano": [
      "Toda decisão que sai da fila"
    ],
    "limits": "Não envia nada para fora. Entrega no máximo cerca de 15 itens por dia na fila.",
    "learns": "Registra o que você aprova primeiro e o que deixa parado, e reordena a fila com isso.",
    "note": null
  },
  {
    "id": "ativacao",
    "area": "ativacao",
    "ready": "parcial",
    "name": "Ativação do Freemium",
    "mission": "Levar cada cadastro até perfil publicado e primeiro paciente real.",
    "metric": "Cadastros ativados (hoje cerca de 20 de 35)",
    "needs": "Cadastros, pacientes e consultas da plataforma. Perfil publicado e último acesso ainda não chegam como evento.",
    "triggers": [
      "Cadastro novo",
      "48h sem perfil publicado",
      "Perfil publicado e nenhum paciente em 7 dias",
      "Primeiro paciente chegou"
    ],
    "subs": [
      {
        "name": "Rastreador de marcos",
        "tier": "leve",
        "does": "Acompanha perfil publicado, agenda, primeiro paciente, primeira consulta e link divulgado"
      },
      {
        "name": "Concierge de perfil público",
        "tier": "forte",
        "does": "Ajuda a escrever a bio e o texto do site, pensando em ser encontrado"
      },
      {
        "name": "Redator",
        "tier": "forte",
        "does": "Mensagem curta, no tom da Synapsa"
      }
    ],
    "auto": [
      "Boas-vindas e parabéns pelo 1º paciente, com modelos que você já aprovou"
    ],
    "aprova": [
      "Ajuda para montar o perfil",
      "Dicas para divulgar o link"
    ],
    "humano": [],
    "limits": "1 contato a cada 3 dias. Para quando a pessoa responde. Só com aceite de WhatsApp. Entre 9h e 19h.",
    "learns": "Guarda as mensagens aprovadas sem edição como modelo e o que você corta nas outras.",
    "note": null
  },
  {
    "id": "pagar",
    "area": "ativacao",
    "ready": "parcial",
    "name": "Momento de Pagar",
    "mission": "Convidar para o Essencial na hora em que o limite de 5 pacientes aperta.",
    "metric": "Conversão do gratuito para o Essencial",
    "needs": "Contagem de pacientes e plano, na plataforma. Falta registrar a tentativa de usar recurso bloqueado.",
    "triggers": [
      "4 de 5 pacientes (cerca de 80% do limite)",
      "Limite batido",
      "Tentou usar recurso bloqueado",
      "Ativo há 14 dias ou mais sem bater o limite"
    ],
    "subs": [
      {
        "name": "Detector de intenção",
        "tier": "leve",
        "does": "Dá nota de intenção de compra a cada sinal"
      },
      {
        "name": "Calculador de limite",
        "tier": "leve",
        "does": "Mede o uso do limite de pacientes"
      },
      {
        "name": "Gestor do trial de 14 dias",
        "tier": "forte",
        "does": "Cuida de quem chega com mais de 5 pacientes: abre, acompanha e fecha o trial"
      },
      {
        "name": "Redator",
        "tier": "forte",
        "does": "Convite de valor, sem pressão"
      }
    ],
    "auto": [],
    "aprova": [
      "Convite de valor",
      "Convite imediato com link de assinatura",
      "Abertura do trial de 14 dias"
    ],
    "humano": [
      "Qualquer desconto",
      "Pergunta de preço ou objeção"
    ],
    "limits": "Nunca oferece desconto. 1 contato a cada 3 dias. Para quando a pessoa responde.",
    "learns": "Qual sinal e qual mensagem antecederam cada assinatura.",
    "note": "O sinal de recurso bloqueado ainda precisa ser registrado pela plataforma."
  },
  {
    "id": "saude",
    "area": "sucesso",
    "ready": "pronto",
    "name": "Saúde da Conta e Voz do Cliente",
    "mission": "Nenhum pagante cancela, e todo feedback chega a quem pode agir.",
    "metric": "Churn dos pagantes (meta: zero)",
    "needs": "Uso e assinatura na plataforma, mais o feedback que você repassar.",
    "triggers": [
      "Queda de uso",
      "Pagante sem login há 7 dias",
      "Reclamação ou NPS baixo"
    ],
    "subs": [
      {
        "name": "Radar de risco",
        "tier": "leve",
        "does": "Dá nota de risco a cada pagante"
      },
      {
        "name": "Detetive de causa",
        "tier": "forte",
        "does": "Explica por que a conta está em risco, por exemplo uma queixa sobre o financeiro"
      },
      {
        "name": "Coletor de feedback",
        "tier": "leve",
        "does": "Pede e organiza o que os pagantes dizem"
      },
      {
        "name": "Redator",
        "tier": "forte",
        "does": "Contato de cuidado, humano e direto"
      }
    ],
    "auto": [
      "Calcular risco",
      "Registrar feedback"
    ],
    "aprova": [
      "Contato de cuidado",
      "Pedido de feedback"
    ],
    "humano": [
      "Conversa com a conta em risco",
      "Qualquer concessão"
    ],
    "limits": "Pagante só recebe contato com a sua aprovação.",
    "learns": "Quais sinais antecederam um cancelamento ou uma reclamação.",
    "note": "Os feedbacks que se repetem vão direto para o agente de Descoberta, no Produto."
  },
  {
    "id": "cobranca",
    "area": "sucesso",
    "ready": "parcial",
    "name": "Cobrança",
    "mission": "Recuperar pagamentos que falharam sem desgastar o cliente.",
    "metric": "Valor recuperado de pagamentos falhados",
    "needs": "Status de pagamento vem da assinatura na plataforma. O Stripe direto deixa a leitura mais precisa.",
    "triggers": [
      "Pagamento falhou",
      "Cartão perto do vencimento",
      "Prazo da régua venceu"
    ],
    "subs": [
      {
        "name": "Régua de cobrança",
        "tier": "leve",
        "does": "Define o próximo lembrete e o prazo"
      },
      {
        "name": "Redator",
        "tier": "forte",
        "does": "Lembrete educado com o link de atualização"
      }
    ],
    "auto": [],
    "aprova": [
      "Lembrete com link de atualização"
    ],
    "humano": [
      "Negociar, parcelar ou estornar"
    ],
    "limits": "O lembrete padrão pode virar automático depois de cerca de 20 aprovações sem edição.",
    "learns": "Quanto tempo depois do lembrete o pagamento volta.",
    "note": null
  },
  {
    "id": "escalonador",
    "area": "clinica",
    "ready": "parcial",
    "name": "Escalonador Técnico",
    "mission": "Transformar cada erro da clínica em tarefa clara, com passos para reproduzir.",
    "metric": "Erros abertos por semana e tempo para resolver",
    "needs": "Precisa de um lugar para a clínica relatar o erro e de uma ferramenta de tarefas para o desenvolvedor.",
    "triggers": [
      "Mensagem da clínica relatando problema",
      "Erro registrado na plataforma"
    ],
    "subs": [
      {
        "name": "Classificador",
        "tier": "leve",
        "does": "Separa bug, dúvida e pedido, e a urgência"
      },
      {
        "name": "Reprodutor",
        "tier": "forte",
        "does": "Descreve os passos para reproduzir o erro"
      },
      {
        "name": "Redator de tarefa",
        "tier": "leve",
        "does": "Abre a tarefa pronta para o desenvolvedor"
      }
    ],
    "auto": [
      "Classificar",
      "Abrir tarefa com contexto"
    ],
    "aprova": [
      "Resposta à clínica"
    ],
    "humano": [
      "Prioridade final",
      "Decidir a correção"
    ],
    "limits": "Sem acesso a conteúdo clínico de paciente. Só a descrição do erro e identificadores.",
    "learns": "Tipos de erro que se repetem.",
    "note": null
  },
  {
    "id": "relclinica",
    "area": "clinica",
    "ready": "pronto",
    "name": "Relatório da Clínica",
    "mission": "Mostrar à clínica, toda semana, o que foi resolvido e o que está em andamento.",
    "metric": "Satisfação da clínica",
    "needs": "Tarefas e correções registradas pelo Escalonador Técnico.",
    "triggers": [
      "Toda sexta-feira"
    ],
    "subs": [
      {
        "name": "Compilador",
        "tier": "leve",
        "does": "Junta o que foi resolvido e o que segue aberto"
      },
      {
        "name": "Redator",
        "tier": "forte",
        "does": "Escreve em linguagem simples, sem jargão técnico"
      }
    ],
    "auto": [
      "Compilar os dados"
    ],
    "aprova": [
      "Envio do relatório"
    ],
    "humano": [
      "Conversa de alinhamento com a clínica"
    ],
    "limits": "Não promete prazo que você não confirmou.",
    "learns": "O que a clínica mais pergunta.",
    "note": null
  },
  {
    "id": "guardiao",
    "area": "growth",
    "ready": "pronto",
    "name": "Guardião de Dados",
    "mission": "Garantir que cada número usado pelos agentes esteja certo.",
    "metric": "Campos críticos preenchidos e divergências abertas",
    "needs": "Leitura do banco da plataforma, do CRM e das assinaturas.",
    "triggers": [
      "Toda noite",
      "Cadastro novo",
      "Mudança de plano"
    ],
    "subs": [
      {
        "name": "Auditor de qualidade",
        "tier": "leve",
        "does": "Acha campo vazio, duplicata e valor impossível"
      },
      {
        "name": "Reconciliador",
        "tier": "leve",
        "does": "Cruza Stripe, plataforma e CRM e liga cada lead ao profissional certo"
      }
    ],
    "auto": [
      "Auditar e alertar"
    ],
    "aprova": [
      "Corrigir um dado",
      "Confirmar ligação entre lead e profissional"
    ],
    "humano": [
      "Qualquer alteração no banco de produção"
    ],
    "limits": "Leitura apenas no banco da plataforma.",
    "learns": "Quais erros de dado se repetem e de onde vêm.",
    "note": "Primeiros alvos: último acesso e data de fim do trial vazios na base."
  },
  {
    "id": "metricas",
    "area": "growth",
    "ready": "parcial",
    "name": "Analista de Métricas",
    "mission": "Medir o funil (cadastro, ativado, no limite, pago) e o MRR todo dia.",
    "metric": "Número confiável em cada etapa do funil",
    "needs": "O funil depende dos dados que o Guardião corrige: último acesso e fim do trial.",
    "triggers": [
      "Todo dia",
      "Toda segunda-feira"
    ],
    "subs": [
      {
        "name": "Calculador de métricas",
        "tier": "leve",
        "does": "MRR, conversão por etapa e coortes"
      },
      {
        "name": "Redator de relatório",
        "tier": "forte",
        "does": "O que mudou, por que e o que fazer"
      }
    ],
    "auto": [
      "Calcular",
      "Relatório semanal"
    ],
    "aprova": [],
    "humano": [
      "Decidir o que mudar"
    ],
    "limits": "Usa só dados validados pelo Guardião.",
    "learns": "Quais métricas você abre e quais ignora.",
    "note": null
  },
  {
    "id": "experimentos",
    "area": "growth",
    "ready": "pronto",
    "name": "Experimentos",
    "mission": "Testar uma coisa por vez e decidir: escalar ou encerrar.",
    "metric": "Testes concluídos com decisão",
    "needs": "Funil e conversão do Analista de Métricas.",
    "triggers": [
      "Hipótese aprovada",
      "Teste chegou ao tamanho mínimo"
    ],
    "subs": [
      {
        "name": "Desenhista de teste",
        "tier": "forte",
        "does": "Define hipótese, grupo, métrica e duração"
      },
      {
        "name": "Leitor de resultado",
        "tier": "forte",
        "does": "Diz se o resultado é confiável ou só ruído"
      }
    ],
    "auto": [
      "Medir os resultados"
    ],
    "aprova": [
      "Início de teste",
      "Escalar ou encerrar"
    ],
    "humano": [],
    "limits": "Um teste por etapa do funil ao mesmo tempo.",
    "learns": "O que já foi testado, para não repetir.",
    "note": "Primeiro teste: 14 dias de Essencial para quem chega com mais de 5 pacientes, contra o limite fixo."
  },
  {
    "id": "alocador",
    "area": "growth",
    "ready": "parcial",
    "name": "Alocador de Orçamento",
    "mission": "Comparar canais por custo de aquisição e retorno e propor onde pôr o dinheiro.",
    "metric": "Custo por pagante",
    "needs": "Meta já sincroniza no CRM atual. Falta Google e o custo por canal do LinkedIn.",
    "triggers": [
      "Fechamento mensal"
    ],
    "subs": [
      {
        "name": "Comparador de canal",
        "tier": "forte",
        "does": "Custo por cadastro, por ativado e por pagante em cada canal"
      }
    ],
    "auto": [
      "Comparar canais"
    ],
    "aprova": [
      "Mudança de orçamento"
    ],
    "humano": [
      "Gastos novos"
    ],
    "limits": "Sugestão: só compara canais com 30 dias de dados.",
    "learns": "Quais canais trazem pagantes que ficam.",
    "note": null
  },
  {
    "id": "prospeccao",
    "area": "aquisicao",
    "ready": "pronto",
    "name": "Prospecção de Autônomos",
    "mission": "Encontrar psicólogos no perfil certo no LinkedIn e preparar a abordagem de cada um.",
    "metric": "Cadastros ativados por semana",
    "needs": "Base de leads (Vibe Prospecting e LinkedIn). O envio é manual.",
    "triggers": [
      "Lista semanal de leads",
      "Resposta recebida no LinkedIn"
    ],
    "subs": [
      {
        "name": "Caçador de leads",
        "tier": "leve",
        "does": "Acha psicólogos pelo perfil e tira duplicados"
      },
      {
        "name": "Qualificador",
        "tier": "leve",
        "does": "Separa recém-formado de experiente e dá nota"
      },
      {
        "name": "Redator de abordagem",
        "tier": "forte",
        "does": "Uma mensagem por perfil: captar pacientes, ou ganhar tempo na gestão"
      }
    ],
    "auto": [
      "Pesquisar e pontuar leads"
    ],
    "aprova": [
      "Primeira mensagem",
      "Follow-up",
      "Convite para o cadastro"
    ],
    "humano": [
      "Enviar no LinkedIn"
    ],
    "limits": "Só passa para o WhatsApp depois que a pessoa pedir contato e aceitar. Sem abordagem fria por WhatsApp.",
    "learns": "Taxa de resposta por versão de mensagem e por perfil.",
    "note": null
  },
  {
    "id": "conteudo",
    "area": "aquisicao",
    "ready": "pronto",
    "name": "Conteúdo e Social",
    "mission": "Atrair psicólogos com conteúdo sobre captar pacientes e organizar o consultório.",
    "metric": "Cadastros vindos do Instagram",
    "needs": "Instagram sincronizado no CRM e as skills de conteúdo que você já tem.",
    "triggers": [
      "Calendário semanal",
      "Post com desempenho acima da média"
    ],
    "subs": [
      {
        "name": "Estrategista de pautas",
        "tier": "forte",
        "does": "Escolhe temas a partir do que performou"
      },
      {
        "name": "Produtor",
        "tier": "forte",
        "does": "Carrossel, roteiro de reel e legenda"
      },
      {
        "name": "Moderador",
        "tier": "leve",
        "does": "Responde comentários simples e separa quem é lead"
      }
    ],
    "auto": [
      "Planejar pautas"
    ],
    "aprova": [
      "Peça pronta",
      "Resposta a comentário e DM"
    ],
    "humano": [
      "Publicar"
    ],
    "limits": "Passa pelo Revisor de conformidade antes de chegar na sua fila.",
    "learns": "Formato e tema que mais trazem cadastro.",
    "note": "Já existe em parte nas skills synapsa-carrossel e synapsa-conteudo."
  },
  {
    "id": "indicacao",
    "area": "aquisicao",
    "ready": "pronto",
    "name": "Indicação",
    "mission": "Fazer pagantes e ativos satisfeitos trazerem colegas.",
    "metric": "Cadastros por indicação",
    "needs": "Uso e satisfação dos pagantes e ativados.",
    "triggers": [
      "Pagante ou ativo satisfeito",
      "Marco atingido, como o 10º paciente"
    ],
    "subs": [
      {
        "name": "Detector de promotor",
        "tier": "leve",
        "does": "Acha quem está satisfeito e usando"
      },
      {
        "name": "Redator de convite",
        "tier": "forte",
        "does": "Pede a indicação com um texto pronto para encaminhar"
      }
    ],
    "auto": [],
    "aprova": [
      "Pedido de indicação"
    ],
    "humano": [
      "Qualquer benefício ou recompensa"
    ],
    "limits": "Pede no máximo uma vez a cada 60 dias.",
    "learns": "Quem indica de fato e depois de quais marcos.",
    "note": null
  },
  {
    "id": "midia",
    "area": "aquisicao",
    "ready": "parcial",
    "name": "Mídia Paga",
    "mission": "Ler Meta e Google todo dia e cortar gasto sem retorno.",
    "metric": "Custo por cadastro ativado",
    "needs": "Meta sincroniza no CRM atual. Google Ads ainda não.",
    "triggers": [
      "Todo dia de manhã",
      "Gasto acima do teto sem cadastro"
    ],
    "subs": [
      {
        "name": "Analista de campanha",
        "tier": "leve",
        "does": "Gasto, cliques e cadastros por anúncio"
      },
      {
        "name": "Criativo de anúncio",
        "tier": "forte",
        "does": "Texto e imagem de novos testes"
      },
      {
        "name": "Otimizador de orçamento",
        "tier": "forte",
        "does": "Propõe pausar, escalar ou testar"
      }
    ],
    "auto": [
      "Ler as métricas"
    ],
    "aprova": [
      "Pausar",
      "Escalar",
      "Novo criativo"
    ],
    "humano": [
      "Aumentar o teto de gasto"
    ],
    "limits": "Teto diário de gasto definido por você.",
    "learns": "Criativos que baixam o custo por cadastro.",
    "note": "Meta Ads e Instagram já sincronizam no CRM atual."
  },
  {
    "id": "inteligencia",
    "area": "aquisicao",
    "ready": "pronto",
    "name": "Inteligência de Mercado",
    "mission": "Acompanhar concorrentes, tendências e busca para sugerir ângulos de mensagem.",
    "metric": "Ângulos novos aprovados por mês",
    "needs": "Fontes públicas da web.",
    "triggers": [
      "Toda semana",
      "Mudança relevante em concorrente"
    ],
    "subs": [
      {
        "name": "Radar de concorrência",
        "tier": "leve",
        "does": "Preço, recurso e mensagem dos concorrentes"
      },
      {
        "name": "Analista de SEO",
        "tier": "forte",
        "does": "Termos que psicólogos buscam e lacunas de conteúdo"
      }
    ],
    "auto": [
      "Monitorar e resumir"
    ],
    "aprova": [
      "Novo ângulo de mensagem"
    ],
    "humano": [],
    "limits": "Só fontes públicas.",
    "learns": "Quais ângulos viraram conteúdo que funcionou.",
    "note": null
  },
  {
    "id": "descoberta",
    "area": "produto",
    "ready": "pronto",
    "name": "Descoberta",
    "mission": "Juntar feedback, reclamações e uso, e ordenar o que construir por impacto em R$.",
    "metric": "Itens priorizados que viram entrega",
    "needs": "Feedback do Sucesso, tarefas da clínica e uso da plataforma.",
    "triggers": [
      "Feedback novo",
      "Fechamento semanal"
    ],
    "subs": [
      {
        "name": "Agrupador",
        "tier": "leve",
        "does": "Junta pedidos parecidos num tema"
      },
      {
        "name": "Priorizador",
        "tier": "forte",
        "does": "Ordena por retenção e receita em risco"
      }
    ],
    "auto": [
      "Agrupar",
      "Priorizar"
    ],
    "aprova": [
      "Item entra no backlog"
    ],
    "humano": [
      "Decisão final do que construir"
    ],
    "limits": "Financeiro e estabilidade da clínica entram na frente de recurso novo.",
    "learns": "Quais itens entregues de fato melhoraram a retenção.",
    "note": null
  },
  {
    "id": "especificacao",
    "area": "produto",
    "ready": "pronto",
    "name": "Especificação",
    "mission": "Escrever a spec de cada item priorizado, com critério de aceite e rascunho de tela.",
    "metric": "Specs aprovadas e entregues",
    "needs": "Backlog priorizado pela Descoberta.",
    "triggers": [
      "Item aprovado no backlog"
    ],
    "subs": [
      {
        "name": "Redator de spec",
        "tier": "forte",
        "does": "Problema, solução e critério de aceite"
      },
      {
        "name": "Prototipador",
        "tier": "forte",
        "does": "Rascunho de tela para validar rápido"
      }
    ],
    "auto": [],
    "aprova": [
      "Spec",
      "Rascunho de tela"
    ],
    "humano": [
      "Prazo e escopo"
    ],
    "limits": "Uma spec por vez.",
    "learns": "Onde você costuma cortar escopo.",
    "note": null
  },
  {
    "id": "uso",
    "area": "produto",
    "ready": "nova",
    "name": "Analista de Uso",
    "mission": "Mostrar onde o usuário trava dentro do produto e quais recursos ele usa.",
    "metric": "Etapas do produto com queda identificada",
    "needs": "Exige que a plataforma emita eventos de uso: perfil publicado, paciente criado, recurso bloqueado.",
    "triggers": [
      "Toda semana"
    ],
    "subs": [
      {
        "name": "Analista de funil",
        "tier": "leve",
        "does": "Em que passo as pessoas desistem"
      },
      {
        "name": "Analista de recurso",
        "tier": "leve",
        "does": "O que é usado, por quem e com que frequência"
      }
    ],
    "auto": [
      "Analisar"
    ],
    "aprova": [
      "Hipótese de melhoria enviada ao Produto"
    ],
    "humano": [],
    "limits": "Só dados agregados por profissional. Nada de conteúdo de paciente.",
    "learns": "Quais hipóteses viraram melhoria real.",
    "note": "Depende de a plataforma registrar eventos de uso."
  },
  {
    "id": "lancamento",
    "area": "produto",
    "ready": "pronto",
    "name": "Lançamento",
    "mission": "Comunicar cada novidade ao cliente com changelog e tutorial.",
    "metric": "Recursos novos que os clientes de fato usam",
    "needs": "Entregas e tarefas concluídas.",
    "triggers": [
      "Entrega publicada"
    ],
    "subs": [
      {
        "name": "Redator de changelog",
        "tier": "forte",
        "does": "O que mudou, na linguagem do psicólogo"
      },
      {
        "name": "Criador de tutorial",
        "tier": "forte",
        "does": "Passo a passo curto"
      }
    ],
    "auto": [],
    "aprova": [
      "Changelog",
      "Tutorial",
      "Aviso aos clientes"
    ],
    "humano": [
      "Publicar"
    ],
    "limits": "Passa pelo Revisor de conformidade.",
    "learns": "Quais avisos geram uso.",
    "note": null
  },
  {
    "id": "financeiro",
    "area": "financeiro",
    "ready": "parcial",
    "name": "Financeiro",
    "mission": "Acompanhar o caminho até R$ 1.200 e o custo de cada usuário gratuito.",
    "metric": "MRR e margem",
    "needs": "Assinaturas vêm da plataforma. Faltam Stripe e extrato bancário.",
    "triggers": [
      "Todo dia",
      "Fechamento mensal"
    ],
    "subs": [
      {
        "name": "Ponte do MRR",
        "tier": "forte",
        "does": "Mostra quanto falta e de onde vai vir"
      },
      {
        "name": "Controlador de custo",
        "tier": "leve",
        "does": "Custo de IA e infraestrutura por agente e por usuário"
      },
      {
        "name": "Conciliador",
        "tier": "leve",
        "does": "Cruza Stripe, plataforma e banco"
      }
    ],
    "auto": [
      "Calcular",
      "Conciliar"
    ],
    "aprova": [],
    "humano": [
      "Qualquer pagamento",
      "Mudança de preço"
    ],
    "limits": "Somente leitura.",
    "learns": "Quais custos crescem mais rápido que a receita.",
    "note": null
  },
  {
    "id": "compliance",
    "area": "financeiro",
    "ready": "pronto",
    "name": "Conformidade e LGPD",
    "mission": "Revisar tudo que sai antes de chegar na sua fila e vigiar o que cada agente acessa.",
    "metric": "Propostas com problema barradas antes de chegar a você",
    "needs": "Toda proposta de mensagem e conteúdo, mais o registro de acessos.",
    "triggers": [
      "Toda proposta de mensagem ou conteúdo",
      "Um agente pediu acesso novo"
    ],
    "subs": [
      {
        "name": "Revisor de conformidade",
        "tier": "forte",
        "does": "Promessa indevida, publicidade em psicologia e tom"
      },
      {
        "name": "Guardião de consentimento",
        "tier": "leve",
        "does": "Confere o aceite de contato por WhatsApp"
      },
      {
        "name": "Auditor de acesso",
        "tier": "leve",
        "does": "Garante que nenhum agente toca dado clínico de paciente"
      }
    ],
    "auto": [
      "Bloquear ou sinalizar"
    ],
    "aprova": [
      "Mudança de política de dados"
    ],
    "humano": [
      "Liberar uma exceção"
    ],
    "limits": "Filtro obrigatório: nenhuma mensagem externa chega na fila sem passar por ele.",
    "learns": "Regras novas que você pedir viram checagem permanente.",
    "note": null
  },
  {
    "id": "sdr",
    "area": "comercial",
    "ready": "parcial",
    "name": "SDR",
    "mission": "Conduzir a conversa de venda de clínicas e de planos maiores.",
    "metric": "Reuniões realizadas",
    "needs": "Conversas ficam no CRM. WhatsApp oficial só quando o volume justificar.",
    "triggers": [
      "Resposta de lead",
      "Reunião sem comparecimento"
    ],
    "subs": [
      {
        "name": "Pesquisador de lead",
        "tier": "leve",
        "does": "Dossiê curto antes do contato"
      },
      {
        "name": "Respondedor",
        "tier": "forte",
        "does": "Sugere a resposta no WhatsApp"
      },
      {
        "name": "Tratador de objeções",
        "tier": "forte",
        "does": "Usa o playbook para cada objeção"
      },
      {
        "name": "Agendador",
        "tier": "leve",
        "does": "Propõe horários e lembra da reunião"
      }
    ],
    "auto": [],
    "aprova": [
      "Resposta a lead",
      "Convite de reunião"
    ],
    "humano": [
      "Preço, objeção e negociação"
    ],
    "limits": "Não prospecta clínica nova até a atual estabilizar. Atende quem já chegou.",
    "learns": "Objeções mais comuns e as respostas que funcionaram.",
    "note": null
  },
  {
    "id": "closer",
    "area": "comercial",
    "ready": "pronto",
    "name": "Closer Assist",
    "mission": "Preparar cada reunião e fechar o que ficou aberto depois dela.",
    "metric": "Fechamentos",
    "needs": "Agenda, reuniões e transcrições do CRM atual.",
    "triggers": [
      "Reunião marcada",
      "Reunião concluída"
    ],
    "subs": [
      {
        "name": "Preparador",
        "tier": "forte",
        "does": "Dossiê de uma página antes da reunião"
      },
      {
        "name": "Analista de reunião",
        "tier": "forte",
        "does": "Resumo, objeções e próximo passo a partir da transcrição"
      },
      {
        "name": "Montador de proposta",
        "tier": "forte",
        "does": "Proposta de plano com base no que a pessoa disse"
      }
    ],
    "auto": [
      "Dossiê",
      "Resumo da reunião"
    ],
    "aprova": [
      "Proposta",
      "Follow-up"
    ],
    "humano": [
      "Condições comerciais"
    ],
    "limits": "Prepara e resume. Não abre venda de clínica nova até a atual estabilizar.",
    "learns": "O que as reuniões que fecharam tinham em comum.",
    "note": "O CRM atual já tem agenda e análise de reunião com IA."
  }
];
