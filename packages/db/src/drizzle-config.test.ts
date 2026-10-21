import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "bun";

const pooled =
  "postgresql://app:fixture@ep-production-pooler.ap-southeast-1.aws.neon.tech/app";
const direct =
  "postgresql://migrator:fixture@ep-production.ap-southeast-1.aws.neon.tech/app";

async function loadConfig(databaseUrl: string, unpooledUrl = "") {
  const directory = mkdtempSync(join(tmpdir(), "mc-drizzle-config-"));
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.includes("VARLOCK")) {
      delete env[key];
    }
  }
  env.DATABASE_URL = databaseUrl;
  env.DATABASE_URL_UNPOOLED = unpooledUrl;
  writeFileSync(
    join(directory, ".env.schema"),
    "# @defaultSensitive=false\n# @defaultRequired=false\n# ---\nDATABASE_URL=\nDATABASE_URL_UNPOOLED=\n"
  );
  try {
    const configUrl = new URL("../drizzle.config.ts", import.meta.url).href;
    // Exercise the real config's module-loading boundary in an isolated process.
    const child = spawn(
      [
        process.execPath,
        "--no-env-file",
        "--eval",
        `const { default: config } = await import(${JSON.stringify(configUrl)}); process.stdout.write(JSON.stringify(config.dbCredentials));`,
      ],
      { cwd: directory, env, stdout: "pipe", stderr: "pipe" }
    );
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    return { exitCode, stdout, stderr };
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

describe("Drizzle migration target", () => {
  test("uses the direct alias of the configured Neon database", async () => {
    const result = await loadConfig(pooled, direct);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ url: direct });
  });

  test("accepts identical non-Neon targets and ignores credentials and query parameters", async () => {
    const unpooled =
      "postgresql://migrator:fixture@localhost:5432/app?sslmode=require";
    const result = await loadConfig(
      "postgresql://app:fixture@localhost:5432/app",
      unpooled
    );
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ url: unpooled });
  });

  test("falls back to DATABASE_URL when no direct URL is configured", async () => {
    const result = await loadConfig(pooled);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ url: pooled });
  });

  test("supports a standalone direct URL when no pooled URL is configured", async () => {
    const result = await loadConfig("", direct);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual({ url: direct });
  });

  test.each([
    direct.replace("ep-production.", "ep-development."),
    direct.replace("/app", "/other"),
    direct.replace("neon.tech", "neon.tech:5433"),
    direct.replace("neon.tech", "example.com"),
    "postgresql://migrator:fixture@ep-production-pooler.example.com/app",
  ])(
    "rejects mismatched migration target %# before migration",
    async (unpooled) => {
      const result = await loadConfig(pooled, unpooled);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain("DATABASE_URL_UNPOOLED");
      expect(result.stderr).not.toContain("migrator:fixture");
    }
  );

  test("does not treat non-Neon pooled-looking hostnames as aliases", async () => {
    const result = await loadConfig(
      "postgresql://app:fixture@ep-example-pooler.example.com/app",
      "postgresql://migrator:fixture@ep-example.example.com/app"
    );
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain("DATABASE_URL_UNPOOLED");
  });
});
