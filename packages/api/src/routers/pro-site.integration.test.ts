import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createDb } from "@my-better-t-app/db";
import { user } from "@my-better-t-app/db/schema/auth";
import { masterProfile, media } from "@my-better-t-app/db/schema/master";
import { proSite } from "@my-better-t-app/db/schema/pro-site";
import { eq } from "drizzle-orm";

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
const HOOK_TIMEOUT = 30_000;
const TEST_TIMEOUT = 30_000;
const liveTest = (name: string, fn: () => Promise<void>) =>
  test(name, fn, TEST_TIMEOUT);

describeDb("public Pro Site database contract", () => {
  const db = createDb({ DATABASE_URL: databaseUrl ?? "" });
  const suffix = crypto.randomUUID().slice(0, 8);
  const masterAId = `pro-site-a-${suffix}`;
  const masterBId = `pro-site-b-${suffix}`;
  const masterCId = `pro-site-c-${suffix}`;
  const prefix = `pro-site-${suffix}`;
  const callerFor = (id: string) =>
    appRouter.createCaller({
      db,
      mediaRateLimit,
      mediaStorage,
      session: {
        session: { id: `pro-site-session-${id}` },
        user: {
          accountType: "master",
          email: `${id}@example.com`,
          id,
          name: "Pro Site Test",
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
  const callerC = callerFor(masterCId);

  let profileAId = "";
  let slugA = "";
  let slugB = "";
  let publishedAt: Date;
  let activeClassId = "";
  let fullClassId = "";
  let pausedClassId = "";

  beforeAll(async () => {
    await Promise.all(
      [masterAId, masterBId, masterCId].map((id) =>
        db.insert(user).values({
          email: `${id}@example.com`,
          id,
          name: "Pro Site Test",
        })
      )
    );

    const profileA = await callerA.master.saveProfile({
      displayName: "Arun Vel",
      homeCity: "Chennai",
      introduction: `Traditional training ${prefix}`,
      locations: [
        { name: `Velachery ${suffix}` },
        { name: `Nanganallur ${suffix}` },
      ],
      martialArts: [{ name: `Silambam ${suffix}` }],
      revision: null,
      yearsTeaching: 18,
    });
    const profileB = await callerB.master.saveProfile({
      displayName: "Meera Rao",
      homeCity: null,
      introduction: null,
      locations: [],
      martialArts: [{ name: `Kalaripayattu ${suffix}` }],
      revision: null,
      yearsTeaching: null,
    });
    if (
      !(
        profileA.profile &&
        profileA.martialArts[0] &&
        profileA.locations[0] &&
        profileA.locations[1]
      )
    ) {
      throw new Error("Pro Site fixture A was incomplete");
    }
    if (!(profileB.profile && profileB.martialArts[0])) {
      throw new Error("Pro Site fixture B was incomplete");
    }

    profileAId = profileA.profile.id;
    slugA = masterProfileSlug(profileA.profile.displayName, profileAId);
    slugB = masterProfileSlug(
      profileB.profile.displayName,
      profileB.profile.id
    );

    const active = await callerA.classes.save({
      audience: "adults",
      feeAmount: 1500,
      feePeriod: "month",
      level: "beginner",
      locationId: profileA.locations[0].id,
      martialArtId: profileA.martialArts[0].id,
      name: `Foundation ${prefix}`,
      schedules: [
        { dayOfWeek: 6, endTime: "10:00", startTime: "09:00" },
        { dayOfWeek: 1, endTime: "19:00", startTime: "18:00" },
      ],
      status: "active",
    });
    const full = await callerA.classes.save({
      audience: "children",
      feeAmount: null,
      feePeriod: null,
      level: "all",
      locationId: profileA.locations[1].id,
      martialArtId: profileA.martialArts[0].id,
      name: `Young Silambam ${prefix}`,
      schedules: [{ dayOfWeek: 7, endTime: "09:30", startTime: "08:30" }],
      status: "full",
    });
    const paused = await callerA.classes.save({
      audience: "adults",
      feeAmount: null,
      feePeriod: null,
      level: "advanced",
      locationId: profileA.locations[0].id,
      martialArtId: profileA.martialArts[0].id,
      name: `Paused ${prefix}`,
      schedules: [{ dayOfWeek: 2, endTime: "20:00", startTime: "19:00" }],
      status: "paused",
    });
    activeClassId = active.id;
    fullClassId = full.id;
    pausedClassId = paused.id;

    await db.insert(media).values([
      {
        byteSize: 1024,
        contentType: "image/jpeg",
        kind: "profile_photo",
        objectKey: `masters/${profileA.profile.id}/photo.jpg`,
        profileId: profileA.profile.id,
      },
      {
        byteSize: 512,
        contentType: "image/png",
        kind: "site_logo",
        objectKey: `masters/${profileA.profile.id}/logo.png`,
        profileId: profileA.profile.id,
      },
    ]);

    publishedAt = new Date("2026-10-24T12:00:00.000Z");
    await db.insert(proSite).values({
      profileId: profileB.profile.id,
      publishedAt: null,
    });
  }, HOOK_TIMEOUT);

  afterAll(async () => {
    await Promise.all(
      [masterAId, masterBId, masterCId].map((id) =>
        db.delete(user).where(eq(user.id, id))
      )
    );
  }, HOOK_TIMEOUT);

  liveTest(
    "keeps an unpublished site invisible and reports its reserved address",
    async () => {
      expect(await anonymous.proSite.bySlug({ slug: slugA })).toBeNull();
      expect(
        await anonymous.proSite.bySlug({ slug: `${slugA}-unknown` })
      ).toBeNull();
      expect(
        await anonymous.proSite.bySlug({ slug: "not-a-profile-slug" })
      ).toBeNull();

      expect(await callerA.proSite.status()).toEqual({
        address: `/pro/${slugA}`,
        displayName: "Arun Vel",
        published: false,
        siteName: null,
        style: "ochre",
        sync: {
          bio: true,
          classes: true,
          locations: true,
          media: true,
          schedule: true,
        },
      });
      expect(await callerB.proSite.status()).toEqual({
        address: `/pro/${slugB}`,
        displayName: "Meera Rao",
        published: false,
        siteName: null,
        style: "ochre",
        sync: {
          bio: false,
          classes: false,
          locations: false,
          media: false,
          schedule: false,
        },
      });
      expect(await callerC.proSite.status()).toBeNull();
      expect(await callerC.proSite.preview()).toBeNull();
    }
  );

  liveTest(
    "requires a master profile for settings and publication writes",
    async () => {
      await expect(
        callerC.proSite.saveSettings({ siteName: "No profile", style: "ochre" })
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
      await expect(
        callerC.proSite.setPublished({ published: true })
      ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    }
  );

  liveTest("returns only public data for a published site", async () => {
    await db.insert(proSite).values({ profileId: profileAId, publishedAt });

    const payload = await anonymous.proSite.bySlug({ slug: slugA });
    expect(payload).not.toBeNull();
    if (!payload) {
      throw new Error("Published Pro Site was not returned");
    }

    expect(payload).toEqual({
      classes: [
        {
          audience: "adults",
          feeAmount: 1500,
          feePeriod: "month",
          id: activeClassId,
          level: "beginner",
          location: {
            id: expect.any(String),
            name: expect.stringContaining("Velachery"),
          },
          martialArt: {
            id: expect.any(String),
            name: `Silambam ${suffix}`,
          },
          name: `Foundation ${prefix}`,
          schedules: [
            { dayOfWeek: 1, endTime: "19:00", startTime: "18:00" },
            { dayOfWeek: 6, endTime: "10:00", startTime: "09:00" },
          ],
          status: "active",
        },
        {
          audience: "children",
          feeAmount: null,
          feePeriod: null,
          id: fullClassId,
          level: "all",
          location: {
            id: expect.any(String),
            name: expect.stringContaining("Nanganallur"),
          },
          martialArt: {
            id: expect.any(String),
            name: `Silambam ${suffix}`,
          },
          name: `Young Silambam ${prefix}`,
          schedules: [{ dayOfWeek: 7, endTime: "09:30", startTime: "08:30" }],
          status: "full",
        },
      ],
      displayName: "Arun Vel",
      homeCity: "Chennai",
      introduction: `Traditional training ${prefix}`,
      locations: [
        {
          id: expect.any(String),
          name: expect.stringContaining("Velachery"),
        },
        {
          id: expect.any(String),
          name: expect.stringContaining("Nanganallur"),
        },
      ],
      logoUrl: expect.stringContaining("/logo.png"),
      martialArts: [`Silambam ${suffix}`],
      photoUrl: expect.stringContaining("/photo.jpg"),
      siteName: "Arun Vel",
      slug: slugA,
      style: "ochre",
      yearsTeaching: 18,
    });
    expect(payload.classes.map((item) => item.id)).not.toContain(pausedClassId);
    expect(Object.keys(payload).sort()).toEqual([
      "classes",
      "displayName",
      "homeCity",
      "introduction",
      "locations",
      "logoUrl",
      "martialArts",
      "photoUrl",
      "siteName",
      "slug",
      "style",
      "yearsTeaching",
    ]);
    expect(JSON.stringify(payload)).not.toContain("@example.com");
    expect(await callerA.proSite.status()).toEqual({
      address: `/pro/${slugA}`,
      displayName: "Arun Vel",
      published: true,
      siteName: null,
      style: "ochre",
      sync: {
        bio: true,
        classes: true,
        locations: true,
        media: true,
        schedule: true,
      },
    });
  });

  liveTest(
    "saves branding, previews drafts and toggles publication",
    async () => {
      const saved = await callerA.proSite.saveSettings({
        siteName: "  Veeram Silambam  ",
        style: "terracotta",
      });
      expect(saved).toMatchObject({
        displayName: "Arun Vel",
        published: true,
        siteName: "Veeram Silambam",
        style: "terracotta",
      });

      const publicSite = await anonymous.proSite.bySlug({ slug: slugA });
      expect(publicSite).toMatchObject({
        displayName: "Arun Vel",
        siteName: "Veeram Silambam",
        style: "terracotta",
      });
      expect((await callerA.master.getProfile()).profile?.displayName).toBe(
        "Arun Vel"
      );

      const previewA = await callerA.proSite.preview();
      expect(previewA).toMatchObject({
        siteName: "Veeram Silambam",
        style: "terracotta",
      });
      const previewB = await callerB.proSite.preview();
      expect(previewB?.displayName).toBe("Meera Rao");
      expect(JSON.stringify(previewB)).not.toContain("Veeram Silambam");

      const savedB = await callerB.proSite.saveSettings({
        siteName: "Meera Site",
        style: "sage",
      });
      expect(savedB.published).toBe(false);
      expect(savedB.siteName).toBe("Meera Site");
      expect(await anonymous.proSite.bySlug({ slug: slugB })).toBeNull();

      const unpublished = await callerA.proSite.setPublished({
        published: false,
      });
      expect(unpublished.published).toBe(false);
      expect(unpublished.siteName).toBe("Veeram Silambam");
      expect(await anonymous.proSite.bySlug({ slug: slugA })).toBeNull();
      expect((await callerA.proSite.preview())?.siteName).toBe(
        "Veeram Silambam"
      );

      const republished = await callerA.proSite.setPublished({
        published: true,
      });
      expect(republished.published).toBe(true);
      expect(await anonymous.proSite.bySlug({ slug: slugA })).not.toBeNull();
    }
  );

  liveTest("does not reveal another master's unpublished site", async () => {
    expect(await anonymous.proSite.bySlug({ slug: slugB })).toBeNull();
    expect(await callerA.proSite.bySlug({ slug: slugB })).toBeNull();
  });

  liveTest(
    "cascades the publication row when the profile is deleted",
    async () => {
      const profile = await db.query.masterProfile.findFirst({
        where: { userId: masterBId },
        columns: { id: true },
      });
      if (!profile) {
        throw new Error("Unpublished fixture profile was missing");
      }

      await db.delete(masterProfile).where(eq(masterProfile.id, profile.id));

      const rows = await db
        .select({ profileId: proSite.profileId })
        .from(proSite)
        .where(eq(proSite.profileId, profile.id));
      expect(rows).toHaveLength(0);
    }
  );
});
