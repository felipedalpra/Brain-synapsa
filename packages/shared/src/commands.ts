// Tarefas prontas por agente. Um clique manda a tarefa com os valores padrão; "Ajustar" abre os campos.
// Os campos entram no texto no lugar de {0}, {1}.

export interface Campo {
  label: string;
  /** Valor usado quando você clica direto, sem ajustar. */
  padrao: string;
  placeholder?: string;
  /** Lista fechada de opções (vira um seletor). */
  opcoes?: string[];
  /** Só aceita link https. */
  https?: boolean;
  /** Pode ficar vazio. */
  opcional?: boolean;
}

export interface Comando {
  id: string;
  agentId: string;
  label: string;
  hint: string;
  task: string;
  campos?: Campo[];
  /** Pesquisa na web custa mais. */
  web?: boolean;
}

const CONTEXTO = "Contexto fixo: a Synapsa é uma plataforma de IA para psicólogos autônomos e clínicas no Brasil. Plano grátis até 5 pacientes; Essencial a R$ 79 (R$ 119 de tabela). A Lyra é a assistente que acompanha o paciente entre as sessões. Quem assina os textos é o Felipe Dalpra, fundador da Synapsa, que não é psicólogo. Meta: R$ 1.200 de MRR até 31/12/2026.";
const REGRAS = "Regras: nunca ofereça desconto, nunca prometa resultado clínico, nunca cite paciente. Texto escrito em meu nome não finge que sou psicólogo, não inventa experiência em comum, nem diz que vi o perfil ou o trabalho da pessoa. Use consultar_dados antes de afirmar qualquer número do negócio e diga a fonte. Se faltar dado, diga o que falta e como obter.";
const ENTREGA = "Entregue pelo relatorio: \"resumo\" com 1 ou 2 frases e \"entrega\" com o documento completo, pronto para usar (títulos curtos, listas, números com a fonte).";
const PROXIMAS = "Termine com \"Próximas 3 ações\" por impacto em R$.";
const PROPOR = "Texto que vai sair para alguém: deixe na fila com a ferramenta propor (texto_pronto). Nada sai sem o meu OK.";
const QTD = (n: string, ...mais: string[]): Campo => ({ label: "Quantidade", padrao: n, opcoes: [n, ...mais] });

const c = (agentId: string, id: string, label: string, hint: string, task: string, campos?: Campo[], web = false): Comando => ({
  id: `${agentId}:${id}`,
  agentId,
  label,
  hint,
  task: `${task}\n\n${CONTEXTO}\n${REGRAS}\n${ENTREGA}${task.includes("Próximas 3 ações") ? "" : ` ${PROXIMAS}`}`,
  campos,
  web,
});

export const COMANDOS: Comando[] = [
  // ---------------- Estratégia: Chief ----------------
  c("chief", "briefing", "Briefing de agora", "MRR, o que mudou e o que depende de você.", "Monte o briefing de agora: MRR e variação, o que mudou desde ontem, o que travou e as decisões que dependem de mim, ordenadas por impacto em reais. Máximo de 15 linhas."),
  c("chief", "semana", "Plano da semana", "3 apostas ligadas à meta.", "Monte o plano da semana: no máximo 3 apostas que mais aproximam o MRR da meta, cada uma com dono (agente), entrega, número-alvo e como medir na sexta."),
  c("chief", "sexta", "Fechamento da semana", "O que andou, o que não andou.", "Faça o fechamento da semana: o que cada time entregou, o que ficou parado e por quê, o que repetir e o que cortar na próxima semana."),
  c("chief", "risco", "Onde estou perdendo dinheiro", "Vazamentos de receita e de tempo.", "Procure onde a Synapsa está perdendo receita ou tempo agora (cancelamentos, descontos acabando, cadastros parados, anúncio sem retorno) e ordene por R$."),

  // ---------------- Marketing ----------------
  c("conteudo", "post", "Gerar post pronto", "Legenda e ideia de imagem na fila.", "Crie 1 post de Instagram para psicólogos autônomos. Tema: {0}. Veja os posts recentes (consultar_dados instagram) para não repetir e seguir o que engajou. Entregue gancho, legenda (até 900 caracteres), 5 hashtags e a ideia da imagem. {1} " + PROPOR + " Se eu informar o link https da imagem, use imagem_url na proposta com canal instagram para eu aprovar e publicar. Link da imagem: {2}.", [
    { label: "Tema", padrao: "o tema que o perfil ainda não cobriu e que mais atrai psicólogo autônomo", placeholder: "ex.: como cobrar a sessão sem constrangimento" },
    { label: "Formato", padrao: "imagem única", opcoes: ["imagem única", "carrossel", "reels"] },
    { label: "Link https da imagem (para publicar)", padrao: "", opcional: true, https: true, placeholder: "opcional" },
  ]),
  c("conteudo", "ideias", "Ideias de post", "Lista de temas com gancho.", "Liste {0} ideias de post para psicólogos autônomos, cada uma com gancho de 1 linha, formato sugerido e a dor do psicólogo que ela toca. Evite o que já foi postado (consultar_dados instagram).", [QTD("10", "5", "20")]),
  c("conteudo", "criativo", "Briefing do criativo", "Conceito, texto na arte e prompt de imagem.", "Faça o briefing de um criativo de {0} sobre: {1}. Entregue conceito visual, texto exato que vai na arte (curto), formato em pixels, paleta (roxo e azul da Synapsa, estilo Lyra: bichinhos arredondados, contorno azul-marinho), e um prompt de imagem pronto para colar no gerador. Não invente depoimento nem número.", [
    { label: "Peça", padrao: "post de feed", opcoes: ["post de feed", "story", "anúncio de captação", "capa de carrossel"] },
    { label: "Assunto", padrao: "criar o perfil na Synapsa e começar com 5 pacientes grátis", placeholder: "o que o criativo comunica" },
  ]),
  c("conteudo", "carrossel", "Carrossel completo", "Texto de cada slide.", "Escreva um carrossel de {0} slides sobre: {1}. Slide 1 é gancho, o último é chamada para ação sem pressão. Dê o texto de cada slide (máx. 25 palavras) e a legenda. " + PROPOR, [
    { label: "Slides", padrao: "8", opcoes: ["6", "8", "10"] },
    { label: "Assunto", padrao: "um erro comum de quem começa a atender e como evitar", placeholder: "tema do carrossel" },
  ]),
  c("conteudo", "reels", "Roteiro de reels", "Fala, cenas e legenda.", "Escreva o roteiro de um reels de 30 a 40 segundos sobre: {0}. Gancho nos 3 primeiros segundos, fala palavra por palavra, o que aparece na tela, texto na tela e legenda.", [{ label: "Assunto", padrao: "como a Lyra acompanha o paciente entre as sessões sem tomar o lugar do psicólogo", placeholder: "tema do reels" }]),
  c("conteudo", "semana", "Calendário da semana", "5 posts planejados.", "Planeje 5 posts para a semana (dia, formato, tema, gancho e legenda curta), baseados no que já funcionou no perfil. Misture dor, prova de uso real (sem citar paciente) e produto."),
  c("conteudo", "analise", "Como está o Instagram", "Seguidores, alcance e o que funcionou.", "Analise o Instagram @synapsa.ai: seguidores e crescimento, alcance, os posts que mais engajaram e o que repetir ou cortar nas próximas duas semanas."),

  c("prospeccao", "lote", "Lote de mensagens de LinkedIn", "Mensagens prontas para você enviar hoje.", "Prepare o lote do dia de {0} mensagens de LinkedIn para psicólogos autônomos, divididas por perfil (recém-formado, consultório próprio, atende online, clínica pequena). Para cada uma: nota de conexão de até 200 caracteres e a primeira mensagem de até 400. Tom de colega, uma pergunta só, sem vender na primeira. Não use nomes de pessoas (não há lista): deixe [Nome] onde entra o nome. Entregue pelo relatorio, não pela fila. Lembre no fim o limite seguro de convites por dia (cerca de 20) e que o envio é manual pelo meu perfil.", [QTD("10", "5", "20")]),
  c("prospeccao", "followup", "Follow-ups", "Sequência para quem não respondeu.", "Escreva a sequência de follow-up para quem aceitou a conexão e não respondeu: mensagem do dia 3, do dia 7 e a de encerramento educado. Curtas, sem pressão, cada uma com um motivo novo para responder."),
  c("prospeccao", "perfil", "Meu perfil de LinkedIn", "Ajustes que aumentam aceite.", "Revise o que o meu perfil de LinkedIn precisa ter para quem é psicólogo aceitar e responder: título, sobre, destaque e post fixado. Entregue o texto sugerido de cada parte.", undefined, true),
  c("prospeccao", "icp", "Quem abordar primeiro", "Perfil ideal e onde achar.", "Defina o perfil ideal de psicólogo autônomo para a Synapsa abordar primeiro (tempo de carreira, como capta, sinais de dor) e os 5 lugares onde achar esse perfil (grupos, eventos, hashtags). Sem lista de pessoas.", undefined, true),
  c("prospeccao", "resposta", "Responder um lead", "Resposta para o que ele escreveu.", "Escreva a resposta para esta mensagem de um psicólogo no LinkedIn, no meu tom, sem vender de cara e sem desconto:\n{0}", [{ label: "Mensagem recebida", padrao: "", placeholder: "cole o que a pessoa respondeu" }]),

  c("indicacao", "convite", "Convite de indicação", "Texto para os clientes atuais.", "Escreva o convite para os clientes atuais indicarem colegas: sem desconto, com um benefício que não seja dinheiro (ex.: prioridade em novidades). Duas versões, WhatsApp e e-mail. " + PROPOR),
  c("indicacao", "programa", "Desenhar o programa", "Regras, ganho e como medir.", "Desenhe o programa de indicação: quem pode indicar, o que a pessoa ganha (sem desconto), como registrar a indicação, como medir e a meta de indicações por mês."),
  c("indicacao", "mensagem", "Mensagem para o indicado", "Texto que o cliente repassa.", "Escreva o texto curto que o cliente atual pode encaminhar ao colega, em primeira pessoa, natural, com o link do cadastro grátis."),

  c("midia", "metricas", "Métricas do Meta Ads", "Gasto, cliques, leads e custo por lead.", "Leia o Meta Ads dos últimos {0} e mostre gasto, cliques, leads, custo por lead e campanhas sem retorno. Se a conta estiver parada, diga e recomende se vale voltar.", [{ label: "Período", padrao: "30 dias", opcoes: ["7 dias", "30 dias"] }]),
  c("midia", "campanha", "Montar teste de campanha", "Oferta, público e orçamento de teste.", "Proponha um teste de campanha no Meta para captar cadastros de psicólogos autônomos com orçamento de teste de {0} reais: oferta, público, 3 criativos (texto de cada), teto diário, regra de parar e o que decide escalar. Sem prometer resultado. O que for estimativa, marque.", [{ label: "Orçamento de teste (R$)", padrao: "300", opcoes: ["150", "300", "600", "1000"] }]),
  c("midia", "copy", "Textos de anúncio", "Variações para testar.", "Escreva {0} variações de texto de anúncio para psicólogos autônomos (título de até 40 caracteres, texto principal de até 125), cada uma com um ângulo diferente (tempo, organização, acompanhamento do paciente, plano grátis). Respeite as regras de propaganda do CFP.", [QTD("6", "3", "10")]),
  c("midia", "corte", "O que cortar", "Gasto sem retorno.", "Veja o gasto por campanha e diga o que cortar ou pausar agora e o que manter, com o número que justifica."),

  c("inteligencia", "concorrentes", "Mapa de concorrentes", "Preço, plano grátis e posicionamento.", "Pesquise na web {0} concorrentes da Synapsa para psicólogos no Brasil: preço, plano grátis, posicionamento, o que prometem e que ângulo de mensagem está livre. Cite a fonte de cada fato.", [QTD("5", "3", "8")], true),
  c("inteligencia", "demanda", "O que psicólogos procuram", "Dores e termos de busca.", "Pesquise na web as dúvidas e dores de psicólogos autônomos sobre captar pacientes, organizar consultório e IA, e transforme em 8 temas de conteúdo, cada um com a dor e o termo que a pessoa busca.", undefined, true),
  c("inteligencia", "tendencias", "Tendências do setor", "O que mudou no mercado.", "Pesquise na web o que mudou nos últimos meses em IA e tecnologia para psicologia no Brasil (regras do CFP, concorrentes novos, comportamento do psicólogo) e diga o que isso muda para a Synapsa.", undefined, true),
  c("inteligencia", "ads", "Anúncios dos concorrentes", "Ângulos que eles usam.", "Pesquise na web como os concorrentes anunciam para psicólogos (ângulos, ofertas, tom) e traga 5 ângulos que a Synapsa pode usar e 2 que deve evitar.", undefined, true),

  // ---------------- Comercial ----------------
  c("ativacao", "parados", "Cadastros parados", "Onde o cadastro trava.", "Veja o funil e liste onde os cadastros travam (cadastro, perfil publicado, primeiro paciente). Escreva a mensagem de ativação para cada ponto, curta e útil. " + PROPOR),
  c("ativacao", "boasvindas", "Sequência de boas-vindas", "3 mensagens para o primeiro dia.", "Escreva a sequência de boas-vindas de 3 mensagens (hora 0, dia 1, dia 3) que leva o psicólogo ao perfil publicado e ao primeiro paciente. Canal: e-mail e WhatsApp, versão de cada."),
  c("ativacao", "checklist", "Checklist de ativação", "Passo a passo dentro do produto.", "Monte o checklist de ativação do psicólogo (5 passos no máximo), com o motivo de cada passo e como saber que ele concluiu."),
  c("pagar", "limite", "Convite no limite de 5", "Texto para quem chegou ao limite.", "Escreva o convite ao Essencial (R$ 79) para quem chega no limite de 5 pacientes: sem desconto, focado em tempo e organização, uma chamada só. WhatsApp e e-mail. " + PROPOR),
  c("pagar", "objecoes", "Objeções ao pagar", "Respostas prontas.", "Liste as 6 objeções mais prováveis ao assinar o Essencial (preço, 'já uso outra coisa', 'não preciso agora') e a resposta honesta de cada uma, sem desconto."),
  c("pagar", "pagina", "Texto da página de planos", "Grátis vs Essencial.", "Escreva o texto da comparação entre o plano grátis e o Essencial: o que muda, para quem serve cada um, sem exagero."),
  c("sdr", "roteiro", "Roteiro de conversa", "Conversa de venda para clínica.", "Monte o roteiro da conversa de venda para clínicas: abertura, 8 perguntas de descoberta, objeções e próximo passo. Sem prospecção ativa até a clínica atual estabilizar."),
  c("sdr", "whats", "Mensagens de WhatsApp", "Primeira abordagem e retomada.", "Escreva 3 mensagens de WhatsApp para retomar contato com quem já conversou e sumiu, cada uma com um motivo novo de contato. Sem desconto. " + PROPOR),
  c("sdr", "qualificar", "Perguntas de qualificação", "Quem vale a reunião.", "Monte as 6 perguntas para saber se uma clínica vale uma reunião (tamanho, sistema atual, quem decide, dor) e a regra de quando descartar."),
  c("closer", "reuniao", "Preparar reunião", "Contexto e perguntas.", "Prepare a reunião com {0}: contexto, perguntas de descoberta, objeções prováveis e o próximo passo a pedir.", [{ label: "Com quem", padrao: "a próxima reunião da minha agenda", placeholder: "nome da clínica ou psicólogo" }]),
  c("closer", "ata", "Resumo pós-reunião", "O que ficou combinado.", "Transforme estas anotações em resumo da reunião, decisões, pendências com dono e a mensagem de acompanhamento:\n{0}", [{ label: "Anotações", padrao: "", placeholder: "cole o que anotou" }]),
  c("closer", "proposta", "Proposta comercial", "Documento para a clínica.", "Escreva a proposta comercial para {0}: problema, solução, plano, preço de tabela (sem desconto), prazo de implantação e próximos passos.", [{ label: "Cliente", padrao: "uma clínica pequena (3 a 5 psicólogos)", placeholder: "nome ou perfil" }]),
  c("closer", "fechar", "Fechar o que ficou aberto", "Quem está esperando resposta.", "Liste as conversas abertas que dependem de mim, o que falta para cada uma fechar e a mensagem de retomada. " + PROPOR),

  // ---------------- Estratégia ----------------
  c("financeiro", "meta", "Conta da meta", "Quantos clientes faltam e cenários.", "Calcule quantos Essenciais a R$ 79 faltam para a meta, quantos por semana até 31/12, o efeito dos fins de desconto e 3 cenários (conservador, base, agressivo) com a premissa de cada um."),
  c("financeiro", "custo", "Custo do usuário grátis", "Quanto cada cadastro custa.", "Estime o custo mensal de cada usuário gratuito (IA, infraestrutura) e quantos grátis o caixa aguenta por pagante. Marque o que é estimativa e o que dado falta."),
  c("financeiro", "caixa", "Fluxo dos próximos 90 dias", "Entradas, descontos acabando e custos.", "Projete as entradas dos próximos 90 dias com base em Stripe e Pix informados, incluindo os fins de desconto, e liste os custos fixos conhecidos."),
  c("alocador", "orcamento", "Propor orçamento", "Onde pôr o dinheiro, com teto.", "Proponha o orçamento mensal de aquisição de {0} reais: quanto em cada canal (anúncio, conteúdo, ferramenta), custo por cadastro estimado, quando parar e o que cada real precisa render. Marque o que é estimativa.", [{ label: "Orçamento do mês (R$)", padrao: "500", opcoes: ["300", "500", "1000", "2000"] }]),
  c("alocador", "estrategia", "Propor estratégia", "Canal mais barato para a meta.", "Proponha a estratégia de aquisição até 31/12: quantos cadastros, ativações e pagantes são necessários com taxas realistas (marque como estimativa) e que canal entrega isso ao menor custo."),
  c("alocador", "canais", "Comparar canais", "Custo por cadastro de cada um.", "Compare LinkedIn, Instagram, indicação e anúncio pago por custo por cadastro e por esforço, com o dado real quando existir e estimativa marcada quando não."),
  c("metricas", "funil", "Funil de hoje", "Cadastro, ativado, no limite, pago.", "Mostre o funil e o MRR de hoje, o que mudou na semana e onde está o gargalo."),
  c("metricas", "semana", "Relatório semanal", "Números que importam.", "Monte o relatório semanal: MRR, clientes, Instagram, anúncios e funil, cada número com a fonte e a variação contra a semana anterior."),
  c("metricas", "meta", "Estou no ritmo?", "Compara com o que falta.", "Compare o ritmo atual de MRR com o necessário para chegar na meta e diga, com número, se estou adiantado ou atrasado."),
  c("experimentos", "teste", "Desenhar um teste", "Uma hipótese, uma métrica.", "Desenhe 1 experimento para subir {0}: hipótese, o que muda, métrica, tamanho mínimo, duração e a regra de decidir (escalar ou encerrar).", [{ label: "Objetivo", padrao: "ativação dos cadastros", opcoes: ["ativação dos cadastros", "conversão para o Essencial", "resposta no LinkedIn", "cliques no anúncio"] }]),
  c("experimentos", "ideias", "Backlog de testes", "10 testes ordenados.", "Liste 10 experimentos possíveis, ordenados por impacto esperado dividido por esforço, cada um com a métrica."),
  c("experimentos", "resultado", "Ler o resultado de um teste", "Escalar ou encerrar.", "Leia o resultado deste teste e diga se escala ou encerra, com o motivo estatístico em linguagem simples:\n{0}", [{ label: "Dados do teste", padrao: "", placeholder: "cole os números" }]),
  c("compliance", "revisar", "Revisar um texto", "Checa LGPD, CFP e promessas.", "Revise o texto a seguir quanto a LGPD, ética do CFP, promessa de resultado, desconto e uso de dado de paciente, e devolva a versão corrigida com o que mudou:\n{0}", [{ label: "Texto", padrao: "", placeholder: "cole a mensagem ou o post" }]),
  c("compliance", "auditoria", "Auditar o que saiu", "Mensagens e acessos recentes.", "Audite as propostas e envios dos últimos 7 dias contra as regras (consentimento, intervalo entre contatos, desconto, dado de paciente) e liste qualquer desvio."),
  c("compliance", "lgpd", "Checklist de LGPD", "O que falta para estar em dia.", "Monte o checklist de LGPD da Synapsa para o que ela faz hoje (cadastro de psicólogo, dados do paciente na plataforma, e-mails e anúncios) e marque o que sei que está feito e o que falta confirmar."),
  c("guardiao", "dados", "Conferir os números", "Stripe, Pix e MRR batem?", "Confira se MRR, clientes e descontos batem entre Stripe e o que foi informado, e aponte qualquer divergência."),
  c("guardiao", "acessos", "O que cada agente acessa", "Fontes e permissões.", "Liste a que fontes de dado cada agente tem acesso hoje e se alguma permissão é maior do que o necessário."),

  // ---------------- Produto ----------------
  c("descoberta", "backlog", "O que construir agora", "Backlog por impacto em R$.", "Ordene o que construir agora por impacto em R$, com o motivo de cada item e o que fica de fora. Máximo de 7 itens."),
  c("descoberta", "feedback", "Resumo do feedback", "O que os clientes pedem.", "Junte o feedback e as reclamações conhecidos em temas, com quantas vezes aparecem e o que fazer com cada um."),
  c("descoberta", "lyra", "Ideias para a Lyra", "Melhorias que aumentam retenção.", "Proponha 5 melhorias na Lyra que aumentem o uso do paciente entre sessões e, com isso, a retenção do psicólogo, cada uma com esforço e o que medir."),
  c("especificacao", "spec", "Escrever uma spec", "Critério de aceite incluso.", "Escreva a spec de: {0}. Problema, solução, fluxo, critérios de aceite, o que fica fora, riscos e como medir.", [{ label: "Funcionalidade", padrao: "o item de maior prioridade do backlog", placeholder: "ex.: lembrete de sessão pela Lyra" }]),
  c("especificacao", "texto", "Textos da interface", "Mensagens e vazios do produto.", "Escreva os textos de interface (botões, estados vazios, erros) para: {0}. Português claro, voz ativa, sem jargão.", [{ label: "Tela", padrao: "o primeiro acesso do psicólogo", placeholder: "qual tela" }]),
  c("uso", "travas", "Onde o usuário trava", "Uso dentro do produto.", "Mostre onde o usuário trava dentro do produto e quais recursos usa, o que dá para saber hoje e o que falta instrumentar."),
  c("uso", "eventos", "Eventos a instrumentar", "O que medir primeiro.", "Liste os 10 eventos que a plataforma precisa registrar para medir ativação e retenção, com nome, quando dispara e o que responde."),
  c("lancamento", "novidade", "Comunicar novidade", "Changelog e e-mail.", "Escreva o changelog e o e-mail curto para clientes sobre: {0}. " + PROPOR, [{ label: "Novidade", padrao: "", placeholder: "o que mudou no produto" }]),
  c("lancamento", "tutorial", "Tutorial passo a passo", "Para o cliente seguir.", "Escreva o tutorial passo a passo de: {0}, com no máximo 6 passos e o resultado esperado de cada um.", [{ label: "Recurso", padrao: "criar e publicar o perfil", placeholder: "qual recurso" }]),
  c("lancamento", "post", "Post de lançamento", "Instagram e LinkedIn.", "Escreva o post de lançamento de: {0}, uma versão para Instagram e uma para LinkedIn. " + PROPOR, [{ label: "Novidade", padrao: "", placeholder: "o que lançou" }]),

  // ---------------- Sucesso ----------------
  c("saude", "contas", "Saúde das contas", "Quem corre risco de cancelar.", "Veja a saúde das contas pagantes e diga quem corre risco de cancelar e a ação para cada uma. " + PROPOR),
  c("saude", "checkin", "Check-in com pagantes", "Mensagem de acompanhamento.", "Escreva a mensagem de check-in para pagantes (30 dias de uso): pergunta de uma linha sobre o que está funcionando e o que falta. " + PROPOR),
  c("saude", "nps", "Pesquisa de satisfação", "Perguntas curtas.", "Monte a pesquisa de satisfação de 3 perguntas para os pagantes e como ler a resposta de cada uma."),
  c("cobranca", "falhas", "Pagamentos que falharam", "Mensagem de recuperação.", "Veja pagamentos falhos no Stripe e escreva a mensagem de recuperação, cordial e sem pressão, com o link para atualizar o cartão. " + PROPOR),
  c("cobranca", "desconto", "Aviso de fim de desconto", "Contato 30 dias antes.", "Prepare o aviso para as contas cujo desconto acaba nos próximos 60 dias: o que muda, quando, e o valor novo, com transparência. Sem oferecer desconto. " + PROPOR),
  c("cobranca", "cancelamento", "Resposta a pedido de cancelamento", "Saída respeitosa.", "Escreva a resposta a quem pede cancelamento: entender o motivo em uma pergunta, facilitar a saída e deixar a porta aberta. Sem contraoferta de desconto."),
  c("escalonador", "erro", "Abrir tarefa de erro", "Passos para reproduzir.", "Transforme este relato de erro da clínica em tarefa técnica clara, com passos para reproduzir, impacto e prioridade:\n{0}", [{ label: "Relato do erro", padrao: "", placeholder: "o que a clínica reportou" }]),
  c("escalonador", "abertos", "Erros em aberto", "Fila por gravidade.", "Liste os erros da clínica ainda abertos por gravidade e o que bloqueia cada um."),
  c("relclinica", "semana", "Relatório da clínica", "O que foi resolvido na semana.", "Escreva o relatório semanal para a clínica: o que foi resolvido, o que está em andamento e o próximo passo, em tom de parceria. " + PROPOR),
  c("relclinica", "reuniao", "Pauta da reunião com a clínica", "Pontos e perguntas.", "Monte a pauta da próxima reunião com a clínica: o que mostrar, o que perguntar e o que pedir a eles."),
];

export const comandosDe = (agentId: string): Comando[] => COMANDOS.filter((x) => x.agentId === agentId);

/** Clique direto: todo campo obrigatório já tem valor padrão. */
export const umClique = (cmd: Comando): boolean => (cmd.campos ?? []).every((f) => f.opcional || f.padrao.trim() !== "");

/** Valores iniciais (os padrões) para o formulário de ajuste. */
export const padroes = (cmd: Comando): string[] => (cmd.campos ?? []).map((f) => f.padrao);

/** Monta a instrução trocando {0}, {1}. Campo vazio usa o padrão. Devolve null se faltar um obrigatório. */
export function montarTarefa(cmd: Comando, valores: string[] = []): string | null {
  const campos = cmd.campos ?? [];
  const v = campos.map((f, i) => {
    const x = (valores[i] ?? "").trim() || f.padrao;
    return f.https && !/^https:\/\/\S+$/.test(x) ? "" : x;
  });
  if (campos.some((f, i) => !f.opcional && !v[i])) return null;
  return v.reduce((t, x, i) => t.replaceAll(`{${i}}`, x || "não informado"), cmd.task);
}
