import { MODEL, big } from "@/lib/model";

export const metadata = { title: "The Math — Quantum Bracket" };

function K({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded border border-line bg-void2 px-1.5 py-0.5 font-mono text-[0.85em] text-quantum">
      {children}
    </code>
  );
}

export default function MathPage() {
  return (
    <article className="prose-invert max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          The <span className="grad-text">Math</span>
        </h1>
        <p className="mt-2 text-mute">
          No simulations, no guessing. Because the Round-of-32 bracket is fixed, every probability
          on this site is computed <strong>exactly</strong>. Here’s the whole pipeline.
        </p>
      </header>

      <Section n="1" title="Team strength → Elo">
        <p>
          Each team carries a World-Football-Elo rating. The expected result of a neutral match
          between <K>i</K> and <K>j</K> follows the standard Elo curve, driven only by the rating
          gap <K>d = Eᵢ − Eⱼ</K>.
        </p>
      </Section>

      <Section n="2" title="Elo → goals (Poisson)">
        <p>
          We turn the rating gap into a goal <em>supremacy</em> and split a baseline of ~2.5 goals
          into two scoring rates <K>λᵢ, λⱼ</K>. Each side’s goals are Poisson-distributed, which
          gives us a full scoreline grid — the most-likely exact score, expected goals, and a draw
          probability. The current model: <K>{MODEL.meta.model}</K>.
        </p>
      </Section>

      <Section n="3" title="Goals → advance probability">
        <p>
          In a knockout there are no draws. We take the regulation win/draw probabilities from the
          Poisson grid and resolve a draw as a 50/50 shootout:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-line bg-void2 p-4 text-sm text-ink">
{`P(i advances) = P(i wins in 90′) + ½ · P(draw)`}
        </pre>
        <p>
          Confidence is just how decisive that is: <K>|P(advance) − 0.5| × 2</K>, shown 0–100.
        </p>
      </Section>

      <Section n="4" title="The superposition: an exact DP">
        <p>
          The 32 teams form a binary tree. We compute one table —{" "}
          <K>winsub[i][L]</K>, the probability team <K>i</K> wins the size-2<sup>L</sup> subtree it
          sits in:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-line bg-void2 p-4 text-sm text-ink">
{`winsub[i][L] = winsub[i][L-1] · Σ_j  winsub[j][L-1] · P(i beats j)`}
        </pre>
        <p>
          where <K>j</K> ranges over the sibling sub-bracket. Five levels give every number on the
          site: reach the Round of 16, the final, lift the trophy. This holds all{" "}
          <strong>{big(MODEL.meta.realities)}</strong> complete brackets at once — that’s the
          superposition.
        </p>
      </Section>

      <Section n="5" title="Collapse: conditioning on results">
        <p>
          When a real match finishes, we fix that node: the winner’s <K>winsub</K> becomes 1, the
          loser’s 0, and the DP re-runs. Every downstream probability re-weights instantly. Each
          decided match halves the space, so after <K>k</K> results only{" "}
          <K>2^(31−k)</K> realities remain. The wavefunction collapses, live.
        </p>
      </Section>

      <Section n="6" title="Where “1,024” comes from">
        <p>
          For any team there are <K>1 × 2 × 4 × 8 = 64</K> possible routes to the final, and{" "}
          <K>16</K> possible opponents waiting there — <strong>64 × 16 = 1,024</strong> distinct
          final scenarios, each with its own exact probability.
        </p>
      </Section>

      <Section n="7" title="Two teams meet exactly once">
        <p>
          A fixed bracket means any two teams share exactly one ancestor node — one round where they
          <em>can</em> collide. The chance it happens is simply{" "}
          <K>P(A reaches that round) × P(B reaches that round)</K>.
        </p>
      </Section>

      <Section n="8" title="Swappable model (Kaggle / Hugging Face)">
        <p>
          Strength and the match model live entirely in the Python layer (<K>engine/model.py</K>),
          which emits a small JSON bundle. Replace Elo with a model trained on historical results in
          a Kaggle notebook, or a Hugging Face match-outcome model — the bracket math and this whole
          UI stay identical. The ratings are editable in <K>engine/bracket.py</K>; re-run{" "}
          <K>build_data.py</K> and everything updates.
        </p>
      </Section>
    </article>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-2 flex items-center gap-3 text-lg font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-quantum/20 text-sm text-quantum ring-1 ring-quantum/40">
          {n}
        </span>
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-mute [&_strong]:text-ink">{children}</div>
    </section>
  );
}
