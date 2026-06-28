import type { Metadata, Viewport } from "next";
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
  "All 2.1 billion possible brackets of the 2026 FIFA World Cup, held in superposition with exact probabilities — collapsing as each result comes in. Pick your team's odds, find when two teams can meet, and play out the bracket.";

// Update if you use a custom domain — makes canonical + OG image URLs absolute.
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://world-cup-2026-quantum-bracket.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s · Quantum Bracket" },
  description: DESC,
  applicationName: "Quantum Bracket",
  authors: [{ name: "Awesh Islam" }],
  creator: "Awesh Islam",
  category: "sports",
  keywords: [
    "2026 World Cup", "FIFA World Cup 2026", "World Cup bracket", "bracket predictor",
    "World Cup odds", "World Cup simulator", "knockout bracket", "Elo ratings",
    "championship probability", "Quantum Bracket",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE, description: DESC, type: "website", url: "/", siteName: "Quantum Bracket",
    locale: "en_US",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Quantum Bracket — every 2026 World Cup reality at once" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: ["/og.png"] },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Quantum Bracket",
  applicationCategory: "SportsApplication",
  operatingSystem: "Web",
  url: SITE,
  description: DESC,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Awesh Islam" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <Providers>
          <Nav />
          <main className="mx-auto w-full max-w-6xl flex-1 overflow-x-clip px-4 py-7 sm:py-12">{children}</main>
          <footer className="border-t border-line px-4 py-6 text-center text-xs leading-relaxed text-faint">
            <p>
              Team strength from the{" "}
              <a href="https://www.eloratings.net" target="_blank" rel="noopener noreferrer" className="underline hover:text-mute">
                World Football Elo
              </a>{" "}
              rating system; goals from an Elo-driven Poisson model. Probabilities are exact, not
              sampled. Ratings are approximate and editable — not affiliated with FIFA.
            </p>
            <p className="mt-1">
              Open source, built in public ·{" "}
              <a href="https://github.com/T-h-e-A-I/world-cup-2026-quantum-bracket" target="_blank" rel="noopener noreferrer" className="underline hover:text-mute">
                GitHub
              </a>
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
