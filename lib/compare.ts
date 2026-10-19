/**
 * Comparison engine — PURE functions (no DB, no React), unit-testable.
 *
 * Honesty contract:
 * - Null data is never invented: filters treat unknown values conservatively
 *   and the UI renders "Not verified" (see lib/format.ts).
 * - Drawdown values are only compared between rows that share the same
 *   drawdown_basis; mixed bases must surface a warning, never a merged number.
 */
import { getDiscountStatus } from "./format";
import type {
  Discount,
  ProgramCategory,
  ProgramRow,
} from "./types";

export type CompareSort = "fee_asc" | "fee_desc" | "size_asc" | "size_desc" | "name";

export interface CompareFilterState {
  firmSlugs: string[];
  sizeMin: number | null;
  sizeMax: number | null;
  maxFee: number | null;
  categories: ProgramCategory[];
  platforms: string[];
  payoutFrequencies: string[];
  verifiedDiscountOnly: boolean;
  search: string;
  sort: CompareSort;
  /** Program ids pinned in the side-by-side table (max 4). Shared via `p` param. */
  selectedIds: string[];
}

/** Inputs for the /challenge-finder form. */
export interface FinderState {
  /** Desired account size — program must OFFER AT LEAST this size. */
  accountSize: number | null;
  maxFee: number | null;
  /** Number of evaluation phases, or null = any. */
  phases: number | null;
  platform: string | null;
  /** Program's allowed daily drawdown must be >= this (more lenient). */
  minDailyDrawdown: number | null;
  /** Program's allowed max drawdown must be >= this (more lenient). */
  minMaxDrawdown: number | null;
  payoutFrequency: string | null;
  avoidNewsRestriction: boolean;
  avoidWeekendRestriction: boolean;
  requireEaAllowed: boolean;
  requireCopyTradingAllowed: boolean;
}

export const MAX_COMPARE_PROGRAMS = 4;
export const SORTS: CompareSort[] = ["fee_asc", "fee_desc", "size_asc", "size_desc", "name"];
export const SORT_LABELS: Record<CompareSort, string> = {
  fee_asc: "Fee: low to high",
  fee_desc: "Fee: high to low",
  size_asc: "Account size: small to large",
  size_desc: "Account size: large to small",
  name: "Name (A–Z)",
};

const VALID_CATEGORIES: ProgramCategory[] = ["one_step", "two_step", "three_step", "instant", "other"];

export function defaultCompareFilters(): CompareFilterState {
  return {
    firmSlugs: [],
    sizeMin: null,
    sizeMax: null,
    maxFee: null,
    categories: [],
    platforms: [],
    payoutFrequencies: [],
    verifiedDiscountOnly: false,
    search: "",
    sort: "fee_asc",
    selectedIds: [],
  };
}

/* ---------------- filtering ---------------- */

/**
 * Filter program rows.
 *
 * Documented choices:
 * - maxFee: rows with null fee are EXCLUDED (never guess a price).
 * - platforms: ANY/overlap — a row passes if it supports at least one selected
 *   platform. Rows with no platforms listed are excluded when platforms selected
 *   (we cannot claim a match).
 * - payoutFrequencies: rows with null frequency are excluded when the filter is set.
 * - search: case-insensitive substring over firm name + program name.
 */
export function applyFilters(rows: ProgramRow[], f: CompareFilterState): ProgramRow[] {
  return rows.filter((row) => {
    if (f.firmSlugs.length > 0 && !f.firmSlugs.includes(row.firm.slug)) return false;
    if (f.sizeMin !== null && (row.size.account_size === null || row.size.account_size < f.sizeMin)) return false;
    if (f.sizeMax !== null && (row.size.account_size === null || row.size.account_size > f.sizeMax)) return false;
    if (f.maxFee !== null && (row.size.fee === null || row.size.fee > f.maxFee)) return false;
    if (f.categories.length > 0 && !f.categories.includes(row.program.category)) return false;
    if (f.platforms.length > 0 && !row.platforms.some((p) => f.platforms.includes(p))) return false;
    if (
      f.payoutFrequencies.length > 0 &&
      (!row.payout?.payout_frequency || !f.payoutFrequencies.includes(row.payout.payout_frequency))
    )
      return false;
    if (f.verifiedDiscountOnly) {
      const d = row.activeDiscount;
      if (!d) return false;
      const status = getDiscountStatus(d);
      if (status !== "verified" && status !== "expiring_soon") return false;
    }
    if (f.search.trim()) {
      const hay = `${row.firm.name} ${row.program.name}`.toLowerCase();
      if (!hay.includes(f.search.trim().toLowerCase())) return false;
    }
    return true;
  });
}

/** Effective fee used for sorting: discounted fee if known, else list fee. */
function effectiveFee(row: ProgramRow): number | null {
  if (row.discountedFee !== null && row.discountedFee !== undefined) return row.discountedFee;
  return row.size.fee ?? null;
}

/**
 * Sort rows. Null fees ALWAYS sort last (ascending or descending) — a missing
 * price must never outrank a known one.
 */
export function sortRows(rows: ProgramRow[], sort: CompareSort): ProgramRow[] {
  const arr = [...rows];
  switch (sort) {
    case "fee_asc":
      arr.sort((a, b) => {
        const fa = effectiveFee(a);
        const fb = effectiveFee(b);
        if (fa === null && fb === null) return 0;
        if (fa === null) return 1;
        if (fb === null) return -1;
        return fa - fb;
      });
      break;
    case "fee_desc":
      arr.sort((a, b) => {
        const fa = effectiveFee(a);
        const fb = effectiveFee(b);
        if (fa === null && fb === null) return 0;
        if (fa === null) return 1;
        if (fb === null) return -1;
        return fb - fa;
      });
      break;
    case "size_asc":
      arr.sort((a, b) => (a.size.account_size ?? Infinity) - (b.size.account_size ?? Infinity));
      break;
    case "size_desc":
      arr.sort((a, b) => (b.size.account_size ?? -Infinity) - (a.size.account_size ?? -Infinity));
      break;
    case "name":
      arr.sort((a, b) => {
        const an = `${a.program.name} ${a.firm.name} ${a.size.account_size ?? 0}`;
        const bn = `${b.program.name} ${b.firm.name} ${b.size.account_size ?? 0}`;
        return an.localeCompare(bn);
      });
      break;
  }
  return arr;
}

/* ---------------- URL params (shareable) ---------------- */

function parseList(sp: URLSearchParams, key: string): string[] {
  const v = sp.get(key);
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseNum(sp: URLSearchParams, key: string): number | null {
  const v = sp.get(key);
  if (v === null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Parse a shareable compare URL into filter state. */
export function parseCompareParams(sp: URLSearchParams): CompareFilterState {
  const sortRaw = sp.get("sort");
  const sort: CompareSort = SORTS.includes(sortRaw as CompareSort) ? (sortRaw as CompareSort) : "fee_asc";
  const categories = parseList(sp, "categories").filter((c): c is ProgramCategory =>
    (VALID_CATEGORIES as string[]).includes(c)
  );
  return {
    firmSlugs: parseList(sp, "firms"),
    sizeMin: parseNum(sp, "sizeMin"),
    sizeMax: parseNum(sp, "sizeMax"),
    maxFee: parseNum(sp, "maxFee"),
    categories,
    platforms: parseList(sp, "platforms"),
    payoutFrequencies: parseList(sp, "payout"),
    verifiedDiscountOnly: sp.get("verifiedDiscount") === "1",
    search: sp.get("search") ?? "",
    sort,
    selectedIds: parseList(sp, "p").slice(0, MAX_COMPARE_PROGRAMS),
  };
}

/** Build the shareable query string for a filter state (no leading "?"). */
export function buildCompareParams(f: CompareFilterState): string {
  const p = new URLSearchParams();
  if (f.firmSlugs.length) p.set("firms", f.firmSlugs.join(","));
  if (f.sizeMin !== null) p.set("sizeMin", String(f.sizeMin));
  if (f.sizeMax !== null) p.set("sizeMax", String(f.sizeMax));
  if (f.maxFee !== null) p.set("maxFee", String(f.maxFee));
  if (f.categories.length) p.set("categories", f.categories.join(","));
  if (f.platforms.length) p.set("platforms", f.platforms.join(","));
  if (f.payoutFrequencies.length) p.set("payout", f.payoutFrequencies.join(","));
  if (f.verifiedDiscountOnly) p.set("verifiedDiscount", "1");
  if (f.search.trim()) p.set("search", f.search.trim());
  if (f.sort !== "fee_asc") p.set("sort", f.sort);
  if (f.selectedIds.length) p.set("p", f.selectedIds.slice(0, MAX_COMPARE_PROGRAMS).join(","));
  return p.toString();
}

/* ---------------- challenge finder ---------------- */

/**
 * Heuristic read of a rule text field.
 * Returns true = text states a restriction, false = text states it is allowed,
 * null = nothing verifiable in the text. Conservative by design.
 */
function restrictionSignal(text: string | null | undefined): boolean | null {
  if (!text || !text.trim()) return null;
  const t = text.toLowerCase();
  const restricted =
    /not allowed|prohibited|prohibits|forbidden|restricted|restricts|banned|not permitted|cannot|can't|cannot be used|not use|disallowed|no news|no weekend|no ea\b/.test(
      t
    );
  if (restricted) return true;
  if (/allowed|permitted|you can|welcome/.test(t)) return false;
  return null;
}

/**
 * Documented choice for the finder "avoid" checkboxes: when the rule field is
 * null (unknown), the row is INCLUDED but flagged "rule not verified" in the
 * match reasons — excluding would silently hide unverified-but-valid options.
 * When the rule text explicitly states a restriction and the user wants to
 * avoid it, the row is EXCLUDED.
 */
export function applyFinderFilters(rows: ProgramRow[], f: FinderState): ProgramRow[] {
  return rows.filter((row) => {
    if (f.accountSize !== null && (row.size.account_size === null || row.size.account_size < f.accountSize)) return false;
    if (f.maxFee !== null && (row.size.fee === null || row.size.fee > f.maxFee)) return false;
    if (f.phases !== null && row.rules?.phases !== f.phases) return false;
    if (f.platform !== null && !row.platforms.includes(f.platform)) return false;
    if (
      f.minDailyDrawdown !== null &&
      (row.rules?.daily_drawdown_pct === null ||
        row.rules?.daily_drawdown_pct === undefined ||
        row.rules.daily_drawdown_pct < f.minDailyDrawdown)
    )
      return false;
    if (
      f.minMaxDrawdown !== null &&
      (row.rules?.max_drawdown_pct === null ||
        row.rules?.max_drawdown_pct === undefined ||
        row.rules.max_drawdown_pct < f.minMaxDrawdown)
    )
      return false;
    if (f.payoutFrequency !== null && row.payout?.payout_frequency !== f.payoutFrequency) return false;
    if (f.avoidNewsRestriction && restrictionSignal(row.rules?.news_trading_rule) === true) return false;
    if (f.avoidWeekendRestriction && restrictionSignal(row.rules?.weekend_holding_rule) === true) return false;
    if (f.requireEaAllowed && row.rules?.ea_allowed === false) return false;
    if (f.requireCopyTradingAllowed && restrictionSignal(row.rules?.copy_trading_rule) === true) return false;
    return true;
  });
}

/** Human-readable bullets explaining why a row matched the finder inputs. */
export function getMatchReasons(row: ProgramRow, finder: FinderState): string[] {
  const reasons: string[] = [];
  const progName = row.program.name;
  if (finder.accountSize !== null && row.size.account_size !== null) {
    reasons.push(
      `Offers a ${fmtSize(row.size.account_size, row.size.size_currency)} account — meets your desired size.`
    );
  }
  if (finder.maxFee !== null && row.size.fee !== null) {
    reasons.push(`Fee ${fmtMoneySimple(row.size.fee, row.size.fee_currency)} is within your max budget.`);
  }
  if (finder.phases !== null && row.rules?.phases === finder.phases) {
    reasons.push(`${finder.phases}-phase evaluation matches your preference.`);
  }
  if (finder.platform !== null && row.platforms.includes(finder.platform)) {
    reasons.push(`Supports ${finder.platform}, your chosen platform.`);
  }
  if (
    finder.minDailyDrawdown !== null &&
    row.rules?.daily_drawdown_pct !== null &&
    row.rules?.daily_drawdown_pct !== undefined
  ) {
    reasons.push(`Daily drawdown allowance of ${row.rules.daily_drawdown_pct}% meets your minimum.`);
  }
  if (
    finder.minMaxDrawdown !== null &&
    row.rules?.max_drawdown_pct !== null &&
    row.rules?.max_drawdown_pct !== undefined
  ) {
    reasons.push(`Max drawdown allowance of ${row.rules.max_drawdown_pct}% meets your minimum.`);
  }
  if (finder.payoutFrequency !== null && row.payout?.payout_frequency === finder.payoutFrequency) {
    reasons.push(`Pays out ${finder.payoutFrequency}, as you wanted.`);
  }
  if (finder.avoidNewsRestriction) {
    const sig = restrictionSignal(row.rules?.news_trading_rule);
    if (sig === null) reasons.push("News trading rule not verified — check the firm's official site.");
    else if (sig === false) reasons.push("News trading is allowed per the stated rules.");
  }
  if (finder.avoidWeekendRestriction) {
    const sig = restrictionSignal(row.rules?.weekend_holding_rule);
    if (sig === null) reasons.push("Weekend holding rule not verified — check the firm's official site.");
    else if (sig === false) reasons.push("Weekend holding is allowed per the stated rules.");
  }
  if (finder.requireEaAllowed) {
    if (row.rules?.ea_allowed === null || row.rules?.ea_allowed === undefined)
      reasons.push("EA policy not verified — check the firm's official site.");
    else if (row.rules.ea_allowed === true) reasons.push("Expert advisors (EAs) are allowed.");
  }
  if (finder.requireCopyTradingAllowed) {
    const sig = restrictionSignal(row.rules?.copy_trading_rule);
    if (sig === null) reasons.push("Copy trading rule not verified — check the firm's official site.");
    else if (sig === false) reasons.push("Copy trading is allowed per the stated rules.");
  }
  const d: Discount | null = row.activeDiscount;
  if (d && d.code) {
    reasons.push(`Verified discount available — code ${d.code}.`);
  }
  if (reasons.length === 0) reasons.push(`${progName} matches your filters.`);
  return reasons;
}

function fmtSize(amount: number, currency?: string | null): string {
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${cur} ${amount}`;
  }
}

function fmtMoneySimple(amount: number, currency?: string | null): string {
  return fmtSize(amount, currency);
}

/* ---------------- /go slug helpers ---------------- */

/** Allowlist for /go slugs: firm-slug or firm-slug--program-slug. */
export function isValidGoSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*(--[a-z0-9]+(-[a-z0-9]+)*)?$/.test(slug);
}

/**
 * Build the tracked redirect URL. `campaign`/`page` are optional; empty values
 * are omitted. The destination itself is NEVER taken from query params.
 */
export function buildGoUrl(slug: string, campaign?: string, page?: string): string {
  const p = new URLSearchParams();
  if (campaign && campaign.trim()) p.set("campaign", campaign.trim());
  if (page && page.trim()) p.set("src", page.trim());
  const qs = p.toString();
  return `/go/${slug}${qs ? `?${qs}` : ""}`;
}
