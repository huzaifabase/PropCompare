"use client";

/* Admin chrome: sidebar shell, page header, confirm-delete dialog, table wrapper. */

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Layers,
  Tag,
  Newspaper,
  Link2,
  ShieldCheck,
  ScrollText,
  Settings,
  Globe,
  LogOut,
} from "lucide-react";
import { createBrowserClient } from "@/lib/supabase-client";
import { cx } from "@/lib/format";
import { Button, Modal, Table, Alert } from "./ui";

const NAV: { href: string; label: string; icon: React.ReactNode; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} />, exact: true },
  { href: "/admin/firms", label: "Firms", icon: <Building2 size={18} /> },
  { href: "/admin/programs", label: "Programs", icon: <Layers size={18} /> },
  { href: "/admin/discounts", label: "Discounts", icon: <Tag size={18} /> },
  { href: "/admin/articles", label: "Articles", icon: <Newspaper size={18} /> },
  { href: "/admin/affiliates", label: "Affiliates", icon: <Link2 size={18} /> },
  { href: "/admin/verification", label: "Verification", icon: <ShieldCheck size={18} /> },
  { href: "/admin/audit", label: "Audit Log", icon: <ScrollText size={18} /> },
  { href: "/admin/settings", label: "Settings", icon: <Settings size={18} /> },
];

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, label, icon, exact }: { href: string; label: string; icon: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active ? "bg-accent text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}

function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await createBrowserClient().auth.signOut();
    } finally {
      router.push("/admin/login");
      router.refresh();
    }
  }
  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
    >
      <LogOut size={18} />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-navy-950 lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-black text-white">
            PC
          </span>
          <span className="text-base font-bold text-white">
            PropCompare <span className="font-medium text-accent">Admin</span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Admin">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <a
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Globe size={18} />
            View Site
          </a>
          <SignOutButton />
        </div>
      </aside>

      <div className="lg:pl-64">
        {/* mobile top bar */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-950 lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <span className="text-sm font-bold text-white">
              PropCompare <span className="font-medium text-accent">Admin</span>
            </span>
            <div className="flex items-center gap-2">
              <a href="/" className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-300 hover:text-white">
                View Site
              </a>
              <SignOutButton />
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="Admin">
            {NAV.map((item) => (
              <MobileNavLink key={item.href} {...item} />
            ))}
          </nav>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function MobileNavLink({ href, label, exact }: { href: string; label: string; exact?: boolean }) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cx(
        "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold",
        active ? "bg-accent text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
      )}
    >
      {label}
    </Link>
  );
}

export function AdminPageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function ConfirmDelete({
  onConfirm,
  label = "Delete",
  title = "Confirm deletion",
  body = "This action cannot be undone.",
}: {
  onConfirm: () => Promise<void>;
  label?: string;
  title?: string;
  body?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button type="button" variant="danger" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        <p className="text-sm text-muted">{body}</p>
        {error && (
          <div className="mt-3">
            <Alert tone="error">{error}</Alert>
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={confirm} disabled={pending}>
            {pending ? "Working…" : label}
          </Button>
        </div>
      </Modal>
    </>
  );
}

/** Extract a string error message for a react-hook-form field (safe for useForm<any>). */
export function formError(errors: unknown, name: string): string | undefined {
  const entry = (errors as Record<string, { message?: unknown }> | null | undefined)?.[name];
  const m = entry?.message;
  return typeof m === "string" ? m : undefined;
}

/** Thin wrapper over the ui Table (kept for a stable admin import surface). */
export function DataTable({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Table className={className}>{children}</Table>;
}
