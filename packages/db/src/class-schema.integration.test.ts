import { afterEach, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { createDb } from "./index";
import { user } from "./schema/auth";
import { masterClass, masterClassSchedule } from "./schema/classes";
import {
  masterLocation,
  masterMartialArt,
  masterProfile,
} from "./schema/master";

const databaseUrl = process.env.DATABASE_URL;
const describeDb = databaseUrl ? describe : describe.skip;

describeDb("class schema database round trip", () => {
  const db = createDb({ DATABASE_URL: databaseUrl ?? "" });
  const createdUsers: string[] = [];

  function first<T>(rows: T[]): T {
    const [row] = rows;
    if (!row) {
      throw new Error("Expected the database to return a row");
    }
    return row;
  }

  async function seed() {
    const userId = `class-test-${crypto.randomUUID()}`;
    await db.insert(user).values({
      email: `${userId}@example.com`,
      id: userId,
      name: "Class Round Trip",
    });
    createdUsers.push(userId);

    const profile = first(
      await db
        .insert(masterProfile)
        .values({ displayName: "Class Round Trip", userId })
        .returning({ id: masterProfile.id })
    );
    const art = first(
      await db
        .insert(masterMartialArt)
        .values({ name: "Silambam", position: 0, profileId: profile.id })
        .returning({ id: masterMartialArt.id })
    );
    const location = first(
      await db
        .insert(masterLocation)
        .values({ name: "Nanganallur", position: 0, profileId: profile.id })
        .returning({ id: masterLocation.id })
    );
    const created = first(
      await db
        .insert(masterClass)
        .values({
          audience: "adults",
          feeAmount: 1500,
          feePeriod: "month",
          level: "beginner",
          locationId: location.id,
          martialArtId: art.id,
          name: "Silambam Foundation",
          profileId: profile.id,
        })
        .returning({ id: masterClass.id })
    );

    await db.insert(masterClassSchedule).values([
      {
        classId: created.id,
        dayOfWeek: 1,
        endTime: "19:00:00",
        startTime: "18:00:00",
      },
      {
        classId: created.id,
        dayOfWeek: 3,
        endTime: "19:00:00",
        startTime: "18:00:00",
      },
    ]);

    return {
      artId: art.id,
      classId: created.id,
      locationId: location.id,
      profileId: profile.id,
    };
  }

  async function expectDatabaseCode(
    action: () => Promise<unknown>,
    code: string
  ) {
    let failure: unknown;
    try {
      await action();
    } catch (error) {
      failure = error;
    }
    const databaseError = failure as
      | { cause?: { code?: string }; code?: string }
      | undefined;
    expect(databaseError?.cause?.code ?? databaseError?.code).toBe(code);
  }

  afterEach(async () => {
    await Promise.all(
      createdUsers
        .splice(0)
        .map((userId) => db.delete(user).where(eq(user.id, userId)))
    );
  });

  test("reads a master's class with its weekly schedules", async () => {
    const { classId, profileId } = await seed();

    const [stored] = await db.query.masterClass.findMany({
      where: { profileId },
      with: { martialArt: true, location: true, schedules: true },
    });

    expect(stored?.id).toBe(classId);
    expect(stored?.location.name).toBe("Nanganallur");
    expect(stored?.martialArt.name).toBe("Silambam");
    expect(
      stored?.schedules.map((slot) => slot.dayOfWeek).sort((a, b) => a - b)
    ).toEqual([1, 3]);

    await db.delete(masterClass).where(eq(masterClass.id, classId));
    const remaining = await db
      .select({ id: masterClassSchedule.id })
      .from(masterClassSchedule)
      .where(eq(masterClassSchedule.classId, classId));
    expect(remaining).toHaveLength(0);
  });

  test("refuses to delete a location referenced by a class", async () => {
    const { locationId } = await seed();

    await expectDatabaseCode(
      () => db.delete(masterLocation).where(eq(masterLocation.id, locationId)),
      "23001"
    );
  });

  test("requires a fee period with an amount", async () => {
    const { artId, locationId, profileId } = await seed();

    await expectDatabaseCode(
      () =>
        db.insert(masterClass).values({
          audience: "adults",
          feeAmount: 1500,
          level: "beginner",
          locationId,
          martialArtId: artId,
          name: "Missing period",
          profileId,
        }),
      "23514"
    );

    await expectDatabaseCode(
      () =>
        db.insert(masterClass).values({
          audience: "adults",
          feePeriod: "month",
          level: "beginner",
          locationId,
          martialArtId: artId,
          name: "Missing amount",
          profileId,
        }),
      "23514"
    );
  });

  test("rejects duplicate and invalid schedule slots", async () => {
    const { classId } = await seed();

    await expectDatabaseCode(
      () =>
        db.insert(masterClassSchedule).values({
          classId,
          dayOfWeek: 1,
          endTime: "19:00:00",
          startTime: "18:00:00",
        }),
      "23505"
    );

    await expectDatabaseCode(
      () =>
        db.insert(masterClassSchedule).values({
          classId,
          dayOfWeek: 0,
          endTime: "19:00:00",
          startTime: "18:00:00",
        }),
      "23514"
    );

    await expectDatabaseCode(
      () =>
        db.insert(masterClassSchedule).values({
          classId,
          dayOfWeek: 2,
          endTime: "18:00:00",
          startTime: "19:00:00",
        }),
      "23514"
    );
  });
});
