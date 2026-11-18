/** Leitura da Meta (Graph API). Só GET, com o token do usuário de sistema. */

export interface AdsRow {
  day: string;
  ad_account_id: string;
  campaign_id: string;
  campaign_name: string;
  currency: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
}

export interface IgRow {
  day: string;
  ig_id: string;
  followers: number | null;
  reach: number | null;
  profile_views: number | null;
}

interface RawInsight {
  date_start: string;
  campaign_id: string;
  campaign_name: string;
  account_currency?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  actions?: { action_type: string; value: string }[];
}

const LEAD_TYPES = new Set(["lead", "onsite_conversion.lead_grouped", "offsite_conversion.fb_pixel_lead"]);

export function parseAdsInsights(adAccountId: string, data: RawInsight[]): AdsRow[] {
  return data.map((r) => {
    // Os tipos de lead se sobrepõem na Meta; pegamos o maior para não contar em dobro.
    const leads = Math.max(0, ...(r.actions ?? []).filter((a) => LEAD_TYPES.has(a.action_type)).map((a) => Number(a.value) || 0));
    return {
      day: r.date_start,
      ad_account_id: adAccountId,
      campaign_id: r.campaign_id,
      campaign_name: r.campaign_name,
      currency: r.account_currency ?? "BRL",
      spend: Number(r.spend ?? 0),
      impressions: Number(r.impressions ?? 0),
      clicks: Number(r.clicks ?? 0),
      leads,
    };
  });
}

export interface WastedCampaign {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  clicks: number;
}

/** Campanhas que gastaram pelo menos `minSpend` no período e não geraram nenhum lead. */
export function wastedSpend(rows: AdsRow[], minSpend: number): WastedCampaign[] {
  const by = new Map<string, WastedCampaign & { leads: number }>();
  for (const r of rows) {
    const c = by.get(r.campaign_id) ?? { campaign_id: r.campaign_id, campaign_name: r.campaign_name, spend: 0, clicks: 0, leads: 0 };
    c.spend = Math.round((c.spend + r.spend) * 100) / 100;
    c.clicks += r.clicks;
    c.leads += r.leads;
    by.set(r.campaign_id, c);
  }
  return [...by.values()]
    .filter((c) => c.leads === 0 && c.spend >= minSpend)
    .map(({ leads: _l, ...c }) => c)
    .sort((a, b) => b.spend - a.spend);
}

export async function graphGet<T>(version: string, path: string, params: Record<string, string>, token: string): Promise<T> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`https://graph.facebook.com/${version}/${path}?${qs}`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`meta ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchAdsInsights(version: string, adAccountId: string, token: string, days = 7): Promise<AdsRow[]> {
  const rows: AdsRow[] = [];
  const acct = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  let next: string | null = null;
  const first = await graphGet<{ data: RawInsight[]; paging?: { next?: string } }>(
    version,
    `${acct}/insights`,
    { level: "campaign", time_increment: "1", ...(days > 30 ? { time_range: JSON.stringify({ since: new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10), until: new Date().toISOString().slice(0, 10) }) } : { date_preset: days <= 7 ? "last_7d" : "last_30d" }), fields: "campaign_id,campaign_name,account_currency,spend,impressions,clicks,actions", limit: "200" },
    token,
  );
  rows.push(...parseAdsInsights(acct, first.data));
  next = first.paging?.next ?? null;
  for (let i = 0; next && i < 20; i++) {
    const res = await fetch(next, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`meta insights paging: ${res.status}`);
    const page = (await res.json()) as { data: RawInsight[]; paging?: { next?: string } };
    rows.push(...parseAdsInsights(acct, page.data));
    next = page.paging?.next ?? null;
  }
  return rows;
}

/** Seguidores de hoje + alcance e visitas ao perfil de ontem. */
export async function fetchInstagram(version: string, igId: string, token: string, now = new Date()): Promise<IgRow> {
  const base = await graphGet<{ followers_count?: number }>(version, igId, { fields: "followers_count" }, token);
  const insights = await graphGet<{ data: { name: string; total_value?: { value: number } }[] }>(
    version,
    `${igId}/insights`,
    { metric: "reach,profile_views", period: "day", metric_type: "total_value" },
    token,
  ).catch(() => ({ data: [] }));
  const get = (name: string) => insights.data.find((m) => m.name === name)?.total_value?.value ?? null;
  return { day: now.toISOString().slice(0, 10), ig_id: igId, followers: base.followers_count ?? null, reach: get("reach"), profile_views: get("profile_views") };
}

export interface IgPost {
  id: string;
  tipo: string | null;
  data: string | null;
  curtidas: number | null;
  comentarios: number | null;
  link: string | null;
  legenda: string | null;
}

/** Últimos posts do Instagram com curtidas e comentários. */
export async function fetchIgPosts(version: string, igId: string, token: string, limit = 12): Promise<IgPost[]> {
  const r = await graphGet<{ data: { id: string; media_type?: string; timestamp?: string; like_count?: number; comments_count?: number; permalink?: string; caption?: string }[] }>(
    version,
    `${igId}/media`,
    { fields: "id,media_type,timestamp,like_count,comments_count,permalink,caption", limit: String(limit) },
    token,
  );
  return r.data.map((m) => ({ id: m.id, tipo: m.media_type ?? null, data: m.timestamp ?? null, curtidas: m.like_count ?? null, comentarios: m.comments_count ?? null, link: m.permalink ?? null, legenda: m.caption ? m.caption.slice(0, 140) : null }));
}

/** Seguidores ganhos por dia nos últimos dias (a Meta guarda no máximo 30). */
export async function fetchIgFollowerSeries(version: string, igId: string, token: string, days = 14, now = new Date()): Promise<{ day: string; novos: number }[]> {
  const until = Math.floor(now.getTime() / 1000);
  const since = until - days * 86_400;
  const r = await graphGet<{ data: { name: string; values?: { value: number; end_time: string }[] }[] }>(version, `${igId}/insights`, { metric: "follower_count", period: "day", since: String(since), until: String(until) }, token);
  const m = r.data.find((x) => x.name === "follower_count");
  return (m?.values ?? []).map((v) => ({ day: v.end_time.slice(0, 10), novos: v.value }));
}

export interface IgPostMetricas {
  id: string;
  tipo: string | null;
  publicado: string | null;
  link: string | null;
  legenda: string | null;
  curtidas: number | null;
  comentarios: number | null;
  alcance: number | null;
  salvos: number | null;
  compartilhados: number | null;
  views: number | null;
  interacoes: number | null;
}

/** Posts recentes com métricas de verdade (alcance, salvos, compartilhamentos, visualizações). Falha de um post não derruba os outros. */
export async function fetchIgPostMetricas(version: string, igId: string, token: string, limit = 30): Promise<{ posts: IgPostMetricas[]; erros: string[] }> {
  const base = await fetchIgPosts(version, igId, token, limit);
  const erros: string[] = [];
  const posts: IgPostMetricas[] = [];
  for (const p of base) {
    let m: Record<string, number> = {};
    for (const metricas of ["reach,saved,shares,total_interactions,views", "reach,saved,shares,total_interactions", "reach,saved"]) {
      try {
        const r = await graphGet<{ data: { name: string; values?: { value: number }[]; total_value?: { value: number } }[] }>(version, `${p.id}/insights`, { metric: metricas }, token);
        m = Object.fromEntries(r.data.map((d) => [d.name, d.values?.[0]?.value ?? d.total_value?.value ?? 0]));
        break;
      } catch (e) {
        if (metricas === "reach,saved") erros.push(`${p.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    posts.push({ id: p.id, tipo: p.tipo, publicado: p.data, link: p.link, legenda: p.legenda, curtidas: p.curtidas, comentarios: p.comentarios, alcance: m.reach ?? null, salvos: m.saved ?? null, compartilhados: m.shares ?? null, views: m.views ?? null, interacoes: m.total_interactions ?? null });
  }
  return { posts, erros };
}

/* ---------- Anúncios por criativo, pixel, públicos e Instagram por dia ---------- */

const ACT = (id: string) => (id.startsWith("act_") ? id : `act_${id}`);
const dia = (ms: number) => new Date(ms - 3 * 3_600_000).toISOString().slice(0, 10);
const leadsDe = (actions?: { action_type: string; value: string }[]) => Math.max(0, ...(actions ?? []).filter((a) => LEAD_TYPES.has(a.action_type)).map((a) => Number(a.value) || 0));

async function paginar<T>(primeira: { data: T[]; paging?: { next?: string } }, token: string, max = 40): Promise<T[]> {
  const out = [...primeira.data];
  let next = primeira.paging?.next ?? null;
  for (let i = 0; next && i < max; i++) {
    const res = await fetch(next, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`meta paginação: ${res.status}`);
    const p = (await res.json()) as { data: T[]; paging?: { next?: string } };
    out.push(...p.data);
    next = p.paging?.next ?? null;
  }
  return out;
}

export interface AdDiaRow { day: string; ad_id: string; ad_name: string; adset_id: string; adset_name: string; campaign_id: string; campaign_name: string; spend: number; impressions: number; reach: number; clicks: number; link_clicks: number; leads: number }

/** Anúncio por anúncio, dia a dia, num intervalo (YYYY-MM-DD). */
export async function fetchAdDia(version: string, adAccountId: string, token: string, de: string, ate: string): Promise<AdDiaRow[]> {
  const primeira = await graphGet<{ data: Record<string, unknown>[]; paging?: { next?: string } }>(
    version, `${ACT(adAccountId)}/insights`,
    { level: "ad", time_increment: "1", time_range: JSON.stringify({ since: de, until: ate }), fields: "ad_id,ad_name,adset_id,adset_name,campaign_id,campaign_name,spend,impressions,reach,clicks,inline_link_clicks,actions", limit: "500" },
    token,
  );
  const todos = await paginar(primeira, token);
  return todos.map((r) => ({
    day: String(r.date_start), ad_id: String(r.ad_id), ad_name: String(r.ad_name ?? ""), adset_id: String(r.adset_id ?? ""), adset_name: String(r.adset_name ?? ""),
    campaign_id: String(r.campaign_id ?? ""), campaign_name: String(r.campaign_name ?? ""),
    spend: Number(r.spend ?? 0), impressions: Number(r.impressions ?? 0), reach: Number(r.reach ?? 0), clicks: Number(r.clicks ?? 0), link_clicks: Number(r.inline_link_clicks ?? 0),
    leads: leadsDe(r.actions as { action_type: string; value: string }[] | undefined),
  }));
}

export interface CriativoRow { ad_id: string; nome: string; status: string; criado: string | null; campanha: string; conjunto: string; miniatura: string | null; imagem: string | null; texto: string | null; titulo: string | null; cta: string | null; link_ig: string | null }

/** Os anúncios com o criativo (imagem, texto, título). A miniatura expira: vem de novo a cada leitura. */
export async function fetchCriativos(version: string, adAccountId: string, token: string): Promise<CriativoRow[]> {
  const primeira = await graphGet<{ data: Record<string, any>[]; paging?: { next?: string } }>(
    version, `${ACT(adAccountId)}/ads`,
    { fields: "id,name,effective_status,created_time,campaign{name},adset{name},creative.thumbnail_width(480).thumbnail_height(480){thumbnail_url,image_url,body,title,call_to_action_type,instagram_permalink_url}", limit: "100" },
    token,
  );
  const todos = await paginar(primeira, token, 10);
  return todos.map((a) => ({
    ad_id: String(a.id), nome: String(a.name ?? ""), status: String(a.effective_status ?? ""), criado: a.created_time ?? null,
    campanha: String(a.campaign?.name ?? ""), conjunto: String(a.adset?.name ?? ""),
    miniatura: a.creative?.thumbnail_url ?? null, imagem: a.creative?.image_url ?? null, texto: a.creative?.body ? String(a.creative.body).slice(0, 600) : null,
    titulo: a.creative?.title ?? null, cta: a.creative?.call_to_action_type ?? null, link_ig: a.creative?.instagram_permalink_url ?? null,
  }));
}

export interface PixelInfo { pixel_id: string; nome: string; ultimo_disparo: string | null; indisponivel: boolean }

export async function fetchPixels(version: string, adAccountId: string, token: string): Promise<PixelInfo[]> {
  const r = await graphGet<{ data: { id: string; name?: string; last_fired_time?: string; is_unavailable?: boolean }[] }>(version, `${ACT(adAccountId)}/adspixels`, { fields: "id,name,last_fired_time,is_unavailable", limit: "25" }, token);
  return r.data.map((p) => ({ pixel_id: p.id, nome: p.name ?? p.id, ultimo_disparo: p.last_fired_time ?? null, indisponivel: p.is_unavailable === true }));
}

export interface PixelDia { day: string; evento: string; total: number }

/** Eventos que o pixel recebeu por dia (PageView, Lead, ...). Pede em janelas de 7 dias para a Meta não cortar. */
export async function fetchPixelEventos(version: string, pixelId: string, token: string, deMs: number, ateMs: number): Promise<PixelDia[]> {
  const soma = new Map<string, number>();
  for (let ini = deMs; ini < ateMs; ini += 7 * 86_400_000) {
    const fim = Math.min(ateMs, ini + 7 * 86_400_000);
    const r = await graphGet<{ data: { start_time: string; data: { value: string; count: number }[] }[] }>(
      version, `${pixelId}/stats`, { aggregation: "event", start_time: String(Math.floor(ini / 1000)), end_time: String(Math.floor(fim / 1000)) }, token,
    );
    for (const b of r.data ?? []) for (const e of b.data ?? []) {
      const k = `${dia(Date.parse(b.start_time))}|${e.value}`;
      soma.set(k, (soma.get(k) ?? 0) + (Number(e.count) || 0));
    }
  }
  return [...soma.entries()].map(([k, total]) => { const [day, evento] = k.split("|") as [string, string]; return { day, evento, total }; });
}

export interface QuebraRow { day: string; tipo: "posicionamento" | "idade_genero" | "dispositivo"; chave: string; spend: number; impressions: number; clicks: number; leads: number }

const QUEBRAS: { tipo: QuebraRow["tipo"]; breakdowns: string; chave: (r: Record<string, string>) => string }[] = [
  { tipo: "posicionamento", breakdowns: "publisher_platform,platform_position", chave: (r) => `${r.publisher_platform ?? "?"} · ${r.platform_position ?? "?"}` },
  { tipo: "idade_genero", breakdowns: "age,gender", chave: (r) => `${r.age ?? "?"} · ${r.gender === "female" ? "mulheres" : r.gender === "male" ? "homens" : "n/i"}` },
  { tipo: "dispositivo", breakdowns: "device_platform", chave: (r) => r.device_platform ?? "?" },
];

export async function fetchQuebras(version: string, adAccountId: string, token: string, de: string, ate: string): Promise<{ linhas: QuebraRow[]; erros: string[] }> {
  const linhas: QuebraRow[] = [];
  const erros: string[] = [];
  for (const q of QUEBRAS) {
    try {
      const primeira = await graphGet<{ data: Record<string, any>[]; paging?: { next?: string } }>(
        version, `${ACT(adAccountId)}/insights`,
        { level: "account", time_increment: "1", breakdowns: q.breakdowns, time_range: JSON.stringify({ since: de, until: ate }), fields: "spend,impressions,clicks,actions", limit: "500" }, token,
      );
      for (const r of await paginar(primeira, token, 20)) linhas.push({ day: String(r.date_start), tipo: q.tipo, chave: q.chave(r), spend: Number(r.spend ?? 0), impressions: Number(r.impressions ?? 0), clicks: Number(r.clicks ?? 0), leads: leadsDe(r.actions) });
    } catch (e) { erros.push(`${q.tipo}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  return { linhas, erros };
}

export interface IgDiaRow { day: string; reach: number | null; profile_views: number | null; link_taps: number | null; interacoes: number | null }

/** Instagram de um dia: alcance, visitas ao perfil, toques no link da bio e interações. Cada métrica falha sozinha. */
export async function fetchIgDia(version: string, igId: string, token: string, day: string): Promise<IgDiaRow> {
  const ini = Math.floor(Date.parse(`${day}T00:00:00-03:00`) / 1000);
  const get = async (metric: string) => {
    try {
      const r = await graphGet<{ data: { name: string; total_value?: { value: number } }[] }>(version, `${igId}/insights`, { metric, period: "day", metric_type: "total_value", since: String(ini), until: String(ini + 86_400) }, token);
      return r.data[0]?.total_value?.value ?? null;
    } catch { return null; }
  };
  const [reach, profile_views, link_taps, interacoes] = await Promise.all([get("reach"), get("profile_views"), get("profile_links_taps"), get("total_interactions")]);
  return { day, reach, profile_views, link_taps, interacoes };
}
