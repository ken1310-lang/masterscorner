import { describe, expect, test } from "bun:test";
import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { createAuthClient } from "better-auth/client";

import { createSessionQueryCache } from "./session-query-cache";

const privateKey = [["privateData"], { type: "query" }] as const;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 60_000 } },
  });
}

describe("session query cache", () => {
  test.each(["account-b", "account-a"])(
    "a pending mutation cannot write after leaving and returning to %s",
    async (nextAccount) => {
      const queryClient = createClient();
      const sessionQueries = createSessionQueryCache(queryClient);
      await sessionQueries.setIdentity("account-a");
      const response = deferred<string>();
      const started = deferred<void>();
      const isCurrentSession = sessionQueries.captureScope();
      const mutation = new MutationObserver(queryClient, {
        mutationFn: () => {
          started.resolve();
          return response.promise;
        },
      });
      const pendingSave = mutation.mutate().then((data) => {
        if (isCurrentSession()) {
          queryClient.setQueryData(privateKey, data);
        }
      });
      await started.promise;
      await sessionQueries.setIdentity(null);
      await sessionQueries.setIdentity(nextAccount);
      queryClient.setQueryData(privateKey, "current-profile");
      response.resolve("old-profile");
      await pendingSave;
      expect(queryClient.getQueryData(privateKey)).toBe("current-profile");
      queryClient.clear();
    }
  );

  test("a settled refresh of the same account keeps an in-flight save valid", async () => {
    const queryClient = createClient();
    const sessionQueries = createSessionQueryCache(queryClient);
    await sessionQueries.setIdentity("account-a");
    const isCurrentSession = sessionQueries.captureScope();
    sessionQueries.observeSession({
      data: { user: { id: "account-a" } },
      isPending: false,
      isRefetching: false,
    });
    expect(isCurrentSession()).toBe(true);
    queryClient.clear();
  });

  test("sign-out removes fresh private data before the next account reads it", async () => {
    const queryClient = createClient();
    const sessionQueries = createSessionQueryCache(queryClient);
    await sessionQueries.setIdentity("account-a");
    await queryClient.fetchQuery({
      queryKey: privateKey,
      queryFn: () => ({ user: { id: "account-a" } }),
    });

    await sessionQueries.setIdentity(null);
    expect(queryClient.getQueryData(privateKey)).toBeUndefined();
    await sessionQueries.setIdentity("account-b");
    const result = await queryClient.fetchQuery({
      queryKey: privateKey,
      queryFn: () => ({ user: { id: "account-b" } }),
    });

    expect(result.user.id).toBe("account-b");
    queryClient.clear();
  });

  test("direct account changes discard data without requiring sign-out first", async () => {
    const queryClient = createClient();
    const sessionQueries = createSessionQueryCache(queryClient);
    await sessionQueries.setIdentity("account-a");
    queryClient.setQueryData(privateKey, { user: { id: "account-a" } });

    await sessionQueries.setIdentity("account-b");

    expect(queryClient.getQueryData(privateKey)).toBeUndefined();
    queryClient.clear();
  });

  test("a route entering during cancellation waits for the new account's cache boundary", async () => {
    const queryClient = createClient();
    const sessionQueries = createSessionQueryCache(queryClient);
    await sessionQueries.setIdentity("account-a");
    queryClient.setQueryData(privateKey, { user: { id: "account-a" } });
    const oldResponse = deferred<string>();
    const concurrentRead = deferred<string>();
    const pendingRequest = queryClient.fetchQuery({
      queryKey: ["old-account-request"],
      queryFn: ({ signal }) => {
        signal.addEventListener("abort", () => {
          // Cancellation callbacks can synchronously enter the route boundary.
          sessionQueries.setIdentity("account-b").then(async () => {
            const response = await queryClient.fetchQuery({
              queryKey: privateKey,
              queryFn: () => ({ user: { id: "account-b" } }),
            });
            concurrentRead.resolve(response.user.id);
          });
        });
        return oldResponse.promise;
      },
    });
    const cancelledRequest = pendingRequest.catch((error: unknown) => error);

    await sessionQueries.setIdentity("account-b");
    oldResponse.resolve("old-account-response");
    await cancelledRequest;

    expect(await concurrentRead.promise).toBe("account-b");
    queryClient.clear();
  });

  test("cancels transport before removing cache and does not admit a late old response", async () => {
    const queryClient = createClient();
    const sessionQueries = createSessionQueryCache(queryClient);
    await sessionQueries.setIdentity("account-a");
    const oldResponse = deferred<{ user: { id: string } }>();
    let aborted = false;
    let presentWhenAborted = false;
    const oldRequest = queryClient.fetchQuery({
      queryKey: privateKey,
      queryFn: ({ signal }) => {
        signal.addEventListener("abort", () => {
          aborted = true;
          presentWhenAborted =
            queryClient.getQueryState(privateKey) !== undefined;
        });
        return oldResponse.promise;
      },
    });
    const oldResult = oldRequest.catch((error: unknown) => error);

    await sessionQueries.setIdentity("account-b");
    expect(aborted).toBe(true);
    expect(presentWhenAborted).toBe(true);
    expect(queryClient.getQueryState(privateKey)).toBeUndefined();
    await queryClient.fetchQuery({
      queryKey: privateKey,
      queryFn: () => ({ user: { id: "account-b" } }),
    });
    oldResponse.resolve({ user: { id: "account-a" } });
    await oldResult;
    await oldResponse.promise;

    expect(queryClient.getQueryData(privateKey)).toEqual({
      user: { id: "account-b" },
    });
    queryClient.clear();
  });

  test("late responses that ignore AbortSignal cannot repopulate a signed-out cache", async () => {
    const queryClient = createClient();
    const sessionQueries = createSessionQueryCache(queryClient);
    await sessionQueries.setIdentity("account-a");
    const oldResponse = deferred<string>();
    const oldRequest = queryClient.fetchQuery({
      queryKey: privateKey,
      queryFn: () => oldResponse.promise,
    });
    const oldResult = oldRequest.catch((error: unknown) => error);

    await sessionQueries.setIdentity(null);
    oldResponse.resolve("account-a-private-payload");
    await oldResult;
    await oldResponse.promise;

    expect(queryClient.getQueryState(privateKey)).toBeUndefined();
    queryClient.clear();
  });

  test("settled Better Auth session loss and account switches clear the cache", async () => {
    const queryClient = createClient();
    const sessionQueries = createSessionQueryCache(queryClient);
    const auth = createAuthClient({ baseURL: "http://localhost:3000" });
    const store = auth.$store.atoms.session;
    if (!store) {
      throw new Error("Better Auth session atom is missing");
    }
    const initial = auth.useSession.get();
    const session = (id: string) =>
      ({
        session: {
          id: `session-${id}`,
          userId: id,
          token: "local-test-session",
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 60_000),
        },
        user: {
          id,
          name: id,
          email: `${id}@example.test`,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      }) satisfies NonNullable<typeof initial.data>;
    store.set({ ...initial, data: session("account-a"), isPending: false });
    let transition: Promise<void> | undefined;
    const unsubscribe = store.subscribe((state) => {
      transition = sessionQueries.observeSession(state) ?? transition;
    });
    queryClient.setQueryData(privateKey, { user: { id: "account-a" } });

    store.set({ ...store.get(), isRefetching: true });
    expect(queryClient.getQueryData(privateKey)).toBeDefined();
    store.set({
      ...store.get(),
      data: session("account-b"),
      isRefetching: false,
    });
    await transition;
    expect(queryClient.getQueryData(privateKey)).toBeUndefined();
    queryClient.setQueryData(privateKey, { user: { id: "account-b" } });
    store.set({ ...store.get(), data: null });
    await transition;
    expect(queryClient.getQueryData(privateKey)).toBeUndefined();

    unsubscribe();
    queryClient.clear();
  });

  test("session refreshes for the same account retain cache and do not erase newly fetched data", async () => {
    const queryClient = createClient();
    const sessionQueries = createSessionQueryCache(queryClient);
    await sessionQueries.setIdentity("account-b");
    queryClient.setQueryData(privateKey, { user: { id: "account-b" } });

    expect(
      sessionQueries.observeSession({
        data: { user: { id: "account-b" } },
        isPending: false,
        isRefetching: false,
      })
    ).toBeUndefined();
    expect(queryClient.getQueryData(privateKey)).toEqual({
      user: { id: "account-b" },
    });
    queryClient.clear();
  });

  test("query clients created for separate routers do not share identity or cache cleanup", async () => {
    const first = createClient();
    const second = createClient();
    const firstSession = createSessionQueryCache(first);
    const secondSession = createSessionQueryCache(second);
    await firstSession.setIdentity("account-a");
    await secondSession.setIdentity("account-b");
    second.setQueryData(privateKey, { user: { id: "account-b" } });

    await firstSession.setIdentity(null);

    expect(second.getQueryData(privateKey)).toEqual({
      user: { id: "account-b" },
    });
    first.clear();
    second.clear();
  });
});
