'use server';

import { createServerSupabase } from '@/lib/supabase/server';
import { writeEpisode } from '@/lib/memory/server';
import { styleModule } from '@/lib/modules/style';
import { computeStyleProfile, describeStyleResult, type StyleProfileInput } from './compute';

/**
 * Persist a computed style profile to module_profiles(style) + a memory episode.
 * No-ops cleanly when signed out or unconfigured, so the assessment still works
 * as a preview. (Untested pending a live Supabase connection.)
 */
export async function saveStyleProfile(input: StyleProfileInput): Promise<{ ok: boolean }> {
  const supabase = createServerSupabase();
  if (!supabase) return { ok: false };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const result = computeStyleProfile(input);
  const score = styleModule.score({ profile: input as unknown as Record<string, unknown> });

  await supabase.from('module_profiles').upsert(
    {
      user_id: user.id,
      module_id: 'style',
      data: { ...input, computed: result },
      score,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,module_id' },
  );

  await writeEpisode(user.id, {
    module: 'style',
    type: 'assessment',
    content: `Style profile set — ${describeStyleResult(result).split('\n')[0]}`,
  });
  return { ok: true };
}
