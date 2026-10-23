/**
 * Dependency-free class vocabulary shared by the database schema and the API.
 *
 * Keep this file free of imports so the browser bundle can read the lists
 * without pulling Drizzle or the schema tables into the client.
 */
export const CLASS_AUDIENCES = ["children", "adults", "all"] as const;
export type ClassAudience = (typeof CLASS_AUDIENCES)[number];

export const CLASS_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "all",
] as const;
export type ClassLevel = (typeof CLASS_LEVELS)[number];

export const CLASS_STATUSES = ["active", "paused", "full"] as const;
export type ClassStatus = (typeof CLASS_STATUSES)[number];

/** The statuses a paused class can resume to. */
export const CLASS_RESUMABLE_STATUSES = ["active", "full"] as const;
export type ResumableClassStatus = (typeof CLASS_RESUMABLE_STATUSES)[number];

export const CLASS_FEE_PERIODS = ["session", "week", "month", "term"] as const;
export type ClassFeePeriod = (typeof CLASS_FEE_PERIODS)[number];
