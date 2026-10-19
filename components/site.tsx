import Link from "next/link";
import { Scale, Search, Twitter, Youtube, MessageCircle } from "lucide-react";
import { getBrand } from "@/lib/site";
import { Container, Button } from "./ui";
import { NewsletterFormClient } from "./forms";

export async function Logo({ dark = false }: { dark?: boolean }) {
  const brand = await getBrand();
  return (
    <Link href="/" className="flex items-center gap-2" aria-label={`${brand.brand_name} home`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white">
        <Scale className="h-5 w-5" aria-hidden />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${dark ? "text-white" : "text-ink"}`}>
        {brand.brand_name}
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/compare", label: "Compare Firms" },
  { href: "/firms", label: "Prop Firms" },
  { href: "/discounts", label: "Discounts" },
  { href: "/reviews", label: "Reviews" },
  { href: "/learn", label: "Learn" },
  { href: "/about", label: "About" },
];

export async function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Logo dark />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {[{ href: "/", label: "Home" }, ...NAV].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/compare"
            className="hidden rounded-md p-2 text-slate-200 hover:bg-white/10 sm:block"
            aria-label="Search and compare"
          >
            <Search className="h-5 w-5" aria-hidden />
          </Link>
          <Link href="/compare">
            <Button size="sm" className="hidden sm:inline-flex">Compare Now</Button>
          </Link>
          <MobileMenu />
        </div>
      </Container>
    </header>
  );
}

function MobileMenu() {
  // Client interactivity lives in a tiny client component to keep Navbar a server component.
  return <MobileMenuClient />;
}

// NOTE: implemented below as a client component in the same file boundary via "use client" split.
// To keep this file server-safe, the client part is imported from ./site-client.
import { MobileMenuClient } from "./site-client";

export async function Footer() {
  const brand = await getBrand();
  const cols: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: "Platform",
      links: [
        { href: "/compare", label: "Compare Firms" },
        { href: "/challenge-finder", label: "Challenge Finder" },
        { href: "/discounts", label: "Discounts" },
        { href: "/reviews", label: "Reviews" },
        { href: "/learn", label: "Learn" },
      ],
    },
    {
      title: "Company",
      links: [
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
        { href: "/editorial-policy", label: "Editorial Policy" },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Use" },
        { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
        { href: "/risk-disclaimer", label: "Risk Disclaimer" },
      ],
    },
  ];
  return (
    <footer className="bg-navy-950 text-slate-300">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.2fr_repeat(3,1fr)]">
        <div>
          <Logo dark />
          <p className="mt-3 max-w-xs text-sm text-slate-400">{brand.tagline}</p>
          <p className="mt-3 max-w-xs text-xs text-slate-500">
            Independent comparison platform. Not a prop firm; we do not offer funded accounts or hold trading funds.
          </p>
          <div className="mt-4 flex gap-3">
            {brand.social_x && (
              <a href={brand.social_x} aria-label="X" className="text-slate-400 hover:text-white"><Twitter className="h-5 w-5" /></a>
            )}
            {brand.social_youtube && (
              <a href={brand.social_youtube} aria-label="YouTube" className="text-slate-400 hover:text-white"><Youtube className="h-5 w-5" /></a>
            )}
            {brand.social_discord && (
              <a href={brand.social_discord} aria-label="Discord" className="text-slate-400 hover:text-white"><MessageCircle className="h-5 w-5" /></a>
            )}
          </div>
        </div>
        {cols.map((c) => (
          <nav key={c.title} aria-label={c.title}>
            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-white">{c.title}</p>
            <ul className="space-y-2 text-sm">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-slate-400 hover:text-white">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.brand_name}. All rights reserved.</p>
          <p>Trading involves substantial risk of loss. See our Risk Disclaimer.</p>
        </Container>
      </div>
    </footer>
  );
}

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-muted">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-ink hover:underline">{it.label}</Link>
            ) : (
              <span aria-current="page" className="font-medium text-ink">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Short affiliate disclosure shown near CTAs that use tracked links. */
export function AffiliateNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      Affiliate link — we may earn a commission if you purchase through it, at no extra cost to you.{" "}
      <Link href="/affiliate-disclosure" className="underline hover:text-ink">Learn more</Link>
    </p>
  );
}

/** Persistent risk strip above the footer. */
export function RiskBanner() {
  return (
    <div className="border-t border-slate-200 bg-amber-50">
      <Container className="py-4 text-xs text-amber-900">
        <strong>Risk warning:</strong> Trading foreign exchange and CFDs carries a high level of risk.
        Challenge fees are non-refundable if you breach the rules, and most traders do not pass evaluations.
        Nothing here is financial advice. <Link href="/risk-disclaimer" className="underline">Read the full disclaimer</Link>.
      </Container>
    </div>
  );
}

export function NewsletterSection() {
  return (
    <section className="bg-navy-900 py-14" aria-labelledby="newsletter-heading">
      <Container className="max-w-2xl text-center">
        <h2 id="newsletter-heading" className="text-2xl font-bold text-white">Get verified discount alerts</h2>
        <p className="mt-2 text-sm text-slate-300">
          One email when a prop firm discount is verified. No spam, unsubscribe anytime.
        </p>
        <div className="mt-6"><NewsletterFormClient /></div>
      </Container>
    </section>
  );
}
