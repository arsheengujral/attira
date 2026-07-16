'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { writeEpisode } from '@/lib/memory/server';

/**
 * Skin write-backs. Called from the ritual + check-in flows. They no-op cleanly
 * when Supabase isn't configured or nobody is signed in, so the design preview
 * keeps working untouched.
 *
 * ⚠️ UNTESTED PENDING A LIVE SUPABASE CONNECTION — written against the schema in
 * supabase/migrations/*.
 */

const XP = { am: 20, pm: 30, checkin: 15 } as const;

export async function completeRitual(which: 'am' | 'pm'): Promise<{ ok: boolean }> {
  const supabase = createServerSupabase();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: routine } = await supabase
    .from('routines')
    .select('id')
    .eq('user_id', user.id)
    .eq('domain', 'skin')
    .eq('time_of_day', which)
    .eq('active', true)
    .maybeSingle();

  await supabase.from('routine_completions').insert({ user_id: user.id, routine_id: routine?.id ?? null });
  await supabase
    .from('xp_events')
    .insert({ user_id: user.id, module_id: 'skin', action: `ritual_${which}`, points: XP[which] });

  // Completing the PM ritual closes the day and advances the streak.
  if (which === 'pm') {
    const today = new Date().toISOString().slice(0, 10);
    const { data: s } = await supabase
      .from('streaks')
      .select('current, longest, last_active')
      .eq('user_id', user.id)
      .eq('module_id', 'skin')
      .maybeSingle();
    const current = (s?.current ?? 0) + (s?.last_active === today ? 0 : 1);
    const longest = Math.max(s?.longest ?? 0, current);
    await supabase
      .from('streaks')
      .upsert(
        { user_id: user.id, module_id: 'skin', current, longest, last_active: today },
        { onConflict: 'user_id,module_id' },
      );
  }

  await writeEpisode(user.id, {
    module: 'skin',
    type: 'ritual',
    content: `Completed the ${which.toUpperCase()} ritual`,
  });
  return { ok: true };
}

export async function logCheckIn(payload: {
  indicators: Record<string, number>;
  score: number;
  note?: string;
  concerns?: string[];
}): Promise<{ ok: boolean }> {
  const supabase = createServerSupabase();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  await supabase.from('skin_logs').insert({
    user_id: user.id,
    concerns: payload.concerns ?? [],
    notes: payload.note ?? null,
  });

  const now = new Date().toISOString();
  const rows = [
    ...Object.entries(payload.indicators).map(([metric, value]) => ({
      user_id: user.id,
      module_id: 'skin',
      metric,
      value,
      recorded_at: now,
    })),
    { user_id: user.id, module_id: 'skin', metric: 'skin_score', value: payload.score, recorded_at: now },
  ];
  await supabase.from('module_progress').insert(rows);

  await supabase
    .from('module_profiles')
    .upsert(
      { user_id: user.id, module_id: 'skin', score: Math.round(payload.score), updated_at: now },
      { onConflict: 'user_id,module_id' },
    );

  await supabase
    .from('xp_events')
    .insert({ user_id: user.id, module_id: 'skin', action: 'checkin', points: XP.checkin });

  await writeEpisode(user.id, {
    module: 'skin',
    type: 'checkin',
    content: `Check-in completed — score ${Math.round(payload.score)}${payload.note ? `; noted: ${payload.note}` : ''}`,
  });
  return { ok: true };
}
