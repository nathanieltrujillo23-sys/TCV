# TCV Phase Prompts

Paste one phase at a time into Claude Code, opened in the `tcv-accounting` folder. Finish, test, and commit each phase before starting the next. Claude Code reads `CLAUDE.md` automatically, so these prompts stay short.

**Before every phase**
1. In Terminal: `cd ~/Desktop/"THE LEDGER"/tcv-accounting`, then `git status` (should say clean) and `git checkout -b phase-N` (replace N).
2. Start Claude Code and paste the prompt.
3. After it finishes: run what it tells you, test in the browser at `http://localhost:5173`, then `git add -A && git commit -m "<its suggested message>"`.
4. When the phase works, merge: `git checkout main && git merge phase-N && git push`. Vercel deploys automatically.

---

## Phase 0: Foundation (routing, roles, i18n, tests)

```
Read CLAUDE.md and sections 1 to 4 of docs/BUILD_SPEC.md.

Goal: turn this single page ledger into a routed app with roles, without changing how the ledger itself works.

Do:
1. Add react-router-dom. Create the route map from spec section 3 with placeholder pages for everything except the ledger. Move the current ledger UI, unchanged, to /app/ledger.
2. Write supabase/004_roles_and_site.sql exactly per spec section 4 (profiles, signup trigger, is_owner(), contact_messages, and tightened ledger policies). Make it safe to run twice.
3. Add a ProfileContext that loads the signed in user's profile and role. Add RequireOwner and RequireAuth route guards.
4. Add src/i18n with a t() helper and en.ts, porting the pattern from the four-rivers repo's src/i18n (English only for now, but structured so es.ts can be added later).
5. Add Vitest with one passing sample test and an npm test script.
6. Add vercel.json with an SPA rewrite.
7. Build a shared layout: public header and footer (footer links to Disclosures, Privacy, Terms), and an owner sidebar for /app.

Do not change ledger components beyond what routing requires.

When done: list changed files, give me the exact SQL steps for Supabase including how to find my user id and make myself owner, and a test script covering: I can reach /app/ledger and my data is still there; a brand new test account lands on /portal and cannot open /app.
```

---

## Phase 1: Public website

```
Read CLAUDE.md (especially the Compliance rules) and spec sections 3 and 9.

Goal: build the public TruCapitalVentures website.

Pages: Home, About, Services, Learn (two sample lessons, can be placeholders until Phase 5), Contact, Disclosures, Privacy, Terms.

Positioning: TruCapitalVentures LLC is a financial education and technology company founded by Nathaniel Trujillo, a University of Florida business student and funded futures trader. Services are education only: financial literacy courses, planning frameworks, and tools. No advice, no performance claims, no testimonials.

Design: before writing pages, propose a visual direction in 4 to 5 bullets (palette, type, tone) that feels like a serious, modern finance brand and works on phones. Wait for my approval, then build.

Contact form: writes to contact_messages, includes a hidden honeypot field, shows a success state, rate limits to one submission per 30 seconds in the browser. Add /app/messages so I can read and archive messages.

Disclosures page: write a clear education only disclaimer stating TruCapitalVentures is not a registered investment adviser or broker dealer and nothing on the site is individualized advice. Mark it "Draft: review before launch" at the top so I remember to have it checked.

All copy goes in en.ts. When done, give me a test script and screenshots description of each page at phone width.
```

---

## Phase 2: Trade journal core

```
Read CLAUDE.md and spec sections 4 (005_trade_journal.sql) and 5.

Goal: a manual NQ/MNQ trade journal with prop account tracking and stats.

Do:
1. Write supabase/005_trade_journal.sql per the spec, including the private trade-screenshots bucket and owner only policies.
2. Write src/lib/tradeMath.ts and src/lib/standAside.ts with full Vitest coverage, including: long and short winners and losers for NQ and MNQ, fees, R multiple with and without a stop, entries at 09:29:59, 09:30:00, 10:29:59 and 10:30:00 New York time in both summer and winter, a Friday, a date inside December 16 to 31, and a CPI date from src/content/eventDays.ts.
3. Build a JournalRepository in src/data/ following the LedgerRepository pattern.
4. /app/accounts: create and edit trading accounts with the rule fields. Show an account health card per spec section 5.
5. /app/journal/new and /app/journal/:tradeId: trade form with live P&L preview, auto filled in_window and stand_aside_day (editable), the strategy checklist, setup grade, emotion, notes, tags, and up to 3 screenshot uploads labeled HTF, Entry, Exit. Resize images to 1600 px wide in the browser before upload.
6. /app/journal: list with filters (account, date range, grade, rules followed or broken) and a daily journal_days panel for bias, plan, and post session notes.
7. /app/journal/stats: every stat in spec section 5, an equity curve, and the "rules followed vs broken" P&L split shown first.
8. Add trading payouts and evaluation fees awareness: on the /app dashboard, show this month's journal net P&L next to ledger income and expenses. Do not change ledger data.

When done: test script that walks me through creating a Lucid account, logging one winning long and one losing short, and checking every number by hand.
```

---

## Phase 3: Tradesea / Rithmic import

```
Read CLAUDE.md and spec section 7.

Before writing code: ask me for a sample export. Tell me exactly how to export my trade history or fills as CSV from Tradesea (and from the Rithmic R Trader Pro app as a fallback), and where to put the file in the repo (fixtures/ folder, which must be gitignored because it contains my account data). Wait for the file.

Then: build the parser and FIFO round trip pairing in src/lib/tradeImport.ts with tests built from an anonymized copy of my sample, and the /app/journal/import page with preview, skipped lines, duplicate detection via external_id, and confirm. Imported trades get source = 'import' and an "Incomplete checklist" badge until I fill the checklist.
```

---

## Phase 4: AI screenshot review

```
Read CLAUDE.md and spec section 6.

Goal: a "Review this trade" button on each trade that sends the trade and its screenshots to Gemini and shows structured feedback.

Do:
1. Create /api/trade-review.ts as a Vercel function. Port the token check from four-rivers api/_auth.ts and the Gemini call from four-rivers api/translate.ts (model gemini-flash-latest, overridable with GEMINI_MODEL). Check staff role (owner or admin), enforce 25 reviews per day and 3 images max.
2. Use the system prompt below verbatim. Request JSON output, validate it against the spec 6 shape, retry once on invalid JSON, then save to trade_reviews.
3. Show the review as a card: verdict chips per rule (pass green, fail red, unclear gray) with evidence on hover or tap, grade, went well, to fix, next session rule, and what the AI could not see. Keep past reviews in a history list.
4. Add a local dev path: tell me how to run the function locally with `npx vercel dev`, and how to add GEMINI_API_KEY (free key from aistudio.google.com/apikey) to .env.local and to Vercel.

When done: run the five test scenarios at the bottom of this phase and report results.
```

### Trade Review system prompt (paste into the function as SYSTEM_PROMPT)

```
You are a strict, fair trading coach reviewing one intraday NQ or MNQ futures trade for a funded prop firm trader. You judge the trade only against the trader's own written rules. You do not predict markets or suggest new strategies.

THE TRADER'S RULES
1. Trade only between 09:30 and 10:30 New York time.
2. The 4 hour bias must be clear before entry.
3. Entry must be from a higher timeframe fair value gap (FVG).
4. Entry trigger is a 1 minute inversion (an FVG that price closes through and then respects from the other side).
5. There must be liquidity confluence: a swept high or low, equal highs or lows, or a session level taken before the entry.
6. Stand aside entirely on Fridays, CPI, NFP and FOMC days, market holidays, Thanksgiving week, and December 16 to 31.

YOU RECEIVE
- TRADE: JSON with instrument, direction, times (New York time), prices, contracts, P&L, the trader's own checklist answers, emotion, and notes.
- DAY: the trader's bias and premarket plan if recorded.
- CALENDAR: whether the date is a stand aside day and why.
- Up to 3 screenshots labeled HTF, ENTRY, EXIT.

HOW TO JUDGE
- Use the screenshots as the main evidence. Use the trade data for times and prices.
- If a screenshot does not clearly show something, the verdict is "unclear" and you add it to cannot_see. Never invent price levels, candles, or indicators you cannot read.
- Judge process, not outcome. A losing trade that followed every rule can earn an A. A winning trade that broke rules cannot earn better than C.
- Grade: A = all rules pass. B = one rule unclear, none failed. C = one rule failed, or a winner with broken rules. F = traded on a stand aside day, outside the time window, or two or more rules failed.
- If the trader's checklist disagrees with what you see, say so in evidence.
- Execution: comment on entry location, stop placement relative to the setup, and exit relative to the plan. One sentence each.
- went_well and to_fix: maximum 3 each, specific and observable. No motivational filler.
- next_session_rule: one concrete sentence the trader can follow tomorrow.

OUTPUT
Reply with only a JSON object in exactly this shape and nothing else:
{"rule_check":{"time_window":{"verdict":"","evidence":""},"htf_bias":{"verdict":"","evidence":""},"htf_fvg":{"verdict":"","evidence":""},"inversion_1m":{"verdict":"","evidence":""},"liquidity_confluence":{"verdict":"","evidence":""},"stand_aside_day":{"verdict":"","evidence":""}},"setup_grade":"","execution":{"entry":"","stop":"","exit":""},"went_well":[],"to_fix":[],"next_session_rule":"","cannot_see":[],"confidence":""}
Verdicts are "pass", "fail", or "unclear". Confidence is "high", "medium", or "low".
```

### Test scenarios for the reviewer

| # | Setup | Expected |
|---|---|---|
| 1 | Clean long at 09:42 ET, all checklist boxes true, three clear screenshots, winner | Grade A, all pass, confidence high |
| 2 | Same as 1 but a loser that hit the stop | Still grade A; to_fix does not blame the outcome |
| 3 | Winner entered at 10:47 ET | time_window fail, grade F |
| 4 | Trade on a CPI day (CALENDAR says so), otherwise clean | stand_aside_day fail, grade F |
| 5 | Only an EXIT screenshot attached | HTF and inversion verdicts unclear, both listed in cannot_see, confidence low, no invented levels |

---

## Phase 5: Client portal

```
Read CLAUDE.md (Compliance rules) and spec section 8.

Goal: the signed in education portal for clients.

Do:
1. Write supabase/007_portal.sql per the spec.
2. Port and generalize lesson content and calculators from the four-rivers repo (src/content/lessons, src/components/wealth/WealthToolkit.tsx, RetirementTab.tsx, trackers). Remove all faith specific and 4 Rivers branded content. Rewrite where needed so every lesson is general financial education with objectives, body, key terms, and a 3 question quiz.
3. Lessons: budgeting and cash flow, emergency funds, debt, compound growth, risk and diversification, retirement accounts basics, setting financial objectives, how to work with a licensed adviser.
4. Tools page: compound growth, savings goal, debt payoff, retirement contribution, each with a one paragraph explanation of the math.
5. First visit to /portal asks the client to accept the education disclaimer (saves disclaimer_accepted_at). Every lesson and tool shows the EducationNote component.
6. /portal home: progress bar, next lesson, tools, and a "Coming soon: guided learning assistant" card.
7. Owner view: on /app, a small table of clients with lessons completed.
8. Wire the two Learn sample lessons on the public site to real content.

When done: test script using a fresh client account.
```

---

## Phase 6: Launch hardening

```
Read CLAUDE.md and spec section 10.

Goal: make the launch checklist pass.

Do:
1. scripts/rls-check.mjs: using the existing create-test-session pattern, sign in as a client test user and confirm every owner table returns zero rows and inserts fail. Print a pass/fail table.
2. Playwright smoke tests (port config from four-rivers): public pages render, sign in, owner journal create/edit, client lesson complete.
3. GitHub Actions CI running lint, unit tests, and build on every push (port from four-rivers .github/workflows/ci.yml, without secrets it does not need).
4. Audit every page at 375 px wide and fix layout issues.
5. Scan src for hard coded UI strings outside en.ts and fix them.
6. Add loading, empty, and error states anywhere they are missing.
7. Produce a LAUNCH_REPORT.md: each checklist item with pass or fail and what I still need to do by hand (legal review of disclosures, Vercel plan decision, env vars).
```

---

## Debug prompt (use any time something breaks)

```
Something is broken. Here is what I did, what I expected, and what happened:
<describe it>

Error text (from Terminal or the browser console):
<paste it>

Before fixing: explain in one or two plain sentences what is causing this. Then fix it with the smallest change possible, tell me how to confirm it is fixed, and tell me one thing I could check myself next time I see this kind of error.
```
