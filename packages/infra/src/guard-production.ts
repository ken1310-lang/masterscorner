/**
 * Standalone production target check, also loaded by deploy-production.ts.
 *
 * It loads the deploy environment the same way `alchemy.run.ts` does, then
 * applies the checks in ./deploy-guard.ts before Alchemy touches a resource.
 */
import { fileURLToPath, URL } from "node:url";
import "varlock/auto-load";
import { assertProductionTarget, readDotenvValue } from "./deploy-guard";

const developmentEnvFile = fileURLToPath(
  new URL("../../../apps/server/.env", import.meta.url)
);

try {
  const developmentDatabaseUrl = readDotenvValue(
    developmentEnvFile,
    "DATABASE_URL"
  );
  const developmentAuthSecret = readDotenvValue(
    developmentEnvFile,
    "BETTER_AUTH_SECRET"
  );
  const developmentBucketEndpoint = readDotenvValue(
    developmentEnvFile,
    "AWS_ENDPOINT_URL_S3"
  );
  const developmentCorsOrigin = readDotenvValue(
    developmentEnvFile,
    "CORS_ORIGIN"
  );

  assertProductionTarget({
    nodeEnv: process.env.NODE_ENV,
    databaseUrl: process.env.DATABASE_URL,
    bucketEndpoint: process.env.AWS_ENDPOINT_URL_S3,
    authSecret: process.env.BETTER_AUTH_SECRET,
    corsOrigin: process.env.CORS_ORIGIN,
    developmentDatabaseUrl,
    developmentAuthSecret,
    developmentBucketEndpoint,
    developmentCorsOrigin,
    neonBranch: process.env.NEON_BRANCH,
  });

  console.log(
    `Production deploy target verified: NODE_ENV=production, and a database, auth secret, CORS origin and media bucket endpoint that are none of them the development branch's${developmentDatabaseUrl ? " (checked against apps/server/.env)" : " (no development env file found to compare against)"}.`
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
