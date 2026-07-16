/**
 * Centralised, type-safe access to environment configuration.
 *
 * The app must boot and run in a graceful degraded mode when external services
 * are not yet configured — so nothing here throws on a missing key. Helpers let
 * any module ask "is X wired?" instead of crashing. Server-only secrets are
 * never read into client bundles (they are only referenced from server modules).
 */

export const env = {
  // Public — safe to expose to the browser.
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

  // Server-only secrets.
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  anthropicKey: process.env.ANTHROPIC_API_KEY ?? '',
  // Optional embeddings provider (OpenAI-compatible). Memory retrieval degrades
  // to recency when this is absent — it is never required.
  embeddingsApiKey: process.env.EMBEDDINGS_API_KEY ?? '',
  embeddingsUrl:
    process.env.EMBEDDINGS_API_URL ?? 'https://api.openai.com/v1/embeddings',
  embeddingsModel: process.env.EMBEDDINGS_MODEL ?? 'text-embedding-3-small',
  // Shared secret protecting the nightly pattern-extraction job route.
  cronSecret: process.env.CRON_SECRET ?? '',
};

export const isSupabaseConfigured = (): boolean =>
  Boolean(env.supabaseUrl && env.supabaseAnonKey);

export const isAdminConfigured = (): boolean =>
  Boolean(env.supabaseUrl && env.supabaseServiceKey);

export const isAnthropicConfigured = (): boolean => Boolean(env.anthropicKey);

export const isEmbeddingsConfigured = (): boolean => Boolean(env.embeddingsApiKey);
