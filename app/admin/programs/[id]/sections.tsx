"use client";

/* Sectioned program editor: sizes, rules, platforms, instruments, payout, danger zone.
   Each section is a separate card with its own form and server action. */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { programSizeSchema } from "@/lib/validators";
import {
  listProgramSizes,
  createProgramSize,
  updateProgramSize,
  deleteProgramSize,
  upsertProgramRules,
  setProgramPlatforms,
  setProgramInstruments,
  upsertProgramPayout,
  setProgramArchived,
  deleteProgram,
} from "@/lib/admin-data";
import { PLATFORM_OPTIONS, INSTRUMENT_OPTIONS } from "@/lib/admin-options";
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Field,
  Alert,
  Card,
  Table,
  THead,
  TRow,
  TH,
  TCell,
  Badge,
} from "@/components/ui";
import { ConfirmDelete, formError } from "@/components/admin";
import { fmtMoney, verificationBadge } from "@/lib/format";
import type { Program, ProgramSize, ProgramRules, ProgramPayout } from "@/lib/types";

/* ---------------- shared bits ---------------- */

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-ink">{children}</h2>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function triToString(v: boolean | null | undefined): string {
  return v === true ? "true" : v === false ? "false" : "";
}

function triFromString(v: string): boolean | null {
  return v === "true" ? true : v === "false" ? false : null;
}

/* ---------------- sizes ---------------- */

function SizeForm({
  programId,
  initial,
  onDone,
  onCancel,
}: {
  programId: string;
  initial?: ProgramSize | null;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(programSizeSchema),
    defaultValues: initial
      ? { ...initial }
      : { program_id: programId, size_currency: "USD", is_available: true },
  });

  async function onSubmit(values: Record<string, unknown>) {
    setServerError(null);
    try {
      if (initial) await updateProgramSize(initial.id, { ...values, program_id: programId });
      else await createProgramSize({ ...values, program_id: programId });
      onDone();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {serverError && <Alert tone="error">{serverError}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Account size" error={formError(errors, "account_size")}>
          <Input type="number" step="any" {...register("account_size")} />
        </Field>
        <Field label="Size currency" error={formError(errors, "size_currency")}>
          <Input maxLength={3} {...register("size_currency")} />
        </Field>
        <Field label="Fee (blank = not verified)" error={formError(errors, "fee")}>
          <Input type="number" step="any" {...register("fee")} />
        </Field>
        <Field label="Fee currency" error={formError(errors, "fee_currency")}>
          <Input maxLength={3} {...register("fee_currency")} />
        </Field>
        <div className="flex items-end pb-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <Checkbox {...register("is_available")} /> Available
          </label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : initial ? "Save size" : "Add size"}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function SizesCard({ programId, initialSizes }: { programId: string; initialSizes: ProgramSize[] }) {
  const router = useRouter();
  const [sizes, setSizes] = useState(initialSizes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setSizes(await listProgramSizes(programId));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refresh failed.");
    }
  }

  return (
    <Card className="p-6">
      <SectionTitle hint="Account sizes and their fees. Leave fee blank when not verified — never enter 0 as a placeholder.">
        Account sizes
      </SectionTitle>
      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {sizes.length > 0 && (
        <div className="mb-4">
          <Table>
            <THead>
              <TRow>
                <TH>Size</TH>
                <TH>Fee</TH>
                <TH>Available</TH>
                <TH><span className="sr-only">Actions</span></TH>
              </TRow>
            </THead>
            <tbody>
              {sizes.map((s) => (
                <TRow key={s.id}>
                  <TCell className="font-semibold">
                    {fmtMoney(s.account_size, s.size_currency)}
                  </TCell>
                  <TCell>{fmtMoney(s.fee, s.fee_currency)}</TCell>
                  <TCell>
                    <Badge tone={s.is_available ? "green" : "gray"}>{s.is_available ? "Yes" : "No"}</Badge>
                  </TCell>
                  <TCell className="whitespace-nowrap text-right">
                    <span className="inline-flex gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setEditingId(s.id)}>
                        Edit
                      </Button>
                      <ConfirmDelete label="Delete" onConfirm={async () => { await deleteProgramSize(s.id); await refresh(); }} />
                    </span>
                  </TCell>
                </TRow>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      {editingId && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm font-semibold text-ink">Edit size</p>
          <SizeForm
            programId={programId}
            initial={sizes.find((s) => s.id === editingId) ?? null}
            onCancel={() => setEditingId(null)}
            onDone={() => {
              setEditingId(null);
              refresh();
            }}
          />
        </div>
      )}
      {adding ? (
        <SizeForm
          programId={programId}
          onCancel={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            refresh();
          }}
        />
      ) : (
        <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(true)}>
          + Add size
        </Button>
      )}
    </Card>
  );
}

/* ---------------- rules ---------------- */

export function RulesCard({
  programId,
  initial,
  sizes,
}: {
  programId: string;
  initial: ProgramRules | null;
  sizes: ProgramSize[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Record<string, unknown>>({
    defaultValues: {
      account_size_id: initial?.account_size_id ?? "",
      phases: initial?.phases ?? "",
      phase_names: (initial?.phase_names ?? []).join(", "),
      profit_target_p1_pct: initial?.profit_target_p1_pct ?? "",
      profit_target_p2_pct: initial?.profit_target_p2_pct ?? "",
      profit_target_p3_pct: initial?.profit_target_p3_pct ?? "",
      daily_drawdown_pct: initial?.daily_drawdown_pct ?? "",
      max_drawdown_pct: initial?.max_drawdown_pct ?? "",
      drawdown_type: initial?.drawdown_type ?? "",
      drawdown_basis: initial?.drawdown_basis ?? "",
      min_trading_days: initial?.min_trading_days ?? "",
      max_duration_days: initial?.max_duration_days ?? "",
      consistency_rule: initial?.consistency_rule ?? "",
      news_trading_rule: initial?.news_trading_rule ?? "",
      weekend_holding_rule: initial?.weekend_holding_rule ?? "",
      ea_allowed: triToString(initial?.ea_allowed),
      copy_trading_rule: initial?.copy_trading_rule ?? "",
      prohibited_strategies: initial?.prohibited_strategies ?? "",
      lot_risk_restriction: initial?.lot_risk_restriction ?? "",
      verification_status: initial?.verification_status ?? "needs_verification",
      verified_at: toLocalInput(initial?.verified_at),
      source_url: initial?.source_url ?? "",
    },
  });

  async function onSubmit(values: Record<string, unknown>) {
    setServerError(null);
    setSaved(false);
    try {
      const v = values.verified_at as string;
      await upsertProgramRules(programId, {
        ...values,
        ea_allowed: triFromString(values.ea_allowed as string),
        verified_at: v ? new Date(v).toISOString() : null,
      });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed.");
    }
  }

  const num = (name: string, label: string, hint?: string) => (
    <Field label={label} hint={hint}>
      <Input type="number" step="any" {...register(name)} />
    </Field>
  );
  const text = (name: string, label: string, rows = 2) => (
    <Field label={label}>
      <Textarea rows={rows} {...register(name)} />
    </Field>
  );

  return (
    <Card className="p-6">
      <SectionTitle hint="Leave any field blank when not verified. Blank numerics stay null — never 0.">
        Rules {initial && <VerificationBadgeInline status={initial.verification_status} />}
      </SectionTitle>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        {saved && <Alert tone="success">Rules saved.</Alert>}

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Applies to size">
            <Select {...register("account_size_id")}>
              <option value="">Whole program</option>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {fmtMoney(s.account_size, s.size_currency)}
                </option>
              ))}
            </Select>
          </Field>
          {num("phases", "Phases")}
          <Field label="Phase names" hint="comma-separated">
            <Input {...register("phase_names")} placeholder="Evaluation, Verification" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {num("profit_target_p1_pct", "Profit target P1 %")}
          {num("profit_target_p2_pct", "Profit target P2 %")}
          {num("profit_target_p3_pct", "Profit target P3 %")}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {num("daily_drawdown_pct", "Daily drawdown %")}
          {num("max_drawdown_pct", "Max drawdown %")}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Drawdown type">
            <Select {...register("drawdown_type")}>
              <option value="">Not verified</option>
              <option value="static">Static</option>
              <option value="trailing">Trailing</option>
            </Select>
          </Field>
          <Field label="Drawdown basis">
            <Input {...register("drawdown_basis")} placeholder="e.g. balance-based" />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {num("min_trading_days", "Min trading days")}
          {num("max_duration_days", "Max duration days", "blank = unlimited")}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {text("consistency_rule", "Consistency rule")}
          {text("news_trading_rule", "News trading rule")}
          {text("weekend_holding_rule", "Weekend holding rule")}
          {text("copy_trading_rule", "Copy trading rule")}
        </div>
        {text("prohibited_strategies", "Prohibited strategies")}
        {text("lot_risk_restriction", "Lot / risk restriction")}

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="EAs allowed">
            <Select {...register("ea_allowed")}>
              <option value="">Not verified</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Field>
          <Field label="Verification status">
            <Select {...register("verification_status")}>
              <option value="needs_verification">Needs verification</option>
              <option value="verified">Verified</option>
              <option value="stale">Stale</option>
            </Select>
          </Field>
          <Field label="Verified at" hint="blank + verified = now">
            <Input type="datetime-local" {...register("verified_at")} />
          </Field>
        </div>
        <Field label="Source URL">
          <Input type="url" placeholder="https://" {...register("source_url")} />
        </Field>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save rules"}
        </Button>
      </form>
    </Card>
  );
}

function VerificationBadgeInline({ status }: { status: string }) {
  const b = verificationBadge(status);
  return <Badge tone={b.tone}>{b.label}</Badge>;
}

/* ---------------- platforms ---------------- */

export function PlatformsCard({ programId, initial }: { programId: string; initial: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initial);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function toggle(p: string) {
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  async function save() {
    setServerError(null);
    setSaved(false);
    setBusy(true);
    try {
      await setProgramPlatforms(programId, selected);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <SectionTitle>Platforms</SectionTitle>
      {serverError && (
        <div className="mb-4">
          <Alert tone="error">{serverError}</Alert>
        </div>
      )}
      {saved && (
        <div className="mb-4">
          <Alert tone="success">Platforms saved.</Alert>
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        {PLATFORM_OPTIONS.map((p) => (
          <label key={p} className="flex items-center gap-2 text-sm font-medium text-ink">
            <Checkbox checked={selected.includes(p)} onChange={() => toggle(p)} />
            {p === "mt4" ? "MT4" : p === "mt5" ? "MT5" : p === "ctrader" ? "cTrader" : p === "dxfeed" ? "DXFeed" : p === "match_trader" ? "Match-Trader" : "Other"}
          </label>
        ))}
      </div>
      <div className="mt-5">
        <Button type="button" size="sm" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save platforms"}
        </Button>
      </div>
    </Card>
  );
}

/* ---------------- instruments ---------------- */

export function InstrumentsCard({ programId, initial }: { programId: string; initial: string[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initial);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  function toggle(c: string) {
    setSelected((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  async function save() {
    setServerError(null);
    setSaved(false);
    setBusy(true);
    try {
      await setProgramInstruments(programId, selected);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-6">
      <SectionTitle>Instruments</SectionTitle>
      {serverError && (
        <div className="mb-4">
          <Alert tone="error">{serverError}</Alert>
        </div>
      )}
      {saved && (
        <div className="mb-4">
          <Alert tone="success">Instruments saved.</Alert>
        </div>
      )}
      <div className="flex flex-wrap gap-4">
        {INSTRUMENT_OPTIONS.map((c) => (
          <label key={c} className="flex items-center gap-2 text-sm font-medium capitalize text-ink">
            <Checkbox checked={selected.includes(c)} onChange={() => toggle(c)} />
            {c}
          </label>
        ))}
      </div>
      <div className="mt-5">
        <Button type="button" size="sm" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save instruments"}
        </Button>
      </div>
    </Card>
  );
}

/* ---------------- payout ---------------- */

export function PayoutCard({
  programId,
  initial,
  sizes,
}: {
  programId: string;
  initial: ProgramPayout | null;
  sizes: ProgramSize[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Record<string, unknown>>({
    defaultValues: {
      account_size_id: initial?.account_size_id ?? "",
      profit_split_pct: initial?.profit_split_pct ?? "",
      first_payout_eligibility: initial?.first_payout_eligibility ?? "",
      payout_frequency: initial?.payout_frequency ?? "",
      min_payout: initial?.min_payout ?? "",
      min_payout_currency: initial?.min_payout_currency ?? "",
      withdrawal_methods: initial?.withdrawal_methods ?? "",
      payout_conditions: initial?.payout_conditions ?? "",
      refund_policy: initial?.refund_policy ?? "",
      verification_status: initial?.verification_status ?? "needs_verification",
      verified_at: toLocalInput(initial?.verified_at),
      source_url: initial?.source_url ?? "",
    },
  });

  async function onSubmit(values: Record<string, unknown>) {
    setServerError(null);
    setSaved(false);
    try {
      const v = values.verified_at as string;
      await upsertProgramPayout(programId, {
        ...values,
        verified_at: v ? new Date(v).toISOString() : null,
      });
      setSaved(true);
      router.refresh();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Save failed.");
    }
  }

  return (
    <Card className="p-6">
      <SectionTitle hint="Leave any field blank when not verified.">
        Payout {initial && <VerificationBadgeInline status={initial.verification_status} />}
      </SectionTitle>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        {saved && <Alert tone="success">Payout saved.</Alert>}

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Applies to size">
            <Select {...register("account_size_id")}>
              <option value="">Whole program</option>
              {sizes.map((s) => (
                <option key={s.id} value={s.id}>
                  {fmtMoney(s.account_size, s.size_currency)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Profit split %">
            <Input type="number" step="any" {...register("profit_split_pct")} />
          </Field>
          <Field label="Payout frequency">
            <Input {...register("payout_frequency")} placeholder="e.g. bi-weekly" />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="First payout eligibility">
            <Input {...register("first_payout_eligibility")} />
          </Field>
          <Field label="Min payout (blank = not verified)">
            <Input type="number" step="any" {...register("min_payout")} />
          </Field>
          <Field label="Min payout currency">
            <Input maxLength={3} {...register("min_payout_currency")} />
          </Field>
        </div>
        <Field label="Withdrawal methods">
          <Textarea rows={2} {...register("withdrawal_methods")} />
        </Field>
        <Field label="Payout conditions">
          <Textarea rows={2} {...register("payout_conditions")} />
        </Field>
        <Field label="Refund policy">
          <Textarea rows={2} {...register("refund_policy")} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Verification status">
            <Select {...register("verification_status")}>
              <option value="needs_verification">Needs verification</option>
              <option value="verified">Verified</option>
              <option value="stale">Stale</option>
            </Select>
          </Field>
          <Field label="Verified at" hint="blank + verified = now">
            <Input type="datetime-local" {...register("verified_at")} />
          </Field>
          <Field label="Source URL">
            <Input type="url" placeholder="https://" {...register("source_url")} />
          </Field>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save payout"}
        </Button>
      </form>
    </Card>
  );
}

/* ---------------- danger zone ---------------- */

export function ProgramDangerZone({ program }: { program: Program }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleArchive() {
    setError(null);
    setBusy(true);
    try {
      await setProgramArchived(program.id, !program.is_archived);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-red-200 p-6">
      <h2 className="text-base font-bold text-red-700">Danger zone</h2>
      {error && (
        <div className="mt-3">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={toggleArchive} disabled={busy}>
          {program.is_archived ? "Unarchive program" : "Archive program"}
        </Button>
        <ConfirmDelete
          label="Delete program"
          title={`Delete ${program.name}?`}
          body="The program and all its sizes, rules, platforms, instruments and payout data are deleted permanently."
          onConfirm={async () => {
            await deleteProgram(program.id);
            router.push("/admin/programs");
          }}
        />
      </div>
    </Card>
  );
}
