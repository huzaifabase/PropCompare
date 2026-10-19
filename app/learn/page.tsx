import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { getArticles } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { Container, SectionHeading, Card, EmptyState } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";
import type { Article } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Learn: Prop Trading Guides",
  description:
    "Plain-language guides to prop trading: drawdowns, profit targets, payouts, evaluation rules, and how to compare challenge fees.",
};

export default async function LearnIndexPage() {
  const articles = await getArticles();

  const groups = new Map<string, { name: string; description: string | null; articles: Article[] }>();
  for (const a of articles) {
    const slug = a.category?.slug ?? "uncategorized";
    if (!groups.has(slug)) {
      groups.set(slug, {
        name: a.category?.name ?? "Uncategorized",
        description: a.category?.description ?? null,
        articles: [],
      });
    }
    groups.get(slug)!.articles.push(a);
  }

  return (
    <div className="bg-slate-50 py-10">
      <Container>
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Learn" }]} />
        <SectionHeading
          kicker="Learn"
          title="Prop trading, explained plainly"
          sub="Guides on the rules that decide whether a challenge fits your style — written from first principles, no hype."
        />
        {articles.length === 0 ? (
          <EmptyState title="No articles published yet." body="Our research team is writing the first batch of guides." />
        ) : (
          <div className="space-y-10">
            {[...groups.values()].map((g) => (
              <section key={g.name} aria-label={g.name}>
                <h2 className="flex items-center gap-2 text-xl font-bold text-ink">
                  <BookOpen className="h-5 w-5 text-accent-dark" aria-hidden /> {g.name}
                </h2>
                {g.description && <p className="mt-1 text-sm text-muted">{g.description}</p>}
                <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {g.articles.map((a) => (
                    <Link key={a.id} href={`/learn/${a.slug}`} className="group">
                      <Card className="flex h-full flex-col p-6 transition-shadow group-hover:shadow-md">
                        <h3 className="font-bold text-ink group-hover:underline">{a.title}</h3>
                        {a.excerpt && <p className="mt-2 flex-1 text-sm text-slate-600">{a.excerpt}</p>}
                        <p className="mt-3 flex items-center justify-between text-xs text-muted">
                          <span>{a.published_at ? fmtDate(a.published_at) : "Draft"}{a.author ? ` · ${a.author}` : ""}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-accent-dark">
                            Read <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
