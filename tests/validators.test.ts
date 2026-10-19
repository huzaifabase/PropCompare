import { describe, expect, it } from "vitest";
import {
  articleSchema,
  contactSchema,
  discountSchema,
  firmSchema,
  newsletterSchema,
  programSchema,
  programSizeSchema,
} from "@/lib/validators";

const VALID_UUID = "00000000-0000-0000-0000-000000000001";

describe("newsletterSchema", () => {
  it("accepts a valid email with consent true", () => {
    const r = newsletterSchema.safeParse({ email: "reader@example.com", consent: true });
    expect(r.success).toBe(true);
  });

  it("rejects bad email", () => {
    expect(newsletterSchema.safeParse({ email: "not-an-email", consent: true }).success).toBe(false);
  });

  it("rejects missing consent", () => {
    expect(newsletterSchema.safeParse({ email: "reader@example.com", consent: false }).success).toBe(false);
    expect(newsletterSchema.safeParse({ email: "reader@example.com" }).success).toBe(false);
  });

  it("rejects absurdly long emails", () => {
    expect(newsletterSchema.safeParse({ email: `a@${"b".repeat(300)}.com`, consent: true }).success).toBe(
      false
    );
  });
});

describe("contactSchema", () => {
  const valid = {
    name: "Jane Doe",
    email: "jane@example.com",
    subject: "Correction",
    message: "The daily drawdown on your Acme page looks outdated.",
  };

  it("accepts a valid submission with empty honeypot", () => {
    expect(contactSchema.safeParse({ ...valid, website: "" }).success).toBe(true);
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a filled honeypot (spam bot)", () => {
    expect(contactSchema.safeParse({ ...valid, website: "spam-bot" }).success).toBe(false);
  });

  it("rejects short name / subject / message", () => {
    expect(contactSchema.safeParse({ ...valid, name: "J" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, subject: "Hi" }).success).toBe(false);
    expect(contactSchema.safeParse({ ...valid, message: "too short" }).success).toBe(false);
  });

  it("rejects bad email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "bad" }).success).toBe(false);
  });
});

describe("firmSchema", () => {
  const valid = {
    slug: "acme-funding",
    name: "Acme Funding",
    official_website: "https://example.com/acme",
    affiliate_status: "approved" as const,
  };

  it("accepts a valid firm payload with defaults for booleans", () => {
    const r = firmSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.is_published).toBe(false);
      expect(r.data.is_archived).toBe(false);
    }
  });

  it("rejects a bad slug (uppercase, spaces, too short)", () => {
    expect(firmSchema.safeParse({ ...valid, slug: "Acme Funding" }).success).toBe(false);
    expect(firmSchema.safeParse({ ...valid, slug: "A" }).success).toBe(false);
    expect(firmSchema.safeParse({ ...valid, slug: "acme_funding" }).success).toBe(false);
  });

  it("rejects a bad official_website URL and bad affiliate status", () => {
    expect(firmSchema.safeParse({ ...valid, official_website: "not-a-url" }).success).toBe(false);
    expect(
      firmSchema.safeParse({ ...valid, affiliate_status: "maybe" }).success
    ).toBe(false);
  });

  it("rejects a bad affiliate destination URL but allows empty", () => {
    // zod's .url() requires a scheme but is permissive about which scheme
    expect(firmSchema.safeParse({ ...valid, affiliate_destination_url: "not a url" }).success).toBe(false);
    expect(firmSchema.safeParse({ ...valid, affiliate_destination_url: "example.com/no-scheme" }).success).toBe(false);
    expect(firmSchema.safeParse({ ...valid, affiliate_destination_url: "" }).success).toBe(true);
    expect(firmSchema.safeParse({ ...valid, logo_url: null }).success).toBe(true);
  });
});

describe("programSchema", () => {
  const valid = {
    firm_id: VALID_UUID,
    slug: "standard",
    name: "Standard Challenge",
    category: "two_step" as const,
  };

  it("accepts a valid program", () => {
    expect(programSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects bad firm_id, slug, and category", () => {
    expect(programSchema.safeParse({ ...valid, firm_id: "not-a-uuid" }).success).toBe(false);
    expect(programSchema.safeParse({ ...valid, slug: "Bad Slug" }).success).toBe(false);
    expect(programSchema.safeParse({ ...valid, category: "five_step" }).success).toBe(false);
  });
});

describe("programSizeSchema", () => {
  it("accepts valid size, uppercases currency, coerces strings", () => {
    const r = programSizeSchema.safeParse({
      program_id: VALID_UUID,
      account_size: "100000",
      size_currency: "usd",
      fee: 499,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.account_size).toBe(100000);
      expect(r.data.size_currency).toBe("USD");
      expect(r.data.fee).toBe(499);
    }
  });

  it("allows null fee (not verified) but rejects non-positive size and negative fee", () => {
    expect(
      programSizeSchema.safeParse({ program_id: VALID_UUID, account_size: 100000, fee: null }).success
    ).toBe(true);
    expect(programSizeSchema.safeParse({ program_id: VALID_UUID, account_size: 0 }).success).toBe(false);
    expect(programSizeSchema.safeParse({ program_id: VALID_UUID, account_size: -5 }).success).toBe(false);
    expect(
      programSizeSchema.safeParse({ program_id: VALID_UUID, account_size: 100000, fee: -1 }).success
    ).toBe(false);
  });
});

describe("discountSchema", () => {
  const valid = {
    firm_id: VALID_UUID,
    code: "SAVE20",
    discount_pct: 20,
    verification_status: "unverified" as const,
  };

  it("accepts a valid discount", () => {
    expect(discountSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects discount_pct outside 0–100 and negative fixed discount", () => {
    expect(discountSchema.safeParse({ ...valid, discount_pct: 150 }).success).toBe(false);
    expect(discountSchema.safeParse({ ...valid, discount_pct: -5 }).success).toBe(false);
    expect(
      discountSchema.safeParse({ ...valid, discount_pct: null, discount_fixed: -10 }).success
    ).toBe(false);
  });

  it("rejects bad source_url but allows empty string", () => {
    expect(discountSchema.safeParse({ ...valid, source_url: "not a url" }).success).toBe(false);
    expect(discountSchema.safeParse({ ...valid, source_url: "" }).success).toBe(true);
  });

  it("rejects a bad expiry datetime and bad verification status", () => {
    expect(discountSchema.safeParse({ ...valid, expires_at: "tomorrow" }).success).toBe(false);
    expect(discountSchema.safeParse({ ...valid, verification_status: "pending" }).success).toBe(false);
  });

  it("rejects empty code", () => {
    expect(discountSchema.safeParse({ ...valid, code: "   " }).success).toBe(false);
  });
});

describe("articleSchema", () => {
  it("accepts a valid article", () => {
    const r = articleSchema.safeParse({
      slug: "what-is-a-prop-firm",
      title: "What Is a Prop Firm?",
      content_md: "A prop firm lets traders use the firm's capital after passing an evaluation.",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.status).toBe("draft");
  });

  it("rejects bad slug, short title, and missing body", () => {
    const base = { slug: "x", title: "What Is a Prop Firm?", content_md: "Sufficiently long body text here." };
    expect(articleSchema.safeParse(base).success).toBe(false);
    expect(articleSchema.safeParse({ ...base, slug: "ok-slug", title: "No" }).success).toBe(false);
    expect(articleSchema.safeParse({ ...base, slug: "ok-slug", content_md: "short" }).success).toBe(false);
  });
});
