import type { MetadataRoute } from "next";
import { allSlugs } from "@/lib/model";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://world-cup-2026-quantum-bracket.vercel.app";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/bracket", "/team", "/matchup", "/math"];
  const teams = allSlugs().map((s) => `/team/${s}`);
  return [...routes, ...teams].map((r) => ({
    url: `${SITE}${r}`,
    changeFrequency: "daily",
    priority: r === "" ? 1 : r.startsWith("/team/") ? 0.6 : 0.8,
  }));
}
