# SPEC-directory: public discovery

## 1. Objective

An anonymous visitor can discover real training opportunities without an account: browse published classes, narrow them by martial art, location and audience, and understand an empty result instead of seeing invented rows (PRD §10; `docs/design-alignment.md` §2, §7, §9.1). The directory module also owns the master registry, master profile, home and For Masters pages in Tasks 12-15; this spec records their shared boundary, while Task 11 implements the class listing.

Success: `/classes` lists only classes that exist in the development database, every filter is reflected in the URL and in the query, a class with no matching result produces an explanatory empty state, and no booking, rating, badge or fabricated fee appears.

## 2. Scope

### 2.1 In scope (Task 11)

- A public `directory.classes` query with composable martial-art, location and audience filters.
- A shared, dependency-free directory contract for the browser: filter input, class view, fee/next-session display helpers.
- `/classes` with the prototype's registry hero, a filter bar adapted from the `/masters` control bar, a real class table and honest empty, loading and error states.
- The `Classes` destination in the marketplace header.
- Contract tests for filtering, status visibility and anonymous access; a development-branch walkthrough with classes from two masters.

### 2.2 Out of scope

- Master registry, master profile, home and For Masters pages (Tasks 12-15). Task 12 is specified in `SPEC-master-registry.md`; Task 13 is specified in `SPEC-master-profile-page.md`; the remaining pages stay out of this spec.
- Booking, enquiries, trials, payments, reviews, ratings, verification and academy entities (later phases; ADR-002).
- Class detail pages, maps, distance filtering, duration and currency switching.
- Native parity.

### 2.3 Boundaries

- Always: derive public data from stored classes and profiles; scope the response to published, readable classes; keep fees optional; compute next sessions from stored weekly slots using the India wall clock.
- Ask first: changing the class statuses exposed publicly; adding a public master slug; adding pagination; changing the next-session timezone.
- Never: render a fabricated count, fee, session, rating or badge; render a Book, trial or enquiry action; expose account emails, user ids, profile revisions or non-public children; link to an unbuilt route.

## 3. Contract

### 3.1 Query

`directory.classes` is a public tRPC query. The input is optional and validated at the boundary:

```ts
interface DirectoryClassFilters {
  martialArt?: string; // normalized shared discipline name
  location?: string;   // normalized shared location name
  audience?: "children" | "adults" | "all";
}
```

Filters compose with AND. Martial arts and locations are child rows of individual master profiles, so their UUIDs are not public identities: two masters teaching Karate own two different art rows. The directory groups child rows by normalized name (`lower(btrim(name))`), exposes one option per normalized name, and resolves a selection to every matching child id across masters. The filter value is that normalized name. Normalization happens before the length check; the filter limits are twice the profile maxima because lowercasing can expand one UTF-16 code unit into two. This keeps every value generated from a valid profile name queryable, while a long ASCII value such as 90 or 120 characters is accepted and returns no rows instead of a validation error. An unknown name is a valid input that returns no rows; it is not an error. Empty strings are normalized to `undefined` by the route before the query is sent. The query includes classes whose status is `active` or `full`; `paused` classes are not current. Classes without at least one schedule are incomplete and are not returned.

The response:

```ts
interface DirectoryFilterOption {
  name: string;  // canonical display name
  value: string; // normalized shared identity used by the URL and query
}

interface DirectoryClassView {
  id: string;
  name: string;
  audience: ClassAudience;
  level: ClassLevel;
  status: "active" | "full";
  feeAmount: number | null;
  feePeriod: ClassFeePeriod | null;
  martialArt: { id: string; name: string };
  location: { id: string; name: string };
  master: { displayName: string };
  nextSessionAt: string; // ISO instant, always Asia/Kolkata
}

interface DirectoryClassesPayload {
  classes: DirectoryClassView[]; // nextSessionAt asc, then name, then id
  martialArts: DirectoryFilterOption[]; // global, name asc
  locations: DirectoryFilterOption[];   // global, name asc
}
```

Filter options are global to the eligible directory, not narrowed by the active filters, so a visitor can switch filters without losing choices. Only `profile.displayName` is exposed from the account/profile; no email, user id, revision or unpublished child data is returned. The class id is public.

Next session is the next weekly start at or after the current India wall-clock minute. The database stores wall-clock times without zones; the first release is India-only, so the contract applies `Asia/Kolkata` (UTC+05:30, no DST) and returns a UTC ISO instant. A schedule that started earlier today belongs to next week; a schedule starting later today is today. The API owns this calculation so the label does not depend on the visitor's device timezone.

### 3.2 Shared browser contract

`packages/api/src/directory.ts` owns the Zod filter schema, the response types, the name normalizer and the next-session calculation. It imports the dependency-free class vocabulary, not Drizzle. `packages/api/src/routers/directory.ts` owns the database query and maps rows to the shared view.

The router reads distinct used child rows over the eligible status set, groups them by normalized name, and exposes one option per group. It then resolves the selected names to all matching child ids and applies those ids to the relational class read. It does not load all classes into memory to filter them.

### 3.3 Screen

`/classes` is a marketplace route under `_marketplace`, so it uses the existing header, footer and skip link. The hero says "Find a class that fits your week" and describes real master-owned classes. The filter bar has labelled selects for martial art, location and audience plus a visible "Clear filters" action when any filter is active. Selecting a filter updates the URL using the search keys `art`, `location` and `audience`; the `art` and `location` values are normalized shared names rather than one master's child UUID. Reloading or sharing the URL restores the filters. The query is server-side filtered.

The result list uses the prototype's table styling with columns Class, Master, Location, Next session and Fee. There is no Book column. Class and master are plain text; profile navigation is provided by the registry card rather than class rows. A `Full` class shows a text status badge; active classes do not need one. Fee renders only when stored; never "Not set" on the public page. Below the `md` breakpoint the rows become compact labelled blocks without horizontal page scroll; the desktop header is hidden from view but the list keeps a useful accessible name.

States:

- Loading: skeleton rows with `aria-busy`, not a fabricated table.
- Error: "Classes could not load" with a Retry button; the global query toast may also appear.
- No classes in the directory: "No classes yet" and an explanation that master-published classes appear here; no filter-clear button and no invented rows.
- No classes matching active filters: "No classes match these filters", a list of the active filters, and a Clear filters action that returns to `/classes`.

No pagination in Task 11: the first release has a small supply and the acceptance does not require it. The registry task owns pagination.

## 4. Commands and structure

```text
Dev (API + web + native): bun run dev
Web only:                 bun run dev:web   (API must run separately)
Focused API tests:        bun test packages/api/src/directory.test.ts
Live directory tests:     bun run test:db   (from packages/api; requires development DATABASE_URL)
Full gates:               bun run gates
```

| Path | Purpose |
| --- | --- |
| `docs/specs/SPEC-directory.md` | This contract |
| `packages/api/src/directory.ts` | Shared filter/view types and pure next-session logic |
| `packages/api/src/routers/directory.ts` | Public query, status/filter options and row mapping |
| `packages/api/src/directory.test.ts` | Pure next-session and filter-schema tests |
| `packages/api/src/routers/directory.integration.test.ts` | Live filter/status/authorization contract |
| `apps/web/src/routes/_marketplace/classes.tsx` | `/classes` route and search params |
| `apps/web/src/components/classes/class-row.tsx` | Public class row |
| `apps/web/src/components/classes/directory-screen.tsx` | Hero, filters, list and states |

## 5. Code style

```ts
export function normalizeDirectoryFilter(value: string) {
  return value.trim().toLowerCase();
}

export const MAX_DIRECTORY_MARTIAL_ART_FILTER = MAX_MARTIAL_ART_NAME * 2;

export const directoryMartialArtFilterSchema = z
  .string()
  .transform(normalizeDirectoryFilter)
  .pipe(z.string().min(1).max(MAX_DIRECTORY_MARTIAL_ART_FILTER));

export const directoryClassFiltersSchema = z
  .object({
    audience: z.enum(CLASS_AUDIENCES).optional(),
    location: directoryLocationFilterSchema.optional(),
    martialArt: directoryMartialArtFilterSchema.optional(),
  })
  .optional();

export function nextSessionStart(
  schedules: readonly Pick<ClassScheduleView, "dayOfWeek" | "startTime">[],
  now: Date
): Date | null {
  // India has no DST; UTC+05:30 is stable for this release.
}
```

Use the existing tRPC `publicProcedure`, Drizzle relational reads, TanStack Query `queryOptions`, TanStack Router `validateSearch`/`useNavigate`, Tailwind semantic roles (`bg-navy`, `text-muted-text`, `border-line`) and native labelled controls. Do not add a new state library or a Tailwind config.

## 6. Testing strategy

- Small: next-session calculation at exact start, before/after a slot, week rollover and no schedules; filter schemas normalize before enforcing their shared limits, accept 90/120-character art values, preserve valid Unicode-expanded names and reject an invalid audience or empty name.
- Contract: anonymous caller receives only active/full classes from two masters that share the same art and location names; one grouped option resolves both masters; each filter narrows the set and combined filters compose; paused and profile-less data do not appear; no account email or revision is present in the payload. Fixtures use unique shared names so unrelated development rows cannot change an exact assertion.
- Runtime: seed two masters with the same art and location names and classes across audiences; verify URL filters, counts, empty states and the absence of Book.
- UI: browser check at 1440, 980, 760 and 520 px; select each filter; confirm no horizontal page scroll and the header `Classes` link is active.
- No database schema change is expected. If one becomes necessary, generate and apply a versioned migration to the development branch first.

## 7. Success criteria

- `/classes` shows only rows backed by a public class in the development database.
- Selecting one or more filters updates the URL and the query; clearing returns the full directory.
- A zero-result filter state names the active filters and offers a working clear action.
- No Book action, rating, review, verification badge, invented fee or dead link is rendered.
- `bun run gates` passes; the live directory contract passes against the development branch.
- The screen matches the prototype's registry hero and table styling at 1440, 980, 760 and 520 px, with the documented responsive adaptation.

## 8. Open questions

1. Public master identity: Task 13 needs `/masters/$slug`, but `master_profile` has no slug. Task 12 must decide whether to add a stored slug or derive a stable public id; that decision does not block Task 11, which renders the master name as text.
2. Pagination: intentionally deferred until the registry task defines its boundary.
