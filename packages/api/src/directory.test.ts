import { describe, expect, test } from "bun:test";

import { directoryClassFiltersSchema, nextSessionStart } from "./directory";

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

  test("accepts a valid audience and ids", () => {
    expect(
      directoryClassFiltersSchema.parse({
        audience: "children",
        locationId: "f9f7c6b0-4e7b-4e0a-8d62-5d3f8a3f2b1a",
        martialArtId: "0e5a2f4c-6b30-4e89-9c50-8e8a7f6d5c4b",
      })
    ).toEqual({
      audience: "children",
      locationId: "f9f7c6b0-4e7b-4e0a-8d62-5d3f8a3f2b1a",
      martialArtId: "0e5a2f4c-6b30-4e89-9c50-8e8a7f6d5c4b",
    });
  });

  test("rejects an unknown audience and malformed ids", () => {
    expect(() =>
      directoryClassFiltersSchema.parse({ audience: "teens" })
    ).toThrow();
    expect(() =>
      directoryClassFiltersSchema.parse({ martialArtId: "not-a-uuid" })
    ).toThrow();
  });
});
