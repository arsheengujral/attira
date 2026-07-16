# ATTIRA — Design System
`/design/design-system.md` — locked from the approved Claude Design screens (Skincare v2).

> Source: `Attira_Skincare_Design_2.pdf` — screens 1a–1g (priority) + 2a–2d (engagement engine).
> **Hex values below are read from the approved screens and are close but not pixel-exact — before Phase 0 build, re-verify against Claude Design's exported style tokens/CSS if available, and treat this file as authoritative once confirmed.**

---

## 1. BRAND VOICE (carries into every string in the UI)

- **Never the word "AI."** Not in labels, not in copy, not in feature names. Intelligence is felt, never announced.
- Calm, warm, precise. A knowledgeable friend, not a clinic and not a hype machine.
- Progress-framed always: *"your skin, getting stronger"* — never "your skin, fixed" or anything deficit-framed.
- Second person, present tense, short sentences. *"Retinol renews at night while you sleep; softness shows in 8–12 weeks."*

---

## 2. COLOUR

### 2a — Signature palette (ivory / lavender) — the default
| Token | Approx hex | Use |
|---|---|---|
| `--bg` | `#F3EFE9` (warm ivory) | App background |
| `--surface` | `#FBF9F6` | Cards |
| `--surface-lav` | `#E7DCEF` | Lavender-tinted card (hero/streak cards) |
| `--ink` | `#241E2E` | Primary text |
| `--ink-soft` | `#726C82` | Secondary text |
| `--accent-lavender` | `#9E7FD1` | Primary accent — rings, active states, streak fill |
| `--accent-gold` | `#D4A853` | Secondary accent — XP, badges, CTAs, "NOW" tags |
| `--accent-teal` | `#4FA88A` | Positive/completion states, tone-evenness indicators |
| `--accent-rose` | `#D98A93` | Warm indicator tone (hydration-adjacent rings) |
| `--line` | `rgba(36,30,46,.10)` | Borders, dividers |

### 2b — Fresher variant (porcelain / sage / periwinkle) — alternate/light option
| Token | Approx hex | Use |
|---|---|---|
| `--bg-alt` | `#EDF1EF` (porcelain) | Alt background |
| `--accent-sage` | `#6FA98B` | Primary ring/accent in this variant |
| `--accent-periwinkle` | `#8B9FE0` | Secondary accent |

**✅ Confirmed:** all three palettes ship — they were never meant to be exclusive.
- **2a (lavender/ivory) is the default light theme.**
- **2c (dark "ceremony" mode)** is confirmed as intentional and stays exactly as designed — it's not a competing app-wide theme, it's the deliberate PM ritual + milestone state, triggered by context, layered on top of whichever light theme is active.
- **2b (sage/periwinkle)** is a nice-to-have alternate light theme for later (e.g. a user-selectable option in Settings) — not required for Phase 1 launch.

### 2c — Night "ceremony" mode (PM ritual + dark mode base)
| Token | Approx hex | Use |
|---|---|---|
| `--bg-night` | `#241D33` (deep aubergine) | Night ritual background |
| `--surface-night` | `#2E2540` | Night cards |
| `--surface-night-active` | `#3A2E52` | The "NOW" active step card |
| `--ink-night` | `#F1ECF7` | Text on dark |
| `--accent-gold-night` | `#E0B863` | CTA ("Good night ✓"), ring stroke, badges — gold reads warmer against dark |

**Rule:** night mode is not just "dark mode" — it's a deliberate *ceremony* state, triggered by the PM ritual specifically, distinct from a general app-wide dark theme. General dark mode (for browsing outside the ritual) can reuse these tokens but should feel slightly less theatrical.

### 2d — Semantic colour
- Completion / done: `--accent-teal`
- Attention / "NOW" / in-progress: `--accent-gold`
- Streak / mastery: `--accent-lavender` + `--accent-gold`
- Never use red/error tones for skin concerns — no concern is framed as a "problem" chromatically.

---

## 3. TYPOGRAPHY

- **Display / headers:** an elegant serif (as seen in "Good morning, Maya", "Your skin, getting stronger", "14 DAYS COMPLETE") — warm, editorial, not corporate. *(Recommend Fraunces or Freight Display — matches the serif weight/warmth visible in the screens.)*
- **Body / UI:** a clean humanist sans for all functional text — labels, buttons, step descriptions. *(Recommend Inter or Plus Jakarta Sans.)*
- **Numerals (scores, streak counts):** large serif or a distinct numeral style for the hero number (e.g. "82", "I2" streak, "I4 DAYS") — these are treated as *jewellery*, not data. Extra letter-spacing on the small-caps labels beneath them ("SKIN SCORE", "DAY STREAK").
- **Eyebrow labels:** small caps, wide letter-spacing, muted colour — "YOUR SKIN CHECK-IN", "WEEK 6 OF YOUR GLOW JOURNEY", "TODAY'S MOMENTS".

---

## 4. SIGNATURE COMPONENTS

### Progress ring
- Circular, thin stroke, accent-coloured fill proportional to score/completion.
- Big serif number centred inside.
- Small-caps label beneath the ring, outside or at the bottom edge.
- Trend chip beside it when relevant ("▲ +3 this week").
- Used for: Skin Score, Check-in indicators (hydration/oil/texture/brightness/evenness/calmness), streak counter, day-complete ring.

### Streak tracker
- Large ring/number (e.g. "12 DAY STREAK") + a 7-dot week strip (M T W T F S S) showing which days completed, which are freeze-protected, which are upcoming.
- "freeze ×1" shown as a small pill — visualises the kindness mechanic explicitly, so users *see* their safety net.

### Ritual step card
- Numbered circular badge (1, 2, 3…) in a soft accent tone.
- Product/step name (semi-bold), duration, one-line "why this matters."
- Ingredient chips beneath (e.g. "Retinol 0.3%", "Squalane base") — tappable/expandable.
- Completed state: teal check, card recedes/dims slightly.
- Active/current state: **"NOW"** gold tag, card slightly elevated with a subtle highlight border.
- Future steps: muted, collapsed to a single line until reached.
- **"SWIPE WHEN DONE"** as the primary completion gesture, rendered as a pill-shaped swipe affordance — not a checkbox.
- Final step in a ritual closes into a **day-complete ring/celebration moment**, not just a checkmark.

### Day-complete / milestone card
- Full-bleed celebratory screen, dark ceremony background even if the rest of the app is light.
- Big ring number ("14 DAYS COMPLETE"), one warm sentence, 2–3 reward chips (+XP, badge, streak freeze earned), a primary CTA ("Good night ✓"), and a soft secondary action ("Save this moment to your journey").
- Reserved for real milestones (week 1, fortnight, day 30, day 90, day 365) — **never fires on an ordinary day.**

### Knowledge card (Library / Ingredient Explorer)
- Small square/rounded-square tile: 2-letter monogram (e.g. "Ha" for Hyaluronic Acid) in a soft coloured circle, ingredient name, mastery state ("Mastered" / "Learning" / "New today" / "Tomorrow" / locked "?").
- Grid layout, collection/album feel — reinforces "knowledge as a collection worth showing off."
- Level bar beneath the grid header (Enthusiast → Expert at 40) — treated as a status progression, not a progress bar for a task.

### Journey path (30-Day Glow-Up)
- Vertical path/timeline, node-based (circles connected by a line), most-recent/current node emphasised and larger with an accent ring ("You are here").
- Past nodes show completion state (check, badge icon); future nodes are pale/outlined.
- Milestone nodes (Day 14 fortnight badge, Week 1 complete, Day 30 transformation story) are visually distinct from ordinary daily nodes.
- Social-proof microcopy at the base ("92% of finishers keep their glow") — used sparingly, only where true and earned.

### Check-in results card
- Serif headline framed as insight, not diagnosis: *"Your skin is getting stronger — hydration is the next chapter."*
- "What's thriving" block **first**, before any "where we're heading" block — strengths always lead.
- 6 indicator tiles in a 3×2 grid, each a small ring + number + label (Hydration, Oil Balance, Texture, Brightness, Tone Evenness, Calmness).
- Explicit trust line beneath: *"Drawn from your answers, habits and 42 check-ins — never a medical measurement."* — **this disclosure line is required on every check-in results screen, verbatim in spirit.**

### Progress timeline (comparison)
- Two-photo side-by-side with a **drag-to-compare** divider handle (not a simple before/after swap).
- Score delta chip on the divider ("+9 skin score").
- Line chart for the skin-score trend beneath.
- "Ritual consistency" shown as a coloured square heat-strip (one square per day/week), not a bar chart — reads more like a habit-tracker mosaic.
- Milestone report cards below (Day 30 story, Day 90 report) shown as unlocked/locked list items with a progress fraction.

### Bottom navigation
Five items, icon + label: **Today · Check-in · Rituals · Learn · You**. "Today" is the default/home tab.

---

## 5. MOTION

- Spring easing throughout — nothing linear, nothing abrupt.
- Rings fill with an animated stroke draw, not an instant snap.
- Swipe-to-complete has a satisfying resistance-then-release feel.
- Day-complete and milestone moments get a distinct, more theatrical transition (fade through the dark ceremony background) — reserved for genuine milestones only.
- Card expand/collapse (tap ingredient chips) = smooth height morph, not a hard cut.
- Respect `prefers-reduced-motion` — replace spring/parallax with simple crossfades.

---

## 6. SPACING & SHAPE

- Generous outer padding, cards breathe — nothing feels dense.
- Corner radius: large and consistent (~20–28px equivalent) on cards; fully round on pills, badges, and the streak/score rings.
- Soft, diffuse shadows — never hard-edged. Cards read as resting gently on the background, not cut out of it.
- Dividers are hairline and low-contrast; hierarchy comes from spacing and colour, not rules.

---

## 7. ADAPTIVE / PERSONALISATION PATTERNS (confirmed in the screens)

- **Gender-aware ritual content:** Maya's morning ritual ≠ Arjun's shave-day ritual. Same component (ritual step card), different steps and copy (pre-shave oil, "with the grain" cues, post-shave calming balm). Build this as data-driven, not a separate screen.
- **Climate-aware card:** "DELHI TODAY · UV 9 · Hazy · High pollution — tonight's [routine adjusts]" — a dedicated small card on Home, city-specific.
- **Concern-led ordering:** whichever concern is most active reorders what's emphasized on Home/Check-in (confirmed by brief; visually the pattern is "lead metric + one supporting line," reusable per concern).
- **Historical callbacks in copy:** *"Your barrier feels calm for the 9th day running"*, *"Last week you spotted the fragrance in a serum before we did"* — these are memory-engine outputs rendered as encouragement, not raw stats. Copy should always be written in this remembering, personal register.

---

## 8. WHAT TO BUILD FROM THIS

This file plus `/specs/skin-module-spec.md` plus `/scaffolds/skin.md` = everything Claude Code needs for Phase 0 (design tokens + shell) and Phase 1.2 (Skin module).

The **four priority screens** (1a Home, 1c/1d Check-in, 1g Progress, ritual screens 1e/1f) should be built pixel-faithful to the approved designs. The **engagement screens** (2a–2d: streak, day-complete, library, 30-day journey) are the mechanics layer — build these as reusable components since they'll be reused by every future module (Style, Hair, Career, English…), not just Skin.
