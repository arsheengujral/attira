import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { Landing } from '@/components/Landing';

export const dynamic = 'force-dynamic';

/**
 * The front door. Signed-in visitors go straight to their dashboard; everyone
 * else sees the landing page. (When Supabase isn't configured, getUser() is
 * null, so the landing shows — the app is still previewable.)
 */
export default async function Page() {
  const user = await getUser();
  if (user) redirect('/home');
  return <Landing />;
}
