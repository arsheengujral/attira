import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  DEMO_SKIN_DATA,
  INGREDIENTS,
  type SkinData,
  type Ritual,
  type RitualStep,
  type Indicator,
  type Mastery,
} from '@/components/data';
import { pregnancySafeSubstitute } from './safety';

/**
 * Load a signed-in user's Skin data from the schema (module_profiles, streaks,
 * module_progress, routines, routine_completions, skin_logs, memory_patterns,
 * products) and map it into the SkinData bundle the screens consume.
 *
 * ⚠️ UNTESTED PENDING A LIVE SUPABASE CONNECTION. Written against the migrations
 * in supabase/migrations/*. Anything not yet populated falls back to the demo
 * bundle's value so a partially-set-up account still renders — `source: 'live'`
 * marks that this is a real user. When Supabase isn't configured this returns
 * null and the caller shows the demo.
 */
export async function loadSkinData(userId: string, userEmail?: string): Promise<SkinData | null> {
  const supabase = createServerSupabase();
  if (!supabase) return null;

  const demo = DEMO_SKIN_DATA;
  const data: SkinData = { ...demo, source: 'live' };

  data.name = deriveName(userEmail) ?? demo.name;

  try {
    // module_profiles (skin) — data blob + stored score.
    const { data: mp } = await supabase
      .from('module_profiles')
      .select('data, score')
      .eq('user_id', userId)
      .eq('module_id', 'skin')
      .maybeSingle();
    const blob = (mp?.data ?? {}) as Record<string, unknown>;
    if (typeof mp?.score === 'number') data.score = mp.score;
    if (typeof blob.city === 'string') data.city = blob.city;
    data.pregnant = Boolean(blob.pregnant);

    // streaks (skin).
    const { data: streak } = await supabase
      .from('streaks')
      .select('current, freezes_remaining')
      .eq('user_id', userId)
      .eq('module_id', 'skin')
      .maybeSingle();
    if (streak) {
      data.streak = streak.current ?? data.streak;
      data.freezes = streak.freezes_remaining ?? data.freezes;
    }

    // module_progress → latest value per indicator + the skin score.
    const { data: progress } = await supabase
      .from('module_progress')
      .select('metric, value, recorded_at')
      .eq('user_id', userId)
      .eq('module_id', 'skin')
      .order('recorded_at', { ascending: false })
      .limit(200);
    if (progress && progress.length) {
      const latest = new Map<string, number>();
      for (const row of progress) {
        if (!latest.has(row.metric) && typeof row.value === 'number') latest.set(row.metric, row.value);
      }
      if (latest.has('skin_score')) data.score = Math.round(latest.get('skin_score')!);
      data.indicators = data.indicators.map((ind: Indicator) =>
        latest.has(ind.key) ? { ...ind, value: Math.round(latest.get(ind.key)!) } : ind,
      );
    }

    // XP → level (simple curve: 100 XP per level).
    const { data: xp } = await supabase.from('xp_events').select('points').eq('user_id', userId);
    if (xp && xp.length) {
      const total = xp.reduce((s, r) => s + (r.points ?? 0), 0);
      data.level = Math.max(1, Math.floor(total / 100) + 1);
      data.xpPct = total % 100;
      data.xpToNext = 100 - (total % 100);
    }

    // routines (skin) → AM / PM ritual steps.
    const { data: routines } = await supabase
      .from('routines')
      .select('time_of_day, steps, active')
      .eq('user_id', userId)
      .eq('domain', 'skin')
      .eq('active', true);
    for (const r of routines ?? []) {
      const ritual = mapRoutine(r.time_of_day, r.steps);
      if (!ritual) continue;
      if (r.time_of_day === 'am') data.ritualAM = ritual;
      if (r.time_of_day === 'pm') data.ritualPM = ritual;
    }

    // Pregnancy-safe substitution (§16) — automatic + persistent.
    if (data.pregnant) {
      data.ritualAM = { ...data.ritualAM, steps: pregnancySafeSubstitute(data.ritualAM.steps, { pregnant: true }).steps };
      data.ritualPM = { ...data.ritualPM, steps: pregnancySafeSubstitute(data.ritualPM.steps, { pregnant: true }).steps };
    }

    // routine_completions → today's AM/PM done + the week strip + heat strip.
    const { data: completions } = await supabase
      .from('routine_completions')
      .select('completed_at, routine_id')
      .eq('user_id', userId)
      .gte('completed_at', new Date(Date.now() - 21 * 864e5).toISOString())
      .order('completed_at', { ascending: false });
    if (completions) {
      const byDay = bucketByDay(completions.map((c) => c.completed_at));
      data.weekStrip = buildWeekStrip(byDay);
      data.consistency = buildConsistency(byDay);
      const todayKey = dayKey(new Date());
      data.amDone = (byDay.get(todayKey) ?? 0) >= 1;
      data.pmDone = (byDay.get(todayKey) ?? 0) >= 2;
    }

    // skin_logs → check-in count for the disclosure line.
    const { count } = await supabase
      .from('skin_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (typeof count === 'number') data.checkinCount = count;

    // memory_patterns → the Today insight card (only real patterns).
    const { data: patterns } = await supabase
      .from('memory_patterns')
      .select('insight')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(1);
    data.insight = patterns && patterns.length ? patterns[0].insight : null;

    // Ingredient mastery overlay from module_profiles.data.ingredients (id→state).
    const mastery = (blob.ingredients ?? null) as Record<string, Mastery> | null;
    if (mastery) {
      data.ingredients = INGREDIENTS.map((i) => (mastery[i.id] ? { ...i, mastery: mastery[i.id] } : i));
      data.ingredientsKnown = Object.values(mastery).filter((m) => m === 'Mastered' || m === 'Learning').length;
    }
  } catch {
    // A partial failure should never blank the screen — return what we have.
    return data;
  }

  return data;
}

// ── mapping helpers ──────────────────────────────────────────────────────────

function deriveName(email?: string): string | null {
  if (!email) return null;
  const local = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  if (!local) return null;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function mapRoutine(time: string | null, steps: unknown): Ritual | null {
  if (!Array.isArray(steps) || steps.length === 0) return null;
  const kind = time === 'pm' ? 'night' : 'morning';
  const mapped: RitualStep[] = steps.map((s: Record<string, unknown>, i) => ({
    n: typeof s.n === 'number' ? s.n : i + 1,
    name: String(s.name ?? `Step ${i + 1}`),
    duration: String(s.duration ?? ''),
    why: String(s.why ?? ''),
    chips: Array.isArray(s.chips)
      ? (s.chips as unknown[]).map((c) =>
          typeof c === 'string'
            ? { label: c }
            : { label: String((c as Record<string, unknown>).label ?? ''), tone: (c as Record<string, unknown>).tone as 'neutral' | 'caution' | undefined },
        )
      : undefined,
    done: Boolean(s.done),
  }));
  const base = kind === 'night' ? DEMO_SKIN_DATA.ritualPM : DEMO_SKIN_DATA.ritualAM;
  return { ...base, steps: mapped };
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function bucketByDay(timestamps: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of timestamps) {
    const k = dayKey(new Date(t));
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function buildWeekStrip(byDay: Map<string, number>): SkinData['weekStrip'] {
  const labels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const monday = new Date(today);
  const dow = (today.getDay() + 6) % 7; // 0 = Monday
  monday.setDate(today.getDate() - dow);
  const strip: SkinData['weekStrip'] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = dayKey(d);
    const isToday = key === dayKey(today);
    const done = (byDay.get(key) ?? 0) >= 2;
    strip.push({ d: labels[d.getDay()], state: done ? 'done' : isToday ? 'today' : d > today ? 'upcoming' : 'upcoming' });
  }
  return strip;
}

function buildConsistency(byDay: Map<string, number>): number[] {
  const out: number[] = [];
  const today = new Date();
  for (let i = 20; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const n = byDay.get(dayKey(d)) ?? 0;
    out.push(Math.min(3, n));
  }
  return out;
}
