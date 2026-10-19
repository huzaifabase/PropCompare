import Link from "next/link";
import { requireAdmin, listFirms } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Card } from "@/components/ui";
import { ProgramForm } from "../program-form";

export default async function NewProgramPage() {
  await requireAdmin();
  const firms = await listFirms();
  return (
    <AdminShell>
      <AdminPageHeader
        title="New program"
        actions={
          <Link href="/admin/programs" className="text-sm font-semibold text-accent-dark hover:underline">
            ← Back to programs
          </Link>
        }
      />
      <Card className="max-w-3xl p-6">
        <ProgramForm firms={firms} />
      </Card>
    </AdminShell>
  );
}
