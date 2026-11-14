import type { JarvisAction } from "@brain/shared";
import { BrainError, type Brain } from "./brain";
import { applyAction, isAction } from "./actions";
import { executarCrm } from "./crm-acao";
import { sendApproved, suppress } from "./dispatch";
import { integrationsView } from "./integrations";
import { row, rows, run } from "./sql";
import { dashboardData, refreshDados } from "./data";
import { crmPainel } from "./crm-painel";
import { finImportarExtrato, lerExtratoInter } from "./fin-import";
import { aprovarEEnviar, gerarRascunhos, marcarContato } from "./prospeccao-email";
import { marcarWhatsapp } from "./prospeccao-whatsapp";
import { gscPainelCompleto, sincronizarGsc } from "./gsc";
import { receberWebhook } from "./webhook-resend";
import { autoSet, rodarRotina, rotinaSet, avancar as prospAvancar, descartar as prospDescartar, enviarAoCrm, iniciarDescoberta, iniciarEnriquecimento, prospeccaoPainel } from "./prospeccao";
import { conciliar, finAddCobranca, finAddConta, finAddExtrato, finAddManual, finDesfazerPagamento, finPagarConta, finPainel, finRemoverCobranca, finRemoverConta, finRemoverManual, finSetAliquota, finSetCobranca, finSetPremissas, type ContaIn, type ExtratoIn } from "./fin";
import { TEAMS, AGENTS } from "@brain/shared";

export interface Services {
  brain: Brain;
  env: Record<string, string | undefined>;
  chat?: (text: string) => Promise<{ text: string; confirm?: { label: string; action: JarvisAction } }>;
  checkIntegrations?: () => Promise<void>;
  /** fetch usado nos envios (testes trocam por um falso). */
  fetch?: typeof fetch;
  /** HTML da Central já compilada (só o servidor local usa; na Cloudflare quem serve é o Assets). */
  indexHtml?: () => string | null;
  /** O adaptador entrega /api/events (SSE)? Se não, a Central confere o estado de tempos em tempos. */
  sse?: boolean;
  /** Origens extras aceitas além da própria (ex.: o Vite em dev). */
  extraOrigins?: string[];
  /** Devolve uma Response para barrar o pedido (login) ou null para seguir. */
  authorize?: (req: Request, url: URL) => Response | null | Promise<Response | null>;
}

export const CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'";

export const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers } });

async function readJson(req: Request, max = 64_000): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (text.length > max) throw new BrainError("invalid", "Corpo grande demais.");
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new BrainError("invalid", "JSON inválido.");
  }
}

/**
 * A API do Brain em padrão Fetch (Request -> Response). Roda igual no Node e no Worker.
 * Devolve null para o que não é dela (/api/events e arquivos estáticos ficam com o adaptador).
 */
export function createHandler(svc: Services): (req: Request) => Promise<Response | null> {
  const { brain } = svc;
  const snapshot = () => brain.snapshot(integrationsView(brain.db, svc.env, brain.clock()));

  return async (req) => {
    const url = new URL(req.url);
    try {
      // Só a própria origem (ou as extras) pode mandar ordens. Páginas de outros sites não.
      const origin = req.headers.get("origin");
      const allowed = new Set([url.origin, ...(svc.extraOrigins ?? [])]);
      const cors: Record<string, string> = origin ? { "access-control-allow-origin": origin, "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" } : {};
      if (origin && !allowed.has(origin)) return json(403, { error: "origem não permitida" });
      if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

      // Webhook do Resend: público, protegido pela assinatura Svix (não pelo login).
      if (req.method === "POST" && url.pathname === "/api/webhooks/resend") return receberWebhook(brain, svc.env, req);

      const denied = await svc.authorize?.(req, url);
      if (denied) return denied;
      const out = (status: number, body: unknown) => json(status, body, cors);

      if (req.method === "GET" && url.pathname === "/api/health") return out(200, { ok: true, server: "brain-server", llm: brain.llm, sse: svc.sse === true });
      if (req.method === "GET" && url.pathname === "/api/state") return out(200, snapshot());
      if (req.method === "GET" && url.pathname === "/api/dashboard") return out(200, dashboardData(brain));
      if (req.method === "GET" && url.pathname === "/api/financeiro") return out(200, finPainel(brain.db, brain.clock()));
      if (req.method === "GET" && url.pathname === "/api/seo") return out(200, await gscPainelCompleto(brain, svc.env, (svc.fetch ?? fetch) as typeof fetch));
      if (req.method === "GET" && url.pathname === "/api/prospeccao") return out(200, prospeccaoPainel(brain, svc.env));
      if (req.method === "GET" && url.pathname === "/api/crm/painel") {
        try {
          return out(200, await crmPainel(svc.env, brain.clock(), (u, i) => (svc.fetch ?? fetch)(u, i), { atualizar: url.searchParams.get("atualizar") === "1" }));
        } catch (e) {
          throw new BrainError("invalid", e instanceof Error ? e.message : "Não consegui ler o CRM.");
        }
      }
      if (req.method === "GET" && url.pathname === "/api/team-feed") {
        const team = TEAMS.find((t) => t.id === url.searchParams.get("team"));
        if (!team) return out(404, { error: "Equipe não encontrada." });
        const ids = AGENTS.filter((a) => team.areas.includes(a.area)).map((a) => a.id);
        const marks = ids.map(() => "?").join(",");
        const runs = rows(brain.db, `select id, agent_id, task, status, requested_by, created_at, finished_at, cost_brl, result, error from agent_runs where agent_id in (${marks}) order by id desc limit 40`, ...ids);
        const deliverables = rows(brain.db, `select id, run_id, agent_id, title, body, at from deliverables where agent_id in (${marks}) order by id desc limit 20`, ...ids);
        return out(200, { runs, deliverables });
      }
      if (req.method === "GET" && url.pathname === "/api/subscriptions")
        return out(200, { subscriptions: rows(brain.db, "select source, external_id, label, status, list_price_brl, effective_price_brl, discount_ends_at, origin from subscriptions order by source, external_id") });

      if (req.method === "GET" && !url.pathname.startsWith("/api/")) {
        if (!svc.indexHtml) return null;
        const html = svc.indexHtml();
        if (!html) return new Response("A Central ainda não foi compilada. Rode: npm run build", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
        return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "content-security-policy": CSP } });
      }
      if (req.method !== "POST") return url.pathname === "/api/events" ? null : out(404, { error: "não encontrado" });
      const body = await readJson(req, url.pathname === "/api/financeiro/importar" || url.pathname === "/api/financeiro/importar-extrato" ? 2_000_000 : 64_000);

      const decide = url.pathname.match(/^\/api\/proposals\/([\w-]+)\/decide$/);
      if (decide) {
        const to = body.to;
        if (to !== "aprovada" && to !== "rejeitada") throw new BrainError("invalid", "Decisão inválida.");
        brain.decide(decide[1]!, to);
        // A decisão já valeu. Se o envio falhar, o erro volta junto com o estado novo.
        let envio: string | undefined;
        let envioErro: string | undefined;
        if (to === "aprovada" && body.enviar === true) {
          try {
            envio = await sendApproved(brain, svc.env, decide[1]!, svc.fetch);
          } catch (e) {
            if (!(e instanceof BrainError)) throw e;
            envioErro = e.message;
          }
        }
        return out(200, { ...snapshot(), ...(envio ? { envio } : {}), ...(envioErro ? { envioErro } : {}) });
      }
      const send = url.pathname.match(/^\/api\/proposals\/([\w-]+)\/send$/);
      if (send) {
        const message = await sendApproved(brain, svc.env, send[1]!, svc.fetch);
        return out(200, { message, snapshot: snapshot() });
      }
      if (url.pathname === "/api/seo/sincronizar") return out(200, { message: await sincronizarGsc(brain, svc.env, (svc.fetch ?? fetch) as typeof fetch, { forcar: true }) });
      if (url.pathname.startsWith("/api/prospeccao/")) {
        const rota = url.pathname.slice("/api/prospeccao/".length);
        const f = (u: string | URL | Request, i?: RequestInit) => (svc.fetch ?? fetch)(u as string, i);
        const ids = () => (Array.isArray(body.ids) ? body.ids.map(Number).filter((x: number) => Number.isInteger(x) && x > 0) : []);
        if (rota === "descoberta") return out(200, { message: await iniciarDescoberta(brain, svc.env, { regiao: String(body.regiao ?? ""), busca: body.busca ? String(body.busca) : undefined, maximo: body.maximo ? Number(body.maximo) : undefined }, f as typeof fetch) });
        if (rota === "enriquecer") return out(200, { message: await iniciarEnriquecimento(brain, svc.env, ids().length ? ids() : null, f as typeof fetch) });
        if (rota === "avancar") return out(200, await prospAvancar(brain, svc.env, f as typeof fetch));
        if (rota === "enviar-crm") return out(200, await enviarAoCrm(brain, svc.env, ids(), f as typeof fetch));
        if (rota === "auto") return out(200, autoSet(brain, { ativo: body.ativo === undefined ? undefined : body.ativo === true, notaMin: body.notaMin === undefined ? undefined : Number(body.notaMin), limiteDia: body.limiteDia === undefined ? undefined : Number(body.limiteDia) }));
        if (rota === "rotina") return out(200, rotinaSet(brain, { ativo: body.ativo === undefined ? undefined : body.ativo === true, maximo: body.maximo === undefined ? undefined : Number(body.maximo) }));
        if (rota === "rotina/rodar") return out(200, { message: await rodarRotina(brain, svc.env, f as typeof fetch, { forcar: true }) });
        if (rota === "emails/gerar") return out(200, gerarRascunhos(brain));
        if (rota === "emails/enviar") return out(200, await aprovarEEnviar(brain, svc.env, Array.isArray(body.ids) ? body.ids.map(String) : [], f as typeof fetch));
        if (rota === "contato") { marcarContato(brain, Number(body.id), body.acao === "sair" ? "sair" : "respondeu"); return out(200, { ok: true }); }
        if (rota === "whatsapp") { marcarWhatsapp(brain, Number(body.id), Number(body.etapa), body.acao === "pular" ? "pular" : "enviado"); return out(200, { ok: true }); }
        if (rota === "descartar") { prospDescartar(brain, Number(body.id), body.descartar !== false); return out(200, { ok: true }); }
      }
      if (url.pathname.startsWith("/api/financeiro/")) {
        const rota = url.pathname.slice("/api/financeiro/".length);
        const agora = brain.clock();
        const idDe = () => {
          const id = Number(body.id);
          if (!Number.isInteger(id) || id < 1) throw new BrainError("invalid", "Falta o id da conta.");
          return id;
        };
        if (rota === "importar") {
          const resumo: Record<string, unknown> = {};
          if (body.extrato !== undefined) {
            if (!Array.isArray(body.extrato)) throw new BrainError("invalid", "extrato precisa ser uma lista.");
            resumo.extrato = finAddExtrato(brain.db, agora, body.extrato as ExtratoIn[], typeof body.fonte === "string" ? body.fonte.slice(0, 20) : "importado");
          }
          if (body.contas !== undefined) {
            if (!Array.isArray(body.contas)) throw new BrainError("invalid", "contas precisa ser uma lista.");
            let criadas = 0;
            for (const c of body.contas as ContaIn[]) criadas += finAddConta(brain.db, agora, c).criadas;
            resumo.contas = { criadas };
          }
          if (body.cobrancas !== undefined) {
            if (!Array.isArray(body.cobrancas)) throw new BrainError("invalid", "cobrancas precisa ser uma lista.");
            const antes = finPainel(brain.db, agora).cobrancas;
            for (const c of body.cobrancas as { nome: string; valor: number; dia: number; forma?: string }[]) {
              if (antes.some((x) => x.nome === String(c.nome ?? "").trim())) continue;
              finAddCobranca(brain.db, agora, c);
            }
            resumo.cobrancas = (body.cobrancas as unknown[]).length;
          }
          if (body.aliquota !== undefined) finSetAliquota(brain.db, Number(body.aliquota));
          resumo.conciliadas = conciliar(brain.db);
          brain.audit("voce", "financeiro_importar", undefined, resumo);
          return out(200, { resumo, painel: finPainel(brain.db, agora) });
        }
        if (rota === "importar-extrato") {
          const lido = lerExtratoInter(String(body.texto ?? ""));
          const r = finImportarExtrato(brain.db, agora, lido, (n) => finAddExtrato(brain.db, agora, n, "inter"));
          const conciliadas = conciliar(brain.db);
          brain.audit("voce", "financeiro_importar_extrato", undefined, { ...r, conciliadas });
          return out(200, { resumo: { ...r, conciliadas }, painel: finPainel(brain.db, agora) });
        }
        if (rota === "conta") {
          const r = finAddConta(brain.db, agora, body.conta as ContaIn);
          conciliar(brain.db);
          brain.audit("voce", "financeiro_conta_nova", undefined, { criadas: r.criadas });
          return out(200, { ...r, painel: finPainel(brain.db, agora) });
        }
        if (rota === "conta/pagar") {
          finPagarConta(brain.db, idDe(), String(body.pagoEm ?? ""), body.valor === undefined ? undefined : Number(body.valor));
          brain.audit("voce", "financeiro_pago", String(body.id));
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        if (rota === "conta/desfazer") {
          finDesfazerPagamento(brain.db, idDe());
          brain.audit("voce", "financeiro_desfeito", String(body.id));
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        if (rota === "conta/remover") {
          finRemoverConta(brain.db, idDe());
          brain.audit("voce", "financeiro_removido", String(body.id));
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        if (rota === "cobranca") {
          const c = body.cobranca as { nome: string; valor: number; dia: number; forma?: string };
          finAddCobranca(brain.db, agora, { nome: String(c?.nome ?? ""), valor: Number(c?.valor), dia: Number(c?.dia), forma: c?.forma });
          brain.audit("voce", "financeiro_cobranca_nova");
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        if (rota === "cobranca/ativar") {
          finSetCobranca(brain.db, idDe(), body.ativa === true);
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        if (rota === "cobranca/remover") {
          finRemoverCobranca(brain.db, idDe());
          brain.audit("voce", "financeiro_cobranca_removida", String(body.id));
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        if (rota === "lancamento") {
          finAddManual(brain.db, agora, body.lancamento as ExtratoIn);
          brain.audit("voce", "financeiro_lancamento_avulso");
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        if (rota === "lancamento/remover") {
          finRemoverManual(brain.db, idDe());
          brain.audit("voce", "financeiro_lancamento_removido", String(body.id));
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        if (rota === "premissas") {
          const p = (body.premissas ?? {}) as Record<string, unknown>;
          const num = (v: unknown) => (v === undefined ? undefined : Number(v));
          finSetPremissas(brain.db, { novosPorMes: num(p.novosPorMes), precoNovo: num(p.precoNovo), churn: num(p.churn), aliquotaImpostos: num(p.aliquotaImpostos), custoMensal: p.custoMensal === undefined ? undefined : p.custoMensal === null || p.custoMensal === "" ? null : Number(p.custoMensal) });
          brain.audit("voce", "financeiro_premissas");
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        if (rota === "config") {
          finSetAliquota(brain.db, Number(body.aliquota));
          return out(200, { painel: finPainel(brain.db, agora) });
        }
        return out(404, { error: "não encontrado" });
      }
      if (url.pathname === "/api/consents") {
        const ref = String(body.contact_ref ?? "").trim();
        const channel = body.channel === "whatsapp" ? "whatsapp" : "email";
        if (!ref) throw new BrainError("invalid", "Falta o contato.");
        if (body.revogar === true) {
          run(brain.db, "update consents set revoked_at = ? where contact_ref = ? and channel = ?", brain.clock(), ref, channel);
          if (channel === "email") suppress(brain, ref, "pediu para sair");
        } else {
          run(brain.db, "insert into consents (contact_ref, channel, granted_at, revoked_at) values (?, ?, ?, null) on conflict(contact_ref, channel) do update set revoked_at = null, granted_at = excluded.granted_at", ref, channel, brain.clock());
        }
        brain.audit("voce", body.revogar === true ? "consent_revogado" : "consent_registrado", `${channel}:${ref}`);
        return out(200, { ok: true });
      }
      if (url.pathname === "/api/actions") {
        if (!isAction(body.action)) throw new BrainError("invalid", "Ação inválida.");
        if (body.action.type === "crm") {
          const message = await executarCrm(svc.env, svc.fetch ?? fetch, body.action);
          brain.audit("voce", "crm_escrita", body.action.op);
          return out(200, { message, snapshot: snapshot() });
        }
        const message = applyAction(brain, body.action);
        return out(200, { message, snapshot: snapshot() });
      }
      if (url.pathname === "/api/refresh-data") {
        const avisos = await refreshDados(brain, svc.env);
        return out(200, { avisos, dashboard: dashboardData(brain) });
      }
      if (url.pathname === "/api/subscriptions/add") {
        // Receita que não passa pelo Stripe (Pix, por exemplo), informada por você.
        const source = body.source === "manual" ? "manual" : "pix";
        const label = String(body.label ?? "").trim().slice(0, 80);
        const eff = Number(body.effective_price_brl);
        const list = Number(body.list_price_brl ?? body.effective_price_brl);
        if (!label || !Number.isFinite(eff) || eff <= 0 || eff > 100_000 || !Number.isFinite(list) || list < eff) throw new BrainError("invalid", "Informe nome e valores válidos.");
        const id = `${source}-${crypto.randomUUID().slice(0, 8)}`;
        run(brain.db, "insert into subscriptions (source, external_id, label, list_price_brl, effective_price_brl, discount_ends_at, status, origin, updated_at) values (?, ?, ?, ?, ?, null, 'active', 'informado', ?)", source, id, label, list, eff, brain.clock());
        brain.audit("voce", "adicionar_assinatura_informada", `${source}:${id}`, { label, eff });
        brain.emit("change");
        return out(200, snapshot());
      }
      if (url.pathname === "/api/subscriptions/remove") {
        // Só some o que foi informado à mão. O que veio do Stripe volta na próxima leitura, então não se apaga.
        const source = String(body.source ?? "");
        const id = String(body.external_id ?? "");
        const cur = row<{ origin: string }>(brain.db, "select origin from subscriptions where source = ? and external_id = ?", source, id);
        if (!cur) throw new BrainError("not_found", "Assinatura não encontrada.");
        if (cur.origin !== "informado") throw new BrainError("invalid", "Só dá para remover o que foi informado à mão.");
        run(brain.db, "delete from subscriptions where source = ? and external_id = ?", source, id);
        brain.audit("voce", "remover_assinatura_informada", `${source}:${id}`);
        brain.emit("change");
        return out(200, snapshot());
      }
      if (url.pathname === "/api/chat") {
        const text = String(body.text ?? "").trim().slice(0, 2000);
        if (!text) throw new BrainError("invalid", "Mensagem vazia.");
        if (!svc.chat) return out(501, { error: "Jarvis indisponível" });
        const reply = await svc.chat(text);
        return out(200, { reply, snapshot: snapshot() });
      }
      if (url.pathname === "/api/integrations/check") {
        await svc.checkIntegrations?.();
        return out(200, snapshot());
      }
      return out(404, { error: "não encontrado" });
    } catch (e) {
      if (e instanceof BrainError) return json(e.code === "not_found" ? 404 : 409, { error: e.message, code: e.code });
      console.error(e);
      return json(500, { error: "erro interno" });
    }
  };
}
