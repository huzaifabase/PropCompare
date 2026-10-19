"use client";

/* Program create/edit form (firm select, category select, publish flags). */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { programSchema } from "@/lib/validators";
import { createProgram, updateProgram } from "@/lib/admin-data";
import { Button, Input, Textarea, Select, Checkbox, Field, Alert } from "@/components/ui";
import { formError } from "@/components/admin";
import type { Program, Firm } from "@/lib/types";

const CATEGORIES = [
  { value: "one_step", label: "One-step" },
  { value: "two_step", label: "Two-step" },
  { value: "three_step", label: "Three-step" },
  { value: "instant", label: "Instant funding" },
  { value: "other", label: "Other" },
];

export function ProgramForm({ initial, firms }: { initial?: Program | null; firms: Firm[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(programSchema),
    defaultValues: initial
      ? { ...initial }
      : { category: "two_step", sort_order: 0, is_published: false, is_archived: false },
  });

  async function onSubmit(values: Record<string, unknown>) {
    setServerError(null);
    setSaved(false);
    try {
      if (initial) {
        await updateProgram(initial.id, values);
        setSaved(true);
        router.refresh();
      } else {
        const { id } = await createProgram(values);
        router.push(`/admin/programs/${id}`);
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}
      {saved && <Alert tone="success">Program saved.</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Firm" htmlFor="program-firm" error={formError(errors, "firm_id")}>
          <Select id="program-firm" {...register("firm_id")}>
            <option value="">Select a firm…</option>
            {firms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Category" htmlFor="program-category" error={formError(errors, "category")}>
          <Select id="program-category" {...register("category")}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" htmlFor="program-name" error={formError(errors, "name")}>
          <Input id="program-name" {...register("name")} />
        </Field>
        <Field label="Slug" htmlFor="program-slug" hint="unique per firm" error={formError(errors, "slug")}>
          <Input id="program-slug" {...register("slug")} />
        </Field>
      </div>
      <Field label="Description" htmlFor="program-description" error={formError(errors, "description")}>
        <Textarea id="program-description" rows={3} {...register("description")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Sort order" htmlFor="program-sort" error={formError(errors, "sort_order")}>
          <Input id="program-sort" type="number" {...register("sort_order")} />
        </Field>
        <div className="flex items-end gap-6 pb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <Checkbox {...register("is_published")} /> Published
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <Checkbox {...register("is_archived")} /> Archived
          </label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : initial ? "Save changes" : "Create program"}
      </Button>
    </form>
  );
}
