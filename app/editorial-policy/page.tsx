import type { Metadata } from "next";
import { Container, SectionHeading, Card, Alert } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Editorial Policy",
  description: "How PropCompare researches firms, verifies data, labels opinion, and handles corrections.",
};

export default function EditorialPolicyPage() {
  return (
    <div className="bg-slate-50 py-10">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Editorial Policy" }]} />
        <Alert tone="warning" >
          <strong>Draft</strong> — requires review by qualified legal counsel for your jurisdiction.
        </Alert>
        <div className="mt-6">
          <SectionHeading kicker="Standards" title="Editorial Policy" sub="How we research, what we publish, and what we won't." />
        </div>
        <Card className="p-6 sm:p-8">
          <div className="prose-custom">
            <h2>1. Sources</h2>
            <p>
              Factual data — rules, fees, drawdowns, payout terms — is collected from firms&apos; official
              documentation and cited with source links on each profile. We don&apos;t rely on forums, social
              media claims, or second-hand summaries as primary sources.
            </p>
            <h2>2. Verification</h2>
            <p>
              Profiles carry a last-verified date and are re-checked on a regular cadence. Anything we can&apos;t
              confirm is labeled “Not verified.” We never fill gaps with guesses, estimates presented as
              fact, or placeholder numbers.
            </p>
            <h2>3. Opinion is labeled</h2>
            <p>
              Editorial assessments and reviews are explicitly marked as opinion and kept separate from
              verified data. When no assessment exists, we say so plainly: “Our editorial team is still
              evaluating this firm — no assessment published yet.”
            </p>
            <h2>4. No invented metrics</h2>
            <p>
              We don&apos;t publish ratings, scores, trader counts, win rates, or testimonials unless each element
              is verifiable and sourced. Absence of a review is never disguised with a placeholder score.
            </p>
            <h2>5. Independence from affiliates</h2>
            <p>
              Affiliate relationships don&apos;t change verified data or manufacture positive assessments. See the{" "}
              <a href="/affiliate-disclosure">affiliate disclosure</a> for commission mechanics.
            </p>
            <h2>6. Corrections</h2>
            <p>
              Errors happen; what matters is fixing them. Report an error via the{" "}
              <a href="/contact">contact page</a> and we&apos;ll re-verify against the official source, correct the
              record, and update the verification date. Material corrections to published reviews are noted
              in the article.
            </p>
            <h2>7. No financial advice</h2>
            <p>
              Our content informs; it doesn&apos;t advise. Nothing we publish should be read as a recommendation
              to buy a challenge or trade a particular way. See the <a href="/risk-disclaimer">risk disclaimer</a>.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
