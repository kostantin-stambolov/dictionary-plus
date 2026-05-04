create extension if not exists pgcrypto;

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  handle text not null unique,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_dictionary_state (
  user_id uuid primary key references app_users(id) on delete cascade,
  progress jsonb not null default '{"learned": {}}'::jsonb,
  sessions jsonb not null default '{}'::jsonb,
  ui jsonb not null default '{"category": "all", "mode": "learn", "activeIndex": 0, "focused": false}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists app_users_handle_idx on app_users (handle);
