import { defineRelationsPart, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

/**
 * The first release has two media roles. Keep this list and the
 * `media_kind_check` constraint in sync; the type prevents a third value in
 * application code, and the check keeps it out of the database.
 */
export const MEDIA_KINDS = ["profile_photo", "site_logo"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** Constants only; this keeps the migration check in step with the type. */
const mediaKindList = sql.raw(
  MEDIA_KINDS.map((kind) => `'${kind}'`).join(", ")
);

/**
 * `user.name` belongs to the account. `displayName` is the public listing
 * name, so changing one does not silently rename the other. The first martial
 * art by `position` is the primary discipline shown on cards.
 */
export const masterProfile = pgTable(
  "master_profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name").notNull(),
    yearsTeaching: integer("years_teaching"),
    homeCity: text("home_city"),
    introduction: text("introduction"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    /** Row-level edit time; child rows carry their own timestamps. */
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    check(
      "master_profile_display_name_check",
      sql`${table.displayName} ~ '[^[:space:]]'`
    ),
    check(
      "master_profile_years_teaching_check",
      sql`${table.yearsTeaching} >= 0`
    ),
  ]
);

export const masterLocation = pgTable(
  "master_location",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => masterProfile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("master_location_profile_position_idx").on(
      table.profileId,
      table.position
    ),
    check("master_location_name_check", sql`${table.name} ~ '[^[:space:]]'`),
    check("master_location_position_check", sql`${table.position} >= 0`),
  ]
);

export const masterMartialArt = pgTable(
  "master_martial_art",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => masterProfile.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("master_martial_art_profile_name_idx").on(
      table.profileId,
      sql`lower(btrim(${table.name}))`
    ),
    uniqueIndex("master_martial_art_profile_position_idx").on(
      table.profileId,
      table.position
    ),
    check("master_martial_art_name_check", sql`${table.name} ~ '[^[:space:]]'`),
    check("master_martial_art_position_check", sql`${table.position} >= 0`),
  ]
);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => masterProfile.id, { onDelete: "cascade" }),
    kind: text("kind").$type<MediaKind>().notNull(),
    objectKey: text("object_key").notNull().unique(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("media_profile_idx").on(table.profileId),
    check("media_kind_check", sql`${table.kind} in (${mediaKindList})`),
    check("media_byte_size_check", sql`${table.byteSize} > 0`),
  ]
);

export const masterRelations = defineRelationsPart(
  { user, masterProfile, masterLocation, masterMartialArt, media },
  (r) => ({
    masterProfile: {
      user: r.one.user({
        from: r.masterProfile.userId,
        to: r.user.id,
        optional: false,
      }),
      locations: r.many.masterLocation({
        from: r.masterProfile.id,
        to: r.masterLocation.profileId,
      }),
      martialArts: r.many.masterMartialArt({
        from: r.masterProfile.id,
        to: r.masterMartialArt.profileId,
      }),
      media: r.many.media({
        from: r.masterProfile.id,
        to: r.media.profileId,
      }),
    },
    masterLocation: {
      profile: r.one.masterProfile({
        from: r.masterLocation.profileId,
        to: r.masterProfile.id,
        optional: false,
      }),
    },
    masterMartialArt: {
      profile: r.one.masterProfile({
        from: r.masterMartialArt.profileId,
        to: r.masterProfile.id,
        optional: false,
      }),
    },
    media: {
      profile: r.one.masterProfile({
        from: r.media.profileId,
        to: r.masterProfile.id,
        optional: false,
      }),
    },
  })
);
