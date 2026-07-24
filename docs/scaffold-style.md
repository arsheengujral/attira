# SCAFFOLD — STYLE & WARDROBE
### Attira Style & Wardrobe Coach · domain intelligence layer
`docs/scaffold-style.md` — the rules and matrices the Style module computes from.

> **Provenance:** authored for ATTIRA from established, non-proprietary style
> theory (colour-season, face/body-shape, persona, occasion dress codes,
> capsule, colour pairing). The machine-readable source of truth is
> `lib/style/knowledge.ts`; this file is the human-readable companion. If a
> different, approved `scaffold-style.md` is provided later, swap the data in
> `knowledge.ts` — nothing else changes.

---

## 0. WHAT THIS FILE IS
The rules inside which the module composes a person's style guidance. Like the
Skin scaffold: this file = the rules; the compute engine = the composition; the
profile = who they are. **Rule-based and zero cost — no model calls.**

## 1. HARD GUARDRAILS — never violated
1. **Never say "AI."** Intelligence is felt, never announced.
2. **Body-positive.** Dress *to* shape, never imply a body needs "correcting."
3. **Gender-aware, not gender-gated.** Body-shape and accessory lists adapt to
   the menswear/womenswear choice; every feature stays available to everyone.
4. **Budget-aware.** Suggestions span budget bands; never assume spend.
5. **Own-closet first.** Prefer pieces already owned before suggesting new ones.
6. **Honesty about capability.** The visualiser is a colour/shape preview, never
   a photo of the user. Hair/makeup guidance is **styling only** — redirect care
   questions (dandruff, hair fall) to the Hair Coach; never name makeup shades/brands.
7. **Every one of the six structured outputs is always fully present** — never a
   partial result. "Unsure" answers still produce a complete, confident result.

## 2. INTAKE
Attira-wide (`profiles`): age band, gender, location, height, body shape, skin
depth, undertone, occupation, lifestyle, budget band, relationship status, goals.
Style-specific (`module_profiles.data`, `module_id='style'`): face shape, style
personality (persona), coverage preference, comfort world (Western/ethnic/fusion),
fit preference. Self-report only — **no photo/measurement needed for v1.**

## 3. COLOUR SEASON → palette
Undertone + depth → season. Warm+light → **Spring**; warm+deep → **Autumn**;
cool+light → **Summer**; cool+deep → **Winter**; neutral/unsure → **Balanced
Neutral** (the safe, flattering default). Each season yields a 5-swatch palette,
metals, and 2–3 colours to ease off. (Palettes/hex live in `knowledge.ts`.)

## 4. FACE SHAPE → necklines, frames, hair direction
Oval · Round · Heart · Square · Diamond · Oblong — each with a self-identify cue
and its neckline, eyewear, and hair guidance. Unsure → **Oval** (most universally
flattering). Feeds the *Necklines & Frames* block.

## 5. BODY SHAPE → silhouettes & fabrics (gender-aware)
Womenswear: Hourglass · Pear/Triangle · Inverted Triangle · Rectangle · Apple/Round.
Menswear: Rectangle · Triangle · Inverted/V · Oval/Round. Unsure → **Rectangle**.
Feeds the *Silhouettes & Fabrics* block. Always "dress to shape," never "fix."

## 6. STYLE PERSONA → prints, footwear, jewellery, hair, makeup
Nine single-select personas: Classic · Minimalist · Casual Chic · Bohemian ·
Edgy · Romantic · Creative/Eclectic · Sporty/Athleisure · Elegant/Glam. Each has
a one-line blurb and drives Prints, Footwear (gender-aware), Jewellery/Accessories
& Watch (gender-aware), plus hair/makeup direction. Unsure → **Casual Chic**.
(Blending is a v2 idea; v1 is single-select.)

## 7. BEARD SHAPE (men, if facial hair) — by face shape
Supplements the hair/makeup block for men with facial hair.

## 8. COVERAGE / WORLD / FIT — language modifiers
Coverage (fully-covered → open), comfort world (Western/ethnic/fusion), and fit
(fitted → oversized) flavour the language across all blocks. **Ethnic/traditional
wear is held to the same depth as Western — never a lighter fallback.**

## 9. OCCASION → direction + a considerate heads-up
Office · Interview · Wedding-guest · Wedding-traditional · Party · Date · Gym ·
Travel · Casual · Festival. Each: a direction, plus what to ease off — framed as
a kind heads-up (e.g. "it's kind to avoid white at a wedding"), never a rigid rule.

## 10. CAPSULE — the 60/25/15 formula
60% Foundation (versatile neutrals) · 25% Signature (palette colour & texture) ·
15% Accent (standout pieces & accessories). Cross-reference the closet: mark
owned vs. gap; don't regenerate from scratch when the closet is substantial.

## 12. PACKING — scaled capsule
Minimise pieces, maximise combinations; tight tonal palette; prefer owned items;
climate-aware (reuse the Skin module's location/climate logic, don't rebuild).

## 13. HAIR & MAKEUP — styling only
Hairstyle from face + persona; hair-colour direction + makeup undertone family
from undertone + persona. **Warm / cool / neutral families only — never specific
shades or brands.** Any hair *care* question → redirect to the Hair Coach.

## 14. COLOUR PAIRING
Three easy rules: **bright + neutral**, **same temperature**, **tonal**. Never
suggest a pairing that violates the user's coverage/fit preferences, even if the
colour logic is "valid."

## 15. THE SIX STRUCTURED OUTPUTS (always all present)
1. **Your Colours** — 5-swatch palette, metals, colours to ease off
2. **Necklines & Frames** — from face shape
3. **Silhouettes & Fabrics** — from body shape + fit
4. **Prints** — from persona
5. **Footwear** — from persona, gender-aware
6. **Jewellery/Accessories & Watch** — from persona, gender-aware
(+ a secondary **Hair & Makeup** styling block from face + persona + undertone.)
