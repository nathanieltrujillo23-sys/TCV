# TruCapitalVentures Platform: Build Specification v1

Owner: Nathaniel Trujillo · Status: approved for build · Launch scope: everything below except Spanish

## 1. Starting point (audited November 3, 2026)

The repo `tcv-accounting` is a single page accounting ledger:

- Vite + React 19 + TypeScript + Tailwind v4, deployed on Vercel, data in Supabase.
- Email and password auth (`AuthContext`). Any visitor can sign up and get their own empty ledger.
- Tables: `transactions`, `presets`, `managed_list_items`, `audit_log`, plus a private `receipts` bucket. All RLS scoped to `user_id = auth.uid()`.
- Views are switched with state (`viewMode`: entry, summary, taxes). There is no router, no public site, no `/api` folder, no tests.
- Income rows already model prop firm payouts (`vendor` = firm, `accounts` = number of accounts). Expenses model evaluation fees and subscriptions.

The sister project **4 Rivers** (`four-rivers` repo) already solved several things TCV needs. Copy and adapt these rather than writing from scratch:

| Need in TCV | Reuse from 4 Rivers |
|---|---|
| Server auth check for `/api` functions | `api/_auth.ts` (`signedInUser`, `supabaseUrl`) |
| Free Gemini call pattern | `api/translate.ts` (Gemini first, `gemini-flash-latest`) |
| English/Spanish string system | `src/i18n/LanguageContext.tsx`, `en.ts`, `es.ts` |
| Education disclaimer logic | `src/lib/wealthCompliance.ts` |
| Calculators and trackers | `src/components/wealth/WealthToolkit.tsx`, `RetirementTab.tsx`, `trackers/*` |
| UI primitives | `src/components/ui/*` (Button, Card, Field, EmptyState, Skeleton) |
| Test setup | Vitest config, `e2e/` Playwright smoke tests, `.github/workflows/ci.yml` |

Strip anything faith specific or 4 Rivers branded when porting.

## 2. Roles and access

| Role | How assigned | Can see |
|---|---|---|
| Visitor | Not signed in | Public pages only |
| Client | Default for every new signup | `/portal/*` |
| Admin | Set manually in SQL (`deoxitytv@gmail.com`, plus the Claude test account) | `/app/*` (except `/app/messages`) and `/portal/*`, own data only |
| Owner | Set manually in SQL (`trucapitalventures@gmail.com`, `nathanieltrujillo23@gmail.com`) | `/app/*` and `/portal/*`, own data only, plus contact inbox and client progress |

Every account keeps its own private data. Owners do not see each other's ledger rows. `public.is_staff()` means owner or admin.

**Account types (added 2026-11-04, migration 005).** Signup asks "individual or business". Individuals choose an employment status (student, employed, self-employed, trader, retired, not currently working, other). Businesses give an optional name and answer "Does your business trade financial markets?". People can change these answers later on `/portal/account`.

| Tool | Who can use it (`src/lib/access.ts`, mirrored by SQL functions) |
|---|---|
| Portal lessons and finance tools | Everyone signed in |
| Ledger (`/app/ledger`) | Owners, admins, businesses (`has_ledger_access()`) |
| Trade journal and accounts (`/app/journal`, `/app/accounts`) | Owners, admins, individual traders, businesses that trade (`has_journal_access()`) |
| Portfolio, AI trade review | Owners and admins (`is_staff()`) |
| Contact inbox, client progress | Owners (`is_owner()`) |

Anyone with a ledger or journal lands on `/app`, and the sidebar shows only their tools. Everyone else lands on `/portal`. Each trader writes their own journal checklist rules; Nate's rules are preloaded for his accounts. AI trade review stays owners and admins only, because Gemini's free tier may use the data.

Signups stay open but always land as `client`. Existing ledger rows belong to Nate's user id and are unaffected.

## 3. Route map

**Public** (no auth): `/` home · `/about` · `/services` (education offerings, framed as education) · `/learn` (two free sample lessons) · `/learn/:lessonId` (the two samples only) · `/contact` (form) · `/disclosures` · `/privacy` · `/terms` · `/signin` · `/signup`

**Workspace** (any account with ledger or journal access, otherwise redirect to `/portal`; each page checks its own tool, and `/app/messages` requires `is_owner`):
`/app` dashboard · `/app/ledger` (existing ledger, unchanged inside) · `/app/journal` · `/app/journal/new` · `/app/journal/:tradeId` · `/app/journal/import` · `/app/journal/stats` · `/app/accounts` (prop firm accounts) · `/app/portfolio` · `/app/messages` (contact form inbox)

**Client** (signed in): `/portal` home · `/portal/lessons/:lessonId` · `/portal/tools` (calculators) · `/portal/account`

## 4. Database contract (migrations 004 to 008)

All tables: `id uuid primary key default gen_random_uuid()`, `user_id uuid references auth.users not null default auth.uid()`, `created_at timestamptz default now()`, RLS on.

### 004_roles_and_site.sql
```sql
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'client' check (role in ('owner','client')),
  full_name text,
  locale text not null default 'en' check (locale in ('en','es')),
  disclaimer_accepted_at timestamptz,
  created_at timestamptz default now()
);
-- trigger: insert a 'client' profile row on auth.users insert
-- function public.is_owner() returns boolean, security definer, stable:
--   exists(select 1 from profiles where id = auth.uid() and role = 'owner')
-- policies: user reads/updates own profile but cannot change role

create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null, email text not null, topic text, message text not null,
  status text not null default 'new' check (status in ('new','read','archived')),
  created_at timestamptz default now()
);
-- anon and authenticated may INSERT only; only owner may SELECT/UPDATE

-- role check is ('owner','admin','client'); public.is_staff() = role in ('owner','admin')
-- tighten ledger tables AND the receipts storage policy: replace existing policies so rows require
-- user_id = auth.uid() AND public.is_staff()
```
One time step for Nate, in the same SQL run: set `owner` for `trucapitalventures@gmail.com` and `nathanieltrujillo23@gmail.com`, `admin` for `deoxitytv@gmail.com` and `claude-test@tcv-accounting.local`.

### 005_account_types.sql
Adds `account_type`, `employment`, `business_trades` to `profiles`, copies them from signup metadata in the trigger (validated), adds `has_ledger_access()` and `has_journal_access()`, and switches ledger and receipts policies to `has_ledger_access()`. Already written and in the repo.

### 006_trade_journal.sql
```sql
trading_accounts (
  label text not null,                       -- "Lucid 50K Flex #1"
  firm text,                                 -- Lucid Trading, Topstep, personal
  account_type text check (account_type in ('evaluation','funded','personal')),
  platform text default 'Tradesea / Rithmic',
  starting_balance numeric(12,2),
  max_drawdown numeric(12,2),                -- entered by Nate from firm rules
  drawdown_type text check (drawdown_type in ('eod_trailing','intraday_trailing','static')),
  daily_loss_limit numeric(12,2),
  profit_target numeric(12,2),
  consistency_pct numeric(5,2),              -- e.g. 40.00 means best day <= 40% of profit
  status text default 'active' check (status in ('active','passed','failed','closed'))
)

trades (
  account_id uuid references trading_accounts,
  instrument text not null check (instrument in ('NQ','MNQ')),
  direction text not null check (direction in ('long','short')),
  entry_time timestamptz not null, exit_time timestamptz,
  entry_price numeric(10,2) not null, exit_price numeric(10,2),
  stop_price numeric(10,2), target_price numeric(10,2),
  contracts int not null check (contracts > 0),
  fees numeric(8,2) default 0,
  -- computed in app (src/lib/tradeMath.ts) and stored:
  points numeric(10,2), gross_pnl numeric(12,2), net_pnl numeric(12,2), r_multiple numeric(6,2),
  -- strategy checklist (Nate's rules):
  in_window boolean,          -- auto: entry between 09:30 and 10:30 America/New_York
  htf_bias_clear boolean,     -- 4H bias clear
  htf_fvg boolean,            -- higher timeframe fair value gap
  inversion_1m boolean,       -- 1 minute inversion
  liquidity_confluence boolean,
  stand_aside_day boolean,    -- auto from stand aside calendar
  setup_grade text check (setup_grade in ('A','B','C','F')),
  emotion text, notes text, tags text[] default '{}',
  source text default 'manual' check (source in ('manual','import')),
  external_id text,           -- import dedupe key
  unique (user_id, external_id)
)

trade_screenshots ( trade_id uuid references trades on delete cascade,
  kind text check (kind in ('htf','entry','exit','other')), path text not null )

trade_reviews ( trade_id uuid references trades on delete cascade,
  model text, result jsonb not null )         -- shape in section 6

journal_days ( day date not null, bias text, premarket_plan text,
  news_flags text[], post_session text, followed_plan boolean,
  unique (user_id, day) )                     -- DAWN briefs land in premarket_plan later
```
Private bucket `trade-screenshots`, path `<user_id>/<trade_id>/<file>`. All five tables use `user_id = auth.uid() AND public.has_journal_access()`. The strategy checklist is per trader: add a `journal_rules` table (owner of row = trader) holding each trader's rule labels and trading window, and store checklist answers per trade against those rules. Nate's rules are seeded for his accounts.

### 007_portfolio.sql
```sql
holdings ( account_label text, symbol text not null,
  asset_class text check (asset_class in ('equity','etf','bond','cash','crypto','other')),
  quantity numeric(18,6), cost_basis numeric(14,2),
  manual_price numeric(14,4), price_updated_at timestamptz, notes text )
```
Staff only, own rows. Prices are entered by hand at launch (no paid data feed).

### 008_portal.sql
```sql
lesson_progress ( lesson_id text not null, completed_at timestamptz default now(),
  quiz_score int, unique (user_id, lesson_id) )
```
Clients own their rows; owner can read all (for a simple progress view). Lesson content lives in code (`src/content/lessons/*.ts`), not the database.

## 5. Trade math contract (`src/lib/tradeMath.ts`, fully unit tested)

- Point value: NQ = $20.00, MNQ = $2.00. Tick = 0.25 points.
- `points = (exit - entry)` for long, `(entry - exit)` for short.
- `gross_pnl = points × point_value × contracts`; `net_pnl = gross_pnl − fees`.
- `r_multiple = points / |entry − stop|` when stop exists, else null.
- `in_window`: entry time converted to America/New_York, true if 09:30:00 ≤ t < 10:30:00. Must handle daylight saving.
- Stand aside calendar (`src/lib/standAside.ts`): Fridays; CPI, NFP, FOMC days (maintained as a dated list Nate edits in `src/content/eventDays.ts`); US market holidays; Thanksgiving week; December 16 to 31. Returns `{ standAside: boolean, reasons: string[] }`.
- Stats page: net P&L, win rate, average win, average loss, profit factor, expectancy per trade, average R, max drawdown from equity curve, P&L by weekday, P&L by setup grade, rule adherence rate, and a "rules followed vs broken" P&L split. That last split is the most important number on the page.
- Account health (per `trading_accounts` row): distance to max drawdown, today's P&L vs daily loss limit, best day as a share of total profit vs `consistency_pct`. Show warnings, never block entry.

## 6. AI trade review contract (`/api/trade-review`)

**Request**: `POST { tradeId }` with the user's Supabase bearer token. Function checks the token and staff role (owner or admin), reads the trade, its screenshots (as signed URLs fetched server side), and the day's `journal_days` row, then calls Gemini with the system prompt in `docs/PHASE_PROMPTS.md` (Phase 4) and the images inline.

**Response** (validated before saving to `trade_reviews.result`):
```json
{
  "rule_check": {
    "time_window":          {"verdict": "pass|fail|unclear", "evidence": "string"},
    "htf_bias":             {"verdict": "pass|fail|unclear", "evidence": "string"},
    "htf_fvg":              {"verdict": "pass|fail|unclear", "evidence": "string"},
    "inversion_1m":         {"verdict": "pass|fail|unclear", "evidence": "string"},
    "liquidity_confluence": {"verdict": "pass|fail|unclear", "evidence": "string"},
    "stand_aside_day":      {"verdict": "pass|fail|unclear", "evidence": "string"}
  },
  "setup_grade": "A|B|C|F",
  "execution": {"entry": "string", "stop": "string", "exit": "string"},
  "went_well": ["max 3 strings"],
  "to_fix": ["max 3 strings"],
  "next_session_rule": "one sentence",
  "cannot_see": ["things the screenshots did not show"],
  "confidence": "high|medium|low"
}
```
Limits: 25 reviews per day per user (count rows in `trade_reviews` for today), max 3 images per review, each resized in the browser to 1600 px wide before upload. If `GEMINI_API_KEY` is missing, return 501 and the UI says "AI review is not set up".

Privacy note for Nate: on Gemini's free tier, Google may use prompts and images to improve its products. That is acceptable for chart screenshots; never send client data through this endpoint.

## 7. Trade import (Tradesea / Rithmic)

The exact export format must come from a real file. Phase 3 starts by asking Nate for a sample CSV (fills or performance export). The importer then: parses with a header alias map like `src/utils/importParse.ts`, pairs fills into round trip trades (FIFO per instrument), builds `external_id` from account + fill ids so re-imports never duplicate, shows a preview table with skipped lines, and inserts on confirm. Imported trades get `source = 'import'` and blank checklists for Nate to complete.

## 8. Client portal content

Launch with 6 to 8 lessons ported and generalized from 4 Rivers' wealth track: budgeting and cash flow, emergency funds, debt, compound growth, risk and diversification, retirement accounts basics, setting financial objectives, how to work with a licensed adviser. Each lesson: objectives, body, key terms, 3 question quiz. Tools: compound growth, savings goal, debt payoff, retirement contribution. Every lesson and tool shows `<EducationNote />`.

The future ATLAS agent will live here as a chat panel; leave a placeholder card on `/portal` ("Coming soon: guided learning assistant") and nothing more at launch.

## 9. Hosting and domain

- No domain owned yet. Launch on the `*.vercel.app` address; a `.com` costs roughly $10 to $15 a year when budget allows, and Vercel connects it in minutes.
- Vercel's free Hobby plan is meant for personal, non commercial use. A company website for an LLC may need the Pro plan under Vercel's terms. Netlify and Cloudflare Pages have free tiers that allow commercial sites; review terms before launch and move if needed. The code works on any of them because `/api` functions are small.
- Supabase free tier pauses projects after a week of inactivity; normal use keeps it awake.
- Add `vercel.json` with an SPA rewrite so deep links like `/app/journal/abc` load.

## 10. Launch checklist

- [ ] RLS test: a client account cannot read `transactions`, `trades`, `holdings`, or `contact_messages` (script in `scripts/rls-check.mjs`).
- [ ] Owner can do everything; signed out visitor sees only public pages.
- [ ] Unit tests pass for trade math, time window, stand aside, CSV pairing.
- [ ] Playwright smoke: public pages render, sign in works, journal create and edit works.
- [ ] Every page usable at 375 px wide.
- [ ] Disclosures, privacy, terms pages written and linked in the footer.
- [ ] All strings in `en.ts`; no hard coded copy in new components.
- [ ] Env vars set in Vercel: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GEMINI_API_KEY`.
