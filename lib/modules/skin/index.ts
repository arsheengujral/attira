import type {
  Module,
  Question,
  Answers,
  Profile,
  Plan,
  Metric,
  CoachContext,
  Prompt,
} from '../types';

/**
 * The Skin module — the wedge domain, expressed against the generic contract.
 * This is logic + knowledge only (intake, profile mapping, plan skeleton,
 * metrics, the coaching system prompt, the score formula). The pixel-faithful
 * Skin *screens* live separately in components/screens and are wired to this
 * config in a later pass.
 *
 * Content follows docs/scaffold-skin.md: intake §2, protocols §6, progress §26,
 * and the model prompt rules §29.
 */

// The model prompt rules, lifted from scaffold-skin.md §29. Cached across users.
const SKIN_SYSTEM = `You are ATTIRA's skin guide.

VOICE: warm, precise, calm. A brilliant friend who happens to know the science.
Never clinical, never preachy, never a hype machine. Never say "AI", "model",
"algorithm", or "as an assistant".

ALWAYS:
- Lead with the ingredient, not the brand.
- Give the WHY in one line — people follow advice they understand.
- Give the HOW: strength, when, how often.
- Give the WHEN: realistic time to visible results.
- Name the ONE thing that matters most for this person.
- Reference their history from memory ("you started retinol 6 weeks ago, so this
  flaking is expected and should settle").

NEVER:
- Diagnose, or name a medical condition as fact.
- Recommend prescription treatments.
- Suggest more than ONE new active at a time.
- Promise a timeline faster than skin biology allows (28-day turnover).
- Moralise about food, weight, or past choices.
- Use "fairness" or frame lighter skin as a goal. Treat pigmentation CONCERNS,
  never skin tone.
- Overpromise. Honesty about what skincare CANNOT do builds more trust than any
  promise.

ALWAYS ESCALATE to a dermatologist when red flags appear — warmly, never alarmingly.
LENGTH: answer, then stop. Give the routine, not an essay.`;

const CONCERNS = [
  'Acne / breakouts',
  'Blackheads / congestion',
  'Pigmentation / dark spots',
  'Dullness',
  'Fine lines',
  'Dryness / dehydration',
  'Redness / sensitivity',
  'Enlarged pores',
  'Uneven texture',
  'Dark circles',
  'Excess oil',
];

export const skinModule: Module = {
  id: 'skin',
  name: 'Skin',
  icon: '✦',
  tier: 'free',

  // Intake — scaffold §2 (core required + a couple of deep optionals).
  assess(): Question[] {
    return [
      {
        id: 'type',
        label: 'How does your skin usually feel?',
        type: 'single',
        options: ['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive'],
        required: true,
      },
      {
        id: 'concerns',
        label: 'What would you like to work on?',
        type: 'multi',
        options: CONCERNS,
        required: true,
        help: 'Pick as many as apply — we’ll rank them with you.',
      },
      { id: 'age_band', label: 'Your age band', type: 'single', options: ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'] },
      {
        id: 'tone_depth',
        label: 'Your skin tone',
        type: 'single',
        options: ['Fair', 'Light', 'Medium', 'Olive', 'Deep'],
        help: 'For deeper tones we default to gentler actives — irritation can leave marks.',
      },
      { id: 'sensitivity', label: 'Does your skin sting or react to new products easily?', type: 'single', options: ['Rarely', 'Sometimes', 'Often'] },
      { id: 'time', label: 'How many steps feel realistic?', type: 'single', options: ['3 (minimal)', '5 (core)', '7+ (complete)'] },
      { id: 'current_routine', label: 'What are you using now? (optional)', type: 'text' },
    ];
  },

  // Structured result → module_profiles.data + memory facts.
  profile(answers: Answers): Profile {
    const concerns = Array.isArray(answers.concerns) ? answers.concerns : [];
    return {
      type: answers.type ?? null,
      concerns,
      ranked_concerns: concerns, // order as chosen; refined over time
      tone_depth: answers.tone_depth ?? null,
      sensitivity: answers.sensitivity ?? null,
      routine_complexity: answers.time ?? '5 (core)',
      age_band: answers.age_band ?? null,
      current_routine: answers.current_routine ?? null,
    };
  },

  // A 30-day skeleton — the journey nodes are filled from real completions.
  plan(profile: Profile): Plan {
    const lead = Array.isArray(profile.ranked_concerns) ? profile.ranked_concerns[0] : 'your skin';
    return {
      horizon: '30day',
      items: [
        { day: 1, title: 'Begin', detail: 'Baseline check-in + first photo.' },
        { day: 3, title: 'Settle the basics', detail: 'Cleanser · moisturiser · SPF, done consistently.' },
        { day: 7, title: 'Week 1 complete', detail: `First active introduced for ${lead}.` },
        { day: 14, title: 'Fortnight', detail: 'Ramp the active if comfortable (never faster).' },
        { day: 21, title: 'Three weeks', detail: 'Barrier check — ease off if anything stings.' },
        { day: 30, title: 'Transformation story', detail: 'Compare photos; recalculate the skin score.' },
      ],
    };
  },

  // What progress looks like — the six check-in indicators + the composite.
  track(): Metric[] {
    return [
      { key: 'hydration', label: 'Hydration' },
      { key: 'oil', label: 'Oil balance' },
      { key: 'texture', label: 'Texture' },
      { key: 'brightness', label: 'Brightness' },
      { key: 'tone', label: 'Tone evenness' },
      { key: 'calmness', label: 'Calmness' },
      { key: 'skin_score', label: 'Skin score' },
    ];
  },

  // Domain system prompt + selectively-retrieved memory.
  coach(context: CoachContext): Prompt {
    const { memory, profile } = context;
    const facts = memory.facts.map((f) => `${f.key}: ${f.value}`).join('; ');
    const patterns = memory.patterns.map((p) => `- ${p.insight}`).join('\n');
    const episodes = memory.episodes
      .slice(0, 8)
      .map((e) => `- (${new Date(e.occurred_at).toISOString().slice(0, 10)}) ${e.content}`)
      .join('\n');

    const memoryBlock = [
      facts && `Known about them: ${facts}`,
      profile && `Skin profile: ${JSON.stringify(profile)}`,
      patterns && `Patterns:\n${patterns}`,
      episodes && `Recent history:\n${episodes}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      system: memoryBlock ? `${SKIN_SYSTEM}\n\n--- What you remember about this person ---\n${memoryBlock}` : SKIN_SYSTEM,
    };
  },

  // Composite skin score (scaffold §26): consistency 40 · trajectory 30 ·
  // barrier 20 · protective habits 10. Inputs are 0..1; sensible defaults.
  score({ progress }: { progress?: Record<string, number> } = {}): number {
    const p = progress ?? {};
    const consistency = clamp01(p.consistency ?? 0.7);
    const trajectory = clamp01(p.trajectory ?? 0.65);
    const barrier = clamp01(p.barrier ?? 0.75);
    const spf = clamp01(p.spf ?? 0.6);
    return Math.round(100 * (0.4 * consistency + 0.3 * trajectory + 0.2 * barrier + 0.1 * spf));
  },
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
