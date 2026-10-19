import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { Breadcrumbs } from "@/components/site";
import { ChallengeFinderClient } from "@/components/compare";
import { getAllProgramRows } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Challenge Finder — Find the Right Prop Firm Challenge",
    description:
      "Answer a few questions about your trading style and get matched with prop firm challenges whose published rules fit. Unknown rules are flagged, never guessed.",
    alternates: { canonical: "/challenge-finder" },
  };
}

export default async function ChallengeFinderPage() {
  const initialRows = await getAllProgramRows();

  return (
    <Container className="py-10">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "Challenge Finder" }]} />
      <ChallengeFinderClient initialRows={initialRows} />
    </Container>
  );
}
