"use client";

import { useState } from "react";
import { useTournament } from "@/lib/store";
import { reach, modalPath, finalOpponents } from "@/lib/engine";
import { tname, flag, pct, pred } from "@/lib/model";
import { TeamChip, Bar, Pct, SectionTitle, Score, Confidence } from "@/components/ui";
import TeamSelect from "@/components/TeamSelect";
import ShareBar from "@/components/ShareBar";

const ROUND_LABELS = ["Round of 16", "Quarterfinal", "Semifinal", "Final", "Champion"];

export default function TeamPage() {
  const { W } = useTournament();
  const [id, setId] = useState(24); // Argentina
  const r = reach(W, id);
  const path = modalPath(W, id);
  const finals = finalOpponents(W, id);

  const steps = [
    { label: "Reach Round of 16", p: r.r16 },
    { label: "Reach Quarterfinal", p: r.qf },
    { label: "Reach Semifinal", p: r.sf },
    { label: "Reach Final", p: r.final },
    { label: "Win it all", p: r.champion },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          My Team’s <span className="grad-text">Odds</span>
        </h1>
        <p className="text-sm text-mute">
          One team. 64 routes to the final × 16 possible opponents ={" "}
          <span className="text-ink">1,024</span> final scenarios — all exact.
        </p>
      </div>

      <div className="card p-5">
        <div className="max-w-sm">
          <TeamSelect value={id} onChange={setId} label="Pick your team" />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <span className="text-5xl">{flag(id)}</span>
          <div>
            <div className="text-xl font-bold">{tname(id)}</div>
            <div className="text-xs text-faint">
              Champion probability <Pct p={r.champion} className="text-champ" />
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-36 shrink-0 text-sm text-mute">{s.label}</div>
              <div className="flex-1">
                <Bar p={s.p} gold={i === steps.length - 1} />
              </div>
              <Pct p={s.p} className="w-16 text-right text-sm font-semibold" />
            </div>
          ))}
        </div>
      </div>

      {/* modal path */}
      <div className="card p-5">
        <SectionTitle hint="strongest expected opponent each round">
          Most likely path to the final
        </SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {path.map((st) => {
            const p = pred(id, st.opp);
            return (
              <div key={st.level} className="rounded-xl border border-line bg-white/[0.03] p-3">
                <div className="text-[10px] uppercase tracking-widest text-faint">
                  {ROUND_LABELS[st.level - 1]}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-mute">vs</span>
                  <TeamChip id={st.opp} className="font-semibold" />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <Score a={p.score[0]} b={p.score[1]} />
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
      </div>

      {/* 16 finals */}
      <div className="card p-5">
        <SectionTitle hint="from the opposite half of the draw">
          All 16 possible final opponents
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-faint">
              <tr className="border-b border-line">
                <th className="py-2 font-medium">Opponent</th>
                <th className="py-2 font-medium">This exact final</th>
                <th className="py-2 font-medium">Win it vs them</th>
                <th className="py-2 font-medium">Predicted</th>
                <th className="py-2 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {finals.map((f) => {
                const p = pred(id, f.opp);
                return (
                  <tr key={f.opp} className="border-b border-line/60 hover:bg-white/[0.03]">
                    <td className="py-2">
                      <TeamChip id={f.opp} />
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20"><Bar p={f.pFinal} /></div>
                        <Pct p={f.pFinal} className="text-xs" />
                      </div>
                    </td>
                    <td className="py-2">
                      <Pct p={f.pWin} className="font-semibold text-champ" />
                    </td>
                    <td className="py-2"><Score a={p.score[0]} b={p.score[1]} /></td>
                    <td className="py-2"><Confidence label={p.confidenceLabel} value={p.confidence} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ShareBar text={`${tname(id)} at the 2026 World Cup — ${pct(r.champion)} to win it all 🌌`} />
    </div>
  );
}
