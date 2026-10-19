// Database-mirroring TypeScript types. Monetary values are numbers|null; the UI
// must render "Not verified" for null (see lib/format.ts).

export type VerificationStatus = "verified" | "needs_verification" | "stale";
export type DiscountVerification = "verified" | "unverified";
export type DiscountStatus = "verified" | "expiring_soon" | "expired" | "unverified";
export type AffiliateStatus = "none" | "pending" | "approved" | "rejected";
export type ProgramCategory = "one_step" | "two_step" | "three_step" | "instant" | "other";
export type ArticleStatus = "draft" | "published";

export interface Firm {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  official_website: string;
  affiliate_status: AffiliateStatus;
  affiliate_network: string | null;
  affiliate_destination_url: string | null;
  is_published: boolean;
  is_archived: boolean;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  firm_id: string;
  slug: string;
  name: string;
  category: ProgramCategory;
  description: string | null;
  is_published: boolean;
  is_archived: boolean;
  sort_order: number;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgramSize {
  id: string;
  program_id: string;
  account_size: number;
  size_currency: string;
  fee: number | null;
  fee_currency: string | null;
  is_available: boolean;
}

export interface ProgramRules {
  id: string;
  program_id: string;
  account_size_id: string | null;
  phases: number | null;
  phase_names: string[] | null;
  profit_target_p1_pct: number | null;
  profit_target_p2_pct: number | null;
  profit_target_p3_pct: number | null;
  daily_drawdown_pct: number | null;
  max_drawdown_pct: number | null;
  drawdown_type: "static" | "trailing" | null;
  drawdown_basis: string | null;
  min_trading_days: number | null;
  max_duration_days: number | null; // null = unlimited
  consistency_rule: string | null;
  news_trading_rule: string | null;
  weekend_holding_rule: string | null;
  ea_allowed: boolean | null;
  copy_trading_rule: string | null;
  prohibited_strategies: string | null;
  lot_risk_restriction: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  source_url: string | null;
}

export interface ProgramPayout {
  id: string;
  program_id: string;
  account_size_id: string | null;
  profit_split_pct: number | null;
  first_payout_eligibility: string | null;
  payout_frequency: string | null;
  min_payout: number | null;
  min_payout_currency: string | null;
  withdrawal_methods: string | null;
  payout_conditions: string | null;
  refund_policy: string | null;
  verification_status: VerificationStatus;
  verified_at: string | null;
  source_url: string | null;
}

export interface Discount {
  id: string;
  firm_id: string;
  code: string;
  discount_pct: number | null;
  discount_fixed: number | null;
  currency: string | null;
  applicable_programs: string | null;
  applicable_program_ids: string[];
  expires_at: string | null;
  terms: string | null;
  source_url: string | null;
  verification_status: DiscountVerification;
  verified_at: string | null;
  is_published: boolean;
  // joined
  firm?: Pick<Firm, "name" | "slug">;
}

export interface ArticleCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface Article {
  id: string;
  category_id: string | null;
  slug: string;
  title: string;
  excerpt: string | null;
  content_md: string;
  status: ArticleStatus;
  author: string | null;
  meta_title: string | null;
  meta_description: string | null;
  featured_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category?: ArticleCategory | null;
}

/** Program with everything needed for the comparison table. */
export interface ProgramDetail extends Program {
  firm: Firm;
  sizes: ProgramSize[];
  rules: ProgramRules | null;
  platforms: string[];
  instruments: { instrument_class: string; notes: string | null }[];
  payout: ProgramPayout | null;
}

export interface FirmDetail extends Firm {
  programs: Program[];
  discounts: (Discount & { status: DiscountStatus })[];
}

export interface ProgramFilters {
  firmSlugs?: string[];
  minSize?: number;
  maxSize?: number;
  maxFee?: number;
  currency?: string;
  categories?: ProgramCategory[];
  platforms?: string[];
  payoutFrequencies?: string[];
  hasVerifiedDiscount?: boolean;
  search?: string;
  sort?: "fee_asc" | "fee_desc" | "size_asc" | "size_desc" | "name";
}

/** Flattened row used by /compare and /challenge-finder. */
export interface ProgramRow {
  program: Program;
  firm: Firm;
  size: ProgramSize;
  rules: ProgramRules | null;
  platforms: string[];
  payout: ProgramPayout | null;
  discountedFee: number | null;
  activeDiscount: Discount | null;
}
