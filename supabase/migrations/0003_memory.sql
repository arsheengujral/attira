-- ════════════════════════════════════════════════════════════════════════════
-- ATTIRA — memory retrieval (semantic search over episodes)
-- ════════════════════════════════════════════════════════════════════════════
-- Retrieval injects the top-k relevant episodes into a module prompt rather than
-- dumping the whole memory. This RPC runs with the caller's session (SECURITY
-- INVOKER), so RLS already scopes it to the user; we also filter on auth.uid()
-- as defence in depth.
-- ════════════════════════════════════════════════════════════════════════════

-- Approximate-nearest-neighbour index (cosine). HNSW is available on Supabase.
create index if not exists idx_memory_episodes_embedding
  on public.memory_episodes using hnsw (embedding vector_cosine_ops);

create or replace function public.match_memory_episodes(
  query_embedding vector(1536),
  match_count int default 8
)
returns table (
  id          uuid,
  module      text,
  type        text,
  content     text,
  occurred_at timestamptz,
  similarity  real
)
language sql stable
as $$
  select
    e.id, e.module, e.type, e.content, e.occurred_at,
    (1 - (e.embedding <=> query_embedding))::real as similarity
  from public.memory_episodes e
  where e.user_id = auth.uid()
    and e.embedding is not null
  order by e.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
