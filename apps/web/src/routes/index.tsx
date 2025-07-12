import { createFileRoute } from "@tanstack/react-router";
import { WebSocketProvider } from "@/components/websocket-provider";
import { UserPokes } from "@/components/user-pokes";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <WebSocketProvider>
    <div className="container mx-auto max-w-3xl px-4 py-2">
      <div className="grid gap-6">
        <section className="rounded-lg border p-4">
            <div className="flex items-center gap-2">
            </div>
        </section>
        <UserPokes />
      </div>
    </div>
    </WebSocketProvider>
  );
}
