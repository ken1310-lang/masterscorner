import type { QueryClient } from "@tanstack/react-query";

interface SessionState {
  data: { user: { id: string } } | null;
  isPending: boolean;
  isRefetching: boolean;
}

export interface SessionQueryCache {
  observeSession: (session: SessionState) => Promise<void> | undefined;
  setIdentity: (nextUserId: string | null) => Promise<void>;
}

/** One identity boundary per router, never shared between SSR requests. */
export function createSessionQueryCache(
  queryClient: QueryClient
): SessionQueryCache {
  let userId: string | null | undefined;
  let cleanup = Promise.resolve();

  function setIdentity(nextUserId: string | null): Promise<void> {
    if (userId === nextUserId) {
      return cleanup;
    }
    userId = nextUserId;

    // Cancellation must precede removal, including fetchers that ignore abort.
    const cancelled = queryClient.cancelQueries();
    cleanup = Promise.all([cleanup, cancelled]).then(() => {
      queryClient.clear();
    });
    return cleanup;
  }

  function observeSession(session: SessionState): Promise<void> | undefined {
    // A background refresh still carries the previous, not-yet-validated user.
    if (session.isPending || session.isRefetching) {
      return;
    }
    const nextUserId = session.data?.user.id ?? null;
    if (userId === undefined) {
      userId = nextUserId;
      return;
    }
    if (userId !== nextUserId) {
      return setIdentity(nextUserId);
    }
  }

  return { setIdentity, observeSession };
}
