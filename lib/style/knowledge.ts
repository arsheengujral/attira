/**
 * Style & Wardrobe knowledge — the rule-based scaffold for the Style module,
 * authored from established style theory (colour-season, face/body-shape,
 * persona, occasion dress codes, capsule, colour pairing). Human-readable
 * companion: docs/scaffold-style.md. Zero cost, no model — every output is
 * computed from this data (see lib/style/compute.ts).
 *
 * Guardrails carried throughout: never "AI"; body-positive (dress to shape,
 * never "correct"); gender-aware not gender-gated; budget-aware; own-closet
 * first; hair/makeup is styling-only; never specific makeup shades/brands.
 */

export type Undertone = 'warm' | 'cool' | 'neutral' | 'unsure';
export type Depth = 'fair' | 'light' | 'medium' | 'olive' | 'deep' | 'unsure';
export type Gender = 'woman' | 'man' | 'nonbinary' | 'unspecified';
export type Coverage = 'fully-covered' | 'modest' | 'balanced' | 'open' | 'unsure';
export type World = 'western' | 'ethnic' | 'fusion' | 'unsure';
export type Fit = 'fitted' | 'tailored' | 'relaxed' | 'oversized' | 'unsure';

// ── §3 · Colour seasons ──────────────────────────────────────────────────────
export type SeasonKey = 'spring' | 'summer' | 'autumn' | 'winter' | 'neutral';
export interface Season {
  key: SeasonKey;
  name: string;
  description: string;
  palette: string[]; // 5 hex swatches
  metals: string;
  ease: string; // 2–3 colours to ease off
}
export const SEASONS: Record<SeasonKey, Season> = {
  spring: {
    key: 'spring', name: 'Warm Spring',
    description: 'Clear, warm and light — colours with sunlight in them.',
    palette: ['#F58A6B', '#F4C95D', '#8FCf7A', '#57C6C2', '#FBF3E2'],
    metals: 'Gold, warm brass', ease: 'Ease off black, cool greys and dusty pastels — they can dim your glow.',
  },
  summer: {
    key: 'summer', name: 'Cool Summer',
    description: 'Soft, cool and gentle — colours seen through a light haze.',
    palette: ['#8FB4D6', '#B9A6D1', '#E4A6B7', '#9DBBA6', '#D9DCE1'],
    metals: 'Silver, rose gold', ease: 'Ease off orange, warm gold-yellows and hard black — soften black to charcoal.',
  },
  autumn: {
    key: 'autumn', name: 'Warm Autumn',
    description: 'Rich, warm and muted — the colours of turning leaves.',
    palette: ['#7E8B3D', '#B5622E', '#D9A441', '#2F7E76', '#EDE3CC'],
    metals: 'Gold, bronze, copper', ease: 'Ease off icy pastels, fuchsia and pure bright white.',
  },
  winter: {
    key: 'winter', name: 'Cool Winter',
    description: 'Deep, cool and clear — high-contrast, saturated colour.',
    palette: ['#C6193A', '#0E7A54', '#1F4FC4', '#C21E86', '#FFFFFF'],
    metals: 'Silver, platinum, white gold', ease: 'Ease off muted earth tones, orange and warm beige.',
  },
  neutral: {
    key: 'neutral', name: 'Balanced Neutral',
    description: 'Versatile — you carry both warm and cool with a little care.',
    palette: ['#5E9C99', '#E4A6A6', '#9C8A78', '#2C3E5C', '#F2ECE2'],
    metals: 'Both gold and silver suit you', ease: 'Ease off the extremes — neon brights, and head-to-toe pure black.',
  },
};

export function computeSeason(undertone: Undertone, depth: Depth): SeasonKey {
  const light = depth === 'fair' || depth === 'light';
  if (undertone === 'warm') return light ? 'spring' : 'autumn';
  if (undertone === 'cool') return light ? 'summer' : 'winter';
  return 'neutral'; // neutral or unsure → the safe, flattering default
}

// ── §4 · Face shapes → necklines, frames, hair direction ─────────────────────
export type FaceShape = 'oval' | 'round' | 'heart' | 'square' | 'diamond' | 'oblong';
export interface FaceRule { name: string; cue: string; necklines: string; eyewear: string; hair: string }
export const FACE_SHAPES: Record<FaceShape, FaceRule> = {
  oval: { name: 'Oval', cue: 'Length and width in gentle balance.', necklines: 'Almost every neckline works — enjoy the freedom; a crew or V both flatter.', eyewear: 'Most frames suit you; keep them proportional to your face.', hair: 'Nearly any length; you can part it anywhere.' },
  round: { name: 'Round', cue: 'Soft curves, width close to length.', necklines: 'V-necks and long open collars to lengthen; scoops over high crews.', eyewear: 'Angular or rectangular frames add definition.', hair: 'A little height at the crown and length past the jaw elongates.' },
  heart: { name: 'Heart', cue: 'Wider forehead, narrower chin.', necklines: 'Boat, scoop and cowl necks balance a narrow chin; collars add width low.', eyewear: 'Bottom-heavy or rimless frames; light on top.', hair: 'Chin-length and longer, with volume around the jaw.' },
  square: { name: 'Square', cue: 'Strong jaw, angular lines.', necklines: 'Softer, rounded necklines — scoop, cowl, sweetheart — to echo curves.', eyewear: 'Round or oval frames soften the angles.', hair: 'Soft layers and waves around the face.' },
  diamond: { name: 'Diamond', cue: 'Narrow forehead and chin, wide cheekbones.', necklines: 'Boat and scoop necklines; detail at the shoulder line.', eyewear: 'Oval or cat-eye frames that widen at the brow.', hair: 'Volume at the forehead and chin; a fringe suits you.' },
  oblong: { name: 'Oblong', cue: 'Length noticeably greater than width.', necklines: 'Horizontal necklines — boat, crew — and collars add welcome width.', eyewear: 'Wider or deeper frames to break the length.', hair: 'Volume at the sides; a fringe shortens the face beautifully.' },
};

// ── §5 · Body shapes (gender-aware) → silhouettes & fabrics ──────────────────
export type BodyShape = string;
export interface BodyRule { name: string; silhouettes: string; fabrics: string; note: string }
export const BODY_SHAPES_WOMEN: Record<string, BodyRule> = {
  hourglass: { name: 'Hourglass', silhouettes: 'Anything that follows the waist — wrap dresses, tailored jackets, high-rise bottoms.', fabrics: 'A mix of fluid drape and light structure.', note: 'Let the waist lead; skip boxy shapes that hide it.' },
  pear: { name: 'Pear / Triangle', silhouettes: 'Structured, detailed tops (boat necks, statement shoulders) with straight or A-line bottoms.', fabrics: 'Crisper tops, fluid bottoms.', note: 'Draw the eye up; darker bottoms if you like balance.' },
  inverted: { name: 'Inverted Triangle', silhouettes: 'V-necks and softer shoulders up top; fuller or A-line skirts and wide-leg trousers below.', fabrics: 'Drape on top, a little body on the bottom.', note: 'Add visual weight low to balance the shoulder line.' },
  rectangle: { name: 'Rectangle', silhouettes: 'Create shape — peplums, belted waists, layering, wrap styles.', fabrics: 'Mix textures to add dimension.', note: 'A defined waist is your fastest win.' },
  apple: { name: 'Apple / Round', silhouettes: 'Empire lines, V-necks, straight or bootcut bottoms that elongate the torso.', fabrics: 'Structured but never clingy at the midsection.', note: 'Vertical lines and open necklines lengthen.' },
};
export const BODY_SHAPES_MEN: Record<string, BodyRule> = {
  rectangle: { name: 'Rectangle', silhouettes: 'Add structure — layers, slim-straight cuts, detail across the chest.', fabrics: 'Mid-weight fabrics that hold a line.', note: 'Layering builds a natural taper.' },
  triangle: { name: 'Triangle', silhouettes: 'Broaden the shoulders — structured jackets, horizontal detail up top, straight-cut trousers.', fabrics: 'Firmer up top, cleaner below.', note: 'Balance by adding presence at the shoulder.' },
  inverted: { name: 'Inverted / V-shape', silhouettes: 'Straight or slim-straight cuts; let the natural taper speak — skip heavy shoulder padding.', fabrics: 'Softer drape to balance a strong upper body.', note: 'Clean lines flatter an athletic frame.' },
  oval: { name: 'Oval / Round', silhouettes: 'Clean vertical lines — single-breasted jackets, straight fit, open collars.', fabrics: 'Mid-weight, structured but not clingy.', note: 'Vertical detail and a good jacket length elongate.' },
};
export const BODY_OPTIONS_WOMEN = Object.keys(BODY_SHAPES_WOMEN);
export const BODY_OPTIONS_MEN = Object.keys(BODY_SHAPES_MEN);

// ── §6 · Style personas → prints, footwear, jewellery, hair, makeup ──────────
export type PersonaKey =
  | 'classic' | 'minimalist' | 'casual-chic' | 'bohemian' | 'edgy'
  | 'romantic' | 'creative' | 'sporty' | 'elegant';
export interface Persona {
  key: PersonaKey; name: string; blurb: string; prints: string;
  footwearW: string; footwearM: string; jewelleryW: string; jewelleryM: string;
  watch: string; hair: string; makeup: string;
}
export const PERSONAS: Record<PersonaKey, Persona> = {
  classic: {
    key: 'classic', name: 'Classic', blurb: 'Timeless, polished, never chasing a trend.',
    prints: 'Stripes, small checks, subtle houndstooth — quiet and considered.',
    footwearW: 'Court heels, loafers, pointed flats, clean white sneakers.', footwearM: 'Oxfords, loafers, clean leather sneakers.',
    jewelleryW: 'Pearl studs, a fine gold chain, a slim tennis bracelet.', jewelleryM: 'A signet ring, simple cufflinks.',
    watch: 'A leather-strap dress watch with a clean dial.',
    hair: 'Sleek, well-kept and simple — a polished blowout or a neat cut.', makeup: 'Groomed and natural in your undertone family — nothing loud.',
  },
  minimalist: {
    key: 'minimalist', name: 'Minimalist', blurb: 'Clean lines, few pieces, quiet confidence.',
    prints: 'Mostly solids; the occasional fine tonal texture.',
    footwearW: 'Architectural flats, minimalist sneakers, sleek ankle boots.', footwearM: 'Minimal leather sneakers, chelsea boots.',
    jewelleryW: 'One fine piece at a time — a thin band, a small hoop.', jewelleryM: 'A single slim band or nothing at all.',
    watch: 'A thin, dial-forward watch with a mesh or leather strap.',
    hair: 'An effortless, low-maintenance cut with clean shape.', makeup: 'The barely-there, skin-first look in your undertone.',
  },
  'casual-chic': {
    key: 'casual-chic', name: 'Casual Chic', blurb: 'Relaxed but put-together — easy elevated everyday.',
    prints: 'Breton stripes, gentle florals, soft animal print in small doses.',
    footwearW: 'White sneakers, mules, block-heel ankle boots.', footwearM: 'Premium sneakers, suede loafers, desert boots.',
    jewelleryW: 'Layered dainty chains, small hoops, a stack of thin rings.', jewelleryM: 'A beaded or leather bracelet, a simple chain.',
    watch: 'A versatile everyday watch on a fabric or leather strap.',
    hair: 'Soft, lived-in waves or an easy tousled cut.', makeup: 'Fresh and glowy — a your-skin-but-better finish.',
  },
  bohemian: {
    key: 'bohemian', name: 'Bohemian', blurb: 'Free-spirited, textural, layered and warm.',
    prints: 'Paisley, folk motifs, tie-dye, mixed florals — pattern is welcome.',
    footwearW: 'Tan sandals, suede ankle boots, espadrilles.', footwearM: 'Woven sandals, suede boots, canvas shoes.',
    jewelleryW: 'Layered pendants, stacked bangles, textured earrings.', jewelleryM: 'Beaded strands, a leather cuff, a pendant.',
    watch: 'A worn-leather or woven-strap watch — character over polish.',
    hair: 'Undone waves, braids, natural texture embraced.', makeup: 'Warm, sun-kissed and bronzy in a warm register.',
  },
  edgy: {
    key: 'edgy', name: 'Edgy', blurb: 'Sharp, confident, a little rebellious.',
    prints: 'Graphic, camo, bold abstract, tonal black-on-black texture.',
    footwearW: 'Combat boots, chunky sneakers, heeled boots.', footwearM: 'Chelsea or combat boots, chunky sneakers.',
    jewelleryW: 'Statement ear cuffs, chunky chains, stacked silver rings.', jewelleryM: 'Chunky chains, a signet or band ring in silver.',
    watch: 'A bold steel watch with a dark or matte dial.',
    hair: 'A sharp cut with strong shape — undercut, blunt, or textured crop.', makeup: 'A defined eye or lip in a bolder register.',
  },
  romantic: {
    key: 'romantic', name: 'Romantic', blurb: 'Soft, feminine, detail-loving.',
    prints: 'Ditsy florals, polka dots, lace and soft botanicals.',
    footwearW: 'Ballet flats, strappy or bow-detail heels, soft mules.', footwearM: 'Soft suede loafers, clean minimalist shoes.',
    jewelleryW: 'Delicate florals, pearls, fine drop earrings.', jewelleryM: 'A fine chain, a simple elegant band.',
    watch: 'A delicate watch with a slim strap and soft dial.',
    hair: 'Soft curls, romantic waves, gentle face-framing layers.', makeup: 'Soft, rosy and dewy in your undertone family.',
  },
  creative: {
    key: 'creative', name: 'Creative / Eclectic', blurb: 'Playful, expressive, rules-optional.',
    prints: 'Colour-blocking, mixed patterns, unexpected pairings.',
    footwearW: 'Statement sneakers, coloured boots, bold flats.', footwearM: 'Statement or coloured sneakers, expressive boots.',
    jewelleryW: 'Bold, sculptural, colourful — a conversation piece.', jewelleryM: 'An artful ring or a bold bracelet.',
    watch: 'A design-led watch with colour or an unusual dial.',
    hair: 'An expressive cut, colour, or shape you enjoy playing with.', makeup: 'A creative accent — colour on the eye or lip when you feel it.',
  },
  sporty: {
    key: 'sporty', name: 'Sporty / Athleisure', blurb: 'Active, comfortable, effortlessly casual.',
    prints: 'Tonal sportswear, clean logos, subtle technical texture.',
    footwearW: 'Performance and lifestyle sneakers, slides.', footwearM: 'Running and lifestyle sneakers, slides.',
    jewelleryW: 'Minimal and secure — small studs, a sports-friendly band.', jewelleryM: 'A silicone or steel band, minimal chain.',
    watch: 'A sport or smart watch on a rubber or woven strap.',
    hair: 'An easy, off-the-face cut that moves with you.', makeup: 'Fresh, sweat-friendly and minimal.',
  },
  elegant: {
    key: 'elegant', name: 'Elegant / Glam', blurb: 'Refined, considered, a little luxe.',
    prints: 'Rich solids, tonal jacquard, refined small prints.',
    footwearW: 'Elegant heels, pointed flats, sleek boots.', footwearM: 'Polished oxfords, sleek monk straps or loafers.',
    jewelleryW: 'A considered statement — one luxe piece worn well.', jewelleryM: 'Refined cufflinks, a slim precious-metal band.',
    watch: 'A refined dress watch — thin, precious-metal tones.',
    hair: 'A sleek, styled finish with polish.', makeup: 'A defined, elegant finish — a clean eye or a considered lip.',
  },
};
export const PERSONA_OPTIONS = Object.values(PERSONAS).map((p) => ({ key: p.key, name: p.name, blurb: p.blurb }));

// ── §7 · Beard shape by face (men) ───────────────────────────────────────────
export const BEARD_BY_FACE: Record<FaceShape, string> = {
  oval: 'Most beard shapes suit you — keep the lines clean and proportional.',
  round: 'A shorter beard on the cheeks with a little length at the chin lengthens the face.',
  heart: 'A fuller lower beard adds welcome weight to a narrower chin.',
  square: 'Keep it rounded and softer at the jaw to ease the angles.',
  diamond: 'A fuller chin and lighter cheeks balance wide cheekbones.',
  oblong: 'Keep it short and full at the sides — avoid extra length at the chin.',
};

// ── §8 · Coverage / world / fit — language modifiers ─────────────────────────
export const COVERAGE_NOTE: Record<Coverage, string> = {
  'fully-covered': 'Kept fully covered — high necklines, long sleeves and hems throughout.',
  modest: 'Kept modest — considered necklines and longer sleeves and hems.',
  balanced: 'A balanced coverage — some skin, some cover, as the occasion asks.',
  open: 'Open to more skin when you like — the choice stays yours per occasion.',
  unsure: 'Coverage kept flexible — adjust to what feels like you on the day.',
};
export const WORLD_NOTE: Record<World, string> = {
  western: 'Framed in Western wear.',
  ethnic: 'Framed in ethnic/traditional wear, held to the same depth of thought.',
  fusion: 'Framed as fusion — mixing Western and traditional with intent.',
  unsure: 'Framed across both Western and traditional, whichever suits the moment.',
};
export const FIT_NOTE: Record<Fit, string> = {
  fitted: 'Leaning fitted and close to the body.',
  tailored: 'Leaning tailored — structured and precise.',
  relaxed: 'Leaning relaxed and easy.',
  oversized: 'Leaning oversized and roomy.',
  unsure: 'Fit kept adaptable.',
};

// ── §9 · Occasions → direction + a considerate heads-up ──────────────────────
export type OccasionKey =
  | 'office' | 'interview' | 'wedding-guest' | 'wedding-traditional' | 'party'
  | 'date' | 'gym' | 'travel' | 'casual' | 'festival';
export interface Occasion { key: OccasionKey; name: string; direction: string; avoid: string }
export const OCCASIONS: Record<OccasionKey, Occasion> = {
  office: { key: 'office', name: 'Office', direction: 'Polished and comfortable — tailored separates in your neutrals with one considered accent.', avoid: 'Anything you’ll fuss with all day, or a print that reads louder than the room.' },
  interview: { key: 'interview', name: 'Interview', direction: 'Quietly confident — a clean, well-fitting outfit in your neutrals; let them remember you, not the outfit.', avoid: 'Brand-new shoes, strong fragrance, or anything distracting.' },
  'wedding-guest': { key: 'wedding-guest', name: 'Wedding guest', direction: 'Celebratory and refined — a rich colour from your palette, dressed up with one good accessory.', avoid: 'A gentle heads-up: it’s kind to steer clear of white or the couple’s stated colours.' },
  'wedding-traditional': { key: 'wedding-traditional', name: 'Wedding (traditional)', direction: 'Full traditional intent — a considered ethnic look in your palette, with jewellery and drape given real thought.', avoid: 'A gentle heads-up on colours the hosts have reserved; otherwise wear your celebration proudly.' },
  party: { key: 'party', name: 'Party', direction: 'Expressive — lean into a statement colour, texture or piece you love.', avoid: 'Overthinking it; comfort you can still move and dance in matters.' },
  date: { key: 'date', name: 'Date', direction: 'Confident and like-yourself — one flattering hero piece in a colour that suits you, kept comfortable.', avoid: 'Wearing something brand-new and untested; go with what makes you feel at ease.' },
  gym: { key: 'gym', name: 'Gym', direction: 'Functional and supportive — breathable technical pieces that move with you.', avoid: 'Anything restrictive or that you’ll adjust mid-session.' },
  travel: { key: 'travel', name: 'Travel', direction: 'Comfort that still looks intentional — soft layers you can add or shed, in a tonal palette.', avoid: 'Stiff fabrics and anything hard to move or sleep in.' },
  casual: { key: 'casual', name: 'Casual', direction: 'Easy and you — your everyday neutrals with a comfortable, lived-in feel.', avoid: 'Nothing to avoid — this is your comfort zone; enjoy it.' },
  festival: { key: 'festival', name: 'Festival', direction: 'Joyful and expressive — colour, texture and pieces that feel festive and personal.', avoid: 'Anything you can’t be on your feet in all day.' },
};
export const OCCASION_OPTIONS = Object.values(OCCASIONS).map((o) => ({ key: o.key, name: o.name }));

// ── §10 · Capsule 60/25/15 ───────────────────────────────────────────────────
export const CAPSULE_FORMULA = {
  essentials: { pct: 60, label: 'Foundation', note: 'Versatile neutrals that pair with everything — the backbone.' },
  statement: { pct: 25, label: 'Signature', note: 'Colour and texture from your palette that make it feel like you.' },
  accent: { pct: 15, label: 'Accent', note: 'A few standout pieces and accessories that lift a look.' },
};

// ── §12 · Packing — scaled capsule ───────────────────────────────────────────
export const PACKING_RULE =
  'Minimise pieces, maximise combinations: a tight tonal palette so most tops meet most bottoms. A handful of pieces should map to many looks.';

// ── §14 · Colour pairing ─────────────────────────────────────────────────────
export const COLOUR_PAIRING = [
  { name: 'Bright + neutral', how: 'Anchor one bright piece with neutrals so it leads without shouting.' },
  { name: 'Same temperature', how: 'Keep warms with warms and cools with cools for an easy, harmonious look.' },
  { name: 'Tonal', how: 'Different shades of one colour, head to toe — quietly elegant and hard to get wrong.' },
];
