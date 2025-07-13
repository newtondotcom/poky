import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { UserPokes } from "@/components/user-pokes";
import { UserSearch } from "@/components/user-search";
import { Leaderboard } from "@/components/leaderboard";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: session, isPending } = authClient.useSession();

  const navigate = Route.useNavigate();

  const privateData = useQuery(trpc.privateData.queryOptions());

  useEffect(() => {
    if (!session && !isPending) {
      navigate({
        to: "/",
      });
    }
  }, [session, isPending]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {session?.user.name}!</h1>
        <p className="text-muted-foreground">Manage your pokes and see the leaderboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
        <UserSearch />
          <UserPokes />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}
