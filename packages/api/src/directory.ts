import { z } from "zod";

import {
  CLASS_AUDIENCES,
  type ClassAudience,
  type ClassFeePeriod,
  type ClassLevel,
  type ClassScheduleView,
} from "./classes";
import { MAX_LOCATION_NAME, MAX_MARTIAL_ART_NAME } from "./master-profile";

/** Paused classes are not current; full classes still run. */
export const DIRECTORY_CLASS_STATUSES = ["active", "full"] as const;
export type DirectoryClassStatus = (typeof DIRECTORY_CLASS_STATUSES)[number];

/** Matches the profile's normalized child-name uniqueness (`lower(btrim(name))`). */
export function normalizeDirectoryFilter(value: string) {
  return value.trim().toLowerCase();
}

const MAX_SLUG_NAME = 60;
const UUID_TAIL =
  /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

/**
 * A stable public identity for a profile that has no stored slug column. The
 * readable prefix follows the current display name; the UUID suffix is the
 * identity, so renamed profiles keep resolving from an older link.
 */
export function masterProfileSlug(displayName: string, id: string) {
  const name = displayName
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_NAME)
    .replace(/-+$/g, "");
  return `${name || "master"}-${id.toLowerCase()}`;
}

/** Returns the public profile UUID embedded in a slug, or null. */
export function profileIdFromSlug(slug: string) {
  return UUID_TAIL.exec(slug.trim())?.[1]?.toLowerCase() ?? null;
}

/**
 * A stored name is validated before normalization, and lowercasing can expand
 * one UTF-16 code unit into two (`İ` -> `i` + combining dot). The filter value
 * is normalized before its length is checked, so a valid maximum-length profile
 * name must remain valid at this boundary.
 */
export const MAX_DIRECTORY_MARTIAL_ART_FILTER = MAX_MARTIAL_ART_NAME * 2;
export const MAX_DIRECTORY_LOCATION_FILTER = MAX_LOCATION_NAME * 2;

export const directoryMartialArtFilterSchema = z
  .string()
  .transform(normalizeDirectoryFilter)
  .pipe(z.string().min(1).max(MAX_DIRECTORY_MARTIAL_ART_FILTER));

export const directoryLocationFilterSchema = z
  .string()
  .transform(normalizeDirectoryFilter)
  .pipe(z.string().min(1).max(MAX_DIRECTORY_LOCATION_FILTER));

export const directoryClassFiltersSchema = z
  .object({
    audience: z.enum(CLASS_AUDIENCES).optional(),
    location: directoryLocationFilterSchema.optional(),
    martialArt: directoryMartialArtFilterSchema.optional(),
  })
  .optional();

/** Six cards fill the prototype's two-column registry grid on one page. */
export const DIRECTORY_MASTER_PAGE_SIZE = 6;

export const directoryMasterFiltersSchema = z
  .object({
    audience: z.enum(CLASS_AUDIENCES).optional(),
    location: directoryLocationFilterSchema.optional(),
    martialArt: directoryMartialArtFilterSchema.optional(),
    page: z.number().int("Page must be a whole number").min(1).optional(),
  })
  .optional();

export const MAX_MASTER_PROFILE_SLUG = 200;

/** Malformed slugs reach the query and return null, so an invalid URL is a
 * normal not-found page rather than a validation error. */
export const directoryMasterProfileInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "A profile slug is required")
    .max(
      MAX_MASTER_PROFILE_SLUG,
      `A profile slug must be ${MAX_MASTER_PROFILE_SLUG} characters or fewer`
    ),
});

export interface DirectoryFilterOption {
  /** The canonical display name. */
  name: string;
  /** Normalized shared identity used by the URL and query. */
  value: string;
}

export interface DirectoryClassView {
  audience: ClassAudience;
  feeAmount: number | null;
  feePeriod: ClassFeePeriod | null;
  id: string;
  level: ClassLevel;
  location: { id: string; name: string };
  martialArt: { id: string; name: string };
  master: { displayName: string };
  name: string;
  /** ISO instant for the next weekly start in Asia/Kolkata. */
  nextSessionAt: string;
  status: DirectoryClassStatus;
}

export interface DirectoryClassesPayload {
  classes: DirectoryClassView[];
  locations: DirectoryFilterOption[];
  martialArts: DirectoryFilterOption[];
}

export interface DirectoryMasterView {
  /** Current classes only; a profile with no classes has no tags. */
  audiences: ClassAudience[];
  /** `profile.homeCity`; absent rather than inferred from a location. */
  city: string | null;
  displayName: string;
  id: string;
  /** Every martial art in profile order. */
  martialArts: string[];
  /** Stable name-plus-UUID public route segment. */
  slug: string;
  yearsTeaching: number | null;
}

export interface DirectoryMasterProfileSchedule {
  dayOfWeek: number;
  endTime: string;
  startTime: string;
}

export interface DirectoryMasterClassView {
  audience: ClassAudience;
  feeAmount: number | null;
  feePeriod: ClassFeePeriod | null;
  id: string;
  level: ClassLevel;
  location: { id: string; name: string };
  martialArt: { id: string; name: string };
  name: string;
  schedules: DirectoryMasterProfileSchedule[];
  status: DirectoryClassStatus;
}

export interface DirectoryMasterProfilePayload {
  /** Current classes only, ordered by name then id. */
  classes: DirectoryMasterClassView[];
  displayName: string;
  homeCity: string | null;
  introduction: string | null;
  /** Profile order; a location may have no current class. */
  locations: { id: string; name: string }[];
  /** Profile order. */
  martialArts: string[];
  /** Current profile photo URL, or null. */
  photoUrl: string | null;
  slug: string;
  yearsTeaching: number | null;
}

export interface DirectoryMastersPayload {
  locations: DirectoryFilterOption[];
  martialArts: DirectoryFilterOption[];
  masters: DirectoryMasterView[];
  /** Effective page after clamping to the available range. */
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const INDIA_OFFSET_MINUTES = 5 * 60 + 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const START_TIME = /^([01]\d|2[0-3]):([0-5]\d)/;

function startMinutes(value: string) {
  const match = START_TIME.exec(value);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * The next weekly start at or after the current India wall-clock minute.
 * India has no DST, so the stored wall-clock slot can be converted with a
 * fixed UTC+05:30 offset. Returning a UTC instant keeps the display independent
 * of the visitor's device timezone.
 */
export function nextSessionStart(
  schedules: readonly Pick<ClassScheduleView, "dayOfWeek" | "startTime">[],
  now: Date
): Date | null {
  const indiaNow = new Date(now.getTime() + INDIA_OFFSET_MINUTES * 60_000);
  const year = indiaNow.getUTCFullYear();
  const month = indiaNow.getUTCMonth();
  const day = indiaNow.getUTCDate();
  const currentDay = indiaNow.getUTCDay() || 7;
  const currentMinutes = indiaNow.getUTCHours() * 60 + indiaNow.getUTCMinutes();

  let earliest: number | null = null;
  for (const schedule of schedules) {
    const minutes = startMinutes(schedule.startTime);
    if (
      minutes === null ||
      !Number.isInteger(schedule.dayOfWeek) ||
      schedule.dayOfWeek < 1 ||
      schedule.dayOfWeek > 7
    ) {
      continue;
    }

    let dayOffset = (schedule.dayOfWeek - currentDay + 7) % 7;
    if (dayOffset === 0 && minutes < currentMinutes) {
      dayOffset = 7;
    }
    const instant =
      Date.UTC(year, month, day) +
      dayOffset * DAY_MS +
      (minutes - INDIA_OFFSET_MINUTES) * 60_000;
    if (earliest === null || instant < earliest) {
      earliest = instant;
    }
  }

  return earliest === null ? null : new Date(earliest);
}
