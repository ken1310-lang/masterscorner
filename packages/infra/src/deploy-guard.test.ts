import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertProductionTarget,
  type DeployTarget,
  isSameDatabase,
  readDotenvValue,
} from "./deploy-guard";

/**
 * The guard from SPEC-platform §7, exercised as a matrix: every field it reads
 * gets one accepted value and the refusals that matter. It fails closed on the
 * `NEON_BRANCH` marker, so the unset case is a test, not a comment.
 */
const NODE_ENV_REFUSAL = /NODE_ENV/;
const NEON_BRANCH_REFUSAL = /NEON_BRANCH/;
const DATABASE_REFUSAL = /DATABASE_URL/;
const BUCKET_REFUSAL = /AWS_ENDPOINT_URL_S3/;
const DEVELOPMENT_DATABASE_REFUSAL = /development branch/;
const AUTH_SECRET_REFUSAL = /BETTER_AUTH_SECRET/;
const CORS_REFUSAL = /CORS_ORIGIN/;

const developmentDatabaseUrl =
  "postgresql://master:pw@ep-development-pooler.ap-southeast-1.aws.neon.tech/db";

const target = (overrides: Partial<DeployTarget> = {}): DeployTarget => ({
  authSecret: "production-auth-secret",
  bucketEndpoint: "https://s3.aws-ap-southeast-1.amazonaws.com",
  corsOrigin: "https://masterscorner.example",
  databaseUrl:
    "postgresql://master:pw@ep-production-pooler.ap-southeast-1.aws.neon.tech/db",
  developmentAuthSecret: "development-auth-secret",
  developmentCorsOrigin: "http://localhost:3001",
  developmentDatabaseUrl,
  neonBranch: "production",
  nodeEnv: "production",
  ...overrides,
});

describe("assertProductionTarget", () => {
  test("accepts a production target", () => {
    expect(() => assertProductionTarget(target())).not.toThrow();
  });

  test("accepts a production target when no development env file exists", () => {
    expect(() =>
      assertProductionTarget(
        target({
          developmentAuthSecret: undefined,
          developmentCorsOrigin: undefined,
          developmentDatabaseUrl: undefined,
        })
      )
    ).not.toThrow();
  });

  test("refuses any NODE_ENV other than production", () => {
    for (const nodeEnv of [undefined, "", "development", "Production"]) {
      expect(() => assertProductionTarget(target({ nodeEnv }))).toThrow(
        NODE_ENV_REFUSAL
      );
    }
  });

  test("refuses when the NEON_BRANCH marker is absent or names another branch", () => {
    for (const neonBranch of [undefined, "", "development", "preview"]) {
      expect(() => assertProductionTarget(target({ neonBranch }))).toThrow(
        NEON_BRANCH_REFUSAL
      );
    }
  });

  test("refuses when the database or the bucket endpoint is missing", () => {
    expect(() =>
      assertProductionTarget(target({ databaseUrl: undefined }))
    ).toThrow(DATABASE_REFUSAL);
    expect(() =>
      assertProductionTarget(target({ bucketEndpoint: undefined }))
    ).toThrow(BUCKET_REFUSAL);
  });

  test("refuses the development branch's database, credentials or not", () => {
    expect(() =>
      assertProductionTarget(target({ databaseUrl: developmentDatabaseUrl }))
    ).toThrow(DEVELOPMENT_DATABASE_REFUSAL);

    expect(() =>
      assertProductionTarget(
        target({
          databaseUrl:
            "postgresql://other-user:other-pw@ep-development-pooler.ap-southeast-1.aws.neon.tech/db",
        })
      )
    ).toThrow(DEVELOPMENT_DATABASE_REFUSAL);
  });

  test("refuses the development endpoint's direct alias even with a different database path", () => {
    expect(() =>
      assertProductionTarget(
        target({
          databaseUrl:
            "postgresql://other:fixture@ep-development.ap-southeast-1.aws.neon.tech/another",
        })
      )
    ).toThrow(DATABASE_REFUSAL);
  });

  test("refuses the development endpoint when only one URL spells the default port", () => {
    const implicitPort =
      "postgresql://dev:fixture@ep-development-pooler.ap-southeast-1.aws.neon.tech/db";
    const explicitPort =
      "postgresql://deploy:fixture@ep-development.ap-southeast-1.aws.neon.tech:5432/another";
    for (const [databaseUrl, developmentUrl] of [
      [explicitPort, implicitPort],
      [implicitPort, explicitPort],
    ]) {
      expect(() =>
        assertProductionTarget(
          target({ databaseUrl, developmentDatabaseUrl: developmentUrl })
        )
      ).toThrow(DEVELOPMENT_DATABASE_REFUSAL);
    }
  });

  test("keeps a nondefault port distinct from the development endpoint", () => {
    expect(() =>
      assertProductionTarget(
        target({
          databaseUrl:
            "postgresql://deploy:fixture@ep-development.ap-southeast-1.aws.neon.tech:5433/db",
        })
      )
    ).not.toThrow();
  });

  test("refuses a deploy that reuses the development secret or origin", () => {
    expect(() =>
      assertProductionTarget(
        target({ authSecret: target().developmentAuthSecret })
      )
    ).toThrow(AUTH_SECRET_REFUSAL);

    expect(() =>
      assertProductionTarget(
        target({ corsOrigin: target().developmentCorsOrigin })
      )
    ).toThrow(CORS_REFUSAL);
  });
});

describe("isSameDatabase", () => {
  test("compares the host, so different credentials on one branch still match", () => {
    expect(
      isSameDatabase(
        "postgresql://a:pw@ep-x-pooler.ap-southeast-1.aws.neon.tech/db",
        "postgresql://b:pw@ep-x-pooler.ap-southeast-1.aws.neon.tech/other"
      )
    ).toBe(true);
  });

  test("matches pooled and direct Neon endpoints in either direction", () => {
    const direct =
      "postgresql://migrator:fixture@ep-development.ap-southeast-1.aws.neon.tech/other";
    expect(isSameDatabase(developmentDatabaseUrl, direct)).toBe(true);
    expect(isSameDatabase(direct, developmentDatabaseUrl)).toBe(true);
  });

  test("does not remove pooled-looking suffixes from non-Neon hosts or other labels", () => {
    for (const [a, b] of [
      ["ep-x-pooler.example.com", "ep-x.example.com"],
      ["ep-x-pooler.neon.tech.example.com", "ep-x.neon.tech.example.com"],
      ["ep-x.region-pooler.aws.neon.tech", "ep-x.region.aws.neon.tech"],
      ["ep-x-pooler.aws.neon.tech:5432", "ep-x.aws.neon.tech:5433"],
    ]) {
      expect(
        isSameDatabase(`postgresql://a@${a}/db`, `postgresql://b@${b}/db`)
      ).toBe(false);
    }
  });

  test("is false for different hosts and for a missing side", () => {
    expect(
      isSameDatabase(
        "postgresql://a:pw@ep-x-pooler.ap-southeast-1.aws.neon.tech/db",
        "postgresql://a:pw@ep-y-pooler.ap-southeast-1.aws.neon.tech/db"
      )
    ).toBe(false);
    expect(isSameDatabase(undefined, developmentDatabaseUrl)).toBe(false);
    expect(isSameDatabase("not a url", "not a url")).toBe(true);
  });
});

describe("readDotenvValue", () => {
  test("reads the forms a dotenv file actually uses, and misses cleanly", () => {
    const directory = mkdtempSync(join(tmpdir(), "mc-dotenv-"));
    const file = join(directory, ".env");
    writeFileSync(
      file,
      [
        "# a comment",
        "PLAIN=value",
        'QUOTED="quoted value"',
        "export EXPORTED='single'",
        "EMPTY=",
        "",
      ].join("\n")
    );

    try {
      expect(readDotenvValue(file, "PLAIN")).toBe("value");
      expect(readDotenvValue(file, "QUOTED")).toBe("quoted value");
      expect(readDotenvValue(file, "EXPORTED")).toBe("single");
      expect(readDotenvValue(file, "EMPTY")).toBeUndefined();
      expect(readDotenvValue(file, "ABSENT")).toBeUndefined();
      expect(
        readDotenvValue(join(directory, "missing.env"), "PLAIN")
      ).toBeUndefined();
    } finally {
      rmSync(directory, { force: true, recursive: true });
    }
  });
});
