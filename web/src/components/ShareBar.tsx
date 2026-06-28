"use client";
import { useEffect, useState } from "react";
import { useTournament } from "@/lib/store";

export default function ShareBar({ text = "2026 World Cup, every reality at once 🌌" }: { text?: string }) {
  const { shareUrl } = useTournament();
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(""); // resolved after mount to avoid SSR/client mismatch

  useEffect(() => {
    setUrl(shareUrl());
  }, [shareUrl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  const enc = (s: string) => encodeURIComponent(s);
  const links = [
    { label: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={copy} className="chip px-3 py-1.5 text-sm font-medium hover:bg-white/10">
        {copied ? "✓ Link copied" : "🔗 Copy share link"}
      </button>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="chip px-3 py-1.5 text-sm text-mute hover:text-ink hover:bg-white/10"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
