import manropeLatin from "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url";
import outfitLatin from "@fontsource-variable/outfit/files/outfit-latin-wght-normal.woff2?url";
import type { AppRouter } from "@my-better-t-app/api/routers/index";
import { Toaster } from "@my-better-t-app/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  type ErrorComponentProps,
  HeadContent,
  Outlet,
  Scripts,
  useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { useCallback } from "react";

import { SkipLink } from "@/components/shell/header";
import type { SessionQueryCache } from "@/lib/session-query-cache";
import { ErrorScreenContent } from "@/routes/error";
import { NotFoundScreen } from "@/routes/not-found";

import appCss from "../index.css?url";

export interface RouterAppContext {
  queryClient: QueryClient;
  sessionQueries: SessionQueryCache;
  trpc: TRPCOptionsProxy<AppRouter>;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        name: "color-scheme",
        content: "light",
      },
      {
        name: "theme-color",
        content: "#0b132b",
      },
      {
        name: "description",
        content:
          "Discover martial-arts masters and academies, verify credentials, book training and grow an academy.",
      },
      {
        title: "MastersCorner · Martial arts network",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: outfitLatin,
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        as: "font",
        type: "font/woff2",
        href: manropeLatin,
        crossOrigin: "anonymous",
      },
    ],
  }),

  component: RootDocument,
  errorComponent: RootErrorScreen,
  notFoundComponent: () => <NotFoundScreen />,
});

/** Root boundary: the `reset` re-renders the route, then cached data refetches. */
function RootErrorScreen({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const retry = useCallback(async () => {
    reset();
    await queryClient.invalidateQueries({ refetchType: "all" });
    await router.invalidate();
  }, [queryClient, reset, router]);

  return (
    <>
      <SkipLink />
      <main
        className="grid min-h-dvh place-content-center gap-2.5 text-center"
        id="main"
        tabIndex={-1}
      >
        <ErrorScreenContent onRetry={retry} />
      </main>
    </>
  );
}

function RootDocument() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Toaster richColors />
        {import.meta.env.DEV ? (
          <>
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools
              buttonPosition="bottom-right"
              position="bottom"
            />
          </>
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}
