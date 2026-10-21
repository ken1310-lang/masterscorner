/**
 * Production deploy guard — see docs/specs/SPEC-platform.md §7.
 *
 * Nothing about a Postgres connection string says which Neon branch it belongs
 * to, so this guard does not try to recognise "a development database". It
 * compares the deploy target against the development value already on disk
 * (`apps/server/.env`) and refuses to continue when they are the same database.
 * That is the failure it exists for: a deployment that carries development
 * credentials into production.
 */

import { existsSync, readFileSync } from "node:fs";

/** `KEY=value`, with optional `export` and optional quotes around the value. */
const DOTENV_ENTRY = /^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)$/;

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
  if (target.neonBranch && target.neonBranch !== "production") {
    throw new Error(
      `Refusing to deploy: NEON_BRANCH is "${target.neonBranch}", not "production", so this environment is holding another branch's values. Run \`neon env pull\` on the production branch, or unset the variable in this shell.`
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

/** True when both URLs name the same host; credentials differ between branches. */
export function isSameDatabase(
  a: string | undefined,
  b: string | undefined
): boolean {
  if (!(a && b)) {
    return false;
  }
  const parse = (url: string) => {
    try {
      return new URL(url).host;
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
  const entry = readFileSync(path, "utf8")
    .split("\n")
    .map((line) => DOTENV_ENTRY.exec(line))
    .find((match) => match?.[1] === key);
  const value = entry?.[2]?.trim().replace(/^["']|["']$/g, "");
  return value || undefined;
}
