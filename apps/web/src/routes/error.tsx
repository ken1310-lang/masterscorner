import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useCallback } from "react";

import { SkipLink } from "@/components/shell/header";

const screenClass = "grid min-h-dvh place-content-center gap-2.5 text-center";
const headingClass =
  "text-[44px] leading-[.98] tracking-[-.055em] sm:text-[clamp(42px,5.7vw,72px)]";

/**
 * Prototype `/error` copy (masterscorner.html 2853-2854), with the heading
 * scale applied (deviation D13). Retry refetches cached data and re-runs the
 * route: the boundary resets it, the standalone screen invalidates the router.
 * `refetchType: "all"` matters because the failed component is unmounted by the
 * time the button is reachable, so a default invalidation would leave its query
 * stale without refetching.
 */
export function ErrorScreenContent({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <h1 className={headingClass}>This page did not load</h1>
      <p>Please try again or return to the marketplace.</p>
      <button onClick={onRetry} type="button">
        Try again
      </button>
      <Link className="font-black text-accent-text" to="/">
        Return home
      </Link>
    </>
  );
}

function ErrorScreen() {
  const router = useRouter();
  const { queryClient } = Route.useRouteContext();
  const retry = useCallback(async () => {
    await queryClient.invalidateQueries({ refetchType: "all" });
    await router.invalidate();
  }, [queryClient, router]);

  return (
    <>
      <SkipLink />
      <main className={screenClass} id="main" tabIndex={-1}>
        <ErrorScreenContent onRetry={retry} />
      </main>
    </>
  );
}

export const Route = createFileRoute("/error")({
  component: ErrorScreen,
});
