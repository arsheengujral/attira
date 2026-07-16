/**
 * Ingredient-list analyser — docs/scaffold-skin.md §12, as a deterministic
 * rule-based engine (no model required, so it's testable offline). Reads an INCI
 * list, identifies the actives that matter, flags irritants / allergens /
 * conflicts / comedogenic + fungal-acne triggers, checks redundancy against the
 * user's shelf, and returns a clear verdict with a reason.
 */

export type Verdict = 'keep' | 'adjust' | 'reconsider';
export type FlagKind = 'irritant' | 'allergen' | 'conflict' | 'comedogenic' | 'fungal-acne';

export interface Flag {
  kind: FlagKind;
  ingredient: string;
  note: string;
}

export interface AnalyzerInput {
  inci: string;
  skinType?: string; // oily | dry | combination | normal | sensitive
  concerns?: string[];
  allergies?: string[];
  fungalAcneProne?: boolean;
  pregnant?: boolean;
  /** Actives already on the user's shelf, for redundancy. */
  shelfActives?: string[];
}

export interface AnalyzerResult {
  category: string;
  keyActives: { name: string; role: string }[];
  matchScore: number; // 0–100 against the user's profile
  flags: Flag[];
  redundancy: string[];
  verdict: Verdict;
  reason: string;
}

interface ActiveDef {
  role: string;
  concerns: string[];
  suitsOily?: boolean;
  suitsDry?: boolean;
}

// The subset of the §5 matrix that the analyser reasons over.
const ACTIVES: Record<string, ActiveDef> = {
  niacinamide: { role: 'regulates oil, calms redness, evens tone', concerns: ['acne', 'oil', 'pores', 'redness', 'pigmentation', 'tone'] },
  'salicylic acid': { role: 'unclogs pores (BHA)', concerns: ['acne', 'blackheads', 'congestion', 'oil', 'pores'], suitsOily: true },
  'glycolic acid': { role: 'resurfaces (AHA)', concerns: ['dullness', 'texture', 'pigmentation', 'fine lines'] },
  'lactic acid': { role: 'gentle, hydrating exfoliant (AHA)', concerns: ['dullness', 'texture', 'dryness'] },
  'mandelic acid': { role: 'gentlest AHA, low PIH risk', concerns: ['acne', 'pigmentation', 'texture'] },
  retinol: { role: 'renews, anti-ageing (retinoid)', concerns: ['fine lines', 'texture', 'acne', 'pigmentation', 'pores'] },
  retinal: { role: 'faster retinoid', concerns: ['fine lines', 'texture', 'acne'] },
  adapalene: { role: 'retinoid for acne', concerns: ['acne', 'congestion'] },
  bakuchiol: { role: 'gentle retinol alternative', concerns: ['fine lines', 'texture'] },
  'ascorbic acid': { role: 'antioxidant, brightens (vitamin C)', concerns: ['dullness', 'pigmentation', 'tone'] },
  'azelaic acid': { role: 'calms, unclogs, fades pigment', concerns: ['acne', 'redness', 'pigmentation', 'tone'] },
  'benzoyl peroxide': { role: 'kills acne bacteria', concerns: ['acne'], suitsOily: true },
  'alpha arbutin': { role: 'gentle tyrosinase inhibitor', concerns: ['pigmentation', 'tone'] },
  'tranexamic acid': { role: 'targets stubborn pigment', concerns: ['pigmentation', 'tone'] },
  'hyaluronic acid': { role: 'humectant, hydration', concerns: ['dryness', 'dehydration'] },
  'sodium hyaluronate': { role: 'humectant, hydration', concerns: ['dryness', 'dehydration'] },
  glycerin: { role: 'humectant', concerns: ['dryness', 'dehydration'] },
  ceramide: { role: 'repairs the barrier', concerns: ['dryness', 'sensitivity', 'barrier'], suitsDry: true },
  panthenol: { role: 'soothes, heals', concerns: ['redness', 'sensitivity', 'barrier'] },
  squalane: { role: 'lightweight emollient', concerns: ['dryness', 'sensitivity'] },
  'centella asiatica': { role: 'calms, repairs', concerns: ['redness', 'sensitivity', 'barrier'] },
  zinc: { role: 'sebum control', concerns: ['oil', 'acne'] },
};

const IRRITANTS: { match: RegExp; exclude?: RegExp; name: string; note: string }[] = [
  { match: /\b(fragrance|parfum)\b/i, name: 'Fragrance / Parfum', note: 'a common sensitiser — avoid in sensitive/reactive routines' },
  { match: /\blimonene\b/i, name: 'Limonene', note: 'fragrance allergen' },
  { match: /\blinalool\b/i, name: 'Linalool', note: 'fragrance allergen' },
  { match: /\bcitral\b/i, name: 'Citral', note: 'fragrance allergen' },
  { match: /\beugenol\b/i, name: 'Eugenol', note: 'fragrance allergen' },
  { match: /\bgeraniol\b/i, name: 'Geraniol', note: 'fragrance allergen' },
  { match: /\bcitronellol\b/i, name: 'Citronellol', note: 'fragrance allergen' },
  // Drying alcohols only — fatty alcohols (cetyl/cetearyl/stearyl…) are emollients, not irritants.
  {
    match: /alcohol denat|denatured alcohol|\bsd alcohol\b|\bethanol\b|\balcohol\b/i,
    exclude: /cet(e)?aryl|cetyl|stearyl|behenyl|myristyl|lauryl|arachidyl|c\d+-\d+ alcohol|benzyl/i,
    name: 'Alcohol denat.',
    note: 'drying when high on the list',
  },
  { match: /\bmenthol\b|peppermint/i, name: 'Menthol', note: 'can irritate' },
  { match: /witch hazel|hamamelis/i, name: 'Witch hazel', note: 'astringent, can irritate' },
  { match: /essential oil|\b\w+ oil\b.*(fragran)/i, name: 'Essential oil', note: 'natural ≠ gentle; common sensitiser' },
];

// Fungal-acne (malassezia) feeders (§17). Squalane & mineral oil are safe.
const FUNGAL_TRIGGERS: RegExp[] = [
  /polysorbate/i, /laur(ic|ate|yl)/i, /myrist/i, /palmit(ate|ic)/i, /stearate/i, /oleate/i, /linoleate/i, /coconut oil/i, /\bester\b/i, /isopropyl (myristate|palmitate)/i,
];

const COMEDOGENIC: RegExp[] = [/coconut oil/i, /isopropyl myristate/i, /cocoa butter/i, /wheat germ oil/i, /\bmyristyl myristate\b/i];

function splitInci(inci: string): string[] {
  return inci
    .replace(/ingredients?:/i, '')
    .split(/[,;\n•·]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function guessCategory(list: string[]): string {
  const has = (re: RegExp) => list.some((x) => re.test(x));
  if (has(/spf|homosalate|avobenzone|zinc oxide|titanium dioxide|octocrylene|tinosorb|uvinul/i)) return 'Sunscreen';
  if (has(/^aqua|^water/) && has(/cetearyl|glyceryl stearate|shea|ceramide|dimethicone/i)) return 'Moisturiser';
  if (has(/coco-glucoside|sodium laureth sulfate|cocamidopropyl|decyl glucoside/i)) return 'Cleanser';
  if (has(/salicylic|glycolic|lactic|mandelic|retin|ascorbic|azelaic/i)) return 'Treatment / serum';
  return 'Skincare product';
}

export function analyzeIngredients(input: AnalyzerInput): AnalyzerResult {
  const list = splitInci(input.inci);
  const category = guessCategory(list);
  const concerns = (input.concerns ?? []).map((c) => c.toLowerCase());
  const isSensitive = (input.skinType ?? '').toLowerCase() === 'sensitive';
  const isOily = (input.skinType ?? '').toLowerCase().includes('oil');
  const isDry = (input.skinType ?? '').toLowerCase().includes('dry');

  // Key actives present.
  const keyActives: { name: string; role: string }[] = [];
  const activeConcerns = new Set<string>();
  for (const [name, def] of Object.entries(ACTIVES)) {
    if (list.some((x) => x.includes(name))) {
      keyActives.push({ name: titleCase(name), role: def.role });
      def.concerns.forEach((c) => activeConcerns.add(c));
    }
  }

  // Flags.
  const flags: Flag[] = [];
  for (const irr of IRRITANTS) {
    const hit = list.find((x) => irr.match.test(x) && !(irr.exclude && irr.exclude.test(x)));
    if (hit) flags.push({ kind: 'irritant', ingredient: irr.name, note: irr.note });
  }
  for (const allergy of input.allergies ?? []) {
    const a = allergy.trim().toLowerCase();
    if (a && list.some((x) => x.includes(a))) {
      flags.push({ kind: 'allergen', ingredient: titleCase(a), note: 'on your declared-allergy list' });
    }
  }
  if (input.fungalAcneProne) {
    const trig = list.find((x) => FUNGAL_TRIGGERS.some((re) => re.test(x)) && !/squalane|mineral oil/i.test(x));
    if (trig) flags.push({ kind: 'fungal-acne', ingredient: titleCase(trig), note: 'malassezia can feed on this' });
  }
  if (concerns.some((c) => c.includes('acne'))) {
    const com = list.find((x) => COMEDOGENIC.some((re) => re.test(x)));
    if (com) flags.push({ kind: 'comedogenic', ingredient: titleCase(com), note: 'higher comedogenic risk for acne-prone skin' });
  }
  // Conflicts against the shelf (§8) — e.g. two strong actives that shouldn't stack.
  const shelf = (input.shelfActives ?? []).map((s) => s.toLowerCase());
  const hasRetinoidHere = keyActives.some((k) => /retin|adapalene/i.test(k.name));
  const shelfHasExfoliant = shelf.some((s) => /glycolic|salicylic|lactic|mandelic|aha|bha/i.test(s));
  if (hasRetinoidHere && shelfHasExfoliant) {
    flags.push({ kind: 'conflict', ingredient: 'Retinoid + acid', note: 'you already use an exfoliant — alternate nights, don’t stack' });
  }
  const hasVitCHere = keyActives.some((k) => /ascorbic/i.test(k.name));
  if (hasVitCHere && shelf.some((s) => /benzoyl/i.test(s))) {
    flags.push({ kind: 'conflict', ingredient: 'Vitamin C + benzoyl peroxide', note: 'BPO oxidises vitamin C — separate them' });
  }
  if (isSensitive && flags.some((f) => f.kind === 'irritant')) {
    // already captured; sensitivity just raises the weight below
  }

  // Redundancy against the shelf.
  const redundancy: string[] = [];
  for (const k of keyActives) {
    const base = k.name.toLowerCase().split(' ')[0];
    if (shelf.some((s) => s.includes(base))) {
      redundancy.push(`You already have ${k.name} on your shelf — you may not need another.`);
    }
  }

  // Match score.
  let score = 55;
  const matchedConcerns = concerns.filter((c) => Array.from(activeConcerns).some((ac) => c.includes(ac) || ac.includes(c)));
  score += Math.min(30, matchedConcerns.length * 12);
  if (isOily && keyActives.some((k) => ACTIVES[k.name.toLowerCase()]?.suitsOily)) score += 6;
  if (isDry && keyActives.some((k) => ACTIVES[k.name.toLowerCase()]?.suitsDry)) score += 6;
  const irritantCount = flags.filter((f) => f.kind === 'irritant').length;
  score -= irritantCount * (isSensitive ? 14 : 7);
  score -= flags.filter((f) => f.kind === 'allergen').length * 40;
  score -= flags.filter((f) => f.kind === 'fungal-acne').length * 15;
  score -= redundancy.length * 8;
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Verdict.
  let verdict: Verdict;
  let reason: string;
  const hasAllergen = flags.some((f) => f.kind === 'allergen');
  if (hasAllergen) {
    verdict = 'reconsider';
    reason = 'It contains something on your allergy list — not worth the risk when gentler options exist.';
  } else if (score >= 70 && irritantCount === 0) {
    verdict = 'keep';
    reason = matchedConcerns.length
      ? `It targets your ${matchedConcerns.join(' and ')} with ${keyActives[0]?.name ?? 'well-chosen actives'}, and nothing here should bother your skin.`
      : 'A clean, well-formulated product with nothing to worry about.';
  } else if (score >= 45) {
    verdict = 'adjust';
    reason = irritantCount
      ? `Good actives, but the fragrance/irritant load means introduce it slowly${isSensitive ? ' — or skip it, given your sensitivity' : ''}.`
      : redundancy.length
        ? 'Fine on its own, but it overlaps with what you already have — use one, not both.'
        : 'Reasonable, but not a strong match for your current concerns.';
  } else {
    verdict = 'reconsider';
    reason = irritantCount
      ? 'The irritant load outweighs the benefit for your skin — there are gentler ways to get the same result.'
      : 'It doesn’t target what you’re working on right now.';
  }

  return { category, keyActives, matchScore: score, flags, redundancy, verdict, reason };
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}
