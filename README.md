# ATTIRA — Skin

> Your skin, getting stronger. Intelligence felt, never announced.

ATTIRA's **Skin** module, implemented pixel-faithful to the approved *ATTIRA
Skincare v2* Claude Design handoff (screens 1a–1g + 2a–2d). A calm, personal
companion for morning and night rituals, monthly check-ins, an ingredient
library, and visible progress over time.

This is a standalone project — self-contained, with no dependency on any other
codebase.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind**
- Cormorant Garamond (display serif) + Figtree (humanist UI sans), self-hosted
  via `next/font`
- A hand-authored, scoped design system in `app/globals.css` (all tokens under
  `.att-root`)

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts: `npm run build`, `npm run typecheck`, `npm run lint`.

## What's here

The five tabs — **Today · Check-in · Rituals · Learn · You** — plus the
immersive moments (night ceremony, day-complete, 30-day journey, ingredient
detail).

| Area | Screens implemented |
|---|---|
| **Today** | Home — merges 1a signature home + 2a engagement loop (skin-score ring, streak week-strip, XP bar, tonight's ritual, climate card, progress teaser, memory insight) |
| **Check-in** | Intro → processing (1c) → strengths-first results (1d) with six indicator rings + the mandatory disclosure line |
| **Rituals** | Hub + Night ceremony (1e, dark mode, swipe-to-complete) + gender-aware Morning shave-day variant (1f) |
| **Learn** | Ingredient library collection (2c) + ingredient detail pages |
| **You** | Progress timeline (1g): drag-to-compare, score chart, consistency heat-strip, milestone reports |
| **Moments** | Day Complete (2b) · 30-Day Glow-Up journey (2d) |

## Structure

```
app/
  layout.tsx        root layout + fonts
  page.tsx          renders the app
  globals.css       the scoped design system (tokens, keyframes, components)
components/
  AttiraApp.tsx     top-level shell: tab + overlay state
  shell.tsx         phone frame, bottom nav, Screen wrapper
  ui.tsx            Ring, MiniRing, SwipeToComplete, CompareSlider
  data.ts           demo domain data (sourced from docs/scaffold-skin.md)
  screens/          one file per screen
lib/fonts.ts        Cormorant Garamond + Figtree
docs/               the design system, module spec, skin scaffold, master brief
```

## Guardrails (enforced in the UI, not just copy)

Straight from `docs/scaffold-skin.md` and `docs/design-system.md`:

- **Never the word "AI."** Intelligence is felt, never announced.
- Cosmetic, never medical — the check-in shows *"Drawn from your answers, habits
  and 42 check-ins — never a medical measurement"* on every result.
- Strengths lead: "What's thriving" always precedes "Where we're heading."
- Ingredients before brands; the ingredient library corrects myths.
- Conflict rules made visible ("Skip AHA tonight" chip on a retinol night).
- Pregnancy-safe & Skin-Reset adaptive states; SPF is never optional in a
  morning routine with actives.
- The streak freeze is automatic and visible — no guilt copy, ever.
- Celebration (confetti, full-bleed dark ceremony) is reserved for real
  milestones only.
- Respects `prefers-reduced-motion`; keyboard-operable gestures.

## Design source

The `docs/` folder carries the source-of-truth documents. The imported Claude
Design handoff is the primary visual authority; `docs/design-system.md` is the
written cross-check. Where they differ, the imported design wins.
