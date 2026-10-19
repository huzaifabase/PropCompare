import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin, listDiscounts } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Table, THead, TRow, TH, TCell, Badge, EmptyState } from "@/components/ui";
import { getDiscountStatus, discountStatusBadge, fmtPct, fmtMoney, fmtDate } from "@/lib/format";
import { DiscountPublishToggle } from "./discount-form";

export const dynamic = "force-dynamic";

export default async function DiscountsAdminPage() {
  await requireAdmin();
  const discounts = await listDiscounts();

  return (
    <AdminShell>
      <AdminPageHeader
        title="Discounts"
        sub={`${discounts.length} discount${discounts.length === 1 ? "" : "s"}`}
        actions={
          <Link
            href="/admin/discounts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
          >
            <Plus size={16} /> New discount
          </Link>
        }
      />
      {discounts.length === 0 ? (
        <EmptyState title="No discounts yet" body="Add a discount code to feature it on the public discounts page." />
      ) : (
        <Table>
          <THead>
            <TRow>
              <TH>Code</TH>
              <TH>Firm</TH>
              <TH>Value</TH>
              <TH>Status</TH>
              <TH>Published</TH>
              <TH>Expires</TH>
              <TH><span className="sr-only">Actions</span></TH>
            </TRow>
          </THead>
          <tbody>
            {discounts.map((d) => {
              const status = getDiscountStatus(d);
              const badge = discountStatusBadge(status);
              return (
                <TRow key={d.id}>
                  <TCell>
                    <Link href={`/admin/discounts/${d.id}`} className="font-mono font-semibold text-accent-dark hover:underline">
                      {d.code}
                    </Link>
                  </TCell>
                  <TCell>{d.firm?.name ?? "—"}</TCell>
                  <TCell>
                    {d.discount_pct !== null && d.discount_pct !== undefined
                      ? fmtPct(d.discount_pct)
                      : fmtMoney(d.discount_fixed, d.currency)}
                  </TCell>
                  <TCell>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </TCell>
                  <TCell>
                    <Badge tone={d.is_published ? "green" : "gray"}>
                      {d.is_published ? "Yes" : "No"}
                    </Badge>
                  </TCell>
                  <TCell className="whitespace-nowrap">{fmtDate(d.expires_at)}</TCell>
                  <TCell className="whitespace-nowrap text-right">
                    <DiscountPublishToggle id={d.id} published={d.is_published} />
                  </TCell>
                </TRow>
              );
            })}
          </tbody>
        </Table>
      )}
    </AdminShell>
  );
}
