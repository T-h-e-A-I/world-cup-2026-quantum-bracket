"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useTournament } from "@/lib/store";
import { topRealities } from "@/lib/engine";
import { MODEL, pct, tname, big, pred, slug } from "@/lib/model";
import { TeamChip, Bar, Pct, Score } from "@/components/ui";
import { Flag } from "@/components/Flag";
import { Info } from "@/components/Info";
import { encodeResults } from "@/lib/share";
import ShareBar from "@/components/ShareBar";

const STRANGE_FUTURES = 14000605; // Doctor Strange's count
const SHOW_OPTIONS = [10, 30, 50];

export default function Home() {
  const { home, results } = useTournament();
  const [shown, setShown] = useState(10);
  const realities = useMemo(() => topRealities(results, 50), [results]);
  const topFinal = home.finals[0];
  const fav = home.champions[0];
  const topRealityP = realities[0]?.p ?? 1;
  const oneIn = (p: number) => (p > 0 ? `1 in ${Math.round(1 / p).toLocaleString()}` : "—");
  const strangeMultiple = Math.round(MODEL.meta.realities / STRANGE_FUTURES);

  return (
    <div className="space-y-14 sm:space-y-20">
      {/* hero */}
      <section className="text-center">
        <span className="chip inline-flex px-3 py-1 text-xs text-mute">
          2026 FIFA World Cup · Round of 32
        </span>
        <h1 className="mt-5 text-balance text-[2.6rem] font-bold leading-[1.02] sm:text-7xl">
          Every World Cup
          <br className="hidden sm:block" /> reality,{" "}
          <span className="text-quantum">at once.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-[15px] text-mute sm:text-base">
          All <span className="font-semibold text-ink">{big(MODEL.meta.realities)}</span> possible
          brackets exist at the same time, each with an exact probability. Every result that comes in
          collapses the rest.
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/bracket"
            className="w-full rounded-full bg-ink px-5 py-3 font-semibold text-white transition hover:opacity-90 sm:w-auto"
          >
            Play out the bracket →
          </Link>
          <Link
            href="/team"
            className="w-full rounded-full border border-line px-5 py-3 font-semibold text-ink transition hover:bg-void2 sm:w-auto"
          >
            Find my team’s odds
          </Link>
        </div>

        {/* collapse meter — one strip, no nested boxes */}
        <dl className="mx-auto mt-9 grid max-w-2xl grid-cols-2 overflow-hidden rounded-2xl border border-line sm:grid-cols-4">
          <Stat label="Realities left" value={home.realitiesLeft.toLocaleString()} />
          <Stat label="Decided" value={`${home.decided}/31`} />
          <Stat label="Favorite">
            <Flag id={fav.id} /> <span className="tabular">{pct(fav.p, 0)}</span>
          </Stat>
          <Stat label="Likeliest final">
            <Flag id={topFinal.a} /> <span className="text-faint">v</span> <Flag id={topFinal.b} />
          </Stat>
        </dl>
      </section>

      {/* favorites + finals — open sections, hairline rows */}
      <section className="grid gap-12 lg:grid-cols-2">
        <div>
          <H2 hint="chance to win it all">Title favorites</H2>
          <ol className="rows mt-2">
            {home.champions.slice(0, 8).map((c, i) => (
              <li key={c.id}>
                <Link
                  href={`/team/${slug(c.id)}`}
                  className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-void2"
                >
                  <span className="w-4 text-xs text-faint">{i + 1}</span>
                  <div className="w-36 shrink-0 sm:w-44">
                    <TeamChip id={c.id} />
                  </div>
                  <div className="flex-1">
                    <Bar p={c.p} gold={i === 0} />
                  </div>
                  <Pct p={c.p} className="w-14 text-right text-sm font-semibold" />
                </Link>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <H2 hint="chance of this exact final">Most probable finals</H2>
          <ol className="rows mt-2">
            {home.finals.slice(0, 8).map((f) => {
              const s = pred(f.a, f.b).score;
              return (
                <li key={`${f.a}-${f.b}`} className="flex items-center gap-2 py-2.5 text-sm">
                  <TeamChip id={f.a} className="w-32 sm:w-36" />
                  <Score a={s[0]} b={s[1]} />
                  <TeamChip id={f.b} className="hidden w-32 sm:flex sm:w-36" />
                  <Pct p={f.p} className="ml-auto w-14 text-right font-semibold" />
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Doctor Strange */}
      <section className="overflow-hidden rounded-3xl border border-line bg-ink text-white">
        <div className="grid items-center gap-0 sm:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[16/10] w-full sm:aspect-auto sm:h-full sm:min-h-[260px]">
            <Image src="/strange.webp" alt="Doctor Strange viewing the futures" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
          </div>
          <div className="p-6 sm:p-8">
            <div className="text-[11px] uppercase tracking-widest text-white/50">
              “I went forward in time…”
            </div>
            <p className="mt-3 text-lg leading-snug sm:text-xl">
              Doctor Strange saw <span className="font-bold">{big(STRANGE_FUTURES)}</span> futures and
              found the one where they win.
            </p>
            <p className="mt-3 text-lg leading-snug text-quantum sm:text-xl">
              Quantum Bracket holds <span className="font-bold">{big(MODEL.meta.realities)}</span> —
              about <span className="font-bold">{strangeMultiple}×</span> more. We&apos;re still
              looking for the one.
            </p>
          </div>
        </div>
      </section>

      {/* most probable realities */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-2">
          <h2 className="flex items-center gap-1.5 text-xl font-bold">
            Most probable realities
            <Info>
              A “reality” is one complete bracket — all 31 results. Even the likeliest is a long
              shot; no single bracket owns the future. Tap one to open it in Play Bracket.
            </Info>
          </h2>
          <div className="flex items-center gap-1 text-xs">
            <span className="mr-1 text-faint">show top</span>
            {SHOW_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setShown(n)}
                className={`rounded-full px-2.5 py-1 font-medium transition ${
                  shown === n ? "bg-ink text-white" : "text-mute hover:bg-void2"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <ol className="mt-2 rows">
          {realities.slice(0, shown).map((r, i) => {
            const runnerUp = r.finalists[0] === r.champion ? r.finalists[1] : r.finalists[0];
            const href = `/bracket?r=${encodeResults(r.winners)}`;
            return (
              <li key={i}>
                <a href={href} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-void2">
                  <span className="w-4 text-xs text-faint">{i + 1}</span>
                  <span className="text-base">🏆</span>
                  <TeamChip id={r.champion} className="w-32 font-semibold sm:w-40" />
                  <span className="hidden text-faint sm:inline">def.</span>
                  <TeamChip id={runnerUp} className="hidden w-32 text-mute sm:flex sm:w-40" />
                  <div className="ml-auto flex items-center gap-3">
                    <div className="hidden w-24 sm:block"><Bar p={r.p / topRealityP} /></div>
                    <span className="tabular whitespace-nowrap text-right font-semibold">{oneIn(r.p)}</span>
                    <span className="text-faint">→</span>
                  </div>
                </a>
              </li>
            );
          })}
        </ol>
        <div className="mt-7 flex justify-center">
          <ShareBar text="Every 2026 World Cup reality at once — see the odds:" />
        </div>
      </section>
    </div>
  );
}

function H2({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
      <h2 className="text-xl font-bold">{children}</h2>
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </div>
  );
}

function Stat({
  label, value, children,
}: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="border-b border-line px-3 py-3 [&:nth-child(odd)]:border-r sm:border-b-0 sm:[&:not(:last-child)]:border-r">
      <dt className="text-[10px] uppercase tracking-widest text-faint">{label}</dt>
      <dd className="tabular mt-1 flex items-center justify-center gap-1.5 text-base font-bold sm:text-lg">
        {value ?? children}
      </dd>
    </div>
  );
}
