import { requireAdmin, listAuditLogs } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Table, THead, TRow, TH, TCell, Badge, EmptyState, Pagination } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AuditAdminPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  await requireAdmin();
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const { logs, total, totalPages } = await listAuditLogs(page, 25);

  return (
    <AdminShell>
      <AdminPageHeader
        title="Audit log"
        sub={`${total} entr${total === 1 ? "y" : "ies"} · every admin mutation is recorded here`}
      />
      {logs.length === 0 ? (
        <EmptyState title="No audit entries yet" />
      ) : (
        <>
          <Table>
            <THead>
              <TRow>
                <TH>Time</TH>
                <TH>Admin</TH>
                <TH>Action</TH>
                <TH>Table</TH>
                <TH>Record</TH>
                <TH>Details</TH>
              </TRow>
            </THead>
            <tbody>
              {logs.map((log) => (
                <TRow key={log.id}>
                  <TCell className="whitespace-nowrap">{fmtDate(log.created_at)}</TCell>
                  <TCell className="max-w-[220px] truncate">{log.admin_email ?? "—"}</TCell>
                  <TCell>
                    <Badge
                      tone={
                        log.action === "delete"
                          ? "red"
                          : log.action === "create"
                            ? "green"
                            : log.action === "export"
                              ? "navy"
                              : "blue"
                      }
                    >
                      {log.action}
                    </Badge>
                  </TCell>
                  <TCell className="font-mono text-xs">{log.table_name ?? "—"}</TCell>
                  <TCell className="max-w-[140px] truncate font-mono text-xs">
                    {log.record_id ? log.record_id.slice(0, 8) : "—"}
                  </TCell>
                  <TCell className="max-w-[280px] truncate font-mono text-xs text-muted">
                    {log.details ? JSON.stringify(log.details).slice(0, 120) : "—"}
                  </TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} totalPages={totalPages} href={(p) => `/admin/audit?page=${p}`} />
        </>
      )}
    </AdminShell>
  );
}
