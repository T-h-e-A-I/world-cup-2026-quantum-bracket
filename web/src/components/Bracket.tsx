"use client";

import { useMemo } from "react";
import { MODEL, useTournament } from "@/lib/store";
import { favoriteIn } from "@/lib/engine";
import { flag, tname, pred, pct } from "@/lib/model";
import type { MatchNode, Results } from "@/lib/types";

const byLevel = (lvl: number, half?: 0 | 1) =>
  MODEL.matches.filter(
    (m) => m.level === lvl && (half === undefined || (m.start < 16 ? 0 : 1) === half),
  );

interface Slot { id: number; p: number; decided: boolean }

function slot(node: MatchNode, side: 0 | 1, results: Results, W: number[][]): Slot {
  if (node.teams) return { id: node.teams[side], p: 1, decided: true };
  const feeder = MODEL.matches.find((m) => m.id === node.feeders![side])!;
  const dec = results[feeder.id];
  if (dec !== undefined) return { id: dec, p: 1, decided: true };
  const fav = favoriteIn(W, feeder.start, feeder.level);
  return { id: fav.id, p: fav.p, decided: false };
}

function MatchCard({ node }: { node: MatchNode }) {
  const { results, W, setResult, clearResult } = useTournament();
  const a = slot(node, 0, results, W);
  const b = slot(node, 1, results, W);
  const playable = a.decided && b.decided;
  const winner = results[node.id];
  const sc = playable ? pred(a.id, b.id).score : null;

  const Row = ({ s }: { s: Slot }) => {
    const isWin = winner === s.id;
    const isLose = winner !== undefined && winner !== s.id;
    return (
      <button
        disabled={!playable}
        onClick={() => (isWin ? clearResult(node.id) : setResult(node.id, s.id))}
        title={playable ? `Pick ${tname(s.id)} to advance` : "Decide the feeding matches first"}
        className={`group flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[12px] transition
          ${isWin ? "bg-quantum/25 ring-1 ring-quantum/50" : ""}
          ${isLose ? "opacity-35 line-through" : ""}
          ${playable && !isWin ? "hover:bg-white/10 cursor-pointer" : ""}
          ${!playable ? "cursor-default" : ""}`}
      >
        <span className="text-sm leading-none">{flag(s.id)}</span>
        <span className={`truncate ${s.decided ? "" : "italic text-mute"}`}>{tname(s.id)}</span>
        {!s.decided && <span className="ml-auto tabular text-[10px] text-faint">{pct(s.p, 0)}</span>}
        {isWin && <span className="ml-auto text-quantum">✓</span>}
      </button>
    );
  };

  return (
    <div
      className={`card w-[136px] shrink-0 p-1 ${winner !== undefined ? "border-quantum/40" : ""}
        ${playable && winner === undefined ? "ring-1 ring-flux/30" : ""}`}
    >
      <div className="flex items-center justify-between px-1 pb-0.5 text-[9px] uppercase tracking-wider text-faint">
        <span>{node.no ? `Match ${node.no}` : node.round}</span>
        {sc && <span className="tabular">{sc[0]}–{sc[1]}</span>}
      </div>
      <Row s={a} />
      <Row s={b} />
    </div>
  );
}

function Column({ nodes, label }: { nodes: MatchNode[]; label: string }) {
  return (
    <div className="flex flex-col justify-around gap-3">
      <div className="text-center text-[10px] font-semibold uppercase tracking-widest text-faint">
        {label}
      </div>
      <div className="flex h-full flex-col justify-around gap-3">
        {nodes.map((n) => (
          <MatchCard key={n.id} node={n} />
        ))}
      </div>
    </div>
  );
}

function ChampionCore() {
  const { W, results } = useTournament();
  const fav = useMemo(() => favoriteIn(W, 0, 5), [W]);
  const finalDecided = results["L5-0"] !== undefined;
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-2">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-champ">
        {finalDecided ? "Champion" : "Most likely champion"}
      </div>
      <div className="card border-champ/40 px-3 py-3 text-center">
        <div className="text-3xl">{finalDecided ? "🏆" : "🌌"}</div>
        <div className="mt-1 text-2xl">{flag(fav.id)}</div>
        <div className="text-sm font-bold">{tname(fav.id)}</div>
        <div className="tabular text-xs text-champ">{pct(fav.p, 1)}</div>
      </div>
    </div>
  );
}

export default function Bracket() {
  const { home, exploring, reset } = useTournament();

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="card flex items-center gap-2 px-3 py-1.5 text-sm">
          <span className="text-mute">Realities remaining</span>
          <span className="tabular shimmer font-bold">{home.realitiesLeft.toLocaleString()}</span>
        </div>
        <div className="card px-3 py-1.5 text-sm">
          <span className="text-mute">Matches decided </span>
          <span className="tabular font-bold">{home.decided}/31</span>
        </div>
        {exploring && (
          <button
            onClick={reset}
            className="ml-auto chip px-3 py-1.5 text-sm text-mute hover:text-ink"
          >
            ↺ Reset to reality
          </button>
        )}
      </div>

      <p className="mb-4 text-sm text-mute">
        Click a team to send it through. Each pick <span className="text-ink">collapses</span> the
        superposition and re-weights every probability. Ghosted italic names are the current
        favorites to arrive — they sharpen as you decide the rounds below.
      </p>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-[1180px] items-stretch gap-2">
          <Column label="R32" nodes={byLevel(1, 0)} />
          <Column label="R16" nodes={byLevel(2, 0)} />
          <Column label="QF" nodes={byLevel(3, 0)} />
          <Column label="SF" nodes={byLevel(4, 0)} />
          <div className="flex flex-col justify-center gap-3">
            <div className="text-center text-[10px] font-semibold uppercase tracking-widest text-champ">
              Final
            </div>
            <MatchCard node={MODEL.matches.find((m) => m.id === "L5-0")!} />
            <ChampionCore />
          </div>
          <Column label="SF" nodes={byLevel(4, 1)} />
          <Column label="QF" nodes={byLevel(3, 1)} />
          <Column label="R16" nodes={byLevel(2, 1)} />
          <Column label="R32" nodes={byLevel(1, 1)} />
        </div>
      </div>
    </div>
  );
}
