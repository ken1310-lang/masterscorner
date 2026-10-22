import { afterAll, describe, expect, test } from "bun:test";
import type { Database } from "@my-better-t-app/db";
import { createDb } from "@my-better-t-app/db";
import { user } from "@my-better-t-app/db/schema/auth";
import { masterProfile } from "@my-better-t-app/db/schema/master";
import { eq } from "drizzle-orm";

import { appRouter } from "./index";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

/**
 * A real database round trip for the profile procedures. It runs only when a
 * development `DATABASE_URL` is supplied, uses a unique account and removes it
 * afterwards. The hermetic suite skips it, so `bun run gates` stays offline.
 */
describeDb("master profile database round trip", () => {
  const db = createDb({ DATABASE_URL: databaseUrl ?? "" });
  const userId = `round-trip-${crypto.randomUUID()}`;
  const email = `${userId}@example.com`;
  const callerFor = (database: Database, id = userId, userEmail = email) =>
    appRouter.createCaller({
      db: database,
      session: {
        session: { id: `round-trip-session-${id}` },
        user: {
          accountType: "master",
          email: userEmail,
          id,
          name: "Round Trip",
        },
      } as never,
    });

  const caller = callerFor(db);

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, userId));
  });

  test("saves, reloads, reorders and rejects a stale revision", async () => {
    await db.insert(user).values({ email, id: userId, name: "Round Trip" });

    const empty = await caller.master.getProfile();
    expect(empty.profile).toBeNull();

    const first = await caller.master.saveProfile({
      displayName: "Round Trip Master",
      homeCity: "Chennai",
      introduction: "Persisted through the router.",
      locations: [{ name: "Nanganallur" }, { name: "Madipakkam" }],
      martialArts: [{ name: "Silambam" }, { name: "Karate" }],
      revision: null,
      yearsTeaching: 10,
    });

    expect(first.profile?.revision).toBeString();
    expect(first.martialArts.map((row) => row.name)).toEqual([
      "Silambam",
      "Karate",
    ]);
    expect(first.locations.map((row) => row.name)).toEqual([
      "Nanganallur",
      "Madipakkam",
    ]);
    expect(first.martialArts.map((row) => row.position)).toEqual([0, 1]);
    expect(first.locations.map((row) => row.position)).toEqual([0, 1]);

    const karate = first.martialArts.find((row) => row.name === "Karate");
    const silambam = first.martialArts.find((row) => row.name === "Silambam");
    const madipakkam = first.locations.find((row) => row.name === "Madipakkam");
    const nanganallur = first.locations.find(
      (row) => row.name === "Nanganallur"
    );
    if (!(karate && silambam && madipakkam && nanganallur)) {
      throw new Error("The first save did not return every child row");
    }

    const second = await caller.master.saveProfile({
      displayName: "Round Trip Master Two",
      homeCity: "Chennai",
      introduction: "Persisted through the router.",
      locations: [
        { id: madipakkam.id, name: "Madipakkam" },
        { id: nanganallur.id, name: "Nanganallur" },
      ],
      martialArts: [
        { id: karate.id, name: "Karate" },
        { id: silambam.id, name: "Silambam" },
      ],
      revision: first.profile?.revision ?? null,
      yearsTeaching: 11,
    });

    expect(second.martialArts).toEqual([
      { id: karate.id, name: "Karate", position: 0 },
      { id: silambam.id, name: "Silambam", position: 1 },
    ]);
    expect(second.locations).toEqual([
      { id: madipakkam.id, name: "Madipakkam", position: 0 },
      { id: nanganallur.id, name: "Nanganallur", position: 1 },
    ]);

    const reloaded = await callerFor(db).master.getProfile();
    expect(reloaded.profile?.displayName).toBe("Round Trip Master Two");
    expect(reloaded.profile?.yearsTeaching).toBe(11);
    expect(reloaded.martialArts.map((row) => row.id)).toEqual([
      karate.id,
      silambam.id,
    ]);

    await expect(
      caller.master.saveProfile({
        displayName: "Stale Write",
        homeCity: "Chennai",
        introduction: null,
        locations: [],
        martialArts: [{ name: "Boxing" }],
        revision: first.profile?.revision ?? null,
        yearsTeaching: null,
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const afterStale = await caller.master.getProfile();
    expect(afterStale.profile?.displayName).toBe("Round Trip Master Two");
    expect(afterStale.martialArts.map((row) => row.name)).toEqual([
      "Karate",
      "Silambam",
    ]);
  });

  test("lets only one of two saves with the same revision commit", async () => {
    const current = await caller.master.getProfile();
    const [keptArt] = current.martialArts;
    if (!keptArt) {
      throw new Error("The round trip has no art to rename");
    }
    const base = {
      homeCity: "Chennai",
      introduction: null,
      locations: [],
      revision: current.profile?.revision ?? null,
      yearsTeaching: null,
    };
    const names = {
      "Concurrent A": "Art A",
      "Concurrent B": "Art B",
    } as const;

    // Both saves keep the same existing id and rename it differently. If the
    // child update were not revision-scoped, the loser would overwrite the
    // winner's name without tripping the unique position/name indexes.
    const results = await Promise.allSettled([
      caller.master.saveProfile({
        ...base,
        displayName: "Concurrent A",
        martialArts: [{ id: keptArt.id, name: names["Concurrent A"] }],
      }),
      caller.master.saveProfile({
        ...base,
        displayName: "Concurrent B",
        martialArts: [{ id: keptArt.id, name: names["Concurrent B"] }],
      }),
    ]);
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toMatchObject({ code: "CONFLICT" });

    const [winner] = fulfilled;
    if (winner?.status !== "fulfilled") {
      throw new Error("The race did not produce a winner");
    }
    const winningName =
      winner.value.profile?.displayName === "Concurrent A"
        ? "Concurrent A"
        : "Concurrent B";
    const final = await caller.master.getProfile();
    expect(final.profile?.displayName).toBe(winningName);
    expect(final.martialArts).toEqual([
      { id: keptArt.id, name: names[winningName], position: 0 },
    ]);
  });

  test("lets only one concurrent first save create the profile", async () => {
    const freshId = `round-trip-first-${crypto.randomUUID()}`;
    const freshEmail = `${freshId}@example.com`;
    const freshCaller = callerFor(db, freshId, freshEmail);

    await db.insert(user).values({
      email: freshEmail,
      id: freshId,
      name: "First Save",
    });

    try {
      const base = {
        homeCity: "Chennai",
        introduction: null,
        locations: [],
        revision: null,
        yearsTeaching: null,
      };
      const results = await Promise.allSettled([
        freshCaller.master.saveProfile({
          ...base,
          displayName: "First A",
          martialArts: [{ name: "Silambam" }],
        }),
        freshCaller.master.saveProfile({
          ...base,
          displayName: "First B",
          martialArts: [{ name: "Boxing" }],
        }),
      ]);
      const fulfilled = results.filter(
        (result) => result.status === "fulfilled"
      );
      const rejected = results.filter(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected"
      );

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0]?.reason).toMatchObject({ code: "CONFLICT" });

      const profiles = await db
        .select({ id: masterProfile.id })
        .from(masterProfile)
        .where(eq(masterProfile.userId, freshId));
      expect(profiles).toHaveLength(1);

      const [winner] = fulfilled;
      if (winner?.status !== "fulfilled") {
        throw new Error("The first-save race did not produce a winner");
      }
      const final = await freshCaller.master.getProfile();
      expect(final.profile?.displayName).toBe(
        winner.value.profile?.displayName
      );
      expect(final.martialArts).toEqual(winner.value.martialArts);
    } finally {
      await db.delete(user).where(eq(user.id, freshId));
    }
  });
});
