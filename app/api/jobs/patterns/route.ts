import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Nightly pattern extraction — 100% rule-based, zero cost, no model. It reads
 * each active user's recent episodes and derives a few durable insights with
 * deterministic detectors, writing new ones to memory_patterns (skipping
 * duplicates). Runs offline with the admin client, guarded by CRON_SECRET.
 *
 *   POST /api/jobs/patterns   Authorization: Bearer <CRON_SECRET>
 */

const LOOKBACK_DAYS = 14;
const MAX_USERS = 500;
const MAX_EPISODES = 60;

function authorized(req: NextRequest): boolean {
  if (!env.cronSecret) return false;
  const header = req.headers.get('authorization') ?? '';
  const x = req.headers.get('x-cron-secret') ?? '';
  return header === `Bearer ${env.cronSecret}` || x === env.cronSecret;
}

interface Episode { content: string; type: string | null; occurred_at: string }

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createAdminSupabase();
  if (!admin) return NextResponse.json({ error: 'Supabase admin not configured.' }, { status: 503 });

  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 864e5).toISOString();
  const { data: recent } = await admin.from('memory_episodes').select('user_id').gte('occurred_at', cutoff);
  const userIds = Array.from(new Set((recent ?? []).map((r) => r.user_id))).slice(0, MAX_USERS);

  let processed = 0;
  let written = 0;

  for (const userId of userIds) {
    try {
      const { data: episodes } = await admin
        .from('memory_episodes')
        .select('content, type, occurred_at')
        .eq('user_id', userId)
        .gte('occurred_at', cutoff)
        .order('occurred_at', { ascending: false })
        .limit(MAX_EPISODES);
      if (!episodes || episodes.length < 3) continue;

      const derived = detectPatterns(episodes as Episode[]);
      if (!derived.length) {
        processed++;
        continue;
      }

      // Skip insights that already exist (dedupe).
      const { data: existing } = await admin.from('memory_patterns').select('insight').eq('user_id', userId);
      const seen = new Set((existing ?? []).map((p) => (p.insight as string).toLowerCase()));

      for (const d of derived) {
        if (seen.has(d.insight.toLowerCase())) continue;
        await admin.from('memory_patterns').insert({ user_id: userId, insight: d.insight, evidence_ids: [], confidence: d.confidence });
        written++;
      }
      processed++;
    } catch {
      continue;
    }
  }

  return NextResponse.json({ ok: true, mode: 'rule-based', users: userIds.length, processed, patternsWritten: written });
}

// ── deterministic detectors (no model) ───────────────────────────────────────

const CONCERN_KEYWORDS: [string, string][] = [
  ['acne', 'breakouts'],
  ['pigment', 'pigmentation'],
  ['dry', 'dryness'],
  ['redness', 'redness'],
  ['pore', 'pores'],
  ['dull', 'dullness'],
  ['texture', 'texture'],
  ['oil', 'oiliness'],
  ['sensitiv', 'sensitivity'],
];

function detectPatterns(episodes: Episode[]): { insight: string; confidence: number }[] {
  const out: { insight: string; confidence: number }[] = [];
  const text = episodes.map((e) => e.content.toLowerCase());
  const joined = text.join(' \n ');

  // 1) Fragrance sensitivity.
  const fragranceHits = text.filter((c) => /fragrance|parfum/.test(c) && /(react|irritat|sting|bump|red|broke out)/.test(c)).length;
  if (fragranceHits >= 1) out.push({ insight: 'Sensitive to fragrance — we’ll flag fragranced products for you.', confidence: 0.75 });

  // 2) Cyclical jawline flares.
  const jawline = text.filter((c) => /jawline/.test(c)).length;
  if (jawline >= 2 && /(cycle|luteal|before (my )?period|day 2\d)/.test(joined)) {
    out.push({ insight: 'Your jawline tends to flare in the luteal phase — we can anticipate it.', confidence: 0.6 });
  }

  // 3) Ritual consistency this fortnight.
  const rituals = episodes.filter((e) => e.type === 'ritual').length;
  if (rituals >= 8) out.push({ insight: 'You’ve been remarkably consistent with your rituals this fortnight.', confidence: 0.8 });

  // 4) A recurring focus concern.
  let top: { name: string; n: number } | null = null;
  for (const [kw, name] of CONCERN_KEYWORDS) {
    const n = text.filter((c) => c.includes(kw)).length;
    if (n >= 3 && (!top || n > top.n)) top = { name, n };
  }
  if (top) out.push({ insight: `You keep coming back to ${top.name} — let’s make it the plan’s priority.`, confidence: 0.6 });

  return out.slice(0, 3);
}
