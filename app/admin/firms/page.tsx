import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin, listFirms, listProgramsAdmin } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Table, THead, TRow, TH, TCell, Badge, EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FirmsAdminPage() {
  await requireAdmin();
  const [firms, programs] = await Promise.all([listFirms(), listProgramsAdmin()]);
  const programCounts = new Map<string, number>();
  for (const p of programs) programCounts.set(p.firm_id, (programCounts.get(p.firm_id) ?? 0) + 1);

  return (
    <AdminShell>
      <AdminPageHeader
        title="Firms"
        sub={`${firms.length} firm${firms.length === 1 ? "" : "s"}`}
        actions={
          <Link
            href="/admin/firms/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            <Plus size={16} /> New firm
          </Link>
        }
      />
      {firms.length === 0 ? (
        <EmptyState title="No firms yet" body="Create your first firm to start building comparisons." />
      ) : (
        <Table>
          <THead>
            <TRow>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Status</TH>
              <TH>Affiliate</TH>
              <TH>Programs</TH>
              <TH>Updated</TH>
            </TRow>
          </THead>
          <tbody>
            {firms.map((firm) => (
              <TRow key={firm.id}>
                <TCell>
                  <Link href={`/admin/firms/${firm.id}`} className="font-semibold text-accent-dark hover:underline">
                    {firm.name}
                  </Link>
                </TCell>
                <TCell className="font-mono text-xs">{firm.slug}</TCell>
                <TCell>
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={firm.is_published ? "green" : "gray"}>
                      {firm.is_published ? "Published" : "Hidden"}
                    </Badge>
                    {firm.is_archived && <Badge tone="red">Archived</Badge>}
                  </span>
                </TCell>
                <TCell>
                  <Badge
                    tone={
                      firm.affiliate_status === "approved"
                        ? "green"
                        : firm.affiliate_status === "pending"
                          ? "amber"
                          : "gray"
                    }
                  >
                    {firm.affiliate_status}
                  </Badge>
                </TCell>
                <TCell>{programCounts.get(firm.id) ?? 0}</TCell>
                <TCell className="whitespace-nowrap">{fmtDate(firm.updated_at)}</TCell>
              </TRow>
            ))}
          </tbody>
        </Table>
      )}
    </AdminShell>
  );
}
