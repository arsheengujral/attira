import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createAdminSupabase } from '@/lib/supabase/admin';
import { env, isAnthropicConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Nightly pattern extraction — reads each user's recent episodes and writes
 * derived insights to memory_patterns. This is the job that turns a timeline
 * into "you always break out on the jawline in the luteal phase". Runs offline
 * with the admin client (bypasses RLS), guarded by a shared CRON_SECRET.
 *
 * Schedule it however you like (Vercel Cron, Supabase scheduled function, an
 * external cron) with:  POST /api/jobs/patterns  Authorization: Bearer <CRON_SECRET>
 */

const MODEL = 'claude-haiku-4-5-20251001'; // fast/mid tier — batched offline work
const LOOKBACK_DAYS = 14;
const MAX_USERS = 200;
const MAX_EPISODES = 30;

function authorized(req: NextRequest): boolean {
  if (!env.cronSecret) return false;
  const header = req.headers.get('authorization') ?? '';
  const x = req.headers.get('x-cron-secret') ?? '';
  return header === `Bearer ${env.cronSecret}` || x === env.cronSecret;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = createAdminSupabase();
  if (!admin) {
    return NextResponse.json({ error: 'Supabase admin not configured.' }, { status: 503 });
  }
  if (!isAnthropicConfigured()) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'Model not configured.' });
  }

  const anthropic = new Anthropic({ apiKey: env.anthropicKey });
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 864e5).toISOString();

  // Users with recent activity.
  const { data: recent } = await admin
    .from('memory_episodes')
    .select('user_id')
    .gte('occurred_at', cutoff);
  const userIds = Array.from(new Set((recent ?? []).map((r) => r.user_id))).slice(0, MAX_USERS);

  let processed = 0;
  let written = 0;

  for (const userId of userIds) {
    try {
      const { data: episodes } = await admin
        .from('memory_episodes')
        .select('id, content, occurred_at')
        .eq('user_id', userId)
        .gte('occurred_at', cutoff)
        .order('occurred_at', { ascending: false })
        .limit(MAX_EPISODES);
      if (!episodes || episodes.length < 3) continue;

      const timeline = episodes
        .map((e) => `- (${new Date(e.occurred_at).toISOString().slice(0, 10)}) ${e.content}`)
        .join('\n');

      const msg = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 500,
        system:
          'You find durable behavioural patterns in a person\'s recent activity for a personal-care companion. ' +
          'Return 0–3 concise, specific, non-obvious patterns. Cosmetic/behavioural only — never medical claims or ' +
          'diagnoses, never judgemental. Reply with ONLY a JSON array of objects {"insight": string, "confidence": number 0..1}. ' +
          'If nothing meaningful stands out, return [].',
        messages: [{ role: 'user', content: `Recent activity:\n${timeline}` }],
      });

      const text = msg.content.find((c) => c.type === 'text');
      if (!text || text.type !== 'text') continue;
      const parsed = safeParse(text.text);
      const evidenceIds = episodes.map((e) => e.id);

      for (const p of parsed) {
        if (!p.insight) continue;
        await admin.from('memory_patterns').insert({
          user_id: userId,
          insight: p.insight,
          evidence_ids: evidenceIds,
          confidence: typeof p.confidence === 'number' ? Math.max(0, Math.min(1, p.confidence)) : 0.6,
        });
        written++;
      }
      processed++;
    } catch {
      // One user's failure never stops the batch.
      continue;
    }
  }

  return NextResponse.json({ ok: true, users: userIds.length, processed, patternsWritten: written });
}

function safeParse(text: string): { insight?: string; confidence?: number }[] {
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    const arr = JSON.parse(text.slice(start, end + 1));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
