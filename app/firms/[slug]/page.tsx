import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, AlertTriangle, BookOpen, Tag } from "lucide-react";
import { getFirmBySlug, getProgramDetail, getArticles } from "@/lib/data";
import { fmtMoney, fmtPct, fmtDate, fmtText, fmtBool, discountStatusBadge } from "@/lib/format";
import {
  Container,
  Card,
  Badge,
  Button,
  Table,
  THead,
  TRow,
  TCell,
  TH,
  Alert,
  EmptyState,
} from "@/components/ui";
import { Breadcrumbs, AffiliateNote } from "@/components/site";
import { CopyCodeButton } from "../../copy-code-button";
import type { ProgramCategory, ProgramDetail } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // DB-driven: never access the database at build time.
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const firm = await getFirmBySlug(params.slug);
  if (!firm) return { title: "Firm not found" };
  return {
    title: `${firm.name} — Programs, Rules & Payouts`,
    description:
      firm.description ??
      `${firm.name} prop firm profile: evaluation programs, fees, drawdown rules, and payout policies.`,
  };
}

const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  one_step: "One-step",
  two_step: "Two-step",
  three_step: "Three-step",
  instant: "Instant funding",
  other: "Other",
};

function FirmMark({ name, logoUrl, size = "lg" }: { name: string; logoUrl: string | null; size?: "lg" | "sm" }) {
  const cls = size === "lg" ? "h-16 w-16 text-3xl" : "h-10 w-10 text-xl";
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${name} logo`} className={`${cls} rounded-xl object-contain`} />;
  }
  return (
    <span className={`flex ${cls} items-center justify-center rounded-xl bg-navy-900 font-extrabold text-white`} aria-hidden>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2.5 last:border-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-52 shrink-0 text-sm font-semibold text-muted">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

function SourceLinks({ urls }: { urls: (string | null)[] }) {
  const list = urls.filter((u): u is string => !!u && u.trim().length > 0);
  if (list.length === 0) return <>{fmtText(null)}</>;
  return (
    <span className="flex flex-wrap gap-2">
      {list.map((u, i) => (
        <a
          key={i}
          href={u}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-accent-dark hover:underline"
        >
          Source <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ))}
    </span>
  );
}

function ProgramSection({ detail }: { detail: ProgramDetail }) {
  const { rules, payout, sizes } = detail;
  return (
    <Card className="p-6 sm:p-8" >
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-bold text-ink">{detail.name}</h3>
        <Badge tone="blue">{CATEGORY_LABELS[detail.category]}</Badge>
        <Badge tone={detail.last_verified_at ? "green" : "gray"}>
          {detail.last_verified_at ? `Verified ${fmtDate(detail.last_verified_at)}` : "Not verified"}
        </Badge>
      </div>
      {detail.description && <p className="mt-2 text-sm text-slate-600">{detail.description}</p>}

      {/* Sizes & pricing */}
      <h4 className="mt-8 text-base font-bold text-ink">Account sizes & fees</h4>
      {sizes.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No account sizes on record — {fmtText(null)}.</p>
      ) : (
        <div className="mt-3">
          <Table>
            <THead>
              <tr><TH>Account size</TH><TH>Challenge fee</TH></tr>
            </THead>
            <tbody>
              {sizes.map((s) => (
                <TRow key={s.id}>
                  <TCell className="font-semibold text-ink">{fmtMoney(s.account_size, s.size_currency)}</TCell>
                  <TCell>{fmtMoney(s.fee, s.fee_currency)}</TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Evaluation & drawdown rules */}
      <h4 className="mt-8 text-base font-bold text-ink">Evaluation & drawdown rules</h4>
      <dl className="mt-2">
        <Row label="Phases" value={rules?.phases ?? fmtText(null)} />
        <Row label="Profit target — phase 1" value={fmtPct(rules?.profit_target_p1_pct)} />
        <Row label="Profit target — phase 2" value={fmtPct(rules?.profit_target_p2_pct)} />
        <Row label="Profit target — phase 3" value={fmtPct(rules?.profit_target_p3_pct)} />
        <Row label="Daily drawdown limit" value={fmtPct(rules?.daily_drawdown_pct)} />
        <Row label="Maximum drawdown" value={fmtPct(rules?.max_drawdown_pct)} />
        <Row
          label="Drawdown type"
          value={rules?.drawdown_type ? (rules.drawdown_type === "static" ? "Static" : "Trailing") : fmtText(null)}
        />
        <Row label="Drawdown basis" value={fmtText(rules?.drawdown_basis)} />
        <Row label="Minimum trading days" value={rules?.min_trading_days ?? fmtText(null)} />
        <Row
          label="Maximum duration"
          value={rules?.max_duration_days === null || rules?.max_duration_days === undefined ? (rules ? "Unlimited" : fmtText(null)) : `${rules.max_duration_days} days`}
        />
        <Row label="Consistency rule" value={fmtText(rules?.consistency_rule)} />
      </dl>

      {/* Platforms & instruments */}
      <h4 className="mt-8 text-base font-bold text-ink">Platforms & instruments</h4>
      <dl className="mt-2">
        <Row label="Platforms" value={detail.platforms.length > 0 ? detail.platforms.join(", ") : fmtText(null)} />
        <Row
          label="Instruments"
          value={detail.instruments.length > 0 ? detail.instruments.map((i) => i.instrument_class).join(", ") : fmtText(null)}
        />
      </dl>

      {/* Payout rules */}
      <h4 className="mt-8 text-base font-bold text-ink">Payout rules</h4>
      <dl className="mt-2">
        <Row label="Profit split" value={fmtPct(payout?.profit_split_pct)} />
        <Row label="First payout eligibility" value={fmtText(payout?.first_payout_eligibility)} />
        <Row label="Payout frequency" value={fmtText(payout?.payout_frequency)} />
        <Row label="Minimum payout" value={fmtMoney(payout?.min_payout, payout?.min_payout_currency)} />
        <Row label="Withdrawal methods" value={fmtText(payout?.withdrawal_methods)} />
        <Row label="Payout conditions" value={fmtText(payout?.payout_conditions)} />
        <Row label="Refund policy" value={fmtText(payout?.refund_policy)} />
      </dl>

      {/* Restrictions */}
      <h4 className="mt-8 text-base font-bold text-ink">Restrictions</h4>
      <dl className="mt-2">
        <Row label="News trading" value={fmtText(rules?.news_trading_rule)} />
        <Row label="Weekend holding" value={fmtText(rules?.weekend_holding_rule)} />
        <Row label="Expert advisors (EAs)" value={fmtBool(rules?.ea_allowed, { t: "Allowed", f: "Not allowed" })} />
        <Row label="Copy trading" value={fmtText(rules?.copy_trading_rule)} />
        <Row label="Prohibited strategies" value={fmtText(rules?.prohibited_strategies)} />
        <Row label="Lot / risk restrictions" value={fmtText(rules?.lot_risk_restriction)} />
      </dl>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <Row label="Sources" value={<SourceLinks urls={[rules?.source_url ?? null, payout?.source_url ?? null]} />} />
      </div>
    </Card>
  );
}

const GENERIC_FAQS: { q: string; a: string }[] = [
  {
    q: "What is a prop firm evaluation challenge?",
    a: "An evaluation challenge is a paid trial where you trade a simulated account under the firm's rules — profit targets, drawdown limits, and trading restrictions. Pass it and you may receive a funded (simulated) account with a profit split. Fail or breach a rule and the challenge ends, usually without a refund of the fee.",
  },
  {
    q: "Do I trade real money in a challenge?",
    a: "Most prop firm challenges use simulated (demo) environments, even when they're called “funded accounts.” Payouts, where offered, are typically paid by the firm from its own funds according to the payout policy. Always read the firm's terms to understand exactly what you're buying.",
  },
  {
    q: "What happens if I break a rule during the evaluation?",
    a: "Breaching a hard rule — such as the daily or maximum drawdown limit — normally ends the challenge immediately and the fee is forfeited. Soft rules (like consistency requirements) may extend the evaluation instead. The specifics vary by program, so check the rules table above and the firm's official terms.",
  },
  {
    q: "Are challenge fees refundable?",
    a: "It depends on the firm's refund policy. Some firms refund the fee after your first payout or on passing; others never refund it. See the refund policy row in the payout section above — if it says “Not verified,” confirm directly with the firm before purchasing.",
  },
  {
    q: "How should I use this profile before buying a challenge?",
    a: "Treat it as a starting point: compare the rules that matter to your style (drawdown type, news trading, weekend holding, payout terms), then verify every detail on the firm's official website, since terms change frequently. Nothing here is financial advice.",
  },
];

export default async function FirmDetailPage({ params }: { params: { slug: string } }) {
  const firm = await getFirmBySlug(params.slug);
  if (!firm) notFound();

  const programDetails: ProgramDetail[] = [];
  for (const p of firm.programs) {
    const d = await getProgramDetail(p.id);
    if (d) programDetails.push(d);
  }
  const articles = (await getArticles()).slice(0, 3);

  return (
    <div className="bg-slate-50 py-10">
      <Container>
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/firms", label: "Prop Firms" }, { label: firm.name }]} />

        {/* Header */}
        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <FirmMark name={firm.name} logoUrl={firm.logo_url} />
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{firm.name}</h1>
              {firm.tagline && <p className="mt-1 text-sm font-medium text-muted">{firm.tagline}</p>}
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">{fmtText(firm.description)}</p>
              <p className="mt-3 text-xs text-muted">
                Last verified: {firm.last_verified_at ? fmtDate(firm.last_verified_at) : "Not verified"}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a href={firm.official_website} target="_blank" rel="nofollow noopener noreferrer">
                  <Button variant="secondary" size="sm">
                    Official website <ExternalLink className="h-4 w-4" aria-hidden />
                  </Button>
                </a>
                <Link href={`/go/${firm.slug}`}>
                  <Button size="sm">Visit {firm.name} <ExternalLink className="h-4 w-4" aria-hidden /></Button>
                </Link>
              </div>
              <AffiliateNote className="mt-2" />
            </div>
          </div>
        </Card>

        {/* Programs */}
        <h2 className="mt-10 text-xl font-bold text-ink">Programs</h2>
        {programDetails.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No programs published yet."
              body="Program data for this firm is still being researched — every field will be labeled “Not verified” until confirmed."
            />
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {programDetails.map((d) => (
              <ProgramSection key={d.id} detail={d} />
            ))}
          </div>
        )}

        {/* Discounts */}
        {firm.discounts.length > 0 && (
          <section className="mt-10" aria-labelledby="firm-discounts">
            <h2 id="firm-discounts" className="flex items-center gap-2 text-xl font-bold text-ink">
              <Tag className="h-5 w-5 text-accent-dark" aria-hidden /> Active discounts
            </h2>
            <div className="mt-4 grid gap-5 md:grid-cols-2">
              {firm.discounts.map((d) => {
                const badge = discountStatusBadge(d.status);
                return (
                  <Card key={d.id} className="p-6">
                    <div className="flex items-center justify-between gap-2">
                      <code className="rounded bg-slate-100 px-2 py-1 font-mono text-sm font-bold text-ink">{d.code}</code>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted">
                      {d.discount_pct !== null && d.discount_pct !== undefined
                        ? `${fmtPct(d.discount_pct)} off`
                        : d.discount_fixed !== null && d.discount_fixed !== undefined
                          ? `${fmtMoney(d.discount_fixed, d.currency)} off`
                          : "See terms"}
                      {d.applicable_programs ? ` · ${d.applicable_programs}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {d.expires_at ? `Expires ${fmtDate(d.expires_at)}` : "No expiry date listed"} · {fmtText(d.terms)}
                    </p>
                    <div className="mt-4 flex items-center gap-3">
                      <CopyCodeButton code={d.code} />
                      <Link href={`/go/${firm.slug}`}>
                        <Button size="sm">Use this offer</Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
            <AffiliateNote className="mt-3" />
          </section>
        )}

        {/* Editorial assessment */}
        <section className="mt-10" aria-labelledby="editorial-assessment">
          <h2 id="editorial-assessment" className="text-xl font-bold text-ink">Editorial assessment</h2>
          <Alert tone="info" >
            <p className="font-semibold">Editorial opinion — not verified data.</p>
            <p className="mt-1">Our editorial team is still evaluating this firm — no assessment published yet.</p>
          </Alert>
        </section>

        {/* Related learning */}
        {articles.length > 0 && (
          <section className="mt-10" aria-labelledby="related-learn">
            <h2 id="related-learn" className="text-xl font-bold text-ink">Learn the rules before you pay</h2>
            <div className="mt-4 grid gap-5 md:grid-cols-3">
              {articles.map((a) => (
                <Link key={a.id} href={`/learn/${a.slug}`} className="group">
                  <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-md">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent-dark">
                      <BookOpen className="h-4 w-4" aria-hidden /> {a.category?.name ?? "Guide"}
                    </p>
                    <h3 className="mt-2 font-bold text-ink group-hover:underline">{a.title}</h3>
                    {a.excerpt && <p className="mt-2 flex-1 text-sm text-slate-600">{a.excerpt}</p>}
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="mt-10" aria-labelledby="firm-faq">
          <h2 id="firm-faq" className="text-xl font-bold text-ink">Frequently asked questions</h2>
          <div className="mt-4 space-y-3">
            {GENERIC_FAQS.map((f) => (
              <details key={f.q} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                <summary className="cursor-pointer font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {f.q}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Risk disclaimer */}
        <div className="mt-10">
          <Alert tone="warning">
            <p className="flex items-start gap-2 font-semibold">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Risk warning
            </p>
            <p className="mt-1">
              Trading involves substantial risk of loss. Challenge fees are typically non-refundable if you breach
              the rules, and most traders do not pass evaluations. Firm terms change frequently — verify everything
              on the official website before purchasing. Nothing on this page is financial advice.{" "}
              <Link href="/risk-disclaimer" className="underline">Read the full risk disclaimer</Link>.
            </p>
          </Alert>
        </div>
      </Container>
    </div>
  );
}
