import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://world-cup-2026-quantum-bracket.vercel.app";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/bracket", "/team", "/matchup", "/math"];
  return routes.map((r) => ({
    url: `${SITE}${r}`,
    changeFrequency: "daily",
    priority: r === "" ? 1 : 0.8,
  }));
}
