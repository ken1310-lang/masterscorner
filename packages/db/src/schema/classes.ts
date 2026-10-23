import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  CLASS_AUDIENCES,
  CLASS_FEE_PERIODS,
  CLASS_LEVELS,
  CLASS_STATUSES,
  type ClassAudience,
  type ClassFeePeriod,
  type ClassLevel,
  type ClassStatus,
} from "./class-kinds";
import { masterLocation, masterMartialArt, masterProfile } from "./master";

export {
  CLASS_AUDIENCES,
  CLASS_FEE_PERIODS,
  CLASS_LEVELS,
  CLASS_STATUSES,
  type ClassAudience,
  type ClassFeePeriod,
  type ClassLevel,
  type ClassStatus,
} from "./class-kinds";

/** Constants only; this keeps the migration check in step with the types. */
function quotedList(values: readonly string[]) {
  return sql.raw(values.map((value) => `'${value}'`).join(", "));
}

const audienceList = quotedList(CLASS_AUDIENCES);
const levelList = quotedList(CLASS_LEVELS);
const statusList = quotedList(CLASS_STATUSES);
const feePeriodList = quotedList(CLASS_FEE_PERIODS);

/**
 * A class belongs to one master profile and points at that master's location
 * and martial art. Referenced children cannot be deleted while a class uses
 * them, so a profile save cannot orphan a public listing.
 */
export const masterClass = pgTable(
  "master_class",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => masterProfile.id, { onDelete: "cascade" }),
    martialArtId: uuid("martial_art_id")
      .notNull()
      .references(() => masterMartialArt.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => masterLocation.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    audience: text("audience").$type<ClassAudience>().notNull(),
    level: text("level").$type<ClassLevel>().notNull(),
    status: text("status").$type<ClassStatus>().default("active").notNull(),
    /** Exact INR amount with two decimal places; null means no fee is shown. */
    feeAmount: numeric("fee_amount", {
      mode: "number",
      precision: 10,
      scale: 2,
    }),
    feePeriod: text("fee_period").$type<ClassFeePeriod>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /**
     * Class activity time. Direct edits and schedule inserts, updates and
     * deletes advance it in the database; the class trigger advances the
     * owning profile in the same transaction.
     */
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("master_class_profile_idx").on(table.profileId),
    index("master_class_martial_art_idx").on(table.martialArtId),
    index("master_class_location_idx").on(table.locationId),
    check("master_class_name_check", sql`${table.name} ~ '[^[:space:]]'`),
    check(
      "master_class_audience_check",
      sql`${table.audience} in (${audienceList})`
    ),
    check("master_class_level_check", sql`${table.level} in (${levelList})`),
    check("master_class_status_check", sql`${table.status} in (${statusList})`),
    check(
      "master_class_fee_check",
      sql`(
        (${table.feeAmount} is null and ${table.feePeriod} is null)
        or (
          ${table.feeAmount} is not null
          and ${table.feeAmount} > 0
          and ${table.feePeriod} is not null
        )
      )`
    ),
    check(
      "master_class_fee_period_check",
      sql`${table.feePeriod} is null or ${table.feePeriod} in (${feePeriodList})`
    ),
  ]
);

/**
 * Weekly wall-clock slots. ISO weekdays keep 1 = Monday through 7 = Sunday;
 * classes in the first release are India-only, so no per-row timezone exists.
 */
export const masterClassSchedule = pgTable(
  "master_class_schedule",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    classId: uuid("class_id")
      .notNull()
      .references(() => masterClass.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: time("start_time", { precision: 0 }).notNull(),
    endTime: time("end_time", { precision: 0 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("master_class_schedule_slot_idx").on(
      table.classId,
      table.dayOfWeek,
      table.startTime
    ),
    check(
      "master_class_schedule_day_check",
      sql`${table.dayOfWeek} between 1 and 7`
    ),
    check(
      "master_class_schedule_time_check",
      sql`${table.endTime} > ${table.startTime}`
    ),
  ]
);

export const classRelations = defineRelationsPart(
  {
    masterClass,
    masterClassSchedule,
    masterLocation,
    masterMartialArt,
    masterProfile,
  },
  (r) => ({
    masterClass: {
      profile: r.one.masterProfile({
        from: r.masterClass.profileId,
        to: r.masterProfile.id,
        optional: false,
      }),
      martialArt: r.one.masterMartialArt({
        from: r.masterClass.martialArtId,
        to: r.masterMartialArt.id,
        optional: false,
      }),
      location: r.one.masterLocation({
        from: r.masterClass.locationId,
        to: r.masterLocation.id,
        optional: false,
      }),
      schedules: r.many.masterClassSchedule({
        from: r.masterClass.id,
        to: r.masterClassSchedule.classId,
      }),
    },
    masterClassSchedule: {
      masterClass: r.one.masterClass({
        from: r.masterClassSchedule.classId,
        to: r.masterClass.id,
        optional: false,
      }),
    },
  })
);
