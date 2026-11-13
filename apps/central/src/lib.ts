// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import { Q, Ze } from "./shared-inline";

export function Vl(e, a = []) {
  const t = e.campos ?? [],
    r = t.map((o, s) => {
      const i = (a[s] ?? "").trim() || o.padrao;
      return o.https && !/^https:\/\/\S+$/.test(i) ? "" : i;
    });
  return t.some((o, s) => !o.opcional && !r[s])
    ? null
    : r.reduce((o, s, i) => o.replaceAll(`{${i}}`, s || "n\xE3o informado"), e.task);
}
export const rh = [
  {
    re: /teto mensal de ia/i,
    r: {
      titulo: "Bateu o teto de IA do m\xEAs",
      motivo: "O gasto de IA do m\xEAs chegou no limite que voc\xEA definiu, ent\xE3o o agente n\xE3o roda.",
      acao: "Suba o teto ou espere o m\xEAs virar.",
    },
  },
  {
    re: /OPENAI_API_KEY|sem chave de ia/i,
    r: {
      titulo: "Falta a chave da OpenAI",
      motivo: "O Brain n\xE3o achou a OPENAI_API_KEY nos secrets, e sem ela nenhum agente pensa.",
      acao: "Cadastre a OPENAI_API_KEY como Secret no Cloudflare.",
    },
  },
  {
    re: /insufficient_quota|billing|exceeded your current quota/i,
    r: {
      titulo: "A OpenAI est\xE1 sem saldo",
      motivo: "A conta da OpenAI ficou sem cr\xE9dito ou chegou no limite de gasto.",
      acao: "Confira o saldo em platform.openai.com/settings/organization/billing.",
    },
  },
  {
    re: /\b429\b|rate.?limit|too many requests/i,
    r: {
      titulo: "A OpenAI pediu para esperar",
      motivo: "Muitas chamadas em pouco tempo.",
      acao: "Tente de novo em um minuto.",
    },
  },
  {
    re: /\b401\b|invalid_api_key|incorrect api key|unauthorized/i,
    r: {
      titulo: "Uma chave foi recusada",
      motivo: "Algum servi\xE7o (OpenAI, Stripe ou Meta) rejeitou a credencial.",
      acao: "Abra Integra\xE7\xF5es, clique em Testar conex\xF5es e refa\xE7a a chave que aparecer em vermelho.",
    },
  },
  {
    re: /META_SYSTEM_USER_TOKEN|meta [\w/.-]+: (190|400|401|403)|oauthexception|token expirado/i,
    r: {
      titulo: "O Meta recusou o acesso",
      motivo: "O token do Meta est\xE1 ausente, expirou ou n\xE3o tem permiss\xE3o para esse dado.",
      acao: "Gere outro token do usu\xE1rio de sistema e atualize o secret META_SYSTEM_USER_TOKEN.",
    },
  },
  {
    re: /STRIPE_READ_KEY|stripe.*(401|403)/i,
    r: {
      titulo: "O Stripe recusou a leitura",
      motivo: "A chave restrita do Stripe est\xE1 ausente ou sem permiss\xE3o de leitura.",
      acao: "Confira STRIPE_READ_KEY em Integra\xE7\xF5es.",
    },
  },
  {
    re: /RESEND_|resend recusou/i,
    r: {
      titulo: "O Resend n\xE3o enviou",
      motivo: "A chave ou o dom\xEDnio de envio do Resend n\xE3o est\xE1 pronto.",
      acao: "Confira RESEND_API_KEY, RESEND_FROM e se o dom\xEDnio est\xE1 verificado no Resend.",
    },
  },
  {
    re: /abort|timeout|timed out|demorou/i,
    r: {
      titulo: "Demorou demais",
      motivo: "O agente n\xE3o terminou dentro do tempo.",
      acao: "Tente de novo ou pe\xE7a uma tarefa menor.",
    },
  },
  {
    re: /interrompida por rein/i,
    r: {
      titulo: "O Brain reiniciou no meio",
      motivo: "A tarefa foi cortada por uma atualiza\xE7\xE3o ou rein\xEDcio.",
      acao: "Mande de novo.",
    },
  },
  {
    re: /bot[aã]o de emerg|kill/i,
    r: {
      titulo: "O bot\xE3o de emerg\xEAncia est\xE1 ligado",
      motivo: "Com ele ligado nenhum agente trabalha.",
      acao: "Clique em Retomar agentes.",
    },
  },
  {
    re: /pausado/i,
    r: {
      titulo: "O agente est\xE1 pausado",
      motivo: "Voc\xEA pausou esse agente.",
      acao: "Retome no painel dele.",
    },
  },
];
export function _s(e, a = "error") {
  const t = (e ?? "").trim();
  for (const r of rh) if (r.re.test(t)) return r.r;
  return {
    titulo: a === "blocked" ? "O agente n\xE3o conseguiu rodar" : "A tarefa falhou",
    motivo: t ? `O motivo registrado foi: ${t.slice(0, 220)}` : "N\xE3o ficou motivo registrado.",
    acao: "Tente de novo. Se repetir, me mande esse texto.",
  };
}
export const _ = (e) =>
  e.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: e % 1 ? 2 : 0,
  });
export function Ia(e, a) {
  const t = Math.max(1, Math.round((e - a) / 6e4));
  if (t < 60) return `${t} min`;
  const r = Math.floor(t / 60);
  return r < 24 ? `${r} h` : `${Math.floor(r / 24)} d`;
}
export const An = (e) => Ze.find((a) => a.areas.includes(e.area)) ?? Ze[0];
export const so = (e) => Q.find((a) => a.id === e);
export const Mu = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tarefa: "Tarefa",
  interno: "Interno",
};
export const oh = {
  pronto: "Dados prontos",
  parcial: "Dados parciais",
  nova: "Falta conex\xE3o",
};
