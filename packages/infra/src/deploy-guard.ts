/**
 * Production deploy guard — see docs/specs/SPEC-platform.md §7.
 *
 * Nothing about a Postgres connection string says which Neon branch it belongs
 * to, so the authoritative signal is the `NEON_BRANCH` marker that
 * `neon env pull` writes next to it: this guard refuses to deploy without it,
 * and refuses any value other than `production`. Comparing against the
 * development value on disk (`apps/server/.env`) is a second, weaker check for
 * the case where a deploy environment carries the marker by accident — it
 * cannot answer on its own, because that file may not exist at all.
 */

import { existsSync, readFileSync } from "node:fs";
import { canonicalDatabaseHost } from "@my-better-t-app/db/connection";
import { parse as parseDotenv } from "dotenv";

export interface DeployTarget {
  /** `BETTER_AUTH_SECRET` the Worker would receive. */
  authSecret: string | undefined;
  /** `AWS_ENDPOINT_URL_S3` of the branch's media bucket. */
  bucketEndpoint: string | undefined;
  /** `CORS_ORIGIN` the Worker would receive. */
  corsOrigin: string | undefined;
  /** Pooled `DATABASE_URL` the Worker would receive. */
  databaseUrl: string | undefined;
  /** `BETTER_AUTH_SECRET` recorded in the development env file, when that file exists. */
  developmentAuthSecret: string | undefined;
  /** `CORS_ORIGIN` recorded in the development env file, when that file exists. */
  developmentCorsOrigin: string | undefined;
  /** `DATABASE_URL` recorded in the development env file, when that file exists. */
  developmentDatabaseUrl: string | undefined;
  /** `NEON_BRANCH`, the branch the environment's values were pulled from. */
  neonBranch: string | undefined;
  /** `NODE_ENV` of the deploy process. */
  nodeEnv: string | undefined;
}

export function assertProductionTarget(target: DeployTarget): void {
  if (target.nodeEnv !== "production") {
    throw new Error(
      `Refusing to deploy: NODE_ENV is ${target.nodeEnv ?? "unset"}, expected "production". ` +
        "Production deploys take their values from the deploy environment only, never from a development shell."
    );
  }
  if (target.neonBranch !== "production") {
    throw new Error(
      `Refusing to deploy: NEON_BRANCH is ${target.neonBranch ? `"${target.neonBranch}"` : "unset"}, expected "production". ` +
        "The marker is what proves which Neon branch these values came from — run `neon env pull` on the production branch in this shell, or unset the variable if it is leaking in from a development environment."
    );
  }
  if (!target.databaseUrl) {
    throw new Error(
      "Refusing to deploy: DATABASE_URL is unset, so there is nothing to point the Worker at. Run `neon env pull` on the production branch in this shell."
    );
  }
  if (!target.bucketEndpoint) {
    throw new Error(
      "Refusing to deploy: AWS_ENDPOINT_URL_S3 is unset. `neon.ts` declares the media bucket, so the production branch must supply its endpoint — run `neon deploy` and `neon env pull` on that branch."
    );
  }
  if (isSameDatabase(target.databaseUrl, target.developmentDatabaseUrl)) {
    throw new Error(
      "Refusing to deploy: DATABASE_URL points at the same database as apps/server/.env, which is the development branch. Deploy from a shell holding the production branch's values."
    );
  }
  if (
    target.developmentAuthSecret &&
    target.authSecret === target.developmentAuthSecret
  ) {
    throw new Error(
      "Refusing to deploy: BETTER_AUTH_SECRET is still the value in apps/server/.env, so production would sign its sessions with the development secret. Generate a separate secret for production and set it in the deploy environment."
    );
  }
  if (
    target.developmentCorsOrigin &&
    target.corsOrigin === target.developmentCorsOrigin
  ) {
    throw new Error(
      `Refusing to deploy: CORS_ORIGIN is still the value in apps/server/.env ("${target.developmentCorsOrigin}"), so the API would trust the development origin instead of the deployed web origin.`
    );
  }
}

/** True for the same endpoint (including Neon pooler aliases), regardless of database path. */
export function isSameDatabase(
  a: string | undefined,
  b: string | undefined
): boolean {
  if (!(a && b)) {
    return false;
  }
  const parse = (url: string) => {
    try {
      return canonicalDatabaseHost(new URL(url));
    } catch {
      return url;
    }
  };
  return parse(a) === parse(b);
}

/** Reads one `KEY=value` from a dotenv file, or `undefined` when absent. */
export function readDotenvValue(path: string, key: string): string | undefined {
  if (!existsSync(path)) {
    return undefined;
  }
  return parseDotenv(readFileSync(path, "utf8"))[key] || undefined;
}
