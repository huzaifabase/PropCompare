import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActiveDiscounts } from "@/lib/data";
import { fmtMoney, fmtPct, fmtDate, fmtText, discountStatusBadge } from "@/lib/format";
import { Container, SectionHeading, Card, Badge, Button, EmptyState, Alert } from "@/components/ui";
import { Breadcrumbs, AffiliateNote } from "@/components/site";
import { CopyCodeButton } from "../copy-code-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prop Firm Discounts & Promo Codes",
  description:
    "Verified prop firm discount codes and promotions. Each offer is checked against a source before it appears here.",
};

function discountLabel(d: { discount_pct: number | null; discount_fixed: number | null; currency: string | null }): string {
  if (d.discount_pct !== null && d.discount_pct !== undefined) return `${fmtPct(d.discount_pct)} off`;
  if (d.discount_fixed !== null && d.discount_fixed !== undefined)
    return `${fmtMoney(d.discount_fixed, d.currency)} off`;
  return "Offer — see terms";
}

export default async function DiscountsPage() {
  const discounts = await getActiveDiscounts();

  return (
    <div className="bg-slate-50 py-10">
      <Container>
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Discounts" }]} />
        <SectionHeading
          kicker="Verified offers"
          title="Prop firm discounts"
          sub="We only list offers we can confirm with a source. Expired offers are removed automatically."
        />
        <Alert tone="info" >
          <p>
            <strong>How this works:</strong> copy a code and enter it at the firm&apos;s checkout. Codes are checked
            against the firm&apos;s official pages before publication; if a code stops working, tell us via the{" "}
            <Link href="/contact" className="underline">contact page</Link> and we&apos;ll re-verify or remove it.
          </p>
        </Alert>

        {discounts.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No active discounts right now."
              body="We only publish offers we can verify. New ones appear here — or get an email the moment one lands."
            />
            <div className="mt-4">
              <Link href="/#newsletter-heading"><Button variant="secondary">Get discount alerts <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {discounts.map((d) => {
              const badge = discountStatusBadge(d.status);
              return (
                <Card key={d.id} className="flex flex-col p-6">
                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/firms/${d.firm.slug}`} className="font-bold text-ink hover:underline">
                      {d.firm.name}
                    </Link>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>
                  <p className="mt-2 text-xl font-extrabold text-accent-dark">{discountLabel(d)}</p>
                  {d.applicable_programs && (
                    <p className="mt-1 text-xs text-muted">Applies to: {d.applicable_programs}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <code className="truncate font-mono text-sm font-bold text-ink" aria-label={`Discount code ${d.code}`}>
                      {d.code}
                    </code>
                    <CopyCodeButton code={d.code} />
                  </div>
                  <p className="mt-3 text-xs text-muted">
                    {d.expires_at ? `Expires ${fmtDate(d.expires_at)}` : "No expiry date listed"}
                  </p>
                  <p className="mt-2 flex-1 text-xs leading-relaxed text-slate-600">{fmtText(d.terms)}</p>
                  <div className="mt-4">
                    <Link href={`/go/${d.firm.slug}`}>
                      <Button size="sm" className="w-full">Get this discount</Button>
                    </Link>
                    <AffiliateNote className="mt-2" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
