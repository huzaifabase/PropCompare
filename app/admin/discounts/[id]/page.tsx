import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, getDiscount, listFirms } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Card, Badge } from "@/components/ui";
import { getDiscountStatus, discountStatusBadge } from "@/lib/format";
import { DiscountForm, DiscountPublishToggle, DiscountDangerZone } from "../discount-form";

export const dynamic = "force-dynamic";

export default async function EditDiscountPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const discount = await getDiscount(params.id);
  if (!discount) notFound();
  const firms = await listFirms();
  const badge = discountStatusBadge(getDiscountStatus(discount));

  return (
    <AdminShell>
      <AdminPageHeader
        title={`Discount ${discount.code}`}
        sub={discount.firm?.name}
        actions={
          <span className="flex items-center gap-2">
            <Badge tone={badge.tone}>{badge.label}</Badge>
            <DiscountPublishToggle id={discount.id} published={discount.is_published} />
            <Link href="/admin/discounts" className="text-sm font-semibold text-accent-dark hover:underline">
              ← Back
            </Link>
          </span>
        }
      />
      <Card className="max-w-3xl p-6">
        <DiscountForm initial={discount} firms={firms} />
      </Card>
      <DiscountDangerZone id={discount.id} code={discount.code} />
    </AdminShell>
  );
}
