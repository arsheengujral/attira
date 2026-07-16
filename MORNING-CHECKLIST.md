# Morning checklist — verify ATTIRA end-to-end

Do these **in order**. Each step says what you should see. 🟢 = should work tonight's
build, 🟡 = written but **untested pending a live DB**, ⚪ = needs an optional key.

## 0. One-time setup (~10 min)

1. **Create a Supabase project** → https://supabase.com.
2. **Run the migrations** in the SQL editor, in this order (paste each file, run):
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_rls.sql`
   - `supabase/migrations/0003_memory.sql`
   > If `0003` errors on `vector`/`hnsw`, enable the **vector** extension first
   > (Database → Extensions → enable `vector`), then re-run it.
3. **Env:** `cp .env.example .env.local`, then fill from Supabase → Project settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - *(optional)* `ANTHROPIC_API_KEY` → turns on the Coach's conversational answers + the nightly job
   - *(optional)* `EMBEDDINGS_API_KEY` → semantic memory retrieval (else recency)
   - *(optional)* `CRON_SECRET` → to trigger the nightly pattern job
4. `npm install && npm run dev` → http://localhost:3000

## 1. Auth 🟢

- Go to **`/auth`** → "Create an account" → email + password (≥6 chars) → submit.
- **Expect:** you're signed in and redirected to **`/onboarding`**.
- (Sign out later from `/account`; sign back in to confirm the session persists.)

## 2. Saved profile 🟢 (this is the thing you wanted to test)

- On **`/onboarding`**, fill in a few fields (set **City** and **Climate** at least) + pick goals → **Save profile**.
- **Expect:** redirect to **`/account`** showing your email + the saved profile values + goals.
- Reload `/account` — values persist. Edit → change something → Save → it updates.

## 3. Memory Engine 🟢

- Go to **`/memory`**.
- **Expect under Facts:** `city`, `climate`, etc. from onboarding (budget/relationship show a **sensitive** tag).
- **Expect under Episodes:** a "Completed onboarding — …" entry.
- **Export everything (JSON)** downloads `attira-memory.json`.
- Toggle a **consent** category (health/relationships/finances) → it sticks on reload.
- Delete one row (×) and confirm it's gone; "Delete all memory" clears the lists.

## 4. Skin preview loads *your* data 🟡

- Go to **`/`** while signed in.
- **Expect:** the app renders with no crash; the greeting name is derived from your email.
- ⚠️ **Known/expected:** with no routines, check-ins or progress rows yet, many tiles still show
  demo-shaped placeholders (score, streak, rituals). That's the documented fallback — it means
  "no live rows yet", not a bug. Real values appear once steps 6–7 write data.

## 5. Product Scanner 🟢

- **Learn** tab → **Scan a product** → paste e.g.
  `Aqua, Retinol, Squalane, Niacinamide, Fragrance, Limonene` → **Analyze**.
- **Expect:** category, key actives, a match score, **Irritant** flags (Fragrance, Limonene),
  and a **Verdict** with a reason. (Signed in, it also uses your profile + product shelf for
  redundancy/conflict.)

## 6. Skin Coach 🟢 safety / ⚪ conversation

- **Learn → Ask your guide** (or Today's insight card).
- **Safety (works with no key):** type `I have a mole that is changing and bleeding` → you get a
  calm **"Worth seeing a dermatologist"** card + an interim gentle routine. (Never red/alarming.)
- **Conversation (needs `ANTHROPIC_API_KEY`):** ask `What does niacinamide do?` →
  - with a key: an answer card (+ a tappable Niacinamide ingredient card).
  - without a key: a card telling you to add the key — everything else still works.
  - ⚠️ **Note:** the Anthropic key was **not present in the build environment**, so the live model
    path is **unverified** — this is the most likely place to hit a first-run issue.

## 7. Write-backs 🟡 (untested — check these rows appear in Supabase)

While signed in on **`/`**:
- Complete the **Morning ritual** (swipe/tap the NOW step through) → check the `routine_completions`
  and `xp_events` tables for new rows.
- Complete the **Night ritual** → at the day-complete screen tap **Good night** → check `streaks`
  advanced and a `routine_completions`/`xp_events` row landed.
- Run a **Check-in** → on the results, tap **See what changed** → check `skin_logs`,
  `module_progress` (one row per indicator + `skin_score`), and `module_profiles.score`.
- Then reload `/` — the score/streak/indicators should now reflect the real rows (step 4's
  placeholders get replaced).

## 8. Nightly pattern job ⚪ (needs `ANTHROPIC_API_KEY` + `CRON_SECRET`)

- After a few episodes exist, trigger it manually:
  ```bash
  curl -X POST http://localhost:3000/api/jobs/patterns \
    -H "Authorization: Bearer $CRON_SECRET"
  ```
- **Expect:** JSON like `{ ok: true, processed: N, patternsWritten: M }`, and new rows in
  `memory_patterns`. Those then surface on Today's insight card and in `/memory`.

---

### Where bugs are most likely (untested paths)
1. **Write-backs** (`lib/skin/actions.ts`) — never run against a real DB.
2. **The live loader** (`lib/skin/load.ts`) — the DB→screen mapping, esp. routines→ritual steps
   and completions→week/heat strips.
3. **The Anthropic path** in the Coach + nightly job — no key was available to exercise it.

If any of these misbehave, tell me what you saw and I'll fix it fast — the pure logic (safety,
analyzer) and the whole degraded/demo path are already verified.
