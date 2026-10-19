import type { MetadataRoute } from "next";
import { getFirmSlugs, getArticleSlugs } from "@/lib/data";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "",
  "/compare",
  "/firms",
  "/challenge-finder",
  "/discounts",
  "/reviews",
  "/learn",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/affiliate-disclosure",
  "/risk-disclaimer",
  "/editorial-policy",
];

function baseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  let firmSlugs: string[] = [];
  let articleSlugs: string[] = [];
  try {
    [firmSlugs, articleSlugs] = await Promise.all([getFirmSlugs(), getArticleSlugs()]);
  } catch {
    // DB unavailable (e.g. build without env): fall back to static routes only.
    firmSlugs = [];
    articleSlugs = [];
  }

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${base}${r || "/"}`,
    lastModified: new Date(),
    changeFrequency: r === "" ? "daily" : "weekly",
    priority: r === "" ? 1 : 0.7,
  }));

  const firmEntries: MetadataRoute.Sitemap = firmSlugs.map((slug) => ({
    url: `${base}/firms/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const articleEntries: MetadataRoute.Sitemap = articleSlugs.map((slug) => ({
    url: `${base}/learn/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...firmEntries, ...articleEntries];
}
