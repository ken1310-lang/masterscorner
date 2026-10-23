/**
 * `alchemy dev` must never run against production values. `NEON_BRANCH` is
 * written by `neon env pull`, so a wrong or missing marker is a configuration
 * mistake, not a reason to continue. Deploy uses the separate production guard.
 */
export function assertDevelopmentBranch(env: {
  ALCHEMY_DEV?: string;
  NEON_BRANCH?: string;
}) {
  if (env.ALCHEMY_DEV !== "true") {
    return;
  }
  if (env.NEON_BRANCH === "development") {
    return;
  }
  throw new Error(
    "Refusing alchemy dev: NEON_BRANCH must be 'development'. Run the repo's dev script, which loads apps/server/.env, or point NEON_BRANCH at the development branch."
  );
}
