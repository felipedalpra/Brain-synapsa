import { createRequire } from "node:module";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

/** Banco local do Brain: espelha as tabelas do Supabase para o deploy ser uma troca de adaptador. */
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
create index if not exists idx_proposals_status on proposals(status, impacto_brl desc);
create index if not exists idx_activity_at on activity(at desc);
create index if not exists idx_runs_agent on agent_runs(agent_id, created_at desc);
`;

// O Vite remove o prefixo "node:" de sqlite; carregar por require evita o problema nos testes.
const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");
export type Db = DatabaseSyncType;

export function openDb(path: string): Db {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("pragma journal_mode = wal; pragma foreign_keys = on;");
  db.exec(SCHEMA);
  return db;
}

export const rows = <T>(db: Db, sql: string, ...params: (string | number | null)[]): T[] => db.prepare(sql).all(...params) as T[];
export const row = <T>(db: Db, sql: string, ...params: (string | number | null)[]): T | undefined => db.prepare(sql).get(...params) as T | undefined;
export const run = (db: Db, sql: string, ...params: (string | number | null)[]) => db.prepare(sql).run(...params);
