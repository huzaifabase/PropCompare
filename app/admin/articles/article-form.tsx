"use client";

/* Article create/edit form with markdown preview toggle and danger zone. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { articleSchema } from "@/lib/validators";
import { createArticle, updateArticle, deleteArticle, toggleArticlePublish } from "@/lib/admin-data";
import { Button, Input, Textarea, Select, Field, Alert, Card } from "@/components/ui";
import { ConfirmDelete, formError } from "@/components/admin";
import type { Article, ArticleCategory } from "@/lib/types";

/* Minimal markdown renderer: escape HTML first, then #, ##, ###, -, 1., **bold**, [links]. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMd(t: string): string {
  return t
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(
      /\[([^\]]+)\]\((https?:[^)\s]+)\)/g,
      '<a href="$2" class="font-semibold text-accent-dark underline" target="_blank" rel="noopener">$1</a>'
    );
}

export function mdToHtml(md: string): string {
  const lines = escapeHtml(md).split("\n");
  let html = "";
  let listTag: "" | "ul" | "ol" = "";
  const closeList = () => {
    if (listTag) {
      html += `</${listTag}>`;
      listTag = "";
    }
  };
  const openList = (tag: "ul" | "ol") => {
    if (listTag !== tag) {
      closeList();
      html += `<${tag} class="${tag === "ul" ? "list-disc" : "list-decimal"} space-y-1 pl-6">`;
      listTag = tag;
    }
  };
  for (const line of lines) {
    const t = line.trim();
    if (/^###\s+/.test(t)) {
      closeList();
      html += `<h3 class="mt-4 text-base font-bold text-ink">${inlineMd(t.replace(/^###\s+/, ""))}</h3>`;
    } else if (/^##\s+/.test(t)) {
      closeList();
      html += `<h2 class="mt-5 text-lg font-bold text-ink">${inlineMd(t.replace(/^##\s+/, ""))}</h2>`;
    } else if (/^#\s+/.test(t)) {
      closeList();
      html += `<h1 class="mt-5 text-xl font-bold text-ink">${inlineMd(t.replace(/^#\s+/, ""))}</h1>`;
    } else if (/^[-*]\s+/.test(t)) {
      openList("ul");
      html += `<li class="text-sm leading-relaxed text-ink">${inlineMd(t.replace(/^[-*]\s+/, ""))}</li>`;
    } else if (/^\d+\.\s+/.test(t)) {
      openList("ol");
      html += `<li class="text-sm leading-relaxed text-ink">${inlineMd(t.replace(/^\d+\.\s+/, ""))}</li>`;
    } else if (t === "") {
      closeList();
    } else {
      closeList();
      html += `<p class="text-sm leading-relaxed text-ink">${inlineMd(t)}</p>`;
    }
  }
  closeList();
  return html;
}

export function ArticleForm({ initial, categories }: { initial?: Article | null; categories: ArticleCategory[] }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(articleSchema),
    defaultValues: initial
      ? { ...initial, category_id: initial.category_id ?? "" }
      : { status: "draft", category_id: "" },
  });

  const body = (watch("content_md") as string) ?? "";

  async function onSubmit(values: Record<string, unknown>) {
    setServerError(null);
    setSaved(false);
    try {
      if (initial) {
        await updateArticle(initial.id, values);
        setSaved(true);
        router.refresh();
      } else {
        const { id } = await createArticle(values);
        router.push(`/admin/articles/${id}`);
      }
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}
      {saved && <Alert tone="success">Article saved.</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Title" htmlFor="article-title" error={formError(errors, "title")}>
          <Input id="article-title" {...register("title")} />
        </Field>
        <Field label="Slug" htmlFor="article-slug" error={formError(errors, "slug")}>
          <Input id="article-slug" {...register("slug")} />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Category" error={formError(errors, "category_id")}>
          <Select {...register("category_id")}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" error={formError(errors, "status")}>
          <Select {...register("status")}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </Field>
        <Field label="Author" error={formError(errors, "author")}>
          <Input {...register("author")} />
        </Field>
      </div>
      <Field label="Excerpt" error={formError(errors, "excerpt")}>
        <Textarea rows={2} {...register("excerpt")} />
      </Field>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="article-body" className="block text-sm font-semibold text-ink">
            Body (markdown)
          </label>
          <Button type="button" size="sm" variant="secondary" onClick={() => setPreview((p) => !p)}>
            {preview ? "Edit" : "Preview"}
          </Button>
        </div>
        {preview ? (
          <div className="min-h-[240px] space-y-3 rounded-lg border border-slate-300 bg-slate-50 p-4">
            {body.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: mdToHtml(body) }} />
            ) : (
              <p className="text-sm text-muted">Nothing to preview yet.</p>
            )}
          </div>
        ) : (
          <>
            <Textarea id="article-body" rows={14} className="font-mono" {...register("content_md")} />
            {formError(errors, "content_md") && (
              <p className="mt-1.5 text-xs text-red-600" role="alert">{formError(errors, "content_md")}</p>
            )}
          </>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Featured image URL" error={formError(errors, "featured_image_url")}>
          <Input type="url" placeholder="https://" {...register("featured_image_url")} />
        </Field>
        <Field label="Meta title" error={formError(errors, "meta_title")}>
          <Input {...register("meta_title")} />
        </Field>
      </div>
      <Field label="Meta description" error={formError(errors, "meta_description")}>
        <Textarea rows={2} {...register("meta_description")} />
      </Field>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : initial ? "Save changes" : "Create article"}
      </Button>
    </form>
  );
}

export function ArticlePublishToggle({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      await toggleArticlePublish(id, !published);
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

export function ArticleDangerZone({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  return (
    <Card className="mt-6 max-w-4xl border-red-200 p-6">
      <h2 className="text-base font-bold text-red-700">Danger zone</h2>
      <div className="mt-4">
        <ConfirmDelete
          label="Delete article"
          title={`Delete “${title}”?`}
          body="The article is deleted permanently."
          onConfirm={async () => {
            await deleteArticle(id);
            router.push("/admin/articles");
          }}
        />
      </div>
    </Card>
  );
}
