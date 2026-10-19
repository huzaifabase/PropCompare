"use server";

/**
 * Admin data layer — server actions + server-component helpers.
 *
 * Uses the SERVER client (anon key + user session); RLS `is_admin()` policies
 * enforce authorization. NEVER use the service-role client here.
 * Every mutation writes an audit_logs row and revalidates its admin path.
 */

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { PLATFORM_OPTIONS, INSTRUMENT_OPTIONS } from "./admin-options";
import { createServerSupabaseClient } from "./supabase";
import {
  affiliatePartnerSchema,
  articleSchema,
  discountSchema,
  firmSchema,
  programSchema,
  programSizeSchema,
} from "./validators";
import type {
  Article,
  ArticleCategory,
  Discount,
  Firm,
  Program,
  ProgramPayout,
  ProgramRules,
  ProgramSize,
} from "./types";

/* ============================== auth & audit ============================== */

export async function requireAdmin(): Promise<{ userId: string; email: string }> {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id, email")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) throw new Error("Unauthorized");
  return { userId: user.id, email: (profile.email as string) ?? user.email ?? "" };
}

export async function audit(
  action: string,
  table: string | null,
  recordId: string | null,
  details?: Record<string, unknown>
): Promise<void> {
  const { userId } = await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("audit_logs").insert({
    admin_id: userId,
    action,
    table_name: table,
    record_id: recordId,
    details: details ?? {},
  });
  if (error) throw new Error(`Audit log failed: ${error.message}`);
}

/* ============================== helpers ============================== */

/** "" → null so blank nullable fields stay null (never 0 / empty string). */
function normalize(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) out[k] = v === "" ? null : v;
  return out;
}

function parse<T>(schema: z.ZodType<T, z.ZodTypeDef, unknown>, input: unknown, label: string): T {
  const res = schema.safeParse(input);
  if (!res.success) {
    throw new Error(
      `${label}: ${res.error.issues
        .map((i) => `${i.path.join(".") || "value"} — ${i.message}`)
        .join("; ")}`
    );
  }
  return res.data;
}

function dbFail(action: string, error: { message: string } | null): never {
  throw new Error(`${action} failed: ${error?.message ?? "unknown database error"}`);
}

function joinName(row: unknown, key: string): string | null {
  const v = (row as Record<string, unknown> | null)?.[key] as
    | { name?: string }
    | { name?: string }[]
    | null
    | undefined;
  if (!v) return null;
  return Array.isArray(v) ? v[0]?.name ?? null : v.name ?? null;
}

/* ============================== local schemas ============================== */
/* (rules / payout have no shared schema in lib/validators.ts) */

const nullableNum = z.coerce.number().nullable().optional();
const nullableInt = z.coerce.number().int().nullable().optional();
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const nullableUrl = (max: number) =>
  z.string().url("Must be a valid URL.").max(max).nullable().optional();
const verificationStatusEnum = z.enum(["verified", "needs_verification", "stale"]);
const verifiedAtField = z.string().datetime({ offset: true }).nullable().optional();

const rulesInputSchema = z.object({
  account_size_id: z.string().uuid().nullable().optional(),
  phases: nullableInt,
  phase_names: z
    .string()
    .trim()
    .nullable()
    .optional()
    .transform((s) => (s ? s.split(",").map((p) => p.trim()).filter(Boolean) : null)),
  profit_target_p1_pct: nullableNum,
  profit_target_p2_pct: nullableNum,
  profit_target_p3_pct: nullableNum,
  daily_drawdown_pct: nullableNum,
  max_drawdown_pct: nullableNum,
  drawdown_type: z.enum(["static", "trailing"]).nullable().optional(),
  drawdown_basis: nullableText(500),
  min_trading_days: nullableInt,
  max_duration_days: nullableInt,
  consistency_rule: nullableText(2000),
  news_trading_rule: nullableText(2000),
  weekend_holding_rule: nullableText(2000),
  ea_allowed: z.boolean().nullable().optional(),
  copy_trading_rule: nullableText(2000),
  prohibited_strategies: nullableText(2000),
  lot_risk_restriction: nullableText(2000),
  verification_status: verificationStatusEnum.default("needs_verification"),
  verified_at: verifiedAtField,
  source_url: nullableUrl(1000),
});

const payoutInputSchema = z.object({
  account_size_id: z.string().uuid().nullable().optional(),
  profit_split_pct: nullableNum,
  first_payout_eligibility: nullableText(500),
  payout_frequency: nullableText(120),
  min_payout: nullableNum,
  min_payout_currency: z
    .string()
    .trim()
    .length(3)
    .nullable()
    .optional()
    .transform((s) => (s ? s.toUpperCase() : s)),
  withdrawal_methods: nullableText(2000),
  payout_conditions: nullableText(2000),
  refund_policy: nullableText(2000),
  verification_status: verificationStatusEnum.default("needs_verification"),
  verified_at: verifiedAtField,
  source_url: nullableUrl(1000),
});

/* ============================== firms ============================== */

export async function listFirms(): Promise<Firm[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("firms").select("*").order("name");
  if (error) dbFail("Load firms", error);
  return (data ?? []) as Firm[];
}

export async function getFirm(id: string): Promise<Firm | null> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("firms").select("*").eq("id", id).maybeSingle();
  if (error) dbFail("Load firm", error);
  return (data ?? null) as Firm | null;
}

export async function createFirm(input: Record<string, unknown>): Promise<{ id: string }> {
  await requireAdmin();
  const parsed = parse(firmSchema, normalize(input), "Firm");
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("firms").insert(parsed).select("id").single();
  if (error) dbFail("Create firm", error);
  await audit("create", "firms", data.id, { name: parsed.name });
  revalidatePath("/admin/firms");
  return { id: data.id as string };
}

export async function updateFirm(id: string, input: Record<string, unknown>): Promise<void> {
  await requireAdmin();
  const parsed = parse(firmSchema, normalize(input), "Firm");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("firms").update(parsed).eq("id", id);
  if (error) dbFail("Update firm", error);
  await audit("update", "firms", id, { name: parsed.name });
  revalidatePath("/admin/firms");
}

export async function setFirmArchived(id: string, archived: boolean): Promise<void> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("firms").update({ is_archived: archived }).eq("id", id);
  if (error) dbFail(archived ? "Archive firm" : "Unarchive firm", error);
  await audit(archived ? "archive" : "unarchive", "firms", id, {});
  revalidatePath("/admin/firms");
}

export async function deleteFirm(id: string): Promise<void> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("firms").delete().eq("id", id);
  if (error) dbFail("Delete firm", error);
  await audit("delete", "firms", id, {});
  revalidatePath("/admin/firms");
}

/* ============================== programs ============================== */

export interface ProgramAdminRow extends Program {
  firm: { id: string; name: string; slug: string } | null;
}

export async function listProgramsAdmin(firmId?: string): Promise<ProgramAdminRow[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  let q = supabase.from("programs").select("*, firms(id, name, slug)").order("name");
  if (firmId) q = q.eq("firm_id", firmId);
  const { data, error } = await q;
  if (error) dbFail("Load programs", error);
  return ((data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>;
    const f = r.firms as { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
    return { ...(r as object), firm: Array.isArray(f) ? f[0] ?? null : f } as ProgramAdminRow;
  });
}

export async function getProgram(id: string): Promise<ProgramAdminRow | null> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*, firms(id, name, slug)")
    .eq("id", id)
    .maybeSingle();
  if (error) dbFail("Load program", error);
  if (!data) return null;
  const f = (data as Record<string, unknown>).firms as ProgramAdminRow["firm"];
  return { ...(data as object), firm: Array.isArray(f) ? f[0] ?? null : f } as ProgramAdminRow;
}

export async function createProgram(input: Record<string, unknown>): Promise<{ id: string }> {
  await requireAdmin();
  const parsed = parse(programSchema, normalize(input), "Program");
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("programs").insert(parsed).select("id").single();
  if (error) dbFail("Create program", error);
  await audit("create", "programs", data.id, { name: parsed.name });
  revalidatePath("/admin/programs");
  return { id: data.id as string };
}

export async function updateProgram(id: string, input: Record<string, unknown>): Promise<void> {
  await requireAdmin();
  const parsed = parse(programSchema, normalize(input), "Program");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("programs").update(parsed).eq("id", id);
  if (error) dbFail("Update program", error);
  await audit("update", "programs", id, { name: parsed.name });
  revalidatePath("/admin/programs");
  revalidatePath(`/admin/programs/${id}`);
}

export async function setProgramArchived(id: string, archived: boolean): Promise<void> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("programs").update({ is_archived: archived }).eq("id", id);
  if (error) dbFail(archived ? "Archive program" : "Unarchive program", error);
  await audit(archived ? "archive" : "unarchive", "programs", id, {});
  revalidatePath("/admin/programs");
}

export async function deleteProgram(id: string): Promise<void> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("programs").delete().eq("id", id);
  if (error) dbFail("Delete program", error);
  await audit("delete", "programs", id, {});
  revalidatePath("/admin/programs");
}

/* ============================== program sizes ============================== */

export async function listProgramSizes(programId: string): Promise<ProgramSize[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("program_account_sizes")
    .select("*")
    .eq("program_id", programId)
    .order("account_size");
  if (error) dbFail("Load sizes", error);
  return (data ?? []) as ProgramSize[];
}

export async function createProgramSize(input: Record<string, unknown>): Promise<{ id: string }> {
  await requireAdmin();
  const parsed = parse(programSizeSchema, normalize(input), "Account size");
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("program_account_sizes")
    .insert(parsed)
    .select("id")
    .single();
  if (error) dbFail("Create size", error);
  await audit("create", "program_account_sizes", data.id, {
    program_id: parsed.program_id,
    account_size: parsed.account_size,
  });
  revalidatePath(`/admin/programs/${parsed.program_id}`);
  return { id: data.id as string };
}

export async function updateProgramSize(id: string, input: Record<string, unknown>): Promise<void> {
  await requireAdmin();
  const parsed = parse(programSizeSchema, normalize(input), "Account size");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("program_account_sizes").update(parsed).eq("id", id);
  if (error) dbFail("Update size", error);
  await audit("update", "program_account_sizes", id, { program_id: parsed.program_id });
  revalidatePath(`/admin/programs/${parsed.program_id}`);
}

export async function deleteProgramSize(id: string): Promise<void> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data: row } = await supabase
    .from("program_account_sizes")
    .select("program_id")
    .eq("id", id)
    .maybeSingle();
  const programId = (row as { program_id: string } | null)?.program_id;
  const { error } = await supabase.from("program_account_sizes").delete().eq("id", id);
  if (error) dbFail("Delete size", error);
  await audit("delete", "program_account_sizes", id, { program_id: programId });
  if (programId) revalidatePath(`/admin/programs/${programId}`);
}

/* ============================== program rules ============================== */

export async function getProgramRules(programId: string): Promise<ProgramRules | null> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("program_rules")
    .select("*")
    .eq("program_id", programId)
    .maybeSingle();
  if (error) dbFail("Load rules", error);
  return (data ?? null) as ProgramRules | null;
}

export async function upsertProgramRules(
  programId: string,
  input: Record<string, unknown>
): Promise<void> {
  await requireAdmin();
  const parsed = parse(rulesInputSchema, normalize(input), "Rules");
  const payload: Record<string, unknown> = { ...parsed, program_id: programId };
  if (parsed.verification_status === "verified" && !parsed.verified_at) {
    payload.verified_at = new Date().toISOString();
  }
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("program_rules")
    .select("id")
    .eq("program_id", programId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("program_rules")
      .update(payload)
      .eq("id", (existing as { id: string }).id);
    if (error) dbFail("Update rules", error);
    await audit("update", "program_rules", (existing as { id: string }).id, { program_id: programId });
  } else {
    const { data, error } = await supabase.from("program_rules").insert(payload).select("id").single();
    if (error) dbFail("Create rules", error);
    await audit("create", "program_rules", data.id, { program_id: programId });
  }
  revalidatePath(`/admin/programs/${programId}`);
}

/* ============================== platforms ============================== */

export async function getProgramPlatforms(programId: string): Promise<string[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("program_platforms")
    .select("platform")
    .eq("program_id", programId);
  if (error) dbFail("Load platforms", error);
  return ((data ?? []) as { platform: string }[]).map((r) => r.platform);
}

export async function setProgramPlatforms(programId: string, platforms: string[]): Promise<void> {
  await requireAdmin();
  const allowed = new Set<string>(PLATFORM_OPTIONS as readonly string[]);
  const clean = [...new Set(platforms)].filter((p) => allowed.has(p));
  const supabase = createServerSupabaseClient();
  const { error: delErr } = await supabase.from("program_platforms").delete().eq("program_id", programId);
  if (delErr) dbFail("Update platforms", delErr);
  if (clean.length > 0) {
    const { error } = await supabase
      .from("program_platforms")
      .insert(clean.map((platform) => ({ program_id: programId, platform })));
    if (error) dbFail("Update platforms", error);
  }
  await audit("update", "program_platforms", null, { program_id: programId, platforms: clean });
  revalidatePath(`/admin/programs/${programId}`);
}

/* ============================== instruments ============================== */

export interface ProgramInstrumentRow {
  instrument_class: string;
  notes: string | null;
}

export async function getProgramInstruments(programId: string): Promise<ProgramInstrumentRow[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("program_instruments")
    .select("instrument_class, notes")
    .eq("program_id", programId);
  if (error) dbFail("Load instruments", error);
  return (data ?? []) as ProgramInstrumentRow[];
}

export async function setProgramInstruments(programId: string, classes: string[]): Promise<void> {
  await requireAdmin();
  const allowed = new Set<string>(INSTRUMENT_OPTIONS as readonly string[]);
  const clean = [...new Set(classes)].filter((c) => allowed.has(c));
  const supabase = createServerSupabaseClient();
  const { error: delErr } = await supabase
    .from("program_instruments")
    .delete()
    .eq("program_id", programId);
  if (delErr) dbFail("Update instruments", delErr);
  if (clean.length > 0) {
    const { error } = await supabase
      .from("program_instruments")
      .insert(clean.map((instrument_class) => ({ program_id: programId, instrument_class, notes: null })));
    if (error) dbFail("Update instruments", error);
  }
  await audit("update", "program_instruments", null, { program_id: programId, instruments: clean });
  revalidatePath(`/admin/programs/${programId}`);
}

/* ============================== payouts ============================== */

export async function getProgramPayout(programId: string): Promise<ProgramPayout | null> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("program_payouts")
    .select("*")
    .eq("program_id", programId)
    .maybeSingle();
  if (error) dbFail("Load payout", error);
  return (data ?? null) as ProgramPayout | null;
}

export async function upsertProgramPayout(
  programId: string,
  input: Record<string, unknown>
): Promise<void> {
  await requireAdmin();
  const parsed = parse(payoutInputSchema, normalize(input), "Payout");
  const payload: Record<string, unknown> = { ...parsed, program_id: programId };
  if (parsed.verification_status === "verified" && !parsed.verified_at) {
    payload.verified_at = new Date().toISOString();
  }
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("program_payouts")
    .select("id")
    .eq("program_id", programId)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from("program_payouts")
      .update(payload)
      .eq("id", (existing as { id: string }).id);
    if (error) dbFail("Update payout", error);
    await audit("update", "program_payouts", (existing as { id: string }).id, { program_id: programId });
  } else {
    const { data, error } = await supabase.from("program_payouts").insert(payload).select("id").single();
    if (error) dbFail("Create payout", error);
    await audit("create", "program_payouts", data.id, { program_id: programId });
  }
  revalidatePath(`/admin/programs/${programId}`);
}

/* ============================== program editor bundle ============================== */

export interface ProgramEditorData {
  program: Program;
  firm: { id: string; name: string; slug: string } | null;
  sizes: ProgramSize[];
  rules: ProgramRules | null;
  platforms: string[];
  instruments: ProgramInstrumentRow[];
  payout: ProgramPayout | null;
}

export async function getProgramEditorData(programId: string): Promise<ProgramEditorData | null> {
  const row = await getProgram(programId);
  if (!row) return null;
  const [sizes, rules, platforms, instruments, payout] = await Promise.all([
    listProgramSizes(programId),
    getProgramRules(programId),
    getProgramPlatforms(programId),
    getProgramInstruments(programId),
    getProgramPayout(programId),
  ]);
  const { firm, ...program } = row;
  return { program: program as Program, firm, sizes, rules, platforms, instruments, payout };
}

/* ============================== discounts ============================== */

export interface DiscountAdminRow extends Omit<Discount, "firm"> {
  firm: { id: string; name: string; slug: string } | null;
}

export async function listDiscounts(): Promise<DiscountAdminRow[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("discounts")
    .select("*, firms(id, name, slug)")
    .order("created_at", { ascending: false });
  if (error) dbFail("Load discounts", error);
  return ((data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>;
    return { ...(r as object), firm: firmJoin(r) } as DiscountAdminRow;
  });
}

function firmJoin(r: Record<string, unknown>): { id: string; name: string; slug: string } | null {
  const v = r.firms as { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
  if (!v) return null;
  return Array.isArray(v) ? v[0] ?? null : v;
}

export async function getDiscount(id: string): Promise<DiscountAdminRow | null> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("discounts")
    .select("*, firms(id, name, slug)")
    .eq("id", id)
    .maybeSingle();
  if (error) dbFail("Load discount", error);
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return { ...(r as object), firm: firmJoin(r) } as DiscountAdminRow;
}

export async function createDiscount(input: Record<string, unknown>): Promise<{ id: string }> {
  await requireAdmin();
  const parsed = parse(discountSchema, normalize(input), "Discount");
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("discounts").insert(parsed).select("id").single();
  if (error) dbFail("Create discount", error);
  await audit("create", "discounts", data.id, { code: parsed.code });
  revalidatePath("/admin/discounts");
  return { id: data.id as string };
}

export async function updateDiscount(id: string, input: Record<string, unknown>): Promise<void> {
  await requireAdmin();
  const parsed = parse(discountSchema, normalize(input), "Discount");
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("discounts").update(parsed).eq("id", id);
  if (error) dbFail("Update discount", error);
  await audit("update", "discounts", id, { code: parsed.code });
  revalidatePath("/admin/discounts");
}

export async function toggleDiscountPublish(id: string, isPublished: boolean): Promise<void> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("discounts").update({ is_published: isPublished }).eq("id", id);
  if (error) dbFail(isPublished ? "Publish discount" : "Unpublish discount", error);
  await audit(isPublished ? "publish" : "unpublish", "discounts", id, {});
  revalidatePath("/admin/discounts");
}

export async function deleteDiscount(id: string): Promise<void> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("discounts").delete().eq("id", id);
  if (error) dbFail("Delete discount", error);
  await audit("delete", "discounts", id, {});
  revalidatePath("/admin/discounts");
}

/* ============================== articles ============================== */

export interface ArticleAdminRow extends Omit<Article, "category"> {
  category: { id: string; name: string; slug: string } | null;
}

export async function listArticles(): Promise<ArticleAdminRow[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*, article_categories(id, name, slug)")
    .order("updated_at", { ascending: false });
  if (error) dbFail("Load articles", error);
  return ((data ?? []) as unknown[]).map((row) => {
    const r = row as Record<string, unknown>;
    const c = r.article_categories as ArticleAdminRow["category"] | ArticleAdminRow["category"][];
    return { ...(r as object), category: Array.isArray(c) ? c[0] ?? null : c } as ArticleAdminRow;
  });
}

export async function getArticle(id: string): Promise<Article | null> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (error) dbFail("Load article", error);
  return (data ?? null) as Article | null;
}

export async function listCategories(): Promise<ArticleCategory[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("article_categories").select("*").order("name");
  if (error) dbFail("Load categories", error);
  return (data ?? []) as ArticleCategory[];
}

export async function createArticle(input: Record<string, unknown>): Promise<{ id: string }> {
  await requireAdmin();
  const parsed = parse(articleSchema, normalize(input), "Article");
  const payload: Record<string, unknown> = { ...parsed };
  if (parsed.status === "published") payload.published_at = new Date().toISOString();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("articles").insert(payload).select("id").single();
  if (error) dbFail("Create article", error);
  await audit("create", "articles", data.id, { title: parsed.title, status: parsed.status });
  revalidatePath("/admin/articles");
  return { id: data.id as string };
}

export async function updateArticle(id: string, input: Record<string, unknown>): Promise<void> {
  await requireAdmin();
  const parsed = parse(articleSchema, normalize(input), "Article");
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("articles")
    .select("published_at")
    .eq("id", id)
    .maybeSingle();
  const payload: Record<string, unknown> = { ...parsed };
  if (parsed.status === "published" && !(existing as { published_at: string | null } | null)?.published_at) {
    payload.published_at = new Date().toISOString();
  }
  const { error } = await supabase.from("articles").update(payload).eq("id", id);
  if (error) dbFail("Update article", error);
  await audit("update", "articles", id, { title: parsed.title, status: parsed.status });
  revalidatePath("/admin/articles");
}

export async function toggleArticlePublish(id: string, publish: boolean): Promise<void> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("articles")
    .select("published_at")
    .eq("id", id)
    .maybeSingle();
  const payload: Record<string, unknown> = { status: publish ? "published" : "draft" };
  if (publish && !(existing as { published_at: string | null } | null)?.published_at) {
    payload.published_at = new Date().toISOString();
  }
  const { error } = await supabase.from("articles").update(payload).eq("id", id);
  if (error) dbFail(publish ? "Publish article" : "Unpublish article", error);
  await audit(publish ? "publish" : "unpublish", "articles", id, {});
  revalidatePath("/admin/articles");
}

export async function deleteArticle(id: string): Promise<void> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) dbFail("Delete article", error);
  await audit("delete", "articles", id, {});
  revalidatePath("/admin/articles");
}

/* ============================== affiliate partners ============================== */

export interface AffiliatePartner {
  id: string;
  firm_id: string;
  status: "none" | "pending" | "approved" | "rejected";
  network_name: string | null;
  destination_url: string;
  created_at: string;
  updated_at: string;
}

export interface AffiliatePartnerRow {
  firm: { id: string; name: string; slug: string };
  partner: AffiliatePartner | null;
}

export async function listAffiliatePartners(): Promise<AffiliatePartnerRow[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const [{ data: firms, error: fErr }, { data: partners, error: pErr }] = await Promise.all([
    supabase.from("firms").select("id, name, slug").order("name"),
    supabase.from("affiliate_partners").select("*"),
  ]);
  if (fErr) dbFail("Load firms", fErr);
  if (pErr) dbFail("Load affiliate partners", pErr);
  const byFirm = new Map<string, AffiliatePartner>();
  ((partners ?? []) as AffiliatePartner[]).forEach((p) => byFirm.set(p.firm_id, p));
  return ((firms ?? []) as { id: string; name: string; slug: string }[]).map((firm) => ({
    firm,
    partner: byFirm.get(firm.id) ?? null,
  }));
}

export async function upsertAffiliatePartner(input: Record<string, unknown>): Promise<void> {
  await requireAdmin();
  const normalized = normalize(input);
  const supabase = createServerSupabaseClient();
  // Clearing a partner: status "none" with no URL removes the partner row entirely.
  if (normalized.status === "none" && !normalized.destination_url) {
    const firmId = normalized.firm_id;
    if (typeof firmId !== "string" || !firmId) throw new Error("Affiliate partner: firm is required.");
    const { error } = await supabase.from("affiliate_partners").delete().eq("firm_id", firmId);
    if (error) dbFail("Remove affiliate partner", error);
    await audit("delete", "affiliate_partners", null, { firm_id: firmId });
    revalidatePath("/admin/affiliates");
    return;
  }
  const parsed = parse(affiliatePartnerSchema, normalized, "Affiliate partner");
  const { error } = await supabase
    .from("affiliate_partners")
    .upsert(parsed, { onConflict: "firm_id" });
  if (error) dbFail("Save affiliate partner", error);
  await audit("update", "affiliate_partners", null, {
    firm_id: parsed.firm_id,
    status: parsed.status,
  });
  revalidatePath("/admin/affiliates");
}

/* ============================== clicks ============================== */

export interface ClickAdminRow {
  id: string;
  created_at: string;
  slug: string;
  source_page: string | null;
  campaign: string | null;
  referrer: string | null;
  firm_id: string | null;
  program_id: string | null;
  firm_name: string | null;
  program_name: string | null;
}

function mapClickRow(row: Record<string, unknown>): ClickAdminRow {
  return {
    id: row.id as string,
    created_at: row.created_at as string,
    slug: row.slug as string,
    source_page: (row.source_page as string) ?? null,
    campaign: (row.campaign as string) ?? null,
    referrer: (row.referrer as string) ?? null,
    firm_id: (row.firm_id as string) ?? null,
    program_id: (row.program_id as string) ?? null,
    firm_name: joinName(row, "firms"),
    program_name: joinName(row, "programs"),
  };
}

export interface ClickListResult {
  clicks: ClickAdminRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listClicks(
  page: number,
  pageSize = 50,
  firmId?: string
): Promise<ClickListResult> {
  await requireAdmin();
  const safePage = Math.max(1, Math.floor(page) || 1);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = createServerSupabaseClient();
  let q = supabase
    .from("affiliate_clicks")
    .select("id, created_at, slug, source_page, campaign, referrer, firm_id, program_id, firms(name), programs(name)", {
      count: "exact",
    });
  if (firmId) q = q.eq("firm_id", firmId);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(from, to);
  if (error) dbFail("Load clicks", error);
  const total = count ?? 0;
  return {
    clicks: ((data ?? []) as Record<string, unknown>[]).map(mapClickRow),
    total,
    page: safePage,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV export of affiliate clicks. Returns the CSV text (client triggers download). */
export async function exportClicksCsv(firmId?: string): Promise<string> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  let q = supabase
    .from("affiliate_clicks")
    .select("created_at, slug, source_page, campaign, referrer, firms(name), programs(name)")
    .order("created_at", { ascending: false })
    .limit(10000);
  if (firmId) q = q.eq("firm_id", firmId);
  const { data, error } = await q;
  if (error) dbFail("Export clicks", error);
  const rows = ((data ?? []) as Record<string, unknown>[]).map(mapClickRow);
  const header = ["created_at", "slug", "firm", "program", "source_page", "campaign", "referrer"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.created_at, r.slug, r.firm_name, r.program_name, r.source_page, r.campaign, r.referrer]
        .map(csvCell)
        .join(",")
    ),
  ];
  await audit("export", "affiliate_clicks", null, { rows: rows.length, firm_id: firmId ?? null });
  return lines.join("\n");
}

export interface ClickStatsByFirm {
  firm_id: string | null;
  firm_name: string;
  total: number;
  last30d: number;
}

export async function getClickStatsByFirm(): Promise<ClickStatsByFirm[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("affiliate_clicks")
    .select("firm_id, created_at, firms(name)")
    .order("created_at", { ascending: false })
    .limit(5000);
  if (error) dbFail("Load click stats", error);
  const cutoff = Date.now() - 30 * 24 * 3600 * 1000;
  const map = new Map<string, ClickStatsByFirm>();
  ((data ?? []) as Record<string, unknown>[]).forEach((row) => {
    const key = (row.firm_id as string) ?? "__none__";
    const cur = map.get(key) ?? {
      firm_id: (row.firm_id as string) ?? null,
      firm_name: joinName(row, "firms") ?? "Unknown",
      total: 0,
      last30d: 0,
    };
    cur.total += 1;
    if (new Date(row.created_at as string).getTime() >= cutoff) cur.last30d += 1;
    map.set(key, cur);
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

/* ============================== verification queue ============================== */

export async function getStaleDays(): Promise<number> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "verification_stale_days")
    .maybeSingle();
  const n = Number((data as { value: unknown } | null)?.value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 90;
}

export interface QueueFirm {
  id: string;
  name: string;
  slug: string;
  last_verified_at: string | null;
}
export interface QueueProgram {
  id: string;
  name: string;
  slug: string;
  firm_id: string;
  firm_name: string | null;
  last_verified_at: string | null;
}
export interface QueueRules {
  id: string;
  program_id: string;
  program_name: string | null;
  firm_name: string | null;
  verification_status: string;
  verified_at: string | null;
}
export interface QueueDiscount {
  id: string;
  code: string;
  firm_name: string | null;
  verification_status: string;
}

export interface VerificationQueue {
  staleDays: number;
  firms: QueueFirm[];
  programs: QueueProgram[];
  rules: QueueRules[];
  payouts: QueueRules[];
  discounts: QueueDiscount[];
}

function ruleJoinNames(row: Record<string, unknown>): { program_name: string | null; firm_name: string | null } {
  const p = row.programs as { name?: string; firms?: { name?: string } | { name?: string }[] } | null;
  const f = p?.firms;
  return {
    program_name: p?.name ?? null,
    firm_name: !f ? null : Array.isArray(f) ? f[0]?.name ?? null : f.name ?? null,
  };
}

export async function verificationQueue(): Promise<VerificationQueue> {
  const staleDays = await getStaleDays();
  const supabase = createServerSupabaseClient();
  const cutoff = new Date(Date.now() - staleDays * 24 * 3600 * 1000).toISOString();
  const staleFilter = `last_verified_at.is.null,last_verified_at.lt.${cutoff}`;

  const [firmsRes, programsRes, rulesRes, payoutsRes, discountsRes] = await Promise.all([
    supabase.from("firms").select("id, name, slug, last_verified_at").or(staleFilter).order("name"),
    supabase
      .from("programs")
      .select("id, name, slug, firm_id, last_verified_at, firms(name)")
      .or(staleFilter)
      .order("name"),
    supabase
      .from("program_rules")
      .select("id, program_id, verification_status, verified_at, programs(name, firms(name))")
      .or(`verification_status.neq.verified,verified_at.lt.${cutoff}`)
      .order("verified_at", { ascending: true, nullsFirst: true }),
    supabase
      .from("program_payouts")
      .select("id, program_id, verification_status, verified_at, programs(name, firms(name))")
      .or(`verification_status.neq.verified,verified_at.lt.${cutoff}`)
      .order("verified_at", { ascending: true, nullsFirst: true }),
    supabase
      .from("discounts")
      .select("id, code, verification_status, firms(name)")
      .eq("verification_status", "unverified")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
  ]);

  for (const [res, label] of [
    [firmsRes, "firms"],
    [programsRes, "programs"],
    [rulesRes, "rules"],
    [payoutsRes, "payouts"],
    [discountsRes, "discounts"],
  ] as const) {
    if (res.error) dbFail(`Load verification queue (${label})`, res.error);
  }

  const mapRules = (rows: unknown[]): QueueRules[] =>
    (rows as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      program_id: r.program_id as string,
      ...ruleJoinNames(r),
      verification_status: r.verification_status as string,
      verified_at: (r.verified_at as string) ?? null,
    }));

  return {
    staleDays,
    firms: (firmsRes.data ?? []) as QueueFirm[],
    programs: ((programsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
      firm_id: r.firm_id as string,
      firm_name: joinName(r, "firms"),
      last_verified_at: (r.last_verified_at as string) ?? null,
    })),
    rules: mapRules(rulesRes.data ?? []),
    payouts: mapRules(payoutsRes.data ?? []),
    discounts: ((discountsRes.data ?? []) as Record<string, unknown>[]).map((r) => ({
      id: r.id as string,
      code: r.code as string,
      firm_name: joinName(r, "firms"),
      verification_status: r.verification_status as string,
    })),
  };
}

/* ============================== audit logs ============================== */

export interface AuditLogRow {
  id: string;
  created_at: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  details: Record<string, unknown> | null;
  admin_email: string | null;
}

export interface AuditLogResult {
  logs: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listAuditLogs(page: number, pageSize = 25): Promise<AuditLogResult> {
  await requireAdmin();
  const safePage = Math.max(1, Math.floor(page) || 1);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = createServerSupabaseClient();
  const { data, count, error } = await supabase
    .from("audit_logs")
    .select("id, created_at, action, table_name, record_id, details, admin_profiles(email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) dbFail("Load audit logs", error);
  const logs = ((data ?? []) as Record<string, unknown>[]).map((r) => {
    const ap = r.admin_profiles as { email?: string } | { email?: string }[] | null;
    return {
      id: r.id as string,
      created_at: r.created_at as string,
      action: r.action as string,
      table_name: (r.table_name as string) ?? null,
      record_id: (r.record_id as string) ?? null,
      details: (r.details as Record<string, unknown>) ?? null,
      admin_email: !ap ? null : Array.isArray(ap) ? ap[0]?.email ?? null : ap.email ?? null,
    } as AuditLogRow;
  });
  const total = count ?? 0;
  return { logs, total, page: safePage, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/* ============================== site settings ============================== */

export interface SiteSettingRow {
  key: string;
  value: unknown;
}

export async function getSiteSettingsAdmin(): Promise<SiteSettingRow[]> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.from("site_settings").select("key, value").order("key");
  if (error) dbFail("Load site settings", error);
  return (data ?? []) as SiteSettingRow[];
}

const settingKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9_]+$/, "Key may only contain lowercase letters, numbers and underscores.");

export async function updateSiteSetting(key: string, rawValue: string, asJson: boolean): Promise<void> {
  await requireAdmin();
  const cleanKey = settingKeySchema.parse(key);
  let value: unknown;
  if (asJson) {
    try {
      value = JSON.parse(rawValue);
    } catch {
      throw new Error("Value is not valid JSON.");
    }
  } else {
    value = rawValue;
  }
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("site_settings").upsert({ key: cleanKey, value }, { onConflict: "key" });
  if (error) dbFail("Save setting", error);
  await audit("update", "site_settings", null, { key: cleanKey });
  revalidatePath("/admin/settings");
}

/* ============================== dashboard ============================== */

export interface DashboardStats {
  totals: {
    firms: number;
    programs: number;
    publishedArticles: number;
    clicksTotal: number;
    clicks30d: number;
  };
  clicksByFirm: ClickStatsByFirm[];
  recentAudit: AuditLogRow[];
  verification: {
    staleDays: number;
    firms: number;
    programs: number;
    rules: number;
    payouts: number;
    discounts: number;
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();
  const supabase = createServerSupabaseClient();
  const cutoff30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

  const [firmsRes, programsRes, articlesRes, clicksRes, clicks30Res, queue, recentAudit, byFirm] =
    await Promise.all([
      supabase.from("firms").select("id", { count: "exact", head: true }),
      supabase.from("programs").select("id", { count: "exact", head: true }),
      supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }),
      supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).gte("created_at", cutoff30),
      verificationQueue(),
      listAuditLogs(1, 8),
      getClickStatsByFirm(),
    ]);

  for (const [res, label] of [
    [firmsRes, "firms"],
    [programsRes, "programs"],
    [articlesRes, "articles"],
    [clicksRes, "clicks"],
    [clicks30Res, "recent clicks"],
  ] as const) {
    if (res.error) dbFail(`Load dashboard (${label})`, res.error);
  }

  return {
    totals: {
      firms: firmsRes.count ?? 0,
      programs: programsRes.count ?? 0,
      publishedArticles: articlesRes.count ?? 0,
      clicksTotal: clicksRes.count ?? 0,
      clicks30d: clicks30Res.count ?? 0,
    },
    clicksByFirm: byFirm.slice(0, 10),
    recentAudit: recentAudit.logs,
    verification: {
      staleDays: queue.staleDays,
      firms: queue.firms.length,
      programs: queue.programs.length,
      rules: queue.rules.length,
      payouts: queue.payouts.length,
      discounts: queue.discounts.length,
    },
  };
}
