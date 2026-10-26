/**
 * `alchemy dev` must never run against production values. `NEON_BRANCH` alone
 * is only a label; the database and bucket hosts must match the pinned
 * development endpoints for the guard to pass. Deploy uses its own guard.
 */
interface DevGuardEnv {
  ALCHEMY_DEV?: string;
  AWS_ENDPOINT_URL_S3?: string;
  DATABASE_URL?: string;
  NEON_BRANCH?: string;
  NEON_DEVELOPMENT_DATABASE_HOST?: string;
  NEON_DEVELOPMENT_STORAGE_HOST?: string;
}

function hostname(value: string | undefined) {
  if (!value) {
    return null;
  }
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

export function assertDevelopmentBranch(env: DevGuardEnv) {
  if (env.ALCHEMY_DEV !== "true") {
    return;
  }
  if (env.NEON_BRANCH !== "development") {
    throw new Error(
      "Refusing alchemy dev: NEON_BRANCH must be 'development'. Run the repo's dev script, which loads apps/server/.env, or point NEON_BRANCH at the development branch."
    );
  }

  const expectedDatabase = env.NEON_DEVELOPMENT_DATABASE_HOST?.trim();
  if (!expectedDatabase || hostname(env.DATABASE_URL) !== expectedDatabase) {
    throw new Error(
      "Refusing alchemy dev: DATABASE_URL does not match NEON_DEVELOPMENT_DATABASE_HOST. The dev command must point at the development database branch."
    );
  }

  const expectedStorage = env.NEON_DEVELOPMENT_STORAGE_HOST?.trim();
  if (
    !expectedStorage ||
    hostname(env.AWS_ENDPOINT_URL_S3) !== expectedStorage
  ) {
    throw new Error(
      "Refusing alchemy dev: AWS_ENDPOINT_URL_S3 does not match NEON_DEVELOPMENT_STORAGE_HOST. The dev command must point at the development bucket endpoint."
    );
  }
}
