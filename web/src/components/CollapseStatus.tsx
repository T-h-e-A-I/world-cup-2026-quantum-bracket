"use client";
import { useTournament } from "@/lib/store";

/** Thin live strip under the nav — shows how collapsed the tournament is, everywhere. */
export default function CollapseStatus() {
  const { decided, exploring, reset, home } = useTournament();
  if (decided === 0) return null; // full superposition → keep the chrome clean

  return (
    <div className="border-b border-line bg-quantum/[0.06]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5 text-xs">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-quantum/60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-quantum" />
        </span>
        <span className="font-semibold text-ink">{decided}/31 decided</span>
        <span className="hidden text-mute sm:inline">
          · {home.realitiesLeft.toLocaleString()} realities left
        </span>
        {exploring && (
          <span className="rounded-full bg-quantum/15 px-2 py-0.5 text-[11px] font-medium text-quantum">
            your scenario
          </span>
        )}
        {exploring && (
          <button onClick={reset} className="ml-auto font-medium text-mute hover:text-ink">
            ↺ Reset to today
          </button>
        )}
      </div>
    </div>
  );
}
