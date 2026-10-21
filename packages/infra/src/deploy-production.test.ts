import { describe, expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { spawn } from "bun";

describe("production deploy invocation", () => {
  test.each([
    { args: ["--env-file", "development.env"] },
    { args: ["--env-file=development.env"] },
    { args: ["--stage", "development"] },
    { args: ["--stage=development"] },
    { args: ["--profile", "development"] },
    { args: ["--config", "other-stack.ts"] },
    { args: ["other-stack.ts"] },
    { args: ["--dry-run"] },
  ])("rejects forwarded production deploy arguments %#", async ({ args }) => {
    const entrypoint = fileURLToPath(
      new URL("./deploy-production.ts", import.meta.url)
    );
    const child = spawn(
      [process.execPath, "--no-env-file", entrypoint, ...args],
      {
        env: {
          ...process.env,
          NODE_ENV: "test",
          NEON_BRANCH: "development",
          __VARLOCK_ENV: "invalid-before-env-loading",
        },
        stdout: "pipe",
        stderr: "pipe",
      }
    );
    const [exitCode, stdout, stderr] = await Promise.all([
      child.exited,
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
    ]);
    expect(exitCode).toBe(1);
    expect(stdout).toBe("");
    expect(stderr).toContain("deploy:production accepts no arguments");
  });
});
