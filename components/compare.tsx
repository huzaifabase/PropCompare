"use client";

/**
 * Comparison engine UI (client components).
 *
 * Server pages fetch ProgramRow[] once; all filtering/sorting happens in the
 * browser via the pure helpers in lib/compare.ts. Nulls always render as
 * "Not verified" (lib/format.ts) — never invented.
 */
import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Copy, ExternalLink, Search, X } from "lucide-react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Field,
  Input,
  SectionHeading,
  Select,
  Table,
  THead,
  TH,
  TRow,
  TCell,
} from "./ui";
import { NOT_VERIFIED, cx, fmtBool, fmtDate, fmtMoney, fmtPct, fmtText, verificationBadge } from "@/lib/format";
import {
  MAX_COMPARE_PROGRAMS,
  SORT_LABELS,
  SORTS,
  applyFilters,
  applyFinderFilters,
  buildCompareParams,
  buildGoUrl,
  getMatchReasons,
  sortRows,
  type CompareFilterState,
  type CompareSort,
  type FinderState,
} from "@/lib/compare";
import type { Firm, ProgramCategory, ProgramDetail, ProgramRow, ProgramSize } from "@/lib/types";

/* ---------------- shared bits ---------------- */

const CATEGORY_OPTIONS: { value: ProgramCategory; label: string }[] = [
  { value: "one_step", label: "1-Step" },
  { value: "two_step", label: "2-Step" },
  { value: "three_step", label: "3-Step" },
  { value: "instant", label: "Instant" },
  { value: "other", label: "Other" },
];

function categoryLabel(c: string): string {
  return CATEGORY_OPTIONS.find((o) => o.value === c)?.label ?? c;
}

function fmtSize(amount: number | null, currency?: string | null): string {
  if (amount === null || amount === undefined) return NOT_VERIFIED;
  const cur = currency || "USD";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${cur} ${amount}`;
  }
}

/** Short affiliate disclosure rendered near CTAs (mirrors components/site AffiliateNote). */
function CtaNote({ className = "" }: { className?: string }) {
  return (
    <p className={cx("text-xs text-muted", className)}>
      Affiliate link — we may earn a commission if you purchase through it, at no extra cost to you.{" "}
      <Link href="/affiliate-disclosure" className="underline hover:text-ink">
        Learn more
      </Link>
    </p>
  );
}

function goSlug(firmSlug: string, programSlug: string): string {
  return `${firmSlug}--${programSlug}`;
}

function toggleList(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

/* ---------------- FilterBar ---------------- */

interface FilterBarProps {
  filters: CompareFilterState;
  onChange: (f: CompareFilterState) => void;
  onClear: () => void;
  firms: Pick<Firm, "slug" | "name">[];
  platforms: string[];
  payoutFrequencies: string[];
}

export function FilterBar({ filters, onChange, onClear, firms, platforms, payoutFrequencies }: FilterBarProps) {
  const set = (patch: Partial<CompareFilterState>) => onChange({ ...filters, ...patch });
  const num = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  return (
    <Card className="p-5">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <Field label="Search" htmlFor="cmp-search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="cmp-search"
              type="search"
              placeholder="Firm or program name…"
              className="pl-9"
              value={filters.search}
              onChange={(e) => set({ search: e.target.value })}
            />
          </div>
        </Field>

        <Field label="Sort by" htmlFor="cmp-sort">
          <Select id="cmp-sort" value={filters.sort} onChange={(e) => set({ sort: e.target.value as CompareSort })}>
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {SORT_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-semibold text-ink">Firms</legend>
          <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
            {firms.map((f) => (
              <label key={f.slug} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:border-accent">
                <Checkbox
                  checked={filters.firmSlugs.includes(f.slug)}
                  onChange={() => set({ firmSlugs: toggleList(filters.firmSlugs, f.slug) })}
                />
                {f.name}
              </label>
            ))}
            {firms.length === 0 && <p className="text-sm text-muted">No firms available.</p>}
          </div>
        </fieldset>

        <Field label="Min account size (USD)" htmlFor="cmp-sizemin">
          <Input
            id="cmp-sizemin"
            type="number"
            min={0}
            placeholder="e.g. 10000"
            value={filters.sizeMin ?? ""}
            onChange={(e) => set({ sizeMin: num(e.target.value) })}
          />
        </Field>

        <Field label="Max account size (USD)" htmlFor="cmp-sizemax">
          <Input
            id="cmp-sizemax"
            type="number"
            min={0}
            placeholder="e.g. 200000"
            value={filters.sizeMax ?? ""}
            onChange={(e) => set({ sizeMax: num(e.target.value) })}
          />
        </Field>

        <Field label="Max fee (USD)" htmlFor="cmp-maxfee" hint="Programs with no listed fee are excluded.">
          <Input
            id="cmp-maxfee"
            type="number"
            min={0}
            placeholder="e.g. 500"
            value={filters.maxFee ?? ""}
            onChange={(e) => set({ maxFee: num(e.target.value) })}
          />
        </Field>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-semibold text-ink">Challenge type</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <label key={c.value} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:border-accent">
                <Checkbox
                  checked={filters.categories.includes(c.value)}
                  onChange={() =>
                    set({
                      categories: (filters.categories.includes(c.value)
                        ? filters.categories.filter((x) => x !== c.value)
                        : [...filters.categories, c.value]) as ProgramCategory[],
                    })
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-semibold text-ink">Platform (matches any)</legend>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <label key={p} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:border-accent">
                <Checkbox checked={filters.platforms.includes(p)} onChange={() => set({ platforms: toggleList(filters.platforms, p) })} />
                {p}
              </label>
            ))}
            {platforms.length === 0 && <p className="text-sm text-muted">No platforms listed.</p>}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-semibold text-ink">Payout frequency</legend>
          <div className="flex flex-wrap gap-2">
            {payoutFrequencies.map((p) => (
              <label key={p} className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-sm hover:border-accent">
                <Checkbox
                  checked={filters.payoutFrequencies.includes(p)}
                  onChange={() => set({ payoutFrequencies: toggleList(filters.payoutFrequencies, p) })}
                />
                {p}
              </label>
            ))}
            {payoutFrequencies.length === 0 && <p className="text-sm text-muted">No frequencies listed.</p>}
          </div>
        </fieldset>

        <div className="flex items-end gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-ink">
            <Checkbox
              checked={filters.verifiedDiscountOnly}
              onChange={(e) => set({ verifiedDiscountOnly: e.target.checked })}
            />
            Verified discount only
          </label>
          <Button variant="ghost" size="sm" onClick={onClear} className="ml-auto">
            <X className="h-4 w-4" aria-hidden /> Clear all
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ---------------- ProgramPicker ---------------- */

interface ProgramPickerProps {
  rows: ProgramRow[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function ProgramPicker({ rows, selectedIds, onChange }: ProgramPickerProps) {
  const [q, setQ] = useState("");
  const programs = useMemo(() => {
    const map = new Map<string, { id: string; firmName: string; name: string; sizes: number }>();
    for (const r of rows) {
      const ex = map.get(r.program.id);
      if (ex) ex.sizes += 1;
      else map.set(r.program.id, { id: r.program.id, firmName: r.firm.name, name: r.program.name, sizes: 1 });
    }
    return [...map.values()].sort((a, b) => `${a.firmName} ${a.name}`.localeCompare(`${b.firmName} ${b.name}`));
  }, [rows]);

  const visible = programs.filter((p) =>
    `${p.firmName} ${p.name}`.toLowerCase().includes(q.trim().toLowerCase())
  );

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else if (selectedIds.length < MAX_COMPARE_PROGRAMS) onChange([...selectedIds, id]);
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Pick programs to compare</h2>
        <span className="text-sm text-muted">
          {selectedIds.length}/{MAX_COMPARE_PROGRAMS} selected
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Selected programs">
          {selectedIds.map((id) => {
            const p = programs.find((x) => x.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 py-1 pl-3 pr-1.5 text-sm font-medium text-white">
                {p ? `${p.firmName} — ${p.name}` : id}
                <button
                  type="button"
                  onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                  aria-label={`Remove ${p?.name ?? id}`}
                  className="rounded-full p-0.5 hover:bg-white/20"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input
          type="search"
          placeholder="Search programs…"
          className="pl-9"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search programs to compare"
        />
      </div>

      <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto" aria-label="Program options">
        {visible.map((p) => {
          const checked = selectedIds.includes(p.id);
          const disabled = !checked && selectedIds.length >= MAX_COMPARE_PROGRAMS;
          return (
            <li key={p.id}>
              <label
                className={cx(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                  checked ? "border-accent bg-emerald-50" : "border-slate-200 hover:border-slate-300",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <Checkbox checked={checked} disabled={disabled} onChange={() => toggle(p.id)} />
                <span className="font-medium text-ink">{p.firmName}</span>
                <span className="text-muted">— {p.name}</span>
                <span className="ml-auto text-xs text-muted">
                  {p.sizes} {p.sizes === 1 ? "size" : "sizes"}
                </span>
                {checked && <Check className="h-4 w-4 text-accent-dark" aria-hidden />}
              </label>
            </li>
          );
        })}
        {visible.length === 0 && <li className="py-4 text-center text-sm text-muted">No programs match your search.</li>}
      </ul>
    </Card>
  );
}

/* ---------------- CompareTable ---------------- */

function rangeMoney(sizes: ProgramSize[]): string {
  const fees = sizes.filter((s) => s.fee !== null && s.fee !== undefined);
  if (fees.length === 0) return NOT_VERIFIED;
  const min = Math.min(...fees.map((s) => s.fee as number));
  const max = Math.max(...fees.map((s) => s.fee as number));
  const cur = fees[0].fee_currency;
  return min === max ? fmtMoney(min, cur) : `${fmtMoney(min, cur)} – ${fmtMoney(max, cur)}`;
}

function rangeSize(sizes: ProgramSize[]): string {
  if (sizes.length === 0) return NOT_VERIFIED;
  const vals = sizes.map((s) => s.account_size).filter((v): v is number => v !== null && v !== undefined);
  if (vals.length === 0) return NOT_VERIFIED;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const cur = sizes[0].size_currency;
  return min === max ? fmtSize(min, cur) : `${fmtSize(min, cur)} – ${fmtSize(max, cur)}`;
}

interface SpecRow {
  label: string;
  get: (d: ProgramDetail) => React.ReactNode;
}

const GROUPS: { title: string; rows: SpecRow[] }[] = [
  {
    title: "Identification",
    rows: [
      { label: "Firm", get: (d) => d.firm.name },
      { label: "Program", get: (d) => d.name },
      { label: "Challenge type", get: (d) => categoryLabel(d.category) },
      { label: "Description", get: (d) => fmtText(d.description) },
    ],
  },
  {
    title: "Pricing",
    rows: [
      { label: "Account sizes", get: (d) => rangeSize(d.sizes) },
      { label: "One-time fee", get: (d) => rangeMoney(d.sizes) },
    ],
  },
  {
    title: "Evaluation",
    rows: [
      { label: "Phases", get: (d) => (d.rules && d.rules.phases !== null ? String(d.rules.phases) : NOT_VERIFIED) },
      { label: "Profit target — Phase 1", get: (d) => fmtPct(d.rules?.profit_target_p1_pct) },
      { label: "Profit target — Phase 2", get: (d) => fmtPct(d.rules?.profit_target_p2_pct) },
      { label: "Profit target — Phase 3", get: (d) => fmtPct(d.rules?.profit_target_p3_pct) },
      { label: "Daily drawdown", get: (d) => fmtPct(d.rules?.daily_drawdown_pct) },
      { label: "Max drawdown", get: (d) => fmtPct(d.rules?.max_drawdown_pct) },
      { label: "Drawdown type", get: (d) => fmtText(d.rules?.drawdown_type) },
      { label: "Drawdown basis", get: (d) => fmtText(d.rules?.drawdown_basis) },
      { label: "Min trading days", get: (d) => (d.rules && d.rules.min_trading_days !== null ? String(d.rules.min_trading_days) : NOT_VERIFIED) },
      {
        label: "Max duration",
        get: (d) =>
          !d.rules ? NOT_VERIFIED : d.rules.max_duration_days === null ? "Unlimited (no time limit)" : `${d.rules.max_duration_days} days`,
      },
      { label: "Consistency rule", get: (d) => fmtText(d.rules?.consistency_rule) },
    ],
  },
  {
    title: "Trading",
    rows: [
      { label: "Platforms", get: (d) => (d.platforms.length ? d.platforms.join(", ") : NOT_VERIFIED) },
      {
        label: "Instruments",
        get: (d) => (d.instruments.length ? d.instruments.map((i) => i.instrument_class).join(", ") : NOT_VERIFIED),
      },
      { label: "News trading rule", get: (d) => fmtText(d.rules?.news_trading_rule) },
      { label: "Weekend holding", get: (d) => fmtText(d.rules?.weekend_holding_rule) },
      { label: "EAs allowed", get: (d) => fmtBool(d.rules?.ea_allowed) },
      { label: "Copy trading", get: (d) => fmtText(d.rules?.copy_trading_rule) },
      { label: "Prohibited strategies", get: (d) => fmtText(d.rules?.prohibited_strategies) },
    ],
  },
  {
    title: "Payout",
    rows: [
      { label: "Profit split", get: (d) => fmtPct(d.payout?.profit_split_pct) },
      { label: "Payout frequency", get: (d) => fmtText(d.payout?.payout_frequency) },
      { label: "First payout", get: (d) => fmtText(d.payout?.first_payout_eligibility) },
      { label: "Min payout", get: (d) => fmtMoney(d.payout?.min_payout, d.payout?.min_payout_currency) },
      { label: "Withdrawal methods", get: (d) => fmtText(d.payout?.withdrawal_methods) },
      { label: "Refund policy", get: (d) => fmtText(d.payout?.refund_policy) },
    ],
  },
  {
    title: "Business info",
    rows: [
      {
        label: "Official website",
        get: (d) => (
          <a href={d.firm.official_website} target="_blank" rel="noopener noreferrer sponsored" className="inline-flex items-center gap-1 font-medium text-accent-dark underline hover:text-accent">
            Visit site <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        ),
      },
      { label: "Firm tagline", get: (d) => fmtText(d.firm.tagline) },
      { label: "Last verified", get: (d) => fmtDate(d.rules?.verified_at ?? d.last_verified_at) },
    ],
  },
];

export function CompareTable({ rows }: { rows: ProgramDetail[] }) {
  const bases = useMemo(() => {
    const set = new Set<string>();
    for (const d of rows) if (d.rules?.drawdown_basis) set.add(d.rules.drawdown_basis.trim().toLowerCase());
    return [...set];
  }, [rows]);
  const mixedBases = bases.length > 1;

  if (rows.length === 0) {
    return <EmptyState title="No programs selected" body="Pick up to 4 programs above to compare them side by side." />;
  }

  return (
    <div>
      {mixedBases && (
        <Alert tone="warning">
          <span className="inline-flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            Drawdown calculated differently — not directly comparable.
          </span>
          <span className="mt-1 block">
            The compared programs use different drawdown bases ({bases.join(" vs ")}). Their drawdown percentages cannot be compared like-for-like.
          </span>
        </Alert>
      )}
      <Table className="mt-4">
        <THead>
          <tr>
            <TH className="w-44">Spec</TH>
            {rows.map((d) => (
              <TH key={d.id}>
                <span className="block font-bold text-ink normal-case">{d.firm.name}</span>
                <span className="block font-medium text-muted normal-case">{d.name}</span>
                <span className="mt-1 block">
                  <Badge tone={verificationBadge(d.rules?.verification_status).tone}>
                    {verificationBadge(d.rules?.verification_status).label}
                  </Badge>
                </span>
              </TH>
            ))}
          </tr>
        </THead>
        <tbody>
          {GROUPS.map((g) => (
            <Fragment key={g.title}>
              <tr className="border-t border-slate-200 bg-slate-100">
                <td colSpan={rows.length + 1} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-navy-900">
                  {g.title}
                </td>
              </tr>
              {g.rows.map((r) => (
                <TRow key={r.label}>
                  <TCell className="font-medium text-muted">{r.label}</TCell>
                  {rows.map((d) => (
                    <TCell key={d.id}>{r.get(d)}</TCell>
                  ))}
                </TRow>
              ))}
            </Fragment>
          ))}
          <TRow>
            <TCell className="font-medium text-muted">Get started</TCell>
            {rows.map((d) => (
              <TCell key={d.id}>
                <Link href={buildGoUrl(goSlug(d.firm.slug, d.slug), undefined, "compare")}>
                  <Button size="sm" className="w-full">
                    Visit {d.firm.name} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </Link>
              </TCell>
            ))}
          </TRow>
        </tbody>
      </Table>
      <CtaNote className="mt-3" />
    </div>
  );
}

/* ---------------- CompareCards (mobile) ---------------- */

export function CompareCards({ rows }: { rows: ProgramDetail[] }) {
  if (rows.length === 0) {
    return <EmptyState title="No programs selected" body="Pick up to 4 programs above to compare them." />;
  }
  return (
    <div className="space-y-4">
      {rows.map((d) => {
        const vb = verificationBadge(d.rules?.verification_status);
        return (
          <Card key={d.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{d.firm.name}</p>
                <h3 className="text-lg font-bold text-ink">{d.name}</h3>
              </div>
              <Badge tone={vb.tone}>{vb.label}</Badge>
            </div>
            <div className="mt-4 space-y-4">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="mb-1.5 border-b border-slate-100 pb-1 text-xs font-bold uppercase tracking-wider text-navy-900">
                    {g.title}
                  </p>
                  <dl className="space-y-1.5">
                    {g.rows.map((r) => (
                      <div key={r.label} className="flex justify-between gap-3 text-sm">
                        <dt className="shrink-0 text-muted">{r.label}</dt>
                        <dd className="text-right font-medium text-ink">{r.get(d)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
            <Link href={buildGoUrl(goSlug(d.firm.slug, d.slug), undefined, "compare")} className="mt-5 block">
              <Button className="w-full">
                Visit {d.firm.name} <ExternalLink className="h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <CtaNote className="mt-2" />
          </Card>
        );
      })}
    </div>
  );
}

/* ---------------- CompareClient (page shell) ---------------- */

function detailForProgram(rows: ProgramRow[], programId: string): ProgramDetail | null {
  const rs = rows.filter((r) => r.program.id === programId);
  if (rs.length === 0) return null;
  const first = rs[0];
  return {
    ...first.program,
    firm: first.firm,
    sizes: rs.map((r) => r.size).sort((a, b) => (a.account_size ?? 0) - (b.account_size ?? 0)),
    rules: first.rules,
    platforms: first.platforms,
    instruments: [],
    payout: first.payout,
  };
}

interface CompareClientProps {
  initialRows: ProgramRow[];
  firms: Pick<Firm, "slug" | "name">[];
  initialFilters: CompareFilterState;
}

export function CompareClient({ initialRows, firms, initialFilters }: CompareClientProps) {
  const [filters, setFilters] = useState<CompareFilterState>(initialFilters);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() => sortRows(applyFilters(initialRows, filters), filters.sort), [initialRows, filters]);

  const platforms = useMemo(() => [...new Set(initialRows.flatMap((r) => r.platforms))].sort(), [initialRows]);
  const payoutFrequencies = useMemo(
    () =>
      [...new Set(initialRows.map((r) => r.payout?.payout_frequency).filter((x): x is string => !!x))].sort(),
    [initialRows]
  );

  const details = useMemo(
    () => filters.selectedIds.map((id) => detailForProgram(initialRows, id)).filter((d): d is ProgramDetail => d !== null),
    [initialRows, filters.selectedIds]
  );

  // Keep the URL shareable without reloading.
  useEffect(() => {
    const qs = buildCompareParams(filters);
    window.history.replaceState(null, "", qs ? `/compare?${qs}` : "/compare");
  }, [filters]);

  const updateFilters = (f: CompareFilterState) => setFilters({ ...f, selectedIds: f.selectedIds.slice(0, MAX_COMPARE_PROGRAMS) });

  const copyLink = async () => {
    try {
      const qs = buildCompareParams(filters);
      await navigator.clipboard.writeText(`${window.location.origin}/compare${qs ? `?${qs}` : ""}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          kicker="Comparison engine"
          title="Compare prop firm challenges"
          sub="Filter programs, then pin up to four side by side. Every value comes from the firm's published terms — unknown values show as “Not verified”."
        />
        <Button variant="secondary" size="sm" onClick={copyLink}>
          <Copy className="h-4 w-4" aria-hidden /> {copied ? "Link copied!" : "Copy share link"}
        </Button>
      </div>

      <FilterBar
        filters={filters}
        onChange={updateFilters}
        onClear={() => updateFilters({ ...initialFilters, selectedIds: filters.selectedIds, sort: filters.sort })}
        firms={firms}
        platforms={platforms}
        payoutFrequencies={payoutFrequencies}
      />

      <p className="text-sm text-muted" role="status" aria-live="polite">
        <strong className="text-ink">{filtered.length}</strong> {filtered.length === 1 ? "program" : "programs"} match your filters
        {initialRows.length > 0 && ` (out of ${initialRows.length} listed)`}.
      </p>

      <ProgramPicker rows={filtered} selectedIds={filters.selectedIds} onChange={(ids) => updateFilters({ ...filters, selectedIds: ids })} />

      <section aria-label="Side-by-side comparison">
        <div className="hidden lg:block">
          <CompareTable rows={details} />
        </div>
        <div className="lg:hidden">
          <CompareCards rows={details} />
        </div>
      </section>

      <section aria-label="Methodology" className="grid gap-6 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-bold text-ink">How we compare</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Values are researched from each firm&apos;s official published terms.</li>
            <li>Anything we cannot verify shows as “Not verified” — we never guess.</li>
            <li>Fees with a max-fee filter applied exclude programs with no listed fee.</li>
            <li>Platform filters match any selected platform a program supports.</li>
            <li>Drawdown figures are only comparable when the calculation basis matches; a warning appears otherwise.</li>
          </ul>
        </Card>
        <Alert tone="warning">
          <strong>Disclaimer.</strong> Program terms can change. Verify on the firm&apos;s official site before purchasing.
          Prop trading involves substantial risk of loss; most traders do not pass evaluations, and challenge fees are
          generally non-refundable if you breach the rules.
        </Alert>
      </section>
    </div>
  );
}

/* ---------------- Challenge finder ---------------- */

const FINDER_DEFAULTS: FinderState = {
  accountSize: null,
  maxFee: null,
  phases: null,
  platform: null,
  minDailyDrawdown: null,
  minMaxDrawdown: null,
  payoutFrequency: null,
  avoidNewsRestriction: false,
  avoidWeekendRestriction: false,
  requireEaAllowed: false,
  requireCopyTradingAllowed: false,
};

export function ChallengeFinderClient({ initialRows }: { initialRows: ProgramRow[] }) {
  const [finder, setFinder] = useState<FinderState>(FINDER_DEFAULTS);

  const sizes = useMemo(
    () => [...new Set(initialRows.map((r) => r.size.account_size).filter((v): v is number => v !== null))].sort((a, b) => a - b),
    [initialRows]
  );
  const platforms = useMemo(() => [...new Set(initialRows.flatMap((r) => r.platforms))].sort(), [initialRows]);
  const payoutFrequencies = useMemo(
    () => [...new Set(initialRows.map((r) => r.payout?.payout_frequency).filter((x): x is string => !!x))].sort(),
    [initialRows]
  );

  const results = useMemo(() => applyFinderFilters(initialRows, finder), [initialRows, finder]);

  const set = (patch: Partial<FinderState>) => setFinder({ ...finder, ...patch });
  const numOrNull = (v: string): number | null => {
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };

  return (
    <div className="space-y-8">
      <SectionHeading
        kicker="Challenge finder"
        title="Find a challenge that fits how you trade"
        sub="Answer a few questions and we'll match programs against their published rules. Unknown rules are never treated as a pass — we flag them so you can check."
      />

      <Card className="p-5">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <Field label="Desired account size" htmlFor="cf-size">
            <Select id="cf-size" value={finder.accountSize ?? ""} onChange={(e) => set({ accountSize: numOrNull(e.target.value) })}>
              <option value="">Any size</option>
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {fmtSize(s)}+
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Max fee (USD)" htmlFor="cf-fee" hint="Compared by face value — no currency conversion is applied.">
            <Input
              id="cf-fee"
              type="number"
              min={0}
              placeholder="e.g. 500"
              value={finder.maxFee ?? ""}
              onChange={(e) => set({ maxFee: numOrNull(e.target.value) })}
            />
          </Field>

          <Field label="Evaluation phases" htmlFor="cf-phases">
            <Select id="cf-phases" value={finder.phases ?? ""} onChange={(e) => set({ phases: numOrNull(e.target.value) })}>
              <option value="">Any</option>
              <option value="1">1 phase</option>
              <option value="2">2 phases</option>
              <option value="3">3 phases</option>
            </Select>
          </Field>

          <Field label="Platform" htmlFor="cf-platform">
            <Select id="cf-platform" value={finder.platform ?? ""} onChange={(e) => set({ platform: e.target.value || null })}>
              <option value="">Any platform</option>
              {platforms.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Daily drawdown allowance — at least" htmlFor="cf-dd" hint="Programs allowing less are excluded.">
            <div className="flex items-center gap-2">
              <Input
                id="cf-dd"
                type="number"
                min={0}
                step={0.5}
                placeholder="e.g. 5"
                value={finder.minDailyDrawdown ?? ""}
                onChange={(e) => set({ minDailyDrawdown: numOrNull(e.target.value) })}
              />
              <span className="text-sm text-muted">%</span>
            </div>
          </Field>

          <Field label="Max drawdown allowance — at least" htmlFor="cf-mdd" hint="Programs allowing less are excluded.">
            <div className="flex items-center gap-2">
              <Input
                id="cf-mdd"
                type="number"
                min={0}
                step={0.5}
                placeholder="e.g. 10"
                value={finder.minMaxDrawdown ?? ""}
                onChange={(e) => set({ minMaxDrawdown: numOrNull(e.target.value) })}
              />
              <span className="text-sm text-muted">%</span>
            </div>
          </Field>

          <Field label="Payout frequency" htmlFor="cf-payout">
            <Select
              id="cf-payout"
              value={finder.payoutFrequency ?? ""}
              onChange={(e) => set({ payoutFrequency: e.target.value || null })}
            >
              <option value="">Any</option>
              {payoutFrequencies.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>

          <fieldset className="md:col-span-2">
            <legend className="mb-1.5 block text-sm font-semibold text-ink">Restrictions to avoid</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                <Checkbox checked={finder.avoidNewsRestriction} onChange={(e) => set({ avoidNewsRestriction: e.target.checked })} />
                News trading restrictions
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                <Checkbox checked={finder.avoidWeekendRestriction} onChange={(e) => set({ avoidWeekendRestriction: e.target.checked })} />
                Weekend holding restrictions
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                <Checkbox checked={finder.requireEaAllowed} onChange={(e) => set({ requireEaAllowed: e.target.checked })} />
                Must allow EAs
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
                <Checkbox checked={finder.requireCopyTradingAllowed} onChange={(e) => set({ requireCopyTradingAllowed: e.target.checked })} />
                Must allow copy trading
              </label>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              Where a rule isn&apos;t published, we keep the program in your results and flag it “not verified” instead of guessing.
            </p>
          </fieldset>

          <div className="flex items-end">
            <Button variant="ghost" size="sm" onClick={() => setFinder(FINDER_DEFAULTS)}>
              <X className="h-4 w-4" aria-hidden /> Reset
            </Button>
          </div>
        </div>
      </Card>

      <section aria-label="Matching programs">
        <p className="mb-4 text-sm text-muted" role="status" aria-live="polite">
          <strong className="text-ink">{results.length}</strong> {results.length === 1 ? "match" : "matches"} found.
        </p>
        {results.length === 0 ? (
          <EmptyState
            title="No matches"
            body="Try loosening a filter — for example a higher max fee or removing a restriction."
          />
        ) : (
          <ul className="space-y-4">
            {results.slice(0, 50).map((row) => (
              <li key={`${row.program.id}-${row.size.id}`}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{row.firm.name}</p>
                      <h3 className="text-lg font-bold text-ink">
                        {row.program.name} — {fmtSize(row.size.account_size, row.size.size_currency)}
                      </h3>
                      <p className="mt-1 text-sm text-muted">
                        Fee: <strong className="text-ink">{fmtMoney(row.size.fee, row.size.fee_currency)}</strong>
                        {row.payout?.payout_frequency && <> · Payouts: {row.payout.payout_frequency}</>}
                      </p>
                    </div>
                    <Link href={buildGoUrl(goSlug(row.firm.slug, row.program.slug), undefined, "challenge-finder")}>
                      <Button size="sm">
                        Visit {row.firm.name} <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </Link>
                  </div>
                  <ul className="mt-3 space-y-1" aria-label={`Why ${row.program.name} matches`}>
                    {getMatchReasons(row, finder).map((reason, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-dark" aria-hidden />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                  <CtaNote className="mt-3" />
                </Card>
              </li>
            ))}
          </ul>
        )}
        {results.length > 50 && (
          <p className="mt-4 text-sm text-muted">Showing the first 50 matches — narrow your filters to see fewer.</p>
        )}
      </section>

      <Alert tone="warning">
        <strong>No challenge guarantees a pass or a payout.</strong> Most traders do not pass evaluations, and challenge
        fees are generally non-refundable if you breach the rules. Program terms can change — verify everything on the
        firm&apos;s official site before purchasing. Nothing here is financial advice.
      </Alert>
    </div>
  );
}
