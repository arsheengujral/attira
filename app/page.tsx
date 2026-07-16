import AttiraApp from '@/components/AttiraApp';
import { DEMO_SKIN_DATA } from '@/components/data';
import { getUser } from '@/lib/supabase/server';
import { loadSkinData } from '@/lib/skin/load';

export const dynamic = 'force-dynamic';

/**
 * ATTIRA — the Skin module. Loads the signed-in user's real data (Supabase) and
 * hands it to the screens; falls back to the demo bundle when signed out or
 * unconfigured, so the design preview always works.
 */
export default async function Page() {
  const user = await getUser();
  let data = DEMO_SKIN_DATA;
  if (user) {
    const live = await loadSkinData(user.id, user.email ?? undefined);
    if (live) data = live;
  }
  return <AttiraApp data={data} />;
}
