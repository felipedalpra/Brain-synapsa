// packages/shared/src/commands.ts
var CONTEXTO = "Contexto fixo: a Synapsa \xE9 uma plataforma de IA para psic\xF3logos aut\xF4nomos e cl\xEDnicas no Brasil. Plano gr\xE1tis at\xE9 5 pacientes; Essencial a R$ 79 (R$ 119 de tabela). A Lyra \xE9 a assistente que acompanha o paciente entre as sess\xF5es. Quem assina os textos \xE9 o Felipe Dalpra, fundador da Synapsa, que n\xE3o \xE9 psic\xF3logo. Meta: R$ 1.200 de MRR at\xE9 31/12/2026.";
var REGRAS = "Regras: nunca ofere\xE7a desconto, nunca prometa resultado cl\xEDnico, nunca cite paciente. Texto escrito em meu nome n\xE3o finge que sou psic\xF3logo, n\xE3o inventa experi\xEAncia em comum, nem diz que vi o perfil ou o trabalho da pessoa. Use consultar_dados antes de afirmar qualquer n\xFAmero do neg\xF3cio e diga a fonte. Se faltar dado, diga o que falta e como obter.";
var ENTREGA = 'Entregue pelo relatorio: "resumo" com 1 ou 2 frases e "entrega" com o documento completo, pronto para usar (t\xEDtulos curtos, listas, n\xFAmeros com a fonte).';
var PROXIMAS = 'Termine com "Pr\xF3ximas 3 a\xE7\xF5es" por impacto em R$.';
var PROPOR = "Texto que vai sair para algu\xE9m: deixe na fila com a ferramenta propor (texto_pronto). Nada sai sem o meu OK.";
var QTD = (n3, ...mais) => ({ label: "Quantidade", padrao: n3, opcoes: [n3, ...mais] });
var c = (agentId, id, label, hint, task, campos, web = false) => ({
  id: `${agentId}:${id}`,
  agentId,
  label,
  hint,
  task: `${task}

${CONTEXTO}
${REGRAS}
${ENTREGA}${task.includes("Pr\xF3ximas 3 a\xE7\xF5es") ? "" : ` ${PROXIMAS}`}`,
  campos,
  web
});
var COMANDOS = [
  // ---------------- Estratégia: Chief ----------------
  c("chief", "briefing", "Briefing de agora", "MRR, o que mudou e o que depende de voc\xEA.", "Monte o briefing de agora: MRR e varia\xE7\xE3o, o que mudou desde ontem, o que travou e as decis\xF5es que dependem de mim, ordenadas por impacto em reais. M\xE1ximo de 15 linhas."),
  c("chief", "semana", "Plano da semana", "3 apostas ligadas \xE0 meta.", "Monte o plano da semana: no m\xE1ximo 3 apostas que mais aproximam o MRR da meta, cada uma com dono (agente), entrega, n\xFAmero-alvo e como medir na sexta."),
  c("chief", "sexta", "Fechamento da semana", "O que andou, o que n\xE3o andou.", "Fa\xE7a o fechamento da semana: o que cada time entregou, o que ficou parado e por qu\xEA, o que repetir e o que cortar na pr\xF3xima semana."),
  c("chief", "risco", "Onde estou perdendo dinheiro", "Vazamentos de receita e de tempo.", "Procure onde a Synapsa est\xE1 perdendo receita ou tempo agora (cancelamentos, descontos acabando, cadastros parados, an\xFAncio sem retorno) e ordene por R$."),
  // ---------------- Marketing ----------------
  c("conteudo", "post", "Gerar post pronto", "Legenda e ideia de imagem na fila.", "Crie 1 post de Instagram para psic\xF3logos aut\xF4nomos. Tema: {0}. Veja os posts recentes (consultar_dados instagram) para n\xE3o repetir e seguir o que engajou. Entregue gancho, legenda (at\xE9 900 caracteres), 5 hashtags e a ideia da imagem. {1} " + PROPOR + " Se eu informar o link https da imagem, use imagem_url na proposta com canal instagram para eu aprovar e publicar. Link da imagem: {2}.", [
    { label: "Tema", padrao: "o tema que o perfil ainda n\xE3o cobriu e que mais atrai psic\xF3logo aut\xF4nomo", placeholder: "ex.: como cobrar a sess\xE3o sem constrangimento" },
    { label: "Formato", padrao: "imagem \xFAnica", opcoes: ["imagem \xFAnica", "carrossel", "reels"] },
    { label: "Link https da imagem (para publicar)", padrao: "", opcional: true, https: true, placeholder: "opcional" }
  ]),
  c("conteudo", "ideias", "Ideias de post", "Lista de temas com gancho.", "Liste {0} ideias de post para psic\xF3logos aut\xF4nomos, cada uma com gancho de 1 linha, formato sugerido e a dor do psic\xF3logo que ela toca. Evite o que j\xE1 foi postado (consultar_dados instagram).", [QTD("10", "5", "20")]),
  c("conteudo", "criativo", "Briefing do criativo", "Conceito, texto na arte e prompt de imagem.", "Fa\xE7a o briefing de um criativo de {0} sobre: {1}. Entregue conceito visual, texto exato que vai na arte (curto), formato em pixels, paleta (roxo e azul da Synapsa, estilo Lyra: bichinhos arredondados, contorno azul-marinho), e um prompt de imagem pronto para colar no gerador. N\xE3o invente depoimento nem n\xFAmero.", [
    { label: "Pe\xE7a", padrao: "post de feed", opcoes: ["post de feed", "story", "an\xFAncio de capta\xE7\xE3o", "capa de carrossel"] },
    { label: "Assunto", padrao: "criar o perfil na Synapsa e come\xE7ar com 5 pacientes gr\xE1tis", placeholder: "o que o criativo comunica" }
  ]),
  c("conteudo", "carrossel", "Carrossel completo", "Texto de cada slide.", "Escreva um carrossel de {0} slides sobre: {1}. Slide 1 \xE9 gancho, o \xFAltimo \xE9 chamada para a\xE7\xE3o sem press\xE3o. D\xEA o texto de cada slide (m\xE1x. 25 palavras) e a legenda. " + PROPOR, [
    { label: "Slides", padrao: "8", opcoes: ["6", "8", "10"] },
    { label: "Assunto", padrao: "um erro comum de quem come\xE7a a atender e como evitar", placeholder: "tema do carrossel" }
  ]),
  c("conteudo", "reels", "Roteiro de reels", "Fala, cenas e legenda.", "Escreva o roteiro de um reels de 30 a 40 segundos sobre: {0}. Gancho nos 3 primeiros segundos, fala palavra por palavra, o que aparece na tela, texto na tela e legenda.", [{ label: "Assunto", padrao: "como a Lyra acompanha o paciente entre as sess\xF5es sem tomar o lugar do psic\xF3logo", placeholder: "tema do reels" }]),
  c("conteudo", "semana", "Calend\xE1rio da semana", "5 posts planejados.", "Planeje 5 posts para a semana (dia, formato, tema, gancho e legenda curta), baseados no que j\xE1 funcionou no perfil. Misture dor, prova de uso real (sem citar paciente) e produto."),
  c("conteudo", "analise", "Como est\xE1 o Instagram", "Seguidores, alcance e o que funcionou.", "Analise o Instagram @synapsa.ai: seguidores e crescimento, alcance, os posts que mais engajaram e o que repetir ou cortar nas pr\xF3ximas duas semanas."),
  c("prospeccao", "lote", "Lote de mensagens de LinkedIn", "Mensagens prontas para voc\xEA enviar hoje.", "Prepare o lote do dia de {0} mensagens de LinkedIn para psic\xF3logos aut\xF4nomos, divididas por perfil (rec\xE9m-formado, consult\xF3rio pr\xF3prio, atende online, cl\xEDnica pequena). Para cada uma: nota de conex\xE3o de at\xE9 200 caracteres e a primeira mensagem de at\xE9 400. Tom de colega, uma pergunta s\xF3, sem vender na primeira. N\xE3o use nomes de pessoas (n\xE3o h\xE1 lista): deixe [Nome] onde entra o nome. Entregue pelo relatorio, n\xE3o pela fila. Lembre no fim o limite seguro de convites por dia (cerca de 20) e que o envio \xE9 manual pelo meu perfil.", [QTD("10", "5", "20")]),
  c("prospeccao", "followup", "Follow-ups", "Sequ\xEAncia para quem n\xE3o respondeu.", "Escreva a sequ\xEAncia de follow-up para quem aceitou a conex\xE3o e n\xE3o respondeu: mensagem do dia 3, do dia 7 e a de encerramento educado. Curtas, sem press\xE3o, cada uma com um motivo novo para responder."),
  c("prospeccao", "perfil", "Meu perfil de LinkedIn", "Ajustes que aumentam aceite.", "Revise o que o meu perfil de LinkedIn precisa ter para quem \xE9 psic\xF3logo aceitar e responder: t\xEDtulo, sobre, destaque e post fixado. Entregue o texto sugerido de cada parte.", void 0, true),
  c("prospeccao", "icp", "Quem abordar primeiro", "Perfil ideal e onde achar.", "Defina o perfil ideal de psic\xF3logo aut\xF4nomo para a Synapsa abordar primeiro (tempo de carreira, como capta, sinais de dor) e os 5 lugares onde achar esse perfil (grupos, eventos, hashtags). Sem lista de pessoas.", void 0, true),
  c("prospeccao", "resposta", "Responder um lead", "Resposta para o que ele escreveu.", "Escreva a resposta para esta mensagem de um psic\xF3logo no LinkedIn, no meu tom, sem vender de cara e sem desconto:\n{0}", [{ label: "Mensagem recebida", padrao: "", placeholder: "cole o que a pessoa respondeu" }]),
  c("indicacao", "convite", "Convite de indica\xE7\xE3o", "Texto para os clientes atuais.", "Escreva o convite para os clientes atuais indicarem colegas: sem desconto, com um benef\xEDcio que n\xE3o seja dinheiro (ex.: prioridade em novidades). Duas vers\xF5es, WhatsApp e e-mail. " + PROPOR),
  c("indicacao", "programa", "Desenhar o programa", "Regras, ganho e como medir.", "Desenhe o programa de indica\xE7\xE3o: quem pode indicar, o que a pessoa ganha (sem desconto), como registrar a indica\xE7\xE3o, como medir e a meta de indica\xE7\xF5es por m\xEAs."),
  c("indicacao", "mensagem", "Mensagem para o indicado", "Texto que o cliente repassa.", "Escreva o texto curto que o cliente atual pode encaminhar ao colega, em primeira pessoa, natural, com o link do cadastro gr\xE1tis."),
  c("midia", "metricas", "M\xE9tricas do Meta Ads", "Gasto, cliques, leads e custo por lead.", "Leia o Meta Ads dos \xFAltimos {0} e mostre gasto, cliques, leads, custo por lead e campanhas sem retorno. Se a conta estiver parada, diga e recomende se vale voltar.", [{ label: "Per\xEDodo", padrao: "30 dias", opcoes: ["7 dias", "30 dias"] }]),
  c("midia", "campanha", "Montar teste de campanha", "Oferta, p\xFAblico e or\xE7amento de teste.", "Proponha um teste de campanha no Meta para captar cadastros de psic\xF3logos aut\xF4nomos com or\xE7amento de teste de {0} reais: oferta, p\xFAblico, 3 criativos (texto de cada), teto di\xE1rio, regra de parar e o que decide escalar. Sem prometer resultado. O que for estimativa, marque.", [{ label: "Or\xE7amento de teste (R$)", padrao: "300", opcoes: ["150", "300", "600", "1000"] }]),
  c("midia", "copy", "Textos de an\xFAncio", "Varia\xE7\xF5es para testar.", "Escreva {0} varia\xE7\xF5es de texto de an\xFAncio para psic\xF3logos aut\xF4nomos (t\xEDtulo de at\xE9 40 caracteres, texto principal de at\xE9 125), cada uma com um \xE2ngulo diferente (tempo, organiza\xE7\xE3o, acompanhamento do paciente, plano gr\xE1tis). Respeite as regras de propaganda do CFP.", [QTD("6", "3", "10")]),
  c("midia", "corte", "O que cortar", "Gasto sem retorno.", "Veja o gasto por campanha e diga o que cortar ou pausar agora e o que manter, com o n\xFAmero que justifica."),
  c("inteligencia", "concorrentes", "Mapa de concorrentes", "Pre\xE7o, plano gr\xE1tis e posicionamento.", "Pesquise na web {0} concorrentes da Synapsa para psic\xF3logos no Brasil: pre\xE7o, plano gr\xE1tis, posicionamento, o que prometem e que \xE2ngulo de mensagem est\xE1 livre. Cite a fonte de cada fato.", [QTD("5", "3", "8")], true),
  c("inteligencia", "demanda", "O que psic\xF3logos procuram", "Dores e termos de busca.", "Pesquise na web as d\xFAvidas e dores de psic\xF3logos aut\xF4nomos sobre captar pacientes, organizar consult\xF3rio e IA, e transforme em 8 temas de conte\xFAdo, cada um com a dor e o termo que a pessoa busca.", void 0, true),
  c("inteligencia", "tendencias", "Tend\xEAncias do setor", "O que mudou no mercado.", "Pesquise na web o que mudou nos \xFAltimos meses em IA e tecnologia para psicologia no Brasil (regras do CFP, concorrentes novos, comportamento do psic\xF3logo) e diga o que isso muda para a Synapsa.", void 0, true),
  c("inteligencia", "ads", "An\xFAncios dos concorrentes", "\xC2ngulos que eles usam.", "Pesquise na web como os concorrentes anunciam para psic\xF3logos (\xE2ngulos, ofertas, tom) e traga 5 \xE2ngulos que a Synapsa pode usar e 2 que deve evitar.", void 0, true),
  // ---------------- Comercial ----------------
  c("ativacao", "parados", "Cadastros parados", "Onde o cadastro trava.", "Veja o funil e liste onde os cadastros travam (cadastro, perfil publicado, primeiro paciente). Escreva a mensagem de ativa\xE7\xE3o para cada ponto, curta e \xFAtil. " + PROPOR),
  c("ativacao", "boasvindas", "Sequ\xEAncia de boas-vindas", "3 mensagens para o primeiro dia.", "Escreva a sequ\xEAncia de boas-vindas de 3 mensagens (hora 0, dia 1, dia 3) que leva o psic\xF3logo ao perfil publicado e ao primeiro paciente. Canal: e-mail e WhatsApp, vers\xE3o de cada."),
  c("ativacao", "checklist", "Checklist de ativa\xE7\xE3o", "Passo a passo dentro do produto.", "Monte o checklist de ativa\xE7\xE3o do psic\xF3logo (5 passos no m\xE1ximo), com o motivo de cada passo e como saber que ele concluiu."),
  c("pagar", "limite", "Convite no limite de 5", "Texto para quem chegou ao limite.", "Escreva o convite ao Essencial (R$ 79) para quem chega no limite de 5 pacientes: sem desconto, focado em tempo e organiza\xE7\xE3o, uma chamada s\xF3. WhatsApp e e-mail. " + PROPOR),
  c("pagar", "objecoes", "Obje\xE7\xF5es ao pagar", "Respostas prontas.", "Liste as 6 obje\xE7\xF5es mais prov\xE1veis ao assinar o Essencial (pre\xE7o, 'j\xE1 uso outra coisa', 'n\xE3o preciso agora') e a resposta honesta de cada uma, sem desconto."),
  c("pagar", "pagina", "Texto da p\xE1gina de planos", "Gr\xE1tis vs Essencial.", "Escreva o texto da compara\xE7\xE3o entre o plano gr\xE1tis e o Essencial: o que muda, para quem serve cada um, sem exagero."),
  c("sdr", "roteiro", "Roteiro de conversa", "Conversa de venda para cl\xEDnica.", "Monte o roteiro da conversa de venda para cl\xEDnicas: abertura, 8 perguntas de descoberta, obje\xE7\xF5es e pr\xF3ximo passo. Sem prospec\xE7\xE3o ativa at\xE9 a cl\xEDnica atual estabilizar."),
  c("sdr", "whats", "Mensagens de WhatsApp", "Primeira abordagem e retomada.", "Escreva 3 mensagens de WhatsApp para retomar contato com quem j\xE1 conversou e sumiu, cada uma com um motivo novo de contato. Sem desconto. " + PROPOR),
  c("sdr", "qualificar", "Perguntas de qualifica\xE7\xE3o", "Quem vale a reuni\xE3o.", "Monte as 6 perguntas para saber se uma cl\xEDnica vale uma reuni\xE3o (tamanho, sistema atual, quem decide, dor) e a regra de quando descartar."),
  c("closer", "reuniao", "Preparar reuni\xE3o", "Contexto e perguntas.", "Prepare a reuni\xE3o com {0}: contexto, perguntas de descoberta, obje\xE7\xF5es prov\xE1veis e o pr\xF3ximo passo a pedir.", [{ label: "Com quem", padrao: "a pr\xF3xima reuni\xE3o da minha agenda", placeholder: "nome da cl\xEDnica ou psic\xF3logo" }]),
  c("closer", "ata", "Resumo p\xF3s-reuni\xE3o", "O que ficou combinado.", "Transforme estas anota\xE7\xF5es em resumo da reuni\xE3o, decis\xF5es, pend\xEAncias com dono e a mensagem de acompanhamento:\n{0}", [{ label: "Anota\xE7\xF5es", padrao: "", placeholder: "cole o que anotou" }]),
  c("closer", "proposta", "Proposta comercial", "Documento para a cl\xEDnica.", "Escreva a proposta comercial para {0}: problema, solu\xE7\xE3o, plano, pre\xE7o de tabela (sem desconto), prazo de implanta\xE7\xE3o e pr\xF3ximos passos.", [{ label: "Cliente", padrao: "uma cl\xEDnica pequena (3 a 5 psic\xF3logos)", placeholder: "nome ou perfil" }]),
  c("closer", "fechar", "Fechar o que ficou aberto", "Quem est\xE1 esperando resposta.", "Liste as conversas abertas que dependem de mim, o que falta para cada uma fechar e a mensagem de retomada. " + PROPOR),
  // ---------------- Estratégia ----------------
  c("financeiro", "meta", "Conta da meta", "Quantos clientes faltam e cen\xE1rios.", "Calcule quantos Essenciais a R$ 79 faltam para a meta, quantos por semana at\xE9 31/12, o efeito dos fins de desconto e 3 cen\xE1rios (conservador, base, agressivo) com a premissa de cada um."),
  c("financeiro", "custo", "Custo do usu\xE1rio gr\xE1tis", "Quanto cada cadastro custa.", "Estime o custo mensal de cada usu\xE1rio gratuito (IA, infraestrutura) e quantos gr\xE1tis o caixa aguenta por pagante. Marque o que \xE9 estimativa e o que dado falta."),
  c("financeiro", "caixa", "Fluxo dos pr\xF3ximos 90 dias", "Entradas, descontos acabando e custos.", "Projete as entradas dos pr\xF3ximos 90 dias com base em Stripe e Pix informados, incluindo os fins de desconto, e liste os custos fixos conhecidos."),
  c("alocador", "orcamento", "Propor or\xE7amento", "Onde p\xF4r o dinheiro, com teto.", "Proponha o or\xE7amento mensal de aquisi\xE7\xE3o de {0} reais: quanto em cada canal (an\xFAncio, conte\xFAdo, ferramenta), custo por cadastro estimado, quando parar e o que cada real precisa render. Marque o que \xE9 estimativa.", [{ label: "Or\xE7amento do m\xEAs (R$)", padrao: "500", opcoes: ["300", "500", "1000", "2000"] }]),
  c("alocador", "estrategia", "Propor estrat\xE9gia", "Canal mais barato para a meta.", "Proponha a estrat\xE9gia de aquisi\xE7\xE3o at\xE9 31/12: quantos cadastros, ativa\xE7\xF5es e pagantes s\xE3o necess\xE1rios com taxas realistas (marque como estimativa) e que canal entrega isso ao menor custo."),
  c("alocador", "canais", "Comparar canais", "Custo por cadastro de cada um.", "Compare LinkedIn, Instagram, indica\xE7\xE3o e an\xFAncio pago por custo por cadastro e por esfor\xE7o, com o dado real quando existir e estimativa marcada quando n\xE3o."),
  c("metricas", "funil", "Funil de hoje", "Cadastro, ativado, no limite, pago.", "Mostre o funil e o MRR de hoje, o que mudou na semana e onde est\xE1 o gargalo."),
  c("metricas", "semana", "Relat\xF3rio semanal", "N\xFAmeros que importam.", "Monte o relat\xF3rio semanal: MRR, clientes, Instagram, an\xFAncios e funil, cada n\xFAmero com a fonte e a varia\xE7\xE3o contra a semana anterior."),
  c("metricas", "meta", "Estou no ritmo?", "Compara com o que falta.", "Compare o ritmo atual de MRR com o necess\xE1rio para chegar na meta e diga, com n\xFAmero, se estou adiantado ou atrasado."),
  c("experimentos", "teste", "Desenhar um teste", "Uma hip\xF3tese, uma m\xE9trica.", "Desenhe 1 experimento para subir {0}: hip\xF3tese, o que muda, m\xE9trica, tamanho m\xEDnimo, dura\xE7\xE3o e a regra de decidir (escalar ou encerrar).", [{ label: "Objetivo", padrao: "ativa\xE7\xE3o dos cadastros", opcoes: ["ativa\xE7\xE3o dos cadastros", "convers\xE3o para o Essencial", "resposta no LinkedIn", "cliques no an\xFAncio"] }]),
  c("experimentos", "ideias", "Backlog de testes", "10 testes ordenados.", "Liste 10 experimentos poss\xEDveis, ordenados por impacto esperado dividido por esfor\xE7o, cada um com a m\xE9trica."),
  c("experimentos", "resultado", "Ler o resultado de um teste", "Escalar ou encerrar.", "Leia o resultado deste teste e diga se escala ou encerra, com o motivo estat\xEDstico em linguagem simples:\n{0}", [{ label: "Dados do teste", padrao: "", placeholder: "cole os n\xFAmeros" }]),
  c("compliance", "revisar", "Revisar um texto", "Checa LGPD, CFP e promessas.", "Revise o texto a seguir quanto a LGPD, \xE9tica do CFP, promessa de resultado, desconto e uso de dado de paciente, e devolva a vers\xE3o corrigida com o que mudou:\n{0}", [{ label: "Texto", padrao: "", placeholder: "cole a mensagem ou o post" }]),
  c("compliance", "auditoria", "Auditar o que saiu", "Mensagens e acessos recentes.", "Audite as propostas e envios dos \xFAltimos 7 dias contra as regras (consentimento, intervalo entre contatos, desconto, dado de paciente) e liste qualquer desvio."),
  c("compliance", "lgpd", "Checklist de LGPD", "O que falta para estar em dia.", "Monte o checklist de LGPD da Synapsa para o que ela faz hoje (cadastro de psic\xF3logo, dados do paciente na plataforma, e-mails e an\xFAncios) e marque o que sei que est\xE1 feito e o que falta confirmar."),
  c("guardiao", "dados", "Conferir os n\xFAmeros", "Stripe, Pix e MRR batem?", "Confira se MRR, clientes e descontos batem entre Stripe e o que foi informado, e aponte qualquer diverg\xEAncia."),
  c("guardiao", "acessos", "O que cada agente acessa", "Fontes e permiss\xF5es.", "Liste a que fontes de dado cada agente tem acesso hoje e se alguma permiss\xE3o \xE9 maior do que o necess\xE1rio."),
  // ---------------- Produto ----------------
  c("descoberta", "backlog", "O que construir agora", "Backlog por impacto em R$.", "Ordene o que construir agora por impacto em R$, com o motivo de cada item e o que fica de fora. M\xE1ximo de 7 itens."),
  c("descoberta", "feedback", "Resumo do feedback", "O que os clientes pedem.", "Junte o feedback e as reclama\xE7\xF5es conhecidos em temas, com quantas vezes aparecem e o que fazer com cada um."),
  c("descoberta", "lyra", "Ideias para a Lyra", "Melhorias que aumentam reten\xE7\xE3o.", "Proponha 5 melhorias na Lyra que aumentem o uso do paciente entre sess\xF5es e, com isso, a reten\xE7\xE3o do psic\xF3logo, cada uma com esfor\xE7o e o que medir."),
  c("especificacao", "spec", "Escrever uma spec", "Crit\xE9rio de aceite incluso.", "Escreva a spec de: {0}. Problema, solu\xE7\xE3o, fluxo, crit\xE9rios de aceite, o que fica fora, riscos e como medir.", [{ label: "Funcionalidade", padrao: "o item de maior prioridade do backlog", placeholder: "ex.: lembrete de sess\xE3o pela Lyra" }]),
  c("especificacao", "texto", "Textos da interface", "Mensagens e vazios do produto.", "Escreva os textos de interface (bot\xF5es, estados vazios, erros) para: {0}. Portugu\xEAs claro, voz ativa, sem jarg\xE3o.", [{ label: "Tela", padrao: "o primeiro acesso do psic\xF3logo", placeholder: "qual tela" }]),
  c("uso", "travas", "Onde o usu\xE1rio trava", "Uso dentro do produto.", "Mostre onde o usu\xE1rio trava dentro do produto e quais recursos usa, o que d\xE1 para saber hoje e o que falta instrumentar."),
  c("uso", "eventos", "Eventos a instrumentar", "O que medir primeiro.", "Liste os 10 eventos que a plataforma precisa registrar para medir ativa\xE7\xE3o e reten\xE7\xE3o, com nome, quando dispara e o que responde."),
  c("lancamento", "novidade", "Comunicar novidade", "Changelog e e-mail.", "Escreva o changelog e o e-mail curto para clientes sobre: {0}. " + PROPOR, [{ label: "Novidade", padrao: "", placeholder: "o que mudou no produto" }]),
  c("lancamento", "tutorial", "Tutorial passo a passo", "Para o cliente seguir.", "Escreva o tutorial passo a passo de: {0}, com no m\xE1ximo 6 passos e o resultado esperado de cada um.", [{ label: "Recurso", padrao: "criar e publicar o perfil", placeholder: "qual recurso" }]),
  c("lancamento", "post", "Post de lan\xE7amento", "Instagram e LinkedIn.", "Escreva o post de lan\xE7amento de: {0}, uma vers\xE3o para Instagram e uma para LinkedIn. " + PROPOR, [{ label: "Novidade", padrao: "", placeholder: "o que lan\xE7ou" }]),
  // ---------------- Sucesso ----------------
  c("saude", "contas", "Sa\xFAde das contas", "Quem corre risco de cancelar.", "Veja a sa\xFAde das contas pagantes e diga quem corre risco de cancelar e a a\xE7\xE3o para cada uma. " + PROPOR),
  c("saude", "checkin", "Check-in com pagantes", "Mensagem de acompanhamento.", "Escreva a mensagem de check-in para pagantes (30 dias de uso): pergunta de uma linha sobre o que est\xE1 funcionando e o que falta. " + PROPOR),
  c("saude", "nps", "Pesquisa de satisfa\xE7\xE3o", "Perguntas curtas.", "Monte a pesquisa de satisfa\xE7\xE3o de 3 perguntas para os pagantes e como ler a resposta de cada uma."),
  c("cobranca", "falhas", "Pagamentos que falharam", "Mensagem de recupera\xE7\xE3o.", "Veja pagamentos falhos no Stripe e escreva a mensagem de recupera\xE7\xE3o, cordial e sem press\xE3o, com o link para atualizar o cart\xE3o. " + PROPOR),
  c("cobranca", "desconto", "Aviso de fim de desconto", "Contato 30 dias antes.", "Prepare o aviso para as contas cujo desconto acaba nos pr\xF3ximos 60 dias: o que muda, quando, e o valor novo, com transpar\xEAncia. Sem oferecer desconto. " + PROPOR),
  c("cobranca", "cancelamento", "Resposta a pedido de cancelamento", "Sa\xEDda respeitosa.", "Escreva a resposta a quem pede cancelamento: entender o motivo em uma pergunta, facilitar a sa\xEDda e deixar a porta aberta. Sem contraoferta de desconto."),
  c("escalonador", "erro", "Abrir tarefa de erro", "Passos para reproduzir.", "Transforme este relato de erro da cl\xEDnica em tarefa t\xE9cnica clara, com passos para reproduzir, impacto e prioridade:\n{0}", [{ label: "Relato do erro", padrao: "", placeholder: "o que a cl\xEDnica reportou" }]),
  c("escalonador", "abertos", "Erros em aberto", "Fila por gravidade.", "Liste os erros da cl\xEDnica ainda abertos por gravidade e o que bloqueia cada um."),
  c("relclinica", "semana", "Relat\xF3rio da cl\xEDnica", "O que foi resolvido na semana.", "Escreva o relat\xF3rio semanal para a cl\xEDnica: o que foi resolvido, o que est\xE1 em andamento e o pr\xF3ximo passo, em tom de parceria. " + PROPOR),
  c("relclinica", "reuniao", "Pauta da reuni\xE3o com a cl\xEDnica", "Pontos e perguntas.", "Monte a pauta da pr\xF3xima reuni\xE3o com a cl\xEDnica: o que mostrar, o que perguntar e o que pedir a eles.")
];

// packages/shared/src/roster.ts
var AGENTS = [
  {
    "id": "chief",
    "area": "comando",
    "ready": "pronto",
    "name": "Chief of Staff",
    "mission": "Reunir tudo que precisa de voc\xEA num briefing e numa fila ordenada por impacto em R$.",
    "metric": "Minutos por dia na fila de aprova\xE7\xE3o, sem perder receita",
    "needs": "Propostas e resultados dos outros agentes.",
    "triggers": [
      "Todo dia \xE0s 7h",
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
        "does": "Resume o dia em decis\xF5es, n\xE3o em relat\xF3rios"
      }
    ],
    "auto": [
      "Montar o briefing",
      "Ordenar a fila",
      "Atribuir o dono de cada conversa"
    ],
    "aprova": [],
    "humano": [
      "Toda decis\xE3o que sai da fila"
    ],
    "limits": "N\xE3o envia nada para fora. Entrega no m\xE1ximo cerca de 15 itens por dia na fila.",
    "learns": "Registra o que voc\xEA aprova primeiro e o que deixa parado, e reordena a fila com isso.",
    "note": null
  },
  {
    "id": "ativacao",
    "area": "ativacao",
    "ready": "parcial",
    "name": "Ativa\xE7\xE3o do Freemium",
    "mission": "Levar cada cadastro at\xE9 perfil publicado e primeiro paciente real.",
    "metric": "Cadastros ativados (hoje cerca de 20 de 35)",
    "needs": "Cadastros, pacientes e consultas da plataforma. Perfil publicado e \xFAltimo acesso ainda n\xE3o chegam como evento.",
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
        "name": "Concierge de perfil p\xFAblico",
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
      "Boas-vindas e parab\xE9ns pelo 1\xBA paciente, com modelos que voc\xEA j\xE1 aprovou"
    ],
    "aprova": [
      "Ajuda para montar o perfil",
      "Dicas para divulgar o link"
    ],
    "humano": [],
    "limits": "1 contato a cada 3 dias. Para quando a pessoa responde. S\xF3 com aceite de WhatsApp. Entre 9h e 19h.",
    "learns": "Guarda as mensagens aprovadas sem edi\xE7\xE3o como modelo e o que voc\xEA corta nas outras.",
    "note": null
  },
  {
    "id": "pagar",
    "area": "ativacao",
    "ready": "parcial",
    "name": "Momento de Pagar",
    "mission": "Convidar para o Essencial na hora em que o limite de 5 pacientes aperta.",
    "metric": "Convers\xE3o do gratuito para o Essencial",
    "needs": "Contagem de pacientes e plano, na plataforma. Falta registrar a tentativa de usar recurso bloqueado.",
    "triggers": [
      "4 de 5 pacientes (cerca de 80% do limite)",
      "Limite batido",
      "Tentou usar recurso bloqueado",
      "Ativo h\xE1 14 dias ou mais sem bater o limite"
    ],
    "subs": [
      {
        "name": "Detector de inten\xE7\xE3o",
        "tier": "leve",
        "does": "D\xE1 nota de inten\xE7\xE3o de compra a cada sinal"
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
        "does": "Convite de valor, sem press\xE3o"
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
      "Pergunta de pre\xE7o ou obje\xE7\xE3o"
    ],
    "limits": "Nunca oferece desconto. 1 contato a cada 3 dias. Para quando a pessoa responde.",
    "learns": "Qual sinal e qual mensagem antecederam cada assinatura.",
    "note": "O sinal de recurso bloqueado ainda precisa ser registrado pela plataforma."
  },
  {
    "id": "saude",
    "area": "sucesso",
    "ready": "pronto",
    "name": "Sa\xFAde da Conta e Voz do Cliente",
    "mission": "Nenhum pagante cancela, e todo feedback chega a quem pode agir.",
    "metric": "Churn dos pagantes (meta: zero)",
    "needs": "Uso e assinatura na plataforma, mais o feedback que voc\xEA repassar.",
    "triggers": [
      "Queda de uso",
      "Pagante sem login h\xE1 7 dias",
      "Reclama\xE7\xE3o ou NPS baixo"
    ],
    "subs": [
      {
        "name": "Radar de risco",
        "tier": "leve",
        "does": "D\xE1 nota de risco a cada pagante"
      },
      {
        "name": "Detetive de causa",
        "tier": "forte",
        "does": "Explica por que a conta est\xE1 em risco, por exemplo uma queixa sobre o financeiro"
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
      "Qualquer concess\xE3o"
    ],
    "limits": "Pagante s\xF3 recebe contato com a sua aprova\xE7\xE3o.",
    "learns": "Quais sinais antecederam um cancelamento ou uma reclama\xE7\xE3o.",
    "note": "Os feedbacks que se repetem v\xE3o direto para o agente de Descoberta, no Produto."
  },
  {
    "id": "cobranca",
    "area": "sucesso",
    "ready": "parcial",
    "name": "Cobran\xE7a",
    "mission": "Recuperar pagamentos que falharam sem desgastar o cliente.",
    "metric": "Valor recuperado de pagamentos falhados",
    "needs": "Status de pagamento vem da assinatura na plataforma. O Stripe direto deixa a leitura mais precisa.",
    "triggers": [
      "Pagamento falhou",
      "Cart\xE3o perto do vencimento",
      "Prazo da r\xE9gua venceu"
    ],
    "subs": [
      {
        "name": "R\xE9gua de cobran\xE7a",
        "tier": "leve",
        "does": "Define o pr\xF3ximo lembrete e o prazo"
      },
      {
        "name": "Redator",
        "tier": "forte",
        "does": "Lembrete educado com o link de atualiza\xE7\xE3o"
      }
    ],
    "auto": [],
    "aprova": [
      "Lembrete com link de atualiza\xE7\xE3o"
    ],
    "humano": [
      "Negociar, parcelar ou estornar"
    ],
    "limits": "O lembrete padr\xE3o pode virar autom\xE1tico depois de cerca de 20 aprova\xE7\xF5es sem edi\xE7\xE3o.",
    "learns": "Quanto tempo depois do lembrete o pagamento volta.",
    "note": null
  },
  {
    "id": "escalonador",
    "area": "clinica",
    "ready": "parcial",
    "name": "Escalonador T\xE9cnico",
    "mission": "Transformar cada erro da cl\xEDnica em tarefa clara, com passos para reproduzir.",
    "metric": "Erros abertos por semana e tempo para resolver",
    "needs": "Precisa de um lugar para a cl\xEDnica relatar o erro e de uma ferramenta de tarefas para o desenvolvedor.",
    "triggers": [
      "Mensagem da cl\xEDnica relatando problema",
      "Erro registrado na plataforma"
    ],
    "subs": [
      {
        "name": "Classificador",
        "tier": "leve",
        "does": "Separa bug, d\xFAvida e pedido, e a urg\xEAncia"
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
      "Resposta \xE0 cl\xEDnica"
    ],
    "humano": [
      "Prioridade final",
      "Decidir a corre\xE7\xE3o"
    ],
    "limits": "Sem acesso a conte\xFAdo cl\xEDnico de paciente. S\xF3 a descri\xE7\xE3o do erro e identificadores.",
    "learns": "Tipos de erro que se repetem.",
    "note": null
  },
  {
    "id": "relclinica",
    "area": "clinica",
    "ready": "pronto",
    "name": "Relat\xF3rio da Cl\xEDnica",
    "mission": "Mostrar \xE0 cl\xEDnica, toda semana, o que foi resolvido e o que est\xE1 em andamento.",
    "metric": "Satisfa\xE7\xE3o da cl\xEDnica",
    "needs": "Tarefas e corre\xE7\xF5es registradas pelo Escalonador T\xE9cnico.",
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
        "does": "Escreve em linguagem simples, sem jarg\xE3o t\xE9cnico"
      }
    ],
    "auto": [
      "Compilar os dados"
    ],
    "aprova": [
      "Envio do relat\xF3rio"
    ],
    "humano": [
      "Conversa de alinhamento com a cl\xEDnica"
    ],
    "limits": "N\xE3o promete prazo que voc\xEA n\xE3o confirmou.",
    "learns": "O que a cl\xEDnica mais pergunta.",
    "note": null
  },
  {
    "id": "guardiao",
    "area": "growth",
    "ready": "pronto",
    "name": "Guardi\xE3o de Dados",
    "mission": "Garantir que cada n\xFAmero usado pelos agentes esteja certo.",
    "metric": "Campos cr\xEDticos preenchidos e diverg\xEAncias abertas",
    "needs": "Leitura do banco da plataforma, do CRM e das assinaturas.",
    "triggers": [
      "Toda noite",
      "Cadastro novo",
      "Mudan\xE7a de plano"
    ],
    "subs": [
      {
        "name": "Auditor de qualidade",
        "tier": "leve",
        "does": "Acha campo vazio, duplicata e valor imposs\xEDvel"
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
      "Confirmar liga\xE7\xE3o entre lead e profissional"
    ],
    "humano": [
      "Qualquer altera\xE7\xE3o no banco de produ\xE7\xE3o"
    ],
    "limits": "Leitura apenas no banco da plataforma.",
    "learns": "Quais erros de dado se repetem e de onde v\xEAm.",
    "note": "Primeiros alvos: \xFAltimo acesso e data de fim do trial vazios na base."
  },
  {
    "id": "metricas",
    "area": "growth",
    "ready": "parcial",
    "name": "Analista de M\xE9tricas",
    "mission": "Medir o funil (cadastro, ativado, no limite, pago) e o MRR todo dia.",
    "metric": "N\xFAmero confi\xE1vel em cada etapa do funil",
    "needs": "O funil depende dos dados que o Guardi\xE3o corrige: \xFAltimo acesso e fim do trial.",
    "triggers": [
      "Todo dia",
      "Toda segunda-feira"
    ],
    "subs": [
      {
        "name": "Calculador de m\xE9tricas",
        "tier": "leve",
        "does": "MRR, convers\xE3o por etapa e coortes"
      },
      {
        "name": "Redator de relat\xF3rio",
        "tier": "forte",
        "does": "O que mudou, por que e o que fazer"
      }
    ],
    "auto": [
      "Calcular",
      "Relat\xF3rio semanal"
    ],
    "aprova": [],
    "humano": [
      "Decidir o que mudar"
    ],
    "limits": "Usa s\xF3 dados validados pelo Guardi\xE3o.",
    "learns": "Quais m\xE9tricas voc\xEA abre e quais ignora.",
    "note": null
  },
  {
    "id": "experimentos",
    "area": "growth",
    "ready": "pronto",
    "name": "Experimentos",
    "mission": "Testar uma coisa por vez e decidir: escalar ou encerrar.",
    "metric": "Testes conclu\xEDdos com decis\xE3o",
    "needs": "Funil e convers\xE3o do Analista de M\xE9tricas.",
    "triggers": [
      "Hip\xF3tese aprovada",
      "Teste chegou ao tamanho m\xEDnimo"
    ],
    "subs": [
      {
        "name": "Desenhista de teste",
        "tier": "forte",
        "does": "Define hip\xF3tese, grupo, m\xE9trica e dura\xE7\xE3o"
      },
      {
        "name": "Leitor de resultado",
        "tier": "forte",
        "does": "Diz se o resultado \xE9 confi\xE1vel ou s\xF3 ru\xEDdo"
      }
    ],
    "auto": [
      "Medir os resultados"
    ],
    "aprova": [
      "In\xEDcio de teste",
      "Escalar ou encerrar"
    ],
    "humano": [],
    "limits": "Um teste por etapa do funil ao mesmo tempo.",
    "learns": "O que j\xE1 foi testado, para n\xE3o repetir.",
    "note": "Primeiro teste: 14 dias de Essencial para quem chega com mais de 5 pacientes, contra o limite fixo."
  },
  {
    "id": "alocador",
    "area": "growth",
    "ready": "parcial",
    "name": "Alocador de Or\xE7amento",
    "mission": "Comparar canais por custo de aquisi\xE7\xE3o e retorno e propor onde p\xF4r o dinheiro.",
    "metric": "Custo por pagante",
    "needs": "Meta j\xE1 sincroniza no CRM atual. Falta Google e o custo por canal do LinkedIn.",
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
      "Mudan\xE7a de or\xE7amento"
    ],
    "humano": [
      "Gastos novos"
    ],
    "limits": "Sugest\xE3o: s\xF3 compara canais com 30 dias de dados.",
    "learns": "Quais canais trazem pagantes que ficam.",
    "note": null
  },
  {
    "id": "prospeccao",
    "area": "aquisicao",
    "ready": "pronto",
    "name": "Prospec\xE7\xE3o de Aut\xF4nomos",
    "mission": "Encontrar psic\xF3logos no perfil certo no LinkedIn e preparar a abordagem de cada um.",
    "metric": "Cadastros ativados por semana",
    "needs": "Base de leads (Vibe Prospecting e LinkedIn). O envio \xE9 manual.",
    "triggers": [
      "Lista semanal de leads",
      "Resposta recebida no LinkedIn"
    ],
    "subs": [
      {
        "name": "Ca\xE7ador de leads",
        "tier": "leve",
        "does": "Acha psic\xF3logos pelo perfil e tira duplicados"
      },
      {
        "name": "Qualificador",
        "tier": "leve",
        "does": "Separa rec\xE9m-formado de experiente e d\xE1 nota"
      },
      {
        "name": "Redator de abordagem",
        "tier": "forte",
        "does": "Uma mensagem por perfil: captar pacientes, ou ganhar tempo na gest\xE3o"
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
    "limits": "S\xF3 passa para o WhatsApp depois que a pessoa pedir contato e aceitar. Sem abordagem fria por WhatsApp.",
    "learns": "Taxa de resposta por vers\xE3o de mensagem e por perfil.",
    "note": null
  },
  {
    "id": "conteudo",
    "area": "aquisicao",
    "ready": "pronto",
    "name": "Conte\xFAdo e Social",
    "mission": "Atrair psic\xF3logos com conte\xFAdo sobre captar pacientes e organizar o consult\xF3rio.",
    "metric": "Cadastros vindos do Instagram",
    "needs": "Instagram sincronizado no CRM e as skills de conte\xFAdo que voc\xEA j\xE1 tem.",
    "triggers": [
      "Calend\xE1rio semanal",
      "Post com desempenho acima da m\xE9dia"
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
        "does": "Responde coment\xE1rios simples e separa quem \xE9 lead"
      }
    ],
    "auto": [
      "Planejar pautas"
    ],
    "aprova": [
      "Pe\xE7a pronta",
      "Resposta a coment\xE1rio e DM"
    ],
    "humano": [
      "Publicar"
    ],
    "limits": "Passa pelo Revisor de conformidade antes de chegar na sua fila.",
    "learns": "Formato e tema que mais trazem cadastro.",
    "note": "J\xE1 existe em parte nas skills synapsa-carrossel e synapsa-conteudo."
  },
  {
    "id": "indicacao",
    "area": "aquisicao",
    "ready": "pronto",
    "name": "Indica\xE7\xE3o",
    "mission": "Fazer pagantes e ativos satisfeitos trazerem colegas.",
    "metric": "Cadastros por indica\xE7\xE3o",
    "needs": "Uso e satisfa\xE7\xE3o dos pagantes e ativados.",
    "triggers": [
      "Pagante ou ativo satisfeito",
      "Marco atingido, como o 10\xBA paciente"
    ],
    "subs": [
      {
        "name": "Detector de promotor",
        "tier": "leve",
        "does": "Acha quem est\xE1 satisfeito e usando"
      },
      {
        "name": "Redator de convite",
        "tier": "forte",
        "does": "Pede a indica\xE7\xE3o com um texto pronto para encaminhar"
      }
    ],
    "auto": [],
    "aprova": [
      "Pedido de indica\xE7\xE3o"
    ],
    "humano": [
      "Qualquer benef\xEDcio ou recompensa"
    ],
    "limits": "Pede no m\xE1ximo uma vez a cada 60 dias.",
    "learns": "Quem indica de fato e depois de quais marcos.",
    "note": null
  },
  {
    "id": "midia",
    "area": "aquisicao",
    "ready": "parcial",
    "name": "M\xEDdia Paga",
    "mission": "Ler Meta e Google todo dia e cortar gasto sem retorno.",
    "metric": "Custo por cadastro ativado",
    "needs": "Meta sincroniza no CRM atual. Google Ads ainda n\xE3o.",
    "triggers": [
      "Todo dia de manh\xE3",
      "Gasto acima do teto sem cadastro"
    ],
    "subs": [
      {
        "name": "Analista de campanha",
        "tier": "leve",
        "does": "Gasto, cliques e cadastros por an\xFAncio"
      },
      {
        "name": "Criativo de an\xFAncio",
        "tier": "forte",
        "does": "Texto e imagem de novos testes"
      },
      {
        "name": "Otimizador de or\xE7amento",
        "tier": "forte",
        "does": "Prop\xF5e pausar, escalar ou testar"
      }
    ],
    "auto": [
      "Ler as m\xE9tricas"
    ],
    "aprova": [
      "Pausar",
      "Escalar",
      "Novo criativo"
    ],
    "humano": [
      "Aumentar o teto de gasto"
    ],
    "limits": "Teto di\xE1rio de gasto definido por voc\xEA.",
    "learns": "Criativos que baixam o custo por cadastro.",
    "note": "Meta Ads e Instagram j\xE1 sincronizam no CRM atual."
  },
  {
    "id": "inteligencia",
    "area": "aquisicao",
    "ready": "pronto",
    "name": "Intelig\xEAncia de Mercado",
    "mission": "Acompanhar concorrentes, tend\xEAncias e busca para sugerir \xE2ngulos de mensagem.",
    "metric": "\xC2ngulos novos aprovados por m\xEAs",
    "needs": "Fontes p\xFAblicas da web.",
    "triggers": [
      "Toda semana",
      "Mudan\xE7a relevante em concorrente"
    ],
    "subs": [
      {
        "name": "Radar de concorr\xEAncia",
        "tier": "leve",
        "does": "Pre\xE7o, recurso e mensagem dos concorrentes"
      },
      {
        "name": "Analista de SEO",
        "tier": "forte",
        "does": "Termos que psic\xF3logos buscam e lacunas de conte\xFAdo"
      }
    ],
    "auto": [
      "Monitorar e resumir"
    ],
    "aprova": [
      "Novo \xE2ngulo de mensagem"
    ],
    "humano": [],
    "limits": "S\xF3 fontes p\xFAblicas.",
    "learns": "Quais \xE2ngulos viraram conte\xFAdo que funcionou.",
    "note": null
  },
  {
    "id": "descoberta",
    "area": "produto",
    "ready": "pronto",
    "name": "Descoberta",
    "mission": "Juntar feedback, reclama\xE7\xF5es e uso, e ordenar o que construir por impacto em R$.",
    "metric": "Itens priorizados que viram entrega",
    "needs": "Feedback do Sucesso, tarefas da cl\xEDnica e uso da plataforma.",
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
        "does": "Ordena por reten\xE7\xE3o e receita em risco"
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
      "Decis\xE3o final do que construir"
    ],
    "limits": "Financeiro e estabilidade da cl\xEDnica entram na frente de recurso novo.",
    "learns": "Quais itens entregues de fato melhoraram a reten\xE7\xE3o.",
    "note": null
  },
  {
    "id": "especificacao",
    "area": "produto",
    "ready": "pronto",
    "name": "Especifica\xE7\xE3o",
    "mission": "Escrever a spec de cada item priorizado, com crit\xE9rio de aceite e rascunho de tela.",
    "metric": "Specs aprovadas e entregues",
    "needs": "Backlog priorizado pela Descoberta.",
    "triggers": [
      "Item aprovado no backlog"
    ],
    "subs": [
      {
        "name": "Redator de spec",
        "tier": "forte",
        "does": "Problema, solu\xE7\xE3o e crit\xE9rio de aceite"
      },
      {
        "name": "Prototipador",
        "tier": "forte",
        "does": "Rascunho de tela para validar r\xE1pido"
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
    "learns": "Onde voc\xEA costuma cortar escopo.",
    "note": null
  },
  {
    "id": "uso",
    "area": "produto",
    "ready": "nova",
    "name": "Analista de Uso",
    "mission": "Mostrar onde o usu\xE1rio trava dentro do produto e quais recursos ele usa.",
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
        "does": "O que \xE9 usado, por quem e com que frequ\xEAncia"
      }
    ],
    "auto": [
      "Analisar"
    ],
    "aprova": [
      "Hip\xF3tese de melhoria enviada ao Produto"
    ],
    "humano": [],
    "limits": "S\xF3 dados agregados por profissional. Nada de conte\xFAdo de paciente.",
    "learns": "Quais hip\xF3teses viraram melhoria real.",
    "note": "Depende de a plataforma registrar eventos de uso."
  },
  {
    "id": "lancamento",
    "area": "produto",
    "ready": "pronto",
    "name": "Lan\xE7amento",
    "mission": "Comunicar cada novidade ao cliente com changelog e tutorial.",
    "metric": "Recursos novos que os clientes de fato usam",
    "needs": "Entregas e tarefas conclu\xEDdas.",
    "triggers": [
      "Entrega publicada"
    ],
    "subs": [
      {
        "name": "Redator de changelog",
        "tier": "forte",
        "does": "O que mudou, na linguagem do psic\xF3logo"
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
    "mission": "Acompanhar o caminho at\xE9 R$ 1.200 e o custo de cada usu\xE1rio gratuito.",
    "metric": "MRR e margem",
    "needs": "Assinaturas v\xEAm da plataforma. Faltam Stripe e extrato banc\xE1rio.",
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
        "does": "Custo de IA e infraestrutura por agente e por usu\xE1rio"
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
      "Mudan\xE7a de pre\xE7o"
    ],
    "limits": "Somente leitura.",
    "learns": "Quais custos crescem mais r\xE1pido que a receita.",
    "note": null
  },
  {
    "id": "compliance",
    "area": "financeiro",
    "ready": "pronto",
    "name": "Conformidade e LGPD",
    "mission": "Revisar tudo que sai antes de chegar na sua fila e vigiar o que cada agente acessa.",
    "metric": "Propostas com problema barradas antes de chegar a voc\xEA",
    "needs": "Toda proposta de mensagem e conte\xFAdo, mais o registro de acessos.",
    "triggers": [
      "Toda proposta de mensagem ou conte\xFAdo",
      "Um agente pediu acesso novo"
    ],
    "subs": [
      {
        "name": "Revisor de conformidade",
        "tier": "forte",
        "does": "Promessa indevida, publicidade em psicologia e tom"
      },
      {
        "name": "Guardi\xE3o de consentimento",
        "tier": "leve",
        "does": "Confere o aceite de contato por WhatsApp"
      },
      {
        "name": "Auditor de acesso",
        "tier": "leve",
        "does": "Garante que nenhum agente toca dado cl\xEDnico de paciente"
      }
    ],
    "auto": [
      "Bloquear ou sinalizar"
    ],
    "aprova": [
      "Mudan\xE7a de pol\xEDtica de dados"
    ],
    "humano": [
      "Liberar uma exce\xE7\xE3o"
    ],
    "limits": "Filtro obrigat\xF3rio: nenhuma mensagem externa chega na fila sem passar por ele.",
    "learns": "Regras novas que voc\xEA pedir viram checagem permanente.",
    "note": null
  },
  {
    "id": "sdr",
    "area": "comercial",
    "ready": "parcial",
    "name": "SDR",
    "mission": "Conduzir a conversa de venda de cl\xEDnicas e de planos maiores.",
    "metric": "Reuni\xF5es realizadas",
    "needs": "Conversas ficam no CRM. WhatsApp oficial s\xF3 quando o volume justificar.",
    "triggers": [
      "Resposta de lead",
      "Reuni\xE3o sem comparecimento"
    ],
    "subs": [
      {
        "name": "Pesquisador de lead",
        "tier": "leve",
        "does": "Dossi\xEA curto antes do contato"
      },
      {
        "name": "Respondedor",
        "tier": "forte",
        "does": "Sugere a resposta no WhatsApp"
      },
      {
        "name": "Tratador de obje\xE7\xF5es",
        "tier": "forte",
        "does": "Usa o playbook para cada obje\xE7\xE3o"
      },
      {
        "name": "Agendador",
        "tier": "leve",
        "does": "Prop\xF5e hor\xE1rios e lembra da reuni\xE3o"
      }
    ],
    "auto": [],
    "aprova": [
      "Resposta a lead",
      "Convite de reuni\xE3o"
    ],
    "humano": [
      "Pre\xE7o, obje\xE7\xE3o e negocia\xE7\xE3o"
    ],
    "limits": "N\xE3o prospecta cl\xEDnica nova at\xE9 a atual estabilizar. Atende quem j\xE1 chegou.",
    "learns": "Obje\xE7\xF5es mais comuns e as respostas que funcionaram.",
    "note": null
  },
  {
    "id": "closer",
    "area": "comercial",
    "ready": "pronto",
    "name": "Closer Assist",
    "mission": "Preparar cada reuni\xE3o e fechar o que ficou aberto depois dela.",
    "metric": "Fechamentos",
    "needs": "Agenda, reuni\xF5es e transcri\xE7\xF5es do CRM atual.",
    "triggers": [
      "Reuni\xE3o marcada",
      "Reuni\xE3o conclu\xEDda"
    ],
    "subs": [
      {
        "name": "Preparador",
        "tier": "forte",
        "does": "Dossi\xEA de uma p\xE1gina antes da reuni\xE3o"
      },
      {
        "name": "Analista de reuni\xE3o",
        "tier": "forte",
        "does": "Resumo, obje\xE7\xF5es e pr\xF3ximo passo a partir da transcri\xE7\xE3o"
      },
      {
        "name": "Montador de proposta",
        "tier": "forte",
        "does": "Proposta de plano com base no que a pessoa disse"
      }
    ],
    "auto": [
      "Dossi\xEA",
      "Resumo da reuni\xE3o"
    ],
    "aprova": [
      "Proposta",
      "Follow-up"
    ],
    "humano": [
      "Condi\xE7\xF5es comerciais"
    ],
    "limits": "Prepara e resume. N\xE3o abre venda de cl\xEDnica nova at\xE9 a atual estabilizar.",
    "learns": "O que as reuni\xF5es que fecharam tinham em comum.",
    "note": "O CRM atual j\xE1 tem agenda e an\xE1lise de reuni\xE3o com IA."
  }
];

// packages/shared/src/demo.ts
function mockIntegrations() {
  const i = (x) => x;
  return [
    i({ id: "plataforma", name: "Plataforma Synapsa", state: "pendente", detail: "O mvp-v2 ainda n\xE3o grava os eventos do Brain. O PR com a tabela de eventos e as views de leitura n\xE3o foi aberto.", unlocks: "Cadastros, pacientes, uso e limite de 5 pacientes em tempo real.", secrets: ["BRAIN_RO_DATABASE_URL"], next: "Autorizar push no reposit\xF3rio mvp-v2 e criar o papel brain_ro.", syncMinutes: 4, agents: ["ativacao", "pagar", "saude", "metricas"] }),
    i({ id: "stripe", name: "Stripe", state: "pronto", detail: "Chave restrita recebida e guardada no cofre. Ainda n\xE3o est\xE1 nos secrets do Cloudflare.", unlocks: "MRR pelo valor com desconto, pagamentos falhos e fim de desconto.", secrets: ["STRIPE_READ_KEY"], next: "Colar a chave em wrangler secret put STRIPE_READ_KEY quando o Worker existir.", syncMinutes: 9, agents: ["financeiro", "cobranca", "guardiao"] }),
    i({ id: "meta", name: "Meta Ads", state: "pronto", detail: "IDs da conta de an\xFAncios, P\xE1gina e app registrados. Token do usu\xE1rio de sistema guardado no cofre.", unlocks: "Gasto, cliques e leads por campanha. Proposta de revis\xE3o quando gasta sem lead.", secrets: ["META_SYSTEM_USER_TOKEN"], next: "Colar o token nos secrets do Cloudflare. Trocar por um token s\xF3 de leitura antes do executor.", syncMinutes: 14, agents: ["midia", "alocador"] }),
    i({ id: "instagram", name: "Instagram", state: "pronto", detail: "Conta profissional vinculada \xE0 P\xE1gina. Usa o mesmo token da Meta.", unlocks: "Seguidores, alcance e visitas ao perfil. Publica o post que voc\xEA aprovar (precisa da permiss\xE3o instagram_content_publish no token e de imagem em link https).", secrets: ["META_SYSTEM_USER_TOKEN"], next: "Mesmo passo da Meta.", syncMinutes: 14, agents: ["conteudo"] }),
    i({ id: "whatsapp", name: "WhatsApp Business", state: "pendente", detail: "Conta ainda n\xE3o criada. Hoje voc\xEA envia pelo seu pr\xF3prio WhatsApp com o texto que o Brain prepara.", unlocks: "Receber respostas dos leads e registrar o aceite de contato.", secrets: ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_APP_SECRET"], next: "Criar a conta e verificar o neg\xF3cio na Meta. Depois ligar o webhook de entrada.", syncMinutes: null, agents: ["sdr", "ativacao", "pagar"] }),
    i({ id: "crm", name: "CRM Synapsa", state: "pendente", detail: "API REST do CRM Synapsa. Falta cadastrar SYNAPSA_CRM_API_BASE_URL e SYNAPSA_CRM_API_KEY nos secrets.", unlocks: "Leads, funil de vendas, atividades, reuni\xF5es e m\xE9tricas do CRM para o Comercial e o Chief. Os agentes s\xF3 leem; criar, editar e excluir existem no cliente do backend e s\xF3 rodam com ordem sua (exclus\xE3o, s\xF3 com confirma\xE7\xE3o).", secrets: ["SYNAPSA_CRM_API_KEY", "SYNAPSA_CRM_API_BASE_URL"], next: "Cadastrar os dois como Secret no Cloudflare. A chave expira em 27/10/2027.", syncMinutes: null, agents: ["sdr", "closer", "ativacao", "metricas", "chief"] }),
    i({ id: "apify", name: "Apify (prospec\xE7\xE3o)", state: "pendente", detail: "L\xEA o Google Maps e os sites das cl\xEDnicas. S\xF3 pesquisa, n\xE3o envia nada a ningu\xE9m.", unlocks: "Lista de cl\xEDnicas de SP, RJ e MG com equipe, e-mail p\xFAblico e nota, pronta para o CRM depois do seu OK.", secrets: ["APIFY_TOKEN"], next: "Criar o token em console.apify.com > Settings > API & Integrations e guardar como APIFY_TOKEN.", syncMinutes: null, agents: [] }),
    i({ id: "resend", name: "Resend (e-mail)", state: "pendente", detail: "Dom\xEDnio synapsa.chat definido. Falta verificar o subdom\xEDnio de envio e criar a chave.", unlocks: "E-mail de reten\xE7\xE3o e de fim de desconto, enviado s\xF3 depois da sua aprova\xE7\xE3o.", secrets: ["RESEND_API_KEY", "RESEND_FROM"], next: "Criar a chave (Sending access) e o secret RESEND_FROM, ex.: Felipe da Synapsa <felipe@mail.synapsa.chat>. Opcional: RESEND_REPLY_TO.", syncMinutes: null, agents: ["cobranca", "saude", "lancamento"] }),
    i({ id: "linkedin", name: "LinkedIn", state: "manual", detail: "Sem API. O Brain prepara a mensagem e voc\xEA envia pelo seu perfil.", unlocks: "Fila de abordagens prontas, com a resposta de cada lead registrada \xE0 m\xE3o.", secrets: [], next: 'Nada a colar. Marque "enviada" na fila para o Brain acompanhar.', syncMinutes: null, agents: ["prospeccao", "sdr"] }),
    i({ id: "google", name: "Google (Calendar, GA4, Search Console)", state: "pendente", detail: "Ainda n\xE3o conectado.", unlocks: "Reuni\xF5es do Closer Assist, tr\xE1fego do site e termos de busca para o SEO.", secrets: ["GOOGLE_OAUTH_REFRESH_TOKEN"], next: "Criar o acesso OAuth com escopos s\xF3 de leitura.", syncMinutes: 30, agents: ["closer", "inteligencia", "metricas"] }),
    i({ id: "openai", name: "OpenAI API", state: "pendente", detail: "Chave ainda n\xE3o criada. Crie uma com limite mensal de gasto.", unlocks: "O racioc\xEDnio de todos os agentes e do Jarvis.", secrets: ["OPENAI_API_KEY"], next: "Criar a chave em platform.openai.com e definir um teto mensal de R$ 300.", syncMinutes: 1, agents: ["chief"] }),
    i({ id: "supabase", name: "Supabase do Brain", state: "pendente", detail: "Migrations prontas e testadas. O projeto ainda n\xE3o existe.", unlocks: "Guardar propostas, aprova\xE7\xF5es, auditoria e o kill switch.", secrets: ["SUPABASE_SERVICE_KEY"], next: "Escolher a organiza\xE7\xE3o e criar o projeto em sa-east-1.", syncMinutes: 1, agents: ["chief", "compliance"] }),
    i({ id: "cloudflare", name: "Cloudflare Workers", state: "pendente", detail: "C\xF3digo do worker pronto e testado. Falta a conta paga e o token de deploy.", unlocks: "Rodar os agentes todo dia \xE0s 7h e a leitura de Stripe e Meta.", secrets: ["CLOUDFLARE_API_TOKEN"], next: "Ativar o plano pago e criar um token restrito.", syncMinutes: 1, agents: ["guardiao"] })
  ];
}

// packages/shared/src/teams.ts
var TEAMS = [
  { id: "marketing", name: "Marketing", blurb: "Atrai psic\xF3logos: LinkedIn, Instagram, an\xFAncios, indica\xE7\xE3o e mercado.", areas: ["aquisicao"], hue: "--t-marketing" },
  { id: "comercial", name: "Comercial", blurb: "Ativa o cadastro, converte no limite de 5 pacientes e conduz as conversas de venda.", areas: ["ativacao", "comercial"], hue: "--t-comercial" },
  { id: "estrategia", name: "Estrat\xE9gia", blurb: "Prioriza o seu dia, mede o funil, cuida do caixa e da conformidade.", areas: ["comando", "growth", "financeiro"], hue: "--t-estrategia" },
  { id: "produto", name: "Produto", blurb: "Transforma feedback e uso em backlog, spec e lan\xE7amento.", areas: ["produto"], hue: "--t-produto" },
  { id: "sucesso", name: "Sucesso", blurb: "Segura os pagantes, cobra o que falhou e cuida da cl\xEDnica.", areas: ["sucesso", "clinica"], hue: "--t-sucesso" }
];

// packages/shared/src/jarvis.ts
var norm = (s2) => s2.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
var brl = (n3) => n3.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n3 % 1 ? 2 : 0 });
var ALIASES = {
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
  closer: ["closer"]
};
function findAgent(input) {
  const q = norm(input);
  let best;
  for (const a of AGENTS) {
    for (const alias of ALIASES[a.id] ?? [norm(a.name)]) {
      if (q.includes(alias) && (!best || alias.length > best.len)) best = { a, len: alias.length };
    }
  }
  return best?.a;
}
var TASK_VERBS = /(faca|faz|rode|rodar|concilie|analise|prepare|monte|escreva|revise|verifique|pesquise|calcule|gere|audite|compile|atualize|levante|mande|manda|peca|pede|pedir|ordene)/;
function ago(now, at) {
  const m = Math.max(1, Math.round((now - at) / 6e4));
  if (m < 60) return `h\xE1 ${m} min`;
  const h = Math.round(m / 60);
  return `h\xE1 ${h} h`;
}
function respond(input, v) {
  const M = v.metrics;
  const q = norm(input).trim();
  const pending = v.proposals.filter((p) => p.status === "pendente");
  const agent = findAgent(input);
  if (/(parar|pare|desligar|desligue|pausar) tudo|kill ?switch|emergencia/.test(q)) {
    if (v.kill) return { text: 'O bot\xE3o de emerg\xEAncia j\xE1 est\xE1 ligado. Nada roda e nenhuma aprova\xE7\xE3o passa. Para religar, diga "retomar tudo".' };
    return { text: "Isso para todos os 24 agentes e bloqueia qualquer aprova\xE7\xE3o at\xE9 voc\xEA religar. Confirma?", confirm: { label: "Parar tudo", action: { type: "kill_on" } } };
  }
  if (/(retomar|religar|reativar|desativar) (tudo|o kill)|voltar ao normal/.test(q)) {
    if (!v.kill) return { text: "O bot\xE3o de emerg\xEAncia est\xE1 desligado. Os agentes j\xE1 est\xE3o rodando normal." };
    return { text: "Isso religa os agentes e libera as aprova\xE7\xF5es. Confirma?", confirm: { label: "Retomar tudo", action: { type: "kill_off" } } };
  }
  if (/(rotina|ciclo) (do dia|diaria)|rode o dia|rodar o dia|atualize tudo/.test(q)) {
    if (v.kill) return { text: "O bot\xE3o de emerg\xEAncia est\xE1 ligado. Religue antes de rodar a rotina." };
    return { text: "Rotina do dia iniciada: Guardi\xE3o fecha o MRR, Financeiro compara com a meta, M\xEDdia Paga l\xEA os an\xFAncios e, por \xFAltimo, o Chief monta o briefing.", action: { type: "daily" } };
  }
  if (agent && /\b(pausar|pause|pare|suspenda)\b/.test(q)) {
    return { text: `${agent.name} pausado. Ele n\xE3o roda nem prop\xF5e at\xE9 voc\xEA retomar.`, action: { type: "pause", agentId: agent.id } };
  }
  if (agent && /\b(retomar|retome|ligar|ligue|reative|volte)\b/.test(q)) {
    return { text: `${agent.name} de volta. Ele roda no pr\xF3ximo gatilho.`, action: { type: "resume", agentId: agent.id } };
  }
  if (agent && (TASK_VERBS.test(q) || /\b(para|pra)\b/.test(q))) {
    if (v.kill) return { text: "O bot\xE3o de emerg\xEAncia est\xE1 ligado. Religue antes de dar tarefa a um agente." };
    const task = input.replace(/^(.*?)(para|pra|:)\s+/i, "").trim() || `trabalho pedido por voc\xEA`;
    const needsApproval = agent.aprova.length > 0;
    return {
      text: `${agent.name} come\xE7ou. ${needsApproval ? "O que ele preparar chega na sua fila para aprova\xE7\xE3o." : "\xC9 uma an\xE1lise interna e o resultado aparece no feed de hoje."}`,
      action: { type: "task", agentId: agent.id, task }
    };
  }
  if (/aprov(e|ar|a)\b.*(baixo|simples|seguras|rotina)/.test(q)) {
    const low = pending.filter((p) => p.risk === "baixo");
    if (v.kill) return { text: "O bot\xE3o de emerg\xEAncia est\xE1 ligado, ent\xE3o nenhuma aprova\xE7\xE3o passa." };
    if (low.length === 0) return { text: "N\xE3o h\xE1 propostas de baixo risco esperando." };
    const total = low.reduce((n3, p) => n3 + p.impactoBrl, 0);
    return {
      text: `S\xE3o ${low.length} propostas de baixo risco, somando ${brl(total)} de impacto. Aprovar n\xE3o envia nada: voc\xEA copia e manda cada mensagem. Confirma?`,
      confirm: { label: `Aprovar ${low.length}`, action: { type: "approve_low_risk" } }
    };
  }
  if (agent) {
    const r = v.runtime[agent.id];
    const mine = pending.filter((p) => p.agentId === agent.id).length;
    if (!r) return { text: `${agent.name} ainda n\xE3o rodou.` };
    return {
      text: `${agent.name}: ${r.status === "trabalhando" ? "trabalhando agora" : r.status === "pausado" ? "pausado" : "aguardando o pr\xF3ximo gatilho"}. \xDAltima a\xE7\xE3o ${ago(v.now, r.lastAt)}: ${r.lastAction} Hoje rodou ${r.runsToday} vezes e custou ${brl(r.costBrl)}. ${mine ? `Tem ${mine} proposta(s) na sua fila.` : "Nada dele na sua fila."}`
    };
  }
  if (/(desconto|reajuste|renova)/.test(q)) {
    const linhas = M.descontos.map((d) => `${d.quando}: ${d.contas} conta(s) sobem de ${brl(d.de)} para ${brl(d.para)}`).join("; ");
    return { text: `Fins de desconto \xE0 vista: ${linhas}. Quem entrou com R$ 79 tamb\xE9m sobe para R$ 119 seis meses depois. O Brain abre um contato 30 dias antes de cada uma, para voc\xEA ligar. Nenhum agente oferece desconto.` };
  }
  if (/(mrr|receita|faturamento|meta|1200|caixa)/.test(q)) {
    const { total, goal, stripe, pix, manual, essencialPrice } = M.mrr;
    const falta = Math.max(0, goal - total);
    const partes = [`${brl(stripe)} no Stripe`, `${brl(pix)} por Pix`, ...manual ? [`${brl(manual)} lan\xE7ados \xE0 m\xE3o`] : []].join(", ");
    const limite = M.funil ? ` H\xE1 ${M.funil.noLimite} profissionais no limite de pacientes agora.` : "";
    return { text: `MRR de ${brl(total)}: ${partes}. Faltam ${brl(falta)} para os ${brl(goal)} de ${M.mrr.goalDate}, o que s\xE3o cerca de ${Math.ceil(falta / essencialPrice)} Essenciais a ${brl(essencialPrice)}.${limite}` };
  }
  if (/(funil|ativa|cadastro|conversao|limite)/.test(q)) {
    const f = M.funil;
    if (!f) return { text: "Ainda n\xE3o tenho o funil: a plataforma n\xE3o est\xE1 mandando cadastros e uso para o Brain. Quando o PR do mvp-v2 entrar, eu passo a responder isso." };
    return { text: `Funil de hoje: ${f.cadastros} cadastros, ${f.ativados} ativados, ${f.noLimite} no limite de 5 pacientes e ${f.pagantes} pagantes. Os ${f.noLimite} no limite s\xE3o a convers\xE3o mais pr\xF3xima. O Momento de Pagar j\xE1 tem convite pronto para a fila.` };
  }
  if (/(integra|conect|credenc|api|saude das)/.test(q)) {
    const by = (s2) => v.integrations.filter((i) => i.state === s2);
    const pendentes = by("pendente").map((i) => i.name).join(", ");
    return { text: `${by("conectado").length} integra\xE7\xF5es ligadas, ${by("pronto").length} com credencial pronta esperando o Worker, ${by("manual").length} manual e ${by("pendente").length} pendentes${pendentes ? ` (${pendentes})` : ""}. As que travam mais agentes s\xE3o Plataforma e Supabase.` };
  }
  if (/(custo|gasto|token|\bia\b)/.test(q)) {
    const dia5 = Object.values(v.runtime).reduce((n3, r) => n3 + r.costBrl, 0);
    return { text: `Hoje os agentes custaram ${brl(dia5)}. No m\xEAs: ${brl(M.llmSpentMonthBrl)} de ${brl(M.llmCapMonthlyBrl)} de teto, ${Math.round(M.llmSpentMonthBrl / M.llmCapMonthlyBrl * 100)}% usado.` };
  }
  if (/(fila|aprova|pendente|propost|decis)/.test(q)) {
    if (pending.length === 0) return { text: "Fila vazia. Nada espera por voc\xEA." };
    const top = [...pending].sort((a, b) => b.impactoBrl - a.impactoBrl).slice(0, 3);
    return { text: `${pending.length} propostas esperando. As maiores: ${top.map((p) => `${p.title} (${brl(p.impactoBrl)})`).join("; ")}. Diga "aprove as de baixo risco" ou abra a aba Aprova\xE7\xF5es.` };
  }
  if (/(quem|agentes|trabalhando|time|equipe)/.test(q)) {
    const work = AGENTS.filter((a) => v.runtime[a.id]?.status === "trabalhando");
    const paused = AGENTS.filter((a) => v.runtime[a.id]?.status === "pausado");
    const teams = TEAMS.map((t) => `${t.name} ${AGENTS.filter((a) => t.areas.includes(a.area)).length}`).join(", ");
    return { text: `24 agentes em 5 times (${teams}). Trabalhando agora: ${work.map((a) => a.name).join(", ") || "ningu\xE9m"}. ${paused.length ? `Pausados: ${paused.map((a) => a.name).join(", ")}.` : "Nenhum pausado."}` };
  }
  if (/(o que (aconteceu|rolou|fizeram)|resumo|hoje|enquanto|briefing|novidade)/.test(q)) {
    const recent = Object.values(v.runtime).reduce((n3, r) => n3 + r.runsToday, 0);
    const alert = pending.filter((p) => p.risk !== "baixo").length;
    return { text: `Enquanto voc\xEA esteve fora: ${recent} execu\xE7\xF5es dos agentes, MRR em ${brl(M.mrr.total)}, ${pending.length} propostas na fila (${alert} pedem aten\xE7\xE3o).${v.kill ? " O bot\xE3o de emerg\xEAncia est\xE1 ligado." : ""} Abra a aba Hoje para a linha do tempo.` };
  }
  return {
    text: 'Posso resumir o dia, mostrar o MRR e o funil, listar a fila, checar integra\xE7\xF5es e custo. Tamb\xE9m executo: "pe\xE7a ao Guardi\xE3o para conciliar a base", "pause a M\xEDdia Paga", "aprove as de baixo risco", "pare tudo".'
  };
}

// packages/shared/src/playbooks.ts
var CONTEXTO2 = `Contexto fixo: a Synapsa \xE9 uma plataforma de IA para psic\xF3logos aut\xF4nomos e cl\xEDnicas no Brasil. Plano gr\xE1tis at\xE9 5 pacientes; plano Essencial a R$ 79 (R$ 119 de tabela). Meta: R$ 1.200 de MRR at\xE9 31/12/2026. Nunca ofere\xE7a desconto, nunca prometa resultado cl\xEDnico, nunca cite paciente. Use consultar_dados antes de afirmar qualquer n\xFAmero do neg\xF3cio.`;
var ENTREGA2 = `Entregue pelo relatorio: "resumo" com 1 ou 2 frases e "entrega" com o documento completo em texto (t\xEDtulos curtos, listas, n\xFAmeros com a fonte). Se faltar dado, diga o que falta e como obter. Termine com "Pr\xF3ximas 3 a\xE7\xF5es" ordenadas por impacto em R$.`;
var step = (agentId, titulo2, instrucao, web = false) => ({ agentId, titulo: titulo2, instrucao: `${instrucao}

${CONTEXTO2}
${ENTREGA2}`, web });
var PLAYBOOKS = [
  // ───────── Marketing
  {
    id: "mkt-mercado",
    team: "marketing",
    titulo: "Mapa de mercado e concorrentes",
    objetivo: "Saber contra quem a Synapsa compete, como se posiciona e que \xE2ngulo de mensagem est\xE1 livre.",
    sintese: true,
    passos: [
      step("inteligencia", "Concorrentes e pre\xE7os", "Pesquise na web as plataformas e softwares de gest\xE3o de consult\xF3rio e prontu\xE1rio para psic\xF3logos no Brasil. Para cada uma (m\xEDnimo 6): pre\xE7o, plano gr\xE1tis, promessa principal, pontos fracos citados por usu\xE1rios, e como se vendem. Monte uma tabela comparativa com a Synapsa e aponte 3 \xE2ngulos de mensagem que ningu\xE9m est\xE1 usando.", true),
      step("inteligencia", "Demanda e busca", "Pesquise na web o que psic\xF3logos aut\xF4nomos buscam sobre captar pacientes, organizar consult\xF3rio, agenda, prontu\xE1rio e IA. Liste 15 temas por relev\xE2ncia, com a dor por tr\xE1s de cada um e um t\xEDtulo de conte\xFAdo para cada.", true)
    ]
  },
  {
    id: "mkt-semana",
    team: "marketing",
    titulo: "Plano de conte\xFAdo da semana",
    objetivo: "Cinco posts prontos para o Instagram, baseados no que j\xE1 funcionou no perfil.",
    sintese: false,
    passos: [step("conteudo", "Calend\xE1rio e textos", "Consulte os dados do Instagram (posts recentes, curtidas, coment\xE1rios) e identifique os 2 formatos e temas que mais engajaram. Monte 5 posts para a pr\xF3xima semana (gancho, roteiro ou legenda pronta, chamada para a\xE7\xE3o sem prometer resultado). Proponha cada um com a ferramenta propor (canal instagram), para eu aprovar e publicar.")]
  },
  {
    id: "mkt-anuncios",
    team: "marketing",
    titulo: "Revis\xE3o de an\xFAncios e teste de campanha",
    objetivo: "Decidir se vale rodar an\xFAncio agora, com que oferta e que or\xE7amento de teste.",
    sintese: true,
    passos: [
      step("midia", "Leitura dos an\xFAncios", "Consulte os dados de an\xFAncios dos \xFAltimos 30 dias (com atualizar=true). Diga quanto gastou, o custo por lead e o que funcionou ou n\xE3o. Se a conta est\xE1 parada, diga isso sem rodeio e descreva o que precisa existir antes de voltar (p\xE1gina de destino, oferta do plano gr\xE1tis at\xE9 5 pacientes, evento de lead)."),
      step("alocador", "Onde p\xF4r o dinheiro", "Com os dados de receita e de an\xFAncios, proponha como dividir um or\xE7amento de teste de R$ 1.500 a R$ 3.000 entre an\xFAncios (Meta), conte\xFAdo, indica\xE7\xE3o e prospec\xE7\xE3o, com custo de aquisi\xE7\xE3o esperado por canal e o crit\xE9rio para escalar ou encerrar em 14 dias. Seja expl\xEDcito sobre o que \xE9 estimativa.")
    ]
  },
  {
    id: "mkt-prospeccao",
    team: "marketing",
    titulo: "Esteira de prospec\xE7\xE3o no LinkedIn",
    objetivo: "Definir quem abordar, com que mensagem e em que cad\xEAncia, sem lista de pessoas.",
    sintese: false,
    passos: [step("prospeccao", "Perfil ideal e abordagem", "Defina o perfil ideal de psic\xF3logo aut\xF4nomo para a Synapsa (tempo de carreira, n\xFAmero de pacientes, dores) e os crit\xE9rios para filtrar no LinkedIn. Escreva 3 mensagens de abordagem (conex\xE3o, primeira conversa, follow-up em 3 dias) sem prometer resultado e sem desconto. Descreva a cad\xEAncia e a m\xE9trica de sucesso. N\xE3o monte lista de pessoas: eu fa\xE7o a busca e o envio.", true)]
  },
  {
    id: "mkt-indicacao",
    team: "marketing",
    titulo: "Programa de indica\xE7\xE3o",
    objetivo: "Fazer os 7 clientes atuais trazerem colegas, sem oferecer desconto.",
    sintese: false,
    passos: [step("indicacao", "Desenho do programa", "Desenhe um programa de indica\xE7\xE3o para os clientes atuais que n\xE3o envolva desconto: como pedir, em que momento, mensagem pronta para eu enviar por WhatsApp, e como medir. Use consultar_dados clientes para saber quem s\xE3o. Proponha as mensagens com a ferramenta propor (canal whatsapp, com contact_ref do cliente).")]
  },
  // ───────── Comercial
  {
    id: "com-clinicas",
    team: "comercial",
    titulo: "Playbook de venda para cl\xEDnicas",
    objetivo: "Roteiro completo para vender a cl\xEDnicas, com obje\xE7\xF5es e cad\xEAncia.",
    sintese: false,
    passos: [step("sdr", "Roteiro e obje\xE7\xF5es", "Escreva o playbook de venda para cl\xEDnicas de psicologia: perguntas de qualifica\xE7\xE3o, roteiro da primeira conversa, as 8 obje\xE7\xF5es mais prov\xE1veis com resposta, cad\xEAncia de follow-up (m\xEDnimo 3 dias entre contatos) e crit\xE9rios para desistir. Use o caso da cl\xEDnica que j\xE1 \xE9 cliente (consultar_dados clientes) como refer\xEAncia de valor, sem expor dados dela.", true)]
  },
  {
    id: "com-fechamento",
    team: "comercial",
    titulo: "Preparar reuni\xE3o e fechamento",
    objetivo: "Checklist e material para qualquer reuni\xE3o de venda.",
    sintese: false,
    passos: [step("closer", "Kit de reuni\xE3o", "Monte o kit de reuni\xE3o de venda: pauta de 30 minutos, perguntas, demonstra\xE7\xE3o sugerida do produto, como tratar pre\xE7o (sem desconto: mostre valor e o plano gr\xE1tis at\xE9 5 pacientes), proposta de pr\xF3ximos passos e e-mail de resumo p\xF3s-reuni\xE3o para eu enviar.")]
  },
  {
    id: "com-ativacao",
    team: "comercial",
    titulo: "Ativa\xE7\xE3o do plano gr\xE1tis",
    objetivo: "Levar cadastro at\xE9 perfil publicado e primeiro paciente, e preparar o convite ao Essencial.",
    sintese: true,
    passos: [
      step("ativacao", "Sequ\xEAncia de ativa\xE7\xE3o", "Desenhe a sequ\xEAncia de mensagens do cadastro at\xE9 o primeiro paciente real (dia 0, 1, 3, 7), com o texto de cada uma. Diga quais dados do funil faltam para medir cada etapa (a plataforma ainda n\xE3o alimenta o Brain com cadastros) e como instrumentar."),
      step("pagar", "Convite ao Essencial", "Desenhe o gatilho e o texto do convite ao Essencial quando o psic\xF3logo chega perto do limite de 5 pacientes. Sem desconto e sem press\xE3o artificial. Diga o que precisa existir na plataforma para o Brain detectar o momento.")
    ]
  },
  // ───────── Estratégia
  {
    id: "est-mrr",
    team: "estrategia",
    titulo: "Plano para R$ 1.200 de MRR at\xE9 31/12",
    objetivo: "Caminho num\xE9rico da receita atual at\xE9 a meta, com cen\xE1rios e prazos.",
    sintese: true,
    passos: [
      step("financeiro", "Conta e cen\xE1rios", "Consulte receita e clientes. Calcule quantos clientes novos do Essencial a R$ 79 faltam, quantos por semana at\xE9 31/12, o efeito dos fins de desconto (quem passa de R$ 49 para R$ 119,99 e o risco de cancelar) e monte 3 cen\xE1rios (conservador, base, agressivo) com a premissa de cada um."),
      step("alocador", "Canais para chegar l\xE1", "Dado o n\xFAmero de clientes novos necess\xE1rio, diga quantos cadastros, ativa\xE7\xF5es e convers\xF5es isso exige com taxas realistas de SaaS B2B pequeno (marque como estimativa) e que canal entrega isso ao menor custo.")
    ]
  },
  {
    id: "est-semana",
    team: "estrategia",
    titulo: "Revis\xE3o semanal do neg\xF3cio",
    objetivo: "Uma leitura \xFAnica: receita, clientes, an\xFAncios, Instagram, fila e o que fazer primeiro.",
    sintese: true,
    passos: [
      step("metricas", "N\xFAmeros da semana", "Consulte receita, clientes, an\xFAncios (atualizar=true) e Instagram (atualizar=true). Resuma o que mudou, o que preocupa e o que est\xE1 funcionando, com n\xFAmeros."),
      step("experimentos", "Experimento da semana", "Escolha UM experimento para a semana com hip\xF3tese, m\xE9trica, dura\xE7\xE3o e crit\xE9rio de escalar ou encerrar, ligado a ativa\xE7\xE3o ou receita.")
    ]
  },
  {
    id: "est-conformidade",
    team: "estrategia",
    titulo: "Auditoria de conformidade e LGPD",
    objetivo: "Conferir o que o Brain acessa e o que sai, e o que falta para operar com seguran\xE7a.",
    sintese: false,
    passos: [step("compliance", "Auditoria", "Revise o que o Brain l\xEA (Stripe, Meta, Instagram), onde ficam os dados, quem acessa, e o que as regras de Conformidade barram. Aponte riscos de LGPD para uma plataforma que atende psic\xF3logos (dados de pacientes ficam fora do Brain) e liste ajustes por prioridade.", true)]
  },
  // ───────── Produto
  {
    id: "prod-mercado",
    team: "produto",
    titulo: "Recursos que o mercado oferece",
    objetivo: "O que concorrentes e psic\xF3logos esperam do produto e onde a Synapsa pode ganhar.",
    sintese: true,
    passos: [
      step("descoberta", "Pesquisa de recursos", "Pesquise na web os recursos de plataformas de gest\xE3o para psic\xF3logos no Brasil (agenda, prontu\xE1rio, cobran\xE7a, teleatendimento, IA, ades\xE3o do paciente). Monte uma matriz recurso x concorrente, aponte lacunas e o que os psic\xF3logos mais reclamam.", true),
      step("especificacao", "Spec do item mais promissor", "Pegue o recurso de maior impacto em reten\xE7\xE3o e ades\xE3o do paciente (foco da Synapsa) e escreva a especifica\xE7\xE3o: problema, usu\xE1rio, crit\xE9rios de aceite, rascunho de tela em texto e como medir sucesso.")
    ]
  },
  {
    id: "prod-uso",
    team: "produto",
    titulo: "Onde o usu\xE1rio trava",
    objetivo: "Diagn\xF3stico de uso e plano para medir.",
    sintese: false,
    passos: [step("uso", "Diagn\xF3stico", "Diga o que j\xE1 d\xE1 para saber do uso (hoje a plataforma ainda n\xE3o envia eventos ao Brain), quais eventos precisam ser enviados (cadastro, perfil publicado, primeiro paciente, limite de 5) e escreva a lista de eventos com nome e propriedades para o time de produto implementar.")]
  },
  {
    id: "prod-lancamento",
    team: "produto",
    titulo: "Plano de lan\xE7amento de novidade",
    objetivo: "Changelog, tutorial e aviso para cada lan\xE7amento.",
    sintese: false,
    passos: [step("lancamento", "Kit de lan\xE7amento", "Monte o modelo de lan\xE7amento: changelog curto, roteiro de tutorial em 60 segundos, mensagem de aviso para os clientes (WhatsApp e e-mail) e post para o Instagram. Deixe os campos a preencher claros para eu usar a cada novidade.")]
  },
  // ───────── Sucesso
  {
    id: "suc-saude",
    team: "sucesso",
    titulo: "Sa\xFAde dos pagantes e risco de cancelar",
    objetivo: "Plano de contato com cada cliente, principalmente os que t\xEAm desconto acabando.",
    sintese: false,
    passos: [step("saude", "Plano por cliente", "Consulte clientes e receita. Para cada cliente ativo diga o risco de cancelar (e por qu\xEA), o melhor momento de contato antes do fim do desconto e o roteiro da conversa (sem oferecer desconto, mostrando valor). Proponha o contato dos 3 mais urgentes com a ferramenta propor (canal tarefa).")]
  },
  {
    id: "suc-cobranca",
    team: "sucesso",
    titulo: "Recupera\xE7\xE3o de pagamentos",
    objetivo: "Fluxo para pagamento que falha, sem desgastar o cliente.",
    sintese: false,
    passos: [step("cobranca", "Fluxo de cobran\xE7a", "Desenhe o fluxo para pagamento falho (Stripe) e atraso de Pix: mensagens nos dias 0, 3 e 7, tom, o que nunca dizer, e quando eu entro pessoalmente. Considere que hoje o Pix \xE9 informado por mim e n\xE3o lido de um banco.")]
  },
  {
    id: "suc-clinica",
    team: "sucesso",
    titulo: "Conta da cl\xEDnica",
    objetivo: "Cuidar da conta de R$ 300 por m\xEAs: o que reportar e como crescer dentro dela.",
    sintese: false,
    passos: [step("relclinica", "Relat\xF3rio e expans\xE3o", "Monte o modelo do relat\xF3rio semanal para a cl\xEDnica (o que foi resolvido, em andamento, pr\xF3ximos passos) e um plano de expans\xE3o dentro da conta (mais profissionais usando) sem desconto. Sem dado cl\xEDnico.")]
  }
];
var playbookById = (id) => PLAYBOOKS.find((p) => p.id === id);

// packages/core/src/emitter.ts
var Emitter = class {
  handlers = /* @__PURE__ */ new Map();
  on(ev, fn) {
    (this.handlers.get(ev) ?? this.handlers.set(ev, /* @__PURE__ */ new Set()).get(ev)).add(fn);
    return this;
  }
  off(ev, fn) {
    this.handlers.get(ev)?.delete(fn);
    return this;
  }
  emit(ev, ...args) {
    const set = this.handlers.get(ev);
    if (!set?.size) return false;
    for (const fn of [...set]) fn(...args);
    return true;
  }
};

// packages/core/src/mrr.ts
var couponOf = (d) => {
  const c2 = d.source?.coupon ?? d.coupon;
  return c2 && typeof c2 === "object" ? c2 : null;
};
var ACTIVE = /* @__PURE__ */ new Set(["active", "trialing", "past_due"]);
function listMonthlyBrl(sub) {
  let cents = 0;
  for (const it of sub.items.data) {
    const unit = it.price.unit_amount ?? 0;
    const qty = it.quantity ?? 1;
    const interval = it.price.recurring?.interval ?? "month";
    const count = it.price.recurring?.interval_count ?? 1;
    const months = interval === "year" ? 12 * count : interval === "month" ? count : interval === "week" ? count / 4.345 : 1;
    cents += unit * qty / months;
  }
  return round2(cents / 100);
}
function effectiveMonthlyBrl(sub) {
  let value = listMonthlyBrl(sub);
  for (const d of sub.discounts ?? []) {
    const c2 = couponOf(d);
    if (!c2) continue;
    if (c2.percent_off) value *= 1 - c2.percent_off / 100;
    else if (c2.amount_off) value -= c2.amount_off / 100;
  }
  return round2(Math.max(value, 0));
}
function discountEndsAt(sub) {
  const ends = (sub.discounts ?? []).map((d) => d.end).filter((e) => typeof e === "number");
  if (ends.length === 0) return null;
  return new Date(Math.min(...ends) * 1e3).toISOString();
}
function stripeToRow(sub) {
  return {
    source: "stripe",
    external_id: sub.id,
    professional_id: null,
    label: sub.customer,
    list_price_brl: listMonthlyBrl(sub),
    effective_price_brl: effectiveMonthlyBrl(sub),
    discount_ends_at: discountEndsAt(sub),
    status: sub.status
  };
}
function isActive(row3) {
  return ACTIVE.has(row3.status);
}
function mrrBySource(rows2) {
  const bySource = {
    stripe: { mrr: 0, count: 0 },
    platform: { mrr: 0, count: 0 },
    manual: { mrr: 0, count: 0 },
    pix: { mrr: 0, count: 0 }
  };
  for (const r of rows2) {
    if (!isActive(r)) continue;
    bySource[r.source].mrr = round2(bySource[r.source].mrr + r.effective_price_brl);
    bySource[r.source].count += 1;
  }
  const total = round2(bySource.stripe.mrr + bySource.manual.mrr + bySource.pix.mrr);
  return { bySource, total };
}
function reconcile(stripeRows, platformRows, toleranceBrl = 0.5) {
  const s2 = new Map(stripeRows.filter(isActive).map((r) => [r.external_id, r.effective_price_brl]));
  const p = new Map(platformRows.filter(isActive).map((r) => [r.external_id, r.effective_price_brl]));
  const out = [];
  for (const id of /* @__PURE__ */ new Set([...s2.keys(), ...p.keys()])) {
    const a = s2.get(id) ?? null;
    const b = p.get(id) ?? null;
    if (a === null || b === null || Math.abs(a - b) > toleranceBrl) out.push({ external_id: id, stripe_brl: a, platform_brl: b });
  }
  return out;
}
function endingDiscounts(rows2, now, windowDays) {
  const out = [];
  for (const r of rows2) {
    if (!isActive(r) || !r.discount_ends_at) continue;
    const ms2 = new Date(r.discount_ends_at).getTime() - now.getTime();
    const days = Math.ceil(ms2 / 864e5);
    if (days < 0 || days > windowDays) continue;
    out.push({ row: r, days_left: days, mrr_gain_brl: round2(r.list_price_brl - r.effective_price_brl) });
  }
  return out.sort((a, b) => a.days_left - b.days_left);
}
function round2(n3) {
  return Math.round(n3 * 100) / 100;
}

// packages/core/src/envio.ts
var EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
function envioOf(payload) {
  try {
    const e = JSON.parse(payload ?? "{}").envio;
    return e && (e.tipo === "email" || e.tipo === "instagram") ? e : null;
  } catch {
    return null;
  }
}

// packages/core/src/sql.ts
var SCHEMA = `
create table if not exists agent_state (
  agent_id text primary key,
  paused integer not null default 0,
  status text not null default 'ocioso',
  last_action text,
  last_at integer
);
create table if not exists agent_runs (
  id integer primary key autoincrement,
  agent_id text not null,
  task text not null,
  status text not null,            -- queued, running, done, blocked, error
  requested_by text not null default 'sistema',
  created_at integer not null,
  finished_at integer,
  cost_brl real not null default 0,
  result text,
  error text
);
create table if not exists proposals (
  id text primary key,
  agent_id text not null,
  kind text not null,
  title text not null,
  draft text,
  why text not null,
  impacto_brl real not null default 0,
  risk text not null,
  channel text not null,
  status text not null default 'pendente',
  review text not null default 'aprovada pela conformidade',
  review_note text,
  contact_ref text,
  payload text not null default '{}',
  dedupe_key text unique,
  created_at integer not null,
  decided_at integer
);
create table if not exists approvals (
  id integer primary key autoincrement,
  proposal_id text not null references proposals(id),
  decision text not null,
  actor text not null,
  at integer not null
);
create table if not exists activity (
  id integer primary key autoincrement,
  agent_id text not null,
  text text not null,
  tone text not null default 'normal',
  at integer not null
);
create table if not exists kill_switch (
  id integer primary key check (id = 1),
  engaged integer not null default 0,
  changed_at integer not null
);
create table if not exists subscriptions (
  source text not null,
  external_id text not null,
  professional_id text,
  label text,
  list_price_brl real not null,
  effective_price_brl real not null,
  discount_ends_at text,
  status text not null,
  origin text not null default 'sincronizado',  -- informado (por voc\xEA) ou sincronizado (da fonte)
  updated_at integer not null,
  primary key (source, external_id)
);
create table if not exists mrr_daily (
  day text not null,
  source text not null,
  mrr_brl real not null,
  subs_count integer not null,
  primary key (day, source)
);
create table if not exists consents (
  contact_ref text not null,
  channel text not null,
  granted_at integer not null,
  revoked_at integer,
  primary key (contact_ref, channel)
);
create table if not exists contact_log (
  id integer primary key autoincrement,
  contact_ref text not null,
  channel text not null,
  proposal_id text,
  at integer not null
);
create table if not exists envios (
  id integer primary key autoincrement,
  proposal_id text,
  channel text not null,
  to_ref text not null,
  status text not null,            -- enviado, falhou
  detail text,
  at integer not null
);
create table if not exists email_suppression (
  email text primary key,
  reason text not null,
  at integer not null
);
create table if not exists policies (
  key text primary key,
  value text not null
);
create table if not exists audit_log (
  id integer primary key autoincrement,
  at integer not null,
  actor text not null,
  action text not null,
  ref text,
  detail text
);
create table if not exists integration_checks (
  integration_id text primary key,
  ok integer not null,
  detail text,
  at integer not null
);
create table if not exists chat (
  id integer primary key autoincrement,
  role text not null,
  text text not null,
  at integer not null
);
create table if not exists meta_ads_daily (
  day text not null, ad_account_id text not null, campaign_id text not null, campaign_name text not null,
  currency text not null, spend real not null, impressions integer not null, clicks integer not null, leads integer not null,
  updated_at integer not null, primary key (day, campaign_id)
);
create table if not exists instagram_daily (
  day text not null, ig_id text not null, followers integer, reach integer, profile_views integer,
  updated_at integer not null, primary key (day, ig_id)
);
create table if not exists ig_post_metricas (
  media_id text primary key, tipo text, publicado text, permalink text, legenda text,
  curtidas integer, comentarios integer, alcance integer, salvos integer, compartilhados integer, views integer, interacoes integer,
  atualizado_em integer not null
);
create table if not exists meta_ad_dia (
  day text not null, ad_id text not null, ad_name text not null, adset_id text not null, adset_name text not null, campaign_id text not null, campaign_name text not null,
  spend real not null, impressions integer not null, reach integer not null, clicks integer not null, link_clicks integer not null, leads integer not null,
  updated_at integer not null, primary key (day, ad_id)
);
create table if not exists meta_criativo (
  ad_id text primary key, nome text not null, status text not null, criado text, campanha text, conjunto text,
  miniatura text, imagem text, texto text, titulo text, cta text, link_ig text, atualizado_em integer not null
);
create table if not exists fin_stripe_fatura (id text primary key, cliente_id text, nome text not null, data text not null, valor real not null, atualizado_em integer not null);
create table if not exists meta_pixel (pixel_id text primary key, nome text not null, ultimo_disparo text, indisponivel integer not null default 0, atualizado_em integer not null);
create table if not exists meta_pixel_dia (day text not null, pixel_id text not null, evento text not null, total integer not null, primary key (day, pixel_id, evento));
create table if not exists meta_quebra_dia (day text not null, tipo text not null, chave text not null, spend real not null, impressions integer not null, clicks integer not null, leads integer not null, primary key (day, tipo, chave));
create table if not exists ig_dia (day text primary key, reach integer, profile_views integer, link_taps integer, interacoes integer, novos integer, updated_at integer not null);
create table if not exists deliverables (
  id integer primary key autoincrement,
  run_id integer,
  agent_id text not null,
  title text not null,
  body text not null,
  at integer not null
);
create table if not exists fin_extrato (
  id integer primary key autoincrement,
  data text not null,
  descricao text not null,
  valor real not null,             -- entrada positiva, sa\xEDda negativa
  categoria text,
  fonte text not null default 'manual',
  hash text not null unique,       -- impede importar o mesmo lan\xE7amento duas vezes
  conta_id integer,
  criado_em integer not null
);
create table if not exists fin_contas (
  id integer primary key autoincrement,
  tipo text not null,              -- pagar ou receber
  descricao text not null,
  contraparte text,
  categoria text not null,
  vencimento text not null,
  valor real,
  pago_em text,
  extrato_id integer,
  grupo text,                      -- recorr\xEAncias criadas juntas
  obs text,
  criado_em integer not null
);
create table if not exists prospects (
  id integer primary key autoincrement,
  place_id text unique not null,
  nome text not null,
  cidade text,
  uf text,
  endereco text,
  telefone text,
  site text,
  instagram text,
  email text,
  email_fonte text,
  crp_count integer,
  whatsapp_no_site integer,
  agenda_online integer,
  avaliacoes integer,
  nota_google real,
  nota integer not null default 0,
  status text not null default 'novo',
  crm_lead_id text,
  consulta text,
  criado_em integer not null,
  atualizado_em integer not null
);
create table if not exists prospect_contato (prospect_id integer primary key, respondeu integer not null default 0, sair integer not null default 0, atualizado_em integer not null default 0);
create table if not exists inbound_emails (email_id text primary key, de text not null, assunto text not null, tipo text not null, prospect_id integer, at integer not null);
create table if not exists prospect_whatsapp (prospect_id integer not null, etapa integer not null, enviado_em integer not null, pulado integer not null default 0, primary key (prospect_id, etapa));
create table if not exists gsc_dia (site text not null, dia text not null, clicks integer not null, impressions integer not null, ctr real not null, position real not null, primary key (site, dia));
create table if not exists gsc_top (site text not null, tipo text not null, chave text not null, clicks integer not null, impressions integer not null, ctr real not null, position real not null, atualizado_em integer not null, primary key (site, tipo, chave));
create table if not exists gsc_agg (site text not null, tipo text not null, periodo text not null, chave text not null, chave2 text not null default '', clicks integer not null, impressions integer not null, ctr real not null, position real not null, primary key (site, tipo, periodo, chave, chave2));
create table if not exists gsc_pagina_dia (site text not null, pagina text not null, dia text not null, clicks integer not null, impressions integer not null, position real not null, primary key (site, pagina, dia));
create table if not exists ga_dia (site text not null, dia text not null, sessoes integer not null, usuarios integer not null, novos integer not null, engajadas integer not null, views integer not null, seg real not null, eventos integer not null, primary key (site, dia));
create table if not exists ga_agg (site text not null, tipo text not null, periodo text not null, chave text not null, chave2 text not null default '', sessoes integer not null, usuarios integer not null, novos integer not null, engajadas integer not null, views integer not null, seg real not null, eventos integer not null, primary key (site, tipo, periodo, chave, chave2));
create table if not exists li_posts (id text primary key, chave text unique, status text not null, categoria text not null, texto text not null, criado_em integer not null, decidido_em integer, publicado_em integer, manual integer not null default 0, urn text, permalink text, erro text);
create table if not exists li_token (id integer primary key check (id = 1), access_token text not null, refresh_token text, expira_em integer not null, atualizado_em integer not null);
create table if not exists ig_posts (id text primary key, chave text unique, status text not null, tema text not null, pilar text not null default '', maturidade text not null default 'educativo', legenda text not null, textos text not null default '', creditos text not null default '', agendado_para integer not null, criado_em integer not null, decidido_em integer, publicado_em integer, media_id text, permalink text, erro text);
create table if not exists ig_midia (id text primary key, post_id text not null, ordem integer not null, b64 text not null);
create index if not exists ig_midia_post on ig_midia (post_id, ordem);
create table if not exists plan_itens (id text primary key, semana text not null, tipo text not null, titulo text not null, dia integer, formato text not null default '', responsavel text not null default '', status text not null default 'pendente', pai text, ordem integer not null default 0, notas text not null default '', criado_em integer not null, concluido_em integer, veio_de text);
create index if not exists plan_semana on plan_itens (semana, ordem);
create table if not exists prospect_runs (
  id integer primary key autoincrement,
  tipo text not null,
  apify_run_id text not null,
  dataset_id text,
  status text not null default 'rodando',
  consulta text,
  prospect_ids text,
  custo_usd real not null default 0,
  detalhe text,
  criado_em integer not null,
  finalizado_em integer
);
create table if not exists fin_cobrancas (
  id integer primary key autoincrement,
  nome text not null,
  valor real not null,
  dia integer not null,
  forma text not null default 'pix',
  ativa integer not null default 1,
  criado_em integer not null
);
create table if not exists fin_config (
  chave text primary key,
  valor text not null
);
create index if not exists idx_fin_extrato_data on fin_extrato(data);
create index if not exists idx_fin_contas_venc on fin_contas(vencimento);
create index if not exists idx_deliverables_at on deliverables(at desc);
create index if not exists idx_proposals_status on proposals(status, impacto_brl desc);
create index if not exists idx_activity_at on activity(at desc);
create index if not exists idx_runs_agent on agent_runs(agent_id, created_at desc);
`;
var rows = (db, sql, ...params) => db.prepare(sql).all(...params);
var row = (db, sql, ...params) => db.prepare(sql).get(...params);
var run = (db, sql, ...params) => db.prepare(sql).run(...params);
var tx = (db, fn) => db.transaction(fn);

// packages/core/src/brain.ts
function lastRunView(r) {
  return { id: r.id, status: r.status, at: r.finished_at ?? 0, title: r.task.split("\n")[0].slice(0, 120), detail: (r.status === "error" ? r.error : r.result)?.slice(0, 400) ?? "" };
}
function envioView(db, r) {
  const e = envioOf(r.payload);
  if (!e) return {};
  const enviado = !!row(db, "select 1 as x from envios where proposal_id = ? and status = 'enviado'", r.id);
  return { envio: { ...e, enviado } };
}
var BrainError = class extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
};
var brtDay = (ms2) => new Date(ms2 - 3 * 36e5).toISOString().slice(0, 10);
var brtStartOfDay = (ms2) => Date.parse(`${brtDay(ms2)}T00:00:00-03:00`);
var brtStartOfMonth = (ms2) => Date.parse(`${brtDay(ms2).slice(0, 8)}01T00:00:00-03:00`);
var EXTERNAL = ["whatsapp", "email", "linkedin", "instagram"];
var Brain = class extends Emitter {
  constructor(db, clock = Date.now) {
    super();
    this.db = db;
    this.clock = clock;
    this.init();
  }
  reviewer = () => ({ ok: true });
  llm = false;
  init() {
    const now = this.clock();
    for (const a of AGENTS) run(this.db, "insert or ignore into agent_state (agent_id) values (?)", a.id);
    run(this.db, "insert or ignore into kill_switch (id, engaged, changed_at) values (1, 0, ?)", now);
    const defaults = {
      daily_proposal_cap: 15,
      monthly_llm_cap_brl: 300,
      contact_policy: { start_hour: 9, end_hour: 19, min_days_between: 3 },
      mrr_goal: { value: 1200, date: "31/12/2026" },
      essencial_price: 79
    };
    for (const [k, v] of Object.entries(defaults)) run(this.db, "insert or ignore into policies (key, value) values (?, ?)", k, JSON.stringify(v));
  }
  policy(key, fallback) {
    const r = row(this.db, "select value from policies where key = ?", key);
    return r ? JSON.parse(r.value) : fallback;
  }
  setPolicy(key, value) {
    run(this.db, "insert into policies (key, value) values (?, ?) on conflict(key) do update set value = excluded.value", key, JSON.stringify(value));
    this.emit("change");
  }
  audit(actor, action, ref, detail) {
    run(this.db, "insert into audit_log (at, actor, action, ref, detail) values (?, ?, ?, ?, ?)", this.clock(), actor, action, ref ?? null, detail === void 0 ? null : JSON.stringify(detail));
  }
  log(agentId, text, tone = "normal") {
    run(this.db, "insert into activity (agent_id, text, tone, at) values (?, ?, ?, ?)", agentId, text, tone, this.clock());
    this.emit("change");
  }
  agentName(id) {
    return AGENTS.find((a) => a.id === id)?.name ?? id;
  }
  // ---- Kill switch -------------------------------------------------------
  killed() {
    return (row(this.db, "select engaged from kill_switch where id = 1")?.engaged ?? 1) === 1;
  }
  setKill(on, actor = "voce") {
    const now = this.clock();
    run(this.db, "update kill_switch set engaged = ?, changed_at = ? where id = 1", on ? 1 : 0, now);
    if (on) {
      run(this.db, "update agent_state set status = 'ocioso' where status = 'trabalhando'");
      run(this.db, "update agent_runs set status = 'error', error = 'Interrompida pelo bot\xE3o de emerg\xEAncia', finished_at = ? where status in ('queued','running')", now);
    }
    this.audit(actor, on ? "kill_on" : "kill_off");
    this.log("sistema", on ? "Bot\xE3o de emerg\xEAncia ligado. Todos os agentes pararam." : "Bot\xE3o de emerg\xEAncia desligado. Agentes liberados.", on ? "alerta" : "ok");
    this.emit("kill", on);
  }
  // ---- Agentes -----------------------------------------------------------
  requireAgent(id) {
    if (!AGENTS.some((a) => a.id === id)) throw new BrainError("not_found", `Agente desconhecido: ${id}`);
  }
  setPaused(agentId, paused, actor = "voce") {
    this.requireAgent(agentId);
    run(this.db, "update agent_state set paused = ?, status = case when ? = 1 then 'ocioso' else status end where agent_id = ?", paused ? 1 : 0, paused ? 1 : 0, agentId);
    this.audit(actor, paused ? "pause" : "resume", agentId);
    this.log("voce", paused ? `Pausou ${this.agentName(agentId)}.` : `Retomou ${this.agentName(agentId)}.`);
  }
  /** Enfileira uma tarefa. Quem executa é o runtime (ouve o evento `queued`). */
  assignTask(agentId, task, requestedBy = "voce") {
    this.requireAgent(agentId);
    const clean = task.trim().slice(0, 6e3);
    if (!clean) throw new BrainError("invalid", "Tarefa vazia.");
    if (this.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado.");
    const st = row(this.db, "select paused from agent_state where agent_id = ?", agentId);
    if (st?.paused) throw new BrainError("paused", `${this.agentName(agentId)} est\xE1 pausado.`);
    const res = run(this.db, "insert into agent_runs (agent_id, task, status, requested_by, created_at) values (?, ?, 'queued', ?, ?)", agentId, clean, requestedBy, this.clock());
    const id = Number(res.lastInsertRowid);
    run(this.db, "update agent_state set status = 'trabalhando' where agent_id = ?", agentId);
    this.audit(requestedBy, "task", agentId, { task: clean, run: id });
    this.log(requestedBy === "voce" ? "voce" : "sistema", `${requestedBy === "voce" ? "Pediu a" : "Acionou"} ${this.agentName(agentId)}: ${clean.split("\n")[0].slice(0, 140)}`);
    this.emit("queued", id);
    return id;
  }
  finishRun(runId, r) {
    const now = this.clock();
    const cur = row(this.db, "select agent_id, status from agent_runs where id = ?", runId);
    if (!cur || cur.status === "error") return;
    run(this.db, "update agent_runs set status = ?, result = ?, error = ?, cost_brl = ?, finished_at = ? where id = ?", r.status, r.result ?? null, r.error ?? null, r.costBrl ?? 0, now, runId);
    const others = row(this.db, "select count(*) as n from agent_runs where agent_id = ? and status in ('queued','running')", cur.agent_id)?.n ?? 0;
    run(this.db, "update agent_state set status = ?, last_action = ?, last_at = ? where agent_id = ?", others > 0 ? "trabalhando" : "ocioso", r.status === "done" ? r.result ?? "Concluiu." : r.status === "blocked" ? r.result ?? "N\xE3o conseguiu rodar." : `Falhou: ${r.error ?? "erro"}`, now, cur.agent_id);
    this.emit("change");
  }
  // ---- Propostas ---------------------------------------------------------
  /** Cria a proposta depois da Conformidade. Devolve o id, ou null se for duplicada ou barrada. */
  addProposal(p) {
    const now = this.clock();
    this.requireAgent(p.agentId);
    if (p.dedupeKey && row(this.db, "select 1 as x from proposals where dedupe_key = ?", p.dedupeKey)) return null;
    const verdict = this.reviewer(p, { db: this.db, now });
    const id = crypto.randomUUID();
    run(
      this.db,
      `insert into proposals (id, agent_id, kind, title, draft, why, impacto_brl, risk, channel, status, review, review_note, contact_ref, payload, dedupe_key, created_at, decided_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      p.agentId,
      p.kind,
      p.title,
      p.draft ?? null,
      p.why,
      p.impactoBrl ?? 0,
      p.risk,
      p.channel,
      verdict.ok ? "pendente" : "rejeitada",
      verdict.ok ? "aprovada pela conformidade" : "sinalizada",
      verdict.note ?? null,
      p.contactRef ?? null,
      JSON.stringify(p.payload ?? {}),
      p.dedupeKey ?? null,
      now,
      verdict.ok ? null : now
    );
    if (verdict.ok) this.log(p.agentId, `Deixou na sua fila: ${p.title}`);
    else this.log("compliance", `Barrou "${p.title}" (${this.agentName(p.agentId)}): ${verdict.note ?? "fora da pol\xEDtica"}`, "alerta");
    return verdict.ok ? id : null;
  }
  /** Fila do dia: pendentes por impacto em reais, até o teto diário. */
  queueIds() {
    const cap2 = this.policy("daily_proposal_cap", 15);
    return rows(this.db, "select id from proposals where status = 'pendente' order by impacto_brl desc, created_at asc limit ?", cap2).map((r) => r.id);
  }
  decide(id, to, actor = "voce") {
    const p = row(this.db, "select * from proposals where id = ?", id);
    if (!p) throw new BrainError("not_found", "Proposta n\xE3o encontrada.");
    if (p.status !== "pendente") throw new BrainError("already_decided", "Essa proposta j\xE1 foi decidida.");
    if (to === "aprovada" && this.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado: aprova\xE7\xF5es bloqueadas.");
    const now = this.clock();
    run(this.db, "update proposals set status = ?, decided_at = ? where id = ?", to, now, id);
    run(this.db, "insert into approvals (proposal_id, decision, actor, at) values (?, ?, ?, ?)", id, to, actor, now);
    if (to === "aprovada" && p.contact_ref && EXTERNAL.includes(p.channel)) run(this.db, "insert into contact_log (contact_ref, channel, proposal_id, at) values (?, ?, ?, ?)", p.contact_ref, p.channel, id, now);
    this.audit(actor, to === "aprovada" ? "approve" : "reject", id);
    this.log("voce", `${to === "aprovada" ? "Aprovou" : "Rejeitou"}: ${p.title} (${this.agentName(p.agent_id)})`, to === "aprovada" ? "ok" : "normal");
    this.emit("decided", id, to);
  }
  approveLowRisk(actor = "voce") {
    if (this.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado: aprova\xE7\xF5es bloqueadas.");
    const queue = new Set(this.queueIds());
    const low = rows(this.db, "select id from proposals where status = 'pendente' and risk = 'baixo'").filter((r) => queue.has(r.id));
    for (const r of low) this.decide(r.id, "aprovada", actor);
    return low.length;
  }
  // ---- Leitura -----------------------------------------------------------
  metrics() {
    const subs = rows(this.db, "select source, external_id, professional_id, label, list_price_brl, effective_price_brl, discount_ends_at, status from subscriptions");
    const { bySource, total } = mrrBySource(subs);
    const goal = this.policy("mrr_goal", { value: 1200, date: "31/12/2026" });
    const groups = /* @__PURE__ */ new Map();
    for (const s2 of subs) {
      if (!s2.discount_ends_at || !["active", "trialing", "past_due"].includes(s2.status)) continue;
      const d = new Date(s2.discount_ends_at);
      if (d.getTime() < this.clock()) continue;
      const quando = d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
      const k = `${quando}|${s2.effective_price_brl}|${s2.list_price_brl}`;
      const g = groups.get(k) ?? { quando, contas: 0, de: s2.effective_price_brl, para: s2.list_price_brl };
      g.contas += 1;
      groups.set(k, g);
    }
    const spent = row(this.db, "select sum(cost_brl) as s from agent_runs where created_at >= ?", brtStartOfMonth(this.clock()))?.s ?? 0;
    return {
      mrr: { stripe: bySource.stripe.mrr, pix: bySource.pix.mrr, manual: bySource.manual.mrr, total, goal: goal.value, goalDate: goal.date, essencialPrice: this.policy("essencial_price", 79) },
      funil: this.policy("funil", null),
      llmCapMonthlyBrl: this.policy("monthly_llm_cap_brl", 300),
      llmSpentMonthBrl: Math.round(spent * 100) / 100,
      descontos: [...groups.values()].sort((a, b) => a.quando.split("/").reverse().join().localeCompare(b.quando.split("/").reverse().join()))
    };
  }
  runtime() {
    const since2 = brtStartOfDay(this.clock());
    const today = new Map(rows(this.db, "select agent_id, count(*) as n, coalesce(sum(cost_brl),0) as c from agent_runs where created_at >= ? group by agent_id", since2).map((r) => [r.agent_id, r]));
    const last = /* @__PURE__ */ new Map();
    for (const r of rows(
      this.db,
      "select id, agent_id, status, finished_at, task, result, error from agent_runs where status in ('done','blocked','error') order by id desc limit 200"
    )) {
      if (!last.has(r.agent_id)) last.set(r.agent_id, r);
    }
    const out = {};
    for (const s2 of rows(this.db, "select * from agent_state")) {
      const t = today.get(s2.agent_id);
      out[s2.agent_id] = {
        status: s2.paused ? "pausado" : s2.status === "trabalhando" ? "trabalhando" : "ocioso",
        lastAction: s2.last_action ?? "Aguardando o pr\xF3ximo gatilho.",
        lastAt: s2.last_at ?? 0,
        runsToday: t?.n ?? 0,
        costBrl: Math.round((t?.c ?? 0) * 100) / 100,
        ...last.has(s2.agent_id) ? { lastRun: lastRunView(last.get(s2.agent_id)) } : {}
      };
    }
    return out;
  }
  snapshot(integrations) {
    const queue = this.queueIds();
    const pendingTotal = row(this.db, "select count(*) as n from proposals where status = 'pendente'")?.n ?? 0;
    const toProposal = (r) => ({ id: r.id, agentId: r.agent_id, title: r.title, draft: r.draft, why: r.why, impactoBrl: r.impacto_brl, risk: r.risk, channel: r.channel, status: r.status, at: r.created_at, review: r.review, ...envioView(this.db, r) });
    const pending = queue.length ? rows(this.db, `select * from proposals where id in (${queue.map(() => "?").join(",")}) order by impacto_brl desc, created_at asc`, ...queue) : [];
    const decided = rows(this.db, "select * from proposals where status != 'pendente' order by coalesce(decided_at, created_at) desc limit 20");
    const activity = rows(this.db, "select * from activity order by at desc, id desc limit 80").map((a) => ({ id: `a${a.id}`, agentId: a.agent_id, text: a.text, tone: a.tone, at: a.at }));
    return {
      now: this.clock(),
      mode: "live",
      runtime: this.runtime(),
      proposals: [...pending, ...decided].map(toProposal),
      overflow: Math.max(0, pendingTotal - queue.length),
      activity,
      integrations,
      kill: this.killed(),
      metrics: this.metrics(),
      llm: this.llm
    };
  }
};

// packages/core/src/crm-contract.ts
var CRM_CONTRACT = {
  "CreateLead": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "name",
      "lead_type",
      "phone",
      "origin"
    ],
    "properties": {
      "name": {
        "type": "string",
        "minLength": 2,
        "maxLength": 200
      },
      "lead_type": {
        "type": "string",
        "enum": [
          "psicologo_individual",
          "clinica",
          "parceiro"
        ]
      },
      "phone": {
        "type": "string",
        "minLength": 8,
        "maxLength": 30
      },
      "email": {
        "type": [
          "string",
          "null"
        ],
        "format": "email"
      },
      "instagram": {
        "type": [
          "string",
          "null"
        ]
      },
      "origin": {
        "type": "string"
      },
      "responsible_id": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "classification": {
        "type": "string"
      },
      "observations": {
        "type": [
          "string",
          "null"
        ]
      },
      "next_action": {
        "type": [
          "string",
          "null"
        ]
      },
      "follow_up_date": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "plan_interest": {
        "type": [
          "string",
          "null"
        ],
        "enum": [
          "gratuito",
          "essencial",
          "clinica",
          "nao_definido",
          null
        ]
      },
      "professionals_count": {
        "type": [
          "integer",
          "null"
        ],
        "minimum": 1
      },
      "current_system": {
        "type": [
          "string",
          "null"
        ]
      },
      "main_challenge": {
        "type": [
          "string",
          "null"
        ]
      },
      "decision_timeline": {
        "type": [
          "string",
          "null"
        ],
        "enum": [
          "imediato",
          "ate_30_dias",
          "ate_90_dias",
          "sem_previsao",
          null
        ]
      },
      "is_decision_maker": {
        "type": [
          "boolean",
          "null"
        ]
      }
    }
  },
  "UpdateLead": {
    "type": "object",
    "additionalProperties": false,
    "minProperties": 1,
    "properties": {
      "name": {
        "type": "string",
        "minLength": 2,
        "maxLength": 200
      },
      "lead_type": {
        "type": "string",
        "enum": [
          "psicologo_individual",
          "clinica",
          "parceiro"
        ]
      },
      "phone": {
        "type": "string",
        "minLength": 8,
        "maxLength": 30
      },
      "email": {
        "type": [
          "string",
          "null"
        ],
        "format": "email"
      },
      "instagram": {
        "type": [
          "string",
          "null"
        ]
      },
      "origin": {
        "type": "string",
        "enum": [
          "instagram",
          "whatsapp",
          "landing_page",
          "indicacao",
          "evento",
          "linkedin",
          "facebook_meta",
          "google",
          "parceria",
          "outbound",
          "outro"
        ]
      },
      "responsible_id": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "classification": {
        "type": "string",
        "enum": [
          "frio",
          "morno",
          "quente",
          "super_quente"
        ]
      },
      "observations": {
        "type": [
          "string",
          "null"
        ]
      },
      "next_action": {
        "type": [
          "string",
          "null"
        ]
      },
      "follow_up_date": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "plan_interest": {
        "type": [
          "string",
          "null"
        ],
        "enum": [
          "gratuito",
          "essencial",
          "clinica",
          "nao_definido",
          null
        ]
      },
      "professionals_count": {
        "type": [
          "integer",
          "null"
        ],
        "minimum": 1
      },
      "current_system": {
        "type": [
          "string",
          "null"
        ]
      },
      "main_challenge": {
        "type": [
          "string",
          "null"
        ]
      },
      "decision_timeline": {
        "type": [
          "string",
          "null"
        ],
        "enum": [
          "imediato",
          "ate_30_dias",
          "ate_90_dias",
          "sem_previsao",
          null
        ]
      },
      "is_decision_maker": {
        "type": [
          "boolean",
          "null"
        ]
      },
      "test_status": {
        "type": [
          "string",
          "null"
        ],
        "enum": [
          "pending",
          "active",
          "completed",
          "cancelled",
          null
        ]
      },
      "test_start_date": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "test_end_date": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      },
      "test_feedback": {
        "type": [
          "string",
          "null"
        ]
      }
    }
  },
  "MoveStage": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "status"
    ],
    "properties": {
      "status": {
        "type": "string",
        "enum": [
          "novo_lead",
          "contato_feito",
          "reuniao_agendada",
          "reuniao_realizada",
          "em_teste",
          "negociacao",
          "cliente_ativo",
          "perdido",
          "pausado"
        ]
      },
      "loss_reason": {
        "type": "object",
        "required": [
          "reasons",
          "details"
        ],
        "properties": {
          "reasons": {
            "type": "array",
            "minItems": 1,
            "items": {
              "type": "string"
            }
          },
          "details": {
            "type": "string"
          },
          "had_test": {
            "type": "boolean",
            "default": false
          }
        }
      }
    },
    "allOf": [
      {
        "if": {
          "properties": {
            "status": {
              "const": "perdido"
            }
          }
        },
        "then": {
          "required": [
            "loss_reason"
          ],
          "properties": {
            "loss_reason": {}
          }
        }
      }
    ]
  },
  "CreateActivity": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "lead_id",
      "type",
      "scheduled_date",
      "scheduled_time"
    ],
    "properties": {
      "lead_id": {
        "type": "string",
        "format": "uuid"
      },
      "type": {
        "type": "string",
        "enum": [
          "enviar_mensagem",
          "ligar",
          "agendar_reuniao",
          "followup"
        ]
      },
      "scheduled_date": {
        "type": "string",
        "format": "date"
      },
      "scheduled_time": {
        "type": "string"
      },
      "responsible_id": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "observations": {
        "type": [
          "string",
          "null"
        ]
      }
    }
  },
  "UpdateActivity": {
    "type": "object",
    "additionalProperties": false,
    "minProperties": 1,
    "properties": {
      "type": {
        "type": "string"
      },
      "scheduled_date": {
        "type": "string",
        "format": "date"
      },
      "scheduled_time": {
        "type": "string"
      },
      "responsible_id": {
        "type": [
          "string",
          "null"
        ],
        "format": "uuid"
      },
      "status": {
        "type": "string",
        "enum": [
          "pendente",
          "em_andamento",
          "concluida",
          "atrasada"
        ]
      },
      "observations": {
        "type": [
          "string",
          "null"
        ]
      }
    }
  },
  "CreateMeeting": {
    "type": "object",
    "additionalProperties": false,
    "required": [
      "lead_id",
      "title",
      "scheduled_at"
    ],
    "properties": {
      "lead_id": {
        "type": "string",
        "format": "uuid"
      },
      "title": {
        "type": "string"
      },
      "scheduled_at": {
        "type": "string",
        "format": "date-time"
      },
      "notes_before": {
        "type": [
          "string",
          "null"
        ]
      },
      "channel": {
        "type": [
          "string",
          "null"
        ]
      },
      "duration_minutes": {
        "type": "integer",
        "minimum": 1,
        "maximum": 480
      },
      "meeting_link": {
        "type": [
          "string",
          "null"
        ],
        "format": "uri"
      }
    }
  },
  "UpdateMeeting": {
    "type": "object",
    "additionalProperties": false,
    "minProperties": 1,
    "properties": {
      "title": {
        "type": "string"
      },
      "scheduled_at": {
        "type": "string",
        "format": "date-time"
      },
      "status": {
        "type": "string"
      },
      "notes_before": {
        "type": [
          "string",
          "null"
        ]
      },
      "notes_after": {
        "type": [
          "string",
          "null"
        ]
      },
      "transcription": {
        "type": [
          "string",
          "null"
        ]
      },
      "outcome": {
        "type": [
          "string",
          "null"
        ]
      },
      "closing_probability": {
        "type": [
          "integer",
          "null"
        ],
        "minimum": 0,
        "maximum": 100
      },
      "next_step": {
        "type": [
          "string",
          "null"
        ]
      },
      "next_step_due_date": {
        "type": [
          "string",
          "null"
        ],
        "format": "date"
      }
    }
  }
};

// packages/core/src/crm-validate.ts
var typeOk = (t, v) => {
  switch (t) {
    case "string":
      return typeof v === "string";
    case "integer":
      return typeof v === "number" && Number.isInteger(v);
    case "number":
      return typeof v === "number" && Number.isFinite(v);
    case "boolean":
      return typeof v === "boolean";
    case "null":
      return v === null;
    case "array":
      return Array.isArray(v);
    case "object":
      return typeof v === "object" && v !== null && !Array.isArray(v);
    default:
      return true;
  }
};
var FORMATS = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  "date-time": /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/,
  uri: /^https?:\/\/\S+$/i
};
function check(s2, v, path, errs) {
  if (v === void 0) return;
  const types = s2.type === void 0 ? void 0 : Array.isArray(s2.type) ? s2.type : [s2.type];
  if (types && !types.some((t) => typeOk(t, v))) {
    errs.push(`${path}: tipo inv\xE1lido (esperado ${types.join(" ou ")})`);
    return;
  }
  if (v === null) return;
  if (s2.enum && !s2.enum.includes(v)) {
    errs.push(`${path}: valor fora da lista permitida`);
    return;
  }
  if (s2.const !== void 0 && s2.const !== v) errs.push(`${path}: valor fixo diferente`);
  if (typeof v === "string") {
    if (s2.minLength !== void 0 && v.length < s2.minLength) errs.push(`${path}: curto demais (m\xEDnimo ${s2.minLength})`);
    if (s2.maxLength !== void 0 && v.length > s2.maxLength) errs.push(`${path}: longo demais (m\xE1ximo ${s2.maxLength})`);
    if (s2.format && FORMATS[s2.format] && !FORMATS[s2.format].test(v)) errs.push(`${path}: formato ${s2.format} inv\xE1lido`);
  }
  if (typeof v === "number") {
    if (s2.minimum !== void 0 && v < s2.minimum) errs.push(`${path}: abaixo do m\xEDnimo ${s2.minimum}`);
    if (s2.maximum !== void 0 && v > s2.maximum) errs.push(`${path}: acima do m\xE1ximo ${s2.maximum}`);
  }
  if (Array.isArray(v)) {
    if (s2.minItems !== void 0 && v.length < s2.minItems) errs.push(`${path}: precisa de ao menos ${s2.minItems} item(ns)`);
    if (s2.items) v.forEach((x, i) => check(s2.items, x, `${path}[${i}]`, errs));
  }
  if (typeof v === "object" && !Array.isArray(v)) {
    const o = v;
    for (const r of s2.required ?? []) if (o[r] === void 0) errs.push(`${path}.${r}: obrigat\xF3rio`);
    const props = s2.properties ?? {};
    for (const k of Object.keys(o)) {
      if (props[k]) check(props[k], o[k], `${path}.${k}`, errs);
      else if (s2.additionalProperties === false) errs.push(`${path}.${k}: campo n\xE3o existe no contrato`);
    }
    if (s2.minProperties !== void 0 && Object.keys(o).length < s2.minProperties) errs.push(`${path}: informe ao menos ${s2.minProperties} campo(s)`);
  }
  for (const a of s2.allOf ?? []) {
    if (a.if && a.then) {
      const cond = [];
      check(a.if, v, path, cond);
      if (cond.length === 0 && typeof v === "object" && v) {
        for (const r of a.then.required ?? []) if (v[r] === void 0) errs.push(`${path}.${r}: obrigat\xF3rio nesse caso`);
      }
    }
  }
}
function validar(schema, valor, raiz = "payload") {
  const errs = [];
  check(schema, valor, raiz, errs);
  return errs;
}

// packages/core/src/crm.ts
function crmConfig(env) {
  const base = (env.SYNAPSA_CRM_API_BASE_URL ?? env.CRM_API_BASE_URL)?.trim();
  const key = (env.SYNAPSA_CRM_API_KEY ?? env.CRM_API_KEY)?.trim();
  if (!base || !key) return null;
  if (!/^https:\/\//.test(base)) return null;
  return { baseUrl: base.replace(/\/+$/, ""), apiKey: key };
}
var CrmError = class extends Error {
  constructor(status, code, message, requestId, retryAfterSec) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.retryAfterSec = retryAfterSec;
    this.name = "CrmError";
  }
};
var ALLOWED = {
  GET: [/^\/leads$/, /^\/leads\/[^/]+$/, /^\/leads\/[^/]+\/history$/, /^\/pipeline\/(stages|summary|evolution)$/, /^\/activities$/, /^\/activities\/[^/]+$/, /^\/meetings$/, /^\/meetings\/[^/]+$/, /^\/metrics\/(overview|funnel)$/],
  POST: [/^\/leads$/, /^\/activities$/, /^\/meetings$/],
  PATCH: [/^\/leads\/[^/]+$/, /^\/leads\/[^/]+\/stage$/, /^\/activities\/[^/]+$/, /^\/meetings\/[^/]+$/],
  DELETE: [/^\/leads\/[^/]+$/, /^\/activities\/[^/]+$/, /^\/meetings\/[^/]+$/]
};
var num = (v) => v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : void 0;
var defaultSleep = (ms2) => new Promise((r) => setTimeout(r, ms2));
var CrmClient = class {
  constructor(cfg, f = fetch, opts = {}) {
    this.cfg = cfg;
    this.send = (url, init) => f(url, init);
    this.timeoutMs = opts.timeoutMs ?? 1e4;
    this.maxRetries = opts.maxRetries ?? 2;
    this.maxRetryAfterSec = opts.maxRetryAfterSec ?? 20;
    this.sleep = opts.sleep ?? defaultSleep;
  }
  /** Último limite de taxa informado pela API. */
  rate = {};
  send;
  timeoutMs;
  maxRetries;
  maxRetryAfterSec;
  sleep;
  /** Pedido com timeout, backoff em 500/503/rede (mesma Idempotency-Key) e respeito ao Retry-After no 429. */
  async request(path, req = {}) {
    const method = req.method ?? "GET";
    const params = req.params ?? {};
    if (!ALLOWED[method].some((re) => re.test(path))) throw new CrmError(400, "caminho_nao_permitido", "Esse m\xE9todo e caminho n\xE3o fazem parte da integra\xE7\xE3o com o CRM.");
    if (method !== "GET" && !req.idempotencyKey) throw new CrmError(400, "sem_idempotency_key", "Escrita no CRM exige Idempotency-Key.");
    if ((method === "PATCH" || method === "DELETE") && !req.ifMatch) throw new CrmError(428, "sem_if_match", "Alterar ou excluir exige o ETag do registro (If-Match). Leia o registro antes.");
    const headers = { authorization: `Bearer ${this.cfg.apiKey}`, accept: "application/json" };
    if (req.body !== void 0) headers["content-type"] = "application/json";
    if (req.idempotencyKey) headers["idempotency-key"] = req.idempotencyKey;
    if (req.ifMatch) headers["if-match"] = req.ifMatch;
    const payload = req.body === void 0 ? void 0 : JSON.stringify(req.body);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== void 0 && v !== null && v !== "") qs.set(k, String(v));
    const url = `${this.cfg.baseUrl}${path}${qs.size ? `?${qs}` : ""}`;
    let attempt = 0;
    let rateLimited = false;
    for (; ; ) {
      let res = null;
      let netErr = false;
      let netMsg = "";
      try {
        res = await this.send(url, { method, headers, body: payload, signal: AbortSignal.timeout(this.timeoutMs) });
      } catch (e) {
        netErr = true;
        netMsg = e instanceof Error ? `${e.name}: ${e.message}`.split(this.cfg.apiKey).join("***").slice(0, 160) : "erro desconhecido";
      }
      if (res) {
        const rate = { limit: num(res.headers.get("x-ratelimit-limit")), remaining: num(res.headers.get("x-ratelimit-remaining")), reset: num(res.headers.get("x-ratelimit-reset")) };
        this.rate = rate;
        const body = await res.json().catch(() => ({}));
        if (res.ok) return { body, rate, etag: res.headers.get("etag") ?? void 0 };
        const requestId = typeof body.request_id === "string" ? body.request_id : void 0;
        const code = String(body.error?.code ?? `http_${res.status}`);
        const msg2 = String(body.error?.message ?? "");
        const campos = Array.isArray(body.error?.details) ? body.error.details.map((d) => String(d?.field ?? d?.path ?? "")).filter(Boolean).slice(0, 8).join(", ") : "";
        if (res.status === 429) {
          const wait = num(res.headers.get("retry-after")) ?? 1;
          if (!rateLimited && wait <= this.maxRetryAfterSec) {
            rateLimited = true;
            await this.sleep(wait * 1e3);
            continue;
          }
          throw new CrmError(429, code, `Limite de 120 requisi\xE7\xF5es por minuto do CRM atingido. Tente de novo em ${wait}s.`, requestId, wait);
        }
        if ((res.status === 500 || res.status === 503) && attempt < this.maxRetries) {
          attempt++;
          await this.sleep(250 * 3 ** (attempt - 1) + Math.floor(Math.random() * 100));
          continue;
        }
        throw new CrmError(res.status, code, explain(res.status, msg2, campos), requestId);
      }
      if (netErr && attempt < this.maxRetries) {
        attempt++;
        await this.sleep(250 * 3 ** (attempt - 1) + Math.floor(Math.random() * 100));
        continue;
      }
      throw new CrmError(0, "rede", `O CRM n\xE3o respondeu a tempo ou a conex\xE3o falhou (${netMsg}).`);
    }
  }
  async one(path, params = {}) {
    const { body, rate, etag } = await this.request(path, { params });
    return { data: body.data, requestId: body.request_id, rate, etag };
  }
  async page(path, params = {}) {
    const page_size = Math.min(Math.max(Number(params.page_size) || 25, 1), 100);
    const { body, rate } = await this.request(path, { params: { ...params, page: Number(params.page) || 1, page_size } });
    return { data: body.data ?? [], meta: body.meta ?? { page: 1, page_size, total: 0, total_pages: 0 }, requestId: body.request_id, rate };
  }
  /** Percorre as páginas até acabar ou até maxPages (padrão 5 de 100). Diz se cortou. */
  async all(path, params = {}, maxPages = 5) {
    const out = [];
    let total = 0;
    for (let page = 1; page <= maxPages; page++) {
      const r = await this.page(path, { ...params, page, page_size: 100 });
      out.push(...r.data);
      total = r.meta.total;
      if (page >= r.meta.total_pages) return { data: out, total, truncado: false };
    }
    return { data: out, total, truncado: out.length < total };
  }
  // Endpoints, na ordem do contrato (GET apenas).
  leads = (f = {}) => this.page("/leads", f);
  lead = (id) => this.one(`/leads/${encodeURIComponent(id)}`);
  leadHistory = (id, f = {}) => this.page(`/leads/${encodeURIComponent(id)}/history`, f);
  stages = () => this.one("/pipeline/stages");
  pipelineSummary = (f = {}) => this.one("/pipeline/summary", f);
  pipelineEvolution = (f = {}) => this.one("/pipeline/evolution", f);
  activities = (f = {}) => this.page("/activities", f);
  activity = (id) => this.one(`/activities/${encodeURIComponent(id)}`);
  meetings = (f = {}) => this.page("/meetings", f);
  meeting = (id) => this.one(`/meetings/${encodeURIComponent(id)}`);
  overview = (f = {}) => this.one("/metrics/overview", f);
  funnel = (f = {}) => this.one("/metrics/funnel", f);
  // ---- Escrita. Todo payload é validado contra o contrato do OpenAPI antes de sair. ----
  novaChave(acao) {
    return `mega-brain-${acao}-${crypto.randomUUID()}`;
  }
  async escrever(method, path, acao, contrato, body, o, lerEtagDe) {
    if (contrato) {
      const erros = validar(CRM_CONTRACT[contrato], body);
      if (erros.length) throw new CrmError(422, "payload_invalido", `Payload recusado antes de chamar o CRM: ${erros.slice(0, 6).join("; ")}.`);
    }
    const ifMatch = lerEtagDe ? await this.etagDe(lerEtagDe, o.ifMatch) : o.ifMatch;
    const { body: r, rate, etag } = await this.request(path, { method, body, idempotencyKey: o.idempotencyKey ?? this.novaChave(acao), ifMatch });
    return { data: r.data, requestId: r.request_id, rate, etag };
  }
  /** Lê o registro para pegar o ETag, a menos que o chamador já tenha um. */
  async etagDe(readPath, ifMatch) {
    if (ifMatch) return ifMatch;
    const r = await this.one(readPath);
    if (!r.etag) throw new CrmError(0, "sem_etag", "O CRM n\xE3o devolveu ETag na leitura; n\xE3o d\xE1 para alterar com seguran\xE7a.");
    return r.etag;
  }
  async excluir(readPath, acao, o) {
    if (o?.confirmar !== true) throw new CrmError(400, "exclusao_sem_confirmacao", "Exclus\xE3o no CRM exige confirma\xE7\xE3o expl\xEDcita do usu\xE1rio (confirmar: true).");
    const ifMatch = await this.etagDe(readPath, o.ifMatch);
    const { body, rate } = await this.request(readPath, { method: "DELETE", idempotencyKey: o.idempotencyKey ?? this.novaChave(acao), ifMatch });
    return { deleted: true, requestId: body.request_id, rate };
  }
  createLead = (input, o = {}) => this.escrever("POST", "/leads", "create-lead", "CreateLead", input, o);
  async updateLead(id, patch, o = {}) {
    const path = `/leads/${encodeURIComponent(id)}`;
    return this.escrever("PATCH", path, "update-lead", "UpdateLead", patch, o, path);
  }
  async moveLeadStage(id, input, o = {}) {
    const path = `/leads/${encodeURIComponent(id)}`;
    return this.escrever("PATCH", `${path}/stage`, "stage", "MoveStage", input, o, path);
  }
  deleteLead = (id, o) => this.excluir(`/leads/${encodeURIComponent(id)}`, "delete-lead", o);
  createActivity = (input, o = {}) => this.escrever("POST", "/activities", "create-activity", "CreateActivity", input, o);
  async updateActivity(id, patch, o = {}) {
    const path = `/activities/${encodeURIComponent(id)}`;
    return this.escrever("PATCH", path, "update-activity", "UpdateActivity", patch, o, path);
  }
  deleteActivity = (id, o) => this.excluir(`/activities/${encodeURIComponent(id)}`, "delete-activity", o);
  createMeeting = (input, o = {}) => this.escrever("POST", "/meetings", "create-meeting", "CreateMeeting", input, o);
  async updateMeeting(id, patch, o = {}) {
    const path = `/meetings/${encodeURIComponent(id)}`;
    return this.escrever("PATCH", path, "update-meeting", "UpdateMeeting", patch, o, path);
  }
  deleteMeeting = (id, o) => this.excluir(`/meetings/${encodeURIComponent(id)}`, "delete-meeting", o);
};
function explain(status, msg2, campos = "") {
  const m = msg2 ? ` (${msg2.slice(0, 160)})` : "";
  const c2 = campos ? ` Campos: ${campos}.` : "";
  switch (status) {
    case 400:
      return `O CRM recusou o pedido por par\xE2metro ou Idempotency-Key inv\xE1lidos${m}.`;
    case 401:
      return "O CRM recusou a chave: ela \xE9 inv\xE1lida, expirou ou foi revogada. Gere outra e atualize o secret SYNAPSA_CRM_API_KEY.";
    case 403:
      return "A chave do CRM n\xE3o tem escopo para essa opera\xE7\xE3o.";
    case 404:
      return "O CRM n\xE3o achou esse registro.";
    case 409:
      return `O CRM acusou conflito: a Idempotency-Key j\xE1 foi usada em outra opera\xE7\xE3o ou o registro conflita${m}.`;
    case 412:
      return "O registro mudou no CRM desde a \xFAltima leitura (ETag desatualizado). Leia de novo e decida se a altera\xE7\xE3o ainda vale.";
    case 422:
      return `O CRM recusou os campos enviados.${c2}`;
    case 428:
      return "O CRM exige If-Match (ETag do registro) para essa opera\xE7\xE3o.";
    case 500:
    case 503:
      return "O CRM est\xE1 inst\xE1vel agora. Tentei de novo e n\xE3o deu.";
    default:
      return `O CRM respondeu ${status}${m}.`;
  }
}
function crmClient(env, f = fetch, opts) {
  const cfg = crmConfig(env);
  return cfg ? new CrmClient(cfg, f, opts) : null;
}

// packages/core/src/crm-acao.ts
var CRM_OPS = ["criar_lead", "mover_etapa", "registrar_atividade", "agendar_reuniao"];
var CONTRATO = { criar_lead: "CreateLead", mover_etapa: "MoveStage", registrar_atividade: "CreateActivity", agendar_reuniao: "CreateMeeting" };
function corpo(op, dados) {
  if (op !== "mover_etapa") return { body: dados };
  const { lead_id, ...resto } = dados;
  return { id: typeof lead_id === "string" ? lead_id : void 0, body: resto };
}
function validarProposta(op, dados) {
  const { id, body } = corpo(op, dados);
  const erros = validar(CRM_CONTRACT[CONTRATO[op]], body);
  if (op === "mover_etapa" && !id) erros.push("lead_id: obrigat\xF3rio");
  return erros;
}
async function executarCrm(env, f, a) {
  const erros = validarProposta(a.op, a.dados);
  if (erros.length) throw new BrainError("invalid", `O CRM recusaria isso: ${erros.slice(0, 5).join("; ")}.`);
  const crm = crmClient(env, f);
  if (!crm) throw new BrainError("invalid", "O CRM n\xE3o est\xE1 conectado (faltam as vari\xE1veis da API).");
  const o = { idempotencyKey: `mega-brain-confirm-${a.chave}` };
  const { id, body } = corpo(a.op, a.dados);
  try {
    switch (a.op) {
      case "criar_lead":
        await crm.createLead(body, o);
        return "Lead cadastrado no CRM.";
      case "mover_etapa":
        await crm.moveLeadStage(id, body, o);
        return "Lead movido de etapa no CRM.";
      case "registrar_atividade":
        await crm.createActivity(body, o);
        return "Atividade registrada no CRM.";
      case "agendar_reuniao":
        await crm.createMeeting(body, o);
        return "Reuni\xE3o agendada no CRM.";
    }
  } catch (e) {
    if (e instanceof CrmError) throw new BrainError("invalid", e.message);
    throw e;
  }
}

// packages/core/src/actions.ts
function applyAction(brain2, a, actor = "voce") {
  switch (a.type) {
    case "kill_on":
      brain2.setKill(true, actor);
      return "Todos os agentes pararam e as aprova\xE7\xF5es est\xE3o bloqueadas.";
    case "kill_off":
      brain2.setKill(false, actor);
      return "Agentes liberados.";
    case "daily":
      if (brain2.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado.");
      brain2.emit("daily-requested");
      return "Rotina do dia iniciada.";
    case "pause":
      brain2.setPaused(a.agentId, true, actor);
      return `${brain2.agentName(a.agentId)} pausado.`;
    case "resume":
      brain2.setPaused(a.agentId, false, actor);
      return `${brain2.agentName(a.agentId)} retomado.`;
    case "task":
      brain2.assignTask(a.agentId, a.task, actor);
      return `${brain2.agentName(a.agentId)} come\xE7ou.`;
    case "playbook": {
      const pb = playbookById(a.id);
      if (!pb) throw new BrainError("not_found", "Plano n\xE3o encontrado.");
      if (brain2.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado.");
      brain2.audit(actor, "playbook", pb.id);
      brain2.emit("playbook-requested", pb.id);
      return `Plano "${pb.titulo}" iniciado com ${pb.passos.length} ${pb.passos.length === 1 ? "passo" : "passos"}${pb.sintese ? " e s\xEDntese do Chief no final" : ""}.`;
    }
    case "crm":
      throw new BrainError("invalid", "A\xE7\xE3o do CRM roda pela rota ass\xEDncrona.");
    case "approve_low_risk": {
      const n3 = brain2.approveLowRisk(actor);
      return `${n3} propostas de baixo risco aprovadas. Nada foi enviado: falta voc\xEA copiar e mandar cada mensagem.`;
    }
  }
}
var isAction = (x) => {
  if (!x || typeof x !== "object") return false;
  const a = x;
  switch (a.type) {
    case "kill_on":
    case "kill_off":
    case "approve_low_risk":
    case "daily":
      return true;
    case "pause":
    case "resume":
      return typeof a.agentId === "string";
    case "task":
      return typeof a.agentId === "string" && typeof a.task === "string";
    case "playbook":
      return typeof a.id === "string";
    case "crm":
      return typeof a.op === "string" && CRM_OPS.includes(a.op) && !!a.dados && typeof a.dados === "object" && !Array.isArray(a.dados) && typeof a.chave === "string" && a.chave.length >= 8 && a.chave.length <= 80;
    default:
      return false;
  }
};

// packages/core/src/dispatch.ts
var DAY = 864e5;
function suppress(brain2, email, reason) {
  run(brain2.db, "insert into email_suppression (email, reason, at) values (?, ?, ?) on conflict(email) do update set reason = excluded.reason, at = excluded.at", email.trim().toLowerCase(), reason, brain2.clock());
}
var footer = (env, prospeccao = false) => `

--
${env.RESEND_SENDER_NAME ?? "Felipe Dalpra"}, Synapsa
` + (prospeccao ? "Escrevi para o contato que a sua cl\xEDnica divulga publicamente. Para n\xE3o receber mais e-mails meus, responda SAIR." : "Para n\xE3o receber mais e-mails meus, responda SAIR.");
async function sendEmail(brain2, env, p, f = fetch) {
  const from = p.prospeccao ? env.RESEND_FROM_PROSPECCAO : env.RESEND_FROM;
  if (!env.RESEND_API_KEY || !from) throw new BrainError("invalid", "Falta RESEND_API_KEY e RESEND_FROM nos secrets do Brain.");
  const to = p.to.trim().toLowerCase();
  if (!EMAIL_RE.test(to)) throw new BrainError("invalid", "E-mail do destinat\xE1rio inv\xE1lido.");
  if (!p.subject.trim()) throw new BrainError("invalid", "Falta o assunto.");
  if (row(brain2.db, "select 1 as x from email_suppression where email = ?", to)) throw new BrainError("invalid", "Esse contato pediu para sair ou deu erro de entrega. N\xE3o envio.");
  const now = brain2.clock();
  const cap2 = brain2.policy("email_daily_cap", 20);
  const today = row(brain2.db, "select count(*) as n from envios where channel = 'email' and status = 'enviado' and at > ?", now - DAY)?.n ?? 0;
  if (today >= cap2) throw new BrainError("invalid", `Limite de ${cap2} e-mails por dia atingido. Ele sobe aos poucos para proteger o dom\xEDnio.`);
  const replyTo = p.prospeccao && env.RESEND_INBOUND || env.RESEND_REPLY_TO;
  const res = await f("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json", "idempotency-key": `brain-${p.id}` },
    body: JSON.stringify({
      from,
      to: [to],
      subject: p.subject.slice(0, 200),
      text: p.body + footer(env, p.prospeccao === true),
      ...replyTo ? { reply_to: replyTo } : {},
      headers: { "List-Unsubscribe": `<mailto:${replyTo ?? "sair@synapsa.chat"}?subject=SAIR>` }
    })
  });
  const body = await res.json().catch(() => ({}));
  const ok = res.ok;
  run(brain2.db, "insert into envios (proposal_id, channel, to_ref, status, detail, at) values (?, 'email', ?, ?, ?, ?)", p.id, to, ok ? "enviado" : "falhou", ok ? body.id ?? "" : `${res.status} ${body.message ?? ""}`.trim(), now);
  if (!ok) throw new BrainError("invalid", `O Resend recusou o envio (${res.status}): ${body.message ?? "erro"}.`);
  return `E-mail enviado para ${to}.`;
}
async function publishInstagram(brain2, env, p, f = fetch) {
  const token = env.META_SYSTEM_USER_TOKEN;
  const ig = env.META_IG_ID;
  if (!token || !ig) throw new BrainError("invalid", "Falta META_SYSTEM_USER_TOKEN ou META_IG_ID nos secrets do Brain.");
  if (!/^https:\/\//.test(p.imageUrl)) throw new BrainError("invalid", "O Instagram s\xF3 aceita imagem em link https p\xFAblico.");
  const v = env.META_GRAPH_VERSION ?? "v23.0";
  const call = async (path, params) => {
    const res = await f(`https://graph.facebook.com/${v}/${path}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(params) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.id) throw new BrainError("invalid", `Instagram recusou (${res.status}): ${body.error?.message ?? "erro"}. O token precisa da permiss\xE3o instagram_content_publish.`);
    return body.id;
  };
  const now = brain2.clock();
  try {
    const creation = await call(`${ig}/media`, { image_url: p.imageUrl, caption: p.caption.slice(0, 2200) });
    const mediaId = await call(`${ig}/media_publish`, { creation_id: creation });
    run(brain2.db, "insert into envios (proposal_id, channel, to_ref, status, detail, at) values (?, 'instagram', ?, 'enviado', ?, ?)", p.id, ig, mediaId, now);
    return "Post publicado no Instagram.";
  } catch (e) {
    run(brain2.db, "insert into envios (proposal_id, channel, to_ref, status, detail, at) values (?, 'instagram', ?, 'falhou', ?, ?)", p.id, ig, e.message.slice(0, 300), now);
    throw e;
  }
}
async function sendApproved(brain2, env, proposalId, f = fetch) {
  if (brain2.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado.");
  const p = row(brain2.db, "select id, status, draft, payload, kind from proposals where id = ?", proposalId);
  if (!p) throw new BrainError("not_found", "Proposta n\xE3o encontrada.");
  if (p.status !== "aprovada") throw new BrainError("invalid", "S\xF3 envio o que voc\xEA aprovou.");
  const e = envioOf(p.payload);
  if (!e) throw new BrainError("invalid", "Essa proposta n\xE3o tem envio autom\xE1tico: copie e mande voc\xEA.");
  if (row(brain2.db, "select 1 as x from envios where proposal_id = ? and status = 'enviado'", p.id)) throw new BrainError("already_decided", "J\xE1 foi enviada.");
  if (!p.draft?.trim()) throw new BrainError("invalid", "A proposta n\xE3o tem texto.");
  const prosp = e.tipo === "email" && e.remetente === "prospeccao";
  if (prosp && p.kind !== "resposta_lead") {
    const cap2 = Number(brain2.policy("prospect_email_daily_cap", 10));
    const hoje = row(brain2.db, "select count(*) as n from envios e join proposals pr on pr.id = e.proposal_id where e.status = 'enviado' and e.at > ? and pr.kind like 'prospeccao%'", brain2.clock() - DAY)?.n ?? 0;
    if (hoje >= cap2) throw new BrainError("invalid", `Limite de ${cap2} e-mails de prospec\xE7\xE3o por dia atingido. Ele sobe aos poucos para proteger o dom\xEDnio novo.`);
  }
  const msg2 = e.tipo === "email" ? await sendEmail(brain2, env, { id: p.id, to: e.para ?? "", subject: e.assunto ?? "", body: p.draft, prospeccao: prosp }, f) : await publishInstagram(brain2, env, { id: p.id, imageUrl: e.imagemUrl ?? "", caption: p.draft }, f);
  brain2.audit("voce", "enviou", `${e.tipo}:${p.id}`);
  brain2.emit("change");
  return msg2;
}

// packages/core/src/integrations.ts
var LOCAL_ONLY = {
  supabase: "O Brain usa SQLite (no computador ou no Durable Object da Cloudflare). N\xE3o usa Supabase.",
  cloudflare: "O Brain roda num Worker com Durable Object. O deploy \xE9 feito com o wrangler."
};
function integrationsView(db, env, now = Date.now()) {
  const checks = new Map(rows(db, "select * from integration_checks").map((c2) => [c2.integration_id, c2]));
  return mockIntegrations().map((i) => {
    if (i.state === "manual") return i;
    if (LOCAL_ONLY[i.id]) return { ...i, state: "pendente", detail: LOCAL_ONLY[i.id], syncMinutes: null };
    const missing = i.secrets.filter((s2) => !env[s2]);
    if (missing.length > 0) return { ...i, state: "pendente", detail: `Falta ${missing.join(" e ")} nos secrets do Brain (Cloudflare: Settings, Variables and Secrets; local: .env.local).`, next: `Preencher ${missing.join(" e ")} no .env.local e reiniciar o servidor.`, syncMinutes: null };
    const c2 = checks.get(i.id);
    if (!c2) return { ...i, state: "pronto", detail: "Credencial presente. Falta testar a conex\xE3o.", next: "Clicar em Testar conex\xF5es.", syncMinutes: null };
    const ago2 = Math.max(0, Math.round((now - c2.at) / 6e4));
    if (c2.ok) return { ...i, state: "conectado", detail: `${c2.detail ?? "Conex\xE3o ok"} \xB7 testada h\xE1 ${ago2} min.`, syncMinutes: i.syncMinutes };
    return { ...i, state: "pendente", detail: `O teste falhou: ${c2.detail ?? "erro"}`, next: "Conferir a credencial e testar de novo.", syncMinutes: null };
  });
}

// packages/core/src/crm-data.ts
var FONTES_CRM = ["crm_resumo", "crm_leads", "crm_atividades", "crm_reunioes", "crm_funil"];
var FILTROS = {
  crm_leads: ["search", "status", "origin", "responsible_id", "classification", "lead_type", "created_from", "created_to", "sort", "order"],
  crm_atividades: ["lead_id", "status", "type", "responsible_id", "scheduled_from", "scheduled_to"],
  crm_reunioes: ["lead_id", "status", "scheduled_from", "scheduled_to"],
  crm_resumo: ["from", "to", "stale_days"],
  crm_funil: ["from", "to"]
};
var LEAD_CAMPOS = ["id", "name", "lead_type", "origin", "responsible_id", "classification", "status", "position", "next_action", "follow_up_date", "lead_score", "last_interaction_at", "plan_interest", "professionals_count", "current_system", "main_challenge", "decision_timeline", "is_decision_maker", "created_at", "updated_at"];
function leadSeguro(l) {
  const out = {};
  for (const k of LEAD_CAMPOS) if (l[k] !== void 0) out[k] = l[k];
  out.tem_telefone = !!l.phone;
  out.tem_email = !!l.email;
  out.tem_instagram = !!l.instagram;
  return out;
}
var limpar = (fonte, f) => {
  const ok = new Set(FILTROS[fonte] ?? []);
  const out = {};
  for (const [k, v] of Object.entries(f ?? {})) if (ok.has(k) && (typeof v === "string" || typeof v === "number")) out[k] = String(v).slice(0, 100);
  return out;
};
var NAO_CONFIGURADO = { indisponivel: "O CRM n\xE3o est\xE1 conectado: faltam SYNAPSA_CRM_API_KEY e SYNAPSA_CRM_API_BASE_URL nos secrets do Brain." };
async function crmDados(env, fonte, opts = {}, f = fetch) {
  const cli = crmClient(env, f);
  if (!cli) return NAO_CONFIGURADO;
  const filtros = limpar(fonte, opts.filtros);
  const page = Math.max(1, Math.round(opts.pagina ?? 1));
  const page_size = Math.min(Math.max(Math.round(opts.tamanho ?? 25), 1), 50);
  try {
    switch (fonte) {
      case "crm_resumo": {
        const [overview2, stages, summary] = await Promise.all([cli.overview({ stale_days: 7, ...filtros }), cli.stages(), cli.pipelineSummary({ from: filtros.from, to: filtros.to })]);
        return { visao_geral: overview2.data, etapas_do_funil: stages.data, resumo_do_pipeline: summary.data, fonte: "CRM Synapsa (leitura)" };
      }
      case "crm_leads": {
        const r = await cli.leads({ ...filtros, page, page_size });
        return { leads: r.data.map(leadSeguro), pagina: r.meta.page, por_pagina: r.meta.page_size, total: r.meta.total, total_de_paginas: r.meta.total_pages, observacao: "Telefone, e-mail e Instagram ficam fora desta leitura." };
      }
      case "crm_atividades": {
        const r = await cli.activities({ ...filtros, page, page_size });
        return { atividades: r.data, pagina: r.meta.page, total: r.meta.total, total_de_paginas: r.meta.total_pages };
      }
      case "crm_reunioes": {
        const r = await cli.meetings({ ...filtros, page, page_size });
        return { reunioes: r.data, pagina: r.meta.page, total: r.meta.total, total_de_paginas: r.meta.total_pages };
      }
      case "crm_funil": {
        const [funil, evolucao] = await Promise.all([cli.funnel(filtros), cli.pipelineEvolution(filtros)]);
        return { funil: funil.data, evolucao: evolucao.data };
      }
      default:
        throw new Error(`Fonte do CRM desconhecida: ${fonte}.`);
    }
  } catch (e) {
    if (e instanceof CrmError) throw new Error(`${e.message}${e.requestId ? ` (request_id ${e.requestId})` : ""}`);
    throw e;
  }
}

// packages/core/src/meta.ts
var LEAD_TYPES = /* @__PURE__ */ new Set(["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"]);
function parseAdsInsights(adAccountId, data) {
  return data.map((r) => {
    const leads = Math.max(0, ...(r.actions ?? []).filter((a) => LEAD_TYPES.has(a.action_type)).map((a) => Number(a.value) || 0));
    return {
      day: r.date_start,
      ad_account_id: adAccountId,
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name,
      currency: r.account_currency ?? "BRL",
      spend: Number(r.spend ?? 0),
      impressions: Number(r.impressions ?? 0),
      clicks: Number(r.clicks ?? 0),
      leads
    };
  });
}
function wastedSpend(rows2, minSpend) {
  const by = /* @__PURE__ */ new Map();
  for (const r of rows2) {
    const c2 = by.get(r.campaign_id) ?? { campaign_id: r.campaign_id, campaign_name: r.campaign_name, spend: 0, clicks: 0, leads: 0 };
    c2.spend = Math.round((c2.spend + r.spend) * 100) / 100;
    c2.clicks += r.clicks;
    c2.leads += r.leads;
    by.set(r.campaign_id, c2);
  }
  return [...by.values()].filter((c2) => c2.leads === 0 && c2.spend >= minSpend).map(({ leads: _l, ...c2 }) => c2).sort((a, b) => b.spend - a.spend);
}
async function graphGet(version, path, params, token) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`https://graph.facebook.com/${version}/${path}?${qs}`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`meta ${path}: ${res.status}`);
  return await res.json();
}
async function fetchAdsInsights(version, adAccountId, token, days = 7) {
  const rows2 = [];
  const acct = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  let next = null;
  const first = await graphGet(
    version,
    `${acct}/insights`,
    { level: "campaign", time_increment: "1", ...days > 30 ? { time_range: JSON.stringify({ since: new Date(Date.now() - days * 864e5).toISOString().slice(0, 10), until: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) }) } : { date_preset: days <= 7 ? "last_7d" : "last_30d" }, fields: "campaign_id,campaign_name,account_currency,spend,impressions,clicks,actions", limit: "200" },
    token
  );
  rows2.push(...parseAdsInsights(acct, first.data));
  next = first.paging?.next ?? null;
  for (let i = 0; next && i < 20; i++) {
    const res = await fetch(next, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`meta insights paging: ${res.status}`);
    const page = await res.json();
    rows2.push(...parseAdsInsights(acct, page.data));
    next = page.paging?.next ?? null;
  }
  return rows2;
}
async function fetchInstagram(version, igId, token, now = /* @__PURE__ */ new Date()) {
  const base = await graphGet(version, igId, { fields: "followers_count" }, token);
  const insights = await graphGet(
    version,
    `${igId}/insights`,
    { metric: "reach,profile_views", period: "day", metric_type: "total_value" },
    token
  ).catch(() => ({ data: [] }));
  const get2 = (name) => insights.data.find((m) => m.name === name)?.total_value?.value ?? null;
  return { day: now.toISOString().slice(0, 10), ig_id: igId, followers: base.followers_count ?? null, reach: get2("reach"), profile_views: get2("profile_views") };
}
async function fetchIgPosts(version, igId, token, limit = 12) {
  const r = await graphGet(
    version,
    `${igId}/media`,
    { fields: "id,media_type,timestamp,like_count,comments_count,permalink,caption", limit: String(limit) },
    token
  );
  return r.data.map((m) => ({ id: m.id, tipo: m.media_type ?? null, data: m.timestamp ?? null, curtidas: m.like_count ?? null, comentarios: m.comments_count ?? null, link: m.permalink ?? null, legenda: m.caption ? m.caption.slice(0, 140) : null }));
}
async function fetchIgFollowerSeries(version, igId, token, days = 14, now = /* @__PURE__ */ new Date()) {
  const until = Math.floor(now.getTime() / 1e3);
  const since2 = until - days * 86400;
  const r = await graphGet(version, `${igId}/insights`, { metric: "follower_count", period: "day", since: String(since2), until: String(until) }, token);
  const m = r.data.find((x) => x.name === "follower_count");
  return (m?.values ?? []).map((v) => ({ day: v.end_time.slice(0, 10), novos: v.value }));
}
async function fetchIgPostMetricas(version, igId, token, limit = 30) {
  const base = await fetchIgPosts(version, igId, token, limit);
  const erros = [];
  const posts = [];
  for (const p of base) {
    let m = {};
    for (const metricas of ["reach,saved,shares,total_interactions,views", "reach,saved,shares,total_interactions", "reach,saved"]) {
      try {
        const r = await graphGet(version, `${p.id}/insights`, { metric: metricas }, token);
        m = Object.fromEntries(r.data.map((d) => [d.name, d.values?.[0]?.value ?? d.total_value?.value ?? 0]));
        break;
      } catch (e) {
        if (metricas === "reach,saved") erros.push(`${p.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    posts.push({ id: p.id, tipo: p.tipo, publicado: p.data, link: p.link, legenda: p.legenda, curtidas: p.curtidas, comentarios: p.comentarios, alcance: m.reach ?? null, salvos: m.saved ?? null, compartilhados: m.shares ?? null, views: m.views ?? null, interacoes: m.total_interactions ?? null });
  }
  return { posts, erros };
}
var ACT = (id) => id.startsWith("act_") ? id : `act_${id}`;
var dia = (ms2) => new Date(ms2 - 3 * 36e5).toISOString().slice(0, 10);
var leadsDe = (actions) => Math.max(0, ...(actions ?? []).filter((a) => LEAD_TYPES.has(a.action_type)).map((a) => Number(a.value) || 0));
async function paginar(primeira, token, max = 40) {
  const out = [...primeira.data];
  let next = primeira.paging?.next ?? null;
  for (let i = 0; next && i < max; i++) {
    const res = await fetch(next, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`meta pagina\xE7\xE3o: ${res.status}`);
    const p = await res.json();
    out.push(...p.data);
    next = p.paging?.next ?? null;
  }
  return out;
}
async function fetchAdDia(version, adAccountId, token, de, ate) {
  const primeira = await graphGet(
    version,
    `${ACT(adAccountId)}/insights`,
    { level: "ad", time_increment: "1", time_range: JSON.stringify({ since: de, until: ate }), fields: "ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,spend,impressions,reach,clicks,inline_link_clicks,actions", limit: "500" },
    token
  );
  const todos = await paginar(primeira, token);
  return todos.map((r) => ({
    day: String(r.date_start),
    ad_id: String(r.ad_id),
    ad_name: String(r.ad_name ?? ""),
    adset_id: String(r.adset_id ?? ""),
    adset_name: String(r.adset_name ?? ""),
    campaign_id: String(r.campaign_id ?? ""),
    campaign_name: String(r.campaign_name ?? ""),
    spend: Number(r.spend ?? 0),
    impressions: Number(r.impressions ?? 0),
    reach: Number(r.reach ?? 0),
    clicks: Number(r.clicks ?? 0),
    link_clicks: Number(r.inline_link_clicks ?? 0),
    leads: leadsDe(r.actions)
  }));
}
async function fetchCriativos(version, adAccountId, token) {
  const primeira = await graphGet(
    version,
    `${ACT(adAccountId)}/ads`,
    { fields: "id,name,effective_status,created_time,campaign{name},adset{name},creative.thumbnail_width(480).thumbnail_height(480){thumbnail_url,image_url,body,title,call_to_action_type,instagram_permalink_url}", limit: "100" },
    token
  );
  const todos = await paginar(primeira, token, 10);
  return todos.map((a) => ({
    ad_id: String(a.id),
    nome: String(a.name ?? ""),
    status: String(a.effective_status ?? ""),
    criado: a.created_time ?? null,
    campanha: String(a.campaign?.name ?? ""),
    conjunto: String(a.adset?.name ?? ""),
    miniatura: a.creative?.thumbnail_url ?? null,
    imagem: a.creative?.image_url ?? null,
    texto: a.creative?.body ? String(a.creative.body).slice(0, 600) : null,
    titulo: a.creative?.title ?? null,
    cta: a.creative?.call_to_action_type ?? null,
    link_ig: a.creative?.instagram_permalink_url ?? null
  }));
}
async function fetchPixels(version, adAccountId, token) {
  const r = await graphGet(version, `${ACT(adAccountId)}/adspixels`, { fields: "id,name,last_fired_time,is_unavailable", limit: "25" }, token);
  return r.data.map((p) => ({ pixel_id: p.id, nome: p.name ?? p.id, ultimo_disparo: p.last_fired_time ?? null, indisponivel: p.is_unavailable === true }));
}
async function fetchPixelEventos(version, pixelId, token, deMs, ateMs) {
  const soma2 = /* @__PURE__ */ new Map();
  for (let ini = deMs; ini < ateMs; ini += 7 * 864e5) {
    const fim = Math.min(ateMs, ini + 7 * 864e5);
    const r = await graphGet(
      version,
      `${pixelId}/stats`,
      { aggregation: "event", start_time: String(Math.floor(ini / 1e3)), end_time: String(Math.floor(fim / 1e3)) },
      token
    );
    for (const b of r.data ?? []) for (const e of b.data ?? []) {
      const k = `${dia(Date.parse(b.start_time))}|${e.value}`;
      soma2.set(k, (soma2.get(k) ?? 0) + (Number(e.count) || 0));
    }
  }
  return [...soma2.entries()].map(([k, total]) => {
    const [day, evento] = k.split("|");
    return { day, evento, total };
  });
}
var QUEBRAS = [
  { tipo: "posicionamento", breakdowns: "publisher_platform,platform_position", chave: (r) => `${r.publisher_platform ?? "?"} \xB7 ${r.platform_position ?? "?"}` },
  { tipo: "idade_genero", breakdowns: "age,gender", chave: (r) => `${r.age ?? "?"} \xB7 ${r.gender === "female" ? "mulheres" : r.gender === "male" ? "homens" : "n/i"}` },
  { tipo: "dispositivo", breakdowns: "device_platform", chave: (r) => r.device_platform ?? "?" }
];
async function fetchQuebras(version, adAccountId, token, de, ate) {
  const linhas = [];
  const erros = [];
  for (const q of QUEBRAS) {
    try {
      const primeira = await graphGet(
        version,
        `${ACT(adAccountId)}/insights`,
        { level: "account", time_increment: "1", breakdowns: q.breakdowns, time_range: JSON.stringify({ since: de, until: ate }), fields: "spend,impressions,clicks,actions", limit: "500" },
        token
      );
      for (const r of await paginar(primeira, token, 20)) linhas.push({ day: String(r.date_start), tipo: q.tipo, chave: q.chave(r), spend: Number(r.spend ?? 0), impressions: Number(r.impressions ?? 0), clicks: Number(r.clicks ?? 0), leads: leadsDe(r.actions) });
    } catch (e) {
      erros.push(`${q.tipo}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { linhas, erros };
}
async function fetchIgDia(version, igId, token, day) {
  const ini = Math.floor(Date.parse(`${day}T00:00:00-03:00`) / 1e3);
  const get2 = async (metric) => {
    try {
      const r = await graphGet(version, `${igId}/insights`, { metric, period: "day", metric_type: "total_value", since: String(ini), until: String(ini + 86400) }, token);
      return r.data[0]?.total_value?.value ?? null;
    } catch {
      return null;
    }
  };
  const [reach, profile_views, link_taps, interacoes] = await Promise.all([get2("reach"), get2("profile_views"), get2("profile_links_taps"), get2("total_interactions")]);
  return { day, reach, profile_views, link_taps, interacoes };
}

// packages/core/src/data.ts
var FONTES = ["resumo", "receita", "clientes", "anuncios", "instagram", "execucoes", "propostas", "entregas", ...FONTES_CRM];
var r2 = (n3) => Math.round(n3 * 100) / 100;
var ACTIVE2 = ["active", "trialing", "past_due"];
var metaEnv = (env) => {
  const token = env.META_SYSTEM_USER_TOKEN;
  if (!token) throw new Error("Falta META_SYSTEM_USER_TOKEN nos secrets do Brain.");
  return { token, version: env.META_GRAPH_VERSION ?? "v23.0" };
};
async function syncAds(brain2, env, now, days = 7) {
  const { token, version } = metaEnv(env);
  const acct = env.META_AD_ACCOUNT_ID;
  if (!acct) throw new Error("Falta META_AD_ACCOUNT_ID.");
  const ads = await fetchAdsInsights(version, acct, token, days);
  for (const r of ads) {
    run(
      brain2.db,
      `insert into meta_ads_daily (day, ad_account_id, campaign_id, campaign_name, currency, spend, impressions, clicks, leads, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      on conflict(day, campaign_id) do update set spend = excluded.spend, impressions = excluded.impressions, clicks = excluded.clicks, leads = excluded.leads, updated_at = excluded.updated_at`,
      r.day,
      r.ad_account_id,
      r.campaign_id,
      r.campaign_name,
      r.currency,
      r.spend,
      r.impressions,
      r.clicks,
      r.leads,
      now
    );
  }
  return ads;
}
async function syncIg(brain2, env, now) {
  const { token, version } = metaEnv(env);
  const igId = env.META_IG_ID;
  if (!igId) throw new Error("Falta META_IG_ID.");
  const ig = await fetchInstagram(version, igId, token, new Date(now));
  run(brain2.db, `insert into instagram_daily (day, ig_id, followers, reach, profile_views, updated_at) values (?, ?, ?, ?, ?, ?)
    on conflict(day, ig_id) do update set followers = excluded.followers, reach = excluded.reach, profile_views = excluded.profile_views, updated_at = excluded.updated_at`, ig.day, ig.ig_id, ig.followers, ig.reach, ig.profile_views, now);
  return ig;
}
async function syncMeta(brain2, env, now, days = 7) {
  const [ads, ig] = await Promise.allSettled([syncAds(brain2, env, now, days), env.META_IG_ID ? syncIg(brain2, env, now) : Promise.resolve(null)]);
  return { ads: ads.status === "fulfilled" ? ads.value : null, adsErro: ads.status === "rejected" ? ads.reason.message : null, ig: ig.status === "fulfilled" ? ig.value : null, igErro: ig.status === "rejected" ? ig.reason.message : null };
}
var since = (days, now) => brtDay(now - days * 864e5);
function receita(brain2, dias) {
  const now = brain2.clock();
  const m = brain2.metrics();
  const hist = rows(brain2.db, "select day, source, mrr_brl, subs_count from mrr_daily where day >= ? order by day, source", since(dias, now));
  const subs = rows(brain2.db, "select source, external_id, label, status, list_price_brl, effective_price_brl, discount_ends_at, origin from subscriptions");
  const ativos = subs.filter((s2) => ACTIVE2.includes(s2.status));
  const reajuste = ativos.filter((s2) => s2.discount_ends_at).reduce((n3, s2) => n3 + (s2.list_price_brl - s2.effective_price_brl), 0);
  return {
    mrr_atual: m.mrr,
    falta_para_meta_brl: r2(Math.max(0, m.mrr.goal - m.mrr.total)),
    clientes_ativos: ativos.length,
    clientes_cancelados: subs.filter((s2) => s2.status === "canceled").length,
    ticket_medio_brl: ativos.length ? r2(m.mrr.total / ativos.length) : 0,
    mrr_quando_todos_os_descontos_acabarem_brl: r2(m.mrr.total + reajuste),
    fins_de_desconto: m.descontos,
    historico_mrr_por_dia: hist,
    observacao: hist.length < 2 ? "O Brain s\xF3 guarda o hist\xF3rico desde que a rotina di\xE1ria come\xE7ou; ainda h\xE1 poucos dias." : void 0
  };
}
function clientes(brain2) {
  const subs = rows(brain2.db, "select source, external_id, label, status, list_price_brl, effective_price_brl, discount_ends_at, origin from subscriptions order by source, status, external_id");
  return {
    total_ativos: subs.filter((s2) => ACTIVE2.includes(s2.status)).length,
    lista: subs.map((s2) => ({ fonte: s2.source, id: s2.external_id, nome: s2.label, status: s2.status, preco_cheio_brl: s2.list_price_brl, preco_efetivo_brl: s2.effective_price_brl, desconto_acaba_em: s2.discount_ends_at, origem_do_dado: s2.origin })),
    aviso: "Fonte 'pix' \xE9 informada por voc\xEA, n\xE3o lida de um banco. Fonte 'stripe' \xE9 lida do Stripe."
  };
}
async function anuncios(brain2, env, dias, atualizar) {
  const now = brain2.clock();
  const avisos = [];
  const have = row(brain2.db, "select count(*) as n, max(updated_at) as u from meta_ads_daily");
  const stale = !have.u || now - have.u > 3 * 36e5;
  if ((atualizar || stale) && (atualizar || env.META_SYSTEM_USER_TOKEN)) {
    try {
      await syncAds(brain2, env, now, dias > 7 ? 30 : 7);
    } catch (e) {
      avisos.push(`N\xE3o consegui atualizar da Meta: ${e instanceof Error ? e.message : String(e)}. Usei o \xFAltimo dado guardado.`);
    }
  }
  const camp = rows(
    brain2.db,
    "select campaign_id, campaign_name, sum(spend) as spend, sum(impressions) as impressions, sum(clicks) as clicks, sum(leads) as leads, count(*) as dias from meta_ads_daily where day >= ? group by campaign_id, campaign_name order by spend desc",
    since(dias, now)
  );
  const tot = camp.reduce((a, c2) => ({ spend: a.spend + c2.spend, impressions: a.impressions + c2.impressions, clicks: a.clicks + c2.clicks, leads: a.leads + c2.leads }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });
  const atualizado = row(brain2.db, "select max(updated_at) as u from meta_ads_daily")?.u;
  return {
    periodo_dias: dias,
    atualizado_em: atualizado ? new Date(atualizado).toISOString() : null,
    total: { gasto_brl: r2(tot.spend), impressoes: tot.impressions, cliques: tot.clicks, leads: tot.leads, ctr_pct: tot.impressions ? r2(tot.clicks / tot.impressions * 100) : null, custo_por_lead_brl: tot.leads ? r2(tot.spend / tot.leads) : null, cpc_brl: tot.clicks ? r2(tot.spend / tot.clicks) : null },
    campanhas: camp.map((c2) => ({ id: c2.campaign_id, nome: c2.campaign_name, gasto_brl: r2(c2.spend), impressoes: c2.impressions, cliques: c2.clicks, leads: c2.leads, custo_por_lead_brl: c2.leads ? r2(c2.spend / c2.leads) : null, dias_com_dado: c2.dias })),
    por_dia: rows(brain2.db, "select day, sum(spend) as gasto_brl, sum(clicks) as cliques, sum(leads) as leads from meta_ads_daily where day >= ? group by day order by day", since(dias, now)),
    avisos: avisos.length ? avisos : void 0,
    nota: camp.length === 0 ? "A conta de an\xFAncios n\xE3o teve gasto nesse per\xEDodo." : void 0
  };
}
async function refreshInstagram(brain2, env, dias = 30) {
  const avisos = [];
  const token = env.META_SYSTEM_USER_TOKEN;
  const igId = env.META_IG_ID;
  if (!token || !igId) return ["Falta META_SYSTEM_USER_TOKEN ou META_IG_ID nos secrets."];
  const version = env.META_GRAPH_VERSION ?? "v23.0";
  const now = brain2.clock();
  await syncIg(brain2, env, now).catch((e) => avisos.push(`Seguidores: ${e instanceof Error ? e.message : String(e)}`));
  const posts = await fetchIgPosts(version, igId, token, 12).catch((e) => (avisos.push(`Posts: ${e instanceof Error ? e.message : String(e)}`), null));
  if (posts) brain2.setPolicy("cache_ig_posts", { at: now, posts });
  const met = await fetchIgPostMetricas(version, igId, token, 30).catch((e) => (avisos.push(`M\xE9tricas por post: ${e instanceof Error ? e.message : String(e)}`), null));
  if (met) {
    for (const p of met.posts)
      run(
        brain2.db,
        `insert into ig_post_metricas (media_id, tipo, publicado, permalink, legenda, curtidas, comentarios, alcance, salvos, compartilhados, views, interacoes, atualizado_em) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        on conflict(media_id) do update set tipo = excluded.tipo, permalink = excluded.permalink, legenda = excluded.legenda, curtidas = excluded.curtidas, comentarios = excluded.comentarios, alcance = excluded.alcance, salvos = excluded.salvos, compartilhados = excluded.compartilhados, views = excluded.views, interacoes = excluded.interacoes, atualizado_em = excluded.atualizado_em`,
        p.id,
        p.tipo,
        p.publicado,
        p.link,
        p.legenda,
        p.curtidas,
        p.comentarios,
        p.alcance,
        p.salvos,
        p.compartilhados,
        p.views,
        p.interacoes,
        now
      );
    if (met.erros.length) avisos.push(`M\xE9tricas de ${met.erros.length} post(s) indispon\xEDveis: ${met.erros[0]}`);
  }
  const novos = await fetchIgFollowerSeries(version, igId, token, Math.min(dias, 30), new Date(now)).catch((e) => (avisos.push(`Seguidores por dia: ${e instanceof Error ? e.message : String(e)}`), null));
  if (novos) brain2.setPolicy("cache_ig_novos", { at: now, novos });
  return avisos;
}
function instagramGuardado(brain2, dias) {
  const now = brain2.clock();
  const hist = rows(brain2.db, "select day, followers, reach, profile_views from instagram_daily where day >= ? order by day", since(dias, now));
  const posts = brain2.policy("cache_ig_posts", null);
  const novos = brain2.policy("cache_ig_novos", null);
  const eng = posts?.posts.length ? posts.posts.reduce((n3, p) => n3 + (p.curtidas ?? 0) + (p.comentarios ?? 0), 0) / posts.posts.length : null;
  return {
    seguidores_hoje: hist.at(-1)?.followers ?? null,
    historico_guardado: hist,
    seguidores_novos_por_dia: novos?.novos,
    ultimos_posts: posts?.posts,
    engajamento_medio_por_post: eng === null ? null : r2(eng),
    atualizado_em: posts?.at ? new Date(posts.at).toISOString() : null
  };
}
async function instagram(brain2, env, dias, atualizar) {
  const now = brain2.clock();
  let avisos = [];
  const fresh = brain2.policy("cache_ig_posts", null);
  if (atualizar || !fresh || now - fresh.at > 3 * 36e5) avisos = await refreshInstagram(brain2, env, dias);
  return { ...instagramGuardado(brain2, dias), avisos: avisos.length ? avisos : void 0 };
}
function execucoes(brain2, equipe) {
  const areas = TEAMS.find((t) => t.id === equipe)?.areas;
  const ids = AGENTS.filter((a) => !areas || areas.includes(a.area)).map((a) => a.id);
  const q = rows(
    brain2.db,
    "select id, agent_id, task, status, requested_by, created_at, cost_brl, result, error from agent_runs where agent_id != 'jarvis' order by id desc limit 60"
  ).filter((r) => ids.includes(r.agent_id));
  return q.slice(0, 25).map((r) => ({ id: r.id, agente: r.agent_id, tarefa: r.task, status: r.status, pedido_por: r.requested_by, quando: new Date(r.created_at).toISOString(), custo_brl: r.cost_brl, resultado: r.result ?? r.error }));
}
function entregas(brain2, equipe) {
  const areas = TEAMS.find((t) => t.id === equipe)?.areas;
  const ids = AGENTS.filter((a) => !areas || areas.includes(a.area)).map((a) => a.id);
  return rows(brain2.db, "select id, agent_id, title, body, at from deliverables order by id desc limit 40").filter((d) => ids.includes(d.agent_id)).slice(0, 10).map((d) => ({ id: d.id, agente: d.agent_id, titulo: d.title, quando: new Date(d.at).toISOString(), texto: d.body.slice(0, 2500) }));
}
function propostas(brain2) {
  return rows(brain2.db, "select id, agent_id as agente, title as titulo, status, impacto_brl, risk as risco, channel as canal, review_note, created_at from proposals order by created_at desc limit 30");
}
function resumo(brain2) {
  return { receita: receita(brain2, 30), propostas_pendentes: propostas(brain2).filter((p) => p.status === "pendente").length };
}
async function consultarDados(ctx, fonte, opts = {}) {
  const dias = Math.min(Math.max(Math.round(opts.dias ?? 14), 1), 90);
  switch (fonte) {
    case "resumo":
      return resumo(ctx.brain);
    case "receita":
      return receita(ctx.brain, dias);
    case "clientes":
      return clientes(ctx.brain);
    case "anuncios":
      return anuncios(ctx.brain, ctx.env, dias, opts.atualizar === true);
    case "instagram":
      return instagram(ctx.brain, ctx.env, dias, opts.atualizar === true);
    case "execucoes":
      return execucoes(ctx.brain, opts.equipe);
    case "propostas":
      return propostas(ctx.brain);
    case "entregas":
      return entregas(ctx.brain, opts.equipe);
    case "crm_resumo":
    case "crm_leads":
    case "crm_atividades":
    case "crm_reunioes":
    case "crm_funil":
      return crmDados(ctx.env, fonte, { filtros: opts.filtros, pagina: opts.pagina }, ctx.fetchFn);
    default:
      throw new Error(`Fonte desconhecida: ${fonte}. Use: ${FONTES.join(", ")}.`);
  }
}
var DADOS_TOOL = {
  name: "consultar_dados",
  description: "Dados reais e atuais do neg\xF3cio. fonte: receita (MRR, hist\xF3rico, clientes ativos, fins de desconto, proje\xE7\xE3o), clientes (lista de assinaturas Stripe e Pix), anuncios (Meta Ads por campanha: gasto, cliques, leads, custo por lead), instagram (seguidores, alcance, posts recentes com curtidas e coment\xE1rios), execucoes (o que cada agente fez), propostas (fila e hist\xF3rico), entregas (documentos completos que os agentes produziram), crm_resumo (CRM: leads, funil, convers\xE3o, atividades atrasadas), crm_leads (lista de leads do CRM, com filtros), crm_atividades, crm_reunioes, crm_funil. O CRM \xE9 s\xF3 leitura e n\xE3o devolve telefone nem e-mail. Use atualizar=true para ler de novo da Meta agora. Sempre consulte antes de dizer que n\xE3o tem um dado.",
  input_schema: {
    type: "object",
    properties: {
      fonte: { type: "string", enum: [...FONTES] },
      dias: { type: "number", description: "Janela em dias (1 a 90). An\xFAncios s\xF3 t\xEAm 7 ou 30 dias na Meta." },
      atualizar: { type: "boolean", description: "L\xEA da Meta agora em vez de usar o \xFAltimo dado guardado." },
      filtros: { type: "object", description: "S\xF3 para fontes crm_*. crm_leads: search, status, origin, classification, lead_type, created_from, created_to. crm_atividades: lead_id, status, type, scheduled_from, scheduled_to. crm_reunioes: lead_id, status, scheduled_from, scheduled_to. crm_resumo/crm_funil: from, to, stale_days.", additionalProperties: { type: "string" } },
      pagina: { type: "number", description: "P\xE1gina (25 por p\xE1gina) para crm_leads, crm_atividades e crm_reunioes." }
    },
    required: ["fonte"]
  }
};
function dashboardData(brain2) {
  const now = brain2.clock();
  const serie = rows(brain2.db, "select day, source, mrr_brl from mrr_daily where day >= ? order by day", since(60, now));
  const byDay = /* @__PURE__ */ new Map();
  for (const r of serie) {
    const d = byDay.get(r.day) ?? { day: r.day, stripe: 0, pix: 0, manual: 0, total: 0 };
    if (r.source === "total") d.total = r.mrr_brl;
    else if (r.source === "stripe" || r.source === "pix" || r.source === "manual") d[r.source] = r.mrr_brl;
    byDay.set(r.day, d);
  }
  const camp = rows(
    brain2.db,
    "select campaign_id, campaign_name, sum(spend) as spend, sum(impressions) as impressions, sum(clicks) as clicks, sum(leads) as leads from meta_ads_daily where day >= ? group by campaign_id, campaign_name order by spend desc",
    since(30, now)
  );
  const tot = camp.reduce((a, c2) => ({ spend: a.spend + c2.spend, clicks: a.clicks + c2.clicks, leads: a.leads + c2.leads, impressions: a.impressions + c2.impressions }), { spend: 0, clicks: 0, leads: 0, impressions: 0 });
  const adsAt = row(brain2.db, "select max(updated_at) as u from meta_ads_daily")?.u ?? null;
  return {
    agora: now,
    receita: receita(brain2, 60),
    mrrSerie: [...byDay.values()],
    clientes: clientes(brain2),
    anuncios: {
      atualizadoEm: adsAt,
      gasto: r2(tot.spend),
      cliques: tot.clicks,
      leads: tot.leads,
      impressoes: tot.impressions,
      custoPorLead: tot.leads ? r2(tot.spend / tot.leads) : null,
      campanhas: camp.map((c2) => ({ id: c2.campaign_id, nome: c2.campaign_name, gasto: r2(c2.spend), cliques: c2.clicks, leads: c2.leads })),
      porDia: rows(brain2.db, "select day, sum(spend) as gasto, sum(leads) as leads from meta_ads_daily where day >= ? group by day order by day", since(30, now))
    },
    instagram: instagramGuardado(brain2, 60),
    custoIa: { mes: brain2.metrics().llmSpentMonthBrl, teto: brain2.metrics().llmCapMonthlyBrl }
  };
}
async function refreshDados(brain2, env) {
  const avisos = [];
  await syncAds(brain2, env, brain2.clock(), 60).catch((e) => avisos.push(`An\xFAncios: ${e instanceof Error ? e.message : String(e)}`));
  avisos.push(...await refreshInstagram(brain2, env, 30));
  brain2.emit("change");
  return avisos;
}

// packages/core/src/midia-sync.ts
var msg = (e) => e instanceof Error ? e.message : String(e);
function explicar(parte, e) {
  const m = msg(e);
  if (/: 4(00|03)\b|permission|OAuth/i.test(m)) return `${m}. O token da Meta provavelmente n\xE3o tem a permiss\xE3o necess\xE1ria para ${parte}: confira ads_read (an\xFAncios e pixel) e instagram_manage_insights (Instagram) no usu\xE1rio de sistema.`;
  return m;
}
async function sincronizarMidia(brain2, env, opts = {}) {
  const out = [];
  const token = env.META_SYSTEM_USER_TOKEN;
  if (!token) return [{ parte: "Meta", ok: false, erro: "Falta META_SYSTEM_USER_TOKEN nos secrets." }];
  const version = env.META_GRAPH_VERSION ?? "v23.0";
  const acct = env.META_AD_ACCOUNT_ID;
  const igId = env.META_IG_ID;
  const now = brain2.clock();
  const dias = Math.min(Math.max(opts.dias ?? 90, 7), 400);
  const de = brtDay(now - dias * 864e5), ate = brtDay(now);
  const parte = async (nome, fn) => {
    try {
      out.push({ parte: nome, ok: true, linhas: await fn() });
    } catch (e) {
      out.push({ parte: nome, ok: false, erro: explicar(nome.toLowerCase(), e) });
    }
  };
  if (acct) {
    await parte("An\xFAncios por criativo", async () => {
      const ads = await fetchAdDia(version, acct, token, de, ate);
      for (const r of ads)
        run(
          brain2.db,
          `insert into meta_ad_dia (day, ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name, spend, impressions, reach, clicks, link_clicks, leads, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict(day, ad_id) do update set ad_name = excluded.ad_name, adset_name = excluded.adset_name, campaign_name = excluded.campaign_name, spend = excluded.spend, impressions = excluded.impressions, reach = excluded.reach, clicks = excluded.clicks, link_clicks = excluded.link_clicks, leads = excluded.leads, updated_at = excluded.updated_at`,
          r.day,
          r.ad_id,
          r.ad_name,
          r.adset_id,
          r.adset_name,
          r.campaign_id,
          r.campaign_name,
          r.spend,
          r.impressions,
          r.reach,
          r.clicks,
          r.link_clicks,
          r.leads,
          now
        );
      return ads.length;
    });
    await parte("Criativos", async () => {
      const cs = await fetchCriativos(version, acct, token);
      for (const c2 of cs)
        run(
          brain2.db,
          `insert into meta_criativo (ad_id, nome, status, criado, campanha, conjunto, miniatura, imagem, texto, titulo, cta, link_ig, atualizado_em) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict(ad_id) do update set nome = excluded.nome, status = excluded.status, campanha = excluded.campanha, conjunto = excluded.conjunto, miniatura = excluded.miniatura, imagem = excluded.imagem, texto = excluded.texto, titulo = excluded.titulo, cta = excluded.cta, link_ig = excluded.link_ig, atualizado_em = excluded.atualizado_em`,
          c2.ad_id,
          c2.nome,
          c2.status,
          c2.criado,
          c2.campanha,
          c2.conjunto,
          c2.miniatura,
          c2.imagem,
          c2.texto,
          c2.titulo,
          c2.cta,
          c2.link_ig,
          now
        );
      return cs.length;
    });
    await parte("Pixel", async () => {
      const px = await fetchPixels(version, acct, token);
      let n3 = 0;
      for (const p of px.slice(0, 5)) {
        run(brain2.db, `insert into meta_pixel (pixel_id, nome, ultimo_disparo, indisponivel, atualizado_em) values (?, ?, ?, ?, ?) on conflict(pixel_id) do update set nome = excluded.nome, ultimo_disparo = excluded.ultimo_disparo, indisponivel = excluded.indisponivel, atualizado_em = excluded.atualizado_em`, p.pixel_id, p.nome, p.ultimo_disparo, p.indisponivel ? 1 : 0, now);
        const ev = await fetchPixelEventos(version, p.pixel_id, token, now - Math.min(dias, 90) * 864e5, now).catch((e) => {
          throw new Error(`eventos do pixel ${p.nome}: ${msg(e)}`);
        });
        for (const e of ev) {
          run(brain2.db, "insert into meta_pixel_dia (day, pixel_id, evento, total) values (?, ?, ?, ?) on conflict(day, pixel_id, evento) do update set total = excluded.total", e.day, p.pixel_id, e.evento, e.total);
          n3++;
        }
      }
      return px.length;
    });
    await parte("P\xFAblicos e posicionamentos", async () => {
      const q = await fetchQuebras(version, acct, token, de, ate);
      for (const r of q.linhas) run(brain2.db, "insert into meta_quebra_dia (day, tipo, chave, spend, impressions, clicks, leads) values (?, ?, ?, ?, ?, ?, ?) on conflict(day, tipo, chave) do update set spend = excluded.spend, impressions = excluded.impressions, clicks = excluded.clicks, leads = excluded.leads", r.day, r.tipo, r.chave, r.spend, r.impressions, r.clicks, r.leads);
      if (q.erros.length && !q.linhas.length) throw new Error(q.erros[0]);
      return q.linhas.length;
    });
  } else out.push({ parte: "An\xFAncios", ok: false, erro: "Falta META_AD_ACCOUNT_ID nos secrets." });
  if (igId) {
    await parte("Instagram por dia", async () => {
      const tem = new Set(rows(brain2.db, "select day from ig_dia where reach is not null").map((r) => r.day));
      let n3 = 0;
      for (let i = 1; i <= 30; i++) {
        const d = brtDay(now - i * 864e5);
        if (i > 3 && tem.has(d)) continue;
        const r = await fetchIgDia(version, igId, token, d);
        run(brain2.db, "insert into ig_dia (day, reach, profile_views, link_taps, interacoes, novos, updated_at) values (?, ?, ?, ?, ?, null, ?) on conflict(day) do update set reach = excluded.reach, profile_views = excluded.profile_views, link_taps = excluded.link_taps, interacoes = excluded.interacoes, updated_at = excluded.updated_at", r.day, r.reach, r.profile_views, r.link_taps, r.interacoes, now);
        n3++;
      }
      const novos = brain2.policy("cache_ig_novos", null)?.novos ?? [];
      for (const v of novos) run(brain2.db, "insert into ig_dia (day, novos, updated_at) values (?, ?, ?) on conflict(day) do update set novos = excluded.novos", v.day, v.novos, now);
      return n3;
    });
  }
  brain2.setPolicy("midia_diagnostico", { at: now, itens: out });
  brain2.emit("change");
  return out;
}

// packages/core/src/midia.ts
var r22 = (n3) => Math.round(n3 * 100) / 100;
var r1 = (n3) => Math.round(n3 * 10) / 10;
var mediana = (xs) => {
  const o = [...xs].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length ? o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2 : 0;
};
var media = (xs) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
var DIAS = ["domingo", "segunda", "ter\xE7a", "quarta", "quinta", "sexta", "s\xE1bado"];
var brl2 = (n3) => `R$ ${n3.toFixed(2).replace(".", ",")}`;
var AMOSTRA_MIN = 3;
var PREMISSAS_PADRAO = { conversaoLeadCliente: 0.1, retencaoMeses: 12, razaoLtvCac: 3 };
function lerPremissas(brain2) {
  const p = brain2.policy("midia_premissas", {});
  return {
    conversaoLeadCliente: num2(p.conversaoLeadCliente, PREMISSAS_PADRAO.conversaoLeadCliente, 5e-3, 1),
    retencaoMeses: num2(p.retencaoMeses, PREMISSAS_PADRAO.retencaoMeses, 1, 120),
    razaoLtvCac: num2(p.razaoLtvCac, PREMISSAS_PADRAO.razaoLtvCac, 1, 20)
  };
}
var num2 = (v, padrao, min, max) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max ? v : padrao;
function salvarPremissas(brain2, entrada) {
  const atual = lerPremissas(brain2);
  const novo = {
    conversaoLeadCliente: num2(entrada.conversaoLeadCliente, atual.conversaoLeadCliente, 5e-3, 1),
    retencaoMeses: num2(entrada.retencaoMeses, atual.retencaoMeses, 1, 120),
    razaoLtvCac: num2(entrada.razaoLtvCac, atual.razaoLtvCac, 1, 20)
  };
  brain2.setPolicy("midia_premissas", novo);
  brain2.audit("voce", "midia_premissas", "premissas de an\xFAncio", novo);
  return novo;
}
var somaDias = (d, n3) => new Date(Date.parse(`${d}T12:00:00Z`) + n3 * 864e5).toISOString().slice(0, 10);
var difDias = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 864e5);
var dataValida = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
function periodoDe(brain2, de, ate) {
  const hoje = brtDay(brain2.clock());
  let fim = dataValida(ate) ? ate > hoje ? hoje : ate : hoje;
  let ini = dataValida(de) ? de : somaDias(fim, -29);
  if (ini > fim) [ini, fim] = [fim, ini];
  if (difDias(ini, fim) > 400) ini = somaDias(fim, -400);
  const dias = difDias(ini, fim) + 1;
  return { de: ini, ate: fim, dias, anterior: { de: somaDias(ini, -dias), ate: somaDias(ini, -1) } };
}
var formato = (t) => t === "CAROUSEL_ALBUM" ? "Carrossel" : t === "VIDEO" || t === "REELS" ? "Reel" : t === "IMAGE" ? "Imagem" : t ?? "Outro";
function grupo(posts, chave2) {
  const m = /* @__PURE__ */ new Map();
  for (const p of posts) m.set(chave2(p), [...m.get(chave2(p)) ?? [], p]);
  return [...m.entries()].map(([nome, ps]) => ({
    nome,
    posts: ps.length,
    alcance_medio: Math.round(media(ps.map((p) => p.alcance)) ?? 0),
    salvos_medio: r1(media(ps.map((p) => p.salvos)) ?? 0),
    compartilhados_medio: r1(media(ps.map((p) => p.compartilhados)) ?? 0),
    interacao_pct: r1((media(ps.map((p) => p.taxaInteracao)) ?? 0) * 100)
  })).sort((a, b) => b.alcance_medio - a.alcance_medio);
}
function analiseInstagram(brain2, per = periodoDe(brain2)) {
  const now = brain2.clock();
  const seg = rows(brain2.db, "select day, followers from instagram_daily order by day");
  const seguidores = seg.at(-1)?.followers ?? null;
  const brutos = rows(
    brain2.db,
    `select m.media_id, m.tipo, m.publicado, m.permalink, m.legenda, m.curtidas, m.comentarios, m.alcance, m.salvos, m.compartilhados, m.views, m.interacoes, p.tema, p.pilar
     from ig_post_metricas m left join ig_posts p on p.media_id = m.media_id order by m.publicado desc`
  );
  const comMetrica = brutos.filter((p) => p.alcance !== null);
  const posts = comMetrica.map((p) => {
    const alcance = p.alcance ?? 0;
    const interacoesN = p.interacoes ?? (p.curtidas ?? 0) + (p.comentarios ?? 0) + (p.salvos ?? 0) + (p.compartilhados ?? 0);
    const dia5 = p.publicado ? brtDay(Date.parse(p.publicado)) : "";
    return {
      ...p,
      alcance,
      salvos: p.salvos ?? 0,
      compartilhados: p.compartilhados ?? 0,
      interacoesN,
      taxaInteracao: alcance ? interacoesN / alcance : 0,
      taxaSalvo: alcance ? (p.salvos ?? 0) / alcance : 0,
      dia: dia5,
      diaSemana: dia5 ? (/* @__PURE__ */ new Date(`${dia5}T12:00:00-03:00`)).getDay() : 0,
      formato: formato(p.tipo),
      tituloCurto: (p.legenda ?? "").replace(/\s+/g, " ").slice(0, 70)
    };
  });
  const noPeriodo = posts.filter((p) => p.dia >= per.de && p.dia <= per.ate);
  const leitura = [];
  const dias14 = brtDay(now - 14 * 864e5);
  const recentes14 = posts.filter((p) => p.dia >= dias14).length;
  const dd = rows(
    brain2.db,
    "select day, reach, profile_views, link_taps, interacoes, novos from ig_dia where day >= ? and day <= ? order by day",
    per.de,
    per.ate
  );
  const ddAnt = rows(
    brain2.db,
    "select day, reach, profile_views, link_taps, novos from ig_dia where day >= ? and day <= ?",
    per.anterior.de,
    per.anterior.ate
  );
  const soma2 = (xs) => xs.reduce((n3, v) => n3 + (v ?? 0), 0);
  const temDia = (k) => dd.some((r) => r[k] !== null);
  const segPeriodo = seg.filter((r) => r.day >= per.de && r.day <= per.ate && r.followers !== null);
  const segIni = segPeriodo[0]?.followers ?? null, segFim = segPeriodo.at(-1)?.followers ?? null;
  const visitas = temDia("profile_views") ? soma2(dd.map((r) => r.profile_views)) : null;
  const toques = temDia("link_taps") ? soma2(dd.map((r) => r.link_taps)) : null;
  const liquido = (de, ate) => {
    const ls = seg.filter((r) => r.day >= de && r.day <= ate && r.followers !== null);
    return ls.length >= 2 ? ls.at(-1).followers - ls[0].followers : null;
  };
  const novos = temDia("novos") ? soma2(dd.map((r) => r.novos)) : liquido(per.de, per.ate);
  const novosAnt = ddAnt.some((r) => r.novos !== null) ? soma2(ddAnt.map((r) => r.novos)) : liquido(per.anterior.de, per.anterior.ate);
  if (!posts.length) {
    leitura.push({ nivel: "atencao", titulo: "Ainda n\xE3o tenho m\xE9tricas por post", detalhe: "Toque em \u201CAtualizar dados\u201D. Se continuar vazio, o token da Meta precisa da permiss\xE3o instagram_manage_insights." });
  } else {
    const porFormato = grupo(posts, (p) => p.formato);
    const validos = porFormato.filter((g) => g.posts >= AMOSTRA_MIN);
    if (validos.length >= 2) {
      const melhor = validos[0], resto = validos.slice(1);
      const pior = resto.at(-1);
      if (pior.alcance_medio > 0 && melhor.alcance_medio / pior.alcance_medio >= 1.3)
        leitura.push({ nivel: "fazer", titulo: `Priorize ${melhor.nome.toLowerCase()}`, detalhe: `Alcan\xE7a ${Math.round(melhor.alcance_medio)} pessoas por post, ${r1(melhor.alcance_medio / pior.alcance_medio)}\xD7 mais que ${pior.nome.toLowerCase()} (${pior.alcance_medio}). Base: ${melhor.posts} e ${pior.posts} posts.` });
    } else if (porFormato.length >= 2) {
      leitura.push({ nivel: "ok", titulo: "Formatos ainda sem amostra para comparar", detalhe: `Preciso de pelo menos ${AMOSTRA_MIN} posts de cada formato. Hoje: ${porFormato.map((g) => `${g.nome} ${g.posts}`).join(", ")}.` });
    }
    const porTema = grupo(posts.filter((p) => p.pilar), (p) => p.pilar).filter((g) => g.posts >= 2);
    if (porTema.length >= 2) {
      const t1 = porTema[0], resto = porTema.slice(1);
      const tn = resto.at(-1);
      if (t1.salvos_medio > tn.salvos_medio)
        leitura.push({ nivel: "fazer", titulo: `Pilar que mais salva: ${t1.nome}`, detalhe: `${t1.salvos_medio} salvamentos por post contra ${tn.salvos_medio} em \u201C${tn.nome}\u201D. Salvar \xE9 o sinal mais forte de conte\xFAdo \xFAtil: repita o \xE2ngulo.` });
    }
    const porDia = grupo(posts.filter((p) => p.dia), (p) => DIAS[p.diaSemana] ?? "").filter((g) => g.posts >= 2);
    if (porDia.length >= 3) {
      const melhorDia = porDia[0], piorDia = porDia.at(-1);
      if (piorDia.alcance_medio > 0 && melhorDia.alcance_medio / piorDia.alcance_medio >= 1.4)
        leitura.push({ nivel: "fazer", titulo: `Poste mais na ${melhorDia.nome}`, detalhe: `Alcance m\xE9dio de ${melhorDia.alcance_medio} contra ${piorDia.alcance_medio} na ${piorDia.nome}.` });
    }
    const tipico = mediana(posts.map((p) => p.alcance));
    const fracos = posts.filter((p) => p.alcance < tipico * 0.5 && p.dia >= brtDay(now - 30 * 864e5));
    if (fracos.length >= 3)
      leitura.push({ nivel: "atencao", titulo: `${fracos.length} posts recentes com menos da metade do alcance t\xEDpico`, detalhe: `Alcance t\xEDpico (mediana): ${Math.round(tipico)}. Veja o que eles t\xEAm em comum antes do pr\xF3ximo post: ${fracos.slice(0, 2).map((p) => `\u201C${p.tituloCurto.slice(0, 40)}\u2026\u201D`).join(" e ")}.` });
    const salvosMed = media(posts.map((p) => p.salvos)) ?? 0, compartMed = media(posts.map((p) => p.compartilhados)) ?? 0;
    if (posts.length >= 8 && salvosMed < 1 && compartMed < 1)
      leitura.push({ nivel: "fazer", titulo: "Quase ningu\xE9m salva ou compartilha seus posts", detalhe: `M\xE9dia de ${r1(salvosMed)} salvamentos e ${r1(compartMed)} compartilhamentos por post. A curtida mostra que gostaram, mas o Instagram s\xF3 empurra para quem n\xE3o te segue o que \xE9 salvo e enviado. Termine o post com algo para guardar (checklist, modelo, passo a passo) e pe\xE7a o envio para uma colega.` });
    if (seguidores) {
      const alcanceSeg = tipico / seguidores;
      if (alcanceSeg < 0.5)
        leitura.push({ nivel: "atencao", titulo: "Seu conte\xFAdo quase s\xF3 alcan\xE7a quem j\xE1 te segue", detalhe: `O alcance t\xEDpico (${Math.round(tipico)}) equivale a ${Math.round(alcanceSeg * 100)}% dos ${seguidores} seguidores. Para crescer, fa\xE7a conte\xFAdo para ser compartilhado e salvo, com gancho para quem ainda n\xE3o te conhece.` });
    }
  }
  if (visitas !== null && toques !== null && visitas >= 50) {
    const taxa3 = toques / visitas * 100;
    if (taxa3 < 8)
      leitura.push({ nivel: "fazer", titulo: `S\xF3 ${r1(taxa3)}% de quem visita o perfil toca no link da bio`, detalhe: `${visitas} visitas ao perfil e ${toques} toques no link no per\xEDodo. Reescreva a bio com uma frase de benef\xEDcio para o psic\xF3logo e uma chamada clara antes do link: \xE9 o passo entre o Instagram e o seu site.` });
    else leitura.push({ nivel: "ok", titulo: `${r1(taxa3)}% das visitas ao perfil viram toque no link`, detalhe: `${visitas} visitas e ${toques} toques no per\xEDodo.` });
  }
  if (recentes14 < 6)
    leitura.push({ nivel: recentes14 < 3 ? "atencao" : "ok", titulo: `${recentes14} posts nos \xFAltimos 14 dias`, detalhe: recentes14 < 6 ? "Abaixo de 3 por semana. Const\xE2ncia pesa mais no alcance do que acertar o formato perfeito." : "" });
  if (novos !== null)
    leitura.push({ nivel: novosAnt !== null && novos < novosAnt ? "atencao" : "ok", titulo: `${novos >= 0 ? "+" : ""}${novos} seguidores no per\xEDodo`, detalhe: novosAnt !== null ? `No per\xEDodo anterior: ${novosAnt >= 0 ? "+" : ""}${novosAnt}.` : "" });
  const top = [...noPeriodo.length ? noPeriodo : posts].sort((a, b) => b.alcance - a.alcance).slice(0, 3);
  const fundo = [...noPeriodo.length ? noPeriodo : posts].sort((a, b) => a.alcance - b.alcance).slice(0, 3);
  const slim = (p) => ({ id: p.media_id, titulo: p.tituloCurto, formato: p.formato, tema: p.tema, pilar: p.pilar, dia: p.dia, link: p.permalink, alcance: p.alcance, salvos: p.salvos, compartilhados: p.compartilhados, curtidas: p.curtidas ?? 0, comentarios: p.comentarios ?? 0, views: p.views, interacao_pct: r1(p.taxaInteracao * 100), salvo_pct: r1(p.taxaSalvo * 100) });
  const atualizadoEm = row(brain2.db, "select max(atualizado_em) as u from ig_post_metricas")?.u ?? null;
  return {
    seguidores,
    atualizado_em: atualizadoEm ? new Date(atualizadoEm).toISOString() : null,
    posts_analisados: posts.length,
    periodo: {
      posts: noPeriodo.length,
      alcance_post_medio: noPeriodo.length ? Math.round(media(noPeriodo.map((p) => p.alcance)) ?? 0) : null,
      salvos: noPeriodo.reduce((n3, p) => n3 + p.salvos, 0),
      compartilhamentos: noPeriodo.reduce((n3, p) => n3 + p.compartilhados, 0),
      interacao_pct: noPeriodo.length ? r1((media(noPeriodo.map((p) => p.taxaInteracao)) ?? 0) * 100) : null,
      seguidores_inicio: segIni,
      seguidores_fim: segFim,
      seguidores_novos: novos,
      seguidores_novos_anterior: novosAnt,
      visitas_perfil: visitas,
      visitas_perfil_anterior: ddAnt.some((r) => r.profile_views !== null) ? soma2(ddAnt.map((r) => r.profile_views)) : null,
      toques_link: toques,
      toques_link_anterior: ddAnt.some((r) => r.link_taps !== null) ? soma2(ddAnt.map((r) => r.link_taps)) : null,
      alcance_diario_medio: temDia("reach") ? Math.round(soma2(dd.map((r) => r.reach)) / Math.max(1, dd.filter((r) => r.reach !== null).length)) : null,
      posts_14d: recentes14
    },
    serie: dd.map((r) => ({ day: r.day, alcance: r.reach, visitas: r.profile_views, toques: r.link_taps, novos: r.novos })),
    seguidores_serie: segPeriodo.map((r) => ({ day: r.day, seguidores: r.followers })),
    por_formato: grupo(noPeriodo.length >= 3 ? noPeriodo : posts, (p) => p.formato),
    por_tema: grupo((noPeriodo.length >= 3 ? noPeriodo : posts).filter((p) => p.pilar), (p) => p.pilar),
    por_dia: grupo((noPeriodo.length >= 3 ? noPeriodo : posts).filter((p) => p.dia), (p) => DIAS[p.diaSemana] ?? ""),
    melhores: top.map(slim),
    piores: fundo.map(slim),
    posts: posts.slice(0, 30).map(slim),
    leitura
  };
}
function totais(cs) {
  const t = cs.reduce((a, c2) => ({ spend: a.spend + c2.spend, impressions: a.impressions + c2.impressions, clicks: a.clicks + c2.clicks, leads: a.leads + c2.leads }), { spend: 0, impressions: 0, clicks: 0, leads: 0 });
  return { gasto: r22(t.spend), impressoes: t.impressions, cliques: t.clicks, leads: t.leads, ctr_pct: t.impressions ? r22(t.clicks / t.impressions * 100) : null, cpc: t.clicks ? r22(t.spend / t.clicks) : null, cpl: t.leads ? r22(t.spend / t.leads) : null, cpm: t.impressions ? r22(t.spend / t.impressions * 1e3) : null };
}
var delta = (a, b) => a === null || b === null || b === 0 ? null : r1((a - b) / b * 100);
function campanhasEm(brain2, de, ate) {
  const porAnuncio = row(brain2.db, "select count(*) as n from meta_ad_dia").n > 0;
  if (porAnuncio)
    return rows(brain2.db, `select campaign_id, campaign_name, sum(spend) as spend, sum(impressions) as impressions, sum(reach) as reach, sum(clicks) as clicks, sum(link_clicks) as link_clicks, sum(leads) as leads, max(case when spend > 0 then day end) as ultimo_dia from meta_ad_dia where day >= ? and day <= ? group by campaign_id, campaign_name order by spend desc`, de, ate);
  return rows(brain2.db, `select campaign_id, campaign_name, sum(spend) as spend, sum(impressions) as impressions, 0 as reach, sum(clicks) as clicks, sum(clicks) as link_clicks, sum(leads) as leads, max(case when spend > 0 then day end) as ultimo_dia from meta_ads_daily where day >= ? and day <= ? group by campaign_id, campaign_name order by spend desc`, de, ate);
}
function economiaDe(brain2) {
  const premissas = lerPremissas(brain2);
  const ativos = rows(brain2.db, "select effective_price_brl as preco from subscriptions where status in ('active','trialing','past_due')");
  const ticket = ativos.length ? ativos.reduce((n3, a) => n3 + a.preco, 0) / ativos.length : null;
  const ltv = ticket ? ticket * premissas.retencaoMeses : null;
  const cacMax = ltv ? ltv / premissas.razaoLtvCac : null;
  const cplMax = cacMax ? cacMax * premissas.conversaoLeadCliente : null;
  return { premissas, ticket, cplMax, economia: { ticket_medio: ticket ? r22(ticket) : null, ltv: ltv ? r22(ltv) : null, cac_maximo: cacMax ? r22(cacMax) : null, cpl_maximo: cplMax ? r22(cplMax) : null, payback_meses_no_limite: ticket && cacMax ? r1(cacMax / ticket) : null } };
}
function veredito(spend, leads, cplMax) {
  const cpl = leads ? spend / leads : null;
  if (leads === 0 && spend >= 30) return { veredito: "pausar", motivo: `${brl2(spend)} gastos sem nenhum lead.` };
  if (cpl !== null && cplMax && leads >= 3) {
    if (cpl > cplMax) return { veredito: "pausar", motivo: `Lead a ${brl2(cpl)}, acima do limite de ${brl2(cplMax)}.` };
    if (cpl <= cplMax * 0.6) return { veredito: "escalar", motivo: `Lead a ${brl2(cpl)}, bem abaixo do limite de ${brl2(cplMax)}.` };
    return { veredito: "manter", motivo: `Lead a ${brl2(cpl)}, dentro do limite de ${brl2(cplMax)}.` };
  }
  if (leads > 0 && leads < 3) return { veredito: "cedo", motivo: `${leads} lead(s): poucos para decidir. Deixe chegar a 3.` };
  return { veredito: "cedo", motivo: "Pouco gasto para concluir algo." };
}
function analiseAnuncios(brain2, per = periodoDe(brain2)) {
  const now = brain2.clock();
  const atual = campanhasEm(brain2, per.de, per.ate);
  const anterior = campanhasEm(brain2, per.anterior.de, per.anterior.ate);
  const tAtual = totais(atual), tAnt = totais(anterior);
  const { premissas, ticket, cplMax, economia } = economiaDe(brain2);
  const campanhas = atual.map((c2) => {
    const v = veredito(c2.spend, c2.leads, cplMax);
    return {
      id: c2.campaign_id,
      nome: c2.campaign_name,
      gasto: r22(c2.spend),
      impressoes: c2.impressions,
      cliques: c2.clicks,
      leads: c2.leads,
      ctr_pct: c2.impressions ? r22(c2.clicks / c2.impressions * 100) : null,
      cpc: c2.clicks ? r22(c2.spend / c2.clicks) : null,
      cpl: c2.leads ? r22(c2.spend / c2.leads) : null,
      ultimo_gasto: c2.ultimo_dia,
      ...v
    };
  });
  const ultimoGasto = row(brain2.db, "select max(d) as d from (select max(day) as d from meta_ads_daily where spend > 0 union all select max(day) from meta_ad_dia where spend > 0)")?.d ?? null;
  const diasParado = ultimoGasto ? Math.max(0, difDias(ultimoGasto, brtDay(now))) : null;
  const leitura = [];
  if (tAtual.gasto === 0) {
    leitura.push({ nivel: "atencao", titulo: ultimoGasto ? `Sem an\xFAncio rodando h\xE1 ${diasParado} dias` : "Nenhum gasto em an\xFAncios nos dados lidos", detalhe: ultimoGasto ? `\xDAltimo gasto em ${ultimoGasto.slice(8, 10)}/${ultimoGasto.slice(5, 7)}. Todo o crescimento hoje vem do org\xE2nico.` : "Todo o crescimento recente vem do org\xE2nico." });
    if (cplMax)
      leitura.push({
        nivel: "fazer",
        titulo: `Se for testar an\xFAncio, o teto \xE9 ${brl2(cplMax)} por lead`,
        detalhe: `Com ticket de ${brl2(ticket)}, ${premissas.retencaoMeses} meses de reten\xE7\xE3o, LTV:CAC de ${premissas.razaoLtvCac}:1 e ${Math.round(premissas.conversaoLeadCliente * 100)}% dos leads virando cliente. Para validar o canal, junte uns 10 leads: no limite isso custa at\xE9 ${brl2(cplMax * 10)}.`
      });
  } else {
    const dgasto = delta(tAtual.gasto, tAnt.gasto), dleads = delta(tAtual.leads, tAnt.leads);
    if (tAnt.gasto > 0 && dgasto !== null)
      leitura.push({ nivel: "ok", titulo: `Gasto ${dgasto >= 0 ? "subiu" : "caiu"} ${Math.abs(dgasto)}% e leads ${dleads === null ? "sem base de compara\xE7\xE3o" : `${dleads >= 0 ? "subiram" : "ca\xEDram"} ${Math.abs(dleads)}%`}`, detalhe: "Contra o per\xEDodo anterior de mesmo tamanho." });
    if (tAtual.cpl && cplMax)
      leitura.push({ nivel: tAtual.cpl > cplMax ? "atencao" : "ok", titulo: `Custo por lead ${brl2(tAtual.cpl)} (limite ${brl2(cplMax)})`, detalhe: tAtual.cpl > cplMax ? "Acima do limite: cada cliente custa mais do que o que ele devolve. Corte as campanhas piores primeiro." : "Dentro do limite que se paga no tempo de vida do cliente." });
    for (const c2 of campanhas.filter((x) => x.veredito === "pausar").slice(0, 3)) leitura.push({ nivel: "fazer", titulo: `Pausar \u201C${c2.nome}\u201D`, detalhe: c2.motivo });
    for (const c2 of campanhas.filter((x) => x.veredito === "escalar").slice(0, 2)) leitura.push({ nivel: "fazer", titulo: `Aumentar verba de \u201C${c2.nome}\u201D`, detalhe: c2.motivo });
    if (tAtual.leads > 0 && tAtual.cliques > 0) {
      const cvr = tAtual.leads / tAtual.cliques * 100;
      if (cvr < 5) leitura.push({ nivel: "atencao", titulo: `S\xF3 ${r1(cvr)}% dos cliques viram lead`, detalhe: "O problema provavelmente est\xE1 depois do an\xFAncio: p\xE1gina de destino ou formul\xE1rio. Mudar o criativo n\xE3o resolve." });
    }
  }
  const porAnuncio = row(brain2.db, "select count(*) as n from meta_ad_dia").n > 0;
  const porDia = rows(
    brain2.db,
    porAnuncio ? "select day, sum(spend) as gasto, sum(clicks) as cliques, sum(leads) as leads, sum(impressions) as impressoes from meta_ad_dia where day >= ? and day <= ? group by day order by day" : "select day, sum(spend) as gasto, sum(clicks) as cliques, sum(leads) as leads, sum(impressions) as impressoes from meta_ads_daily where day >= ? and day <= ? group by day order by day",
    per.de,
    per.ate
  );
  const atualizado = row(brain2.db, "select max(u) as u from (select max(updated_at) as u from meta_ads_daily union all select max(updated_at) from meta_ad_dia)")?.u ?? null;
  return {
    atualizado_em: atualizado ? new Date(atualizado).toISOString() : null,
    atual: tAtual,
    anterior: tAnt,
    variacao: { gasto: delta(tAtual.gasto, tAnt.gasto), leads: delta(tAtual.leads, tAnt.leads), cpl: delta(tAtual.cpl, tAnt.cpl), ctr: delta(tAtual.ctr_pct, tAnt.ctr_pct), cliques: delta(tAtual.cliques, tAnt.cliques) },
    premissas,
    economia,
    campanhas,
    por_dia: porDia,
    ultimo_gasto: ultimoGasto,
    dias_parado: diasParado,
    leitura
  };
}
function analiseCriativos(brain2, per = periodoDe(brain2)) {
  const { cplMax } = economiaDe(brain2);
  const meio = somaDias(per.de, Math.floor(per.dias / 2));
  const linhas = rows(
    brain2.db,
    "select ad_id, max(ad_name) as ad_name, max(campaign_name) as campanha, max(adset_name) as conjunto, sum(spend) as spend, sum(impressions) as impressions, sum(reach) as reach, sum(clicks) as clicks, sum(link_clicks) as link_clicks, sum(leads) as leads, count(case when spend > 0 then 1 end) as dias, max(case when spend > 0 then day end) as ultimo from meta_ad_dia where day >= ? and day <= ? group by ad_id order by spend desc",
    per.de,
    per.ate
  );
  const ctrMetade = (id, de, ate) => {
    const r = row(brain2.db, "select sum(impressions) as i, sum(clicks) as c from meta_ad_dia where ad_id = ? and day >= ? and day <= ?", id, de, ate);
    return r && r.i >= 500 ? r.c / r.i * 100 : null;
  };
  const cri = new Map(rows(brain2.db, "select * from meta_criativo").map((c2) => [c2.ad_id, c2]));
  const vistos = /* @__PURE__ */ new Set();
  const itens2 = linhas.map((l) => {
    vistos.add(l.ad_id);
    const c2 = cri.get(l.ad_id);
    const v = veredito(l.spend, l.leads, cplMax);
    const freq = l.reach ? l.impressions / l.reach : null;
    const ctr1 = ctrMetade(l.ad_id, per.de, somaDias(meio, -1)), ctr2 = ctrMetade(l.ad_id, meio, per.ate);
    const cansado = freq !== null && freq >= 2.5 && ctr1 !== null && ctr2 !== null && ctr2 < ctr1 * 0.75;
    return {
      id: l.ad_id,
      nome: c2?.nome ?? l.ad_name,
      campanha: l.campanha,
      conjunto: l.conjunto,
      status: c2?.status ?? "",
      miniatura: c2?.miniatura ?? null,
      imagem: c2?.imagem ?? null,
      texto: c2?.texto ?? null,
      titulo: c2?.titulo ?? null,
      cta: c2?.cta ?? null,
      link_ig: c2?.link_ig ?? null,
      gasto: r22(l.spend),
      impressoes: l.impressions,
      alcance: l.reach,
      frequencia: freq ? r22(freq) : null,
      cliques: l.clicks,
      cliques_link: l.link_clicks,
      ctr_pct: l.impressions ? r22(l.clicks / l.impressions * 100) : null,
      cpc: l.clicks ? r22(l.spend / l.clicks) : null,
      leads: l.leads,
      cpl: l.leads ? r22(l.spend / l.leads) : null,
      dias_veiculando: l.dias,
      ultimo_gasto: l.ultimo,
      cansado,
      ...v
    };
  });
  const parados = [...cri.values()].filter((c2) => !vistos.has(c2.ad_id)).map((c2) => ({
    id: c2.ad_id,
    nome: c2.nome,
    campanha: c2.campanha ?? "",
    conjunto: c2.conjunto ?? "",
    status: c2.status,
    miniatura: c2.miniatura,
    imagem: c2.imagem,
    texto: c2.texto,
    titulo: c2.titulo,
    cta: c2.cta,
    link_ig: c2.link_ig,
    gasto: 0,
    impressoes: 0,
    alcance: 0,
    frequencia: null,
    cliques: 0,
    cliques_link: 0,
    ctr_pct: null,
    cpc: null,
    leads: 0,
    cpl: null,
    dias_veiculando: 0,
    ultimo_gasto: null,
    cansado: false,
    veredito: "cedo",
    motivo: "N\xE3o veiculou no per\xEDodo."
  }));
  const leitura = [];
  const comLead = itens2.filter((i) => i.leads >= 3 && i.cpl !== null).sort((a, b) => a.cpl - b.cpl);
  if (comLead.length >= 2) {
    const m = comLead[0], p = comLead.at(-1);
    if (p.cpl / m.cpl >= 1.5) leitura.push({ nivel: "fazer", titulo: `Fa\xE7a mais como \u201C${m.nome}\u201D`, detalhe: `Lead a ${brl2(m.cpl)} contra ${brl2(p.cpl)} em \u201C${p.nome}\u201D (${r1(p.cpl / m.cpl)}\xD7 mais caro). Copie o \xE2ngulo do primeiro no pr\xF3ximo teste.` });
  }
  for (const i of itens2.filter((x) => x.cansado).slice(0, 3)) leitura.push({ nivel: "atencao", titulo: `\u201C${i.nome}\u201D est\xE1 cansando`, detalhe: `Frequ\xEAncia ${i.frequencia} e o CTR caiu mais de 25% na segunda metade do per\xEDodo. Troque o criativo antes de pagar mais por menos clique.` });
  for (const i of itens2.filter((x) => x.veredito === "pausar").slice(0, 3)) leitura.push({ nivel: "fazer", titulo: `Pausar \u201C${i.nome}\u201D`, detalhe: i.motivo });
  if (!itens2.length && !parados.length) leitura.push({ nivel: "ok", titulo: "Nenhum criativo encontrado", detalhe: "A conta n\xE3o tem an\xFAncios, ou a leitura ainda n\xE3o rodou. Toque em \u201CAtualizar dados\u201D." });
  return { itens: itens2, parados, leitura };
}
var FUNIL = ["PageView", "ViewContent", "Scroll50", "CTA_Click", "OpenForm", "InitiateCheckout", "Lead", "CompleteRegistration", "Subscribe", "Purchase"];
function analisePixel(brain2, per = periodoDe(brain2)) {
  const now = brain2.clock();
  const pixels = rows(brain2.db, "select pixel_id, nome, ultimo_disparo, indisponivel from meta_pixel order by nome");
  const soma2 = (de, ate) => Object.fromEntries(rows(brain2.db, "select evento, sum(total) as t from meta_pixel_dia where day >= ? and day <= ? group by evento", de, ate).map((r) => [r.evento, r.t]));
  const atual = soma2(per.de, per.ate);
  const ant = soma2(per.anterior.de, per.anterior.ate);
  const eventos = Object.keys({ ...atual, ...ant }).map((e) => ({ evento: e, total: atual[e] ?? 0, anterior: ant[e] ?? 0, variacao: delta(atual[e] ?? 0, ant[e] ?? 0) })).sort((a, b) => b.total - a.total);
  const ordemFunil = FUNIL.filter((e) => atual[e] !== void 0);
  const funil = ordemFunil.map((e, i) => ({ evento: e, total: atual[e], do_anterior_pct: i === 0 ? null : atual[ordemFunil[i - 1]] > 0 ? r1(atual[e] / atual[ordemFunil[i - 1]] * 100) : null }));
  const topo = eventos.filter((e) => e.total > 0).slice(0, 4).map((e) => e.evento);
  const serie = rows(brain2.db, "select day, evento, sum(total) as total from meta_pixel_dia where day >= ? and day <= ? group by day, evento order by day", per.de, per.ate).filter((r) => topo.includes(r.evento));
  const ads = totais(campanhasEm(brain2, per.de, per.ate));
  const cliquesLink = campanhasEm(brain2, per.de, per.ate).reduce((n3, c2) => n3 + c2.link_clicks, 0);
  const leitura = [];
  if (!pixels.length) {
    leitura.push({ nivel: "atencao", titulo: "Nenhum pixel encontrado na conta de an\xFAncios", detalhe: "Sem pixel, a Meta n\xE3o enxerga o que acontece no seu site: n\xE3o d\xE1 para medir lead, nem otimizar an\xFAncio para convers\xE3o. Se voc\xEA j\xE1 instalou um, o token precisa de ads_read, ou o pixel est\xE1 em outra conta." });
  } else {
    for (const p of pixels) {
      const horas = p.ultimo_disparo ? (now - Date.parse(p.ultimo_disparo)) / 36e5 : null;
      if (p.indisponivel) leitura.push({ nivel: "atencao", titulo: `Pixel \u201C${p.nome}\u201D indispon\xEDvel`, detalhe: "A Meta marcou o pixel como indispon\xEDvel. Abra o Gerenciador de Eventos para ver o motivo." });
      else if (horas === null) leitura.push({ nivel: "atencao", titulo: `Pixel \u201C${p.nome}\u201D nunca disparou`, detalhe: "O c\xF3digo n\xE3o est\xE1 no site, ou est\xE1 num lugar que n\xE3o carrega. Instale e teste com a extens\xE3o Meta Pixel Helper." });
      else if (horas > 48) leitura.push({ nivel: "atencao", titulo: `Pixel \u201C${p.nome}\u201D parado h\xE1 ${Math.round(horas / 24)} dias`, detalhe: "O \xFAltimo disparo foi h\xE1 mais de 48 horas. Se o site recebe visita todo dia, o c\xF3digo saiu do ar: confira a p\xE1gina inicial e a de agradecimento." });
      else leitura.push({ nivel: "ok", titulo: `Pixel \u201C${p.nome}\u201D ativo`, detalhe: `\xDAltimo disparo h\xE1 ${horas < 1 ? "menos de 1 hora" : `${Math.round(horas)} horas`}.` });
    }
    const pv = atual.PageView ?? 0, ld = atual.Lead ?? 0, form = atual.OpenForm ?? 0;
    if (pv > 0 && ld === 0 && !atual.CompleteRegistration && !atual.Subscribe && !atual.Purchase)
      leitura.push({ nivel: "fazer", titulo: "O pixel v\xEA visitas, mas nenhuma convers\xE3o", detalhe: `${pv} visitas e nenhum evento de Lead, cadastro ou compra no per\xEDodo. Sem isso, os an\xFAncios n\xE3o aprendem quem vira cliente. Configure o evento Lead na p\xE1gina de agradecimento ou no clique de \u201CAgendar demonstra\xE7\xE3o\u201D.` });
    if (pv >= 200 && ld > 0) {
      const taxa3 = ld / pv * 100;
      leitura.push({
        nivel: taxa3 < 1 ? "fazer" : "ok",
        titulo: `${taxa3 < 0.1 ? "Menos de 0,1" : r1(taxa3)}% das visitas viram lead`,
        detalhe: `${ld} leads em ${pv} visitas no per\xEDodo.${taxa3 < 1 ? " Um site de capta\xE7\xE3o costuma converter de 1% a 5%. Com esse volume de visita, o problema \xE9 a p\xE1gina (promessa, chamada, formul\xE1rio) ou a qualidade do tr\xE1fego, n\xE3o a falta de gente." : ""}`
      });
    } else if (pv > 0 && ld > 0) leitura.push({ nivel: "ok", titulo: `${r1(ld / pv * 100)}% das visitas viram lead`, detalhe: `${ld} leads em ${pv} visitas no per\xEDodo.` });
    if (pv >= 200 && form > 0 && form / pv < 0.01)
      leitura.push({ nivel: "fazer", titulo: `S\xF3 ${r1(form / pv * 100)}% das visitas chegam a abrir o formul\xE1rio`, detalhe: `${form} aberturas em ${pv} visitas. A chamada para agir est\xE1 fraca ou escondida: deixe o bot\xE3o vis\xEDvel sem rolar a p\xE1gina e com uma promessa concreta.` });
    if (form >= 10 && ld / form < 0.25)
      leitura.push({ nivel: "fazer", titulo: `S\xF3 ${Math.round(ld / form * 100)}% de quem abre o formul\xE1rio envia`, detalhe: `${form} aberturas e ${ld} envios. Corte campos (pe\xE7a s\xF3 nome e WhatsApp) e confira se o bot\xE3o de enviar funciona no celular.` });
    if (pv >= 1e3 && !atual.ViewContent && !atual.Scroll50)
      leitura.push({ nivel: "atencao", titulo: "N\xE3o d\xE1 para saber se a visita l\xEA a p\xE1gina", detalhe: "Sem evento de rolagem ou de conte\xFAdo visto, n\xE3o separo visita real de acesso que sai na hora." });
    if (ads.gasto > 0 && ads.leads > 0 && ld < ads.leads * 0.5)
      leitura.push({ nivel: "atencao", titulo: `A Meta conta ${ads.leads} leads e o pixel s\xF3 ${ld}`, detalhe: "Parte dos leads vem de formul\xE1rio da pr\xF3pria Meta e n\xE3o passa pelo seu site, ou o evento do site est\xE1 falhando. Confira qual formul\xE1rio cada an\xFAncio usa." });
    if (ads.gasto > 0 && cliquesLink >= 30 && pv < cliquesLink * 0.6)
      leitura.push({ nivel: "fazer", titulo: `Perdendo ${Math.round((1 - pv / cliquesLink) * 100)}% dos cliques antes da p\xE1gina carregar`, detalhe: `${cliquesLink} cliques no link e ${pv} visitas no pixel. P\xE1gina lenta, bloqueador de rastreio ou link quebrado. Teste a velocidade da p\xE1gina de destino no celular.` });
  }
  return { pixels: pixels.map((p) => ({ ...p, indisponivel: !!p.indisponivel })), eventos, funil, serie, ads_leads: ads.leads, cliques_link: cliquesLink, leitura };
}
function analisePublicos(brain2, per = periodoDe(brain2)) {
  const { cplMax } = economiaDe(brain2);
  const linhas = rows(brain2.db, "select tipo, chave, sum(spend) as spend, sum(impressions) as impressions, sum(clicks) as clicks, sum(leads) as leads from meta_quebra_dia where day >= ? and day <= ? group by tipo, chave order by spend desc", per.de, per.ate);
  const porTipo = (t) => {
    const ls = linhas.filter((l) => l.tipo === t);
    const total = ls.reduce((n3, l) => n3 + l.spend, 0);
    return ls.map((l) => ({ chave: l.chave, gasto: r22(l.spend), parte_pct: total ? r1(l.spend / total * 100) : 0, impressoes: l.impressions, cliques: l.clicks, ctr_pct: l.impressions ? r22(l.clicks / l.impressions * 100) : null, leads: l.leads, cpl: l.leads ? r22(l.spend / l.leads) : null }));
  };
  const out = { posicionamento: porTipo("posicionamento"), idade_genero: porTipo("idade_genero"), dispositivo: porTipo("dispositivo") };
  const leitura = [];
  const rotulo = { posicionamento: "posicionamento", idade_genero: "p\xFAblico", dispositivo: "dispositivo" };
  for (const [tipo, ls] of Object.entries(out)) {
    const gastoTotal = ls.reduce((n3, l) => n3 + l.gasto, 0);
    for (const l of ls.filter((x) => x.leads === 0 && x.parte_pct >= 15 && x.gasto >= 30).slice(0, 2))
      leitura.push({ nivel: "fazer", titulo: `Tire ${rotulo[tipo]} \u201C${l.chave}\u201D`, detalhe: `${l.parte_pct}% da verba (${brl2(l.gasto)}) e nenhum lead.` });
    const comLead = ls.filter((x) => x.leads >= 3 && x.cpl !== null).sort((a, b) => a.cpl - b.cpl);
    if (comLead.length >= 2 && gastoTotal > 0) {
      const m = comLead[0], p = comLead.at(-1);
      if (p.cpl / m.cpl >= 1.5) leitura.push({ nivel: "fazer", titulo: `Concentre verba em ${rotulo[tipo]} \u201C${m.chave}\u201D`, detalhe: `Lead a ${brl2(m.cpl)} contra ${brl2(p.cpl)} em \u201C${p.chave}\u201D${cplMax ? ` (limite ${brl2(cplMax)})` : ""}.` });
    }
  }
  return { ...out, leitura };
}
function midiaPainel(brain2, de, ate) {
  const per = periodoDe(brain2, de, ate);
  return {
    periodo: per,
    instagram: analiseInstagram(brain2, per),
    anuncios: analiseAnuncios(brain2, per),
    criativos: analiseCriativos(brain2, per),
    pixel: analisePixel(brain2, per),
    publicos: analisePublicos(brain2, per),
    diagnostico: brain2.policy("midia_diagnostico", null)
  };
}
async function midiaRotina(brain2, env) {
  const hoje = brtDay(brain2.clock());
  if (brain2.policy("midia_ultima_leitura", "") === hoje) return;
  if (!env.META_SYSTEM_USER_TOKEN) return;
  await refreshDados(brain2, env);
  await sincronizarMidia(brain2, env, { dias: 90 });
  brain2.setPolicy("midia_ultima_leitura", hoje);
}
function midiaDetalhe(brain2, tipo, metrica, de, ate) {
  const per = periodoDe(brain2, de, ate);
  const periodo = { de: per.de, ate: per.ate };
  if (tipo === "anuncios") {
    const r = rows(
      brain2.db,
      "select day, ad_name, campaign_name, spend, impressions, clicks, link_clicks, leads from meta_ad_dia where day >= ? and day <= ? order by day desc, spend desc limit 500",
      per.de,
      per.ate
    );
    const campo = (x) => metrica === "leads" ? x.leads : metrica === "impressoes" ? x.impressions : metrica === "cliques" ? x.clicks : x.spend;
    return {
      formato: metrica === "leads" || metrica === "impressoes" || metrica === "cliques" ? "num" : "brl",
      periodo,
      itens: r.map((x) => ({ data: x.day, desc: x.ad_name, origem: `Meta Ads \xB7 ${x.campaign_name}`, valor: campo(x), aviso: `gasto R$ ${x.spend.toFixed(2).replace(".", ",")} \xB7 ${x.impressions} impr. \xB7 ${x.clicks} cliques \xB7 ${x.leads} leads` }))
    };
  }
  if (tipo === "posts") {
    const r = rows(
      brain2.db,
      "select publicado, tipo, legenda, alcance, curtidas, comentarios, salvos, compartilhados from ig_post_metricas where substr(publicado,1,10) >= ? and substr(publicado,1,10) <= ? order by publicado desc",
      per.de,
      per.ate
    );
    const campo = (x) => metrica === "salvos" ? (x.salvos ?? 0) + (x.compartilhados ?? 0) : metrica === "posts" ? 1 : x.alcance ?? 0;
    return {
      formato: "num",
      periodo,
      itens: r.map((x) => ({ data: (x.publicado ?? "").slice(0, 10), desc: (x.legenda ?? "(sem legenda)").replace(/\s+/g, " ").slice(0, 90), origem: `Instagram \xB7 ${x.tipo ?? "post"}`, valor: campo(x), aviso: `alcance ${x.alcance ?? 0} \xB7 ${x.curtidas ?? 0} curtidas \xB7 ${x.comentarios ?? 0} coment. \xB7 ${x.salvos ?? 0} salvos \xB7 ${x.compartilhados ?? 0} compart.` }))
    };
  }
  if (tipo === "instagram") {
    const r = rows(
      brain2.db,
      "select day, reach, profile_views, link_taps, novos from ig_dia where day >= ? and day <= ? order by day desc",
      per.de,
      per.ate
    );
    const campo = (x) => (metrica === "visitas" ? x.profile_views : metrica === "toques" ? x.link_taps : metrica === "novos" ? x.novos : x.reach) ?? 0;
    return { formato: "num", periodo, itens: r.map((x) => ({ data: x.day, desc: "Instagram, total do dia", origem: "Instagram Insights", valor: campo(x) })) };
  }
  if (tipo === "pixel") {
    const r = rows(
      brain2.db,
      "select day, sum(total) as total from meta_pixel_dia where evento = ? and day >= ? and day <= ? group by day order by day desc",
      metrica,
      per.de,
      per.ate
    );
    return { formato: "num", periodo, itens: r.map((x) => ({ data: x.day, desc: `Evento ${metrica}`, origem: "Pixel da Meta", valor: x.total })) };
  }
  return { formato: "num", periodo, itens: [] };
}

// packages/core/src/crm-painel.ts
var DIA = 864e5;
var STALE_DIAS = 7;
var ETAPA_PESO = { negociacao: 5, em_teste: 4, reuniao_realizada: 3, reuniao_agendada: 2, contato_feito: 1, novo_lead: 1 };
var ABERTAS = new Set(Object.keys(ETAPA_PESO));
var CLASSE_PESO = { super_quente: 3, quente: 2, morno: 1, frio: 0 };
var ROTULO_ORIGEM = { instagram: "Instagram", whatsapp: "WhatsApp", landing_page: "Landing page", indicacao: "Indica\xE7\xE3o", evento: "Evento", linkedin: "LinkedIn", facebook_meta: "Meta Ads", google: "Google", parceria: "Parceria", outbound: "Outbound", outro: "Outro" };
var ROTULO_STATUS_REUNIAO = { agendada: "Agendada", realizada: "Realizada", reagendada: "Reagendada", cancelada: "Cancelada", nao_compareceu: "N\xE3o compareceu" };
var ms = (iso) => {
  const t = typeof iso === "string" ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : null;
};
var str = (v) => typeof v === "string" && v ? v : null;
var numOrNull = (v) => typeof v === "number" && Number.isFinite(v) ? v : null;
var r12 = (n3) => Math.round(n3 * 10) / 10;
function semanaDe(t) {
  const d = /* @__PURE__ */ new Date(`${brtDay(t)}T12:00:00-03:00`);
  const dow = (d.getUTCDay() + 6) % 7;
  return brtDay(d.getTime() - dow * DIA);
}
var cache = null;
var CACHE_MS = 6e4;
async function crmPainel(env, agora, f, opts = {}) {
  const c2 = crmClient(env, f);
  if (!c2) return vazio(agora, "O CRM n\xE3o est\xE1 conectado: faltam SYNAPSA_CRM_API_KEY e SYNAPSA_CRM_API_BASE_URL nos secrets do Brain.");
  const chave2 = String(env.SYNAPSA_CRM_API_BASE_URL ?? env.CRM_API_BASE_URL);
  if (!opts.atualizar && cache && cache.chave === chave2 && agora - cache.at < CACHE_MS) return cache.painel;
  try {
    const [leadsR, reunioesR, atividadesR, stages, overview2, funnel] = await Promise.all([
      c2.all("/leads", {}, 5),
      c2.all("/meetings", {}, 5),
      c2.all("/activities", {}, 5),
      c2.stages(),
      c2.overview({ stale_days: STALE_DIAS }),
      c2.funnel()
    ]);
    const painel = montar({ agora, leads: leadsR.data, reunioes: reunioesR.data, atividades: atividadesR.data, truncado: leadsR.truncado || reunioesR.truncado || atividadesR.truncado, stages: stages.data, overview: overview2.data, funnel: funnel.data ?? {} });
    cache = { chave: chave2, at: agora, painel };
    return painel;
  } catch (e) {
    if (e instanceof CrmError) throw new Error(`${e.message}${e.requestId ? ` (request_id ${e.requestId})` : ""}`);
    throw e;
  }
}
var vazio = (agora, indisponivel) => ({
  indisponivel,
  agora,
  geradoEm: agora,
  truncado: false,
  kpis: { totalLeads: 0, emAberto: 0, clientes: 0, perdidos: 0, pausados: 0, conversaoPct: 0, novos30d: 0, semContato: 0, staleDias: STALE_DIAS, atividadesAtrasadas: 0, atividadesPendentes: 0, reunioesHoje: 0, reunioes7d: 0, comparecimentoPct: null },
  etapas: [],
  origem: [],
  classificacao: [],
  tipos: [],
  motivosPerda: [],
  perdidosRecentes: [],
  clientesAtivos: [],
  leadsPorSemana: [],
  reunioesPorSemana: [],
  reunioesPorStatus: [],
  oportunidades: [],
  parados: [],
  followups: [],
  reunioesHoje: [],
  reunioesProximas: [],
  reunioesSemStatus: [],
  atividades: { hoje: 0, atrasadas: 0, proximas: 0, lista: [] },
  tempoNaEtapa: [],
  acoes: []
});
function montar(e) {
  const { agora } = e;
  const hoje = brtDay(agora);
  const rotuloEtapa = (id) => e.stages.find((s2) => s2.id === id)?.label ?? id;
  const nomeLead = new Map(e.leads.map((l) => [l.id, l.name]));
  const diasSem = (l) => {
    const t = ms(l.last_interaction_at) ?? ms(l.created_at);
    return t === null ? null : Math.max(0, Math.floor((agora - t) / DIA));
  };
  const resumo2 = (l, motivo) => ({
    id: l.id,
    nome: l.name,
    etapa: rotuloEtapa(l.status),
    etapaId: l.status,
    classificacao: str(l.classification),
    tipo: str(l.lead_type),
    origem: str(l.origin),
    diasSemContato: diasSem(l),
    proximaAcao: str(l.next_action),
    followUp: str(l.follow_up_date),
    plano: str(l.plan_interest),
    profissionais: numOrNull(l.professionals_count),
    score: numOrNull(l.lead_score),
    motivo
  });
  const abertos = e.leads.filter((l) => ABERTAS.has(l.status));
  const porEtapa = (id) => e.leads.filter((l) => l.status === id);
  const clientes2 = porEtapa("cliente_ativo");
  const perdidos = porEtapa("perdido");
  const prioridade = (l) => (ETAPA_PESO[l.status] ?? 0) * 10 + (CLASSE_PESO[String(l.classification)] ?? 0) * 5 + (numOrNull(l.lead_score) ?? 0) / 10 + Math.min(diasSem(l) ?? 0, 30) / 3;
  const frase = (l) => {
    const d = diasSem(l);
    const partes = [rotuloEtapa(l.status)];
    if (l.classification) partes.push(String(l.classification).replace("_", " "));
    if (d !== null) partes.push(d === 0 ? "contato hoje" : `${d} dia${d > 1 ? "s" : ""} sem contato`);
    return partes.join(" \xB7 ");
  };
  const oportunidades2 = abertos.filter((l) => (ETAPA_PESO[l.status] ?? 0) >= 2).sort((a, b) => prioridade(b) - prioridade(a)).slice(0, 10).map((l) => resumo2(l, frase(l)));
  const parados = abertos.filter((l) => (diasSem(l) ?? 0) >= STALE_DIAS).sort((a, b) => (ETAPA_PESO[b.status] ?? 0) - (ETAPA_PESO[a.status] ?? 0) || (diasSem(b) ?? 0) - (diasSem(a) ?? 0)).slice(0, 10).map((l) => resumo2(l, frase(l)));
  const totalParados = abertos.filter((l) => (diasSem(l) ?? 0) >= STALE_DIAS).length;
  const followupsTodos = abertos.filter((l) => typeof l.follow_up_date === "string" && l.follow_up_date <= hoje).sort((a, b) => String(a.follow_up_date).localeCompare(String(b.follow_up_date)));
  const followups = followupsTodos.slice(0, 10).map((l) => resumo2(l, `Follow-up marcado para ${String(l.follow_up_date).split("-").reverse().join("/")}${l.next_action ? ` \xB7 ${l.next_action}` : ""}`));
  const origemMap = /* @__PURE__ */ new Map();
  for (const l of e.leads) {
    const k = str(l.origin) ?? "outro";
    const o = origemMap.get(k) ?? { total: 0, clientes: 0, perdidos: 0 };
    o.total++;
    if (l.status === "cliente_ativo") o.clientes++;
    if (l.status === "perdido") o.perdidos++;
    origemMap.set(k, o);
  }
  const origem = [...origemMap].map(([k, o]) => ({ origem: ROTULO_ORIGEM[k] ?? k, ...o, conversaoPct: o.total ? r12(o.clientes / o.total * 100) : 0 })).sort((a, b) => b.total - a.total);
  const conta = (campo) => {
    const m = /* @__PURE__ */ new Map();
    for (const l of e.leads) {
      const k = campo(l);
      if (k) m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m].map(([nome, total]) => ({ nome, total })).sort((a, b) => b.total - a.total);
  };
  const reunioes = e.reunioes.map((m) => ({ m, t: ms(m.scheduled_at) })).filter((x) => x.t !== null);
  const rReun = (x) => ({
    id: x.m.id,
    leadId: x.m.lead_id,
    lead: nomeLead.get(x.m.lead_id) ?? "Lead",
    titulo: str(x.m.title) ?? "Reuni\xE3o",
    quando: new Date(x.t).toISOString(),
    status: x.m.status,
    canal: str(x.m.channel),
    link: str(x.m.meeting_link),
    probabilidade: numOrNull(x.m.closing_probability)
  });
  const ativaReun = (x) => x.m.status !== "cancelada";
  const reunioesHoje = reunioes.filter((x) => brtDay(x.t) === hoje && ativaReun(x)).sort((a, b) => a.t - b.t).map(rReun);
  const fim7 = agora + 7 * DIA;
  const reunioesProximas = reunioes.filter((x) => x.t > agora && x.t <= fim7 && brtDay(x.t) !== hoje && x.m.status === "agendada").sort((a, b) => a.t - b.t).map(rReun);
  const semStatusTodas = reunioes.filter((x) => x.m.status === "agendada" && x.t < agora - 2 * 36e5).sort((a, b) => b.t - a.t);
  const reunioesSemStatus = semStatusTodas.slice(0, 8).map(rReun);
  const statusMap = /* @__PURE__ */ new Map();
  for (const x of reunioes) statusMap.set(x.m.status, (statusMap.get(x.m.status) ?? 0) + 1);
  const realizadas = statusMap.get("realizada") ?? 0;
  const faltas = statusMap.get("nao_compareceu") ?? 0;
  const comparecimentoPct = realizadas + faltas > 0 ? r12(realizadas / (realizadas + faltas) * 100) : null;
  const semanas = [];
  for (let i = 7; i >= 0; i--) semanas.push(semanaDe(agora - i * 7 * DIA));
  const leadsPorSemana = semanas.map((s2) => ({ semana: s2, novos: e.leads.filter((l) => {
    const t = ms(l.created_at);
    return t !== null && semanaDe(t) === s2;
  }).length }));
  const reunioesPorSemana = semanas.map((s2) => {
    const dela = reunioes.filter((x) => semanaDe(x.t) === s2 && ativaReun(x));
    return { semana: s2, total: dela.length, realizadas: dela.filter((x) => x.m.status === "realizada").length };
  });
  const ativ = e.atividades;
  const atrasadas = ativ.filter((a) => a.status === "atrasada" || a.status !== "concluida" && typeof a.scheduled_date === "string" && a.scheduled_date < hoje);
  const ativHoje = ativ.filter((a) => a.status !== "concluida" && a.scheduled_date === hoje);
  const ativProx = ativ.filter((a) => a.status !== "concluida" && typeof a.scheduled_date === "string" && a.scheduled_date > hoje && a.scheduled_date <= brtDay(agora + 7 * DIA));
  const listaAtiv = [...atrasadas, ...ativHoje, ...ativProx].slice(0, 12).map((a) => ({ id: a.id, lead: nomeLead.get(String(a.lead_id)) ?? "Lead", tipo: String(a.type ?? ""), quando: `${a.scheduled_date ?? ""} ${a.scheduled_time ?? ""}`.trim(), status: String(a.status ?? "") }));
  const mot = Array.isArray(e.funnel.loss_reasons) ? e.funnel.loss_reasons.map((x) => ({ motivo: x.reason, total: x.count })).sort((a, b) => b.total - a.total) : [];
  const tempo = Array.isArray(e.funnel.average_completed_time_in_stage) ? e.funnel.average_completed_time_in_stage.map((x) => ({ etapa: rotuloEtapa(x.status), dias: r12(x.average_seconds / 86400), amostra: x.sample_size })) : [];
  const ov = e.overview;
  const novos30d = e.leads.filter((l) => {
    const t = ms(l.created_at);
    return t !== null && agora - t <= 30 * DIA;
  }).length;
  const emTesteParados = porEtapa("em_teste").filter((l) => (diasSem(l) ?? 0) >= STALE_DIAS).length;
  const acoes = [];
  if (atrasadas.length) acoes.push({ id: "atrasadas", titulo: "Atividades atrasadas", detalhe: "Tarefas do CRM com data vencida e sem conclus\xE3o.", quantidade: atrasadas.length, tom: "critico", alvo: "atividades" });
  if (reunioesHoje.length) acoes.push({ id: "reunioes-hoje", titulo: "Reuni\xF5es hoje", detalhe: "Confira link e contexto antes de cada uma.", quantidade: reunioesHoje.length, tom: "info", alvo: "reunioes" });
  if (emTesteParados) acoes.push({ id: "teste-parado", titulo: "Leads em teste sem contato", detalhe: `Em teste h\xE1 ${STALE_DIAS}+ dias sem intera\xE7\xE3o: perto de fechar e esfriando.`, quantidade: emTesteParados, tom: "critico", alvo: "parados" });
  if (followupsTodos.length) acoes.push({ id: "followups", titulo: "Follow-ups vencidos ou de hoje", detalhe: "Leads com data de follow-up chegada.", quantidade: followupsTodos.length, tom: "atencao", alvo: "followups" });
  if (semStatusTodas.length) acoes.push({ id: "reuniao-sem-status", titulo: "Reuni\xF5es passadas ainda como agendadas", detalhe: "Marque no CRM se aconteceu, se o lead faltou ou se foi reagendada. Sem isso o comparecimento e a convers\xE3o ficam errados.", quantidade: semStatusTodas.length, tom: "atencao", alvo: "reunioes" });
  if (totalParados) acoes.push({ id: "parados", titulo: `Leads abertos sem contato h\xE1 ${STALE_DIAS}+ dias`, detalhe: "Todas as etapas em aberto, das mais avan\xE7adas para as menos.", quantidade: totalParados, tom: "atencao", alvo: "parados" });
  const novoSemContato = porEtapa("novo_lead").length;
  if (novoSemContato) acoes.push({ id: "novos", titulo: "Novos leads sem primeiro contato", detalhe: "Est\xE3o na etapa Novo Lead.", quantidade: novoSemContato, tom: "info", alvo: "oportunidades" });
  return {
    agora,
    geradoEm: agora,
    truncado: e.truncado,
    kpis: {
      totalLeads: numOrNull(ov.total_leads) ?? e.leads.length,
      emAberto: numOrNull(ov.open_opportunities) ?? abertos.length,
      clientes: clientes2.length,
      perdidos: numOrNull(ov.lost_leads) ?? perdidos.length,
      pausados: numOrNull(ov.paused_leads) ?? porEtapa("pausado").length,
      conversaoPct: numOrNull(ov.conversion_rate_percent) ?? 0,
      novos30d,
      semContato: numOrNull(ov.leads_without_recent_contact) ?? totalParados,
      staleDias: numOrNull(ov.stale_after_days) ?? STALE_DIAS,
      atividadesAtrasadas: numOrNull(ov.overdue_activities) ?? atrasadas.length,
      atividadesPendentes: numOrNull(ov.pending_activities) ?? 0,
      reunioesHoje: reunioesHoje.length,
      reunioes7d: reunioesProximas.length + reunioesHoje.filter((r) => Date.parse(r.quando) >= agora && r.status === "agendada").length,
      comparecimentoPct
    },
    etapas: e.stages.map((s2) => ({ id: s2.id, label: s2.label, count: porEtapa(s2.id).length })),
    origem,
    classificacao: conta((l) => str(l.classification)).map((x) => ({ nome: x.nome, total: x.total })),
    tipos: conta((l) => str(l.lead_type)),
    motivosPerda: mot,
    perdidosRecentes: [...perdidos].sort((a, b) => (ms(b.updated_at) ?? 0) - (ms(a.updated_at) ?? 0)).slice(0, 8).map((l) => ({ id: l.id, nome: l.name, origem: str(l.origin), quando: str(l.updated_at) })),
    clientesAtivos: clientes2.map((l) => ({ id: l.id, nome: l.name, plano: str(l.plan_interest), desde: str(l.updated_at) })),
    leadsPorSemana,
    reunioesPorSemana,
    reunioesPorStatus: [...statusMap].map(([status, total]) => ({ status: ROTULO_STATUS_REUNIAO[status] ?? status, total })).sort((a, b) => b.total - a.total),
    oportunidades: oportunidades2,
    parados,
    followups,
    reunioesHoje,
    reunioesProximas,
    reunioesSemStatus,
    atividades: { hoje: ativHoje.length, atrasadas: atrasadas.length, proximas: ativProx.length, lista: listaAtiv },
    tempoNaEtapa: tempo,
    acoes
  };
}

// packages/core/src/fin-import.ts
var MESES = ["janeiro", "fevereiro", "mar\xE7o", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var r23 = (n3) => Math.round(n3 * 100) / 100;
var brNum = (t) => {
  const neg = /-/.test(t);
  const n3 = Number(t.replace(/[^\d,]/g, "").replace(",", "."));
  return neg ? -n3 : n3;
};
function limpa(tipo, resto) {
  const r = resto.replace(/^"|"$/g, "").replace(/^Cp\s*:\s*\d+-/i, "").trim();
  return (r ? `${tipo} - ${r}` : tipo).replace(/\s+/g, " ").slice(0, 200);
}
function lerExtratoInterTexto(texto2) {
  const itens2 = [];
  let dia5 = null;
  const saldo = /Saldo total\s*\n?\s*(?:.*\n)?\s*R\$\s*([\d.]+,\d{2})/.exec(texto2);
  const per = /Per[ií]odo:\s*(\d{2})\/(\d{2})\/(\d{4})\s*a\s*(\d{2})\/(\d{2})\/(\d{4})/.exec(texto2);
  for (const bruta of texto2.split(/\r?\n/)) {
    const l = bruta.trim();
    if (!l) continue;
    const d = /^(\d{1,2}) de ([A-Za-zçÇ]+) de (\d{4})\b/.exec(l);
    if (d) {
      const m = MESES.indexOf(d[2].toLowerCase());
      if (m < 0) throw new BrainError("invalid", `M\xEAs n\xE3o reconhecido no extrato: "${d[2]}".`);
      dia5 = `${d[3]}-${String(m + 1).padStart(2, "0")}-${d[1].padStart(2, "0")}`;
      continue;
    }
    const t = /^(.*?)\s+(-?)R\$\s*([\d.]+,\d{2})\s+(-?)R\$\s*([\d.]+,\d{2})\s*$/.exec(l);
    if (!t || !dia5) continue;
    const valor = r23((t[2] ? -1 : 1) * brNum(t[3]));
    const corpo2 = t[1].trim();
    const q = /^([^":]+?):?\s*"(.*)"$/.exec(corpo2);
    itens2.push({ data: dia5, descricao: q ? limpa(q[1].trim(), q[2]) : limpa(corpo2, ""), valor });
  }
  return {
    itens: itens2,
    saldoFinal: saldo ? brNum(saldo[1]) : null,
    periodo: per ? { de: `${per[3]}-${per[2]}-${per[1]}`, ate: `${per[6]}-${per[5]}-${per[4]}` } : null
  };
}
function lerExtratoInterCsv(texto2) {
  const itens2 = [];
  for (const bruta of texto2.split(/\r?\n/)) {
    const c2 = bruta.split(";").map((x) => x.trim().replace(/^"|"$/g, ""));
    if (c2.length < 4) continue;
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(c2[0]);
    if (!m) continue;
    const valorTxt = c2[c2.length - 2];
    if (!/\d/.test(valorTxt)) continue;
    const hist = c2[1] ?? "";
    const desc = c2.length >= 5 ? c2.slice(2, c2.length - 2).join(" ") : "";
    itens2.push({ data: `${m[3]}-${m[2]}-${m[1]}`, descricao: limpa(hist || "Lan\xE7amento", desc), valor: r23(brNum(valorTxt)) });
  }
  return { itens: itens2, saldoFinal: null, periodo: null };
}
function lerExtratoInter(texto2) {
  if (texto2.length > 15e5) throw new BrainError("invalid", "Arquivo grande demais para um extrato.");
  const r = /Per[ií]odo:|de Setembro|\d{1,2} de [A-Za-zç]+ de \d{4}/.test(texto2) ? lerExtratoInterTexto(texto2) : lerExtratoInterCsv(texto2);
  if (!r.itens.length) throw new BrainError("invalid", "N\xE3o encontrei lan\xE7amentos nesse arquivo. Use o extrato do Inter em PDF (texto) ou CSV.");
  return r;
}
function finImportarExtrato(db, agora, lido, adicionar) {
  const existentes = rows(db, "select data, valor from fin_extrato");
  const usados = /* @__PURE__ */ new Map();
  for (const e of existentes) usados.set(`${e.data}|${r23(e.valor)}`, (usados.get(`${e.data}|${r23(e.valor)}`) ?? 0) + 1);
  const novos = [];
  for (const it of lido.itens) {
    const k = `${it.data}|${r23(it.valor)}`;
    const n3 = usados.get(k) ?? 0;
    if (n3 > 0) usados.set(k, n3 - 1);
    else novos.push(it);
  }
  if (novos.length) adicionar(novos);
  const s2 = row(db, "select sum(valor) as s from fin_extrato");
  const saldo = r23(s2?.s ?? 0);
  return { lidos: lido.itens.length, novos: novos.length, jaExistiam: lido.itens.length - novos.length, saldoDoExtrato: lido.saldoFinal, saldoNoBrain: saldo, confere: lido.saldoFinal === null ? null : Math.abs(saldo - lido.saldoFinal) < 5e-3 };
}

// packages/core/src/prospeccao-email.ts
var DAY2 = 864e5;
var ETAPAS = [0, 3, 7];
var AGENTE = "prospeccao";
function nomeCurto(nome) {
  let n3 = nome.split(/\s[-–|·]\s/)[0].trim();
  if (n3.length > 4 && n3 === n3.toUpperCase()) n3 = n3.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_m, a, b) => a + b.toUpperCase());
  return n3.slice(0, 60);
}
var SITE_CLINICAS = "synapsa.com.br/clinicas";
function montarEmail(a, etapa) {
  const nome = nomeCurto(a.nome);
  const equipe = (a.crp_count ?? 0) >= 2 ? ` Vi que a equipe tem ${a.crp_count} psic\xF3logos${a.cidade ? ` em ${a.cidade}` : ""}.` : "";
  if (etapa === 0) {
    return {
      assunto: `Menos trabalho manual na opera\xE7\xE3o da ${nome}`,
      corpo: `Ol\xE1, pessoal da ${nome}!

Sou o Felipe, fundador da Synapsa.${equipe} Em cl\xEDnicas desse tamanho, boa parte do tempo da equipe vai para tarefas administrativas feitas \xE0 m\xE3o, com agenda, financeiro, cadastros e controles espalhados em lugares diferentes.

A Synapsa centraliza toda a opera\xE7\xE3o da cl\xEDnica em uma s\xF3 plataforma, tira os processos manuais do dia a dia e automatiza as tarefas administrativas, para a equipe gastar menos tempo com burocracia.

Voc\xEAs podem conhecer em ${SITE_CLINICAS}. Se quiserem ver na pr\xE1tica, posso mostrar em uma demonstra\xE7\xE3o de 30 minutos. \xC9 s\xF3 responder com um dia e hor\xE1rio que funcionem para voc\xEAs.

Abra\xE7o,
Felipe Dalpra`
    };
  }
  if (etapa === 1) {
    return {
      assunto: `Voltando ao meu e-mail sobre a ${nome}`,
      corpo: `Ol\xE1, pessoal da ${nome}!

Passando s\xF3 para retomar meu e-mail de alguns dias atr\xE1s. Se centralizar a opera\xE7\xE3o da cl\xEDnica e reduzir o trabalho manual da equipe \xE9 um tema para voc\xEAs, d\xE1 para ver como funciona em ${SITE_CLINICAS}.

Posso tamb\xE9m mostrar na pr\xE1tica em 30 minutos. Me diga qual dia e hor\xE1rio ficam bons.

Abra\xE7o,
Felipe Dalpra`
    };
  }
  return {
    assunto: `\xDAltimo contato sobre a ${nome}`,
    corpo: `Ol\xE1, pessoal da ${nome}!

Este \xE9 meu \xFAltimo e-mail, para n\xE3o encher a caixa de voc\xEAs. Se em algum momento quiserem ver como a Synapsa centraliza a opera\xE7\xE3o e automatiza as tarefas administrativas de uma cl\xEDnica, o site \xE9 ${SITE_CLINICAS}, e a demonstra\xE7\xE3o de 30 minutos \xE9 s\xF3 responder aqui.

Desejo uma \xF3tima semana para a equipe.

Abra\xE7o,
Felipe Dalpra`
  };
}
var chave = (id, etapa) => `prosp-${id}-e${etapa}`;
function criar(brain2, a, etapa) {
  const m = montarEmail(a, etapa);
  const id = brain2.addProposal({
    agentId: AGENTE,
    kind: "prospeccao_email",
    channel: "email",
    risk: "medio",
    impactoBrl: 79,
    title: `${etapa === 0 ? "E-mail de prospec\xE7\xE3o" : etapa === 1 ? "Follow-up (D+3)" : "\xDAltimo follow-up (D+7)"}: ${nomeCurto(a.nome)}`,
    draft: m.corpo,
    why: `Cl\xEDnica qualificada pelo site${a.crp_count ? ` (${a.crp_count} psic\xF3logos com CRP)` : ""}, com e-mail comercial p\xFAblico. Oferece demonstra\xE7\xE3o de 30 minutos. Base: leg\xEDtimo interesse B2B, com sa\xEDda (SAIR) no rodap\xE9.`,
    contactRef: a.email.toLowerCase(),
    payload: { envio: { tipo: "email", para: a.email.toLowerCase(), assunto: m.assunto, remetente: "prospeccao" }, prospeccao: { prospectId: a.id, etapa }, base: "legitimo_interesse_b2b" },
    dedupeKey: chave(a.id, etapa)
  });
  return id !== null;
}
function atualizarPendentes(brain2) {
  let n3 = 0;
  for (const r of rows(brain2.db, "select id, draft, payload from proposals where status = 'pendente' and kind = 'prospeccao_email'")) {
    try {
      const pl = JSON.parse(r.payload);
      const pid = pl.prospeccao?.prospectId;
      const etapa = pl.prospeccao?.etapa;
      if (!pid || etapa !== 0 && etapa !== 1 && etapa !== 2 || !pl.envio) continue;
      const a = row(brain2.db, "select id, nome, cidade, crp_count from prospects where id = ?", pid);
      if (!a) continue;
      const m = montarEmail(a, etapa);
      if (m.corpo === r.draft && m.assunto === pl.envio.assunto) continue;
      pl.envio.assunto = m.assunto;
      run(brain2.db, "update proposals set draft = ?, payload = ? where id = ?", m.corpo, JSON.stringify(pl), r.id);
      n3++;
    } catch {
    }
  }
  return n3;
}
var suprimido = (brain2, email) => !!row(brain2.db, "select 1 as x from email_suppression where email = ?", email.toLowerCase());
function gerarRascunhos(brain2) {
  atualizarPendentes(brain2);
  const agora = brain2.clock();
  let novos = 0, followups = 0;
  const alvos = rows(
    brain2.db,
    `select p.id, p.nome, p.cidade, p.crp_count, p.email, c.respondeu, c.sair from prospects p left join prospect_contato c on c.prospect_id = p.id
     where p.email is not null and p.crp_count >= 4 and p.status in ('qualificado', 'no_crm') order by p.nota desc, p.id`
  );
  const enviados = /* @__PURE__ */ new Map();
  for (const r of rows(brain2.db, "select pr.dedupe_key as k, e.at as at from proposals pr join envios e on e.proposal_id = pr.id where e.status = 'enviado' and pr.dedupe_key like 'prosp-%'")) enviados.set(r.k, r.at);
  for (const a of alvos) {
    if (a.respondeu || a.sair || !EMAIL_RE.test(a.email) || suprimido(brain2, a.email)) continue;
    if (!enviados.has(chave(a.id, 0))) {
      if (criar(brain2, a, 0)) novos++;
      continue;
    }
    const t0 = enviados.get(chave(a.id, 0));
    if (!enviados.has(chave(a.id, 1)) && agora - t0 >= ETAPAS[1] * DAY2) {
      if (criar(brain2, a, 1)) followups++;
      continue;
    }
    if (enviados.has(chave(a.id, 1)) && !enviados.has(chave(a.id, 2)) && agora - t0 >= ETAPAS[2] * DAY2) {
      if (criar(brain2, a, 2)) followups++;
    }
  }
  if (novos + followups) brain2.emit("change");
  return { novos, followups };
}
function marcarContato(brain2, prospectId, acao) {
  const p = row(brain2.db, "select email from prospects where id = ?", prospectId);
  if (!p) throw new BrainError("not_found", "Cl\xEDnica n\xE3o encontrada.");
  const agora = brain2.clock();
  run(brain2.db, "insert into prospect_contato (prospect_id, respondeu, sair, atualizado_em) values (?, ?, ?, ?) on conflict(prospect_id) do update set respondeu = max(respondeu, excluded.respondeu), sair = max(sair, excluded.sair), atualizado_em = excluded.atualizado_em", prospectId, acao === "respondeu" ? 1 : 0, acao === "sair" ? 1 : 0, agora);
  if (acao === "sair" && p.email) run(brain2.db, "insert into email_suppression (email, reason, at) values (?, 'pediu para sair', ?) on conflict(email) do update set reason = excluded.reason, at = excluded.at", p.email.toLowerCase(), agora);
  for (const r of rows(brain2.db, "select id from proposals where status = 'pendente' and dedupe_key like ?", `prosp-${prospectId}-e%`)) brain2.decide(r.id, "rejeitada", "sistema");
  brain2.audit("voce", acao === "sair" ? "prospeccao_sair" : "prospeccao_respondeu", String(prospectId));
  brain2.emit("change");
}
function rascunhosPendentes(brain2) {
  return rows(brain2.db, "select id, draft, payload from proposals where status = 'pendente' and kind = 'prospeccao_email' order by created_at, id limit 100").flatMap((r) => {
    try {
      const pl = JSON.parse(r.payload);
      const pid = pl.prospeccao?.prospectId;
      const nome = pid ? row(brain2.db, "select nome from prospects where id = ?", pid)?.nome : null;
      return pid && pl.envio?.para ? [{ id: r.id, prospectId: pid, nome: nome ?? "", para: pl.envio.para, assunto: pl.envio.assunto ?? "", corpo: r.draft ?? "", etapa: pl.prospeccao?.etapa ?? 0 }] : [];
    } catch {
      return [];
    }
  });
}
function emailsResumo(brain2) {
  const hoje = row(brain2.db, "select count(*) as n from envios e join proposals pr on pr.id = e.proposal_id where e.status = 'enviado' and e.at > ? and pr.kind like 'prospeccao%'", brain2.clock() - DAY2)?.n ?? 0;
  const total = row(brain2.db, "select count(*) as n from envios e join proposals pr on pr.id = e.proposal_id where e.status = 'enviado' and pr.kind like 'prospeccao%'")?.n ?? 0;
  return { enviadosHoje: hoje, capDia: Number(brain2.policy("prospect_email_daily_cap", 10)), enviadosTotal: total };
}
async function aprovarEEnviar(brain2, env, ids, f = fetch) {
  if (!ids.length || ids.length > 20) throw new BrainError("invalid", "Escolha de 1 a 20 e-mails por vez.");
  let enviados = 0;
  const r0 = emailsResumo(brain2);
  const sobra = Math.max(r0.capDia - r0.enviadosHoje, 0);
  if (sobra === 0) return { enviados, parou: `Limite de ${r0.capDia} e-mails de prospec\xE7\xE3o por dia atingido. Ele sobe aos poucos para proteger o dom\xEDnio novo.` };
  for (const id of ids.slice(0, sobra)) {
    const p = row(brain2.db, "select status, kind from proposals where id = ?", id);
    if (!p || p.kind !== "prospeccao_email") continue;
    try {
      if (p.status === "pendente") brain2.decide(id, "aprovada");
      await sendApproved(brain2, env, id, f);
      enviados++;
    } catch (e) {
      if (e instanceof BrainError) return { enviados, parou: e.message };
      throw e;
    }
  }
  return ids.length > sobra ? { enviados, parou: `Enviei ${enviados}: o limite de hoje \xE9 ${r0.capDia}. Os outros ficam na fila para amanh\xE3.` } : { enviados };
}

// packages/core/src/prospeccao-whatsapp.ts
var DAY3 = 864e5;
var DIAS_FOLLOWUP = 4;
function numeroWhatsapp(tel) {
  let d = String(tel ?? "").replace(/\D/g, "");
  if (d.startsWith("55") && d.length >= 12) d = d.slice(2);
  d = d.replace(/^0+/, "");
  if (d.length !== 10 && d.length !== 11) return null;
  if (/^(\d)\1+$/.test(d)) return null;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  const celular = d.length === 11 ? d[2] === "9" : /[6-9]/.test(d[2]);
  if (d.length === 11 && d[2] !== "9") return null;
  return { numero: `55${d}`, celular };
}
function mensagemWhatsapp(nome, etapa) {
  const n3 = nomeCurto(nome);
  return etapa === 0 ? `Ol\xE1, tudo bem? Aqui \xE9 o Felipe, da Synapsa. Ajudamos cl\xEDnicas de psicologia como a ${n3} a centralizar toda a opera\xE7\xE3o num s\xF3 lugar, tirar processos manuais e automatizar as tarefas administrativas, para a equipe ganhar tempo. Posso te mostrar em uma demonstra\xE7\xE3o de 30 minutos? Mais detalhes em ${SITE_CLINICAS}` : `Oi! S\xF3 retomando minha mensagem sobre a ${n3}. Se fizer sentido ver a demonstra\xE7\xE3o de 30 minutos, \xE9 s\xF3 me avisar o melhor dia e hor\xE1rio. Se n\xE3o for o momento, sem problema algum.`;
}
var linkWhatsapp = (numero, texto2) => `https://wa.me/${numero}?text=${encodeURIComponent(texto2)}`;
var capDia = (brain2) => Math.max(1, Math.min(30, Number(brain2.policy("prospect_whatsapp_daily", 10)) || 10));
function enviadosHoje(brain2) {
  const dia5 = brtDay(brain2.clock());
  return rows(brain2.db, "select enviado_em from prospect_whatsapp where pulado = 0 and enviado_em > ?", brain2.clock() - 2 * DAY3).filter((r) => brtDay(r.enviado_em) === dia5).length;
}
function painelWhatsapp(brain2) {
  const cap2 = capDia(brain2);
  const feitos = enviadosHoje(brain2);
  const restante = Math.max(0, cap2 - feitos);
  const agora = brain2.clock();
  const ps = rows(
    brain2.db,
    `select p.id, p.nome, p.cidade, p.telefone, p.whatsapp_no_site, p.nota from prospects p
     left join prospect_contato c on c.prospect_id = p.id
     where p.status in ('qualificado','no_crm') and p.telefone is not null and coalesce(c.respondeu, 0) = 0 and coalesce(c.sair, 0) = 0
     order by p.nota desc, p.id desc limit 300`
  );
  const fila = [];
  for (const p of ps) {
    const n3 = numeroWhatsapp(p.telefone);
    if (!n3 || !(n3.celular || p.whatsapp_no_site === 1)) continue;
    const feitas = rows(brain2.db, "select etapa, enviado_em, pulado from prospect_whatsapp where prospect_id = ?", p.id);
    const e0 = feitas.find((x) => x.etapa === 0);
    const e1 = feitas.find((x) => x.etapa === 1);
    let etapa = null;
    if (!e0) etapa = 0;
    else if (!e1 && e0.pulado === 0 && agora - e0.enviado_em >= DIAS_FOLLOWUP * DAY3) etapa = 1;
    if (etapa === null) continue;
    const texto2 = mensagemWhatsapp(p.nome, etapa);
    fila.push({ prospectId: p.id, nome: p.nome, cidade: p.cidade, telefone: p.telefone, etapa, texto: texto2, link: linkWhatsapp(n3.numero, texto2), nota: p.nota });
  }
  fila.sort((a, b) => b.etapa - a.etapa || b.nota - a.nota);
  return { fila: fila.slice(0, restante), enviadosHoje: feitos, capDia: cap2, restanteHoje: restante };
}
function marcarWhatsapp(brain2, prospectId, etapa, acao) {
  if (etapa !== 0 && etapa !== 1) throw new BrainError("invalid", "Etapa inv\xE1lida.");
  if (!row(brain2.db, "select 1 as x from prospects where id = ?", prospectId)) throw new BrainError("not_found", "Cl\xEDnica n\xE3o encontrada.");
  run(brain2.db, "insert into prospect_whatsapp (prospect_id, etapa, enviado_em, pulado) values (?, ?, ?, ?) on conflict(prospect_id, etapa) do update set enviado_em = excluded.enviado_em, pulado = excluded.pulado", prospectId, etapa, brain2.clock(), acao === "pular" ? 1 : 0);
  brain2.audit("voce", acao === "pular" ? "whatsapp_pulou" : "whatsapp_enviou", String(prospectId), { etapa });
  brain2.emit("change");
}

// packages/core/src/gsc-analise.ts
var sem = (s2) => s2.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
var LEGAL = /politica|termos|cookies|privacidade|forgot|login|cadastro|entrar/;
var ACENTOS = { psicologos: "psic\xF3logos", psicologo: "psic\xF3logo", clinicas: "cl\xEDnicas", clinica: "cl\xEDnica", politica: "pol\xEDtica", calculadora: "calculadora", precos: "pre\xE7os", paulo: "paulo", sao: "s\xE3o", brasilia: "bras\xEDlia", goiania: "goi\xE2nia", florianopolis: "florian\xF3polis", belem: "bel\xE9m", vitoria: "vit\xF3ria" };
var titulo = (slug, acentuar = false) => slug.split("-").filter(Boolean).map((p, i) => {
  const w = acentuar ? ACENTOS[p] ?? p : p;
  return ["de", "da", "do", "dos", "das", "e", "para"].includes(p) && i > 0 ? w : w[0].toUpperCase() + w.slice(1);
}).join(" ");
function classificarPagina(url) {
  let caminho = url;
  try {
    caminho = new URL(url).pathname;
  } catch {
  }
  caminho = caminho.replace(/\/+$/, "") || "/";
  const m = caminho.match(/^\/psicologo\/([^/]+)$/);
  if (m) return { tipo: "perfil", caminho, rotulo: titulo(decodeURIComponent(m[1])) };
  if (caminho === "/") return { tipo: "home", caminho, rotulo: "P\xE1gina inicial" };
  if (/^\/psicologos(\/|$)/.test(caminho)) return { tipo: "listagem", caminho, rotulo: caminho === "/psicologos" ? "Lista de psic\xF3logos" : `Lista: ${titulo(caminho.split("/").pop() ?? "", true)}` };
  if (LEGAL.test(caminho)) return { tipo: "legal", caminho, rotulo: titulo(caminho.split("/").pop() ?? "", true) };
  if (/\/(clinicas|software-para-psicologos|calculadora|funcionalidades|precos|planos)/.test(caminho)) return { tipo: "produto", caminho, rotulo: titulo(caminho.split("/").pop() ?? "", true) };
  return { tipo: "outra", caminho, rotulo: titulo(caminho.split("/").pop() ?? "", true) };
}
var ROTULO_CATEGORIA = {
  marca: "Marca (Synapsa e erros de grafia)",
  concorrente: "Concorrentes",
  software: "Software e gest\xE3o para psic\xF3logos",
  psicologo_local: "Psic\xF3logo + cidade",
  psicologo_tema: "Psic\xF3logo + tema (ansiedade, casal\u2026)",
  psicologo_geral: "Psic\xF3logo (gen\xE9rica, online, perto de mim)",
  outra: "Outras"
};
var TEMAS = {
  ansiedade: /ansied|panico|estresse/,
  depress\u00E3o: /depress|tristeza/,
  TDAH: /tdah|deficit de atencao/,
  autismo: /autis|tea\b/,
  casal: /casal|conjugal|relacionamento/,
  infantil: /infantil|crianca/,
  adolescente: /adolescen/,
  luto: /\bluto\b/,
  burnout: /burnout|esgotamento/,
  trauma: /trauma|tept/,
  TCC: /\btcc\b|cognitivo/,
  "online": /online|on-line|virtual|\bvideo/,
  conv\u00EAnio: /convenio|plano de saude|unimed/,
  "pre\xE7o/social": /valor|preco|barato|gratuit|social|quanto custa/
};
var CAPITAIS = ["S\xE3o Paulo", "Rio de Janeiro", "Belo Horizonte", "Porto Alegre", "Curitiba", "Bras\xEDlia", "Salvador", "Fortaleza", "Recife", "Goi\xE2nia", "Florian\xF3polis", "Campinas", "Manaus", "Bel\xE9m", "Vit\xF3ria"];
var SIGLA_CIDADE = { bh: "belo horizonte", sp: "s\xE3o paulo", rj: "rio de janeiro", poa: "porto alegre", bsb: "bras\xEDlia", cwb: "curitiba" };
var CIDADES_N = new Map(CAPITAIS.map((c2) => [sem(c2), c2]));
var MARCA_EXTRA = /* @__PURE__ */ new Set(["sicpsa", "napsaicare", "psynaps", "synapsa", "sinapsa"]);
var CONCORRENTES = /consultapsi|zenklub|psicoplanner|psicomanager|amigopsi|vittude|psicologia viva|scippa|simplepractice|tangerino/;
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j2 = 1; j2 <= b.length; j2++) d[0][j2] = j2;
  for (let i = 1; i <= a.length; i++) for (let j2 = 1; j2 <= b.length; j2++) d[i][j2] = Math.min(d[i - 1][j2] + 1, d[i][j2 - 1] + 1, d[i - 1][j2 - 1] + (a[i - 1] === b[j2 - 1] ? 0 : 1));
  return d[a.length][b.length];
}
var NAO_E_MARCA = /* @__PURE__ */ new Set(["sinapse", "sinapses", "sinapsis", "synapse", "synapses"]);
var ehMarca = (q) => sem(q).split(/\s+/).some((t) => t.length >= 5 && !NAO_E_MARCA.has(t) && (MARCA_EXTRA.has(t) || lev(t, "synapsa") <= (t.length >= 6 && "sp".includes(t[0]) ? 3 : 2)));
function classificarBusca(busca) {
  const q = sem(busca);
  if (ehMarca(busca)) return { categoria: "marca" };
  if (CONCORRENTES.test(q)) return { categoria: "concorrente" };
  const psi = /psicolog|terapeuta|terapia|tratamento|atendimento|consulta/.test(q);
  const softwareTipo = sem(q).split(/\s+/).some((t) => t.length >= 5 && lev(t, "software") <= 2);
  const tema = Object.entries(TEMAS).find(([, re]) => re.test(q))?.[0];
  if (softwareTipo && !psi) return { categoria: "software" };
  if (/(software|sistema|programa|plataforma|app|aplicativo|prontuario|agenda|gestao|gerenciar|controle financeiro|planejamento financeiro|clinica de psicologia)/.test(q) && (psi || /clinica/.test(q))) return { categoria: "software" };
  if (!psi) return { categoria: "outra" };
  let cidade;
  for (const [n3, c2] of CIDADES_N) if (new RegExp(`\\b${n3}\\b`).test(q)) cidade = c2;
  if (!cidade) {
    for (const [s2, c2] of Object.entries(SIGLA_CIDADE)) if (new RegExp(`\\b${s2}\\b`).test(q)) cidade = CIDADES_N.get(c2) ?? titulo(c2.replace(/ /g, "-"));
  }
  if (!cidade) {
    const resto = q.replace(/psic[a-z]*|terapeuta[s]?|terapia/g, " ").replace(/\b(em|de|do|da|no|na|para|pra|com|e|a|o|perto|mim|proximo|online|melhor|melhores|bom|boa|tratamento|atendimento|consulta)\b/g, " ").replace(new RegExp(`\\w*(?:${Object.values(TEMAS).map((r) => r.source).join("|")})\\w*`, "g"), " ").replace(/\s+/g, " ").trim();
    if (resto && !/^(associados|clinica|consultorio|centro|instituto|especialista|especializado|especializada|tratamento|perto|proximo)$/.test(resto) && resto.split(" ").length <= 3 && !Object.values(TEMAS).some((r) => r.test(resto))) cidade = titulo(resto.replace(/ /g, "-"));
  }
  if (cidade) return { categoria: "psicologo_local", cidade, tema };
  if (tema && tema !== "online") return { categoria: "psicologo_tema", tema };
  return { categoria: "psicologo_geral", tema };
}
var somar = (a) => {
  const clicks = a.reduce((t, x) => t + x.clicks, 0), impressions = a.reduce((t, x) => t + x.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? a.reduce((t, x) => t + x.position * x.impressions, 0) / impressions : 0 };
};
function porCategoria(qs) {
  const g = /* @__PURE__ */ new Map();
  for (const q of qs) {
    const c2 = classificarBusca(q.chave).categoria;
    g.set(c2, [...g.get(c2) ?? [], q]);
  }
  return [...g].map(([categoria2, l]) => ({ categoria: categoria2, rotulo: ROTULO_CATEGORIA[categoria2], buscas: l.length, ...somar(l) })).sort((a, b) => b.impressions - a.impressions);
}
function cobertura(qs) {
  const cid = /* @__PURE__ */ new Map(), tem = /* @__PURE__ */ new Map();
  for (const c2 of CAPITAIS) cid.set(c2, []);
  for (const t of Object.keys(TEMAS)) tem.set(t, []);
  for (const q of qs) {
    const i = classificarBusca(q.chave);
    if (i.cidade) cid.set(i.cidade, [...cid.get(i.cidade) ?? [], q]);
    if (i.tema && i.categoria !== "marca") tem.set(i.tema, [...tem.get(i.tema) ?? [], q]);
  }
  const monta = (m) => [...m].map(([nome, l]) => ({ nome, buscas: l.length, melhor: l.length ? [...l].sort((a, b) => a.position - b.position)[0].chave : null, ...somar(l) })).sort((a, b) => b.impressions - a.impressions || b.buscas - a.buscas || a.nome.localeCompare(b.nome));
  return { cidades: monta(cid), temas: monta(tem) };
}
function oportunidades(qs, paginaDaBusca = /* @__PURE__ */ new Map()) {
  return qs.filter((q) => classificarBusca(q.chave).categoria !== "marca" && q.impressions >= 3 && q.ctr < 0.05 && q.position >= 3).map((q) => {
    const info = classificarBusca(q.chave);
    const pagina = paginaDaBusca.get(q.chave);
    const onde = pagina ? ` (hoje aparece com ${pagina.replace(/^https?:\/\/(www\.)?/, "")})` : "";
    let acao;
    if (q.position <= 10) acao = `Primeira p\xE1gina, mas sem clique${onde}: reescreva t\xEDtulo e descri\xE7\xE3o para pedir o clique.`;
    else if (q.position <= 20) acao = `Segunda p\xE1gina${onde}: reforce o conte\xFAdo da p\xE1gina e ponha links internos apontando para ela com essa busca no texto.`;
    else if (pagina && classificarPagina(pagina).tipo === "listagem" && classificarPagina(pagina).caminho !== "/psicologos") acao = `A p\xE1gina da lista (${classificarPagina(pagina).caminho}) j\xE1 existe, mas est\xE1 na posi\xE7\xE3o ${Math.round(q.position)}: reforce o texto da p\xE1gina, os perfis listados e os links internos para ela.`;
    else if (info.categoria === "psicologo_local") acao = `Fora do alcance${onde}: falta uma p\xE1gina que responda a essa cidade (lista de psic\xF3logos de ${info.cidade ?? "l\xE1"} ou perfis com a cidade no t\xEDtulo).`;
    else acao = `Longe do topo${onde}: precisa de p\xE1gina pr\xF3pria para esse assunto.`;
    return { ...q, acao, categoria: info.categoria, pagina };
  }).sort((a, b) => b.impressions * (b.position <= 20 ? 2 : 1) - a.impressions * (a.position <= 20 ? 2 : 1) || b.impressions - a.impressions).slice(0, 15);
}
var n = (x) => Math.round(x).toLocaleString("pt-BR");
function recados(e) {
  const r = [];
  if (e.atual.impressions === 0) return ["Ainda sem impress\xF5es nesse per\xEDodo."];
  const visiveis = e.marca.clicks + e.naoMarca.clicks;
  const shareMarca = visiveis ? e.marca.clicks / visiveis : 0;
  if (e.tipoSite === "site") {
    if (visiveis >= 5) r.push(`Dos ${n(e.atual.clicks)} cliques, o Google detalha a busca de ${n(visiveis)}; ${Math.round(shareMarca * 100)}% deles (${n(e.marca.clicks)}) v\xEAm de gente que j\xE1 procurou "Synapsa" pelo nome. Quem busca por necessidade (software, gest\xE3o, programa para psic\xF3logos) trouxe ${n(e.naoMarca.clicks)} cliques em ${n(e.naoMarca.impressions)} impress\xF5es. Para crescer, o ganho est\xE1 a\xED.`);
    const soft = e.categorias.find((c2) => c2.categoria === "software");
    if (soft && soft.impressions >= 5) r.push(`Buscas de software para psic\xF3logos: ${n(soft.impressions)} impress\xF5es, posi\xE7\xE3o m\xE9dia ${soft.position.toFixed(1)} e ${n(soft.clicks)} cliques. \xC9 o p\xFAblico que compra; vale uma p\xE1gina por inten\xE7\xE3o ("software para psic\xF3logos", "gest\xE3o financeira para psic\xF3logos", "prontu\xE1rio").`);
  } else if (e.perfis) {
    const p = e.perfis;
    r.push(`${n(p.comImpressao)} perfis apareceram no Google, ${n(p.comClique)} receberam clique${p.semImpressao.length ? ` e ${n(p.semImpressao.length)} ainda n\xE3o apareceram em nenhuma busca` : ""}.`);
    if (e.naoMarca.impressions) r.push(`Buscas por psic\xF3logo (sem contar a marca): ${n(e.naoMarca.impressions)} impress\xF5es, posi\xE7\xE3o m\xE9dia ${e.naoMarca.position.toFixed(0)}. Acima da posi\xE7\xE3o 10 quase ningu\xE9m clica; o diret\xF3rio ainda est\xE1 fora da disputa por "psic\xF3logo em <cidade>".`);
  }
  const lacunas = e.cobertura.cidades.filter((c2) => c2.impressions === 0).slice(0, 5).map((c2) => c2.nome);
  if (e.tipoSite === "diretorio" && lacunas.length) r.push(`Capitais sem nenhuma presen\xE7a nas buscas: ${lacunas.join(", ")}. Priorize as cidades onde voc\xEA j\xE1 tem psic\xF3logos cadastrados.`);
  const top = e.ops[0];
  if (top) r.push(`Maior oportunidade: "${top.chave}" (${n(top.impressions)} impress\xF5es, posi\xE7\xE3o ${top.position.toFixed(0)}). ${top.acao}`);
  const grafias = e.categorias.find((c2) => c2.categoria === "marca");
  if (grafias && grafias.buscas >= 4) r.push(`A marca \xE9 buscada de ${n(grafias.buscas)} jeitos diferentes (sinapsa, psynaps, sanapsy\u2026). Vale garantir "Synapsa" no t\xEDtulo e no texto das p\xE1ginas principais e ter um perfil no Google Meu Neg\xF3cio.`);
  return r;
}

// packages/core/src/gsc.ts
var DAY4 = 864e5;
var ESCOPO = "https://www.googleapis.com/auth/webmasters.readonly";
var SITES_PADRAO = [
  { id: "site", rotulo: "synapsa.com.br", siteUrl: "sc-domain:synapsa.com.br", tipo: "site" },
  // O diretório vive em www.synapsa.chat/psicologos (lista) e /psicologo/<nome> (perfil). A home do synapsa.chat entra junto: é onde a marca é buscada.
  { id: "diretorio", rotulo: "Diret\xF3rio de psic\xF3logos (synapsa.chat)", siteUrl: "sc-domain:synapsa.chat", tipo: "diretorio", sitemap: "https://www.synapsa.chat/sitemap.xml" }
];
var sitesGsc = (brain2) => {
  const p = brain2.policy("gsc_sites", null);
  return Array.isArray(p) && p.length ? p : SITES_PADRAO;
};
function lerChave(env) {
  const raw = env.GSC_SERVICE_ACCOUNT?.trim();
  if (!raw) return null;
  try {
    const j2 = JSON.parse(raw);
    return j2.client_email && j2.private_key ? j2 : null;
  } catch {
    return null;
  }
}
var b64url = (b) => {
  const u = typeof b === "string" ? new TextEncoder().encode(b) : b instanceof Uint8Array ? b : new Uint8Array(b);
  let s2 = "";
  for (const x of u) s2 += String.fromCharCode(x);
  return btoa(s2).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
var cache2 = /* @__PURE__ */ new Map();
async function tokenGoogle(chave2, agora, f = fetch, escopo = ESCOPO) {
  const guardado = cache2.get(escopo);
  if (guardado && guardado.ate > agora + 6e4) return guardado.token;
  const iat = Math.floor(agora / 1e3);
  const aud = chave2.token_uri ?? "https://oauth2.googleapis.com/token";
  const corpo2 = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({ iss: chave2.client_email, scope: escopo, aud, iat, exp: iat + 3600 }))}`;
  const pem = chave2.private_key.replace(/-----[A-Z ]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c2) => c2.charCodeAt(0));
  const k = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", k, new TextEncoder().encode(corpo2));
  const r = await f(aud, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${corpo2}.${b64url(sig)}` }) });
  const j2 = await r.json().catch(() => ({}));
  if (!r.ok || !j2.access_token) throw new BrainError("integration", `Google recusou a chave da conta de servi\xE7o: ${j2.error_description ?? r.status}`);
  cache2.set(escopo, { token: j2.access_token, ate: agora + (j2.expires_in ?? 3600) * 1e3 });
  return j2.access_token;
}
async function consultar(token, site, body, f) {
  const filtro = site.pagina ? { dimensionFilterGroups: [{ filters: [{ dimension: "page", operator: "contains", expression: site.pagina }] }] } : {};
  const todas = [];
  for (let startRow = 0; startRow < 1e5; startRow += 25e3) {
    const r = await f(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site.siteUrl)}/searchAnalytics/query`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ rowLimit: 25e3, ...body, ...filtro, startRow, dataState: "final" })
    });
    if (!r.ok) {
      const e = await r.json().catch(() => ({}));
      throw new BrainError("integration", r.status === 403 ? `Sem acesso a ${site.siteUrl}: adicione o e-mail da conta de servi\xE7o como usu\xE1rio dessa propriedade no Search Console.` : `Search Console (${site.siteUrl}): ${e.error?.message ?? r.status}`);
    }
    const pg = (await r.json()).rows ?? [];
    todas.push(...pg);
    if (pg.length < 25e3 || typeof body.rowLimit === "number") break;
  }
  return todas;
}
var dia2 = (ms2) => brtDay(ms2);
var SEM_FILTRO_PAGINA = "";
async function lerSitemap(url, f, nivel = 0) {
  const r = await f(url, { headers: { "user-agent": "SynapsaBrain/1.0" } });
  if (!r.ok) return [];
  const xml = await r.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  if (/<sitemapindex/i.test(xml) && nivel < 2) return (await Promise.all(locs.slice(0, 8).map((u) => lerSitemap(u, f, nivel + 1).catch(() => [])))).flat();
  return locs;
}
async function sincronizarGsc(brain2, env, f = fetch, opt = {}) {
  const chave2 = lerChave(env);
  if (!chave2) return "Search Console n\xE3o configurado (falta o segredo GSC_SERVICE_ACCOUNT).";
  const agora = brain2.clock();
  const hoje = dia2(agora);
  if (!opt.forcar && brain2.policy("gsc_ultima_sync", "") === hoje) return "Search Console j\xE1 sincronizado hoje.";
  const token = await tokenGoogle(chave2, agora, f);
  const fim = dia2(agora - 2 * DAY4);
  const fimMs = Date.parse(`${fim}T12:00:00Z`);
  const janela = { atual: [dia2(fimMs - 27 * DAY4), fim], anterior: [dia2(fimMs - 55 * DAY4), dia2(fimMs - 28 * DAY4)] };
  const falhas = [];
  let linhas = 0;
  for (const s2 of sitesGsc(brain2)) {
    try {
      const ult = row(brain2.db, "select max(dia) as d from gsc_dia where site = ?", s2.id)?.d;
      const ini = ult ? dia2(Date.parse(`${ult}T12:00:00Z`) - 4 * DAY4) : dia2(agora - 90 * DAY4);
      const diario = await consultar(token, s2, { startDate: ini, endDate: fim, dimensions: ["date"], rowLimit: 500 }, f);
      const ultP = row(brain2.db, "select max(dia) as d from gsc_pagina_dia where site = ?", s2.id)?.d;
      const iniP = ultP ? dia2(Date.parse(`${ultP}T12:00:00Z`) - 4 * DAY4) : dia2(agora - 90 * DAY4);
      const porPagina = await consultar(token, s2, { startDate: iniP, endDate: fim, dimensions: ["date", "page"] }, f);
      const agg = [];
      for (const periodo of ["atual", "anterior"]) {
        const [startDate, endDate] = janela[periodo];
        for (const dim of ["query", "page", "device", "country"])
          for (const r of await consultar(token, s2, { startDate, endDate, dimensions: [dim], rowLimit: dim === "query" || dim === "page" ? 1e3 : 50 }, f)) agg.push({ tipo: dim, periodo, k1: r.keys[0], k2: SEM_FILTRO_PAGINA, r });
      }
      for (const r of await consultar(token, s2, { startDate: janela.atual[0], endDate: janela.atual[1], dimensions: ["page", "query"], rowLimit: 5e3 }, f)) agg.push({ tipo: "page_query", periodo: "atual", k1: r.keys[0], k2: r.keys[1], r });
      let perfis = null;
      if (s2.sitemap) perfis = (await lerSitemap(s2.sitemap, f).catch(() => [])).filter((u) => classificarPagina(u).tipo === "perfil");
      for (const r of diario) {
        run(brain2.db, "insert into gsc_dia (site, dia, clicks, impressions, ctr, position) values (?, ?, ?, ?, ?, ?) on conflict(site, dia) do update set clicks = excluded.clicks, impressions = excluded.impressions, ctr = excluded.ctr, position = excluded.position", s2.id, r.keys[0], r.clicks, r.impressions, r.ctr, r.position);
        linhas++;
      }
      for (const r of porPagina) run(brain2.db, "insert into gsc_pagina_dia (site, pagina, dia, clicks, impressions, position) values (?, ?, ?, ?, ?, ?) on conflict(site, pagina, dia) do update set clicks = excluded.clicks, impressions = excluded.impressions, position = excluded.position", s2.id, r.keys[1], r.keys[0], r.clicks, r.impressions, r.position);
      run(brain2.db, "delete from gsc_agg where site = ?", s2.id);
      for (const a of agg) run(brain2.db, "insert or replace into gsc_agg (site, tipo, periodo, chave, chave2, clicks, impressions, ctr, position) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", s2.id, a.tipo, a.periodo, a.k1, a.k2, a.r.clicks, a.r.impressions, a.r.ctr, a.r.position);
      if (perfis && perfis.length) brain2.setPolicy(`gsc_perfis_${s2.id}`, perfis);
    } catch (e) {
      falhas.push(e instanceof Error ? e.message : String(e));
    }
  }
  if (falhas.length === 0) brain2.setPolicy("gsc_ultima_sync", hoje);
  else brain2.setPolicy("gsc_ultimo_erro", falhas.join(" | ").slice(0, 400));
  if (falhas.length === 0) brain2.setPolicy("gsc_ultimo_erro", null);
  brain2.audit("sistema", "gsc_sincronizou", `${linhas} dias`, { falhas: falhas.length });
  brain2.emit("change");
  return falhas.length ? `Search Console com problema: ${falhas.join(" | ")}` : `Search Console sincronizado (${linhas} dias atualizados).`;
}
var soma = (a) => {
  const clicks = a.reduce((t, x) => t + x.clicks, 0), impressions = a.reduce((t, x) => t + x.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? a.reduce((t, x) => t + x.position * x.impressions, 0) / impressions : 0 };
};
function gscPainel(brain2, env) {
  const sites = sitesGsc(brain2).map((s2) => {
    const tipoSite = s2.tipo ?? (s2.id === "diretorio" ? "diretorio" : "site");
    const dias = rows(brain2.db, "select dia, clicks, impressions, ctr, position from gsc_dia where site = ? order by dia desc limit 90", s2.id).reverse();
    const ult = dias.slice(-28), ant = dias.slice(-56, -28);
    const agg = rows(brain2.db, "select tipo, periodo, chave, chave2, clicks, impressions, ctr, position from gsc_agg where site = ?", s2.id);
    const de = (tipo, periodo) => agg.filter((a) => a.tipo === tipo && a.periodo === periodo);
    const antQ = new Map(de("query", "anterior").map((a) => [a.chave, a]));
    const antP = new Map(de("page", "anterior").map((a) => [a.chave, a]));
    const qAtual = de("query", "atual").map((a) => ({ chave: a.chave, clicks: a.clicks, impressions: a.impressions, ctr: a.ctr, position: a.position }));
    const pq = de("page_query", "atual");
    const paginaDaBusca = /* @__PURE__ */ new Map();
    for (const a of [...pq].sort((x, y) => y.impressions - x.impressions)) if (!paginaDaBusca.has(a.chave2)) paginaDaBusca.set(a.chave2, a.chave);
    const queries = [...qAtual].sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 300).map((q) => {
      const i = classificarBusca(q.chave);
      const a = antQ.get(q.chave);
      return { ...q, anterior: { clicks: a?.clicks ?? 0, impressions: a?.impressions ?? 0 }, categoria: i.categoria, cidade: i.cidade, tema: i.tema };
    });
    const marcaQ = qAtual.filter((q) => ehMarca(q.chave)), naoQ = qAtual.filter((q) => !ehMarca(q.chave));
    const marca = soma(marcaQ), naoMarca = soma(naoQ);
    const categorias = porCategoria(qAtual);
    const cob = cobertura(qAtual);
    const ops = oportunidades(qAtual, paginaDaBusca);
    const serieP = /* @__PURE__ */ new Map();
    const iniSerie = dias.length ? dia2(Date.parse(`${dias[dias.length - 1].dia}T12:00:00Z`) - 27 * DAY4) : "0000-00-00";
    for (const r of rows(brain2.db, "select pagina, dia, clicks, impressions from gsc_pagina_dia where site = ? and dia >= ?", s2.id, iniSerie)) {
      const m = serieP.get(r.pagina) ?? /* @__PURE__ */ new Map();
      m.set(r.dia, { clicks: r.clicks, impressions: r.impressions });
      serieP.set(r.pagina, m);
    }
    const diasJanela = dias.length ? Array.from({ length: 28 }, (_, i) => dia2(Date.parse(`${iniSerie}T12:00:00Z`) + i * DAY4)) : [];
    const buscasPorPagina = /* @__PURE__ */ new Map();
    for (const a of pq) buscasPorPagina.set(a.chave, [...buscasPorPagina.get(a.chave) ?? [], { busca: a.chave2, clicks: a.clicks, impressions: a.impressions, position: a.position }]);
    const paginas = de("page", "atual").sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions).slice(0, 400).map((a) => {
      const info = classificarPagina(a.chave);
      const m = serieP.get(a.chave);
      const p = antP.get(a.chave);
      return {
        url: a.chave,
        ...info,
        clicks: a.clicks,
        impressions: a.impressions,
        ctr: a.ctr,
        position: a.position,
        anterior: { clicks: p?.clicks ?? 0, impressions: p?.impressions ?? 0 },
        serie: diasJanela.map((d) => ({ dia: d, ...m?.get(d) ?? { clicks: 0, impressions: 0 } })),
        buscas: (buscasPorPagina.get(a.chave) ?? []).sort((x, y) => y.impressions - x.impressions).slice(0, 8),
        status: a.clicks > 0 ? "clique" : "visto"
      };
    });
    let perfis = null;
    if (tipoSite === "diretorio") {
      const vistos = paginas.filter((p) => p.tipo === "perfil");
      const mapa = brain2.policy(`gsc_perfis_${s2.id}`, null);
      const caminhosVistos = new Set(vistos.map((p) => p.caminho));
      const sem2 = (mapa ?? []).map((u) => classificarPagina(u)).filter((i) => !caminhosVistos.has(i.caminho));
      const unicos = [...new Map(sem2.map((i) => [i.caminho, i])).values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));
      perfis = { total: vistos.length + (mapa ? unicos.length : 0), esperados: mapa ? new Set(mapa.map((u) => classificarPagina(u).caminho)).size : null, comImpressao: vistos.length, comClique: vistos.filter((p) => p.clicks > 0).length, semImpressao: unicos.map((i) => ({ url: i.caminho, nome: i.rotulo })) };
    }
    const atual = soma(ult.map((x) => ({ ...x })));
    const base = {
      id: s2.id,
      rotulo: s2.rotulo,
      siteUrl: s2.siteUrl,
      tipo: tipoSite,
      ultimoDia: dias.at(-1)?.dia ?? null,
      serie: dias.map((x) => ({ dia: x.dia, clicks: x.clicks, impressions: x.impressions, position: x.position })),
      atual,
      anterior: soma(ant.map((x) => ({ ...x }))),
      marca,
      naoMarca,
      queries,
      paginas,
      oportunidades: ops,
      categorias,
      cobertura: cob,
      dispositivos: de("device", "atual").map((a) => ({ chave: a.chave, clicks: a.clicks, impressions: a.impressions, ctr: a.ctr, position: a.position })).sort((a, b) => b.impressions - a.impressions),
      paises: de("country", "atual").map((a) => ({ chave: a.chave, clicks: a.clicks, impressions: a.impressions, ctr: a.ctr, position: a.position })).sort((a, b) => b.impressions - a.impressions).slice(0, 12),
      recados: [],
      perfis
    };
    base.recados = recados({ rotuloSite: s2.rotulo, tipoSite, atual, marca, naoMarca, categorias, ops, cobertura: cob, perfis: perfis ? { total: perfis.total, esperados: perfis.esperados, comImpressao: perfis.comImpressao, comClique: perfis.comClique, semImpressao: [] } : void 0 });
    return base;
  });
  const cl = row(brain2.db, "select sum(clicks) as c, sum(impressions) as i from gsc_agg where site = 'site' and tipo = 'page' and periodo = 'atual' and chave like '%/clinicas%'");
  return {
    configurado: !!lerChave(env),
    ultimoErro: brain2.policy("gsc_ultimo_erro", null),
    ultimaSync: brain2.policy("gsc_ultima_sync", null),
    sites,
    clinicas: cl && cl.i != null ? { clicks: cl.c ?? 0, impressions: cl.i } : null,
    funil: null
  };
}
async function gscPainelCompleto(brain2, env, f = fetch) {
  const p = gscPainel(brain2, env);
  const site = p.sites.find((s2) => s2.tipo === "site");
  const c2 = crmClient(env, f);
  if (!site || !c2 || !site.ultimoDia) return p;
  try {
    const fim = Date.parse(`${site.ultimoDia}T23:59:59-03:00`), ini = fim - 28 * DAY4;
    const leads = (await c2.all("/leads", {}, 5)).data.filter((l) => {
      const t = Date.parse(String(l.created_at));
      return t >= ini && t <= fim;
    });
    p.funil = {
      periodo: `${dia2(ini)} a ${site.ultimoDia}`,
      cliquesGoogle: site.atual.clicks,
      leads: leads.length,
      leadsGoogle: leads.filter((l) => ["google", "landing_page"].includes(String(l.origin))).length,
      clientes: leads.filter((l) => l.status === "cliente_ativo").length
    };
  } catch {
  }
  return p;
}

// packages/core/src/ga.ts
var DAY5 = 864e5;
var ESCOPO2 = "https://www.googleapis.com/auth/analytics.readonly";
var DATA = "https://analyticsdata.googleapis.com/v1beta";
var ADMIN = "https://analyticsadmin.googleapis.com/v1beta";
var dia3 = (ms2) => brtDay(ms2);
var METRICAS = ["sessions", "totalUsers", "newUsers", "engagedSessions", "screenPageViews", "userEngagementDuration", "keyEvents"];
var ZERO = { sessoes: 0, usuarios: 0, novos: 0, engajadas: 0, views: 0, seg: 0, eventos: 0 };
var daLinha = (v) => ({ sessoes: +(v[0]?.value ?? 0), usuarios: +(v[1]?.value ?? 0), novos: +(v[2]?.value ?? 0), engajadas: +(v[3]?.value ?? 0), views: +(v[4]?.value ?? 0), seg: +(v[5]?.value ?? 0), eventos: +(v[6]?.value ?? 0) });
var propriedadesGa = (brain2) => {
  const p = brain2.policy("ga_propriedades", null);
  return p && typeof p === "object" ? p : {};
};
async function chamar(f, token, url, init = {}) {
  const r = await f(url, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json", ...init.headers ?? {} } });
  const txt = await r.text();
  let j2 = {};
  try {
    j2 = txt ? JSON.parse(txt) : {};
  } catch {
  }
  if (!r.ok) throw new BrainError("integration", traduzir(r.status, j2?.error?.message ?? txt.slice(0, 200), url));
  return j2;
}
function traduzir(status, msg2, url = "") {
  const api = /analyticsadmin/.test(url) ? "Google Analytics Admin API" : "Google Analytics Data API";
  if (/has not been used|is disabled|SERVICE_DISABLED/i.test(msg2)) return `Ative a "${api}" no projeto do Google Cloud (APIs e servi\xE7os > Biblioteca) e tente de novo em alguns minutos.`;
  if (status === 403 || /permission|does not have sufficient/i.test(msg2)) return "A conta de servi\xE7o n\xE3o tem acesso a essa propriedade do GA4: adicione o e-mail dela como Leitor em Administrador > Acesso \xE0 propriedade.";
  if (status === 404 || /not found/i.test(msg2)) return "Propriedade do GA4 n\xE3o encontrada: confira o n\xFAmero em Administrador > Detalhes da propriedade.";
  return `GA4 respondeu ${status}: ${msg2.slice(0, 160)}`;
}
async function relatorio(f, token, prop, ini, fim, dims, metricas = METRICAS, limite = 1e3) {
  const j2 = await chamar(f, token, `${DATA}/properties/${prop}:runReport`, {
    method: "POST",
    body: JSON.stringify({ dateRanges: [{ startDate: ini, endDate: fim }], dimensions: dims.map((name) => ({ name })), metrics: metricas.map((name) => ({ name })), limit: String(limite), keepEmptyRows: false })
  });
  return (j2.rows ?? []).map((r) => ({ dims: (r.dimensionValues ?? []).map((d) => d.value ?? ""), m: daLinha(r.metricValues ?? []) }));
}
async function descobrirPropriedades(brain2, env, f = fetch) {
  const chave2 = lerChave(env);
  if (!chave2) throw new BrainError("integration", "Falta o segredo GSC_SERVICE_ACCOUNT.");
  const token = await tokenGoogle(chave2, brain2.clock(), f, ESCOPO2);
  const resumo2 = await chamar(f, token, `${ADMIN}/accountSummaries?pageSize=200`);
  const vistas = [];
  for (const c2 of resumo2.accountSummaries ?? []) for (const p of c2.propertySummaries ?? []) {
    const id = p.property.replace("properties/", "");
    const fluxos = await chamar(f, token, `${ADMIN}/properties/${id}/dataStreams`).catch(() => ({ dataStreams: [] }));
    vistas.push({ id, nome: p.displayName, enderecos: (fluxos.dataStreams ?? []).map((d) => d.webStreamData?.defaultUri ?? "").filter(Boolean) });
  }
  const achadas = {};
  for (const s2 of sitesGsc(brain2)) {
    const dominio = s2.siteUrl.replace(/^sc-domain:/, "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "");
    const v = vistas.find((x) => x.enderecos.some((e) => e.includes(dominio)) || x.nome.toLowerCase().includes(dominio));
    if (v) achadas[s2.id] = v.id;
  }
  return { achadas, vistas };
}
async function sincronizarGa(brain2, env, f = fetch, opt = {}) {
  const chave2 = lerChave(env);
  if (!chave2) return "GA4 n\xE3o configurado (falta o segredo GSC_SERVICE_ACCOUNT).";
  const agora = brain2.clock();
  const hoje = dia3(agora);
  if (!opt.forcar && brain2.policy("ga_ultima_sync", "") === hoje) return "GA4 j\xE1 sincronizado hoje.";
  let props = propriedadesGa(brain2);
  const falhas = [];
  if (!Object.keys(props).length) {
    try {
      const d = await descobrirPropriedades(brain2, env, f);
      if (Object.keys(d.achadas).length) {
        props = d.achadas;
        brain2.setPolicy("ga_propriedades", props);
      } else {
        brain2.setPolicy("ga_ultimo_erro", d.vistas.length ? `A conta de servi\xE7o enxerga ${d.vistas.length} propriedade(s), mas nenhuma mede synapsa.com.br ou synapsa.chat. Informe o n\xFAmero da propriedade de cada site.` : "A conta de servi\xE7o ainda n\xE3o enxerga nenhuma propriedade do GA4: adicione o e-mail dela como Leitor em Administrador > Acesso \xE0 propriedade.");
        return "GA4: nenhuma propriedade encontrada ainda.";
      }
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      brain2.setPolicy("ga_ultimo_erro", m.slice(0, 400));
      return `GA4 com problema: ${m}`;
    }
  }
  const token = await tokenGoogle(chave2, agora, f, ESCOPO2);
  const fim = dia3(agora - DAY5);
  const fimMs = Date.parse(`${fim}T12:00:00Z`);
  const janela = { atual: [dia3(fimMs - 27 * DAY5), fim], anterior: [dia3(fimMs - 55 * DAY5), dia3(fimMs - 28 * DAY5)] };
  let dias = 0;
  for (const s2 of sitesGsc(brain2)) {
    const prop = props[s2.id];
    if (!prop) continue;
    try {
      const ult = row(brain2.db, "select max(dia) as d from ga_dia where site = ?", s2.id)?.d;
      const ini = ult ? dia3(Date.parse(`${ult}T12:00:00Z`) - 3 * DAY5) : dia3(agora - 90 * DAY5);
      const diario = await relatorio(f, token, prop, ini, fim, ["date"], METRICAS, 500);
      const agg = [];
      for (const periodo of ["atual", "anterior"]) {
        const [a, b] = janela[periodo];
        for (const r of await relatorio(f, token, prop, a, b, [])) agg.push({ tipo: "total", periodo, k1: "total", k2: "", m: r.m });
        const grupos = [["canal", "sessionDefaultChannelGroup"], ["origem", "sessionSourceMedium"], ["entrada", "landingPage"], ["pagina", "pagePath"], ["aparelho", "deviceCategory"], ["pais", "country"]];
        for (const [tipo, dim] of grupos) for (const r of await relatorio(f, token, prop, a, b, [dim], METRICAS, tipo === "entrada" || tipo === "pagina" ? 1e3 : 60)) agg.push({ tipo, periodo, k1: r.dims[0] || "(n\xE3o informado)", k2: "", m: r.m });
        for (const r of await relatorio(f, token, prop, a, b, ["eventName"], ["eventCount", "totalUsers"], 100)) agg.push({ tipo: "evento", periodo, k1: r.dims[0], k2: "", m: { ...ZERO, eventos: r.m.sessoes, usuarios: r.m.usuarios } });
      }
      for (const r of diario) {
        const d = r.dims[0], data = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
        run(brain2.db, "insert into ga_dia (site, dia, sessoes, usuarios, novos, engajadas, views, seg, eventos) values (?, ?, ?, ?, ?, ?, ?, ?, ?) on conflict(site, dia) do update set sessoes = excluded.sessoes, usuarios = excluded.usuarios, novos = excluded.novos, engajadas = excluded.engajadas, views = excluded.views, seg = excluded.seg, eventos = excluded.eventos", s2.id, data, r.m.sessoes, r.m.usuarios, r.m.novos, r.m.engajadas, r.m.views, r.m.seg, r.m.eventos);
        dias++;
      }
      run(brain2.db, "delete from ga_agg where site = ?", s2.id);
      for (const a of agg) run(brain2.db, "insert or replace into ga_agg (site, tipo, periodo, chave, chave2, sessoes, usuarios, novos, engajadas, views, seg, eventos) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", s2.id, a.tipo, a.periodo, a.k1, a.k2, a.m.sessoes, a.m.usuarios, a.m.novos, a.m.engajadas, a.m.views, a.m.seg, a.m.eventos);
    } catch (e) {
      falhas.push(`${s2.rotulo}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  if (falhas.length === 0) {
    brain2.setPolicy("ga_ultima_sync", hoje);
    brain2.setPolicy("ga_ultimo_erro", null);
  } else brain2.setPolicy("ga_ultimo_erro", falhas.join(" | ").slice(0, 400));
  brain2.audit("sistema", "ga_sincronizou", `${dias} dias`, { falhas: falhas.length });
  brain2.emit("change");
  return falhas.length ? `GA4 com problema: ${falhas.join(" | ")}` : `GA4 sincronizado (${dias} dias atualizados).`;
}
var taxa = (a, b) => b ? a / b : 0;
function recadosGa(s2) {
  const out = [];
  const { atual: a, anterior: p } = s2;
  if (!a.sessoes) return ["O GA4 est\xE1 ligado, mas ainda n\xE3o registrou visitas neste per\xEDodo. Confira se a tag est\xE1 publicada e espere 24 a 48 horas."];
  const eng = taxa(a.engajadas, a.sessoes);
  out.push(`${a.sessoes} visitas e ${a.usuarios} pessoas em 28 dias${p.sessoes ? ` (${p.sessoes} antes)` : ""}. ${Math.round(eng * 100)}% das visitas foram engajadas (mais de 10 segundos, 2 p\xE1ginas ou um evento-chave).`);
  const direto = s2.canais.find((c2) => /direct|unassigned/i.test(c2.chave));
  if (direto && taxa(direto.sessoes, a.sessoes) > 0.5) out.push(`${Math.round(taxa(direto.sessoes, a.sessoes) * 100)}% das visitas v\xEAm sem origem identificada (direto ou n\xE3o atribu\xEDdo). Link de bio, WhatsApp e e-mail precisam de UTM para voc\xEA saber o que traz gente.`);
  const org = s2.canais.find((c2) => /organic search/i.test(c2.chave));
  if (org) out.push(`Busca org\xE2nica trouxe ${org.sessoes} visitas (${Math.round(taxa(org.sessoes, a.sessoes) * 100)}%).`);
  if (!a.eventos && !s2.eventos.some((e) => /sign_up|generate_lead|cadastro|agendar|demo|whatsapp/i.test(e.chave))) out.push("Nenhum evento-chave registrado. Sem ele n\xE3o d\xE1 para medir cadastro ou pedido de demo: marque no GA4 (Administrador > Eventos) o evento que representa a convers\xE3o e eu passo a mostrar o funil.");
  const ruins = s2.entradas.filter((e) => e.sessoes >= 10 && taxa(e.engajadas, e.sessoes) < 0.35).sort((x, y) => y.sessoes - x.sessoes).slice(0, 2);
  for (const r of ruins) out.push(`${r.chave} recebe ${r.sessoes} visitas, mas s\xF3 ${Math.round(taxa(r.engajadas, r.sessoes) * 100)}% engajam: \xE9 a p\xE1gina para revisar primeiro.`);
  return out;
}
function gaPainel(brain2, env) {
  const props = propriedadesGa(brain2);
  const sites = sitesGsc(brain2).map((s2) => {
    const serie = rows(brain2.db, "select dia, sessoes, usuarios, novos, engajadas, views, seg, eventos from ga_dia where site = ? order by dia desc limit 90", s2.id).reverse();
    const agg = rows(brain2.db, "select tipo, periodo, chave, sessoes, usuarios, novos, engajadas, views, seg, eventos from ga_agg where site = ?", s2.id);
    const total = (periodo) => {
      const t = agg.find((a) => a.tipo === "total" && a.periodo === periodo);
      return t ? { sessoes: t.sessoes, usuarios: t.usuarios, novos: t.novos, engajadas: t.engajadas, views: t.views, seg: t.seg, eventos: t.eventos } : { ...ZERO };
    };
    const lista = (tipo, limite, info = false) => {
      const ant = new Map(agg.filter((a) => a.tipo === tipo && a.periodo === "anterior").map((a) => [a.chave, a]));
      return agg.filter((a) => a.tipo === tipo && a.periodo === "atual").sort((x, y) => tipo === "evento" ? y.eventos - x.eventos : y.sessoes - x.sessoes || y.views - x.views).slice(0, limite).map((a) => {
        const b = ant.get(a.chave);
        return { chave: a.chave, sessoes: a.sessoes, usuarios: a.usuarios, novos: a.novos, engajadas: a.engajadas, views: a.views, seg: a.seg, eventos: a.eventos, anterior: { sessoes: b?.sessoes ?? 0, usuarios: b?.usuarios ?? 0, eventos: b?.eventos ?? 0 }, ...info ? { info: classificarPagina(a.chave) } : {} };
      });
    };
    const base = { atual: total("atual"), anterior: total("anterior"), canais: lista("canal", 12), entradas: lista("entrada", 300, true), eventos: lista("evento", 30) };
    return { id: s2.id, rotulo: s2.rotulo, propriedade: props[s2.id] ?? null, ultimoDia: serie.at(-1)?.dia ?? null, serie, ...base, origens: lista("origem", 30), paginas: lista("pagina", 300, true), aparelhos: lista("aparelho", 6), paises: lista("pais", 12), recados: serie.length ? recadosGa(base) : [] };
  });
  return { configurado: !!lerChave(env) && Object.keys(props).length > 0, ultimoErro: brain2.policy("ga_ultimo_erro", null), ultimaSync: brain2.policy("ga_ultima_sync", null), sites };
}

// packages/core/src/planejamento.ts
var RESPONSAVEIS_PADRAO = ["Felipe Dalpra", "Cassio", "Felipe Augusto"];
var STATUS = /* @__PURE__ */ new Set(["pendente", "andamento", "concluida"]);
var DAY6 = 864e5;
function segundaDe(dia5) {
  const d = /* @__PURE__ */ new Date(`${dia5}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) throw new BrainError("invalid", "Semana inv\xE1lida.");
  const dow = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - dow * DAY6).toISOString().slice(0, 10);
}
var semanaAtual = (brain2) => segundaDe(brtDay(brain2.clock()));
var somaDias2 = (dia5, n3) => new Date(Date.parse(`${dia5}T12:00:00Z`) + n3 * DAY6).toISOString().slice(0, 10);
var responsaveis = (brain2) => brain2.policy("plan_responsaveis", RESPONSAVEIS_PADRAO);
var ver = (l) => ({ id: l.id, semana: l.semana, tipo: l.tipo, titulo: l.titulo, dia: l.dia, formato: l.formato, responsavel: l.responsavel, status: l.status, pai: l.pai, ordem: l.ordem, notas: l.notas, criadoEm: l.criado_em, concluidoEm: l.concluido_em, veioDe: l.veio_de, subtarefas: [] });
function itensDa(brain2, semana) {
  const todos = rows(brain2.db, "select * from plan_itens where semana = ? order by ordem, criado_em", semana).map(ver);
  const porId = new Map(todos.map((i) => [i.id, i]));
  for (const i of todos) if (i.pai) porId.get(i.pai)?.subtarefas.push(i);
  return todos.filter((i) => !i.pai);
}
var folhas = (itens2) => itens2.flatMap((i) => i.subtarefas.length ? i.subtarefas : [i]);
function taxa2(itens2) {
  const f = folhas(itens2);
  const concluidas = f.filter((i) => i.status === "concluida").length, andamento = f.filter((i) => i.status === "andamento").length;
  return { total: f.length, concluidas, andamento, pendentes: f.length - concluidas - andamento, taxa: f.length ? concluidas / f.length : 0 };
}
var porResp = (itens2) => {
  const g = /* @__PURE__ */ new Map();
  for (const i of folhas(itens2)) {
    const n3 = i.responsavel || "Sem respons\xE1vel";
    g.set(n3, [...g.get(n3) ?? [], { ...i, subtarefas: [] }]);
  }
  return [...g].map(([nome, l]) => ({ nome, ...taxa2(l) })).sort((a, b) => b.total - a.total);
};
function planPainel(brain2, semanaPedida) {
  const atual = semanaAtual(brain2);
  const semana = semanaPedida ? segundaDe(semanaPedida) : atual;
  const itens2 = itensDa(brain2, semana);
  const posts = itens2.filter((i) => i.tipo === "post").sort((a, b) => (a.dia ?? 9) - (b.dia ?? 9) || a.ordem - b.ordem);
  const tarefas = itens2.filter((i) => i.tipo === "tarefa");
  const semanas = rows(brain2.db, "select distinct semana from plan_itens order by semana desc limit 26").map((s2) => s2.semana);
  if (!semanas.includes(atual)) semanas.unshift(atual);
  const historico = semanas.slice(0, 12).map((s2) => {
    const l = itensDa(brain2, s2);
    return { semana: s2, ...taxa2(l), posts: taxa2(l.filter((i) => i.tipo === "post")), tarefas: taxa2(l.filter((i) => i.tipo === "tarefa")) };
  }).reverse();
  const tudo = semanas.filter((s2) => s2 <= atual).flatMap((s2) => itensDa(brain2, s2));
  const anterior = itensDa(brain2, somaDias2(semana, -7));
  const jaTrazidos = new Set(itens2.map((i) => i.veioDe).filter(Boolean));
  return {
    semana,
    fim: somaDias2(semana, 6),
    atual,
    ehAtual: semana === atual,
    responsaveis: responsaveis(brain2),
    posts,
    tarefas,
    resumo: { geral: taxa2(itens2), posts: taxa2(posts), tarefas: taxa2(tarefas), porResponsavel: porResp(itens2) },
    historico,
    acumulado: { geral: taxa2(tudo), porResponsavel: porResp(tudo) },
    pendentesAnterior: anterior.filter((i) => i.status !== "concluida" && !jaTrazidos.has(i.id)).length
  };
}
var texto = (v, max) => String(v ?? "").trim().slice(0, max);
function pegar(brain2, id) {
  const l = row(brain2.db, "select * from plan_itens where id = ?", String(id ?? ""));
  if (!l) throw new BrainError("not_found", "Item n\xE3o encontrado.");
  return l;
}
function sincronizarPai(brain2, pai) {
  if (!pai) return;
  const subs = rows(brain2.db, "select status from plan_itens where pai = ?", pai);
  if (!subs.length) return;
  const st = subs.every((s2) => s2.status === "concluida") ? "concluida" : subs.some((s2) => s2.status !== "pendente") ? "andamento" : "pendente";
  run(brain2.db, "update plan_itens set status = ?, concluido_em = ? where id = ?", st, st === "concluida" ? brain2.clock() : null, pai);
}
function planAcao(brain2, body) {
  const acao = String(body.acao ?? "");
  const agora = brain2.clock();
  let semana = body.semana ? segundaDe(String(body.semana)) : semanaAtual(brain2);
  if (acao === "criar") {
    const titulo2 = texto(body.titulo, 300);
    if (!titulo2) throw new BrainError("invalid", "Escreva o t\xEDtulo.");
    const pai = body.pai ? pegar(brain2, body.pai) : null;
    if (pai?.pai) throw new BrainError("invalid", "Subtarefa n\xE3o pode ter subtarefa.");
    const tipo = pai ? pai.tipo : body.tipo === "post" ? "post" : "tarefa";
    if (pai) semana = pai.semana;
    const dia5 = tipo === "post" && body.dia != null && body.dia !== "" ? Math.min(6, Math.max(0, Number(body.dia) | 0)) : null;
    const resp = texto(body.responsavel, 60) || pai?.responsavel || "";
    const ordem = (row(brain2.db, "select max(ordem) as m from plan_itens where semana = ?", semana)?.m ?? 0) + 1;
    run(brain2.db, "insert into plan_itens (id, semana, tipo, titulo, dia, formato, responsavel, status, pai, ordem, notas, criado_em) values (?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, '', ?)", crypto.randomUUID(), semana, tipo, titulo2, dia5, texto(body.formato, 30), resp, pai?.id ?? null, ordem, agora);
    sincronizarPai(brain2, pai?.id ?? null);
  } else if (acao === "editar") {
    const l = pegar(brain2, body.id);
    semana = l.semana;
    const titulo2 = body.titulo !== void 0 ? texto(body.titulo, 300) : l.titulo;
    if (!titulo2) throw new BrainError("invalid", "O t\xEDtulo n\xE3o pode ficar vazio.");
    const dia5 = body.dia !== void 0 ? body.dia === null || body.dia === "" ? null : Math.min(6, Math.max(0, Number(body.dia) | 0)) : l.dia;
    run(brain2.db, "update plan_itens set titulo = ?, dia = ?, formato = ?, responsavel = ?, notas = ? where id = ?", titulo2, dia5, body.formato !== void 0 ? texto(body.formato, 30) : l.formato, body.responsavel !== void 0 ? texto(body.responsavel, 60) : l.responsavel, body.notas !== void 0 ? texto(body.notas, 2e3) : l.notas, l.id);
  } else if (acao === "status") {
    const l = pegar(brain2, body.id);
    semana = l.semana;
    const st = String(body.status);
    if (!STATUS.has(st)) throw new BrainError("invalid", "Status inv\xE1lido.");
    run(brain2.db, "update plan_itens set status = ?, concluido_em = ? where id = ?", st, st === "concluida" ? agora : null, l.id);
    if (!l.pai && st !== "andamento") run(brain2.db, "update plan_itens set status = ?, concluido_em = ? where pai = ?", st, st === "concluida" ? agora : null, l.id);
    sincronizarPai(brain2, l.pai);
  } else if (acao === "remover") {
    const l = pegar(brain2, body.id);
    semana = l.semana;
    run(brain2.db, "delete from plan_itens where id = ? or pai = ?", l.id, l.id);
    sincronizarPai(brain2, l.pai);
  } else if (acao === "trazer_pendentes") {
    const ja = new Set(rows(brain2.db, "select veio_de as v from plan_itens where semana = ?", semana).map((r) => r.v));
    let ordem = row(brain2.db, "select max(ordem) as m from plan_itens where semana = ?", semana)?.m ?? 0;
    for (const i of itensDa(brain2, somaDias2(semana, -7))) {
      if (i.status === "concluida" || ja.has(i.id)) continue;
      const novo = crypto.randomUUID();
      run(brain2.db, "insert into plan_itens (id, semana, tipo, titulo, dia, formato, responsavel, status, pai, ordem, notas, criado_em, veio_de) values (?, ?, ?, ?, ?, ?, ?, 'pendente', null, ?, ?, ?, ?)", novo, semana, i.tipo, i.titulo, i.dia, i.formato, i.responsavel, ++ordem, i.notas, agora, i.id);
      for (const s2 of i.subtarefas) if (s2.status !== "concluida") run(brain2.db, "insert into plan_itens (id, semana, tipo, titulo, dia, formato, responsavel, status, pai, ordem, notas, criado_em, veio_de) values (?, ?, ?, ?, null, '', ?, 'pendente', ?, ?, '', ?, ?)", crypto.randomUUID(), semana, s2.tipo, s2.titulo, s2.responsavel, novo, ++ordem, agora, s2.id);
    }
  } else throw new BrainError("invalid", "A\xE7\xE3o desconhecida.");
  brain2.emit("change");
  return planPainel(brain2, semana);
}

// packages/core/src/compliance.ts
var EXTERNAL2 = /* @__PURE__ */ new Set(["whatsapp", "email", "linkedin", "instagram"]);
var NEEDS_CONSENT = /* @__PURE__ */ new Set(["whatsapp", "email"]);
var TEXT_RULES = [
  { id: "promessa", test: /\b(cura|curar|cure|garantid[oa]s?|garantimos|garantia de resultado|resultado garantido|sem risco|100 ?%)\b/i, why: "promete resultado a pacientes ou garantia, o que o CFP e a LGPD n\xE3o admitem", scope: "all" },
  { id: "desconto", test: /\b(desconto|promo[cç][aã]o|cupom|black ?friday|de gra[cç]a por|[0-9]+ ?% off)\b/i, why: "oferece desconto ou promo\xE7\xE3o: nenhum agente faz isso, s\xF3 voc\xEA decide", scope: "draft" },
  { id: "clinico", test: /\b(cpf|prontu[aá]rio|diagn[oó]stico d[eao]|cid[- ]?\d|laudo)\b/i, why: "cita dado cl\xEDnico de paciente, que nunca entra no Brain", scope: "all" },
  { id: "pressao", test: /\b(últim[ao]s? (vaga|chance|hora)|só hoje|corra|n[aã]o perca)\b/i, why: "usa press\xE3o de urg\xEAncia artificial", scope: "draft" }
];
var complianceReviewer = (p, { db, now }) => {
  for (const r of TEXT_RULES) {
    const text = r.scope === "draft" ? p.draft ?? "" : `${p.title}
${p.draft ?? ""}`;
    if (r.test.test(text)) return { ok: false, note: r.why };
  }
  const publico = p.payload?.envio?.tipo === "instagram";
  if (EXTERNAL2.has(p.channel) && p.draft && !publico) {
    if (!p.contactRef) return { ok: false, note: "mensagem externa sem identificar o contato: n\xE3o d\xE1 para checar consentimento nem o intervalo entre contatos" };
    const pl = p.payload;
    const legitimo = p.channel === "email" && pl?.base === "legitimo_interesse_b2b" && !!pl.prospeccao;
    if (legitimo && row(db, "select 1 as x from email_suppression where email = ?", p.contactRef.trim().toLowerCase())) return { ok: false, note: "esse contato pediu para sair ou deu erro de entrega" };
    if (NEEDS_CONSENT.has(p.channel) && !legitimo) {
      const c2 = row(db, "select revoked_at from consents where contact_ref = ? and channel = ?", p.contactRef, p.channel);
      if (!c2 || c2.revoked_at) return { ok: false, note: `sem consentimento v\xE1lido para ${p.channel} desse contato` };
    }
    const policy = row(db, "select value from policies where key = 'contact_policy'");
    const minDays = policy ? JSON.parse(policy.value).min_days_between : 3;
    const last = row(db, "select max(at) as at from contact_log where contact_ref = ?", p.contactRef);
    if (last?.at && now - last.at < minDays * 864e5) {
      const d = Math.ceil((minDays * 864e5 - (now - last.at)) / 864e5);
      return { ok: false, note: `esse contato recebeu mensagem h\xE1 menos de ${minDays} dias; liberar em ${d} dia(s)` };
    }
  }
  return { ok: true };
};

// packages/core/src/instagram.ts
var MAX_SLIDES = 10;
var MAX_B64 = 13e5;
var igual = (a, b) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};
function tokenValido(env, req) {
  const t = env.IG_INGEST_TOKEN?.trim();
  const h = req.headers.get("authorization") ?? "";
  return !!t && t.length >= 24 && igual(h, `Bearer ${t}`);
}
function revisarTexto(texto2) {
  if (/\b(cpf|diagn[oó]stico d[eao] (meu|minha|um|uma) paciente|cid[- ]?\d|laudo d[eao])\b/i.test(texto2)) return "cita dado cl\xEDnico de paciente, que nunca entra no Brain";
  for (const r of TEXT_RULES) if (r.id !== "clinico" && r.test.test(texto2)) return r.why;
  return null;
}
var MATURIDADES = /* @__PURE__ */ new Set(["existe", "piloto", "plano", "educativo"]);
function receberPost(brain2, body, origem) {
  const s2 = (k, max) => String(body[k] ?? "").trim().slice(0, max);
  const legenda = s2("legenda", 2200), tema = s2("tema", 160), pilar = s2("pilar", 60), textos = s2("textos", 6e3), creditos = s2("creditos", 600), chave2 = s2("chave", 120);
  const maturidade = s2("maturidade", 20) || "educativo";
  const slides = Array.isArray(body.slides) ? body.slides.map(String) : [];
  if (!legenda || !tema) throw new BrainError("invalid", "Faltou tema ou legenda.");
  if (!MATURIDADES.has(maturidade)) throw new BrainError("invalid", "maturidade deve ser existe, piloto, plano ou educativo.");
  if (slides.length < 1 || slides.length > MAX_SLIDES) throw new BrainError("invalid", `Mande de 1 a ${MAX_SLIDES} imagens.`);
  for (const b of slides) {
    if (b.length > MAX_B64) throw new BrainError("invalid", "Imagem grande demais: exporte em JPEG com at\xE9 ~900 KB.");
    if (!b.startsWith("/9j/")) throw new BrainError("invalid", "As imagens devem ser JPEG em base64 (o Instagram s\xF3 aceita JPEG).");
  }
  const motivo = revisarTexto(`${legenda}
${textos}`);
  if (motivo) throw new BrainError("invalid", `A conformidade barrou esse post: ${motivo}. Reescreva e mande de novo.`);
  if (chave2) {
    const ja = row(brain2.db, "select id, status, agendado_para from ig_posts where chave = ?", chave2);
    if (ja) return { id: ja.id, status: ja.status, agendadoPara: ja.agendado_para };
  }
  const agora = brain2.clock();
  const ag = Date.parse(String(body.agendar_para ?? ""));
  const agendado = Number.isFinite(ag) && ag > agora ? ag : agora;
  const id = crypto.randomUUID();
  brain2.db.transaction(() => {
    run(brain2.db, "insert into ig_posts (id, chave, status, tema, pilar, maturidade, legenda, textos, creditos, agendado_para, criado_em) values (?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?, ?)", id, chave2 || null, tema, pilar, maturidade, legenda, textos, creditos, agendado, agora);
    slides.forEach((b, i) => run(brain2.db, "insert into ig_midia (id, post_id, ordem, b64) values (?, ?, ?, ?)", crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 8), id, i, b));
  });
  brain2.setPolicy("ig_origem", origem);
  brain2.audit("sistema", "ig_recebeu", tema, { slides: slides.length, maturidade });
  brain2.emit("change");
  return { id, status: "pendente", agendadoPara: agendado };
}
function servirMidia(brain2, nome) {
  const m = nome.match(/^([a-f0-9]{40})\.jpg$/);
  const r = m ? row(brain2.db, "select b64 from ig_midia where id = ?", m[1]) : void 0;
  if (!r) return new Response("n\xE3o encontrado", { status: 404 });
  const bin = Uint8Array.from(atob(r.b64), (c2) => c2.charCodeAt(0));
  return new Response(bin, { status: 200, headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=86400" } });
}
var ver2 = (brain2, l) => ({
  id: l.id,
  status: l.status,
  tema: l.tema,
  pilar: l.pilar,
  maturidade: l.maturidade,
  legenda: l.legenda,
  textos: l.textos,
  creditos: l.creditos,
  agendadoPara: l.agendado_para,
  criadoEm: l.criado_em,
  publicadoEm: l.publicado_em,
  permalink: l.permalink,
  erro: l.erro,
  midias: rows(brain2.db, "select id from ig_midia where post_id = ? order by ordem", l.id).map((m) => `/api/midia/${m.id}.jpg`)
});
function igPainel(brain2, env) {
  const ls = rows(brain2.db, "select * from ig_posts order by case status when 'pendente' then 0 when 'falhou' then 1 when 'aprovado' then 2 else 3 end, agendado_para desc limit 60");
  return { configurado: !!(env.META_SYSTEM_USER_TOKEN && env.META_IG_ID), tokenEntrega: !!env.IG_INGEST_TOKEN, auto: brain2.policy("ig_auto_publicar", false) === true, posts: ls.map((l) => ver2(brain2, l)) };
}
function igContexto(brain2) {
  const ls = rows(brain2.db, "select * from ig_posts order by criado_em desc limit 60");
  const fila = ls.filter((l) => l.status === "pendente" || l.status === "aprovado");
  return {
    recentes: ls.map((l) => ({ tema: l.tema, pilar: l.pilar, maturidade: l.maturidade, status: l.status, dia: new Date(l.agendado_para).toISOString().slice(0, 10), ...l.status === "rejeitado" && l.erro ? { motivoRejeicao: l.erro } : {} })),
    pendentes: fila.length,
    proximoLivre: Math.max(brain2.clock(), ...fila.map((l) => l.agendado_para))
  };
}
function decidirPost(brain2, id, acao, motivo = "") {
  const p = row(brain2.db, "select * from ig_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post n\xE3o encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Esse post j\xE1 foi publicado.");
  if (acao === "aprovar" && brain2.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado: aprova\xE7\xF5es bloqueadas.");
  run(brain2.db, "update ig_posts set status = ?, erro = ?, decidido_em = ? where id = ?", acao === "aprovar" ? "aprovado" : "rejeitado", acao === "rejeitar" ? motivo.slice(0, 300) || null : null, brain2.clock(), id);
  if (acao === "rejeitar") run(brain2.db, "delete from ig_midia where post_id = ?", id);
  brain2.audit("voce", acao === "aprovar" ? "ig_aprovou" : "ig_rejeitou", p.tema);
  brain2.emit("change");
}
function editarLegenda(brain2, id, legenda) {
  const p = row(brain2.db, "select * from ig_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post n\xE3o encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Esse post j\xE1 foi publicado.");
  const t = legenda.trim().slice(0, 2200);
  if (!t) throw new BrainError("invalid", "A legenda n\xE3o pode ficar vazia.");
  const motivo = revisarTexto(t);
  if (motivo) throw new BrainError("invalid", `A conformidade barrou essa legenda: ${motivo}.`);
  run(brain2.db, "update ig_posts set legenda = ? where id = ?", t, id);
  brain2.emit("change");
}
async function graph(env, f, metodo, caminho, params) {
  const v = env.META_GRAPH_VERSION ?? "v23.0";
  const qs = new URLSearchParams(params);
  const res = await f(`https://graph.facebook.com/${v}/${caminho}${metodo === "GET" ? `?${qs}` : ""}`, { method: metodo, headers: { authorization: `Bearer ${env.META_SYSTEM_USER_TOKEN}`, ...metodo === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {} }, ...metodo === "POST" ? { body: qs } : {} });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new BrainError("invalid", `Instagram recusou (${res.status}): ${body.error?.message ?? "erro"}`);
  return body;
}
async function publicarPost(brain2, env, id, f = fetch, espera = (ms2) => new Promise((r) => setTimeout(r, ms2))) {
  if (brain2.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado.");
  const p = row(brain2.db, "select * from ig_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post n\xE3o encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "J\xE1 foi publicado.");
  if (p.status !== "aprovado" && p.status !== "falhou") throw new BrainError("invalid", "S\xF3 publico o que foi aprovado.");
  const ig = env.META_IG_ID;
  if (!env.META_SYSTEM_USER_TOKEN || !ig) throw new BrainError("invalid", "Falta META_SYSTEM_USER_TOKEN ou META_IG_ID nos secrets do Brain.");
  const origem = env.BRAIN_PUBLIC_URL ?? brain2.policy("ig_origem", "");
  if (!/^https:\/\//.test(origem)) throw new BrainError("invalid", "N\xE3o sei o endere\xE7o p\xFAblico do Brain para o Instagram buscar as imagens.");
  const midias = rows(brain2.db, "select id from ig_midia where post_id = ? order by ordem", id).map((m) => `${origem}/api/midia/${m.id}.jpg`);
  if (!midias.length) throw new BrainError("invalid", "Esse post n\xE3o tem imagem.");
  run(brain2.db, "update ig_posts set status = 'falhou', erro = 'publica\xE7\xE3o interrompida: confira o perfil antes de tentar de novo' where id = ?", id);
  try {
    const pronto = async (container) => {
      for (let i = 0; i < 10; i++) {
        const st = await graph(env, f, "GET", container, { fields: "status_code" });
        if (st.status_code === "FINISHED" || st.status_code === void 0) return;
        if (st.status_code === "ERROR" || st.status_code === "EXPIRED") throw new BrainError("invalid", `O Instagram n\xE3o processou a imagem (${st.status_code}).`);
        await espera(2e3);
      }
    };
    let criacao;
    if (midias.length === 1) {
      criacao = (await graph(env, f, "POST", `${ig}/media`, { image_url: midias[0], caption: p.legenda })).id;
    } else {
      const filhos = [];
      for (const u of midias) {
        const c2 = (await graph(env, f, "POST", `${ig}/media`, { image_url: u, is_carousel_item: "true" })).id;
        await pronto(c2);
        filhos.push(c2);
      }
      criacao = (await graph(env, f, "POST", `${ig}/media`, { media_type: "CAROUSEL", children: filhos.join(","), caption: p.legenda })).id;
    }
    await pronto(criacao);
    const mediaId = (await graph(env, f, "POST", `${ig}/media_publish`, { creation_id: criacao })).id;
    const link = await graph(env, f, "GET", mediaId, { fields: "permalink" }).then((r) => r.permalink ?? null).catch(() => null);
    run(brain2.db, "update ig_posts set status = 'publicado', publicado_em = ?, media_id = ?, permalink = ?, erro = null where id = ?", brain2.clock(), mediaId, link, id);
    brain2.audit("sistema", "ig_publicou", p.tema, { mediaId });
    brain2.emit("change");
    return "Publicado no Instagram.";
  } catch (e) {
    const msg2 = e instanceof Error ? e.message : String(e);
    run(brain2.db, "update ig_posts set status = 'falhou', erro = ? where id = ?", msg2.slice(0, 300), id);
    brain2.emit("change");
    throw e;
  }
}
async function publicarDevidos(brain2, env, f = fetch) {
  if (brain2.killed()) return null;
  const agora = brain2.clock();
  if (brain2.policy("ig_auto_publicar", false) === true) {
    const esperaMs = Number(brain2.policy("ig_auto_espera_h", 12)) * 36e5;
    for (const p of rows(brain2.db, "select id, tema from ig_posts where status = 'pendente' and agendado_para <= ? and criado_em <= ?", agora, agora - esperaMs)) {
      run(brain2.db, "update ig_posts set status = 'aprovado', decidido_em = ? where id = ?", agora, p.id);
      brain2.audit("sistema", "ig_aprovou_automatico", p.tema);
    }
  }
  const hoje = row(brain2.db, "select count(*) as n from ig_posts where status = 'publicado' and publicado_em > ?", agora - 20 * 36e5)?.n ?? 0;
  if (hoje >= Number(brain2.policy("ig_max_por_dia", 1))) return null;
  const prox = row(brain2.db, "select id from ig_posts where status = 'aprovado' and agendado_para <= ? order by agendado_para asc limit 1", agora);
  if (!prox) return null;
  try {
    return await publicarPost(brain2, env, prox.id, f);
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

// packages/core/src/llm.ts
function llmConfig(env, kind) {
  const forced = env.LLM_PROVIDER;
  const provider = forced === "openai" || forced === "anthropic" ? forced : env.OPENAI_API_KEY ? "openai" : env.ANTHROPIC_API_KEY ? "anthropic" : null;
  if (!provider) return null;
  const apiKey = provider === "openai" ? env.OPENAI_API_KEY : env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  const override = kind === "jarvis" ? env.JARVIS_MODEL : env.AGENT_MODEL;
  const model = override ?? env.JARVIS_MODEL ?? (provider === "openai" ? env.OPENAI_MODEL ?? "gpt-4.1" : "claude-sonnet-5-5");
  return {
    provider,
    apiKey,
    model,
    // Estimativa. Confira os preços do seu modelo e ajuste no .env.local.
    priceInUsd: Number(env.LLM_PRICE_IN_USD_PER_MTOK ?? (provider === "openai" ? 2 : 3)),
    priceOutUsd: Number(env.LLM_PRICE_OUT_USD_PER_MTOK ?? (provider === "openai" ? 8 : 15)),
    usdBrl: Number(env.USD_BRL ?? 5.5)
  };
}
var costBrl = (c2, u) => Math.round((u.input_tokens * c2.priceInUsd + u.output_tokens * c2.priceOutUsd) / 1e6 * c2.usdBrl * 1e4) / 1e4;
async function callAnthropic(c2, req, fetchFn) {
  const res = await fetchFn("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": c2.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: c2.model, max_tokens: req.maxTokens ?? 1024, system: req.system, messages: req.messages, ...req.tools?.length ? { tools: req.tools } : {} })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }
  return await res.json();
}
function toOpenAi(system, messages) {
  const out = [{ role: "system", content: system }];
  for (const m of messages) {
    if (typeof m.content === "string") {
      out.push(m.role === "user" ? { role: "user", content: m.content } : { role: "assistant", content: m.content });
      continue;
    }
    if (m.role === "assistant") {
      const calls = m.content.filter((b) => b.type === "tool_use");
      out.push({ role: "assistant", content: textOf(m.content) || null, ...calls.length ? { tool_calls: calls.map((b) => ({ id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input) } })) } : {} });
    } else {
      for (const b of m.content) if (b.type === "tool_result") out.push({ role: "tool", tool_call_id: b.tool_use_id, content: b.is_error ? `Erro: ${b.content}` : b.content });
    }
  }
  return out;
}
async function callOpenAi(c2, req, fetchFn) {
  const res = await fetchFn("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${c2.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: c2.model,
      max_completion_tokens: req.maxTokens ?? 1024,
      messages: toOpenAi(req.system, req.messages),
      ...req.tools?.length ? { tools: req.tools.map((t) => ({ type: "function", function: { name: t.name, description: t.description, parameters: t.input_schema } })) } : {}
    })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }
  const j2 = await res.json();
  const msg2 = j2.choices[0]?.message;
  const content = [];
  if (msg2?.content) content.push({ type: "text", text: msg2.content });
  for (const t of msg2?.tool_calls ?? []) {
    let input = {};
    try {
      input = JSON.parse(t.function.arguments || "{}");
    } catch {
    }
    content.push({ type: "tool_use", id: t.id, name: t.function.name, input });
  }
  return { content, stop_reason: j2.choices[0]?.finish_reason ?? "stop", usage: { input_tokens: j2.usage?.prompt_tokens ?? 0, output_tokens: j2.usage?.completion_tokens ?? 0 } };
}
var callLlm = (c2, req, fetchFn = fetch) => c2.provider === "openai" ? callOpenAi(c2, req, fetchFn) : callAnthropic(c2, req, fetchFn);
var textOf = (blocks) => blocks.flatMap((b) => b.type === "text" ? [b.text] : []).join("\n").trim();
async function toolLoop(c2, req, runTool, fetchFn = fetch) {
  const messages = [...req.messages];
  let cost = 0;
  for (let round = 0; round < (req.maxRounds ?? 6); round++) {
    const r = await callLlm(c2, { ...req, messages }, fetchFn);
    cost += costBrl(c2, r.usage);
    const uses = r.content.filter((b) => b.type === "tool_use");
    if (uses.length === 0) return { text: textOf(r.content), cost };
    messages.push({ role: "assistant", content: r.content });
    const results = [];
    for (const u of uses) {
      try {
        results.push({ type: "tool_result", tool_use_id: u.id, content: await runTool(u.name, u.input) });
      } catch (e) {
        results.push({ type: "tool_result", tool_use_id: u.id, content: e instanceof Error ? e.message : "erro", is_error: true });
      }
    }
    messages.push({ role: "user", content: results });
  }
  return { text: "N\xE3o consegui concluir dentro do limite de passos. Tente pedir de forma mais direta.", cost };
}

// packages/core/src/linkedin.ts
var ORG_PADRAO = "134663896";
var MAX = 3e3;
var TEMAS2 = [
  { categoria: "Urg\xEAncia de Mercado", prompt: "Escreva um post para LinkedIn voltado para psic\xF3logos brasileiros sobre a transforma\xE7\xE3o digital na sa\xFAde: prontu\xE1rio \xFAnico, Datasus, RDNS. O argumento central: os psic\xF3logos que n\xE3o tiverem dados organizados e tecnologia no processo v\xE3o ficar para tr\xE1s. Tom: direto, urgente mas n\xE3o alarmista, posicionamento de futuro. N\xE3o mencione a Synapsa diretamente. Termine com uma pergunta para engajar." },
  { categoria: "Qualidade Cl\xEDnica", prompt: "Escreva um post para LinkedIn voltado para psic\xF3logos brasileiros sobre a lacuna entre sess\xF5es de terapia: o que acontece com o paciente nos outros 6 dias da semana. Argumento: a terapia acontece al\xE9m da sess\xE3o. Fale sobre di\xE1rio emocional, escalas cl\xEDnicas, acompanhamento de evolu\xE7\xE3o. Tom: cl\xEDnico, reflexivo, humanizado. N\xE3o mencione a Synapsa diretamente." },
  { categoria: "Tempo e Produtividade", prompt: "Escreva um post para LinkedIn voltado para psic\xF3logos brasileiros sobre o tempo perdido com tarefas administrativas: agendamento, cobran\xE7a, WhatsApp, reagendamentos. Argumento: o psic\xF3logo n\xE3o estudou anos para virar assistente administrativo de si mesmo. Tom: direto, provocativo mas construtivo. Pode mencionar a Synapsa no final como solu\xE7\xE3o." },
  { categoria: "IA na Psicologia", prompt: "Escreva um post para LinkedIn voltado para psic\xF3logos brasileiros sobre intelig\xEAncia artificial na pr\xE1tica cl\xEDnica. Argumento central: a IA n\xE3o substitui o psic\xF3logo, ela \xE9 a assistente de pesquisa que o psic\xF3logo nunca teve. Fale sobre escalas autom\xE1ticas, an\xE1lise de evolu\xE7\xE3o, Lyra (apoio ao paciente entre sess\xF5es). Tom: equilibrado, desmistificador, humanizado. Pode mencionar a Synapsa." },
  { categoria: "Abandono de Pacientes", prompt: "Escreva um post para LinkedIn voltado para psic\xF3logos brasileiros sobre abandono de pacientes na terapia. Argumento: uma parcela relevante dos pacientes abandona antes de atingir seus objetivos, e a maioria dos psic\xF3logos n\xE3o recebe nenhum sinal antes. Fale sobre engajamento, acompanhamento, sinais de risco. N\xE3o cite porcentagem se n\xE3o for citar a fonte. Tom: cl\xEDnico, emp\xE1tico, reflexivo. N\xE3o mencione a Synapsa diretamente. Termine com uma pergunta." }
];
var SISTEMA = `Voc\xEA \xE9 Felipe Dalpra, fundador da Synapsa, plataforma para psic\xF3logos. Escreve posts aut\xEAnticos, diretos e humanos para o LinkedIn. Sua voz \xE9 de quem entende o mercado de psicologia e sa\xFAde mental, fala com clareza sobre tecnologia e nunca usa linguagem corporativa. Tagline: Cl\xEDnica + tecnol\xF3gica + humana. Miss\xE3o: fazer a terapia acontecer al\xE9m da sess\xE3o. Sempre em portugu\xEAs do Brasil.
Regras: m\xE1ximo 1200 caracteres; 3 a 5 hashtags no final; frases curtas; nada de "voc\xEA sabia?"; sem emoji em excesso (no m\xE1ximo 2).
Proibido: prometer resultado cl\xEDnico, cura ou garantia; desconto, promo\xE7\xE3o ou urg\xEAncia artificial; dado ou caso cl\xEDnico de paciente; estat\xEDstica ou n\xFAmero inventado (s\xF3 use n\xFAmero se for citar quem publicou e o ano); citar concorrente; dizer que a Synapsa garante conformidade com a NR 1.
Responda s\xF3 com o texto do post, sem t\xEDtulo nem explica\xE7\xE3o.`;
var row2 = (l) => ({ id: l.id, status: l.status, categoria: l.categoria, texto: l.texto, criadoEm: l.criado_em, publicadoEm: l.publicado_em, permalink: l.permalink, erro: l.erro, manual: l.manual === 1 });
var diaDePostar = (agora) => [1, 3, 5].includes((/* @__PURE__ */ new Date(`${brtDay(agora)}T12:00:00Z`)).getUTCDay());
function proximoTema(brain2) {
  const ult = new Map(rows(brain2.db, "select categoria, max(criado_em) as u from li_posts group by categoria").map((r) => [r.categoria, r.u]));
  return [...TEMAS2].sort((a, b) => (ult.get(a.categoria) ?? 0) - (ult.get(b.categoria) ?? 0))[0];
}
var lerToken = (brain2) => row(brain2.db, "select access_token, refresh_token, expira_em from li_token where id = 1");
function liConfigurado(brain2, env) {
  const t = lerToken(brain2);
  return !!env.LINKEDIN_ACCESS_TOKEN || !!t && (t.expira_em > brain2.clock() || !!t.refresh_token);
}
var REDIRECT = (origin) => `${origin}/api/linkedin/callback`;
var ESCOPO3 = { pessoa: "openid profile w_member_social", organizacao: "w_organization_social" };
var lerAutor = (brain2) => brain2.policy("li_autor", { alvo: "organizacao", urn: null, nome: null });
function liUrlAutorizar(brain2, env, origin, alvo = "pessoa") {
  if (!env.LINKEDIN_CLIENT_ID || !env.LINKEDIN_CLIENT_SECRET) throw new BrainError("invalid", "Faltam LINKEDIN_CLIENT_ID e LINKEDIN_CLIENT_SECRET nos secrets do Brain.");
  const state = crypto.randomUUID().replace(/-/g, "");
  brain2.setPolicy("li_state", { s: state, exp: brain2.clock() + 6e5, alvo });
  const q = new URLSearchParams({ response_type: "code", client_id: env.LINKEDIN_CLIENT_ID, redirect_uri: REDIRECT(origin), state, scope: ESCOPO3[alvo] });
  return `https://www.linkedin.com/oauth/v2/authorization?${q}`;
}
async function pedirToken(env, f, params) {
  const res = await f("https://www.linkedin.com/oauth/v2/accessToken", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ ...params, client_id: env.LINKEDIN_CLIENT_ID ?? "", client_secret: env.LINKEDIN_CLIENT_SECRET ?? "" }) });
  const b = await res.json().catch(() => ({}));
  if (!res.ok || !b.access_token) throw new BrainError("invalid", `LinkedIn recusou o login (${res.status}): ${b.error_description ?? b.error ?? "erro"}`);
  return { access_token: b.access_token, refresh_token: b.refresh_token, expires_in: b.expires_in ?? 5184e3 };
}
var guardar = (brain2, t) => run(brain2.db, "insert into li_token (id, access_token, refresh_token, expira_em, atualizado_em) values (1, ?, ?, ?, ?) on conflict(id) do update set access_token = excluded.access_token, refresh_token = coalesce(excluded.refresh_token, li_token.refresh_token), expira_em = excluded.expira_em, atualizado_em = excluded.atualizado_em", t.access_token, t.refresh_token ?? null, brain2.clock() + t.expires_in * 1e3 - 6e4, brain2.clock());
async function liCallback(brain2, env, f, origin, code, state) {
  const st = brain2.policy("li_state", null);
  brain2.setPolicy("li_state", null);
  if (!st || !code || st.s !== state || st.exp < brain2.clock()) throw new BrainError("invalid", "O login expirou ou n\xE3o foi iniciado por aqui. Toque em Conectar LinkedIn de novo.");
  const tok = await pedirToken(env, f, { grant_type: "authorization_code", code, redirect_uri: REDIRECT(origin) });
  const alvo = st.alvo === "organizacao" ? "organizacao" : "pessoa";
  let autor = { alvo, urn: null, nome: null };
  if (alvo === "pessoa") {
    const u = await f("https://api.linkedin.com/v2/userinfo", { headers: { authorization: `Bearer ${tok.access_token}` } });
    const j2 = await u.json().catch(() => ({}));
    if (!u.ok || !j2.sub) throw new BrainError("invalid", "O LinkedIn n\xE3o informou quem \xE9 voc\xEA. Adicione ao app o produto Sign In with LinkedIn using OpenID Connect e conecte de novo.");
    autor = { alvo, urn: `urn:li:person:${j2.sub}`, nome: j2.name ?? null };
  }
  guardar(brain2, tok);
  brain2.setPolicy("li_autor", autor);
  brain2.audit("voce", "li_conectou", alvo === "pessoa" ? "perfil pessoal" : "p\xE1gina da empresa");
  brain2.emit("change");
}
async function tokenAtual(brain2, env, f) {
  const t = lerToken(brain2);
  if (t && t.expira_em > brain2.clock()) return t.access_token;
  if (t?.refresh_token && env.LINKEDIN_CLIENT_ID) {
    try {
      guardar(brain2, await pedirToken(env, f, { grant_type: "refresh_token", refresh_token: t.refresh_token }));
      return lerToken(brain2).access_token;
    } catch {
    }
  }
  return env.LINKEDIN_ACCESS_TOKEN ?? null;
}
function liPainel(brain2, env) {
  const ls = rows(brain2.db, "select * from li_posts order by case status when 'pendente' then 0 when 'falhou' then 1 when 'aprovado' then 2 else 3 end, criado_em desc limit 40");
  const au = lerAutor(brain2);
  const doToken = !!lerToken(brain2);
  return { configurado: liConfigurado(brain2, env), alvo: doToken ? au.alvo : "organizacao", destino: doToken && au.alvo === "pessoa" ? `perfil de ${au.nome ?? "voc\xEA"}` : `p\xE1gina da empresa (${env.LINKEDIN_ORG_ID ?? ORG_PADRAO})`, appPronto: !!(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET), expiraEm: lerToken(brain2)?.expira_em ?? null, organizacao: env.LINKEDIN_ORG_ID ?? ORG_PADRAO, llm: !!llmConfig(env, "agent"), diasDePostar: "segunda, quarta e sexta", posts: ls.map(row2) };
}
async function liGerar(brain2, env, f = fetch, opts = {}) {
  if (brain2.killed()) return null;
  const agora = brain2.clock();
  const dia5 = brtDay(agora);
  if (!opts.forcar && row(brain2.db, "select id from li_posts where chave = ?", dia5)) return null;
  const cfg = llmConfig(env, "agent");
  if (!cfg) throw new BrainError("invalid", "Falta a chave do modelo (OPENAI_API_KEY ou ANTHROPIC_API_KEY) nos secrets do Brain.");
  const tema = proximoTema(brain2);
  let texto2 = "";
  let aviso = "";
  for (let t = 0; t < 2; t++) {
    const r = await callLlm(cfg, { system: SISTEMA, messages: [{ role: "user", content: `${tema.prompt}${aviso}` }], maxTokens: 900 }, f);
    texto2 = textOf(r.content).trim().slice(0, MAX);
    const motivo = texto2 ? revisarTexto(texto2) : "texto vazio";
    if (!motivo) {
      aviso = "";
      break;
    }
    aviso = `

A vers\xE3o anterior foi barrada: ${motivo}. Reescreva sem isso.`;
    texto2 = "";
  }
  if (!texto2) throw new BrainError("invalid", "O modelo n\xE3o entregou um texto aprovado pela conformidade. Tente gerar de novo.");
  const id = crypto.randomUUID();
  run(brain2.db, "insert into li_posts (id, chave, status, categoria, texto, criado_em) values (?, ?, 'pendente', ?, ?, ?)", id, opts.forcar ? `${dia5}#${id.slice(0, 6)}` : dia5, tema.categoria, texto2, agora);
  brain2.audit("sistema", "li_gerou", tema.categoria);
  brain2.emit("change");
  return { id, categoria: tema.categoria };
}
function liDecidir(brain2, id, acao, motivo = "") {
  const p = row(brain2.db, "select * from li_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post n\xE3o encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Esse post j\xE1 foi publicado.");
  if (acao === "aprovar" && brain2.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado: aprova\xE7\xF5es bloqueadas.");
  run(brain2.db, "update li_posts set status = ?, erro = ?, decidido_em = ? where id = ?", acao === "aprovar" ? "aprovado" : "rejeitado", acao === "rejeitar" ? motivo.slice(0, 300) || null : null, brain2.clock(), id);
  brain2.audit("voce", acao === "aprovar" ? "li_aprovou" : "li_rejeitou", p.categoria);
  brain2.emit("change");
}
function liEditar(brain2, id, texto2) {
  const p = row(brain2.db, "select * from li_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post n\xE3o encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "Esse post j\xE1 foi publicado.");
  const t = texto2.trim().slice(0, MAX);
  if (!t) throw new BrainError("invalid", "O texto n\xE3o pode ficar vazio.");
  const motivo = revisarTexto(t);
  if (motivo) throw new BrainError("invalid", `A conformidade barrou esse texto: ${motivo}.`);
  run(brain2.db, "update li_posts set texto = ? where id = ?", t, id);
  brain2.emit("change");
}
function liMarcarPublicado(brain2, id) {
  const p = row(brain2.db, "select * from li_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post n\xE3o encontrado.");
  if (p.status === "publicado") return;
  run(brain2.db, "update li_posts set status = 'publicado', manual = 1, publicado_em = ?, erro = null where id = ?", brain2.clock(), id);
  brain2.audit("voce", "li_marcou_publicado", p.categoria);
  brain2.emit("change");
}
var escaparLinkedIn = (t) => t.replace(/([\\|{}@\[\]()<>*_~])/g, "\\$1");
async function liPublicar(brain2, env, id, f = fetch) {
  if (brain2.killed()) throw new BrainError("kill_switch", "Bot\xE3o de emerg\xEAncia ligado.");
  const p = row(brain2.db, "select * from li_posts where id = ?", id);
  if (!p) throw new BrainError("not_found", "Post n\xE3o encontrado.");
  if (p.status === "publicado") throw new BrainError("already_decided", "J\xE1 foi publicado.");
  if (p.status !== "aprovado" && p.status !== "falhou") throw new BrainError("invalid", "S\xF3 publico o que foi aprovado.");
  const token = await tokenAtual(brain2, env, f);
  if (!token) throw new BrainError("invalid", 'O LinkedIn n\xE3o est\xE1 conectado: toque em Conectar LinkedIn na aba. Enquanto isso, copie o texto, poste no LinkedIn e use "J\xE1 postei".');
  const au = lerAutor(brain2);
  const doToken = !!lerToken(brain2);
  const autor = doToken && au.alvo === "pessoa" && au.urn ? au.urn : `urn:li:organization:${env.LINKEDIN_ORG_ID ?? ORG_PADRAO}`;
  run(brain2.db, "update li_posts set status = 'falhou', erro = 'publica\xE7\xE3o interrompida: confira a p\xE1gina antes de tentar de novo' where id = ?", id);
  try {
    const res = await f("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "x-restli-protocol-version": "2.0.0", "linkedin-version": env.LINKEDIN_VERSION ?? "202511" },
      body: JSON.stringify({ author: autor, commentary: escaparLinkedIn(p.texto), visibility: "PUBLIC", distribution: { feedDistribution: "MAIN_FEED", targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: "PUBLISHED", isReshareDisabledByAuthor: false })
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new BrainError("invalid", `LinkedIn recusou (${res.status}): ${b.message ?? "erro"}${res.status === 401 ? ". O login venceu: toque em Conectar LinkedIn de novo." : ""}`);
    }
    const urn = res.headers.get("x-restli-id") ?? "";
    const link = urn ? `https://www.linkedin.com/feed/update/${urn}/` : null;
    run(brain2.db, "update li_posts set status = 'publicado', publicado_em = ?, urn = ?, permalink = ?, erro = null where id = ?", brain2.clock(), urn || null, link, id);
    brain2.audit("sistema", "li_publicou", p.categoria, { urn });
    brain2.emit("change");
    return "Publicado no LinkedIn.";
  } catch (e) {
    const msg2 = e instanceof Error ? e.message : String(e);
    run(brain2.db, "update li_posts set status = 'falhou', erro = ? where id = ?", msg2.slice(0, 300), id);
    brain2.emit("change");
    throw e;
  }
}
async function liRotina(brain2, env, f = fetch) {
  if (brain2.policy("li_gerar", true) === false || !diaDePostar(brain2.clock())) return null;
  try {
    const r = await liGerar(brain2, env, f);
    return r ? `Post do LinkedIn pronto: ${r.categoria}.` : null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

// packages/core/src/inbound.ts
var DOMINIOS_LIVRES = /* @__PURE__ */ new Set(["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.br", "icloud.com", "uol.com.br", "bol.com.br", "live.com", "terra.com.br"]);
function enderecoDe(from) {
  const m = /<([^>]+)>/.exec(from ?? "");
  return (m?.[1] ?? from ?? "").trim().toLowerCase();
}
function textoNovo(texto2) {
  const linhas = [];
  for (const l of texto2.replace(/\r/g, "").split("\n")) {
    if (/^>/.test(l) || /^(Em .{5,80}escreveu:|On .{5,80}wrote:|-{2,}\s*(Mensagem original|Original Message)|De:\s|From:\s)/i.test(l.trim())) break;
    linhas.push(l);
  }
  return linhas.join("\n").trim();
}
var AUTO_ASSUNTO = /resposta autom[aá]tica|autom[aá]tic[ao]|out of office|fora do escrit[oó]rio|auto.?reply|undeliver|delivery status|mail delivery|n[aã]o entregue/i;
var SAIR_RE = /\b(sair|remover|remova|descadastr\w*|cancelar (o )?(envio|inscri\w+)|pare de (me )?(enviar|mandar)|n[aã]o (quero|tenho interesse|desejo)|sem interesse|n[aã]o me (envie|mande))\b/i;
function classificar(assunto, texto2, headers = {}) {
  const auto = (headers["auto-submitted"] ?? "no").toLowerCase() !== "no" || /bulk|auto_reply|junk/i.test(headers["precedence"] ?? "") || headers["x-autoreply"] || headers["x-autorespond"];
  if (auto || AUTO_ASSUNTO.test(assunto)) return "automatica";
  const novo = `${assunto}
${textoNovo(texto2).slice(0, 400)}`;
  return SAIR_RE.test(novo) ? "sair" : "resposta";
}
function acharProspect(brain2, de) {
  const exato = row(brain2.db, "select id, nome, email from prospects where lower(email) = ? order by id desc limit 1", de);
  if (exato) return exato;
  const dom = de.split("@")[1];
  if (!dom || DOMINIOS_LIVRES.has(dom)) return null;
  return rows(brain2.db, "select id, nome, email from prospects where lower(email) like ? order by id desc limit 2", `%@${dom}`).slice(0, 2).length === 1 ? row(brain2.db, "select id, nome, email from prospects where lower(email) like ? order by id desc limit 1", `%@${dom}`) : null;
}
function rascunhoResposta(nome) {
  return `Ol\xE1! Obrigado por responder.

Vamos marcar a demonstra\xE7\xE3o de 30 minutos da Synapsa para a ${nomeCurto(nome)}? Me diga o dia e o hor\xE1rio que ficam melhores para voc\xEAs que eu encaixo na minha agenda. Se preferirem ver antes, o site \xE9 ${SITE_CLINICAS}.

Abra\xE7o,
Felipe Dalpra`;
}
async function buscarCorpo(env, id, f) {
  try {
    const r = await f(`https://api.resend.com/emails/receiving/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${env.RESEND_API_KEY}` } });
    if (!r.ok) return { text: "", html: "", headers: {} };
    const j2 = await r.json();
    const h = {};
    if (Array.isArray(j2.headers)) for (const x of j2.headers) h[String(x.name).toLowerCase()] = String(x.value);
    else for (const [k, v] of Object.entries(j2.headers ?? {})) h[k.toLowerCase()] = String(v);
    const html = j2.html ?? "";
    return { text: j2.text ?? html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<br\s*\/?>|<\/p>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " "), html, headers: h };
  } catch {
    return { text: "", html: "", headers: {} };
  }
}
async function encaminhar(env, titulo2, de, corpo2, f) {
  const destino = env.RESEND_REPLY_TO;
  const from = env.RESEND_FROM_PROSPECCAO;
  if (!destino || !from || !env.RESEND_API_KEY) return false;
  try {
    const r = await f("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from, to: [destino], reply_to: de, subject: titulo2.slice(0, 200), text: corpo2.slice(0, 2e4) })
    });
    return r.ok;
  } catch {
    return false;
  }
}
async function tratarRecebido(brain2, env, d, f = fetch) {
  const id = d.email_id ?? "";
  const de = enderecoDe(d.from);
  if (!id || !de) return { tipo: "interno" };
  if (row(brain2.db, "select 1 as x from inbound_emails where email_id = ?", id)) return { tipo: "repetido" };
  const meu = [env.RESEND_FROM_PROSPECCAO, env.RESEND_FROM, env.RESEND_REPLY_TO].map(enderecoDe);
  if (meu.includes(de)) return { tipo: "interno" };
  const assunto = String(d.subject ?? "").slice(0, 200);
  const { text, headers } = await buscarCorpo(env, id, f);
  const tipo = classificar(assunto, text, headers);
  const p = acharProspect(brain2, de);
  const agora = brain2.clock();
  run(brain2.db, "insert into inbound_emails (email_id, de, assunto, tipo, prospect_id, at) values (?, ?, ?, ?, ?, ?)", id, de, assunto, tipo, p?.id ?? null, agora);
  if (tipo === "automatica") {
    brain2.audit("sistema", "resposta_automatica_ignorada", de);
    return { tipo, prospectId: p?.id };
  }
  const trecho = textoNovo(text).slice(0, 1500) || "(sem texto; abra no Resend)";
  if (tipo === "sair") {
    if (p) marcarContato(brain2, p.id, "sair");
    suppress(brain2, de, "pediu para sair (respondeu o e-mail)");
    brain2.audit("sistema", "prospeccao_sair_por_resposta", de, { prospectId: p?.id });
    await encaminhar(env, `[SAIR] ${p?.nome ?? de}: ${assunto}`, de, `${de} pediu para sair. J\xE1 bloqueei o endere\xE7o e parei a sequ\xEAncia.

${trecho}`, f);
    brain2.emit("change");
    return { tipo, prospectId: p?.id };
  }
  if (p) marcarContato(brain2, p.id, "respondeu");
  const nome = p?.nome ?? de;
  const rascunho = rascunhoResposta(nome);
  brain2.addProposal({
    agentId: "prospeccao",
    kind: "resposta_lead",
    channel: "email",
    risk: "medio",
    impactoBrl: 79,
    title: `Responder ${nomeCurto(nome)}`,
    draft: rascunho,
    why: `${nomeCurto(nome)} respondeu o e-mail de prospec\xE7\xE3o: \u201C${trecho.slice(0, 220).replace(/\s+/g, " ")}\u201D. Rascunho para marcar a demonstra\xE7\xE3o de 30 minutos. Ajuste antes de aprovar.`,
    contactRef: de,
    payload: { envio: { tipo: "email", para: de, assunto: assunto.toLowerCase().startsWith("re:") ? assunto : `Re: ${assunto || "Synapsa"}`, remetente: "prospeccao" }, prospeccao: { prospectId: p?.id ?? null, resposta: true }, base: "legitimo_interesse_b2b" },
    dedupeKey: `resp-${id}`
  });
  await encaminhar(env, `[Resposta] ${nome}: ${assunto}`, de, `${de} respondeu:

${trecho}

O rascunho de retorno j\xE1 est\xE1 em Aprova\xE7\xF5es na Central.`, f);
  brain2.audit("sistema", "prospeccao_respondeu_por_email", de, { prospectId: p?.id });
  brain2.emit("change");
  return { tipo, prospectId: p?.id };
}

// packages/core/src/webhook-resend.ts
var b64 = (s2) => Uint8Array.from(atob(s2), (c2) => c2.charCodeAt(0));
var toB64 = (u) => btoa(String.fromCharCode(...u));
async function assinaturaValida(secret, headers, raw, agoraMs) {
  const id = headers.get("svix-id");
  const ts = headers.get("svix-timestamp");
  const sig = headers.get("svix-signature");
  if (!id || !ts || !sig || !secret.startsWith("whsec_")) return false;
  if (!Number.isFinite(Number(ts)) || Math.abs(agoraMs / 1e3 - Number(ts)) > 300) return false;
  try {
    const key = await crypto.subtle.importKey("raw", b64(secret.slice(6)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const esperado = toB64(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${raw}`))));
    return sig.split(" ").some((p) => p.startsWith("v1,") && p.slice(3) === esperado);
  } catch {
    return false;
  }
}
var MOTIVO = { "email.bounced": "bounce (endere\xE7o n\xE3o entrega)", "email.complained": "marcou como spam" };
function tratarEvento(brain2, evento) {
  const motivo = evento.type ? MOTIVO[evento.type] : void 0;
  if (!motivo) return 0;
  const to = [].concat(evento.data?.to ?? []).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  for (const email of to) {
    for (const p of rows(brain2.db, "select id from prospects where lower(email) = ?", email)) marcarContato(brain2, p.id, "sair");
    suppress(brain2, email, motivo);
    brain2.audit("sistema", "resend_evento", email, { tipo: evento.type });
  }
  if (to.length) brain2.emit("change");
  return to.length;
}
async function receberWebhook(brain2, env, req) {
  const json2 = (s2, b) => new Response(JSON.stringify(b), { status: s2, headers: { "content-type": "application/json" } });
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (!secret) return json2(503, { error: "RESEND_WEBHOOK_SECRET n\xE3o configurado." });
  const raw = await req.text();
  if (raw.length > 1e5 || !await assinaturaValida(secret, req.headers, raw, brain2.clock())) return json2(401, { error: "assinatura inv\xE1lida" });
  try {
    const ev = JSON.parse(raw);
    if (ev.type === "email.received") return json2(200, { ok: true, ...await tratarRecebido(brain2, env, ev.data ?? {}) });
    return json2(200, { ok: true, tratados: tratarEvento(brain2, ev) });
  } catch {
    return json2(400, { error: "corpo inv\xE1lido" });
  }
}

// packages/core/src/prospeccao.ts
var API = "https://api.apify.com/v2";
var ATORES = { maps: "compass~crawler-google-places", site: "apify~website-content-crawler" };
var REGIOES = ["S\xE3o Paulo, SP", "Rio de Janeiro, RJ", "Belo Horizonte, MG", "Campinas, SP", "Niter\xF3i, RJ", "Santo Andr\xE9, SP", "Uberl\xE2ndia, MG", "Juiz de Fora, MG"];
var r24 = (n3) => Math.round(n3 * 100) / 100;
var mes = (now) => new Date(now - 3 * 36e5).toISOString().slice(0, 7);
function orcamento(brain2) {
  const mesUsd = Number(brain2.policy("apify_budget_usd_month", 5));
  const porRodadaUsd = Number(brain2.policy("apify_budget_usd_run", 1.5));
  const ini = Date.parse(`${mes(brain2.clock())}-01T00:00:00-03:00`);
  const g = row(brain2.db, "select sum(custo_usd) as s from prospect_runs where criado_em >= ?", ini)?.s ?? 0;
  return { mesUsd, gastoUsd: r24(g), porRodadaUsd };
}
function tetoDaRodada(brain2) {
  const o = orcamento(brain2);
  const emAndamento = row(brain2.db, "select count(*) as n from prospect_runs where status = 'rodando'")?.n ?? 0;
  const livre = o.mesUsd - o.gastoUsd - emAndamento * o.porRodadaUsd;
  if (livre <= 0.05) throw new BrainError("invalid", `Or\xE7amento do Apify do m\xEAs esgotado (US$ ${o.mesUsd}). Aumente a pol\xEDtica apify_budget_usd_month se quiser continuar.`);
  return r24(Math.min(o.porRodadaUsd, livre));
}
async function apify(env, f, path, init = {}) {
  const token = env.APIFY_TOKEN?.trim();
  if (!token) throw new BrainError("invalid", "Falta o APIFY_TOKEN nos secrets do Brain.");
  const res = await f(`${API}${path}`, { ...init, headers: { ...init.headers, authorization: `Bearer ${token}`, "content-type": "application/json" } });
  const raw = await res.json().catch(() => ({}));
  if (res.ok && Array.isArray(raw)) return raw;
  const body = raw;
  if (!res.ok) {
    const m = body.error?.message ?? "erro";
    throw new BrainError("invalid", res.status === 401 ? "O Apify recusou o token (401)." : res.status === 402 ? "Sem cr\xE9dito no Apify (402)." : `Apify respondeu ${res.status}: ${m.slice(0, 160)}`);
  }
  return body.data;
}
async function iniciar(env, f, ator, input, tetoUsd) {
  return apify(env, f, `/acts/${ator}/runs?maxTotalChargeUsd=${tetoUsd}&timeout=600`, { method: "POST", body: JSON.stringify(input) });
}
var statusDe = (env, f, id) => apify(env, f, `/actor-runs/${encodeURIComponent(id)}`);
var itens = async (env, f, ds, limit = 500) => {
  const r = await apify(env, f, `/datasets/${encodeURIComponent(ds)}/items?clean=true&limit=${limit}&format=json`);
  return Array.isArray(r) ? r : [];
};
async function iniciarDescoberta(brain2, env, d, f = fetch) {
  const regiao = (d.regiao ?? "").trim();
  if (regiao.length < 3 || regiao.length > 80) throw new BrainError("invalid", "Diga a cidade, ex.: S\xE3o Paulo, SP.");
  const busca = (d.busca ?? "").trim().slice(0, 80);
  const termos = busca ? [busca] : ["cl\xEDnica de psicologia", "centro de psicologia", "cl\xEDnica multidisciplinar psicologia"];
  const maximo = Math.min(Math.max(Math.floor(d.maximo ?? 20), 1), 60);
  const teto = tetoDaRodada(brain2);
  const r = await iniciar(env, f, ATORES.maps, { searchStringsArray: termos, locationQuery: `${regiao}, Brasil`, maxCrawledPlacesPerSearch: maximo, language: "pt-BR", skipClosedPlaces: true, scrapePlaceDetailPage: false }, teto);
  run(brain2.db, "insert into prospect_runs (tipo, apify_run_id, dataset_id, status, consulta, criado_em) values ('descoberta', ?, ?, 'rodando', ?, ?)", r.id, r.defaultDatasetId ?? null, `${termos.length > 1 ? "cl\xEDnicas de psicologia" : busca} \xB7 ${regiao}`, brain2.clock());
  brain2.audit("voce", "prospeccao_descoberta", regiao);
  brain2.emit("prospeccao");
  return `Busca iniciada: ${termos[0]} em ${regiao} (at\xE9 ${maximo} lugares, teto US$ ${teto}).`;
}
var s = (v) => typeof v === "string" && v.trim() ? v.trim() : null;
var n2 = (v) => typeof v === "number" && Number.isFinite(v) ? v : null;
var host = (u) => {
  try {
    return u ? new URL(u.startsWith("http") ? u : `https://${u}`).hostname.replace(/^www\./, "") : null;
  } catch {
    return null;
  }
};
var NAO_CLINICA = /\b(clube|caps\b|capsi|ubs\b|hospital|escola|col[eé]gio|universidade|faculdade|prefeitura|igreja|academia|cemp|detran|psic[oó]log[oa]\s+[A-ZÀ-Ú]|psiconew|consult[oó]rio\s+(de\s+)?psicologia\s+[A-ZÀ-Ú][a-zà-ú]+\s+[A-ZÀ-Ú])/i;
var ehAlvo = (nome) => !NAO_CLINICA.test(nome);
var SITE_RUIM = /(instagram|facebook|linktr\.ee|wa\.me|whatsapp|doctoralia|google|youtube|tiktok|linkedin)/i;
function ingerirDescoberta(brain2, itens_, consulta) {
  let novos = 0, repetidos = 0;
  const agora = brain2.clock();
  for (const it of itens_) {
    const placeId = s(it.placeId);
    const nome = s(it.title);
    if (!placeId || !nome) continue;
    if (row(brain2.db, "select id from prospects where place_id = ?", placeId)) {
      repetidos++;
      continue;
    }
    const site = s(it.website);
    const ig = site && /instagram\.com/i.test(site) ? site : null;
    run(
      brain2.db,
      "insert into prospects (place_id, nome, cidade, uf, endereco, telefone, site, instagram, avaliacoes, nota_google, status, consulta, criado_em, atualizado_em) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      placeId,
      nome.slice(0, 200),
      s(it.city),
      s(it.state)?.slice(0, 40) ?? null,
      s(it.address)?.slice(0, 300) ?? null,
      s(it.phone) ?? s(it.phoneUnformatted),
      site && !SITE_RUIM.test(site) ? site : null,
      ig,
      n2(it.reviewsCount),
      n2(it.totalScore),
      ehAlvo(nome) ? "novo" : "descartado",
      consulta,
      agora,
      agora
    );
    novos++;
  }
  return { novos, repetidos };
}
async function iniciarEnriquecimento(brain2, env, ids, f = fetch) {
  const alvo = rows(brain2.db, "select id, site from prospects where site is not null and status = 'novo' and crp_count is null order by id limit 40").filter((p) => !ids || ids.includes(p.id));
  if (!alvo.length) throw new BrainError("invalid", "Nenhuma cl\xEDnica nova com site para ler.");
  const teto = tetoDaRodada(brain2);
  const r = await iniciar(env, f, ATORES.site, {
    startUrls: alvo.map((p) => ({ url: p.site.startsWith("http") ? p.site : `https://${p.site}` })),
    maxCrawlDepth: 1,
    maxCrawlPages: alvo.length * 5,
    crawlerType: "cheerio",
    removeCookieWarnings: true
  }, teto);
  run(brain2.db, "insert into prospect_runs (tipo, apify_run_id, dataset_id, status, consulta, prospect_ids, criado_em) values ('enriquecimento', ?, ?, 'rodando', ?, ?, ?)", r.id, r.defaultDatasetId ?? null, `${alvo.length} sites`, JSON.stringify(alvo.map((p) => p.id)), brain2.clock());
  for (const p of alvo) run(brain2.db, "update prospects set status = 'enriquecendo' where id = ?", p.id);
  brain2.audit("voce", "prospeccao_enriquecer", String(alvo.length));
  brain2.emit("prospeccao");
  return `Lendo ${alvo.length} sites (teto US$ ${teto}).`;
}
var GENERICO = /^(contato|atendimento|recepcao|recepção|clinica|clínica|comercial|secretaria|agendamento|agenda|sac|adm|administrativo|psicologia|ola|olá|oi|faleconosco)/i;
var EMAIL_RE2 = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
var LIXO = /\.(png|jpe?g|gif|webp|svg|css|js)$|wixpress|sentry|example\.|seudominio|email\.com$|@2x/i;
function lerSinais(paginas, siteHost) {
  const texto2 = paginas.join("\n");
  const crps = new Set([...texto2.matchAll(/CRP[\s:.-]*(\d{2})\s*[\/-]\s*(\d{3,6})/gi)].map((m) => `${m[1]}/${m[2]}`));
  const emails = [...new Set((texto2.match(EMAIL_RE2) ?? []).map((e) => e.toLowerCase().replace(/[.,;)]+$/, "")).filter((e) => !LIXO.test(e)))];
  const doDominio = emails.filter((e) => siteHost && e.endsWith(`@${siteHost}`));
  const genericos = emails.filter((e) => GENERICO.test(e.split("@")[0]));
  const ordenados = [.../* @__PURE__ */ new Set([...doDominio.filter((e) => GENERICO.test(e.split("@")[0])), ...genericos, ...doDominio])];
  const ig = /instagram\.com\/([A-Za-z0-9._]{3,30})/i.exec(texto2);
  const igOk = ig && !/^(p|reel|reels|explore|accounts|stories|tv)$/i.test(ig[1]) ? `https://instagram.com/${ig[1]}` : null;
  return { crp: crps.size, emails: ordenados.slice(0, 3), instagram: igOk, whatsapp: /wa\.me|api\.whatsapp\.com|whatsapp/i.test(texto2), agenda: /agende (sua|uma)|agendamento online|agendar online|agende online/i.test(texto2) };
}
function pontuar(p) {
  const crp = p.crp ?? 0;
  let nota = crp >= 8 ? 50 : crp >= 4 ? 35 : crp >= 2 ? 15 : crp === 1 ? 5 : 0;
  if (p.email) nota += 15;
  if (p.whatsapp) nota += 10;
  if (p.instagram) nota += 5;
  if ((p.avaliacoes ?? 0) >= 100) nota += 10;
  if ((p.notaGoogle ?? 0) >= 4.5) nota += 5;
  const status = p.crp === null ? "revisar" : crp >= 4 ? "qualificado" : crp >= 2 ? "revisar" : "descartado";
  return { nota: Math.min(100, nota), status };
}
function ingerirEnriquecimento(brain2, itens_, ids) {
  const alvo = ids.map((id) => row(brain2.db, "select id, site, telefone, avaliacoes, nota_google, instagram from prospects where id = ?", id)).filter((x) => !!x);
  const porHost = /* @__PURE__ */ new Map();
  for (const it of itens_) {
    const h = host(s(it.url));
    const t = s(it.text);
    if (!h || !t) continue;
    const base = h;
    porHost.set(base, [...porHost.get(base) ?? [], t.slice(0, 6e4)]);
  }
  let lidos = 0, semSite = 0;
  const agora = brain2.clock();
  for (const p of alvo) {
    const h = host(p.site);
    const paginas = h ? porHost.get(h) ?? [] : [];
    if (!paginas.length) {
      semSite++;
      run(brain2.db, "update prospects set status = 'revisar', atualizado_em = ? where id = ?", agora, p.id);
      continue;
    }
    const sin = lerSinais(paginas, h);
    const email = sin.emails[0] ?? null;
    const instagram2 = p.instagram ?? sin.instagram;
    const pt = pontuar({ crp: sin.crp, email, whatsapp: sin.whatsapp, instagram: instagram2, avaliacoes: p.avaliacoes, notaGoogle: p.nota_google });
    run(brain2.db, "update prospects set crp_count = ?, email = ?, email_fonte = ?, instagram = ?, whatsapp_no_site = ?, agenda_online = ?, nota = ?, status = ?, atualizado_em = ? where id = ?", sin.crp, email, email ? "site" : null, instagram2, sin.whatsapp ? 1 : 0, sin.agenda ? 1 : 0, pt.nota, pt.status, agora, p.id);
    lidos++;
  }
  return { lidos, semSite };
}
async function avancar(brain2, env, f = fetch) {
  const pend = rows(brain2.db, "select id, tipo, apify_run_id, dataset_id, consulta, prospect_ids from prospect_runs where status = 'rodando'");
  let concluidas = 0;
  const ok = /* @__PURE__ */ new Set();
  for (const r of pend) {
    let info;
    try {
      info = await statusDe(env, f, r.apify_run_id);
    } catch (e) {
      run(brain2.db, "update prospect_runs set detalhe = ? where id = ?", e instanceof Error ? e.message.slice(0, 200) : "erro", r.id);
      continue;
    }
    if (["READY", "RUNNING", "ABORTING", "TIMING-OUT"].includes(info.status)) continue;
    const agora = brain2.clock();
    const custo = r24(info.usageTotalUsd ?? 0);
    if (info.status !== "SUCCEEDED") {
      run(brain2.db, "update prospect_runs set status = 'falhou', custo_usd = ?, detalhe = ?, finalizado_em = ? where id = ?", custo, `Apify: ${info.status}${info.statusMessage ? ` \xB7 ${info.statusMessage.slice(0, 120)}` : ""}`, agora, r.id);
      if (r.tipo === "enriquecimento") for (const id of JSON.parse(r.prospect_ids ?? "[]")) run(brain2.db, "update prospects set status = 'novo' where id = ? and status = 'enriquecendo'", id);
      concluidas++;
      continue;
    }
    const ds = info.defaultDatasetId ?? r.dataset_id;
    let dados = [];
    try {
      dados = ds ? await itens(env, f, ds, r.tipo === "descoberta" ? 200 : 600) : [];
    } catch (e) {
      const tent = (Number(/tentativa (\d+)/.exec(String(row(brain2.db, "select detalhe from prospect_runs where id = ?", r.id)?.detalhe ?? ""))?.[1]) || 0) + 1;
      if (tent < 4) {
        run(brain2.db, "update prospect_runs set detalhe = ? where id = ?", `tentativa ${tent}: ${e instanceof Error ? e.message.slice(0, 120) : "erro ao ler resultados"}`, r.id);
        continue;
      }
      run(brain2.db, "update prospect_runs set status = 'falhou', custo_usd = ?, detalhe = ?, finalizado_em = ? where id = ?", custo, `N\xE3o consegui ler os resultados: ${e instanceof Error ? e.message.slice(0, 120) : "erro"}`, agora, r.id);
      if (r.tipo === "enriquecimento") for (const id of JSON.parse(r.prospect_ids ?? "[]")) run(brain2.db, "update prospects set status = 'novo' where id = ? and status = 'enriquecendo'", id);
      concluidas++;
      continue;
    }
    const detalhe = r.tipo === "descoberta" ? (() => {
      const x = ingerirDescoberta(brain2, dados, r.consulta ?? "");
      return `${x.novos} novas, ${x.repetidos} j\xE1 conhecidas`;
    })() : (() => {
      const x = ingerirEnriquecimento(brain2, dados, JSON.parse(r.prospect_ids ?? "[]"));
      return `${x.lidos} sites lidos, ${x.semSite} sem conte\xFAdo`;
    })();
    run(brain2.db, "update prospect_runs set status = 'pronto', custo_usd = ?, detalhe = ?, finalizado_em = ? where id = ?", custo, detalhe, agora, r.id);
    ok.add(r.tipo);
    concluidas++;
  }
  if (concluidas) await autoCrm(brain2, env, f);
  if (rotinaConfig(brain2).ativo) {
    if (ok.has("descoberta")) await iniciarEnriquecimento(brain2, env, null, f).catch(() => void 0);
    if (ok.has("enriquecimento")) {
      try {
        gerarRascunhos(brain2);
      } catch {
      }
    }
  }
  if (concluidas) brain2.emit("change");
  return { pendentes: pend.length - concluidas, concluidas };
}
var autoConfig = (brain2) => {
  const c2 = brain2.policy("prospect_auto_crm", {});
  return { ativo: c2.ativo === true, notaMin: Math.min(100, Math.max(0, Number(c2.notaMin ?? 60))), limiteDia: Math.min(40, Math.max(1, Math.floor(Number(c2.limiteDia ?? 10)))) };
};
function autoSet(brain2, c2) {
  const novo = { ...autoConfig(brain2), ...c2.ativo !== void 0 ? { ativo: c2.ativo === true } : {}, ...c2.notaMin !== void 0 ? { notaMin: Number(c2.notaMin) } : {}, ...c2.limiteDia !== void 0 ? { limiteDia: Number(c2.limiteDia) } : {} };
  brain2.setPolicy("prospect_auto_crm", novo);
  brain2.audit("voce", novo.ativo ? "prospeccao_auto_on" : "prospeccao_auto_off", void 0, novo);
  return autoConfig(brain2);
}
var hojeIni = (now) => Date.parse(`${new Date(now - 3 * 36e5).toISOString().slice(0, 10)}T00:00:00-03:00`);
var enviadasHoje = (brain2) => row(brain2.db, "select count(*) as n from audit_log where action = 'prospeccao_crm_auto' and at >= ?", hojeIni(brain2.clock()))?.n ?? 0;
async function autoCrm(brain2, env, f = fetch) {
  const c2 = autoConfig(brain2);
  if (!c2.ativo) return { criados: 0 };
  const sobra = c2.limiteDia - enviadasHoje(brain2);
  if (sobra <= 0) return { criados: 0 };
  const ids = rows(brain2.db, "select id from prospects where status = 'qualificado' and nota >= ? and telefone is not null order by nota desc, id limit ?", c2.notaMin, sobra).map((x) => x.id);
  if (!ids.length) return { criados: 0 };
  try {
    const r = await enviarAoCrm(brain2, env, ids, f);
    if (r.criados > 0) brain2.audit("sistema", "prospeccao_crm_auto", void 0, r);
    for (let i = 1; i < r.criados; i++) brain2.audit("sistema", "prospeccao_crm_auto");
    return { criados: r.criados };
  } catch (e) {
    brain2.audit("sistema", "prospeccao_crm_auto_erro", void 0, e instanceof Error ? e.message.slice(0, 160) : "erro");
    return { criados: 0 };
  }
}
var rotinaConfig = (brain2) => {
  const c2 = brain2.policy("prospect_rotina", {});
  return { ativo: c2.ativo === true, maximo: Math.min(60, Math.max(5, Math.floor(Number(c2.maximo ?? 20)))), indice: Math.max(0, Math.floor(Number(c2.indice ?? 0))), ultimaData: typeof c2.ultimaData === "string" ? c2.ultimaData : null };
};
function rotinaSet(brain2, c2) {
  const novo = { ...rotinaConfig(brain2), ...c2.ativo !== void 0 ? { ativo: c2.ativo === true } : {}, ...c2.maximo !== void 0 ? { maximo: Number(c2.maximo) } : {} };
  brain2.setPolicy("prospect_rotina", novo);
  brain2.audit("voce", novo.ativo ? "prospeccao_rotina_on" : "prospeccao_rotina_off", void 0, novo);
  return rotinaConfig(brain2);
}
var proximaCidade = (brain2) => REGIOES[rotinaConfig(brain2).indice % REGIOES.length];
async function rodarRotina(brain2, env, f = fetch, opts = {}) {
  const c2 = rotinaConfig(brain2);
  if (!c2.ativo && !opts.forcar) return "Rotina desligada.";
  const hoje = new Date(brain2.clock() - 3 * 36e5).toISOString().slice(0, 10);
  if (!opts.forcar && c2.ultimaData === hoje) return "J\xE1 rodou hoje.";
  if (row(brain2.db, "select count(*) as n from prospect_runs where status = 'rodando'")?.n) return "J\xE1 existe uma rodada em andamento.";
  const cidade = REGIOES[c2.indice % REGIOES.length];
  brain2.setPolicy("prospect_rotina", { ...c2, indice: (c2.indice + 1) % REGIOES.length, ultimaData: hoje });
  try {
    const m = await iniciarDescoberta(brain2, env, { regiao: cidade, maximo: c2.maximo }, f);
    brain2.audit("sistema", "prospeccao_rotina", cidade);
    return m;
  } catch (e) {
    brain2.audit("sistema", "prospeccao_rotina_erro", cidade, e instanceof Error ? e.message.slice(0, 160) : "erro");
    return e instanceof Error ? e.message : "N\xE3o consegui iniciar a busca.";
  }
}
var digitos = (t) => (t ?? "").replace(/\D/g, "");
var emBR = (t) => {
  const d = digitos(t);
  return d.startsWith("55") && d.length >= 12 ? d.slice(2) : d;
};
async function enviarAoCrm(brain2, env, ids, f = fetch) {
  const crm = crmClient(env, f);
  if (!crm) throw new BrainError("invalid", "O CRM n\xE3o est\xE1 conectado.");
  if (!ids.length || ids.length > 40) throw new BrainError("invalid", "Escolha de 1 a 40 cl\xEDnicas por vez.");
  const existentes = /* @__PURE__ */ new Set();
  try {
    const todos = await crm.all("/leads", {}, 10);
    for (const l of todos.data) {
      const t = emBR(typeof l.phone === "string" ? l.phone : null);
      if (t.length >= 8) existentes.add(t.slice(-9));
    }
  } catch (e) {
    throw new BrainError("invalid", e instanceof CrmError ? e.message : "N\xE3o consegui conferir o CRM antes de criar. Nada foi criado.");
  }
  let criados = 0, jaNoCrm = 0, semTelefone = 0;
  for (const id of ids) {
    const p = row(brain2.db, "select id, nome, telefone, email, instagram, site, crp_count, cidade, uf, status from prospects where id = ?", id);
    if (!p || p.status === "no_crm") continue;
    const tel = emBR(p.telefone);
    if (tel.length < 8) {
      semTelefone++;
      continue;
    }
    if (existentes.has(tel.slice(-9))) {
      jaNoCrm++;
      run(brain2.db, "update prospects set status = 'no_crm', atualizado_em = ? where id = ?", brain2.clock(), p.id);
      continue;
    }
    const lead = {
      name: p.nome.slice(0, 200),
      lead_type: "clinica",
      phone: p.telefone.slice(0, 30),
      origin: "outbound",
      classification: "frio",
      ...p.email ? { email: p.email } : {},
      ...p.instagram ? { instagram: p.instagram } : {},
      ...p.crp_count ? { professionals_count: p.crp_count } : {},
      observations: `Prospec\xE7\xE3o autom\xE1tica (Maps + site).${p.site ? ` Site: ${p.site}.` : ""}${p.crp_count ? ` ${p.crp_count} psic\xF3logos com CRP no site.` : ""}`
    };
    try {
      const r = await crm.createLead(lead, { idempotencyKey: `mega-brain-prospect-${p.id}` });
      const novoId = r.data.id ?? null;
      run(brain2.db, "update prospects set status = 'no_crm', crm_lead_id = ?, atualizado_em = ? where id = ?", novoId, brain2.clock(), p.id);
      criados++;
    } catch (e) {
      throw new BrainError("invalid", `${e instanceof CrmError ? e.message : "Falha ao criar no CRM"} (${criados} criados antes do erro).`);
    }
  }
  brain2.audit("voce", "prospeccao_crm", void 0, { criados, jaNoCrm, semTelefone });
  brain2.emit("change");
  return { criados, jaNoCrm, semTelefone };
}
function descartar(brain2, id, descartar_) {
  if (!row(brain2.db, "select id from prospects where id = ?", id)) throw new BrainError("not_found", "Cl\xEDnica n\xE3o encontrada.");
  run(brain2.db, "update prospects set status = ?, atualizado_em = ? where id = ? and status != 'no_crm'", descartar_ ? "descartado" : "revisar", brain2.clock(), id);
}
function prospeccaoPainel(brain2, env) {
  const db = brain2.db;
  for (const x of rows(db, "select id, nome from prospects where status = 'novo'")) if (!ehAlvo(x.nome)) run(db, "update prospects set status = 'descartado' where id = ?", x.id);
  const ps = rows(db, "select * from prospects order by nota desc, id desc limit 400");
  const contagem = { novo: 0, enriquecendo: 0, qualificado: 0, revisar: 0, descartado: 0, no_crm: 0 };
  for (const p of ps) contagem[p.status]++;
  const etapas = /* @__PURE__ */ new Map();
  for (const r of rows(db, "select pr.dedupe_key as k from proposals pr join envios e on e.proposal_id = pr.id where e.status = 'enviado' and pr.dedupe_key like 'prosp-%'")) {
    const m = /^prosp-(\d+)-e(\d)$/.exec(r.k);
    if (m) etapas.set(Number(m[1]), Math.max(etapas.get(Number(m[1])) ?? -1, Number(m[2])));
  }
  const resp = new Set(rows(db, "select prospect_id from prospect_contato where respondeu = 1 or sair = 1").map((x) => x.prospect_id));
  const rs = rows(db, "select id, tipo, status, consulta, custo_usd, detalhe, criado_em from prospect_runs order by id desc limit 10");
  return {
    configurado: !!env.APIFY_TOKEN?.trim(),
    orcamento: orcamento(brain2),
    contagem,
    prospects: ps.map((p) => ({
      id: p.id,
      nome: p.nome,
      cidade: p.cidade ?? null,
      uf: p.uf ?? null,
      telefone: p.telefone ?? null,
      site: p.site ?? null,
      instagram: p.instagram ?? null,
      email: p.email ?? null,
      equipe: p.crp_count === null || p.crp_count === void 0 ? null : p.crp_count,
      whatsappNoSite: p.whatsapp_no_site === null || p.whatsapp_no_site === void 0 ? null : p.whatsapp_no_site === 1,
      agendaOnline: p.agenda_online === null || p.agenda_online === void 0 ? null : p.agenda_online === 1,
      avaliacoes: p.avaliacoes ?? null,
      nota: p.nota,
      status: p.status,
      noCrm: p.status === "no_crm",
      emailEtapa: etapas.get(p.id) ?? null,
      respondeu: resp.has(p.id)
    })),
    rodadas: rs.map((r) => ({ id: r.id, tipo: r.tipo, status: r.status, consulta: r.consulta, custoUsd: r.custo_usd, detalhe: r.detalhe, criadoEm: r.criado_em })),
    regioes: REGIOES,
    atores: ATORES,
    auto: { ...autoConfig(brain2), hoje: enviadasHoje(brain2) },
    rotina: { ativo: rotinaConfig(brain2).ativo, maximo: rotinaConfig(brain2).maximo, proxima: proximaCidade(brain2), ultimaData: rotinaConfig(brain2).ultimaData },
    emails: { pendentes: rascunhosPendentes(brain2), ...emailsResumo(brain2), remetenteOk: !!env.RESEND_API_KEY && !!env.RESEND_FROM_PROSPECCAO },
    whatsapp: painelWhatsapp(brain2)
  };
}

// packages/core/src/fin-stripe.ts
async function fetchFaturasPagas(key, f = fetch) {
  const out = [];
  let after;
  for (let page = 0; page < 30; page++) {
    const qs = new URLSearchParams({ status: "paid", limit: "100" });
    if (after) qs.set("starting_after", after);
    const res = await f(`https://api.stripe.com/v1/invoices?${qs}`, { headers: { authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`stripe invoices: ${res.status}${res.status === 403 || res.status === 401 ? " (a chave de leitura precisa da permiss\xE3o Invoices: leitura)" : ""}`);
    const body = await res.json();
    out.push(...body.data);
    if (!body.has_more || body.data.length === 0) break;
    after = body.data[body.data.length - 1].id;
  }
  return out;
}
async function sincronizarFaturasStripe(brain2, env, f = fetch) {
  if (!env.STRIPE_READ_KEY) return { ok: false, faturas: 0, erro: "Sem STRIPE_READ_KEY." };
  try {
    const inv = (await fetchFaturasPagas(env.STRIPE_READ_KEY, f)).filter((i) => i.currency.toLowerCase() === "brl" && i.amount_paid > 0);
    const agora = brain2.clock();
    tx(brain2.db, () => {
      for (const i of inv) {
        const quando = (i.status_transitions?.paid_at ?? i.created) * 1e3;
        run(
          brain2.db,
          `insert into fin_stripe_fatura (id, cliente_id, nome, data, valor, atualizado_em) values (?, ?, ?, ?, ?, ?)
          on conflict(id) do update set cliente_id = excluded.cliente_id, nome = excluded.nome, data = excluded.data, valor = excluded.valor, atualizado_em = excluded.atualizado_em`,
          i.id,
          i.customer,
          i.customer_name || i.customer_email || i.customer || "Cliente Stripe",
          brtDay(quando),
          i.amount_paid / 100,
          agora
        );
      }
    });
    return { ok: true, faturas: inv.length };
  } catch (e) {
    return { ok: false, faturas: 0, erro: e instanceof Error ? e.message : String(e) };
  }
}
var faturasStripe = (db) => rows(db, "select id, cliente_id, nome, data, valor from fin_stripe_fatura order by data, id");

// packages/core/src/guardiao.ts
var AGENT_ID = "guardiao-de-dados";
async function fetchStripeSubs(key) {
  const out = [];
  let after;
  for (let page = 0; page < 50; page++) {
    const qs = new URLSearchParams({ status: "all", limit: "100" });
    qs.append("expand[]", "data.discounts");
    qs.append("expand[]", "data.discount");
    qs.append("expand[]", "data.discounts.source.coupon");
    qs.append("expand[]", "data.discount.source.coupon");
    if (after) qs.set("starting_after", after);
    const res = await fetch(`https://api.stripe.com/v1/subscriptions?${qs}`, { headers: { authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`stripe subscriptions: ${res.status}`);
    const body = await res.json();
    for (const s2 of body.data) {
      const discounts = s2.discounts && s2.discounts.length > 0 ? s2.discounts : s2.discount ? [s2.discount] : [];
      out.push({ ...s2, discounts });
    }
    if (!body.has_more || body.data.length === 0) break;
    after = body.data[body.data.length - 1].id;
  }
  return out;
}
function planGuardiao(i) {
  const { stripeRows, others, all, now, windowDays, day } = i;
  const proposals = [];
  const alerts = [];
  const platformRows = others.filter((r) => r.source === "platform");
  if (platformRows.length > 0) {
    for (const d of reconcile(stripeRows, platformRows)) {
      const diff = Math.abs((d.stripe_brl ?? 0) - (d.platform_brl ?? 0));
      alerts.push({ kind: "divergencia_receita", severity: "atencao", ref: d.external_id, payload: { ...d }, dedupe_key: `div:${d.external_id}:${day}` });
      proposals.push({
        agent_id: AGENT_ID,
        kind: "divergencia_receita",
        title: `Conferir assinatura ${d.external_id}: Stripe e plataforma n\xE3o batem`,
        payload: { ...d },
        impacto_brl: diff,
        risk: "baixo",
        channel: "interno",
        dedupe_key: `div:${d.external_id}:${day}`
      });
    }
  }
  for (const e of endingDiscounts(all, now, windowDays)) {
    const endDay = e.row.discount_ends_at.slice(0, 10);
    const key = `fim_desconto:${e.row.source}:${e.row.external_id}:${endDay}`;
    alerts.push({ kind: "fim_desconto", severity: "info", ref: e.row.external_id, payload: { termina_em: endDay, dias: e.days_left }, dedupe_key: key });
    proposals.push({
      agent_id: AGENT_ID,
      kind: "retencao_fim_desconto",
      title: `Desconto termina em ${e.days_left} dias (${endDay}): falar com o cliente antes do reajuste`,
      payload: {
        fonte: e.row.source,
        assinatura: e.row.external_id,
        preco_atual_brl: e.row.effective_price_brl,
        preco_cheio_brl: e.row.list_price_brl,
        regra: "nao oferecer desconto"
      },
      impacto_brl: Math.round(e.row.list_price_brl * 12 * 100) / 100,
      risk: "medio",
      channel: "tarefa",
      dedupe_key: key
    });
  }
  return { proposals, alerts };
}

// packages/core/src/handlers.ts
var brl3 = (n3) => n3.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n3 % 1 ? 2 : 0 }).replace(/ /g, " ");
var allSubs = (brain2) => rows(brain2.db, "select source, external_id, professional_id, label, list_price_brl, effective_price_brl, discount_ends_at, status from subscriptions");
async function sincronizarAssinaturasStripe(brain2, env, now) {
  const synced = (await fetchStripeSubs(env.STRIPE_READ_KEY)).map(stripeToRow);
  tx(brain2.db, () => {
    run(brain2.db, "delete from subscriptions where source = 'stripe' and origin = 'informado'");
    for (const r of synced) {
      run(
        brain2.db,
        `insert into subscriptions (source, external_id, professional_id, label, list_price_brl, effective_price_brl, discount_ends_at, status, origin, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, ?, 'sincronizado', ?)
        on conflict(source, external_id) do update set list_price_brl = excluded.list_price_brl, effective_price_brl = excluded.effective_price_brl, discount_ends_at = excluded.discount_ends_at, status = excluded.status, origin = 'sincronizado', updated_at = excluded.updated_at`,
        r.source,
        r.external_id,
        r.professional_id,
        r.label,
        r.list_price_brl,
        r.effective_price_brl,
        r.discount_ends_at,
        r.status,
        now
      );
    }
  });
  run(brain2.db, "update proposals set status = 'rejeitada', decided_at = ?, review_note = 'substitu\xEDda pela leitura real do Stripe' where status = 'pendente' and dedupe_key like 'fim_desconto:stripe:informado-%'", now);
  const fat = await sincronizarFaturasStripe(brain2, env);
  return { n: synced.length, note: ` Stripe sincronizado: ${synced.length} assinaturas${fat.ok ? `, ${fat.faturas} faturas pagas` : ` (faturas: ${fat.erro})`}.` };
}
async function guardiao({ brain: brain2, env, now }) {
  let note = "";
  const day = brtDay(now);
  if (env.STRIPE_READ_KEY) {
    note = (await sincronizarAssinaturasStripe(brain2, env, now)).note;
  } else {
    note = " Sem STRIPE_READ_KEY: usei os valores que voc\xEA informou.";
  }
  const all = allSubs(brain2);
  const { bySource, total } = mrrBySource(all);
  for (const [source, v] of Object.entries({ ...bySource, total: { mrr: total, count: Object.values(bySource).reduce((n3, x) => n3 + x.count, 0) } })) {
    run(brain2.db, "insert into mrr_daily (day, source, mrr_brl, subs_count) values (?, ?, ?, ?) on conflict(day, source) do update set mrr_brl = excluded.mrr_brl, subs_count = excluded.subs_count", day, source, v.mrr, v.count);
  }
  const plan = planGuardiao({ stripeRows: all.filter((r) => r.source === "stripe"), others: all.filter((r) => r.source !== "stripe"), all, now: new Date(now), windowDays: 30, day });
  const proposals = plan.proposals.map((p) => ({
    agentId: "guardiao",
    kind: p.kind,
    title: p.title,
    why: p.kind === "retencao_fim_desconto" ? `O desconto acaba e o plano volta ao pre\xE7o cheio. Fale com a pessoa antes. Regra: nenhum agente oferece desconto, voc\xEA decide o que dizer.` : `Stripe e plataforma registram valores diferentes para a mesma assinatura. Confira antes de fechar o MRR.`,
    impactoBrl: p.impacto_brl,
    risk: p.risk,
    channel: p.channel,
    payload: p.payload,
    dedupeKey: p.dedupe_key
  }));
  return { status: "done", result: `MRR fechado em ${brl3(total)}.${note}`, proposals };
}
async function financeiro({ brain: brain2 }) {
  const m = brain2.metrics();
  const falta = Math.max(0, m.mrr.goal - m.mrr.total);
  const pct = Math.round(m.mrr.total / m.mrr.goal * 100);
  const d = m.descontos.map((x) => `${x.contas} em ${x.quando}`).join(", ");
  return { status: "done", result: `MRR de ${brl3(m.mrr.total)}, ${pct}% de ${brl3(m.mrr.goal)}. Faltam ${brl3(falta)}, cerca de ${Math.ceil(falta / m.mrr.essencialPrice)} Essenciais a ${brl3(m.mrr.essencialPrice)}.${d ? ` Reajustes \xE0 vista: ${d}.` : ""}` };
}
async function midia({ brain: brain2, env, now }) {
  const token = env.META_SYSTEM_USER_TOKEN;
  const acct = env.META_AD_ACCOUNT_ID;
  if (!token || !acct) return { status: "blocked", result: "Falta META_SYSTEM_USER_TOKEN ou META_AD_ACCOUNT_ID nos secrets do Brain para ler os an\xFAncios." };
  const m = await syncMeta(brain2, env, now, 7);
  if (m.adsErro && (m.igErro || !env.META_IG_ID)) throw new Error(m.adsErro);
  const ads = m.ads ?? [];
  const ig = m.ig ? ` Instagram: ${m.ig.followers ?? "?"} seguidores.` : m.igErro ? ` Instagram falhou: ${m.igErro}.` : "";
  const adsNote = m.adsErro ? ` An\xFAncios falharam: ${m.adsErro}.` : "";
  const spend = ads.reduce((n3, r) => n3 + r.spend, 0);
  const leads = ads.reduce((n3, r) => n3 + r.leads, 0);
  const day = brtDay(now);
  const proposals = wastedSpend(ads, 50).map((c2) => ({
    agentId: "midia",
    kind: "revisar_campanha",
    title: `Revisar campanha "${c2.campaign_name}": ${brl3(c2.spend)} sem lead em 7 dias`,
    why: `Gastou ${brl3(c2.spend)}, teve ${c2.clicks} cliques e nenhum lead. O Brain nunca pausa sozinho: voc\xEA decide pausar, trocar o criativo ou manter.`,
    impactoBrl: c2.spend,
    risk: "baixo",
    channel: "interno",
    payload: { ...c2 },
    dedupeKey: `campanha_sem_lead:${c2.campaign_id}:${day}`
  }));
  return { status: "done", result: m.adsErro ? `${adsNote.trim()}${ig}` : `Leu os an\xFAncios dos \xFAltimos 7 dias: ${brl3(spend)} gastos e ${leads} leads.${ig}`, proposals };
}
async function chief({ brain: brain2 }) {
  const snap = brain2.snapshot([]);
  const pend = snap.proposals.filter((p) => p.status === "pendente");
  const top = pend.slice(0, 3).map((p) => `${p.title} (${brl3(p.impactoBrl)})`);
  const m = snap.metrics;
  const soon = m.descontos.length ? ` Pr\xF3ximo reajuste: ${m.descontos[0].quando}.` : "";
  const blocked = row(brain2.db, "select count(*) as n from agent_runs where status = 'blocked' and created_at >= ?", now0(brain2))?.n ?? 0;
  return {
    status: "done",
    result: pend.length === 0 ? `Briefing: fila vazia. MRR em ${brl3(m.mrr.total)}.${soon}` : `Briefing: ${pend.length} propostas esperando voc\xEA${snap.overflow ? ` (+${snap.overflow} fora do teto)` : ""}. Primeiras: ${top.join("; ")}. MRR em ${brl3(m.mrr.total)}.${soon}${blocked ? ` ${blocked} tarefas travadas por falta de integra\xE7\xE3o.` : ""}`
  };
}
var now0 = (brain2) => Date.parse(`${brtDay(brain2.clock())}T00:00:00-03:00`);
var HANDLERS = { guardiao, financeiro, midia, chief };

// packages/core/src/fin-proj.ts
var r25 = (n3) => Math.round(n3 * 100) / 100;
var HORIZONTE_MESES = 36;
function mesMais(ref, n3) {
  const [y, m] = ref.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n3, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
var CENARIOS = [
  { id: "conservador", label: "Conservador", novos: 0.5, churn: 1.5 },
  { id: "base", label: "Base", novos: 1, churn: 1 },
  { id: "otimista", label: "Otimista", novos: 1.5, churn: 0.5 }
];
function projetar(mrrAtual, saldoInicial, mesRef, p, meta) {
  const custo = p.custoMensal ?? p.custoMensalAuto;
  const meses = Array.from({ length: HORIZONTE_MESES }, (_, i) => mesMais(mesRef, i + 1));
  const cenarios = CENARIOS.map((c2) => {
    const novos = p.novosPorMes * c2.novos;
    const churn = Math.min(0.99, p.churn * c2.churn);
    let mrr = mrrAtual;
    let saldo = saldoInicial;
    const out = { id: c2.id, label: c2.label, novosPorMes: r25(novos), churn, mrr: [], entradas: [], saidas: [], saldo: [], mesDaMeta: null };
    meses.forEach((mes2, i) => {
      mrr = mrr - mrr * churn + novos * p.precoNovo;
      const entradas = mrr;
      const saidas = custo + mrr * p.aliquotaImpostos;
      saldo += entradas - saidas;
      out.mrr.push(r25(mrr));
      out.entradas.push(r25(entradas));
      out.saidas.push(r25(saidas));
      out.saldo.push(r25(saldo));
      if (out.mesDaMeta === null && mrr >= meta) out.mesDaMeta = meses[i];
    });
    return out;
  });
  return { meses, saldoInicial: r25(saldoInicial), cenarios };
}
function diaMenos(hoje, n3) {
  return new Date(Date.parse(`${hoje}T12:00:00Z`) - n3 * 864e5).toISOString().slice(0, 10);
}
function indicadores(i) {
  const notas = [];
  const ticket = i.clientes ? r25(i.mrr / i.clientes) : null;
  const alvo = diaMenos(i.hoje, 30);
  const base = [...i.mrrSerie].reverse().find((p) => p.day <= alvo);
  let cresc = null;
  if (base && base.total > 0) cresc = Math.round((i.mrr - base.total) / base.total * 1e3) / 10;
  else notas.push("Crescimento de 30 dias aparece quando o hist\xF3rico de MRR tiver 30 dias.");
  const margem = i.entradasMes > 0 ? Math.round(i.resultadoMes / i.entradasMes * 1e3) / 10 : null;
  const ltv = ticket !== null && i.churn > 0 ? r25(ticket / i.churn) : null;
  let cac = null;
  if (i.gastoMarketing3m > 0 && i.clientesNovos3m && i.clientesNovos3m > 0) cac = r25(i.gastoMarketing3m / i.clientesNovos3m);
  else notas.push("CAC precisa de gasto em Marketing e Vendas pago e de clientes novos contados no per\xEDodo.");
  const ltvCac = ltv !== null && cac ? Math.round(ltv / cac * 10) / 10 : null;
  const payback = cac !== null && ticket ? Math.round(cac / ticket * 10) / 10 : null;
  notas.push(`LTV usa o churn de ${Math.round(i.churn * 1e3) / 10}% ao m\xEAs das premissas, n\xE3o um churn medido.`);
  return {
    mrr: r25(i.mrr),
    arr: r25(i.mrr * 12),
    clientesAtivos: i.clientes,
    ticketMedio: ticket,
    crescimentoMrr30dPct: cresc,
    margemMesPct: margem,
    cac,
    ltv,
    ltvCac,
    paybackMeses: payback,
    mrrSerie: i.mrrSerie,
    metaMrr: { valor: i.meta.valor, data: i.meta.data, falta: r25(Math.max(0, i.meta.valor - i.mrr)) },
    notas
  };
}

// packages/core/src/fin.ts
var CATEGORIAS_RECEITA = ["Recorr\xEAncia (Mensalidade)", "Implementa\xE7\xE3o/Setup", "Outras Receitas"];
var CATEGORIAS_DESPESA = ["Custos Diretos (CMV)", "Pessoal", "Marketing e Vendas", "Tecnologia/Ferramentas", "Administrativas", "Financeiras", "Impostos e Taxas", "Outras Despesas"];
var r26 = (n3) => Math.round(n3 * 100) / 100;
var DATA2 = /^\d{4}-\d{2}-\d{2}$/;
var DIA2 = 864e5;
function categoria(c2, entrada) {
  const t = (c2 ?? "").trim();
  if (entrada) return CATEGORIAS_RECEITA.find((x) => x.toLowerCase() === t.toLowerCase()) ?? "Outras Receitas";
  if (t.toLowerCase() === "impostos") return "Impostos e Taxas";
  return CATEGORIAS_DESPESA.find((x) => x.toLowerCase() === t.toLowerCase()) ?? "Outras Despesas";
}
var diaMs = (d) => Date.parse(`${d}T12:00:00-03:00`);
var mesDe = (d) => d.slice(0, 7);
function somaMeses(d, n3) {
  const [y, m, dia5] = d.split("-").map(Number);
  const alvo = new Date(Date.UTC(y, m - 1 + n3, 1));
  const ult = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  return `${alvo.getUTCFullYear()}-${String(alvo.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(dia5, ult)).padStart(2, "0")}`;
}
var nomeMes = (ref) => {
  const [y, m] = ref.split("-");
  return `${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][Number(m) - 1]}/${y.slice(2)}`;
};
var PREMISSAS_PADRAO2 = { novos_por_mes: 2, preco_novo: 49, churn: 0.05 };
function cfgNum(db, chave2) {
  const a = row(db, "select valor from fin_config where chave = ?", chave2);
  if (!a || a.valor === "") return null;
  const n3 = Number(a.valor);
  return Number.isFinite(n3) ? n3 : null;
}
function finConfig(db) {
  const n3 = cfgNum(db, "aliquota_impostos") ?? 0.16;
  return { aliquotaImpostos: n3 >= 0 && n3 < 1 ? n3 : 0.16 };
}
function finSetAliquota(db, aliquota) {
  if (!(aliquota >= 0 && aliquota < 1)) throw new BrainError("invalid", "A al\xEDquota \xE9 um n\xFAmero entre 0 e 1 (ex.: 0,16 para 16%).");
  run(db, "insert into fin_config (chave, valor) values ('aliquota_impostos', ?) on conflict(chave) do update set valor = excluded.valor", String(aliquota));
}
function finPremissas(db, custoMensalAuto) {
  const novos = cfgNum(db, "novos_por_mes");
  const preco = cfgNum(db, "preco_novo");
  const churn = cfgNum(db, "churn");
  return {
    novosPorMes: novos !== null && novos >= 0 ? novos : PREMISSAS_PADRAO2.novos_por_mes,
    precoNovo: preco !== null && preco > 0 ? preco : PREMISSAS_PADRAO2.preco_novo,
    churn: churn !== null && churn >= 0 && churn < 1 ? churn : PREMISSAS_PADRAO2.churn,
    custoMensal: cfgNum(db, "custo_mensal"),
    custoMensalAuto,
    aliquotaImpostos: finConfig(db).aliquotaImpostos
  };
}
function finSetPremissas(db, p) {
  const put = (k, v) => run(db, "insert into fin_config (chave, valor) values (?, ?) on conflict(chave) do update set valor = excluded.valor", k, v);
  if (p.novosPorMes !== void 0) {
    if (!(p.novosPorMes >= 0 && p.novosPorMes <= 200)) throw new BrainError("invalid", "Novos clientes por m\xEAs: n\xFAmero entre 0 e 200.");
    put("novos_por_mes", String(p.novosPorMes));
  }
  if (p.precoNovo !== void 0) {
    if (!(p.precoNovo > 0 && p.precoNovo <= 1e4)) throw new BrainError("invalid", "Pre\xE7o do plano: valor positivo.");
    put("preco_novo", String(p.precoNovo));
  }
  if (p.churn !== void 0) {
    if (!(p.churn >= 0 && p.churn < 1)) throw new BrainError("invalid", "Churn mensal: n\xFAmero entre 0 e 1 (ex.: 0,05 para 5%).");
    put("churn", String(p.churn));
  }
  if (p.custoMensal !== void 0) {
    if (p.custoMensal !== null && !(p.custoMensal >= 0 && p.custoMensal <= 1e7)) throw new BrainError("invalid", "Custo mensal: valor positivo, ou vazio para usar a m\xE9dia real.");
    put("custo_mensal", p.custoMensal === null ? "" : String(p.custoMensal));
  }
  if (p.aliquotaImpostos !== void 0) finSetAliquota(db, p.aliquotaImpostos);
}
function finCobrancas(db) {
  return rows(db, "select id, nome, valor, dia, forma, ativa from fin_cobrancas order by nome, id").map((c2) => ({ ...c2, ativa: c2.ativa === 1 }));
}
function finAddCobranca(db, agora, c2) {
  const nome = (c2.nome ?? "").trim();
  if (!nome || nome.length > 120) throw new BrainError("invalid", "D\xEA um nome para a cobran\xE7a (at\xE9 120 caracteres).");
  if (!(c2.valor > 0 && c2.valor <= 1e6)) throw new BrainError("invalid", "O valor da cobran\xE7a \xE9 positivo.");
  if (!Number.isInteger(c2.dia) || c2.dia < 1 || c2.dia > 31) throw new BrainError("invalid", "O dia da cobran\xE7a vai de 1 a 31 (em m\xEAs curto vale o \xFAltimo dia).");
  run(db, "insert into fin_cobrancas (nome, valor, dia, forma, ativa, criado_em) values (?, ?, ?, ?, 1, ?)", nome, r26(c2.valor), c2.dia, (c2.forma ?? "pix").slice(0, 20), agora);
}
function finSetCobranca(db, id, ativa) {
  if (!row(db, "select id from fin_cobrancas where id = ?", id)) throw new BrainError("not_found", "Cobran\xE7a n\xE3o encontrada.");
  run(db, "update fin_cobrancas set ativa = ? where id = ?", ativa ? 1 : 0, id);
}
function finRemoverCobranca(db, id) {
  if (!row(db, "select id from fin_cobrancas where id = ?", id)) throw new BrainError("not_found", "Cobran\xE7a n\xE3o encontrada.");
  tx(db, () => {
    run(db, "delete from fin_contas where grupo = ? and pago_em is null", `cob:${id}`);
    run(db, "delete from fin_cobrancas where id = ?", id);
  });
}
function gerarCobrancas(db, agora) {
  const hoje = brtDay(agora);
  let n3 = 0;
  for (const c2 of finCobrancas(db).filter((x) => x.ativa)) {
    for (let k = 0; k < 3; k++) {
      const venc = somaMeses(`${mesDe(hoje)}-${String(c2.dia).padStart(2, "0")}`, k);
      const jaTem = row(db, "select id from fin_contas where grupo = ? and substr(vencimento, 1, 7) = ?", `cob:${c2.id}`, mesDe(venc));
      if (jaTem) continue;
      run(db, "insert into fin_contas (tipo, descricao, contraparte, categoria, vencimento, valor, pago_em, grupo, obs, criado_em) values ('receber', ?, ?, 'Recorr\xEAncia (Mensalidade)', ?, ?, null, ?, ?, ?)", c2.nome, c2.nome, venc, c2.valor, `cob:${c2.id}`, `Cobran\xE7a recorrente (${c2.forma})`, agora);
      n3++;
    }
  }
  if (n3) conciliar(db);
  return n3;
}
function finAddManual(db, agora, x) {
  const v = validarExtrato(x, 0);
  run(db, "insert into fin_extrato (data, descricao, valor, categoria, fonte, hash, conta_id, criado_em) values (?, ?, ?, ?, 'avulso', ?, null, ?)", v.data, v.descricao, v.valor, v.categoria ?? null, `manual:${crypto.randomUUID()}`, agora);
  conciliar(db);
}
function finRemoverManual(db, id) {
  const e = row(db, "select fonte, conta_id from fin_extrato where id = ?", id);
  if (!e) throw new BrainError("not_found", "Lan\xE7amento n\xE3o encontrado.");
  if (e.fonte !== "avulso") throw new BrainError("invalid", "S\xF3 lan\xE7amentos avulsos podem ser removidos aqui; os do extrato v\xEAm do banco.");
  tx(db, () => {
    if (e.conta_id) run(db, "update fin_contas set extrato_id = null where id = ?", e.conta_id);
    run(db, "delete from fin_extrato where id = ?", id);
  });
}
function validarExtrato(x, i) {
  if (!x || typeof x !== "object") throw new BrainError("invalid", `Extrato linha ${i + 1}: formato inv\xE1lido.`);
  if (!DATA2.test(String(x.data))) throw new BrainError("invalid", `Extrato linha ${i + 1}: data precisa ser AAAA-MM-DD.`);
  if (typeof x.valor !== "number" || !Number.isFinite(x.valor) || x.valor === 0) throw new BrainError("invalid", `Extrato linha ${i + 1}: valor inv\xE1lido.`);
  const d = String(x.descricao ?? "").trim().slice(0, 200);
  if (!d) throw new BrainError("invalid", `Extrato linha ${i + 1}: falta a descri\xE7\xE3o.`);
  return { data: x.data, descricao: d, valor: r26(x.valor), categoria: x.categoria ?? null };
}
function validarConta(c2, i) {
  const p = `Conta ${i + 1}`;
  if (!c2 || typeof c2 !== "object") throw new BrainError("invalid", `${p}: formato inv\xE1lido.`);
  if (c2.tipo !== "pagar" && c2.tipo !== "receber") throw new BrainError("invalid", `${p}: tipo precisa ser "pagar" ou "receber".`);
  const desc = String(c2.descricao ?? "").trim().slice(0, 200);
  if (!desc) throw new BrainError("invalid", `${p}: falta a descri\xE7\xE3o.`);
  if (!DATA2.test(String(c2.vencimento))) throw new BrainError("invalid", `${p}: vencimento precisa ser AAAA-MM-DD.`);
  if (c2.pagoEm != null && !DATA2.test(String(c2.pagoEm))) throw new BrainError("invalid", `${p}: data de pagamento precisa ser AAAA-MM-DD.`);
  if (c2.valor != null && (typeof c2.valor !== "number" || !Number.isFinite(c2.valor) || c2.valor <= 0)) throw new BrainError("invalid", `${p}: o valor \xE9 um n\xFAmero positivo (sem sinal).`);
  const n3 = c2.recorrenciaMeses ?? 1;
  if (!Number.isInteger(n3) || n3 < 1 || n3 > 60) throw new BrainError("invalid", `${p}: recorr\xEAncia de 1 a 60 meses.`);
  return { ...c2, descricao: desc, valor: c2.valor == null ? null : r26(c2.valor), recorrenciaMeses: n3, categoria: categoria(c2.categoria, c2.tipo === "receber") };
}
function finAddExtrato(db, agora, itens2, fonte = "manual") {
  if (!Array.isArray(itens2) || itens2.length === 0) throw new BrainError("invalid", "Nenhum lan\xE7amento para importar.");
  if (itens2.length > 5e3) throw new BrainError("invalid", "Importe no m\xE1ximo 5.000 lan\xE7amentos por vez.");
  const ok = itens2.map(validarExtrato);
  let novos = 0;
  tx(db, () => {
    const visto = /* @__PURE__ */ new Map();
    for (const x of ok) {
      const base = `${x.data}|${x.valor.toFixed(2)}|${x.descricao.toLowerCase()}`;
      const n3 = (visto.get(base) ?? 0) + 1;
      visto.set(base, n3);
      const hash = `${base}#${n3}`;
      if (row(db, "select id from fin_extrato where hash = ?", hash)) continue;
      run(db, "insert into fin_extrato (data, descricao, valor, categoria, fonte, hash, criado_em) values (?, ?, ?, ?, ?, ?, ?)", x.data, x.descricao, x.valor, x.valor > 0 ? categoria(x.categoria, true) : categoria(x.categoria, false), fonte, hash, agora);
      novos++;
    }
  });
  return { novos, repetidos: ok.length - novos };
}
function finAddConta(db, agora, entrada) {
  const c2 = validarConta(entrada, 0);
  const n3 = c2.recorrenciaMeses ?? 1;
  const grupo2 = n3 > 1 ? crypto.randomUUID() : null;
  let criadas = 0;
  tx(db, () => {
    for (let k = 0; k < n3; k++) {
      const venc = somaMeses(c2.vencimento, k);
      const dup = row(db, "select id from fin_contas where tipo = ? and descricao = ? and vencimento = ? and coalesce(valor, -1) = coalesce(?, -1)", c2.tipo, c2.descricao, venc, c2.valor ?? null);
      if (dup) continue;
      run(db, "insert into fin_contas (tipo, descricao, contraparte, categoria, vencimento, valor, pago_em, grupo, obs, criado_em) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", c2.tipo, c2.descricao, c2.contraparte ?? null, c2.categoria, venc, c2.valor ?? null, k === 0 ? c2.pagoEm ?? null : null, grupo2, c2.obs ?? null, agora);
      criadas++;
    }
  });
  return { criadas };
}
function finNovaVenda(db, agora, v) {
  const cliente = String(v.cliente ?? "").trim().slice(0, 80);
  if (!cliente) throw new BrainError("invalid", "Informe o nome do cliente.");
  if (typeof v.valorMensal !== "number" || !(v.valorMensal > 0 && v.valorMensal <= 1e5)) throw new BrainError("invalid", "O valor da mensalidade \xE9 um n\xFAmero positivo.");
  if (!DATA2.test(String(v.inicio))) throw new BrainError("invalid", "A data da venda precisa ser AAAA-MM-DD.");
  const recorrente = v.recorrente !== false;
  const meses = v.mesesPrevistos ?? 11;
  if (!Number.isInteger(meses) || meses < 0 || meses > 59) throw new BrainError("invalid", "Meses previstos: de 0 a 59.");
  const setup = v.taxaSetup ? r26(Number(v.taxaSetup)) : 0;
  if (setup < 0 || !Number.isFinite(setup)) throw new BrainError("invalid", "A taxa de implementa\xE7\xE3o \xE9 um n\xFAmero positivo.");
  const valor = r26(v.valorMensal);
  const parcelas = v.parcelas && v.parcelas.length ? v.parcelas : [{ valor, pagoEm: null, vencimento: v.inicio }];
  if (parcelas.length > 12) throw new BrainError("invalid", "No m\xE1ximo 12 parcelas no primeiro m\xEAs.");
  for (const [i, p] of parcelas.entries()) {
    if (typeof p.valor !== "number" || !(p.valor > 0)) throw new BrainError("invalid", `Parcela ${i + 1}: valor inv\xE1lido.`);
    if (p.pagoEm != null && p.pagoEm !== "" && !DATA2.test(String(p.pagoEm))) throw new BrainError("invalid", `Parcela ${i + 1}: data de pagamento inv\xE1lida.`);
    if (p.vencimento != null && p.vencimento !== "" && !DATA2.test(String(p.vencimento))) throw new BrainError("invalid", `Parcela ${i + 1}: vencimento inv\xE1lido.`);
  }
  const somaP = r26(parcelas.reduce((t, p) => t + p.valor, 0));
  if (Math.abs(somaP - valor) > 9e-3) throw new BrainError("invalid", `As parcelas somam R$ ${somaP.toFixed(2)}, mas o valor \xE9 R$ ${valor.toFixed(2)}.`);
  if (recorrente && row(db, "select 1 as x from subscriptions where source = 'manual' and lower(label) = lower(?) and status = 'active'", cliente)) throw new BrainError("invalid", `J\xE1 existe um cliente "${cliente}" no MRR. Use outro nome ou remova o anterior.`);
  let contas = 0;
  tx(db, () => {
    const ins = (descricao, cat, venc, val, pago, grupo2, obs) => {
      run(db, "insert into fin_contas (tipo, descricao, contraparte, categoria, vencimento, valor, pago_em, grupo, obs, criado_em) values ('receber', ?, ?, ?, ?, ?, ?, ?, ?, ?)", descricao, cliente, cat, venc, val, pago, grupo2, obs, agora);
      contas++;
    };
    const n3 = parcelas.length;
    parcelas.forEach((p, i) => {
      const pago = p.pagoEm ? String(p.pagoEm) : null;
      const venc = p.vencimento ? String(p.vencimento) : pago ?? v.inicio;
      ins(n3 > 1 ? `${cliente}: mensalidade 1 (parcela ${i + 1}/${n3})` : `${cliente}: mensalidade 1`, recorrente ? "Recorr\xEAncia (Mensalidade)" : "Outras Receitas", venc, p.valor, pago, null, p.nota ? String(p.nota).slice(0, 200) : null);
    });
    if (setup > 0) ins(`${cliente}: implementa\xE7\xE3o`, "Implementa\xE7\xE3o/Setup", v.inicio, setup, v.taxaSetupPaga ? v.inicio : null, null, null);
    if (recorrente) {
      const grupo2 = crypto.randomUUID();
      for (let k = 1; k <= meses; k++) ins(`${cliente}: mensalidade ${k + 1}`, "Recorr\xEAncia (Mensalidade)", somaMeses(v.inicio, k), valor, null, grupo2, null);
      const id = `manual-${crypto.randomUUID().slice(0, 8)}`;
      run(db, "insert into subscriptions (source, external_id, label, list_price_brl, effective_price_brl, discount_ends_at, status, origin, updated_at) values ('manual', ?, ?, ?, ?, null, 'active', 'informado', ?)", id, cliente, valor, valor, agora);
    }
  });
  conciliar(db);
  return { contas, mrr: recorrente };
}
function finPagarConta(db, id, pagoEm, valor) {
  if (!DATA2.test(pagoEm)) throw new BrainError("invalid", "A data precisa ser AAAA-MM-DD.");
  const c2 = row(db, "select id, valor from fin_contas where id = ?", id);
  if (!c2) throw new BrainError("not_found", "Conta n\xE3o encontrada.");
  if (valor !== void 0 && (!Number.isFinite(valor) || valor <= 0)) throw new BrainError("invalid", "O valor \xE9 um n\xFAmero positivo.");
  run(db, "update fin_contas set pago_em = ?, valor = ? where id = ?", pagoEm, valor !== void 0 ? r26(valor) : c2.valor, id);
  conciliar(db);
}
function finDesfazerPagamento(db, id) {
  const c2 = row(db, "select extrato_id from fin_contas where id = ?", id);
  if (!c2) throw new BrainError("not_found", "Conta n\xE3o encontrada.");
  tx(db, () => {
    if (c2.extrato_id) run(db, "update fin_extrato set conta_id = null where id = ?", c2.extrato_id);
    run(db, "update fin_contas set pago_em = null, extrato_id = null where id = ?", id);
  });
}
function finRemoverConta(db, id) {
  const c2 = row(db, "select extrato_id from fin_contas where id = ?", id);
  if (!c2) throw new BrainError("not_found", "Conta n\xE3o encontrada.");
  tx(db, () => {
    if (c2.extrato_id) run(db, "update fin_extrato set conta_id = null where id = ?", c2.extrato_id);
    run(db, "delete from fin_contas where id = ?", id);
  });
}
function conciliar(db) {
  const ext = rows(db, "select id, data, valor from fin_extrato where conta_id is null order by data, id");
  const contas = rows(db, "select id, tipo, valor, coalesce(pago_em, vencimento) as ref, case when pago_em is null then 0 else 1 end as pago from fin_contas where extrato_id is null and valor is not null");
  const usadas = /* @__PURE__ */ new Set();
  let n3 = 0;
  tx(db, () => {
    for (const e of ext) {
      const tipo = e.valor > 0 ? "receber" : "pagar";
      let melhor = null;
      let dist = Infinity;
      for (const c2 of contas) {
        if (usadas.has(c2.id) || c2.tipo !== tipo || Math.round(c2.valor * 100) !== Math.round(Math.abs(e.valor) * 100)) continue;
        const d = Math.abs(diaMs(c2.ref) - diaMs(e.data)) / DIA2;
        if (d <= 7 && d < dist) {
          melhor = c2;
          dist = d;
        }
      }
      if (!melhor) continue;
      usadas.add(melhor.id);
      run(db, "update fin_contas set extrato_id = ?, pago_em = coalesce(pago_em, ?) where id = ?", e.id, e.data, melhor.id);
      run(db, "update fin_extrato set conta_id = ? where id = ?", melhor.id, e.id);
      n3++;
    }
  });
  return n3;
}
var IGNORAR = "Ignorar";
var ignorado = (e) => (e.categoria ?? "").trim().toLowerCase() === "ignorar";
function finIgnorarExtrato(db, id, ignorar) {
  const e = row(db, "select categoria, valor from fin_extrato where id = ?", id);
  if (!e) throw new BrainError("not_found", "Lan\xE7amento n\xE3o encontrado.");
  run(db, "update fin_extrato set categoria = ? where id = ?", ignorar ? IGNORAR : e.valor > 0 ? "Outras Receitas" : "Outras Despesas", id);
}
function finClassificarExtrato(db, id, cat, descricao) {
  const e = row(db, "select valor from fin_extrato where id = ?", id);
  if (!e) throw new BrainError("not_found", "Lan\xE7amento n\xE3o encontrado.");
  const c2 = categoria(cat, e.valor > 0);
  run(db, "update fin_extrato set categoria = ? where id = ?", c2, id);
  if (descricao && descricao.trim()) run(db, "update fin_extrato set descricao = ? where id = ?", descricao.trim().slice(0, 200), id);
}
var subsDe = (db) => rows(db, "select source, external_id, professional_id, label, list_price_brl, effective_price_brl, discount_ends_at, status from subscriptions");
var nomesStripe = (db) => {
  const m = {};
  for (const x of faturasStripe(db)) if (x.cliente_id) m[x.cliente_id] = x.nome;
  return m;
};
function movimentosFin(ext, contas) {
  const entradas = ext.filter((e) => e.valor > 0 && !ignorado(e)).map((e) => ({ data: e.data, valor: e.valor, cat: categoria(e.categoria, true), desc: e.descricao, origem: "Extrato Inter", ref: `extrato:${e.id}`, conciliado: e.conta_id !== null }));
  const despesas = [
    ...contas.filter((c2) => c2.tipo === "pagar" && c2.pago_em && c2.valor).map((c2) => ({ data: c2.pago_em, valor: c2.valor, cat: categoria(c2.categoria, false), desc: c2.descricao, origem: c2.extrato_id === null ? "Conta paga (fora do Inter)" : "Conta paga", ref: `conta:${c2.id}`, conciliado: c2.extrato_id !== null })),
    ...ext.filter((e) => e.valor < 0 && e.conta_id === null && !ignorado(e)).map((e) => ({ data: e.data, valor: -e.valor, cat: categoria(e.categoria, false), desc: e.descricao, origem: "Extrato Inter (sem conta)", ref: `extrato:${e.id}`, conciliado: false }))
  ];
  for (const c2 of contas)
    if (c2.tipo === "receber" && c2.pago_em && c2.valor && c2.extrato_id === null)
      entradas.push({ data: c2.pago_em, valor: c2.valor, cat: categoria(c2.categoria, true), desc: c2.descricao, origem: "Recebido fora do Inter", ref: `conta:${c2.id}`, conciliado: false });
  return { entradas, despesas };
}
function movimentosCompetencia(ext, contas, hoje, faturas = [], subs = [], nomes = {}) {
  const sit = (c2) => c2.pago_em ? "pago" : c2.vencimento < hoje ? "atrasado" : "a vencer";
  const entradas = [
    ...contas.filter((c2) => c2.tipo === "receber" && c2.valor && !(faturas.length && /stripe/i.test(c2.descricao)) && !(mesDe(c2.vencimento) === mesDe(hoje) && categoria(c2.categoria, true) === "Recorr\xEAncia (Mensalidade)")).map((c2) => ({ data: c2.vencimento, valor: c2.valor, cat: categoria(c2.categoria, true), desc: c2.descricao, origem: c2.grupo ? "Recorr\xEAncia / venda" : "Conta a receber", ref: `conta:${c2.id}`, conciliado: c2.extrato_id !== null, situacao: sit(c2) })),
    // Mês corrente: a receita recorrente é o que está vendido e ativo (o valor de cada assinatura), pago ou não, parcelado ou não.
    ...subs.filter(isActive).map((s2) => ({ data: `${mesDe(hoje)}-01`, valor: s2.effective_price_brl, cat: "Recorr\xEAncia (Mensalidade)", desc: nomes[s2.label ?? ""] ?? s2.label ?? s2.external_id, origem: `Assinatura ativa (${s2.source})`, ref: `sub:${s2.source}:${s2.external_id}`, conciliado: true, situacao: "vendido" })),
    ...faturas.filter((x) => mesDe(x.data) !== mesDe(hoje)).map((x) => ({ data: x.data, valor: x.valor, cat: "Recorr\xEAncia (Mensalidade)", desc: `${x.nome} (Stripe)`, origem: "Fatura paga no Stripe", ref: `stripe:${x.id}`, conciliado: true, situacao: "pago" })),
    ...ext.filter((e) => e.valor > 0 && e.fonte === "avulso" && e.conta_id === null && !ignorado(e)).map((e) => ({ data: e.data, valor: e.valor, cat: categoria(e.categoria, true), desc: e.descricao, origem: "Lan\xE7amento avulso", ref: `extrato:${e.id}`, conciliado: true, situacao: "avulso" }))
  ];
  const despesas = [
    ...contas.filter((c2) => c2.tipo === "pagar" && c2.valor).map((c2) => ({ data: c2.vencimento, valor: c2.valor, cat: categoria(c2.categoria, false), desc: c2.descricao, origem: c2.grupo ? "Recorr\xEAncia" : "Conta a pagar", ref: `conta:${c2.id}`, conciliado: c2.extrato_id !== null, situacao: sit(c2) })),
    ...ext.filter((e) => e.valor < 0 && e.conta_id === null && !ignorado(e)).map((e) => ({ data: e.data, valor: -e.valor, cat: categoria(e.categoria, false), desc: e.descricao, origem: e.fonte === "avulso" ? "Lan\xE7amento avulso" : "Extrato Inter (sem conta)", ref: `extrato:${e.id}`, conciliado: false, situacao: "extrato" }))
  ];
  return { entradas, despesas };
}
function finDetalhe(db, agora, linha, mes2, base = "competencia") {
  const ext = rows(db, "select id, data, descricao, valor, categoria, conta_id, fonte from fin_extrato order by data, id");
  const contas = rows(db, "select id, tipo, descricao, contraparte, categoria, vencimento, valor, pago_em, extrato_id, grupo, obs from fin_contas order by vencimento, id");
  const { entradas, despesas } = base === "caixa" ? movimentosFin(ext, contas) : movimentosCompetencia(ext, contas, brtDay(agora), faturasStripe(db), subsDe(db), nomesStripe(db));
  const limpo = linha.replace(/^\(-\)\s*/, "");
  const lista = mes2.split(",").filter(Boolean);
  const noMes = (l) => l.filter((m) => lista.includes(mesDe(m.data)));
  let itens2;
  let lado;
  if (limpo === "Receita bruta") {
    itens2 = noMes(entradas);
    lado = "entrada";
  } else if (limpo === "Receita l\xEDquida") {
    itens2 = [...noMes(entradas), ...noMes(despesas).filter((m) => m.cat === "Impostos e Taxas").map((m) => ({ ...m, valor: -m.valor }))];
    lado = "mista";
  } else if (limpo === "Despesas") {
    itens2 = noMes(despesas);
    lado = "saida";
  } else if (limpo === "Saldo Inter") {
    itens2 = ext.map((e) => ({ data: e.data, valor: e.valor, cat: e.categoria ?? "", desc: e.descricao, origem: "Extrato Inter", ref: `extrato:${e.id}`, conciliado: e.conta_id !== null }));
    lado = "mista";
  } else if (limpo === "Fora do Inter") {
    itens2 = contas.filter((c2) => c2.tipo === "pagar" && c2.pago_em && c2.valor && c2.extrato_id === null).map((c2) => ({ data: c2.pago_em, valor: c2.valor, cat: categoria(c2.categoria, false), desc: c2.descricao, origem: "Pago fora do Inter", ref: `conta:${c2.id}`, conciliado: false }));
    lado = "saida";
  } else if (limpo === "Resultado") {
    itens2 = [...noMes(entradas), ...noMes(despesas).map((m) => ({ ...m, valor: -m.valor }))];
    lado = "mista";
  } else if (CATEGORIAS_RECEITA.includes(limpo)) {
    itens2 = noMes(entradas).filter((m) => m.cat === limpo);
    lado = "entrada";
  } else {
    itens2 = noMes(despesas).filter((m) => m.cat === limpo);
    lado = "saida";
  }
  itens2.sort((a, b) => a.data < b.data ? 1 : -1);
  return { linha, mes: mes2, base, lado, total: r26(itens2.reduce((s2, m) => s2 + m.valor, 0)), itens: itens2 };
}
function finPainel(db, agora) {
  const hoje = brtDay(agora);
  const mesRef = mesDe(hoje);
  gerarCobrancas(db, agora);
  const ext = rows(db, "select id, data, descricao, valor, categoria, conta_id, fonte from fin_extrato order by data, id");
  const contas = rows(db, "select id, tipo, descricao, contraparte, categoria, vencimento, valor, pago_em, extrato_id, grupo, obs from fin_contas order by vencimento, id");
  const cfg = finConfig(db);
  const view = (c2) => ({
    id: c2.id,
    tipo: c2.tipo,
    descricao: c2.descricao,
    contraparte: c2.contraparte,
    categoria: c2.categoria,
    vencimento: c2.vencimento,
    valor: c2.valor,
    pagoEm: c2.pago_em,
    foraDoInter: c2.pago_em !== null && c2.extrato_id === null,
    status: c2.pago_em ? "pago" : c2.vencimento < hoje ? "atrasado" : "pendente",
    recorrente: c2.grupo !== null,
    cobranca: c2.grupo !== null && c2.grupo.startsWith("cob:"),
    obs: c2.obs
  });
  const saldoInter = r26(ext.reduce((s2, e) => s2 + e.valor, 0));
  const ultimo = ext.length ? ext[ext.length - 1].data : null;
  const { entradas, despesas } = movimentosFin(ext, contas);
  const comp = movimentosCompetencia(ext, contas, hoje, faturasStripe(db), subsDe(db), nomesStripe(db));
  const meses = (n3) => {
    const out = [];
    for (let i = n3 - 1; i >= 0; i--) out.push(mesDe(somaMeses(`${mesRef}-01`, -i)));
    return out;
  };
  const soma2 = (l, mes2, cat) => r26(l.filter((m) => mesDe(m.data) === mes2 && (!cat || m.cat === cat)).reduce((s2, m) => s2 + m.valor, 0));
  const serie = meses(6).map((m) => ({ mes: m, entradas: soma2(entradas, m), saidas: soma2(despesas, m), resultado: r26(soma2(entradas, m) - soma2(despesas, m)) }));
  const atual = serie[serie.length - 1];
  const mDre = meses(12);
  const linha = (label, tipo, f) => ({ label, tipo, valores: mDre.map(f) });
  const recBruta = (m) => soma2(comp.entradas, m);
  const imp = (m) => soma2(comp.despesas, m, "Impostos e Taxas");
  const dre = {
    meses: mDre.map(nomeMes),
    linhas: [
      ...CATEGORIAS_RECEITA.map((c2) => linha(c2, "receita", (m) => soma2(comp.entradas, m, c2))),
      linha("Receita bruta", "total", recBruta),
      linha("(-) Impostos e Taxas", "despesa", imp),
      linha("Receita l\xEDquida", "total", (m) => r26(recBruta(m) - imp(m))),
      ...CATEGORIAS_DESPESA.filter((c2) => c2 !== "Impostos e Taxas").map((c2) => linha(`(-) ${c2}`, "despesa", (m) => soma2(comp.despesas, m, c2))),
      linha("Resultado", "total", (m) => r26(recBruta(m) - soma2(comp.despesas, m)))
    ]
  };
  const fechados = meses(4).slice(0, 3).filter((m) => soma2(despesas, m) > 0 || soma2(entradas, m) > 0);
  const despesaMedia = fechados.length ? r26(fechados.reduce((s2, m) => s2 + soma2(despesas, m), 0) / fechados.length) : 0;
  const mesesDeCaixa = despesaMedia > 0 ? Math.round(saldoInter / despesaMedia * 10) / 10 : null;
  const subs = rows(db, "select source, external_id, professional_id, label, list_price_brl, effective_price_brl, discount_ends_at, status from subscriptions");
  const { total: mrr } = mrrBySource(subs);
  const ativos = subs.filter(isActive).length;
  const pendentes = contas.filter((c2) => !c2.pago_em).map(view);
  const aPagar = pendentes.filter((c2) => c2.tipo === "pagar");
  const aReceber = pendentes.filter((c2) => c2.tipo === "receber");
  const em30 = brtDay(agora + 30 * DIA2);
  const soma30 = (l) => r26(l.filter((c2) => c2.vencimento <= em30).reduce((s2, c2) => s2 + (c2.valor ?? 0), 0));
  const foraMes = contas.filter((c2) => c2.tipo === "pagar" && c2.pago_em && c2.extrato_id === null && mesDe(c2.pago_em) === mesRef).reduce((s2, c2) => s2 + (c2.valor ?? 0), 0);
  const foraTotal = contas.filter((c2) => c2.tipo === "pagar" && c2.pago_em && c2.extrato_id === null).reduce((s2, c2) => s2 + (c2.valor ?? 0), 0);
  const alertas = [];
  const brl4 = (n3) => n3.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const atrasPagar = aPagar.filter((c2) => c2.status === "atrasado");
  if (atrasPagar.length) alertas.push({ id: "pagar-atrasado", tom: "critico", titulo: `${atrasPagar.length} conta${atrasPagar.length > 1 ? "s" : ""} a pagar vencida${atrasPagar.length > 1 ? "s" : ""}`, detalhe: `${brl4(atrasPagar.reduce((s2, c2) => s2 + (c2.valor ?? 0), 0))} em aberto: ${atrasPagar.slice(0, 3).map((c2) => c2.descricao).join(", ")}.` });
  const em7 = brtDay(agora + 7 * DIA2);
  const prox7 = aPagar.filter((c2) => c2.status === "pendente" && c2.vencimento <= em7);
  if (prox7.length) alertas.push({ id: "pagar-7d", tom: "atencao", titulo: `${prox7.length} conta${prox7.length > 1 ? "s" : ""} vence${prox7.length > 1 ? "m" : ""} em 7 dias`, detalhe: `${brl4(prox7.reduce((s2, c2) => s2 + (c2.valor ?? 0), 0))}: ${prox7.slice(0, 3).map((c2) => `${c2.descricao} (${c2.vencimento.slice(8)}/${c2.vencimento.slice(5, 7)})`).join(", ")}.` });
  const atrasReceber = aReceber.filter((c2) => c2.status === "atrasado");
  if (atrasReceber.length) alertas.push({ id: "receber-atrasado", tom: "atencao", titulo: `${atrasReceber.length} recebimento${atrasReceber.length > 1 ? "s" : ""} atrasado${atrasReceber.length > 1 ? "s" : ""}`, detalhe: `${atrasReceber.slice(0, 3).map((c2) => c2.descricao).join(", ")}. Se j\xE1 caiu no Inter, importe o extrato para conciliar.` });
  const mesAnt = mesDe(somaMeses(`${mesRef}-01`, -1));
  const guiaPaga = contas.some((c2) => c2.tipo === "pagar" && c2.categoria === "Impostos e Taxas" && c2.pago_em && mesDe(c2.pago_em) === mesRef);
  const recAnt = soma2(entradas, mesAnt);
  if (!guiaPaga && recAnt > 0) {
    const dia5 = Number(hoje.slice(8));
    alertas.push({ id: "guia-simples", tom: dia5 > 20 ? "critico" : "atencao", titulo: dia5 > 20 ? "Guia do Simples sem pagamento lan\xE7ado" : `Guia do Simples vence dia 20 (${20 - dia5 >= 0 ? `faltam ${20 - dia5} dias` : "hoje"})`, detalhe: `Referente a ${nomeMes(mesAnt)}. Estimativa ${brl4(r26(recAnt * cfg.aliquotaImpostos))} (${Math.round(cfg.aliquotaImpostos * 100)}% de ${brl4(recAnt)}); o valor real sai do PGDAS.` });
  }
  if (mesesDeCaixa !== null && mesesDeCaixa < 3) alertas.push({ id: "caixa-baixo", tom: mesesDeCaixa < 1.5 ? "critico" : "atencao", titulo: `Caixa cobre ${mesesDeCaixa.toLocaleString("pt-BR")} ${mesesDeCaixa === 1 ? "m\xEAs" : "meses"} de despesa`, detalhe: `Saldo do Inter ${brl4(saldoInter)} contra despesa m\xE9dia de ${brl4(despesaMedia)} por m\xEAs.` });
  if (foraMes > 0) alertas.push({ id: "fora-inter", tom: "info", titulo: `${brl4(r26(foraMes))} pagos fora do Inter neste m\xEAs`, detalhe: "Despesa paga no cart\xE3o ou do bolso. Entra no resultado, mas n\xE3o mexe no saldo do Inter: acompanhe o que voc\xEA precisa repor." });
  if (ultimo && (agora - diaMs(ultimo)) / DIA2 > 7) alertas.push({ id: "extrato-velho", tom: "info", titulo: "Extrato do Inter desatualizado", detalhe: `O \xFAltimo lan\xE7amento \xE9 de ${ultimo.slice(8)}/${ultimo.slice(5, 7)}. Importe o extrato recente para o saldo e a concilia\xE7\xE3o refletirem o banco.` });
  const fechadosSemImposto = meses(4).slice(0, 3).filter((m) => soma2(despesas, m) > 0);
  const custoAuto = fechadosSemImposto.length ? r26(fechadosSemImposto.reduce((t, m) => t + soma2(despesas, m) - soma2(despesas, m, "Impostos e Taxas"), 0) / fechadosSemImposto.length) : 0;
  const premissas = finPremissas(db, custoAuto);
  const metaPol = row(db, "select value from policies where key = 'mrr_goal'");
  let meta = { valor: 1200, data: "31/12/2026" };
  try {
    const j2 = metaPol ? JSON.parse(metaPol.value) : null;
    if (j2 && typeof j2.value === "number" && j2.value > 0) meta = { valor: j2.value, data: j2.date ?? meta.data };
  } catch {
  }
  const projecao = projetar(r26(mrr), saldoInter, mesRef, premissas, meta.valor);
  const hist = rows(db, "select day, mrr_brl from mrr_daily order by day");
  const porDia = /* @__PURE__ */ new Map();
  for (const h of hist) porDia.set(h.day, (porDia.get(h.day) ?? 0) + h.mrr_brl);
  const mrrSerie = [...porDia.entries()].map(([day, total]) => ({ day, total: r26(total) }));
  const tres = meses(4).slice(0, 3);
  const gastoMkt = tres.reduce((t, m) => t + soma2(despesas, m, "Marketing e Vendas"), 0);
  const ind = indicadores({ mrr, clientes: ativos, mrrSerie, hoje, entradasMes: atual.entradas, resultadoMes: atual.resultado, churn: premissas.churn, meta, gastoMarketing3m: gastoMkt, clientesNovos3m: null });
  const desde = brtDay(agora - 90 * DIA2);
  let acc = 0;
  const saldoPorDia = /* @__PURE__ */ new Map();
  for (const e of ext) {
    acc += e.valor;
    saldoPorDia.set(e.data, r26(acc));
  }
  const saldoSerie = [];
  let ult = 0;
  for (let t = Date.parse(`${desde}T12:00:00Z`), fim = Date.parse(`${hoje}T12:00:00Z`); t <= fim; t += DIA2) {
    const d = new Date(t).toISOString().slice(0, 10);
    if (d < (ext[0]?.data ?? "9999")) continue;
    ult = saldoPorDia.get(d) ?? ult;
    if (!saldoPorDia.has(d) && saldoSerie.length === 0) ult = [...saldoPorDia.entries()].filter(([k]) => k < d).map(([, v]) => v).pop() ?? 0;
    saldoSerie.push({ data: d, saldo: ult });
  }
  const despesasPorCategoria = CATEGORIAS_DESPESA.map((c2) => ({ categoria: c2, mes: soma2(despesas, mesRef, c2), tresMeses: r26(tres.reduce((t, m) => t + soma2(despesas, m, c2), 0) / 3) })).filter((x) => x.mes > 0 || x.tresMeses > 0).sort((a, b) => b.mes - a.mes || b.tresMeses - a.tresMeses);
  const fluxo = (() => {
    const ini = brtDay(agora - 30 * DIA2);
    const fim = brtDay(agora + 150 * DIA2);
    const mov = /* @__PURE__ */ new Map();
    const slot = (d) => {
      let m = mov.get(d);
      if (!m) {
        m = { e: 0, s: 0, itens: [] };
        mov.set(d, m);
      }
      return m;
    };
    for (const e of ext) if (e.data >= ini && e.data <= hoje) {
      const m = slot(e.data);
      if (e.valor >= 0) m.e += e.valor;
      else m.s += -e.valor;
      m.itens.push({ descricao: e.descricao, valor: e.valor, data: e.data, previsto: false });
    }
    for (const c2 of contas) {
      if (c2.pago_em || !c2.valor) continue;
      const d = c2.vencimento < hoje ? hoje : c2.vencimento;
      if (d > fim) continue;
      const m = slot(d);
      if (c2.tipo === "receber") m.e += c2.valor;
      else m.s += c2.valor;
      m.itens.push({ descricao: `${c2.descricao}${c2.vencimento < hoje ? " (atrasada)" : ""}`, valor: c2.tipo === "receber" ? c2.valor : -c2.valor, data: d, previsto: true });
    }
    let saldo = r26(ext.filter((e) => e.data < ini).reduce((t, e) => t + e.valor, 0));
    const dias = [];
    for (let t = Date.parse(`${ini}T12:00:00Z`), f = Date.parse(`${fim}T12:00:00Z`); t <= f; t += DIA2) {
      const d = new Date(t).toISOString().slice(0, 10);
      const m = mov.get(d);
      saldo = r26(saldo + (m ? m.e - m.s : 0));
      dias.push({ data: d, entradas: r26(m?.e ?? 0), saidas: r26(m?.s ?? 0), saldo, projetado: d > hoje, itens: m ? m.itens.slice(0, 60) : [] });
    }
    const fut = dias.filter((x) => x.data >= hoje);
    const menor = fut.length ? fut.reduce((a, b) => b.saldo < a.saldo ? b : a) : null;
    return {
      dias,
      saldoHoje: saldoInter,
      menorSaldo: menor ? { data: menor.data, valor: menor.saldo } : null,
      negativoEm: fut.find((x) => x.saldo < 0)?.data ?? null,
      notas: [
        "O passado vem do extrato do Inter; o futuro soma o saldo com as contas a pagar e a receber em aberto, no dia do vencimento. Atrasadas entram hoje.",
        "Mensalidades do Stripe e clientes sem cobran\xE7a cadastrada n\xE3o entram no futuro: cadastre a cobran\xE7a recorrente para aparecerem.",
        "A guia do Simples s\xF3 entra depois de lan\xE7ada como conta a pagar."
      ]
    };
  })();
  if (fluxo.negativoEm) alertas.unshift({ id: "caixa-negativo", tom: "critico", titulo: `Caixa fica negativo em ${fluxo.negativoEm.slice(8)}/${fluxo.negativoEm.slice(5, 7)}`, detalhe: `Com as contas em aberto, o saldo do Inter cai a ${brl4(fluxo.menorSaldo?.valor ?? 0)}. Veja a aba Fluxo de caixa.` });
  return {
    agora,
    hoje,
    mesRef,
    vazio: ext.length === 0 && contas.length === 0,
    kpis: {
      saldoInter,
      ultimoLancamento: ultimo,
      entradasMes: atual.entradas,
      saidasMes: atual.saidas,
      resultadoMes: atual.resultado,
      mrr: r26(mrr),
      clientesAtivos: ativos,
      ticketMedio: ativos ? r26(mrr / ativos) : null,
      mesesDeCaixa,
      despesaMediaMensal: despesaMedia,
      pagoForaDoInterMes: r26(foraMes),
      pagoForaDoInterTotal: r26(foraTotal),
      aPagar30d: soma30(aPagar),
      aReceber30d: soma30(aReceber)
    },
    serie,
    dre,
    aPagar,
    aReceber,
    pagasRecentes: contas.filter((c2) => c2.pago_em).map(view).sort((a, b) => String(b.pagoEm).localeCompare(String(a.pagoEm))).slice(0, 12),
    extratoRecente: [...ext].reverse().slice(0, 15).map((e) => ({ id: e.id, data: e.data, descricao: e.descricao, valor: e.valor, categoria: e.categoria, conciliado: e.conta_id !== null, manual: e.fonte === "avulso" })),
    lancamentosManuais: ext.filter((e) => e.fonte === "avulso").reverse().slice(0, 15).map((e) => ({ id: e.id, data: e.data, descricao: e.descricao, valor: e.valor, categoria: e.categoria, conciliado: e.conta_id !== null, manual: true })),
    // Só saídas: entrada sem conta é normal (mensalidade que não tem conta a receber cadastrada).
    semConciliar: ext.filter((e) => e.valor < 0 && e.conta_id === null && !ignorado(e)).length,
    alertas,
    config: cfg,
    fluxo,
    premissas,
    cobrancas: finCobrancas(db),
    saldoSerie,
    despesasPorCategoria,
    projecao,
    indicadores: ind,
    categoriasDespesa: CATEGORIAS_DESPESA,
    categoriasReceita: CATEGORIAS_RECEITA
  };
}

// packages/core/src/api.ts
var CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data: https://*.fbcdn.net https://*.cdninstagram.com; media-src 'self' blob: data:; frame-ancestors 'none'";
var json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });
async function readJson(req, max = 64e3) {
  const text = await req.text();
  if (text.length > max) throw new BrainError("invalid", "Corpo grande demais.");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new BrainError("invalid", "JSON inv\xE1lido.");
  }
}
function createHandler(svc) {
  const { brain: brain2 } = svc;
  const snapshot = () => brain2.snapshot(integrationsView(brain2.db, svc.env, brain2.clock()));
  return async (req) => {
    const url = new URL(req.url);
    try {
      const origin = req.headers.get("origin");
      const allowed = /* @__PURE__ */ new Set([url.origin, ...svc.extraOrigins ?? []]);
      const cors = origin ? { "access-control-allow-origin": origin, "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" } : {};
      if (origin && !allowed.has(origin)) return json(403, { error: "origem n\xE3o permitida" });
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
      if (req.method === "POST" && url.pathname === "/api/webhooks/resend") return receberWebhook(brain2, svc.env, req);
      if (req.method === "GET" && url.pathname === "/api/linkedin/callback") {
        let destino = "/#linkedin";
        try {
          await liCallback(brain2, svc.env, svc.fetch ?? fetch, url.origin, url.searchParams.get("code") ?? "", url.searchParams.get("state") ?? "");
        } catch (e) {
          brain2.audit("sistema", "li_conexao_falhou", e instanceof Error ? e.message.slice(0, 200) : "erro");
          destino = `/?linkedin=erro#linkedin`;
        }
        return new Response(null, { status: 302, headers: { location: destino } });
      }
      if (req.method === "GET" && url.pathname.startsWith("/api/midia/")) return servirMidia(brain2, url.pathname.slice("/api/midia/".length));
      if (url.pathname === "/api/instagram/entrega" || url.pathname === "/api/instagram/contexto") {
        if (!tokenValido(svc.env, req)) return json(401, { error: "token inv\xE1lido" });
        if (req.method === "GET" && url.pathname.endsWith("/contexto")) return json(200, igContexto(brain2));
        if (req.method === "POST" && url.pathname.endsWith("/entrega")) return json(200, receberPost(brain2, await readJson(req, 14e6), url.origin));
        return json(405, { error: "m\xE9todo n\xE3o permitido" });
      }
      const denied = await svc.authorize?.(req, url);
      if (denied) return denied;
      const out = (status, body2) => json(status, body2, cors);
      if (req.method === "GET" && url.pathname === "/api/health") return out(200, { ok: true, server: "brain-server", llm: brain2.llm, sse: svc.sse === true });
      if (req.method === "GET" && url.pathname === "/api/state") return out(200, snapshot());
      if (req.method === "GET" && url.pathname === "/api/dashboard") return out(200, dashboardData(brain2));
      if (req.method === "GET" && url.pathname === "/api/midia-detalhe") return out(200, midiaDetalhe(brain2, url.searchParams.get("tipo") ?? "", url.searchParams.get("metrica") ?? "", url.searchParams.get("de"), url.searchParams.get("ate")));
      if (req.method === "GET" && url.pathname === "/api/midia") return out(200, midiaPainel(brain2, url.searchParams.get("de"), url.searchParams.get("ate")));
      if (req.method === "GET" && url.pathname === "/api/financeiro") return out(200, finPainel(brain2.db, brain2.clock()));
      if (req.method === "GET" && url.pathname === "/api/financeiro/detalhe") return out(200, finDetalhe(brain2.db, brain2.clock(), url.searchParams.get("linha") ?? "", url.searchParams.get("mes") ?? "", url.searchParams.get("base") === "caixa" ? "caixa" : "competencia"));
      if (req.method === "GET" && url.pathname === "/api/voz") return out(200, { neural: !!svc.env.OPENAI_API_KEY, voz: svc.env.VOZ_JARVIS ?? "onyx" });
      if (req.method === "GET" && url.pathname === "/api/seo") return out(200, { ...await gscPainelCompleto(brain2, svc.env, svc.fetch ?? fetch), ga: gaPainel(brain2, svc.env) });
      if (req.method === "GET" && url.pathname === "/api/planejamento") return out(200, planPainel(brain2, url.searchParams.get("semana") ?? void 0));
      if (req.method === "GET" && url.pathname === "/api/instagram") return out(200, igPainel(brain2, svc.env));
      if (req.method === "GET" && url.pathname === "/api/linkedin") return out(200, liPainel(brain2, svc.env));
      if (req.method === "GET" && url.pathname === "/api/prospeccao") return out(200, prospeccaoPainel(brain2, svc.env));
      if (req.method === "GET" && url.pathname === "/api/crm/painel") {
        try {
          return out(200, await crmPainel(svc.env, brain2.clock(), (u, i) => (svc.fetch ?? fetch)(u, i), { atualizar: url.searchParams.get("atualizar") === "1" }));
        } catch (e) {
          throw new BrainError("invalid", e instanceof Error ? e.message : "N\xE3o consegui ler o CRM.");
        }
      }
      if (req.method === "GET" && url.pathname === "/api/team-feed") {
        const team = TEAMS.find((t) => t.id === url.searchParams.get("team"));
        if (!team) return out(404, { error: "Equipe n\xE3o encontrada." });
        const ids = AGENTS.filter((a) => team.areas.includes(a.area)).map((a) => a.id);
        const marks = ids.map(() => "?").join(",");
        const runs = rows(brain2.db, `select id, agent_id, task, status, requested_by, created_at, finished_at, cost_brl, result, error from agent_runs where agent_id in (${marks}) order by id desc limit 40`, ...ids);
        const deliverables = rows(brain2.db, `select id, run_id, agent_id, title, body, at from deliverables where agent_id in (${marks}) order by id desc limit 20`, ...ids);
        return out(200, { runs, deliverables });
      }
      if (req.method === "GET" && url.pathname === "/api/subscriptions")
        return out(200, { subscriptions: rows(brain2.db, "select source, external_id, label, status, list_price_brl, effective_price_brl, discount_ends_at, origin from subscriptions order by source, external_id") });
      if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
        if (!svc.indexHtml) return null;
        const html = svc.indexHtml();
        if (!html) return new Response("A Central ainda n\xE3o foi compilada. Rode: npm run build", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "content-security-policy": CSP } });
      }
      if (req.method !== "POST") return url.pathname === "/api/events" ? null : out(404, { error: "n\xE3o encontrado" });
      const body = await readJson(req, url.pathname === "/api/financeiro/importar" || url.pathname === "/api/financeiro/importar-extrato" ? 2e6 : 64e3);
      const decide = url.pathname.match(/^\/api\/proposals\/([\w-]+)\/decide$/);
      if (decide) {
        const to = body.to;
        if (to !== "aprovada" && to !== "rejeitada") throw new BrainError("invalid", "Decis\xE3o inv\xE1lida.");
        brain2.decide(decide[1], to);
        let envio;
        let envioErro;
        if (to === "aprovada" && body.enviar === true) {
          try {
            envio = await sendApproved(brain2, svc.env, decide[1], svc.fetch);
          } catch (e) {
            if (!(e instanceof BrainError)) throw e;
            envioErro = e.message;
          }
        }
        return out(200, { ...snapshot(), ...envio ? { envio } : {}, ...envioErro ? { envioErro } : {} });
      }
      const send = url.pathname.match(/^\/api\/proposals\/([\w-]+)\/send$/);
      if (send) {
        const message = await sendApproved(brain2, svc.env, send[1], svc.fetch);
        return out(200, { message, snapshot: snapshot() });
      }
      if (url.pathname === "/api/planejamento") return out(200, planAcao(brain2, body));
      if (url.pathname === "/api/instagram/auto") {
        brain2.setPolicy("ig_auto_publicar", body.ligado === true);
        brain2.audit("voce", body.ligado === true ? "ig_auto_ligou" : "ig_auto_desligou", "publica\xE7\xE3o autom\xE1tica do Instagram");
        return out(200, igPainel(brain2, svc.env));
      }
      const igAcao = url.pathname.match(/^\/api\/instagram\/([\w-]+)\/(aprovar|rejeitar|publicar|legenda)$/);
      if (igAcao) {
        const [, pid, acao] = igAcao;
        let message = "";
        if (acao === "aprovar" || acao === "rejeitar") decidirPost(brain2, pid, acao, String(body.motivo ?? ""));
        if (acao === "legenda") editarLegenda(brain2, pid, String(body.legenda ?? ""));
        if (acao === "publicar" || acao === "aprovar" && body.publicarAgora === true) message = await publicarPost(brain2, svc.env, pid, svc.fetch ?? fetch);
        return out(200, { ...igPainel(brain2, svc.env), message });
      }
      if (req.method === "POST" && url.pathname === "/api/linkedin/conectar") return out(200, { url: liUrlAutorizar(brain2, svc.env, url.origin, body.alvo === "organizacao" ? "organizacao" : "pessoa") });
      if (url.pathname === "/api/linkedin/gerar") {
        const r = await liGerar(brain2, svc.env, svc.fetch ?? fetch, { forcar: true });
        return out(200, { ...liPainel(brain2, svc.env), message: r ? `Post novo: ${r.categoria}.` : "" });
      }
      const liAcao = url.pathname.match(/^\/api\/linkedin\/([\w-]+)\/(aprovar|rejeitar|publicar|texto|postei)$/);
      if (liAcao) {
        const [, pid, acao] = liAcao;
        let message = "";
        if (acao === "aprovar" || acao === "rejeitar") liDecidir(brain2, pid, acao, String(body.motivo ?? ""));
        if (acao === "texto") liEditar(brain2, pid, String(body.texto ?? ""));
        if (acao === "postei") liMarcarPublicado(brain2, pid);
        if (acao === "publicar" || acao === "aprovar" && body.publicarAgora === true) message = await liPublicar(brain2, svc.env, pid, svc.fetch ?? fetch);
        return out(200, { ...liPainel(brain2, svc.env), message });
      }
      if (url.pathname === "/api/seo/sincronizar") {
        const f = svc.fetch ?? fetch;
        const gsc = await sincronizarGsc(brain2, svc.env, f, { forcar: true });
        const ga = await sincronizarGa(brain2, svc.env, f, { forcar: true }).catch((e) => `GA4 com problema: ${e instanceof Error ? e.message : String(e)}`);
        return out(200, { message: `${gsc} ${ga}` });
      }
      if (url.pathname === "/api/seo/ga") {
        const f = svc.fetch ?? fetch;
        const b = body;
        if (b.descobrir) {
          try {
            const d = await descobrirPropriedades(brain2, svc.env, f);
            if (Object.keys(d.achadas).length) brain2.setPolicy("ga_propriedades", { ...propriedadesGa(brain2), ...d.achadas });
            return out(200, { achadas: d.achadas, vistas: d.vistas, message: Object.keys(d.achadas).length ? "Propriedades encontradas e salvas." : d.vistas.length ? "A conta enxerga propriedades, mas nenhuma mede os sites da Synapsa." : "A conta de servi\xE7o ainda n\xE3o enxerga nenhuma propriedade." });
          } catch (e) {
            return out(200, { achadas: {}, vistas: [], message: e instanceof Error ? e.message : String(e) });
          }
        }
        if (b.site && /^\d{6,14}$/.test(String(b.propriedade ?? "").trim())) {
          brain2.setPolicy("ga_propriedades", { ...propriedadesGa(brain2), [b.site]: String(b.propriedade).trim() });
          brain2.emit("change");
          return out(200, { message: "Propriedade salva." });
        }
        return out(400, { message: "Informe o site e o n\xFAmero da propriedade (s\xF3 d\xEDgitos), ou pe\xE7a para descobrir." });
      }
      if (url.pathname.startsWith("/api/prospeccao/")) {
        const rota = url.pathname.slice("/api/prospeccao/".length);
        const f = (u, i) => (svc.fetch ?? fetch)(u, i);
        const ids = () => Array.isArray(body.ids) ? body.ids.map(Number).filter((x) => Number.isInteger(x) && x > 0) : [];
        if (rota === "descoberta") return out(200, { message: await iniciarDescoberta(brain2, svc.env, { regiao: String(body.regiao ?? ""), busca: body.busca ? String(body.busca) : void 0, maximo: body.maximo ? Number(body.maximo) : void 0 }, f) });
        if (rota === "enriquecer") return out(200, { message: await iniciarEnriquecimento(brain2, svc.env, ids().length ? ids() : null, f) });
        if (rota === "avancar") return out(200, await avancar(brain2, svc.env, f));
        if (rota === "enviar-crm") return out(200, await enviarAoCrm(brain2, svc.env, ids(), f));
        if (rota === "auto") return out(200, autoSet(brain2, { ativo: body.ativo === void 0 ? void 0 : body.ativo === true, notaMin: body.notaMin === void 0 ? void 0 : Number(body.notaMin), limiteDia: body.limiteDia === void 0 ? void 0 : Number(body.limiteDia) }));
        if (rota === "rotina") return out(200, rotinaSet(brain2, { ativo: body.ativo === void 0 ? void 0 : body.ativo === true, maximo: body.maximo === void 0 ? void 0 : Number(body.maximo) }));
        if (rota === "rotina/rodar") return out(200, { message: await rodarRotina(brain2, svc.env, f, { forcar: true }) });
        if (rota === "emails/gerar") return out(200, gerarRascunhos(brain2));
        if (rota === "emails/enviar") return out(200, await aprovarEEnviar(brain2, svc.env, Array.isArray(body.ids) ? body.ids.map(String) : [], f));
        if (rota === "contato") {
          marcarContato(brain2, Number(body.id), body.acao === "sair" ? "sair" : "respondeu");
          return out(200, { ok: true });
        }
        if (rota === "whatsapp") {
          marcarWhatsapp(brain2, Number(body.id), Number(body.etapa), body.acao === "pular" ? "pular" : "enviado");
          return out(200, { ok: true });
        }
        if (rota === "descartar") {
          descartar(brain2, Number(body.id), body.descartar !== false);
          return out(200, { ok: true });
        }
      }
      if (url.pathname.startsWith("/api/financeiro/")) {
        const rota = url.pathname.slice("/api/financeiro/".length);
        const agora = brain2.clock();
        const idDe = () => {
          const id = Number(body.id);
          if (!Number.isInteger(id) || id < 1) throw new BrainError("invalid", "Falta o id da conta.");
          return id;
        };
        if (rota === "importar") {
          const resumo2 = {};
          if (body.extrato !== void 0) {
            if (!Array.isArray(body.extrato)) throw new BrainError("invalid", "extrato precisa ser uma lista.");
            resumo2.extrato = finAddExtrato(brain2.db, agora, body.extrato, typeof body.fonte === "string" ? body.fonte.slice(0, 20) : "importado");
          }
          if (body.contas !== void 0) {
            if (!Array.isArray(body.contas)) throw new BrainError("invalid", "contas precisa ser uma lista.");
            let criadas = 0;
            for (const c2 of body.contas) criadas += finAddConta(brain2.db, agora, c2).criadas;
            resumo2.contas = { criadas };
          }
          if (body.cobrancas !== void 0) {
            if (!Array.isArray(body.cobrancas)) throw new BrainError("invalid", "cobrancas precisa ser uma lista.");
            const antes = finPainel(brain2.db, agora).cobrancas;
            for (const c2 of body.cobrancas) {
              if (antes.some((x) => x.nome === String(c2.nome ?? "").trim())) continue;
              finAddCobranca(brain2.db, agora, c2);
            }
            resumo2.cobrancas = body.cobrancas.length;
          }
          if (body.aliquota !== void 0) finSetAliquota(brain2.db, Number(body.aliquota));
          resumo2.conciliadas = conciliar(brain2.db);
          brain2.audit("voce", "financeiro_importar", void 0, resumo2);
          return out(200, { resumo: resumo2, painel: finPainel(brain2.db, agora) });
        }
        if (rota === "importar-extrato") {
          const lido = lerExtratoInter(String(body.texto ?? ""));
          const r = finImportarExtrato(brain2.db, agora, lido, (n3) => finAddExtrato(brain2.db, agora, n3, "inter"));
          const conciliadas = conciliar(brain2.db);
          brain2.audit("voce", "financeiro_importar_extrato", void 0, { ...r, conciliadas });
          return out(200, { resumo: { ...r, conciliadas }, painel: finPainel(brain2.db, agora) });
        }
        if (rota === "conta") {
          const r = finAddConta(brain2.db, agora, body.conta);
          conciliar(brain2.db);
          brain2.audit("voce", "financeiro_conta_nova", void 0, { criadas: r.criadas });
          return out(200, { ...r, painel: finPainel(brain2.db, agora) });
        }
        if (rota === "venda") {
          const r = finNovaVenda(brain2.db, agora, body.venda);
          brain2.audit("voce", "financeiro_venda", String(body.venda?.cliente ?? ""), r);
          brain2.emit("change");
          return out(200, { ...r, painel: finPainel(brain2.db, agora) });
        }
        if (rota === "conta/pagar") {
          finPagarConta(brain2.db, idDe(), String(body.pagoEm ?? ""), body.valor === void 0 ? void 0 : Number(body.valor));
          brain2.audit("voce", "financeiro_pago", String(body.id));
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "conta/desfazer") {
          finDesfazerPagamento(brain2.db, idDe());
          brain2.audit("voce", "financeiro_desfeito", String(body.id));
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "conta/remover") {
          finRemoverConta(brain2.db, idDe());
          brain2.audit("voce", "financeiro_removido", String(body.id));
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "cobranca") {
          const c2 = body.cobranca;
          finAddCobranca(brain2.db, agora, { nome: String(c2?.nome ?? ""), valor: Number(c2?.valor), dia: Number(c2?.dia), forma: c2?.forma });
          brain2.audit("voce", "financeiro_cobranca_nova");
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "cobranca/ativar") {
          finSetCobranca(brain2.db, idDe(), body.ativa === true);
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "cobranca/remover") {
          finRemoverCobranca(brain2.db, idDe());
          brain2.audit("voce", "financeiro_cobranca_removida", String(body.id));
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "lancamento") {
          finAddManual(brain2.db, agora, body.lancamento);
          brain2.audit("voce", "financeiro_lancamento_avulso");
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "stripe/sincronizar") {
          let r;
          try {
            if (svc.env.STRIPE_READ_KEY) await sincronizarAssinaturasStripe(brain2, svc.env, agora);
            r = await sincronizarFaturasStripe(brain2, svc.env, svc.fetch ?? fetch);
          } catch (e) {
            r = { ok: false, faturas: 0, erro: e instanceof Error ? e.message : String(e) };
          }
          if (r.ok) brain2.audit("voce", "financeiro_stripe_faturas", String(r.faturas));
          return out(r.ok ? 200 : 502, { ...r, painel: finPainel(brain2.db, agora) });
        }
        if (rota === "extrato/categoria") {
          finClassificarExtrato(brain2.db, idDe(), String(body.categoria ?? ""), typeof body.descricao === "string" ? body.descricao : void 0);
          brain2.audit("voce", "financeiro_extrato_classificado", String(body.id));
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "extrato/ignorar") {
          finIgnorarExtrato(brain2.db, idDe(), body.ignorar !== false);
          brain2.audit("voce", body.ignorar === false ? "financeiro_extrato_reativado" : "financeiro_extrato_ignorado", String(body.id));
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "lancamento/remover") {
          finRemoverManual(brain2.db, idDe());
          brain2.audit("voce", "financeiro_lancamento_removido", String(body.id));
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "premissas") {
          const p = body.premissas ?? {};
          const num3 = (v) => v === void 0 ? void 0 : Number(v);
          finSetPremissas(brain2.db, { novosPorMes: num3(p.novosPorMes), precoNovo: num3(p.precoNovo), churn: num3(p.churn), aliquotaImpostos: num3(p.aliquotaImpostos), custoMensal: p.custoMensal === void 0 ? void 0 : p.custoMensal === null || p.custoMensal === "" ? null : Number(p.custoMensal) });
          brain2.audit("voce", "financeiro_premissas");
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        if (rota === "config") {
          finSetAliquota(brain2.db, Number(body.aliquota));
          return out(200, { painel: finPainel(brain2.db, agora) });
        }
        return out(404, { error: "n\xE3o encontrado" });
      }
      if (url.pathname === "/api/consents") {
        const ref = String(body.contact_ref ?? "").trim();
        const channel = body.channel === "whatsapp" ? "whatsapp" : "email";
        if (!ref) throw new BrainError("invalid", "Falta o contato.");
        if (body.revogar === true) {
          run(brain2.db, "update consents set revoked_at = ? where contact_ref = ? and channel = ?", brain2.clock(), ref, channel);
          if (channel === "email") suppress(brain2, ref, "pediu para sair");
        } else {
          run(brain2.db, "insert into consents (contact_ref, channel, granted_at, revoked_at) values (?, ?, ?, null) on conflict(contact_ref, channel) do update set revoked_at = null, granted_at = excluded.granted_at", ref, channel, brain2.clock());
        }
        brain2.audit("voce", body.revogar === true ? "consent_revogado" : "consent_registrado", `${channel}:${ref}`);
        return out(200, { ok: true });
      }
      if (url.pathname === "/api/actions") {
        if (!isAction(body.action)) throw new BrainError("invalid", "A\xE7\xE3o inv\xE1lida.");
        if (body.action.type === "crm") {
          const message2 = await executarCrm(svc.env, svc.fetch ?? fetch, body.action);
          brain2.audit("voce", "crm_escrita", body.action.op);
          return out(200, { message: message2, snapshot: snapshot() });
        }
        const message = applyAction(brain2, body.action);
        return out(200, { message, snapshot: snapshot() });
      }
      if (url.pathname === "/api/refresh-data") {
        const avisos = await refreshDados(brain2, svc.env);
        try {
          if (svc.env.STRIPE_READ_KEY) await sincronizarAssinaturasStripe(brain2, svc.env, brain2.clock());
        } catch (e) {
          avisos.push(`stripe: ${e instanceof Error ? e.message : String(e)}`);
        }
        const diag = await sincronizarMidia(brain2, svc.env, { dias: Number(body.dias) || 90 });
        for (const d of diag.filter((x) => !x.ok)) avisos.push(`${d.parte}: ${d.erro}`);
        return out(200, { avisos, dashboard: dashboardData(brain2), midia: midiaPainel(brain2, body.de, body.ate) });
      }
      if (url.pathname === "/api/midia/premissas") {
        salvarPremissas(brain2, { conversaoLeadCliente: Number(body.conversaoLeadCliente), retencaoMeses: Number(body.retencaoMeses), razaoLtvCac: Number(body.razaoLtvCac) });
        return out(200, midiaPainel(brain2, body.de, body.ate));
      }
      if (url.pathname === "/api/subscriptions/renomear") {
        const source = body.source === "manual" ? "manual" : "pix";
        const id = String(body.id ?? "");
        const label = String(body.label ?? "").trim().slice(0, 80);
        if (!id || !label) throw new BrainError("invalid", "Informe a assinatura e o nome.");
        const cur = row(brain2.db, "select origin from subscriptions where source = ? and external_id = ?", source, id);
        if (!cur) throw new BrainError("not_found", "Assinatura n\xE3o encontrada.");
        if (cur.origin !== "informado") throw new BrainError("invalid", "S\xF3 assinaturas informadas por voc\xEA podem ser renomeadas aqui.");
        run(brain2.db, "update subscriptions set label = ?, updated_at = ? where source = ? and external_id = ?", label, brain2.clock(), source, id);
        if (typeof body.contaDe === "string" && body.contaDe.trim()) run(brain2.db, "update fin_contas set descricao = ? where descricao = ?", label, body.contaDe.trim());
        if (typeof body.contaPrefixo === "string" && body.contaPrefixo.trim()) run(brain2.db, "update fin_contas set descricao = ? || substr(descricao, ?) where descricao like ? || '%'", label, body.contaPrefixo.trim().length + 1, body.contaPrefixo.trim());
        brain2.audit("voce", "renomear_assinatura", `${source}:${id}`, { label });
        brain2.emit("change");
        return out(200, snapshot());
      }
      if (url.pathname === "/api/subscriptions/add") {
        const source = body.source === "manual" ? "manual" : "pix";
        const label = String(body.label ?? "").trim().slice(0, 80);
        const eff = Number(body.effective_price_brl);
        const list = Number(body.list_price_brl ?? body.effective_price_brl);
        if (!label || !Number.isFinite(eff) || eff <= 0 || eff > 1e5 || !Number.isFinite(list) || list < eff) throw new BrainError("invalid", "Informe nome e valores v\xE1lidos.");
        const id = `${source}-${crypto.randomUUID().slice(0, 8)}`;
        run(brain2.db, "insert into subscriptions (source, external_id, label, list_price_brl, effective_price_brl, discount_ends_at, status, origin, updated_at) values (?, ?, ?, ?, ?, null, 'active', 'informado', ?)", source, id, label, list, eff, brain2.clock());
        brain2.audit("voce", "adicionar_assinatura_informada", `${source}:${id}`, { label, eff });
        brain2.emit("change");
        return out(200, snapshot());
      }
      if (url.pathname === "/api/subscriptions/remove") {
        const source = String(body.source ?? "");
        const id = String(body.external_id ?? "");
        const cur = row(brain2.db, "select origin from subscriptions where source = ? and external_id = ?", source, id);
        if (!cur) throw new BrainError("not_found", "Assinatura n\xE3o encontrada.");
        if (cur.origin !== "informado") throw new BrainError("invalid", "S\xF3 d\xE1 para remover o que foi informado \xE0 m\xE3o.");
        run(brain2.db, "delete from subscriptions where source = ? and external_id = ?", source, id);
        brain2.audit("voce", "remover_assinatura_informada", `${source}:${id}`);
        brain2.emit("change");
        return out(200, snapshot());
      }
      if (url.pathname === "/api/chat") {
        const text = String(body.text ?? "").trim().slice(0, 2e3);
        if (!text) throw new BrainError("invalid", "Mensagem vazia.");
        if (!svc.chat) return out(501, { error: "Jarvis indispon\xEDvel" });
        const reply = await svc.chat(text, { voz: body.voz === true });
        return out(200, { reply, snapshot: snapshot() });
      }
      if (url.pathname === "/api/voz/falar") {
        const chave2 = svc.env.OPENAI_API_KEY;
        if (!chave2) return out(501, { error: "Sem OPENAI_API_KEY: uso a voz do navegador." });
        const texto2 = String(body.texto ?? "").replace(/\s+/g, " ").trim().slice(0, 1200);
        if (!texto2) throw new BrainError("invalid", "Nada para falar.");
        const hoje = brtDay(brain2.clock());
        const uso = brain2.policy("voz_uso", { dia: hoje, n: 0 });
        const n3 = uso.dia === hoje ? uso.n : 0;
        const teto = Number(svc.env.VOZ_TETO_DIA ?? 600);
        if (n3 >= teto) return out(429, { error: `Limite di\xE1rio de voz neural (${teto} falas) atingido: uso a voz do navegador.` });
        const r = await (svc.fetch ?? fetch)("https://api.openai.com/v1/audio/speech", {
          method: "POST",
          headers: { authorization: `Bearer ${chave2}`, "content-type": "application/json" },
          body: JSON.stringify({ model: svc.env.VOZ_MODELO ?? "gpt-4o-mini-tts", voice: svc.env.VOZ_JARVIS ?? "onyx", input: texto2, response_format: "mp3", instructions: "Fale em portugu\xEAs do Brasil, com sotaque natural brasileiro. Tom de s\xF3cio experiente: calmo, direto e caloroso, ritmo de conversa, sem teatralidade." })
        });
        if (!r.ok) return out(502, { error: `A voz neural falhou (${r.status}): uso a voz do navegador.` });
        brain2.setPolicy("voz_uso", { dia: hoje, n: n3 + 1 });
        return new Response(r.body, { status: 200, headers: { "content-type": "audio/mpeg", "cache-control": "no-store", ...cors } });
      }
      if (url.pathname === "/api/integrations/check") {
        await svc.checkIntegrations?.();
        return out(200, snapshot());
      }
      return out(404, { error: "n\xE3o encontrado" });
    } catch (e) {
      if (e instanceof BrainError) return json(e.code === "not_found" ? 404 : 409, { error: e.message, code: e.code });
      console.error(e);
      return json(500, { error: "erro interno" });
    }
  };
}

// packages/core/src/auth.ts
var enc = new TextEncoder();
var COOKIE = "brain_session";
var TTL_MS = 7 * 24 * 36e5;
var b642 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function hmac(secret, data) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b642(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}
async function safeEqual(a, b) {
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const A = new Uint8Array(x);
  const B = new Uint8Array(y);
  let d = 0;
  for (let i = 0; i < A.length; i++) d |= A[i] ^ B[i];
  return d === 0;
}
async function makeSession(secret, now) {
  const exp = String(now + TTL_MS);
  return `${exp}.${await hmac(secret, exp)}`;
}
async function verifySession(secret, token, now) {
  if (!token) return false;
  const [exp, sig] = token.split(".");
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < now) return false;
  return safeEqual(sig, await hmac(secret, exp));
}
var readCookie = (req, name = COOKIE) => req.headers.get("cookie")?.split(/;\s*/).map((c2) => c2.split("=")).find(([k]) => k === name)?.[1];
var sessionCookie = (token, secure) => `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${TTL_MS / 1e3}${secure ? "; Secure" : ""}`;
var clearCookie = (secure) => `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure ? "; Secure" : ""}`;
var j = (status, body, extra = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });
var LoginLimiter = class {
  constructor(max = 5, windowMs = 6e5) {
    this.max = max;
    this.windowMs = windowMs;
  }
  fails = [];
  blocked(now) {
    this.fails = this.fails.filter((t) => now - t < this.windowMs);
    return this.fails.length >= this.max;
  }
  fail(now) {
    this.fails.push(now);
  }
  reset() {
    this.fails = [];
  }
};
var LOGIN_HTML = `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synapsa Brain</title>
<style>:root{color-scheme:light dark;--bg:#f6f5f2;--fg:#17201d;--mut:#66706b;--ac:#1f6b55;--bd:#d6d9d4}@media(prefers-color-scheme:dark){:root{--bg:#0f1513;--fg:#e8ede9;--mut:#8b9791;--ac:#4fb391;--bd:#2a3531}}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:15px system-ui,sans-serif;padding:16px}
form{width:min(340px,100%);display:grid;gap:12px}h1{font-size:20px;margin:0}p{margin:0;color:var(--mut)}
input,button{font:inherit;padding:11px 12px;border-radius:8px;border:1px solid var(--bd);background:transparent;color:var(--fg)}button{background:var(--ac);border-color:var(--ac);color:#fff;font-weight:600;cursor:pointer}#e{color:#c0392b;min-height:1.2em}</style>
<form id="f"><h1>Synapsa Brain</h1><p>Acesso restrito.</p><input id="p" type="password" placeholder="Senha" autocomplete="current-password" autofocus required><button>Entrar</button><div id="e" role="alert"></div></form>
<script>f.onsubmit=async e=>{e.preventDefault();const r=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({password:p.value})});if(r.ok)location.reload();else document.getElementById('e').textContent=r.status===429?'Muitas tentativas. Espere 10 minutos.':r.status===503?'Login n\xE3o configurado no servidor.':'Senha incorreta.'}</script></html>`;
function createAuth(env, limiter = new LoginLimiter(), clock = Date.now) {
  const open = env.ALLOW_INSECURE_LOCAL === "1";
  const configured = Boolean(env.BRAIN_PASSWORD && env.SESSION_SECRET);
  const isAuthed = async (req) => open || configured && await verifySession(env.SESSION_SECRET, readCookie(req), clock());
  const authorize = async (req, url) => {
    if (url.pathname === "/api/login" && req.method === "POST") return login(req, url);
    if (url.pathname === "/api/logout" && req.method === "POST") return j(200, { ok: true }, { "set-cookie": clearCookie(url.protocol === "https:") });
    if (!open && !configured) return j(503, { error: "Login n\xE3o configurado: defina BRAIN_PASSWORD e SESSION_SECRET.", code: "not_configured" });
    if (await isAuthed(req)) return null;
    return j(401, { error: "Fa\xE7a login.", code: "auth" });
  };
  async function login(req, url) {
    if (!configured) return j(503, { error: "Login n\xE3o configurado.", code: "not_configured" });
    const now = clock();
    if (limiter.blocked(now)) return j(429, { error: "Muitas tentativas.", code: "rate_limited" });
    let pw = "";
    try {
      pw = String((await req.json()).password ?? "");
    } catch {
    }
    if (!pw || !await safeEqual(pw, env.BRAIN_PASSWORD)) {
      limiter.fail(now);
      return j(401, { error: "Senha incorreta.", code: "auth" });
    }
    limiter.reset();
    return j(200, { ok: true }, { "set-cookie": sessionCookie(await makeSession(env.SESSION_SECRET, now), url.protocol === "https:") });
  }
  return { authorize, isAuthed, configured: configured || open };
}

// packages/core/src/checks.ts
var get = async (url, headers, f) => {
  const res = await f(url, { method: "GET", headers, signal: AbortSignal.timeout(1e4) });
  return { res, body: await res.json().catch(() => ({})) };
};
var CHECKS = {
  async stripe(env, f) {
    if (!env.STRIPE_READ_KEY) return null;
    const { res } = await get("https://api.stripe.com/v1/balance", { authorization: `Bearer ${env.STRIPE_READ_KEY}` }, f);
    return res.ok ? { ok: true, detail: "Chave de leitura v\xE1lida" } : { ok: false, detail: `Stripe respondeu ${res.status}` };
  },
  async meta(env, f) {
    if (!env.META_SYSTEM_USER_TOKEN || !env.META_AD_ACCOUNT_ID) return null;
    const acct = env.META_AD_ACCOUNT_ID.startsWith("act_") ? env.META_AD_ACCOUNT_ID : `act_${env.META_AD_ACCOUNT_ID}`;
    const { res, body } = await get(`https://graph.facebook.com/${env.META_GRAPH_VERSION ?? "v23.0"}/${acct}?fields=name,account_status`, { authorization: `Bearer ${env.META_SYSTEM_USER_TOKEN}` }, f);
    return res.ok ? { ok: true, detail: `Conta de an\xFAncios "${body.name ?? acct}"` } : { ok: false, detail: `Meta respondeu ${res.status}: ${body.error?.message ?? "erro"}` };
  },
  async instagram(env, f) {
    if (!env.META_SYSTEM_USER_TOKEN || !env.META_IG_ID) return null;
    const { res, body } = await get(`https://graph.facebook.com/${env.META_GRAPH_VERSION ?? "v23.0"}/${env.META_IG_ID}?fields=username`, { authorization: `Bearer ${env.META_SYSTEM_USER_TOKEN}` }, f);
    return res.ok ? { ok: true, detail: `Perfil @${body.username ?? env.META_IG_ID}` } : { ok: false, detail: `Instagram respondeu ${res.status}: ${body.error?.message ?? "erro"}` };
  },
  async openai(env, f) {
    if (!env.OPENAI_API_KEY) return null;
    const { res } = await get("https://api.openai.com/v1/models", { authorization: `Bearer ${env.OPENAI_API_KEY}` }, f);
    return res.ok ? { ok: true, detail: "Chave v\xE1lida" } : { ok: false, detail: `OpenAI respondeu ${res.status}` };
  },
  async anthropic(env, f) {
    if (!env.ANTHROPIC_API_KEY) return null;
    const { res } = await get("https://api.anthropic.com/v1/models?limit=1", { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, f);
    return res.ok ? { ok: true, detail: "Chave v\xE1lida" } : { ok: false, detail: `Anthropic respondeu ${res.status}` };
  },
  async resend(env, f) {
    if (!env.RESEND_API_KEY) return null;
    const { res, body } = await get("https://api.resend.com/domains", { authorization: `Bearer ${env.RESEND_API_KEY}` }, f);
    if (res.ok) return { ok: true, detail: `${body.data?.length ?? 0} dom\xEDnio(s) na conta` };
    if (res.status === 401 && /restricted/i.test(String(body.name ?? body.message ?? ""))) return { ok: true, detail: "Chave s\xF3 de envio (n\xE3o lista dom\xEDnios)" };
    return { ok: false, detail: `Resend respondeu ${res.status}` };
  },
  async apify(env, f) {
    if (!env.APIFY_TOKEN) return null;
    const { res } = await get("https://api.apify.com/v2/users/me", { authorization: `Bearer ${env.APIFY_TOKEN}` }, f);
    return res.ok ? { ok: true, detail: "Token v\xE1lido" } : { ok: false, detail: `Apify respondeu ${res.status}` };
  },
  async crm(env, f) {
    const cli = crmClient(env, f);
    if (!cli) return null;
    try {
      const r = await cli.stages();
      return { ok: true, detail: `API do CRM respondeu 200 (${r.data.length} etapas do funil)` };
    } catch (e) {
      return { ok: false, detail: e instanceof CrmError ? `CRM: ${e.message}${e.requestId ? ` (request_id ${e.requestId})` : ""}` : "CRM: erro de rede" };
    }
  },
  async whatsapp(env, f) {
    if (!env.WHATSAPP_ACCESS_TOKEN) return null;
    const { res, body } = await get(`https://graph.facebook.com/${env.META_GRAPH_VERSION ?? "v23.0"}/me?fields=id,name`, { authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}` }, f);
    return res.ok ? { ok: true, detail: `Token v\xE1lido (${body.name ?? body.id})` } : { ok: false, detail: `WhatsApp respondeu ${res.status}: ${body.error?.message ?? "erro"}` };
  }
};
async function runChecks(db, env, now, f = fetch) {
  const out = {};
  await Promise.all(
    Object.entries(CHECKS).map(async ([id, check2]) => {
      let r;
      try {
        r = await check2(env, f);
      } catch (e) {
        r = { ok: false, detail: e instanceof Error ? e.message.slice(0, 120) : "erro de rede" };
      }
      if (!r) return;
      out[id] = r;
      run(db, "insert into integration_checks (integration_id, ok, detail, at) values (?, ?, ?, ?) on conflict(integration_id) do update set ok = excluded.ok, detail = excluded.detail, at = excluded.at", id, r.ok ? 1 : 0, r.detail, now);
    })
  );
  return out;
}

// packages/core/src/jarvis.ts
var remember = (brain2, role, text) => run(brain2.db, "insert into chat (role, text, at) values (?, ?, ?)", role, text, brain2.clock());
function ruleChat(brain2, integrations) {
  return async (text) => {
    remember(brain2, "voce", text);
    const snap = brain2.snapshot(integrations());
    const view = { now: snap.now, runtime: snap.runtime, proposals: snap.proposals, integrations: snap.integrations, kill: snap.kill, metrics: snap.metrics };
    const r = respond(text, view);
    let reply = { text: r.text, confirm: r.confirm };
    if (r.action) {
      try {
        applyAction(brain2, r.action);
        if (r.action.type === "task" && !brain2.llm && !HANDLERS[r.action.agentId]) {
          reply = { text: `Registrei a tarefa para ${brain2.agentName(r.action.agentId)}, mas ele precisa da IA para raciocinar e a OPENAI_API_KEY n\xE3o est\xE1 no .env.local. Fica travada at\xE9 voc\xEA colar a chave.` };
        }
      } catch (e) {
        if (!(e instanceof BrainError)) throw e;
        reply = { text: e.message };
      }
    }
    remember(brain2, "jarvis", reply.text);
    return reply;
  };
}

// packages/core/src/web.ts
var WEB_FEE_BRL = 0.2;
async function pesquisarWeb(cfg, pergunta, fetchFn = fetch) {
  if (cfg.provider !== "openai") throw new Error("A pesquisa na web usa a OpenAI. Configure OPENAI_API_KEY.");
  const q = pergunta.trim().slice(0, 600);
  if (!q) throw new Error("Pergunta vazia.");
  const call = (toolType) => fetchFn("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: cfg.model,
      tools: [{ type: toolType }],
      input: `Pesquise na web e responda em portugu\xEAs do Brasil, em at\xE9 350 palavras, com fatos e n\xFAmeros verific\xE1veis. Cite o nome da fonte ao lado de cada dado. Se n\xE3o achar, diga que n\xE3o achou. Pergunta: ${q}`,
      max_output_tokens: 1400
    })
  });
  let res = await call("web_search");
  if (res.status === 400) res = await call("web_search_preview");
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Busca na web ${res.status}${body ? `: ${body.slice(0, 160)}` : ""}`);
  }
  const j2 = await res.json();
  let texto2 = "";
  const fontes = /* @__PURE__ */ new Map();
  for (const o of j2.output ?? []) {
    if (o.type !== "message") continue;
    for (const c2 of o.content ?? []) {
      if (c2.type === "output_text" && c2.text) texto2 += c2.text;
      for (const a of c2.annotations ?? []) if (a.type === "url_citation" && a.url) fontes.set(a.url.replace(/[?&]utm_[^&]*/g, ""), a.title ?? a.url);
    }
  }
  const cost = costBrl(cfg, { input_tokens: j2.usage?.input_tokens ?? 0, output_tokens: j2.usage?.output_tokens ?? 0 }) + WEB_FEE_BRL;
  return { texto: texto2.trim() || "A busca n\xE3o devolveu texto.", fontes: [...fontes].slice(0, 8).map(([url, titulo2]) => ({ titulo: titulo2, url })), costBrl: cost };
}
var WEB_TOOL = {
  name: "pesquisar_web",
  description: "Pesquisa na internet (mercado, concorrentes, pre\xE7os, tend\xEAncias, not\xEDcias). Devolve texto com fontes. Use s\xF3 para mercado: nunca para levantar dados pessoais de pessoas espec\xEDficas. Cada chamada custa dinheiro: fa\xE7a poucas, perguntas espec\xEDficas.",
  input_schema: { type: "object", properties: { pergunta: { type: "string", description: "Pergunta espec\xEDfica e completa." } }, required: ["pergunta"] }
};

// packages/core/src/jarvis-dados.ts
var dia4 = (ms2) => ms2 ? new Date(ms2 - 3 * 36e5).toISOString().slice(0, 10) : null;
function verSeo(brain2, env) {
  const g = gscPainel(brain2, env);
  const a = gaPainel(brain2, env);
  return {
    search_console: g.sites.map((s2) => ({
      site: s2.rotulo,
      ultimo_dia: s2.ultimoDia,
      cliques_28d: s2.atual.clicks,
      impressoes_28d: s2.atual.impressions,
      posicao_media: Math.round(s2.atual.position * 10) / 10,
      antes: { cliques: s2.anterior.clicks, impressoes: s2.anterior.impressions },
      cliques_de_marca: s2.marca.clicks,
      cliques_sem_marca: s2.naoMarca.clicks,
      top_buscas: s2.queries.slice(0, 10).map((q) => ({ busca: q.chave, cliques: q.clicks, impressoes: q.impressions, posicao: Math.round(q.position * 10) / 10 })),
      top_paginas: s2.paginas.slice(0, 10).map((p) => ({ pagina: p.caminho, cliques: p.clicks, impressoes: p.impressions })),
      oportunidades: s2.oportunidades.slice(0, 6),
      perfis: s2.perfis ? { vistos: s2.perfis.comImpressao, com_clique: s2.perfis.comClique, no_mapa_do_site: s2.perfis.esperados } : null,
      leitura: s2.recados
    })),
    google_analytics: a.configurado ? a.sites.filter((s2) => s2.propriedade).map((s2) => ({
      site: s2.rotulo,
      ultimo_dia: s2.ultimoDia,
      visitas_28d: s2.atual.sessoes,
      pessoas_28d: s2.atual.usuarios,
      visitas_engajadas: s2.atual.engajadas,
      eventos_chave: s2.atual.eventos,
      antes: { visitas: s2.anterior.sessoes, pessoas: s2.anterior.usuarios },
      canais: s2.canais.slice(0, 6).map((c2) => ({ canal: c2.chave, visitas: c2.sessoes })),
      top_entradas: s2.entradas.slice(0, 10).map((e) => ({ pagina: e.chave, visitas: e.sessoes, engajadas: e.engajadas })),
      leitura: s2.recados
    })) : `GA4 ainda n\xE3o ligado${a.ultimoErro ? `: ${a.ultimoErro}` : "."}`
  };
}
function verInstagram(brain2, env) {
  const ls = rows(brain2.db, "select id, status, tema, pilar, maturidade, legenda, agendado_para, publicado_em, permalink, erro from ig_posts order by criado_em desc limit 20");
  return {
    publicacao_automatica: brain2.policy("ig_auto_publicar", false) === true,
    configurado: !!(env.META_SYSTEM_USER_TOKEN && env.META_IG_ID),
    aguardando_sua_aprovacao: ls.filter((l) => l.status === "pendente").length,
    posts: ls.map((l) => ({ tema: l.tema, pilar: l.pilar, status: l.status, para: dia4(l.agendado_para), publicado_em: dia4(l.publicado_em), link: l.permalink, motivo: l.erro, legenda_inicio: l.legenda.slice(0, 140) }))
  };
}
function verPlanejamento(brain2, semana) {
  const p = planPainel(brain2, semana);
  const it = (x) => ({ id: x.id, titulo: x.titulo, tipo: x.tipo, dia: x.dia, formato: x.formato || void 0, responsavel: x.responsavel || "sem respons\xE1vel", status: x.status, subtarefas: (x.subtarefas ?? []).map((s2) => ({ titulo: s2.titulo, status: s2.status })) });
  return { semana: p.semana, resumo: p.resumo, posts: p.posts.map(it), tarefas: p.tarefas.map(it), historico_taxas: p.historico.slice(0, 8), pendentes_da_semana_anterior: p.pendentesAnterior };
}
function verProspeccao(brain2) {
  const porStatus = rows(brain2.db, "select status, count(*) as n from prospects group by status").map((r) => ({ status: r.status, quantidade: r.n }));
  const topo = rows(brain2.db, "select nome, cidade, uf, nota, status, instagram from prospects where status in ('qualificado','revisar') order by nota desc limit 10");
  const total = row(brain2.db, "select count(*) as n from prospects")?.n ?? 0;
  return { total, por_status: porStatus, melhores_para_abordar: topo.map((t) => ({ nome: t.nome, cidade: t.cidade ? `${t.cidade}${t.uf ? `/${t.uf}` : ""}` : null, nota: t.nota, status: t.status, tem_instagram: !!t.instagram })) };
}
function planejar(brain2, i) {
  const tipo = i.tipo === "post" ? "post" : "tarefa";
  planAcao(brain2, { acao: "criar", tipo, titulo: i.titulo, ...Number.isInteger(i.dia) ? { dia: i.dia } : {}, formato: i.formato ?? "", responsavel: i.responsavel ?? "" });
  return `Lancei no planejamento da semana: ${i.titulo}.`;
}

// packages/core/src/jarvis-llm.ts
var cap = (x, n3 = 12e3) => {
  const t = JSON.stringify(x);
  return t.length > n3 ? `${t.slice(0, n3)}\u2026(cortado)` : t;
};
var SYSTEM = `Voc\xEA \xE9 o Jarvis, o comandante da Central Synapsa. Fala com Felipe Dalpra, fundador da Synapsa, plataforma de IA para psic\xF3logos no Brasil.

Como responder: portugu\xEAs do Brasil, direto, sem enrola\xE7\xE3o, sem abrir com elogio. Frases curtas e longas misturadas. D\xEA posi\xE7\xE3o, n\xE3o "depende". Tudo precisa ligar a MRR, reten\xE7\xE3o ou ativa\xE7\xE3o.

Regras que voc\xEA nunca quebra:
- S\xF3 afirme n\xFAmeros e fatos que vieram das ferramentas. Se a ferramenta n\xE3o tem o dado, diga que n\xE3o tem (por exemplo, o funil depende da plataforma ligar o Brain).
- Voc\xEA TEM acesso a Stripe (assinaturas e MRR), Meta Ads (campanhas, gasto, cliques, leads) e Instagram (seguidores, alcance, posts) pela ferramenta consultar_dados. Nunca diga que n\xE3o tem acesso sem antes consultar. Se a consulta devolver aviso de erro, repita o aviso ao Felipe com as palavras exatas e diga o que falta.
- Para perguntas de n\xFAmeros, an\xE1lise ou "como estamos", consulte primeiro, depois d\xEA a leitura e a a\xE7\xE3o que mais move o MRR.
- Quando o Felipe pedir um plano ou uma frente de trabalho, use dar_tarefa com instru\xE7\xF5es completas (o que pesquisar, o que entregar), ou lancar_plano se existir plano pronto da equipe.
- Nada sai para fora sozinho: agentes s\xF3 prop\xF5em, e s\xF3 o Felipe aprova e envia. Aprovar n\xE3o envia nada.
- Nenhum agente oferece desconto. Fim de desconto vira contato do Felipe com o cliente.
- A\xE7\xF5es que param ou liberam tudo, ou aprovam em lote, exigem confirma\xE7\xE3o do Felipe: use pedir_confirmacao, nunca execute direto.
- Pausar, retomar, dar tarefa a um agente e rodar a rotina voc\xEA executa direto.
- Dados cl\xEDnicos de paciente n\xE3o existem no Brain.
- Caixa, contas, DRE, proje\xE7\xE3o e meta de MRR: use ver_financeiro. CRM (funil, reuni\xF5es do dia, leads parados, oportunidades): use ver_crm. ver_financeiro e ver_crm s\xE3o leitura. Voc\xEA n\xE3o lan\xE7a pagamento nem cadastra conta financeira. No CRM voc\xEA PROP\xD5E escritas com propor_crm (criar lead, mover etapa, registrar atividade, agendar reuni\xE3o): isso n\xE3o executa nada, s\xF3 mostra um bot\xE3o de confirmar ao Felipe, e s\xF3 o clique dele grava. Nunca exclua nada no CRM. Se faltar campo obrigat\xF3rio (por exemplo telefone), pergunte ao Felipe antes de propor; nunca invente telefone, nome ou data. Depois de propor, diga em uma frase o que vai acontecer ao confirmar.
- Os n\xFAmeros do financeiro s\xE3o do Inter (caixa real) e das contas lan\xE7adas; MRR vem das assinaturas. CAC s\xF3 existe quando a ferramenta devolver n\xFAmero.
- Voc\xEA enxerga TUDO o que est\xE1 no Brain, cada coisa pela sua ferramenta: ver_seo (Search Console e Google Analytics: buscas, p\xE1ginas, perfis do diret\xF3rio, visitas, canais), ver_instagram (fila de posts, o que foi publicado, o que espera aprova\xE7\xE3o), ver_planejamento (posts e tarefas da semana, respons\xE1veis, taxa de conclus\xE3o), ver_prospeccao (prospects e quais abordar), ver_financeiro, ver_crm, consultar_dados (Stripe, Meta Ads, Instagram, execu\xE7\xF5es, entregas). Nunca diga que n\xE3o tem acesso sem chamar a ferramenta certa. Se uma ferramenta devolver aviso de que algo n\xE3o est\xE1 ligado, repita o aviso e diga o que falta.
- planejar p\xF5e um post ou tarefa na semana do planejamento: \xE9 interno e revers\xEDvel, ent\xE3o execute direto quando o Felipe pedir.
Se a pergunta for sobre o estado do Brain, chame visao_geral antes de responder.`;
var SYSTEM_VOZ = `

MODO CONVERSA POR VOZ (o Felipe est\xE1 ouvindo voc\xEA, n\xE3o lendo): fale como um s\xF3cio que conhece o neg\xF3cio por dentro, trocando ideia. Responda em at\xE9 3 frases curtas, no m\xE1ximo uns 60 palavras, a menos que ele pe\xE7a mais. Sem markdown, sem listas, sem emoji, sem URLs lidas letra por letra e sem tabelas. Diga n\xFAmeros do jeito que se fala ("mil e duzentos reais", "quarenta por cento"). D\xEA sua opini\xE3o e, quando fizer sentido, termine com uma pergunta curta que avance a conversa. Se ele pedir um briefing, resuma em no m\xE1ximo 45 segundos de fala: o que mais mexe no MRR primeiro. Se ele s\xF3 estiver pensando em voz alta, discuta a ideia com ele: concorde s\xF3 quando fizer sentido e aponte o problema com clareza quando houver. A\xE7\xF5es que mudam algo s\xF3 depois de ele confirmar com clareza; para o que exige bot\xE3o (confirma\xE7\xE3o), diga "deixei o bot\xE3o na tela".`;
var TOOLS = [
  DADOS_TOOL,
  WEB_TOOL,
  { name: "ver_financeiro", description: "Financeiro da Synapsa (s\xF3 leitura): saldo do Inter, resultado do m\xEAs, MRR, contas a pagar e a receber, alertas, DRE, indicadores e proje\xE7\xE3o de 36 meses em 3 cen\xE1rios com o m\xEAs em que cada um bate a meta de MRR.", input_schema: { type: "object", properties: {} } },
  { name: "ver_crm", description: "CRM da Synapsa (s\xF3 leitura): KPIs do funil, etapas, oportunidades a explorar, reuni\xF5es de hoje e pr\xF3ximas, leads parados e follow-ups. Sem telefone nem e-mail.", input_schema: { type: "object", properties: { atualizar: { type: "boolean", description: "Ignora o cache de 60 s." } } } },
  { name: "propor_crm", description: "Prop\xF5e uma escrita no CRM e pede confirma\xE7\xE3o ao Felipe. N\xC3O executa. Opera\xE7\xF5es: criar_lead (dados: name, lead_type = psicologo_individual|clinica|parceiro, phone, origin = instagram|whatsapp|landing_page|indicacao|evento|linkedin|facebook_meta|google|parceria|outbound|outro, classification opcional frio|morno|quente|super_quente); mover_etapa (dados: lead_id, status = novo_lead|contato_feito|reuniao_agendada|reuniao_realizada|em_teste|negociacao|cliente_ativo|perdido|pausado; se perdido, loss_reason {reasons[], details}); registrar_atividade (dados: lead_id, type = enviar_mensagem|ligar|agendar_reuniao|followup, scheduled_date AAAA-MM-DD, scheduled_time HH:MM, observations opcional); agendar_reuniao (dados: lead_id, title, scheduled_at ISO com fuso, channel/notes_before/duration_minutes opcionais). lead_id vem de ver_crm.", input_schema: { type: "object", properties: { op: { type: "string", enum: [...CRM_OPS] }, dados: { type: "object" }, resumo: { type: "string", description: "R\xF3tulo curto do bot\xE3o, ex.: 'Cadastrar lead TESTE'." } }, required: ["op", "dados", "resumo"] } },
  { name: "ver_seo", description: "SEO da Synapsa (s\xF3 leitura): Search Console (cliques, impress\xF5es, posi\xE7\xE3o, buscas, p\xE1ginas e perfis de psic\xF3logos do diret\xF3rio synapsa.chat, oportunidades) e Google Analytics 4 (visitas, pessoas, engajamento, canais, p\xE1ginas de entrada, eventos-chave), \xFAltimos 28 dias contra os 28 anteriores.", input_schema: { type: "object", properties: {} } },
  { name: "ver_instagram", description: "Fila e hist\xF3rico de posts do Instagram da Synapsa: o que espera sua aprova\xE7\xE3o, o que foi aprovado, publicado ou rejeitado, tema, pilar e legenda.", input_schema: { type: "object", properties: {} } },
  { name: "ver_planejamento", description: "Planejamento semanal: posts por dia, tarefas e subtarefas, respons\xE1vel (Felipe Dalpra, Cassio, Felipe Augusto), status e taxa de conclus\xE3o, com hist\xF3rico das semanas.", input_schema: { type: "object", properties: { semana: { type: "string", description: "Segunda-feira da semana (AAAA-MM-DD). Omita para a semana atual." } } } },
  { name: "ver_prospeccao", description: "Prospec\xE7\xE3o de psic\xF3logos e cl\xEDnicas: totais por etapa e os melhores prospects para abordar. Sem telefone nem e-mail.", input_schema: { type: "object", properties: {} } },
  { name: "planejar", description: "P\xF5e um post ou uma tarefa na semana atual do planejamento. Interno e revers\xEDvel; executa direto. dia: 0 segunda a 6 domingo (s\xF3 para post).", input_schema: { type: "object", properties: { titulo: { type: "string" }, tipo: { type: "string", enum: ["post", "tarefa"] }, dia: { type: "integer" }, formato: { type: "string", description: "reel, carrossel, est\xE1tico, stories\u2026" }, responsavel: { type: "string", enum: ["Felipe Dalpra", "Cassio", "Felipe Augusto"] } }, required: ["titulo"] } },
  { name: "listar_planos", description: "Planos prontos por equipe (id, equipe, t\xEDtulo, objetivo, passos).", input_schema: { type: "object", properties: {} } },
  { name: "lancar_plano", description: "Lan\xE7a um plano pronto: os agentes dele come\xE7am na hora. Executa direto.", input_schema: { type: "object", properties: { plano_id: { type: "string" } }, required: ["plano_id"] } },
  { name: "visao_geral", description: "Estado atual: MRR e meta, funil (pode ser nulo), fila de propostas, agentes trabalhando/pausados, integra\xE7\xF5es, atividade recente, bot\xE3o de emerg\xEAncia.", input_schema: { type: "object", properties: {} } },
  { name: "ver_agente", description: "Ficha de um agente (miss\xE3o, m\xE9trica, o que faz sozinho, o que prop\xF5e) mais estado atual e propostas dele na fila.", input_schema: { type: "object", properties: { agent_id: { type: "string" } }, required: ["agent_id"] } },
  { name: "listar_propostas", description: "Propostas pendentes na fila, ordenadas por impacto em reais, com texto pronto.", input_schema: { type: "object", properties: {} } },
  { name: "dar_tarefa", description: "Manda um agente trabalhar numa tarefa. Executa na hora.", input_schema: { type: "object", properties: { agent_id: { type: "string" }, tarefa: { type: "string" } }, required: ["agent_id", "tarefa"] } },
  { name: "pausar_agente", description: "Pausa um agente. Executa na hora.", input_schema: { type: "object", properties: { agent_id: { type: "string" } }, required: ["agent_id"] } },
  { name: "retomar_agente", description: "Retoma um agente pausado. Executa na hora.", input_schema: { type: "object", properties: { agent_id: { type: "string" } }, required: ["agent_id"] } },
  { name: "rodar_rotina_do_dia", description: "Dispara a rotina di\xE1ria (Guardi\xE3o, Financeiro, M\xEDdia Paga e, por \xFAltimo, o briefing do Chief).", input_schema: { type: "object", properties: {} } },
  { name: "pedir_confirmacao", description: "Pede ao Felipe que confirme uma a\xE7\xE3o de impacto. N\xC3O executa. A a\xE7\xE3o roda s\xF3 se ele clicar em confirmar.", input_schema: { type: "object", properties: { acao: { type: "string", enum: ["parar_tudo", "retomar_tudo", "aprovar_baixo_risco"] } }, required: ["acao"] } }
];
var CONFIRM = {
  parar_tudo: { label: "Parar tudo", action: { type: "kill_on" } },
  retomar_tudo: { label: "Retomar tudo", action: { type: "kill_off" } },
  aprovar_baixo_risco: { label: "Aprovar as de baixo risco", action: { type: "approve_low_risk" } }
};
var agentList = () => AGENTS.map((a) => `${a.id} = ${a.name}`).join("; ");
function overview(brain2, integrations) {
  const s2 = brain2.snapshot(integrations);
  const pend = s2.proposals.filter((p) => p.status === "pendente");
  return {
    agora: new Date(s2.now).toISOString(),
    botao_de_emergencia_ligado: s2.kill,
    metas: { mrr: s2.metrics.mrr, funil: s2.metrics.funil, custo_ia: { mes_brl: s2.metrics.llmSpentMonthBrl, teto_brl: s2.metrics.llmCapMonthlyBrl } },
    fins_de_desconto: s2.metrics.descontos,
    fila: { pendentes: pend.length, fora_do_teto: s2.overflow, top: pend.slice(0, 8).map((p) => ({ id: p.id, agente: p.agentId, titulo: p.title, impacto_brl: p.impactoBrl, risco: p.risk, canal: p.channel })) },
    agentes: Object.fromEntries(Object.entries(s2.runtime).filter(([, r]) => r.status !== "ocioso" || r.runsToday > 0).map(([id, r]) => [id, { status: r.status, ultima_acao: r.lastAction, execucoes_hoje: r.runsToday }])),
    integracoes: s2.integrations.map((i) => ({ nome: i.name, estado: i.state, detalhe: i.detail })),
    atividade_recente: s2.activity.slice(0, 12).map((a) => ({ quem: a.agentId, texto: a.text, tom: a.tone }))
  };
}
function llmChat(brain2, integrations, cfg, fallback, fetchFn = fetch, env = {}) {
  return async (text, opts = {}) => {
    const voz = opts.voz === true;
    const history = rows(brain2.db, "select role, text from chat order by id desc limit 12").reverse();
    const messages = [...history.map((h) => ({ role: h.role === "voce" ? "user" : "assistant", content: h.text })), { role: "user", content: text }];
    const merged = [];
    for (const m of messages) {
      const last = merged.at(-1);
      if (last && last.role === m.role && typeof last.content === "string" && typeof m.content === "string") last.content += `
${m.content}`;
      else merged.push({ ...m });
    }
    if (merged[0]?.role === "assistant") merged.shift();
    const spent = brain2.metrics();
    if (spent.llmSpentMonthBrl >= spent.llmCapMonthlyBrl) {
      const r = await fallback(text);
      return { ...r, text: `${r.text}

(Teto mensal de IA atingido: respondi por regras.)` };
    }
    let confirm;
    const agentOf = (id) => {
      const a = AGENTS.find((x) => x.id === id);
      if (!a) throw new Error(`Agente desconhecido: ${String(id)}. V\xE1lidos: ${agentList()}`);
      return a;
    };
    const exec = (a) => applyAction(brain2, a);
    try {
      const { text: out, cost } = await toolLoop(
        cfg,
        { system: `${SYSTEM}${voz ? SYSTEM_VOZ : ""}

Agora \xE9 ${new Date(brain2.clock()).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "full", timeStyle: "short" })}. Agentes (id = nome): ${agentList()}.`, messages: merged, tools: TOOLS, maxTokens: voz ? 500 : 1100, maxRounds: voz ? 6 : 8 },
        async (name, input) => {
          switch (name) {
            case "consultar_dados":
              return cap(await consultarDados({ brain: brain2, env, fetchFn }, String(input.fonte), { dias: Number(input.dias) || void 0, atualizar: input.atualizar === true, filtros: typeof input.filtros === "object" && input.filtros ? input.filtros : void 0, pagina: Number(input.pagina) || void 0 }));
            case "pesquisar_web":
              return await pesquisarWeb(cfg, String(input.pergunta ?? ""), fetchFn).then((w) => `${w.texto}

Fontes:
${w.fontes.map((f) => `- ${f.titulo}: ${f.url}`).join("\n")}`);
            case "ver_financeiro": {
              const f = finPainel(brain2.db, brain2.clock());
              const { mrrSerie: _m, ...ind } = f.indicadores;
              return cap({
                hoje: f.hoje,
                kpis: f.kpis,
                alertas: f.alertas.map((a) => ({ tom: a.tom, titulo: a.titulo, detalhe: a.detalhe })),
                a_pagar: f.aPagar.slice(0, 10).map((c2) => ({ descricao: c2.descricao, vencimento: c2.vencimento, valor: c2.valor, status: c2.status, categoria: c2.categoria })),
                a_receber: f.aReceber.slice(0, 10).map((c2) => ({ descricao: c2.descricao, vencimento: c2.vencimento, valor: c2.valor, status: c2.status })),
                dre: f.dre,
                entradas_saidas_6_meses: f.serie,
                despesas_por_categoria: f.despesasPorCategoria,
                indicadores: ind,
                premissas: f.premissas,
                projecao: f.projecao.cenarios.map((c2) => ({ cenario: c2.id, novos_por_mes: c2.novosPorMes, churn: c2.churn, mes_da_meta: c2.mesDaMeta, mrr_em_12_meses: c2.mrr[11], mrr_em_36_meses: c2.mrr[35], caixa_em_12_meses: c2.saldo[11], caixa_em_36_meses: c2.saldo[35] }))
              });
            }
            case "ver_crm": {
              const c2 = await crmPainel(env, brain2.clock(), fetchFn, { atualizar: input.atualizar === true });
              if (c2.indisponivel) return `CRM indispon\xEDvel: ${c2.indisponivel}`;
              const lead = (l) => ({ lead_id: l.id, nome: l.nome, etapa: l.etapa, classificacao: l.classificacao, dias_sem_contato: l.diasSemContato, proxima_acao: l.proximaAcao, motivo: l.motivo });
              const reu = (r) => ({ lead_id: r.leadId, lead: r.lead, quando: r.quando, status: r.status, canal: r.canal });
              return cap({ kpis: c2.kpis, etapas: c2.etapas, origem: c2.origem, oportunidades: c2.oportunidades.slice(0, 8).map(lead), parados: c2.parados.slice(0, 8).map(lead), followups: c2.followups.slice(0, 8).map(lead), reunioes_hoje: c2.reunioesHoje.map(reu), reunioes_proximas: c2.reunioesProximas.slice(0, 8).map(reu), reunioes_sem_status: c2.reunioesSemStatus.length, acoes: c2.acoes.slice(0, 6) });
            }
            case "propor_crm": {
              const op = String(input.op);
              if (!CRM_OPS.includes(op)) throw new Error("Opera\xE7\xE3o desconhecida.");
              const dados = input.dados && typeof input.dados === "object" && !Array.isArray(input.dados) ? input.dados : {};
              const erros = validarProposta(op, dados);
              if (erros.length) return `O CRM recusaria isso: ${erros.slice(0, 6).join("; ")}. Pergunte ao Felipe o que falta; n\xE3o invente.`;
              confirm = { label: String(input.resumo ?? "Confirmar no CRM").slice(0, 60), action: { type: "crm", op, dados, chave: crypto.randomUUID() } };
              return "Confirma\xE7\xE3o pedida ao Felipe. Nada foi gravado. Diga em uma frase o que vai acontecer e espere o clique.";
            }
            case "ver_seo":
              return cap(verSeo(brain2, env), 14e3);
            case "ver_instagram":
              return cap(verInstagram(brain2, env));
            case "ver_planejamento":
              return cap(verPlanejamento(brain2, typeof input.semana === "string" ? input.semana : void 0));
            case "ver_prospeccao":
              return cap(verProspeccao(brain2));
            case "planejar":
              return planejar(brain2, { titulo: String(input.titulo ?? ""), tipo: String(input.tipo ?? "tarefa"), dia: Number.isInteger(input.dia) ? Number(input.dia) : void 0, formato: String(input.formato ?? ""), responsavel: String(input.responsavel ?? "") });
            case "listar_planos":
              return JSON.stringify(PLAYBOOKS.map((p) => ({ id: p.id, equipe: p.team, titulo: p.titulo, objetivo: p.objetivo, passos: p.passos.map((s2) => `${s2.agentId}: ${s2.titulo}`) })));
            case "lancar_plano":
              return exec({ type: "playbook", id: String(input.plano_id ?? "") });
            case "visao_geral":
              return JSON.stringify(overview(brain2, integrations()));
            case "ver_agente": {
              const a = agentOf(input.agent_id);
              const s2 = brain2.snapshot([]);
              return JSON.stringify({ id: a.id, nome: a.name, missao: a.mission, metrica: a.metric, faz_sozinho: a.auto, propoe: a.aprova, so_o_felipe: a.humano, estado: s2.runtime[a.id], na_fila: s2.proposals.filter((p) => p.agentId === a.id && p.status === "pendente").map((p) => p.title) });
            }
            case "listar_propostas":
              return JSON.stringify(brain2.snapshot([]).proposals.filter((p) => p.status === "pendente").map((p) => ({ id: p.id, agente: p.agentId, titulo: p.title, por_que: p.why, texto_pronto: p.draft, impacto_brl: p.impactoBrl, risco: p.risk, canal: p.channel })));
            case "dar_tarefa":
              return exec({ type: "task", agentId: agentOf(input.agent_id).id, task: String(input.tarefa ?? "") });
            case "pausar_agente":
              return exec({ type: "pause", agentId: agentOf(input.agent_id).id });
            case "retomar_agente":
              return exec({ type: "resume", agentId: agentOf(input.agent_id).id });
            case "rodar_rotina_do_dia":
              return exec({ type: "daily" });
            case "pedir_confirmacao": {
              const c2 = CONFIRM[String(input.acao)];
              if (!c2) throw new Error("A\xE7\xE3o desconhecida.");
              confirm = c2;
              return "Confirma\xE7\xE3o pedida ao Felipe. Explique em uma frase o que vai acontecer e espere o clique.";
            }
            default:
              throw new Error(`Ferramenta desconhecida: ${name}`);
          }
        },
        fetchFn
      );
      run(brain2.db, "insert into agent_runs (agent_id, task, status, requested_by, created_at, finished_at, cost_brl, result) values ('jarvis', 'Conversa com o Jarvis', 'done', 'voce', ?, ?, ?, 'chat')", brain2.clock(), brain2.clock(), cost);
      run(brain2.db, "insert into chat (role, text, at) values ('voce', ?, ?)", text, brain2.clock());
      run(brain2.db, "insert into chat (role, text, at) values ('jarvis', ?, ?)", out, brain2.clock());
      brain2.emit("change");
      return { text: out || "Feito.", confirm };
    } catch (e) {
      if (e instanceof BrainError) return { text: e.message };
      const r = await fallback(text);
      return { ...r, text: `${r.text}

(N\xE3o consegui falar com a IA agora: ${e instanceof Error ? e.message.slice(0, 90) : "erro"}. Respondi por regras.)` };
    }
  };
}

// packages/core/src/runner.ts
var Runner = class {
  constructor(brain2, env, thinker) {
    this.brain = brain2;
    this.env = env;
    this.thinker = thinker;
    brain2.on("queued", (id) => void this.execute(id));
    brain2.on("daily-requested", () => void this.runDaily());
    brain2.on("playbook-requested", (id) => void this.runPlaybook(id));
  }
  inflight = /* @__PURE__ */ new Map();
  /** Espera tudo que está rodando terminar (usado em testes e no desligamento). */
  async idle() {
    while (this.inflight.size) await Promise.allSettled([...this.inflight.values()]);
  }
  /** Executa a tarefa. Se já está rodando (o evento "queued" dispara sozinho), devolve a mesma promessa, para quem espera de fato esperar. */
  execute(runId) {
    const cur = this.inflight.get(runId);
    if (cur) return cur;
    const p = this.doExecute(runId).finally(() => this.inflight.delete(runId));
    this.inflight.set(runId, p);
    return p;
  }
  async doExecute(runId) {
    const { brain: brain2 } = this;
    const r = row(brain2.db, "select id, agent_id, task, status, requested_by from agent_runs where id = ?", runId);
    if (!r || r.status !== "queued") return;
    const agent = AGENTS.find((a) => a.id === r.agent_id);
    if (!agent) return;
    run(brain2.db, "update agent_runs set status = 'running' where id = ?", runId);
    const ctx = { brain: brain2, env: this.env, now: brain2.clock() };
    try {
      const routine = HANDLERS[agent.id];
      const useThinker = this.thinker && !(routine && r.requested_by === "rotina");
      const out = useThinker ? await this.thinker(agent, r.task, ctx) : routine ? await routine(ctx) : { status: "blocked", result: `${agent.name} precisa raciocinar com a IA. Falta a OPENAI_API_KEY nos secrets. Sua tarefa ficou registrada.` };
      if (brain2.killed()) return;
      let made = 0;
      let barred = 0;
      for (const p of out.proposals ?? []) brain2.addProposal(p) ? made++ : barred++;
      const extra = made ? ` ${made} ${made === 1 ? "proposta nova" : "propostas novas"} na sua fila.` : "";
      if (out.entrega) run(brain2.db, "insert into deliverables (run_id, agent_id, title, body, at) values (?, ?, ?, ?, ?)", runId, agent.id, r.task.split("\n")[0].slice(0, 160), out.entrega.slice(0, 2e4), brain2.clock());
      brain2.finishRun(runId, { status: out.status, result: out.result + extra, costBrl: out.costBrl });
      brain2.log(agent.id, out.result + extra, out.status === "blocked" ? "alerta" : "ok");
      void barred;
    } catch (e) {
      const msg2 = e instanceof Error ? e.message : String(e);
      brain2.finishRun(runId, { status: "error", error: msg2.slice(0, 300) });
      if (!brain2.killed()) brain2.log(agent.id, `Falhou: ${msg2.slice(0, 160)}`, "alerta");
    }
  }
  /** Rotina diária: os três coletores em paralelo e, por último, o briefing do Chief. */
  async runDaily() {
    const { brain: brain2 } = this;
    if (brain2.killed()) return;
    brain2.setPolicy("last_daily", brtDay(brain2.clock()));
    const queue = (agent, task) => {
      try {
        return this.execute(brain2.assignTask(agent, task, "rotina"));
      } catch {
        return Promise.resolve();
      }
    };
    await Promise.all([queue("guardiao", "Rotina di\xE1ria: fechar o MRR e checar fins de desconto"), queue("financeiro", "Rotina di\xE1ria: comparar o MRR com a meta"), queue("midia", "Rotina di\xE1ria: ler an\xFAncios e Instagram")]);
    await queue("chief", "Rotina di\xE1ria: montar o briefing");
  }
  /** Lança um plano pronto: os passos rodam em paralelo e, se houver síntese, o Chief junta tudo por último. */
  async runPlaybook(id) {
    const { brain: brain2 } = this;
    const pb = playbookById(id);
    if (!pb || brain2.killed()) return;
    const by = `plano:${pb.id}`;
    const queue = (agent, task) => {
      try {
        return this.execute(brain2.assignTask(agent, task, by));
      } catch {
        return Promise.resolve();
      }
    };
    await Promise.all(pb.passos.map((s2) => queue(s2.agentId, `${pb.titulo}: ${s2.titulo}

${s2.instrucao}`)));
    if (pb.sintese && !brain2.killed()) {
      await queue("chief", `${pb.titulo}: s\xEDntese

Objetivo do plano: ${pb.objetivo}
Leia as entregas dos agentes (consultar_dados, fonte "entregas") e escreva a leitura \xFAnica para o Felipe: o que descobrimos, o que decidir agora e as 3 a\xE7\xF5es de maior impacto em R$, com n\xFAmeros. Entregue pelo relatorio, com "entrega" completa.`);
    }
  }
  /** Roda a rotina do dia se já passou das 7h de Brasília e ainda não rodou hoje. Devolve true se disparou. */
  tick() {
    const hourBrt = (new Date(this.brain.clock()).getUTCHours() + 21) % 24;
    const last = this.brain.policy("last_daily", null);
    if (hourBrt >= 7 && last !== brtDay(this.brain.clock()) && !this.brain.killed()) {
      void this.runDaily();
      return true;
    }
    return false;
  }
  /** Depois de um reinício: o que ficou "rodando" há mais de staleMs falhou; o que ficou na fila volta a rodar. */
  recover(staleMs = 15 * 6e4) {
    const { brain: brain2 } = this;
    if (brain2.killed()) return { failed: 0, resumed: 0 };
    const now = brain2.clock();
    const stale = rows(brain2.db, "select id, agent_id from agent_runs where status = 'running' and created_at < ?", now - staleMs);
    for (const r of stale) brain2.finishRun(r.id, { status: "error", error: "Interrompida por rein\xEDcio do Brain" });
    const queued = rows(brain2.db, "select id from agent_runs where status = 'queued'");
    for (const r of queued) void this.execute(r.id);
    return { failed: stale.length, resumed: queued.length };
  }
  /** Servidor local: confere a cada minuto. Na Cloudflare quem chama tick/recover é o alarme do Durable Object. */
  start(checkEveryMs = 6e4) {
    const first = setTimeout(() => this.tick(), 5e3);
    const t = setInterval(() => this.tick(), checkEveryMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }
};

// packages/core/src/seed.ts
function seedKnownFacts(brain2) {
  const has = row(brain2.db, "select count(*) as n from subscriptions")?.n ?? 0;
  if (has > 0) return;
  const now = brain2.clock();
  const ins = (source, id, label, list, eff, ends) => run(brain2.db, "insert into subscriptions (source, external_id, label, list_price_brl, effective_price_brl, discount_ends_at, status, origin, updated_at) values (?, ?, ?, ?, ?, ?, 'active', 'informado', ?)", source, id, label, list, eff, ends, now);
  ins("stripe", "informado-stripe-1", "Assinatura Stripe 1 (informada)", 119, 49, "2027-01-23T12:00:00-03:00");
  ins("stripe", "informado-stripe-2", "Assinatura Stripe 2 (informada)", 119, 49, "2027-01-23T12:00:00-03:00");
  ins("stripe", "informado-stripe-3", "Assinatura Stripe 3 (informada)", 119, 49, "2027-03-02T12:00:00-03:00");
  ins("pix", "pix-mirelle", "Mirelle (Pix)", 119, 49, null);
  ins("pix", "pix-antera", "Cl\xEDnica Antera (Pix)", 300, 300, null);
}

// packages/core/src/thinker.ts
var RISKS = ["baixo", "medio", "alto"];
var CHANNELS = ["whatsapp", "email", "linkedin", "instagram", "tarefa", "interno"];
var systemFor = (a) => `Voc\xEA \xE9 "${a.name}", um agente do Synapsa Brain, que opera a Synapsa (plataforma de IA para psic\xF3logos no Brasil). Quem decide \xE9 o Felipe: voc\xEA nunca envia nada, s\xF3 prepara e prop\xF5e.

Sua miss\xE3o: ${a.mission}
M\xE9trica que voc\xEA move: ${a.metric}
Voc\xEA faz sozinho: ${a.auto.join("; ") || "nada"}.
Voc\xEA prop\xF5e e espera a aprova\xE7\xE3o: ${a.aprova.join("; ") || "nada"}.
S\xF3 o Felipe faz: ${a.humano.join("; ") || "nada"}.
Limites: ${a.limits}
Subagentes de apoio (voc\xEA os usa como etapas de racioc\xEDnio): ${a.subs.map((s2) => `${s2.name} (${s2.does})`).join("; ")}.

Regras inviol\xE1veis:
- Nunca ofere\xE7a desconto, promo\xE7\xE3o ou pre\xE7o diferente.
- Nunca prometa resultado cl\xEDnico a pacientes nem cite dado cl\xEDnico de ningu\xE9m.
- Mensagem externa precisa de contact_ref e respeita 3 dias entre contatos e consentimento. A Conformidade barra o que violar.
- S\xF3 use fatos das ferramentas. Voc\xEA TEM acesso a Stripe, Meta Ads, Instagram e ao CRM (s\xF3 leitura) pela ferramenta consultar_dados: consulte antes de dizer que falta dado. Sem dado de verdade, diga o que falta e proponha como conseguir.
- Texto em portugu\xEAs do Brasil, direto e curto.
Quando a tarefa pede um documento (pesquisa, plano, roteiro, an\xE1lise), escreva-o inteiro no campo "entrega" do relatorio, n\xE3o s\xF3 um resumo. Use pesquisar_web com parcim\xF4nia (cada chamada custa) e s\xF3 para mercado, concorrentes, pre\xE7os e tend\xEAncias, nunca para levantar dados pessoais de pessoas espec\xEDficas.
Termine sempre chamando "relatorio" com 1 ou 2 frases do que fez.`;
var TOOLS2 = (a) => [
  DADOS_TOOL,
  WEB_TOOL,
  { name: "contexto", description: "Estado atual do Brain (MRR, fila, agentes, integra\xE7\xF5es, atividade).", input_schema: { type: "object", properties: {} } },
  ...HANDLERS[a.id] ? [{ name: "rodar_rotina", description: "Executa a rotina de c\xF3digo deste agente (leituras reais e c\xE1lculos).", input_schema: { type: "object", properties: {} } }] : [],
  {
    name: "propor",
    description: "Deixa uma proposta na fila do Felipe. Passa pela Conformidade antes.",
    input_schema: {
      type: "object",
      properties: {
        titulo: { type: "string" },
        por_que: { type: "string" },
        texto_pronto: { type: "string", description: "Mensagem pronta para o Felipe copiar. Vazio se n\xE3o for mensagem." },
        impacto_brl: { type: "number", description: "Impacto estimado em reais por ano. 0 se n\xE3o for med\xEDvel." },
        risco: { type: "string", enum: RISKS },
        canal: { type: "string", enum: CHANNELS },
        contact_ref: { type: "string" },
        email_para: { type: "string", description: "S\xF3 para e-mail que o Brain deve enviar depois do OK do Felipe: endere\xE7o do destinat\xE1rio. O corpo vai em texto_pronto." },
        assunto: { type: "string", description: "Assunto do e-mail (junto com email_para)." },
        imagem_url: { type: "string", description: "S\xF3 para post no Instagram que o Brain deve publicar depois do OK: link https p\xFAblico da imagem. A legenda vai em texto_pronto. Sem imagem, n\xE3o preencha." }
      },
      required: ["titulo", "por_que", "risco", "canal"]
    }
  },
  { name: "relatorio", description: "Encerra a tarefa. resumo: 1 ou 2 frases. entrega: o documento completo que o Felipe pediu (pesquisa, plano, texto), quando a tarefa pede um produto.", input_schema: { type: "object", properties: { resumo: { type: "string" }, entrega: { type: "string", description: "Documento completo, em texto com t\xEDtulos curtos e listas." } }, required: ["resumo"] } }
];
function makeThinker(cfg, fetchFn = fetch) {
  return async (agent, task, ctx) => {
    const spent = ctx.brain.metrics();
    if (spent.llmSpentMonthBrl >= spent.llmCapMonthlyBrl) return { status: "blocked", result: `Teto mensal de IA atingido (${spent.llmSpentMonthBrl} de ${spent.llmCapMonthlyBrl} reais). ${agent.name} s\xF3 volta no m\xEAs que vem ou se voc\xEA subir o teto.` };
    const proposals = [];
    let report = "";
    let entrega = "";
    let extraCost = 0;
    let routine = "";
    const { cost, text } = await toolLoop(
      cfg,
      { system: systemFor(agent), messages: [{ role: "user", content: `Tarefa: ${task}` }], tools: TOOLS2(agent), maxTokens: 3e3, maxRounds: 12 },
      async (name, input) => {
        switch (name) {
          case "consultar_dados": {
            const t = JSON.stringify(await consultarDados({ brain: ctx.brain, env: ctx.env, fetchFn }, String(input.fonte), { dias: Number(input.dias) || void 0, atualizar: input.atualizar === true, filtros: typeof input.filtros === "object" && input.filtros ? input.filtros : void 0, pagina: Number(input.pagina) || void 0 }));
            return t.length > 12e3 ? `${t.slice(0, 12e3)}\u2026(cortado)` : t;
          }
          case "pesquisar_web": {
            const w = await pesquisarWeb(cfg, String(input.pergunta ?? ""), fetchFn);
            extraCost += w.costBrl;
            return `${w.texto}

Fontes:
${w.fontes.map((f) => `- ${f.titulo}: ${f.url}`).join("\n")}`;
          }
          case "contexto":
            return JSON.stringify(overview(ctx.brain, []));
          case "rodar_rotina": {
            const h = HANDLERS[agent.id];
            if (!h) throw new Error("Este agente n\xE3o tem rotina de c\xF3digo.");
            const r = await h(ctx);
            proposals.push(...r.proposals ?? []);
            routine = r.result;
            return r.result;
          }
          case "propor": {
            const risk = RISKS.includes(input.risco) ? input.risco : "medio";
            const channel = CHANNELS.includes(input.canal) ? input.canal : "interno";
            proposals.push({
              agentId: agent.id,
              kind: "proposta_agente",
              title: String(input.titulo ?? "").slice(0, 160),
              why: String(input.por_que ?? "").slice(0, 600),
              draft: input.texto_pronto ? String(input.texto_pronto).slice(0, 1500) : null,
              impactoBrl: Math.max(0, Number(input.impacto_brl) || 0),
              risk,
              channel,
              contactRef: input.contact_ref ? String(input.contact_ref) : null,
              payload: {
                tarefa: task,
                ...channel === "email" && input.email_para && input.assunto ? { envio: { tipo: "email", para: String(input.email_para).slice(0, 200), assunto: String(input.assunto).slice(0, 200) } } : {},
                ...channel === "instagram" && input.imagem_url ? { envio: { tipo: "instagram", imagemUrl: String(input.imagem_url).slice(0, 500) } } : {}
              }
            });
            return "Proposta registrada para a Conformidade.";
          }
          case "relatorio":
            report = String(input.resumo ?? "");
            entrega = input.entrega ? String(input.entrega).slice(0, 2e4) : "";
            return "Relat\xF3rio registrado.";
          default:
            throw new Error(`Ferramenta desconhecida: ${name}`);
        }
      },
      fetchFn
    );
    return { status: "done", result: report || routine || text || "Concluiu.", proposals, costBrl: cost + extraCost, ...entrega ? { entrega } : {} };
  };
}

// apps/edge/src/brain-do.ts
import { DurableObject } from "cloudflare:workers";

// apps/edge/src/do-db.ts
function doDb(storage, schema) {
  const sql = storage.sql;
  const db = {
    exec(q) {
      for (const stmt of q.split(";")) if (stmt.trim()) sql.exec(stmt).toArray();
    },
    prepare(q) {
      const isInsert = /^\s*insert\b/i.test(q);
      return {
        all: (...p) => sql.exec(q, ...p).toArray(),
        get: (...p) => sql.exec(q, ...p).toArray()[0],
        run: (...p) => {
          sql.exec(q, ...p).toArray();
          return isInsert ? { lastInsertRowid: Number(sql.exec("select last_insert_rowid() as id").toArray()[0].id) } : {};
        }
      };
    },
    transaction: (fn) => storage.transactionSync(fn)
  };
  db.exec(schema);
  return db;
}

// apps/edge/src/brain-do.ts
var strings = (env) => Object.fromEntries(Object.entries(env).filter((e) => typeof e[1] === "string"));
var BrainDO = class extends DurableObject {
  brain;
  runner;
  handle;
  constructor(ctx, env) {
    super(ctx, env);
    const e = strings(env);
    const brain2 = new Brain(doDb(ctx.storage, SCHEMA));
    brain2.reviewer = complianceReviewer;
    const jarvisCfg = llmConfig(e, "jarvis");
    const agentCfg = llmConfig(e, "agent");
    brain2.llm = jarvisCfg !== null;
    this.runner = new Runner(brain2, e, agentCfg ? makeThinker(agentCfg) : void 0);
    seedKnownFacts(brain2);
    brain2.on("queued", () => void this.arm(6e4));
    brain2.on("prospeccao", () => void this.arm(2e4));
    const integrations = () => integrationsView(brain2.db, e, brain2.clock());
    const rules = ruleChat(brain2, integrations);
    const auth = createAuth(e, new LoginLimiter());
    this.brain = brain2;
    this.handle = createHandler({
      brain: brain2,
      env: e,
      authorize: auth.authorize,
      chat: jarvisCfg ? llmChat(brain2, integrations, jarvisCfg, rules, fetch, e) : rules,
      checkIntegrations: async () => void await runChecks(brain2.db, e, brain2.clock())
    });
  }
  async arm(ms2) {
    const cur = await this.ctx.storage.getAlarm();
    if (cur === null || cur > Date.now() + ms2) await this.ctx.storage.setAlarm(Date.now() + ms2);
  }
  async fetch(req) {
    return await this.handle(req) ?? new Response(JSON.stringify({ error: "n\xE3o encontrado" }), { status: 404, headers: { "content-type": "application/json" } });
  }
  /** Cron das 7h (Brasília) e alarmes: recupera o que ficou pendurado e roda a rotina do dia se for a hora. */
  async daily() {
    const rec = this.runner.recover();
    try {
      gerarRascunhos(this.brain);
    } catch {
    }
    try {
      await sincronizarGsc(this.brain, strings(this.env));
    } catch {
    }
    try {
      await sincronizarGa(this.brain, strings(this.env));
    } catch {
    }
    try {
      await publicarDevidos(this.brain, strings(this.env));
    } catch {
    }
    try {
      await liRotina(this.brain, strings(this.env));
    } catch {
    }
    try {
      await midiaRotina(this.brain, strings(this.env));
    } catch {
    }
    const started = this.runner.tick();
    await this.runner.idle();
    return { ...rec, started };
  }
  /** Dias úteis, 10h (Brasília): começa a busca do dia. Ler sites, CRM e rascunhos encadeiam sozinhos quando cada etapa termina. */
  async rotina() {
    const msg2 = await rodarRotina(this.brain, strings(this.env));
    await this.arm(2e4);
    return msg2;
  }
  async alarm() {
    await this.daily();
    const busy = this.brain.db.prepare("select count(*) as n from agent_runs where status in ('queued','running')").get();
    if (busy.n > 0) await this.arm(6e4);
    const rod = this.brain.db.prepare("select count(*) as n from prospect_runs where status = 'rodando'").get();
    if (rod.n > 0) {
      const r = await avancar(this.brain, strings(this.env)).catch(() => null);
      if (!r || r.pendentes > 0) await this.arm(3e4);
    }
  }
};

// apps/edge/src/index.ts
var brain = (env) => env.BRAIN.get(env.BRAIN.idFromName("brain"));
var index_default = {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return brain(env).fetch(req);
    const auth = createAuth(env);
    const headers = { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "content-security-policy": CSP, "x-content-type-options": "nosniff" };
    if (!auth.configured) return new Response("Login n\xE3o configurado: defina BRAIN_PASSWORD e SESSION_SECRET (wrangler secret put).", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
    if (!await auth.isAuthed(req)) return new Response(LOGIN_HTML, { status: 401, headers });
    const res = await env.ASSETS.fetch(req);
    const out = new Response(res.body, res);
    out.headers.set("content-security-policy", CSP);
    out.headers.set("cache-control", "no-store");
    out.headers.set("x-content-type-options", "nosniff");
    return out;
  },
  async scheduled(c2, env) {
    if (c2.cron === "0 13 * * 1-5") await brain(env).rotina();
    else await brain(env).daily();
  }
};
export {
  BrainDO,
  index_default as default
};
//# sourceMappingURL=index.js.map
