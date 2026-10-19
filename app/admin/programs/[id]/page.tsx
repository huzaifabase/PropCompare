import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, getProgramEditorData, listFirms } from "@/lib/admin-data";
import { AdminShell, AdminPageHeader } from "@/components/admin";
import { Card, Badge } from "@/components/ui";
import { ProgramForm } from "../program-form";
import {
  SizesCard,
  RulesCard,
  PlatformsCard,
  InstrumentsCard,
  PayoutCard,
  ProgramDangerZone,
} from "./sections";

export const dynamic = "force-dynamic";

export default async function ProgramEditorPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const data = await getProgramEditorData(params.id);
  if (!data) notFound();
  const firms = await listFirms();

  return (
    <AdminShell>
      <AdminPageHeader
        title={data.program.name}
        sub={`${data.firm?.name ?? "Unknown firm"} · /${data.program.slug}`}
        actions={
          <span className="flex items-center gap-2">
            {data.program.is_archived && <Badge tone="red">Archived</Badge>}
            <Badge tone={data.program.is_published ? "green" : "gray"}>
              {data.program.is_published ? "Published" : "Hidden"}
            </Badge>
            <Link href="/admin/programs" className="text-sm font-semibold text-accent-dark hover:underline">
              ← Back to programs
            </Link>
          </span>
        }
      />

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-5 text-base font-bold text-ink">Program details</h2>
          <ProgramForm initial={data.program} firms={firms} />
        </Card>

        <SizesCard programId={data.program.id} initialSizes={data.sizes} />
        <RulesCard programId={data.program.id} initial={data.rules} sizes={data.sizes} />
        <PlatformsCard programId={data.program.id} initial={data.platforms} />
        <InstrumentsCard
          programId={data.program.id}
          initial={data.instruments.map((i) => i.instrument_class)}
        />
        <PayoutCard programId={data.program.id} initial={data.payout} sizes={data.sizes} />
        <ProgramDangerZone program={data.program} />
      </div>
    </AdminShell>
  );
}
