import Link from "next/link";
import { requireAdmin, listFirms } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Card } from "@/components/ui";
import { DiscountForm } from "../discount-form";

export default async function NewDiscountPage() {
  await requireAdmin();
  const firms = await listFirms();
  return (
    <AdminShell>
      <AdminPageHeader
        title="New discount"
        actions={
          <Link href="/admin/discounts" className="text-sm font-semibold text-accent-dark hover:underline">
            ← Back to discounts
          </Link>
        }
      />
      <Card className="max-w-3xl p-6">
        <DiscountForm firms={firms} />
      </Card>
    </AdminShell>
  );
}
