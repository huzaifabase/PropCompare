import { NextRequest, NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { isValidGoSlug } from "@/lib/compare";
import { hashIp } from "@/lib/format";
import { createServerSupabaseClient, createServiceClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

/** utm params allowed to pass through to the destination (appended, never overriding). */
const CAMPAIGN_ALLOWLIST = ["utm_source", "utm_medium", "utm_campaign"] as const;

/**
 * GET /go/[slug] — tracked affiliate redirect.
 * slug = firm-slug OR firm-slug--program-slug. Resolved via DB only.
 * Redirect target comes ONLY from affiliate_partners.destination_url (approved)
 * or firms.official_website fallback. NEVER from query params (no ?url=).
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const slug = params.slug;

  // 1. Slug allowlist — anything else is a 404, never a redirect.
  if (!isValidGoSlug(slug)) notFound();

  const [firmSlug, programSlug] = slug.split("--");

  const anon = createServerSupabaseClient();

  // 2. Resolve firm (published, not archived).
  const { data: firm } = await anon
    .from("firms")
    .select("id, slug, official_website")
    .eq("slug", firmSlug)
    .eq("is_published", true)
    .eq("is_archived", false)
    .maybeSingle();
  if (!firm) notFound();

  // 3. Resolve program when a program slug is present.
  let programId: string | null = null;
  if (programSlug) {
    const { data: program } = await anon
      .from("programs")
      .select("id")
      .eq("firm_id", firm.id)
      .eq("slug", programSlug)
      .eq("is_published", true)
      .eq("is_archived", false)
      .maybeSingle();
    if (!program) notFound();
    programId = program.id;
  }

  // 4. Partner destination (service client: affiliate_partners is admin-read via RLS).
  let partner: { id: string; destination_url: string } | null = null;
  try {
    const svc = createServiceClient();
    const { data } = await svc
      .from("affiliate_partners")
      .select("id, destination_url")
      .eq("firm_id", firm.id)
      .eq("status", "approved")
      .maybeSingle();
    partner = data ?? null;
  } catch {
    partner = null;
  }

  const base = partner?.destination_url || firm.official_website;
  let target: URL;
  try {
    target = new URL(base);
  } catch {
    notFound();
  }

  // 5. Campaign passthrough — allowlist only, never overriding existing params.
  const query = req.nextUrl.searchParams;
  for (const key of CAMPAIGN_ALLOWLIST) {
    const v = query.get(key);
    if (v && !target.searchParams.has(key)) target.searchParams.set(key, v);
  }

  const destination = target.toString();

  // 6. Log the click. Failure must NEVER block the redirect.
  try {
    const campaign = query.get("campaign") ?? query.get("utm_campaign");
    const src = query.get("src");
    const referer = req.headers.get("referer");
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "";
    const salt = process.env.IP_HASH_SALT || "";
    const ip_hash = ip ? await hashIp(ip, salt) : null;

    await anon.from("affiliate_clicks").insert({
      partner_id: partner?.id ?? null,
      firm_id: firm.id,
      program_id: programId,
      slug,
      source_page: src ?? referer,
      campaign,
      referrer: referer,
      user_agent: req.headers.get("user-agent"),
      ip_hash,
    });
  } catch {
    // click logging is best-effort
  }

  return NextResponse.redirect(destination, 302);
}
