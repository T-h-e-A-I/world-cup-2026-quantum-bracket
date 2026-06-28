"use client";
import { useState } from "react";

/** Small "i" button that reveals an explanation on tap — keeps pages clean. */
export function Info({ children, align = "right" }: { children: React.ReactNode; align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block align-middle">
      <button
        type="button"
        aria-label="More info"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line text-[10px] font-semibold text-faint hover:border-mute hover:text-ink"
      >
        i
      </button>
      {open && (
        <span
          className={`absolute top-6 z-30 w-64 rounded-xl border border-line bg-void p-3 text-xs font-normal leading-relaxed text-mute shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {children}
        </span>
      )}
    </span>
  );
}
