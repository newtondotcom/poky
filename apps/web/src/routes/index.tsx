import { createFileRoute } from "@tanstack/react-router";
import { UserPokes } from "@/components/user-pokes";
import { Navigation } from "@/components/navigation";
import { authClient } from "@/lib/auth-client";
import UserMenu from "@/components/user-menu";
import { LoaderZap } from "@/components/ui/loader";
import { useEffect } from 'react';
import { toast } from '@pheralb/toast';
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (session?.user) {
      const userKey = `hasLoggedIn:${session.user.id}`;
      if (!localStorage.getItem(userKey)) {
        toast.info({
          text: "Welcome! Enable notifications for the best experience.",
          action: {
            content: "Go to settings",
            onClick: () => {
              navigate({ to: "/account" });
            },
          },
        });
        localStorage.setItem(userKey, "true");
      }
    }
  }, [session, navigate]);

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
