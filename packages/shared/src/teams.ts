import type { Team } from "./types";

// Os 9 times do documento técnico, agrupados nas 5 frentes que você acompanha.
export const TEAMS: Team[] = [
  { id: "marketing", name: "Marketing", blurb: "Atrai psicólogos: LinkedIn, Instagram, anúncios, indicação e mercado.", areas: ["aquisicao"], hue: "--t-marketing" },
  { id: "comercial", name: "Comercial", blurb: "Ativa o cadastro, converte no limite de 5 pacientes e conduz as conversas de venda.", areas: ["ativacao", "comercial"], hue: "--t-comercial" },
  { id: "estrategia", name: "Estratégia", blurb: "Prioriza o seu dia, mede o funil, cuida do caixa e da conformidade.", areas: ["comando", "growth", "financeiro"], hue: "--t-estrategia" },
  { id: "produto", name: "Produto", blurb: "Transforma feedback e uso em backlog, spec e lançamento.", areas: ["produto"], hue: "--t-produto" },
  { id: "sucesso", name: "Sucesso", blurb: "Segura os pagantes, cobra o que falhou e cuida da clínica.", areas: ["sucesso", "clinica"], hue: "--t-sucesso" },
];
