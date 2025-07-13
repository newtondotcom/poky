import { createFileRoute } from "@tanstack/react-router";
import { UserPokes } from "@/components/user-pokes";
import { Navigation } from "@/components/navigation";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Navigation />
          <UserPokes />
        </div>
  );
}
