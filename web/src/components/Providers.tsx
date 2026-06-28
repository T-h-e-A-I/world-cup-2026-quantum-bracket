"use client";
import { TournamentProvider } from "@/lib/store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <TournamentProvider>{children}</TournamentProvider>;
}
