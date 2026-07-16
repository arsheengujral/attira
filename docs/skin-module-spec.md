# SPEC — SKIN MODULE
`/specs/skin-module-spec.md` — feature-by-feature build spec, extracted from the approved Claude Design screens (1a–1g, 2a–2d) + `scaffold-skin.md`.

> Format per feature: **Trigger → Flow → Output → Saves → Rules → States.**
> Pairs with: `design-system.md` (look) and `scaffold-skin.md` (domain knowledge/content generation rules).

---

## FEATURE: Skin Home *(screen 1a/1b)*

- **Trigger:** default tab on opening the Skin module ("Today").
- **Flow:** greeting (time-of-day + name) → Skin Score ring w/ trend chip → streak card → today's rituals (AM/PM status) → climate card → progress teaser → weekly report countdown → a memory-driven insight card.
- **Output:** a single scrollable, personalised dashboard. Whichever ritual is next (AM or PM) is visually emphasised ("glows subtly" per brief).
- **Saves:** nothing new — reads from `module_profiles`, `streaks`, `memory_patterns`.
- **Rules:**
  - Greeting + emphasis reorder by **concern-led priority** (acne-prone → acne content leads; dry → hydration leads; pigmentation → brightening leads) per `scaffold-skin.md` §6.
  - Climate card pulls the user's city + live-ish UV/pollution context and reflects it in tonight's ritual note.
  - Insight card is a rendered `memory_pattern` ("your skin's been calmer every week this month") — only shown when a real pattern exists; otherwise show a lighter placeholder, never fabricate a pattern.
- **States:** first-day (no score yet → "let's find your baseline" CTA to Check-in) · normal · streak-at-risk (day not yet completed, evening) · after check-in (score just updated, brief celebratory chip).

---

## FEATURE: Skin Check-In *(screens 1c/1d)*

- **Trigger:** monthly nudge from Companion, or manual "Check in" tap.
- **Flow:** (1) add photos — front/left/right, ghost-outline overlay for alignment consistency → (2) short feeling-based questions (how does skin feel today, any new concerns, sleep/stress if not asked recently) → (3) calm processing moment (light-sweep animation, NOT a "scanning" metaphor) → (4) results screen.
- **Output:** results screen = headline insight (serif, framed as progress) → **"What's thriving" block first** → 6 indicator rings (Hydration, Oil Balance, Texture, Brightness, Tone Evenness, Calmness) → "Where we're heading" block (one honest, constructive next focus) → **mandatory disclosure line**: *"Drawn from your answers, habits and [N] check-ins — never a medical measurement."* → CTA "See what changed since last week."
- **Saves:** photos → `photos` (private, `kind='face'`) · answers → `skin_logs` · indicator values → `module_progress` (metric per indicator) · episode → `memory_episodes` ("Check-in completed: reported tight by evening, hydration flagged") · recompute Skin Score.
- **Rules:**
  - Indicator values are **generated from the user's answers + their history + the knowledge scaffold** — never presented as photo-measured biometrics. This is the critical safety line from `scaffold-skin.md` guardrail #1.
  - Strengths-first ordering always, per the design.
  - If any §21 referral trigger is matched in the free-text/answers → route to the **"See a Dermatologist" state** instead of a normal result (see below).
- **States:** first check-in (no history — frame as "establishing your baseline", skip the delta language) · returning (normal, with trend) · referral-triggered (warm handoff card, not the standard result) · skipped-photos (answers-only check-in still produces a result, photos optional never required).

---

## FEATURE: Morning Ritual *(screen 1f + base pattern in 1a)*

- **Trigger:** "Morning ritual — Begin" from Home, or the AM tab.
- **Flow:** ordered step cards per `scaffold-skin.md` §7 (AM layering order) → each step: number, product/ingredient name, duration, one-line "why," expandable ingredient chip(s) → swipe-to-complete per step → final step closes the AM ring.
- **Output:** completion animation on the day ring; confetti **only** at streak/XP milestones, never per ordinary ritual.
- **Saves:** each step → `routine_completions` · ritual completion → contributes to `streaks` + `xp_events`.
- **Rules:**
  - **Gender-aware content:** male profiles substitute grooming-relevant steps (see Shave-Day variant below) — same component, different `steps[]` data, not a separate screen.
  - Step copy (the "why," the ingredient explanation) is generated per-user from `scaffold-skin.md`'s ingredient matrix — reflects their actual actives, concentration, and where they are in a ramp-up schedule (§9 of the scaffold): *"Tonight is night 2 of 3 this week"* style copy for actives.
  - SPF is the mandatory final AM step whenever any active is in the routine — never optional in the UI.
- **States:** all steps pending · in-progress (current step "NOW" tag) · complete · skipped-yesterday (gentle catch-up prompt, no guilt copy) · barrier-recovery mode active (routine collapses to the 3-step minimum, see Skin Reset below).

### Sub-variant: Shave-Day Ritual *(screen 1f, Arjun)*
- **Trigger:** male profile + user has enabled shaving in their grooming preferences, shown on shave days.
- **Flow:** warm-water cleanse → pre-shave oil (with a specific tip: *"a thin slick of squalane and jojoba lets the blade glide instead of scrape"*) → shave (with the grain, light passes) → calming post-shave balm (niacinamide) → SPF.
- **Content source:** `scaffold-skin.md` §23 (men's skin & grooming).
- **Saves/rules:** same as Morning Ritual above; logged as a distinct ritual type so streaks/history can reference shave-specific patterns ("your jawline redness is down three weeks running").

---

## FEATURE: Night Ritual — "ceremony mode" *(screen 1e)*

- **Trigger:** "Night ritual" from Home, or PM tab, typically evening.
- **Flow:** same step-card pattern as Morning, rendered in the **dark ceremony palette** (`design-system.md` §2c) regardless of the user's general theme setting → PM layering order per scaffold §7 → active-ingredient step (e.g. retinol) shows ramp-schedule context inline ("Retinol 0.3% · night 2 of 3 this week") → final step ("overnight lip mask" or equivalent) → **day-complete moment**.
- **Output:** the day-complete card — big ring/number, one warm sentence, reward chips (XP, badge, streak freeze if newly earned), CTA "Good night ✓", secondary "Save this moment to your journey."
- **Saves:** as Morning Ritual, plus this specific completion closes the **day** ring (both AM+PM done) which is what actually increments the streak.
- **Rules:**
  - The day-complete card is the **payoff moment** — highest production value in the whole module. Reserve the dark-ceremony full-bleed treatment for this + real milestones only.
  - Copy references the scaffold's ramp-up schedule and conflict rules (e.g. "skip AHA tonight" chip when a retinol night coincides with what would otherwise be an exfoliation night — enforcing §7/§8 of the scaffold automatically, visibly, in the UI).
- **States:** normal night · milestone night (fortnight/week/day-30 — richer celebration) · streak-freeze-used night (shown kindly: "a freeze is saved if life happens").

---

## FEATURE: Streaks & XP *(screens 2a, 2b)*

- **Trigger:** ambient — always visible on Home; the day-complete moment is where it pays off.
- **Flow/Output:**
  - Streak ring/number + 7-dot week strip (M–S) showing completed/freeze/upcoming days + "freeze ×1" pill.
  - Skin XP level bar ("Level 7 · 260 XP to Level 8").
  - "Today's moments" checklist (morning ritual, a knowledge read, night ritual) each showing its XP value.
- **Saves:** `xp_events`, `streaks` (current, longest, last_active, freezes_remaining).
- **Rules:**
  - **Streak freeze is automatic and visible**, not a purchasable/hidden mechanic — one missed day consumes a freeze silently and kindly; the UI shows "1 freeze ×1" so the user always knows their safety net exists.
  - **No guilt copy, ever.** A missed streak day is never framed as failure. See Streak-Lost Recovery state below.
  - XP awarded for: ritual completion, check-in completion, reading a knowledge card, hitting a milestone. Never for anything that could pressure over-use (e.g. never award XP for doing MORE actives than the schedule prescribes).
- **States:** building · at-risk (evening, PM not done) · freeze-used · **streak-lost recovery** *(design this specifically — brief flagged it as a "try next"): warm, no-guilt re-entry message — "Streaks come and go. Your 6 weeks of progress didn't. Ready when you are." — restart the ring at 0 without shaming, keep the Skin Score and history fully intact.*

---

## FEATURE: Your Library — Ingredient Explorer *(screen 2c)*

- **Trigger:** "Learn" tab, or tapping an ingredient chip anywhere in the app.
- **Flow:** grid of ingredient tiles (monogram + name + mastery state: Mastered / Learning / New today / Tomorrow / locked "?") → tap opens the full ingredient page.
- **Ingredient page content:** what it does, concerns it helps, who it suits/who should be cautious, pairs-well-with / caution-with, frequency & AM/PM, realistic results timeline, common myths corrected, beginner vs "professional" depth toggle — **all sourced directly from `scaffold-skin.md` §5 (the ingredient matrix) and §22 (myths).**
- **Output:** a mastery/level system — "Enthusiast → Expert at 40 [ingredients]" — the level bar shown at the top of the Library.
- **Saves:** `memory_facts` — ingredients the user has actually used/is using get "Mastered/Learning" state; others are locked/discoverable. Reading a card → `xp_events`.
- **Rules:**
  - Only ingredients relevant to the user's actual routine + a curated discovery queue are unlocked/teased ("Tomorrow", "24 to discover") — not the entire matrix dumped at once. This paces the mastery hook per `design-system.md` §4 Knowledge card.
  - "Why it matters" microcopy ties each unlock back to something practical: *"You now read labels like someone who knows. Last week you spotted the fragrance in a serum before we did."* — pulls from a real logged event if one exists (ingredient-analyser usage), otherwise a general encouragement.
- **States:** empty (new user — show the discovery queue, not "no data") · normal grid · challenge active ("Read 3 more cards this week — July challenge · 4 of 7 done").

---

## FEATURE: 30-Day Glow-Up (journey path) *(screen 2d)*

- **Trigger:** opted into a monthly challenge from Home or Library.
- **Flow:** vertical node path — Day 1 (began) → Week 1 complete → Day 14 fortnight badge → Three-week badge → Photo day (week 4 comparison) → Transformation story (day 30) — current day emphasised as "You are here."
- **Output:** progress fraction + a kind, honest social-proof line ("92% of finishers keep their glow") + Continue CTA.
- **Saves:** challenge progress in `module_plans` (horizon='30day', items=the node list, progress index).
- **Rules:** nodes are populated from actual completions (rituals done, check-ins logged) — never fake progress. Milestone nodes trigger the Day-Complete—style celebration treatment, scaled up for bigger milestones.
- **States:** in-progress · finished (→ generates the transformation story, see Reports below) · abandoned/paused (re-entry should be as kind as Streak-Lost Recovery — never a guilt re-prompt).

---

## FEATURE: Progress Timeline *(screen 1g)*

- **Trigger:** "You" tab or Home teaser tap.
- **Flow:** header ("Your skin, getting stronger") → two-photo drag-to-compare (week selectable, e.g. Week 1 vs Week 6) with a score-delta chip on the divider → Skin Score line chart (multi-week) → ritual-consistency heat-strip (coloured squares per day) → milestone report list (Day 30 story, Day 90 report — locked/unlocked with a progress fraction).
- **Output:** the emotional/retention centrepiece — this screen should feel *the best* to open.
- **Saves:** reads `photos`, `module_progress`, `routine_completions` — no new writes except selecting which weeks to compare (UI state only).
- **Rules:** photo comparison always **private by default**; drag-to-compare, not a static side-by-side, per the design. Never let the score chart look punitive on a bad week — smooth the line, keep the tone neutral-positive.
- **States:** <2 data points (show one photo + "add your next check-in to start comparing" rather than a broken chart) · normal · milestone-report-ready (highlighted, tappable).

---

## FEATURE: Weekly Skin Report *(referenced on Home: "Drops Sunday")*

- **Trigger:** auto-generated every Sunday.
- **Flow/Output:** a digest — score movement, consistency, one ingredient highlight, one insight, one suggestion for the coming week. Delivered as a notification + sits in a "reports" list.
- **Saves:** generated from the nightly pattern-extraction job (Memory Engine) + the week's `module_progress`/`routine_completions`.
- **Rules:** always framed as a small celebration of the week, even a quiet one. Countdown chip shown on Home ("2 days").
- **States:** to be fully designed next (flagged in the brief as a "try next" — not yet in the approved screens).

---

## FEATURE: Product Scanner & Ingredient-List Analyser

- **Trigger:** "Scan a product" action (camera or paste text).
- **Flow:** photo/paste → parsed INCI list → per-ingredient breakdown, irritant flags, redundancy check against the user's shelf, suitability verdict.
- **Output:** per `scaffold-skin.md` §12 exactly — what it's for, key actives, match score, flags (irritant/allergen/conflict/comedogenic/fungal-acne-trigger), redundancy note, a clear verdict (keep / adjust / reconsider) with a reason.
- **Saves:** optionally add to `products` (shelf) with parsed ingredients stored.
- **Rules:** brand-neutral — evaluate the formula, never praise/shame a brand name. Pregnancy note surfaces automatically if relevant per user profile.
- **States:** not yet in the approved visual screens — build using the Ingredient page visual language (2c) as the component base; full screen design still open (not yet in the approved batch).

---

## FEATURE: Product Shelf

- **Trigger:** "You" tab.
- **Flow/Output:** grid of owned products — photo, opened/expiry state, AM/PM tag, frequency, favourite. Gentle nudge when something's expiring (`scaffold-skin.md` §25).
- **Saves:** `products` table.
- **States:** empty (prompt to add first product, not "no data") · normal grid · expiring-soon flagged items.

---

## FEATURE: Skin Coach (conversation cards)

- **Trigger:** ambient chat entry point.
- **Flow/Output:** **not chat bubbles** — responses render as rich cards (routine card, ingredient card, mini-chart, photo comparison, action button, educational card, quick-reply chips), matching the visual language already established by the other screens, not a separate bolted-on messenger UI.
- **Rules:** the model prompt = `scaffold-skin.md` §29 (Model Prompt Rules) exactly. Every response should be able to render as one of the existing card components — reuse, don't invent a sixth card style.
- **States:** open question · after Check-in (coach can reference the fresh results) · after a referral trigger (coach tone shifts to the warm hand-off register).

---

## FEATURE: Safety & Adaptive States *(must be designed, not bolted on)*

### "See a Dermatologist" moment
- **Trigger:** any `scaffold-skin.md` §21 referral condition matched (in Check-in answers, Coach conversation, or product analysis).
- **Flow/Output:** replaces the normal result with a warm, calm hand-off card — never alarming, never a red/error visual treatment. Explains *why* gently, offers a simple interim gentle-care protocol, never diagnoses.
- **Rules:** exact tone per scaffold §21 "How to refer." No dead-end — always leave the user with something supportive to do.

### Pregnancy-Safe Mode
- **Trigger:** user indicates pregnancy/breastfeeding in profile (sensitive, consent-gated per Memory Engine rules).
- **Flow/Output:** routine automatically substitutes retinoid steps → bakuchiol/peptides per scaffold §16, communicated positively in the ritual card itself ("swapped for a pregnancy-friendly alternative"), not as a warning label.
- **Rules:** never require the user to remember this — the substitution is automatic and persistent until they update their profile.

### Skin Reset (barrier-recovery / "spa mode")
- **Trigger:** user-initiated, or suggested when scaffold §20 signals are detected in Check-in answers (new stinging, unusual redness/tightness).
- **Flow/Output:** the whole experience visibly calms — routine collapses to the 3-step minimum (§10 of scaffold), palette software further, copy becomes extra gentle, a visible timer/duration ("hold for 2–4 weeks") with its own small progress indicator.
- **Rules:** exits automatically back to the normal routine builder once the reset period completes, reintroducing one active at a time per §9.

### Purging vs Breaking Out explainer
- **Trigger:** surfaced automatically 1–2 weeks after starting a new turnover-accelerating active (retinoid/AHA/BHA), or on user question.
- **Flow/Output:** a reassuring explainer card, side-by-side comparison per scaffold §18 (where it appears, timing, duration) — not a wall of text, a clear visual comparison.

---

## GLOBAL RULES (apply to every feature above)

1. **No feature ever uses the word "AI."**
2. **Every score/indicator is explainable** — a tap should always reveal "why" this number, sourced from real logged data + the scaffold, never a black box.
3. **Every empty state has an illustration + one action + no "No data."**
4. **Every celebratory moment (confetti, full-bleed dark ceremony treatment) is reserved for real milestones** — using it on ordinary days cheapens it and trains users to ignore it.
5. **Every guardrail in `scaffold-skin.md` (§1, §21, §22) is enforced in the UI, not just in generated text** — e.g. the "skip AHA tonight" chip, the mandatory disclosure line on Check-in results, the automatic pregnancy substitution.
6. **Gender and skin-tone adaptivity is data-driven** (profile fields → content selection), never a fork into separate screens/components.

---

## OPEN ITEMS (flagged by the design session, not yet resolved)

- Weekly Skin Report — full screen not yet designed.
- Skin Coach conversation-card screen — not yet designed (build from existing card components once designed).
- Product Scanner results screen — not yet designed (build from Ingredient page + scaffold §12 once designed).
- ~~Confirm 2a vs 2b as default~~ — **resolved:** 2a (lavender) is default, dark ceremony mode (2c) ships alongside it as designed, 2b (sage/periwinkle) is a future alt theme.

**Recommendation:** take these four back into Claude Design before Phase 0 build, using the same brief conventions (trigger → priority screens), so the full module is visually complete before Claude Code starts.
