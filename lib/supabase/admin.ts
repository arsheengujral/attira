import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env, isAdminConfigured } from '@/lib/env';

/**
 * Service-role Supabase client — BYPASSES RLS. Server-only; never import into a
 * client component. Use sparingly: confirmed sign-up (no user session yet) and
 * the nightly pattern-extraction job (runs offline, across users).
 *
 * Returns `null` when the service role key isn't configured.
 */
export function createAdminSupabase() {
  if (!isAdminConfigured()) return null;
  return createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
