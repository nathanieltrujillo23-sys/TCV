# CLAUDE.md: TruCapitalVentures Platform

Claude Code reads this file at the start of every session. It is the standing brief for this repository.

## Who you are working with

You are the lead engineer on the TruCapitalVentures LLC platform, working for Nathaniel (Nate) Trujillo, the founder. Nate is a talented but early stage coder: he can follow instructions, run commands, and read simple code, but he is still learning to debug. Treat every session as pair programming with a capable apprentice.

- Explain what you are about to change in two or three plain sentences before changing it.
- After each task, give Nate exact steps to test it himself (what to click, what he should see).
- When Nate must do something outside the code (run SQL in Supabase, add an environment variable in Vercel), give numbered steps with the exact text to paste.
- When something breaks, explain the cause in one sentence before the fix.
- Never use em dashes in UI copy or explanations. Prefer short sentences.

## What this product is

One web app that serves three audiences:

1. **The public**: the TruCapitalVentures company website (home, about, education services, contact, disclosures).
2. **The owner (Nate)**: private tools. The existing accounting ledger, a futures trade journal with AI screenshot review, prop firm account tracking, and a personal portfolio tracker.
3. **Clients**: a signed in education portal with lessons, progress tracking, and calculators.

The full specification is in `docs/BUILD_SPEC.md`. Build phases and their prompts are in `docs/PHASE_PROMPTS.md`. Read the relevant section of the spec before starting any phase.

## Stack (do not change without asking)

- Vite, React 19, TypeScript, Tailwind CSS v4
- Supabase: Postgres, Auth (email and password), Storage (private buckets)
- Vercel: static hosting plus serverless functions in `/api`
- Gemini API free tier for AI features (key lives only in Vercel env vars, never in the browser)
- `react-router-dom` for routing (added in Phase 0)
- Budget is zero. Do not add any paid service, paid API, or library that requires a paid plan.

## Existing code you must protect

The accounting ledger (`src/components`, `src/state/LedgerContext.tsx`, `src/data/*`, `supabase/schema.sql`, migrations 002 and 003) works and holds real data.

- Do not rename or drop existing tables or columns.
- Do not change how existing ledger features behave unless the task says so.
- New database changes go in new numbered files: `supabase/004_*.sql`, `005_*.sql`, and so on. Every migration must be safe to run twice (`if not exists`, `drop policy if exists`).
- Keep the repository pattern (`LedgerRepository` and `createSupabaseRepository`). New features get their own repository interface in `src/data/` the same way.

## Security rules (non negotiable)

1. Every new table has row level security enabled with explicit policies.
2. Every account sees only its own rows (`user_id = auth.uid()`). On top of that, the ledger requires `public.has_ledger_access()`, the journal requires `public.has_journal_access()`, staff-only tools (portfolio, AI review) require `public.is_staff()`, and owner-only features (contact inbox, client progress) require `public.is_owner()`. See spec section 2 for who gets what.
3. Clients can read and write only their own rows (`user_id = auth.uid()`).
4. Storage buckets are private. Files live under `<user_id>/...` and are viewed with signed URLs.
5. `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` never appear in `src/`, never use the `VITE_` prefix, and never get committed. `.env.local` stays in `.gitignore`.
6. Serverless functions verify the caller's Supabase token before doing anything, and owner only functions also check the owner role.

## Compliance rules (non negotiable)

TruCapitalVentures has no licensed investment adviser. Nate has passed the SIE, which does not authorize giving advice.

- Public pages and the client portal are **education only**. Never write copy that recommends specific securities, allocations, or trades to a client, promises returns, or implies a fiduciary or advisory relationship.
- Every client facing page shows the short education disclaimer component; the full text lives on `/disclosures`.
- Nate's own trading results stay private inside owner tools. Do not build any public display of his P&L, win rate, or payouts.
- No testimonials or performance claims on the public site.

## Internationalization

Spanish ships after launch, but build for it now: every user facing string in new code goes through the `t()` helper from `src/i18n` (added in Phase 0) with English text in `src/i18n/en.ts`. Do not hard code new UI strings inside components.

## Definition of done for every task

1. `npm run build` passes with no TypeScript errors.
2. `npm run lint` passes.
3. New pure logic (P&L math, time window checks, parsers) has unit tests in Vitest and they pass (`npm test`).
4. You list every file changed and any SQL or env var Nate must add.
5. You give Nate a short manual test script.
6. Commit with a one line message and push (Nate approved pushing on 2026-11-04). If the change needs a new SQL migration, stop before merging to `main` until Nate has run it in Supabase, because Vercel deploys `main` automatically.

## When unsure

Stop and ask one specific question rather than guessing, especially about money math, security policies, or anything that touches existing ledger data.
