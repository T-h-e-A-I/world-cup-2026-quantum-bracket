import Bracket from "@/components/Bracket";
import ShareBar from "@/components/ShareBar";

export const metadata = { title: "Play Bracket — Quantum Bracket" };

export default function BracketPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
        Play out the <span className="grad-text">bracket</span>
      </h1>
      <Bracket />
      <div className="mt-6">
        <ShareBar text="I'm collapsing the 2026 World Cup bracket 🌌" />
      </div>
    </div>
  );
}
