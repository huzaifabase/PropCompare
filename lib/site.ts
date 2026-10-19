import { getSiteSettings } from "./data";

export interface Brand {
  brand_name: string;
  tagline: string;
  logo_url: string | null;
  contact_email: string | null;
  social_x: string | null;
  social_youtube: string | null;
  social_discord: string | null;
}

const DEFAULTS: Brand = {
  brand_name: "PropCompare",
  tagline: "Compare Prop Firms. Choose Smarter.",
  logo_url: null,
  contact_email: null,
  social_x: null,
  social_youtube: null,
  social_discord: null,
};

function val(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v;
  if (v && typeof v === "object" && "value" in (v as object)) return val((v as { value: unknown }).value);
  return null;
}

/** Brand + contact settings with DB-overridable defaults. */
export async function getBrand(): Promise<Brand> {
  try {
    const s = await getSiteSettings();
    return {
      brand_name: (val(s.brand_name) as string) || DEFAULTS.brand_name,
      tagline: (val(s.tagline) as string) || DEFAULTS.tagline,
      logo_url: val(s.logo_url),
      contact_email: val(s.contact_email),
      social_x: val(s.social_x),
      social_youtube: val(s.social_youtube),
      social_discord: val(s.social_discord),
    };
  } catch {
    return DEFAULTS;
  }
}

/** Days after which an unverified/old record is flagged stale in admin. */
export async function getStaleDays(): Promise<number> {
  try {
    const s = await getSiteSettings();
    const v = s.verification_stale_days;
    const n = typeof v === "number" ? v : parseInt(String((v as { value?: unknown })?.value ?? v ?? ""), 10);
    return Number.isFinite(n) && n > 0 ? n : 90;
  } catch {
    return 90;
  }
}
