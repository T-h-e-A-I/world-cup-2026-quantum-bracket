// Exact bracket math, conditioned on collapsed results. Pure & fast (<1ms).
//
// winsub[i][L] = P(team i is the winner of the size-2^L subtree containing it),
// GIVEN the results recorded so far. L: 0=in field,1=won R32,...,4=in final,5=champion.

import { MODEL, N, adv, pred } from "./model";
import type { Results, Scores } from "./types";

export const L_MAX = 5;
export const ROUND_OF_LEVEL = ["", "Round of 32", "Round of 16", "Quarterfinal", "Semifinal", "Final"];

/** Smallest level L at which i and j share a subtree — the only round they can meet. */
export function meetLevel(i: number, j: number): number {
  let L = 1;
  while (i >> L !== j >> L) L++;
  return L;
}

/** The sub-block i must get past to win its size-2^L subtree. */
function siblingBlock(i: number, L: number): [number, number] {
  const block = 1 << L,
    half = 1 << (L - 1),
    base = (i >> L) << L;
  return ((i >> (L - 1)) & 1) === 0 ? [base + half, base + block] : [base, base + half];
}

export function winsubTable(results: Results): number[][] {
  const W: number[][] = Array.from({ length: N }, () => new Array(L_MAX + 1).fill(0));
  for (let i = 0; i < N; i++) W[i][0] = 1;

  for (let L = 1; L <= L_MAX; L++) {
    const block = 1 << L,
      half = 1 << (L - 1);
    for (let s = 0; s < N; s += block) {
      const decided = results[`L${L}-${s}`];
      if (decided !== undefined) {
        for (let t = s; t < s + block; t++) W[t][L] = t === decided ? 1 : 0;
        continue;
      }
      const lo = s,
        mid = s + half,
        hi = s + block;
      for (let i = lo; i < mid; i++) {
        let opp = 0;
        for (let j = mid; j < hi; j++) opp += W[j][L - 1] * adv(i, j);
        W[i][L] = W[i][L - 1] * opp;
      }
      for (let j = mid; j < hi; j++) {
        let opp = 0;
        for (let i = lo; i < mid; i++) opp += W[i][L - 1] * adv(j, i);
        W[j][L] = W[j][L - 1] * opp;
      }
    }
  }
  return W;
}

export interface Reach {
  r16: number; qf: number; sf: number; final: number; champion: number;
}
export const reach = (W: number[][], i: number): Reach => ({
  r16: W[i][1], qf: W[i][2], sf: W[i][3], final: W[i][4], champion: W[i][5],
});

/** P(i and j actually play), and the level (round) at which they would. */
export function probMeet(W: number[][], i: number, j: number): { p: number; level: number } {
  const L = meetLevel(i, j);
  return { p: W[i][L - 1] * W[j][L - 1], level: L };
}

export interface FinalOpp { opp: number; pFinal: number; pWin: number; }
/** The (up to 16) possible final opponents for team i, with probabilities. */
export function finalOpponents(W: number[][], i: number): FinalOpp[] {
  const lo = i < 16 ? 16 : 0,
    hi = i < 16 ? 32 : 16;
  const out: FinalOpp[] = [];
  for (let j = lo; j < hi; j++) {
    const pFinal = W[i][4] * W[j][4];
    out.push({ opp: j, pFinal, pWin: pFinal * adv(i, j) });
  }
  return out.sort((a, b) => b.pFinal - a.pFinal);
}

export interface PathStep {
  level: number; opp: number; pOppHere: number; advance: number; cum: number;
}
/** Most-likely route to the final: the strongest expected opponent each round. */
export function modalPath(W: number[][], i: number): PathStep[] {
  const out: PathStep[] = [];
  let cum = 1;
  for (let L = 1; L <= 4; L++) {
    const [a, b] = siblingBlock(i, L);
    let opp = a,
      best = -1;
    for (let o = a; o < b; o++)
      if (W[o][L - 1] > best) { best = W[o][L - 1]; opp = o; }
    cum *= W[opp][L - 1] * adv(i, opp);
    out.push({ level: L, opp, pOppHere: W[opp][L - 1], advance: adv(i, opp), cum });
  }
  return out;
}

// ---- homepage "top realities" + collapse metrics ------------------------
export interface Reality {
  champion: number;
  finalists: [number, number]; // the two teams in the final (champion is one of them)
  p: number;                   // probability this exact complete bracket happens
  winners: Results;            // every match's winner — load straight into the bracket
}

export interface Home {
  champions: { id: number; p: number }[];
  finals: { a: number; b: number; p: number }[];
  decided: number;
  realitiesLeft: number;
}

export function homeView(W: number[][], results: Results): Home {
  const champions = Array.from({ length: N }, (_, i) => ({ id: i, p: W[i][5] }))
    .sort((a, b) => b.p - a.p);

  const finals: { a: number; b: number; p: number }[] = [];
  for (let a = 0; a < 16; a++)
    for (let b = 16; b < 32; b++) finals.push({ a, b, p: W[a][4] * W[b][4] });
  finals.sort((x, y) => y.p - x.p);

  const decided = MODEL.matches.filter((m) => results[m.id] !== undefined).length;
  return {
    champions,
    finals,
    decided,
    realitiesLeft: 2 ** (N - 1 - decided),
  };
}

// ---- top-N most probable COMPLETE brackets -------------------------------
// Tree DP: each subtree returns its best complete fill-ins. Keeping the top-N
// per emergent winner is provably enough to recover the global top-N brackets
// (a bracket can only be globally top-N if each half is top-N for its winner).
interface SubOutcome { winner: number; p: number; winners: Results }

// `force` pins the emergent winner of specific subtrees (nodeId -> team id) — used to
// condition complete brackets on "team a wins its subtree AND team b wins its subtree".
// `wt(i,j)` is the ranking weight for "i beats j". Defaults to the real model (adv) →
// top brackets by probability. Swap it (adv(j,i)) to rank by upset-likelihood (chaos).
function subOutcomes(
  level: number, start: number, results: Results, n: number,
  force: Results = {}, wt: (i: number, j: number) => number = adv,
): SubOutcome[] {
  if (level === 0) return [{ winner: start, p: 1, winners: {} }];
  const half = 1 << (level - 1);
  const L = subOutcomes(level - 1, start, results, n, force, wt);
  const R = subOutcomes(level - 1, start + half, results, n, force, wt);
  const nodeId = `L${level}-${start}`;
  const decided = results[nodeId];
  const forced = force[nodeId];

  const cands: { p: number; winner: number; li: number; ri: number }[] = [];
  for (let li = 0; li < L.length; li++) {
    for (let ri = 0; ri < R.length; ri++) {
      const pair = L[li].p * R[ri].p;
      if (pair === 0) continue;
      const wl = L[li].winner, wr = R[ri].winner;
      if (decided !== undefined) {
        if (decided === wl) cands.push({ p: pair, winner: wl, li, ri });
        else if (decided === wr) cands.push({ p: pair, winner: wr, li, ri });
      } else {
        cands.push({ p: pair * wt(wl, wr), winner: wl, li, ri });
        cands.push({ p: pair * wt(wr, wl), winner: wr, li, ri });
      }
    }
  }
  if (forced !== undefined)
    for (let k = cands.length - 1; k >= 0; k--) if (cands[k].winner !== forced) cands.splice(k, 1);
  cands.sort((a, b) => b.p - a.p);

  const perWinner = new Map<number, number>();
  const out: SubOutcome[] = [];
  for (const c of cands) {
    const k = perWinner.get(c.winner) ?? 0;
    if (k >= n) continue;
    perWinner.set(c.winner, k + 1);
    out.push({
      winner: c.winner, p: c.p,
      winners: { ...L[c.li].winners, ...R[c.ri].winners, [nodeId]: c.winner },
    });
  }
  return out;
}

function toReality(o: SubOutcome): Reality {
  return {
    champion: o.winner,
    finalists: [o.winners["L4-0"], o.winners["L4-16"]] as [number, number],
    p: o.p,
    winners: o.winners,
  };
}

// Per-champion cap on the DP. Keeping the top-K per champion-of-a-subtree is what
// guarantees the global top-K, but cost grows ~quadratically in the cap (the final
// node sorts cap²·256 candidates). A cap of 8 is near-instant and still yields a rich,
// near-exact ranking — far more than enough for a display list or a random-pick pool.
const PER_WINNER_CAP = 8;

export function topRealities(results: Results, n = 10): Reality[] {
  return subOutcomes(L_MAX, 0, results, Math.min(n, PER_WINNER_CAP))
    .map(toReality)
    .sort((a, b) => b.p - a.p)
    .slice(0, n);
}

/** A pool of strong candidate brackets (up to `capPerChampion` per possible champion). */
export function realityPool(results: Results, capPerChampion = 10): Reality[] {
  return subOutcomes(L_MAX, 0, results, capPerChampion).map(toReality).sort((a, b) => b.p - a.p);
}

/**
 * A pool of cursed brackets: the single most upset-heavy world for EACH possible
 * champion (ranked by an inverted model, so underdogs run the table), deduped by
 * champion so every draw can crown a different longshot — not the same all-underdogs
 * bracket every time. `p` is the real (tiny) probability, for honest display.
 */
export function chaosRealities(results: Results, n = 50): Reality[] {
  const all = subOutcomes(L_MAX, 0, results, 6, {}, (i, j) => adv(j, i))
    .map(toReality)
    .map((r) => ({ ...r, p: scenarioProbability(r.winners) }));
  const best = new Map<number, Reality>();
  for (const r of all) {
    const cur = best.get(r.champion);
    if (!cur || r.p < cur.p) best.set(r.champion, r); // keep the most improbable per champion
  }
  return [...best.values()].sort((a, b) => a.p - b.p).slice(0, n);
}

/**
 * Top-`n` most probable COMPLETE brackets in which i and j actually meet.
 * Conditions the tree DP so i wins its subtree and j wins the adjoining one (so they
 * collide at their only possible round), then ranks — this surfaces BOTH champions,
 * unlike filtering a generic pool, where a longshot finalist gets capped out.
 */
export function topMeetingRealities(results: Results, i: number, j: number, n = 5): Reality[] {
  const L = meetLevel(i, j);
  if (L === 1) {
    // Adjacent teams always play their Round-of-32 game — every bracket is a "meeting".
    return topRealities(results, n);
  }
  const iStart = (i >> (L - 1)) << (L - 1);
  const jStart = (j >> (L - 1)) << (L - 1);
  const force: Results = { [`L${L - 1}-${iStart}`]: i, [`L${L - 1}-${jStart}`]: j };
  const all = subOutcomes(L_MAX, 0, results, n, force)
    .map(toReality)
    .filter((r) => meetInBracket(r.winners, i, j))
    .sort((a, b) => b.p - a.p);
  // Diversify: the likeliest world for each possible champion first (so both teams'
  // winning worlds surface), then fill remaining slots with the next-best overall.
  const seen = new Set<number>();
  const primary: Reality[] = [];
  const rest: Reality[] = [];
  for (const r of all) {
    if (seen.has(r.champion)) rest.push(r);
    else { seen.add(r.champion); primary.push(r); }
  }
  return [...primary, ...rest].slice(0, n);
}

/** Does this complete bracket have i and j actually playing each other? */
export function meetInBracket(winners: Results, i: number, j: number): boolean {
  const L = meetLevel(i, j);
  if (L === 1) return true; // adjacent teams always play their Round of 32 game
  const aNode = `L${L - 1}-${(i >> (L - 1)) << (L - 1)}`;
  const bNode = `L${L - 1}-${(j >> (L - 1)) << (L - 1)}`;
  return winners[aNode] === i && winners[bNode] === j;
}

/** Favorite team to emerge from a subtree, with its probability (for ghost slots). */
export function favoriteIn(W: number[][], start: number, level: number): { id: number; p: number } {
  const size = 1 << level;
  let id = start, best = -1;
  for (let t = start; t < start + size; t++)
    if (W[t][level] > best) { best = W[t][level]; id = t; }
  return { id, p: best };
}

/** Fill every undecided match by `pick`, respecting already-collapsed results in `base`. */
function fillBracket(base: Results, pick: (a: number, b: number) => number): Results {
  const out: Results = {};
  for (const m of MODEL.matches) {
    const a = m.teams ? m.teams[0] : out[m.feeders![0]];
    const b = m.teams ? m.teams[1] : out[m.feeders![1]];
    out[m.id] = base[m.id] !== undefined ? base[m.id] : pick(a, b);
  }
  return out;
}

/** Simulate one full tournament: fill every match with a model-weighted random winner. */
export function randomBracket(base: Results = {}): Results {
  return fillBracket(base, (a, b) => (Math.random() < adv(a, b) ? a : b));
}

/** Chalk: the model favorite advances in every match (the single most likely bracket). */
export function chalkBracket(base: Results = {}): Results {
  return fillBracket(base, (a, b) => (adv(a, b) >= 0.5 ? a : b));
}

/** Chaos: the underdog springs the upset in every match (the least likely surviving bracket). */
export function chaosBracket(base: Results = {}): Results {
  return fillBracket(base, (a, b) => (adv(a, b) < 0.5 ? a : b));
}

/** Probability of the picks made so far = product of each decided match's model odds. */
export function scenarioProbability(results: Results): number {
  let p = 1;
  for (const m of MODEL.matches) {
    const w = results[m.id];
    if (w === undefined) continue;
    const part = participants(m.id, results);
    if (!part) continue;
    p *= adv(w, part[0] === w ? part[1] : part[0]);
  }
  return p;
}

/** How the model's pre-match predictions have fared against the real (official) results. */
export function modelAccuracy(official: Results, scores: Scores = {}): {
  correct: number; // winners called right
  total: number; // matches played
  hit: Record<string, boolean>; // node id -> did the model favor the actual winner
  scoreCorrect: number; // exact scorelines called right
  scoreTotal: number; // matches with a recorded score
  scoreHit: Record<string, boolean>; // node id -> did the model nail the exact scoreline
} {
  const hit: Record<string, boolean> = {};
  const scoreHit: Record<string, boolean> = {};
  let correct = 0, total = 0, scoreCorrect = 0, scoreTotal = 0;
  for (const m of MODEL.matches) {
    const w = official[m.id];
    if (w === undefined) continue;
    const part = participants(m.id, official);
    if (!part) continue;
    const opp = part[0] === w ? part[1] : part[0];
    const called = adv(w, opp) >= 0.5; // model favored the team that actually won?
    hit[m.id] = called;
    if (called) correct++;
    total++;

    const actual = scores[m.id];
    if (actual) {
      const guess = pred(part[0], part[1]).score; // predicted [part0, part1] goals
      const exact = guess[0] === actual[0] && guess[1] === actual[1];
      scoreHit[m.id] = exact;
      if (exact) scoreCorrect++;
      scoreTotal++;
    }
  }
  return { correct, total, hit, scoreCorrect, scoreTotal, scoreHit };
}

/** A node is playable once both its feeders are decided (R32 always playable). */
export function participants(id: string, results: Results): [number, number] | null {
  const m = MODEL.matches.find((x) => x.id === id)!;
  if (m.teams) return m.teams;
  const [fa, fb] = m.feeders!;
  const a = results[fa],
    b = results[fb];
  return a !== undefined && b !== undefined ? [a, b] : null;
}
