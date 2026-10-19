import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, getFirm } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Card, Badge } from "@/components/ui";
import { FirmForm, FirmDangerZone } from "../firm-form";

export default async function EditFirmPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const firm = await getFirm(params.id);
  if (!firm) notFound();

  return (
    <AdminShell>
      <AdminPageHeader
        title={firm.name}
        sub={`/${firm.slug}`}
        actions={
          <span className="flex items-center gap-2">
            {firm.is_archived && <Badge tone="red">Archived</Badge>}
            <Link href="/admin/firms" className="text-sm font-semibold text-accent-dark hover:underline">
              ← Back to firms
            </Link>
          </span>
        }
      />
      <Card className="max-w-3xl p-6">
        <FirmForm initial={firm} />
      </Card>
      <div className="max-w-3xl">
        <FirmDangerZone firm={firm} />
      </div>
    </AdminShell>
  );
}
