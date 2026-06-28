"use client";
import { useRef, useState } from "react";

/** Small "i" button revealing an explanation, positioned to always stay on-screen. */
export function Info({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const toggle = () => {
    if (pos) {
      setPos(null);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(288, window.innerWidth - margin * 2);
    let left = r.left;
    if (left + width > window.innerWidth - margin) left = window.innerWidth - margin - width;
    if (left < margin) left = margin;
    setPos({ top: r.bottom + 6, left, width });
  };

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label="More info"
        onClick={toggle}
        onBlur={() => setTimeout(() => setPos(null), 150)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-line align-middle text-[10px] font-semibold text-faint hover:border-mute hover:text-ink"
      >
        i
      </button>
      {pos && (
        <span
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
          className="z-50 rounded-xl border border-line bg-void p-3 text-xs font-normal leading-relaxed text-mute shadow-xl"
        >
          {children}
        </span>
      )}
    </>
  );
}
