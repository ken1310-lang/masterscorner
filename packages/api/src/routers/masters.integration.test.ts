import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createDb } from "@my-better-t-app/db";
import { user } from "@my-better-t-app/db/schema/auth";
import { inArray } from "drizzle-orm";

import { masterProfileSlug, normalizeDirectoryFilter } from "../directory";
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

describeDb("public master registry database contract", () => {
  const db = createDb({ DATABASE_URL: databaseUrl ?? "" });
  const suffix = crypto.randomUUID().slice(0, 8);
  const createdUserIds: string[] = [];
  const fixtureArt = `Registry Art ${suffix}`;
  const fixtureArtValue = normalizeDirectoryFilter(fixtureArt);
  const fixtureLocation = `Registry Area ${suffix}`;
  const fixtureLocationValue = normalizeDirectoryFilter(fixtureLocation);
  const privateIntroduction = `Private introduction ${suffix}`;
  const callerFor = (id: string) =>
    appRouter.createCaller({
      db,
      mediaRateLimit,
      mediaStorage,
      session: {
        session: { id: `registry-session-${id}` },
        user: {
          accountType: "master",
          email: `${id}@example.com`,
          id,
          name: "Registry Round Trip",
        },
      } as never,
    });
  const anonymous = appRouter.createCaller({
    db,
    mediaRateLimit,
    mediaStorage,
    session: null,
  });

  interface MasterFixture {
    art: { id: string; name: string };
    location: { id: string; name: string };
    uniqueArt: string;
    userId: string;
  }

  const masters = new Map<string, MasterFixture>();

  async function createMaster(
    key: string,
    displayName: string,
    yearsTeaching: number | null
  ): Promise<MasterFixture> {
    const id = `registry-${key}-${suffix}`;
    createdUserIds.push(id);
    await db
      .insert(user)
      .values({ email: `${id}@example.com`, id, name: displayName });
    const payload = await callerFor(id).master.saveProfile({
      displayName,
      homeCity: `Chennai ${suffix}`,
      introduction: privateIntroduction,
      locations: [
        { name: fixtureLocation },
        { name: `${key} Studio ${suffix}` },
      ],
      martialArts: [{ name: fixtureArt }, { name: `Style ${key} ${suffix}` }],
      revision: null,
      yearsTeaching,
    });
    if (
      !(
        payload.profile &&
        payload.martialArts[0] &&
        payload.martialArts[1] &&
        payload.locations[0]
      )
    ) {
      throw new Error("Registry fixture profile was incomplete");
    }
    return {
      art: payload.martialArts[0],
      location: payload.locations[0],
      uniqueArt: payload.martialArts[1].name,
      userId: id,
    };
  }

  beforeAll(async () => {
    masters.set("alpha", await createMaster("alpha", `Alpha ${suffix}`, 8));
    masters.set("bravo", await createMaster("bravo", `Bravo ${suffix}`, 8));
    masters.set(
      "charlie",
      await createMaster("charlie", `Charlie ${suffix}`, 7)
    );
    masters.set("delta", await createMaster("delta", `Delta ${suffix}`, 6));
    masters.set("echo", await createMaster("echo", `Echo ${suffix}`, 5));
    masters.set(
      "foxtrot",
      await createMaster("foxtrot", `Foxtrot ${suffix}`, 4)
    );
    masters.set("golf", await createMaster("golf", `Golf ${suffix}`, 3));
    masters.set("hotel", await createMaster("hotel", `Hotel ${suffix}`, null));

    const alpha = masters.get("alpha");
    const bravo = masters.get("bravo");
    const charlie = masters.get("charlie");
    const delta = masters.get("delta");
    if (!(alpha && bravo && charlie && delta)) {
      throw new Error("Registry fixture masters were incomplete");
    }

    const alphaCaller = callerFor(alpha.userId);
    const bravoCaller = callerFor(bravo.userId);
    const charlieCaller = callerFor(charlie.userId);
    const deltaCaller = callerFor(delta.userId);

    await alphaCaller.classes.save({
      audience: "children",
      feeAmount: null,
      feePeriod: null,
      level: "all",
      locationId: alpha.location.id,
      martialArtId: alpha.art.id,
      name: `Alpha Kids ${suffix}`,
      schedules: [{ dayOfWeek: 1, endTime: "19:00", startTime: "18:00" }],
      status: "active",
    });
    await bravoCaller.classes.save({
      audience: "adults",
      feeAmount: null,
      feePeriod: null,
      level: "all",
      locationId: bravo.location.id,
      martialArtId: bravo.art.id,
      name: `Bravo Adults ${suffix}`,
      schedules: [{ dayOfWeek: 2, endTime: "20:00", startTime: "19:00" }],
      status: "active",
    });
    await charlieCaller.classes.save({
      audience: "children",
      feeAmount: null,
      feePeriod: null,
      level: "all",
      locationId: charlie.location.id,
      martialArtId: charlie.art.id,
      name: `Charlie Paused ${suffix}`,
      schedules: [{ dayOfWeek: 3, endTime: "20:00", startTime: "19:00" }],
      status: "paused",
    });
    await deltaCaller.classes.save({
      audience: "adults",
      feeAmount: null,
      feePeriod: null,
      level: "all",
      locationId: delta.location.id,
      martialArtId: delta.art.id,
      name: `Delta Full ${suffix}`,
      schedules: [{ dayOfWeek: 4, endTime: "20:00", startTime: "19:00" }],
      status: "full",
    });
  });

  afterAll(async () => {
    if (createdUserIds.length > 0) {
      await db.delete(user).where(inArray(user.id, createdUserIds));
    }
  });

  test("orders by experience and paginates without overlap", async () => {
    const first = await anonymous.directory.masters({
      martialArt: fixtureArt,
      page: 1,
    });
    expect(first.pageSize).toBe(6);
    expect(first.total).toBe(8);
    expect(first.totalPages).toBe(2);
    expect(first.masters.map((item) => item.displayName)).toEqual([
      `Alpha ${suffix}`,
      `Bravo ${suffix}`,
      `Charlie ${suffix}`,
      `Delta ${suffix}`,
      `Echo ${suffix}`,
      `Foxtrot ${suffix}`,
    ]);
    expect(first.masters.map((item) => item.yearsTeaching)).toEqual([
      8, 8, 7, 6, 5, 4,
    ]);

    const second = await anonymous.directory.masters({
      martialArt: fixtureArt,
      page: 2,
    });
    expect(second.masters.map((item) => item.displayName)).toEqual([
      `Golf ${suffix}`,
      `Hotel ${suffix}`,
    ]);
    expect(second.masters.map((item) => item.yearsTeaching)).toEqual([3, null]);
    const [, classless] = second.masters;
    expect(classless?.audiences).toEqual([]);

    const clamped = await anonymous.directory.masters({
      martialArt: fixtureArt,
      page: 99,
    });
    expect(clamped.page).toBe(2);
    expect(clamped.masters.map((item) => item.id)).toEqual(
      second.masters.map((item) => item.id)
    );

    const allIds = [
      ...first.masters.map((item) => item.id),
      ...second.masters.map((item) => item.id),
    ];
    expect(new Set(allIds).size).toBe(8);
  });

  test("filters shared names and current-class audiences", async () => {
    const payload = await anonymous.directory.masters({
      martialArt: fixtureArt,
    });
    const byName = new Map(
      payload.masters.map((item) => [item.displayName, item])
    );
    expect(
      payload.martialArts.filter((item) => item.value === fixtureArtValue)
    ).toHaveLength(1);
    expect(
      payload.locations.filter((item) => item.value === fixtureLocationValue)
    ).toHaveLength(1);
    expect(byName.get(`Alpha ${suffix}`)?.audiences).toEqual(["children"]);
    expect(byName.get(`Bravo ${suffix}`)?.audiences).toEqual(["adults"]);
    expect(byName.get(`Charlie ${suffix}`)?.audiences).toEqual([]);
    expect(byName.get(`Delta ${suffix}`)?.audiences).toEqual(["adults"]);
    expect(byName.get(`Alpha ${suffix}`)?.martialArts).toEqual([
      fixtureArt,
      `Style alpha ${suffix}`,
    ]);
    expect(byName.get(`Alpha ${suffix}`)?.city).toBe(`Chennai ${suffix}`);

    const alpha = masters.get("alpha");
    if (!alpha) {
      throw new Error("Alpha fixture was missing");
    }
    const byUniqueArt = await anonymous.directory.masters({
      martialArt: alpha.uniqueArt,
    });
    expect(byUniqueArt.masters.map((item) => item.displayName)).toEqual([
      `Alpha ${suffix}`,
    ]);

    const byLocation = await anonymous.directory.masters({
      location: fixtureLocation,
    });
    expect(byLocation.total).toBe(8);
    expect(byLocation.pageSize).toBe(6);
    expect(byLocation.masters).toHaveLength(6);

    const children = await anonymous.directory.masters({
      audience: "children",
      martialArt: fixtureArt,
    });
    expect(children.masters.map((item) => item.displayName)).toEqual([
      `Alpha ${suffix}`,
    ]);

    const adults = await anonymous.directory.masters({
      audience: "adults",
      martialArt: fixtureArt,
    });
    expect(adults.masters.map((item) => item.displayName)).toEqual([
      `Bravo ${suffix}`,
      `Delta ${suffix}`,
    ]);
  });

  test("returns an empty page for unknown filters without leaking account data", async () => {
    const none = await anonymous.directory.masters({
      martialArt: `Missing ${suffix}`,
    });
    expect(none.total).toBe(0);
    expect(none.totalPages).toBe(0);
    expect(none.page).toBe(1);
    expect(none.masters).toEqual([]);
    expect(none.martialArts.length).toBeGreaterThan(0);

    const payload = await anonymous.directory.masters({
      martialArt: fixtureArt,
    });
    const [first] = payload.masters;
    expect(first ? Object.keys(first).sort() : []).toEqual([
      "audiences",
      "city",
      "displayName",
      "id",
      "martialArts",
      "slug",
      "yearsTeaching",
    ]);
    expect(first?.slug).toBe(
      masterProfileSlug(first?.displayName ?? "", first?.id ?? "")
    );
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain("@example.com");
    expect(serialized).not.toContain(privateIntroduction);
    expect(serialized).not.toContain("revision");
  });
});
