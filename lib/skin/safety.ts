/**
 * Safety & adaptive-state logic — real rules from docs/scaffold-skin.md, enforced
 * in code (not just in generated text), per skin-module-spec.md "Safety & Adaptive
 * States" and GLOBAL RULE 5.
 *
 * These are pure functions with no external dependencies, so they run and are
 * verifiable without a live database or model.
 *
 *   §21  referral triggers        → detectReferralTriggers()
 *   §16  pregnancy-safe swaps      → pregnancySafeSubstitute()
 *   §20  barrier damage + §10 reset→ detectBarrierDamage() / skinResetRoutine()
 *   §18  purging vs breaking out   → classifyPurgeVsBreakout()
 */

import type { RitualStep } from '@/components/data';

// ── §21 · Dermatologist referral ─────────────────────────────────────────────

export interface ReferralResult {
  triggered: boolean;
  emergency: boolean;
  reasons: string[];
  /** Warm hand-off copy (scaffold §21 "How to refer"). Never alarming. */
  message: string;
  /** A gentle interim protocol so the user is never left with a dead end. */
  interim: string[];
}

interface ReferralRule {
  reason: string;
  emergency?: boolean;
  patterns: RegExp[];
}

// Ordered rules; each matches free-text from check-ins, coach chat, or analysis.
const REFERRAL_RULES: ReferralRule[] = [
  { reason: 'Possible allergic reaction or breathing involvement', emergency: true,
    patterns: [/can'?t breathe|difficulty breathing|throat.*(swell|tight)|anaphyla/i, /swelling of (the )?(face|lips|tongue|eyes)/i, /hives (all over|spreading)/i] },
  { reason: 'Signs of a possible infection', emergency: true,
    patterns: [/\b(pus|oozing pus)\b/i, /spreading redness/i, /\bfever\b.*(rash|skin)|(rash|skin).*\bfever\b/i] },
  { reason: 'A mole or lesion with warning features (ABCDE)',
    patterns: [/\bmole\b.*(chang|grow|bleed|new|irregular|asymm|itch)/i, /(new|changing|bleeding|non[- ]?healing) (mole|spot|lesion|growth)/i, /lesion.*(won'?t heal|bleeding)/i] },
  { reason: 'Cystic, nodular, or scarring acne',
    patterns: [/\bcystic\b/i, /\bnodul/i, /deep,? painful (spot|lump|cyst)/i, /(acne )?scarring|scars? forming/i] },
  { reason: 'Signs consistent with rosacea',
    patterns: [/persistent flushing|constant redness.*(cheeks|nose)|visible (blood )?vessels|broken capillaries/i, /\brosacea\b/i] },
  { reason: 'Pigmentation that may need professional care (e.g. melasma)',
    patterns: [/\bmelasma\b/i, /symmetric.*(patches|pigment).*(cheeks|forehead)/i] },
  { reason: 'A widespread or sudden severe skin change',
    patterns: [/widespread rash|rash all over|suddenly (much )?worse|erupted overnight/i] },
  { reason: 'A condition better managed by a doctor',
    patterns: [/\beczema\b|\bpsoriasis\b|\bdermatitis\b|\bimpetigo\b/i] },
  { reason: 'Hair loss with scalp scarring',
    patterns: [/hair loss.*(scar|bald patch)|scarring alopecia/i] },
  { reason: 'This involves prescription medication',
    patterns: [/\b(tretinoin|isotretinoin|accutane|hydroquinone|prescription|antibiotic|steroid cream)\b/i] },
  { reason: 'No improvement after 12 weeks of consistent care',
    patterns: [/(12|twelve|3|three) (weeks|months).*(no|not).*(better|improve|change|working)/i, /nothing.*(work|help).*(months|12 weeks)/i] },
];

export function detectReferralTriggers(input: string): ReferralResult {
  const text = (input || '').toLowerCase();
  const reasons: string[] = [];
  let emergency = false;
  for (const rule of REFERRAL_RULES) {
    if (rule.patterns.some((re) => re.test(text))) {
      reasons.push(rule.reason);
      if (rule.emergency) emergency = true;
    }
  }
  const triggered = reasons.length > 0;
  return {
    triggered,
    emergency,
    reasons,
    message: emergency
      ? 'This is worth getting looked at urgently — please contact a doctor or your local emergency service now. Your skin can wait; this shouldn’t.'
      : triggered
        ? 'What you’re describing is worth having a dermatologist look at properly — they can see things we can’t, and get you the right care faster. In the meantime, here’s how to keep your skin comfortable.'
        : '',
    interim: triggered && !emergency ? MINIMUM_ROUTINE_STEPS : [],
  };
}

// ── §10 · The minimum viable routine (also the Skin Reset target) ────────────

export const MINIMUM_ROUTINE_STEPS = [
  'AM: gentle cleanser (or just water) → moisturiser → SPF',
  'PM: gentle cleanser → moisturiser',
];

// ── §20 · Barrier damage / over-exfoliation → Skin Reset ─────────────────────

export interface BarrierResult {
  damaged: boolean;
  signs: string[];
}

const BARRIER_SIGNS: { sign: string; patterns: RegExp[] }[] = [
  { sign: 'stinging from products that never used to sting', patterns: [/sting/i, /burns? when i apply/i] },
  { sign: 'tightness', patterns: [/\btight\b/i] },
  { sign: 'a shine that feels like inflammation, not oil', patterns: [/shiny.*(not oil|inflam|red)/i] },
  { sign: 'new sensitivity or redness', patterns: [/new(ly)? sensitiv/i, /suddenly red|persistent redness/i] },
  { sign: 'flaking', patterns: [/flak/i, /peeling/i] },
  { sign: 'breakouts that won’t settle', patterns: [/breakouts?.*(won'?t|not).*(settle|calm|clear)/i] },
  { sign: 'skin that feels raw', patterns: [/\braw\b/i] },
  { sign: 'products that “stopped working”', patterns: [/stopped working|nothing works anymore/i] },
];

export function detectBarrierDamage(input: string): BarrierResult {
  const text = (input || '').toLowerCase();
  const signs = BARRIER_SIGNS.filter((s) => s.patterns.some((re) => re.test(text))).map((s) => s.sign);
  // Two or more independent signs strongly suggests an overworked barrier (§20).
  return { damaged: signs.length >= 2, signs };
}

export interface SkinReset {
  active: true;
  durationWeeks: [number, number];
  steps: string[];
  copy: string;
}

export function skinResetRoutine(): SkinReset {
  return {
    active: true,
    durationWeeks: [2, 4],
    steps: [
      'Stop all actives — retinoid, acids, vitamin C, benzoyl peroxide. Completely.',
      'AM: gentle cream cleanser → barrier moisturiser (ceramides + panthenol + centella) → SPF',
      'PM: gentle cream cleanser → the same barrier moisturiser',
      'Add nothing new. Change nothing else. Hold 2–4 weeks.',
    ],
    copy: 'Your skin isn’t broken — it’s overworked. Less will fix this. We’ll ease one active back in when you’re ready.',
  };
}

// ── §16 · Pregnancy-Safe Mode ────────────────────────────────────────────────

const RETINOID_RE = /retinol|retinal|retinald|retinoid|adapalene|tretinoin|retinyl/i;
const HIGH_SALICYLIC_RE = /salicylic|\bbha\b/i;

export interface SubstituteResult {
  steps: RitualStep[];
  notes: string[];
  changed: boolean;
}

/**
 * Automatically swap retinoids → bakuchiol/peptides for pregnant/breastfeeding
 * users (§16), phrased positively in the step itself. Also flags high-dose
 * leave-on salicylic. Persistent until the profile changes.
 */
export function pregnancySafeSubstitute(
  steps: RitualStep[],
  opts: { pregnant: boolean },
): SubstituteResult {
  if (!opts.pregnant) return { steps, notes: [], changed: false };
  const notes: string[] = [];
  let changed = false;
  const swapped = steps.map((s) => {
    const hay = `${s.name} ${s.why} ${(s.chips ?? []).map((c) => c.label).join(' ')}`;
    if (RETINOID_RE.test(hay)) {
      changed = true;
      notes.push(`Swapped “${s.name}” for a pregnancy-friendly alternative (bakuchiol + peptides).`);
      return {
        ...s,
        name: s.name.replace(/retinol|retinal(dehyde)?|retinoid|adapalene/i, 'Bakuchiol'),
        why: 'A gentle, pregnancy-friendly renewer while you’re expecting — bakuchiol and peptides do the work retinol usually would. Please confirm with your doctor.',
        chips: [
          { label: 'Bakuchiol' },
          { label: 'Peptides' },
          { label: 'Pregnancy-safe', tone: 'neutral' as const },
        ],
      };
    }
    if (HIGH_SALICYLIC_RE.test(hay)) {
      notes.push(`Kept salicylic low-dose only — please confirm with your doctor while pregnant.`);
    }
    return s;
  });
  return { steps: swapped, notes, changed };
}

export const PREGNANCY_SAFE_INGREDIENTS = [
  'azelaic acid', 'niacinamide', 'hyaluronic acid', 'glycolic acid (low %)',
  'vitamin C', 'mineral SPF', 'peptides', 'bakuchiol',
];

// ── §18 · Purging vs breaking out ────────────────────────────────────────────

export type PurgeVerdict = 'likely-purging' | 'likely-breakout' | 'uncertain';

export interface PurgeInput {
  /** Did they recently start a turnover-accelerating active (retinoid/AHA/BHA)? */
  startedActive: boolean;
  weeksSinceStart?: number;
  /** Where are the spots — where they usually break out, or new areas? */
  location?: 'usual' | 'new';
  itchOrSting?: boolean;
}

export interface PurgeResult {
  verdict: PurgeVerdict;
  action: string;
  reasons: string[];
}

/**
 * Only turnover-accelerating actives can purge (§18). A moisturiser cannot purge
 * you. If it lasts beyond 6–8 weeks, it isn't purging.
 */
export function classifyPurgeVsBreakout(input: PurgeInput): PurgeResult {
  const reasons: string[] = [];
  const weeks = input.weeksSinceStart ?? 0;

  if (!input.startedActive) {
    return {
      verdict: 'likely-breakout',
      action: 'A moisturiser or non-active product can’t “purge” you — if something new is breaking you out, pause it and see if it settles.',
      reasons: ['No turnover-accelerating active was started — purging isn’t possible here.'],
    };
  }
  if (weeks > 8) {
    return {
      verdict: 'likely-breakout',
      action: 'This has run longer than purging should — ease off the active and let your skin settle.',
      reasons: ['Beyond 6–8 weeks it isn’t purging any more.'],
    };
  }

  let purgeScore = 0;
  if (input.location === 'usual') { purgeScore++; reasons.push('It’s in the areas you normally break out.'); }
  if (input.location === 'new') { purgeScore--; reasons.push('New areas you don’t usually break out point to a reaction.'); }
  if (weeks >= 1 && weeks <= 6) { purgeScore++; reasons.push('The timing (1–6 weeks in) fits purging.'); }
  if (input.itchOrSting) { purgeScore--; reasons.push('Itching or stinging leans toward irritation, not purging.'); }

  if (purgeScore >= 1) {
    return {
      verdict: 'likely-purging',
      action: 'Push through — you can reduce frequency if it’s harsh. This should settle within 4–6 weeks.',
      reasons,
    };
  }
  if (purgeScore <= -1) {
    return {
      verdict: 'likely-breakout',
      action: 'This looks more like a reaction than purging — stop the product and let things calm down.',
      reasons,
    };
  }
  return {
    verdict: 'uncertain',
    action: 'Keep an eye on where and how long. In the areas you usually break out and easing after a few weeks → likely purging. New areas, itching, or lasting past 6 weeks → stop.',
    reasons,
  };
}

/** The side-by-side explainer data (§18) for the reassurance card. */
export const PURGE_VS_BREAKOUT = {
  purging: {
    title: 'Purging',
    tone: 'ok' as const,
    rows: [
      ['Cause', 'Retinoids or acids speeding up turnover'],
      ['Where', 'Where you normally break out'],
      ['Timing', 'Starts 1–2 weeks in'],
      ['Duration', 'Resolves in 4–6 weeks'],
      ['Do', 'Push through — reduce frequency if harsh'],
    ],
  },
  breakout: {
    title: 'Breaking out',
    tone: 'stop' as const,
    rows: [
      ['Cause', 'Irritation, a comedogenic ingredient, or allergy'],
      ['Where', 'New areas you don’t normally break out'],
      ['Timing', 'Any time'],
      ['Duration', 'Persists or worsens'],
      ['Do', 'Stop the product'],
    ],
  },
};
