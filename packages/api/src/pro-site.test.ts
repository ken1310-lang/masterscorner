import { describe, expect, test } from "bun:test";

import type { ProSitePayload } from "./pro-site";
import { proSiteAddress, visibleProSiteSections } from "./pro-site";

function payload(overrides: Partial<ProSitePayload> = {}): ProSitePayload {
  return {
    classes: [
      {
        audience: "adults",
        feeAmount: null,
        feePeriod: null,
        id: "class-1",
        level: "beginner",
        location: { id: "location-1", name: "Velachery" },
        martialArt: { id: "art-1", name: "Silambam" },
        name: "Foundation",
        schedules: [{ dayOfWeek: 1, endTime: "19:00", startTime: "18:00" }],
        status: "active",
      },
    ],
    displayName: "Arun Vel",
    homeCity: "Chennai",
    introduction: "Traditional Silambam.",
    locations: [{ id: "location-1", name: "Velachery" }],
    logoUrl: null,
    martialArts: ["Silambam"],
    photoUrl: null,
    slug: "arun-vel-00000000-0000-0000-0000-000000000001",
    yearsTeaching: 18,
    ...overrides,
  };
}

describe("Pro Site contract", () => {
  test("builds the path address", () => {
    expect(proSiteAddress("arun-vel-abc")).toBe("/pro/arun-vel-abc");
  });

  test("shows every section with stored content", () => {
    expect(visibleProSiteSections(payload())).toEqual({
      about: true,
      contact: true,
      programs: true,
      schedule: true,
    });
  });

  test("omits blank about copy and empty programs or schedule", () => {
    expect(
      visibleProSiteSections(payload({ classes: [], introduction: "   " }))
    ).toEqual({
      about: false,
      contact: true,
      programs: false,
      schedule: false,
    });
  });

  test("keeps contact for a city-only site", () => {
    expect(
      visibleProSiteSections(
        payload({ classes: [], introduction: null, locations: [] })
      )
    ).toEqual({
      about: false,
      contact: true,
      programs: false,
      schedule: false,
    });
  });

  test("requires a stored slot for schedule", () => {
    const [item] = payload().classes;
    if (!item) {
      throw new Error("Fixture class was missing");
    }
    expect(
      visibleProSiteSections(payload({ classes: [{ ...item, schedules: [] }] }))
        .schedule
    ).toBe(false);
  });

  test("omits contact when neither city nor locations exist", () => {
    expect(
      visibleProSiteSections(payload({ homeCity: " ", locations: [] })).contact
    ).toBe(false);
  });
});
