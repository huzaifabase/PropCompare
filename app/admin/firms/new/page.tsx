import Link from "next/link";
import { requireAdmin } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Card } from "@/components/ui";
import { FirmForm } from "../firm-form";

export default async function NewFirmPage() {
  await requireAdmin();
  return (
    <AdminShell>
      <AdminPageHeader
        title="New firm"
        actions={
          <Link href="/admin/firms" className="text-sm font-semibold text-accent-dark hover:underline">
            ← Back to firms
          </Link>
        }
      />
      <Card className="max-w-3xl p-6">
        <FirmForm />
      </Card>
    </AdminShell>
  );
}
