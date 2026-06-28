import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TeamView from "@/components/TeamView";
import { TEAMS, tname, idFromSlug, slug, pct } from "@/lib/model";
import { winsubTable } from "@/lib/engine";
import OFFICIAL from "@/data/results.json";
import type { Results } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return TEAMS.map((t) => ({ slug: slug(t.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: s } = await params;
  const id = idFromSlug(s);
  if (id === undefined) return {};
  const W = winsubTable(OFFICIAL as Results);
  const champP = pct(W[id][5], 1);
  const name = tname(id);
  const title = `${name} — 2026 World Cup odds`;
  const description = `${name} have a ${champP} chance to win the 2026 FIFA World Cup. See their exact odds each round, all 16 possible final opponents, and the likeliest brackets where they lift the trophy.`;
  return {
    title,
    description,
    alternates: { canonical: `/team/${s}` },
    openGraph: { title: `${title} · Quantum Bracket`, description, url: `/team/${s}` },
    twitter: { title: `${title} · Quantum Bracket`, description },
  };
}

export default async function TeamSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: s } = await params;
  const id = idFromSlug(s);
  if (id === undefined) notFound();
  return <TeamView initialId={id} />;
}
