# Synapsa Brain

Sistema de agentes que opera a Synapsa. Os agentes **propõem**; só o Felipe aprova; só o Felipe envia.

Roda de dois jeitos com o mesmo código: **local** (seu computador, SQLite em arquivo) e **Cloudflare** (Worker + Durable Object com SQLite, atrás de senha).

## Rodar

Precisa de Node 22.13 ou mais novo.

```bash
npm install
cp apps/server/.env.example apps/server/.env.local   # preencha o que tiver; nada é obrigatório
npm start                                            # compila a Central e sobe tudo em http://localhost:8787
```

Para desenvolver com recarga automática: `npm run dev` (Central em http://localhost:5173, Brain em 8787).

Quer ver a fila e a atividade cheias de exemplo? Suba com `BRAIN_DEMO=1`.

Sem nenhuma chave, o Brain já funciona: fecha o MRR com os valores que você informou, avisa de fim de desconto, e o Jarvis responde por regras. Cada chave que você cola liga mais coisa:

| Variável (em `apps/server/.env.local`) | O que liga |
|---|---|
| `STRIPE_READ_KEY` | MRR pelo valor real com desconto, e as datas reais de fim de desconto |
| `META_SYSTEM_USER_TOKEN` | Gasto e leads por campanha, Instagram. Campanha com R$ 50+ sem lead em 7 dias vira proposta |
| `OPENAI_API_KEY` (+ `OPENAI_MODEL`, padrão `gpt-4.1`: confira o modelo da sua conta) | O Jarvis raciocina e usa ferramentas; os 20 agentes sem rotina de código passam a trabalhar. `ANTHROPIC_API_KEY` também funciona como alternativa |
| `RESEND_API_KEY`, `WHATSAPP_*`, `GOOGLE_*`, `BRAIN_RO_DATABASE_URL` | Entram nos testes de conexão. Ainda não há agente que dependa deles |

Depois de preencher, reinicie e abra **Integrações → Testar conexões**.

## O que existe

| Pasta | O que é |
|---|---|
| `apps/server` | O Brain local: API, banco SQLite, regras, Conformidade, runtime dos agentes, rotina das 7h, Jarvis (regras ou OpenAI/Anthropic), testes de conexão |
| `apps/edge` | O Brain na Cloudflare: Worker + Durable Object (SQLite), cron das 7h, login com senha |
| `apps/central` | A Central Synapsa (Vite + React): Comando com o Jarvis, Hoje, Agentes, Aprovações, Integrações. Sem Brain rodando, abre em modo demonstração |
| `packages/shared` | Elenco dos 24 agentes, tipos, o Jarvis por regras. Usado por todos |
| `packages/core` | O núcleo do Brain (banco, regras, Conformidade, agentes, Jarvis). Sem dependência de Node, roda no servidor local e no Cloudflare |

## Como os agentes trabalham

- **Com rotina de código** (funcionam sem chave de IA): Guardião de Dados, Financeiro, Mídia Paga (precisa do token da Meta) e Chief of Staff (briefing).
- **Os outros 20** raciocinam pela OpenAI a partir da ficha de cada um (missão, o que fazem sozinhos, o que só propõem, limites). Sem a chave, a tarefa fica registrada e travada, com o motivo na tela.
- **Rotina diária**: às 7h de Brasília (ou ao abrir o Brain depois das 7h, se o computador estava desligado), roda Guardião, Financeiro e Mídia Paga e, por último, o briefing do Chief. Peça também ao Jarvis: "rode a rotina do dia".
- Tudo que um agente quer mandar para fora vira **proposta**. Antes de chegar à fila passa pela **Conformidade**, em código.

## Regras que o código garante (todas testadas)

- Nada sai sozinho. Aprovar não envia: você copia o texto e manda pelo seu canal.
- Conformidade barra: promessa de resultado a pacientes, desconto ou promoção, dado clínico, urgência artificial, mensagem externa sem contato identificado, WhatsApp e e-mail sem consentimento, e contato com menos de 3 dias do anterior.
- Nenhum agente oferece desconto. Fim de desconto vira tarefa de contato para você, 30 dias antes.
- Botão de emergência: para os agentes, interrompe o que está rodando, bloqueia tarefas e aprovações. Ele existe no banco, não só na tela.
- Fila do dia: no máximo 15 propostas, ordenadas por impacto em reais.
- Teto mensal de IA (R$ 300 por padrão): ao atingir, o Jarvis volta para regras e os agentes param.
- Leituras externas só fazem `GET` (testado). Segredos só vivem no `.env.local` e nunca aparecem na tela, no banco nem nas chamadas à IA (testado).
- Local: o servidor só escuta `127.0.0.1`. Nuvem: login com senha, cookie assinado (HttpOnly, SameSite=Strict), 5 erros travam por 10 minutos. Nos dois, ordens vindas de outros sites são recusadas.
- Nenhum dado clínico de paciente entra no Brain.

## MRR

Soma Stripe (valor efetivo, com desconto) + assinaturas manuais + Pix. A plataforma é espelho e só entra na conciliação. Enquanto não há `STRIPE_READ_KEY`, as 3 assinaturas do Stripe são as que você informou (R$ 49 cada, descontos acabando em 23/01/2027 e 02/03/2027) e são substituídas pelas reais na primeira sincronização.

## Testes

```bash
npm run check    # tipos + todos os testes (núcleo, central, shared, servidor, edge)
```

## Deploy na Cloudflare

Só Cloudflare: um Worker serve a Central e a API, e um Durable Object guarda o banco (SQLite) e roda os agentes. Não usa Vercel nem Supabase.

```bash
npm install
npx wrangler login                                  # abre o navegador, uma vez
cd apps/edge
npx wrangler secret put BRAIN_PASSWORD              # a senha que você vai digitar para entrar
npx wrangler secret put SESSION_SECRET              # texto aleatório longo (ex.: openssl rand -base64 32)
npx wrangler secret put OPENAI_API_KEY              # o Jarvis e os 20 agentes que raciocinam
npx wrangler secret put STRIPE_READ_KEY             # chave restrita, só leitura
npx wrangler secret put META_SYSTEM_USER_TOKEN
cd ../.. && npm run deploy                          # compila a Central e publica
```

- Cada `secret put` pede o valor no terminal; ele nunca fica no repositório. Pule os que ainda não tem.
- O endereço sai como `synapsa-brain.<sua-conta>.workers.dev`. Para usar `brain.synapsa.chat`: Cloudflare, Workers, synapsa-brain, Settings, Domains & Routes, Add custom domain (o domínio precisa estar na sua Cloudflare).
- Sem `BRAIN_PASSWORD` e `SESSION_SECRET` o Brain recusa tudo (503). Não existe modo aberto na nuvem.
- A rotina diária roda às 7h de Brasília por cron (`0 10 * * *` UTC). Se um agente ficar preso por reinício, o alarme do Durable Object recupera em até 1 minuto.
- Logs: `npx wrangler tail`. Teste local do Worker: crie `apps/edge/.dev.vars` com `BRAIN_PASSWORD` e `SESSION_SECRET` e rode `npm run dev -w apps/edge`.
- O banco do Durable Object é separado do SQLite local: o que está no seu computador não sobe sozinho. Os fatos conhecidos (MRR de R$ 496) são recriados na primeira abertura.

## O que falta

1. Plataforma (`mvp-v2`): tabela de eventos e views de leitura `brain_*`, papel `brain_ro`. Sem isso, o funil e o Momento de Pagar não têm dados.
2. Worker executor separado, com as chaves de escrita, que só age em proposta aprovada.
3. Trocar o token da Meta por um só de leitura antes de existir qualquer executor.
4. Conferir contra a API real: `META_GRAPH_VERSION` (v23.0), os nomes das métricas do Instagram e o modelo/preço da OpenAI.
