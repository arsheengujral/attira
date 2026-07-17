import 'server-only';
import { getUser, createServerSupabase } from '@/lib/supabase/server';
import { writeEpisode } from '@/lib/memory/server';
import { detectReferralTriggers, detectBarrierDamage, skinResetRoutine, classifyPurgeVsBreakout, PURGE_VS_BREAKOUT } from './safety';
import { findProtocol, findMyth, MINIMUM_ROUTINE, ROUTINE_ARCHETYPES, TROUBLESHOOTING, type Protocol } from './knowledge';
import { INGREDIENTS, type Ingredient } from '@/components/data';

/**
 * The Skin Coach — 100% rule-based, zero cost, no external API.
 *
 * Instead of calling a model, it matches the question against the knowledge in
 * docs/scaffold-skin.md (protocols, ingredient matrix, myths, troubleshooting)
 * and the safety rules, then returns well-formatted cards. Safety (referral)
 * runs first. Answers are lightly personalised from the user's saved skin
 * profile when they're signed in.
 */

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
}

const DEFAULT_QUICK_REPLIES = ['Build me a simple routine', 'Is my skin purging?', 'What does niacinamide do?'];

export async function runSkinCoach(input: {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}): Promise<CoachReply> {
  const message = (input.message || '').trim();
  const t = message.toLowerCase();

  // 1) Safety gate (§21) — always first, never behind a login.
  const referral = detectReferralTriggers(message);
  if (referral.triggered) {
    if (await currentUserId()) void logQuestion(message);
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
    };
  }

  const profile = await loadSkinProfile();

  // 2) Ingredient question → the library card + a formatted answer.
  const ingredient = INGREDIENTS.find(
    (i) => i.mastery !== 'Locked' && t.includes(i.name.toLowerCase()),
  );
  if (ingredient && (t.includes('what') || t.includes('how') || t.includes('use') || t.includes('do') || t.length < 40)) {
    void logQuestion(message);
    return {
      cards: [
        { kind: 'ingredient', ingredientId: ingredient.id, title: ingredient.name, body: ingredient.tagline },
        { kind: 'answer', title: ingredient.name, body: formatIngredient(ingredient) },
      ],
      quickReplies: ['Build me a simple routine', 'Which actives conflict?', 'How do I add a new active?'],
    };
  }

  // 3) Purging vs breaking out (§18).
  if (t.includes('purg') || t.includes('breaking out') || t.includes('worse before') || t.includes('worse after starting')) {
    const startedActive = /retino|adapalene|acid|aha|bha|glycolic|salicylic|exfoliat/.test(t);
    const verdict = classifyPurgeVsBreakout({ startedActive, location: t.includes('new area') ? 'new' : 'usual', itchOrSting: t.includes('itch') || t.includes('sting') });
    void logQuestion(message);
    return {
      cards: [
        { kind: 'answer', title: 'Purging vs breaking out', body: formatPurge() },
        { kind: 'answer', body: `For what you described: ${verdict.action}` },
      ],
      quickReplies: ['My barrier feels damaged', 'How long should purging last?', 'Build me a simple routine'],
    };
  }

  // 4) Barrier damage / reset (§20).
  if (t.includes('barrier') || t.includes('over-exfoliat') || t.includes('overexfoliat') || t.includes('reset') || t.includes('raw') || (t.includes('sting') && t.includes('everything'))) {
    const reset = skinResetRoutine();
    const damage = detectBarrierDamage(message);
    void logQuestion(message);
    return {
      cards: [
        {
          kind: 'answer',
          title: 'Let’s reset your barrier',
          body:
            reset.copy +
            '\n\n' +
            reset.steps.map((s) => `• ${s}`).join('\n') +
            `\n\nHold ${reset.durationWeeks[0]}–${reset.durationWeeks[1]} weeks, then reintroduce one active slowly.` +
            (damage.signs.length ? `\n\nWhat you mentioned that fits: ${damage.signs.join(', ')}.` : ''),
        },
      ],
      quickReplies: ['What can I use meanwhile?', 'How do I reintroduce actives?'],
    };
  }

  // 5) Troubleshooting — "why isn't it working" (§27).
  if ((t.includes('not work') || t.includes("isn't work") || t.includes('no result') || t.includes('stopped working') || t.includes('nothing') && t.includes('work'))) {
    void logQuestion(message);
    return {
      cards: [{ kind: 'answer', title: 'Let’s troubleshoot', body: TROUBLESHOOTING.map((s, i) => `${i + 1}. ${s}`).join('\n') }],
      quickReplies: ['Am I over-exfoliating?', 'Is my skin purging?', 'Build me a simple routine'],
    };
  }

  // 6) Routine request (§10 / §11).
  if (t.includes('routine') || t.includes('simple') || t.includes('beginner') || t.includes('build me') || t.includes('start') || t.includes('minimal')) {
    void logQuestion(message);
    const lead = leadConcern(profile);
    return {
      cards: [
        {
          kind: 'answer',
          title: 'Your starting routine',
          body: `AM: ${MINIMUM_ROUTINE.am}\nPM: ${MINIMUM_ROUTINE.pm}\n\n${MINIMUM_ROUTINE.note}` + (lead ? `\n\nWhen you’re ready to target ${lead.title.toLowerCase()}, add one active from that protocol — one at a time.` : ''),
        },
        { kind: 'answer', title: 'As you build', body: ROUTINE_ARCHETYPES.map((a) => `${a.tier} — ${a.products}`).join('\n') },
      ],
      quickReplies: lead ? [`Help with ${lead.title.toLowerCase()}`, 'How do I add a new active?', 'What does SPF need?'] : DEFAULT_QUICK_REPLIES,
    };
  }

  // 7) A myth to correct (§22).
  const myth = findMyth(t);
  if (myth) {
    void logQuestion(message);
    return {
      cards: [{ kind: 'answer', title: 'Let’s clear that up', body: `You might’ve heard: “${myth.myth}.”\n\n${myth.truth}` }],
      quickReplies: DEFAULT_QUICK_REPLIES,
    };
  }

  // 8) A concern → its protocol (§6).
  const protocol = findProtocol(t) ?? (t.length < 30 ? leadConcern(profile) : undefined);
  if (protocol) {
    void logQuestion(message);
    return {
      cards: [{ kind: 'answer', title: protocol.title, body: formatProtocol(protocol) }],
      quickReplies: ['Which actives conflict?', 'Is my skin purging?', 'Build me a simple routine'],
    };
  }

  // 9) Fallback — never a model apology; guide them, personalised if we can.
  void logQuestion(message);
  const lead = leadConcern(profile);
  return {
    cards: [
      {
        kind: 'answer',
        body:
          (lead
            ? `Happy to help. Based on your profile, ${lead.title.toLowerCase()} is your lead concern — ask me “help with ${lead.title.toLowerCase()}” for the full protocol. `
            : 'Ask me about a concern (acne, pigmentation, dryness…), an ingredient, whether you’re purging, or for a simple routine. ') +
          'Everything here is cosmetic guidance, never medical.',
      },
    ],
    quickReplies: lead ? [`Help with ${lead.title.toLowerCase()}`, 'Build me a simple routine', 'Is my skin purging?'] : DEFAULT_QUICK_REPLIES,
  };
}

// ── formatting ───────────────────────────────────────────────────────────────

function formatProtocol(p: Protocol): string {
  const lines = [
    `AM: ${p.am.join(' → ')}`,
    `PM: ${p.pm.join(' → ')}`,
    p.weekly ? `Weekly: ${p.weekly}` : '',
    `Timeline: ${p.timeline}`,
    `The one thing: ${p.oneThing}`,
    p.refer ? `When to refer: ${p.refer}` : '',
  ];
  return lines.filter(Boolean).join('\n');
}

function formatIngredient(i: Ingredient): string {
  return [
    i.does,
    `Helps with: ${i.concerns}`,
    `When: ${i.when} · ${i.frequency}`,
    `Results: ${i.results}`,
    `Pairs well: ${i.pairs}`,
    `Use with care: ${i.caution}`,
    i.myth ? `Myth: “${i.myth.claim}” — ${i.myth.truth}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function formatPurge(): string {
  const p = PURGE_VS_BREAKOUT;
  const col = (c: { title: string; rows: string[][] }) =>
    `${c.title}:\n` + c.rows.map(([k, v]) => `  ${k}: ${v}`).join('\n');
  return `${col(p.purging)}\n\n${col(p.breakout)}\n\nIf it lasts beyond 6–8 weeks, it isn’t purging — stop.`;
}

// ── light personalisation from the saved skin profile ────────────────────────

async function currentUserId(): Promise<string | null> {
  const user = await getUser();
  return user?.id ?? null;
}

async function loadSkinProfile(): Promise<Record<string, unknown> | null> {
  const supabase = createServerSupabase();
  if (!supabase) return null;
  const user = await getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('module_profiles')
    .select('data')
    .eq('user_id', user.id)
    .eq('module_id', 'skin')
    .maybeSingle();
  return (data?.data as Record<string, unknown>) ?? null;
}

function leadConcern(profile: Record<string, unknown> | null): Protocol | undefined {
  if (!profile) return undefined;
  const ranked = Array.isArray(profile.ranked_concerns) ? profile.ranked_concerns : Array.isArray(profile.concerns) ? profile.concerns : [];
  const first = ranked[0];
  if (typeof first !== 'string') return undefined;
  return findProtocol(first.toLowerCase());
}

async function logQuestion(message: string): Promise<void> {
  const user = await getUser();
  if (user) await writeEpisode(user.id, { module: 'skin', type: 'coach', content: `Asked: ${message}` });
}
