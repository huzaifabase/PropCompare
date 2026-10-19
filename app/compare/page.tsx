import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";
import { CompareClient } from "@/components/compare";
import { getAllProgramRows, getFirms } from "@/lib/data";
import { parseCompareParams } from "@/lib/compare";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Compare Prop Firm Challenges",
    description:
      "Side-by-side comparison of prop trading firm challenges: fees, account sizes, drawdowns, payout terms and trading rules — verified from official sources.",
    alternates: { canonical: "/compare" },
  };
}

function toSearchParams(searchParams: Record<string, string | string[] | undefined>): URLSearchParams {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") sp.set(k, v);
    else if (Array.isArray(v) && v.length > 0) sp.set(k, v.join(","));
  }
  return sp;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const initialFilters = parseCompareParams(toSearchParams(searchParams));
  const [initialRows, firms] = await Promise.all([getAllProgramRows(), getFirms()]);

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Compare" }]} />
      <CompareClient
        initialRows={initialRows}
        firms={firms.map((f) => ({ slug: f.slug, name: f.name }))}
        initialFilters={initialFilters}
      />
    </Container>
  );
}
