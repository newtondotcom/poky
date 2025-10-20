import { createFileRoute } from "@tanstack/react-router";
import { UserPokes } from "@/components/user-pokes";
import { Navigation } from "@/components/navigation";
import UserMenu from "@/components/user-menu";
import { LoaderZap } from "@/components/ui/loader";
import { useContext, useEffect } from 'react';
import { toast } from '@pheralb/toast';
import { useNavigate } from "@tanstack/react-router";
import { AuthContext, type IAuthContext } from "react-oauth2-code-pkce";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const { tokenData, token}: IAuthContext = useContext(AuthContext)
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      const userKey = `hasLoggedIn:${tokenData?.sub}`;
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
  }, [token, navigate]);

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {!token ? <UserMenu /> : <><Navigation /><UserPokes /></>}
    </div>
  );
}
