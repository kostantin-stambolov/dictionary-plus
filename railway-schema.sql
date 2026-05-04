create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  display_name text not null,
  pin_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists app_users_handle_idx on app_users (handle);

create table if not exists user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days'
);

create index if not exists user_sessions_user_idx on user_sessions (user_id);

create table if not exists language_packs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  from_lang text not null,
  to_lang text not null,
  description text,
  is_public boolean not null default true,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists words (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null references language_packs(id) on delete cascade,
  term text not null,
  translations jsonb not null,
  romanization text,
  category text,
  visual_query text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(pack_id, term)
);

create index if not exists words_pack_idx on words (pack_id, category, sort_order);

create table if not exists user_dictionary_state (
  user_id uuid primary key references app_users(id) on delete cascade,
  progress jsonb not null default '{"learned": {}}'::jsonb,
  sessions jsonb not null default '{}'::jsonb,
  ui jsonb not null default '{"category": "all", "mode": "learn", "activeIndex": 0, "focused": false}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  event_type text not null,
  category text,
  mode text,
  duration_seconds int,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists activity_log_user_idx on activity_log (user_id, created_at desc);
