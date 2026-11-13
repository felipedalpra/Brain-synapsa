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
    { level: "campaign", time_increment: "1", date_preset: days <= 7 ? "last_7d" : "last_30d", fields: "campaign_id,campaign_name,account_currency,spend,impressions,clicks,actions", limit: "200" },
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
