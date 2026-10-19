import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarDays, User } from "lucide-react";
import { getArticleBySlug, getArticles } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { Container, Card } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";
import { mdToHtml } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  // DB-driven: never access the database at build time.
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.meta_title || article.title,
    description: article.meta_description || article.excerpt || undefined,
  };
}

/* ------------------------------- page ---------------------------------- */

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticleBySlug(params.slug);
  if (!article) notFound();

  const all = await getArticles();
  const related = all
    .filter((a) => a.id !== article.id && a.category?.slug === article.category?.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.meta_description || article.excerpt || undefined,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || undefined,
    author: article.author ? { "@type": "Person", name: article.author } : undefined,
    mainEntityOfPage: `/learn/${article.slug}`,
  };

  return (
    <div className="bg-slate-50 py-10">
      <Container className="max-w-3xl">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Breadcrumbs
          items={[
            { href: "/", label: "Home" },
            { href: "/learn", label: "Learn" },
            { label: article.title },
          ]}
        />
        <article>
          <p className="text-xs font-bold uppercase tracking-widest text-accent-dark">
            {article.category?.name ?? "Guide"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{article.title}</h1>
          {article.excerpt && <p className="mt-3 text-lg text-slate-600">{article.excerpt}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
            {article.author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-4 w-4" aria-hidden /> {article.author}
              </span>
            )}
            {article.published_at && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden /> {fmtDate(article.published_at)}
              </span>
            )}
          </div>
          <div
            className="prose-custom mt-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8"
            dangerouslySetInnerHTML={{ __html: mdToHtml(article.content_md) }}
          />
        </article>

        {related.length > 0 && (
          <section className="mt-10" aria-labelledby="related-articles">
            <h2 id="related-articles" className="text-xl font-bold text-ink">Related articles</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <Link key={a.id} href={`/learn/${a.slug}`} className="group">
                  <Card className="flex h-full flex-col p-5 transition-shadow group-hover:shadow-md">
                    <h3 className="font-bold text-ink group-hover:underline">{a.title}</h3>
                    {a.excerpt && <p className="mt-2 flex-1 text-sm text-slate-600">{a.excerpt}</p>}
                    <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-accent-dark">
                      Read <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10">
          <Link href="/learn" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-dark hover:underline">
            <ArrowRight className="h-4 w-4 rotate-180" aria-hidden /> Back to all articles
          </Link>
        </div>
      </Container>
    </div>
  );
}
