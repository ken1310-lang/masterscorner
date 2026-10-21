import type { AppRouter } from "@my-better-t-app/api/routers/index";
import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import Loader from "./components/loader";
import { ENV } from "./env.public";
import { authClient } from "./lib/auth-client";
import { createSessionQueryCache } from "./lib/session-query-cache";
import { routeTree } from "./routeTree.gen";
import { TRPCProvider } from "./utils/trpc";

function createQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        toast.error(error.message, {
          action: {
            label: "retry",
            onClick: () => {
              query.invalidate();
            },
          },
        });
      },
    }),
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  });
}

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${ENV.VITE_SERVER_URL.replace(/\/$/, "")}/trpc`,
      fetch(url, options) {
        return globalThis.fetch(url, {
          ...options,
          credentials: "include",
        });
      },
    }),
  ],
});

export const getRouter = () => {
  const queryClient = createQueryClient();
  const sessionQueries = createSessionQueryCache(queryClient);
  const trpc = createTRPCOptionsProxy({
    client: trpcClient,
    queryClient,
  });

  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    context: { trpc, queryClient, sessionQueries },
    defaultPendingComponent: () => <Loader />,
    defaultNotFoundComponent: () => <div>Not Found</div>,
    Wrap: ({ children }) => {
      useEffect(
        () =>
          authClient.$store.atoms.session?.subscribe((session) => {
            const cleanup = sessionQueries.observeSession(session);
            if (cleanup) {
              cleanup.then(() => router.invalidate());
            }
          }),
        []
      );

      return (
        <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
          {children}
        </TRPCProvider>
      );
    },
  });

  setupRouterSsrQueryIntegration({
    router,
    queryClient,
  });

  return router;
};

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
