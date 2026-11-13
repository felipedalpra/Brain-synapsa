// Cliente da API REST do CRM Synapsa, só no backend. Leitura livre; escrita (criar, editar, mover etapa,
// excluir) só por métodos explícitos, com Idempotency-Key, If-Match e validação do payload antes da chamada.
// A chave vem do ambiente, nunca aparece em log, mensagem de erro nem resposta.

import { CRM_CONTRACT, type CrmContractName } from "./crm-contract";
import { validar } from "./crm-validate";

type Env = Record<string, string | undefined>;

export interface CrmConfig {
  baseUrl: string;
  apiKey: string;
}

/** Lê SYNAPSA_CRM_API_BASE_URL e SYNAPSA_CRM_API_KEY (ou os nomes antigos CRM_API_*). Sem os dois, devolve null. */
export function crmConfig(env: Env): CrmConfig | null {
  const base = (env.SYNAPSA_CRM_API_BASE_URL ?? env.CRM_API_BASE_URL)?.trim();
  const key = (env.SYNAPSA_CRM_API_KEY ?? env.CRM_API_KEY)?.trim();
  if (!base || !key) return null;
  if (!/^https:\/\//.test(base)) return null; // a chave nunca viaja sem TLS
  return { baseUrl: base.replace(/\/+$/, ""), apiKey: key };
}

export class CrmError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
    readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = "CrmError";
  }
}

export interface RateInfo {
  limit?: number;
  remaining?: number;
  reset?: number;
}

export interface Page<T> {
  data: T[];
  meta: { page: number; page_size: number; total: number; total_pages: number };
  requestId?: string;
  rate: RateInfo;
}

export interface One<T> {
  data: T;
  requestId?: string;
  rate: RateInfo;
  /** ETag da resposta (valor para o If-Match de um PATCH/DELETE). */
  etag?: string;
}

export interface Deleted {
  deleted: true;
  requestId?: string;
  rate: RateInfo;
}

export interface CrmOptions {
  timeoutMs?: number;
  /** Tentativas extras para 500/503 e falha de rede. */
  maxRetries?: number;
  /** Espera máxima aceita para um 429 com Retry-After. */
  maxRetryAfterSec?: number;
  sleep?: (ms: number) => Promise<void>;
}

type Params = Record<string, string | number | boolean | undefined | null>;

type Method = "GET" | "POST" | "PATCH" | "DELETE";

// Lista fechada de método + caminho. Qualquer outra coisa é recusada antes de sair da máquina.
const ALLOWED: Record<Method, RegExp[]> = {
  GET: [/^\/leads$/, /^\/leads\/[^/]+$/, /^\/leads\/[^/]+\/history$/, /^\/pipeline\/(stages|summary|evolution)$/, /^\/activities$/, /^\/activities\/[^/]+$/, /^\/meetings$/, /^\/meetings\/[^/]+$/, /^\/metrics\/(overview|funnel)$/],
  POST: [/^\/leads$/, /^\/activities$/, /^\/meetings$/],
  PATCH: [/^\/leads\/[^/]+$/, /^\/leads\/[^/]+\/stage$/, /^\/activities\/[^/]+$/, /^\/meetings\/[^/]+$/],
  DELETE: [/^\/leads\/[^/]+$/, /^\/activities\/[^/]+$/, /^\/meetings\/[^/]+$/],
};

interface Req {
  method?: Method;
  params?: Params;
  body?: unknown;
  /** Obrigatório em POST/PATCH/DELETE. Reaproveitado em todas as tentativas da mesma operação. */
  idempotencyKey?: string;
  ifMatch?: string;
}

const num = (v: string | null) => (v !== null && v !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class CrmClient {
  /** Último limite de taxa informado pela API. */
  rate: RateInfo = {};
  private readonly send: (url: string, init: RequestInit) => Promise<Response>;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly maxRetryAfterSec: number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(
    private readonly cfg: CrmConfig,
    f: typeof fetch = fetch,
    opts: CrmOptions = {},
  ) {
    // Chamar fetch como método do cliente dá "Illegal invocation" no Worker: por isso o invólucro.
    this.send = (url, init) => f(url, init);
    this.timeoutMs = opts.timeoutMs ?? 10_000;
    this.maxRetries = opts.maxRetries ?? 2;
    this.maxRetryAfterSec = opts.maxRetryAfterSec ?? 20;
    this.sleep = opts.sleep ?? defaultSleep;
  }

  /** Pedido com timeout, backoff em 500/503/rede (mesma Idempotency-Key) e respeito ao Retry-After no 429. */
  private async request(path: string, req: Req = {}): Promise<{ body: Record<string, any>; rate: RateInfo; etag?: string }> {
    const method: Method = req.method ?? "GET";
    const params = req.params ?? {};
    if (!ALLOWED[method].some((re) => re.test(path))) throw new CrmError(400, "caminho_nao_permitido", "Esse método e caminho não fazem parte da integração com o CRM.");
    if (method !== "GET" && !req.idempotencyKey) throw new CrmError(400, "sem_idempotency_key", "Escrita no CRM exige Idempotency-Key.");
    if ((method === "PATCH" || method === "DELETE") && !req.ifMatch) throw new CrmError(428, "sem_if_match", "Alterar ou excluir exige o ETag do registro (If-Match). Leia o registro antes.");
    const headers: Record<string, string> = { authorization: `Bearer ${this.cfg.apiKey}`, accept: "application/json" };
    if (req.body !== undefined) headers["content-type"] = "application/json";
    if (req.idempotencyKey) headers["idempotency-key"] = req.idempotencyKey;
    if (req.ifMatch) headers["if-match"] = req.ifMatch;
    const payload = req.body === undefined ? undefined : JSON.stringify(req.body);
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    const url = `${this.cfg.baseUrl}${path}${qs.size ? `?${qs}` : ""}`;
    let attempt = 0;
    let rateLimited = false;
    for (;;) {
      let res: Response | null = null;
      let netErr = false;
      let netMsg = "";
      try {
        res = await this.send(url, { method, headers, body: payload, signal: AbortSignal.timeout(this.timeoutMs) });
      } catch (e) {
        netErr = true;
        // Só o tipo e uma mensagem curta, com a chave mascarada por garantia.
        netMsg = e instanceof Error ? `${e.name}: ${e.message}`.split(this.cfg.apiKey).join("***").slice(0, 160) : "erro desconhecido";
      }
      if (res) {
        const rate: RateInfo = { limit: num(res.headers.get("x-ratelimit-limit")), remaining: num(res.headers.get("x-ratelimit-remaining")), reset: num(res.headers.get("x-ratelimit-reset")) };
        this.rate = rate;
        const body = (await res.json().catch(() => ({}))) as Record<string, any>;
        if (res.ok) return { body, rate, etag: res.headers.get("etag") ?? undefined };
        const requestId = typeof body.request_id === "string" ? body.request_id : undefined;
        const code = String(body.error?.code ?? `http_${res.status}`);
        const msg = String(body.error?.message ?? "");
        const campos = Array.isArray(body.error?.details) ? body.error.details.map((d: any) => String(d?.field ?? d?.path ?? "")).filter(Boolean).slice(0, 8).join(", ") : "";
        if (res.status === 429) {
          const wait = num(res.headers.get("retry-after")) ?? 1;
          if (!rateLimited && wait <= this.maxRetryAfterSec) {
            rateLimited = true;
            await this.sleep(wait * 1000);
            continue;
          }
          throw new CrmError(429, code, `Limite de 120 requisições por minuto do CRM atingido. Tente de novo em ${wait}s.`, requestId, wait);
        }
        if ((res.status === 500 || res.status === 503) && attempt < this.maxRetries) {
          attempt++;
          await this.sleep(250 * 3 ** (attempt - 1) + Math.floor(Math.random() * 100));
          continue;
        }
        throw new CrmError(res.status, code, explain(res.status, msg, campos), requestId);
      }
      if (netErr && attempt < this.maxRetries) {
        attempt++;
        await this.sleep(250 * 3 ** (attempt - 1) + Math.floor(Math.random() * 100));
        continue;
      }
      throw new CrmError(0, "rede", `O CRM não respondeu a tempo ou a conexão falhou (${netMsg}).`);
    }
  }

  async one<T>(path: string, params: Params = {}): Promise<One<T>> {
    const { body, rate, etag } = await this.request(path, { params });
    return { data: body.data as T, requestId: body.request_id, rate, etag };
  }

  async page<T>(path: string, params: Params = {}): Promise<Page<T>> {
    const page_size = Math.min(Math.max(Number(params.page_size) || 25, 1), 100);
    const { body, rate } = await this.request(path, { params: { ...params, page: Number(params.page) || 1, page_size } });
    return { data: (body.data ?? []) as T[], meta: body.meta ?? { page: 1, page_size, total: 0, total_pages: 0 }, requestId: body.request_id, rate };
  }

  /** Percorre as páginas até acabar ou até maxPages (padrão 5 de 100). Diz se cortou. */
  async all<T>(path: string, params: Params = {}, maxPages = 5): Promise<{ data: T[]; total: number; truncado: boolean }> {
    const out: T[] = [];
    let total = 0;
    for (let page = 1; page <= maxPages; page++) {
      const r = await this.page<T>(path, { ...params, page, page_size: 100 });
      out.push(...r.data);
      total = r.meta.total;
      if (page >= r.meta.total_pages) return { data: out, total, truncado: false };
    }
    return { data: out, total, truncado: out.length < total };
  }

  // Endpoints, na ordem do contrato (GET apenas).
  leads = (f: Params = {}) => this.page<Lead>("/leads", f);
  lead = (id: string) => this.one<Lead>(`/leads/${encodeURIComponent(id)}`);
  leadHistory = (id: string, f: Params = {}) => this.page<Record<string, unknown>>(`/leads/${encodeURIComponent(id)}/history`, f);
  stages = () => this.one<{ id: string; label: string; position: number }[]>("/pipeline/stages");
  pipelineSummary = (f: Params = {}) => this.one<PipelineSummary>("/pipeline/summary", f);
  pipelineEvolution = (f: Params = {}) => this.one<unknown>("/pipeline/evolution", f);
  activities = (f: Params = {}) => this.page<Record<string, unknown>>("/activities", f);
  activity = (id: string) => this.one<Record<string, unknown>>(`/activities/${encodeURIComponent(id)}`);
  meetings = (f: Params = {}) => this.page<Meeting>("/meetings", f);
  meeting = (id: string) => this.one<Meeting>(`/meetings/${encodeURIComponent(id)}`);
  overview = (f: Params = {}) => this.one<Overview>("/metrics/overview", f);
  funnel = (f: Params = {}) => this.one<unknown>("/metrics/funnel", f);

  // ---- Escrita. Todo payload é validado contra o contrato do OpenAPI antes de sair. ----

  private novaChave(acao: string): string {
    return `mega-brain-${acao}-${crypto.randomUUID()}`;
  }

  private async escrever<T>(method: Method, path: string, acao: string, contrato: CrmContractName | null, body: unknown, o: WriteOpts & { ifMatch?: string }, lerEtagDe?: string): Promise<One<T>> {
    if (contrato) {
      const erros = validar(CRM_CONTRACT[contrato] as any, body);
      if (erros.length) throw new CrmError(422, "payload_invalido", `Payload recusado antes de chamar o CRM: ${erros.slice(0, 6).join("; ")}.`);
    }
    // O ETag só é buscado depois da validação: payload ruim não gasta requisição.
    const ifMatch = lerEtagDe ? await this.etagDe(lerEtagDe, o.ifMatch) : o.ifMatch;
    const { body: r, rate, etag } = await this.request(path, { method, body, idempotencyKey: o.idempotencyKey ?? this.novaChave(acao), ifMatch });
    return { data: r.data as T, requestId: r.request_id, rate, etag };
  }

  /** Lê o registro para pegar o ETag, a menos que o chamador já tenha um. */
  private async etagDe(readPath: string, ifMatch?: string): Promise<string> {
    if (ifMatch) return ifMatch;
    const r = await this.one<unknown>(readPath);
    if (!r.etag) throw new CrmError(0, "sem_etag", "O CRM não devolveu ETag na leitura; não dá para alterar com segurança.");
    return r.etag;
  }

  private async excluir(readPath: string, acao: string, o: DeleteOpts): Promise<Deleted> {
    // Exclusão nunca é inferida: o chamador tem que ter perguntado ao usuário e passar confirmar: true.
    if ((o as { confirmar?: unknown })?.confirmar !== true) throw new CrmError(400, "exclusao_sem_confirmacao", "Exclusão no CRM exige confirmação explícita do usuário (confirmar: true).");
    const ifMatch = await this.etagDe(readPath, o.ifMatch);
    const { body, rate } = await this.request(readPath, { method: "DELETE", idempotencyKey: o.idempotencyKey ?? this.novaChave(acao), ifMatch });
    return { deleted: true, requestId: body.request_id, rate };
  }

  createLead = (input: NewLead, o: WriteOpts = {}) => this.escrever<Lead>("POST", "/leads", "create-lead", "CreateLead", input, o);
  async updateLead(id: string, patch: LeadPatch, o: WriteOpts & { ifMatch?: string } = {}): Promise<One<Lead>> {
    const path = `/leads/${encodeURIComponent(id)}`;
    return this.escrever<Lead>("PATCH", path, "update-lead", "UpdateLead", patch, o, path);
  }
  async moveLeadStage(id: string, input: StageMove, o: WriteOpts & { ifMatch?: string } = {}): Promise<One<Lead>> {
    const path = `/leads/${encodeURIComponent(id)}`;
    return this.escrever<Lead>("PATCH", `${path}/stage`, "stage", "MoveStage", input, o, path);
  }
  deleteLead = (id: string, o: DeleteOpts) => this.excluir(`/leads/${encodeURIComponent(id)}`, "delete-lead", o);

  createActivity = (input: NewActivity, o: WriteOpts = {}) => this.escrever<Activity>("POST", "/activities", "create-activity", "CreateActivity", input, o);
  async updateActivity(id: string, patch: ActivityPatch, o: WriteOpts & { ifMatch?: string } = {}): Promise<One<Activity>> {
    const path = `/activities/${encodeURIComponent(id)}`;
    return this.escrever<Activity>("PATCH", path, "update-activity", "UpdateActivity", patch, o, path);
  }
  deleteActivity = (id: string, o: DeleteOpts) => this.excluir(`/activities/${encodeURIComponent(id)}`, "delete-activity", o);

  createMeeting = (input: NewMeeting, o: WriteOpts = {}) => this.escrever<Meeting>("POST", "/meetings", "create-meeting", "CreateMeeting", input, o);
  async updateMeeting(id: string, patch: MeetingPatch, o: WriteOpts & { ifMatch?: string } = {}): Promise<One<Meeting>> {
    const path = `/meetings/${encodeURIComponent(id)}`;
    return this.escrever<Meeting>("PATCH", path, "update-meeting", "UpdateMeeting", patch, o, path);
  }
  deleteMeeting = (id: string, o: DeleteOpts) => this.excluir(`/meetings/${encodeURIComponent(id)}`, "delete-meeting", o);
}

function explain(status: number, msg: string, campos = ""): string {
  const m = msg ? ` (${msg.slice(0, 160)})` : "";
  const c = campos ? ` Campos: ${campos}.` : "";
  switch (status) {
    case 400: return `O CRM recusou o pedido por parâmetro ou Idempotency-Key inválidos${m}.`;
    case 401: return "O CRM recusou a chave: ela é inválida, expirou ou foi revogada. Gere outra e atualize o secret SYNAPSA_CRM_API_KEY.";
    case 403: return "A chave do CRM não tem escopo para essa operação.";
    case 404: return "O CRM não achou esse registro.";
    case 409: return `O CRM acusou conflito: a Idempotency-Key já foi usada em outra operação ou o registro conflita${m}.`;
    case 412: return "O registro mudou no CRM desde a última leitura (ETag desatualizado). Leia de novo e decida se a alteração ainda vale.";
    case 422: return `O CRM recusou os campos enviados.${c}`;
    case 428: return "O CRM exige If-Match (ETag do registro) para essa operação.";
    case 500: case 503: return "O CRM está instável agora. Tentei de novo e não deu.";
    default: return `O CRM respondeu ${status}${m}.`;
  }
}


export type LeadType = "psicologo_individual" | "clinica" | "parceiro";
export type PipelineStatus = "novo_lead" | "contato_feito" | "reuniao_agendada" | "reuniao_realizada" | "em_teste" | "negociacao" | "cliente_ativo" | "perdido" | "pausado";
export type LeadOrigin = "instagram" | "whatsapp" | "landing_page" | "indicacao" | "evento" | "linkedin" | "facebook_meta" | "google" | "parceria" | "outbound" | "outro";
export type Classification = "frio" | "morno" | "quente" | "super_quente";
type Nullable<T> = T | null;

interface LeadFields {
  email?: Nullable<string>;
  instagram?: Nullable<string>;
  responsible_id?: Nullable<string>;
  observations?: Nullable<string>;
  next_action?: Nullable<string>;
  follow_up_date?: Nullable<string>;
  plan_interest?: Nullable<"gratuito" | "essencial" | "clinica" | "nao_definido">;
  professionals_count?: Nullable<number>;
  current_system?: Nullable<string>;
  main_challenge?: Nullable<string>;
  decision_timeline?: Nullable<"imediato" | "ate_30_dias" | "ate_90_dias" | "sem_previsao">;
  is_decision_maker?: Nullable<boolean>;
}
export interface NewLead extends LeadFields {
  name: string;
  lead_type: LeadType;
  phone: string;
  origin: string;
  classification?: string;
}
export interface LeadPatch extends LeadFields {
  name?: string;
  lead_type?: LeadType;
  phone?: string;
  origin?: LeadOrigin;
  classification?: Classification;
  test_status?: Nullable<"pending" | "active" | "completed" | "cancelled">;
  test_start_date?: Nullable<string>;
  test_end_date?: Nullable<string>;
  test_feedback?: Nullable<string>;
}
export type StageMove =
  | { status: Exclude<PipelineStatus, "perdido"> }
  | { status: "perdido"; loss_reason: { reasons: string[]; details: string; had_test?: boolean } };

export type ActivityType = "enviar_mensagem" | "ligar" | "agendar_reuniao" | "followup";
export interface Activity {
  id: string;
  lead_id?: string;
  type?: string;
  status?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  [k: string]: unknown;
}
export interface NewActivity {
  lead_id: string;
  type: ActivityType;
  scheduled_date: string;
  scheduled_time: string;
  responsible_id?: Nullable<string>;
  observations?: Nullable<string>;
}
export interface ActivityPatch {
  type?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  responsible_id?: Nullable<string>;
  status?: "pendente" | "em_andamento" | "concluida" | "atrasada";
  observations?: Nullable<string>;
}
export interface NewMeeting {
  lead_id: string;
  title: string;
  scheduled_at: string;
  notes_before?: Nullable<string>;
  channel?: Nullable<string>;
  duration_minutes?: number;
  meeting_link?: Nullable<string>;
}
export interface MeetingPatch {
  title?: string;
  scheduled_at?: string;
  status?: string;
  notes_before?: Nullable<string>;
  notes_after?: Nullable<string>;
  transcription?: Nullable<string>;
  outcome?: Nullable<string>;
  closing_probability?: Nullable<number>;
  next_step?: Nullable<string>;
  next_step_due_date?: Nullable<string>;
}
export interface WriteOpts {
  /** Repetir uma operação com a mesma chave não duplica o efeito. Se omitida, gera um UUID. */
  idempotencyKey?: string;
}
export interface DeleteOpts extends WriteOpts {
  /** Só `true`, e só depois de o usuário ter confirmado a exclusão. */
  confirmar: true;
  ifMatch?: string;
}

// Formas observadas nas respostas reais. Campos fora disso passam sem tipo, sem serem inventados.
export interface Lead {
  id: string;
  name: string;
  lead_type?: string;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  origin?: string;
  responsible_id?: string | null;
  classification?: string;
  status: string;
  next_action?: string | null;
  follow_up_date?: string | null;
  lead_score?: number;
  last_interaction_at?: string | null;
  created_at?: string;
  updated_at?: string;
  [k: string]: unknown;
}
export interface Meeting {
  id: string;
  lead_id: string;
  title?: string;
  scheduled_at: string;
  status: string;
  [k: string]: unknown;
}
export interface PipelineSummary {
  stages: { status: string; count: number }[];
  transitions?: { from: string; to: string; count: number }[];
  loss_reasons?: { reason: string; count: number }[];
  data_quality?: string;
  [k: string]: unknown;
}
export interface Overview {
  total_leads: number;
  [k: string]: unknown;
}

/** Cliente pronto a partir do ambiente, ou null se a integração não está configurada. */
export function crmClient(env: Env, f: typeof fetch = fetch, opts?: CrmOptions): CrmClient | null {
  const cfg = crmConfig(env);
  return cfg ? new CrmClient(cfg, f, opts) : null;
}
