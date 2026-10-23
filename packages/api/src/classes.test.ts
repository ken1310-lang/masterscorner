import { describe, expect, test } from "bun:test";

import {
  classFormSchema,
  type SaveClassInput,
  saveClassInputSchema,
} from "./classes";

const ART = "11111111-1111-4111-8111-111111111111";
const LOCATION = "22222222-2222-4222-8222-222222222222";

function validInput(overrides: Partial<SaveClassInput> = {}): SaveClassInput {
  return {
    audience: "adults",
    feeAmount: 1500,
    feePeriod: "month",
    level: "beginner",
    locationId: LOCATION,
    martialArtId: ART,
    name: "Silambam Foundation",
    schedules: [
      { dayOfWeek: 1, endTime: "19:00", startTime: "18:00" },
      { dayOfWeek: 3, endTime: "19:00", startTime: "18:00" },
    ],
    status: "active",
    ...overrides,
  };
}

function issues(input: unknown) {
  const result = saveClassInputSchema.safeParse(input);
  if (result.success) {
    throw new Error("Expected the input to be rejected");
  }
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("class save contract", () => {
  test("accepts a class with an exact fee and weekly schedule", () => {
    const result = saveClassInputSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  test("requires at least one schedule", () => {
    expect(issues(validInput({ schedules: [] }))).toContain("schedules");
  });

  test("requires each schedule to end after it starts", () => {
    expect(
      issues(
        validInput({
          schedules: [{ dayOfWeek: 2, endTime: "18:00", startTime: "18:00" }],
        })
      )
    ).toContain("schedules.0.endTime");
  });

  test("rejects duplicate day and start times", () => {
    expect(
      issues(
        validInput({
          schedules: [
            { dayOfWeek: 1, endTime: "19:00", startTime: "18:00" },
            { dayOfWeek: 1, endTime: "20:00", startTime: "18:00" },
          ],
        })
      )
    ).toContain("schedules.1.startTime");
  });

  test("requires the fee amount and period together", () => {
    expect(issues(validInput({ feePeriod: null }))).toContain("feePeriod");
    expect(issues(validInput({ feeAmount: null }))).toContain("feeAmount");
    expect(
      saveClassInputSchema.safeParse(
        validInput({ feeAmount: null, feePeriod: null })
      ).success
    ).toBe(true);
  });

  test("rejects zero, oversized and sub-paisa fees", () => {
    expect(issues(validInput({ feeAmount: 0 }))).toContain("feeAmount");
    expect(issues(validInput({ feeAmount: 100_000_000 }))).toContain(
      "feeAmount"
    );
    expect(issues(validInput({ feeAmount: 12.345 }))).toContain("feeAmount");
  });

  test("rejects a blank class name", () => {
    expect(issues(validInput({ name: "   " }))).toContain("name");
  });

  test("rejects a weekday outside the ISO range", () => {
    expect(
      issues(
        validInput({
          schedules: [{ dayOfWeek: 8, startTime: "18:00", endTime: "19:00" }],
        })
      )
    ).toContain("schedules.0.dayOfWeek");
  });
});

describe("class form contract", () => {
  const validForm = {
    audience: "adults" as const,
    feeAmount: "1500.50",
    feePeriod: "month" as const,
    level: "beginner" as const,
    locationId: LOCATION,
    martialArtId: ART,
    name: "Silambam Foundation",
    schedules: [{ dayOfWeek: "1", endTime: "19:00", startTime: "18:00" }],
    status: "active" as const,
  };

  test("accepts browser values and catches paired fee omissions", () => {
    expect(classFormSchema.safeParse(validForm).success).toBe(true);
    const missingPeriod = classFormSchema.safeParse({
      ...validForm,
      feePeriod: "",
    });
    expect(missingPeriod.success).toBe(false);
    if (!missingPeriod.success) {
      expect(
        missingPeriod.error.issues.map((issue) => issue.path.join("."))
      ).toContain("feePeriod");
    }
    const missingAmount = classFormSchema.safeParse({
      ...validForm,
      feeAmount: "",
    });
    expect(missingAmount.success).toBe(false);
    if (!missingAmount.success) {
      expect(
        missingAmount.error.issues.map((issue) => issue.path.join("."))
      ).toContain("feeAmount");
    }
  });

  test("rejects malformed fee text", () => {
    for (const feeAmount of ["0", "-1", "12.345", "1,500"]) {
      const result = classFormSchema.safeParse({ ...validForm, feeAmount });
      expect(result.success).toBe(false);
    }
  });

  test("rejects reversed and duplicate browser schedules", () => {
    const reversed = classFormSchema.safeParse({
      ...validForm,
      schedules: [{ dayOfWeek: "1", endTime: "18:00", startTime: "19:00" }],
    });
    expect(reversed.success).toBe(false);
    if (!reversed.success) {
      expect(
        reversed.error.issues.map((issue) => issue.path.join("."))
      ).toContain("schedules.0.endTime");
    }

    const duplicate = classFormSchema.safeParse({
      ...validForm,
      schedules: [
        { dayOfWeek: "1", endTime: "19:00", startTime: "18:00" },
        { dayOfWeek: "1", endTime: "20:00", startTime: "18:00" },
      ],
    });
    expect(duplicate.success).toBe(false);
    if (!duplicate.success) {
      expect(
        duplicate.error.issues.map((issue) => issue.path.join("."))
      ).toContain("schedules.1.startTime");
    }
  });
});
