import { TeamChip } from "./ui";
import { encodeResults } from "@/lib/share";
import type { Reality } from "@/lib/engine";

const oneIn = (p: number) => (p > 0 ? `1 in ${Math.round(1 / p).toLocaleString()}` : "—");
const href = (r: Reality) => `/bracket?r=${encodeResults(r.winners)}`;

/** Compact, tappable list of complete brackets (loads into Play Bracket). */
export function RealityList({ items, empty }: { items: Reality[]; empty?: string }) {
  if (!items.length) return <p className="text-sm text-faint">{empty ?? "No likely bracket found."}</p>;
  return (
    <ol className="rows">
      {items.map((r, i) => {
        const runnerUp = r.finalists[0] === r.champion ? r.finalists[1] : r.finalists[0];
        return (
          <li key={i}>
            <a href={href(r)} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-void2">
              <span className="text-base">🏆</span>
              <TeamChip id={r.champion} className="w-28 font-semibold sm:w-40" />
              <span className="hidden text-faint sm:inline">def.</span>
              <TeamChip id={runnerUp} className="hidden w-28 text-mute sm:flex sm:w-40" />
              <span className="tabular ml-auto whitespace-nowrap text-right font-semibold">{oneIn(r.p)}</span>
              <span className="text-faint">→</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
