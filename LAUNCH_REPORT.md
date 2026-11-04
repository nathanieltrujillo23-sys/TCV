# Launch report

Phase 6 (launch hardening), 2026-11-04. Each item from spec section 10, its result, and what Nate still has to do by hand.

## Summary

| # | Checklist item | Result |
|---|---|---|
| 1 | RLS test: a client cannot read private tables | PASS (68 of 68 checks) |
| 2 | Owner can do everything; visitors see only public pages | PASS for admin and visitors. Owner sign in to be confirmed by Nate (step 1 below) |
| 3 | Unit tests: trade math, time window, stand aside, CSV pairing | PASS (90 tests). CSV pairing is part of Phase 3, which is on hold |
| 4 | Playwright smoke: public pages, sign in, journal create and edit | PASS (20 of 20 locally; public pages also run in CI) |
| 5 | Every page usable at 375 px | PASS after two fixes (see below) |
| 6 | Disclosures, privacy, terms written and linked in the footer | Written and linked. Still marked **Draft** until Nate's legal review |
| 7 | All strings in `en.ts`; no hard coded copy in new components | PASS for new code (0). 192 remain in the original ledger screens |
| 8 | Env vars set in Vercel | The two the site needs are set. Three more are only needed once Phase 4 adds serverless functions |

## Details

### 1. Row level security (`npm run check:rls`)

`scripts/rls-check.mjs` signs in only as test accounts on the `@tcv-accounting.local` domain and checks:

- **A regular client** (no ledger, no journal) sees 0 rows in all 12 private tables. Every insert is refused by the security policy. It cannot call the client progress report, cannot make itself owner, and cannot upload to either storage bucket.
- **A signed out visitor** sees 0 rows in all 14 tables and cannot insert or call the report.
- **A trader client and a business client** see only their own rows in every table.
- **Your data:** row counts in every private table are identical before and after the run (109 ledger transactions untouched).

Run it any time with `npm run check:rls`. It needs `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.

### 4. Browser tests (`npm run test:e2e`)

Playwright, using the Chrome already on the Mac:

- 12 public pages render with a heading and no script errors. The footer links to all three legal pages, private areas send visitors to sign in, and a public sample quiz works.
- An admin test account signs in, creates an MES trade, edits it to 2 contracts, and deletes it.
- A client test account signs in, accepts the disclaimer, passes Module 01 with 3 of 3, and the portal shows 1 of 8.
- Every public, staff, and client page is checked at 375 px for sideways scrolling.

The tests reset the two test accounts before and after, so nothing builds up. In GitHub Actions the signed in tests are skipped (no secrets there) and the public ones run.

### CI (`.github/workflows/ci.yml`)

Every push and pull request runs lint, the string check, unit tests, and a production build, then the public browser tests. It uses no secrets. Vercel still deploys `main` on its own.

### 5. Phone audit (375 px)

Fixed:
- **Owner menu:** on phones only Dashboard and Ledger were visible, and the other links and Sign out were hidden off the right edge. The menu now wraps, and Sign out sits next to the logo.
- **Ledger period switch:** "Year" wrapped onto its own line. The buttons are now a little tighter on phones.

Also, while auditing:
- **Ledger icons:** replaced the emoji (📅 📤 📎 🔁) with sharp line icons, to match the design rule.
- **Sign in page:** now has a page heading.
- **Trade form:** the Direction, Grade, and "Followed the plan?" buttons were wrapped in a label, so screen readers read "Long" as "Direction Short". They are now properly named groups.

### 6. Loading, empty, and error states

Every data screen already had all three except these, now fixed:
- **Portal home:** showed "0 of 8" and "Up next: Module 01" for a moment before progress loaded, which was wrong for returning clients. It now says "Loading…".
- **Lesson page:** said "Your progress is saved" before the save finished, and even if it failed. It now shows "Saving your result…", then confirms. On failure it shows the error and a "Save again" button.
- **Lesson page:** now shows an error if progress cannot load.
- **Ledger loading and error text:** moved into the strings file.

### 7. Strings (`npm run check:strings`)

`scripts/check-strings.mjs` reads every component and flags visible text or labels that skip `t()`. New code has 0, and CI fails if any appear. The original ledger screens still have 192 (`npm run check:strings -- --all` lists them). They are reported but not blocking, and can be moved into `en.ts` together with the Spanish pass.

### Security headers (`vercel.json`)

Added headers that:
- stop other sites from showing the app inside a frame
- tell browsers not to guess file types
- limit referrer data
- turn off camera, microphone, location, and payments
- require HTTPS

## What Nate still needs to do by hand

1. **Confirm the owner view (2 minutes).** Sign in as `trucapitalventures@gmail.com` and open each link in the left menu: Dashboard (with Client progress), Ledger, Journal, Accounts, Portfolio, and Messages. Then sign out and check that `/app` sends you to sign in.
2. **Legal review of the disclosures, privacy, and terms pages.** They are written for an education-only company with no registered adviser, and they say the SIE is not a license. Have someone qualified read them. When they are approved, tell me and I'll remove the "Draft: review before launch" labels.
3. **Vercel plan decision.** The free Hobby plan is meant for personal, non-commercial projects. TruCapitalVentures LLC is a business, so read Vercel's fair use terms and decide whether to stay on Hobby for now or move to Pro (paid) before promoting the site. Nothing in the code changes either way.
4. **Supabase free plan pauses idle projects.** A project with no activity for about a week is paused (that caused the "failed to fetch" error earlier). Signing in at least once a week keeps it awake, or you can restore it from the Supabase dashboard if it pauses.
5. **Environment variables in Vercel** (Project, Settings, Environment Variables):
   - Set now and working: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
   - Add when Phase 4 (AI review) is built: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`. Never give these the `VITE_` prefix.
6. **News dates.** Check the CPI, jobs report, and FOMC dates in `src/content/eventDays.ts` against the BLS and Fed calendars.
7. **Spanish.** Planned for after launch. The 192 ledger strings above get moved at the same time.

## Commands

```bash
npm run lint             # code style
npm run check:strings    # no hard coded UI text in new code
npm test                 # unit tests
npm run build            # production build
npm run check:rls        # database privacy check (needs the service role key)
npm run test:e2e         # browser tests
```
