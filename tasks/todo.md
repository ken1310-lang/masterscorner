# MastersCorner first release — task list

Sequencing, risks and open questions: `tasks/plan.md`. Scope: `product-vision.md` §29, §30, §39 and `docs/decisions/ADR-002-mvp-scope-and-free-pro-site.md`.

One task = one pull request. A task is done only when its verification column passes on the development environment.

## Phase 0 — Platform

### [x] 1. Environments and database branches — done and verified against development and production

- **Description:** Configuration for development and production: the Neon project in `aws-ap-southeast-1` (the region Object Storage requires, ADR-004) with `development` and `production` branches and the media bucket declared on each through `neon.ts`, per-environment secrets, documented setup, and the split that keeps production from being the first place a change runs: development runs on the developer's machine against the development branch, and production is the only deployed environment (one Alchemy stack deploying both Workers).
- **Acceptance:** `bun run dev` runs the API and web against the development branch; production values live only in the production configuration; the development branch's bucket holds an object that the production branch's credentials cannot read; no development Worker exists in the Cloudflare account — the local machine is the development environment and only production is deployed (ADR-001, ADR-004); README explains how to onboard a new environment.
- **Verify:** sign up and sign in against the development branch; confirm production credentials are not referenced by development configuration; `bun run db:migrate` applies cleanly to a fresh branch; `bun run deploy:production` publishes both Workers and the deployed API reports the production branch.
- **Deps:** none
- **Files:** `neon.ts`, `apps/server/.env.schema`, `packages/infra/.env.schema`, `packages/infra/src/deploy-guard.ts`, `packages/infra/src/guard-production.ts`, `packages/db/drizzle.config.ts`, `packages/db/src/migrations/*`, `package.json`, `turbo.json`, `README.md`
- **Scope:** Medium
- **Status (2026-10-21): done — both acceptance rows that were waiting on credentials now pass on the live project, development and production.** Cloudflare credentials are environment-based: `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` in the gitignored `packages/infra/.env`, declared in `packages/infra/.env.schema`; Alchemy logs "Cloudflare: using environment variables (CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN) instead of the profile". Two account prerequisites were needed and are done: `alchemy provider cloudflare bootstrap` deployed the `alchemy-state-store` Worker (a stack without it stops with "Cloudflare State store not found"), and that bootstrap in turn required a `workers.dev` subdomain, registered as `masterscorner` (`PUT /accounts/<id>/workers/subdomain`). **Development:** `bun run dev` reported `[server] create (local)` and `[web] create (local)` — the dev environment is the local machine, per ADR-004 — with the API ready at `http://localhost:3000` in 6.7 s and the web app at `http://localhost:3001` in 24.2 s; `GET /` returned `OK`, `/trpc/healthCheck` returned `{"result":{"data":"OK"}}`, `/trpc/privateData` returned 401 without a session, and a probe through the running Worker signed up (200 + cookie), signed in (200 + cookie), read its session (200, user id present) and read the protected procedure (200, "This is private") against the **development** branch, leaving 0 users behind. **Production rehearsal:** the baseline migration applied to the production branch first; `bun run deploy:production` passed the guard and deployed both Workers — `my-better-t-app-server-production-bxqmxojjh33osaj6.masterscorner.workers.dev` and `my-better-t-app-web-production-5x7dz4qwhr5nq46v.masterscorner.workers.dev`. The deployed API answers `OK` and `{"result":{"data":"OK"}}` and 401 without a session; the deployed web returns 200 HTML; a probe sign-up through the deployed API landed in the **production** branch (1 row) while development stayed at 0, then was removed — the strongest available proof that the deployed stack points at production, since a Worker can answer on its URL while pointing at the wrong database. CORS was verified from the real web origin after a second pass (`Access-Control-Allow-Origin: <web>` plus `Access-Control-Allow-Credentials: true`); the first pass necessarily carried a placeholder origin because Alchemy names Workers `my-better-t-app-<name>-<stage>-<hash>.<subdomain>.workers.dev`, so the web URL only exists after one deploy. Account inventory afterwards: `alchemy-state-store`, the two production Workers, and **no development Worker**. **Defect found and fixed during the rehearsal:** Turbo's strict environment mode hid `NEON_BRANCH` (and would have hidden `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `ALCHEMY_PASSWORD`) from tasks, so the guard inside `bun run deploy:production` read `NEON_BRANCH=development` from the env files while the operator's shell said `production` — all four are now declared in `turbo.json` `globalEnv`, and the README documents that Turbo hides undeclared variables. Also fixed while here: the guard only compared `DATABASE_URL` against `apps/server/.env`, so a production deploy would have shipped the development `BETTER_AUTH_SECRET` and `CORS_ORIGIN`; both are now refused. **Left over, none of it on the critical path of the code:** `masterscorner.in` is not delegated to Cloudflare (the account still has zero zones), so the custom-domain half of Checkpoint A cannot resolve yet — ADR-004 already defers the Pro Site subdomain on that gate; the repository has no git remote, so no pull request can be opened; and the interactive-task constraint for CI is carried by Task 2.
 Neon project `masterscorner` (`wispy-sun-39319632`, `aws-ap-southeast-1`), branches `development` (`br-odd-king-azcfh1ck`, current) and `production` (`br-delicate-haze-azsvo7vg`, default); before the rehearsal production held no relations at all and it now carries the baseline Better Auth schema plus `drizzle.__drizzle_migrations`. Precedence for every value the guard checks is verified: shell variable > `packages/infra/.env` > the development values `packages/infra/.env.schema` imports from `apps/server/.env`. Repository gates at the end of this pass: `bun run check-types` 8/8, `bun run build` 2/2, the PR 1 file set lint-clean after `bunx ultracite fix`, `bun run db:generate` reporting "No schema changes", `bun run db:migrate` clean on both branches, and the guard matrix re-run after the extension (seven cases, refusals and the one pass exactly as designed).

- **Review fixes (2026-10-21).** Four findings from the PR 1 review, all reproduced before changing code. (1) The guard accepted an unverified database whenever `NEON_BRANCH` was absent and no development env file existed on the deploy runner; it now requires the marker to be present *and* `production`, because the marker is the only signal that proves which branch the values came from — matrix re-run at nine cases through `assertProductionTarget` itself, including `NEON_BRANCH` unset → refused. (2) `neon.ts` exempted branches that already existed, so a preview created before `neon deploy` kept no expiry; the exemption is now the default branch and the two long-lived names only, verified on a throwaway branch that gained `Expires At 2026-10-28T06:50:24Z` from `neon deploy --update-existing` (with the old code the same run reported no changes). (3) The guard required a media bucket endpoint while no Worker could read the bucket: the four `AWS_*` values are now bound into the server Worker, verified on the deployed Worker's bindings (`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as `secret_text`, `AWS_ENDPOINT_URL_S3` and `AWS_REGION` as `plain_text`, no value present in the API response), and the redeploy left the deployed API and web healthy. (4) A database created with `db:push` could not adopt the baseline: reproduced on a throwaway branch (`error: relation "account" already exists` from `drizzle-kit migrate`), and after the documented one-time adoption the same command reports `migrations applied successfully!` without replaying the SQL. The throwaway branch was deleted afterwards; `development` and `production` were untouched by the experiment.

### [x] 2. Test and CI wiring — runner and workflow merged; the GitHub transport is postponed

- **Description:** A `test` task in `turbo.json`, `bun:test` available to the packages, and a workflow that runs the quality gates on every pull request (PRD §37.4). This task also owns the lint gate that already exists but cannot pass: `bun run check` reports 985 diagnostics repo-wide — 645 in `masterscorner.html`, 28 in `.omp/skills/**`, the remainder dominated by `assist/source/useSortedAttributes`, `assist/source/useSortedProperties`, `organizeImports` and formatter diffs across `packages/ui`, `apps/web` and `apps/native`. Scope `biome.jsonc` to source (the prototype, installed skills, `docs/`, `tasks/` and `.codegraph/` are reference material, not code) and take the remainder with `bunx ultracite fix`. CI must also not call the `interactive: true` tasks (`db:generate`, `db:migrate`, `db:push`, `deploy`, `deploy:production`, `destroy`): turbo refuses an interactive task without a TUI, and `TURBO_UI=true` does not lift it (verified) — either drop the marker from the two tasks that never read stdin (`db:generate`, `db:migrate`) or have the workflow invoke the package script directly. Alchemy then asks its own confirmation (`Deploy? Deploy/Cancel`) before it applies a plan, so a CI deploy needs a non-interactive flag or `--no-input` plus whatever it requires to accept the plan. Add a `.gitattributes` with `eol=lf` for the source files while doing this: with `core.autocrlf=true` a Windows checkout is CRLF, and Biome's formatter then reports whole-file diffs that CI (Linux, LF) never sees — measured at 988 diagnostics repo-wide, and the difference between a gate that can be trusted locally and one that cannot.
- **Acceptance:** CI runs check-types, lint and build on a pull request; a failing test fails the build; the task list's unit-level verifications have a place to live.
- **Verify:** open a throwaway pull request, observe the checks run and fail on a deliberately broken test, then pass once reverted. Needs the git remote Task 1 is waiting on.
- **Deps:** 1
- **Files:** `turbo.json`, `.github/workflows/*.yml`, `biome.jsonc`, `.gitattributes`, `package.json`, `packages/*/package.json`, `packages/config/tsconfig.base.json`
- **Scope:** Medium
- **Status (2026-10-21): the lint half is done and green on `pr/2a-lint-baseline`; the runner and the workflow are the next PR.** Measured: `bun run check` went from 988 errors across 117 files to **0 errors, 24 warnings across 82 files** (exit 0), `bun run check-types` 8/8, `bun run build` 2/2, and the dev stack still serves — `GET /` → `OK`, `/trpc/healthCheck` → `[{"result":{"data":"OK"}}]`, `/api/auth/ok` → 200, and web `/` and `/login` return 200 with rendered HTML. The plan's "scope the config, then `ultracite fix`" was not enough, so the three deviations are recorded here. (1) `biome.jsonc` excludes reference material (prototype, `.omp/skills`, `.codegraph`, `docs/`, `tasks/`, the PRD) plus two things that are not ours to reformat: `packages/db/src/migrations` (drizzle-kit rewrites the snapshot on the next `db:generate`) and `apps/native` — ADR-002 keeps the Expo app untouched, no gate builds or type-checks it, so a format pass there would be 40 unverifiable edits to an app this release does not ship; it returns to the gate when native work starts. (2) `ultracite fix` took 55 files and left 57 diagnostics it cannot fix: eight files were fixed by hand (the PR lists them — one is a real trap: `packages/api/src/context.ts` must stay a type alias, an interface has no implicit index signature and `apps/server` stops compiling), the rest are warnings with a stated reason — the two documented conventions (`noNamespaceImport` for Alchemy/Effect/Better Auth/Drizzle, `noBarrelFile` for the three single-purpose entry points), the template screens Task 5 replaces, and four files whose finding is decided by their caller or by TypeScript's syntax. (3) `.gitattributes` pins `eol=lf` and marks generated files; the worktree carried 12 CRLF files (index LF) and the formatter reports whole-file diffs on them that Linux CI never sees. The `test` task, the workflow, the Varlock-in-CI fix and the two broken root scripts (`dev:web`, `dev:server`) are PR 2b.
- **Status part 2 (2026-10-21): the runner and the workflow are in, so Task 2 is complete on `pr/2b-test-and-ci`.** `bun run test` is `turbo run test`: 13 tests in two suites — a router contract gate in `packages/api` (`healthCheck` public, `privateData` refuses an anonymous caller, a signed-in caller gets their own record) and the deploy-guard matrix in `packages/infra` (every field the guard reads, the fail-closed missing-`NEON_BRANCH` case, the host-not-credentials comparison, the dotenv reader) — plus `bun test --pass-with-no-tests` in `packages/db`, `apps/server` and `apps/web`, where adding a test file is all it takes to be covered. The `bun:test` types are decided once and applied everywhere: `bun` joins the shared base's `types`, `@types/bun` is declared at the workspace root and in the five packages, and `apps/web`'s own baseline lists `bun` beside `vite/client` — so no package has to exclude `*.test.ts` from `tsc`. `.github/workflows/ci.yml` runs on pull requests to `development` and `master` and on pushes to `development`: `bun install --frozen-lockfile`, then `check`, `check-types`, `build`, `test`, with `TURBO_UI=stream`, no secrets and no interactive task. `development` now exists on the remote (created from `master`), so that trigger is real; **requiring the workflow is branch protection and remains an owner action**.
- **Status part 3 (2026-10-21): the CI path was rehearsed in a clean worktree before the PR opened, and the failure §8 predicted did not happen.** With no `.env` files and no environment variables at all, `bun install --frozen-lockfile` succeeded — the Varlock codegen postinstall ran four times and printed `✅ Code generated successfully` each time — and `bun run check` (0 errors, 24 warnings), `bun run check-types` (8/8) and `bun run build` (2/2) all passed on Linux-style LF. So no placeholder `_VARLOCK_ENV_KEY` and no CI env file are needed; the only consequence is that CI's web build inlines no `VITE_SERVER_URL`, and that artifact is never deployed (the README says so). The two broken root scripts are settled: `bun run dev:web` starts Vite now (verified serving HTTP 200 with rendered HTML on 3001) because `dev:bare` is registered, and `dev:server` is deleted — it filtered a package that does not exist, and `bun run dev` already serves the API through Alchemy. `db:migrate` lost its `interactive: true` marker (`drizzle-kit migrate` never reads stdin), so a CI job can run it through Turbo, and the README's paragraph on interactive tasks was updated to match.
- **Status part 4 (2026-10-21): the workflow is on the branch, but GitHub Actions cannot start it on this repository — a platform fault, not this YAML.** Every run on `pr/2b-test-and-ci` ends in `startup_failure` after 0 s with zero jobs, `name: ""` and `path: "BuildFailed"`; a throwaway branch carrying nothing but `on: push` + `echo hello` failed identically, the file parses (`js-yaml`), and `actions/permissions` reports `enabled: true` / `allowed_actions: all` while the workflow registry reports `total_count: 0` against `workflow_id 391461698`. That is the orphaned `BuildFailed` registration GitHub is tracking in community discussion #206902 (independent private-repository reports since 2026-09-05). Because no job is ever created, criterion 4's CI half cannot be observed yet; its gate half is: a deliberately failing test in `packages/api` made `bun run test` exit non-zero (`(fail) deliberately fails`, `Failed: @my-better-t-app/api#test`), and removing it returned exit 0 — on the same clean-worktree pipeline that installs, lints, type-checks, builds and tests with no environment at all. Unblocking needs GitHub Support to purge the stale registration (commenting on that discussion with the run IDs 39567904414, 39567913345, 39568078834) or the repository to become public; until then the four commands are the merge gate locally.
- **Status part 5 (2026-10-21): the repository was made public, the registration healed, and the real cause surfaced — the account is locked for billing.** After the visibility change, `GET /repos/.../actions/workflows` lists `CI` (`.github/workflows/ci.yml`, `state: active`) and the first push to `development` dispatched a run named `CI` instead of the ghost; branch protection is available too (`GET /branches/master/protection` now answers `404 Branch not protected` instead of the Pro/public `403`). The job still refuses to start, but the check-run annotation now says why: **"The job was not started because your account is locked due to a billing issue."** — zero steps, two seconds. That is an account-level lock, so it also applies to public repositories where minutes are free; clearing it is a payment/invoice/spending-limit action on the owner's account, and the protection rule is deliberately **not** enabled until one run is green, because requiring a check that never reports would freeze every merge. Until then `bun run gates` (check → check-types → build → test, one command, documented in the README) is the merge gate.
- **Status part 6 (2026-10-21): PR 3 and PR 4 were merged into `master` (9b51159, d3eb3f7) and `development` was fast-forwarded to the same commit.** The merged tree is the one both branches verified: `check` 0 errors/24 warnings, `check-types` 8/8, `build` 2/2, `test` 5/5 with 13 tests, and the dev stack serving.
- **Status part 7 (2026-10-21): postponement, owner's call.** The account billing lock that stops GitHub from starting the job is not being chased now — it moves to the last task (`### [ ] Last` below). Nothing else in this task is pending: the runner, the workflow, the lint gate and the two root scripts are merged and verified, and `bun run gates` is the merge gate in the meantime. Two consequences are deliberate: **branch protection stays off** until a run reports, because requiring a check that never reports freezes every merge, and every PR shows a red `CI` check whose annotation is the lock, not the code.

### [x] 3. Web shell and design tokens — done and verified against the prototype at four widths

- **Description:** Port the prototype's design system into the app: palette, type scale, breakpoints and container, self-hosted Outfit/Manrope, header, navigation and footer components, plus the global not-found and error screens the prototype defines (`/404`, `/error`) (ADR-003).
- **Acceptance:** tokens exist in one place; header and footer match the prototype at 1440/980/760/520 px including the scrollable nav row; the not-found and error screens render with the prototype copy as amended by deviation D13; no mock CSS, no base64 font or image, no `.mc-` class names in the bundle.
- **Verify:** browser comparison against `masterscorner.html` at four widths; inspect the built CSS for the palette values; keyboard-tab the header.
- **Deps:** 1
- **Files:** `packages/ui/src/styles/globals.css`, `packages/ui/package.json`, `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/_marketplace/route.tsx`, `apps/web/src/routes/_marketplace/index.tsx`, `apps/web/src/routes/not-found.tsx`, `apps/web/src/routes/error.tsx`, `apps/web/src/components/shell/*`
- **Scope:** Medium
- **Status (2026-10-21): ported and verified; PR 6.**
  - Tokens live once in `packages/ui/src/styles/globals.css`: the seventeen prototype properties (masterscorner.html 162-182) under the shadcn semantic names the primitives already use plus `--color-navy*`, `--color-brand*`, `--color-line`, `--color-footer`, `--shadow-mc`; `.on-navy`/`.on-light` re-map `--muted-text`, `--accent-text` and `--focus`; `--breakpoint-sm/md/lg` are the complements of the mock's 520/760/980 queries; `shell-container` is the single gutter rule. No `.dark` block; `color-scheme` is light and the template's `class="dark"` is gone.
  - Fonts are four `@font-face` rules over real woff2 files (Outfit 100-900 and Manrope 200-800, latin + latin-ext), matching the prototype's declared faces; the latin files are preloaded from the root document. Vite's 4 kB inliner is disabled for `.woff2`, which is what kept one subset from becoming a base64 data URI (found in the first build, then removed).
  - Measured against the prototype at 1440/980/760/520 with computed styles, not eyeballed: header 74 / 105.8 / 116.8 / 116.8 px, container 1180 / 940 / 732 / 492 px, footer 389 / 576 / 918 / 1184 px, footer grid `600px 500px` with an 80 px gap, links 3 / 3 / 2 / 1 columns, bottom bar row → column with an 8 px gap at 760, CTA 43 px and inline at desktop → 44 px and `inline-flex` below 761, logo 20 → 17 px at 520, line-height 21 px (1.5) on links and CTA. Every value matched; the only measured differences left are the ones D6 requires (no nav row, no footer columns, `For Masters` not yet a link).
  - The scrollable nav row was verified with the prototype's five labels rendered temporarily and then removed: at 980/760/520 it is `flex`, `overflow-x:auto`, `gap:18px`, `order:3`, full container width, scrollbar hidden, links 44 px `nowrap`; at 1440 it is `gap:23px`, `order:0`, `margin-left:auto`, scrollbar normal.
  - `/not-found` and `/error` render the prototype copy amended by D13 (`preview` dropped, heading scale applied): grid, `place-content:center`, `gap:10px`, `min-height:100dvh`, no header or footer, skip link present; an unknown path lands on the root not-found screen and the marketplace layout renders the same content inside the shell. Keyboard: first Tab reveals the skip link at `top:12px` with a 2 px outline, second Tab reaches the logo.
  - Bundle: `bun run check` 0 errors / 22 warnings, `check-types` 8/8, `build` 2/2, `test` 13 tests; built CSS contains `#f6f5f2`, `#0b132b`, `#d14b5a`, `#070d1e`; no `.mc-` class names and no `data:font` in `dist`; four woff2 files emitted.
  - Open by design: the header shows logo, `Sign in` (`/login`) and `For Masters` — a styled `span` until Task 15 ships `/for-masters` (D6); the nav row and footer columns render from empty lists that Tasks 11-15 fill. The demo home still renders under `_marketplace` until Task 14.
  - **Review fixes (2026-10-21), after the Devin review on PR 6.**
    - *Signed-in visitors lost the sign-out action:* the shell header replaced `UserMenu` with a static link, and `UserMenu` holds the only Sign Out. The header now renders `UserMenu` when `authClient.useSession()` has a session and the prototype's `Sign in` link otherwise, so guests keep the exact four-width match. Verified with a real session on the development branch (`shell-probe@example.com`, created through `/api/auth/sign-up/email`, session cookie set from `/api/auth/sign-in/email`): the header shows the account menu, the dropdown lists the email and `Sign Out`, and clicking it clears the cookie and returns the header to `Sign in`. The probe user is left on the development branch as fixture data for Task 4.
    - *Mobile visitors lost the sign-in route:* below 761 the prototype hides its own `Sign in` link, and its fallback was the footer's `For masters` column, which D6 held back. The column now renders with the two destinations that exist — `Sign in` → `/login`, `Dashboard` → `/dashboard` — which is the shell's own rule (a column appears once it has a live link), one PR earlier than §6.6's table scheduled it. Verified: at 520 the header link is `display:none` and the footer link navigates to `/login`.
    - *`/error` retry only invalidated router state:* correct. Both retries now invalidate cached data with `refetchType: "all"` before re-running the route (the standalone screen through the router context's `queryClient`, the root boundary through the same client plus its `reset()`), because the failing component is unmounted by the time the button is reachable, which is exactly when a default invalidation would mark a query stale without refetching it. The root boundary also gained the skip link the standalone screen already had (§6.7 keeps it on both). Measured on the development stack with request counts: seeded cache on `/` → client-side nav to `/error` → click = 1 → **2** `/trpc/healthCheck` requests, against 1 → 1 for the default invalidation, so the extra request is the query refetch and not `router.invalidate()` re-running a loader.
    - *Footer `Sign in` opened the sign-up form:* correct, and it was the sharpest of the five — below 761 the footer is the only sign-in link. `/login` now validates a `form` search parameter defaulting to `signin` (the prototype's screen signs in), every caller states the form it means (header, footer, `UserMenu`'s guest branch, and the `_auth` guard's redirect, which the typechecker demanded once the parameter existed), and `?form=signup` plus the in-page toggle still reach account creation. Verified: header at 1440 and footer at 520 both open `/login?form=signin` with fields `email, password` and submit `Sign In`; `?form=signup` gives `name, email, password` and `Sign Up`; the toggle flips in place. Task 5 rebuilds these screens against the prototype and owns the final form routing.
    - *Root boundaries lose the document shell:* **not reproducible.** Root-boundary responses keep the document, stylesheet and client entry. Probed in SSR: `/this-does-not-exist` (root `notFoundComponent`) and `/error` both returned `<html lang="en">`, the `index.css` link and the dev client entry, and the root document itself renders around the boundary (checked with a temporary `lang`/body marker that showed up on `/`, `/this-does-not-exist` and `/not-found`); a temporary loader throw on `/login` produced the framework error document with the same shell. The suite of three probes is the evidence; no code change made.

### Checkpoint A

- [x] Development and production are separated — development is the local machine against the development branch (`[server] create (local)`, `[web] create (local)`), production is the only deployed stack, and the guard rejects development values. CI green and the shell are Task 2 and Task 3: the shell is Task 3, and CI's transport is postponed to `Last` below (workflow merged and rehearsed; GitHub will not start a job until the account's billing lock is cleared).
- [~] The production stack deploys from `master` as an empty rehearsal: both Workers serve their public URLs — `my-better-t-app-server-production-bxqmxojjh33osaj6.masterscorner.workers.dev` and `my-better-t-app-web-production-5x7dz4qwhr5nq46v.masterscorner.workers.dev` — and the deployed API writes to the production branch. **The custom domain cannot resolve yet:** the account has no zones, so `masterscorner.in` still has to be added to Cloudflare (nameservers at the registrar). ADR-004 defers the Pro Site subdomain on exactly this gate.
- [ ] Owner review before feature work starts.

## Phase 1 — Identity

### [~] 4. Master account and auth

- **Description:** Master account creation with an account type on the user record, sign-up and sign-in through Better Auth, password reset, and the email-verification configuration (PRD §15.2). Email delivery depends on the single open decision (the provider, `tasks/plan.md` §Open Questions): if it is not settled for this PR, ship sign-up and sign-in, and add verification and reset in the follow-up PR for this task.
- **Acceptance:** a new account is created with account type `master`; sessions survive reload; a protected procedure returns `UNAUTHORIZED` without a session and the session user id with one; password reset works end to end.
- **Verify:** `appRouter.createCaller` tests for the authorization boundary; manual sign-up, sign-in, reset and protected-read on the development environment.
- **Deps:** 1, 2
- **Files:** `packages/auth/src/index.ts`, `packages/db/src/schema/auth.ts`, `packages/api/src/routers/*.ts`, `apps/server/src/index.ts`
- **Scope:** Medium
- **Status (2026-10-21): account type and the session boundary done on `pr/4-identity`; email flows deferred by the owner.** `user.account_type` is `text NOT NULL DEFAULT 'master'`, typed `AccountType`, and `user.additionalFields.accountType` is server-owned (`input: false`, `defaultValue: DEFAULT_ACCOUNT_TYPE`), so a forged sign-up payload cannot set it. Migration `20261021120119_identity_account_type` applied to the development branch; re-generating reports "No schema changes". Verified on the running development stack: sign-up with `"accountType": "admin"` returned `master`; sign-in and `get-session` returned `master`; `privateData` returned the record with the session cookie and `401 UNAUTHORIZED` without one; the existing `shell-probe@example.com` row was backfilled to `master`; the Task 4 probe account was deleted. Gates: `check` 0 errors / 22 warnings, `check-types` 8/8, `build` 2/2, `test` 5/5 (53 tests). **Deferred half:** password reset and email verification wait for a provider and a verified sender domain (the account has no Cloudflare zone yet); the owner chose the deferral on 2026-10-21 and the follow-up PR for this task owns them. No stub or fake sender ships. Task 5 (auth screens, guard, console shell) remains.
- **Review follow-up (2026-10-21):** `DEFAULT_ACCOUNT_TYPE` is now shared by the column default and Better Auth's `defaultValue`; the contract assertion names the literal and a compile-time check pins `Session["user"]["accountType"]` to `AccountType`; the web client's `inferAdditionalFields` typing is recorded for Task 5. Tests are 53 (API 4, db 16, infra 25, web 8).

### [x] 5. Auth screens and route guards

- **Description:** Sign-up, sign-in and password-reset screens ported from the prototype's auth layout, plus the protected console shell (PRD §15, deviation D7: the label is Email, not Email or mobile).
- **Acceptance:** a master can sign up, sign in and reset a password from the UI; unauthenticated visits to `/dashboard*` redirect to sign-in and return afterwards; console navigation shows Overview, Profile, Classes and Pro Site only.
- **Deferred:** the password-reset screen ships with the Task 4 email follow-up (`docs/specs/SPEC-identity.md` §2.2); Task 5 ships sign-up and sign-in only.
- **Verify:** browser walkthrough of the three screens and the redirect both ways; empty-state console renders without error.
- **Deps:** 4
- **Files:** `apps/web/src/routes/login.tsx`, `apps/web/src/routes/signup.tsx`, `apps/web/src/routes/_auth/route.tsx`, `apps/web/src/routes/_auth/dashboard/*`, `apps/web/src/lib/auth-client.ts`
- **Scope:** Medium
- **Status (2026-10-21): done on `pr/5-auth-screens` (stacked on `pr/4-identity`).** `/login` and canonical `/signup` use the prototype's auth layout; the guard carries the current path and the forms return to it. The web client declares `accountType` to `inferAdditionalFields` (`input: false`), so the console labels the real account type. Console nav is exactly Overview, Profile, Classes and Pro Site; each destination renders a truthful empty state, and `UserMenu` is the only sign-out control. Browser walkthrough at 1440/980/760/520: auth layout and keyboard order, sign-up, sign-in, duplicate-email error, external/backslash redirect dropped, guard round trip, active nav/top-bar title, no overflow at 520; sign-out returns to `/` and the session cookie is cleared. Gates: `check` passes, `check-types` 8/8, `build` 2/2, `test` 5/5 (59 tests: API 4, db 16, infra 25, web 14). The probe account was deleted. Password reset remains deferred with Task 4's email follow-up.

### Checkpoint B

- [x] A master can create an account and reach an empty console; no console link points at an unbuilt screen.

## Phase 2 — Master profile and media

### [ ] 6. Profile schema

- **Description:** Tables and relations for master profile (name, martial arts, years teaching, home city, introduction), teaching locations and media references, with a migration (PRD §8, §8.2).
- **Acceptance:** migration applies cleanly to the development branch and is committed; one master owns many locations and many media items; a profile cannot exist without an owner.
- **Verify:** `bun run db:generate` produces reviewable SQL; apply on a fresh branch; query the shape through `createDb` in a test.
- **Deps:** 4
- **Files:** `packages/db/src/schema/master.ts`, `packages/db/src/schema/index.ts`, `packages/db/src/relations.ts`, `packages/db/src/migrations/*`
- **Scope:** Medium

### [ ] 7. Console profile editor

- **Description:** The console profile screen: identity fields, martial arts, teaching locations (add, edit, remove), with validation and save feedback (design: `docs/design-alignment.md` §7).
- **Acceptance:** every field persists and reloads after a fresh session; locations are ordered and removable; a validation error names the field and does not clear the form; the screen matches the prototype's profile layout.
- **Verify:** contract tests for the profile procedures (authorization, validation, round trip); browser walkthrough at 1440 and 760 px.
- **Deps:** 6
- **Files:** `packages/api/src/routers/master.ts`, `packages/api/src/routers/index.ts`, `apps/web/src/routes/_auth/dashboard/profile.tsx`, `apps/web/src/components/profile/*`
- **Scope:** Medium

### [ ] 8. Media upload

- **Description:** Storage for the profile photo and the Pro Site logo in Neon Object Storage (ADR-004): the `media` bucket declared in `neon.ts`, the upload path from the console through the Worker, size and type limits, rate limiting with `503` retry, versioned object keys, and rendering in the console and on public screens (PRD §30.2).
- **Acceptance:** a master uploads an image and sees it after reload; oversized or wrong-type uploads are rejected with a clear message; deleting a photo leaves the profile valid; the row stores the object key and the object is readable from the branch endpoint without credentials; a replacement upload writes a new key instead of overwriting the old one.
- **Verify:** upload JPEG, PNG and a deliberately large/wrong file; confirm the stored URL renders in the console; `neon bucket object list` shows the object on the development branch; a production-branch credential fails to read it.
- **Deps:** 7
- **Files:** `neon.ts`, `apps/server/.env.schema`, `apps/server/src/services.ts`, `packages/api/src/routers/media.ts`, `apps/web/src/components/profile/photo-field.tsx`
- **Scope:** Medium

### Checkpoint C

- [ ] A master's profile, locations and photo survive a fresh sign-in and render identically to the prototype's profile layout.

## Phase 3 — Classes

### [ ] 9. Class schema

- **Description:** Classes owned by a master: martial art, audience, level, schedule rows, location reference, optional fee (amount plus period), status; with a migration (PRD §10.2, §19.3).
- **Acceptance:** a class requires a location and at least one schedule row; fee is optional and stored as structured amount plus period; status supports active, paused and full; deleting a location that classes reference is refused.
- **Verify:** migration on the development branch; contract tests for each constraint; a query that lists a master's classes with schedules.
- **Deps:** 6
- **Files:** `packages/db/src/schema/classes.ts`, `packages/db/src/schema/index.ts`, `packages/db/src/migrations/*`
- **Scope:** Medium

### [ ] 10. Console classes CRUD

- **Description:** The console classes screen: list, create, edit, pause and remove, with schedule rows and audience selection (design: `docs/design-alignment.md` §7).
- **Acceptance:** a master manages multiple classes; changes appear immediately in the console list; removing a class asks for confirmation; the screen shows the prototype's table styling and a proper empty state.
- **Verify:** contract tests for create, update, status change and delete with authorization; browser walkthrough at 1440 and 760 px.
- **Deps:** 9
- **Files:** `packages/api/src/routers/classes.ts`, `apps/web/src/routes/_auth/dashboard/classes.tsx`, `apps/web/src/components/classes/*`
- **Scope:** Medium

### Checkpoint D

- [ ] A master manages three classes with schedules and locations; every constraint from Task 9 is enforced through the UI, not only in the database.

## Phase 4 — Directory

### [ ] 11. Public class listing

- **Description:** `/classes` built from real classes: class name, art, master, location, next session, fee, filters for art, location and audience, and an honest empty state (PRD §10).
- **Acceptance:** the listing shows only real classes; filters compose and adjust the query; a search with no matches explains what is missing instead of showing invented rows; no Book action is rendered (deviation D3).
- **Verify:** seed the development environment with classes across two masters; browser check that filters change results; contract test for the filter query.
- **Deps:** 9, 10
- **Files:** `packages/api/src/routers/directory.ts`, `apps/web/src/routes/classes.tsx`, `apps/web/src/components/classes/class-row.tsx`
- **Scope:** Medium

### [ ] 12. Master registry

- **Description:** `/masters` with filters for martial art, location and audience, sort by experience, pagination and empty state (PRD §7.2, §7.5).
- **Acceptance:** filters match the prototype's control bar; cards show name, arts, city, years and audience tags only — no rating, review count, verification badge or fee unless supplied; pagination is stable under filtering.
- **Verify:** browser comparison at four widths; contract test for filter and pagination boundaries (first page, last page, no results).
- **Deps:** 7, 9
- **Files:** `packages/api/src/routers/directory.ts`, `apps/web/src/routes/masters.index.tsx`, `apps/web/src/components/masters/master-card.tsx`
- **Scope:** Medium

### [ ] 13. Master profile page

- **Description:** `/masters/$slug` with identity, about, training paths, locations and schedule from real data (PRD §8.2).
- **Acceptance:** sections render only when data exists; a master with one location and no photo still renders credibly; unknown slug shows the not-found screen; no reviews, ratings, badges, trial or enquiry actions.
- **Verify:** browser check of a full profile, a minimal profile and an unknown slug at 1440 and 760 px against the prototype minus deviations D1-D3.
- **Deps:** 12
- **Files:** `apps/web/src/routes/masters.$slug.tsx`, `apps/web/src/components/masters/profile-*.tsx`
- **Scope:** Medium

### [ ] 14. Home page

- **Description:** `/` with hero, search control, featured masters, class preview and the master call to action, from real data (PRD §6.2).
- **Acceptance:** search navigates to the registry with filters applied; sections whose modules do not exist (academies, events, Experience Card) are absent rather than empty; no rating, badge, fee or count renders without stored data (deviations D1-D5).
- **Verify:** browser comparison at four widths; click-through from search to the filtered registry; grep the routes for links to unbuilt destinations.
- **Deps:** 12, 13
- **Files:** `apps/web/src/routes/_marketplace/index.tsx`, `apps/web/src/components/home/*`
- **Scope:** Medium

### [ ] 15. For Masters page

- **Description:** `/for-masters` acquisition page: what a listing includes, the console preview panel and the sign-up call to action (PRD §6.2 "For masters").
- **Acceptance:** no plan name, price or verification claim appears (deviations D2, D4); the console preview panel shows real numbers or omits them; the call to action reaches sign-up.
- **Verify:** browser comparison at four widths; grep the page for plan and price strings; click through to sign-up.
- **Deps:** 5
- **Files:** `apps/web/src/routes/for-masters.tsx`
- **Scope:** Small

### Checkpoint E

- [ ] An anonymous visitor can search, open a master, read their classes and reach the master sign-up path without encountering a fabricated fact or a dead link.

## Phase 5 — Pro Site

### [ ] 16. Pro Site renderer

- **Description:** A branded site for each master, generated from their profile and classes, with the prototype's pro-site layout and theme (PRD §20.3, §20.5-20.7; ADR-003, ADR-004).
- **Acceptance:** the site renders about, programs, schedule and contact sections from stored data; hiding a section with no data leaves no gap; the address resolves without a session; publishing is opt-in; one component serves the path address and, once the zone check passes, the `{slug}.masterscorner.in` subdomain.
- **Verify:** render two different masters and diff their sections; browser check at four widths against the prototype's pro-site screen; confirm the canonical address shown in the console is reachable and that the same content renders on both addresses; confirm no masterscorner-only navigation leaks in beyond the "Powered by" line. Zone prerequisite: `masterscorner.in` delegated to Cloudflare with a wildcard route; if it is not ready, ship the path address and record it.
- **Deps:** 7, 10
- **Files:** `apps/web/src/routes/pro.$slug.tsx`, `packages/infra/alchemy.run.ts`, `apps/web/src/components/pro-site/*`, `packages/api/src/routers/pro-site.ts`
- **Scope:** Large (the address plumbing is the risky half; the renderer itself is mechanical)

### [ ] 17. Pro Site settings

- **Description:** The console Pro Site screen: site name, style choice, publish/unpublish, preview, and sync status for fields that exist (PRD §20.8; design: deviation from the prototype's plan panel).
- **Acceptance:** name and style changes appear on the public site; unpublished sites return the not-found screen; sync rows list only fields the profile actually owns; no plan, billing or custom-domain claim is present.
- **Verify:** browser walkthrough of change, publish, unpublish and preview; contract test that an unpublished site is not publicly readable.
- **Deps:** 16
- **Files:** `apps/web/src/routes/_auth/dashboard/site.tsx`, `packages/api/src/routers/pro-site.ts`
- **Scope:** Medium

### Checkpoint F — Release candidate

- [ ] Every PRD §30.2 item is demonstrable end to end on the development environment.
- [ ] Every ported screen matches the prototype except `docs/design-alignment.md` §8.
- [ ] Migrations applied to development; production deployment rehearsed from `master`.

### [ ] Last. CI transport, branch protection and the billing lock — postponed by the owner

- **Description:** The workflow in `.github/workflows/ci.yml` is merged and verified by rehearsal, but GitHub refuses to start any job for this account: the check-run annotation reads "The job was not started because your account is locked due to a billing issue" (zero steps, about two seconds), and it survived both the repository going public and a rerun. Clear the account's billing state — payment method on the personal account, an unpaid invoice, the Actions spending limit, or a support ticket quoting run `39571427474` and that annotation — then confirm one real run and enable the protection rule.
- **Acceptance:** a pull request shows `CI` running the four steps to green; `GET /repos/ken1310-lang/masterscorner/branches/{master,development}/protection` reports the required context `check, check-types, build, test`; a deliberately failing test turns that PR red and reverting it turns it green.
- **Verify:** push a branch carrying a failing test and watch `CI` fail, revert it and watch it pass; then `gh pr checks` on an ordinary PR shows the required check before merge.
- **Deps:** 2 (merged)
- **Files:** repository settings; `.github/workflows/ci.yml` only if the run then fails for a workflow-side reason
- **Scope:** Small
- **Gate:** before the first production deploy and before a second contributor joins — not before Task 3. Until then `bun run gates` is the merge gate and branch protection stays off, because requiring a check that never reports would freeze every merge.
