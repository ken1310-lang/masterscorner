import { describe, expect, test } from "bun:test";

import { assertDevelopmentBranch } from "./dev-guard";

const development = {
  ALCHEMY_DEV: "true",
  AWS_ENDPOINT_URL_S3: "https://br-dev.storage.example",
  DATABASE_URL:
    "postgresql://user:pass@ep-dev-pooler.example/neondb?sslmode=require",
  NEON_BRANCH: "development",
  NEON_DEVELOPMENT_DATABASE_HOST: "ep-dev-pooler.example",
  NEON_DEVELOPMENT_STORAGE_HOST: "br-dev.storage.example",
};

describe("alchemy dev branch guard", () => {
  test("accepts matching development values", () => {
    expect(() => assertDevelopmentBranch(development)).not.toThrow();
  });

  test("refuses a production marker", () => {
    expect(() =>
      assertDevelopmentBranch({ ...development, NEON_BRANCH: "production" })
    ).toThrow("NEON_BRANCH must be 'development'");
  });

  test("refuses production credentials carrying a development marker", () => {
    expect(() =>
      assertDevelopmentBranch({
        ...development,
        DATABASE_URL:
          "postgresql://user:pass@ep-prod-pooler.example/neondb?sslmode=require",
      })
    ).toThrow("DATABASE_URL does not match");
    expect(() =>
      assertDevelopmentBranch({
        ...development,
        AWS_ENDPOINT_URL_S3: "https://br-prod.storage.example",
      })
    ).toThrow("AWS_ENDPOINT_URL_S3 does not match");
  });

  test("fails closed without pinned hosts", () => {
    expect(() =>
      assertDevelopmentBranch({
        ...development,
        NEON_DEVELOPMENT_DATABASE_HOST: undefined,
      })
    ).toThrow("DATABASE_URL does not match");
    expect(() =>
      assertDevelopmentBranch({
        ...development,
        NEON_DEVELOPMENT_STORAGE_HOST: undefined,
      })
    ).toThrow("AWS_ENDPOINT_URL_S3 does not match");
  });

  test("fails closed for malformed URLs", () => {
    expect(() =>
      assertDevelopmentBranch({
        ...development,
        DATABASE_URL: "not-a-url",
      })
    ).toThrow("DATABASE_URL does not match");
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
