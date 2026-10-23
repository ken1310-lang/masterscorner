# my-better-t-app

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Hono, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Hono** - Lightweight, performant server framework
- **tRPC** - End-to-end type-safe APIs
- **workers** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL (Neon) with Drizzle ORM, with one Neon project and two branches: `development` for everyday work and `production` for real users.

Install the [Neon CLI](https://neon.com/docs/cli/install) and sign in once, then from the repository root:

```bash
neon link --project-name masterscorner --region-id aws-ap-southeast-1 --no-env-pull
neon checkout development --create --no-env-pull   # pins the branch in the gitignored .neon
neon deploy                                        # applies neon.ts: the media bucket appears on this branch
neon env pull --file apps/server/.env              # DATABASE_URL, DATABASE_URL_UNPOOLED, AWS_*
```

`neon.ts` declares object storage (`media`), so every branch gets its own bucket and endpoint. Storage credentials are project-wide on this platform, so each Worker's `AWS_ENDPOINT_URL_S3` is the isolation boundary (ADR-004 revision, 2026-10-23). `neon status` prints the branch's live configuration and `neon config plan` diffs it against `neon.ts` without applying anything.

`NEON_DEVELOPMENT_DATABASE_HOST` and `NEON_DEVELOPMENT_STORAGE_HOST` pin the development endpoints. The `alchemy dev` guard refuses to start unless `DATABASE_URL` and `AWS_ENDPOINT_URL_S3` match them, so copied production values cannot pass on the `NEON_BRANCH` label alone.

`neon deploy` applies the policy to the **pinned** branch only. Only `production` (the default branch) and `development` are exempt; every other branch is treated as a throwaway with a 7-day TTL and the cheapest compute, and that includes branches that already exist — so a preview cannot outlive its purpose. Changing a branch that already exists needs `neon deploy --update-existing`; without the flag the CLI prints the difference and stops.

`DATABASE_URL` (pooled) serves application traffic; `DATABASE_URL_UNPOOLED` (direct) is what database-connected Drizzle commands use. The connecting config (`drizzle.config.ts`) refuses different endpoints, nondefault ports or database names before connecting. Neon pooled/direct hostname aliases and omitted versus explicit PostgreSQL port `5432` count as the same endpoint; credentials may differ. Pull both URLs from the intended branch together. The config warns when only the pooled URL is present.

Apply schema changes like this:

```bash
bun run db:generate   # writes SQL into packages/db/src/migrations
bun run db:migrate    # applies it to the pinned branch
```

`db:generate` selects `packages/db/drizzle.generate.config.ts`, which contains only schema and migration-output settings: it loads no environment or database credentials. Generation remains offline even when the shell's connection URLs are stale or mismatched. Migrate, push and studio continue to use the guarded connecting config.

Use versioned migrations, never `db:push`, against a shared branch.

### Adopting the baseline on a database that was created with `db:push`

`db:push` writes tables without recording anything in `drizzle.__drizzle_migrations`, so a database set up that way — any clone made while this README still recommended `db:push` — stops on the first versioned migration with `error: relation "account" already exists`. Record the baseline instead of re-running it, against that database's **direct** connection:

```sql
create schema if not exists drizzle;
create table if not exists drizzle.__drizzle_migrations (
  id serial primary key,
  hash text not null,
  created_at bigint,
  name text,
  applied_at timestamp with time zone default now()
);
insert into drizzle.__drizzle_migrations (hash, created_at, name)
values (
  '01d8d61940f53db3a97c295b663e1daf10a8db207deff0a3c9c73131e0379e5',
  1792506723000,
  '20261020143203_luxuriant_screwball'
);
```

Those are the exact values the baseline recorded on the development branch — the `20261020143203` prefix of the migration folder is the same instant in milliseconds. Check the schema before adopting, because this only makes sense when it *is* the baseline:

```sql
select table_name from information_schema.tables where table_schema = 'public' order by 1;
select * from drizzle.__drizzle_migrations order by id;
```

`bun run db:migrate` then reports success and applies only what comes after the baseline. If the table list holds anything beyond `account`, `session`, `user` and `verification`, the database has drifted — restore it rather than guess. Both the failure and the adoption were reproduced on a throwaway Neon branch on 2026-10-21.

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
From `apps/native`, run the `ios` script for iOS or the `android` script for Android to build and launch the app. See [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/) for device setup.
The API is running at [http://localhost:3000](http://localhost:3000).

`bun run dev` runs two things at once: the API through `alchemy dev` (port 3000) and the web app through Alchemy's Vite site (port 3001). Alchemy therefore needs Cloudflare provider credentials before the stack can start — configure them once with the interactive `cd packages/infra && bunx alchemy profile edit` (it refuses to run without a real terminal), or export the credentials the provider reads from the environment (`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, the names its `CredentialsUnavailable` error reports). Without them the run stops at `CredentialsUnavailable: Missing required env: CLOUDFLARE_ACCOUNT_ID`.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@my-better-t-app/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Environment Configuration

Each app owns its environment schema in `.env.schema`. Varlock generates `src/env.ts` during installation; run `bun run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. Shared database and auth packages receive configuration or initialized clients from the application. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

For Cloudflare, Alchemy loads and validates deployment inputs with `varlock/auto-load` in its Node/Bun deployment process. Worker code reads native bindings; web clients use the framework's public env API through `src/env.public.ts` where needed. Alchemy supplies resource URLs and managed database credentials. In-Worker Varlock protections are deferred until an official Alchemy integration is available; see [the non-Wrangler deployment guidance](https://varlock.dev/integrations/cloudflare/#non-wrangler-deploy-tools-alchemy-sst-pulumi).

Bun's automatic env loading is disabled in `bunfig.toml`; the framework integration or server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

Run standalone Node/Bun tools that use Varlock from the owning app directory so they load that app's schema and env files. `env:generate` only generates TypeScript files; it does not initialize environment values in a subsequent command.

## Master accounts

Every account in the first release is a master. `user.account_type` is `text NOT NULL DEFAULT 'master'` and is typed as `AccountType`; Better Auth declares it under `user.additionalFields` with `input: false`, so a sign-up or update payload cannot set it. The session user carries `accountType`, and `protectedProcedure` is the server-side boundary.

Email verification and password reset are not configured yet: no provider has been chosen and no verified sender domain exists. Sign-up and sign-in work without them; the follow-up PR for Task 4 adds both when a provider is available. See `docs/specs/SPEC-identity.md` §2.2 and §10.

## Web session cache isolation

Each web router owns its QueryClient and session-cache lifecycle. Successful sign-in, sign-up and sign-out await cancellation of outstanding queries and clear cached queries and mutations before navigating when the user identity changes. The cleanup promise is published before cancellation begins, so even synchronous abort callbacks entering the boundary for the same new account wait for cache removal. The protected-route guard awaits that boundary before rendering a different account.

A client-side Better Auth session subscription also handles session loss and account changes outside those buttons, then revalidates routes. Refreshing the same account does not clear its cache. Cleanup intentionally clears the whole client cache rather than relying on every protected query being tagged correctly; public data refetches as needed. SSR requests keep separate clients and do not install the browser subscription.

Profile saves capture the current session generation before sending the mutation. A response from an earlier generation cannot update the profile cache, reset the form or show save feedback—even after signing back into the same account. Background profile-refresh failures retain the mounted editor and unsaved changes; initial-load failures still show a retry screen.

Profile and photo mutations cancel exact profile refreshes before sending and applying results. Their cache writes merge only owned fields: profile saves preserve cached media; photo changes preserve profile fields, children, revision and site-logo entries. Media carries its creation timestamp, so the merged list remains newest-first even when responses arrive out of order. A FileReader completion rechecks the session generation before sending bytes, preventing a file chosen under one account from being uploaded under another. See `docs/specs/SPEC-master-profile.md` and `docs/specs/SPEC-media.md`.

Martial-art renames use temporary names selected against both stored and submitted names before the transaction updates retained rows. This permits swaps and names resembling the temporary namespace without unique-index collisions.

`apps/web/src/lib/session-query-cache.test.ts` covers account transitions, reentrant route entry during cancellation, late query responses (including fetchers that ignore abort signals), and pending mutations across account switches and re-login.

## Deployment

### Alchemy

- Target: web on Cloudflare + server on Cloudflare
- Configure provider accounts: `cd packages/infra && bunx alchemy profile edit`
- Dev: bun run dev
- Deploy: bun run deploy
- Destroy: bun run destroy

`alchemy profile edit` stores the selected Axiom, Cloudflare, Neon, PlanetScale, and/or Prisma provider profiles under `~/.alchemy`; no provider-specific setup command is required by this scaffold.

The Cloudflare provider also reads `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from the environment and prefers them over the profile (its log says so: "Cloudflare: using environment variables … instead of the profile"), so a machine can deploy without an interactive login by putting both in the gitignored `packages/infra/.env`. The token is account-scoped: `GET /user/tokens/verify` rejects it with `Invalid API Token` while `/accounts/<id>/…` calls accept it, which is normal for tokens owned by the account rather than the user.

Two account-level prerequisites, once per Cloudflare account:

```bash
cd packages/infra
bunx alchemy provider cloudflare bootstrap --log-level info   # deploys the alchemy-state-store Worker (Durable Object backed)
```

- `bootstrap` fails with "Forbidden: You need a workers.dev subdomain in order to proceed" on an account that has never run a Worker. Register one over the API — `PUT /accounts/<id>/workers/subdomain` with `{"subdomain":"masterscorner"}` — or open the Workers page in the dashboard once; this account now owns `masterscorner.workers.dev`.
- `alchemy deploy` on a stack without a bootstrapped state store stops with "Cloudflare State store not found. Run 'alchemy provider cloudflare bootstrap …'". The bootstrap adopts the Worker it already created, so it is safe to re-run.

`packages/infra/alchemy.run.ts` binds the server Worker's environment: `DATABASE_URL`, `CORS_ORIGIN`, `BETTER_AUTH_SECRET`, its own URL generated by Alchemy, and the branch's four `AWS_*` media values as deploy-time secrets; the web Worker gets `VITE_SERVER_URL` pointing at the deployed API. Varlock makes values available to the *deploy process* — a Worker sees only what its `env` binding lists, so anything missing there is missing at runtime no matter how green the deploy looks.

Deploys are staged and default to a personal `dev_<username>` stage:

```bash
cd packages/infra && bunx alchemy deploy
```

Stable `masterscorner-{server,web}-production` names are selected only by the resolved Alchemy `production` stage. `NODE_ENV=production` alone does not select those names; personal stages retain Alchemy-generated names. The production wrapper still requires production environment values separately.

### Production deploys are guarded

Development values must never reach production, so production has its own entry point:

```bash
bun run deploy:production
```

`packages/infra/src/deploy-production.ts` rejects forwarded arguments before loading the environment, runs `guard-production.ts`, verifies that the target database can read `master_profile.revision`, and only then starts `alchemy deploy --stage production` with the checked environment. The production command accepts no arguments: do not append `--env-file`, `--stage` or another stack path. Export production values in the shell instead. Alchemy 2 beta.83 prefers that inherited environment over its default `.env` fallback; the stack declares no `secrets` override. This guarantee depends on that configuration: changing secret providers or CLI flags requires reviewing the guard against the new value source ([Alchemy precedence](https://alchemy.run/environments/secret-providers/)). The guard refuses to continue when:

- `NODE_ENV` is not `production` — production deploys take their values from the deploy environment, never from a development shell;
- `NEON_BRANCH` is missing or names a branch other than `production` — the marker `neon env pull` writes is the only signal that says where the values came from, so the guard fails closed instead of guessing;
- `DATABASE_URL` is unset;
- `AWS_ENDPOINT_URL_S3` is unset — `neon.ts` declares the media bucket, so the production branch must supply its endpoint;
- `DATABASE_URL` names the same endpoint as the value in `apps/server/.env`, including Neon's pooled/direct hostname aliases, which is the development branch;
- `BETTER_AUTH_SECRET` is still the value in `apps/server/.env` — production must sign its own sessions, never the development secret;
- `CORS_ORIGIN` is still the value in `apps/server/.env` — otherwise the API trusts the development origin and the deployed web app is locked out;
- the database cannot answer the profile revision read — `master_profile.revision` is required by every profile request, so the deploy refuses until `bun run db:migrate` has applied the reviewed migration to the production branch.

Each refusal prints what to do next. Supply the production branch's values to the deploy process itself — never pull them into `apps/server/.env`, which stays the development file: doing that points `bun run dev` at production *and* makes the guard's own comparison meaningless.

Development-file comparisons use `dotenv.parse`, including quoted values, inline comments and duplicate-key last-wins semantics. The parser does not load or overwrite the deployment process environment.

The load order is verified: an exported shell variable wins over `packages/infra/.env`, which wins over the development values that `packages/infra/.env.schema` imports from `apps/server/.env`. So a production deploy looks like this (POSIX shell; any shell works as long as the variables are exported):

```bash
neon env pull --branch production --file /tmp/production.env   # production DATABASE_URL, DATABASE_URL_UNPOOLED, NEON_BRANCH, AWS_*
set -a; . /tmp/production.env; set +a
export NODE_ENV=production                                     # Neon does not write this, and the guard requires it
export CORS_ORIGIN=<the web Worker URL, not the development localhost>
export BETTER_AUTH_SECRET=<the stored production secret>
bun run db:migrate                                            # apply the production branch's migrations before the Workers
bun run deploy:production
```

Four things the first rehearsal taught:

- **Generate the production `BETTER_AUTH_SECRET` once and store it** — password manager, CI secret, or the deploy environment. Regenerating it per deploy invalidates every existing session, and the env schema rejects a value below its minimum before the guard's own checks run.
- **Production Worker names are stable.** The guarded production deploy names the Workers `masterscorner-server-production` and `masterscorner-web-production`, so production deploys to `masterscorner-server-production.masterscorner.workers.dev` and `masterscorner-web-production.masterscorner.workers.dev`. Other stages keep Alchemy's generated names. The URLs are known before the first deploy, which removes the two-pass placeholder dance: set `CORS_ORIGIN` to the web URL in the deploy environment and deploy once. Confirm with `curl -D - -o /dev/null <server>/trpc/healthCheck -H "Origin: <web>"`, which must answer `Access-Control-Allow-Origin: <web>` and `Access-Control-Allow-Credentials: true`.
- **Turbo hides environment variables it does not know** (strict env mode). A variable reaches a task only when it is declared — in `globalEnv` or the task's own `env` — otherwise the task silently reads the value from the env files instead. `NEON_BRANCH`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` and `ALCHEMY_PASSWORD` are declared for that reason; when `NEON_BRANCH` was missing from that list, the guard inside `bun run deploy:production` reported `NEON_BRANCH is "development"` while the operator's shell said `production`.
- **Verify the deploy against the branch, not the URL.** A deployed API can answer on its workers.dev URL while pointing at the wrong database, so sign a probe account up through the deployed API and count it on the branch (`select count(*) from public."user"`), then remove it.

Padding `packages/infra/.env` with the same values works too, but that file also feeds `alchemy dev`, so a production database parked there points local development at production.

The `db:generate`, `db:push`, `deploy`, `deploy:production` and `destroy` scripts run Turbo tasks marked `interactive: true`. Turbo refuses an interactive task when there is no terminal UI, and `TURBO_UI=true` does not lift that, so run these from a real terminal; a CI job must call the package script directly instead. `db:migrate` is deliberately **not** interactive — `drizzle-kit migrate` never reads stdin — so a CI job can run it through Turbo.

### Production origins

- Required after the first deploy: set `CORS_ORIGIN` **in the deploy environment** (not in `apps/server/.env`, which holds the development value the guard compares against) to the exact deployed web origin, such as `https://masterscorner-web-production.masterscorner.workers.dev`. The browser sends `credentials: "include"`, so the API must echo the exact origin with `Access-Control-Allow-Credentials: true`; a placeholder origin answers the preflight but leaves the web app unable to call the API.

## Quality gates and CI

Every pull request runs the same four gates locally and in `.github/workflows/ci.yml`. `bun run gates` runs them in order, and is the merge gate whenever CI cannot run:

| Command | What it checks |
| --- | --- |
| `bun run check` | Biome through Ultracite — lint, assist and formatting. Warnings are reported and do not fail the run; errors do. |
| `bun run check-types` | `tsc --noEmit` per package, plus a web build, which is what generates the route tree. |
| `bun run build` | Production builds: web (`vite build`) and server (`tsdown`). |
| `bun run test` | Colocated `bun:test` suites, including the API authorization contract, migration-target checks, production deploy guard/CLI checks and Neon branch lifecycle policy. |

The workflow runs on pull requests to `development` and `master`, and on pushes to `development`. It needs **no secrets and no `.env` files**: installing, running the Varlock codegen postinstall, linting, type-checking and building all succeed with nothing set (measured in a clean worktree), and the web build simply inlines no `VITE_SERVER_URL` — CI never deploys that artifact. No test may read a real value.

Tests are `bun:test`, colocated as `*.test.ts` next to the code they cover. Packages without tests yet declare `bun test --pass-with-no-tests`, so dropping a test file into one of them is all it takes to be covered. Live database suites are opt-in and are not part of CI: `bun run test:db` in `packages/api` exercises the profile/media round trips, and the same command in `packages/db` exercises class constraints and relations against the development branch. The gates that need a terminal (`db:generate`, `db:push`, `deploy`, `deploy:production`, `destroy`) are never invoked by CI — Turbo refuses interactive tasks without a TTY.

Requiring this workflow before merging into `development` and `master` is branch protection, which is a repository setting and therefore an owner action.

## Project Structure

```
my-better-t-app/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
│   ├── native/      # Mobile application (React Native, Expo)
│   └── server/      # Backend API (Hono, TRPC)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run deploy`: Deploy to the default development stage
- `bun run deploy:production`: Deploy to production (guarded, see Deployment)
- `bun run check`: Lint and format check (Biome through Ultracite)
- `bun run check-types`: Check TypeScript types across all apps
- `bun run test`: Run the package test suites
- `bun run gates`: Run check, check-types, build and test in order
- `bun run dev:native`: Start the React Native/Expo development server
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
