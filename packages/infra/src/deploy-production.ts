import { fileURLToPath } from "node:url";
import { createDb } from "@my-better-t-app/db";
import { spawn } from "bun";

/** Only the documented, argument-free production invocation is supported. */
export function assertProductionDeployArgs(args: readonly string[]): void {
  if (args.length > 0) {
    throw new Error(
      "Refusing to deploy: deploy:production accepts no arguments. Set the production environment in the shell, then run bun run deploy:production."
    );
  }
}

/**
 * The profile API reads `master_profile.revision` in every profile request.
 * Refuse to replace the Workers while the target branch cannot serve that
 * read; the migration must be applied in this same environment first.
 */
export async function assertProfileRevisionReadable(
  readRevision: () => Promise<unknown>
): Promise<void> {
  try {
    await readRevision();
  } catch (error) {
    throw new Error(
      "Refusing to deploy: the database does not expose master_profile.revision. Run `bun run db:migrate` against the production branch in this environment, then retry.",
      { cause: error }
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
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("Refusing to deploy: DATABASE_URL is unset.");
    }
    const db = createDb({ DATABASE_URL: databaseUrl });
    await assertProfileRevisionReadable(() =>
      db.query.masterProfile.findFirst({ columns: { revision: true } })
    );
    console.log(
      "Database schema verified: master_profile.revision is readable."
    );
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
