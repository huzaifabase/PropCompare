import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin, listArticles } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Table, THead, TRow, TH, TCell, Badge, EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { ArticlePublishToggle } from "./article-form";

export const dynamic = "force-dynamic";

export default async function ArticlesAdminPage() {
  await requireAdmin();
  const articles = await listArticles();

  return (
    <AdminShell>
      <AdminPageHeader
        title="Articles"
        sub={`${articles.length} article${articles.length === 1 ? "" : "s"}`}
        actions={
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            <Plus size={16} /> New article
          </Link>
        }
      />
      {articles.length === 0 ? (
        <EmptyState title="No articles yet" body="Write your first learn article to grow organic traffic." />
      ) : (
        <Table>
          <THead>
            <TRow>
              <TH>Title</TH>
              <TH>Category</TH>
              <TH>Status</TH>
              <TH>Updated</TH>
              <TH><span className="sr-only">Actions</span></TH>
            </TRow>
          </THead>
          <tbody>
            {articles.map((a) => (
              <TRow key={a.id}>
                <TCell>
                  <Link href={`/admin/articles/${a.id}`} className="font-semibold text-accent-dark hover:underline">
                    {a.title}
                  </Link>
                  <span className="ml-2 font-mono text-xs text-muted">{a.slug}</span>
                </TCell>
                <TCell>{a.category?.name ?? "—"}</TCell>
                <TCell>
                  <Badge tone={a.status === "published" ? "green" : "gray"}>{a.status}</Badge>
                </TCell>
                <TCell className="whitespace-nowrap">{fmtDate(a.updated_at)}</TCell>
                <TCell className="whitespace-nowrap text-right">
                  <ArticlePublishToggle id={a.id} published={a.status === "published"} />
                </TCell>
              </TRow>
            ))}
          </tbody>
        </Table>
      )}
    </AdminShell>
  );
}
