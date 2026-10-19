import type { Metadata } from "next";
import { getBrand } from "@/lib/site";
import { Container, SectionHeading, Card } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";
import { ContactFormClient } from "@/components/forms";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact",
  description: "Report a data error, a broken discount code, or ask a question about PropCompare.",
};

export default async function ContactPage() {
  const brand = await getBrand();

  return (
    <div className="bg-slate-50 py-10">
      <Container className="max-w-2xl">
        <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Contact" }]} />
        <SectionHeading
          kicker="Contact"
          title="Get in touch"
          sub="Spotted an error, a stale figure, or a broken discount code? That's the most useful message you can send us."
        />
        <Card className="p-6 sm:p-8">
          <ContactFormClient />
          {brand.contact_email && (
            <p className="mt-6 text-sm text-muted">
              Prefer email? Write to{" "}
              <a href={`mailto:${brand.contact_email}`} className="font-semibold text-accent-dark hover:underline">
                {brand.contact_email}
              </a>
              .
            </p>
          )}
          <p className="mt-2 text-xs text-muted">
            We read everything but can&apos;t reply to trading advice requests — nothing here is financial advice.
          </p>
        </Card>
      </Container>
    </div>
  );
}
