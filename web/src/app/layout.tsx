import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";

const TITLE = "Quantum Bracket — every 2026 World Cup reality at once";
const DESC =
  "All 2.1 billion possible brackets of the 2026 FIFA World Cup, held in superposition with exact probabilities — collapsing as each result comes in.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">{children}</main>
          <footer className="border-t border-line/80 px-4 py-6 text-center text-xs text-faint">
            Exact bracket probabilities · strength = World-Football-Elo · goals from an
            Elo-driven Poisson model. Open source — built in public.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
