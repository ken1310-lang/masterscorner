import { afterAll, afterEach, describe, expect, test } from "bun:test";

import type {
  ClassesPayload,
  MasterClassView,
} from "@my-better-t-app/api/classes";
import type { AppRouter } from "@my-better-t-app/api/routers/index";
import type { RenderResult } from "@testing-library/react";
import { JSDOM } from "jsdom";

import { createSessionQueryCache } from "../../lib/session-query-cache";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
const globals = {
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  MutationObserver: dom.window.MutationObserver,
  navigator: dom.window.navigator,
  // JSDOM has no layout/scrolling; router restoration is outside this test.
  scrollTo: () => undefined,
  window: dom.window,
};
const originalGlobals = new Map(
  Object.keys(globals).map((key): [string, PropertyDescriptor | undefined] => [
    key,
    Object.getOwnPropertyDescriptor(globalThis, key),
  ])
);
for (const [key, value] of Object.entries(globals)) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value,
    writable: true,
  });
}

// React DOM and Query detect the browser at module initialization. Load them
// only after the JSDOM globals exist.
const { act, cleanup, fireEvent, render, waitFor } = await import(
  "@testing-library/react"
);
const { notifyManager, QueryClient, QueryClientProvider } = await import(
  "@tanstack/react-query"
);
const {
  createMemoryHistory,
  createRootRouteWithContext,
  createRouter,
  RouterProvider,
} = await import("@tanstack/react-router");
const { createTRPCClient, httpLink } = await import("@trpc/client");
const { createTRPCOptionsProxy } = await import("@trpc/tanstack-react-query");
const { TRPCProvider } = await import("../../utils/trpc");
const { ClassesScreen } = await import("./classes-screen");

const MARTIAL_ART = {
  id: "33333333-3333-4333-8333-333333333333",
  name: "Kalari",
};
const LOCATION = {
  id: "44444444-4444-4444-8444-444444444444",
  name: "Adyar",
};
const clients: InstanceType<typeof QueryClient>[] = [];

function emptyPayload(): ClassesPayload {
  return {
    classes: [],
    locations: [LOCATION],
    martialArts: [MARTIAL_ART],
  };
}

function savedClass(): MasterClassView {
  return {
    audience: "all",
    feeAmount: null,
    feePeriod: null,
    id: "22222222-2222-4222-8222-222222222222",
    level: "all",
    location: LOCATION,
    martialArt: MARTIAL_ART,
    name: "First class",
    pausedFromStatus: null,
    schedules: [
      {
        dayOfWeek: 1,
        endTime: "19:00:00",
        id: "schedule-1",
        startTime: "18:00:00",
      },
    ],
    status: "active",
  };
}

async function setup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  clients.push(queryClient);
  const sessionQueries = createSessionQueryCache(queryClient);
  await sessionQueries.setIdentity("account-a");

  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      httpLink({
        fetch: (url) => {
          const path = new URL(String(url)).pathname.split("/").at(-1);
          if (path === "classes.list") {
            return Promise.resolve(
              Response.json({ result: { data: emptyPayload() } })
            );
          }
          if (path === "classes.save") {
            return Promise.resolve(
              Response.json({ result: { data: savedClass() } })
            );
          }
          return Promise.resolve(
            Response.json(
              { error: { code: -32_000, message: "Unexpected test request" } },
              { status: 500 }
            )
          );
        },
        url: "http://localhost/trpc",
      }),
    ],
  });
  const trpc = createTRPCOptionsProxy({ client: trpcClient, queryClient });
  queryClient.setQueryData(trpc.classes.list.queryKey(), emptyPayload());
  const proSiteKey = trpc.proSite.bySlug.queryKey({ slug: "profile-a" });
  const proSitePreviewKey = trpc.proSite.preview.queryKey();
  const proSiteStatusKey = trpc.proSite.status.queryKey();
  queryClient.setQueryData(proSiteKey, null);
  queryClient.setQueryData(proSitePreviewKey, null);
  queryClient.setQueryData(proSiteStatusKey, null);

  const rootRoute = createRootRouteWithContext<{
    sessionQueries: typeof sessionQueries;
  }>()({ component: ClassesScreen });
  const router = createRouter({
    context: { sessionQueries },
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: rootRoute,
  });
  await router.load();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        <RouterProvider router={router} />
      </TRPCProvider>
    </QueryClientProvider>
  );
  await view.findByRole("button", { name: "Create your first class" });
  return {
    ...view,
    proSiteKey,
    proSitePreviewKey,
    proSiteStatusKey,
    queryClient,
  };
}

async function settle(action: () => void | Promise<void>) {
  await act(async () => {
    await action();
    const { promise, resolve } = Promise.withResolvers<void>();
    notifyManager.schedule(resolve);
    await promise;
  });
}

async function clickButton(
  view: Pick<RenderResult, "getByRole">,
  name: string
) {
  await settle(() => {
    fireEvent.click(view.getByRole("button", { name }));
  });
}

function expectHeaderFocus(view: Pick<RenderResult, "getByRole">) {
  return waitFor(() =>
    expect(document.activeElement).toBe(
      view.getByRole("button", { name: "New class" })
    )
  );
}

afterEach(() => {
  cleanup();
  for (const client of clients.splice(0)) {
    client.clear();
  }
});

afterAll(() => {
  dom.window.close();
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
    } else {
      Reflect.deleteProperty(globalThis, key);
    }
  }
});

describe("class editor focus restoration", () => {
  test("focuses the persistent New class action after saving the first class", async () => {
    const view = await setup();

    await settle(() => {
      fireEvent.click(
        view.getByRole("button", { name: "Create your first class" })
      );
    });
    await view.findByLabelText("Class name");
    fireEvent.change(view.getByLabelText("Class name"), {
      target: { value: "First class" },
    });
    fireEvent.change(view.getByLabelText("Start time for schedule 1"), {
      target: { value: "18:00" },
    });
    fireEvent.change(view.getByLabelText("End time for schedule 1"), {
      target: { value: "19:00" },
    });
    await clickButton(view, "Create class");

    await expectHeaderFocus(view);
    await waitFor(() =>
      expect(
        view.queryClient.getQueryState(view.proSiteKey)?.isInvalidated
      ).toBe(true)
    );
    await waitFor(() =>
      expect(
        view.queryClient.getQueryState(view.proSitePreviewKey)?.isInvalidated
      ).toBe(true)
    );
    await waitFor(() =>
      expect(
        view.queryClient.getQueryState(view.proSiteStatusKey)?.isInvalidated
      ).toBe(true)
    );
  });

  test("focuses a mounted control after cancelling from the empty state", async () => {
    const view = await setup();

    await settle(() => {
      fireEvent.click(
        view.getByRole("button", { name: "Create your first class" })
      );
    });
    await settle(() => {
      fireEvent.click(view.getAllByRole("button", { name: "Cancel" })[0]);
    });

    await expectHeaderFocus(view);
  });
});
