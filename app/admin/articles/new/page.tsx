import Link from "next/link";
import { requireAdmin, listCategories } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Card } from "@/components/ui";
import { ArticleForm } from "../article-form";

export default async function NewArticlePage() {
  await requireAdmin();
  const categories = await listCategories();
  return (
    <AdminShell>
      <AdminPageHeader
        title="New article"
        actions={
          <Link href="/admin/articles" className="text-sm font-semibold text-accent-dark hover:underline">
            ← Back to articles
          </Link>
        }
      />
      <Card className="max-w-4xl p-6">
        <ArticleForm categories={categories} />
      </Card>
    </AdminShell>
  );
}
