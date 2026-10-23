import { describe, expect, test } from "bun:test";

import { formatNextSession } from "./directory-values";

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
