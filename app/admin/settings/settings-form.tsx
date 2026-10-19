"use client";

/* Site settings key/value editor. Values are stored as jsonb; toggle "JSON" when
   the value is a number, boolean, object or array — otherwise it's stored as text. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateSiteSetting } from "@/lib/admin-data";
import type { SiteSettingRow } from "@/lib/admin-data";
import { Button, Input, Textarea, Checkbox, Field, Alert, Card } from "@/components/ui";

function looksJson(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== "string") return true;
  const t = value.trim();
  return t.startsWith("{") || t.startsWith("[");
}

function stringify(value: unknown, asJson: boolean): string {
  if (asJson) return JSON.stringify(value, null, 2);
  return typeof value === "string" ? value : JSON.stringify(value);
}

function SettingRow({ setting }: { setting: SiteSettingRow }) {
  const router = useRouter();
  const initialJson = looksJson(setting.value);
  const [raw, setRaw] = useState(() => stringify(setting.value, initialJson));
  const [asJson, setAsJson] = useState(initialJson);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await updateSiteSetting(setting.key, raw, asJson);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <code className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold text-ink">{setting.key}</code>
        <label className="flex items-center gap-2 text-xs font-medium text-muted">
          <Checkbox checked={asJson} onChange={(e) => setAsJson(e.target.checked)} /> JSON value
        </label>
      </div>
      {error && (
        <div className="mb-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {saved && (
        <div className="mb-3">
          <Alert tone="success">Saved.</Alert>
        </div>
      )}
      <Textarea
        rows={asJson ? 4 : 2}
        className={asJson ? "font-mono text-xs" : undefined}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        aria-label={`Value for ${setting.key}`}
      />
      <div className="mt-3">
        <Button type="button" size="sm" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </Card>
  );
}

function NewSettingRow() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [raw, setRaw] = useState("");
  const [asJson, setAsJson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add() {
    setError(null);
    setBusy(true);
    try {
      await updateSiteSetting(key.trim(), raw, asJson);
      setKey("");
      setRaw("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-dashed p-5">
      <h3 className="mb-3 font-bold text-ink">Add setting</h3>
      {error && (
        <div className="mb-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Key" hint="lowercase letters, numbers, underscores">
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="new_setting_key" />
        </Field>
        <Field label="Value">
          <Input value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="value" />
        </Field>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs font-medium text-muted">
          <Checkbox checked={asJson} onChange={(e) => setAsJson(e.target.checked)} /> JSON value
        </label>
        <Button type="button" size="sm" onClick={add} disabled={busy || !key.trim()}>
          {busy ? "Adding…" : "Add setting"}
        </Button>
      </div>
    </Card>
  );
}

export function SettingsForm({ settings }: { settings: SiteSettingRow[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {settings.map((s) => (
        <SettingRow key={s.key} setting={s} />
      ))}
      <NewSettingRow />
    </div>
  );
}
