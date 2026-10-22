import { z } from "zod";

export const MAX_DISPLAY_NAME = 120;
export const MAX_CITY = 120;
export const MAX_INTRODUCTION = 2000;
export const MAX_MARTIAL_ART_NAME = 80;
export const MAX_LOCATION_NAME = 120;
export const MAX_MARTIAL_ARTS = 10;
export const MAX_LOCATIONS = 20;

const WHOLE_NUMBER = /^\d+$/;

function requiredName(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`);
}

function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`)
    .nullable()
    .transform((value) => (value ? value : null));
}

function formText(label: string, max: number) {
  return z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer`);
}

function refineUniqueNames(
  items: readonly { name: string }[],
  ctx: z.RefinementCtx,
  label: string
) {
  const seen = new Set<string>();
  items.forEach((item, index) => {
    const key = item.name.trim().toLowerCase();
    if (!key) {
      return;
    }
    if (seen.has(key)) {
      ctx.addIssue({
        code: "custom",
        message: `${label} must be unique`,
        path: [index, "name"],
      });
      return;
    }
    seen.add(key);
  });
}

const childSchema = (label: string, max: number) =>
  z.object({
    id: z.uuid().optional(),
    name: requiredName(label, max),
  });

/**
 * The save contract. `yearsTeaching` is a number or null; optional text is a
 * trimmed string or null. Children keep their ids so an edit never replaces a
 * location a class may already reference.
 */
export const saveProfileInputSchema = z.object({
  revision: z.uuid("Invalid profile revision").nullable(),
  displayName: requiredName("Display name", MAX_DISPLAY_NAME),
  yearsTeaching: z
    .number()
    .int("Years teaching must be a whole number")
    .min(0, "Years teaching cannot be negative")
    .max(100, "Years teaching must be 100 or fewer")
    .nullable(),
  homeCity: optionalText("Home city", MAX_CITY),
  introduction: optionalText("Introduction", MAX_INTRODUCTION),
  martialArts: z
    .array(childSchema("Martial art", MAX_MARTIAL_ART_NAME))
    .min(1, "Add at least one martial art")
    .max(MAX_MARTIAL_ARTS, `Add at most ${MAX_MARTIAL_ARTS} martial arts`)
    .superRefine((items, ctx) => refineUniqueNames(items, ctx, "Martial arts")),
  locations: z
    .array(childSchema("Location", MAX_LOCATION_NAME))
    .max(MAX_LOCATIONS, `Add at most ${MAX_LOCATIONS} locations`)
    .superRefine((items, ctx) => refineUniqueNames(items, ctx, "Locations")),
});

/** The browser form keeps the year as typed text and validates it here. */
export const profileFormSchema = z.object({
  revision: z.uuid("Invalid profile revision").nullable(),
  displayName: requiredName("Display name", MAX_DISPLAY_NAME),
  yearsTeaching: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || WHOLE_NUMBER.test(value),
      "Years teaching must be a whole number"
    )
    .refine(
      (value) => value === "" || Number(value) <= 100,
      "Years teaching must be 100 or fewer"
    ),
  homeCity: formText("Home city", MAX_CITY),
  introduction: formText("Introduction", MAX_INTRODUCTION),
  martialArts: z
    .array(childSchema("Martial art", MAX_MARTIAL_ART_NAME))
    .min(1, "Add at least one martial art")
    .max(MAX_MARTIAL_ARTS, `Add at most ${MAX_MARTIAL_ARTS} martial arts`)
    .superRefine((items, ctx) => refineUniqueNames(items, ctx, "Martial arts")),
  locations: z
    .array(childSchema("Location", MAX_LOCATION_NAME))
    .max(MAX_LOCATIONS, `Add at most ${MAX_LOCATIONS} locations`)
    .superRefine((items, ctx) => refineUniqueNames(items, ctx, "Locations")),
});

export interface ProfileChildRow {
  id: string;
  name: string;
  position: number;
}

export interface ProfileChildInput {
  id?: string;
  name: string;
}

export interface ProfileChildWritePlan {
  deleteIds: string[];
  inserts: { name: string; position: number }[];
  updates: { id: string; name: string; position: number }[];
}

/**
 * Reconciles the ordered child rows with the submitted list. Ids that do not
 * belong to the profile are treated as new rows, so a forged id cannot update
 * another master's data; the caller still scopes every statement by profile.
 */
export function planProfileChildren(
  existing: readonly ProfileChildRow[],
  desired: readonly ProfileChildInput[]
): ProfileChildWritePlan {
  const rowsByid = new Map(existing.map((row) => [row.id, row]));
  const claimedIds = new Set<string>();
  const updates: ProfileChildWritePlan["updates"] = [];
  const inserts: ProfileChildWritePlan["inserts"] = [];

  desired.forEach((item, position) => {
    const match = item.id ? rowsByid.get(item.id) : undefined;
    if (match && !claimedIds.has(match.id)) {
      claimedIds.add(match.id);
      updates.push({ id: match.id, name: item.name, position });
      return;
    }
    inserts.push({ name: item.name, position });
  });

  return {
    deleteIds: existing
      .filter((row) => !claimedIds.has(row.id))
      .map((row) => row.id),
    inserts,
    updates,
  };
}

export interface MasterProfileSummary {
  displayName: string;
  homeCity: string | null;
  id: string;
  introduction: string | null;
  revision: string;
  yearsTeaching: number | null;
}

export interface MasterProfileChild {
  id: string;
  name: string;
  position: number;
}

export interface MasterProfilePayload {
  locations: MasterProfileChild[];
  martialArts: MasterProfileChild[];
  profile: MasterProfileSummary | null;
}
