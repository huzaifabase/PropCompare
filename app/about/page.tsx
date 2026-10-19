import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ShieldCheck, Eye, Ban } from "lucide-react";
import { Container, SectionHeading, Card } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description: "What PropCompare is, how we research prop firms, and what we will never do.",
};

export default function AboutPage() {
  return (
    <div className="bg-slate-50 py-10">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "About" }]} />
        <SectionHeading
          kicker="About"
          title="An independent lens on prop firms"
          sub="PropCompare exists to make prop trading challenges legible before you pay for one."
        />
        <Card className="p-6 sm:p-8">
          <div className="prose-custom">
            <h2>What we do</h2>
            <p>
              We research proprietary trading firms — their evaluation challenges, account sizes, fees,
              drawdown rules, payout policies, and restrictions — and present the findings side by side so
              traders can compare them without opening twenty browser tabs. Every factual field starts from
              the firm&apos;s official documentation and links back to its source.
            </p>
            <h2>What we don&apos;t do</h2>
            <p>
              PropCompare is not a prop firm. We don&apos;t sell challenges, hold trading funds, manage accounts,
              or execute trades. We don&apos;t invent ratings, trader counts, testimonials, or success statistics.
              When we can&apos;t confirm a fact, we label it “Not verified” instead of guessing.
            </p>
            <h2>How we stay honest</h2>
            <ul>
              <li><strong>Sources first:</strong> data is collected from official firm pages and cited.</li>
              <li><strong>Verification cadence:</strong> profiles are re-checked regularly and carry a last-verified date.</li>
              <li><strong>Opinions labeled:</strong> editorial assessments are marked as opinion, separate from verified data.</li>
              <li><strong>Corrections welcome:</strong> if you spot an error, <Link href="/contact">tell us</Link> and we&apos;ll re-verify or fix it.</li>
            </ul>
            <h2>How we&apos;re funded</h2>
            <p>
              Some outgoing links are affiliate links: if you purchase through them, the firm may pay us a
              commission at no extra cost to you. This never changes the underlying data. See the{" "}
              <Link href="/affiliate-disclosure">affiliate disclosure</Link> for the full mechanics.
            </p>
          </div>
        </Card>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <Card className="p-5">
            <Scale className="h-6 w-6 text-accent-dark" aria-hidden />
            <p className="mt-2 font-semibold text-ink">Independent</p>
            <p className="mt-1 text-sm text-slate-600">Not owned by any prop firm. Data is data, whoever it favors.</p>
          </Card>
          <Card className="p-5">
            <ShieldCheck className="h-6 w-6 text-accent-dark" aria-hidden />
            <p className="mt-2 font-semibold text-ink">Source-cited</p>
            <p className="mt-1 text-sm text-slate-600">Factual claims link to official documentation.</p>
          </Card>
          <Card className="p-5">
            <Ban className="h-6 w-6 text-accent-dark" aria-hidden />
            <p className="mt-2 font-semibold text-ink">No invented numbers</p>
            <p className="mt-1 text-sm text-slate-600">Unconfirmed fields read “Not verified.” <Eye className="inline h-4 w-4" aria-hidden /></p>
          </Card>
        </div>
      </Container>
    </div>
  );
}
