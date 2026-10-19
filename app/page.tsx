import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck, RefreshCw, Handshake, Search, Tag, BookOpen, Percent } from "lucide-react";
import { getFirms, getActiveDiscounts, getAllProgramRows, getArticles } from "@/lib/data";
import { fmtMoney, fmtPct, fmtDate, fmtText, discountStatusBadge, cx } from "@/lib/format";
import {
  Container,
  SectionHeading,
  Card,
  Badge,
  Button,
  Select,
  Table,
  THead,
  TRow,
  TCell,
  TH,
  EmptyState,
  Field,
} from "@/components/ui";
import { NewsletterSection, AffiliateNote } from "@/components/site";
import { CopyCodeButton } from "./copy-code-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Compare Prop Firms: Challenges, Fees & Payouts",
  description:
    "Compare prop trading firm challenges side by side: evaluation rules, account sizes, fees, drawdowns, and payout policies — researched from official sources.",
};

function FirmMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={`${name} logo`} className="h-12 w-12 rounded-lg object-contain" loading="lazy" />;
  }
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-900 text-xl font-extrabold text-white" aria-hidden>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

const ACCOUNT_SIZES = [
  { value: "5000", label: "$5k" },
  { value: "10000", label: "$10k" },
  { value: "25000", label: "$25k" },
  { value: "50000", label: "$50k" },
  { value: "100000", label: "$100k" },
  { value: "200000", label: "$200k" },
];

const PLATFORMS = ["MT4", "MT5", "cTrader", "DXtrade", "TradeLocker", "MatchTrader"];

const CATEGORIES = [
  { value: "one_step", label: "One-step" },
  { value: "two_step", label: "Two-step" },
  { value: "three_step", label: "Three-step" },
  { value: "instant", label: "Instant funding" },
  { value: "other", label: "Other" },
];

function discountLabel(d: { discount_pct: number | null; discount_fixed: number | null; currency: string | null }): string {
  if (d.discount_pct !== null && d.discount_pct !== undefined) return fmtPct(d.discount_pct);
  if (d.discount_fixed !== null && d.discount_fixed !== undefined) return fmtMoney(d.discount_fixed, d.currency);
  return "See terms";
}

export default async function HomePage() {
  const [firms, discounts, rows, articles] = await Promise.all([
    getFirms(),
    getActiveDiscounts(),
    getAllProgramRows(),
    getArticles(),
  ]);
  const previewRows = rows.slice(0, 4);

  return (
    <>
      {/* 2) Hero */}
      <section className="bg-navy-950 py-16 sm:py-24" aria-labelledby="hero-heading">
        <Container className="max-w-3xl text-center">
          <h1 id="hero-heading" className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Find the Right Prop Firm for Your Trading Style
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">
            Compare trading challenges, evaluation rules, account sizes, fees, and payout policies in one place.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/compare">
              <Button size="lg">
                Compare Prop Firms <ArrowRight className="h-5 w-5" aria-hidden />
              </Button>
            </Link>
            <Link href="/discounts">
              <Button size="lg" variant="secondary" className="border border-white/20">
                <Tag className="h-5 w-5" aria-hidden /> Explore Discounts
              </Button>
            </Link>
          </div>
          <ul className="mx-auto mt-10 flex max-w-xl flex-col items-center justify-center gap-2 text-sm text-slate-300 sm:flex-row sm:gap-6">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" aria-hidden /> Data from official sources</li>
            <li className="flex items-center gap-2"><RefreshCw className="h-4 w-4 text-accent" aria-hidden /> Re-verified regularly</li>
            <li className="flex items-center gap-2"><Tag className="h-4 w-4 text-accent" aria-hidden /> Verified discounts only</li>
          </ul>
        </Container>
      </section>

      {/* 3) Quick comparison search */}
      <section className="bg-white py-12" aria-labelledby="quick-search-heading">
        <Container>
          <Card className="p-6 sm:p-8">
            <h2 id="quick-search-heading" className="flex items-center gap-2 text-xl font-bold text-ink">
              <Search className="h-5 w-5 text-accent-dark" aria-hidden /> Quick comparison search
            </h2>
            <p className="mt-1 text-sm text-muted">Pick a few filters and jump straight into the comparison table.</p>
            <form method="get" action="/compare" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Account size" htmlFor="qs-size">
                <Select id="qs-size" name="size" defaultValue="">
                  <option value="">Any size</option>
                  {ACCOUNT_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Max fee (USD)" htmlFor="qs-fee">
                <Select id="qs-fee" name="maxFee" defaultValue="">
                  <option value="">No limit</option>
                  <option value="100">Up to $100</option>
                  <option value="250">Up to $250</option>
                  <option value="500">Up to $500</option>
                  <option value="1000">Up to $1,000</option>
                </Select>
              </Field>
              <Field label="Platform" htmlFor="qs-platform">
                <Select id="qs-platform" name="platform" defaultValue="">
                  <option value="">Any platform</option>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Evaluation type" htmlFor="qs-category">
                <Select id="qs-category" name="category" defaultValue="">
                  <option value="">Any type</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end">
                <Button type="submit" className="w-full lg:w-auto">Search challenges</Button>
              </div>
            </form>
          </Card>
        </Container>
      </section>

      {/* 4) Featured firms */}
      <section className="bg-slate-50 py-14" aria-labelledby="firms-heading">
        <Container>
          <SectionHeading
            kicker="Featured firms"
            title="Prop firms we're tracking"
            sub="Profiles built from official documentation. Anything we haven't confirmed is labeled “Not verified”."
          />
          {firms.length === 0 ? (
            <EmptyState title="No firms published yet." body="Firm profiles are being researched — check back soon." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {firms.slice(0, 6).map((f) => (
                <Card key={f.id} className="flex flex-col p-6">
                  <div className="flex items-center gap-3">
                    <FirmMark name={f.name} logoUrl={f.logo_url} />
                    <div>
                      <h3 className="font-bold text-ink">{f.name}</h3>
                      {f.tagline && <p className="text-xs text-muted">{f.tagline}</p>}
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-sm text-slate-600">{fmtText(f.description)}</p>
                  <p className="mt-3 text-xs text-muted">
                    Last verified: {f.last_verified_at ? fmtDate(f.last_verified_at) : "Not verified"}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/firms/${f.slug}`}><Button size="sm" variant="secondary">View profile</Button></Link>
                    <Link href={`/compare?firms=${encodeURIComponent(f.slug)}`}><Button size="sm" variant="ghost">Compare</Button></Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* 5) Featured comparison preview */}
      <section className="bg-white py-14" aria-labelledby="preview-heading">
        <Container>
          <SectionHeading
            kicker="Comparison preview"
            title="A taste of the full comparison table"
            sub="Real fields, side by side. Open the full table to filter, sort, and compare up to four programs."
          />
          {previewRows.length === 0 ? (
            <EmptyState title="Program data is being verified." body="Our team is collecting challenge data — the full table will appear here soon." />
          ) : (
            <>
              <Table>
                <THead>
                  <tr><TH>Program</TH><TH>Firm</TH><TH>Account size</TH><TH>Fee</TH><TH>Profit target</TH><TH>Daily drawdown</TH><TH>Profit split</TH></tr>
                </THead>
                <tbody>
                  {previewRows.map((r) => (
                    <TRow key={`${r.program.id}-${r.size.id}`}>
                      <TCell className="font-semibold text-ink">{r.program.name}</TCell>
                      <TCell>{r.firm.name}</TCell>
                      <TCell>{fmtMoney(r.size.account_size, r.size.size_currency)}</TCell>
                      <TCell>{fmtMoney(r.size.fee, r.size.fee_currency)}</TCell>
                      <TCell>{fmtPct(r.rules?.profit_target_p1_pct)}</TCell>
                      <TCell>{fmtPct(r.rules?.daily_drawdown_pct)}</TCell>
                      <TCell>{fmtPct(r.payout?.profit_split_pct)}</TCell>
                    </TRow>
                  ))}
                </tbody>
              </Table>
              <div className="mt-6">
                <Link href="/compare">
                  <Button>Open full comparison <ArrowRight className="h-4 w-4" aria-hidden /></Button>
                </Link>
              </div>
            </>
          )}
        </Container>
      </section>

      {/* 6) Popular challenge sizes */}
      <section className="bg-slate-50 py-14" aria-labelledby="sizes-heading">
        <Container>
          <SectionHeading
            kicker="Challenge finder"
            title="Browse by popular challenge size"
            sub="Pick an account size to see matching challenges and why each one fits."
          />
          <div className="flex flex-wrap gap-3">
            {ACCOUNT_SIZES.map((s) => (
              <Link
                key={s.value}
                href={`/challenge-finder?size=${s.value}`}
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {s.label} challenges
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* 7) Latest verified discounts */}
      <section className="bg-white py-14" aria-labelledby="discounts-heading">
        <Container>
          <SectionHeading
            kicker="Discounts"
            title="Latest verified discounts"
            sub="Codes we could confirm with a source. Copy one and apply it at checkout."
          />
          {discounts.length === 0 ? (
            <EmptyState title="No active discounts right now." body="We only list offers we can verify — new ones appear here first." />
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {discounts.slice(0, 3).map((d) => {
                const badge = discountStatusBadge(d.status);
                return (
                  <Card key={d.id} className="flex flex-col p-6">
                    <div className="flex items-center justify-between">
                      <Link href={`/firms/${d.firm.slug}`} className="font-bold text-ink hover:underline">{d.firm.name}</Link>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                    <p className="mt-2 flex items-center gap-1.5 text-2xl font-extrabold text-accent-dark">
                      <Percent className="h-5 w-5" aria-hidden /> {discountLabel(d)}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <code className="truncate font-mono text-sm font-bold text-ink">{d.code}</code>
                      <CopyCodeButton code={d.code} />
                    </div>
                    <p className="mt-3 flex-1 text-xs text-muted">
                      {d.expires_at ? `Expires ${fmtDate(d.expires_at)}` : "No expiry date listed"} · {fmtText(d.terms)}
                    </p>
                    <Link href={`/discounts`} className="mt-4 text-sm font-semibold text-accent-dark hover:underline">
                      View all discounts
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      {/* 8) Educational resources */}
      <section className="bg-slate-50 py-14" aria-labelledby="learn-heading">
        <Container>
          <SectionHeading
            kicker="Learn"
            title="Understand prop trading before you pay"
            sub="Plain-language guides on drawdowns, profit targets, payouts, and the rules that end most evaluations."
          />
          {articles.length === 0 ? (
            <EmptyState title="Guides are on the way." body="Our research team is writing the first batch of explainers." />
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {articles.slice(0, 3).map((a) => (
                <Link key={a.id} href={`/learn/${a.slug}`} className="group">
                  <Card className="flex h-full flex-col p-6 transition-shadow group-hover:shadow-md">
                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent-dark">
                      <BookOpen className="h-4 w-4" aria-hidden /> {a.category?.name ?? "Guide"}
                    </p>
                    <h3 className="mt-2 font-bold text-ink group-hover:underline">{a.title}</h3>
                    {a.excerpt && <p className="mt-2 flex-1 text-sm text-slate-600">{a.excerpt}</p>}
                    <p className={cx("text-sm font-semibold text-accent-dark", a.excerpt ? "mt-4" : "mt-2")}>Read article</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          <div className="mt-6">
            <Link href="/learn"><Button variant="secondary">Browse all articles <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link>
          </div>
        </Container>
      </section>

      {/* 9) Trust section */}
      <section className="bg-white py-14" aria-labelledby="trust-heading">
        <Container>
          <SectionHeading
            kicker="Why trust PropCompare"
            title="Research first, opinions labeled"
            sub="We're an independent comparison platform — not a prop firm, and we never sell funded accounts."
          />
          <div className="grid gap-5 md:grid-cols-3">
            <Card className="p-6">
              <ShieldCheck className="h-8 w-8 text-accent-dark" aria-hidden />
              <h3 className="mt-3 font-bold text-ink">How we research</h3>
              <p className="mt-2 text-sm text-slate-600">
                Every field starts from the firm&apos;s official documentation, linked as a source on each profile.
                Anything we can&apos;t confirm is shown as “Not verified” — never filled in with a guess.
              </p>
            </Card>
            <Card className="p-6">
              <RefreshCw className="h-8 w-8 text-accent-dark" aria-hidden />
              <h3 className="mt-3 font-bold text-ink">Verification cadence</h3>
              <p className="mt-2 text-sm text-slate-600">
                Firm data is re-checked on a regular cadence and every profile shows its last-verified date.
                Firms change terms often — always confirm on the official site before you buy.
              </p>
            </Card>
            <Card className="p-6">
              <Handshake className="h-8 w-8 text-accent-dark" aria-hidden />
              <h3 className="mt-3 font-bold text-ink">How we&apos;re funded</h3>
              <p className="mt-2 text-sm text-slate-600">
                Some outgoing links are affiliate links: if you purchase through them we may earn a commission
                at no extra cost to you. It never changes the underlying data.{" "}
                <Link href="/affiliate-disclosure" className="font-semibold text-accent-dark hover:underline">Full disclosure</Link>
              </p>
            </Card>
          </div>
          <div className="mt-8"><AffiliateNote /></div>
        </Container>
      </section>

      {/* 10) Newsletter */}
      <NewsletterSection />
    </>
  );
}
