import { describe, expect, it } from "vitest";
import {
  discountedFee,
  fmtBool,
  fmtDate,
  fmtMoney,
  fmtPct,
  fmtText,
  getDiscountStatus,
  verificationBadge,
  NOT_VERIFIED,
} from "@/lib/format";
import { makeDiscount } from "./fixtures";

describe("fmtMoney", () => {
  it("formats whole USD amounts with no decimals", () => {
    expect(fmtMoney(499, "USD")).toBe("$499");
    expect(fmtMoney(100000, "USD")).toBe("$100,000");
  });

  it("keeps cents for fractional amounts", () => {
    expect(fmtMoney(49.99, "USD")).toBe("$49.99");
  });

  it("formats non-USD currencies", () => {
    expect(fmtMoney(200, "EUR")).toBe("€200");
    expect(fmtMoney(300, "GBP")).toBe("£300");
  });

  it("falls back to USD when no currency given and survives bogus currency codes", () => {
    expect(fmtMoney(100)).toBe("$100");
    expect(fmtMoney(100, "XXX")).toContain("100");
  });

  it("renders 'Not verified' for null/undefined (never invents a price)", () => {
    expect(fmtMoney(null)).toBe(NOT_VERIFIED);
    expect(fmtMoney(undefined)).toBe(NOT_VERIFIED);
    expect(fmtMoney(null, "EUR")).toBe(NOT_VERIFIED);
  });
});

describe("fmtPct", () => {
  it("formats percentages", () => {
    expect(fmtPct(5)).toBe("5%");
    expect(fmtPct(6.5)).toBe("6.5%");
    expect(fmtPct(0)).toBe("0%");
  });

  it("renders 'Not verified' for null/undefined", () => {
    expect(fmtPct(null)).toBe(NOT_VERIFIED);
    expect(fmtPct(undefined)).toBe(NOT_VERIFIED);
  });
});

describe("fmtDate", () => {
  it("formats an ISO date", () => {
    expect(fmtDate("2026-10-19T00:00:00.000Z")).toBe("Oct 19, 2026");
  });

  it("renders 'Not verified' for null/empty/invalid input", () => {
    expect(fmtDate(null)).toBe(NOT_VERIFIED);
    expect(fmtDate(undefined)).toBe(NOT_VERIFIED);
    expect(fmtDate("")).toBe(NOT_VERIFIED);
    expect(fmtDate("not-a-date")).toBe(NOT_VERIFIED);
  });
});

describe("null-data helpers", () => {
  it("fmtBool renders Yes/No/Not verified", () => {
    expect(fmtBool(true)).toBe("Yes");
    expect(fmtBool(false)).toBe("No");
    expect(fmtBool(null)).toBe(NOT_VERIFIED);
    expect(fmtBool(undefined)).toBe(NOT_VERIFIED);
    expect(fmtBool(true, { t: "Allowed", f: "Banned" })).toBe("Allowed");
  });

  it("fmtText passes through real text, 'Not verified' for blank", () => {
    expect(fmtText("Some rule text")).toBe("Some rule text");
    expect(fmtText("")).toBe(NOT_VERIFIED);
    expect(fmtText("   ")).toBe(NOT_VERIFIED);
    expect(fmtText(null)).toBe(NOT_VERIFIED);
  });

  it("verificationBadge maps statuses to label + tone", () => {
    expect(verificationBadge("verified")).toEqual({ label: "Verified", tone: "green" });
    expect(verificationBadge("stale")).toEqual({ label: "Stale — recheck needed", tone: "amber" });
    expect(verificationBadge("needs_verification")).toEqual({ label: "Not verified", tone: "gray" });
    expect(verificationBadge(null)).toEqual({ label: "Not verified", tone: "gray" });
    expect(verificationBadge("weird-status")).toEqual({ label: "Not verified", tone: "gray" });
  });
});

describe("getDiscountStatus", () => {
  const now = Date.now();
  const day = 86400_000;

  it("expired when expires_at is in the past (even if marked verified)", () => {
    expect(
      getDiscountStatus(
        makeDiscount({ expires_at: new Date(now - day).toISOString(), verification_status: "verified" })
      )
    ).toBe("expired");
  });

  it("expiring_soon when verified and expiry is within 7 days", () => {
    expect(
      getDiscountStatus(
        makeDiscount({ expires_at: new Date(now + 3 * day).toISOString(), verification_status: "verified" })
      )
    ).toBe("expiring_soon");
  });

  it("verified when verified and no expiry, or expiry beyond 7 days", () => {
    expect(getDiscountStatus(makeDiscount({ expires_at: null, verification_status: "verified" }))).toBe("verified");
    expect(
      getDiscountStatus(
        makeDiscount({ expires_at: new Date(now + 30 * day).toISOString(), verification_status: "verified" })
      )
    ).toBe("verified");
  });

  it("unverified when not verified regardless of expiry", () => {
    expect(
      getDiscountStatus(
        makeDiscount({ expires_at: new Date(now + 30 * day).toISOString(), verification_status: "unverified" })
      )
    ).toBe("unverified");
    expect(getDiscountStatus(makeDiscount({ expires_at: null, verification_status: "unverified" }))).toBe(
      "unverified"
    );
  });

  it("unverified-but-expiring discount is NOT expiring_soon (stays unverified)", () => {
    expect(
      getDiscountStatus(
        makeDiscount({ expires_at: new Date(now + 3 * day).toISOString(), verification_status: "unverified" })
      )
    ).toBe("unverified");
  });
});

describe("discountedFee", () => {
  it("applies a percent discount", () => {
    expect(discountedFee(499, { discount_pct: 20, discount_fixed: null })).toBe(399.2);
  });

  it("applies a fixed discount", () => {
    expect(discountedFee(499, { discount_pct: null, discount_fixed: 100 })).toBe(399);
  });

  it("clamps at 0 instead of going negative", () => {
    expect(discountedFee(50, { discount_pct: 150, discount_fixed: null })).toBe(0);
    expect(discountedFee(50, { discount_pct: null, discount_fixed: 200 })).toBe(0);
  });

  it("prefers percent over fixed when both present", () => {
    expect(discountedFee(100, { discount_pct: 10, discount_fixed: 50 })).toBe(90);
  });

  it("returns null when fee or discount is unknown (never invents)", () => {
    expect(discountedFee(null, { discount_pct: 20, discount_fixed: null })).toBe(null);
    expect(discountedFee(undefined, { discount_pct: 20, discount_fixed: null })).toBe(null);
    expect(discountedFee(499, null)).toBe(null);
    expect(discountedFee(499, { discount_pct: null, discount_fixed: null })).toBe(null);
  });
});
