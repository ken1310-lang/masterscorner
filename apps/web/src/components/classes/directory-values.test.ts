import { describe, expect, test } from "bun:test";

import {
  formatNextSession,
  nextSessionRefetchInterval,
} from "./directory-values";

describe("formatNextSession", () => {
  test("renders the India wall clock, not the device timezone", () => {
    expect(formatNextSession("2026-10-23T12:30:00.000Z")).toBe("Fri 6:00 pm");
    expect(formatNextSession("2026-10-26T03:30:00.000Z")).toBe("Mon 9:00 am");
  });

  test("keeps midnight and noon readable", () => {
    expect(formatNextSession("2026-10-24T18:30:00.000Z")).toBe("Sun 12:00 am");
    expect(formatNextSession("2026-10-25T06:30:00.000Z")).toBe("Sun 12:00 pm");
  });

  test("does not invent a time for an invalid instant", () => {
    expect(formatNextSession("not-a-date")).toBe("Schedule unavailable");
  });
});

describe("nextSessionRefetchInterval", () => {
  const now = Date.parse("2026-10-23T00:00:00.000Z");

  test("refreshes just after the nearest next session", () => {
    expect(
      nextSessionRefetchInterval(
        {
          classes: [
            { nextSessionAt: "2026-10-23T00:10:00.000Z" },
            { nextSessionAt: "2026-10-23T00:05:00.000Z" },
          ],
        },
        now
      )
    ).toBe(301_000);
  });

  test("refreshes soon when the nearest cached slot has already passed", () => {
    expect(
      nextSessionRefetchInterval(
        { classes: [{ nextSessionAt: "2026-10-22T23:59:00.000Z" }] },
        now
      )
    ).toBe(1000);
  });

  test("does not poll an empty or invalid page", () => {
    expect(nextSessionRefetchInterval(undefined, now)).toBe(false);
    expect(nextSessionRefetchInterval({ classes: [] }, now)).toBe(false);
    expect(
      nextSessionRefetchInterval(
        { classes: [{ nextSessionAt: "not-a-date" }] },
        now
      )
    ).toBe(false);
  });
});
