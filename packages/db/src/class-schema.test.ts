import { describe, expect, test } from "bun:test";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";

import { createDb } from "./index";
import {
  CLASS_AUDIENCES,
  CLASS_FEE_PERIODS,
  CLASS_LEVELS,
  CLASS_STATUSES,
  masterClass,
  masterClassSchedule,
} from "./schema/classes";

function foreignKey(table: PgTable, column: string) {
  return getTableConfig(table).foreignKeys.find(
    (key) => key.reference().columns[0]?.name === column
  );
}

function indexFor(table: PgTable, name: string) {
  return getTableConfig(table).indexes.find(
    (entry) => entry.config.name === name
  );
}

function sqlChunk(chunk: unknown): string {
  if (typeof chunk === "string") {
    return chunk;
  }
  const value = chunk as {
    name?: string;
    queryChunks?: unknown[];
    value?: string | string[];
  };
  if (Array.isArray(value.queryChunks)) {
    return value.queryChunks.map(sqlChunk).join("");
  }
  if (Array.isArray(value.value)) {
    return value.value.join("");
  }
  if (typeof value.value === "string") {
    return value.value;
  }
  return value.name ? `"${value.name}"` : "";
}

function checkSql(table: PgTable, name: string) {
  const entry = getTableConfig(table).checks.find(
    (candidate) => candidate.name === name
  );
  return (entry?.value.queryChunks ?? []).map(sqlChunk).join("");
}

describe("class schema", () => {
  test("a class owns its profile and references a location and martial art", () => {
    for (const column of [
      masterClass.profileId,
      masterClass.martialArtId,
      masterClass.locationId,
      masterClass.name,
      masterClass.audience,
      masterClass.level,
      masterClass.status,
    ]) {
      expect(column.notNull).toBe(true);
    }

    const profile = foreignKey(masterClass, "profile_id");
    expect(profile?.onDelete).toBe("cascade");
    expect(
      getTableConfig(profile?.reference().foreignTable as PgTable).name
    ).toBe("master_profile");

    for (const [column, target] of [
      ["martial_art_id", "master_martial_art"],
      ["location_id", "master_location"],
    ] as const) {
      const reference = foreignKey(masterClass, column);
      expect(reference?.onDelete).toBe("restrict");
      expect(
        getTableConfig(reference?.reference().foreignTable as PgTable).name
      ).toBe(target);
    }

    for (const name of [
      "master_class_profile_idx",
      "master_class_martial_art_idx",
      "master_class_location_idx",
    ]) {
      expect(indexFor(masterClass, name)?.config.unique).toBe(false);
    }
  });

  test("audience, level and status reject unknown values", () => {
    const expectations = [
      ["master_class_audience_check", CLASS_AUDIENCES],
      ["master_class_level_check", CLASS_LEVELS],
      ["master_class_status_check", CLASS_STATUSES],
    ] as const;

    for (const [name, values] of expectations) {
      for (const value of values) {
        expect(checkSql(masterClass, name)).toContain(`'${value}'`);
      }
    }
    expect(masterClass.status.hasDefault).toBe(true);
    expect(checkSql(masterClass, "master_class_name_check")).toContain(
      "[^[:space:]]"
    );
  });

  test("a fee is optional only as a positive amount with a period", () => {
    expect(masterClass.feeAmount.notNull).toBe(false);
    expect(masterClass.feePeriod.notNull).toBe(false);
    expect(masterClass.feeAmount.getSQLType()).toBe("numeric(10, 2)");

    const fee = checkSql(masterClass, "master_class_fee_check");
    expect(fee).toContain("is null");
    expect(fee).toContain("> 0");
    expect(fee).toContain("is not null");
    for (const period of CLASS_FEE_PERIODS) {
      expect(checkSql(masterClass, "master_class_fee_period_check")).toContain(
        `'${period}'`
      );
    }
  });

  test("schedules cascade with the class and reject invalid slots", () => {
    expect(masterClassSchedule.dayOfWeek.notNull).toBe(true);
    expect(masterClassSchedule.startTime.notNull).toBe(true);
    expect(masterClassSchedule.endTime.notNull).toBe(true);
    expect(masterClassSchedule.startTime.getSQLType()).toBe("time(0)");
    expect(masterClassSchedule.endTime.getSQLType()).toBe("time(0)");

    const classKey = foreignKey(masterClassSchedule, "class_id");
    expect(classKey?.onDelete).toBe("cascade");
    expect(
      getTableConfig(classKey?.reference().foreignTable as PgTable).name
    ).toBe("master_class");

    expect(
      indexFor(masterClassSchedule, "master_class_schedule_slot_idx")?.config
        .unique
    ).toBe(true);
    expect(
      checkSql(masterClassSchedule, "master_class_schedule_day_check")
    ).toContain("between 1 and 7");
    expect(
      checkSql(masterClassSchedule, "master_class_schedule_time_check")
    ).toContain(">");
  });

  test("createDb lists a master's classes with schedules", () => {
    const db = createDb({
      DATABASE_URL: "postgresql://user:pass@example.neon.tech/db",
    });
    const { sql } = db.query.masterClass
      .findMany({
        with: { location: true, martialArt: true, schedules: true },
        where: { profileId: "00000000-0000-0000-0000-000000000000" },
      })
      .toSQL();

    for (const table of [
      "master_class",
      "master_location",
      "master_martial_art",
      "master_class_schedule",
    ]) {
      expect(sql).toContain(`"${table}"`);
    }
    expect(sql).toContain('"d0"."profile_id"');
    expect(sql).toContain('"d0"."location_id"');
    expect(sql).toContain('"d0"."martial_art_id"');
    expect(sql).toContain('"d1"."class_id"');
  });
});
