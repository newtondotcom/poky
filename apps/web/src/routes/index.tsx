import { createFileRoute } from "@tanstack/react-router";
import { UserPokes } from "@/components/user-pokes";
import { Navigation } from "@/components/navigation";
import { authClient } from "@/lib/auth-client";
import UserMenu from "@/components/user-menu";
import { LoaderZap } from "@/components/ui/loader";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="container h-screen w-screen flex flex-col items-center justify-center align-middle">
        <LoaderZap />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {!session ? <UserMenu /> : <><Navigation /><UserPokes /></>}
    </div>
  );
}
