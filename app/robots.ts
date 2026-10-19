import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const base = raw.replace(/\/+$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/go/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
