import { afterAll, afterEach, describe, expect, test } from "bun:test";

import type { MasterProfilePayload } from "@my-better-t-app/api/master-profile";
import type { AppRouter } from "@my-better-t-app/api/routers/index";
import type { RenderResult } from "@testing-library/react";
import { JSDOM } from "jsdom";

import { createSessionQueryCache } from "../../lib/session-query-cache";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
});
const globals = {
  window: dom.window,
  document: dom.window.document,
  navigator: dom.window.navigator,
  HTMLElement: dom.window.HTMLElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  MutationObserver: dom.window.MutationObserver,
  // JSDOM has no layout/scrolling; router restoration is outside this harness.
  scrollTo: () => undefined,
  IS_REACT_ACT_ENVIRONMENT: true,
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

// Static imports cannot work here: React DOM and Query detect the browser at
// module initialization. This test intentionally loads them after the DOM.
const { act, cleanup, fireEvent, render, waitFor } = await import(
  "@testing-library/react"
);
const { notifyManager, QueryClient, QueryClientProvider, useQuery } =
  await import("@tanstack/react-query");
const {
  createMemoryHistory,
  createRootRouteWithContext,
  createRouter,
  RouterProvider,
} = await import("@tanstack/react-router");
const { createTRPCClient, httpLink } = await import("@trpc/client");
const { createTRPCOptionsProxy } = await import("@trpc/tanstack-react-query");
const { TRPCProvider } = await import("../../utils/trpc");
const { ProfileForm } = await import("./profile-form");

const INITIAL_REVISION = "11111111-1111-4111-8111-111111111111";
const SAVED_REVISION = "22222222-2222-4222-8222-222222222222";
const originalReader = Object.getOwnPropertyDescriptor(
  globalThis,
  "FileReader"
);
const clients: InstanceType<typeof QueryClient>[] = [];

class HeldFileReader {
  static pending: HeldFileReader[] = [];
  error: DOMException | null = null;
  onerror: (() => void) | null = null;
  onload: (() => void) | null = null;
  result: string | null = null;

  readAsDataURL() {
    HeldFileReader.pending.push(this);
  }

  succeed() {
    this.result = "data:image/png;base64,aGVsbG8=";
    this.onload?.();
  }

  fail() {
    this.error = new DOMException("Held image read failed");
    this.onerror?.();
  }
}

function initialPayload(): MasterProfilePayload & {
  profile: NonNullable<MasterProfilePayload["profile"]>;
} {
  return {
    locations: [],
    martialArts: [
      {
        id: "33333333-3333-4333-8333-333333333333",
        name: "Karate",
        position: 0,
      },
    ],
    media: [
      {
        createdAt: "2026-10-20T10:00:00.000Z",
        id: "logo",
        kind: "site_logo",
        url: "https://image.test/logo",
      },
      {
        createdAt: "2026-10-19T10:00:00.000Z",
        id: "old-photo",
        kind: "profile_photo",
        url: "https://image.test/old",
      },
    ],
    profile: {
      displayName: "Original master",
      homeCity: "Chennai",
      id: "profile-a",
      introduction: "Original introduction",
      revision: INITIAL_REVISION,
      yearsTeaching: 10,
    },
  };
}

interface HeldRequest {
  input: unknown;
  path: string;
  reject: (message: string) => void;
  resolve: (payload: MasterProfilePayload) => void;
}

async function setup() {
  globalThis.FileReader = HeldFileReader as unknown as typeof FileReader;
  const requests: HeldRequest[] = [];
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });
  clients.push(queryClient);
  const sessionQueries = createSessionQueryCache(queryClient);
  await sessionQueries.setIdentity("account-a");
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: "http://localhost/trpc",
        fetch: (url, options) => {
          const { promise, resolve } = Promise.withResolvers<Response>();
          requests.push({
            input: options?.body ? JSON.parse(String(options.body)) : null,
            path: new URL(String(url)).pathname.split("/").at(-1) ?? "",
            reject: (message) =>
              resolve(
                Response.json(
                  {
                    error: {
                      code: -32_009,
                      message,
                      data: { code: "CONFLICT", httpStatus: 409 },
                    },
                  },
                  { status: 409 }
                )
              ),
            resolve: (payload) =>
              resolve(Response.json({ result: { data: payload } })),
          });
          return promise;
        },
      }),
    ],
  });
  const trpc = createTRPCOptionsProxy({ client: trpcClient, queryClient });
  const queryKey = trpc.master.getProfile.queryKey();
  queryClient.setQueryData(queryKey, initialPayload());
  const registryQueryKey = trpc.directory.masters.queryKey({ page: 2 });
  const directoryProfileQueryKey = trpc.directory.masterProfile.queryKey({
    slug: "profile-a",
  });

  function Editor() {
    const profile = useQuery(trpc.master.getProfile.queryOptions());
    return profile.data ? (
      <ProfileForm accountName="Account A" payload={profile.data} />
    ) : null;
  }

  const rootRoute = createRootRouteWithContext<{
    sessionQueries: typeof sessionQueries;
  }>()({ component: Editor });
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
  await view.findByLabelText("Display name");
  return {
    ...view,
    queryClient,
    queryKey,
    registryQueryKey,
    directoryProfileQueryKey,
    requests,
    sessionQueries,
    cached: () => queryClient.getQueryData<MasterProfilePayload>(queryKey),
    request: async (path: string, count = 1) => {
      await waitFor(() =>
        expect(requests.filter((item) => item.path === path)).toHaveLength(
          count
        )
      );
      return requests
        .filter((item) => item.path === path)
        .at(-1) as HeldRequest;
    },
  };
}

function choosePhoto(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>("input[type=file]");
  if (!input) {
    throw new Error("Profile photo input is missing");
  }
  fireEvent.change(input, {
    target: {
      files: [
        new dom.window.File(["image"], "photo.png", { type: "image/png" }),
      ],
    },
  });
  const reader = HeldFileReader.pending.at(-1);
  if (!reader) {
    throw new Error("Photo selection did not start a file read");
  }
  return reader;
}

async function settle(action: () => void | Promise<void>) {
  await act(async () => {
    await action();
    // Query batches observer notifications on its scheduler. Keep the async
    // act scope open through that batch, not only the response-resolution call.
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

afterEach(() => {
  cleanup();
  for (const client of clients.splice(0)) {
    client.clear();
  }
  HeldFileReader.pending = [];
  if (originalReader) {
    Object.defineProperty(globalThis, "FileReader", originalReader);
  } else {
    Reflect.deleteProperty(globalThis, "FileReader");
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

describe("account-scoped profile photo reads", () => {
  for (const nextIdentity of ["account-b", "account-a"]) {
    for (const outcome of ["succeed", "fail"] as const) {
      test(`discards a held ${outcome} after switching to ${nextIdentity}`, async () => {
        const view = await setup();
        const reader = choosePhoto(view.container);
        await settle(async () => {
          await view.sessionQueries.setIdentity("account-b");
          if (nextIdentity === "account-a") {
            await view.sessionQueries.setIdentity("account-a");
          }
          view.queryClient.setQueryData(view.queryKey, initialPayload());
        });
        await settle(() => reader[outcome]());
        expect(view.requests).toHaveLength(0);
        expect(view.queryByRole("alert")?.textContent ?? null).toBeNull();
        expect(view.getByRole("status").textContent).toBe("Reading the image…");
        expect(view.cached()).toEqual(initialPayload());
      });
    }
  }
});

describe("profile response slice ownership", () => {
  for (const operation of ["upload", "remove"] as const) {
    for (const first of ["save", "photo"] as const) {
      test(`${operation}: ${first} response first preserves both writes and the save revision`, async () => {
        const view = await setup();
        if (operation === "upload") {
          const reader = choosePhoto(view.container);
          await settle(() => reader.succeed());
        } else {
          await clickButton(view, "Remove photo");
        }
        const photoRequest = await view.request(`media.${operation}`);
        fireEvent.change(view.getByLabelText("Display name"), {
          target: { value: "Saved master" },
        });
        await clickButton(view, "Save changes");
        const saveRequest = await view.request("master.saveProfile");
        const saved = initialPayload();
        saved.profile = {
          ...saved.profile,
          displayName: "Saved master",
          revision: SAVED_REVISION,
        };
        const photoResponse = initialPayload();
        photoResponse.media =
          operation === "upload"
            ? [
                {
                  createdAt: "2026-10-23T10:00:00.000Z",
                  id: "new-photo",
                  kind: "profile_photo",
                  url: "https://image.test/new",
                },
                {
                  createdAt: "2026-10-22T10:00:00.000Z",
                  id: "new-logo",
                  kind: "site_logo",
                  url: "https://image.test/new-logo",
                },
              ]
            : [];

        if (first === "save") {
          await settle(() => saveRequest.resolve(saved));
          await waitFor(() =>
            expect(
              view
                .getByRole("button", { name: "Save changes" })
                .hasAttribute("disabled")
            ).toBe(false)
          );
          fireEvent.change(view.getByLabelText("Display name"), {
            target: { value: "Unsaved next draft" },
          });
          await settle(() => photoRequest.resolve(photoResponse));
          expect(
            (view.getByLabelText("Display name") as HTMLInputElement).value
          ).toBe("Unsaved next draft");
        } else {
          await settle(() => photoRequest.resolve(photoResponse));
          await settle(() => saveRequest.resolve(saved));
          await waitFor(() =>
            expect(
              view
                .getByRole("button", { name: "Save changes" })
                .hasAttribute("disabled")
            ).toBe(false)
          );
        }
        await waitFor(() =>
          expect(view.cached()?.profile?.revision).toBe(SAVED_REVISION)
        );
        expect(view.cached()?.profile?.displayName).toBe("Saved master");
        expect(
          view.cached()?.media.find((item) => item.kind === "site_logo")?.id
        ).toBe("logo");
        expect(
          view.cached()?.media.find((item) => item.kind === "profile_photo")?.id
        ).toBe(operation === "upload" ? "new-photo" : undefined);
        expect(view.cached()?.media.map((item) => item.id)).toEqual(
          operation === "upload" ? ["new-photo", "logo"] : ["logo"]
        );
        const mediaKinds = view.cached()?.media.map((item) => item.kind) ?? [];
        expect(new Set(mediaKinds).size).toBe(mediaKinds.length);
        if (operation === "upload") {
          expect(view.getByRole("img").getAttribute("src")).toBe(
            "https://image.test/new"
          );
        } else {
          expect(view.queryByRole("img")).toBeNull();
        }

        fireEvent.change(view.getByLabelText("Home city"), {
          target: { value: "Next city" },
        });
        await clickButton(view, "Save changes");
        const retry = await view.request("master.saveProfile", 2);
        expect(retry.input).toMatchObject({
          revision: SAVED_REVISION,
          homeCity: "Next city",
        });
        await settle(() => retry.reject("Keep this draft"));
        expect((await view.findByRole("alert")).textContent).toBe(
          "Keep this draft"
        );
        expect(
          (view.getByLabelText("Home city") as HTMLInputElement).value
        ).toBe("Next city");
      });
    }
  }

  test("cancels an old background profile read at mutation start and another at success", async () => {
    const view = await setup();
    let firstRefresh!: Promise<void>;
    await settle(() => {
      firstRefresh = view.queryClient.refetchQueries({
        queryKey: view.queryKey,
        exact: true,
      });
    });
    const firstRead = await view.request("master.getProfile");
    fireEvent.change(view.getByLabelText("Display name"), {
      target: { value: "Saved master" },
    });
    await clickButton(view, "Save changes");
    const save = await view.request("master.saveProfile");
    await firstRefresh;

    let secondRefresh!: Promise<void>;
    await settle(() => {
      secondRefresh = view.queryClient.refetchQueries({
        queryKey: view.queryKey,
        exact: true,
      });
    });
    const secondRead = await view.request("master.getProfile", 2);
    const saved = initialPayload();
    saved.profile = {
      ...saved.profile,
      displayName: "Saved master",
      revision: SAVED_REVISION,
    };
    await settle(() => save.resolve(saved));
    await secondRefresh;
    await settle(() => {
      firstRead.resolve(initialPayload());
      secondRead.resolve(initialPayload());
    });
    expect(view.cached()?.profile?.revision).toBe(SAVED_REVISION);
    expect(
      (view.getByLabelText("Display name") as HTMLInputElement).value
    ).toBe("Saved master");
  });

  for (const operation of ["upload", "remove", "save"] as const) {
    test(`${operation} success does not recreate a removed profile cache`, async () => {
      const view = await setup();
      if (operation === "upload") {
        const reader = choosePhoto(view.container);
        await settle(() => reader.succeed());
      } else if (operation === "remove") {
        await clickButton(view, "Remove photo");
      } else {
        await clickButton(view, "Save changes");
      }
      const request = await view.request(
        operation === "save" ? "master.saveProfile" : `media.${operation}`
      );
      await settle(() => {
        view.queryClient.removeQueries({
          queryKey: view.queryKey,
          exact: true,
        });
      });
      await settle(() => request.resolve(initialPayload()));
      expect(view.cached()).toBeUndefined();
    });

    for (const outcome of ["success", "failure"] as const) {
      test(`${operation} ${outcome} is discarded across an A-B-A transition`, async () => {
        const view = await setup();
        if (operation === "upload") {
          const reader = choosePhoto(view.container);
          await settle(() => reader.succeed());
        } else if (operation === "remove") {
          await clickButton(view, "Remove photo");
        } else {
          await clickButton(view, "Save changes");
        }
        const request = await view.request(
          operation === "save" ? "master.saveProfile" : `media.${operation}`
        );
        await settle(async () => {
          await view.sessionQueries.setIdentity("account-b");
          await view.sessionQueries.setIdentity("account-a");
          view.queryClient.setQueryData(view.queryKey, initialPayload());
        });
        const stale = initialPayload();
        stale.media = [];
        stale.profile = {
          ...stale.profile,
          displayName: "Stale response",
          revision: SAVED_REVISION,
        };
        await settle(() => {
          if (outcome === "success") {
            request.resolve(stale);
          } else {
            request.reject("Stale failure");
          }
        });
        expect(view.cached()).toEqual(initialPayload());
        expect(view.queryByText("Stale failure")).toBeNull();
      });
    }
  }

  test("background refresh preserves a touched draft and its original conflict revision", async () => {
    const view = await setup();
    fireEvent.change(view.getByLabelText("Display name"), {
      target: { value: "Local draft" },
    });
    const refreshed = initialPayload();
    refreshed.profile = {
      ...refreshed.profile,
      displayName: "New remote name",
      revision: SAVED_REVISION,
    };
    await settle(() => {
      view.queryClient.setQueryData(view.queryKey, refreshed);
    });
    expect(
      (view.getByLabelText("Display name") as HTMLInputElement).value
    ).toBe("Local draft");
    await clickButton(view, "Save changes");
    const save = await view.request("master.saveProfile");
    expect(save.input).toMatchObject({
      displayName: "Local draft",
      revision: INITIAL_REVISION,
    });
    await settle(() => save.reject("Profile conflict"));
    expect((await view.findByRole("alert")).textContent).toBe(
      "Profile conflict"
    );
    expect(
      (view.getByLabelText("Display name") as HTMLInputElement).value
    ).toBe("Local draft");
  });

  test("failed photo and profile writes keep the last successful cache and editable draft", async () => {
    const view = await setup();
    const reader = choosePhoto(view.container);
    await settle(() => reader.succeed());
    const photo = await view.request("media.upload");
    fireEvent.change(view.getByLabelText("Display name"), {
      target: { value: "Unsaved master" },
    });
    await clickButton(view, "Save changes");
    const save = await view.request("master.saveProfile");
    await settle(() => save.reject("Profile conflict"));
    await settle(() => photo.reject("Photo rejected"));
    await view.findByText("Photo rejected");
    expect(view.getByText("Profile conflict")).toBeDefined();
    expect(
      (view.getByLabelText("Display name") as HTMLInputElement).value
    ).toBe("Unsaved master");
    expect(view.cached()).toEqual(initialPayload());
    expect(view.getByRole("status").textContent).toBe("");
    expect(
      view
        .getByRole("button", { name: "Save changes" })
        .hasAttribute("disabled")
    ).toBe(false);
  });
});

describe("public directory freshness", () => {
  test("successful profile save invalidates every public page variant", async () => {
    const view = await setup();
    view.queryClient.setQueryData(view.registryQueryKey, {
      locations: [],
      martialArts: [],
      masters: [],
      page: 2,
      pageSize: 6,
      total: 0,
      totalPages: 0,
    });
    view.queryClient.setQueryData(view.directoryProfileQueryKey, null);
    fireEvent.change(view.getByLabelText("Display name"), {
      target: { value: "Saved master" },
    });
    await clickButton(view, "Save changes");
    const save = await view.request("master.saveProfile");
    await settle(() => save.resolve(initialPayload()));
    await waitFor(() =>
      expect(
        view.queryClient.getQueryState(view.registryQueryKey)?.isInvalidated
      ).toBe(true)
    );
    await waitFor(() =>
      expect(
        view.queryClient.getQueryState(view.directoryProfileQueryKey)
          ?.isInvalidated
      ).toBe(true)
    );
  });

  test("successful photo upload invalidates the public profile and registry", async () => {
    const view = await setup();
    view.queryClient.setQueryData(view.directoryProfileQueryKey, null);
    view.queryClient.setQueryData(view.registryQueryKey, {
      locations: [],
      martialArts: [],
      masters: [],
      page: 2,
      pageSize: 6,
      total: 0,
      totalPages: 0,
    });
    const reader = choosePhoto(view.container);
    await settle(() => reader.succeed());
    const upload = await view.request("media.upload");
    await settle(() => upload.resolve(initialPayload()));
    await waitFor(() =>
      expect(
        view.queryClient.getQueryState(view.directoryProfileQueryKey)
          ?.isInvalidated
      ).toBe(true)
    );
    await waitFor(() =>
      expect(
        view.queryClient.getQueryState(view.registryQueryKey)?.isInvalidated
      ).toBe(true)
    );
  });

  test("successful photo removal invalidates the public profile and registry", async () => {
    const view = await setup();
    view.queryClient.setQueryData(view.directoryProfileQueryKey, null);
    view.queryClient.setQueryData(view.registryQueryKey, {
      locations: [],
      martialArts: [],
      masters: [],
      page: 2,
      pageSize: 6,
      total: 0,
      totalPages: 0,
    });
    await clickButton(view, "Remove photo");
    const remove = await view.request("media.remove");
    await settle(() => remove.resolve(initialPayload()));
    await waitFor(() =>
      expect(
        view.queryClient.getQueryState(view.directoryProfileQueryKey)
          ?.isInvalidated
      ).toBe(true)
    );
    await waitFor(() =>
      expect(
        view.queryClient.getQueryState(view.registryQueryKey)?.isInvalidated
      ).toBe(true)
    );
  });

  test("failed photo upload leaves the public profile and registry fresh", async () => {
    const view = await setup();
    view.queryClient.setQueryData(view.directoryProfileQueryKey, null);
    view.queryClient.setQueryData(view.registryQueryKey, {
      locations: [],
      martialArts: [],
      masters: [],
      page: 2,
      pageSize: 6,
      total: 0,
      totalPages: 0,
    });
    const reader = choosePhoto(view.container);
    await settle(() => reader.succeed());
    const upload = await view.request("media.upload");
    await settle(() => upload.reject("Upload failed"));
    await view.findByText("Upload failed");
    expect(
      view.queryClient.getQueryState(view.directoryProfileQueryKey)
        ?.isInvalidated
    ).toBe(false);
    expect(
      view.queryClient.getQueryState(view.registryQueryKey)?.isInvalidated
    ).toBe(false);
  });
});
