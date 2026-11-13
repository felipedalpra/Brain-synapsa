import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { AGENTS } from "./data/roster";
import { DEMO_METRICS, mockActivity, mockIntegrations, mockProposals, mockRuntime, respond, type ChatReply, type Metrics, type Snapshot } from "@brain/shared";
import { api } from "./api";
import type { Activity, AgentRuntime, ChatMessage, Integration, JarvisAction, Proposal } from "./types";

export interface State {
  now: number;
  runtime: Record<string, AgentRuntime>;
  proposals: Proposal[];
  activity: Activity[];
  integrations: Integration[];
  kill: boolean;
  simulateLive: boolean;
  messages: ChatMessage[];
  thinking: boolean;
  /** demo: dados de demonstração na memória. live: Brain local respondendo. */
  mode: "demo" | "live";
  metrics: Metrics;
  overflow: number;
  llm: boolean;
  error: string | null;
}

type Act =
  | { t: "msg"; m: ChatMessage }
  | { t: "thinking"; on: boolean }
  | { t: "exec"; a: JarvisAction; at: number }
  | { t: "resolve"; id: string; done: "ok" | "cancelado" }
  | { t: "decide"; id: string; to: "aprovada" | "rejeitada"; at: number }
  | { t: "task_done"; agentId: string; task: string; at: number }
  | { t: "sim"; on: boolean }
  | { t: "snapshot"; s: Snapshot }
  | { t: "error"; text: string | null }
  | { t: "kill"; on: boolean; at: number };

let seq = 0;
const uid = (p: string) => `${p}${++seq}`;

export function initial(now: number): State {
  return {
    now,
    runtime: mockRuntime(now),
    proposals: mockProposals(now),
    activity: mockActivity(now),
    integrations: mockIntegrations(),
    kill: false,
    simulateLive: false,
    thinking: false,
    mode: "demo",
    metrics: DEMO_METRICS,
    overflow: 0,
    llm: false,
    error: null,
    messages: [
      {
        id: "m0",
        from: "jarvis",
        text: "Bom dia, Felipe. Enquanto você esteve fora os agentes rodaram sem enviar nada para fora. Tem 8 propostas esperando e o MRR segue em R$ 496. Quer o resumo ou prefere ir direto à fila?",
      },
    ],
  };
}

const brlText = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: n % 1 ? 2 : 0 });

function liveGreeting(s: Snapshot): string {
  const hour = (new Date(s.now).getUTCHours() + 21) % 24; // Brasília
  const hi = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const pend = s.proposals.filter((p) => p.status === "pendente").length;
  const fila = pend === 0 ? "A fila está vazia." : `Tem ${pend} ${pend === 1 ? "proposta esperando" : "propostas esperando"} você.`;
  return `${hi}, Felipe. O Brain está rodando no seu computador. ${fila} O MRR está em ${brlText(s.metrics.mrr.total)}${s.kill ? ", e o botão de emergência está ligado" : ""}. ${s.llm ? "Pergunte o que quiser ou dê uma ordem." : "Ainda sem chave da OpenAI: eu respondo por regras e executo ordens diretas."}`;
}

const log = (s: State, agentId: Activity["agentId"], text: string, at: number, tone: Activity["tone"] = "normal"): Activity[] => [{ id: uid("a"), agentId, text, at, tone }, ...s.activity];

export function reducer(s: State, a: Act): State {
  switch (a.t) {
    case "msg":
      return { ...s, messages: [...s.messages, a.m] };
    case "error":
      return { ...s, error: a.text };
    case "snapshot": {
      const first = s.mode !== "live";
      return {
        ...s,
        mode: "live",
        now: a.s.now,
        runtime: a.s.runtime,
        proposals: a.s.proposals,
        activity: a.s.activity,
        integrations: a.s.integrations,
        kill: a.s.kill,
        metrics: a.s.metrics,
        overflow: a.s.overflow,
        llm: a.s.llm,
        error: null,
        messages: first ? [{ id: "m0", from: "jarvis", text: liveGreeting(a.s) }] : s.messages,
      };
    }
    case "thinking":
      return { ...s, thinking: a.on };
    case "sim":
      return { ...s, simulateLive: a.on, integrations: s.integrations.map((i) => (a.on && i.state !== "manual" ? { ...i, state: "conectado" } : i)) };
    case "kill": {
      const runtime = { ...s.runtime };
      for (const g of AGENTS) {
        const r = runtime[g.id];
        if (r && a.on && r.status === "trabalhando") runtime[g.id] = { ...r, status: "ocioso" };
      }
      return { ...s, kill: a.on, runtime, activity: log(s, "sistema", a.on ? "Botão de emergência ligado. Todos os agentes pararam." : "Botão de emergência desligado. Agentes liberados.", a.at, a.on ? "alerta" : "ok") };
    }
    case "resolve":
      return { ...s, messages: s.messages.map((m) => (m.id === a.id && m.confirm ? { ...m, confirm: { ...m.confirm, done: a.done } } : m)) };
    case "decide": {
      if (s.kill && a.to === "aprovada") return s;
      const p = s.proposals.find((x) => x.id === a.id);
      if (!p || p.status !== "pendente") return s;
      const name = AGENTS.find((g) => g.id === p.agentId)?.name ?? p.agentId;
      return {
        ...s,
        proposals: s.proposals.map((x) => (x.id === a.id ? { ...x, status: a.to } : x)),
        activity: log(s, "voce", `${a.to === "aprovada" ? "Aprovou" : "Rejeitou"}: ${p.title} (${name})`, a.at, a.to === "aprovada" ? "ok" : "normal"),
      };
    }
    case "exec": {
      const x = a.a;
      if (x.type === "kill_on") return reducer(s, { t: "kill", on: true, at: a.at });
      if (x.type === "kill_off") return reducer(s, { t: "kill", on: false, at: a.at });
      if (x.type === "daily") return { ...s, activity: log(s, "sistema", "Rotina do dia iniciada (demonstração).", a.at) };
      if (x.type === "approve_low_risk") {
        if (s.kill) return s;
        const low = s.proposals.filter((p) => p.status === "pendente" && p.risk === "baixo");
        return {
          ...s,
          proposals: s.proposals.map((p) => (low.some((l) => l.id === p.id) ? { ...p, status: "aprovada" } : p)),
          activity: log(s, "voce", `Aprovou ${low.length} propostas de baixo risco pelo Jarvis. Nada foi enviado: as mensagens esperam você copiar e mandar.`, a.at, "ok"),
        };
      }
      if (x.type === "pause" || x.type === "resume") {
        const r = s.runtime[x.agentId];
        if (!r) return s;
        const name = AGENTS.find((g) => g.id === x.agentId)?.name ?? x.agentId;
        return {
          ...s,
          runtime: { ...s.runtime, [x.agentId]: { ...r, status: x.type === "pause" ? "pausado" : "ocioso" } },
          activity: log(s, "voce", x.type === "pause" ? `Pausou ${name}.` : `Retomou ${name}.`, a.at),
        };
      }
      if (x.type === "task") {
        const r = s.runtime[x.agentId];
        if (!r || r.status === "pausado") return s;
        return {
          ...s,
          runtime: { ...s.runtime, [x.agentId]: { ...r, status: "trabalhando" } },
          activity: log(s, "voce", `Pediu a ${AGENTS.find((g) => g.id === x.agentId)?.name}: ${x.task}`, a.at),
        };
      }
      return s;
    }
    case "task_done": {
      const g = AGENTS.find((x) => x.id === a.agentId);
      const r = s.runtime[a.agentId];
      if (!g || !r || s.kill) return s;
      const makesProposal = g.aprova.length > 0;
      const proposal: Proposal | null = makesProposal
        ? {
            id: uid("p"),
            agentId: g.id,
            title: `${g.aprova[0]}: rascunho pedido por você`,
            draft: null,
            why: `Resultado do pedido: "${a.task}". Revise antes de aprovar.`,
            impactoBrl: 0,
            risk: "baixo",
            channel: "interno",
            status: "pendente",
            at: a.at,
            review: "aprovada pela conformidade",
          }
        : null;
      return {
        ...s,
        runtime: { ...s.runtime, [g.id]: { ...r, status: "ocioso", lastAction: `Concluiu: ${a.task}`, lastAt: a.at, runsToday: r.runsToday + 1, costBrl: Math.round((r.costBrl + 0.18) * 100) / 100 } },
        proposals: proposal ? [proposal, ...s.proposals] : s.proposals,
        activity: log(s, g.id, `Concluiu: ${a.task}${proposal ? " Deixou uma proposta na sua fila." : ""}`, a.at, "ok"),
      };
    }
  }
}

interface Ctx {
  state: State;
  live: boolean;
  act: (a: JarvisAction) => void;
  checkIntegrations: () => Promise<void>;
  dismissError: () => void;
  ask: (text: string) => void;
  confirm: (messageId: string, ok: boolean) => void;
  decide: (id: string, to: "aprovada" | "rejeitada") => void;
  setKill: (on: boolean) => void;
  setSim: (on: boolean) => void;
  pending: Proposal[];
}

const BrainCtx = createContext<Ctx | null>(null);

export function BrainProvider({ children, now = Date.now(), forceDemo = false }: { children: ReactNode; now?: number; forceDemo?: boolean }) {
  const [state, dispatch] = useReducer(reducer, now, initial);
  const [ready, setReady] = useState(forceDemo);
  const ref = useRef(state);
  ref.current = state;
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  // Procura o Brain local. Se não houver, a Central funciona com dados de demonstração.
  useEffect(() => {
    if (forceDemo) return;
    let es: EventSource | null = null;
    let poll = 0;
    let alive = true;
    void api.probe().then(async (ok) => {
      if (!alive) return;
      if (ok) {
        try {
          dispatch({ t: "snapshot", s: await api.state() });
          const refresh = () => void api.state().then((s) => alive && dispatch({ t: "snapshot", s })).catch(() => dispatch({ t: "error", text: "Perdi a conexão com o Brain local." }));
          if (ok.sse) {
            es = new EventSource("/api/events");
            es.addEventListener("change", refresh);
          }
          poll = window.setInterval(refresh, ok.sse ? 20_000 : 8_000);
        } catch {
          /* cai no demo */
        }
      }
      setReady(true);
    });
    return () => {
      alive = false;
      es?.close();
      window.clearInterval(poll);
    };
  }, [forceDemo]);

  const live = state.mode === "live";
  const fail = (e: unknown) => dispatch({ t: "error", text: e instanceof Error ? e.message : "Algo deu errado." });

  const run = useCallback(
    (action: JarvisAction) => {
      if (ref.current.mode === "live") {
        void api.action(action).then((r) => dispatch({ t: "snapshot", s: r.snapshot })).catch(fail);
        return;
      }
      dispatch({ t: "exec", a: action, at: Date.now() });
      if (action.type === "task") {
        later(() => dispatch({ t: "task_done", agentId: action.agentId, task: action.task, at: Date.now() }), 3200);
      }
    },
    [],
  );

  const ask = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;
      dispatch({ t: "msg", m: { id: uid("m"), from: "voce", text: clean } });
      dispatch({ t: "thinking", on: true });
      if (ref.current.mode === "live") {
        void api
          .chat(clean)
          .then((r) => {
            const reply: ChatReply = r.reply;
            dispatch({ t: "snapshot", s: r.snapshot });
            dispatch({ t: "msg", m: { id: uid("m"), from: "jarvis", text: reply.text, confirm: reply.confirm } });
          })
          .catch((e) => dispatch({ t: "msg", m: { id: uid("m"), from: "jarvis", text: `Não consegui falar com o Brain: ${e instanceof Error ? e.message : "erro"}.` } }))
          .finally(() => dispatch({ t: "thinking", on: false }));
        return;
      }
      later(() => {
        const s = ref.current;
        const r = respond(clean, { now: Date.now(), runtime: s.runtime, proposals: s.proposals, integrations: s.integrations, kill: s.kill, metrics: s.metrics });
        dispatch({ t: "thinking", on: false });
        dispatch({ t: "msg", m: { id: uid("m"), from: "jarvis", text: r.text, confirm: r.confirm } });
        if (r.action) run(r.action);
      }, 750);
    },
    [run],
  );

  const confirm = useCallback(
    (messageId: string, ok: boolean) => {
      const m = ref.current.messages.find((x) => x.id === messageId);
      if (!m?.confirm || m.confirm.done) return;
      dispatch({ t: "resolve", id: messageId, done: ok ? "ok" : "cancelado" });
      if (!ok) {
        dispatch({ t: "msg", m: { id: uid("m"), from: "jarvis", text: "Cancelado. Nada mudou." } });
        return;
      }
      const action = m.confirm.action;
      if (ref.current.mode === "live") {
        void api
          .action(action)
          .then((r) => {
            dispatch({ t: "snapshot", s: r.snapshot });
            dispatch({ t: "msg", m: { id: uid("m"), from: "jarvis", text: `Feito. ${r.message}` } });
          })
          .catch((e) => dispatch({ t: "msg", m: { id: uid("m"), from: "jarvis", text: `Não deu: ${e instanceof Error ? e.message : "erro"}` } }));
        return;
      }
      run(action);
      const text = action.type === "kill_on" ? "Feito. Todos os agentes pararam e as aprovações estão bloqueadas." : action.type === "kill_off" ? "Feito. Agentes liberados." : "Feito. As propostas de baixo risco estão aprovadas. Falta você copiar e enviar cada mensagem.";
      dispatch({ t: "msg", m: { id: uid("m"), from: "jarvis", text } });
    },
    [run],
  );

  const value = useMemo<Ctx>(
    () => ({
      state,
      live,
      ask,
      confirm,
      act: run,
      decide: (id, to) => {
        if (ref.current.mode === "live") void api.decide(id, to).then((s) => dispatch({ t: "snapshot", s })).catch(fail);
        else dispatch({ t: "decide", id, to, at: Date.now() });
      },
      setKill: (on) => run({ type: on ? "kill_on" : "kill_off" }),
      setSim: (on) => dispatch({ t: "sim", on }),
      checkIntegrations: () => api.checkIntegrations().then((s) => dispatch({ t: "snapshot", s })).catch(fail),
      dismissError: () => dispatch({ t: "error", text: null }),
      pending: state.proposals.filter((p) => p.status === "pendente"),
    }),
    [state, live, ask, confirm, run],
  );
  if (!ready) return null;
  return <BrainCtx.Provider value={value}>{children}</BrainCtx.Provider>;
}

export function useBrain(): Ctx {
  const c = useContext(BrainCtx);
  if (!c) throw new Error("BrainProvider ausente");
  return c;
}
