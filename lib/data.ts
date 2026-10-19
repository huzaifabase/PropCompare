import { createServerSupabaseClient } from "./supabase";
import { getDiscountStatus } from "./format";
import type {
  Article,
  Discount,
  DiscountStatus,
  Firm,
  FirmDetail,
  Program,
  ProgramDetail,
  ProgramRow,
} from "./types";

/** Public, published-only read helpers. All return null-safe typed data. */

export async function getSiteSettings(): Promise<Record<string, unknown>> {
  const sb = createServerSupabaseClient();
  const { data } = await sb.from("site_settings").select("key, value");
  const out: Record<string, unknown> = {};
  for (const row of data ?? []) out[row.key] = row.value;
  return out;
}

export async function getFirms(): Promise<Firm[]> {
  const sb = createServerSupabaseClient();
  const { data, error } = await sb
    .from("firms")
    .select("*")
    .eq("is_published", true)
    .eq("is_archived", false)
    .order("name");
  if (error) throw error;
  return data as Firm[];
}

export async function getFirmBySlug(slug: string): Promise<FirmDetail | null> {
  const sb = createServerSupabaseClient();
  const { data: firm, error } = await sb
    .from("firms")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .eq("is_archived", false)
    .single();
  if (error || !firm) return null;

  const [{ data: programs }, { data: discounts }] = await Promise.all([
    sb
      .from("programs")
      .select("*")
      .eq("firm_id", firm.id)
      .eq("is_published", true)
      .eq("is_archived", false)
      .order("sort_order"),
    sb
      .from("discounts")
      .select("*")
      .eq("firm_id", firm.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);

  const now = Date.now();
  const live = (discounts ?? []).filter(
    (d) => !d.expires_at || new Date(d.expires_at).getTime() >= now
  );

  return {
    ...(firm as Firm),
    programs: (programs ?? []) as Program[],
    discounts: live.map((d) => ({
      ...(d as Discount),
      status: getDiscountStatus(d) as DiscountStatus,
    })),
  };
}

export async function getProgramDetail(programId: string): Promise<ProgramDetail | null> {
  const sb = createServerSupabaseClient();
  const { data: program, error } = await sb
    .from("programs")
    .select("*, firm:firms(*)")
    .eq("id", programId)
    .eq("is_published", true)
    .eq("is_archived", false)
    .single();
  if (error || !program) return null;

  const [{ data: sizes }, { data: rules }, { data: platforms }, { data: instruments }, { data: payout }] =
    await Promise.all([
      sb.from("program_account_sizes").select("*").eq("program_id", programId).order("account_size"),
      sb.from("program_rules").select("*").eq("program_id", programId).limit(1).maybeSingle(),
      sb.from("program_platforms").select("platform").eq("program_id", programId),
      sb.from("program_instruments").select("instrument_class, notes").eq("program_id", programId),
      sb.from("program_payouts").select("*").eq("program_id", programId).limit(1).maybeSingle(),
    ]);

  return {
    ...(program as unknown as ProgramDetail),
    sizes: sizes ?? [],
    rules: rules ?? null,
    platforms: (platforms ?? []).map((p: { platform: string }) => p.platform),
    instruments: instruments ?? [],
    payout: payout ?? null,
  };
}

/** All published program rows (one per account size) for compare / finder. */
export async function getAllProgramRows(): Promise<ProgramRow[]> {
  const sb = createServerSupabaseClient();
  const { data: programs, error } = await sb
    .from("programs")
    .select("*, firm:firms(*)")
    .eq("is_published", true)
    .eq("is_archived", false);
  if (error) throw error;

  const rows: ProgramRow[] = [];
  for (const p of programs ?? []) {
    const firm = (p as { firm: Firm }).firm;
    if (!firm || !firm.is_published || firm.is_archived) continue;
    const [{ data: sizes }, { data: rules }, { data: platforms }, { data: payout }, { data: discounts }] =
      await Promise.all([
        sb.from("program_account_sizes").select("*").eq("program_id", p.id).eq("is_available", true).order("account_size"),
        sb.from("program_rules").select("*").eq("program_id", p.id).limit(1).maybeSingle(),
        sb.from("program_platforms").select("platform").eq("program_id", p.id),
        sb.from("program_payouts").select("*").eq("program_id", p.id).limit(1).maybeSingle(),
        sb.from("discounts").select("*").eq("firm_id", firm.id).eq("is_published", true),
      ]);
    const activeDiscount =
      (discounts ?? []).find((d) => getDiscountStatus(d) === "verified" || getDiscountStatus(d) === "expiring_soon") ??
      null;
    for (const s of sizes ?? []) {
      rows.push({
        program: p as Program,
        firm,
        size: s,
        rules: rules ?? null,
        platforms: (platforms ?? []).map((x: { platform: string }) => x.platform),
        payout: payout ?? null,
        discountedFee: null,
        activeDiscount,
      });
    }
  }
  return rows;
}

export async function getActiveDiscounts(): Promise<(Discount & { status: DiscountStatus; firm: { name: string; slug: string } })[]> {
  const sb = createServerSupabaseClient();
  const { data, error } = await sb
    .from("discounts")
    .select("*, firm:firms(name, slug)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const now = Date.now();
  return (data ?? [])
    .filter((d) => !d.expires_at || new Date(d.expires_at).getTime() >= now)
    .map((d) => ({ ...d, status: getDiscountStatus(d) as DiscountStatus }));
}

export async function getArticles(publishedOnly = true): Promise<Article[]> {
  const sb = createServerSupabaseClient();
  let q = sb.from("articles").select("*, category:article_categories(*)").order("published_at", { ascending: false, nullsFirst: false });
  if (publishedOnly) q = q.eq("status", "published");
  const { data, error } = await q;
  if (error) throw error;
  return data as Article[];
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const sb = createServerSupabaseClient();
  const { data, error } = await sb
    .from("articles")
    .select("*, category:article_categories(*)")
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  if (error || !data) return null;
  return data as Article;
}

export async function getFirmSlugs(): Promise<string[]> {
  const sb = createServerSupabaseClient();
  const { data } = await sb.from("firms").select("slug").eq("is_published", true).eq("is_archived", false);
  return (data ?? []).map((r: { slug: string }) => r.slug);
}

export async function getArticleSlugs(): Promise<string[]> {
  const sb = createServerSupabaseClient();
  const { data } = await sb.from("articles").select("slug").eq("status", "published");
  return (data ?? []).map((r: { slug: string }) => r.slug);
}
