-- SpeechCoach cloud schema
-- Safe to run repeatedly. All application tables are namespaced so they can
-- coexist with other products in the same Supabase project.

create table if not exists public.speechcoach_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'SpeechCoach Nutzer'
    check (char_length(btrim(display_name)) between 1 and 60),
  weekly_goal smallint not null default 5
    check (weekly_goal between 1 and 50),
  sync_enabled boolean not null default true,
  store_transcripts boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.speechcoach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id text not null
    check (char_length(client_id) between 1 and 160),
  session_type text not null
    check (session_type in ('solo', 'dialog', 'audio')),
  topic text not null
    check (char_length(btrim(topic)) between 1 and 500),
  category text not null default 'Training'
    check (char_length(btrim(category)) between 1 and 160),
  score smallint not null
    check (score between 0 and 100),
  duration_ms integer not null default 0
    check (duration_ms between 0 and 7200000),
  payload jsonb not null default '{}'::jsonb
    check (jsonb_typeof(payload) = 'object'),
  started_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists speechcoach_sessions_user_created_idx
  on public.speechcoach_sessions (user_id, started_at desc);

alter table public.speechcoach_profiles enable row level security;
alter table public.speechcoach_sessions enable row level security;

revoke all on public.speechcoach_profiles from anon, authenticated;
revoke all on public.speechcoach_sessions from anon, authenticated;
grant select, insert, update, delete on public.speechcoach_profiles to authenticated;
grant select, insert, update, delete on public.speechcoach_sessions to authenticated;
grant all on public.speechcoach_profiles to service_role;
grant all on public.speechcoach_sessions to service_role;

drop policy if exists "speechcoach profiles select own" on public.speechcoach_profiles;
create policy "speechcoach profiles select own"
  on public.speechcoach_profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "speechcoach profiles insert own" on public.speechcoach_profiles;
create policy "speechcoach profiles insert own"
  on public.speechcoach_profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "speechcoach profiles update own" on public.speechcoach_profiles;
create policy "speechcoach profiles update own"
  on public.speechcoach_profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "speechcoach profiles delete own" on public.speechcoach_profiles;
create policy "speechcoach profiles delete own"
  on public.speechcoach_profiles for delete
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "speechcoach sessions select own" on public.speechcoach_sessions;
create policy "speechcoach sessions select own"
  on public.speechcoach_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "speechcoach sessions insert own" on public.speechcoach_sessions;
create policy "speechcoach sessions insert own"
  on public.speechcoach_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "speechcoach sessions update own" on public.speechcoach_sessions;
create policy "speechcoach sessions update own"
  on public.speechcoach_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "speechcoach sessions delete own" on public.speechcoach_sessions;
create policy "speechcoach sessions delete own"
  on public.speechcoach_sessions for delete
  to authenticated
  using ((select auth.uid()) = user_id);
