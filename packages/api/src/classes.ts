import {
  CLASS_AUDIENCES,
  CLASS_FEE_PERIODS,
  CLASS_LEVELS,
  CLASS_STATUSES,
  type ClassAudience,
  type ClassFeePeriod,
  type ClassLevel,
  type ClassStatus,
} from "@my-better-t-app/db/schema/class-kinds";
import { z } from "zod";

export type {
  ClassAudience,
  ClassFeePeriod,
  ClassLevel,
  ClassStatus,
} from "@my-better-t-app/db/schema/class-kinds";
export {
  CLASS_AUDIENCES,
  CLASS_FEE_PERIODS,
  CLASS_LEVELS,
  CLASS_STATUSES,
} from "@my-better-t-app/db/schema/class-kinds";

export const MAX_CLASS_NAME = 120;
export const MAX_CLASS_SCHEDULES = 50;
/** Stored times are wall-clock HH:MM, matching the browser time input. */
export const CLASS_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const MAX_FEE_AMOUNT = 99_999_999.99;
const FEE_TEXT = /^\d+(\.\d{1,2})?$/;

const time = z
  .string()
  .regex(CLASS_TIME, "Choose a valid time in 24-hour HH:MM format");

const feeAmount = z
  .number()
  .positive("Fee must be greater than zero")
  .max(MAX_FEE_AMOUNT, "Fee is too large")
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000_001,
    "Fee can have at most two decimal places"
  )
  .nullable();

const scheduleInput = z.object({
  dayOfWeek: z
    .number()
    .int("Choose a weekday")
    .min(1, "Choose a weekday")
    .max(7, "Choose a weekday"),
  startTime: time,
  endTime: time,
});

function refineSchedules(
  schedules: readonly { dayOfWeek: number | string; startTime: string }[],
  ctx: z.RefinementCtx
) {
  const seen = new Set<string>();
  schedules.forEach((schedule, index) => {
    const key = `${schedule.dayOfWeek}:${schedule.startTime}`;
    if (seen.has(key)) {
      ctx.addIssue({
        code: "custom",
        message: "A schedule already starts at this time on this day",
        path: [index, "startTime"],
      });
      return;
    }
    seen.add(key);
  });
}

export const classSchedulesInputSchema = z
  .array(scheduleInput)
  .min(1, "Add at least one weekly schedule")
  .max(MAX_CLASS_SCHEDULES, `Add at most ${MAX_CLASS_SCHEDULES} schedules`)
  .superRefine((schedules, ctx) => {
    schedules.forEach((schedule, index) => {
      if (schedule.endTime <= schedule.startTime) {
        ctx.addIssue({
          code: "custom",
          message: "End time must be after start time",
          path: [index, "endTime"],
        });
      }
    });
    refineSchedules(schedules, ctx);
  });

/** The console save contract. Omitting `id` creates a class. */
export const saveClassInputSchema = z
  .object({
    id: z.uuid("Invalid class").optional(),
    name: z
      .string()
      .trim()
      .min(1, "Class name is required")
      .max(
        MAX_CLASS_NAME,
        `Class name must be ${MAX_CLASS_NAME} characters or fewer`
      ),
    martialArtId: z.uuid("Choose a martial art"),
    locationId: z.uuid("Choose a teaching location"),
    audience: z.enum(CLASS_AUDIENCES),
    level: z.enum(CLASS_LEVELS),
    status: z.enum(CLASS_STATUSES),
    feeAmount,
    feePeriod: z.enum(CLASS_FEE_PERIODS).nullable(),
    schedules: classSchedulesInputSchema,
  })
  .superRefine((input, ctx) => {
    if ((input.feeAmount === null) !== (input.feePeriod === null)) {
      ctx.addIssue({
        code: "custom",
        message: "Add both a fee amount and a fee period, or neither",
        path: [input.feeAmount === null ? "feeAmount" : "feePeriod"],
      });
    }
  });

export type SaveClassInput = z.infer<typeof saveClassInputSchema>;

export const setClassStatusInputSchema = z.object({
  id: z.uuid("Invalid class"),
  status: z.enum(CLASS_STATUSES),
});

export const classIdInputSchema = z.object({ id: z.uuid("Invalid class") });

/** Browser values stay as strings until the form is valid and converted. */
export const classFormSchema = z
  .object({
    id: z.uuid("Invalid class").optional(),
    name: z
      .string()
      .trim()
      .min(1, "Class name is required")
      .max(
        MAX_CLASS_NAME,
        `Class name must be ${MAX_CLASS_NAME} characters or fewer`
      ),
    martialArtId: z.string().min(1, "Choose a martial art"),
    locationId: z.string().min(1, "Choose a teaching location"),
    audience: z.enum(CLASS_AUDIENCES),
    level: z.enum(CLASS_LEVELS),
    status: z.enum(CLASS_STATUSES),
    feeAmount: z
      .string()
      .trim()
      .refine(
        (value) =>
          value === "" ||
          (FEE_TEXT.test(value) &&
            Number(value) > 0 &&
            Number(value) <= MAX_FEE_AMOUNT),
        "Enter an amount greater than zero with up to two decimals"
      ),
    feePeriod: z.union([z.literal(""), z.enum(CLASS_FEE_PERIODS)]),
    schedules: z
      .array(
        z.object({
          dayOfWeek: z.string().regex(/^[1-7]$/, "Choose a weekday"),
          startTime: time,
          endTime: time,
        })
      )
      .min(1, "Add at least one weekly schedule")
      .max(MAX_CLASS_SCHEDULES, `Add at most ${MAX_CLASS_SCHEDULES} schedules`)
      .superRefine((schedules, ctx) => {
        schedules.forEach((schedule, index) => {
          if (schedule.endTime <= schedule.startTime) {
            ctx.addIssue({
              code: "custom",
              message: "End time must be after start time",
              path: [index, "endTime"],
            });
          }
        });
        refineSchedules(schedules, ctx);
      }),
  })
  .superRefine((input, ctx) => {
    if ((input.feeAmount === "") !== (input.feePeriod === "")) {
      ctx.addIssue({
        code: "custom",
        message: "Add both a fee amount and a fee period, or neither",
        path: [input.feeAmount === "" ? "feeAmount" : "feePeriod"],
      });
    }
  });

export interface ClassFormSchedule {
  dayOfWeek: string;
  endTime: string;
  key?: string;
  startTime: string;
}

export interface ClassFormValues {
  audience: ClassAudience;
  feeAmount: string;
  feePeriod: ClassFeePeriod | "";
  id?: string;
  level: ClassLevel;
  locationId: string;
  martialArtId: string;
  name: string;
  schedules: ClassFormSchedule[];
  status: ClassStatus;
}

export interface ClassOption {
  id: string;
  name: string;
}

export interface ClassScheduleView {
  dayOfWeek: number;
  endTime: string;
  id: string;
  startTime: string;
}

export interface MasterClassView {
  audience: ClassAudience;
  feeAmount: number | null;
  feePeriod: ClassFeePeriod | null;
  id: string;
  level: ClassLevel;
  location: ClassOption;
  martialArt: ClassOption;
  name: string;
  schedules: ClassScheduleView[];
  status: ClassStatus;
}

export interface ClassesPayload {
  classes: MasterClassView[];
  locations: ClassOption[];
  martialArts: ClassOption[];
}

/** Time columns come back with seconds; the browser control uses HH:MM. */
export function toTimeInput(value: string) {
  return value.slice(0, 5);
}
