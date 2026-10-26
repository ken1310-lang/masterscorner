/**
 * Dependency-free media kinds shared by the database schema and the API.
 *
 * This file exists as its own module so the browser bundle can read the list
 * without pulling Drizzle or the schema tables into the client. Keep it free of
 * imports. `master.ts` derives the database check from this list.
 */
export const MEDIA_KINDS = ["profile_photo", "site_logo"] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];
