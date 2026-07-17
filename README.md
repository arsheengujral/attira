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

The app boots in a **degraded mode** with no configuration — the design preview
works and the auth-gated pages explain what's missing — so you only wire up what
you're testing.

## Setting up the backend (auth + database + Memory Engine)

1. **Create a Supabase project** → https://supabase.com.
2. **Run the migrations** in order in the SQL editor (or `supabase db push`):
   - `supabase/migrations/0001_init.sql` — the full Part 3 schema + auth trigger
   - `supabase/migrations/0002_rls.sql` — per-user Row Level Security
   - `supabase/migrations/0003_memory.sql` — the semantic-retrieval RPC + index
3. **Set env** — copy `.env.example` → `.env.local` and fill in
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` (from Project settings → API).
4. `npm run dev`, then go to **`/auth`** → create an account → you land on
   **`/onboarding`** → save your profile → **`/account`** shows it back to you,
   and **`/memory`** shows the facts it captured.

No model API key is needed — the Coach, personalized results, and the nightly job
are all rule-based (see below). Optional: `EMBEDDINGS_API_KEY` enables semantic
(vs. recency) memory retrieval; `CRON_SECRET` guards the nightly job route.

## Routes

| Route | What it is |
|---|---|
| `/` | The Skin design preview (the imported v2 screens) |
| `/auth` | Sign in / create account (email + password) |
| `/onboarding` | Profile intake — saves to `profiles` + seeds memory |
| `/account` | Your saved profile; sign out |
| `/memory` | View / export / delete everything remembered; consent toggles |
| `POST /api/auth/signup` | Confirmed sign-up (service role) |
| `POST /api/jobs/patterns` | Nightly pattern extraction (Bearer `CRON_SECRET`) |
| `GET /api/memory/export` | Download your memory as JSON |
| `POST /api/skin/coach` | The Skin Coach — returns answer/ingredient/referral cards |
| `POST /api/skin/analyze` | Ingredient-list analyser (§12) |

## Architecture (foundation — CLAUDE.md Phases 1–3)

- **Auth + shell** — `@supabase/ssr` (browser/server/admin clients in
  `lib/supabase/`), session refresh + route protection in `middleware.ts`.
- **Database (Part 3)** — `supabase/migrations/`. Every table is per-user with
  RLS (`auth.uid() = user_id`). `module_profiles` / `module_plans` /
  `module_progress` are **generic** — new domains need no migration.
- **Memory Engine (Part 2)** — `lib/memory/`. Facts, episodes (embedded),
  patterns, consent; `retrieveContext()` injects core facts + the active
  module's profile + the top-k relevant episodes/patterns (semantic, or recency
  when embeddings are off); the `/memory` page is full user control; the nightly
  job derives patterns from recent episodes.
- **Module framework (Part 1)** — `lib/modules/`. The `Module` contract
  (`assess → profile → plan → track → coach → score`) + a registry. Skin is
  registered as a config module (`lib/modules/skin/`) — intake, plan skeleton,
  the six tracked indicators, the coaching system prompt (scaffold §29 + injected
  memory), and the composite score formula (scaffold §26).

## Skin module — coach, scanner, safety

- **Data wiring** — the screens read a `SkinData` bundle from `useSkinData()`
  (`components/skin-context.tsx`). Signed in, `app/page.tsx` loads it from the
  schema via `lib/skin/load.ts` (module_profiles, streaks, module_progress,
  routines, routine_completions, skin_logs, memory_patterns, products); signed
  out it's the demo bundle, so the design preview is unchanged. Write-backs live
  in `lib/skin/actions.ts` (ritual completion, check-in).
- **Skin Coach** — `lib/skin/coach.ts` + `/api/skin/coach`. **Fully rule-based,
  zero cost, no LLM API.** It matches each question to the static knowledge in
  `lib/skin/knowledge.ts` (protocols §6, archetypes §11, myths §22,
  troubleshooting §27), the ingredient matrix, and the safety rules, then returns
  formatted cards (never chat bubbles). Safety (referral) runs first; answers are
  lightly personalized from the saved skin profile.
- **Product Scanner** — `lib/skin/analyze.ts` (deterministic §12 engine) +
  `/api/skin/analyze`, enriched with the user's profile + shelf.
- **Safety states** — `lib/skin/safety.ts`: dermatologist referral (§21),
  pregnancy-safe substitution (§16, auto-applied in the loader), Skin-Reset /
  barrier damage (§20/§10), purging-vs-breakout (§18). Pure, verifiable functions.

## Status — what's verified vs. untested

**Verified (demo + degraded):** typecheck, lint, and build all pass; the design
preview and every screen render; the Product Scanner and the Coach's **safety
referral** work end-to-end offline; auth/onboarding/account/memory drive cleanly.

The Skin Coach (rule-based) is verified — every intent (ingredient, protocol,
purging, myth, routine, troubleshooting, referral) returns real cards offline.

**Untested — pending your live Supabase (see `MORNING-CHECKLIST.md`):** the
DB→screen loader (`lib/skin/load.ts`) and the write-backs (`lib/skin/actions.ts`)
are written against the migrations but have never run against a real database.

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
