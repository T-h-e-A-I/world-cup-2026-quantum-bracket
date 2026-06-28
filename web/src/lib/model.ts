import raw from "@/data/model.json";
import type { Model, Pred, Team } from "./types";

export const MODEL = raw as unknown as Model;
export const TEAMS: Team[] = MODEL.teams;
export const N = TEAMS.length; // 32
export const ROUNDS = MODEL.meta.rounds;

export const team = (id: number): Team => TEAMS[id];
export const adv = (i: number, j: number): number => MODEL.adv[i][j];

const matchById = new Map(MODEL.matches.map((m) => [m.id, m]));
export const node = (id: string) => matchById.get(id);

/** Predicted scoreline / xG / confidence for i vs j, from i's perspective. */
export function pred(i: number, j: number): Pred {
  const flip = i > j;
  const key = flip ? `${j}_${i}` : `${i}_${j}`;
  const p = MODEL.pairs[key];
  if (!flip) return p;
  return {
    score: [p.score[1], p.score[0]],
    scoreProb: p.scoreProb,
    xg: [p.xg[1], p.xg[0]],
    confidence: p.confidence,
    confidenceLabel: p.confidenceLabel,
  };
}

// ---- formatting helpers -------------------------------------------------
export const pct = (p: number, d = 1): string =>
  p <= 0 ? "0%" : p < 0.001 ? "<0.1%" : `${(p * 100).toFixed(d)}%`;

export const flag = (id: number): string => TEAMS[id].flag;
export const tname = (id: number): string => TEAMS[id].name;

/** "2,147,483,648" style. */
export const big = (n: number): string => n.toLocaleString("en-US");
