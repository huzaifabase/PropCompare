"use client";

/* Discount create/edit form + publish toggle button. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { discountSchema } from "@/lib/validators";
import { createDiscount, updateDiscount, toggleDiscountPublish, deleteDiscount } from "@/lib/admin-data";
import { Button, Input, Textarea, Select, Checkbox, Field, Alert, Card } from "@/components/ui";
import { ConfirmDelete, formError } from "@/components/admin";
import type { DiscountAdminRow } from "@/lib/admin-data";
import type { Firm } from "@/lib/types";

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DiscountForm({ initial, firms }: { initial?: DiscountAdminRow | null; firms: Firm[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(discountSchema),
    defaultValues: initial
      ? { ...initial, expires_at: toLocalInput(initial.expires_at) }
      : { verification_status: "unverified", is_published: false },
  });

  async function onSubmit(values: Record<string, unknown>) {
    setServerError(null);
    setSaved(false);
    try {
      const exp = values.expires_at as string;
      const payload = { ...values, expires_at: exp ? new Date(exp).toISOString() : null };
      if (initial) {
        await updateDiscount(initial.id, payload);
        setSaved(true);
        router.refresh();
      } else {
        const { id } = await createDiscount(payload);
        router.push(`/admin/discounts/${id}`);
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}
      {saved && <Alert tone="success">Discount saved.</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Firm" htmlFor="discount-firm" error={formError(errors, "firm_id")}>
          <Select id="discount-firm" {...register("firm_id")}>
            <option value="">Select a firm…</option>
            {firms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Code" htmlFor="discount-code" error={formError(errors, "code")}>
          <Input id="discount-code" {...register("code")} placeholder="SAVE20" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Discount %" hint="blank if fixed amount" error={formError(errors, "discount_pct")}>
          <Input id="discount-pct" type="number" step="any" {...register("discount_pct")} />
        </Field>
        <Field label="Fixed amount" hint="blank if percent" error={formError(errors, "discount_fixed")}>
          <Input id="discount-fixed" type="number" step="any" {...register("discount_fixed")} />
        </Field>
        <Field label="Currency" error={formError(errors, "currency")}>
          <Input maxLength={3} {...register("currency")} placeholder="USD" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Applicable programs" hint="free text, e.g. all two-step" error={formError(errors, "applicable_programs")}>
          <Input {...register("applicable_programs")} />
        </Field>
        <Field label="Expires at" error={formError(errors, "expires_at")}>
          <Input type="datetime-local" {...register("expires_at")} />
        </Field>
      </div>

      <Field label="Terms" error={formError(errors, "terms")}>
        <Textarea rows={3} {...register("terms")} />
      </Field>
      <Field label="Source URL" error={formError(errors, "source_url")}>
        <Input type="url" placeholder="https://" {...register("source_url")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Verification status" error={formError(errors, "verification_status")}>
          <Select {...register("verification_status")}>
            <option value="unverified">Unverified</option>
            <option value="verified">Verified</option>
          </Select>
        </Field>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <Checkbox {...register("is_published")} /> Published
          </label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : initial ? "Save changes" : "Create discount"}
      </Button>
    </form>
  );
}

export function DiscountDangerZone({ id, code }: { id: string; code: string }) {
  const router = useRouter();
  return (
    <Card className="mt-6 max-w-3xl border-red-200 p-6">
      <h2 className="text-base font-bold text-red-700">Danger zone</h2>
      <div className="mt-4">
        <ConfirmDelete
          label="Delete discount"
          title={`Delete ${code}?`}
          body="The discount is deleted permanently."
          onConfirm={async () => {
            await deleteDiscount(id);
            router.push("/admin/discounts");
          }}
        />
      </div>
    </Card>
  );
}

export function DiscountPublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      await toggleDiscountPublish(id, !published);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Toggle failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" size="sm" variant="secondary" onClick={toggle} disabled={busy}>
        {published ? "Unpublish" : "Publish"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
