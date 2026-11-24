import { utm } from "./utm";
// Sequência de 5 e-mails para psicólogos autônomos (abordagem fria), no posicionamento novo:
// ecossistema de desenvolvimento profissional do psicólogo, em cada fase da carreira (crescer, organizar a prática, evoluir com dados).
// NÃO falar de abandono, adesão ou acompanhamento entre sessões: esse não é o posicionamento da Synapsa.
// Sem desconto ou promoção: a conformidade do Brain barra, e o preço quem decide é o Felipe.

export const AUT_ESPERAS = [0, 2, 2, 3, 3] as const; // dias antes de cada e-mail, contados do anterior (o piso é o contato mínimo da política)
export const AUT_TOTAL = AUT_ESPERAS.length;
export const ASSINATURA = "Synapsa. Onde a prática evolui.";
export const SITE = "https://synapsa.com.br";
export const DIRETORIO = "https://synapsa.chat/psicologos";
export const WHATSAPP = "https://wa.me/5551991897471?text=Ol%C3%A1%2C%20Felipe!%20Recebi%20seu%20e-mail%20sobre%20a%20Synapsa.";

/** O que se sabe de cada psicólogo, vindo do Maps e do site dele. Nada aqui é inventado: o que falta vira texto genérico. */
export interface DadosAutonomo { nome: string; cidade: string | null; siteHost: string | null; whatsapp: boolean }

const frase = (n: string, t: string) => (n ? `${n}, ${t}` : t.charAt(0).toUpperCase() + t.slice(1));
const emCidade = (c: string | null) => (c ? ` em ${c}` : "");

export function montarAutonomo(d: DadosAutonomo, etapa: 1 | 2 | 3 | 4 | 5): { assunto: string; corpo: string } {
  const n = d.nome;
  const abre = n ? `Olá, ${n}.` : "Olá.";
  const fecha = `Abraço,\nFelipe\n${ASSINATURA}`;
  if (etapa === 1) return {
    assunto: frase(n, `uma ideia para a sua prática${emCidade(d.cidade)}`),
    corpo: `${abre}\n\nSou o Felipe, fundador da Synapsa. Vi o seu trabalho${emCidade(d.cidade)}${d.siteHost ? ` e o seu site (${d.siteHost})` : ""}, e achei que vale a conversa.\n\nA Synapsa é o ecossistema de desenvolvimento profissional do psicólogo: acompanha cada fase da carreira, de ser encontrado por novos pacientes a organizar a prática e evoluir com dados.\n\nPara começar, você cria uma conta gratuita e já recebe:\n\n- um perfil público, com a sua marca, para os pacientes te encontrarem;\n- agenda e formulário de entrada de pacientes;\n- gestão básica da prática, com até 5 pacientes.\n\nQuando a sua prática crescer, o plano Essencial libera a plataforma inteira.\n\nFaz sentido eu te mostrar em 15 minutos? É só responder este e-mail. Se preferir ver antes, a plataforma está aqui:\n\n${utm(SITE, "email", "prospeccao", "autonomos")}\n\n${fecha}`,
  };
  if (etapa === 2) return {
    assunto: frase(n, "o paciente certo precisa te encontrar"),
    corpo: `${abre}\n\nQuem procura um psicólogo costuma comparar perfis antes de escolher. ${d.siteHost ? `O seu site já mostra CRP e contato, o que passa confiança. O que o perfil da Synapsa soma é` : "O perfil da Synapsa existe para isso:"} uma página com a sua marca, listada no nosso diretório de psicólogos, com agenda e formulário de entrada no mesmo lugar.\n\nO paciente te encontra, escolhe um horário e se cadastra sem ficar trocando mensagens. Para você, é um canal a mais de novos pacientes, que funciona sem depender só de indicação.\n\nDá para ver como fica o diretório aqui:\n\n${utm(DIRETORIO, "email", "prospeccao", "autonomos")}\n\nSe quiser o seu perfil no ar, é só responder este e-mail.\n\n${fecha}`,
  };
  if (etapa === 3) return {
    assunto: frase(n, "quanto da sua semana vai para o administrativo?"),
    corpo: `${abre}\n\n${d.whatsapp ? "Vi que você atende pelo WhatsApp. Se hoje a agenda, a confirmação e a cobrança passam por ele, é aí que a semana escorre." : "Agenda, confirmação, cobrança e controle financeiro costumam ficar espalhados entre WhatsApp, planilha e caderno."}\n\nA Synapsa centraliza a prática em um só lugar:\n\n- agenda com sessões e reagendamentos;\n- cadastro dos pacientes, com a ficha de entrada preenchida pelo próprio paciente;\n- financeiro: o que foi cobrado, o que entrou e o que está pendente.\n\nMenos tempo com burocracia, mais tempo para atender (e para descansar).\n\nQuantas horas por semana vão para isso hoje? Se quiser, te mostro como ficaria em 15 minutos. É só responder este e-mail, ou conhecer a plataforma aqui:\n\n${utm(SITE, "email", "prospeccao", "autonomos")}\n\n${fecha}`,
  };
  if (etapa === 4) return {
    assunto: frase(n, "a evolução dos seus pacientes, em dados"),
    corpo: `${abre}\n\nQuem tem muitos pacientes sabe: acompanhar a evolução de cada um só na memória ou em anotações soltas não escala.\n\nNa Synapsa a evolução fica registrada com dados, em um histórico por paciente. Você enxerga o caminho percorrido e decide o próximo passo com base no que foi medido.\n\nA decisão clínica continua sendo sua. A plataforma organiza a informação.\n\nHoje, como você acompanha a evolução dos seus pacientes?\n\nSe quiser ver como funciona, veja como funciona aqui:\n\n${utm(SITE, "email", "prospeccao", "autonomos")}\n\n${fecha}`,
  };
  return {
    assunto: frase(n, "último e-mail, e um convite"),
    corpo: `${abre}\n\nNão quero lotar a sua caixa, então este é o meu último e-mail.\n\nEm resumo: a Synapsa te ajuda a ser encontrado, a organizar a prática e a evoluir com dados. Você começa com uma conta gratuita (perfil público, agenda, ficha de entrada e gestão básica com até 5 pacientes) e, quando precisar de mais, o plano Essencial libera tudo.\n\nSe fizer sentido, é só responder este e-mail ou conhecer a plataforma:\n\n${utm(SITE, "email", "prospeccao", "autonomos")}\n\nSe não for o momento, tudo bem. Para não receber mais nada, responda SAIR.\n\n${fecha}`,
  };
}
