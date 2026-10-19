import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin, listFirms, listProgramsAdmin } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Table, THead, TRow, TH, TCell, Badge, EmptyState, Card } from "@/components/ui";
import { cx } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProgramsAdminPage({
  searchParams,
}: {
  searchParams?: { firm?: string };
}) {
  await requireAdmin();
  const firmFilter = searchParams?.firm || undefined;
  const [firms, programs] = await Promise.all([listFirms(), listProgramsAdmin(firmFilter)]);

  const visibleFirms = firmFilter ? firms.filter((f) => f.id === firmFilter) : firms;
  const byFirm = new Map<string, typeof programs>();
  for (const p of programs) {
    const arr = byFirm.get(p.firm_id) ?? [];
    arr.push(p);
    byFirm.set(p.firm_id, arr);
  }

  return (
    <AdminShell>
      <AdminPageHeader
        title="Programs"
        sub={`${programs.length} program${programs.length === 1 ? "" : "s"}`}
        actions={
          <Link
            href="/admin/programs/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            <Plus size={16} /> New program
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <FilterLink href="/admin/programs" active={!firmFilter} label="All firms" />
        {firms.map((f) => (
          <FilterLink key={f.id} href={`/admin/programs?firm=${f.id}`} active={firmFilter === f.id} label={f.name} />
        ))}
      </div>

      {visibleFirms.length === 0 || programs.length === 0 ? (
        <EmptyState title="No programs found" body="Create a program to start adding sizes, rules and payouts." />
      ) : (
        <div className="space-y-6">
          {visibleFirms.map((firm) => {
            const rows = byFirm.get(firm.id) ?? [];
            if (rows.length === 0) return null;
            return (
              <Card key={firm.id} className="p-6">
                <h2 className="mb-4 text-base font-bold text-ink">
                  {firm.name}{" "}
                  <span className="ml-1 text-sm font-medium text-muted">
                    ({rows.length} program{rows.length === 1 ? "" : "s"})
                  </span>
                </h2>
                <Table>
                  <THead>
                    <TRow>
                      <TH>Name</TH>
                      <TH>Category</TH>
                      <TH>Status</TH>
                      <TH>Sort</TH>
                      <TH><span className="sr-only">Actions</span></TH>
                    </TRow>
                  </THead>
                  <tbody>
                    {rows.map((p) => (
                      <TRow key={p.id}>
                        <TCell>
                          <span className="font-semibold text-ink">{p.name}</span>
                          <span className="ml-2 font-mono text-xs text-muted">{p.slug}</span>
                        </TCell>
                        <TCell>
                          <Badge tone="navy">{p.category.replace("_", "-")}</Badge>
                        </TCell>
                        <TCell>
                          <span className="flex flex-wrap gap-1">
                            <Badge tone={p.is_published ? "green" : "gray"}>
                              {p.is_published ? "Published" : "Hidden"}
                            </Badge>
                            {p.is_archived && <Badge tone="red">Archived</Badge>}
                          </span>
                        </TCell>
                        <TCell>{p.sort_order}</TCell>
                        <TCell className="whitespace-nowrap text-right">
                          <Link
                            href={`/admin/programs/${p.id}`}
                            className="text-sm font-semibold text-accent-dark hover:underline"
                          >
                            Open editor →
                          </Link>
                        </TCell>
                      </TRow>
                    ))}
                  </tbody>
                </Table>
              </Card>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

function FilterLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "rounded-full px-3 py-1.5 text-xs font-semibold",
        active ? "bg-navy-900 text-white" : "bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50"
      )}
    >
      {label}
    </Link>
  );
}
