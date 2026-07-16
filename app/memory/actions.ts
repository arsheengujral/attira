'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

async function requireUser() {
  const supabase = createServerSupabase();
  if (!supabase) redirect('/auth');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/memory');
  return { supabase, user };
}

export async function deleteMemoryRow(formData: FormData) {
  const table = String(formData.get('table'));
  const id = String(formData.get('id'));
  const allowed = new Set(['memory_facts', 'memory_episodes', 'memory_patterns']);
  if (!allowed.has(table) || !id) return;
  const { supabase, user } = await requireUser();
  await supabase.from(table).delete().eq('id', id).eq('user_id', user.id);
  revalidatePath('/memory');
}

export async function deleteAllMemory() {
  const { supabase, user } = await requireUser();
  for (const t of ['memory_facts', 'memory_episodes', 'memory_patterns']) {
    await supabase.from(t).delete().eq('user_id', user.id);
  }
  revalidatePath('/memory');
}

export async function setConsent(formData: FormData) {
  const category = String(formData.get('category'));
  const granted = formData.get('granted') === 'true';
  if (!category) return;
  const { supabase, user } = await requireUser();
  await supabase.from('memory_consent').upsert(
    { user_id: user.id, category, granted, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,category' },
  );
  revalidatePath('/memory');
}
