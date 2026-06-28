"use client";

import {
  createContext, useContext, useEffect, useMemo, useState, useCallback, useRef,
} from "react";
import { MODEL } from "./model";
import {
  winsubTable, homeView, randomBracket, chalkBracket, chaosBracket, type Home,
} from "./engine";
import { encodeResults, decodeResults } from "./share";
import OFFICIAL from "@/data/results.json";
import type { Results } from "./types";

const STORAGE_KEY = "wc26-results-v3";
const official = OFFICIAL as Results; // real completed matches the repo maintains

interface Ctx {
  results: Results;   // official + your picks — drives EVERY page (the live collapse)
  W: number[][];
  home: Home;
  decided: number;    // matches decided so far (official + picks)
  exploring: boolean; // you have added picks beyond the official results
  setResult: (nodeId: string, winner: number) => void;
  clearResult: (nodeId: string) => void;
  randomize: () => void; // draw one model-weighted random complete bracket
  chalk: () => void;     // fill with the favorite every match (likeliest bracket)
  chaos: () => void;     // fill with the underdog every match (most cursed bracket)
  reset: () => void;
  animating: boolean;    // a round-by-round collapse is currently playing
  shareUrl: () => string;
}

const TournamentCtx = createContext<Ctx | null>(null);

/** Ancestor node ids of a node (higher rounds that contain it). */
function ancestors(nodeId: string): string[] {
  const [Lstr, sStr] = nodeId.slice(1).split("-");
  const L = +Lstr, s = +sStr;
  const out: string[] = [];
  for (let L2 = L + 1; L2 <= 5; L2++) out.push(`L${L2}-${(s >> L2) << L2}`);
  return out;
}

const ANIM_STEP = 320; // ms per round during a collapse

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [overlay, setOverlay] = useState<Results>({});
  const [hydrated, setHydrated] = useState(false);
  const [animating, setAnimating] = useState(false);
  const timers = useRef<number[]>([]);

  const cancelAnim = useCallback(() => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
    setAnimating(false);
  }, []);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  useEffect(() => {
    let loaded: Results = {};
    try {
      const url = new URL(window.location.href);
      const r = url.searchParams.get("r");
      if (r) loaded = decodeResults(r);
      else {
        const ls = localStorage.getItem(STORAGE_KEY);
        if (ls) loaded = JSON.parse(ls);
      }
    } catch {
      /* ignore malformed state */
    }
    setOverlay(loaded);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(overlay));
    } catch {
      /* ignore */
    }
  }, [overlay, hydrated]);

  const results = useMemo<Results>(() => ({ ...official, ...overlay }), [overlay]);
  const W = useMemo(() => winsubTable(results), [results]);
  const home = useMemo(() => homeView(W, results), [W, results]);

  const setResult = useCallback((nodeId: string, winner: number) => {
    cancelAnim();
    setOverlay((prev) => {
      const next = { ...prev, [nodeId]: winner };
      for (const a of ancestors(nodeId)) delete next[a];
      return next;
    });
  }, [cancelAnim]);

  const clearResult = useCallback((nodeId: string) => {
    cancelAnim();
    setOverlay((prev) => {
      const next = { ...prev };
      delete next[nodeId];
      for (const a of ancestors(nodeId)) delete next[a];
      return next;
    });
  }, [cancelAnim]);

  // Reveal a complete bracket round by round (R32 → Final) so the superposition
  // visibly collapses. Honors prefers-reduced-motion and cancels any in-flight run.
  const animateTo = useCallback((target: Results) => {
    cancelAnim();
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) { setOverlay(target); return; }

    setAnimating(true);
    setOverlay({}); // start from the full superposition
    for (let L = 1; L <= 5; L++) {
      const t = window.setTimeout(() => {
        const partial: Results = {};
        for (const m of MODEL.matches)
          if (m.level <= L && target[m.id] !== undefined) partial[m.id] = target[m.id];
        setOverlay(partial);
      }, ANIM_STEP * L);
      timers.current.push(t);
    }
    timers.current.push(window.setTimeout(() => setAnimating(false), ANIM_STEP * 5 + 380));
  }, [cancelAnim]);

  const randomize = useCallback(() => animateTo(randomBracket(official)), [animateTo]);
  const chalk = useCallback(() => animateTo(chalkBracket(official)), [animateTo]);
  const chaos = useCallback(() => animateTo(chaosBracket(official)), [animateTo]);
  const reset = useCallback(() => { cancelAnim(); setOverlay({}); }, [cancelAnim]);

  const shareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    const u = new URL(window.location.origin + window.location.pathname);
    const code = encodeResults(overlay);
    if (code) u.searchParams.set("r", code);
    return u.toString();
  }, [overlay]);

  const value: Ctx = {
    results, W, home, decided: home.decided,
    exploring: Object.keys(overlay).length > 0,
    setResult, clearResult, randomize, chalk, chaos, reset, animating, shareUrl,
  };
  return <TournamentCtx.Provider value={value}>{children}</TournamentCtx.Provider>;
}

export function useTournament(): Ctx {
  const c = useContext(TournamentCtx);
  if (!c) throw new Error("useTournament must be used within TournamentProvider");
  return c;
}

export { MODEL };
