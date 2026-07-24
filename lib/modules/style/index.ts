import type { Module, Question, Answers, Profile, Plan, Metric, CoachContext, Prompt } from '../types';
import { PERSONA_OPTIONS, BODY_OPTIONS_WOMEN } from '@/lib/style/knowledge';
import { computeStyleProfile, capsulePlan, describeStyleResult, type StyleProfileInput } from '@/lib/style/compute';

/**
 * The Style & Wardrobe module — the second domain expressed against the generic
 * Module contract, proving the framework carries more than Skin. Logic + the
 * knowledge scaffold only (assess / profile / plan / track / coach / score);
 * the screens are a later slice. Rule-based, zero cost.
 *
 * Content follows /specs/style-module-spec.md and docs/scaffold-style.md.
 */

const FACE_OPTIONS = ['Oval', 'Round', 'Heart', 'Square', 'Diamond', 'Oblong', 'Not sure'];

export const styleModule: Module = {
  id: 'style',
  name: 'Style',
  icon: '✦',
  tier: 'free',

  // Intake — the fields the six structured outputs are computed from.
  assess(): Question[] {
    return [
      { id: 'gender', label: 'How do you dress?', type: 'single', options: ['Womenswear', 'Menswear', 'Either / fluid'], required: true, help: 'Body-shape and accessory guidance adapt to this — every feature stays available whatever you pick.' },
      { id: 'undertone', label: 'Your skin’s undertone', type: 'single', options: ['Warm', 'Cool', 'Neutral', 'Not sure'], help: 'Veins look greenish → warm; bluish → cool. Not sure is completely fine.' },
      { id: 'depth', label: 'Your skin depth', type: 'single', options: ['Fair', 'Light', 'Medium', 'Olive', 'Deep', 'Not sure'] },
      { id: 'face_shape', label: 'Which face shape feels closest?', type: 'single', options: FACE_OPTIONS, help: 'A self-report is all we need — no photo required.' },
      { id: 'body_shape', label: 'Which shape feels closest to yours?', type: 'single', options: [...BODY_OPTIONS_WOMEN.map(cap), 'Not sure'], help: 'Options adapt to your menswear/womenswear choice. Dress to your shape — never to “correct” it.' },
      { id: 'persona', label: 'Which feels most like your style?', type: 'single', options: [...PERSONA_OPTIONS.map((p) => p.name), 'Not sure'], help: 'Pick the one you’re drawn to; you can retake this anytime.' },
      { id: 'coverage', label: 'Your coverage preference', type: 'single', options: ['Fully covered', 'Modest', 'Balanced', 'Open', 'Not sure'] },
      { id: 'world', label: 'Your comfort world', type: 'single', options: ['Western', 'Ethnic / traditional', 'Fusion', 'Not sure'] },
      { id: 'fit', label: 'Your fit preference', type: 'single', options: ['Fitted', 'Tailored', 'Relaxed', 'Oversized', 'Not sure'] },
    ];
  },

  // Structured result → module_profiles.data (+ a memory episode when saved).
  profile(answers: Answers): Profile {
    const input = normalise(answers);
    const result = computeStyleProfile(input);
    return { ...input, computed: result as unknown as Record<string, unknown> };
  },

  // A capsule wardrobe plan (60/25/15) from the palette + persona.
  plan(profile: Profile): Plan {
    const input = profile as StyleProfileInput;
    const capsule = capsulePlan(input);
    return {
      horizon: 'capsule',
      items: capsule.groups.flatMap((g) =>
        g.items.map((title) => ({ title, detail: `${g.label} · ${g.pct}%` })),
      ),
    };
  },

  // What progress looks like for Style.
  track(): Metric[] {
    return [
      { key: 'profile_complete', label: 'Profile completeness', unit: '%' },
      { key: 'closet_items', label: 'Closet pieces' },
      { key: 'outfits_saved', label: 'Saved outfits' },
      { key: 'capsule_coverage', label: 'Capsule coverage', unit: '%' },
    ];
  },

  // Domain prompt (kept for framework parity; Style runs rule-based, no model).
  coach(context: CoachContext): Prompt {
    const input = (context.profile ?? {}) as StyleProfileInput;
    const described = describeStyleResult(computeStyleProfile(input));
    return {
      system:
        'You are ATTIRA’s style guide. Warm, specific, body-positive — dress to shape, never to “correct”. ' +
        'Never say "AI". Ingredients-of-style before brands; budget-aware; own-closet first. ' +
        `\n\nThis person’s style profile:\n${described}`,
    };
  },

  // A simple 0–100 completeness score (feeds the Life Score).
  score({ profile }: { profile?: Profile } = {}): number {
    if (!profile) return 0;
    const fields = ['gender', 'undertone', 'depth', 'faceShape', 'bodyShape', 'persona', 'coverage', 'world', 'fit'];
    const filled = fields.filter((f) => {
      const v = (profile as Record<string, unknown>)[f];
      return typeof v === 'string' && v && v !== 'unsure';
    }).length;
    return Math.round((filled / fields.length) * 100);
  },
};

// ── answer normalisation (UI labels → knowledge keys) ────────────────────────

function normalise(a: Answers): StyleProfileInput {
  const s = (v: Answers[string]) => (typeof v === 'string' ? v.toLowerCase() : '');
  const genderRaw = s(a.gender);
  const gender = genderRaw.includes('men') && !genderRaw.includes('women') ? 'man' : genderRaw.includes('women') ? 'woman' : 'unspecified';
  const undertone = pick(s(a.undertone), { warm: 'warm', cool: 'cool', neutral: 'neutral' }, 'unsure');
  const depth = pick(s(a.depth), { fair: 'fair', light: 'light', medium: 'medium', olive: 'olive', deep: 'deep' }, 'unsure');
  const faceShape = pick(s(a.face_shape), { oval: 'oval', round: 'round', heart: 'heart', square: 'square', diamond: 'diamond', oblong: 'oblong' }, 'unsure');
  const persona = pickPersona(s(a.persona));
  const bodyShape = pickBody(s(a.body_shape));
  const coverage = pick(s(a.coverage), { 'fully covered': 'fully-covered', modest: 'modest', balanced: 'balanced', open: 'open' }, 'unsure');
  const world = pick(s(a.world), { western: 'western', ethnic: 'ethnic', fusion: 'fusion' }, 'unsure');
  const fit = pick(s(a.fit), { fitted: 'fitted', tailored: 'tailored', relaxed: 'relaxed', oversized: 'oversized' }, 'unsure');
  return { gender, undertone, depth, faceShape, bodyShape, persona, coverage, world, fit } as StyleProfileInput;
}

function pick<T extends string>(value: string, map: Record<string, T>, fallback: T): T {
  for (const [needle, out] of Object.entries(map)) if (value.includes(needle)) return out;
  return fallback;
}
function pickPersona(value: string): string {
  const found = PERSONA_OPTIONS.find((p) => value.includes(p.name.toLowerCase().split(' ')[0]));
  return found ? found.key : 'unsure';
}
function pickBody(value: string): string {
  const map: Record<string, string> = { hourglass: 'hourglass', pear: 'pear', triangle: 'triangle', inverted: 'inverted', rectangle: 'rectangle', apple: 'apple', round: 'apple', 'v-shape': 'inverted', oval: 'oval' };
  for (const [needle, out] of Object.entries(map)) if (value.includes(needle)) return out;
  return 'unsure';
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
