# SPEC-master-profile-page: public master profile

## Status and provenance

Implemented on `task/13-master-profile-page` on 2026-10-23, under the owner's instruction to proceed with the next planned task. This is the first written contract for the public profile page; the task list and `SPEC-directory` already reserve it in the `directory` module. The status, verification evidence and any deviations from this contract are recorded in `tasks/todo.md`.

## 1. Objective

An anonymous visitor can open a master's public profile from the registry and understand who the master is, what they teach, where they teach and when their current classes run. Every section is derived from stored profile, class, schedule and media rows. A missing photo, introduction, location or class removes that section instead of producing a placeholder or an invented claim.

Success: `/masters/$slug` renders a full profile and a minimal profile credibly, an unknown or malformed slug shows the not-found content, and no rating, review, verification badge, trial, enquiry, fee claim or dead action is rendered.

## 2. Scope

### 2.1 In scope (Task 13)

- A public `directory.masterProfile` query keyed by the public profile slug.
- A stable, readable public slug derived from the profile's display name and immutable profile UUID; no schema migration.
- `/masters/$slug` with breadcrumb, identity hero, about, training paths, locations and schedule.
- Registry cards link to the real profile route; the public profile query is invalidated after profile and class writes.
- Pure slug tests and live contract tests for full/minimal profiles, not-found and privacy.
- Browser verification at 1440 and 760 px plus the unknown slug.

### 2.2 Out of scope

- Reviews, ratings, verification badges, trial booking, enquiry forms, contact actions and Pro Site links (Phases 2-3; ADR-002).
- Lineage, qualifications, achievements, gallery, events, academy entities and geocoded addresses (no stored data in this release).
- User-selected vanity slugs, slug redirects and slug changes. The UUID suffix keeps old links resolving if the display name changes.
- Native parity.

### 2.3 Boundaries

- Always: derive the page from stored profile, current class, schedule and current profile-photo rows; keep the public slug stable by its UUID suffix; omit empty sections; use the existing `publicProcedure`, Drizzle relations and TanStack Query/Router patterns.
- Ask first: adding a profile field or public action, changing which class statuses appear, changing the slug format, exposing private account/profile fields.
- Never: render a review, rating, verification claim, trial or enquiry action, Pro Site link before Task 16, fabricated fee or schedule, or a dead navigation target; expose email, user id, revision, media object key or draft data.

## 3. Contract

### 3.1 Public identity

`master_profile` has no vanity slug column. The public slug is:

```text
<ascii-name-slug>-<profile-uuid>
```

The name part is lowercased ASCII, with diacritics stripped, non-alphanumeric runs collapsed to `-`, leading/trailing hyphens removed and the name part capped at 60 characters. If no ASCII characters remain, the name part is `master`. The profile UUID is the immutable suffix, so two equal display names never collide and an old link keeps resolving after a rename.

`profileIdFromSlug` accepts any string whose final 36 characters are a UUID, including a bare UUID. The router looks up only that profile id; the name prefix is decorative. Unknown or malformed slugs return `null`, not a different profile or an error.

### 3.2 Query

`directory.masterProfile` is a public tRPC query:

```ts
interface DirectoryMasterProfileInput {
  slug: string; // 1-200 characters
}

interface DirectoryMasterClassView {
  id: string;
  name: string;
  audience: "children" | "adults" | "all";
  level: "beginner" | "intermediate" | "advanced" | "all";
  status: "active" | "full";
  feeAmount: number | null;
  feePeriod: "session" | "week" | "month" | "term" | null;
  martialArt: { id: string; name: string };
  location: { id: string; name: string };
  schedules: { dayOfWeek: number; startTime: string; endTime: string }[];
}

interface DirectoryMasterProfilePayload {
  slug: string;
  displayName: string;
  homeCity: string | null;
  yearsTeaching: number | null;
  introduction: string | null;
  photoUrl: string | null;
  martialArts: string[];             // profile order
  locations: { id: string; name: string }[]; // profile order
  classes: DirectoryMasterClassView[]; // current classes, name then id
}
```

`photoUrl` is the current `profile_photo` public URL, or `null`. Classes include only `active` and `full`; paused classes are omitted. Schedules are ordered by ISO weekday, then start time, and times use the existing `HH:MM` format. Classes are ordered by name and id for stable rendering; the UI groups by location and keeps profile location order.

Only the listed fields cross the boundary. No account email or user id, profile revision, media id/object key, class revision, `pausedFromStatus`, profile `updatedAt` or unpublished class is returned.

### 3.3 Shared browser contract

`packages/api/src/directory.ts` owns the slug helpers, input schema, public profile types and the `DirectoryMasterView.slug` field. `packages/api/src/routers/directory.ts` owns the two reads:

1. Resolve the slug's UUID and read the profile with ordered martial arts, ordered locations and media rows.
2. Read current classes for that profile with their martial-art, location and schedules, then map only public fields.

The query must not read another profile or all profiles. The registry query adds `slug` to each card view; it does not add profile links before the route exists.

### 3.4 Screen

`/masters/$slug` is a file route under `_marketplace`, sharing the existing header, footer and skip link. The page renders:

1. Breadcrumb: `Masters / <display name>`, with `Masters` linking to `/masters`.
2. Identity hero on `surface-alt`: profile photo when present (otherwise no photo column), display name as the only `h1`, martial arts joined with `·`, real stats for years teaching, teaching locations and current classes when present, and home city when present. No review, rating, verified, plan or profile-ID claim.
3. `About the master` when `introduction` exists. Preserve line breaks; do not generate or expand copy.
4. `Training paths` when current classes exist. Each card shows the class name and real metadata: martial art, audience and level. Fee appears only when stored. No description is invented. The page names classes as training paths because the release has no separate path entity.
5. `Locations & schedule` when profile locations and current classes exist. Each location keeps profile order and lists its current classes with their weekly slots from `formatSchedules`. A location with no current class still appears without a schedule claim. When locations exist but no current classes, the section is titled `Teaching location`/`Teaching locations` instead. If no locations exist, the section is absent.
6. No reviews, verification, trial, enquiry, contact or Pro Site action. The right-hand trial/ID panels from the prototype are absent; content uses the full available width.

Missing data rules: null introduction, photo, years, city, locations or classes removes that element or section. The minimal profile remains a valid page with name, arts and breadcrumb.

States:

- Loading: breadcrumb and section skeletons with `aria-busy`; no fabricated profile.
- Error without data: `Profile could not load` with Retry.
- Refresh error with cached data: retry banner above the existing profile.
- Unknown or malformed slug, or a profile that no longer exists: the existing not-found content inside the marketplace layout, with no profile sections.
- Long names, arts, class names and location names wrap without horizontal page scroll.

### 3.5 Freshness

Profile saves and class save/status/remove mutations invalidate both `directory.masters` and `directory.masterProfile` query prefixes after the existing identity-scope check. The profile page therefore reflects edits inside the 60-second freshness window; failed or superseded writes do not invalidate public data.

## 4. Commands and structure

```text
Dev:                    bun run dev
Focused API tests:      bun test packages/api/src/directory.test.ts (from packages/api)
Live profile tests:     bun run test:db (from packages/api)
Web build/types:        bun run check-types --filter=web
Full gates:             bun run gates
```

| Path | Purpose |
| --- | --- |
| `docs/specs/SPEC-master-profile-page.md` | This contract |
| `packages/api/src/directory.ts` | Slug helpers, input schema, profile/class view types |
| `packages/api/src/routers/directory.ts` | `masterProfile` query and registry slug |
| `packages/api/src/directory.test.ts` | Slug and input boundary tests |
| `packages/api/src/routers/master-profile.integration.test.ts` | Live full/minimal/not-found/privacy contract |
| `apps/web/src/routes/_marketplace/masters.$slug.tsx` | Dynamic route, query and not-found state |
| `apps/web/src/components/masters/profile-screen.tsx` | Hero, sections, states and responsive layout |
| `apps/web/src/components/masters/master-card.tsx` | Registry card link |
| `apps/web/src/components/profile/profile-form.tsx` | Public profile cache invalidation |
| `apps/web/src/components/classes/classes-screen.tsx` | Public profile cache invalidation |

## 5. Code style

```ts
export function masterProfileSlug(displayName: string, id: string) {
  const name = displayName
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_NAME)
    .replace(/-+$/g, "");
  return `${name || "master"}-${id}`;
}

export function profileIdFromSlug(slug: string) {
  return UUID_TAIL.exec(slug.trim())?.[1]?.toLowerCase() ?? null;
}
```

Use existing semantic Tailwind roles (`bg-surface-alt`, `bg-card`, `text-muted-text`, `border-line`), `ShellContainer`, the custom `sm`/`md`/`lg` breakpoints, `formatFee`/`formatSchedules` and `NotFoundContent`. Do not add a state library, Tailwind config, schema migration or generic page abstraction.

## 6. Testing strategy

- Small: slug generation strips diacritics, collapses separators, caps the name, falls back to `master`, preserves the UUID and parses bare/renamed slugs; malformed slugs return null; input accepts a 200-character slug and rejects an empty one.
- Contract (live): full profile returns ordered arts/locations, current active/full classes with sorted schedules, fee only when stored, photo URL from a seeded media row, and no paused class; minimal profile returns null/empty optional fields without error; unknown and malformed slugs return null; an old slug still resolves after a display-name change; payload keys exclude email, userId, revision, objectKey and paused fields.
- UI: browser check at 1440 and 760 px for a full profile and a minimal profile; unknown slug shows the not-found content; no horizontal page scroll; no rating, verification, trial, enquiry or Pro Site action; keyboard-focus the breadcrumb and registry link.
- Freshness: a profile save and a class save invalidate the public profile prefix (focused web test).
- No database schema change is expected. If one becomes necessary, generate and apply a versioned migration to the development branch first.

## 7. Success criteria

1. Registry cards link to `/masters/$slug`; the page shows only stored data.
2. A full profile renders identity, about, training paths and locations/schedule; a minimal profile renders credibly with absent sections.
3. An unknown or malformed slug shows the not-found content and no partial profile.
4. No prohibited trust or conversion claim/action is rendered.
5. `bun run gates` and the live profile contract pass; browser checks at 1440 and 760 px have no overflow and match the prototype minus deviations D1-D3.
6. Profile/class writes refresh the public profile cache within the freshness window.

## 8. Open questions

None. The stable slug is derived from the display name plus UUID; a vanity slug or redirect can be added later without changing the profile contract.
