import { createFileRoute } from "@tanstack/react-router";
import { WebSocketProvider } from "@/components/websocket-provider";
import { UserPokes } from "@/components/user-pokes";
import { UserSearch } from "@/components/user-search";
import ShapeHero from "@/components/kokonutui/shape-hero";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <WebSocketProvider>
      <ShapeHero>
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <UserSearch />
          <UserPokes />
        </div>
      </ShapeHero>
    </WebSocketProvider>
  );
}
