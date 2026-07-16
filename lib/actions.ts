'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { seedFactsFromProfile } from '@/lib/memory/server';

const PROFILE_FIELDS = [
  'age_band',
  'gender',
  'city',
  'country',
  'climate',
  'occupation',
  'lifestyle',
  'budget_band',
  'relationship_status',
] as const;

/** Save the onboarding profile, then mirror a few durable attributes into memory. */
export async function saveProfile(formData: FormData) {
  const supabase = createServerSupabase();
  if (!supabase) redirect('/auth');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/onboarding');

  const patch: Record<string, unknown> = {};
  for (const f of PROFILE_FIELDS) {
    const v = formData.get(f);
    patch[f] = typeof v === 'string' && v.trim() ? v.trim() : null;
  }
  patch.goals = formData.getAll('goals').map(String).filter(Boolean);
  patch.onboarded_at = new Date().toISOString();

  await supabase.from('profiles').update(patch).eq('user_id', user.id);

  // The Memory Engine is the heart: onboarding writes a handful of stable facts
  // so every module can read them from day one.
  await seedFactsFromProfile(user.id, patch);

  revalidatePath('/account');
  redirect('/account');
}

export async function signOut() {
  const supabase = createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect('/');
}
