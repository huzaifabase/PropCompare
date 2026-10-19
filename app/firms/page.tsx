import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFirms } from "@/lib/data";
import { fmtDate, fmtText } from "@/lib/format";
import { Container, SectionHeading, Card, Button, EmptyState } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prop Firms",
  description:
    "Browse prop trading firm profiles: evaluation programs, rules, fees, and payout policies researched from official sources.",
};

function FirmMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${name} logo`} className="h-14 w-14 rounded-xl object-contain" loading="lazy" />;
  }
  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-navy-900 text-2xl font-extrabold text-white" aria-hidden>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default async function FirmsPage() {
  const firms = await getFirms();

  return (
    <div className="bg-slate-50 py-10">
      <Container>
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Prop Firms" }]} />
        <SectionHeading
          kicker="Directory"
          title="Prop firms"
          sub="Every profile is built from the firm's official documentation. Fields we can't confirm are labeled “Not verified”."
        />
        {firms.length === 0 ? (
          <EmptyState title="No firms published yet." body="Firm profiles are being researched — check back soon." />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {firms.map((f) => (
              <Card key={f.id} className="flex flex-col p-6">
                <div className="flex items-center gap-4">
                  <FirmMark name={f.name} logoUrl={f.logo_url} />
                  <div>
                    <h2 className="text-lg font-bold text-ink">{f.name}</h2>
                    {f.tagline && <p className="text-sm text-muted">{f.tagline}</p>}
                  </div>
                </div>
                <p className="mt-4 flex-1 text-sm text-slate-600">{fmtText(f.description)}</p>
                <p className="mt-3 text-xs text-muted">
                  Last verified: {f.last_verified_at ? fmtDate(f.last_verified_at) : "Not verified"}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/firms/${f.slug}`}>
                    <Button size="sm" variant="secondary">View profile <ArrowRight className="h-4 w-4" aria-hidden /></Button>
                  </Link>
                  <Link href={`/compare?firms=${encodeURIComponent(f.slug)}`}>
                    <Button size="sm" variant="ghost">Compare</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
