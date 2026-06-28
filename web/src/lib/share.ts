// Compact, URL-safe encoding of a Results map.
//
// The overlay is always downward-closed (you can only decide a match whose
// feeders are decided), so we encode it as: a 31-bit "decided" mask + one bit
// per decided match for which child advanced. A full bracket -> ~8 bytes.

import { MODEL } from "./model";
import type { Results } from "./types";

const MATCHES = MODEL.matches; // bottom-up: children always precede parents

function childWinners(mIdx: number, results: Results): [number, number] | null {
  const m = MATCHES[mIdx];
  if (m.teams) return [m.teams[0], m.teams[1]];
  const l = results[m.feeders![0]];
  const r = results[m.feeders![1]];
  if (l === undefined || r === undefined) return null;
  return [l, r];
}

function bitsToCode(bits: number[]): string {
  const bytes = new Uint8Array(Math.ceil(bits.length / 8));
  bits.forEach((b, i) => { if (b) bytes[i >> 3] |= 1 << (7 - (i & 7)); });
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function codeToBits(code: string, n: number): number[] {
  let s = code.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "="; // restore stripped padding for atob
  const bin = atob(s);
  const bits: number[] = [];
  for (let i = 0; i < n; i++) bits.push(((bin.charCodeAt(i >> 3) || 0) >> (7 - (i & 7))) & 1);
  return bits;
}

export function encodeResults(results: Results): string {
  const mask: number[] = [];
  const winnerBits: number[] = [];
  MATCHES.forEach((m, i) => {
    const w = results[m.id];
    if (w === undefined) { mask.push(0); return; }
    const ch = childWinners(i, results);
    if (!ch) { mask.push(0); return; } // not resolvable -> treat as undecided
    mask.push(1);
    winnerBits.push(w === ch[0] ? 0 : 1);
  });
  if (!winnerBits.length) return "";
  return bitsToCode([...mask, ...winnerBits]);
}

export function decodeResults(code: string): Results {
  if (!code) return {};
  // Backwards-compat: old links carried JSON.
  if (code.startsWith("%7B") || code.startsWith("{")) {
    try { return JSON.parse(decodeURIComponent(code)); } catch { return {}; }
  }
  try {
    const bits = codeToBits(code, MATCHES.length * 2);
    const results: Results = {};
    let wi = MATCHES.length;
    MATCHES.forEach((m, i) => {
      if (!bits[i]) return;
      const ch = childWinners(i, results);
      if (!ch) return;
      results[m.id] = bits[wi++] ? ch[1] : ch[0];
    });
    return results;
  } catch {
    return {};
  }
}
