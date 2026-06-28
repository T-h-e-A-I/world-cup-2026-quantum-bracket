import { ImageResponse } from "next/og";
import { TEAMS, tname, idFromSlug, slug, pct } from "@/lib/model";
import { winsubTable, reach } from "@/lib/engine";
import OFFICIAL from "@/data/results.json";
import type { Results } from "@/lib/types";

export const dynamicParams = false;
export const alt = "2026 World Cup odds";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return TEAMS.map((t) => ({ slug: slug(t.id) }));
}

const INK = "#0a0a0b";
const QUANTUM = "#6d5efc";
const MUTE = "#8a909c";
const FAINT = "#5a606b";
const WHITE = "#f6f7f9";

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: s } = await params;
  const id = idFromSlug(s) ?? 0;
  const W = winsubTable(OFFICIAL as Results);
  const r = reach(W, id);
  const name = tname(id);

  const stats: [string, string][] = [
    ["Reach final", pct(r.final, 0)],
    ["Semifinal", pct(r.sf, 0)],
    ["Quarterfinal", pct(r.qf, 0)],
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: INK,
          padding: "64px 72px",
          borderLeft: `16px solid ${QUANTUM}`,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: MUTE, fontSize: 26, letterSpacing: 2, fontWeight: 600 }}>
            QUANTUM BRACKET
          </div>
          <div style={{ color: FAINT, fontSize: 24 }}>2026 FIFA World Cup · odds</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: WHITE, fontSize: 96, fontWeight: 800, lineHeight: 1 }}>{name}</div>
          <div style={{ display: "flex", alignItems: "baseline", marginTop: 18 }}>
            <div style={{ color: QUANTUM, fontSize: 80, fontWeight: 800 }}>{pct(r.champion, 1)}</div>
            <div style={{ color: MUTE, fontSize: 34, marginLeft: 20 }}>to win it all</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", gap: 40 }}>
            {stats.map(([label, val]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ color: WHITE, fontSize: 40, fontWeight: 700 }}>{val}</div>
                <div style={{ color: FAINT, fontSize: 22 }}>{label}</div>
              </div>
            ))}
          </div>
          <div style={{ color: FAINT, fontSize: 22, display: "flex" }}>
            every reality at once
          </div>
        </div>
      </div>
    ),
    size,
  );
}
