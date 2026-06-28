// Shapes for the model bundle emitted by engine/build_data.py (src/data/model.json)

export interface Team {
  id: number;
  name: string;
  flag: string; // emoji fallback
  iso: string;  // flagcdn code (e.g. "ar", "gb-eng") for real flag images
  elo: number;
  half: 0 | 1; // 0 = left side of the bracket, 1 = right
}

export interface MatchNode {
  id: string;          // "L{level}-{start}"
  no: number | null;   // official FIFA match number
  level: number;       // 1=R32 ... 5=Final
  round: string;
  start: number;       // index of the first leaf in this subtree
  size: number;        // 2^level
  teams?: [number, number];   // only on R32 nodes (concrete participants)
  feeders?: [string, string]; // child node ids for later rounds
}

export interface Pred {
  score: [number, number];
  xg: [number, number];
  confidence: number;
  confidenceLabel: string;
}

export interface Model {
  meta: { title: string; rounds: string[]; realities: number; model: string };
  teams: Team[];
  matches: MatchNode[];
  adv: number[][];          // adv[i][j] = P(i beats j)
  pairs: Record<string, Pred>;
}

// A collapsed result: bracket node id -> winning team id
export type Results = Record<string, number>;
