# SPEC-master-profile: owner-scoped profile editing

## Status and provenance

Retrospective specification recorded during the completed-task audit remediation (2026-10-23). Tasks 6 and 7 were implemented in PRs #11 and #17, with regression fixes in #18. This document describes the implemented contract and its acceptance criteria; it does not claim the module had a written or owner-approved specification before those PRs. Future contract changes must update this specification before implementation.

## 1. Objective and scope

A signed-in master edits their public identity, ordered martial arts and teaching locations at `/dashboard/profile`. Values survive reload and a fresh sign-in. Account name and public display name are independent. The first martial art is primary. The editor must retain unsaved drafts during background-query failures.

In scope: profile schema/relations/migrations, `master.getProfile`, `master.saveProfile`, shared validation, revision conflicts, owner-scoped child reconciliation, and the console editor. Media storage is specified in `SPEC-media.md`; its cache integration must not replace newer profile fields or revisions. Classes, public discovery, profile publishing and Pro Sites belong to later modules. Native profile editing is not implemented.

## 2. Contract

Both procedures require authentication. Ownership is derived only from `ctx.session.user.id`; input contains no owner ID.

`master.getProfile` takes no input. `master.saveProfile` accepts:

| Field | Rules |
|---|---|
| `revision` | `null` for first save; current UUID for an existing profile |
| `displayName` | Trimmed, required, at most 120 characters |
| `yearsTeaching` | `null` or integer from 0 through 100 |
| `homeCity` | Trimmed string up to 120 characters, or `null`; empty normalizes to `null` |
| `introduction` | Trimmed string up to 2,000 characters, or `null`; empty normalizes to `null` |
| `martialArts` | 1–10 ordered `{ id?: UUID, name }` rows; names required, at most 80 characters |
| `locations` | 0–20 ordered `{ id?: UUID, name }` rows; names required, at most 120 characters |

Names within each child list are unique after trimming and lowercasing. Array order defines zero-based stored positions. The browser keeps years as text until shared submit validation and input conversion.

Both return `MasterProfilePayload`: `{ profile, martialArts, locations, media }`. An absent profile returns `profile: null` and empty lists. Profile summaries contain `id`, `revision`, display name, optional city/introduction/years; child rows contain `id`, `name`, `position`. Media entries contain only public view fields defined by the media module. Dates crossing plain tRPC JSON boundaries are strings; no transformer is assumed.

Errors: `UNAUTHORIZED` without a session; validation errors for invalid input; `CONFLICT` for stale/concurrent writes. A conflict asks the user to reload and save again, rather than silently overwriting another save or retrying with a new revision.

## 3. Persistence invariants

- At most one profile per account; a profile cannot exist without its owner. Child rows belong to one profile and cascade with it.
- Profile writes use a new UUID revision. Conditional parent writes, child writes and response reads run in one Neon HTTP transaction. The guarded write result determines whether the save won.
- Retained child IDs survive rename/reorder. Missing children are deleted; new rows get new IDs. Foreign or repeated submitted IDs cannot update another profile: they are treated as inserts and every statement remains owner-scoped.
- Immediate unique constraints must remain valid during swaps. Positions are vacated before final placement; martial-art names use collision-free temporary names checked against stored and submitted names. Do not implement swaps by sequential conflicting updates or delete/recreate retained children.
- Child activity updates the parent's activity timestamp. Trigger locks and timestamp updates use the committed forward migrations; do not rewrite applied migration history.
- Media writes do not change the profile revision. A delayed media response must not replace a newer profile revision, and a profile response must not erase a newer media result in the client cache.

## 4. Console and session boundaries

Use TanStack Form with the shared Zod contract, named inline errors and selective subscriptions. Failed validation does not clear values. Successful profile saves adopt persisted child IDs and the returned revision. Background refresh errors retain the mounted form and draft; initial errors without data show retry UI.

The protected layout is client-rendered, awaits query cancellation/cache cleanup and remounts the outlet by account ID. Every asynchronous mutation effect is scoped to the captured session generation, including A → B → A. File reads must recheck that scope before sending an upload, not merely before processing its response. Account changes must not write old data, reset a new form or display stale feedback.

The prototype profile composition and documented deviations in `docs/design-alignment.md` are the visual contract. Missing states must be specified before new UI work; this retrospective document cannot establish historical prototype-first compliance.

## 5. Acceptance and verification

1. Save every profile field and multiple children; reload and sign out/in; the same values, child IDs and order remain.
2. Rename/reorder existing martial arts and locations, including swaps and names resembling the temporary namespace, without constraint failures or identity loss.
3. Reject invalid values with field-specific errors while retaining drafts.
4. Reject stale and overlapping saves with `CONFLICT`; exactly one revision wins and a save returns its own transactional snapshot.
5. Prevent cross-account reads/writes, including forged child IDs and delayed responses after account transitions.
6. Preserve drafts during background refresh failure; initial failure still permits retry.
7. Overlapping profile/media responses preserve the latest result for each independently owned cache slice.
8. Replay all committed migrations into an empty database on an isolated development-derived branch; exercise profile/media callers against the resulting schema.

Commands: `bun run gates`; from `packages/api`, `bun run test:db`; from `apps/web`, focused `bun test` files for profile values, session transitions and profile mutation/cache regressions. Live tests write fixtures: first verify the target is a development or explicitly isolated rehearsal endpoint. Browser verification covers the editor at 1440/980/760/520 px plus narrow long-name and keyboard-focus boundaries.

Implementation: `packages/api/src/master-profile.ts`, `packages/api/src/routers/master.ts`, `packages/db/src/schema/master.ts`, `packages/db/src/migrations/`, `apps/web/src/components/profile/`, `apps/web/src/lib/session-query-cache.ts`, and the protected dashboard routes.
