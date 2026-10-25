import { defineRelationsPart } from "drizzle-orm";
import { pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { masterProfile } from "./master";

/**
 * Publication state for a master's Pro Site. The absence of a row, or a null
 * `publishedAt`, means the site is not public. Profile saves never create or
 * publish this row; Task 17 owns the write path that sets/clears it.
 */
export const proSite = pgTable("pro_site", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => masterProfile.id, { onDelete: "cascade" }),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const proSiteRelations = defineRelationsPart(
  { masterProfile, proSite },
  (r) => ({
    proSite: {
      profile: r.one.masterProfile({
        from: r.proSite.profileId,
        to: r.masterProfile.id,
        optional: false,
      }),
    },
  })
);
