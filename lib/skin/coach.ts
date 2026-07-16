import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { env, isAnthropicConfigured } from '@/lib/env';
import { getUser } from '@/lib/supabase/server';
import { retrieveContext, writeEpisode } from '@/lib/memory/server';
import { skinModule } from '@/lib/modules/skin';
import { getSkinScaffold } from './scaffold';
import { detectReferralTriggers } from './safety';
import { INGREDIENTS } from '@/components/data';
import type { RetrievedContext } from '@/lib/memory/types';

// Mid-tier for everyday coaching chat (Part 5 routing). Frontier for the heaviest
// reasoning could be swapped in per-task later.
const MODEL = 'claude-sonnet-5';

export type CoachCardKind = 'answer' | 'referral' | 'ingredient';

export interface CoachCard {
  kind: CoachCardKind;
  title?: string;
  body: string;
  ingredientId?: string;
  reasons?: string[];
  emergency?: boolean;
}

export interface CoachReply {
  cards: CoachCard[];
  quickReplies: string[];
  threadId?: string;
  configured: boolean;
}

const DEFAULT_QUICK_REPLIES = [
  'Build me a simple routine',
  'Is my skin purging?',
  'What does niacinamide do?',
];

/**
 * Run one turn of the Skin Coach. Safety first: referral triggers are detected
 * deterministically (works with no model, no login) and short-circuit to a warm
 * hand-off. Otherwise the scaffold-driven system prompt + selective memory go to
 * the model, and the turn is logged as a memory episode.
 */
export async function runSkinCoach(input: {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}): Promise<CoachReply> {
  const message = (input.message || '').trim();

  // 1) Safety gate (§21) — never gated behind the model or a login.
  const referral = detectReferralTriggers(message);
  if (referral.triggered) {
    return {
      cards: [
        {
          kind: 'referral',
          title: referral.emergency ? 'Please get this looked at now' : 'Worth seeing a dermatologist',
          body:
            referral.message +
            (referral.interim.length
              ? '\n\nIn the meantime, keep it simple:\n' + referral.interim.map((s) => `• ${s}`).join('\n')
              : ''),
          reasons: referral.reasons,
          emergency: referral.emergency,
        },
      ],
      quickReplies: ['A gentle routine while I wait', 'What should I tell the doctor?'],
      configured: isAnthropicConfigured(),
    };
  }

  // 2) Gather selective memory (empty when not logged in / not configured).
  const user = await getUser();
  let memory: RetrievedContext = { facts: [], moduleProfile: null, episodes: [], patterns: [] };
  if (user) memory = await retrieveContext(user.id, 'skin', message);

  // 3) An ingredient question? Offer the library card alongside the answer.
  const matchedIngredient = INGREDIENTS.find(
    (i) => i.mastery !== 'Locked' && message.toLowerCase().includes(i.name.toLowerCase()),
  );

  // 4) If the model isn't configured, still be useful (safety + library), and say so.
  if (!isAnthropicConfigured()) {
    const cards: CoachCard[] = [];
    if (matchedIngredient) {
      cards.push({ kind: 'ingredient', ingredientId: matchedIngredient.id, title: matchedIngredient.name, body: matchedIngredient.does });
    }
    cards.push({
      kind: 'answer',
      body:
        'Your guide’s full conversational answers switch on once an Anthropic API key is set (ANTHROPIC_API_KEY). ' +
        'Everything else here — your rituals, check-ins, library and safety guidance — works now.',
    });
    return { cards, quickReplies: DEFAULT_QUICK_REPLIES, configured: false };
  }

  // 5) Ask the model, with the scaffold as the system prompt (§29 + knowledge).
  const scaffold = await getSkinScaffold();
  const memoryBlock = buildMemoryBlock(memory);
  const system =
    (scaffold || skinModule.coach({ query: message, memory }).system) +
    (memoryBlock ? `\n\n--- WHAT YOU REMEMBER ABOUT THIS PERSON ---\n${memoryBlock}` : '');

  const anthropic = new Anthropic({ apiKey: env.anthropicKey });
  const history = (input.history ?? []).slice(-8);
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 700,
    system,
    messages: [...history, { role: 'user', content: message }],
  });
  const text = msg.content.find((c) => c.type === 'text');
  const answer = text && text.type === 'text' ? text.text.trim() : 'Let me come back to that.';

  const cards: CoachCard[] = [];
  if (matchedIngredient) {
    cards.push({ kind: 'ingredient', ingredientId: matchedIngredient.id, title: matchedIngredient.name, body: matchedIngredient.does });
  }
  cards.push({ kind: 'answer', body: answer });

  // 6) Remember the exchange (episode) so future turns feel continuous.
  if (user) {
    await writeEpisode(user.id, { module: 'skin', type: 'coach', content: `Asked: ${message}` });
  }

  return { cards, quickReplies: DEFAULT_QUICK_REPLIES, configured: true };
}

function buildMemoryBlock(memory: RetrievedContext): string {
  const facts = memory.facts.map((f) => `${f.key}: ${f.value}`).join('; ');
  const patterns = memory.patterns.map((p) => `- ${p.insight}`).join('\n');
  const episodes = memory.episodes.slice(0, 6).map((e) => `- ${e.content}`).join('\n');
  return [
    facts && `Known: ${facts}`,
    memory.moduleProfile && `Skin profile: ${JSON.stringify(memory.moduleProfile)}`,
    patterns && `Patterns:\n${patterns}`,
    episodes && `Recent:\n${episodes}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}
