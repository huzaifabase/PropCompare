# ADMIN_BOOTSTRAP.md — creating the first admin account

You need **one** admin before `/admin` is usable. Admin access requires both a
Supabase Auth user **and** a matching row in `public.admin_profiles` — the
middleware checks both. There are no hardcoded passwords anywhere; you set the
password yourself in the Supabase dashboard.

## Steps

### 1. Create the Supabase project and load the schema

1. Create a free project at https://supabase.com.
2. Open **SQL Editor** in the Supabase dashboard and run, **in order**:
   - `supabase/migrations/0001_schema.sql` (schema + RLS policies + `is_admin()`)
   - `supabase/seed.sql` (brand settings, 3 firms with `affiliate_status='none'`, article categories)
   - `supabase/seed_articles.sql` (10 learn articles)

### 2. Create the auth user

1. In the Supabase dashboard go to **Authentication → Users → Add user →
   Create new user**.
2. Enter the admin's **email** and a **strong password you choose now**.
3. Toggle **Auto Confirm User** on (otherwise the user can't sign in until they
   confirm via email, which needs SMTP configured).
4. Click **Create user**.

### 3. Grant admin rights (SQL editor)

Find the new user's UUID (Authentication → Users → click the user; copy the
**UID**), then run this in the SQL editor, replacing `<uuid>` and `<email>`:

```sql
insert into public.admin_profiles (id, email) values ('<uuid>','<email>');
```

Example shape (do not reuse these literal values — use the real UID/email):

```sql
insert into public.admin_profiles (id, email)
values ('123e4567-e89b-12d3-a456-426614174000','admin@example.com');
```

To revoke later:

```sql
delete from public.admin_profiles where email = '<email>';
```

### 4. Log in

1. Set your real Supabase values in Vercel (or `.env.local` for local dev) —
   see [DEPLOYMENT.md](./DEPLOYMENT.md).
2. Go to **`/admin/login`**, sign in with the email + password from step 2.
3. You land on the admin dashboard. Non-admin users (or no session) are bounced
   back to `/admin/login`.

## Troubleshooting

- **Redirected to login with `?error=unauthorized`:** the auth user exists but
  has no `admin_profiles` row — re-run step 3 with the correct UID.
- **"Missing environment variable":** the app can't reach Supabase; check
  `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Every admin write is recorded in `audit_logs` (viewable at `/admin/audit`).
