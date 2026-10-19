import type { Metadata } from "next";
import { Container, SectionHeading, Card, Alert } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How PropCompare collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="bg-slate-50 py-10">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Privacy Policy" }]} />
        <Alert tone="warning" >
          <strong>Draft</strong> — requires review by qualified legal counsel for your jurisdiction.
        </Alert>
        <div className="mt-6">
          <SectionHeading kicker="Legal" title="Privacy Policy" sub="Last updated: October 2026 (draft)" />
        </div>
        <Card className="p-6 sm:p-8">
          <div className="prose-custom">
            <h2>1. What we collect</h2>
            <p>PropCompare collects the minimum data needed to run the service:</p>
            <ul>
              <li><strong>Newsletter signup:</strong> your email address and consent record, only if you subscribe.</li>
              <li><strong>Contact form:</strong> the name, email, subject, and message you submit.</li>
              <li><strong>Affiliate click logs:</strong> when you follow an outgoing firm link, we log an anonymized record (timestamp, destination, source page, and a salted hash of your IP address — never the raw IP) to measure link performance.</li>
              <li><strong>Basic analytics:</strong> aggregated, non-identifying usage statistics.</li>
            </ul>
            <h2>2. What we don&apos;t collect</h2>
            <p>
              We don&apos;t ask for trading account credentials, financial records, or identification documents.
              We don&apos;t sell personal data, and we don&apos;t share it with advertisers or data brokers.
            </p>
            <h2>3. How we use data</h2>
            <ul>
              <li>To send newsletter emails you explicitly consented to (unsubscribe anytime).</li>
              <li>To respond to contact submissions and correct site data.</li>
              <li>To operate and secure the service, including abuse prevention and rate limiting.</li>
            </ul>
            <h2>4. Storage and security</h2>
            <p>
              Data is stored in our hosted database with access limited to authorized administrators.
              IP addresses are stored only as salted SHA-256 hashes. No system is perfectly secure, but we
              apply industry-standard safeguards and limit retention to what&apos;s operationally necessary.
            </p>
            <h2>5. Cookies</h2>
            <p>
              We use strictly necessary cookies for session and security purposes (for example, the admin
              sign-in). We don&apos;t use third-party advertising or cross-site tracking cookies.
            </p>
            <h2>6. Your rights</h2>
            <p>
              Depending on your jurisdiction, you may have the right to access, correct, or delete your
              personal data, and to withdraw newsletter consent at any time. Contact us via the{" "}
              <a href="/contact">contact page</a> to exercise these rights.
            </p>
            <h2>7. Changes</h2>
            <p>
              If this policy changes materially, we&apos;ll update the “last updated” date above. Continued use of
              the site after changes constitutes acceptance of the revised policy.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
