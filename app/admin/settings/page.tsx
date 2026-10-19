import { requireAdmin, getSiteSettingsAdmin } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Alert } from "@/components/ui";
import { SettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsAdminPage() {
  await requireAdmin();
  const settings = await getSiteSettingsAdmin();

  return (
    <AdminShell>
      <AdminPageHeader
        title="Site settings"
        sub="Key/value settings stored as JSON. Changes apply to the public site immediately."
      />
      <div className="mb-6">
        <Alert tone="warning">
          <span className="font-semibold">verification_stale_days</span> controls when firms, programs,
          rules and payouts go stale in the verification queue.
        </Alert>
      </div>
      <SettingsForm settings={settings} />
    </AdminShell>
  );
}
