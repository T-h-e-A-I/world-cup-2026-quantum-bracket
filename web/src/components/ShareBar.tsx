"use client";
import { useState } from "react";
import { useTournament } from "@/lib/store";

export default function ShareBar({ text }: { text?: string }) {
  const { shareUrl } = useTournament();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      const url = shareUrl();
      await navigator.clipboard.writeText(text ? `${text} ${url}` : url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <button
      onClick={copy}
      className="chip px-4 py-2 text-sm font-medium hover:bg-void2"
    >
      {copied ? "✓ Link copied — go paste it" : "🔗 Copy share link"}
    </button>
  );
}
