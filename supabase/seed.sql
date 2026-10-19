-- PropCompare seed v1 — apply AFTER 0001_schema.sql
-- Contains NO program pricing/rules data: every numeric/rule field stays NULL
-- with verification_status='needs_verification' until an admin verifies it
-- against the firm's official terms. Never invent values here.

-- ---- brand / site settings ----
insert into public.site_settings (key, value) values
  ('brand_name', '"PropCompare"'),
  ('tagline', '"Compare Prop Firms. Choose Smarter."'),
  ('logo_url', 'null'),
  ('contact_email', '"hello@propcompare.example"'),
  ('social_x', 'null'),
  ('social_youtube', 'null'),
  ('social_discord', 'null'),
  ('verification_stale_days', '90')
on conflict (key) do nothing;

-- ---- firms (official URLs only; descriptions are generic and non-promotional) ----
insert into public.firms (slug, name, tagline, description, official_website, affiliate_status, is_published, is_archived)
values
  ('ftmo', 'FTMO',
   'Evaluation-based funding programs',
   'FTMO offers evaluation challenges for traders. Program terms, fees and rules are published on its official website and change over time; verify there before purchasing.',
   'https://ftmo.com', 'none', true, false),
  ('fundednext', 'FundedNext',
   'Evaluation-based funding programs',
   'FundedNext offers evaluation challenges for traders. Program terms, fees and rules are published on its official website and change over time; verify there before purchasing.',
   'https://fundednext.com', 'none', true, false),
  ('fundingpips', 'FundingPips',
   'Evaluation-based funding programs',
   'FundingPips offers evaluation challenges for traders. Program terms, fees and rules are published on its official website and change over time; verify there before purchasing.',
   'https://fundingpips.com', 'none', true, false)
on conflict (slug) do nothing;

-- ---- article categories ----
insert into public.article_categories (slug, name, description) values
  ('guides', 'Guides', 'Explain core prop-trading concepts in plain language.'),
  ('comparisons', 'Comparisons', 'Side-by-side analysis of firms and challenge types.'),
  ('reviews', 'Reviews', 'Independent editorial reviews of prop firms.'),
  ('news', 'News', 'Platform updates and industry notes.')
on conflict (slug) do nothing;
