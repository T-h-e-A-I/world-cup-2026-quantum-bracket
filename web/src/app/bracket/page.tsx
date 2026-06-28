import Bracket from "@/components/Bracket";
import ShareBar from "@/components/ShareBar";

export const metadata = { title: "Play Bracket — Quantum Bracket" };

export default function BracketPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
        Play out the <span className="grad-text">bracket</span>
      </h1>
      <p className="mb-4 max-w-2xl text-sm text-mute">
        Tap a team to send it through and fill in your own bracket. Watch the odds and the number of
        possible brackets update with every pick.
      </p>
      <p className="mb-5 rounded-xl border border-line bg-void2 px-3.5 py-2.5 text-xs leading-relaxed text-mute">
        <span aria-hidden className="mr-1">↻</span>
        Your picks <strong className="text-ink">collapse the whole site</strong> — odds on every page
        update to match this scenario. The top bar shows how many matches are decided; hit{" "}
        <em>Reset</em> there to go back to today.
      </p>
      <Bracket />
      <div className="mt-6">
        <ShareBar text="I'm collapsing the 2026 World Cup bracket 🌌" />
      </div>
    </div>
  );
}
