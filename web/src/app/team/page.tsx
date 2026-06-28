import TeamView from "@/components/TeamView";

export const metadata = {
  title: "My Team’s Odds",
  description:
    "Pick any of the 32 teams and see their exact odds to reach each round, all 16 possible final opponents, and the most likely brackets where they win the 2026 World Cup.",
};

export default function TeamPage() {
  return <TeamView initialId={24} />; // Argentina by default
}
