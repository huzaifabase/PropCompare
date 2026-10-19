import type { Metadata } from "next";
import Link from "next/link";
import { FileSearch, ListChecks, ShieldCheck, RefreshCw, ArrowRight } from "lucide-react";
import { getArticles } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { Container, SectionHeading, Card, Button, EmptyState, Alert } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prop Firm Reviews",
  description:
    "Independent, methodology-driven reviews of prop trading firms. Opinions are always labeled as editorial.",
};

export default async function ReviewsPage() {
  const articles = await getArticles();
  const reviews = articles.filter((a) => a.category?.slug === "reviews");

  return (
    <div className="bg-slate-50 py-10">
      <Container>
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Reviews" }]} />
        <SectionHeading
          kicker="Editorial"
          title="Prop firm reviews"
          sub="Independent assessments — clearly labeled as opinion, built on verified data."
        />

        <Card className="p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <FileSearch className="h-5 w-5 text-accent-dark" aria-hidden /> How we review a prop firm
          </h2>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <div>
              <p className="flex items-center gap-2 font-semibold text-ink">
                <ListChecks className="h-4 w-4 text-accent-dark" aria-hidden /> 1. Data first
              </p>
              <p className="mt-1 text-sm text-slate-600">
                We collect the firm&apos;s rules, fees, and payout terms from official sources before forming any
                opinion. Every factual claim links to its source.
              </p>
            </div>
            <div>
              <p className="flex items-center gap-2 font-semibold text-ink">
                <ShieldCheck className="h-4 w-4 text-accent-dark" aria-hidden /> 2. Trader&apos;s lens
              </p>
              <p className="mt-1 text-sm text-slate-600">
                We assess what the rules mean in practice: which trading styles fit, where the hidden traps are
                (news rules, consistency clauses, payout conditions), and who should probably look elsewhere.
              </p>
            </div>
            <div>
              <p className="flex items-center gap-2 font-semibold text-ink">
                <RefreshCw className="h-4 w-4 text-accent-dark" aria-hidden /> 3. Re-verified
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Firms change terms often, so reviews carry a last-verified date and are re-checked on a regular
                cadence. Outdated findings are corrected or the review is withdrawn.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Alert tone="info">
              <p>
                <strong>What we won&apos;t do:</strong> we never invent ratings, scores, trader counts, or testimonials.
                If a review isn&apos;t published yet, you&apos;ll see that stated plainly — not a placeholder score.
              </p>
            </Alert>
          </div>
        </Card>

        <h2 className="mt-10 text-xl font-bold text-ink">Published reviews</h2>
        {reviews.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No reviews published yet."
              body="Our first methodology-driven reviews are in the works. Meanwhile, the firm profiles and learn guides are a good place to start."
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/firms"><Button variant="secondary" size="sm">Browse firm profiles <ArrowRight className="h-4 w-4" aria-hidden /></Button></Link>
              <Link href="/learn"><Button variant="ghost" size="sm">Read the guides</Button></Link>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((a) => (
              <Link key={a.id} href={`/learn/${a.slug}`} className="group">
                <Card className="flex h-full flex-col p-6 transition-shadow group-hover:shadow-md">
                  <h3 className="font-bold text-ink group-hover:underline">{a.title}</h3>
                  {a.excerpt && <p className="mt-2 flex-1 text-sm text-slate-600">{a.excerpt}</p>}
                  <p className="mt-3 text-xs text-muted">
                    {a.published_at ? fmtDate(a.published_at) : "Unpublished date"}
                    {a.author ? ` · ${a.author}` : ""}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
