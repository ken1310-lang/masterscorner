# Implementation Plan: MastersCorner first release

**Status:** Pending owner review. Scope decisions confirmed by the owner on 2026-10-20 (see `docs/decisions/ADR-002-mvp-scope-and-free-pro-site.md` § Owner decisions).

Source documents: `product-vision.md` v2.0 (§29, §30, §37, §39), `docs/design-alignment.md`, `docs/decisions/ADR-001..003`.

## Overview

Deliver the first release defined in PRD §30: a master creates an account, publishes a profile with real classes, and receives a free branded Pro Site; a visitor can find that master and those classes. Work ships as seventeen pull requests grouped into the seven modules of PRD §39: `platform` → `identity` → `media`, `master-profile` → `classes` → `directory` → `pro-site`.

No code is written until each module's spec is written, reviewed and approved, per `spec-driven-development`. Specs live in `docs/specs/SPEC-<module-id>.md` for the module ids in PRD §39; `docs/specs/SPEC-platform.md` is the first. This document sequences the modules; it is not a substitute for module specs.

Audit correction (2026-10-23): the master-profile specification was missing when Tasks 6–7 shipped. `docs/specs/SPEC-master-profile.md` now records the implemented contract retrospectively; it is not evidence of pre-implementation approval. The specification-first rule above remains mandatory for future modules. `tasks/todo.md` is the delivery-status authority; the task index below is synchronized with its accepted scope amendments.

## Architecture Decisions

- **Stack is the existing template, unchanged in shape.** TanStack Start web app, Hono on Cloudflare Workers, tRPC router in `packages/api`, Better Auth in `packages/auth`, Drizzle on Neon HTTP in `packages/db`, Alchemy deployment in `packages/infra`. See `AGENTS.md`.
- **Environments and migrations** — ADR-001: development and production, each on its own Neon branch; versioned migrations only; expand/contract.
- **Infrastructure decisions closed before building** — ADR-004: media in Neon Object Storage on an `aws-ap-southeast-1` project, with bucket views and endpoints branching with the database (credentials are project-wide; the endpoint is the isolation boundary); Pro Site served at a path address and switched to the `{slug}.masterscorner.in` subdomain when the zone check passes; per-PR preview environments deferred; no UI regression suite in the first release.
- **MVP scope** — ADR-002: masters only (no academy entity), web only (Expo untouched), no verification badge, no contact or trial CTAs, Pro Site free.
- **Design** — ADR-003: `masterscorner.html` is the visual source of truth; its tokens become Tailwind v4 theme tokens in `packages/ui/src/styles/globals.css`; screens are ported route by route; deviations are exactly the register in `docs/design-alignment.md` §8.
- **Data access** stays factory-based (`createDb(env)`, `createAuth(env, db)`, per-request context with `session`); no module-level singletons.
- **Client state** stays TanStack Query via `useTRPC()`; forms stay TanStack Form with Zod `validators.onSubmit`.

## Verification Strategy

| Level | Tool | Applies to |
| --- | --- | --- |
| Unit | `bun:test`, colocated `*.test.ts` | Pure logic: filters, slug generation, schedule and fee formatting, input validation |
| Contract | `appRouter.createCaller({ session, db })` | Every added tRPC procedure: authorization, validation, shape |
| Runtime | `bun run dev` against the development database branch | Every slice, with real sign-up, profile and class data |
| UI | Browser check of the ported screen | Each screen at 1440, 980, 760 and 520 px against the prototype plus `docs/design-alignment.md` §8 |
| Schema | `bun run db:generate` + `bun run db:migrate` | Every migration, applied to the development branch before the PR merges |
| Object storage | Upload through the console, then read the object back from the branch endpoint | Every media change; confirms the key resolves on the configured branch endpoint. Credentials are project-wide; credential-denial isolation was superseded by ADR-004's owner-accepted endpoint boundary. |
| Repository | `bun run check-types`, `bun run check`, `bun run build` | Every PR |

Task 2 added the test runner and CI workflow. Local `bun run gates` is the current merge gate; hosted CI execution and required-check enforcement remain blocked/deferred as recorded in `tasks/todo.md`.

## Task List

### Phase 0: Platform (PR 1-3)

- [x] Task 1: Environments and database branches — Neon project in `aws-ap-southeast-1` with `development` and `production` branches and the media bucket declared on each (`neon.ts`); dev/prod configuration, per-environment secrets, README setup; development runs locally (`bun run dev`: API on 3000, web on 3001) against the development branch, and production is the only deployed environment — one Alchemy stack deploying the API Worker (Hono) and the web Worker (TanStack Start); preview environments deferred (ADR-004).
- [x] Task 2: Test and CI wiring — runner and workflow implemented; hosted red→green and branch protection remain deferred to `Last` in `tasks/todo.md`.
- [x] Task 3: Web shell and design tokens — centralized tokens, real fonts, marketplace shell and root error/not-found screens.

### Checkpoint A

- [ ] API and web run against the development branch; CI is green on a throwaway PR. **CI green is postponed to `Last` in `tasks/todo.md`:** the workflow is merged and the pipeline was rehearsed green in a clean worktree, but GitHub refuses to start a job for this account — "your account is locked due to a billing issue" — and the owner is fixing that later. Until then `bun run gates` is the merge gate and branch protection is deliberately off.
- [ ] The production stack deploys from `master` as an empty rehearsal: both Workers serve their public URLs and the custom domain resolves.
- [ ] Review with owner before feature work starts.

### Phase 1: Identity (PR 4-5)

- [~] Task 4: Master account and auth — account type, sign-up/sign-in and session boundary implemented; password reset and email verification remain owner-deferred pending provider/sender setup.
- [x] Task 5: Auth screens and guards — sign-up/sign-in and protected console routes; reset UI belongs to the deferred Task 4 email follow-up.

### Checkpoint B

- [ ] A master can sign up, verify email, sign in, reset a password and reach an empty console.

### Phase 2: Master profile and media (PR 6-8)

- [x] Task 6: Profile schema — profile, teaching locations and media references, with versioned migrations.
- [x] Task 7: Console profile editor — identity, martial arts, years teaching, home city, introduction, teaching locations.
- [x] Task 8: Media upload — Neon Object Storage bucket declared in `neon.ts`, upload path from the Worker, size and type limits, rate limiting, `503` retry, rendering; profile photo and Pro Site logo.

### Checkpoint C

- [ ] A master edits their profile and sees the photo and locations persist across a fresh session.

### Phase 3: Classes (PR 9-10)

- [x] Task 9: Class schema — martial art, audience, level, schedule rows, location reference, optional fee, status; migration.
- [x] Task 10: Console classes CRUD — create, edit, pause, remove; validation that a class has a location and at least one schedule row.

### Checkpoint D

- [x] A master creates three classes and they survive a round trip through the database.

### Phase 4: Directory (PR 11-15)

- [x] Task 11: Public class listing — `/classes` from real classes, filters for art, location and audience, empty state.
- [x] Task 12: Master registry — `/masters` with the same filters, sort by experience, pagination, empty state.
- [x] Task 13: Master profile page — `/masters/$slug`, sections for identity, about, training paths, locations and schedule; no ratings, reviews, badges or contact CTAs.
- [ ] Task 14: Home page — hero, search, featured masters and class preview from real data.
- [ ] Task 15: For Masters page — what a listing includes, console preview, sign-up call to action; no plan, price or verification claim.

### Checkpoint E

- [ ] A visitor with no account can find a master, open their profile and see their classes, with no fabricated trust signal or dead CTA anywhere.

### Phase 5: Pro Site (PR 16-17)

- [ ] Task 16: Pro Site renderer — site generated from profile and class data, themable, reachable at the canonical address (path now, subdomain once the zone check passes; ADR-004).
- [ ] Task 17: Pro Site settings — site name, style choice, publish/unpublish, sync status in the console.

### Checkpoint F: Release candidate

- [ ] Every PRD §30.2 acceptance item is demonstrable end to end on the development environment.
- [ ] Every ported screen matches the prototype except the documented deviations.
- [ ] Migrations applied to development; production deployment rehearsed.

## Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| The development environment is shared, so one breaking migration blocks other work in review | Medium | Migrations are additive-first and reviewed before they touch the development branch; a throwaway Neon branch is created on demand for a risky change (ADR-004) |
| The Pro Site subdomain needs `masterscorner.in` delegated to Cloudflare (wildcard route and certificate) | Medium | Decided (ADR-004): the renderer ships at `/pro/$slug` and the subdomain is enabled once the zone check in Task 16 passes; the console always shows the live address |
| No test runner or CI exists today | Medium | Task 2 lands before feature work; every later task names its verification |
| Pixel fidelity is expensive to verify screen by screen | Medium | Fixed comparison checklist at four widths plus the deviation register; prototype updated first when a screen changes; no UI regression suite in the first release (ADR-004), so the checklist is the gate |
| Only production is deployed, so the deployed path (TLS, custom domain, per-environment secrets) is untested until the first release | Medium | The production stack is deployed once from `master` in Phase 0 as an empty rehearsal and redeployed at each checkpoint, so the deploy path is exercised long before there is anything to lose (ADR-001) |
| Email delivery for verification and reset needs a provider — the one open question | Medium | Task 4 owns it: settle the provider before that PR, otherwise ship sign-up and sign-in and add verification and reset in a follow-up PR for the same task |
| Media upload abuse (oversized files, wrong types, hotlinking), and the Free plan's 5 GB object-storage cap | Low | Media is stored in Neon Object Storage (ADR-004) with size and type limits and rate limiting on the upload endpoint (Task 8); the bucket is `public_read`, so hotlinking is not prevented and is accepted at this size |
| Mock pressure to re-add contact CTAs, ratings and badges | Medium | ADR-002 owner decisions and deviations D1-D4 are review-blocking, not preferences |
| Fee information arrives as free text and becomes unusable | Low | Task 9 decides the shape (amount plus period) before the console form is built |

## Open Questions

Closed in ADR-004 on 2026-10-20: Pro Site addressing (subdomain target, path until the zone check passes), media host (Neon Object Storage, `aws-ap-southeast-1`), UI regression tooling (none in the first release).

Still open:

1. Email provider for verification and reset (Resend, SES, MailChannels or other)? Owned by Task 4; nothing else in the first release depends on it.
