"use client";

import { useMemo } from "react";
import { MODEL, useTournament } from "@/lib/store";
import { favoriteIn, scenarioProbability } from "@/lib/engine";
import { tname, pred, pct, adv } from "@/lib/model";
import { downloadBracketCard } from "@/lib/cardImage";
import { Flag } from "./Flag";
import { Info } from "./Info";
import ShareBar from "./ShareBar";
import type { MatchNode, Results } from "@/lib/types";

const STRANGE_FUTURES = 14000605; // the futures Doctor Strange saw

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
  const { results, W, setResult, clearResult, official, scores, accuracy } = useTournament();
  const isOfficial = official[node.id] !== undefined;
  const called = accuracy.hit[node.id];
  const actual = scores[node.id];
  const scoreHit = accuracy.scoreHit[node.id];
  const a = slot(node, 0, results, W);
  const b = slot(node, 1, results, W);
  const playable = a.decided && b.decided;
  const winner = results[node.id];
  const pr = pred(a.id, b.id); // goal prediction for the expected matchup (every round)

  const Row = ({ s }: { s: Slot }) => {
    const isWin = winner === s.id;
    const isLose = winner !== undefined && winner !== s.id;
    const oppId = s.id === a.id ? b.id : a.id;
    const winPct = Math.round(adv(s.id, oppId) * 100); // model's chance this side wins the game
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
        <Flag id={s.id} />
        <span className={`truncate ${s.decided ? "" : "italic text-mute"}`}>{tname(s.id)}</span>
        {!s.decided && <span className="ml-auto tabular text-[10px] text-faint">{pct(s.p, 0)}</span>}
        {isWin && (
          <span className="ml-auto tabular text-[10px] font-semibold text-quantum" title="Model's chance this team won this game">
            {winPct}%
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      className={`card w-[136px] xl:w-[112px] shrink-0 p-1 ${winner !== undefined ? "border-quantum/40" : ""}
        ${playable && winner === undefined ? "ring-1 ring-flux/30" : ""}`}
    >
      <div className="flex items-center justify-between px-1 pb-0.5 text-[9px] uppercase tracking-wider text-faint">
        <span>{node.no ? `Match ${node.no}` : node.round}</span>
        {isOfficial ? (
          <span className="flex items-center gap-1">
            {actual && (
              <span
                className={`tabular ${scoreHit ? "font-semibold text-up" : ""}`}
                title={scoreHit ? "Model nailed the exact scoreline" : "Final score"}
              >
                {actual[0]}–{actual[1]}
              </span>
            )}
            <span
              className={`text-[11px] font-bold ${called ? "text-up" : "text-down"}`}
              title={called ? "Model called the winner" : "Upset — the model favored the other side"}
            >
              {called ? "✓" : "✗"}
            </span>
          </span>
        ) : (
          <span
            className="tabular"
            title={`Predicted result for the expected matchup · ${Math.round(pr.scoreProb * 100)}% likely scoreline`}
          >
            {pr.score[0]}–{pr.score[1]}
          </span>
        )}
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
  const sp = scenarioProbability(results);
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-2">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-champ">
        {finalDecided ? "Champion" : "Most likely champion"}
      </div>
      <div className="rounded-2xl border border-champ/30 bg-champ/5 px-4 py-4 text-center">
        <Flag id={fav.id} className="mx-auto h-9 w-14 rounded-md object-cover shadow-sm ring-1 ring-black/10" />
        <div className="mt-2 text-sm font-bold">{tname(fav.id)}</div>
        {finalDecided ? (
          <div className="tabular text-[11px] text-mute">
            this exact bracket:
            <br />
            <span className="font-semibold text-ink">1 in {Math.round(1 / sp).toLocaleString()}</span>
          </div>
        ) : (
          <div className="tabular text-xs font-semibold text-champ">{pct(fav.p, 1)} to win</div>
        )}
      </div>
    </div>
  );
}

export default function Bracket() {
  const { W, home, results, exploring, randomize, chalk, chaos, reset, accuracy } = useTournament();
  const sp = scenarioProbability(results);
  const complete = home.decided === 31;
  const oneIn = Math.round(1 / sp);

  // champion of the current scenario (favorite stands in until the final is decided)
  const champId = results["L5-0"] ?? favoriteIn(W, 0, 5).id;

  const saveImage = () => {
    const nodes = MODEL.matches.map((m) => {
      const a = slot(m, 0, results, W);
      const b = slot(m, 1, results, W);
      return {
        level: m.level,
        start: m.start,
        aId: a.id,
        bId: b.id,
        winnerId: results[m.id] ?? favoriteIn(W, m.start, m.level).id,
      };
    });
    downloadBracketCard({
      nodes,
      teams: MODEL.teams.map((t) => ({ name: t.name, flag: t.flag })),
      championId: champId,
      headline: complete ? `1 in ${oneIn.toLocaleString()}` : pct(favoriteIn(W, 0, 5).p, 1),
      headlineLabel: complete ? "This exact bracket" : "Champion odds",
      decided: home.decided,
    });
  };

  const shareText = complete
    ? `I built a 2026 World Cup where ${tname(champId)} win it all — odds 1 in ${oneIn.toLocaleString()}. Beat that 👇`
    : `I'm collapsing the 2026 World Cup bracket — ${home.realitiesLeft.toLocaleString()} realities still in play 🌌`;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="card px-3 py-1.5 text-sm">
          <span className="text-mute">Possible brackets left </span>
          <span className="tabular font-bold">{home.realitiesLeft.toLocaleString()}</span>
        </div>
        <div className="card px-3 py-1.5 text-sm">
          <span className="text-mute">Picked </span>
          <span className="tabular font-bold">{home.decided}/31</span>
        </div>
        {home.decided > 0 && (
          <div className="card px-3 py-1.5 text-sm" title="How likely the model thinks this run of results is">
            <span className="text-mute">Scenario odds </span>
            <span className="tabular font-bold">1 in {oneIn.toLocaleString()}</span>
          </div>
        )}
        {accuracy.total > 0 && (
          <div className="card px-3 py-1.5 text-sm" title="Real results where the model's favorite won">
            <span className="text-mute">Model called </span>
            <span className="tabular font-bold text-up">{accuracy.correct}/{accuracy.total}</span>
          </div>
        )}
        {accuracy.scoreTotal > 0 && (
          <div className="card px-3 py-1.5 text-sm" title="Real results where the model nailed the exact scoreline">
            <span className="text-mute">Exact scores </span>
            <span className="tabular font-bold">{accuracy.scoreCorrect}/{accuracy.scoreTotal}</span>
          </div>
        )}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            onClick={randomize}
            title="Simulate one tournament — a model-weighted random complete bracket"
            className="chip px-3 py-1.5 text-sm font-medium hover:bg-void2"
          >
            🎲 Random
          </button>
          <button
            onClick={chalk}
            title="Chalk — a random pick from the 50 most likely brackets (favorites mostly advance)"
            className="chip px-3 py-1.5 text-sm font-medium hover:bg-void2"
          >
            ✓ Chalk
          </button>
          <button
            onClick={chaos}
            title="Chaos — a random pick from the 50 most cursed brackets (upsets everywhere)"
            className="chip px-3 py-1.5 text-sm font-medium hover:bg-void2"
          >
            🔥 Chaos
          </button>
          <button
            onClick={reset}
            disabled={!exploring}
            className="chip px-3 py-1.5 text-sm text-mute enabled:hover:text-ink disabled:opacity-40"
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {complete && <StrangeNote oneIn={oneIn} />}

      <p className="mb-4 flex items-center gap-1.5 text-sm text-mute">
        <span className="text-ink">Tap a team to advance it.</span>
        <Info>
          <span className="block">Picks collapse the whole site — every page updates to this scenario; reset from the top bar.</span>
          <span className="mt-2 block">
            <b className="tabular text-mute">2–1</b> = predicted score ·{" "}
            <i className="text-mute">Brazil</i> <span className="tabular">61%</span> = chance to reach
            this match · <span className="tabular font-semibold text-quantum">72%</span> on a ✓ winner
            = model’s chance it won that game.
          </span>
        </Info>
      </p>

      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-[1180px] items-stretch gap-2 xl:min-w-0 xl:gap-1">
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

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ShareBar text={shareText} />
        <button
          onClick={saveImage}
          title="Download this bracket as an image you can post anywhere"
          className="chip px-4 py-2 text-sm font-medium hover:bg-void2"
        >
          ⬇ Save as image
        </button>
      </div>
    </div>
  );
}

/** Compares a completed bracket's odds to Doctor Strange's 14,000,605 futures. */
function StrangeNote({ oneIn }: { oneIn: number }) {
  const ratio = oneIn / STRANGE_FUTURES;
  const near = ratio >= 0.5 && ratio <= 2;
  const msg = near
    ? `almost exactly the ${STRANGE_FUTURES.toLocaleString()} Doctor Strange saw.`
    : ratio > 2
      ? `about ${Math.round(ratio)}× rarer than the ${STRANGE_FUTURES.toLocaleString()} Doctor Strange saw.`
      : `about ${Math.round(1 / ratio)}× more likely than the ${STRANGE_FUTURES.toLocaleString()} Doctor Strange saw.`;
  return (
    <div className="mb-4 rounded-2xl border border-quantum/30 bg-quantum/5 px-4 py-3 text-sm">
      🔮 <span className="font-semibold">This timeline is 1 in {oneIn.toLocaleString()}</span>{" "}
      <span className="text-mute">— {msg}</span>
    </div>
  );
}
