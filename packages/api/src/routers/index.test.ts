import { describe, expect, test } from "bun:test";
import { appRouter } from "./index";

/**
 * The contract gate: `healthCheck` is public, `privateData` is not, and a
 * signed-in caller gets their own record. Nothing here touches the database —
 * the procedures under test read the session only — so the caller passes a
 * stub, and the runner itself is what the gate proves works.
 */
const session = {
  session: { id: "session_1" },
  user: {
    id: "user_1",
    email: "master@example.com",
    accountType: "master",
  },
};

const anonymous = appRouter.createCaller({
  db: {} as never,
  session: null,
});

const signedIn = appRouter.createCaller({
  db: {} as never,
  session: session as never,
});

describe("appRouter", () => {
  test("healthCheck answers an anonymous caller", async () => {
    await expect(anonymous.healthCheck()).resolves.toBe("OK");
  });

  test("privateData refuses an anonymous caller", async () => {
    await expect(anonymous.privateData()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  test("privateData answers a signed-in caller with their own record", async () => {
    await expect(signedIn.privateData()).resolves.toMatchObject({
      message: "This is private",
      user: session.user,
    });
  });
});
