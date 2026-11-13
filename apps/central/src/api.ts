import type { ChatReply, JarvisAction, Snapshot } from "@brain/shared";

/** Cliente da API local do Brain. Mesma origem: o Vite faz proxy em /api no desenvolvimento. */
async function call<T>(path: string, init?: RequestInit, timeoutMs = 20_000): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(path, { ...init, signal: ctl.signal, headers: { "content-type": "application/json" } });
    const body = (await res.json().catch(() => ({}))) as { error?: string } & T;
    if (res.status === 401) {
      location.reload(); // sessão expirada: a página de login assume
      throw new Error("Faça login.");
    }
    if (!res.ok) throw new Error(body.error ?? `Erro ${res.status}`);
    return body;
  } finally {
    clearTimeout(t);
  }
}

const post = <T,>(path: string, body: unknown = {}) => call<T>(path, { method: "POST", body: JSON.stringify(body) });

export const api = {
  /** Há um Brain rodando neste computador? */
  async probe(): Promise<{ sse: boolean } | null> {
    try {
      const r = await call<{ ok?: boolean; server?: string; sse?: boolean }>("/api/health", undefined, 3000);
      return r.ok === true && r.server === "brain-server" ? { sse: r.sse === true } : null;
    } catch {
      return null;
    }
  },
  state: () => call<Snapshot>("/api/state"),
  decide: (id: string, to: "aprovada" | "rejeitada") => post<Snapshot>(`/api/proposals/${encodeURIComponent(id)}/decide`, { to }),
  action: (action: JarvisAction) => post<{ message: string; snapshot: Snapshot }>("/api/actions", { action }),
  chat: (text: string) => post<{ reply: ChatReply; snapshot: Snapshot }>("/api/chat", { text }),
  checkIntegrations: () => post<Snapshot>("/api/integrations/check"),
};
