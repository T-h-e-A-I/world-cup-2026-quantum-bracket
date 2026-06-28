"use client";

import {
  createContext, useContext, useEffect, useMemo, useState, useCallback,
} from "react";
import { MODEL } from "./model";
import { winsubTable, homeView, randomBracket, type Home } from "./engine";
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
  reset: () => void;
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

export function TournamentProvider({ children }: { children: React.ReactNode }) {
  const [overlay, setOverlay] = useState<Results>({});
  const [hydrated, setHydrated] = useState(false);

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
    setOverlay((prev) => {
      const next = { ...prev, [nodeId]: winner };
      for (const a of ancestors(nodeId)) delete next[a];
      return next;
    });
  }, []);

  const clearResult = useCallback((nodeId: string) => {
    setOverlay((prev) => {
      const next = { ...prev };
      delete next[nodeId];
      for (const a of ancestors(nodeId)) delete next[a];
      return next;
    });
  }, []);

  const randomize = useCallback(() => setOverlay(randomBracket(official)), []);
  const reset = useCallback(() => setOverlay({}), []);

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
    setResult, clearResult, randomize, reset, shareUrl,
  };
  return <TournamentCtx.Provider value={value}>{children}</TournamentCtx.Provider>;
}

export function useTournament(): Ctx {
  const c = useContext(TournamentCtx);
  if (!c) throw new Error("useTournament must be used within TournamentProvider");
  return c;
}

export { MODEL };
