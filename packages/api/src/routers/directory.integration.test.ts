import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createDb } from "@my-better-t-app/db";
import { user } from "@my-better-t-app/db/schema/auth";
import { eq } from "drizzle-orm";

import type { MasterClassView } from "../classes";
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

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("public directory database contract", () => {
  const db = createDb({ DATABASE_URL: databaseUrl ?? "" });
  const suffix = crypto.randomUUID();
  const masterAId = `directory-a-${suffix}`;
  const masterBId = `directory-b-${suffix}`;
  const callerFor = (id: string, email = `${id}@example.com`) =>
    appRouter.createCaller({
      db,
      mediaRateLimit,
      mediaStorage,
      session: {
        session: { id: `directory-session-${id}` },
        user: {
          accountType: "master",
          email,
          id,
          name: "Directory Round Trip",
        },
      } as never,
    });
  const anonymous = appRouter.createCaller({
    db,
    mediaRateLimit,
    mediaStorage,
    session: null,
  });

  const callerA = callerFor(masterAId);
  const callerB = callerFor(masterBId);
  let artA: { id: string; name: string };
  let artB: { id: string; name: string };
  let locationA: { id: string; name: string };
  let locationB: { id: string; name: string };
  let activeA: MasterClassView;
  let fullA: MasterClassView;
  let pausedA: MasterClassView;
  let childrenB: MasterClassView;
  let adultsB: MasterClassView;

  async function createMaster(
    id: string,
    displayName: string,
    artName: string,
    city: string
  ) {
    await db
      .insert(user)
      .values({ email: `${id}@example.com`, id, name: displayName });
    const caller = callerFor(id);
    const payload = await caller.master.saveProfile({
      displayName,
      homeCity: city,
      introduction: null,
      locations: [{ name: city }],
      martialArts: [{ name: artName }],
      revision: null,
      yearsTeaching: 12,
    });
    if (!(payload.profile && payload.martialArts[0] && payload.locations[0])) {
      throw new Error("Directory fixture profile was incomplete");
    }
    return {
      art: payload.martialArts[0],
      location: payload.locations[0],
    };
  }

  beforeAll(async () => {
    const masterA = await createMaster(
      masterAId,
      "Arun Vel",
      "Silambam",
      "Nanganallur"
    );
    artA = masterA.art;
    locationA = masterA.location;
    const masterB = await createMaster(
      masterBId,
      "Meera Rao",
      "Karate",
      "Velachery"
    );
    artB = masterB.art;
    locationB = masterB.location;

    activeA = await callerA.classes.save({
      audience: "adults",
      feeAmount: 1500,
      feePeriod: "month",
      level: "beginner",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Silambam Foundation",
      schedules: [
        { dayOfWeek: 1, endTime: "19:00", startTime: "18:00" },
        { dayOfWeek: 6, endTime: "10:00", startTime: "09:00" },
      ],
      status: "active",
    });
    fullA = await callerA.classes.save({
      audience: "children",
      feeAmount: null,
      feePeriod: null,
      level: "beginner",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Young Silambam",
      schedules: [{ dayOfWeek: 7, endTime: "09:00", startTime: "08:00" }],
      status: "full",
    });
    pausedA = await callerA.classes.save({
      audience: "children",
      feeAmount: null,
      feePeriod: null,
      level: "beginner",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Paused Silambam",
      schedules: [{ dayOfWeek: 2, endTime: "19:00", startTime: "18:00" }],
      status: "paused",
    });
    childrenB = await callerB.classes.save({
      audience: "children",
      feeAmount: 1800,
      feePeriod: "month",
      level: "beginner",
      locationId: locationB.id,
      martialArtId: artB.id,
      name: "Kids Karate",
      schedules: [{ dayOfWeek: 7, endTime: "09:30", startTime: "08:30" }],
      status: "active",
    });
    adultsB = await callerB.classes.save({
      audience: "adults",
      feeAmount: null,
      feePeriod: null,
      level: "intermediate",
      locationId: locationB.id,
      martialArtId: artB.id,
      name: "Adult Karate",
      schedules: [{ dayOfWeek: 3, endTime: "20:00", startTime: "19:00" }],
      status: "active",
    });
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, masterAId));
    await db.delete(user).where(eq(user.id, masterBId));
  });

  test("returns published classes from every master without account data", async () => {
    const payload = await anonymous.directory.classes();

    expect(payload.classes.map((item) => item.id).sort()).toEqual(
      [activeA.id, fullA.id, childrenB.id, adultsB.id].sort()
    );
    expect(payload.classes.map((item) => item.id)).not.toContain(pausedA.id);
    expect(payload.classes.find((item) => item.id === fullA.id)?.status).toBe(
      "full"
    );

    const times = payload.classes.map((item) => item.nextSessionAt);
    expect([...times].sort()).toEqual(times);
    for (const item of payload.classes) {
      expect(new Date(item.nextSessionAt).getTime()).toBeGreaterThan(
        Date.now() - 60_000
      );
      expect(Object.keys(item.master)).toEqual(["displayName"]);
      expect(item).not.toHaveProperty("profileId");
      expect(item).not.toHaveProperty("email");
    }
    expect(payload.martialArts.map((item) => item.name).sort()).toEqual([
      "Karate",
      "Silambam",
    ]);
    expect(payload.locations.map((item) => item.name).sort()).toEqual([
      "Nanganallur",
      "Velachery",
    ]);
  });

  test("composes filters and keeps filter options global", async () => {
    const children = await anonymous.directory.classes({
      audience: "children",
    });
    expect(children.classes.map((item) => item.id).sort()).toEqual(
      [fullA.id, childrenB.id].sort()
    );
    expect(children.classes.map((item) => item.id)).not.toContain(pausedA.id);
    expect(children.martialArts.map((item) => item.name).sort()).toEqual([
      "Karate",
      "Silambam",
    ]);

    const masterA = await anonymous.directory.classes({
      martialArtId: artA.id,
    });
    expect(masterA.classes.map((item) => item.id).sort()).toEqual(
      [activeA.id, fullA.id].sort()
    );

    const velachery = await anonymous.directory.classes({
      locationId: locationB.id,
    });
    expect(velachery.classes.map((item) => item.id).sort()).toEqual(
      [childrenB.id, adultsB.id].sort()
    );

    const composed = await anonymous.directory.classes({
      audience: "adults",
      locationId: locationB.id,
    });
    expect(composed.classes.map((item) => item.id)).toEqual([adultsB.id]);

    const noMatch = await anonymous.directory.classes({
      locationId: locationB.id,
      martialArtId: artA.id,
    });
    expect(noMatch.classes).toEqual([]);
  });

  test("returns no rows for an unknown but valid id", async () => {
    const payload = await anonymous.directory.classes({
      martialArtId: "f9f7c6b0-4e7b-4e0a-8d62-5d3f8a3f2b1a",
    });
    expect(payload.classes).toEqual([]);
    expect(payload.martialArts.length).toBe(2);
  });
});
