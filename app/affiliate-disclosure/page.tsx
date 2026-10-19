import type { Metadata } from "next";
import { Container, SectionHeading, Card, Alert } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Affiliate Disclosure",
  description: "How PropCompare earns commissions from affiliate links, and how that does — and doesn't — affect our content.",
};

export default function AffiliateDisclosurePage() {
  return (
    <div className="bg-slate-50 py-10">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Affiliate Disclosure" }]} />
        <Alert tone="warning" >
          <strong>Draft</strong> — requires review by qualified legal counsel for your jurisdiction.
        </Alert>
        <div className="mt-6">
          <SectionHeading kicker="Legal" title="Affiliate Disclosure" sub="Last updated: October 2026 (draft)" />
        </div>
        <Card className="p-6 sm:p-8">
          <div className="prose-custom">
            <h2>The short version</h2>
            <p>
              Some links on PropCompare are affiliate links. If you click one and then purchase a challenge,
              the prop firm may pay us a commission — typically a fixed fee or a percentage of the challenge
              fee — at <strong>no extra cost to you</strong>. The price you pay is the same as going direct.
            </p>
            <h2>How the mechanics work</h2>
            <ul>
              <li>
                <strong>Tracked redirects:</strong> buttons like “Visit firm” go through our <code>/go/[firm]</code>
                redirect, which records an anonymized click (salted IP hash, timestamp, source page) and then
                sends you to the firm&apos;s official site or our approved affiliate destination.
              </li>
              <li>
                <strong>Commission events:</strong> if you complete a qualifying purchase after clicking, the
                firm&apos;s affiliate program attributes the sale to PropCompare and pays the agreed commission.
                We don&apos;t see your payment details.
              </li>
              <li>
                <strong>Discount codes:</strong> codes listed on our discounts page may also be affiliate-linked;
                using one supports the site at no cost to you.
              </li>
            </ul>
            <h2>What commissions don&apos;t change</h2>
            <ul>
              <li>Commissions never alter verified data: rules, fees, drawdowns, and payout terms are recorded as published by the firm.</li>
              <li>“Not verified” stays “Not verified” regardless of any commercial relationship.</li>
              <li>Editorial assessments are labeled as opinion and are written independently of affiliate status.</li>
              <li>We publish profiles of firms we have no affiliate relationship with, and we don&apos;t hide that status.</li>
            </ul>
            <h2>How we mark affiliate links</h2>
            <p>
              Affiliate call-to-action buttons are accompanied by a short disclosure (“Affiliate link — we may
              earn a commission…”) near the button. This page is the full version of that disclosure.
            </p>
            <h2>Questions</h2>
            <p>
              If anything about our funding is unclear, <a href="/contact">ask us</a> — we&apos;d rather over-explain
              than leave doubt.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
