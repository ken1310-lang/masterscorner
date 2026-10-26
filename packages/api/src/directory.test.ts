import { describe, expect, test } from "bun:test";

import {
  directoryClassFiltersSchema,
  directoryMasterFiltersSchema,
  directoryMasterProfileInputSchema,
  MAX_DIRECTORY_MARTIAL_ART_FILTER,
  masterProfileSlug,
  nextSessionStart,
  normalizeDirectoryFilter,
  profileIdFromSlug,
} from "./directory";
import { MAX_MARTIAL_ART_NAME } from "./master-profile";

const PROFILE_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("master profile slug", () => {
  test("builds a readable name with an immutable UUID suffix", () => {
    expect(masterProfileSlug("Master Arun Vel", PROFILE_ID)).toBe(
      `master-arun-vel-${PROFILE_ID}`
    );
  });

  test("strips diacritics and collapses separators", () => {
    expect(masterProfileSlug("  José   Núñez  ", PROFILE_ID)).toBe(
      `jose-nunez-${PROFILE_ID}`
    );
    expect(masterProfileSlug("Master / Arun -- Vel", PROFILE_ID)).toBe(
      `master-arun-vel-${PROFILE_ID}`
    );
  });

  test("falls back for a non-ASCII name and caps the name part", () => {
    expect(masterProfileSlug("அருண்", PROFILE_ID)).toBe(`master-${PROFILE_ID}`);
    expect(masterProfileSlug("a".repeat(80), PROFILE_ID)).toBe(
      `${"a".repeat(60)}-${PROFILE_ID}`
    );
  });

  test("does not leave a trailing hyphen after capping", () => {
    const name = `${"a".repeat(59)} b`;
    expect(masterProfileSlug(name, PROFILE_ID)).toBe(
      `${"a".repeat(59)}-${PROFILE_ID}`
    );
  });

  test("resolves bare and renamed slugs by their UUID suffix", () => {
    expect(profileIdFromSlug(PROFILE_ID)).toBe(PROFILE_ID);
    expect(profileIdFromSlug(`renamed-master-${PROFILE_ID}`)).toBe(PROFILE_ID);
    expect(profileIdFromSlug(`master-${PROFILE_ID.toUpperCase()}`)).toBe(
      PROFILE_ID
    );
  });

  test("rejects malformed slugs", () => {
    expect(profileIdFromSlug("")).toBeNull();
    expect(profileIdFromSlug("master-arun-vel")).toBeNull();
    expect(profileIdFromSlug(`master-${PROFILE_ID}-extra`)).toBeNull();
    expect(profileIdFromSlug(`master-${PROFILE_ID.slice(0, -1)}`)).toBeNull();
  });

  test("validates the public input without rejecting malformed lookups", () => {
    expect(
      directoryMasterProfileInputSchema.parse({ slug: `master-${PROFILE_ID}` })
    ).toEqual({ slug: `master-${PROFILE_ID}` });
    expect(
      directoryMasterProfileInputSchema.parse({ slug: "x".repeat(200) })
    ).toEqual({ slug: "x".repeat(200) });
    expect(() =>
      directoryMasterProfileInputSchema.parse({ slug: "" })
    ).toThrow();
    expect(() =>
      directoryMasterProfileInputSchema.parse({ slug: "x".repeat(201) })
    ).toThrow();
  });
});

const friday = new Date("2026-10-23T12:00:00.000Z"); // Fri 17:30 IST

describe("nextSessionStart", () => {
  test("uses a slot later today", () => {
    expect(
      nextSessionStart(
        [{ dayOfWeek: 5, startTime: "18:00:00" }],
        friday
      )?.toISOString()
    ).toBe("2026-10-23T12:30:00.000Z");
  });

  test("treats a slot starting now as the next session", () => {
    expect(
      nextSessionStart(
        [{ dayOfWeek: 5, startTime: "17:30:00" }],
        friday
      )?.toISOString()
    ).toBe("2026-10-23T12:00:00.000Z");
  });

  test("rolls a passed slot to next week", () => {
    expect(
      nextSessionStart(
        [{ dayOfWeek: 5, startTime: "17:29:00" }],
        friday
      )?.toISOString()
    ).toBe("2026-10-30T11:59:00.000Z");
  });

  test("rolls a passed Sunday slot to next Sunday", () => {
    const sundayNoon = new Date("2026-10-25T06:30:00.000Z"); // Sun 12:00 IST
    expect(
      nextSessionStart(
        [{ dayOfWeek: 7, startTime: "09:00:00" }],
        sundayNoon
      )?.toISOString()
    ).toBe("2026-11-01T03:30:00.000Z");
  });

  test("rolls across the week boundary", () => {
    expect(
      nextSessionStart(
        [{ dayOfWeek: 1, startTime: "09:00:00" }],
        friday
      )?.toISOString()
    ).toBe("2026-10-26T03:30:00.000Z");
  });

  test("chooses the earliest upcoming slot regardless of input order", () => {
    expect(
      nextSessionStart(
        [
          { dayOfWeek: 6, startTime: "09:00:00" },
          { dayOfWeek: 5, startTime: "18:00:00" },
        ],
        friday
      )?.toISOString()
    ).toBe("2026-10-23T12:30:00.000Z");
  });

  test("returns null without schedules", () => {
    expect(nextSessionStart([], friday)).toBeNull();
  });
});

describe("directoryClassFiltersSchema", () => {
  test("accepts empty filters", () => {
    expect(directoryClassFiltersSchema.parse(undefined)).toBeUndefined();
    expect(directoryClassFiltersSchema.parse({})).toEqual({});
  });

  test("normalizes shared names before matching", () => {
    expect(
      directoryClassFiltersSchema.parse({
        audience: "children",
        location: " Velachery ",
        martialArt: " Karate ",
      })
    ).toEqual({
      audience: "children",
      location: "velachery",
      martialArt: "karate",
    });
  });

  test("normalizes shared names for matching", () => {
    expect(normalizeDirectoryFilter("  Karate  ")).toBe("karate");
    expect(normalizeDirectoryFilter("VELACHERY")).toBe("velachery");
  });

  test("validates the normalized value against the shared limit", () => {
    const longArt = "a".repeat(120);
    expect(
      directoryClassFiltersSchema.parse({ martialArt: longArt })?.martialArt
    ).toBe(longArt);

    const expandedArt = "İ".repeat(MAX_MARTIAL_ART_NAME);
    expect(
      directoryClassFiltersSchema.parse({ martialArt: expandedArt })?.martialArt
    ).toHaveLength(MAX_DIRECTORY_MARTIAL_ART_FILTER);
    expect(() =>
      directoryClassFiltersSchema.parse({
        martialArt: "İ".repeat(MAX_MARTIAL_ART_NAME + 1),
      })
    ).toThrow();
  });

  test("rejects an unknown audience and empty names", () => {
    expect(() =>
      directoryClassFiltersSchema.parse({ audience: "teens" })
    ).toThrow();
    expect(() =>
      directoryClassFiltersSchema.parse({ martialArt: "   " })
    ).toThrow();
  });
});

describe("directoryMasterFiltersSchema", () => {
  test("normalizes names and validates the page", () => {
    expect(
      directoryMasterFiltersSchema.parse({
        location: " Velachery ",
        martialArt: " Karate ",
        page: 2,
      })
    ).toEqual({
      location: "velachery",
      martialArt: "karate",
      page: 2,
    });
    expect(directoryMasterFiltersSchema.parse({})).toEqual({});
    expect(() => directoryMasterFiltersSchema.parse({ page: 0 })).toThrow();
    expect(() => directoryMasterFiltersSchema.parse({ page: 1.5 })).toThrow();
    expect(() =>
      directoryMasterFiltersSchema.parse({ audience: "teens" })
    ).toThrow();
  });
});
