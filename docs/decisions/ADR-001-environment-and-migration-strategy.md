# ADR-001: Separate environments with Neon branches and versioned Drizzle migrations

## Status

Accepted — owner directive: every feature is exercised on a development environment before it reaches production. The branch and deployment mechanism named below was confirmed in the platform PR on 2026-10-20: production is reached through `bun run deploy:production`, which runs `packages/infra/src/guard-production.ts` and then `alchemy deploy --stage production`; plain `bun run deploy` keeps the personal `dev_<username>` stage.

## Date

2026-10-20

## Context

- MastersCorner will have real users, so schema and behaviour changes must not be applied to production first.
- Runtime data access is `@neondatabase/serverless` + `drizzle-orm/neon-http` (`packages/db/src/index.ts`, `createDb(env)`). Per `AGENTS.md`, a plain local Postgres URL is **not** a drop-in replacement at runtime, so switching to a local Postgres container would require a driver swap — out of scope for this decision.
- Migrations already have a home: `packages/db/drizzle.config.ts` points at `./src/migrations` (currently only `.gitkeep`), `db:generate` runs `drizzle-kit generate`, `db:migrate` runs `drizzle-kit migrate`, `db:push` runs `drizzle-kit push`.
- `DATABASE_URL` is declared once in `apps/server/.env.schema` and imported by `packages/db/.env.schema`; `@currentEnv=$NODE_ENV` is already declared there.
- Deployment is Alchemy (`packages/infra/alchemy.run.ts`) creating a Cloudflare Worker (`server`, port 3000) and a Cloudflare Website (`web`, port 3001), with `DATABASE_URL`, `CORS_ORIGIN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` injected from the environment.
- The repo has **no CI, no git hooks, no tests** today; all quality gates are manual (`bun run check-types`, `bun run check`, `bun run build`).

## Decision

1. **Environments are backed by Neon branches; two are live in the first release.**
   - Local development → a long-lived Neon `development` branch.
   - Pull-request preview → deferred for the first release (ADR-004). When it is introduced, an ephemeral `preview/pr-<n>` branch is created from `development` and deleted when the PR closes.
   - Production → the project's default (production) branch.
   Neon branching is copy-on-write, so ephemeral branches are cheap and give production-like data without a separate staging pipeline.
2. **Versioned migrations are the only way schema reaches dev or production.** `drizzle-kit generate` writes reviewable SQL into `packages/db/src/migrations`; `drizzle-kit migrate` applies it. `drizzle-kit push` is permitted only against throwaway branches and is never run against production.
3. **Migration flow per change:** edit `packages/db/src/schema/**` → `bun run db:generate` → review the SQL in the PR → apply to `development` → verify the feature against `development` → apply to production as a separate reviewed step from `master`.
4. **Migrations must be expand/contract compatible.** Additive changes ship first; destructive changes (drop/rename/tighten) ship in a later PR after the code that stopped using them is live.
5. **Configuration is per environment, and only production is deployed.** `NODE_ENV` selects environment-specific values (Varlock `@currentEnv=$NODE_ENV` is already declared in `apps/server/.env.schema`); development and production use different `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CORS_ORIGIN` and object-storage credentials. Development is the developer's machine (`bun run dev`: API on 3000, web on 3001) pointed at the `development` branch. The production Alchemy stack is the single deployment — one stack deploying the API Worker and the web Worker — and its stage mechanism in the pinned `alchemy@2.0.0-beta.83` is confirmed by the platform PR: `--stage production` is passed by `bun run deploy:production`. A temporary tunnel is used ad hoc when something other than the developer's machine needs a public URL; it is never a permanent second deployment.
6. **Rollback is a forward fix plus Neon restore.** Neon branch restore/point-in-time recovery covers catastrophic cases; normal rollback is the next migration, not an edited historical one.
7. **Every PR carries its own migrations and evidence.** No PR merges with a migration that was not applied and exercised on `development`.

## Alternatives Considered

- **Local Postgres container as the dev database.** Rejected: the runtime uses the Neon HTTP driver; supporting both would mean a driver abstraction and a different deployment path for no MVP benefit.
- **Schemas inside one database (`development` / `production` schema) instead of branches.** Rejected: shared credentials, no isolation of extensions/roles, no cheap copy-on-write, and a mistake in `search_path` reaches production data.
- **`drizzle-kit push` as the daily workflow.** Rejected: no reviewable SQL, no migration history, drift between environments, and nothing to replay in production.
- **A long-lived `staging` branch kept in sync manually.** Rejected as the default: a long-lived `development` branch plus ephemeral PR branches covers the same need with less drift; a staging branch can be added later if a separate dress rehearsal is required.

## Consequences

- Production schema changes are always preceded by a `development` verification and a reviewed SQL diff.
- PR previews, once introduced after launch (ADR-004), can exercise real migration paths in the pull request itself.
- Uploaded media is stored in Neon Object Storage, which branches with the database and issues branch-scoped credentials, so the isolation in decision 1 covers files as well as rows (ADR-004).
- Each environment needs its own secrets; only production needs deployment configuration, and that setup work lands in the platform PR.
- There is exactly one deployment path (production) and no second environment to keep in sync; the cost is that until the production stack is deployed, only the developer's machine exercises the app end to end. The production stack is therefore deployed once from `master` early, as an empty rehearsal, and redeployed at each checkpoint.
- Migration discipline (expand/contract) becomes a review requirement on every schema PR.
- The repo gains a CI workflow as the enforcement point, since nothing exists today.

## Verification

- `bun run db:generate` produces SQL under `packages/db/src/migrations` with no drift, and the generated file is committed in the same PR.
- `bun run db:migrate` applies cleanly against the `development` branch and is safe to re-run.
- `bun run dev` boots the API against the `development` branch: sign-up, sign-in and one protected read succeed.
- Production migration is executed from `master` only after the `development` run is verified, and the deployed Worker still authenticates and reads data afterwards.
