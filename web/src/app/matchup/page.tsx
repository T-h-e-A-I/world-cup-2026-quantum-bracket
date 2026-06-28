"use client";

import { useMemo, useState } from "react";
import { useTournament } from "@/lib/store";
import { probMeet, meetLevel, realityPool, meetInBracket } from "@/lib/engine";
import { ROUNDS, tname, pct, pred } from "@/lib/model";
import { Bar, Pct, Score, Confidence } from "@/components/ui";
import { Flag } from "@/components/Flag";
import { RealityList } from "@/components/RealityList";
import { Info } from "@/components/Info";
import TeamSelect from "@/components/TeamSelect";
import ShareBar from "@/components/ShareBar";

export default function MatchupPage() {
  const { W, results } = useTournament();
  const [a, setA] = useState(2); // France
  const [b, setB] = useState(24); // Argentina

  const level = meetLevel(a, b);
  const round = ROUNDS[level - 1];
  const { p } = probMeet(W, a, b);
  const pr = pred(a, b);
  const reachA = W[a][level - 1];
  const reachB = W[b][level - 1];
  const favA = pr.score[0] >= pr.score[1];
  const pool = useMemo(() => realityPool(results, 10), [results]);
  const meetWorlds = pool.filter((r) => meetInBracket(r.winners, a, b)).slice(0, 5);

  return (
    <div className="space-y-10">
      <h1 className="flex items-center gap-2 text-3xl font-bold sm:text-4xl">
        Will they meet?
        <Info>Because the bracket is fixed, any two teams can collide in exactly one round.</Info>
      </h1>

      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <TeamSelect value={a} onChange={setA} exclude={b} label="Team A" />
        <div className="hidden pb-2.5 text-center text-sm text-faint sm:block">vs</div>
        <TeamSelect value={b} onChange={setB} exclude={a} label="Team B" />
      </div>

      {/* result */}
      <section className="rounded-3xl bg-void2 p-6 text-center sm:p-8">
        <div className="text-xs uppercase tracking-widest text-faint">Earliest &amp; only meeting</div>
        <div className="mt-1 text-3xl font-bold text-quantum">{round}</div>

        <div className="mt-6 flex items-center justify-center gap-3 text-lg sm:gap-5 sm:text-xl">
          <span className="flex items-center gap-2 font-semibold">
            <Flag id={a} className="h-6 w-9 rounded object-cover ring-1 ring-black/10" />
            <span className="hidden sm:inline">{tname(a)}</span>
          </span>
          <Score a={pr.score[0]} b={pr.score[1]} />
          <span className="flex items-center gap-2 font-semibold">
            <span className="hidden sm:inline">{tname(b)}</span>
            <Flag id={b} className="h-6 w-9 rounded object-cover ring-1 ring-black/10" />
          </span>
        </div>
        <div className="mt-2 text-xs text-faint">
          predicted scoreline · {Math.round(pr.scoreProb * 100)}% likely
        </div>
        <div className="mt-3 flex items-center justify-center gap-3 text-sm">
          <Confidence label={pr.confidenceLabel} value={pr.confidence} />
          <span className="text-mute">edge <span className="text-ink">{favA ? tname(a) : tname(b)}</span></span>
        </div>

        <div className="mx-auto mt-6 max-w-md">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-mute">
              Probability they actually meet
              <Info>
                P(meet) = P({tname(a)} reaches {round}) × P({tname(b)} reaches {round}) ={" "}
                {pct(reachA)} × {pct(reachB)} = {pct(p)}.
              </Info>
            </span>
            <Pct p={p} className="font-bold text-quantum" />
          </div>
          <Bar p={p} />
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <ReachCard id={a} round={round} p={reachA} />
        <ReachCard id={b} round={round} p={reachB} />
      </div>

      <section>
        <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
          <h2 className="text-xl font-bold">Most likely worlds where they meet</h2>
          <span className="hidden text-xs text-faint sm:inline">tap to open in Play Bracket</span>
        </div>
        <div className="mt-2">
          <RealityList
            items={meetWorlds}
            empty={`A bracket where ${tname(a)} and ${tname(b)} both get to the ${round} is too unlikely to surface.`}
          />
        </div>
      </section>

      <ShareBar text={`Can ${tname(a)} and ${tname(b)} meet at the 2026 World Cup? Only in the ${round} — ${pct(p)} chance`} />
    </div>
  );
}

function ReachCard({ id, round, p }: { id: number; round: string; p: number }) {
  return (
    <div className="rounded-2xl bg-void2 p-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 font-semibold">
          <Flag id={id} /> {tname(id)}
        </span>
        <Pct p={p} className="font-bold" />
      </div>
      <div className="mt-2"><Bar p={p} /></div>
      <div className="mt-1 text-xs text-faint">reaches the {round}</div>
    </div>
  );
}
