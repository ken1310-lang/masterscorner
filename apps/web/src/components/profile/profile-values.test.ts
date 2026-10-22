import { describe, expect, test } from "bun:test";

import type { MasterProfilePayload } from "@my-better-t-app/api/master-profile";

import { initialProfileValues, profileValuesToInput } from "./profile-values";

const REVISION = "11111111-1111-4111-8111-111111111111";

const emptyPayload: MasterProfilePayload = {
  locations: [],
  martialArts: [],
  profile: null,
};

const savedPayload: MasterProfilePayload = {
  locations: [
    { id: "loc-1", name: "Nanganallur", position: 0 },
    { id: "loc-2", name: "Madipakkam", position: 1 },
  ],
  martialArts: [
    { id: "art-1", name: "Silambam", position: 0 },
    { id: "art-2", name: "Karate", position: 1 },
  ],
  profile: {
    displayName: "Master Arun Vel",
    homeCity: "Chennai",
    id: "profile-1",
    introduction: "Traditional Silambam training.",
    revision: REVISION,
    yearsTeaching: 18,
  },
};

describe("profile form values", () => {
  test("starts a new profile from the account name and one empty art", () => {
    expect(initialProfileValues("Master Arun Vel", emptyPayload)).toEqual({
      revision: null,
      displayName: "Master Arun Vel",
      homeCity: "",
      introduction: "",
      locations: [],
      martialArts: [{ name: "" }],
      yearsTeaching: "",
    });
  });

  test("keeps saved ids, order and the year as text", () => {
    expect(initialProfileValues("Account name", savedPayload)).toEqual({
      revision: REVISION,
      displayName: "Master Arun Vel",
      homeCity: "Chennai",
      introduction: "Traditional Silambam training.",
      locations: [
        { id: "loc-1", name: "Nanganallur" },
        { id: "loc-2", name: "Madipakkam" },
      ],
      martialArts: [
        { id: "art-1", name: "Silambam" },
        { id: "art-2", name: "Karate" },
      ],
      yearsTeaching: "18",
    });
  });

  test("turns a blank year into null and keeps existing row ids", () => {
    const input = profileValuesToInput({
      revision: REVISION,
      displayName: "Master Arun Vel",
      homeCity: "",
      introduction: "",
      locations: [{ id: "loc-1", name: "Nanganallur" }, { name: "Velachery" }],
      martialArts: [{ id: "art-1", name: "Silambam" }],
      yearsTeaching: "  ",
    });

    expect(input).toEqual({
      revision: REVISION,
      displayName: "Master Arun Vel",
      homeCity: "",
      introduction: "",
      locations: [{ id: "loc-1", name: "Nanganallur" }, { name: "Velachery" }],
      martialArts: [{ id: "art-1", name: "Silambam" }],
      yearsTeaching: null,
    });
  });

  test("converts a typed year to a number", () => {
    const input = profileValuesToInput({
      revision: REVISION,
      displayName: "Master Arun Vel",
      homeCity: "",
      introduction: "",
      locations: [],
      martialArts: [{ name: "Silambam" }],
      yearsTeaching: "18",
    });

    expect(input.yearsTeaching).toBe(18);
  });
});
