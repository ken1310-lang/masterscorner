import { fileURLToPath } from "node:url";
import { spawn } from "bun";

/** Only the documented, argument-free production invocation is supported. */
export function assertProductionDeployArgs(args: readonly string[]): void {
  if (args.length > 0) {
    throw new Error(
      "Refusing to deploy: deploy:production accepts no arguments. Set the production environment in the shell, then run bun run deploy:production."
    );
  }
}

if (import.meta.main) {
  try {
    assertProductionDeployArgs(process.argv.slice(2));
    process.chdir(fileURLToPath(new URL("../", import.meta.url)));
    // A static import would load Varlock before rejecting configuration overrides.
    // This also keeps guard-production.ts independently invokable.
    await import("./guard-production");
    const deploy = spawn(
      [
        process.execPath,
        "--no-env-file",
        "run",
        "alchemy",
        "deploy",
        "--stage",
        "production",
      ],
      {
        env: process.env,
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
      }
    );
    process.exitCode = await deploy.exited;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
