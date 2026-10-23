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
