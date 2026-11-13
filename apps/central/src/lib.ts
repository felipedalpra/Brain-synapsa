import { AGENTS } from "./data/roster";
import { TEAMS } from "./data/teams";
import type { Agent, Team } from "./types";

export const brl = (n: number): string => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n % 1 ? 2 : 0 });

export function ago(now: number, at: number): string {
  const m = Math.max(1, Math.round((now - at) / 60_000));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h} h` : `${Math.floor(h / 24)} d`;
}

export const teamOf = (a: Agent): Team => TEAMS.find((t) => t.areas.includes(a.area)) ?? TEAMS[0]!;
export const agentById = (id: string): Agent | undefined => AGENTS.find((a) => a.id === id);

export const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  tarefa: "Tarefa",
  interno: "Interno",
};

export const READY_LABEL = { pronto: "Dados prontos", parcial: "Dados parciais", nova: "Falta conexão" } as const;
