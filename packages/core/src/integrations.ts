import { mockIntegrations, type Integration } from "@brain/shared";
import { rows, type Db } from "./sql";

type Env = Record<string, string | undefined>;

/** Peças que o Brain não usa mais: somem da lista em vez de aparecer como "Falta configurar". */
const FORA_DA_LISTA = new Set(["supabase"]);

/**
 * Saúde de cada integração, a partir do que existe no ambiente e do último teste de conexão.
 * Os valores dos segredos nunca saem daqui: só o nome e se estão preenchidos.
 */
export function integrationsView(db: Db, env: Env, now = Date.now()): Integration[] {
  const checks = new Map(rows<{ integration_id: string; ok: number; detail: string | null; at: number }>(db, "select * from integration_checks").map((c) => [c.integration_id, c]));
  return mockIntegrations().filter((i) => !FORA_DA_LISTA.has(i.id)).map((i) => {
    if (i.state === "manual") return i;
    // Este código só roda dentro do Worker publicado: se está respondendo, a Cloudflare está conectada.
    if (i.id === "cloudflare") return { ...i, state: "conectado", detail: "O Brain roda neste Worker, com Durable Object. Os agentes e as leituras rodam sozinhos.", next: undefined, syncMinutes: i.syncMinutes };
    // Search Console e GA4 são lidos por conta de serviço (só leitura), não pelo token OAuth do desenho antigo.
    if (i.id === "google" && env.GSC_SERVICE_ACCOUNT) return { ...i, state: "conectado", detail: "Search Console e GA4 lidos por conta de serviço, só leitura. O Google Agenda ainda não está ligado.", next: undefined, syncMinutes: i.syncMinutes };
    const missing = i.secrets.filter((s) => !env[s]);
    if (missing.length > 0) return { ...i, state: "pendente", detail: `Falta ${missing.join(" e ")} nos secrets do Brain (Cloudflare: Settings, Variables and Secrets; local: .env.local).`, next: `Preencher ${missing.join(" e ")} no .env.local e reiniciar o servidor.`, syncMinutes: null };
    const c = checks.get(i.id);
    if (!c) return { ...i, state: "pronto", detail: "Credencial presente. Falta testar a conexão.", next: "Clicar em Testar conexões.", syncMinutes: null };
    const ago = Math.max(0, Math.round((now - c.at) / 60_000));
    if (c.ok) return { ...i, state: "conectado", detail: `${c.detail ?? "Conexão ok"} · testada há ${ago} min.`, syncMinutes: i.syncMinutes };
    return { ...i, state: "pendente", detail: `O teste falhou: ${c.detail ?? "erro"}`, next: "Conferir a credencial e testar de novo.", syncMinutes: null };
  });
}
