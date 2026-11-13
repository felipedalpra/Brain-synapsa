// @ts-nocheck
// Gerado a partir do build de produção de 12/11/2026 (conversor mecânico). Nomes locais ainda minificados; ajuste ao mexer na tela.
import * as React from "react";
import { Bf, Df, Ff, Of, Q, Qf, Ru } from "./shared-inline";
import { api } from "./api";

export let sh = 0;
export const ta = (e) => `${e}${++sh}`;
export function ih(e) {
  return {
    now: e,
    runtime: Df(e),
    proposals: Of(e),
    activity: Ru(e),
    integrations: Ff(),
    kill: false,
    simulateLive: false,
    thinking: false,
    mode: "demo",
    metrics: Bf,
    overflow: 0,
    llm: false,
    error: null,
    messages: [
      {
        id: "m0",
        from: "jarvis",
        text: "Bom dia, Felipe. Enquanto voc\xEA esteve fora os agentes rodaram sem enviar nada para fora. Tem 8 propostas esperando e o MRR segue em R$ 496. Quer o resumo ou prefere ir direto \xE0 fila?",
      },
    ],
  };
}
export const lh = (e) =>
  e.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: e % 1 ? 2 : 0,
  });
export function ch(e) {
  const a = (new Date(e.now).getUTCHours() + 21) % 24,
    t = a < 12 ? "Bom dia" : a < 18 ? "Boa tarde" : "Boa noite",
    r = e.proposals.filter((s) => s.status === "pendente").length,
    o =
      r === 0
        ? "A fila est\xE1 vazia."
        : `Tem ${r} ${r === 1 ? "proposta esperando" : "propostas esperando"} voc\xEA.`;
  return `${t}, Felipe. O Brain est\xE1 rodando no seu computador. ${o} O MRR est\xE1 em ${lh(e.metrics.mrr.total)}${e.kill ? ", e o bot\xE3o de emerg\xEAncia est\xE1 ligado" : ""}. ${e.llm ? "Pergunte o que quiser ou d\xEA uma ordem." : "Ainda sem chave da OpenAI: eu respondo por regras e executo ordens diretas."}`;
}
export const Wa = (e, a, t, r, o = "normal") => [
  {
    id: ta("a"),
    agentId: a,
    text: t,
    at: r,
    tone: o,
  },
  ...e.activity,
];
export function reducer(e, a) {
  switch (a.t) {
    case "msg":
      return {
        ...e,
        messages: [...e.messages, a.m],
      };
    case "error":
      return {
        ...e,
        error: a.text,
      };
    case "snapshot": {
      const t = e.mode !== "live";
      return {
        ...e,
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
        messages: t
          ? [
              {
                id: "m0",
                from: "jarvis",
                text: ch(a.s),
              },
            ]
          : e.messages,
      };
    }
    case "thinking":
      return {
        ...e,
        thinking: a.on,
      };
    case "sim":
      return {
        ...e,
        simulateLive: a.on,
        integrations: e.integrations.map((t) =>
          a.on && t.state !== "manual"
            ? {
                ...t,
                state: "conectado",
              }
            : t,
        ),
      };
    case "kill": {
      const t = {
        ...e.runtime,
      };
      for (const r of Q) {
        const o = t[r.id];
        o &&
          a.on &&
          o.status === "trabalhando" &&
          (t[r.id] = {
            ...o,
            status: "ocioso",
          });
      }
      return {
        ...e,
        kill: a.on,
        runtime: t,
        activity: Wa(
          e,
          "sistema",
          a.on
            ? "Bot\xE3o de emerg\xEAncia ligado. Todos os agentes pararam."
            : "Bot\xE3o de emerg\xEAncia desligado. Agentes liberados.",
          a.at,
          a.on ? "alerta" : "ok",
        ),
      };
    }
    case "resolve":
      return {
        ...e,
        messages: e.messages.map((t) =>
          t.id === a.id && t.confirm
            ? {
                ...t,
                confirm: {
                  ...t.confirm,
                  done: a.done,
                },
              }
            : t,
        ),
      };
    case "decide": {
      if (e.kill && a.to === "aprovada") return e;
      const t = e.proposals.find((o) => o.id === a.id);
      if (!t || t.status !== "pendente") return e;
      const r = Q.find((o) => o.id === t.agentId)?.name ?? t.agentId;
      return {
        ...e,
        proposals: e.proposals.map((o) =>
          o.id === a.id
            ? {
                ...o,
                status: a.to,
              }
            : o,
        ),
        activity: Wa(
          e,
          "voce",
          `${a.to === "aprovada" ? "Aprovou" : "Rejeitou"}: ${t.title} (${r})`,
          a.at,
          a.to === "aprovada" ? "ok" : "normal",
        ),
      };
    }
    case "exec": {
      const t = a.a;
      if (t.type === "kill_on")
        return reducer(e, {
          t: "kill",
          on: true,
          at: a.at,
        });
      if (t.type === "kill_off")
        return reducer(e, {
          t: "kill",
          on: false,
          at: a.at,
        });
      if (t.type === "daily")
        return {
          ...e,
          activity: Wa(e, "sistema", "Rotina do dia iniciada (demonstra\xE7\xE3o).", a.at),
        };
      if (t.type === "approve_low_risk") {
        if (e.kill) return e;
        const r = e.proposals.filter((o) => o.status === "pendente" && o.risk === "baixo");
        return {
          ...e,
          proposals: e.proposals.map((o) =>
            r.some((s) => s.id === o.id)
              ? {
                  ...o,
                  status: "aprovada",
                }
              : o,
          ),
          activity: Wa(
            e,
            "voce",
            `Aprovou ${r.length} propostas de baixo risco pelo Jarvis. Nada foi enviado: as mensagens esperam voc\xEA copiar e mandar.`,
            a.at,
            "ok",
          ),
        };
      }
      if (t.type === "pause" || t.type === "resume") {
        const r = e.runtime[t.agentId];
        if (!r) return e;
        const o = Q.find((s) => s.id === t.agentId)?.name ?? t.agentId;
        return {
          ...e,
          runtime: {
            ...e.runtime,
            [t.agentId]: {
              ...r,
              status: t.type === "pause" ? "pausado" : "ocioso",
            },
          },
          activity: Wa(e, "voce", t.type === "pause" ? `Pausou ${o}.` : `Retomou ${o}.`, a.at),
        };
      }
      if (t.type === "task") {
        const r = e.runtime[t.agentId];
        return !r || r.status === "pausado"
          ? e
          : {
              ...e,
              runtime: {
                ...e.runtime,
                [t.agentId]: {
                  ...r,
                  status: "trabalhando",
                },
              },
              activity: Wa(e, "voce", `Pediu a ${Q.find((o) => o.id === t.agentId)?.name}: ${t.task}`, a.at),
            };
      }
      return e;
    }
    case "task_done": {
      const t = Q.find((i) => i.id === a.agentId),
        r = e.runtime[a.agentId];
      if (!t || !r || e.kill) return e;
      const s =
        t.aprova.length > 0
          ? {
              id: ta("p"),
              agentId: t.id,
              title: `${t.aprova[0]}: rascunho pedido por voc\xEA`,
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
        ...e,
        runtime: {
          ...e.runtime,
          [t.id]: {
            ...r,
            status: "ocioso",
            lastAction: `Concluiu: ${a.task}`,
            lastAt: a.at,
            runsToday: r.runsToday + 1,
            costBrl: Math.round((r.costBrl + 0.18) * 100) / 100,
          },
        },
        proposals: s ? [s, ...e.proposals] : e.proposals,
        activity: Wa(
          e,
          t.id,
          `Concluiu: ${a.task}${s ? " Deixou uma proposta na sua fila." : ""}`,
          a.at,
          "ok",
        ),
      };
    }
  }
}
export const BrainContext = React.createContext(null);
export function BrainProvider({ children: e, now: a = Date.now(), forceDemo: t = false }) {
  const [r, o] = React.useReducer(reducer, a, ih),
    [s, i] = React.useState(t),
    l = React.useRef(r);
  l.current = r;
  const c = React.useRef([]);
  React.useEffect(() => () => c.current.forEach((h) => window.clearTimeout(h)), []);
  const u = (h, f) => {
    c.current.push(window.setTimeout(h, f));
  };
  React.useEffect(() => {
    if (t) return;
    let h = null,
      f = 0,
      d = true;
    return (
      api.probe().then(async (p) => {
        if (d) {
          if (p)
            try {
              o({
                t: "snapshot",
                s: await api.state(),
              });
              const S = () =>
                void api
                  .state()
                  .then(
                    (k) =>
                      d &&
                      o({
                        t: "snapshot",
                        s: k,
                      }),
                  )
                  .catch(() =>
                    o({
                      t: "error",
                      text: "Perdi a conex\xE3o com o Brain local.",
                    }),
                  );
              p.sse && ((h = new EventSource("/api/events")), h.addEventListener("change", S));
              const C = () => {
                S();
                const k = Object.values(l.current.runtime).some((w) => w.status === "trabalhando");
                f = window.setTimeout(C, k ? 3e3 : p.sse ? 2e4 : 8e3);
              };
              f = window.setTimeout(C, 3e3);
            } catch {}
          i(true);
        }
      }),
      () => {
        ((d = false), h?.close(), window.clearTimeout(f));
      }
    );
  }, [t]);
  const v = r.mode === "live",
    g = (h) =>
      o({
        t: "error",
        text: h instanceof Error ? h.message : "Algo deu errado.",
      }),
    x = React.useCallback((h) => {
      if (l.current.mode === "live") {
        api
          .action(h)
          .then((f) =>
            o({
              t: "snapshot",
              s: f.snapshot,
            }),
          )
          .catch(g);
        return;
      }
      (o({
        t: "exec",
        a: h,
        at: Date.now(),
      }),
        h.type === "task" &&
          u(
            () =>
              o({
                t: "task_done",
                agentId: h.agentId,
                task: h.task,
                at: Date.now(),
              }),
            3200,
          ));
    }, []),
    j = React.useCallback(
      (h) => {
        const f = h.trim();
        if (f) {
          if (
            (o({
              t: "msg",
              m: {
                id: ta("m"),
                from: "voce",
                text: f,
              },
            }),
            o({
              t: "thinking",
              on: true,
            }),
            l.current.mode === "live")
          ) {
            api
              .chat(f)
              .then((d) => {
                const p = d.reply;
                (o({
                  t: "snapshot",
                  s: d.snapshot,
                }),
                  o({
                    t: "msg",
                    m: {
                      id: ta("m"),
                      from: "jarvis",
                      text: p.text,
                      confirm: p.confirm,
                    },
                  }));
              })
              .catch((d) =>
                o({
                  t: "msg",
                  m: {
                    id: ta("m"),
                    from: "jarvis",
                    text: `N\xE3o consegui falar com o Brain: ${d instanceof Error ? d.message : "erro"}.`,
                  },
                }),
              )
              .finally(() =>
                o({
                  t: "thinking",
                  on: false,
                }),
              );
            return;
          }
          u(() => {
            const d = l.current,
              p = Qf(f, {
                now: Date.now(),
                runtime: d.runtime,
                proposals: d.proposals,
                integrations: d.integrations,
                kill: d.kill,
                metrics: d.metrics,
              });
            (o({
              t: "thinking",
              on: false,
            }),
              o({
                t: "msg",
                m: {
                  id: ta("m"),
                  from: "jarvis",
                  text: p.text,
                  confirm: p.confirm,
                },
              }),
              p.action && x(p.action));
          }, 750);
        }
      },
      [x],
    ),
    m = React.useCallback(
      (h, f) => {
        const d = l.current.messages.find((C) => C.id === h);
        if (!d?.confirm || d.confirm.done) return;
        if (
          (o({
            t: "resolve",
            id: h,
            done: f ? "ok" : "cancelado",
          }),
          !f)
        ) {
          o({
            t: "msg",
            m: {
              id: ta("m"),
              from: "jarvis",
              text: "Cancelado. Nada mudou.",
            },
          });
          return;
        }
        const p = d.confirm.action;
        if (l.current.mode === "live") {
          api
            .action(p)
            .then((C) => {
              (o({
                t: "snapshot",
                s: C.snapshot,
              }),
                o({
                  t: "msg",
                  m: {
                    id: ta("m"),
                    from: "jarvis",
                    text: `Feito. ${C.message}`,
                  },
                }));
            })
            .catch((C) =>
              o({
                t: "msg",
                m: {
                  id: ta("m"),
                  from: "jarvis",
                  text: `N\xE3o deu: ${C instanceof Error ? C.message : "erro"}`,
                },
              }),
            );
          return;
        }
        x(p);
        const S =
          p.type === "kill_on"
            ? "Feito. Todos os agentes pararam e as aprova\xE7\xF5es est\xE3o bloqueadas."
            : p.type === "kill_off"
              ? "Feito. Agentes liberados."
              : "Feito. As propostas de baixo risco est\xE3o aprovadas. Falta voc\xEA copiar e enviar cada mensagem.";
        o({
          t: "msg",
          m: {
            id: ta("m"),
            from: "jarvis",
            text: S,
          },
        });
      },
      [x],
    ),
    N = React.useMemo(
      () => ({
        state: r,
        live: v,
        ask: j,
        confirm: m,
        act: x,
        decide: async (h, f, d = false) => {
          if (l.current.mode !== "live")
            return (
              o({
                t: "decide",
                id: h,
                to: f,
                at: Date.now(),
              }),
              {}
            );
          try {
            const { envio: p, envioErro: S, ...C } = await api.decide(h, f, d);
            return (
              o({
                t: "snapshot",
                s: C,
              }),
              {
                ok: p,
                erro: S,
              }
            );
          } catch (p) {
            return (g(p), {});
          }
        },
        enviar: async (h) => {
          try {
            const f = await api.send(h);
            return (
              o({
                t: "snapshot",
                s: f.snapshot,
              }),
              {
                ok: f.message,
              }
            );
          } catch (f) {
            return {
              erro: f instanceof Error ? f.message : "N\xE3o deu para enviar.",
            };
          }
        },
        setKill: (h) =>
          x({
            type: h ? "kill_on" : "kill_off",
          }),
        setSim: (h) =>
          o({
            t: "sim",
            on: h,
          }),
        checkIntegrations: () =>
          api
            .checkIntegrations()
            .then((h) =>
              o({
                t: "snapshot",
                s: h,
              }),
            )
            .catch(g),
        dismissError: () =>
          o({
            t: "error",
            text: null,
          }),
        pending: r.proposals.filter((h) => h.status === "pendente"),
      }),
      [r, v, j, m, x],
    );
  return s ? <BrainContext.Provider value={N}>{e}</BrainContext.Provider> : null;
}
export function useBrain() {
  const e = React.useContext(BrainContext);
  if (!e) throw new Error("BrainProvider ausente");
  return e;
}
