import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import DynamicText from "./kokonutui/dynamic-text";

export default function UserMenu() {
  const { data: session, isPending } = authClient.useSession();


  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  const onSignInChurros = () => {
    authClient.signIn.oauth2({
      providerId: "churros"
    });
  };

  const onSignInUnAuth = () => {
    authClient.signIn.oauth2({
      providerId: "churros"
    });
  };

  if (!session) {
    return (
  <>
  < DynamicText />
  <div className="flex flex-col px-8 gap-2 max-w-md bg-black/20 backdrop-blur-sm border border-white/50 rounded-lg shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] p-2 text-white relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none">
        <h2 className="text-xl font-semibold text-white/90">Authentification</h2>
  <button
      onClick={onSignInChurros}
      className="inline-flex items-center justify-center align-middle select-none font-sans text-center px-4 py-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 transition-all duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none antialiased">
            <img
              src="https://git.inpt.fr/inp-net/visual-identity/-/raw/main/derivations/auth.svg"
              alt="INP-net"
              className="h-5 w-5 mr-2"
            />
            with INP-net
    </button>
    <button
    onClick={onSignInUnAuth}
    className="inline-flex items-center justify-center align-middle select-none font-sans text-center p-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none transition antialiased">
          with UnAuth
    </button>
  </div>
  </>
    );
  }
}
