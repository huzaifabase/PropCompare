import Link from "next/link";
import { requireAdmin, verificationQueue } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Card, Table, THead, TRow, TH, TCell, Badge, EmptyState } from "@/components/ui";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function VerificationAdminPage() {
  await requireAdmin();
  const q = await verificationQueue();
  const total = q.firms.length + q.programs.length + q.rules.length + q.payouts.length + q.discounts.length;

  return (
    <AdminShell>
      <AdminPageHeader
        title="Verification queue"
        sub={`${total} item${total === 1 ? "" : "s"} need attention · stale after ${q.staleDays} days (Settings → verification_stale_days)`}
      />

      <div className="space-y-6">
        <QueueCard title={`Firms (${q.firms.length})`} empty="All firms are verified and fresh." count={q.firms.length}>
          <Table>
            <THead>
              <TRow>
                <TH>Firm</TH>
                <TH>Last verified</TH>
                <TH><span className="sr-only">Actions</span></TH>
              </TRow>
            </THead>
            <tbody>
              {q.firms.map((f) => (
                <TRow key={f.id}>
                  <TCell className="font-semibold">{f.name}</TCell>
                  <TCell>{fmtDate(f.last_verified_at)}</TCell>
                  <TCell className="text-right">
                    <EditLink href={`/admin/firms/${f.id}`} />
                  </TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        </QueueCard>

        <QueueCard title={`Programs (${q.programs.length})`} empty="All programs are verified and fresh." count={q.programs.length}>
          <Table>
            <THead>
              <TRow>
                <TH>Program</TH>
                <TH>Firm</TH>
                <TH>Last verified</TH>
                <TH><span className="sr-only">Actions</span></TH>
              </TRow>
            </THead>
            <tbody>
              {q.programs.map((p) => (
                <TRow key={p.id}>
                  <TCell className="font-semibold">{p.name}</TCell>
                  <TCell>{p.firm_name ?? "—"}</TCell>
                  <TCell>{fmtDate(p.last_verified_at)}</TCell>
                  <TCell className="text-right">
                    <EditLink href={`/admin/programs/${p.id}`} />
                  </TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        </QueueCard>

        <QueueCard title={`Rules (${q.rules.length})`} empty="All rules rows are verified and fresh." count={q.rules.length}>
          <Table>
            <THead>
              <TRow>
                <TH>Program</TH>
                <TH>Firm</TH>
                <TH>Status</TH>
                <TH>Verified at</TH>
                <TH><span className="sr-only">Actions</span></TH>
              </TRow>
            </THead>
            <tbody>
              {q.rules.map((r) => (
                <TRow key={r.id}>
                  <TCell className="font-semibold">{r.program_name ?? r.program_id.slice(0, 8)}</TCell>
                  <TCell>{r.firm_name ?? "—"}</TCell>
                  <TCell>
                    <StatusBadge status={r.verification_status} />
                  </TCell>
                  <TCell>{fmtDate(r.verified_at)}</TCell>
                  <TCell className="text-right">
                    <EditLink href={`/admin/programs/${r.program_id}`} />
                  </TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        </QueueCard>

        <QueueCard title={`Payouts (${q.payouts.length})`} empty="All payout rows are verified and fresh." count={q.payouts.length}>
          <Table>
            <THead>
              <TRow>
                <TH>Program</TH>
                <TH>Firm</TH>
                <TH>Status</TH>
                <TH>Verified at</TH>
                <TH><span className="sr-only">Actions</span></TH>
              </TRow>
            </THead>
            <tbody>
              {q.payouts.map((r) => (
                <TRow key={r.id}>
                  <TCell className="font-semibold">{r.program_name ?? r.program_id.slice(0, 8)}</TCell>
                  <TCell>{r.firm_name ?? "—"}</TCell>
                  <TCell>
                    <StatusBadge status={r.verification_status} />
                  </TCell>
                  <TCell>{fmtDate(r.verified_at)}</TCell>
                  <TCell className="text-right">
                    <EditLink href={`/admin/programs/${r.program_id}`} />
                  </TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        </QueueCard>

        <QueueCard title={`Unverified discounts (${q.discounts.length})`} empty="All published discounts are verified." count={q.discounts.length}>
          <Table>
            <THead>
              <TRow>
                <TH>Code</TH>
                <TH>Firm</TH>
                <TH><span className="sr-only">Actions</span></TH>
              </TRow>
            </THead>
            <tbody>
              {q.discounts.map((d) => (
                <TRow key={d.id}>
                  <TCell className="font-mono font-semibold">{d.code}</TCell>
                  <TCell>{d.firm_name ?? "—"}</TCell>
                  <TCell className="text-right">
                    <EditLink href={`/admin/discounts/${d.id}`} />
                  </TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        </QueueCard>
      </div>
    </AdminShell>
  );
}

function QueueCard({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 text-base font-bold text-ink">{title}</h2>
      {count === 0 ? <EmptyState title="All clear" body={empty} /> : children}
    </Card>
  );
}

function EditLink({ href }: { href: string }) {
  return (
    <Link href={href} className="text-sm font-semibold text-accent-dark hover:underline">
      Open editor →
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified") return <Badge tone="green">Verified</Badge>;
  if (status === "stale") return <Badge tone="amber">Stale</Badge>;
  return <Badge tone="gray">Not verified</Badge>;
}
