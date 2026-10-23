import { describe, expect, test } from "bun:test";

import { assertDevelopmentBranch } from "./dev-guard";

describe("alchemy dev branch guard", () => {
  test("accepts development values", () => {
    expect(() =>
      assertDevelopmentBranch({
        ALCHEMY_DEV: "true",
        NEON_BRANCH: "development",
      })
    ).not.toThrow();
  });

  test("refuses production values", () => {
    expect(() =>
      assertDevelopmentBranch({
        ALCHEMY_DEV: "true",
        NEON_BRANCH: "production",
      })
    ).toThrow("NEON_BRANCH must be 'development'");
  });

  test("fails closed when the marker is missing", () => {
    expect(() => assertDevelopmentBranch({ ALCHEMY_DEV: "true" })).toThrow(
      "NEON_BRANCH must be 'development'"
    );
  });

  test("leaves deploy invocations to the production guard", () => {
    expect(() =>
      assertDevelopmentBranch({
        ALCHEMY_DEV: "false",
        NEON_BRANCH: "production",
      })
    ).not.toThrow();
  });
});
