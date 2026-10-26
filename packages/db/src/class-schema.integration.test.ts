import { afterEach, describe, expect, test } from "bun:test";
import { Pool, type PoolClient } from "@neondatabase/serverless";
import { eq, sql } from "drizzle-orm";

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

  async function timestamps(classId: string, profileId: string) {
    const classRow = first(
      await db
        .select({ updatedAt: masterClass.updatedAt })
        .from(masterClass)
        .where(eq(masterClass.id, classId))
    );
    const profileRow = first(
      await db
        .select({ updatedAt: masterProfile.updatedAt })
        .from(masterProfile)
        .where(eq(masterProfile.id, profileId))
    );
    return {
      classUpdatedAt: classRow.updatedAt,
      profileUpdatedAt: profileRow.updatedAt,
    };
  }

  async function resetActivity(classId: string, profileId: string) {
    const past = "2000-01-01T00:00:00.000Z";
    await db.execute(
      sql`update ${masterClass} set updated_at = ${past} where id = ${classId}`
    );
    await db.execute(
      sql`update ${masterProfile} set updated_at = ${past} where id = ${profileId}`
    );
  }

  async function waitForLockWait(
    client: PoolClient,
    pid: number,
    attempt = 0
  ): Promise<void> {
    const { rows } = await client.query(
      "select 1 from pg_locks where pid = $1 and not granted limit 1",
      [pid]
    );
    if (rows.length > 0) {
      return;
    }
    if (attempt >= 200) {
      throw new Error(`Database backend ${pid} never waited for a class lock`);
    }
    return waitForLockWait(client, pid, attempt + 1);
  }

  afterEach(async () => {
    await Promise.all(
      createdUsers
        .splice(0)
        .map((userId) => db.delete(user).where(eq(user.id, userId)))
    );
  });

  test("class and schedule changes advance profile activity", async () => {
    const { classId, profileId } = await seed();
    await resetActivity(classId, profileId);
    const before = await timestamps(classId, profileId);

    await db
      .update(masterClass)
      .set({ name: "Silambam Foundation Renamed" })
      .where(eq(masterClass.id, classId));

    const afterClassEdit = await timestamps(classId, profileId);
    expect(afterClassEdit.classUpdatedAt.getTime()).toBeGreaterThan(
      before.classUpdatedAt.getTime()
    );
    expect(afterClassEdit.profileUpdatedAt.getTime()).toBeGreaterThan(
      before.profileUpdatedAt.getTime()
    );

    await resetActivity(classId, profileId);
    const beforeSchedule = await timestamps(classId, profileId);
    const insertedSchedule = first(
      await db
        .insert(masterClassSchedule)
        .values({
          classId,
          dayOfWeek: 2,
          endTime: "18:00:00",
          startTime: "17:00:00",
        })
        .returning({ id: masterClassSchedule.id })
    );

    const afterScheduleEdit = await timestamps(classId, profileId);
    expect(afterScheduleEdit.classUpdatedAt.getTime()).toBeGreaterThan(
      beforeSchedule.classUpdatedAt.getTime()
    );
    expect(afterScheduleEdit.profileUpdatedAt.getTime()).toBeGreaterThan(
      beforeSchedule.profileUpdatedAt.getTime()
    );

    await resetActivity(classId, profileId);
    const beforeScheduleDelete = await timestamps(classId, profileId);
    await db
      .delete(masterClassSchedule)
      .where(eq(masterClassSchedule.id, insertedSchedule.id));

    const afterScheduleDelete = await timestamps(classId, profileId);
    expect(afterScheduleDelete.classUpdatedAt.getTime()).toBeGreaterThan(
      beforeScheduleDelete.classUpdatedAt.getTime()
    );
    expect(afterScheduleDelete.profileUpdatedAt.getTime()).toBeGreaterThan(
      beforeScheduleDelete.profileUpdatedAt.getTime()
    );
  });

  test("class inserts and deletes advance profile activity", async () => {
    const { artId, classId, locationId, profileId } = await seed();
    await resetActivity(classId, profileId);
    const beforeInsert = await timestamps(classId, profileId);
    const insertedClass = first(
      await db
        .insert(masterClass)
        .values({
          audience: "adults",
          level: "beginner",
          locationId,
          martialArtId: artId,
          name: "Second activity class",
          profileId,
        })
        .returning({ id: masterClass.id })
    );

    const afterInsert = await timestamps(classId, profileId);
    expect(afterInsert.profileUpdatedAt.getTime()).toBeGreaterThan(
      beforeInsert.profileUpdatedAt.getTime()
    );

    await resetActivity(classId, profileId);
    const beforeDelete = await timestamps(classId, profileId);
    await db.delete(masterClass).where(eq(masterClass.id, insertedClass.id));

    const afterDelete = await timestamps(classId, profileId);
    expect(afterDelete.profileUpdatedAt.getTime()).toBeGreaterThan(
      beforeDelete.profileUpdatedAt.getTime()
    );
  });

  test("opposite schedule moves do not deadlock", async () => {
    const {
      artId,
      classId: seededClassId,
      locationId,
      profileId,
    } = await seed();
    const secondClass = first(
      await db
        .insert(masterClass)
        .values({
          audience: "adults",
          level: "beginner",
          locationId,
          martialArtId: artId,
          name: "Second class",
          profileId,
        })
        .returning({ id: masterClass.id })
    );
    const [lowClassId, highClassId] =
      seededClassId < secondClass.id
        ? [seededClassId, secondClass.id]
        : [secondClass.id, seededClassId];

    const lowSchedule = first(
      await db
        .insert(masterClassSchedule)
        .values({
          classId: lowClassId,
          dayOfWeek: 5,
          endTime: "09:00:00",
          startTime: "08:00:00",
        })
        .returning({ id: masterClassSchedule.id })
    );
    const highSchedule = first(
      await db
        .insert(masterClassSchedule)
        .values({
          classId: highClassId,
          dayOfWeek: 6,
          endTime: "09:00:00",
          startTime: "08:00:00",
        })
        .returning({ id: masterClassSchedule.id })
    );

    const pool = new Pool({ connectionString: databaseUrl ?? "", max: 4 });
    const blocker = await pool.connect();
    const highToLow = await pool.connect();
    const lowToHigh = await pool.connect();

    try {
      // Hold the low class so both moves queue there first. The high-to-low
      // move must reach the queue before the low-to-high move for the old
      // new-then-old trigger order to form its cycle.
      await blocker.query("BEGIN");
      await blocker.query(
        "SELECT 1 FROM master_class WHERE id = $1 FOR NO KEY UPDATE",
        [lowClassId]
      );

      await highToLow.query("BEGIN");
      const highToLowPid = first(
        (await highToLow.query("select pg_backend_pid() as pid")).rows
      ).pid as number;
      const highToLowMove = highToLow.query(
        "UPDATE master_class_schedule SET class_id = $1 WHERE id = $2",
        [lowClassId, highSchedule.id]
      );
      await waitForLockWait(blocker, highToLowPid);

      await lowToHigh.query("BEGIN");
      const lowToHighPid = first(
        (await lowToHigh.query("select pg_backend_pid() as pid")).rows
      ).pid as number;
      const lowToHighMove = lowToHigh.query(
        "UPDATE master_class_schedule SET class_id = $1 WHERE id = $2",
        [highClassId, lowSchedule.id]
      );
      await waitForLockWait(blocker, lowToHighPid);

      await blocker.query("COMMIT");

      const moveAndCommit = async (
        client: PoolClient,
        move: Promise<unknown>
      ) => {
        await move;
        await client.query("COMMIT");
      };
      const results = await Promise.allSettled([
        moveAndCommit(highToLow, highToLowMove),
        moveAndCommit(lowToHigh, lowToHighMove),
      ]);
      expect(results.map((result) => result.status)).toEqual([
        "fulfilled",
        "fulfilled",
      ]);

      const movedLowSchedule = first(
        await db
          .select({ classId: masterClassSchedule.classId })
          .from(masterClassSchedule)
          .where(eq(masterClassSchedule.id, lowSchedule.id))
      );
      const movedHighSchedule = first(
        await db
          .select({ classId: masterClassSchedule.classId })
          .from(masterClassSchedule)
          .where(eq(masterClassSchedule.id, highSchedule.id))
      );
      expect(movedLowSchedule.classId).toBe(highClassId);
      expect(movedHighSchedule.classId).toBe(lowClassId);
    } finally {
      await Promise.allSettled([
        blocker.query("ROLLBACK"),
        highToLow.query("ROLLBACK"),
        lowToHigh.query("ROLLBACK"),
      ]);
      blocker.release();
      highToLow.release();
      lowToHigh.release();
      await pool.end();
    }
  }, 30_000);

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
