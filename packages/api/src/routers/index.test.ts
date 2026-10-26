import { describe, expect, test } from "bun:test";
import type { Session } from "@my-better-t-app/auth";
import type { AccountType } from "@my-better-t-app/db/schema/auth";

import type { MediaRateLimit, MediaStorage } from "../media";
import { appRouter } from "./index";

const mediaStorage: MediaStorage = {
  deleteObject: async () => undefined,
  publicUrl: (key) => `https://cdn.example/media/${key}`,
  putObject: async () => undefined,
};
const mediaRateLimit: MediaRateLimit = {
  limit: async () => ({ success: true }),
};
const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/** Compile-time equality: fails the typecheck if the session loses the field. */
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

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
  mediaRateLimit,
  mediaStorage,
  session: null,
});

const signedIn = appRouter.createCaller({
  db: {} as never,
  mediaRateLimit,
  mediaStorage,
  session: session as never,
});

const profileInput = {
  revision: null,
  displayName: "Master Arun Vel",
  homeCity: "Chennai",
  introduction: null,
  locations: [],
  martialArts: [{ name: "Silambam" }],
  yearsTeaching: null,
};

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
      user: {
        id: "user_1",
        email: "master@example.com",
        accountType: "master",
      },
    });
  });

  test("master profile procedures refuse an anonymous caller", async () => {
    await expect(anonymous.master.getProfile()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      anonymous.master.saveProfile(profileInput)
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("media procedures refuse an anonymous caller", async () => {
    await expect(
      anonymous.media.upload({
        contentType: "image/png",
        data: PNG,
        kind: "profile_photo",
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(
      anonymous.media.remove({ kind: "profile_photo" })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  test("upload rejects bad bytes before touching the database", async () => {
    await expect(
      signedIn.media.upload({
        contentType: "image/png",
        data: "not*base64",
        kind: "profile_photo",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      signedIn.media.upload({
        contentType: "image/jpeg",
        data: PNG,
        kind: "profile_photo",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("saveProfile rejects invalid input before touching the database", async () => {
    await expect(
      signedIn.master.saveProfile({ ...profileInput, displayName: "  " })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("the session type carries the account type", () => {
    const accountTypeIsMaster: Equal<
      Session["user"]["accountType"],
      AccountType
    > = true;
    expect(accountTypeIsMaster).toBe(true);
  });
});
