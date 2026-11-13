export type Ready = "pronto" | "parcial" | "nova";

export interface Area {
  id: string;
  name: string;
  goal: string;
}

export interface SubAgent {
  name: string;
  tier: "forte" | "leve";
  does: string;
}

export interface Agent {
  id: string;
  area: string;
  ready: Ready;
  name: string;
  mission: string;
  metric: string;
  needs: string;
  triggers: string[];
  subs: SubAgent[];
  auto: string[];
  aprova: string[];
  humano: string[];
  limits: string;
  learns: string;
  note: string | null;
}

export type TeamId = "marketing" | "comercial" | "estrategia" | "produto" | "sucesso";

export interface Team {
  id: TeamId;
  name: string;
  blurb: string;
  areas: string[];
  hue: string; // token CSS
}

export type AgentStatus = "trabalhando" | "ocioso" | "pausado";

export interface AgentRuntime {
  status: AgentStatus;
  lastAction: string;
  lastAt: number; // epoch ms
  runsToday: number;
  costBrl: number;
}

export type Risk = "baixo" | "medio" | "alto";
export type Channel = "whatsapp" | "email" | "linkedin" | "instagram" | "tarefa" | "interno";
export type ProposalStatus = "pendente" | "aprovada" | "rejeitada";

export interface Proposal {
  id: string;
  agentId: string;
  title: string;
  draft: string | null; // texto que o Felipe copia e envia
  why: string;
  impactoBrl: number;
  risk: Risk;
  channel: Channel;
  status: ProposalStatus;
  at: number;
  review: "aprovada pela conformidade" | "sinalizada";
}

export interface Activity {
  id: string;
  agentId: string | "voce" | "sistema";
  text: string;
  at: number;
  tone: "normal" | "alerta" | "ok";
}

export type IntegrationState = "conectado" | "pronto" | "pendente" | "manual";

export interface Integration {
  id: string;
  name: string;
  state: IntegrationState;
  detail: string; // situação real hoje
  unlocks: string; // o que libera
  secrets: string[]; // nomes dos secrets (nunca os valores)
  next: string; // próximo passo
  syncMinutes: number | null; // simulação quando "tudo ligado"
  agents: string[];
}

export interface ChatMessage {
  id: string;
  from: "jarvis" | "voce";
  text: string;
  confirm?: { label: string; action: JarvisAction; done?: "ok" | "cancelado" };
}

export type JarvisAction =
  | { type: "approve_low_risk" }
  | { type: "kill_on" }
  | { type: "kill_off" }
  | { type: "daily" }
  | { type: "pause"; agentId: string }
  | { type: "resume"; agentId: string }
  | { type: "task"; agentId: string; task: string };

/** Números do topo da Central. `funil` fica nulo até a plataforma ligar o Brain. */
export interface Metrics {
  mrr: { stripe: number; pix: number; manual: number; total: number; goal: number; goalDate: string; essencialPrice: number };
  funil: { cadastros: number; ativados: number; noLimite: number; pagantes: number } | null;
  llmCapMonthlyBrl: number;
  llmSpentMonthBrl: number;
  descontos: { quando: string; contas: number; de: number; para: number }[];
}

/** Tudo que a Central precisa para desenhar uma tela, num único objeto. */
export interface Snapshot {
  now: number;
  mode: "live";
  runtime: Record<string, AgentRuntime>;
  proposals: Proposal[];
  overflow: number; // propostas pendentes fora do teto diário de 15
  activity: Activity[];
  integrations: Integration[];
  kill: boolean;
  metrics: Metrics;
  llm: boolean; // há chave de IA: o Jarvis raciocina de verdade
}

export interface ChatReply {
  text: string;
  confirm?: { label: string; action: JarvisAction };
}
