import Bracket from "@/components/Bracket";
import ShareBar from "@/components/ShareBar";

export const metadata = { title: "Collapse the Bracket — WC26 Superposition" };

export default function BracketPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
        Collapse the <span className="grad-text">Bracket</span>
      </h1>
      <p className="mb-5 max-w-2xl text-sm text-mute">
        Right now every one of the 2.1&nbsp;billion brackets is alive at once. Play the results —
        real or imagined — and watch the wavefunction collapse.
      </p>
      <Bracket />
      <div className="mt-6">
        <ShareBar text="I'm collapsing the 2026 World Cup bracket 🌌" />
      </div>
    </div>
  );
}
