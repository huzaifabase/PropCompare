/**
 * Shared fixtures for the lib/compare.ts tests.
 * Mirrors lib/types.ts shapes exactly; all numeric fields left NULL unless a
 * test needs them — per the repo seed rule, never invent real program data.
 */
import type { Discount, Firm, Program, ProgramRules, ProgramSize, ProgramPayout, ProgramRow } from "@/lib/types";

const BASE_FIRM: Firm = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "acme-funding",
  name: "Acme Funding",
  tagline: null,
  description: null,
  logo_url: null,
  official_website: "https://example.com/acme",
  affiliate_status: "none",
  affiliate_network: null,
  affiliate_destination_url: null,
  is_published: true,
  is_archived: false,
  last_verified_at: null,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
};

const BASE_PROGRAM: Program = {
  id: "00000000-0000-0000-0000-000000000011",
  firm_id: BASE_FIRM.id,
  slug: "standard",
  name: "Standard Challenge",
  category: "two_step",
  description: null,
  is_published: true,
  is_archived: false,
  sort_order: 0,
  last_verified_at: null,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-01T00:00:00.000Z",
};

const BASE_SIZE: ProgramSize = {
  id: "00000000-0000-0000-0000-000000000021",
  program_id: BASE_PROGRAM.id,
  account_size: 100000,
  size_currency: "USD",
  fee: 499,
  fee_currency: "USD",
  is_available: true,
};

let seq = 100;

export function makeRow(over: Partial<ProgramRow> = {}): ProgramRow {
  const n = seq++;
  const id = `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
  return {
    program: { ...BASE_PROGRAM, id, slug: `${BASE_PROGRAM.slug}-${n}`, name: `${BASE_PROGRAM.name} ${n}` },
    firm: { ...BASE_FIRM },
    size: { ...BASE_SIZE, id: `${id}s`, program_id: id },
    rules: null,
    platforms: ["mt5"],
    payout: null,
    discountedFee: null,
    activeDiscount: null,
    ...over,
  };
}

export function makeDiscount(over: Partial<Discount> = {}): Discount {
  return {
    id: "00000000-0000-0000-0000-000000000031",
    firm_id: BASE_FIRM.id,
    code: "SAVE20",
    discount_pct: 20,
    discount_fixed: null,
    currency: "USD",
    applicable_programs: null,
    applicable_program_ids: [],
    expires_at: null,
    terms: null,
    source_url: null,
    verification_status: "verified",
    verified_at: "2026-10-01T00:00:00.000Z",
    is_published: true,
    ...over,
  };
}

export function makeRules(over: Partial<ProgramRules> = {}): ProgramRules {
  return {
    id: "00000000-0000-0000-0000-000000000041",
    program_id: BASE_PROGRAM.id,
    account_size_id: null,
    phases: null,
    phase_names: null,
    profit_target_p1_pct: null,
    profit_target_p2_pct: null,
    profit_target_p3_pct: null,
    daily_drawdown_pct: null,
    max_drawdown_pct: null,
    drawdown_type: null,
    drawdown_basis: null,
    min_trading_days: null,
    max_duration_days: null,
    consistency_rule: null,
    news_trading_rule: null,
    weekend_holding_rule: null,
    ea_allowed: null,
    copy_trading_rule: null,
    prohibited_strategies: null,
    lot_risk_restriction: null,
    verification_status: "needs_verification",
    verified_at: null,
    source_url: null,
    ...over,
  };
}

export function makePayout(over: Partial<ProgramPayout> = {}): ProgramPayout {
  return {
    id: "00000000-0000-0000-0000-000000000051",
    program_id: BASE_PROGRAM.id,
    account_size_id: null,
    profit_split_pct: null,
    first_payout_eligibility: null,
    payout_frequency: null,
    min_payout: null,
    min_payout_currency: null,
    withdrawal_methods: null,
    payout_conditions: null,
    refund_policy: null,
    verification_status: "needs_verification",
    verified_at: null,
    source_url: null,
    ...over,
  };
}

export { BASE_FIRM };
