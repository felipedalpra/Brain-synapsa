/** Schema do Brain. Mesmo SQL no SQLite local e no SQLite do Durable Object. */
export const SCHEMA = `
create table if not exists agent_state (
  agent_id text primary key,
  paused integer not null default 0,
  status text not null default 'ocioso',
  last_action text,
  last_at integer
);
create table if not exists agent_runs (
  id integer primary key autoincrement,
  agent_id text not null,
  task text not null,
  status text not null,            -- queued, running, done, blocked, error
  requested_by text not null default 'sistema',
  created_at integer not null,
  finished_at integer,
  cost_brl real not null default 0,
  result text,
  error text
);
create table if not exists proposals (
  id text primary key,
  agent_id text not null,
  kind text not null,
  title text not null,
  draft text,
  why text not null,
  impacto_brl real not null default 0,
  risk text not null,
  channel text not null,
  status text not null default 'pendente',
  review text not null default 'aprovada pela conformidade',
  review_note text,
  contact_ref text,
  payload text not null default '{}',
  dedupe_key text unique,
  created_at integer not null,
  decided_at integer
);
create table if not exists approvals (
  id integer primary key autoincrement,
  proposal_id text not null references proposals(id),
  decision text not null,
  actor text not null,
  at integer not null
);
create table if not exists activity (
  id integer primary key autoincrement,
  agent_id text not null,
  text text not null,
  tone text not null default 'normal',
  at integer not null
);
create table if not exists kill_switch (
  id integer primary key check (id = 1),
  engaged integer not null default 0,
  changed_at integer not null
);
create table if not exists subscriptions (
  source text not null,
  external_id text not null,
  professional_id text,
  label text,
  list_price_brl real not null,
  effective_price_brl real not null,
  discount_ends_at text,
  status text not null,
  origin text not null default 'sincronizado',  -- informado (por você) ou sincronizado (da fonte)
  updated_at integer not null,
  primary key (source, external_id)
);
create table if not exists mrr_daily (
  day text not null,
  source text not null,
  mrr_brl real not null,
  subs_count integer not null,
  primary key (day, source)
);
create table if not exists consents (
  contact_ref text not null,
  channel text not null,
  granted_at integer not null,
  revoked_at integer,
  primary key (contact_ref, channel)
);
create table if not exists contact_log (
  id integer primary key autoincrement,
  contact_ref text not null,
  channel text not null,
  proposal_id text,
  at integer not null
);
create table if not exists envios (
  id integer primary key autoincrement,
  proposal_id text,
  channel text not null,
  to_ref text not null,
  status text not null,            -- enviado, falhou
  detail text,
  at integer not null
);
create table if not exists email_suppression (
  email text primary key,
  reason text not null,
  at integer not null
);
create table if not exists policies (
  key text primary key,
  value text not null
);
create table if not exists audit_log (
  id integer primary key autoincrement,
  at integer not null,
  actor text not null,
  action text not null,
  ref text,
  detail text
);
create table if not exists integration_checks (
  integration_id text primary key,
  ok integer not null,
  detail text,
  at integer not null
);
create table if not exists chat (
  id integer primary key autoincrement,
  role text not null,
  text text not null,
  at integer not null
);
create table if not exists meta_ads_daily (
  day text not null, ad_account_id text not null, campaign_id text not null, campaign_name text not null,
  currency text not null, spend real not null, impressions integer not null, clicks integer not null, leads integer not null,
  updated_at integer not null, primary key (day, campaign_id)
);
create table if not exists instagram_daily (
  day text not null, ig_id text not null, followers integer, reach integer, profile_views integer,
  updated_at integer not null, primary key (day, ig_id)
);
create table if not exists deliverables (
  id integer primary key autoincrement,
  run_id integer,
  agent_id text not null,
  title text not null,
  body text not null,
  at integer not null
);
create table if not exists fin_extrato (
  id integer primary key autoincrement,
  data text not null,
  descricao text not null,
  valor real not null,             -- entrada positiva, saída negativa
  categoria text,
  fonte text not null default 'manual',
  hash text not null unique,       -- impede importar o mesmo lançamento duas vezes
  conta_id integer,
  criado_em integer not null
);
create table if not exists fin_contas (
  id integer primary key autoincrement,
  tipo text not null,              -- pagar ou receber
  descricao text not null,
  contraparte text,
  categoria text not null,
  vencimento text not null,
  valor real,
  pago_em text,
  extrato_id integer,
  grupo text,                      -- recorrências criadas juntas
  obs text,
  criado_em integer not null
);
create table if not exists prospects (
  id integer primary key autoincrement,
  place_id text unique not null,
  nome text not null,
  cidade text,
  uf text,
  endereco text,
  telefone text,
  site text,
  instagram text,
  email text,
  email_fonte text,
  crp_count integer,
  whatsapp_no_site integer,
  agenda_online integer,
  avaliacoes integer,
  nota_google real,
  nota integer not null default 0,
  status text not null default 'novo',
  crm_lead_id text,
  consulta text,
  criado_em integer not null,
  atualizado_em integer not null
);
create table if not exists prospect_contato (prospect_id integer primary key, respondeu integer not null default 0, sair integer not null default 0, atualizado_em integer not null default 0);
create table if not exists inbound_emails (email_id text primary key, de text not null, assunto text not null, tipo text not null, prospect_id integer, at integer not null);
create table if not exists prospect_whatsapp (prospect_id integer not null, etapa integer not null, enviado_em integer not null, pulado integer not null default 0, primary key (prospect_id, etapa));
create table if not exists gsc_dia (site text not null, dia text not null, clicks integer not null, impressions integer not null, ctr real not null, position real not null, primary key (site, dia));
create table if not exists gsc_top (site text not null, tipo text not null, chave text not null, clicks integer not null, impressions integer not null, ctr real not null, position real not null, atualizado_em integer not null, primary key (site, tipo, chave));
create table if not exists gsc_agg (site text not null, tipo text not null, periodo text not null, chave text not null, chave2 text not null default '', clicks integer not null, impressions integer not null, ctr real not null, position real not null, primary key (site, tipo, periodo, chave, chave2));
create table if not exists gsc_pagina_dia (site text not null, pagina text not null, dia text not null, clicks integer not null, impressions integer not null, position real not null, primary key (site, pagina, dia));
create table if not exists prospect_runs (
  id integer primary key autoincrement,
  tipo text not null,
  apify_run_id text not null,
  dataset_id text,
  status text not null default 'rodando',
  consulta text,
  prospect_ids text,
  custo_usd real not null default 0,
  detalhe text,
  criado_em integer not null,
  finalizado_em integer
);
create table if not exists fin_cobrancas (
  id integer primary key autoincrement,
  nome text not null,
  valor real not null,
  dia integer not null,
  forma text not null default 'pix',
  ativa integer not null default 1,
  criado_em integer not null
);
create table if not exists fin_config (
  chave text primary key,
  valor text not null
);
create index if not exists idx_fin_extrato_data on fin_extrato(data);
create index if not exists idx_fin_contas_venc on fin_contas(vencimento);
create index if not exists idx_deliverables_at on deliverables(at desc);
create index if not exists idx_proposals_status on proposals(status, impacto_brl desc);
create index if not exists idx_activity_at on activity(at desc);
create index if not exists idx_runs_agent on agent_runs(agent_id, created_at desc);
`;

type Param = string | number | null;

/** O mínimo que o Brain pede de um banco SQLite síncrono (node:sqlite local, ctx.storage.sql no Durable Object). */
export interface Db {
  exec(sql: string): void;
  prepare(sql: string): {
    all(...p: Param[]): unknown[];
    get(...p: Param[]): unknown;
    run(...p: Param[]): { lastInsertRowid?: number | bigint };
  };
  /** Executa fn de forma atômica: tudo ou nada. */
  transaction<T>(fn: () => T): T;
}

export const rows = <T>(db: Db, sql: string, ...params: Param[]): T[] => db.prepare(sql).all(...params) as T[];
export const row = <T>(db: Db, sql: string, ...params: Param[]): T | undefined => db.prepare(sql).get(...params) as T | undefined;
export const run = (db: Db, sql: string, ...params: Param[]) => db.prepare(sql).run(...params);
export const tx = <T>(db: Db, fn: () => T): T => db.transaction(fn);
