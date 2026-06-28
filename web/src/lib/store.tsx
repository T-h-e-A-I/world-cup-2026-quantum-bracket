"use client";

import {
  createContext, useContext, useEffect, useMemo, useState, useCallback,
} from "react";
import { MODEL } from "./model";
import { winsubTable, homeView, type Home } from "./engine";
import OFFICIAL from "@/data/results.json";
import type { Results } from "./types";

const STORAGE_KEY = "wc26-results-v2"; // v2: overlay is bracket-sandbox only
const official = OFFICIAL as Results; // real completed matches the repo maintains

interface Ctx {
  // ---- reality (official results only): Home, My Team, Will They Meet ----
  W: number[][];
  home: Home;
  // ---- sandbox (official + your exploration): the Collapse-the-Bracket page ----
  sbResults: Results;
  sbW: number[][];
  sbHome: Home;
  exploring: boolean;
  setResult: (nodeId: string, winner: number) => void;
  clearResult: (nodeId: string) => void;
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

  // hydrate the sandbox overlay from URL (?r=) or localStorage after mount
  useEffect(() => {
    let loaded: Results = {};
    try {
      const url = new URL(window.location.href);
      const r = url.searchParams.get("r");
      if (r) loaded = JSON.parse(decodeURIComponent(r));
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

  // reality — never affected by the user's bracket doodles
  const W = useMemo(() => winsubTable(official), []);
  const home = useMemo(() => homeView(W, official), [W]);

  // sandbox — reality plus the user's exploration
  const sbResults = useMemo<Results>(() => ({ ...official, ...overlay }), [overlay]);
  const sbW = useMemo(() => winsubTable(sbResults), [sbResults]);
  const sbHome = useMemo(() => homeView(sbW, sbResults), [sbW, sbResults]);

  const setResult = useCallback((nodeId: string, winner: number) => {
    setOverlay((prev) => {
      const next = { ...prev, [nodeId]: winner };
      for (const a of ancestors(nodeId)) delete next[a]; // invalidate stale parents
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

  const reset = useCallback(() => setOverlay({}), []);

  const shareUrl = useCallback(() => {
    if (typeof window === "undefined") return "";
    const u = new URL(window.location.origin + window.location.pathname);
    if (Object.keys(overlay).length)
      u.searchParams.set("r", encodeURIComponent(JSON.stringify(overlay)));
    return u.toString();
  }, [overlay]);

  const exploring = Object.keys(overlay).length > 0;

  const value: Ctx = {
    W, home,
    sbResults, sbW, sbHome, exploring, setResult, clearResult, reset, shareUrl,
  };
  return <TournamentCtx.Provider value={value}>{children}</TournamentCtx.Provider>;
}

export function useTournament(): Ctx {
  const c = useContext(TournamentCtx);
  if (!c) throw new Error("useTournament must be used within TournamentProvider");
  return c;
}

export { MODEL };
