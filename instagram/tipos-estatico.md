# Tipos de post estático (1 slide) da Synapsa

Cada tipo é um formato de ideia, não um tema. O tema nasce do pilar escolhido para o dia. Vale a regra de sempre: nada de promessa clínica, número sem fonte, depoimento inventado ou urgência. Todo estático termina a legenda com UM pedido de ação, de preferência comentar ou marcar uma colega.

Slide que serve: `foto` (frase forte sobre foto de pessoa), `dado` (número com fonte) ou `texto` com `fundo` "marca" ou "escuro". Sem `capa`, sem `cta`.

1. **Frase de colega.** Uma situação do consultório que todo psicólogo reconhece, escrita como desabafo curto. Ex.: "Ninguém te contou que atender é só metade do trabalho." Slide `texto` ou `foto`.
2. **Pergunta que provoca.** Uma única pergunta que força posição. A resposta, ou o raciocínio, vai na legenda. Ex.: "Agenda cheia é o mesmo que consultório saudável?"
3. **Dado único com fonte.** Um número de pesquisa publicada, grande, com quem publicou e o ano no slide. Sem fonte confiável, troque de tipo. Slide `dado`.
4. **Mito vs. realidade.** Uma crença comum da carreira desmontada em duas linhas: o mito riscado, a realidade embaixo. Ex.: "Psicólogo não precisa entender de preço."
5. **Bastidor da Synapsa.** Uma decisão ou aprendizado de quem constrói a plataforma. Só use fato que o contexto confirme; recurso que não existe leva selo `plano`. Sem número de usuários.
6. **Se eu começasse hoje.** Uma coisa que faria diferente nos primeiros pacientes. Em primeira pessoa do plural ou genérico ("quem começa hoje"), sem inventar história de pessoa real.
7. **Verdade desconfortável.** Algo que a profissão sabe e pouco fala, dito com cuidado e sem culpar quem lê. Ex.: "Boa clínica não paga sozinha as contas do consultório."
8. **Crescer não é X, é Y.** Redefine uma palavra da carreira. Ex.: "Crescer não é atender mais. É escolher melhor quem, como e quando."
9. **Isso ou aquilo.** Duas opções reais da rotina e a pergunta de qual a pessoa escolhe. Ex.: "Cobrar por sessão ou por pacote?" Convida a comentar A ou B.
10. **Micro-dica de uma linha.** UMA ação que dá para fazer hoje em 5 minutos. Sem lista e sem passo a passo. Ex.: "Revise hoje o horário que menos rende na sua agenda."
11. **Em que fase você está?** A jornada (Formação, Primeiros atendimentos, Crescimento, Consolidação, Novos mercados, Transição) em um slide, pedindo que comentem a fase. Cada fase tem um próximo problema.
12. **Quem cuida de quem cuida.** Autocuidado profissional do psicólogo (rotina, limite, descanso), sem tom clínico e sem prometer resultado.
13. **Data da profissão.** Uma data que importa para a categoria, com respeito e sem promoção. A frase homenageia ou convida à reflexão. Confirme a data antes de usar.
14. **Termo da carreira em uma linha.** Uma palavra do dia a dia da prática explicada de forma simples (ex.: supervisão, setting, contrato terapêutico, recibo, CNPJ). Em tema fiscal ou jurídico, não afirme regra sem fonte: explique o conceito e diga para checar com o contador ou o conselho.
15. **Pergunta para a comunidade.** Pede um relato curto. Ex.: "Qual foi a primeira coisa que você organizou no consultório?" A legenda reage ao que já é comum.
16. **Conta de cabeça.** Uma conta simples da prática, marcada como "exemplo ilustrativo" no próprio slide, para fazer a pessoa calcular o dela. Nunca apresente como dado de mercado.
17. **Princípio da Synapsa.** Uma crença da marca em uma frase (o psicólogo é o protagonista, a decisão clínica é dele, a evolução vem por fases). Mostra como pensamos, sem vender.
18. **Lyra em uma frase.** O que a Lyra faz e o que não faz (apoio ao paciente entre sessões; a decisão clínica continua sendo do psicólogo). Maturidade `existe`. Sem prometer resultado.
19. **Erro comum de quem abre consultório.** Um erro de gestão ou de rotina, dito sem culpa, com a saída em uma linha na legenda.
20. **Sinal de que é hora de…** Um sinal reconhecível de que a prática pede o próximo passo (cobrar mais, delegar, montar equipe, organizar o financeiro). Educativo: o sinal vale com ou sem Synapsa.

## Como escolher

Rode `node instagram/escolher.mjs` (com BRAIN_URL e IG_TOKEN). Ele diz o formato do dia e, se for estático, o tipo: o rodízio de 20 ajustado pelo que o Brain mediu (taxa de salvos, compartilhamentos e comentários por alcance). Tipo acima da mediana repete mais, abaixo repete menos, e os 6 últimos não voltam. Com poucos estáticos medidos, ele segue o rodízio fixo da data.

Se o tipo escolhido repetir tema ou ângulo recente do contexto, ou exigir fato que você não pode confirmar (tipos 3, 5, 13), pule para o próximo da lista. Registre no resumo final qual tipo usou.

**Importante para o Brain aprender:** no `post.json` de todo estático, escreva o campo `pilar` exatamente como o `escolher.mjs` devolve (`estático · <nome do tipo>`). É por esse campo que o desempenho de cada tipo é somado.
