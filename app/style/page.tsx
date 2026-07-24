import StyleApp from '@/components/style/StyleApp';
import { createServerSupabase } from '@/lib/supabase/server';
import type { StyleProfileInput } from '@/lib/style/compute';

export const dynamic = 'force-dynamic';

/**
 * The Style module — assessment → the six structured outputs. Loads the user's
 * saved style profile (module_profiles) when signed in so they land on their
 * result; otherwise starts the assessment. Public so it also works as a preview.
 */
export default async function StylePage() {
  let initial: (StyleProfileInput & Record<string, unknown>) | null = null;
  const supabase = createServerSupabase();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('module_profiles')
        .select('data')
        .eq('user_id', user.id)
        .eq('module_id', 'style')
        .maybeSingle();
      const blob = data?.data as (StyleProfileInput & Record<string, unknown>) | undefined;
      if (blob && blob.gender) initial = blob;
    }
  }
  return <StyleApp initial={initial} />;
}
