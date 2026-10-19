import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, getArticle, listCategories } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Card, Badge } from "@/components/ui";
import { ArticleForm, ArticlePublishToggle, ArticleDangerZone } from "../article-form";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const article = await getArticle(params.id);
  if (!article) notFound();
  const categories = await listCategories();

  return (
    <AdminShell>
      <AdminPageHeader
        title={article.title}
        sub={`/${article.slug}`}
        actions={
          <span className="flex items-center gap-2">
            <Badge tone={article.status === "published" ? "green" : "gray"}>{article.status}</Badge>
            <ArticlePublishToggle id={article.id} published={article.status === "published"} />
            <Link href="/admin/articles" className="text-sm font-semibold text-accent-dark hover:underline">
              ← Back
            </Link>
          </span>
        }
      />
      <Card className="max-w-4xl p-6">
        <ArticleForm initial={article} categories={categories} />
      </Card>
      <ArticleDangerZone id={article.id} title={article.title} />
    </AdminShell>
  );
}
