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

### [ ] 2. Test and CI wiring

- **Description:** A `test` task in `turbo.json`, `bun:test` available to the packages, and a workflow that runs the quality gates on every pull request (PRD §37.4). This task also owns the lint gate that already exists but cannot pass: `bun run check` reports 985 diagnostics repo-wide — 645 in `masterscorner.html`, 28 in `.omp/skills/**`, the remainder dominated by `assist/source/useSortedAttributes`, `assist/source/useSortedProperties`, `organizeImports` and formatter diffs across `packages/ui`, `apps/web` and `apps/native`. Scope `biome.jsonc` to source (the prototype, installed skills, `docs/`, `tasks/` and `.codegraph/` are reference material, not code) and take the remainder with `bunx ultracite fix`. CI must also not call the `interactive: true` tasks (`db:generate`, `db:migrate`, `db:push`, `deploy`, `deploy:production`, `destroy`): turbo refuses an interactive task without a TUI, and `TURBO_UI=true` does not lift it (verified) — either drop the marker from the two tasks that never read stdin (`db:generate`, `db:migrate`) or have the workflow invoke the package script directly. Alchemy then asks its own confirmation (`Deploy? Deploy/Cancel`) before it applies a plan, so a CI deploy needs a non-interactive flag or `--no-input` plus whatever it requires to accept the plan.
- **Acceptance:** CI runs check-types, lint and build on a pull request; a failing test fails the build; the task list's unit-level verifications have a place to live.
- **Verify:** open a throwaway pull request, observe the checks run and fail on a deliberately broken test, then pass once reverted. Needs the git remote Task 1 is waiting on.
- **Deps:** 1
- **Files:** `turbo.json`, `.github/workflows/*.yml`, `biome.jsonc`, `packages/*/package.json`, `packages/config/tsconfig.base.json`
- **Scope:** Medium

### [ ] 3. Web shell and design tokens

- **Description:** Port the prototype's design system into the app: palette, type scale, breakpoints and container, self-hosted Outfit/Manrope, header, navigation and footer components, plus the global not-found and error screens the prototype defines (`/404`, `/error`) (ADR-003).
- **Acceptance:** tokens exist in one place; header and footer match the prototype at 1440/980/760/520 px including the scrollable nav row; the not-found and error screens render with the prototype copy as amended by deviation D13; no mock CSS, no base64 font or image, no `.mc-` class names in the bundle.
- **Verify:** browser comparison against `masterscorner.html` at four widths; inspect the built CSS for the palette values; keyboard-tab the header.
- **Deps:** 1
- **Files:** `packages/ui/src/styles/globals.css`, `packages/ui/package.json`, `apps/web/src/routes/__root.tsx`, `apps/web/src/routes/_marketplace/route.tsx`, `apps/web/src/routes/_marketplace/index.tsx`, `apps/web/src/routes/not-found.tsx`, `apps/web/src/routes/error.tsx`, `apps/web/src/components/shell/*`
- **Scope:** Medium

### Checkpoint A

- [x] Development and production are separated — development is the local machine against the development branch (`[server] create (local)`, `[web] create (local)`), production is the only deployed stack, and the guard rejects development values. CI green and the shell are Task 2 and Task 3.
- [~] The production stack deploys from `master` as an empty rehearsal: both Workers serve their public URLs — `my-better-t-app-server-production-bxqmxojjh33osaj6.masterscorner.workers.dev` and `my-better-t-app-web-production-5x7dz4qwhr5nq46v.masterscorner.workers.dev` — and the deployed API writes to the production branch. **The custom domain cannot resolve yet:** the account has no zones, so `masterscorner.in` still has to be added to Cloudflare (nameservers at the registrar). ADR-004 defers the Pro Site subdomain on exactly this gate.
- [ ] Owner review before feature work starts.

## Phase 1 — Identity

### [ ] 4. Master account and auth

- **Description:** Master account creation with an account type on the user record, sign-up and sign-in through Better Auth, password reset, and the email-verification configuration (PRD §15.2). Email delivery depends on the single open decision (the provider, `tasks/plan.md` §Open Questions): if it is not settled for this PR, ship sign-up and sign-in, and add verification and reset in the follow-up PR for this task.
- **Acceptance:** a new account is created with account type `master`; sessions survive reload; a protected procedure returns `UNAUTHORIZED` without a session and the session user id with one; password reset works end to end.
- **Verify:** `appRouter.createCaller` tests for the authorization boundary; manual sign-up, sign-in, reset and protected-read on the development environment.
- **Deps:** 1, 2
- **Files:** `packages/auth/src/index.ts`, `packages/db/src/schema/auth.ts`, `packages/api/src/routers/*.ts`, `apps/server/src/index.ts`
- **Scope:** Medium

### [ ] 5. Auth screens and route guards

- **Description:** Sign-up, sign-in and password-reset screens ported from the prototype's auth layout, plus the protected console shell (PRD §15, deviation D7: the label is Email, not Email or mobile).
- **Acceptance:** a master can sign up, sign in and reset a password from the UI; unauthenticated visits to `/dashboard*` redirect to sign-in and return afterwards; console navigation shows Overview, Profile, Classes and Pro Site only.
- **Verify:** browser walkthrough of the three screens and the redirect both ways; empty-state console renders without error.
- **Deps:** 4
- **Files:** `apps/web/src/routes/login.tsx`, `apps/web/src/routes/signup.tsx`, `apps/web/src/routes/_auth/route.tsx`, `apps/web/src/routes/_auth/dashboard/*`, `apps/web/src/lib/auth-client.ts`
- **Scope:** Medium

### Checkpoint B

- [ ] A master can create an account and reach an empty console; no console link points at an unbuilt screen.

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
