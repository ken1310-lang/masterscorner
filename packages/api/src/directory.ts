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

const sharedFilter = z.string().trim().min(1);

export const directoryClassFiltersSchema = z
  .object({
    audience: z.enum(CLASS_AUDIENCES).optional(),
    location: sharedFilter.max(MAX_LOCATION_NAME).optional(),
    martialArt: sharedFilter.max(MAX_MARTIAL_ART_NAME).optional(),
  })
  .optional();

/** Matches the profile's normalized child-name uniqueness (`lower(btrim(name))`). */
export function normalizeDirectoryFilter(value: string) {
  return value.trim().toLowerCase();
}

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
