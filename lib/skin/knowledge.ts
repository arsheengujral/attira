/**
 * Static skin knowledge, transcribed from docs/scaffold-skin.md. This is the
 * rule-based content the Skin Coach and personalized results draw on — no model,
 * no API, zero cost. Everything here is faithful to the scaffold: cosmetic not
 * medical, ingredients before brands, progress-framed, never "AI".
 *
 *   §6  concern → protocol      → PROTOCOLS
 *   §11 routine archetypes      → ROUTINE_ARCHETYPES
 *   §10 minimum routine         → MINIMUM_ROUTINE (also in safety.ts)
 *   §22 myths                   → MYTHS
 *   §27 troubleshooting ladder  → TROUBLESHOOTING
 */

export interface Protocol {
  key: string;
  title: string;
  synonyms: string[];
  am: string[];
  pm: string[];
  weekly?: string;
  timeline: string;
  oneThing: string;
  refer?: string;
}

// §6 — each protocol is AM · PM · timeline · the one thing that matters most.
export const PROTOCOLS: Protocol[] = [
  {
    key: 'acne',
    title: 'Acne & breakouts',
    synonyms: ['acne', 'breakout', 'breaking out', 'pimple', 'spot', 'zits', 'blemish'],
    am: ['Gentle gel cleanser', 'Niacinamide 4%', 'Light gel moisturiser', 'SPF 50 (non-comedogenic)'],
    pm: ['Cleanse', 'Alternate nights: salicylic acid 2% / adapalene or retinol', 'Light moisturiser', 'Spot: benzoyl peroxide 2.5%, short-contact'],
    weekly: 'Optional clay mask',
    timeline: 'Calmer in 4–6 weeks · clearer in 8–12 weeks. It can look worse before better (purging).',
    oneThing: 'Consistency, and not over-drying — stripped skin just makes more oil.',
    refer: 'Cystic, nodular, scarring, or no improvement in 12 weeks → see a dermatologist.',
  },
  {
    key: 'blackheads',
    title: 'Blackheads & congestion',
    synonyms: ['blackhead', 'congestion', 'clogged', 'whitehead', 'sebaceous'],
    am: ['Gentle cleanser', 'Niacinamide', 'Moisturiser', 'SPF'],
    pm: ['Salicylic acid 2% — start 3×/week, then build', 'Light moisturiser'],
    timeline: '4–8 weeks.',
    oneThing: 'Those grey dots on your nose are usually sebaceous filaments — normal, universal, and not removable. Squeezing damages the pore.',
  },
  {
    key: 'pigmentation',
    title: 'Pigmentation & dark spots',
    synonyms: ['pigment', 'dark spot', 'pih', 'melasma', 'uneven tone', 'tan', 'hyperpigment', 'marks'],
    am: ['Cleanse', 'Vitamin C 10–15%', 'Moisturiser', 'SPF 50, reapplied (non-negotiable)'],
    pm: ['Cleanse', 'Alpha arbutin 2% / azelaic 10% / tranexamic 3%', 'Moisturiser'],
    timeline: '8–12 weeks minimum. Melasma takes months and recurs — set that expectation.',
    oneThing: 'SPF. Without daily sunscreen this protocol does nothing — pigment returns faster than it fades.',
    refer: 'Melasma, or any pigment that is new/changing/asymmetric → dermatologist.',
  },
  {
    key: 'dullness',
    title: 'Dullness',
    synonyms: ['dull', 'glow', 'radiance', 'tired skin', 'lacklustre'],
    am: ['Vitamin C', 'Moisturiser', 'SPF'],
    pm: ['Gentle exfoliant (lactic / PHA) 1–2×/week', 'Hydrate heavily'],
    timeline: 'Glow in 4–6 weeks.',
    oneThing: 'Over-exfoliation actually causes dullness. If you already exfoliate 4×/week, the fix is less, not more.',
  },
  {
    key: 'ageing',
    title: 'Fine lines & ageing',
    synonyms: ['fine line', 'wrinkle', 'ageing', 'aging', 'anti-ageing', 'firmness', 'collagen'],
    am: ['Cleanse', 'Vitamin C', 'Moisturiser', 'SPF 50'],
    pm: ['Cleanse', 'Retinoid (ramped slowly)', 'Ceramide moisturiser', 'Peptides on non-retinoid nights'],
    timeline: 'Texture 8–12 weeks · lines 3–6 months · collagen 6–12 months.',
    oneThing: 'SPF is the most effective anti-ageing product that exists — more than any serum.',
    refer: 'Pregnant or breastfeeding? Swap the retinoid for peptides + bakuchiol + vitamin C + SPF.',
  },
  {
    key: 'dryness',
    title: 'Dryness & dehydration',
    synonyms: ['dry', 'dehydrat', 'flak', 'tight', 'rough', 'parched'],
    am: ['Cream cleanser (or water rinse)', 'Hyaluronic acid on damp skin', 'Ceramide moisturiser', 'SPF'],
    pm: ['Cream cleanser', 'HA / glycerin', 'Ceramides + squalane', 'Optional facial oil to seal'],
    weekly: 'Hydrating mask; avoid all foaming/stripping cleansers',
    timeline: 'Comfort within days · barrier repair 4–6 weeks.',
    oneThing: 'Dry (lacks oil) ≠ dehydrated (lacks water). Oily skin can be dehydrated too — that needs humectants + a seal, not more oil-stripping.',
  },
  {
    key: 'sensitivity',
    title: 'Redness & sensitivity',
    synonyms: ['redness', 'red', 'sensitiv', 'irritat', 'reactive', 'stinging'],
    am: ['Cream cleanser', 'Centella / cica', 'Ceramides', 'Mineral SPF (zinc)'],
    pm: ['Cleanse', 'Panthenol / cica', 'Barrier cream'],
    weekly: 'Remove fragrance, essential oils, alcohol denat, scrubs, high-% actives',
    timeline: 'Calmer in 2–4 weeks.',
    oneThing: 'Strip it right back — fewer, gentler products let the barrier recover.',
    refer: 'Persistent flushing, visible vessels, or bumps → possible rosacea → dermatologist.',
  },
  {
    key: 'pores',
    title: 'Enlarged pores',
    synonyms: ['pore', 'large pores', 'open pores'],
    am: ['Niacinamide daily', 'Moisturiser', 'SPF'],
    pm: ['Salicylic 2–3×/week', 'Retinoid on other nights'],
    timeline: 'Visible refinement 8–12 weeks.',
    oneThing: 'Honest truth: pore size is largely genetic and pores don’t open or close. You can refine their appearance by keeping them clear — you can’t shrink them permanently.',
  },
  {
    key: 'texture',
    title: 'Texture & bumpy skin',
    synonyms: ['texture', 'bumpy', 'rough skin', 'uneven'],
    am: ['Gentle cleanser', 'Niacinamide', 'Moisturiser', 'SPF'],
    pm: ['Retinoid + gentle AHA on alternate nights', 'Hydrate'],
    timeline: '8–12 weeks.',
    oneThing: 'First rule out fungal acne and closed comedones — they look similar but are treated differently.',
  },
  {
    key: 'oily',
    title: 'Oily skin',
    synonyms: ['oily', 'oil', 'shine', 'greasy', 'sebum'],
    am: ['Gel cleanser', 'Niacinamide + zinc', 'Light gel moisturiser (never skip it)', 'Gel/fluid SPF'],
    pm: ['Gel cleanser', 'Salicylic 2–3×/week', 'Light moisturiser'],
    timeline: '4–8 weeks.',
    oneThing: 'The paradox: stripping oil makes skin produce more. Never skip moisturiser — use a light gel.',
  },
  {
    key: 'dark-circles',
    title: 'Dark circles',
    synonyms: ['dark circle', 'under eye', 'eye bag', 'puffiness'],
    am: ['Caffeine eye product (for puffiness / vascular circles)', 'Hydrate', 'SPF'],
    pm: ['Peptide + HA eye care', 'Sleep + hydration'],
    timeline: 'Weeks — and honestly, depends on the cause.',
    oneThing: 'Three causes, three answers: pigmented → vitamin C / niacinamide / arbutin + SPF; vascular → caffeine, sleep; structural (hollowness) → skincare can’t fix it, and saying so builds trust.',
  },
];

// §11 — routine archetypes by budget.
export const ROUTINE_ARCHETYPES: { tier: string; products: string }[] = [
  { tier: 'Essential (3)', products: 'Cleanser · moisturiser · SPF' },
  { tier: 'Core (5)', products: '+ one targeted active (usually niacinamide or salicylic) + a hydrating serum' },
  { tier: 'Complete (7–8)', products: '+ vitamin C (AM) + retinoid (PM) + eye cream' },
  { tier: 'Advanced (9+)', products: '+ exfoliant, essence, masks, oils, targeted treatments' },
];

// §10 — the minimum viable routine (a complete, legitimate routine on its own).
export const MINIMUM_ROUTINE = {
  am: 'Gentle cleanser (or water) → moisturiser → SPF',
  pm: 'Gentle cleanser → moisturiser',
  note: 'Three products. Everything else is optimisation — never feel a 10-step routine is required.',
};

// §22 — myths to actively correct.
export const MYTHS: { myth: string; truth: string; synonyms: string[] }[] = [
  { myth: 'Pores open and close', truth: 'They don’t — they have no muscles. Steam softens debris; it doesn’t “open” them.', synonyms: ['pores open', 'open pores', 'close pores', 'steam'] },
  { myth: 'Drinking water fixes dry skin', truth: 'Dryness is a barrier issue, solved topically. Hydrate for health — not as a skincare plan.', synonyms: ['drink water', 'water fix', 'drinking water', 'hydrated from within'] },
  { myth: 'Natural = safe', truth: 'Essential oils are among the most common sensitisers. Lemon juice is photosensitising — never put it on skin.', synonyms: ['natural', 'lemon', 'diy', 'essential oil'] },
  { myth: 'Higher SPF is proportionally better', truth: '30→50 is a real gain; 50→100 is marginal. How much you apply and reapplying matters far more than the number.', synonyms: ['spf 100', 'higher spf', 'spf number'] },
  { myth: 'Oily skin doesn’t need moisturiser', truth: 'Stripping oil makes more oil. Always moisturise — use a light gel.', synonyms: ['oily moisturiser', 'skip moisturiser', 'oily skin moisturis'] },
  { myth: 'Vitamin C and niacinamide cancel out', truth: 'A myth at cosmetic concentrations. Use them together freely.', synonyms: ['vitamin c niacinamide', 'cancel out', 'niacinamide vitamin c'] },
  { myth: 'Expensive means better', truth: 'Formulation and consistency beat price. A ₹400 well-formulated niacinamide works as well as a ₹4,000 one.', synonyms: ['expensive', 'cheap', 'price', 'worth it'] },
  { myth: 'Toothpaste on pimples', truth: 'Irritating and damaging. No.', synonyms: ['toothpaste'] },
  { myth: 'You can sweat out toxins through pores', truth: 'Pores don’t detox. Sweat is sweat.', synonyms: ['sweat out', 'detox', 'toxins'] },
  { myth: 'Squeezing blackheads clears them', truth: 'It damages the pore permanently, and sebaceous filaments always return.', synonyms: ['squeeze', 'pop', 'extract'] },
];

// §27 — the troubleshooting ladder, in order.
export const TROUBLESHOOTING: string[] = [
  'How long has it been? Under 8 weeks → it’s probably working, you’re just early (this is the most common answer).',
  'Are you consistent? Three nights a week isn’t a routine.',
  'Wearing SPF? For pigmentation or ageing, no SPF means it will never work.',
  'Over-exfoliating? Count all actives together — more than 3×/week is the problem.',
  'Barrier damaged? New stinging, tightness, redness → stop everything and recover.',
  'Right diagnosis? Is the “acne” actually fungal acne? Are the “blackheads” actually sebaceous filaments?',
  'Enough product? Especially SPF — most people use a third of what’s needed.',
  'Expired or oxidised? Vitamin C especially (toss it if it’s gone orange/brown).',
  'Still nothing after 12 weeks of doing it right? → see a dermatologist.',
];

export function findProtocol(text: string): Protocol | undefined {
  const t = text.toLowerCase();
  return PROTOCOLS.find((p) => p.synonyms.some((s) => t.includes(s)));
}

export function findMyth(text: string): { myth: string; truth: string } | undefined {
  const t = text.toLowerCase();
  return MYTHS.find((m) => m.synonyms.some((s) => t.includes(s)));
}
