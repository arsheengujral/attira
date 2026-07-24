/**
 * The Style compute engine — turns a style profile into the six structured
 * outputs (plus a hair/makeup block), deterministically and with zero cost.
 *
 * Every block ALWAYS renders (spec GLOBAL RULE 2). "Unsure"/missing answers fall
 * back to the most universally-flattering defaults (face → Oval, persona →
 * Casual Chic, body → Rectangle, undertone → Neutral) and still produce a
 * complete, confident result. Body-positive throughout — dress to shape, never
 * "correct".
 */

import {
  SEASONS, FACE_SHAPES, BODY_SHAPES_WOMEN, BODY_SHAPES_MEN, PERSONAS,
  BEARD_BY_FACE, COVERAGE_NOTE, WORLD_NOTE, FIT_NOTE, OCCASIONS, CAPSULE_FORMULA,
  computeSeason,
  type Undertone, type Depth, type Gender, type Coverage, type World, type Fit,
  type FaceShape, type PersonaKey, type OccasionKey, type Season,
} from './knowledge';

export interface StyleProfileInput {
  gender?: Gender;
  undertone?: Undertone;
  depth?: Depth;
  faceShape?: FaceShape | 'unsure';
  bodyShape?: string | 'unsure';
  persona?: PersonaKey | 'unsure';
  coverage?: Coverage;
  world?: World;
  fit?: Fit;
  hasFacialHair?: boolean;
  climate?: string;
}

export interface StyleResult {
  seasonName: string;
  colours: { palette: string[]; metals: string; ease: string; description: string };
  neckFrames: { cue: string; necklines: string; eyewear: string; hair: string };
  silhouettes: { name: string; silhouettes: string; fabrics: string; note: string };
  prints: string;
  footwear: string;
  jewellery: { pieces: string; watch: string };
  hairMakeup: { hair: string; makeup: string; beard?: string };
  flavour: { coverage: string; world: string; fit: string };
  personaName: string;
  faceName: string;
}

const MAKEUP_FAMILY: Record<string, string> = {
  warm: 'warm-toned (golden, peach, terracotta family)',
  cool: 'cool-toned (rosy, berry, soft-pink family)',
  neutral: 'neutral-toned (soft, balanced family)',
  unsure: 'neutral-toned (soft, balanced family)',
};

export function computeStyleProfile(input: StyleProfileInput): StyleResult {
  const gender: Gender = input.gender ?? 'unspecified';
  const undertone: Undertone = input.undertone ?? 'unsure';
  const depth: Depth = input.depth ?? 'unsure';

  const season: Season = SEASONS[computeSeason(undertone, depth)];

  const faceKey: FaceShape = (input.faceShape && input.faceShape !== 'unsure' ? input.faceShape : 'oval') as FaceShape;
  const face = FACE_SHAPES[faceKey];

  const bodyTable = gender === 'man' ? BODY_SHAPES_MEN : BODY_SHAPES_WOMEN;
  const bodyKey = input.bodyShape && input.bodyShape !== 'unsure' && bodyTable[input.bodyShape] ? input.bodyShape : 'rectangle';
  const body = bodyTable[bodyKey];

  const personaKey: PersonaKey = (input.persona && input.persona !== 'unsure' ? input.persona : 'casual-chic') as PersonaKey;
  const persona = PERSONAS[personaKey];

  const isMan = gender === 'man';
  const footwear = isMan ? persona.footwearM : persona.footwearW;
  const jewelleryPieces = isMan ? persona.jewelleryM : persona.jewelleryW;

  const makeup = `A ${MAKEUP_FAMILY[undertone] ?? MAKEUP_FAMILY.neutral} take on the ${persona.name.toLowerCase()} look — ${persona.makeup.toLowerCase()}`;
  const hair = `${persona.hair} ${face.hair}`;
  const beard = isMan && input.hasFacialHair ? BEARD_BY_FACE[faceKey] : undefined;

  return {
    seasonName: season.name,
    colours: { palette: season.palette, metals: season.metals, ease: season.ease, description: season.description },
    neckFrames: { cue: face.cue, necklines: face.necklines, eyewear: face.eyewear, hair: face.hair },
    silhouettes: { name: body.name, silhouettes: body.silhouettes, fabrics: body.fabrics, note: body.note },
    prints: persona.prints,
    footwear,
    jewellery: { pieces: jewelleryPieces, watch: persona.watch },
    hairMakeup: { hair, makeup, beard },
    flavour: {
      coverage: COVERAGE_NOTE[input.coverage ?? 'unsure'],
      world: WORLD_NOTE[input.world ?? 'unsure'],
      fit: FIT_NOTE[input.fit ?? 'unsure'],
    },
    personaName: persona.name,
    faceName: face.name,
  };
}

/** Which of the six blocks changed between two results — for the "what changed" diff. */
export function diffStyleResults(a: StyleResult, b: StyleResult): string[] {
  const changed: string[] = [];
  if (a.seasonName !== b.seasonName || a.colours.palette.join() !== b.colours.palette.join()) changed.push('Your Colours');
  if (a.neckFrames.necklines !== b.neckFrames.necklines) changed.push('Necklines & Frames');
  if (a.silhouettes.silhouettes !== b.silhouettes.silhouettes) changed.push('Silhouettes & Fabrics');
  if (a.prints !== b.prints) changed.push('Prints');
  if (a.footwear !== b.footwear) changed.push('Footwear');
  if (a.jewellery.pieces !== b.jewellery.pieces) changed.push('Jewellery & Accessories');
  return changed;
}

/** Occasion direction (§9), flavoured by the user's coverage/world/fit. */
export function occasionGuidance(key: OccasionKey, input: StyleProfileInput) {
  const o = OCCASIONS[key];
  const result = computeStyleProfile(input);
  return {
    name: o.name,
    direction: o.direction,
    avoid: o.avoid,
    framing: `${result.flavour.world} ${result.flavour.coverage}`,
    palette: result.colours.palette,
  };
}

/** A 60/25/15 capsule target list (§10) built from the palette + persona. */
export function capsulePlan(input: StyleProfileInput) {
  const r = computeStyleProfile(input);
  const [c1, c2, c3, , cNeutral] = r.colours.palette;
  return {
    groups: [
      {
        label: CAPSULE_FORMULA.essentials.label, pct: CAPSULE_FORMULA.essentials.pct, note: CAPSULE_FORMULA.essentials.note,
        items: [
          `Two tops in ${cNeutral} / off-white`,
          `A well-fitting bottom in a deep neutral`,
          `A ${r.personaName.toLowerCase()} jacket or layer`,
          `Your everyday footwear: ${r.footwear.split(',')[0]}`,
        ],
      },
      {
        label: CAPSULE_FORMULA.statement.label, pct: CAPSULE_FORMULA.statement.pct, note: CAPSULE_FORMULA.statement.note,
        items: [`A piece in ${c1}`, `A piece in ${c2}`, `A print you love: ${r.prints.split(',')[0].toLowerCase()}`],
      },
      {
        label: CAPSULE_FORMULA.accent.label, pct: CAPSULE_FORMULA.accent.pct, note: CAPSULE_FORMULA.accent.note,
        items: [`An accent piece in ${c3}`, `Accessories: ${r.jewellery.pieces.split(',')[0].toLowerCase()}`],
      },
    ],
  };
}

/** A compact text description — for a memory episode or a coach card. */
export function describeStyleResult(r: StyleResult): string {
  return [
    `Season: ${r.seasonName}. Palette: ${r.colours.palette.join(', ')}; metals ${r.colours.metals.toLowerCase()}.`,
    `Face (${r.faceName}): ${r.neckFrames.necklines}`,
    `Shape (${r.silhouettes.name}): ${r.silhouettes.silhouettes}`,
    `Persona (${r.personaName}): prints — ${r.prints} Footwear — ${r.footwear}`,
    `Jewellery — ${r.jewellery.pieces} Watch — ${r.jewellery.watch}`,
  ].join('\n');
}
