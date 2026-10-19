# PropCompare — Architecture Contract

> **This file is the source of truth.** Every contributor must read it before writing code.
> Stack: Next.js 14 App Router + TypeScript + Tailwind CSS 3 + Supabase (Postgres + Auth) + lucide-react + zod + react-hook-form. No paid APIs.

## 1. Repository layout

```
~/workspace/propcompare/
  ARCHITECTURE.md            # this file
  package.json / tsconfig / next.config.mjs / tailwind.config.ts / postcss.config.mjs
  .env.example               # placeholders only — NEVER real secrets
  middleware.ts              # protects /admin/* (auth + admin_profiles check)
  app/
    layout.tsx               # root layout: fonts, metadata defaults, Navbar, Footer
    globals.css              # tailwind + design tokens (CSS vars) + base styles
    page.tsx                 # homepage (10 sections per spec §5A)
    compare/page.tsx         # /compare — filters + side-by-side table
    firms/[slug]/page.tsx    # /firms/ftmo etc. — template-driven from DB
    challenge-finder/page.tsx
    discounts/page.tsx
    reviews/page.tsx
    learn/page.tsx  learn/[slug]/page.tsx
    about/page.tsx  contact/page.tsx
    privacy|terms|affiliate-disclosure|risk-disclaimer|editorial-policy/page.tsx
    go/[slug]/route.ts       # GET — allowlisted affiliate redirect + click logging
    sitemap.ts  robots.ts
    api/
      newsletter/route.ts    # POST {email, consent} — zod validated, rate-limited
      contact/route.ts       # POST — zod validated, honeypot + rate limit
      admin/...              # admin CRUD route handlers (server-side, auth-checked)
    admin/
      login/page.tsx
      page.tsx               # dashboard stats
      firms/  programs/  discounts/  articles/  affiliates/  verification/  audit/  settings/
  components/
    ui.tsx                   # Button, Card, Badge, Input, Select, Table parts, Alert, Modal,
                             # Container, SectionHeading, EmptyState, Stat, Field (label+input)
    site.tsx                 # Logo, Navbar, Footer, Breadcrumbs, NewsletterForm, RiskBanner
    compare.tsx              # CompareTable, CompareCard (mobile), FilterBar  [worker 2]
    admin.tsx                # AdminShell, DataTable, ConfirmDelete            [worker 3]
  lib/
    types.ts                 # TS types mirroring DB tables (see §3)
    supabase.ts              # createServerClient / createServiceClient (SERVER ONLY — imports next/headers)
    supabase-client.ts       # createBrowserClient — client-safe; the ONLY supabase module "use client" code may import
    data.ts                  # public read helpers (see §4) — null-safe
    admin-data.ts             # admin CRUD helpers (service-role, server only) [worker 3]
    compare.ts               # filter/sort/compare pure logic + unit tests   [worker 2]
    format.ts                # currency/percent/date formatting, "Not verified" helpers
    validators.ts            # zod schemas: newsletter, contact, firm, program, discount, article
    site.ts                  # getSiteSettings(), brand constants w/ defaults
    seo.ts                   # metadata builders, JSON-LD helpers              [worker 4]
  supabase/
    migrations/0001_schema.sql   # full schema + RLS (authoritative)
    seed.sql                     # firms (FTMO/FundedNext/FundingPips) + settings + categories
  tests/                     # vitest unit tests (*.test.ts)                   [worker 4]
  README.md  DEPLOYMENT.md  ADMIN_BOOTSTRAP.md                               [worker 4]
```

Path alias: `@/*` → repo root.

## 2. Design system

Tailwind theme extension (`tailwind.config.ts`):
- `navy`: 950 `#0A1628` (page dark bg), 900 `#0F1E33`, 800 `#16294A`
- `accent` emerald: DEFAULT `#10B981`, dark `#0B8A5F`
- `ink`: `#0F172A` text on light; `muted`: `#64748B`
- font: system stack (`font-sans` override) — no webfont download at build.
- radius: `rounded-xl` cards; shadows subtle.

Rules: dark navy hero/nav sections, white content surfaces, emerald primary CTA, blue secondary. No gradients-heavy AI look. `prefers-reduced-motion` respected (CSS). Focus-visible rings on all interactives. Contrast AA.

`components/ui.tsx` exports (props documented in file): `Button(variant: primary|secondary|ghost|danger, size)`, `Card`, `Badge(tone)`, `Input`, `Textarea`, `Select`, `Checkbox`, `Table, THead, TRow, TCell, TH`, `Alert(tone)`, `Modal`, `Container`, `SectionHeading(kicker,title,sub)`, `EmptyState`, `Stat(label,value,sub)`, `Field(label,hint,error,children)`, `Pagination`.

`components/site.tsx` exports: `Logo()`, `Navbar()`, `Footer()`, `Breadcrumbs(items)`, `NewsletterForm()`, `RiskBanner()`, `AffiliateNote()` (short disclosure near CTAs).

## 3. Database contract (authoritative: supabase/migrations/0001_schema.sql)

All monetary fields: `numeric(14,2)` + `*_currency char(3)`. Percents: `numeric(6,3)`.
**Seed rule: every program numeric/rule field is NULL with verification_status='needs_verification'. UI renders "Not verified".**

Tables & key columns:
- `site_settings(key text pk, value jsonb)` — keys: `brand_name` ("PropCompare"), `tagline` ("Compare Prop Firms. Choose Smarter."), `logo_url`, `contact_email`, `social_x`, `social_youtube`, `social_discord`, `verification_stale_days` (90), `support_whatsapp`.
- `firms(id uuid, slug unique, name, tagline, description, logo_url, official_website, affiliate_status['none'|'pending'|'approved'], affiliate_network, affiliate_destination_url, is_published, is_archived, last_verified_at, created_at, updated_at)`
- `programs(id, firm_id→firms, slug, name, category['one_step'|'two_step'|'three_step'|'instant'|'other'], description, is_published, is_archived, sort_order, last_verified_at, ...)` unique(firm_id, slug)
- `program_account_sizes(id, program_id→programs, account_size numeric, size_currency, fee numeric NULL, fee_currency, is_available)`
- `program_rules(id, program_id, account_size_id NULL, phases int NULL, phase_names jsonb NULL, profit_target_p1_pct/_p2/_p3 NULL, daily_drawdown_pct NULL, max_drawdown_pct NULL, drawdown_type['static'|'trailing'] NULL, drawdown_basis text NULL, min_trading_days int NULL, max_duration_days int NULL(null=unlimited), consistency_rule, news_trading_rule, weekend_holding_rule text NULL, ea_allowed bool NULL, copy_trading_rule, prohibited_strategies, lot_risk_restriction text NULL, verification_status['verified'|'needs_verification'|'stale'] default 'needs_verification', verified_at, source_url)`
- `program_platforms(id, program_id, platform text)` unique(program_id, platform)
- `program_instruments(id, program_id, instrument_class['forex'|'indices'|'commodities'|'metals'|'crypto'|'stocks'|'other'], notes)` unique(program_id, instrument_class)
- `program_payouts(id, program_id, account_size_id NULL, profit_split_pct NULL, first_payout_eligibility, payout_frequency, min_payout numeric NULL, min_payout_currency, withdrawal_methods, payout_conditions, refund_policy text NULL, verification_status default 'needs_verification', verified_at, source_url)`
- `discounts(id, firm_id→firms, code, discount_pct NULL, discount_fixed NULL, currency, applicable_programs text, applicable_program_ids uuid[], expires_at NULL, terms, source_url, verification_status['verified'|'unverified'] default 'unverified', verified_at, is_published)` — **status is computed at read**: `expired` if expires_at < now(); else `verified`/`unverified`; `expiring_soon` if expires within 7 days AND verified.
- `sources(id, firm_id NULL, program_id NULL, url, label, noted_at)`
- `field_verifications(id, table_name, record_id uuid, field_name, verified_at, verified_by uuid NULL, notes, source_url)`
- `affiliate_partners(id, firm_id unique→firms, status['none'|'pending'|'approved'|'rejected'], network_name, destination_url NOT NULL, ...)` — redirect target comes ONLY from here (or firms.official_website fallback). Never from query params.
- `affiliate_clicks(id, partner_id NULL, firm_id NULL, program_id NULL, slug, source_page, campaign, referrer, user_agent, ip_hash /*sha256, never raw IP*/, created_at)` + indexes on (firm_id, created_at), (created_at).
- `article_categories(id, slug unique, name, description)`
- `articles(id, category_id NULL, slug unique, title, excerpt, content_md, status['draft'|'published'] default 'draft', author, meta_title, meta_description, featured_image_url, published_at, ...)`
- `newsletter_subscribers(id, email text, consent boolean default false, source text, created_at)` unique(lower(email))
- `contact_submissions(id, name, email, subject, message, ip_hash, is_spam default false, handled default false, created_at)`
- `admin_profiles(id uuid pk → auth.users.id, email, role default 'admin', created_at)`
- `audit_logs(id, admin_id → admin_profiles NULL, action, table_name, record_id uuid NULL, details jsonb, created_at)`

RLS: enabled everywhere. Public SELECT on: site_settings; firms/programs/sizes/rules/platforms/instruments/payouts/discounts/articles/categories/sources WHERE published & not archived (discounts: is_published). INSERT for anon: newsletter_subscribers, contact_submissions, affiliate_clicks. `is_admin()` SECURITY DEFINER fn → `exists(select 1 from admin_profiles where id = auth.uid())`; admin policies (all operations) on all tables for is_admin(). Admin UI uses server client with user session (RLS enforces); service-role key only in `lib/supabase.ts createServiceClient()` used by `/go` click logging fallback and bootstrap script — never imported into client components.

Seed (`supabase/seed.sql`): 3 firms (FTMO https://ftmo.com, FundedNext https://fundednext.com, FundingPips https://fundingpips.com; generic 1-2 sentence descriptions; affiliate_status='none'; is_published=true; last_verified_at=NULL), site_settings brand keys, 4 article categories (guides, comparisons, reviews, news). NO programs, NO numeric data, NO discounts.

## 4. Data-access contracts (lib/data.ts)

```ts
getSiteSettings(): Promise<Record<string, any>>
getFirms(): Promise<Firm[]>                       // published, not archived, order name
getFirmBySlug(slug): Promise<FirmDetail|null>     // + programs[] (published) + discounts[] (active)
getProgramsWithFilters(f: ProgramFilters): Promise<ProgramRow[]>  // for /compare
getProgramComparison(ids: string[]): Promise<ProgramDetail[]>     // max 4
getActiveDiscounts(): Promise<DiscountWithFirm[]>
getArticles(status='published'): Promise<Article[]>
getArticleBySlug(slug): Promise<Article|null>
getFirmSlugs(): Promise<string[]>  // sitemap
```
Types in `lib/types.ts`: `Firm, Program, ProgramSize, ProgramRules, ProgramPayout, Discount, DiscountStatus('verified'|'expiring_soon'|'expired'|'unverified'), Article, ArticleCategory, SiteSettings`.

`lib/format.ts`: `fmtMoney(amount|null, currency) -> "Not verified"`; `fmtPct`, `fmtDate`, `verificationBadge(status)` → {label, tone}.

## 5. Routing & behavior contracts

- `/go/[slug]`: slug = firm slug OR `firm--program` — resolve via DB only; if partner approved → destination_url (+campaign passthrough allowlist: `utm_source,utm_medium,utm_campaign` appended, never overriding); else firm.official_website. Log click (server). 302 redirect. Invalid slug → 404. **No `?url=` param ever.**
- `/compare`: URLSearchParams state (`?firms=ftmo,fundednext&size=100000&platform=mt5...`), shareable. Max 4 programs in table; mobile = stacked cards.
- `/challenge-finder`: form → filters programs → results with per-result "why it matches" bullets.
- Admin at `/admin`, login at `/admin/login` (Supabase email/password). middleware.ts: allow `/admin/login`; else require session + admin_profiles row → else redirect login.
- API: `POST /api/newsletter` {email, consent:true} zod; 429 rate limit (in-memory, 5/min/IP); stores to DB. `POST /api/contact` {name,email,subject,message, website? honeypot} zod; basic spam flags.
- SEO: `app/sitemap.ts` (firms, articles, static), `app/robots.ts`, per-page `generateMetadata`, JSON-LD (Organization + Article/Breadcrumb only — NO fake ratings), Breadcrumbs component.

## 6. Quality gates (worker 4 runs, all must pass)

`npm run typecheck` (tsc --noEmit) · `npm run lint` · `npm run build` · `npm test` (vitest).
Tests required: compare filtering/sorting, fee math incl. discounts, currency formatting, discount expiry statuses, /go allowlist validation (pure fn), authz helpers, admin CRUD validators (zod), null-data rendering helpers, SEO metadata builder.

## 7. Non-negotiables

- No invented numbers/rules/discounts/testimonials/ratings. "Not verified" UI everywhere data is null.
- No secrets in repo. `.env.example` only placeholders.
- No open redirects. No service-role key in client bundles.
- Every admin mutation writes `audit_logs`.
- Legal pages carry a visible "draft — requires legal review" banner (Alert component).
