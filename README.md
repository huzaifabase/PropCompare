# PropCompare

Independent prop trading firm comparison and affiliate marketplace. Compare
evaluation programs side-by-side, filter by account size, fee, platform and
payout rules, find challenges that fit your style, and track verified discounts
— without invented numbers. Every numeric field is `NULL` until an admin verifies
it against the firm's official terms, and the UI renders **"Not verified"** for
anything unknown.

> **Status: pre-launch.** This repository is a complete working codebase, but the
> live site is **not deployed**, no Supabase project is connected, and no affiliate
> partnerships exist yet (all firms ship with `affiliate_status='none'`). See
> [DEPLOYMENT.md](./DEPLOYMENT.md) for the full "needs your action" checklist.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS 3**
- **Supabase** (Postgres + Auth + RLS)
- **zod** + **react-hook-form** (validation/forms), **lucide-react** (icons)
- **vitest** (unit tests)
- No paid APIs anywhere.

## Features

- **Homepage** — hero, top firms, how-it-works, comparison preview, finder CTA,
  discounts, learn hub, newsletter, risk banner, footer (10 sections).
- **/compare** — filters (firm, account size, max fee, category, platform, payout
  frequency, verified-discount-only, search), 5 sort orders, side-by-side table of
  up to 4 programs, mobile stacked cards, shareable URL params.
- **/challenge-finder** — form → ranked program matches with per-result
  "why it matches" bullets; unknown rules are *flagged*, not hidden.
- **/firms/[slug]** — template-driven firm pages with programs + discounts.
- **/discounts** — verified discounts with expiry statuses
  (`verified` / `expiring_soon` / `expired` / `unverified`, computed at read time).
- **/learn** — markdown articles with categories; **/reviews**, **/about**,
  **/contact**; 5 draft legal pages (each carries a "requires legal review" banner).
- **/go/[slug]** — allowlisted tracked affiliate redirect (`firm-slug` or
  `firm-slug--program-slug`). Destination comes **only** from the DB
  (`affiliate_partners.destination_url` when approved, else the firm's official
  website) — never from query params. Clicks are logged with SHA-256-hashed IPs.
- **Admin** (`/admin`, Supabase email/password + `admin_profiles` gate via
  middleware) — dashboard stats, CRUD for firms/programs/discounts/articles/
  affiliates, verification workflow, audit log (every mutation logged), settings.
- **API** — `POST /api/newsletter` (zod, rate-limited, honeypot-free), `POST
  /api/contact` (zod, honeypot + rate limit + spam flags).
- **SEO** — sitemap, robots, per-page metadata, JSON-LD (Organization +
  Article/Breadcrumb only — no fake ratings).

## Project structure

```
~/workspace/propcompare/
  ARCHITECTURE.md            # binding contract — read this before changing anything
  app/                       # Next.js App Router pages + API routes
    page.tsx                 # homepage
    compare/  challenge-finder/  discounts/  reviews/
    learn/  learn/[slug]/  firms/[slug]/
    go/[slug]/route.ts       # tracked affiliate redirect
    api/newsletter/  api/contact/
    admin/                   # /admin (dashboard, firms, programs, discounts,
                             #  articles, affiliates, verification, audit, settings)
  components/                # ui.tsx (design system) · site.tsx (nav/footer)
                             # compare.tsx (table/cards/filter bar) · admin.tsx
  lib/                       # types.ts · supabase.ts (server clients) · supabase-client.ts (browser client)
                             # data.ts (public reads) · admin-data.ts (server CRUD)
                             # compare.ts (pure logic) · format.ts · validators.ts (zod) · site.ts · seo.ts
  supabase/
    migrations/0001_schema.sql  # full schema + RLS (authoritative)
    seed.sql                    # 3 firms (affiliate_status='none') + settings + categories
    seed_articles.sql           # 10 educational articles, no invented numbers
  tests/                     # vitest unit tests
  middleware.ts              # protects /admin/* (auth + admin_profiles check)
  README.md  DEPLOYMENT.md  ADMIN_BOOTSTRAP.md
```

Path alias `@/*` → repo root.

## Quickstart

1. **Install dependencies**
   ```bash
   cd ~/workspace/propcompare
   npm install
   ```
2. **Environment** — copy and fill in:
   ```bash
   cp .env.example .env.local
   ```
   (See [ADMIN_BOOTSTRAP.md](./ADMIN_BOOTSTRAP.md) for getting the Supabase values.)
3. **Database** — create a free Supabase project, then run these in the Supabase
   SQL editor, **in order**:
   - `supabase/migrations/0001_schema.sql` (schema + RLS)
   - `supabase/seed.sql` (firms, settings, categories)
   - `supabase/seed_articles.sql` (learn articles)
4. **Admin account** — follow [ADMIN_BOOTSTRAP.md](./ADMIN_BOOTSTRAP.md).
5. **Run**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

## Commands

| Command            | What it does                          |
|--------------------|---------------------------------------|
| `npm run dev`      | start dev server                      |
| `npm test`         | `vitest run` — unit tests (must be green) |
| `npm run lint`     | `next lint`                           |
| `npm run typecheck`| `tsc --noEmit`                        |
| `npm run build`    | production build                      |

All four quality gates must pass before any deploy: `typecheck`, `lint`, `test`,
`build`. Details and the exact deploy procedure live in
[DEPLOYMENT.md](./DEPLOYMENT.md).

## Honesty rules (non-negotiable)

- No invented numbers, rules, discounts, testimonials, or ratings. Unknown data
  renders as **"Not verified"** (`lib/format.ts`).
- No secrets in the repo — `.env.example` has placeholders only; `.env.local`
  is gitignored.
- No open redirects — `/go/[slug]` resolves destinations from the DB only.
- Service-role key is server-only; never imported into client components.
- Every admin mutation writes to `audit_logs`.
- Legal pages are drafts and say so visibly.
