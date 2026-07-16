import 'server-only';
import { env, isEmbeddingsConfigured } from '@/lib/env';

/**
 * Embed text for semantic memory retrieval. Uses an OpenAI-compatible endpoint
 * when configured; otherwise returns null and retrieval degrades gracefully to
 * recency. Never throws — a failed embedding must not break a write.
 */
export async function embed(text: string): Promise<number[] | null> {
  if (!isEmbeddingsConfigured() || !text.trim()) return null;
  try {
    const res = await fetch(env.embeddingsUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${env.embeddingsApiKey}`,
      },
      body: JSON.stringify({ model: env.embeddingsModel, input: text.slice(0, 8000) }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { data?: { embedding?: number[] }[] };
    return data?.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}
