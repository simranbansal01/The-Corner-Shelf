# Practice loop — v1

A working end-to-end React + Supabase app. Desktop-first, zero cost. This README is your full setup checklist — follow it top to bottom in order.

Everything in this repo has already been verified to build cleanly (`npm run build` succeeds with no errors). Your job is wiring in your own Supabase project, not fixing broken code.

---

## What's already built

- Google sign-in
- Onboarding (3 questions) → routes beginners straight to Basic, everyone else to the placement test
- 6-question placement test → routes to Basic / Intermediate / Advanced
- Practice loop: 12 real tasks across writing / data / research / policy categories, confidence rating, instant verdict
- Persistent buddy (bottom-right, every screen) with 10 fixed Socratic prompt templates, no AI API needed
- Trust score: live number + calibration chart (unlocks after 5 tasks)
- Task history, one-time real-work reflection, profile/sign-out
- Every core event logged (signup, placement, task attempts, verdicts, buddy interactions, errors)

## What's NOT built (on purpose — see 07_build_plan_and_architecture.md for why)
- Email/password or OTP login (Google OAuth only, avoids a real rate-limit bug)
- Mobile-optimized layout (desktop only, as you asked)
- The remaining 12 practice tasks (12 are fully written; add more to `src/lib/tasks.js` in the same shape whenever you have time)
- Automated tests

---

## Setup — do these in order

### 1. Create your Supabase project (free)
1. Go to supabase.com → New project. Pick any name/region, free tier.
2. Wait ~2 minutes for it to provision.

### 2. Set up the database
1. In your Supabase project, go to the **SQL Editor**.
2. Open `supabase/schema.sql` from this repo, copy the whole thing, paste it into the SQL editor, and run it.

> **Already ran the schema before today?** This version adds three new columns to `users` (`pet_choice`, `pet_size`, `path_message`) for the pet-picker, pet-size slider, and personalized-path features. Running the whole file again will fail on `create table users` since it already exists. Instead, just run this in the SQL Editor:
> ```sql
> alter table users add column if not exists pet_choice text check (pet_choice in ('sprout','fox','owl','cat')) default 'sprout';
> alter table users add column if not exists pet_size numeric check (pet_size between 0.7 and 1.6) default 1;
> alter table users add column if not exists path_message text;
> ```

3. **Important — also run `supabase/seed_tasks.sql`.** The 12+ practice tasks live in `src/lib/tasks.js` as plain JavaScript, but `task_attempts.task_id` has a foreign-key constraint pointing at the `tasks` table in the database — which starts out empty. Without this step, every task submission fails with a 409 error. Open `supabase/seed_tasks.sql`, copy the whole thing, paste into a new SQL Editor query, and run it. Safe to re-run any time (it upserts).
3. This creates every table, the auto-updating trust score trigger, and all the row-level security policies in one shot.

### 3. Set up Google sign-in
1. In Supabase: **Authentication → Providers → Google** → toggle it on.
2. You'll need a Google OAuth Client ID/Secret — Supabase's page links directly to the Google Cloud Console steps. It's a few clicks, no cost, takes about 5 minutes.
3. Paste the Client ID and Secret into Supabase, save.

### 4. Configure your local environment
1. In this repo folder, run: `cp .env.example .env`
2. In Supabase: **Project Settings → API** — copy your Project URL and anon/public key.
3. Paste them into `.env`.
4. **Never commit `.env`** — it's already in `.gitignore`, leave it that way.

### 5. Install and run locally
```bash
npm install
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`). Sign in with Google, walk through onboarding, take the placement test, do a task. If everything above was done correctly, this works end to end right now.

### 6. Deploy
1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import from Git** → pick the repo. Build command `npm run build`, publish directory `dist` (Netlify usually detects both automatically).
3. In Netlify's site settings → **Environment variables**, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` with the same values from your `.env`.
4. Deploy. You'll get a free `.netlify.app` URL.
5. **One more Supabase step:** Authentication → URL Configuration — add your new Netlify URL to the allowed redirect URLs, or Google sign-in will fail on the deployed version even though it worked locally.

---

## If something breaks

- **Blank page after Google sign-in:** almost always the Netlify redirect URL missing from Supabase's allowed list (step 6.5 above).
- **"Missing Supabase env vars" in the console:** your `.env` isn't filled in, or Netlify's environment variables aren't set.
- **Tasks never advance / dashboard looks empty:** open Supabase's Table Editor and check the `task_attempts` table is actually getting rows when you submit — if not, check the browser console for the actual error, it'll be logged there and in the `errors` table.
- **Placement test doesn't route correctly:** check `src/lib/placementQuestions.js` — the `correct` field on each question must match one of that question's `options` ids exactly.

## Adding more content later
- More practice tasks: add objects to `src/lib/tasks.js`, same shape as the existing 12.
- More placement questions: add to `src/lib/placementQuestions.js`, adjust `scorePlacement()` thresholds if you change the total count.
- More buddy prompts: add strings to the arrays in `src/lib/buddyPrompts.js`.

None of these require touching any other file — the app reads from these three files as its content source.
