import { defineRelationsPart, sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { masterProfile } from "./master";
import {
  DEFAULT_PRO_SITE_STYLE,
  PRO_SITE_STYLES,
  type ProSiteStyle,
} from "./pro-site-kinds";

const styleList = sql.raw(
  PRO_SITE_STYLES.map((style) => `'${style}'`).join(", ")
);

/**
 * Publication and supported branding state for a master's Pro Site. The
 * absence of a row, or a null `publishedAt`, means the site is not public.
 * Profile saves never create or publish this row; Task 17 owns the settings and
 * publication writes.
 */
export const proSite = pgTable(
  "pro_site",
  {
    profileId: uuid("profile_id")
      .primaryKey()
      .references(() => masterProfile.id, { onDelete: "cascade" }),
    publishedAt: timestamp("published_at"),
    /** Null means the public site uses `master_profile.display_name`. */
    siteName: text("site_name"),
    style: text("style")
      .$type<ProSiteStyle>()
      .default(DEFAULT_PRO_SITE_STYLE)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    check(
      "pro_site_site_name_check",
      sql`${table.siteName} is null or ${table.siteName} ~ '[^[:space:]]'`
    ),
    check("pro_site_style_check", sql`${table.style} in (${styleList})`),
  ]
);

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
