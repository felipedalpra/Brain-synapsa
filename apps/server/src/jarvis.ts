import { respond, type BrainView, type ChatReply, type Integration } from "@brain/shared";
import { applyAction } from "./actions";
import { BrainError, type Brain } from "./brain";
import { run } from "./db";
import { HANDLERS } from "./handlers";

export type Chat = (text: string) => Promise<ChatReply>;

const remember = (brain: Brain, role: "voce" | "jarvis", text: string) => run(brain.db, "insert into chat (role, text, at) values (?, ?, ?)", role, text, brain.clock());

/** Jarvis por regras: responde com os números reais do Brain e executa as ordens simples. */
export function ruleChat(brain: Brain, integrations: () => Integration[]): Chat {
  return async (text) => {
    remember(brain, "voce", text);
    const snap = brain.snapshot(integrations());
    const view: BrainView = { now: snap.now, runtime: snap.runtime, proposals: snap.proposals, integrations: snap.integrations, kill: snap.kill, metrics: snap.metrics };
    const r = respond(text, view);
    let reply: ChatReply = { text: r.text, confirm: r.confirm };
    if (r.action) {
      try {
        applyAction(brain, r.action);
        if (r.action.type === "task" && !brain.llm && !HANDLERS[r.action.agentId]) {
          reply = { text: `Registrei a tarefa para ${brain.agentName(r.action.agentId)}, mas ele precisa da IA para raciocinar e a OPENAI_API_KEY não está no .env.local. Fica travada até você colar a chave.` };
        }
      } catch (e) {
        if (!(e instanceof BrainError)) throw e;
        reply = { text: e.message };
      }
    }
    remember(brain, "jarvis", reply.text);
    return reply;
  };
}
