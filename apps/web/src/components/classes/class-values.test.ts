import { describe, expect, test } from "bun:test";
import type { MasterClassView } from "@my-better-t-app/api/classes";

import {
  classFormValuesToInput,
  formatFee,
  formatSchedules,
  initialClassValues,
} from "./class-values";

const ART = "11111111-1111-4111-8111-111111111111";
const LOCATION = "22222222-2222-4222-8222-222222222222";
const CLASS_ID = "33333333-3333-4333-8333-333333333333";
const options = {
  locations: [{ id: LOCATION, name: "Nanganallur" }],
  martialArts: [{ id: ART, name: "Silambam" }],
};
const art = { id: ART, name: "Silambam" };
const location = { id: LOCATION, name: "Nanganallur" };
const existing: MasterClassView = {
  audience: "adults",
  feeAmount: 1500,
  feePeriod: "month",
  id: CLASS_ID,
  level: "beginner",
  location,
  martialArt: art,
  name: "Silambam Foundation",
  schedules: [
    { dayOfWeek: 1, endTime: "19:00:00", id: "s1", startTime: "18:00:00" },
    { dayOfWeek: 3, endTime: "19:00:00", id: "s2", startTime: "18:00:00" },
  ],
  status: "active",
};

describe("class form values", () => {
  test("starts a new class from the master's first art and location", () => {
    const values = initialClassValues(null, options);
    expect(values.martialArtId).toBe(ART);
    expect(values.locationId).toBe(LOCATION);
    expect(values.status).toBe("active");
    expect(values.feeAmount).toBe("");
    expect(values.schedules).toHaveLength(1);
    expect(values.schedules[0]).toMatchObject({
      dayOfWeek: "1",
      endTime: "",
      startTime: "",
    });
    expect(values.schedules[0]?.key).toBeString();
  });

  test("round-trips an existing class into the editor", () => {
    const values = initialClassValues(existing, options);
    expect(values.id).toBe(CLASS_ID);
    expect(values.name).toBe("Silambam Foundation");
    expect(values.feeAmount).toBe("1500");
    expect(values.schedules[0]).toEqual({
      dayOfWeek: "1",
      endTime: "19:00",
      key: "s1",
      startTime: "18:00",
    });
  });

  test("converts the editor into the save contract", () => {
    const input = classFormValuesToInput({
      ...initialClassValues(existing, options),
      feeAmount: "1500.50",
      name: "  Silambam Foundations  ",
    });
    expect(input.name).toBe("Silambam Foundations");
    expect(input.feeAmount).toBe(1500.5);
    expect(input.schedules).toEqual([
      { dayOfWeek: 1, endTime: "19:00", startTime: "18:00" },
      { dayOfWeek: 3, endTime: "19:00", startTime: "18:00" },
    ]);
  });

  test("omits the id and fee for a new unpaid class", () => {
    const input = classFormValuesToInput({
      ...initialClassValues(null, options),
      name: "New class",
      schedules: [{ dayOfWeek: "1", endTime: "19:00", startTime: "18:00" }],
    });
    expect(input.id).toBeUndefined();
    expect(input.feeAmount).toBeNull();
    expect(input.feePeriod).toBeNull();
  });
});

describe("class display values", () => {
  test("formats fees and weekly slots", () => {
    expect(formatFee(1500, "month")).toBe("₹1,500/month");
    expect(formatFee(null, null)).toBe("Not set");
    expect(formatSchedules(existing.schedules)).toBe(
      "Mon 18:00–19:00 · Wed 18:00–19:00"
    );
  });
});
