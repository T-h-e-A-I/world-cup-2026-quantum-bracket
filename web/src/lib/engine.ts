// Exact bracket math, conditioned on collapsed results. Pure & fast (<1ms).
//
// winsub[i][L] = P(team i is the winner of the size-2^L subtree containing it),
// GIVEN the results recorded so far. L: 0=in field,1=won R32,...,4=in final,5=champion.

import { MODEL, N, adv } from "./model";
import type { Results } from "./types";

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
export interface Home {
  champions: { id: number; p: number }[];
  finals: { a: number; b: number; p: number }[];
  chalk: { champion: number; p: number };
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

  // most-likely surviving complete bracket and its probability
  let alive = Array.from({ length: N }, (_, i) => i);
  let chalkP = 1;
  while (alive.length > 1) {
    const next: number[] = [];
    for (let k = 0; k < alive.length; k += 2) {
      const a = alive[k],
        b = alive[k + 1],
        wa = adv(a, b);
      const [win, p] = wa >= 0.5 ? [a, wa] : [b, 1 - wa];
      chalkP *= p;
      next.push(win);
    }
    alive = next;
  }

  const decided = MODEL.matches.filter((m) => results[m.id] !== undefined).length;
  return {
    champions,
    finals,
    chalk: { champion: alive[0], p: chalkP },
    decided,
    realitiesLeft: 2 ** (N - 1 - decided),
  };
}

/** Favorite team to emerge from a subtree, with its probability (for ghost slots). */
export function favoriteIn(W: number[][], start: number, level: number): { id: number; p: number } {
  const size = 1 << level;
  let id = start, best = -1;
  for (let t = start; t < start + size; t++)
    if (W[t][level] > best) { best = W[t][level]; id = t; }
  return { id, p: best };
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
