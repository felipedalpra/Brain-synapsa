import type { JarvisAction } from "@brain/shared";
import { BrainError, type Brain } from "./brain";

/** Aplica uma ação do Jarvis (já confirmada pelo Felipe quando necessário). */
export function applyAction(brain: Brain, a: JarvisAction, actor = "voce"): string {
  switch (a.type) {
    case "kill_on":
      brain.setKill(true, actor);
      return "Todos os agentes pararam e as aprovações estão bloqueadas.";
    case "kill_off":
      brain.setKill(false, actor);
      return "Agentes liberados.";
    case "daily":
      if (brain.killed()) throw new BrainError("kill_switch", "Botão de emergência ligado.");
      brain.emit("daily-requested");
      return "Rotina do dia iniciada.";
    case "pause":
      brain.setPaused(a.agentId, true, actor);
      return `${brain.agentName(a.agentId)} pausado.`;
    case "resume":
      brain.setPaused(a.agentId, false, actor);
      return `${brain.agentName(a.agentId)} retomado.`;
    case "task":
      brain.assignTask(a.agentId, a.task, actor);
      return `${brain.agentName(a.agentId)} começou.`;
    case "approve_low_risk": {
      const n = brain.approveLowRisk(actor);
      return `${n} propostas de baixo risco aprovadas. Nada foi enviado: falta você copiar e mandar cada mensagem.`;
    }
  }
}

export const isAction = (x: unknown): x is JarvisAction => {
  if (!x || typeof x !== "object") return false;
  const a = x as Record<string, unknown>;
  switch (a.type) {
    case "kill_on": case "kill_off": case "approve_low_risk": case "daily": return true;
    case "pause": case "resume": return typeof a.agentId === "string";
    case "task": return typeof a.agentId === "string" && typeof a.task === "string";
    default: return false;
  }
};

