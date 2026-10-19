# DEPLOYMENT.md — PropCompare deploy guide + action checklist

> Status as of writing: the site is **not deployed**, no Supabase project exists
> yet, and no affiliate approvals have been granted. Nothing here is live or
> connected — do not claim otherwise until each item below is verified.

## 1. Exact Vercel deployment steps

1. Push the repo to GitHub (or GitLab/Bitbucket). Confirm `.env.local` is NOT
   in the repo (`git status` should not list it; `.gitignore` covers it).
2. In Vercel: **Add New → Project → Import** the repo.
3. Framework preset: **Next.js** (auto-detected). Build command: `npm run build`.
   Output: default. Leave the install command as `npm install`.
4. **Environment variables** (Project → Settings → Environment Variables) —
   copy each value from `.env.example`; fill in real values from your Supabase
   project (Dashboard → Settings → API) and a long random `IP_HASH_SALT`
   (e.g. `openssl rand -hex 32`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never add a `NEXT_PUBLIC_` prefix)
   - `NEXT_PUBLIC_SITE_URL` (your production domain, e.g. `https://propcompare.com`)
   - `IP_HASH_SALT`
   - (Optional, for later) `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`
5. Deploy. First successful build = green pipeline; the app still won't show real
   firm data until the Supabase project is seeded (step 2 below).

> **Build note:** the build succeeds with **no `.env.local` at all** — verified in
> CI-clean state. `generateStaticParams` on the dynamic `[slug]` routes
> deliberately returns `[]` ("DB-driven: never access the database at build
> time"), and `lib/supabase.ts`/`middleware.ts` only read env vars at request
> time, never at build time. Real values are still required in the Vercel
> environment (and in `.env.local` for local dev) for the app to function.

## 2. Post-deploy Supabase checklist

- [ ] Supabase project created (free tier).
- [ ] In Supabase SQL editor, ran in order:
      `supabase/migrations/0001_schema.sql` → `supabase/seed.sql` →
      `supabase/seed_articles.sql`.
- [ ] Verified RLS is enabled on all tables (the migration enables it; spot-check
      via SQL editor: `select tablename, rowsecurity from pg_tables where
      schemaname='public';` — every row must show `rowsecurity = true`).
- [ ] Storage is **not needed** — the app uploads nothing to Supabase Storage.
- [ ] Created the admin user and `admin_profiles` row — see
      [ADMIN_BOOTSTRAP.md](./ADMIN_BOOTSTRAP.md).
- [ ] Homepage loads on the production domain; `/compare` filters respond;
      `/admin/login` shows the login form.

## 3. Verify the live deployment (checklist)

- [ ] Homepage loads with no console errors; brand name from site settings renders.
- [ ] `/compare` loads; selecting a firm filter changes the table; the share URL
      (`?firms=...`) round-trips when pasted into a fresh tab.
- [ ] `/go/ftmo` issues a **302 to `https://ftmo.com`** (fallback: official
      website, since no affiliate partner is approved yet).
- [ ] `/go/FTMO`, `/go/ftmo?url=https://evil.com`, `/go/../../admin` all return
      **404**, never a redirect.
- [ ] `/admin` (not logged in) redirects to `/admin/login`; a signed-in
      non-admin user is also redirected (no `admin_profiles` row).
- [ ] Legal pages (`/privacy`, `/terms`, `/affiliate-disclosure`,
      `/risk-disclaimer`, `/editorial-policy`) show the visible **draft** banner.
- [ ] "Not verified" appears wherever program numeric data is missing (expected
      until admins verify real data).

## 4. Supabase free-tier limits + what costs money later

- **Free tier (as of 2026):** 500 MB database, 1 GB file storage, 50k monthly
  active users, 2 GB bandwidth — ample for a content/comparison site at launch.
  Pausing applies after ~1 week of inactivity on the free tier; upgrade to Pro
  ($25/mo) to disable pausing.
- **What costs money later (not needed now):**
  - **Email provider** for newsletter delivery + contact notifications
    (e.g. Resend free tier → paid as volume grows). Signups are stored in the
    database until you wire one up; `RESEND_API_KEY` + `CONTACT_NOTIFY_EMAIL`
    are placeholders in `.env.example`.
  - Supabase Pro if the database or MAU limits are approached.
  - A custom domain's registrar fees / Vercel is free for hobby projects
    (Pro if you need team features or higher limits).

## 5. INCOMPLETE / NEEDS YOUR ACTION

- [ ] **Supabase project creation** — no project exists yet; everything database
      is unwired until this is done.
- [ ] **Environment variables** — real `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
      `IP_HASH_SALT` in the Vercel project (dummy placeholders only in local
      `.env.local`, which is gitignored).
- [ ] **Admin bootstrap** — create the auth user + `admin_profiles` row
      ([ADMIN_BOOTSTRAP.md](./ADMIN_BOOTSTRAP.md)).
- [ ] **Affiliate approvals** — **none granted.** All firms ship with
      `affiliate_status='none'`. Until an affiliate partner is approved in the
      admin panel, `/go/[slug]` falls back to each firm's official website.
      Do not present any link as an affiliate link until approval is recorded.
- [ ] **Resend/email** — newsletter signups and contact submissions are stored
      in the DB; no email is sent. Wire `RESEND_API_KEY` + `CONTACT_NOTIFY_EMAIL`
      to enable delivery and contact notifications.
- [ ] **Legal review of the 5 draft legal pages** — `/privacy`, `/terms`,
      `/affiliate-disclosure`, `/risk-disclaimer`, `/editorial-policy` each
      carry a visible "draft — requires legal review" banner. Have qualified
      counsel review before launch.
- [ ] **Verifying real program data** — all program numeric/rule fields are
      intentionally `NULL` (`verification_status='needs_verification'`).
      Admins must verify each value against the firm's official terms in
      `/admin/verification` before the UI will show anything other than
      "Not verified". **Never fill these in from memory or marketing copy.**
