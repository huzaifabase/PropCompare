"use client";

/* Firm create/edit form + danger zone (archive toggle, hard delete). */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { firmSchema } from "@/lib/validators";
import { createFirm, updateFirm, setFirmArchived, deleteFirm } from "@/lib/admin-data";
import { Button, Input, Textarea, Select, Checkbox, Field, Alert, Card } from "@/components/ui";
import { ConfirmDelete, formError } from "@/components/admin";
import type { Firm } from "@/lib/types";

export function FirmForm({ initial }: { initial?: Firm | null }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(firmSchema),
    defaultValues: initial
      ? { ...initial }
      : { affiliate_status: "none", is_published: false, is_archived: false },
  });

  async function onSubmit(values: Record<string, unknown>) {
    setServerError(null);
    setSaved(false);
    try {
      if (initial) {
        await updateFirm(initial.id, values);
        setSaved(true);
        router.refresh();
      } else {
        const { id } = await createFirm(values);
        router.push(`/admin/firms/${id}`);
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}
      {saved && <Alert tone="success">Firm saved.</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="firm-name" error={formError(errors, "name")}>
          <Input id="firm-name" {...register("name")} />
        </Field>
        <Field label="Slug" htmlFor="firm-slug" hint="lowercase, numbers, hyphens" error={formError(errors, "slug")}>
          <Input id="firm-slug" {...register("slug")} />
        </Field>
      </div>
      <Field label="Tagline" htmlFor="firm-tagline" error={formError(errors, "tagline")}>
        <Input id="firm-tagline" {...register("tagline")} />
      </Field>
      <Field label="Description" htmlFor="firm-description" error={formError(errors, "description")}>
        <Textarea id="firm-description" rows={4} {...register("description")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Logo URL" htmlFor="firm-logo" error={formError(errors, "logo_url")}>
          <Input id="firm-logo" type="url" placeholder="https://" {...register("logo_url")} />
        </Field>
        <Field label="Official website" htmlFor="firm-website" error={formError(errors, "official_website")}>
          <Input id="firm-website" type="url" placeholder="https://" {...register("official_website")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Affiliate status" htmlFor="firm-aff-status" error={formError(errors, "affiliate_status")}>
          <Select id="firm-aff-status" {...register("affiliate_status")}>
            <option value="none">None</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </Select>
        </Field>
        <Field label="Affiliate network" htmlFor="firm-aff-network" error={formError(errors, "affiliate_network")}>
          <Input id="firm-aff-network" {...register("affiliate_network")} />
        </Field>
        <Field label="Affiliate destination URL" htmlFor="firm-aff-url" error={formError(errors, "affiliate_destination_url")}>
          <Input id="firm-aff-url" type="url" placeholder="https://" {...register("affiliate_destination_url")} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <Checkbox {...register("is_published")} /> Published
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <Checkbox {...register("is_archived")} /> Archived
        </label>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : initial ? "Save changes" : "Create firm"}
      </Button>
    </form>
  );
}

export function FirmDangerZone({ firm }: { firm: Firm }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleArchive() {
    setError(null);
    setBusy(true);
    try {
      await setFirmArchived(firm.id, !firm.is_archived);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6 border-red-200 p-6">
      <h2 className="text-base font-bold text-red-700">Danger zone</h2>
      {error && (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={toggleArchive} disabled={busy}>
          {firm.is_archived ? "Unarchive firm" : "Archive firm"}
        </Button>
        <ConfirmDelete
          label="Delete firm"
          title={`Delete ${firm.name}?`}
          body="The firm is deleted permanently. Programs may block deletion if they still reference it."
          onConfirm={async () => {
            await deleteFirm(firm.id);
            router.push("/admin/firms");
          }}
        />
      </div>
      <p className="mt-3 text-xs text-muted">
        Archiving hides the firm from the public site while keeping its data. Deletion is permanent.
      </p>
    </Card>
  );
}
