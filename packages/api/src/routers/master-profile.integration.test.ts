import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createDb } from "@my-better-t-app/db";
import { user } from "@my-better-t-app/db/schema/auth";
import { media } from "@my-better-t-app/db/schema/master";
import { inArray } from "drizzle-orm";

import { masterProfileSlug } from "../directory";
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

describeDb("public master profile database contract", () => {
  const db = createDb({ DATABASE_URL: databaseUrl ?? "" });
  const suffix = crypto.randomUUID().slice(0, 8);
  const fullUserId = `profile-full-${suffix}`;
  const minimalUserId = `profile-minimal-${suffix}`;
  const createdUserIds = [fullUserId, minimalUserId];
  const callerFor = (id: string) =>
    appRouter.createCaller({
      db,
      mediaRateLimit,
      mediaStorage,
      session: {
        session: { id: `profile-session-${id}` },
        user: {
          accountType: "master",
          email: `${id}@example.com`,
          id,
          name: "Public Profile Round Trip",
        },
      } as never,
    });
  const anonymous = appRouter.createCaller({
    db,
    mediaRateLimit,
    mediaStorage,
    session: null,
  });

  const fullDisplayName = `Profile Full ${suffix}`;
  const fullIntroduction = `Line one ${suffix}\nLine two ${suffix}`;
  const fullCity = `Chennai ${suffix}`;
  const firstArt = `Silambam ${suffix}`;
  const secondArt = `Karate ${suffix}`;
  const firstLocation = `Main Studio ${suffix}`;
  const secondLocation = `Second Studio ${suffix}`;
  const fullCaller = callerFor(fullUserId);
  const minimalCaller = callerFor(minimalUserId);

  let fullProfileId = "";
  let fullRevision = "";
  let fullSlug = "";
  let fullArtIds: { id: string; name: string }[] = [];
  let fullLocationIds: { id: string; name: string }[] = [];
  let firstArtId = "";
  let secondArtId = "";
  let firstLocationId = "";
  let secondLocationId = "";
  let activeClassId = "";
  let fullClassId = "";
  let pausedClassId = "";

  beforeAll(async () => {
    await db.insert(user).values([
      { email: `${fullUserId}@example.com`, id: fullUserId, name: "Full" },
      {
        email: `${minimalUserId}@example.com`,
        id: minimalUserId,
        name: "Minimal",
      },
    ]);

    const full = await fullCaller.master.saveProfile({
      displayName: fullDisplayName,
      homeCity: fullCity,
      introduction: fullIntroduction,
      locations: [{ name: firstLocation }, { name: secondLocation }],
      martialArts: [{ name: firstArt }, { name: secondArt }],
      revision: null,
      yearsTeaching: 18,
    });
    const [artOne, artTwo] = full.martialArts;
    const [locationOne, locationTwo] = full.locations;
    if (!(full.profile && artOne && artTwo && locationOne && locationTwo)) {
      throw new Error("Full profile fixture was incomplete");
    }
    fullProfileId = full.profile.id;
    fullRevision = full.profile.revision;
    fullSlug = masterProfileSlug(full.profile.displayName, full.profile.id);
    fullArtIds = full.martialArts.map(({ id, name }) => ({ id, name }));
    fullLocationIds = full.locations.map(({ id, name }) => ({ id, name }));
    firstArtId = artOne.id;
    secondArtId = artTwo.id;
    firstLocationId = locationOne.id;
    secondLocationId = locationTwo.id;

    await db.insert(media).values({
      byteSize: 68,
      contentType: "image/png",
      kind: "profile_photo",
      objectKey: `masters/${fullProfileId}/integration.png`,
      profileId: fullProfileId,
    });

    const activeClass = await fullCaller.classes.save({
      audience: "adults",
      feeAmount: 1500,
      feePeriod: "month",
      level: "intermediate",
      locationId: firstLocationId,
      martialArtId: firstArtId,
      name: `Advanced Silambam ${suffix}`,
      schedules: [
        { dayOfWeek: 6, endTime: "10:00", startTime: "09:00" },
        { dayOfWeek: 1, endTime: "19:00", startTime: "18:00" },
      ],
      status: "active",
    });
    activeClassId = activeClass.id;

    const fullClass = await fullCaller.classes.save({
      audience: "children",
      feeAmount: null,
      feePeriod: null,
      level: "beginner",
      locationId: secondLocationId,
      martialArtId: secondArtId,
      name: `Young Karate ${suffix}`,
      schedules: [{ dayOfWeek: 7, endTime: "09:30", startTime: "08:30" }],
      status: "full",
    });
    fullClassId = fullClass.id;

    const pausedClass = await fullCaller.classes.save({
      audience: "children",
      feeAmount: null,
      feePeriod: null,
      level: "beginner",
      locationId: firstLocationId,
      martialArtId: firstArtId,
      name: `Paused Silambam ${suffix}`,
      schedules: [{ dayOfWeek: 2, endTime: "19:00", startTime: "18:00" }],
      status: "paused",
    });
    pausedClassId = pausedClass.id;

    const minimal = await minimalCaller.master.saveProfile({
      displayName: `Profile Minimal ${suffix}`,
      homeCity: null,
      introduction: null,
      locations: [],
      martialArts: [{ name: `Minimal Art ${suffix}` }],
      revision: null,
      yearsTeaching: null,
    });
    if (!minimal.profile) {
      throw new Error("Minimal profile fixture was incomplete");
    }
  });

  afterAll(async () => {
    await db.delete(user).where(inArray(user.id, createdUserIds));
  });

  test("returns ordered public sections and current classes", async () => {
    const profile = await anonymous.directory.masterProfile({
      slug: fullSlug,
    });
    if (!profile) {
      throw new Error("Full public profile was missing");
    }

    expect(Object.keys(profile).sort()).toEqual([
      "classes",
      "displayName",
      "homeCity",
      "introduction",
      "locations",
      "martialArts",
      "photoUrl",
      "slug",
      "yearsTeaching",
    ]);
    expect(profile).toMatchObject({
      displayName: fullDisplayName,
      homeCity: fullCity,
      introduction: fullIntroduction,
      martialArts: [firstArt, secondArt],
      photoUrl: `https://cdn.example/media/masters/${fullProfileId}/integration.png`,
      slug: fullSlug,
      yearsTeaching: 18,
    });
    expect(profile.locations).toEqual([
      { id: firstLocationId, name: firstLocation },
      { id: secondLocationId, name: secondLocation },
    ]);

    expect(profile.classes.map((item) => item.id)).toEqual([
      activeClassId,
      fullClassId,
    ]);
    expect(profile.classes.map((item) => item.name)).toEqual([
      `Advanced Silambam ${suffix}`,
      `Young Karate ${suffix}`,
    ]);
    expect(profile.classes.map((item) => item.id)).not.toContain(pausedClassId);

    const [active, full] = profile.classes;
    if (!(active && full)) {
      throw new Error("Full profile classes were incomplete");
    }
    expect(active).toMatchObject({
      audience: "adults",
      feeAmount: 1500,
      feePeriod: "month",
      level: "intermediate",
      location: { id: firstLocationId, name: firstLocation },
      martialArt: { id: firstArtId, name: firstArt },
      status: "active",
    });
    expect(active.schedules).toEqual([
      { dayOfWeek: 1, endTime: "19:00", startTime: "18:00" },
      { dayOfWeek: 6, endTime: "10:00", startTime: "09:00" },
    ]);
    const [firstSchedule] = active.schedules;
    if (!firstSchedule) {
      throw new Error("Active class schedule was missing");
    }
    expect(Object.keys(firstSchedule).sort()).toEqual([
      "dayOfWeek",
      "endTime",
      "startTime",
    ]);

    expect(full.status).toBe("full");
    expect(full.feeAmount).toBeNull();
    expect(full.schedules).toEqual([
      { dayOfWeek: 7, endTime: "09:30", startTime: "08:30" },
    ]);

    const serialized = JSON.stringify(profile);
    expect(serialized).not.toContain("@example.com");
    expect(serialized).not.toContain('"userId"');
    expect(serialized).not.toContain("revision");
    expect(serialized).not.toContain("objectKey");
    expect(serialized).not.toContain("pausedFromStatus");
  });

  test("returns a credible minimal profile and null for unknown slugs", async () => {
    const minimal = await minimalCaller.master.getProfile();
    if (!minimal.profile) {
      throw new Error("Minimal profile was missing");
    }
    const slug = masterProfileSlug(
      minimal.profile.displayName,
      minimal.profile.id
    );
    const profile = await anonymous.directory.masterProfile({ slug });

    expect(profile).toEqual({
      classes: [],
      displayName: `Profile Minimal ${suffix}`,
      homeCity: null,
      introduction: null,
      locations: [],
      martialArts: [`Minimal Art ${suffix}`],
      photoUrl: null,
      slug,
      yearsTeaching: null,
    });

    expect(
      await anonymous.directory.masterProfile({ slug: "missing-master" })
    ).toBeNull();
    expect(
      await anonymous.directory.masterProfile({
        slug: `missing-${crypto.randomUUID()}`,
      })
    ).toBeNull();
  });

  test("keeps an old link resolving after the display name changes", async () => {
    const renamed = `${fullDisplayName} Renamed`;
    const saved = await fullCaller.master.saveProfile({
      displayName: renamed,
      homeCity: fullCity,
      introduction: fullIntroduction,
      locations: fullLocationIds,
      martialArts: fullArtIds,
      revision: fullRevision,
      yearsTeaching: 19,
    });
    if (!saved.profile) {
      throw new Error("Renamed profile was missing");
    }

    const profile = await anonymous.directory.masterProfile({
      slug: fullSlug,
    });
    expect(profile?.displayName).toBe(renamed);
    expect(profile?.yearsTeaching).toBe(19);
    expect(profile?.slug).toBe(
      masterProfileSlug(saved.profile.displayName, saved.profile.id)
    );
    expect(profile?.slug).not.toBe(fullSlug);

    expect(
      await anonymous.directory.masterProfile({
        slug: saved.profile.id,
      })
    ).toMatchObject({ displayName: renamed });
  });
});
