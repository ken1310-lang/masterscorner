import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createDb } from "@my-better-t-app/db";
import { user } from "@my-better-t-app/db/schema/auth";
import { eq } from "drizzle-orm";

import type { MasterClassView } from "../classes";
import { normalizeDirectoryFilter } from "../directory";
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
  const suffix = crypto.randomUUID().slice(0, 8);
  const masterAId = `directory-a-${suffix}`;
  const masterBId = `directory-b-${suffix}`;
  const artName = `Karate ${suffix}`;
  const locationName = `Velachery ${suffix}`;
  const artValue = normalizeDirectoryFilter(artName);
  const locationValue = normalizeDirectoryFilter(locationName);
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

  async function createMaster(id: string, displayName: string) {
    await db
      .insert(user)
      .values({ email: `${id}@example.com`, id, name: displayName });
    const caller = callerFor(id);
    const payload = await caller.master.saveProfile({
      displayName,
      homeCity: "Chennai",
      introduction: null,
      locations: [{ name: locationName }],
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
    const masterA = await createMaster(masterAId, "Arun Vel");
    artA = masterA.art;
    locationA = masterA.location;
    const masterB = await createMaster(masterBId, "Meera Rao");
    artB = masterB.art;
    locationB = masterB.location;

    activeA = await callerA.classes.save({
      audience: "adults",
      feeAmount: 1500,
      feePeriod: "month",
      level: "beginner",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: `Silambam Foundation ${suffix}`,
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
      name: `Young Silambam ${suffix}`,
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
      name: `Paused Silambam ${suffix}`,
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
      name: `Kids Karate ${suffix}`,
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
      name: `Adult Karate ${suffix}`,
      schedules: [{ dayOfWeek: 3, endTime: "20:00", startTime: "19:00" }],
      status: "active",
    });
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, masterAId));
    await db.delete(user).where(eq(user.id, masterBId));
  });

  test("groups one shared art and location across two masters", async () => {
    const payload = await anonymous.directory.classes({
      location: locationName,
      martialArt: artName,
    });

    expect(payload.classes.map((item) => item.id).sort()).toEqual(
      [activeA.id, fullA.id, childrenB.id, adultsB.id].sort()
    );
    expect(payload.classes.map((item) => item.id)).not.toContain(pausedA.id);
    expect(payload.classes.find((item) => item.id === fullA.id)?.status).toBe(
      "full"
    );
    expect(
      payload.martialArts.filter((item) => item.value === artValue)
    ).toHaveLength(1);
    expect(
      payload.locations.filter((item) => item.value === locationValue)
    ).toHaveLength(1);
    expect(
      payload.martialArts.find((item) => item.value === artValue)?.name
    ).toBe(artName);
    expect(
      payload.locations.find((item) => item.value === locationValue)?.name
    ).toBe(locationName);

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
  });

  test("composes shared-name filters and includes both masters", async () => {
    const children = await anonymous.directory.classes({
      audience: "children",
      location: locationName,
      martialArt: artName,
    });
    expect(children.classes.map((item) => item.id).sort()).toEqual(
      [fullA.id, childrenB.id].sort()
    );
    expect(children.classes.map((item) => item.id)).not.toContain(pausedA.id);

    const uppercase = await anonymous.directory.classes({
      martialArt: artName.toUpperCase(),
    });
    expect(uppercase.classes.map((item) => item.id).sort()).toEqual(
      [activeA.id, fullA.id, childrenB.id, adultsB.id].sort()
    );

    const byLocation = await anonymous.directory.classes({
      location: locationName,
    });
    expect(byLocation.classes.map((item) => item.id).sort()).toEqual(
      [activeA.id, fullA.id, childrenB.id, adultsB.id].sort()
    );

    const noMatch = await anonymous.directory.classes({
      martialArt: `Unknown ${suffix}`,
    });
    expect(noMatch.classes).toEqual([]);
    expect(
      noMatch.martialArts.filter((item) => item.value === artValue)
    ).toHaveLength(1);
  });
});
