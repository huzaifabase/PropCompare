import Link from "next/link";
import { requireAdmin, listAffiliatePartners, getClickStatsByFirm } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { AffiliatesClient } from "./affiliates-client";

export const dynamic = "force-dynamic";

export default async function AffiliatesAdminPage() {
  await requireAdmin();
  const [rows, clickStats] = await Promise.all([listAffiliatePartners(), getClickStatsByFirm()]);

  return (
    <AdminShell>
      <AdminPageHeader
        title="Affiliates"
        sub="Redirect targets come only from approved partners here (or the firm's official website as fallback). Never from URL params."
        actions={
          <Link href="/admin/audit" className="text-sm font-semibold text-accent-dark hover:underline">
            Audit log →
          </Link>
        }
      />
      <AffiliatesClient rows={rows} clickStats={clickStats} />
    </AdminShell>
  );
}
