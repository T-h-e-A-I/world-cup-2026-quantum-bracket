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
      <p className="mb-5 inline-flex items-center gap-2 rounded-lg border border-line bg-void2 px-3 py-2 text-xs text-mute">
        <span aria-hidden>💡</span>
        This is your personal <strong className="text-ink">what-if</strong> bracket. It’s just for
        fun — it never changes the real odds on the other pages. Hit <em>Reset</em> anytime.
      </p>
      <Bracket />
      <div className="mt-6">
        <ShareBar text="I'm collapsing the 2026 World Cup bracket 🌌" />
      </div>
    </div>
  );
}
