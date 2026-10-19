import Link from "next/link";
import { requireAdmin, getDashboardStats } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Stat, Card, Table, THead, TRow, TH, TCell, Badge, EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();
  const stats = await getDashboardStats();
  const v = stats.verification;
  const queueTotal = v.firms + v.programs + v.rules + v.payouts + v.discounts;

  return (
    <AdminShell>
      <AdminPageHeader
        title="Dashboard"
        sub="Site health at a glance. All data changes are audit-logged."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Firms" value={stats.totals.firms} />
        <Stat label="Programs" value={stats.totals.programs} />
        <Stat label="Published articles" value={stats.totals.publishedArticles} />
        <Stat label="Affiliate clicks" value={stats.totals.clicksTotal} sub="all time" />
        <Stat label="Clicks (30 days)" value={stats.totals.clicks30d} sub="last 30 days" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Clicks by firm</h2>
            <Link href="/admin/affiliates" className="text-sm font-semibold text-accent-dark hover:underline">
              Affiliates →
            </Link>
          </div>
          {stats.clicksByFirm.length === 0 ? (
            <EmptyState title="No clicks yet" body="Clicks appear here once visitors use /go links." />
          ) : (
            <Table>
              <THead>
                <TRow>
                  <TH>Firm</TH>
                  <TH>Total</TH>
                  <TH>Last 30d</TH>
                </TRow>
              </THead>
              <tbody>
                {stats.clicksByFirm.map((row) => (
                  <TRow key={row.firm_id ?? "none"}>
                    <TCell>{row.firm_name}</TCell>
                    <TCell>{row.total}</TCell>
                    <TCell>{row.last30d}</TCell>
                  </TRow>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Verification queue</h2>
            <Link href="/admin/verification" className="text-sm font-semibold text-accent-dark hover:underline">
              Review queue →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <QueueStat label="Firms" value={v.firms} />
            <QueueStat label="Programs" value={v.programs} />
            <QueueStat label="Rules" value={v.rules} />
            <QueueStat label="Payouts" value={v.payouts} />
            <QueueStat label="Discounts" value={v.discounts} />
          </div>
          <p className="mt-4 text-xs text-muted">
            {queueTotal === 0
              ? "Everything is verified and fresh."
              : `${queueTotal} item${queueTotal === 1 ? "" : "s"} need attention (stale after ${v.staleDays} days).`}
          </p>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Recent admin activity</h2>
          <Link href="/admin/audit" className="text-sm font-semibold text-accent-dark hover:underline">
            Full audit log →
          </Link>
        </div>
        {stats.recentAudit.length === 0 ? (
          <EmptyState title="No activity yet" />
        ) : (
          <Table>
            <THead>
              <TRow>
                <TH>Time</TH>
                <TH>Admin</TH>
                <TH>Action</TH>
                <TH>Table</TH>
              </TRow>
            </THead>
            <tbody>
              {stats.recentAudit.map((log) => (
                <TRow key={log.id}>
                  <TCell className="whitespace-nowrap">{fmtDate(log.created_at)}</TCell>
                  <TCell>{log.admin_email ?? "—"}</TCell>
                  <TCell>
                    <Badge tone={log.action === "delete" ? "red" : log.action === "create" ? "green" : "blue"}>
                      {log.action}
                    </Badge>
                  </TCell>
                  <TCell className="font-mono text-xs">{log.table_name ?? "—"}</TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </AdminShell>
  );
}

function QueueStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-xl font-bold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
