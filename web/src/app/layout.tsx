import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Nav from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const space = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space",
  display: "swap",
});

const TITLE = "Quantum Bracket — every 2026 World Cup reality at once";
const DESC =
  "All 2.1 billion possible brackets of the 2026 FIFA World Cup, held in superposition with exact probabilities — collapsing as each result comes in.";

// Update if you use a custom domain — makes the OG image URL absolute.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://world-cup-2026-quantum-bracket.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  openGraph: {
    title: TITLE, description: DESC, type: "website", url: "/", siteName: "Quantum Bracket",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Quantum Bracket" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-4 py-7 sm:py-12">{children}</main>
          <footer className="border-t border-line px-4 py-6 text-center text-xs text-faint">
            Exact bracket probabilities · strength = World-Football-Elo · goals from an
            Elo-driven Poisson model. Open source — built in public.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
