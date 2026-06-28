"use client";

import { useMemo, useState } from "react";
import { useTournament } from "@/lib/store";
import { reach, modalPath, finalOpponents, realityPool } from "@/lib/engine";
import { tname, pct, pred } from "@/lib/model";
import { TeamChip, Bar, Pct, Score, Confidence } from "@/components/ui";
import { Flag } from "@/components/Flag";
import { RealityList } from "@/components/RealityList";
import { Info } from "@/components/Info";
import TeamSelect from "@/components/TeamSelect";
import ShareBar from "@/components/ShareBar";

const ROUND_LABELS = ["Round of 16", "Quarterfinal", "Semifinal", "Final", "Champion"];

export default function TeamPage() {
  const { W, results } = useTournament();
  const [id, setId] = useState(24); // Argentina
  const r = reach(W, id);
  const path = modalPath(W, id);
  const finals = finalOpponents(W, id);
  const pool = useMemo(() => realityPool(results, 8), [results]);
  const worlds = pool.filter((x) => x.champion === id).slice(0, 5);

  const steps = [
    { label: "Reach Round of 16", p: r.r16 },
    { label: "Reach Quarterfinal", p: r.qf },
    { label: "Reach Semifinal", p: r.sf },
    { label: "Reach Final", p: r.final },
    { label: "Win it all", p: r.champion },
  ];

  return (
    <div className="space-y-12">
      <h1 className="flex items-center gap-2 text-3xl font-bold sm:text-4xl">
        My team’s odds
        <Info>
          64 routes to the final × 16 possible opponents = 1,024 final scenarios, all computed
          exactly.
        </Info>
      </h1>

      {/* selector + reach */}
      <section>
        <div className="max-w-sm">
          <TeamSelect value={id} onChange={setId} label="Pick your team" />
        </div>
        <div className="mt-6 flex items-center gap-4">
          <Flag id={id} className="h-12 w-16 rounded-lg object-cover shadow-sm ring-1 ring-black/10" />
          <div>
            <div className="text-2xl font-bold">{tname(id)}</div>
            <div className="text-xs text-faint">
              Champion probability{" "}
              <Pct p={r.champion} className="font-semibold text-champ" />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-32 shrink-0 text-sm text-mute sm:w-40">{s.label}</div>
              <div className="flex-1">
                <Bar p={s.p} gold={i === steps.length - 1} />
              </div>
              <Pct p={s.p} className="w-16 text-right text-sm font-semibold" />
            </div>
          ))}
        </div>
      </section>

      {/* modal path */}
      <section>
        <H2 hint="strongest expected opponent each round">Most likely path to the final</H2>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {path.map((st) => {
            const p = pred(id, st.opp);
            return (
              <div key={st.level} className="rounded-2xl bg-void2 p-3.5">
                <div className="text-[10px] uppercase tracking-widest text-faint">
                  {ROUND_LABELS[st.level - 1]}
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-mute">vs</span>
                  <TeamChip id={st.opp} className="font-semibold" />
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                  <Score a={p.score[0]} b={p.score[1]} prob={p.scoreProb} />
                  <Confidence label={p.confidenceLabel} value={p.confidence} />
                </div>
                <div className="mt-2 text-[11px] text-faint">
                  Win this game <Pct p={st.advance} className="text-ink" /> · here this far{" "}
                  <Pct p={st.cum} className="text-ink" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* most likely worlds where this team wins */}
      <section>
        <H2 hint="tap to open in Play Bracket">Most likely worlds where {tname(id)} win</H2>
        <div className="mt-2">
          <RealityList items={worlds} empty={`${tname(id)} winning it all is too unlikely to surface a bracket.`} />
        </div>
      </section>

      {/* 16 finals */}
      <section>
        <H2 hint="from the opposite half of the draw">All 16 possible final opponents</H2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-faint">
              <tr className="border-b border-line">
                <th className="py-2 font-medium">Opponent</th>
                <th className="py-2 font-medium">This final</th>
                <th className="py-2 font-medium">Win it</th>
                <th className="py-2 font-medium">Predicted</th>
                <th className="py-2 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody className="rows">
              {finals.map((f) => {
                const p = pred(id, f.opp);
                return (
                  <tr key={f.opp} className="hover:bg-void2">
                    <td className="py-2.5"><TeamChip id={f.opp} /></td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 sm:w-20"><Bar p={f.pFinal} /></div>
                        <Pct p={f.pFinal} className="text-xs" />
                      </div>
                    </td>
                    <td className="py-2.5"><Pct p={f.pWin} className="font-semibold text-champ" /></td>
                    <td className="py-2.5"><Score a={p.score[0]} b={p.score[1]} prob={p.scoreProb} /></td>
                    <td className="py-2.5"><Confidence label={p.confidenceLabel} value={p.confidence} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ShareBar text={`${tname(id)} at the 2026 World Cup — ${pct(r.champion)} to win it all`} />
    </div>
  );
}

function H2({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
      <h2 className="text-xl font-bold">{children}</h2>
      {hint && <span className="hidden text-xs text-faint sm:inline">{hint}</span>}
    </div>
  );
}
