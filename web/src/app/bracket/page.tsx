import Bracket from "@/components/Bracket";

export const metadata = { title: "Play Bracket" };

export default function BracketPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
        Play out the <span className="grad-text">bracket</span>
      </h1>
      <Bracket />
    </div>
  );
}
