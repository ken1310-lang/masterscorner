import { afterAll, describe, expect, test } from "bun:test";
import { createDb } from "@my-better-t-app/db";
import { user } from "@my-better-t-app/db/schema/auth";
import { media } from "@my-better-t-app/db/schema/master";
import { eq } from "drizzle-orm";
import type { MediaImageType, MediaRateLimit, MediaStorage } from "../media";
import { MediaStorageError } from "../media";

import { appRouter } from "./index";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
).toString("base64");
const OBJECT_KEY = /^masters\/[0-9a-f-]+\/[0-9a-f-]+\.png$/;

function makeStorage() {
  const puts: { contentType: MediaImageType; key: string }[] = [];
  const deletes: string[] = [];
  const storage: MediaStorage = {
    deleteObject: (key) => {
      deletes.push(key);
      return Promise.resolve();
    },
    publicUrl: (key) => `https://cdn.example/media/${key}`,
    putObject: (key, _body, contentType) => {
      puts.push({ contentType, key });
      return Promise.resolve();
    },
  };
  return { deletes, puts, storage };
}

const allowAll: MediaRateLimit = {
  limit: async () => ({ success: true }),
};

/**
 * Live database round trip for the media procedures, with storage replaced by
 * a recorder. It runs only when a development `DATABASE_URL` is supplied and
 * removes its account afterwards.
 */
describeDb("media procedures database round trip", () => {
  const db = createDb({ DATABASE_URL: databaseUrl ?? "" });
  const userId = `media-${crypto.randomUUID()}`;
  const email = `${userId}@example.com`;
  const { deletes, puts, storage } = makeStorage();
  const caller = appRouter.createCaller({
    db,
    mediaRateLimit: allowAll,
    mediaStorage: storage,
    session: {
      session: { id: `media-session-${userId}` },
      user: {
        accountType: "master",
        email,
        id: userId,
        name: "Media Round Trip",
      },
    } as never,
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, userId));
  });

  test("requires a profile before the first upload", async () => {
    await db
      .insert(user)
      .values({ email, id: userId, name: "Media Round Trip" });
    await expect(
      caller.media.upload({
        contentType: "image/png",
        data: PNG,
        kind: "profile_photo",
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(puts).toHaveLength(0);

    await caller.master.saveProfile({
      displayName: "Media Round Trip",
      homeCity: null,
      introduction: null,
      locations: [],
      martialArts: [{ name: "Silambam" }],
      revision: null,
      yearsTeaching: null,
    });
  });

  test("uploads, replaces and removes the current photo", async () => {
    const first = await caller.media.upload({
      contentType: "image/png",
      data: PNG,
      kind: "profile_photo",
    });
    expect(first.media).toHaveLength(1);
    expect(first.media[0]?.url).toBe(
      `https://cdn.example/media/${puts[0]?.key ?? ""}`
    );
    expect(puts[0]?.contentType).toBe("image/png");
    expect(puts[0]?.key).toMatch(OBJECT_KEY);

    const rows = await db
      .select()
      .from(media)
      .where(eq(media.profileId, first.profile?.id ?? ""));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.byteSize).toBe(Buffer.from(PNG, "base64").byteLength);

    const firstKey = puts[0]?.key ?? "";
    const second = await caller.media.upload({
      contentType: "image/png",
      data: PNG,
      kind: "profile_photo",
    });
    const secondKey = puts[1]?.key ?? "";
    expect(secondKey).not.toBe(firstKey);
    expect(second.media[0]?.url).toContain(secondKey);
    expect(deletes).toContain(firstKey);

    const afterReplace = await db
      .select()
      .from(media)
      .where(eq(media.profileId, second.profile?.id ?? ""));
    expect(afterReplace).toHaveLength(1);

    const reloaded = await caller.master.getProfile();
    const [secondPhoto] = second.media;
    if (!secondPhoto) {
      throw new Error("The replacement upload returned no photo");
    }
    expect(reloaded.media.map((row) => row.url)).toEqual([secondPhoto.url]);

    const removed = await caller.media.remove({ kind: "profile_photo" });
    expect(removed.media).toEqual([]);
    expect(deletes).toContain(secondKey);
    expect(removed.profile?.revision).toBe(second.profile?.revision);

    await expect(
      caller.media.remove({ kind: "profile_photo" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("rejects bytes that do not match the declared type before storage", async () => {
    const before = puts.length;
    await expect(
      caller.media.upload({
        contentType: "image/jpeg",
        data: PNG,
        kind: "profile_photo",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(puts).toHaveLength(before);
  });

  test("refuses uploads once the rate limit says no", async () => {
    const refused = appRouter.createCaller({
      db,
      mediaRateLimit: { limit: async () => ({ success: false }) },
      mediaStorage: storage,
      session: {
        session: { id: `media-session-${userId}` },
        user: {
          accountType: "master",
          email,
          id: userId,
          name: "Media Round Trip",
        },
      } as never,
    });
    await expect(
      refused.media.upload({
        contentType: "image/png",
        data: PNG,
        kind: "profile_photo",
      })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });

  test("maps a storage failure to SERVICE_UNAVAILABLE", async () => {
    const failing = appRouter.createCaller({
      db,
      mediaRateLimit: allowAll,
      mediaStorage: {
        deleteObject: () => Promise.resolve(),
        publicUrl: (key) => `https://cdn.example/media/${key}`,
        putObject: () =>
          Promise.reject(
            new MediaStorageError("Object storage is unreachable", 503)
          ),
      },
      session: {
        session: { id: `media-session-${userId}` },
        user: {
          accountType: "master",
          email,
          id: userId,
          name: "Media Round Trip",
        },
      } as never,
    });

    await expect(
      failing.media.upload({
        contentType: "image/png",
        data: PNG,
        kind: "profile_photo",
      })
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE" });
    expect((await caller.master.getProfile()).media).toEqual([]);
  });

  test("serializes concurrent replacements into one row and one object", async () => {
    await caller.media.remove({ kind: "profile_photo" }).catch(() => undefined);
    const putsBefore = puts.length;
    const deletesBefore = deletes.length;
    const profileId = (await caller.master.getProfile()).profile?.id;
    if (!profileId) {
      throw new Error("The media test account has no profile");
    }

    // Force both uploads to finish writing their objects before either batch
    // starts. Without serialization, both would read the same previous row.
    const bothArrived = Promise.withResolvers<void>();
    let arrivals = 0;
    const concurrentStorage: MediaStorage = {
      deleteObject: (key) => {
        deletes.push(key);
        return Promise.resolve();
      },
      publicUrl: (key) => `https://cdn.example/media/${key}`,
      putObject: async (key, _body, contentType) => {
        puts.push({ contentType, key });
        arrivals += 1;
        if (arrivals === 2) {
          bothArrived.resolve();
        }
        await bothArrived.promise;
      },
    };
    const concurrentCaller = appRouter.createCaller({
      db,
      mediaRateLimit: allowAll,
      mediaStorage: concurrentStorage,
      session: {
        session: { id: `media-session-${userId}` },
        user: {
          accountType: "master",
          email,
          id: userId,
          name: "Media Round Trip",
        },
      } as never,
    });

    await Promise.all([
      concurrentCaller.media.upload({
        contentType: "image/png",
        data: PNG,
        kind: "profile_photo",
      }),
      concurrentCaller.media.upload({
        contentType: "image/png",
        data: PNG,
        kind: "profile_photo",
      }),
    ]);

    const newKeys = puts.slice(putsBefore).map((row) => row.key);
    expect(newKeys).toHaveLength(2);
    const rows = await db
      .select({ objectKey: media.objectKey })
      .from(media)
      .where(eq(media.profileId, profileId));
    expect(rows).toHaveLength(1);
    const currentKey = rows[0]?.objectKey;
    if (!currentKey) {
      throw new Error("The concurrent uploads left no current object");
    }
    expect(newKeys).toContain(currentKey);
    const replacedKey = newKeys.find((key) => key !== currentKey);
    if (!replacedKey) {
      throw new Error("The losing upload's object key was not recorded");
    }
    expect(deletes.slice(deletesBefore)).toContain(replacedKey);

    const reloaded = await caller.master.getProfile();
    expect(reloaded.media).toHaveLength(1);
    expect(reloaded.media[0]?.url).toContain(currentKey);
  });

  test("does not expose or remove another master's media", async () => {
    const ownerId = `media-owner-${crypto.randomUUID()}`;
    const intruderId = `media-intruder-${crypto.randomUUID()}`;
    const ownerEmail = `${ownerId}@example.com`;
    const intruderEmail = `${intruderId}@example.com`;
    await db.insert(user).values([
      { email: ownerEmail, id: ownerId, name: "Media Owner" },
      { email: intruderEmail, id: intruderId, name: "Media Intruder" },
    ]);
    const callerFor = (id: string, accountEmail: string) =>
      appRouter.createCaller({
        db,
        mediaRateLimit: allowAll,
        mediaStorage: storage,
        session: {
          session: { id: `media-session-${id}` },
          user: {
            accountType: "master",
            email: accountEmail,
            id,
            name: id,
          },
        } as never,
      });

    try {
      const owner = callerFor(ownerId, ownerEmail);
      const intruder = callerFor(intruderId, intruderEmail);
      await owner.master.saveProfile({
        displayName: "Media Owner",
        homeCity: null,
        introduction: null,
        locations: [],
        martialArts: [{ name: "Silambam" }],
        revision: null,
        yearsTeaching: null,
      });
      await intruder.master.saveProfile({
        displayName: "Media Intruder",
        homeCity: null,
        introduction: null,
        locations: [],
        martialArts: [{ name: "Karate" }],
        revision: null,
        yearsTeaching: null,
      });

      const uploaded = await owner.media.upload({
        contentType: "image/png",
        data: PNG,
        kind: "profile_photo",
      });
      expect(uploaded.media).toHaveLength(1);
      expect(
        (
          await intruder.media.upload({
            contentType: "image/png",
            data: PNG,
            kind: "profile_photo",
          })
        ).media
      ).toHaveLength(1);

      const removed = await intruder.media.remove({ kind: "profile_photo" });
      expect(removed.media).toEqual([]);
      expect((await intruder.master.getProfile()).media).toEqual([]);
      expect((await owner.master.getProfile()).media).toEqual(uploaded.media);
    } finally {
      await db.delete(user).where(eq(user.id, ownerId));
      await db.delete(user).where(eq(user.id, intruderId));
    }
  });
});
