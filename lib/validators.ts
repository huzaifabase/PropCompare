import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address.").max(254),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required." }) }),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Name is required.").max(120),
  email: z.string().email("Enter a valid email address.").max(254),
  subject: z.string().trim().min(3, "Subject is required.").max(160),
  message: z.string().trim().min(10, "Message must be at least 10 characters.").max(5000),
  website: z.string().max(0).optional(), // honeypot — must stay empty
});

const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.");

export const firmSchema = z.object({
  slug,
  name: z.string().trim().min(2).max(120),
  tagline: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  logo_url: z.string().url("Must be a valid URL.").max(500).nullable().optional().or(z.literal("")),
  official_website: z.string().url("Must be a valid URL.").max(500),
  affiliate_status: z.enum(["none", "pending", "approved"]),
  affiliate_network: z.string().trim().max(120).nullable().optional(),
  affiliate_destination_url: z.string().url("Must be a valid URL.").max(1000).nullable().optional().or(z.literal("")),
  is_published: z.boolean().default(false),
  is_archived: z.boolean().default(false),
});

export const programSchema = z.object({
  firm_id: z.string().uuid(),
  slug,
  name: z.string().trim().min(2).max(120),
  category: z.enum(["one_step", "two_step", "three_step", "instant", "other"]),
  description: z.string().trim().max(5000).nullable().optional(),
  is_published: z.boolean().default(false),
  is_archived: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
});

export const programSizeSchema = z.object({
  program_id: z.string().uuid(),
  account_size: z.coerce.number().positive("Account size must be positive."),
  size_currency: z.string().trim().length(3).default("USD").transform((s) => s.toUpperCase()),
  fee: z.coerce.number().nonnegative().nullable().optional(),
  fee_currency: z
    .string()
    .trim()
    .length(3)
    .nullable()
    .optional()
    .transform((s) => (s ? s.toUpperCase() : s)),
  is_available: z.boolean().default(true),
});

export const discountSchema = z.object({
  firm_id: z.string().uuid(),
  code: z.string().trim().min(1).max(60),
  discount_pct: z.coerce.number().min(0).max(100).nullable().optional(),
  discount_fixed: z.coerce.number().nonnegative().nullable().optional(),
  currency: z
    .string()
    .trim()
    .length(3)
    .nullable()
    .optional()
    .transform((s) => (s ? s.toUpperCase() : s)),
  applicable_programs: z.string().trim().max(300).nullable().optional(),
  expires_at: z.string().datetime({ offset: true }).nullable().optional().or(z.literal("")),
  terms: z.string().trim().max(2000).nullable().optional(),
  source_url: z.string().url().max(1000).nullable().optional().or(z.literal("")),
  verification_status: z.enum(["verified", "unverified"]).default("unverified"),
  is_published: z.boolean().default(false),
});

export const articleSchema = z.object({
  slug,
  title: z.string().trim().min(4).max(160),
  excerpt: z.string().trim().max(400).nullable().optional(),
  content_md: z.string().trim().min(10, "Article body is required."),
  category_id: z.string().uuid().nullable().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
  author: z.string().trim().max(120).nullable().optional(),
  meta_title: z.string().trim().max(160).nullable().optional(),
  meta_description: z.string().trim().max(320).nullable().optional(),
  featured_image_url: z.string().url().max(500).nullable().optional().or(z.literal("")),
});

export const affiliatePartnerSchema = z.object({
  firm_id: z.string().uuid(),
  status: z.enum(["none", "pending", "approved", "rejected"]),
  network_name: z.string().trim().max(120).nullable().optional(),
  destination_url: z.string().url("Must be a valid URL.").max(1000),
});
