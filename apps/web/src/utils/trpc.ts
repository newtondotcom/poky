import { toast } from "@pheralb/toast";
import type { AppRouter } from "../../../server/src/routers";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, httpSubscriptionLink, loggerLink, retryLink, splitLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      toast.error({
        text :error.message,
        action: {
          content: "retry",
          onClick: () => {
            queryClient.invalidateQueries();
          },
        },
      });
    },
  }),
});

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    loggerLink(),
    splitLink({
      // uses the httpSubscriptionLink for subscriptions
      condition: (op) => op.type === 'subscription',
      true: [
        retryLink({
          retry: (opts) => {
            opts.op.type;
            //       ^? will always be 'subscription' since we're in a splitLink
            const code = opts.error.data?.code;
            if (!code) {
              // This shouldn't happen as our httpSubscriptionLink will automatically retry within when there's a non-parsable response
              console.error('No error code found, retrying', opts);
              return true;
            }
            if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN') {
              console.log('Retrying due to 401/403 error');
              return true;
            }
            return false;
          },
        }),
        httpSubscriptionLink({
        url: `${import.meta.env.VITE_SERVER_URL}/trpc`,
        eventSourceOptions() {
          return {
            withCredentials: true,
          };
        },
      }),
      ],
      // uses the httpBatchLink for simple fetch query
      false: httpBatchLink({
        url: `${import.meta.env.VITE_SERVER_URL}/trpc`,
        fetch(url, options) {
          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
