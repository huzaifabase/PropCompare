"use client";
import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/compare", label: "Compare Firms" },
  { href: "/firms", label: "Prop Firms" },
  { href: "/discounts", label: "Discounts" },
  { href: "/reviews", label: "Reviews" },
  { href: "/learn", label: "Learn" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileMenuClient() {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="rounded-md p-2 text-slate-200 hover:bg-white/10"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-white/10 bg-navy-950 px-4 pb-6 pt-2 shadow-xl">
          <nav aria-label="Mobile">
            <ul className="space-y-1">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
