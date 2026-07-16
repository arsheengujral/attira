-- ════════════════════════════════════════════════════════════════════════════
-- ATTIRA — initial schema (CLAUDE.md Part 3, verbatim in shape)
-- ════════════════════════════════════════════════════════════════════════════
-- Run in the Supabase SQL editor, or `supabase db push`.
--
-- SECURITY MODEL: ATTIRA is per-user. Every table carries user_id and RLS
-- (migration 0002) restricts all access to auth.uid() = user_id. Cross-user
-- access is impossible through the data layer.
--
-- NOTE ON `module_profiles`, `module_plans`, `module_progress`: these are
-- GENERIC — Skin, Style, Career, English all use the same three tables. Adding a
-- domain later is a config file, not a migration. That is the whole point.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists vector;     -- pgvector, for memory retrieval

-- ─── updated_at trigger helper ───────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- IDENTITY
-- ════════════════════════════════════════════════════════════════════════════

-- Public mirror of auth.users (the app never queries auth.users directly).
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  plan       text not null default 'free',   -- free | premium | plus | family | student
  locale     text not null default 'en',
  timezone   text not null default 'UTC',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id             uuid primary key references public.users(id) on delete cascade,
  age_band            text,
  gender              text,
  city                text,
  country             text,
  climate             text,
  occupation          text,
  lifestyle           text,
  budget_band         text,
  relationship_status text,
  goals               text[] not null default '{}',
  onboarded_at        timestamptz,
  updated_at          timestamptz not null default now()
);
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- On sign-up, mirror the auth user + create an empty profile row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
    on conflict (id) do nothing;
  insert into public.profiles (user_id) values (new.id)
    on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ════════════════════════════════════════════════════════════════════════════
-- MEMORY ENGINE  ◄── the heart. all modules read/write.
-- ════════════════════════════════════════════════════════════════════════════

-- Facts — stable attributes (skin type, undertone, budget…).
create table if not exists public.memory_facts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  key           text not null,
  value         text,
  confidence    real not null default 0.8,
  source_module text,
  sensitive     boolean not null default false,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (user_id, key)
);
drop trigger if exists memory_facts_updated_at on public.memory_facts;
create trigger memory_facts_updated_at before update on public.memory_facts
  for each row execute function public.set_updated_at();

-- Episodes — timestamped events, embedded for semantic retrieval.
-- Embedding dimension follows the default embeddings model (text-embedding-3-small,
-- 1536). Change here + EMBEDDINGS_MODEL together if you swap providers.
create table if not exists public.memory_episodes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  module      text,
  type        text,
  content     text not null,
  embedding   vector(1536),
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

-- Patterns — derived insights (written by the nightly job).
create table if not exists public.memory_patterns (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  insight      text not null,
  evidence_ids uuid[] not null default '{}',
  confidence   real not null default 0.6,
  generated_at timestamptz not null default now()
);

-- Consent — per sensitive category (health, relationships, finances…).
create table if not exists public.memory_consent (
  user_id    uuid not null references public.users(id) on delete cascade,
  category   text not null,
  granted    boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, category)
);

-- ════════════════════════════════════════════════════════════════════════════
-- MODULES  (generic — works for ALL domains)
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.module_profiles (
  user_id    uuid not null references public.users(id) on delete cascade,
  module_id  text not null,
  data       jsonb not null default '{}',
  score      int,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_id)
);
drop trigger if exists module_profiles_updated_at on public.module_profiles;
create trigger module_profiles_updated_at before update on public.module_profiles
  for each row execute function public.set_updated_at();

create table if not exists public.module_plans (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  module_id  text not null,
  horizon    text,
  items      jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.module_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  module_id   text not null,
  metric      text not null,
  value       real,
  recorded_at timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════════
-- APPEARANCE (the deep one)
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.photos (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.users(id) on delete cascade,
  kind     text,                              -- face | body | wardrobe | hair
  url      text,
  taken_at timestamptz not null default now(),
  private  boolean not null default true
);

create table if not exists public.skin_logs (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users(id) on delete cascade,
  photo_id  uuid references public.photos(id) on delete set null,
  concerns  text[] not null default '{}',
  notes     text,
  logged_at timestamptz not null default now()
);

create table if not exists public.routines (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  domain       text not null default 'skin',
  time_of_day  text,                          -- am | pm | weekly
  steps        jsonb not null default '[]',
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists public.routine_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  routine_id   uuid references public.routines(id) on delete cascade,
  completed_at timestamptz not null default now()
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  name        text,
  category    text,
  ingredients text[] not null default '{}',
  opened_at   date,
  expires_at  date,
  created_at  timestamptz not null default now()
);

create table if not exists public.wardrobe_items (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users(id) on delete cascade,
  category  text,
  colour    text,
  image_url text,
  tags      text[] not null default '{}',
  added_at  timestamptz not null default now()
);

create table if not exists public.outfits (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references public.users(id) on delete cascade,
  item_ids uuid[] not null default '{}',
  occasion text,
  saved_at timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════════
-- COMPANION & GAMIFICATION
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  mood       int,
  stress     int,
  sleep      int,
  energy     int,
  note       text,
  date       date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.streaks (
  user_id            uuid not null references public.users(id) on delete cascade,
  module_id          text not null,
  current            int not null default 0,
  longest            int not null default 0,
  last_active        date,
  freezes_remaining  int not null default 1,
  primary key (user_id, module_id)
);

create table if not exists public.xp_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  module_id  text,
  action     text,
  points     int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.users(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_key)
);

create table if not exists public.nudges (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  message       text not null,
  module_id     text,
  scheduled_for timestamptz,
  sent_at       timestamptz,
  dismissed     boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════════
-- CONVERSATION
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.threads (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  module_id  text,
  title      text,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads(id) on delete cascade,
  role       text not null,                   -- user | assistant | system
  content    text not null,
  created_at timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════════
-- BILLING
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.subscriptions (
  user_id     uuid primary key references public.users(id) on delete cascade,
  plan        text not null default 'free',
  status      text not null default 'active',
  provider_id text,
  renews_at   timestamptz,
  updated_at  timestamptz not null default now()
);
drop trigger if exists subscriptions_updated_at on public.subscriptions;
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ─── Helpful indexes ─────────────────────────────────────────────────────────
create index if not exists idx_memory_facts_user      on public.memory_facts (user_id);
create index if not exists idx_memory_episodes_user    on public.memory_episodes (user_id, occurred_at desc);
create index if not exists idx_memory_patterns_user    on public.memory_patterns (user_id, generated_at desc);
create index if not exists idx_module_progress_user    on public.module_progress (user_id, module_id, recorded_at desc);
create index if not exists idx_routine_completions_usr on public.routine_completions (user_id, completed_at desc);
create index if not exists idx_messages_thread         on public.messages (thread_id, created_at);
