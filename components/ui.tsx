import React from "react";
import { cx } from "@/lib/format";

/* ---------- primitives: import { Button, Card, ... } from "@/components/ui" ---------- */

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};
export function Button({ variant = "primary", size = "md", className, ...rest }: ButtonProps) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        variant === "primary" && "bg-accent text-white hover:bg-accent-dark",
        variant === "secondary" && "bg-navy-900 text-white hover:bg-navy-800",
        variant === "ghost" && "text-navy-900 hover:bg-slate-100",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        className
      )}
      {...rest}
    />
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cx("rounded-xl border border-slate-200 bg-white shadow-card", className)}>{children}</div>
  );
}

const badgeTones: Record<string, string> = {
  green: "bg-accent-light text-accent-dark",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  gray: "bg-slate-100 text-slate-600",
  blue: "bg-blue-100 text-blue-800",
  navy: "bg-navy-900 text-white",
};
export function Badge({ tone = "gray", children }: { tone?: keyof typeof badgeTones; children: React.ReactNode }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone])}>
      {children}
    </span>
  );
}

type FieldProps = { label: string; hint?: string; error?: string; children: React.ReactNode; htmlFor?: string };
export function Field({ label, hint, error, children, htmlFor }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:bg-slate-50";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, "min-h-[120px]", props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, props.className)} />;
}
export function Checkbox(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      {...props}
      className={cx("h-4 w-4 rounded border-slate-300 accent-[#10B981] focus:ring-accent", props.className)}
    />
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className={cx("w-full min-w-[640px] border-collapse bg-white text-sm", className)}>{children}</table>
    </div>
  );
}
export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">{children}</thead>;
}
export function TH({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cx("px-4 py-3 font-semibold", className)}>{children}</th>;
}
export function TRow({ children }: { children: React.ReactNode }) {
  return <tr className="border-t border-slate-100 hover:bg-slate-50/60">{children}</tr>;
}
export function TCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cx("px-4 py-3 align-top", className)}>{children}</td>;
}

const alertTones = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  error: "border-red-200 bg-red-50 text-red-900",
};
export function Alert({ tone = "info", children }: { tone?: keyof typeof alertTones; children: React.ReactNode }) {
  return <div className={cx("rounded-lg border px-4 py-3 text-sm", alertTones[tone])} role="alert">{children}</div>;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-navy-950/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 text-muted hover:bg-slate-100">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function SectionHeading({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div className="mb-8 max-w-2xl">
      {kicker && <p className="mb-2 text-xs font-bold uppercase tracking-widest text-accent-dark">{kicker}</p>}
      <h2 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
      {sub && <p className="mt-2 text-muted">{sub}</p>}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <p className="font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 text-sm text-muted">{body}</p>}
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </Card>
  );
}

export function Pagination({ page, totalPages, href }: { page: number; totalPages: number; href: (p: number) => string }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <a
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={cx(
            "rounded-lg px-3 py-2 text-sm font-semibold",
            p === page ? "bg-navy-900 text-white" : "text-ink hover:bg-slate-100"
          )}
        >
          {p}
        </a>
      ))}
    </nav>
  );
}
