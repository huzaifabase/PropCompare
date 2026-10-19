import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer, RiskBanner } from "@/components/site";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "PropCompare — Compare Prop Firms. Choose Smarter.",
    template: "%s | PropCompare",
  },
  description:
    "Independent comparison of prop trading firm challenges: evaluation rules, fees, drawdowns, and payouts — researched from official sources.",
  openGraph: {
    type: "website",
    siteName: "PropCompare",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">
          Skip to content
        </a>
        <Navbar />
        <main id="main" className="flex-1">{children}</main>
        <RiskBanner />
        <Footer />
      </body>
    </html>
  );
}
