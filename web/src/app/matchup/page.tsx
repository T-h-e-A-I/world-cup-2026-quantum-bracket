"use client";

import { useState } from "react";
import { useTournament } from "@/lib/store";
import { probMeet, meetLevel } from "@/lib/engine";
import { ROUNDS, tname, flag, pct, pred } from "@/lib/model";
import { TeamChip, Bar, Pct, Score, Confidence } from "@/components/ui";
import TeamSelect from "@/components/TeamSelect";
import ShareBar from "@/components/ShareBar";

export default function MatchupPage() {
  const { W } = useTournament();
  const [a, setA] = useState(2); // France
  const [b, setB] = useState(24); // Argentina

  const level = meetLevel(a, b);
  const round = ROUNDS[level - 1];
  const { p } = probMeet(W, a, b);
  const pr = pred(a, b);
  const reachA = W[a][level - 1];
  const reachB = W[b][level - 1];
  const favA = pr.score[0] >= pr.score[1];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Will They <span className="grad-text">Meet?</span>
        </h1>
        <p className="text-sm text-mute">
          Because the bracket is fixed, any two teams can collide in exactly{" "}
          <span className="text-ink">one</span> round. Here’s where, how likely, and the predicted
          result.
        </p>
      </div>

      <div className="card p-5">
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <TeamSelect value={a} onChange={setA} exclude={b} label="Team A" />
          <div className="pb-2 text-center text-sm text-faint">vs</div>
          <TeamSelect value={b} onChange={setB} exclude={a} label="Team B" />
        </div>
      </div>

      <div className="card overflow-hidden p-6 text-center">
        <div className="text-xs uppercase tracking-widest text-faint">Earliest &amp; only meeting</div>
        <div className="mt-1 text-2xl font-extrabold grad-text">{round}</div>

        <div className="mt-5 flex items-center justify-center gap-4 text-lg">
          <span className="flex items-center gap-2"><span className="text-3xl">{flag(a)}</span>{tname(a)}</span>
          <Score a={pr.score[0]} b={pr.score[1]} />
          <span className="flex items-center gap-2">{tname(b)}<span className="text-3xl">{flag(b)}</span></span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <Confidence label={pr.confidenceLabel} value={pr.confidence} />
          <span className="text-mute">
            edge: <span className="text-ink">{favA ? tname(a) : tname(b)}</span>
          </span>
        </div>

        <div className="mx-auto mt-6 max-w-md">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-mute">Probability they actually meet</span>
            <Pct p={p} className="font-bold text-flux" />
          </div>
          <Bar p={p} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ReachCard id={a} round={round} p={reachA} />
        <ReachCard id={b} round={round} p={reachB} />
      </div>

      <p className="text-center text-xs text-faint">
        P(meet) = P({tname(a)} reaches {round}) × P({tname(b)} reaches {round}) ={" "}
        {pct(reachA)} × {pct(reachB)} = <span className="text-mute">{pct(p)}</span>
      </p>

      <ShareBar text={`Can ${tname(a)} and ${tname(b)} meet at the 2026 World Cup? Only in the ${round} — ${pct(p)} chance 🌌`} />
    </div>
  );
}

function ReachCard({ id, round, p }: { id: number; round: string; p: number }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <TeamChip id={id} className="font-semibold" />
        <Pct p={p} className="font-bold" />
      </div>
      <div className="mt-2"><Bar p={p} /></div>
      <div className="mt-1 text-xs text-faint">reaches the {round}</div>
    </div>
  );
}
