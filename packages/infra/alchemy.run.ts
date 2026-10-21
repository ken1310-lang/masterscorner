import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import "varlock/auto-load";

/**
 * Branded, stage-scoped Worker names. Resolving the stage here keeps
 * production (`masterscorner-*-production`) and any future stage from
 * replacing each other, and gives both Workers stable URLs.
 */
const workerName = (role: "server" | "web") =>
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;
    return `masterscorner-${role}-${stage}`;
  });

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
    const webWorker = yield* Cloudflare.Website.Vite("web", {
      name: workerName("web"),
      rootDir: "../../apps/web",
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
