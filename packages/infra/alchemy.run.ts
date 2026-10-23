import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import "varlock/auto-load";

import { assertDevelopmentBranch } from "./src/dev-guard";

assertDevelopmentBranch({
  ALCHEMY_DEV: process.env.ALCHEMY_DEV,
  AWS_ENDPOINT_URL_S3: process.env.AWS_ENDPOINT_URL_S3,
  DATABASE_URL: process.env.DATABASE_URL,
  NEON_BRANCH: process.env.NEON_BRANCH,
  NEON_DEVELOPMENT_DATABASE_HOST: process.env.NEON_DEVELOPMENT_DATABASE_HOST,
  NEON_DEVELOPMENT_STORAGE_HOST: process.env.NEON_DEVELOPMENT_STORAGE_HOST,
});

/**
 * Production-only Worker names. Other stages keep Alchemy's generated names,
 * so an unguarded dev-stage deploy cannot take over the production Workers.
 * The guarded production deploy requires NODE_ENV=production.
 */
const workerName = (role: "server" | "web") =>
  process.env.NODE_ENV === "production"
    ? `masterscorner-${role}-production`
    : undefined;

export const server = Cloudflare.Worker("server", {
  name: workerName("server"),
  main: "../../apps/server/src/index.ts",
  compatibility: {
    flags: ["nodejs_compat"],
  },
  env: {
    DATABASE_URL: Config.Redacted("DATABASE_URL"),
    CORS_ORIGIN: Config.String("CORS_ORIGIN"),
    BETTER_AUTH_SECRET: Config.Redacted("BETTER_AUTH_SECRET"),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
    // The branch's media bucket (SPEC-platform §7): the same four names the
    // development branch supplies locally, bound as deploy-time secrets so the
    // deployed Worker can read the objects it uploads. The guard already
    // requires the bucket endpoint, so a production deploy without them is a
    // mistake, not a configuration.
    AWS_ACCESS_KEY_ID: Config.Redacted("AWS_ACCESS_KEY_ID"),
    AWS_ENDPOINT_URL_S3: Config.String("AWS_ENDPOINT_URL_S3"),
    AWS_REGION: Config.String("AWS_REGION"),
    AWS_SECRET_ACCESS_KEY: Config.Redacted("AWS_SECRET_ACCESS_KEY"),
    // Upload abuse guard (SPEC-media §4): ten uploads per minute per account,
    // per Cloudflare location. The binding is platform state, not a secret.
    MEDIA_UPLOAD_RATE_LIMIT: Cloudflare.RateLimit("MEDIA_UPLOAD_RATE_LIMIT", {
      namespaceId: 1001,
      simple: { limit: 10, period: 60 },
    }),
  },
  dev: {
    port: 3000,
  },
});

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export default Alchemy.Stack(
  "my-better-t-app",
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const serverWorker = yield* server;
    // A new logical id is deliberate: Alchemy does not replace an assets
    // Worker on an explicit name change, and the old physical name cannot be
    // changed in place. This creates `masterscorner-web-production` and drops
    // the old `my-better-t-app-web-*` script from the stack.
    const webWorker = yield* Cloudflare.Worker("web-app", {
      name: workerName("web"),
      // The Vite wrapper delegates to this Worker shape; declaring it directly
      // keeps the explicit name in the Worker props so a name change replaces
      // the script instead of updating the old one in place.
      vite: {
        rootDir: "../../apps/web",
      },
      compatibility: {
        flags: ["nodejs_compat"],
      },
      env: {
        VITE_SERVER_URL: serverWorker.url.as<string>(),
      },
      dev: {
        port: 3001,
      },
    });

    return {
      web: webWorker.url,
      server: serverWorker.url,
    };
  })
);
