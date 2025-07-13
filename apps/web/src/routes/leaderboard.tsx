import { createFileRoute } from "@tanstack/react-router";
import { Leaderboard } from "@/components/leaderboard";

export const Route = createFileRoute("/leaderboard")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <Leaderboard />
    </div>
  );
}
