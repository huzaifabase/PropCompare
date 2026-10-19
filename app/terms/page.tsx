import type { Metadata } from "next";
import { Container, SectionHeading, Card, Alert } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms governing your use of PropCompare.",
};

export default function TermsPage() {
  return (
    <div className="bg-slate-50 py-10">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Terms of Use" }]} />
        <Alert tone="warning" >
          <strong>Draft</strong> — requires review by qualified legal counsel for your jurisdiction.
        </Alert>
        <div className="mt-6">
          <SectionHeading kicker="Legal" title="Terms of Use" sub="Last updated: October 2026 (draft)" />
        </div>
        <Card className="p-6 sm:p-8">
          <div className="prose-custom">
            <h2>1. The service</h2>
            <p>
              PropCompare is an independent information service comparing proprietary trading firms. We are
              not a prop firm, broker, or financial advisor, and we don&apos;t sell challenges, hold funds, or
              execute trades.
            </p>
            <h2>2. Not financial advice</h2>
            <p>
              Nothing on this site — comparisons, guides, reviews, or editorial assessments — constitutes
              financial, investment, or trading advice. Trading involves substantial risk of loss. You are
              solely responsible for your own decisions; consider consulting a licensed professional.
            </p>
            <h2>3. Accuracy</h2>
            <p>
              We research from official sources and re-verify on a cadence, but firms change terms frequently
              and errors are possible. Fields we can&apos;t confirm are labeled “Not verified.” Always confirm
              critical details on the firm&apos;s official website before purchasing. We disclaim liability for
              losses arising from reliance on site content, to the maximum extent permitted by law.
            </p>
            <h2>4. Affiliate links</h2>
            <p>
              Some outgoing links (for example, <code>/go/[firm]</code>) are affiliate links. If you purchase
              through them, the firm may pay us a commission at no extra cost to you. See our{" "}
              <a href="/affiliate-disclosure">affiliate disclosure</a>.
            </p>
            <h2>5. Acceptable use</h2>
            <ul>
              <li>Don&apos;t scrape the site at abusive rates or attempt to disrupt the service.</li>
              <li>Don&apos;t submit spam, unlawful content, or other people&apos;s personal data via our forms.</li>
              <li>Don&apos;t misrepresent PropCompare content as your own or as endorsed by us.</li>
            </ul>
            <h2>6. Intellectual property</h2>
            <p>
              Site content (text, design, compilation of data) is owned by PropCompare or its licensors.
              Firm names, logos, and trademarks belong to their respective owners; their use here is
              descriptive only and doesn&apos;t imply endorsement.
            </p>
            <h2>7. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, PropCompare isn&apos;t liable for indirect, incidental, or
              consequential damages arising from use of the site, including trading losses or forfeited
              challenge fees.
            </p>
            <h2>8. Changes</h2>
            <p>
              We may update these terms; the “last updated” date will change accordingly. Continued use of the
              site after changes means you accept the revised terms.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
