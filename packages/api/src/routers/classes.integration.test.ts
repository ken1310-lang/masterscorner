import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "bun:test";
import { createDb } from "@my-better-t-app/db";
import { user } from "@my-better-t-app/db/schema/auth";
import { masterClass } from "@my-better-t-app/db/schema/classes";
import { eq } from "drizzle-orm";

import type { MasterClassView, SaveClassInput } from "../classes";
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

describeDb("classes database round trip", () => {
  const db = createDb({ DATABASE_URL: databaseUrl ?? "" });
  const suffix = crypto.randomUUID();
  const masterAId = `classes-a-${suffix}`;
  const masterBId = `classes-b-${suffix}`;
  const callerFor = (id: string, email = `${id}@example.com`) =>
    appRouter.createCaller({
      db,
      mediaRateLimit,
      mediaStorage,
      session: {
        session: { id: `classes-session-${id}` },
        user: {
          accountType: "master",
          email,
          id,
          name: "Classes Round Trip",
        },
      } as never,
    });

  const callerA = callerFor(masterAId);
  const callerB = callerFor(masterBId);
  let artA: { id: string; name: string };
  let artB: { id: string; name: string };
  let locationA: { id: string; name: string };
  let locationB: { id: string; name: string };
  let profileA: string;

  async function createMaster(
    id: string,
    displayName: string
  ): Promise<{
    art: { id: string; name: string };
    location: { id: string; name: string };
    profileId: string;
  }> {
    await db
      .insert(user)
      .values({ email: `${id}@example.com`, id, name: displayName });
    const caller = callerFor(id);
    const payload = await caller.master.saveProfile({
      displayName,
      homeCity: "Chennai",
      introduction: null,
      locations: [{ name: "Nanganallur" }, { name: "Velachery" }],
      martialArts: [{ name: "Silambam" }, { name: "Karate" }],
      revision: null,
      yearsTeaching: 10,
    });
    if (!(payload.profile && payload.martialArts[0] && payload.locations[0])) {
      throw new Error("Master setup did not create the profile children");
    }
    return {
      art: payload.martialArts[0],
      location: payload.locations[0],
      profileId: payload.profile.id,
    };
  }

  beforeAll(async () => {
    const masterA = await createMaster(masterAId, "Master A");
    artA = masterA.art;
    locationA = masterA.location;
    profileA = masterA.profileId;
    const masterB = await createMaster(masterBId, "Master B");
    artB = masterB.art;
    locationB = masterB.location;
  });

  beforeEach(async () => {
    await db.delete(masterClass).where(eq(masterClass.profileId, profileA));
  });

  afterAll(async () => {
    await db.delete(user).where(eq(user.id, masterAId));
    await db.delete(user).where(eq(user.id, masterBId));
  });

  test("creates, updates, pauses and removes a class with its schedules", async () => {
    const created = await callerA.classes.save({
      audience: "adults",
      feeAmount: 1500,
      feePeriod: "month",
      level: "beginner",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Silambam Foundation",
      schedules: [
        { dayOfWeek: 3, endTime: "19:00", startTime: "18:00" },
        { dayOfWeek: 1, endTime: "19:00", startTime: "18:00" },
      ],
      status: "active",
    });

    expect(created.schedules.map((schedule) => schedule.dayOfWeek)).toEqual([
      1, 3,
    ]);
    expect(created.schedules[0]?.startTime).toBe("18:00");
    expect(created.martialArt.name).toBe(artA.name);
    expect(created.location.name).toBe(locationA.name);

    const listed = await callerA.classes.list();
    expect(listed.classes.map((item) => item.id)).toEqual([created.id]);
    expect(listed.martialArts.map((item) => item.id)).toContain(artA.id);
    expect(listed.locations.map((item) => item.id)).toContain(locationA.id);

    const updated = await callerA.classes.save({
      audience: "all",
      feeAmount: null,
      feePeriod: null,
      id: created.id,
      level: "all",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Silambam Foundations",
      schedules: [{ dayOfWeek: 5, endTime: "20:30", startTime: "19:30" }],
      status: "full",
    });
    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe("Silambam Foundations");
    expect(updated.feeAmount).toBeNull();
    expect(updated.schedules.map((schedule) => schedule.dayOfWeek)).toEqual([
      5,
    ]);

    const paused = await callerA.classes.setStatus({
      id: created.id,
      status: "paused",
    });
    expect(paused).toEqual({
      id: created.id,
      pausedFromStatus: "full",
      status: "paused",
    });
    const afterPause = await callerA.classes.list();
    expect(afterPause.classes[0]?.status).toBe("paused");
    expect(afterPause.classes[0]?.pausedFromStatus).toBe("full");

    const pausedByEditor = await callerA.classes.save({
      audience: "all",
      feeAmount: null,
      feePeriod: null,
      id: created.id,
      level: "all",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Silambam Paused",
      schedules: [{ dayOfWeek: 5, endTime: "20:30", startTime: "19:30" }],
      status: "paused",
    });
    expect(pausedByEditor.pausedFromStatus).toBe("full");

    const resumed = await callerA.classes.setStatus({
      id: created.id,
      status: "full",
    });
    expect(resumed).toEqual({
      id: created.id,
      pausedFromStatus: null,
      status: "full",
    });

    const removed = await callerA.classes.remove({ id: created.id });
    expect(removed).toEqual({ id: created.id });
    expect((await callerA.classes.list()).classes).toHaveLength(0);
  });

  test("returns each concurrent save's own snapshot", async () => {
    const created = await callerA.classes.save({
      audience: "adults",
      feeAmount: null,
      feePeriod: null,
      level: "beginner",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Concurrent base",
      schedules: [{ dayOfWeek: 1, endTime: "19:00", startTime: "18:00" }],
      status: "active",
    });
    const leftInput: SaveClassInput = {
      audience: "adults",
      feeAmount: null,
      feePeriod: null,
      id: created.id,
      level: "beginner",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Concurrent Monday",
      schedules: [{ dayOfWeek: 1, endTime: "19:00", startTime: "18:00" }],
      status: "active",
    };
    const rightInput: SaveClassInput = {
      ...leftInput,
      name: "Concurrent Tuesday",
      schedules: [{ dayOfWeek: 2, endTime: "20:00", startTime: "19:00" }],
      status: "full",
    };
    const snapshot = (item: MasterClassView) => ({
      name: item.name,
      schedules: item.schedules.map(({ dayOfWeek, endTime, startTime }) => ({
        dayOfWeek,
        endTime,
        startTime,
      })),
      status: item.status,
    });

    const rounds = await Promise.all(
      Array.from({ length: 3 }, () =>
        Promise.all([
          callerA.classes.save(leftInput),
          callerA.classes.save(rightInput),
        ])
      )
    );
    for (const [left, right] of rounds) {
      expect(snapshot(left)).toEqual({
        name: leftInput.name,
        schedules: leftInput.schedules,
        status: leftInput.status,
      });
      expect(snapshot(right)).toEqual({
        name: rightInput.name,
        schedules: rightInput.schedules,
        status: rightInput.status,
      });
    }
  });

  test("scopes reads and writes to the owning master", async () => {
    const created = await callerA.classes.save({
      audience: "children",
      feeAmount: null,
      feePeriod: null,
      level: "beginner",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Kids Silambam",
      schedules: [{ dayOfWeek: 6, endTime: "10:00", startTime: "09:00" }],
      status: "active",
    });

    expect((await callerB.classes.list()).classes).toHaveLength(0);
    await expect(
      callerB.classes.save({
        audience: "children",
        feeAmount: null,
        feePeriod: null,
        id: created.id,
        level: "beginner",
        locationId: locationB.id,
        martialArtId: artB.id,
        name: "Stolen",
        schedules: [{ dayOfWeek: 6, endTime: "10:00", startTime: "09:00" }],
        status: "active",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      callerB.classes.setStatus({ id: created.id, status: "paused" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      callerB.classes.remove({ id: created.id })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      callerB.classes.save({
        audience: "children",
        feeAmount: null,
        feePeriod: null,
        level: "beginner",
        locationId: locationA.id,
        martialArtId: artA.id,
        name: "Borrowed references",
        schedules: [{ dayOfWeek: 6, endTime: "10:00", startTime: "09:00" }],
        status: "active",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect((await callerA.classes.list()).classes).toHaveLength(1);
  });

  test("reports profile children that a class still uses", async () => {
    const current = await callerA.master.getProfile();
    if (!current.profile) {
      throw new Error("The master setup did not create a profile");
    }
    const created = await callerA.classes.save({
      audience: "adults",
      feeAmount: null,
      feePeriod: null,
      level: "beginner",
      locationId: locationA.id,
      martialArtId: artA.id,
      name: "Referenced by profile",
      schedules: [{ dayOfWeek: 2, endTime: "19:00", startTime: "18:00" }],
      status: "active",
    });

    await expect(
      callerA.master.saveProfile({
        displayName: current.profile.displayName,
        homeCity: current.profile.homeCity,
        introduction: current.profile.introduction,
        locations: current.locations.filter(
          (location) => location.id !== locationA.id
        ),
        martialArts: current.martialArts.filter((art) => art.id !== artA.id),
        revision: current.profile.revision,
        yearsTeaching: current.profile.yearsTeaching,
      })
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: expect.stringContaining("A class uses"),
    });

    expect(
      (await callerA.classes.list()).classes.map((item) => item.id)
    ).toContain(created.id);
  });

  test("requires a master profile before creating a class", async () => {
    const id = `classes-no-profile-${crypto.randomUUID()}`;
    await db
      .insert(user)
      .values({ email: `${id}@example.com`, id, name: "No Profile" });
    try {
      const caller = callerFor(id);
      expect((await caller.classes.list()).classes).toEqual([]);
      await expect(
        caller.classes.save({
          audience: "adults",
          feeAmount: null,
          feePeriod: null,
          level: "beginner",
          locationId: locationA.id,
          martialArtId: artA.id,
          name: "No profile class",
          schedules: [{ dayOfWeek: 1, endTime: "19:00", startTime: "18:00" }],
          status: "active",
        })
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    } finally {
      await db.delete(user).where(eq(user.id, id));
    }
  });
});
