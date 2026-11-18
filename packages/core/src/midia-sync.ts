import type { Brain } from "./brain";
import { brtDay } from "./brain";
import { fetchAdDia, fetchCriativos, fetchIgDia, fetchPixelEventos, fetchPixels, fetchQuebras } from "./meta";
import { rows, run } from "./sql";

type Env = Record<string, string | undefined>;
export type Diagnostico = { parte: string; ok: boolean; linhas?: number; erro?: string };

const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Traduz o erro seco da Meta (“meta x/y: 403”) no que fazer. */
function explicar(parte: string, e: unknown): string {
  const m = msg(e);
  if (/: 4(00|03)\b|permission|OAuth/i.test(m)) return `${m}. O token da Meta provavelmente não tem a permissão necessária para ${parte}: confira ads_read (anúncios e pixel) e instagram_manage_insights (Instagram) no usuário de sistema.`;
  return m;
}

/**
 * Lê da Meta tudo o que a análise usa: anúncios por criativo e por dia, criativos, pixels e eventos,
 * públicos e posicionamentos, e o Instagram dia a dia. Cada parte falha sozinha e vira uma linha de diagnóstico.
 */
export async function sincronizarMidia(brain: Brain, env: Env, opts: { dias?: number } = {}): Promise<Diagnostico[]> {
  const out: Diagnostico[] = [];
  const token = env.META_SYSTEM_USER_TOKEN;
  if (!token) return [{ parte: "Meta", ok: false, erro: "Falta META_SYSTEM_USER_TOKEN nos secrets." }];
  const version = env.META_GRAPH_VERSION ?? "v23.0";
  const acct = env.META_AD_ACCOUNT_ID;
  const igId = env.META_IG_ID;
  const now = brain.clock();
  const dias = Math.min(Math.max(opts.dias ?? 90, 7), 400);
  const de = brtDay(now - dias * 86_400_000), ate = brtDay(now);
  const parte = async (nome: string, fn: () => Promise<number>) => {
    try { out.push({ parte: nome, ok: true, linhas: await fn() }); } catch (e) { out.push({ parte: nome, ok: false, erro: explicar(nome.toLowerCase(), e) }); }
  };

  if (acct) {
    await parte("Anúncios por criativo", async () => {
      const ads = await fetchAdDia(version, acct, token, de, ate);
      for (const r of ads)
        run(brain.db, `insert into meta_ad_dia (day, ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name, spend, impressions, reach, clicks, link_clicks, leads, updated_at) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict(day, ad_id) do update set ad_name = excluded.ad_name, adset_name = excluded.adset_name, campaign_name = excluded.campaign_name, spend = excluded.spend, impressions = excluded.impressions, reach = excluded.reach, clicks = excluded.clicks, link_clicks = excluded.link_clicks, leads = excluded.leads, updated_at = excluded.updated_at`,
          r.day, r.ad_id, r.ad_name, r.adset_id, r.adset_name, r.campaign_id, r.campaign_name, r.spend, r.impressions, r.reach, r.clicks, r.link_clicks, r.leads, now);
      return ads.length;
    });
    await parte("Criativos", async () => {
      const cs = await fetchCriativos(version, acct, token);
      for (const c of cs)
        run(brain.db, `insert into meta_criativo (ad_id, nome, status, criado, campanha, conjunto, miniatura, imagem, texto, titulo, cta, link_ig, atualizado_em) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict(ad_id) do update set nome = excluded.nome, status = excluded.status, campanha = excluded.campanha, conjunto = excluded.conjunto, miniatura = excluded.miniatura, imagem = excluded.imagem, texto = excluded.texto, titulo = excluded.titulo, cta = excluded.cta, link_ig = excluded.link_ig, atualizado_em = excluded.atualizado_em`,
          c.ad_id, c.nome, c.status, c.criado, c.campanha, c.conjunto, c.miniatura, c.imagem, c.texto, c.titulo, c.cta, c.link_ig, now);
      return cs.length;
    });
    await parte("Pixel", async () => {
      const px = await fetchPixels(version, acct, token);
      let n = 0;
      for (const p of px.slice(0, 5)) {
        run(brain.db, `insert into meta_pixel (pixel_id, nome, ultimo_disparo, indisponivel, atualizado_em) values (?, ?, ?, ?, ?) on conflict(pixel_id) do update set nome = excluded.nome, ultimo_disparo = excluded.ultimo_disparo, indisponivel = excluded.indisponivel, atualizado_em = excluded.atualizado_em`, p.pixel_id, p.nome, p.ultimo_disparo, p.indisponivel ? 1 : 0, now);
        const ev = await fetchPixelEventos(version, p.pixel_id, token, now - Math.min(dias, 90) * 86_400_000, now).catch((e) => { throw new Error(`eventos do pixel ${p.nome}: ${msg(e)}`); });
        for (const e of ev) { run(brain.db, "insert into meta_pixel_dia (day, pixel_id, evento, total) values (?, ?, ?, ?) on conflict(day, pixel_id, evento) do update set total = excluded.total", e.day, p.pixel_id, e.evento, e.total); n++; }
      }
      return px.length;
    });
    await parte("Públicos e posicionamentos", async () => {
      const q = await fetchQuebras(version, acct, token, de, ate);
      for (const r of q.linhas) run(brain.db, "insert into meta_quebra_dia (day, tipo, chave, spend, impressions, clicks, leads) values (?, ?, ?, ?, ?, ?, ?) on conflict(day, tipo, chave) do update set spend = excluded.spend, impressions = excluded.impressions, clicks = excluded.clicks, leads = excluded.leads", r.day, r.tipo, r.chave, r.spend, r.impressions, r.clicks, r.leads);
      if (q.erros.length && !q.linhas.length) throw new Error(q.erros[0]);
      return q.linhas.length;
    });
  } else out.push({ parte: "Anúncios", ok: false, erro: "Falta META_AD_ACCOUNT_ID nos secrets." });

  if (igId) {
    await parte("Instagram por dia", async () => {
      const tem = new Set(rows<{ day: string }>(brain.db, "select day from ig_dia where reach is not null").map((r) => r.day));
      let n = 0;
      for (let i = 1; i <= 30; i++) {
        const d = brtDay(now - i * 86_400_000);
        if (i > 3 && tem.has(d)) continue; // dias antigos já guardados não mudam
        const r = await fetchIgDia(version, igId, token, d);
        run(brain.db, "insert into ig_dia (day, reach, profile_views, link_taps, interacoes, novos, updated_at) values (?, ?, ?, ?, ?, null, ?) on conflict(day) do update set reach = excluded.reach, profile_views = excluded.profile_views, link_taps = excluded.link_taps, interacoes = excluded.interacoes, updated_at = excluded.updated_at", r.day, r.reach, r.profile_views, r.link_taps, r.interacoes, now);
        n++;
      }
      const novos = brain.policy<{ novos: { day: string; novos: number }[] } | null>("cache_ig_novos", null)?.novos ?? [];
      for (const v of novos) run(brain.db, "insert into ig_dia (day, novos, updated_at) values (?, ?, ?) on conflict(day) do update set novos = excluded.novos", v.day, v.novos, now);
      return n;
    });
  }
  brain.setPolicy("midia_diagnostico", { at: now, itens: out });
  brain.emit("change");
  return out;
}
