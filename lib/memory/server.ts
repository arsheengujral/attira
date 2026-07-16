import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';
import { embed } from './embeddings';
import type { Fact, Episode, Pattern, Consent, RetrievedContext } from './types';

/**
 * The Memory Engine — one shared brain. Every module writes what it learns here;
 * every module reads from here. Writes/reads run with the caller's session, so
 * RLS keeps each user's memory private. All calls no-op safely when Supabase is
 * not configured.
 */

// ── Writes ──────────────────────────────────────────────────────────────────

export async function writeFact(
  userId: string,
  key: string,
  value: string | null,
  opts: { confidence?: number; sourceModule?: string; sensitive?: boolean } = {},
): Promise<void> {
  const supabase = createServerSupabase();
  if (!supabase) return;
  await supabase.from('memory_facts').upsert(
    {
      user_id: userId,
      key,
      value,
      confidence: opts.confidence ?? 0.85,
      source_module: opts.sourceModule ?? null,
      sensitive: opts.sensitive ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,key' },
  );
}

export async function writeEpisode(
  userId: string,
  ep: { module?: string; type?: string; content: string; occurredAt?: string },
): Promise<void> {
  const supabase = createServerSupabase();
  if (!supabase) return;
  const embedding = await embed(ep.content);
  await supabase.from('memory_episodes').insert({
    user_id: userId,
    module: ep.module ?? null,
    type: ep.type ?? null,
    content: ep.content,
    embedding,
    occurred_at: ep.occurredAt ?? new Date().toISOString(),
  });
}

export async function writePattern(
  userId: string,
  insight: string,
  evidenceIds: string[] = [],
  confidence = 0.6,
): Promise<void> {
  const supabase = createServerSupabase();
  if (!supabase) return;
  await supabase.from('memory_patterns').insert({
    user_id: userId,
    insight,
    evidence_ids: evidenceIds,
    confidence,
  });
}

/** Onboarding mirrors a few stable profile attributes into memory. */
export async function seedFactsFromProfile(
  userId: string,
  profile: Record<string, unknown>,
): Promise<void> {
  const sensitiveKeys = new Set(['budget_band', 'relationship_status']);
  const keys = [
    'age_band',
    'gender',
    'city',
    'country',
    'climate',
    'occupation',
    'lifestyle',
    'budget_band',
    'relationship_status',
  ];
  for (const k of keys) {
    const v = profile[k];
    if (typeof v === 'string' && v) {
      await writeFact(userId, k, v, { sourceModule: 'profile', sensitive: sensitiveKeys.has(k) });
    }
  }
  await writeEpisode(userId, {
    module: 'profile',
    type: 'onboarding',
    content: `Completed onboarding — ${keys
      .map((k) => (typeof profile[k] === 'string' && profile[k] ? `${k}: ${profile[k]}` : null))
      .filter(Boolean)
      .join(', ')}`,
  });
}

// ── Retrieval (selective, not a memory dump) ────────────────────────────────

export async function getCoreFacts(userId: string, limit = 20): Promise<Fact[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('memory_facts')
    .select('id, key, value, confidence, source_module, sensitive, updated_at')
    .eq('user_id', userId)
    .eq('sensitive', false)
    .order('confidence', { ascending: false })
    .limit(limit);
  return (data ?? []) as Fact[];
}

/**
 * Context for a module call: core facts + the active module's profile + the
 * top-k relevant episodes/patterns (semantic when embeddings are available,
 * else recent). Recent patterns are always included — they're the uncanny part.
 */
export async function retrieveContext(
  userId: string,
  moduleId: string,
  query: string,
  k = 8,
): Promise<RetrievedContext> {
  const supabase = createServerSupabase();
  if (!supabase) return { facts: [], moduleProfile: null, episodes: [], patterns: [] };

  const facts = await getCoreFacts(userId);

  const { data: mp } = await supabase
    .from('module_profiles')
    .select('data')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle();

  let episodes: Episode[] = [];
  const queryEmbedding = await embed(query);
  if (queryEmbedding) {
    const { data } = await supabase.rpc('match_memory_episodes', {
      query_embedding: queryEmbedding,
      match_count: k,
    });
    episodes = (data ?? []) as Episode[];
  } else {
    const { data } = await supabase
      .from('memory_episodes')
      .select('id, module, type, content, occurred_at')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: false })
      .limit(k);
    episodes = (data ?? []) as Episode[];
  }

  const { data: patterns } = await supabase
    .from('memory_patterns')
    .select('id, insight, evidence_ids, confidence, generated_at')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false })
    .limit(5);

  return {
    facts,
    moduleProfile: (mp?.data as Record<string, unknown>) ?? null,
    episodes,
    patterns: (patterns ?? []) as Pattern[],
  };
}

// ── Reads + management (Memory settings page) ───────────────────────────────

export async function listFacts(userId: string): Promise<Fact[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('memory_facts')
    .select('id, key, value, confidence, source_module, sensitive, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  return (data ?? []) as Fact[];
}

export async function listEpisodes(userId: string, limit = 50): Promise<Episode[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('memory_episodes')
    .select('id, module, type, content, occurred_at')
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Episode[];
}

export async function listPatterns(userId: string): Promise<Pattern[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('memory_patterns')
    .select('id, insight, evidence_ids, confidence, generated_at')
    .eq('user_id', userId)
    .order('generated_at', { ascending: false });
  return (data ?? []) as Pattern[];
}

export async function listConsent(userId: string): Promise<Consent[]> {
  const supabase = createServerSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('memory_consent')
    .select('category, granted, updated_at')
    .eq('user_id', userId)
    .order('category');
  return (data ?? []) as Consent[];
}

/** Everything ATTIRA remembers about you — for the export button. */
export async function exportMemory(userId: string) {
  const [facts, episodes, patterns, consent] = await Promise.all([
    listFacts(userId),
    listEpisodes(userId, 1000),
    listPatterns(userId),
    listConsent(userId),
  ]);
  return { exported_at: new Date().toISOString(), facts, episodes, patterns, consent };
}
