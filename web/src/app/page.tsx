"use client";

import Link from "next/link";
import { useTournament } from "@/lib/store";
import { MODEL, pct, tname, flag, big, pred } from "@/lib/model";
import { TeamChip, Bar, Pct, SectionTitle, Score } from "@/components/ui";
import ShareBar from "@/components/ShareBar";

export default function Home() {
  const { home } = useTournament();
  const topFinal = home.finals[0];
  const fav = home.champions[0];

  return (
    <div className="space-y-10">
      {/* hero */}
      <section className="text-center">
        <div className="chip mx-auto mb-4 inline-flex px-3 py-1 text-xs text-mute">
          2026 FIFA World Cup · Round of 32 · knockout
        </div>
        <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Every World Cup reality,
          <br />
          <span className="grad-text">at once.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-mute">
          All <span className="text-ink">{big(MODEL.meta.realities)}</span> possible brackets exist
          in superposition, each with an exact probability. Every result that comes in collapses the
          wavefunction — and re-weights the future.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/bracket"
            className="rounded-full bg-ink px-5 py-2.5 font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Play out the bracket →
          </Link>
          <Link href="/team" className="chip px-5 py-2.5 font-medium hover:bg-white/10">
            Find my team’s odds
          </Link>
        </div>

        {/* live collapse meter */}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Realities left" value={home.realitiesLeft.toLocaleString()} glow />
          <Stat label="Matches decided" value={`${home.decided}/31`} />
          <Stat label="Favorite" value={`${flag(fav.id)} ${pct(fav.p, 0)}`} />
          <Stat label="Likeliest final" value={`${flag(topFinal.a)} v ${flag(topFinal.b)}`} />
        </div>
      </section>

      {/* favorites + finals */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <SectionTitle hint="P(lifts the trophy)">Title favorites</SectionTitle>
          <ol className="space-y-2.5">
            {home.champions.slice(0, 8).map((c, i) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className="w-4 text-xs text-faint">{i + 1}</span>
                <div className="w-40 shrink-0">
                  <TeamChip id={c.id} />
                </div>
                <div className="flex-1">
                  <Bar p={c.p} gold={i === 0} />
                </div>
                <Pct p={c.p} className="w-14 text-right text-sm font-semibold" />
              </li>
            ))}
          </ol>
        </div>

        <div className="card p-5">
          <SectionTitle hint="P(this exact final)">Most probable finals</SectionTitle>
          <ol className="space-y-2">
            {home.finals.slice(0, 8).map((f) => {
              const s = pred(f.a, f.b).score;
              return (
                <li
                  key={`${f.a}-${f.b}`}
                  className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-sm hover:bg-white/5"
                >
                  <div className="flex w-44 items-center gap-1.5">
                    <TeamChip id={f.a} />
                  </div>
                  <span className="text-faint">vs</span>
                  <div className="flex w-44 items-center gap-1.5">
                    <TeamChip id={f.b} />
                  </div>
                  <Score a={s[0]} b={s[1]} />
                  <Pct p={f.p} className="ml-auto w-14 text-right font-semibold" />
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* most-likely single reality */}
      <section className="card overflow-hidden p-6 text-center">
        <div className="text-xs uppercase tracking-widest text-faint">
          The single most-likely reality
        </div>
        <div className="mt-3 text-2xl font-bold">
          <span className="text-4xl">{flag(home.chalk.champion)}</span>{" "}
          {tname(home.chalk.champion)} lift the cup
        </div>
        <p className="mt-2 text-sm text-mute">
          The chalk bracket (every favorite wins) has probability{" "}
          <span className="tabular text-ink">{pct(home.chalk.p, 3)}</span> — which is exactly why
          one bracket is never the whole story.
        </p>
        <div className="mt-5 flex justify-center">
          <ShareBar text="Every 2026 World Cup reality at once 🌌 — collapse the bracket:" />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, glow = false }: { label: string; value: string; glow?: boolean }) {
  return (
    <div className="card px-3 py-3">
      <div className="text-[10px] uppercase tracking-widest text-faint">{label}</div>
      <div className={`tabular mt-1 text-lg font-bold ${glow ? "shimmer" : ""}`}>{value}</div>
    </div>
  );
}
