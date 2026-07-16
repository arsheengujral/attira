-- ════════════════════════════════════════════════════════════════════════════
-- ATTIRA — Row Level Security
-- ════════════════════════════════════════════════════════════════════════════
-- Every table is private to its owner. The default is deny; each table gets one
-- "owner can do everything with their own rows" policy (auth.uid() = user_id).
-- `messages` is owned transitively through its thread. Service-role (admin) and
-- SECURITY DEFINER triggers bypass RLS by design.
-- ════════════════════════════════════════════════════════════════════════════

-- users: keyed on id (== auth.uid())
alter table public.users enable row level security;
drop policy if exists users_own on public.users;
create policy users_own on public.users
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Every other user-owned table: auth.uid() = user_id
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','memory_facts','memory_episodes','memory_patterns','memory_consent',
    'module_profiles','module_plans','module_progress',
    'photos','skin_logs','routines','routine_completions','products',
    'wardrobe_items','outfits',
    'checkins','streaks','xp_events','badges','nudges',
    'threads','subscriptions'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_own', t);
    execute format(
      'create policy %I on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id);',
      t || '_own', t
    );
  end loop;
end $$;

-- messages: owned through the parent thread
alter table public.messages enable row level security;
drop policy if exists messages_own on public.messages;
create policy messages_own on public.messages
  for all
  using (exists (select 1 from public.threads th where th.id = messages.thread_id and th.user_id = auth.uid()))
  with check (exists (select 1 from public.threads th where th.id = messages.thread_id and th.user_id = auth.uid()));
