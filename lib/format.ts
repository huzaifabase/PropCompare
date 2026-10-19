/** "Not verified" rendering helpers — central place so nulls are never invented. */

export const NOT_VERIFIED = "Not verified";

export function fmtMoney(amount: number | null | undefined, currency?: string | null): string {
  if (amount === null || amount === undefined) return NOT_VERIFIED;
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${cur} ${amount}`;
  }
}

export function fmtPct(value: number | null | undefined): string {
  if (value === null || value === undefined) return NOT_VERIFIED;
  return `${Number(value)}%`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return NOT_VERIFIED;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return NOT_VERIFIED;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function fmtBool(value: boolean | null | undefined, labels = { t: "Yes", f: "No" }): string {
  if (value === null || value === undefined) return NOT_VERIFIED;
  return value ? labels.t : labels.f;
}

export function fmtText(value: string | null | undefined): string {
  return value && value.trim() ? value : NOT_VERIFIED;
}

export function verificationBadge(status: string | null | undefined): { label: string; tone: "green" | "amber" | "gray" } {
  switch (status) {
    case "verified":
      return { label: "Verified", tone: "green" };
    case "stale":
      return { label: "Stale — recheck needed", tone: "amber" };
    default:
      return { label: "Not verified", tone: "gray" };
  }
}

export function discountStatusBadge(status: string): { label: string; tone: "green" | "amber" | "red" | "gray" } {
  switch (status) {
    case "verified":
      return { label: "Verified", tone: "green" };
    case "expiring_soon":
      return { label: "Expiring soon", tone: "amber" };
    case "expired":
      return { label: "Expired", tone: "red" };
    default:
      return { label: "Unverified", tone: "gray" };
  }
}

/** Compute discount status purely from dates + verification flag. Never invent. */
export function getDiscountStatus(d: {
  expires_at: string | null;
  verification_status: string;
}): "verified" | "expiring_soon" | "expired" | "unverified" {
  const now = Date.now();
  if (d.expires_at && new Date(d.expires_at).getTime() < now) return "expired";
  if (d.verification_status !== "verified") return "unverified";
  if (d.expires_at && new Date(d.expires_at).getTime() - now < 7 * 24 * 3600 * 1000) return "expiring_soon";
  return "verified";
}

/** Discounted fee = fee - discount, only from verified inputs; null otherwise. */
export function discountedFee(
  fee: number | null | undefined,
  discount: { discount_pct: number | null; discount_fixed: number | null } | null
): number | null {
  if (fee === null || fee === undefined || !discount) return null;
  if (discount.discount_pct !== null && discount.discount_pct !== undefined) {
    return Math.max(0, Math.round(fee * (1 - discount.discount_pct / 100) * 100) / 100);
  }
  if (discount.discount_fixed !== null && discount.discount_fixed !== undefined) {
    return Math.max(0, Math.round((fee - discount.discount_fixed) * 100) / 100);
  }
  return null;
}

/** Async sha256 (WebCrypto). Used for IP hashing — never store raw IPs. */
export async function hashIp(ip: string, salt: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${ip}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
