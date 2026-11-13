import { mockIntegrations, type Integration } from "@brain/shared";
import { rows, type Db } from "./sql";

type Env = Record<string, string | undefined>;

const LOCAL_ONLY: Record<string, string> = {
  supabase: "O Brain usa SQLite (no computador ou no Durable Object da Cloudflare). Não usa Supabase.",
  cloudflare: "O Brain roda num Worker com Durable Object. O deploy é feito com o wrangler.",
};

/**
 * Saúde de cada integração, a partir do que existe no ambiente e do último teste de conexão.
 * Os valores dos segredos nunca saem daqui: só o nome e se estão preenchidos.
 */
export function integrationsView(db: Db, env: Env, now = Date.now()): Integration[] {
  const checks = new Map(rows<{ integration_id: string; ok: number; detail: string | null; at: number }>(db, "select * from integration_checks").map((c) => [c.integration_id, c]));
  return mockIntegrations().map((i) => {
    if (i.state === "manual") return i;
    if (LOCAL_ONLY[i.id]) return { ...i, state: "pendente", detail: LOCAL_ONLY[i.id]!, syncMinutes: null };
    const missing = i.secrets.filter((s) => !env[s]);
    if (missing.length > 0) return { ...i, state: "pendente", detail: `Falta ${missing.join(" e ")} nos secrets do Brain (Cloudflare: Settings, Variables and Secrets; local: .env.local).`, next: `Preencher ${missing.join(" e ")} no .env.local e reiniciar o servidor.`, syncMinutes: null };
    const c = checks.get(i.id);
    if (!c) return { ...i, state: "pronto", detail: "Credencial presente. Falta testar a conexão.", next: "Clicar em Testar conexões.", syncMinutes: null };
    const ago = Math.max(0, Math.round((now - c.at) / 60_000));
    if (c.ok) return { ...i, state: "conectado", detail: `${c.detail ?? "Conexão ok"} · testada há ${ago} min.`, syncMinutes: i.syncMinutes };
    return { ...i, state: "pendente", detail: `O teste falhou: ${c.detail ?? "erro"}`, next: "Conferir a credencial e testar de novo.", syncMinutes: null };
  });
}
