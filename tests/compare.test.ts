import { describe, expect, it } from "vitest";
import {
  applyFilters,
  applyFinderFilters,
  buildCompareParams,
  buildGoUrl,
  defaultCompareFilters,
  getMatchReasons,
  isValidGoSlug,
  parseCompareParams,
  sortRows,
  MAX_COMPARE_PROGRAMS,
  type CompareFilterState,
} from "@/lib/compare";
import type { FinderState } from "@/lib/compare";
import { makeDiscount, makeRow, makeRules, makePayout, BASE_FIRM } from "./fixtures";

const F = defaultCompareFilters;

describe("applyFilters", () => {
  it("passes everything through with default (empty) filters", () => {
    const rows = [makeRow(), makeRow()];
    expect(applyFilters(rows, F())).toHaveLength(2);
  });

  it("filters by firm slug", () => {
    const a = makeRow({ firm: { ...BASE_FIRM, slug: "firm-a" } });
    const b = makeRow({ firm: { ...BASE_FIRM, slug: "firm-b" } });
    const out = applyFilters([a, b], { ...F(), firmSlugs: ["firm-a"] });
    expect(out).toHaveLength(1);
    expect(out[0].firm.slug).toBe("firm-a");
  });

  it("filters by account-size range, excluding unknown sizes", () => {
    const small = makeRow({ size: { ...makeRow().size, account_size: 25000 } });
    const big = makeRow({ size: { ...makeRow().size, account_size: 200000 } });
    const unknown = makeRow({ size: { ...makeRow().size, account_size: null as unknown as number } });
    const out = applyFilters([small, big, unknown], { ...F(), sizeMin: 50000, sizeMax: 200000 });
    expect(out.map((r) => r.size.account_size)).toEqual([200000]);
  });

  it("excludes null fees when maxFee is set (never guesses a price)", () => {
    const priced = makeRow({ size: { ...makeRow().size, fee: 300 } });
    const tooExpensive = makeRow({ size: { ...makeRow().size, fee: 600 } });
    const unknown = makeRow({ size: { ...makeRow().size, fee: null } });
    const out = applyFilters([priced, tooExpensive, unknown], { ...F(), maxFee: 500 });
    expect(out).toHaveLength(1);
    expect(out[0].size.fee).toBe(300);
  });

  it("keeps null-fee rows when no maxFee filter is set", () => {
    const unknown = makeRow({ size: { ...makeRow().size, fee: null } });
    expect(applyFilters([unknown], F())).toHaveLength(1);
  });

  it("filters by category", () => {
    const two = makeRow({ program: { ...makeRow().program, category: "two_step" } });
    const instant = makeRow({ program: { ...makeRow().program, category: "instant" } });
    const out = applyFilters([two, instant], { ...F(), categories: ["instant"] });
    expect(out).toHaveLength(1);
    expect(out[0].program.category).toBe("instant");
  });

  it("platform filter is ANY/overlap and excludes rows with no platforms listed", () => {
    const mt5 = makeRow({ platforms: ["mt5", "mt4"] });
    const ctrader = makeRow({ platforms: ["ctrader"] });
    const none = makeRow({ platforms: [] });
    const out = applyFilters([mt5, ctrader, none], { ...F(), platforms: ["mt5"] });
    expect(out).toHaveLength(1);
    expect(out[0].platforms).toContain("mt5");
  });

  it("payout-frequency filter excludes rows with null frequency", () => {
    const monthly = makeRow({ payout: makePayout({ payout_frequency: "monthly" }) });
    const weekly = makeRow({ payout: makePayout({ payout_frequency: "weekly" }) });
    const unknown = makeRow({ payout: null });
    const out = applyFilters([monthly, weekly, unknown], { ...F(), payoutFrequencies: ["monthly"] });
    expect(out).toHaveLength(1);
    expect(out[0].payout?.payout_frequency).toBe("monthly");
  });

  it("verifiedDiscountOnly keeps verified + expiring_soon, drops others", () => {
    const verified = makeRow({ activeDiscount: makeDiscount({ verification_status: "verified" }) });
    const soon = makeRow({
      activeDiscount: makeDiscount({
        verification_status: "verified",
        expires_at: new Date(Date.now() + 3 * 86400_000).toISOString(),
      }),
    });
    const unverified = makeRow({ activeDiscount: makeDiscount({ verification_status: "unverified" }) });
    const none = makeRow({ activeDiscount: null });
    const out = applyFilters([verified, soon, unverified, none], { ...F(), verifiedDiscountOnly: true });
    expect(out).toHaveLength(2);
  });

  it("search matches case-insensitively across firm + program names", () => {
    const a = makeRow({ firm: { ...BASE_FIRM, name: "Alpha Trading" }, program: { ...makeRow().program, name: "Swift Plan" } });
    const b = makeRow({ firm: { ...BASE_FIRM, name: "Beta Capital" }, program: { ...makeRow().program, name: "Steady Plan" } });
    expect(applyFilters([a, b], { ...F(), search: "ALPHA" })).toHaveLength(1);
    expect(applyFilters([a, b], { ...F(), search: "swift" })).toHaveLength(1);
    expect(applyFilters([a, b], { ...F(), search: "  " })).toHaveLength(2);
    expect(applyFilters([a, b], { ...F(), search: "zzz-no-match" })).toHaveLength(0);
  });

  it("combines filters with AND semantics", () => {
    const a = makeRow({ firm: { ...BASE_FIRM, slug: "firm-a" }, size: { ...makeRow().size, fee: 200 } });
    const b = makeRow({ firm: { ...BASE_FIRM, slug: "firm-b" }, size: { ...makeRow().size, fee: 200 } });
    const c = makeRow({ firm: { ...BASE_FIRM, slug: "firm-a" }, size: { ...makeRow().size, fee: 900 } });
    const out = applyFilters([a, b, c], { ...F(), firmSlugs: ["firm-a"], maxFee: 500 });
    expect(out).toHaveLength(1);
    expect(out[0].firm.slug).toBe("firm-a");
  });
});

describe("sortRows", () => {
  const rows = () => [
    makeRow({ size: { ...makeRow().size, fee: 499 }, program: { ...makeRow().program, name: "Zulu" }, firm: { ...BASE_FIRM, name: "Beta" } }),
    makeRow({ size: { ...makeRow().size, fee: null }, program: { ...makeRow().program, name: "Alpha" }, firm: { ...BASE_FIRM, name: "Alpha" } }),
    makeRow({ size: { ...makeRow().size, fee: 199 }, program: { ...makeRow().program, name: "Mike" }, firm: { ...BASE_FIRM, name: "Gamma" } }),
  ];

  it("fee_asc puts nulls last", () => {
    const out = sortRows(rows(), "fee_asc");
    expect(out.map((r) => r.size.fee)).toEqual([199, 499, null]);
  });

  it("fee_desc puts nulls last too (never outranking a known price)", () => {
    const out = sortRows(rows(), "fee_desc");
    expect(out.map((r) => r.size.fee)).toEqual([499, 199, null]);
  });

  it("uses discountedFee as the effective fee when set", () => {
    const plain = makeRow({ size: { ...makeRow().size, fee: 499 } });
    const discounted = makeRow({ size: { ...makeRow().size, fee: 499 }, discountedFee: 199 });
    const out = sortRows([plain, discounted], "fee_asc");
    expect(out[0].discountedFee).toBe(199);
    expect(out[1].discountedFee).toBe(null);
  });

  it("size_asc orders by account size with unknown sizes last", () => {
    const a = makeRow({ size: { ...makeRow().size, account_size: 200000 } });
    const b = makeRow({ size: { ...makeRow().size, account_size: 25000 } });
    const c = makeRow({ size: { ...makeRow().size, account_size: null as unknown as number } });
    const out = sortRows([a, b, c], "size_asc");
    expect(out.map((r) => r.size.account_size)).toEqual([25000, 200000, null]);
  });

  it("size_desc orders largest first", () => {
    const a = makeRow({ size: { ...makeRow().size, account_size: 200000 } });
    const b = makeRow({ size: { ...makeRow().size, account_size: 25000 } });
    const out = sortRows([a, b], "size_desc");
    expect(out.map((r) => r.size.account_size)).toEqual([200000, 25000]);
  });

  it("name sort orders alphabetically by program+firm", () => {
    const out = sortRows(rows(), "name");
    expect(out.map((r) => r.program.name)).toEqual(["Alpha", "Mike", "Zulu"]);
  });

  it("does not mutate the input array", () => {
    const input = rows();
    const before = input.map((r) => r.size.fee);
    sortRows(input, "fee_asc");
    expect(input.map((r) => r.size.fee)).toEqual(before);
  });
});

describe("compare share-URL round-trip", () => {
  const full: CompareFilterState = {
    firmSlugs: ["acme-funding", "beta-capital"],
    sizeMin: 25000,
    sizeMax: 200000,
    maxFee: 500,
    categories: ["two_step", "instant"],
    platforms: ["mt5"],
    payoutFrequencies: ["monthly", "weekly"],
    verifiedDiscountOnly: true,
    search: "swift plan",
    sort: "size_desc",
    selectedIds: ["id-1", "id-2"],
  };

  it("parseCompareParams(buildCompareParams(f)) deep-equals f", () => {
    const qs = buildCompareParams(full);
    const back = parseCompareParams(new URLSearchParams(qs));
    expect(back).toEqual(full);
  });

  it("caps selected programs at MAX_COMPARE_PROGRAMS (4)", () => {
    const many: CompareFilterState = { ...full, selectedIds: ["a", "b", "c", "d", "e", "f"] };
    const back = parseCompareParams(new URLSearchParams(buildCompareParams(many)));
    expect(back.selectedIds).toEqual(["a", "b", "c", "d"]);
    expect(MAX_COMPARE_PROGRAMS).toBe(4);
  });

  it("omits defaults from the query string and round-trips defaults cleanly", () => {
    const qs = buildCompareParams(F());
    expect(qs).toBe("");
    expect(parseCompareParams(new URLSearchParams(qs))).toEqual(F());
  });

  it("rejects invalid sort values and negative numbers", () => {
    const back = parseCompareParams(new URLSearchParams("sort=bogus&maxFee=-10&sizeMin=abc"));
    expect(back.sort).toBe("fee_asc");
    expect(back.maxFee).toBe(null);
    expect(back.sizeMin).toBe(null);
  });
});

describe("applyFinderFilters", () => {
  const finder = (over: Partial<FinderState> = {}): FinderState => ({
    accountSize: null,
    maxFee: null,
    phases: null,
    platform: null,
    minDailyDrawdown: null,
    minMaxDrawdown: null,
    payoutFrequency: null,
    avoidNewsRestriction: false,
    avoidWeekendRestriction: false,
    requireEaAllowed: false,
    requireCopyTradingAllowed: false,
    ...over,
  });

  it("requires the offered account size to be >= desired size", () => {
    const ok = makeRow({ size: { ...makeRow().size, account_size: 100000 } });
    const tooSmall = makeRow({ size: { ...makeRow().size, account_size: 25000 } });
    const unknown = makeRow({ size: { ...makeRow().size, account_size: null as unknown as number } });
    const out = applyFinderFilters([ok, tooSmall, unknown], finder({ accountSize: 50000 }));
    expect(out).toHaveLength(1);
    expect(out[0].size.account_size).toBe(100000);
  });

  it("filters by evaluation phases", () => {
    const two = makeRow({ rules: makeRules({ phases: 2 }) });
    const one = makeRow({ rules: makeRules({ phases: 1 }) });
    const out = applyFinderFilters([two, one], finder({ phases: 2 }));
    expect(out).toHaveLength(1);
    expect(out[0].rules?.phases).toBe(2);
  });

  it("excludes rows that explicitly restrict news trading when avoided", () => {
    const restricted = makeRow({ rules: makeRules({ news_trading_rule: "News trading is not allowed." }) });
    const allowed = makeRow({ rules: makeRules({ news_trading_rule: "News trading is allowed." }) });
    const unknown = makeRow({ rules: null });
    const out = applyFinderFilters([restricted, allowed, unknown], finder({ avoidNewsRestriction: true }));
    // unknown stays (flagged as unverified in reasons, not silently hidden)
    expect(out).toHaveLength(2);
    expect(out).not.toContain(restricted);
  });

  it("requireEaAllowed excludes only explicit false, keeps null", () => {
    const no = makeRow({ rules: makeRules({ ea_allowed: false }) });
    const yes = makeRow({ rules: makeRules({ ea_allowed: true }) });
    const unknown = makeRow({ rules: null });
    const out = applyFinderFilters([no, yes, unknown], finder({ requireEaAllowed: true }));
    expect(out).toHaveLength(2);
    expect(out).not.toContain(no);
  });

  it("minDailyDrawdown compares leniency, unknown drawdown excluded", () => {
    const ok = makeRow({ rules: makeRules({ daily_drawdown_pct: 5 }) });
    const tight = makeRow({ rules: makeRules({ daily_drawdown_pct: 3 }) });
    const unknown = makeRow({ rules: makeRules({ daily_drawdown_pct: null }) });
    const out = applyFinderFilters([ok, tight, unknown], finder({ minDailyDrawdown: 4 }));
    expect(out).toHaveLength(1);
    expect(out[0].rules?.daily_drawdown_pct).toBe(5);
  });
});

describe("getMatchReasons", () => {
  const finder: FinderState = {
    accountSize: 100000,
    maxFee: 500,
    phases: null,
    platform: "mt5",
    minDailyDrawdown: null,
    minMaxDrawdown: null,
    payoutFrequency: null,
    avoidNewsRestriction: true,
    avoidWeekendRestriction: false,
    requireEaAllowed: true,
    requireCopyTradingAllowed: false,
  };

  it("returns a non-empty reasons array naming why the row matched", () => {
    const row = makeRow({ rules: makeRules({ ea_allowed: true }) });
    const reasons = getMatchReasons(row, finder);
    expect(reasons.length).toBeGreaterThan(0);
    expect(reasons.some((r) => r.includes("meets your desired size"))).toBe(true);
    expect(reasons.some((r) => r.includes("within your max budget"))).toBe(true);
    expect(reasons.some((r) => r.includes("mt5"))).toBe(true);
  });

  it("does not crash on null rule fields and flags them as not verified", () => {
    const row = makeRow({ rules: null });
    expect(() => getMatchReasons(row, finder)).not.toThrow();
    const reasons = getMatchReasons(row, finder);
    expect(reasons.some((r) => r.includes("not verified"))).toBe(true);
  });

  it("never mentions a discount when there is none, and mentions the code when there is one", () => {
    const plain = getMatchReasons(makeRow(), finder);
    expect(plain.some((r) => r.toLowerCase().includes("discount"))).toBe(false);
    const withDisc = getMatchReasons(makeRow({ activeDiscount: makeDiscount({ code: "SAVE20" }) }), finder);
    expect(withDisc.some((r) => r.includes("SAVE20"))).toBe(true);
  });
});

describe("isValidGoSlug", () => {
  it("accepts a plain firm slug", () => {
    expect(isValidGoSlug("ftmo")).toBe(true);
    expect(isValidGoSlug("funded-next")).toBe(true);
    expect(isValidGoSlug("fundingpips")).toBe(true);
  });

  it("accepts firm--program slugs", () => {
    expect(isValidGoSlug("ftmo--swift")).toBe(true);
    expect(isValidGoSlug("fundednext--stellar-2-step")).toBe(true);
  });

  it("rejects uppercase, spaces, and ?url= open-redirect patterns", () => {
    expect(isValidGoSlug("FTMO")).toBe(false);
    expect(isValidGoSlug("ftmo ftmo")).toBe(false);
    expect(isValidGoSlug("ftmo?url=https://evil.com")).toBe(false);
    expect(isValidGoSlug("ftmo?x=1")).toBe(false);
  });

  it("rejects traversal / path injection shapes", () => {
    expect(isValidGoSlug("../admin")).toBe(false);
    expect(isValidGoSlug("ftmo/admin")).toBe(false);
    expect(isValidGoSlug("ftmo--../../x")).toBe(false);
    expect(isValidGoSlug("ftmo%2fadmin")).toBe(false);
  });

  it("rejects malformed slugs", () => {
    expect(isValidGoSlug("")).toBe(false);
    expect(isValidGoSlug("-ftmo")).toBe(false);
    expect(isValidGoSlug("ftmo--")).toBe(false);
    expect(isValidGoSlug("--ftmo")).toBe(false);
    expect(isValidGoSlug("ftmo--swift--extra")).toBe(false);
    expect(isValidGoSlug("ftmo_underscore")).toBe(false);
  });
});

describe("buildGoUrl", () => {
  it("builds the bare tracked path", () => {
    expect(buildGoUrl("ftmo")).toBe("/go/ftmo");
  });

  it("appends campaign and source params when provided", () => {
    expect(buildGoUrl("ftmo--swift", "summer_sale", "compare")).toBe(
      "/go/ftmo--swift?campaign=summer_sale&src=compare"
    );
  });

  it("omits empty campaign/page values", () => {
    expect(buildGoUrl("ftmo", "", "   ")).toBe("/go/ftmo");
  });

  it("never carries a destination URL (no open redirect vector)", () => {
    const url = buildGoUrl("ftmo", "c", "p");
    expect(url).not.toContain("http");
    expect(url).not.toContain("url=");
    expect(url.startsWith("/go/")).toBe(true);
  });
});
