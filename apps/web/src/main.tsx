import React, { useContext, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { TransportProvider } from "@connectrpc/connect-query";
import { createConnectTransport } from "@connectrpc/connect-web";
import { AuthProvider } from "react-oauth2-code-pkce";
import Loader from "./components/loader";
import { toast } from "@pheralb/toast";
import { routeTree } from "./routeTree.gen";
import type { IAuthContext, TAuthConfig, TRefreshTokenExpiredEvent } from "react-oauth2-code-pkce";

// -------------------
// Auth config
// -------------------
const authConfig: TAuthConfig = {
  clientId: "t9xFI53nHMTMRduUB1Kt2fUpV1IcFOfNXUZHjpmZ",
  authorizationEndpoint: "https://myr-project.eu/application/o/authorize/",
  tokenEndpoint: "https://myr-project.eu/application/o/token/",
  redirectUri: "http://localhost:3001/",
  scope: "profile openid offline_access picture",
  onRefreshTokenExpire: (event: TRefreshTokenExpiredEvent) => console.log(event),
};

// -------------------
// React Query client
// -------------------
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      toast.error({
        text: error?.message ?? "Unknown error",
        action: {
          content: "Retry",
          onClick: () => () => queryClient.invalidateQueries(),
        },
      });
    },
  }),
});

// -------------------
// Router
// -------------------
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: () => <Loader />,
  context: { queryClient },
  Wrap: function WrapComponent({ children }: { children: React.ReactNode }) {
    // Memoize transport
    const transport = useMemo(
      () =>
        createConnectTransport({
          baseUrl: "http://localhost:8080",
          interceptors: [
            (next) => (request) => {
              const token = JSON.parse(window.localStorage.getItem("ROCP_token"))
              if (token) request.header.append("authorization", `Bearer ${token}`);
              return next(request);
            },
          ],
        }),
      [],
    );

    return (
      <AuthProvider authConfig={authConfig}>
    <TransportProvider transport={transport}>
      <QueryClientProvider client={queryClient}>
        {children}
    </QueryClientProvider>
    </TransportProvider>
    </AuthProvider>
    );
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// -------------------
// Render app
// -------------------
const rootElement = document.getElementById("app");

if (!rootElement) throw new Error("Root element not found");

const root = ReactDOM.createRoot(rootElement);
root.render(<RouterProvider router={router} />);
