import { describe, expect, test } from "bun:test";

import {
  MAX_MARTIAL_ARTS,
  type ProfileChildRow,
  planProfileChildren,
  profileFormSchema,
  saveProfileInputSchema,
} from "./master-profile";

const validInput = {
  displayName: "Master Arun Vel",
  homeCity: "Chennai",
  introduction: "Traditional Silambam training.",
  locations: [{ name: "Nanganallur" }],
  martialArts: [{ name: "Silambam" }],
  yearsTeaching: 18,
};

function row(id: string, name: string, position: number): ProfileChildRow {
  return { id, name, position };
}

function parse(overrides: Record<string, unknown>) {
  return saveProfileInputSchema.safeParse({ ...validInput, ...overrides });
}

describe("planProfileChildren", () => {
  test("inserts every row when the profile is new", () => {
    expect(
      planProfileChildren([], [{ name: "Silambam" }, { name: "Karate" }])
    ).toEqual({
      deleteIds: [],
      inserts: [
        { name: "Silambam", position: 0 },
        { name: "Karate", position: 1 },
      ],
      updates: [],
    });
  });

  test("keeps ids and writes every kept row when the order changes", () => {
    const arts = [row("a", "Silambam", 0), row("b", "Karate", 1)];

    expect(
      planProfileChildren(arts, [
        { id: "b", name: "Karate" },
        { id: "a", name: "Silambam" },
      ])
    ).toEqual({
      deleteIds: [],
      inserts: [],
      updates: [
        { id: "b", name: "Karate", position: 0 },
        { id: "a", name: "Silambam", position: 1 },
      ],
    });
  });

  test("deletes rows that are no longer submitted", () => {
    const arts = [
      row("a", "Silambam", 0),
      row("b", "Karate", 1),
      row("c", "Boxing", 2),
    ];

    expect(
      planProfileChildren(arts, [
        { id: "a", name: "Silambam" },
        { id: "c", name: "Boxing" },
      ])
    ).toEqual({
      deleteIds: ["b"],
      inserts: [],
      updates: [
        { id: "a", name: "Silambam", position: 0 },
        { id: "c", name: "Boxing", position: 1 },
      ],
    });
  });

  test("treats an unknown or repeated id as a new row", () => {
    const arts = [row("a", "Silambam", 0)];

    expect(
      planProfileChildren(arts, [
        { id: "unknown", name: "Karate" },
        { id: "a", name: "Silambam" },
        { id: "a", name: "Boxing" },
      ])
    ).toEqual({
      deleteIds: [],
      inserts: [
        { name: "Karate", position: 0 },
        { name: "Boxing", position: 2 },
      ],
      updates: [{ id: "a", name: "Silambam", position: 1 }],
    });
  });
});

describe("saveProfileInputSchema", () => {
  test("trims names and turns blank optional text into null", () => {
    const result = parse({
      displayName: "  Master Arun Vel  ",
      homeCity: "   ",
      introduction: "",
      martialArts: [{ name: "  Silambam  " }],
      locations: [{ name: "  Nanganallur " }],
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.data.displayName).toBe("Master Arun Vel");
    expect(result.data.homeCity).toBeNull();
    expect(result.data.introduction).toBeNull();
    expect(result.data.martialArts[0]?.name).toBe("Silambam");
    expect(result.data.locations[0]?.name).toBe("Nanganallur");
  });

  test("names a duplicate martial art and its row", () => {
    const result = parse({
      martialArts: [{ name: "Karate" }, { name: " karate " }],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.issues[0]).toMatchObject({
      message: "Martial arts must be unique",
      path: ["martialArts", 1, "name"],
    });
  });

  test("requires a display name and at least one martial art", () => {
    expect(parse({ displayName: "   " }).success).toBe(false);
    expect(parse({ martialArts: [] }).success).toBe(false);
  });

  test("enforces the year range and the list limit", () => {
    expect(parse({ yearsTeaching: -1 }).success).toBe(false);
    expect(parse({ yearsTeaching: 1.5 }).success).toBe(false);
    expect(parse({ yearsTeaching: 101 }).success).toBe(false);
    expect(parse({ yearsTeaching: null }).success).toBe(true);

    const manyArts = Array.from(
      { length: MAX_MARTIAL_ARTS + 1 },
      (_, index) => ({
        name: `Art ${index}`,
      })
    );
    expect(parse({ martialArts: manyArts }).success).toBe(false);
  });
});

describe("profileFormSchema", () => {
  const formValues = {
    displayName: "Master Arun Vel",
    homeCity: "Chennai",
    introduction: "",
    locations: [],
    martialArts: [{ name: "Silambam" }],
    yearsTeaching: "",
  };

  test("accepts a blank year and a whole number as text", () => {
    expect(profileFormSchema.safeParse(formValues).success).toBe(true);
    expect(
      profileFormSchema.safeParse({ ...formValues, yearsTeaching: "18" })
        .success
    ).toBe(true);
  });

  test("rejects a partial number or one above 100", () => {
    for (const yearsTeaching of ["1.5", "eighteen", "-2", "101"]) {
      const result = profileFormSchema.safeParse({
        ...formValues,
        yearsTeaching,
      });
      expect(result.success).toBe(false);
    }
  });

  test("attaches a duplicate name to the row's name field", () => {
    const result = profileFormSchema.safeParse({
      ...formValues,
      locations: [{ name: "Nanganallur" }, { name: " nanganallur " }],
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.issues[0]).toMatchObject({
      message: "Locations must be unique",
      path: ["locations", 1, "name"],
    });
  });
});
