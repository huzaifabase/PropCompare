"use client";

/* Per-firm affiliate partner editor, click stats, CSV export. */

import { useState } from "react";
import { Download } from "lucide-react";
import { upsertAffiliatePartner, exportClicksCsv } from "@/lib/admin-data";
import type { AffiliatePartnerRow, ClickStatsByFirm } from "@/lib/admin-data";
import { Button, Input, Select, Field, Alert, Card, Table, THead, TRow, TH, TCell, Badge, EmptyState } from "@/components/ui";

const STATUSES = ["none", "pending", "approved", "rejected"] as const;

function PartnerEditor({ row }: { row: AffiliatePartnerRow }) {
  const [status, setStatus] = useState<string>(row.partner?.status ?? "none");
  const [network, setNetwork] = useState(row.partner?.network_name ?? "");
  const [url, setUrl] = useState(row.partner?.destination_url ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await upsertAffiliatePartner({
        firm_id: row.firm.id,
        status,
        network_name: network,
        destination_url: url,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-ink">{row.firm.name}</h3>
        {row.partner && (
          <Badge
            tone={
              row.partner.status === "approved"
                ? "green"
                : row.partner.status === "pending"
                  ? "amber"
                  : row.partner.status === "rejected"
                    ? "red"
                    : "gray"
            }
          >
            {row.partner.status}
          </Badge>
        )}
      </div>
      {error && (
        <div className="mb-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {saved && (
        <div className="mb-3">
          <Alert tone="success">Partner saved.</Alert>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Network name">
          <Input value={network} onChange={(e) => setNetwork(e.target.value)} placeholder="e.g. Impact" />
        </Field>
        <Field label="Destination URL" hint="required unless clearing (status none + empty URL removes the partner)">
          <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
        </Field>
      </div>
      <div className="mt-4">
        <Button type="button" size="sm" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save partner"}
        </Button>
      </div>
    </Card>
  );
}

export function AffiliatesClient({
  rows,
  clickStats,
}: {
  rows: AffiliatePartnerRow[];
  clickStats: ClickStatsByFirm[];
}) {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const csv = await exportClicksCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `affiliate_clicks_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <PartnerEditor key={row.firm.id} row={row} />
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Click stats by firm</h2>
          <span className="inline-flex items-center gap-2">
            {exportError && <span className="text-xs text-red-600">{exportError}</span>}
            <Button type="button" size="sm" variant="secondary" onClick={handleExport} disabled={exporting}>
              <Download size={16} /> {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </span>
        </div>
        {clickStats.length === 0 ? (
          <EmptyState title="No clicks yet" body="Clicks are logged when visitors follow /go links." />
        ) : (
          <Table>
            <THead>
              <TRow>
                <TH>Firm</TH>
                <TH>Total clicks</TH>
                <TH>Last 30 days</TH>
              </TRow>
            </THead>
            <tbody>
              {clickStats.map((s) => (
                <TRow key={s.firm_id ?? "none"}>
                  <TCell className="font-semibold">{s.firm_name}</TCell>
                  <TCell>{s.total}</TCell>
                  <TCell>{s.last30d}</TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
