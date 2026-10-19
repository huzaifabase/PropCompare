import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { Container, SectionHeading, Card, Alert } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Risk Disclaimer",
  description: "Trading risk warning: challenge fees, evaluation failure rates, and why nothing here is financial advice.",
};

export default function RiskDisclaimerPage() {
  return (
    <div className="bg-slate-50 py-10">
      <Container className="max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Risk Disclaimer" }]} />
        <Alert tone="warning" >
          <strong>Draft</strong> — requires review by qualified legal counsel for your jurisdiction.
        </Alert>
        <div className="mt-6">
          <SectionHeading kicker="Legal" title="Risk Disclaimer" sub="Read this before buying any challenge." />
        </div>
        <Card className="p-6 sm:p-8">
          <Alert tone="error" >
            <p className="flex items-start gap-2 font-semibold">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              Trading involves substantial risk of loss and is not suitable for everyone.
            </p>
          </Alert>
          <div className="prose-custom mt-4">
            <h2>Challenge fees are at risk</h2>
            <p>
              Evaluation challenge fees are typically <strong>non-refundable</strong> if you breach the rules
              or fail to meet the profit target. Treat the fee as money you are prepared to lose in full.
              Never pay for a challenge with money you can&apos;t afford to lose, and never borrow to fund one.
            </p>
            <h2>Most traders don&apos;t pass</h2>
            <p>
              Passing an evaluation is genuinely hard: strict drawdown limits, profit targets on a deadline,
              and consistency rules eliminate most attempts. Assume you will need multiple attempts — and
              budget accordingly — or reconsider whether a challenge fits your current skill level.
            </p>
            <h2>Simulated environments</h2>
            <p>
              Most prop firm challenges and “funded accounts” operate in simulated environments. Payouts, where
              offered, depend on the firm&apos;s payout policy and the firm&apos;s continued operation — they are not
              guaranteed income.
            </p>
            <h2>Firms and terms change</h2>
            <p>
              Prop firms revise rules, fees, and payout terms frequently, and firms can and do shut down.
              Verify every material term on the firm&apos;s official website immediately before purchasing, and be
              cautious with firms that lack a verifiable track record.
            </p>
            <h2>Not financial advice</h2>
            <p>
              Nothing on PropCompare — comparisons, guides, reviews, or editorial assessments — is financial,
              investment, or trading advice. We don&apos;t know your circumstances and we&apos;re not licensed to advise
              you. Consider speaking with a qualified professional before making financial decisions.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
}
