-- PropCompare schema v1 — PostgreSQL (Supabase)
-- Apply in Supabase Dashboard > SQL Editor, or: supabase db push
-- Seed data lives in supabase/seed.sql (applied AFTER this migration).

create extension if not exists "pgcrypto";

-- ============ helpers ============
create or replace function public.is_admin()
returns boolean language plpgsql security definer set search_path = public as $$
begin
  return exists (select 1 from public.admin_profiles where id = auth.uid());
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============ site_settings ============
create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============ firms ============
create table public.firms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  logo_url text,
  official_website text not null,
  affiliate_status text not null default 'none'
    check (affiliate_status in ('none','pending','approved','rejected')),
  affiliate_network text,
  affiliate_destination_url text,
  is_published boolean not null default false,
  is_archived boolean not null default false,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger firms_touch before update on public.firms
  for each row execute function public.touch_updated_at();

-- ============ programs ============
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  slug text not null,
  name text not null,
  category text not null default 'two_step'
    check (category in ('one_step','two_step','three_step','instant','other')),
  description text,
  is_published boolean not null default false,
  is_archived boolean not null default false,
  sort_order int not null default 0,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, slug)
);
create trigger programs_touch before update on public.programs
  for each row execute function public.touch_updated_at();
create index programs_firm_idx on public.programs (firm_id);

-- ============ program_account_sizes ============
create table public.program_account_sizes (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  account_size numeric(14,2) not null,
  size_currency char(3) not null default 'USD',
  fee numeric(14,2),
  fee_currency char(3),
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, account_size, size_currency)
);
create trigger sizes_touch before update on public.program_account_sizes
  for each row execute function public.touch_updated_at();

-- ============ program_rules ============
create table public.program_rules (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  account_size_id uuid references public.program_account_sizes(id) on delete set null,
  phases int,
  phase_names jsonb,
  profit_target_p1_pct numeric(6,3),
  profit_target_p2_pct numeric(6,3),
  profit_target_p3_pct numeric(6,3),
  daily_drawdown_pct numeric(6,3),
  max_drawdown_pct numeric(6,3),
  drawdown_type text check (drawdown_type in ('static','trailing')),
  drawdown_basis text,
  min_trading_days int,
  max_duration_days int,
  consistency_rule text,
  news_trading_rule text,
  weekend_holding_rule text,
  ea_allowed boolean,
  copy_trading_rule text,
  prohibited_strategies text,
  lot_risk_restriction text,
  verification_status text not null default 'needs_verification'
    check (verification_status in ('verified','needs_verification','stale')),
  verified_at timestamptz,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger rules_touch before update on public.program_rules
  for each row execute function public.touch_updated_at();

-- ============ program_platforms ============
create table public.program_platforms (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  platform text not null,
  unique (program_id, platform)
);

-- ============ program_instruments ============
create table public.program_instruments (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  instrument_class text not null
    check (instrument_class in ('forex','indices','commodities','metals','crypto','stocks','other')),
  notes text,
  unique (program_id, instrument_class)
);

-- ============ program_payouts ============
create table public.program_payouts (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  account_size_id uuid references public.program_account_sizes(id) on delete set null,
  profit_split_pct numeric(6,3),
  first_payout_eligibility text,
  payout_frequency text,
  min_payout numeric(14,2),
  min_payout_currency char(3),
  withdrawal_methods text,
  payout_conditions text,
  refund_policy text,
  verification_status text not null default 'needs_verification'
    check (verification_status in ('verified','needs_verification','stale')),
  verified_at timestamptz,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger payouts_touch before update on public.program_payouts
  for each row execute function public.touch_updated_at();

-- ============ discounts ============
create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id) on delete cascade,
  code text not null,
  discount_pct numeric(6,3),
  discount_fixed numeric(14,2),
  currency char(3),
  applicable_programs text,
  applicable_program_ids uuid[] not null default '{}',
  expires_at timestamptz,
  terms text,
  source_url text,
  verification_status text not null default 'unverified'
    check (verification_status in ('verified','unverified')),
  verified_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger discounts_touch before update on public.discounts
  for each row execute function public.touch_updated_at();
create index discounts_firm_idx on public.discounts (firm_id);

-- ============ sources ============
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid references public.firms(id) on delete cascade,
  program_id uuid references public.programs(id) on delete cascade,
  url text not null,
  label text,
  noted_at timestamptz not null default now()
);

-- ============ field_verifications ============
create table public.field_verifications (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  field_name text not null,
  verified_at timestamptz not null default now(),
  verified_by uuid,
  notes text,
  source_url text
);
create index field_verifications_lookup on public.field_verifications (table_name, record_id);

-- ============ affiliate_partners ============
create table public.affiliate_partners (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null unique references public.firms(id) on delete cascade,
  status text not null default 'none'
    check (status in ('none','pending','approved','rejected')),
  network_name text,
  destination_url text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger partners_touch before update on public.affiliate_partners
  for each row execute function public.touch_updated_at();

-- ============ affiliate_clicks ============
create table public.affiliate_clicks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.affiliate_partners(id) on delete set null,
  firm_id uuid references public.firms(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  slug text not null,
  source_page text,
  campaign text,
  referrer text,
  user_agent text,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index clicks_firm_time on public.affiliate_clicks (firm_id, created_at desc);
create index clicks_time on public.affiliate_clicks (created_at desc);

-- ============ articles ============
create table public.article_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.article_categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text,
  content_md text not null default '',
  status text not null default 'draft'
    check (status in ('draft','published')),
  author text,
  meta_title text,
  meta_description text,
  featured_image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger articles_touch before update on public.articles
  for each row execute function public.touch_updated_at();

-- ============ newsletter / contact ============
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  consent boolean not null default false,
  source text,
  created_at timestamptz not null default now()
);
create unique index newsletter_email_lower_uidx
  on public.newsletter_subscribers (lower(email));

create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  ip_hash text,
  is_spam boolean not null default false,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ admin ============
create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admin_profiles(id) on delete set null,
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index audit_time on public.audit_logs (created_at desc);

-- ============ RLS ============
alter table public.site_settings enable row level security;
alter table public.firms enable row level security;
alter table public.programs enable row level security;
alter table public.program_account_sizes enable row level security;
alter table public.program_rules enable row level security;
alter table public.program_platforms enable row level security;
alter table public.program_instruments enable row level security;
alter table public.program_payouts enable row level security;
alter table public.discounts enable row level security;
alter table public.sources enable row level security;
alter table public.field_verifications enable row level security;
alter table public.affiliate_partners enable row level security;
alter table public.affiliate_clicks enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_submissions enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.audit_logs enable row level security;

-- Public read: published, non-archived content
create policy "public read settings" on public.site_settings for select using (true);
create policy "public read firms" on public.firms for select
  using (is_published and not is_archived);
create policy "public read programs" on public.programs for select
  using (is_published and not is_archived);
create policy "public read sizes" on public.program_account_sizes for select using (true);
create policy "public read rules" on public.program_rules for select using (true);
create policy "public read platforms" on public.program_platforms for select using (true);
create policy "public read instruments" on public.program_instruments for select using (true);
create policy "public read payouts" on public.program_payouts for select using (true);
create policy "public read discounts" on public.discounts for select using (is_published = true);
create policy "public read sources" on public.sources for select using (true);
create policy "public read verifications" on public.field_verifications for select using (true);
create policy "public read categories" on public.article_categories for select using (true);
create policy "public read articles" on public.articles for select using (status = 'published');

-- Public insert: newsletter, contact, click tracking (insert-only, no select/update/delete)
create policy "anon insert newsletter" on public.newsletter_subscribers for insert with check (true);
create policy "anon insert contact" on public.contact_submissions for insert with check (true);
create policy "anon insert clicks" on public.affiliate_clicks for insert with check (true);

-- Admin: full access via is_admin()
create policy "admin all settings" on public.site_settings for all using (public.is_admin());
create policy "admin all firms" on public.firms for all using (public.is_admin());
create policy "admin all programs" on public.programs for all using (public.is_admin());
create policy "admin all sizes" on public.program_account_sizes for all using (public.is_admin());
create policy "admin all rules" on public.program_rules for all using (public.is_admin());
create policy "admin all platforms" on public.program_platforms for all using (public.is_admin());
create policy "admin all instruments" on public.program_instruments for all using (public.is_admin());
create policy "admin all payouts" on public.program_payouts for all using (public.is_admin());
create policy "admin all discounts" on public.discounts for all using (public.is_admin());
create policy "admin all sources" on public.sources for all using (public.is_admin());
create policy "admin all verifications" on public.field_verifications for all using (public.is_admin());
create policy "admin all partners" on public.affiliate_partners for all using (public.is_admin());
create policy "admin read clicks" on public.affiliate_clicks for select using (public.is_admin());
create policy "admin all categories" on public.article_categories for all using (public.is_admin());
create policy "admin all articles" on public.articles for all using (public.is_admin());
create policy "admin read newsletter" on public.newsletter_subscribers for select using (public.is_admin());
create policy "admin manage contact" on public.contact_submissions for all using (public.is_admin());
create policy "admin self profile" on public.admin_profiles for select using (auth.uid() = id);
create policy "admin read audit" on public.audit_logs for select using (public.is_admin());
create policy "admin insert audit" on public.audit_logs for insert with check (public.is_admin());
