"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import CollapseStatus from "./CollapseStatus";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/bracket", label: "Play Bracket" },
  { href: "/team", label: "My Team" },
  { href: "/matchup", label: "Will They Meet?" },
  { href: "/math", label: "How it works" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]); // close menu on navigation

  const active = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-void/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="font-display text-[17px] font-bold tracking-tight">
            Quantum<span className="text-quantum"> Bracket</span>
          </span>
        </Link>

        {/* desktop */}
        <nav className="ml-auto hidden items-center gap-1 text-sm sm:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 transition ${
                active(l.href) ? "bg-ink text-white" : "text-mute hover:bg-void2 hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* mobile toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink sm:hidden"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {/* mobile menu */}
      {open && (
        <nav className="space-y-1 border-t border-line bg-void px-3 py-2 sm:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                active(l.href) ? "bg-ink text-white" : "text-ink hover:bg-void2"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}

      <CollapseStatus />
    </header>
  );
}
