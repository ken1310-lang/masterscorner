# SPEC-master-registry: public master discovery

## 1. Objective

An anonymous visitor can discover real martial-arts masters, narrow them by martial art, location and audience, and move through a stable experience-sorted list without seeing invented trust signals (PRD §7; `docs/design-alignment.md` §2, §7, §9.1).

Success: `/masters` lists only stored master profiles; every filter and page is reflected in the URL and in the query; cards show only name, arts, city, years and audience tags; no rating, review count, verification badge, fee or dead profile link appears. Pagination keeps one deterministic order while filters change.

## 2. Scope

### 2.1 In scope (Task 12)

- A public `directory.masters` query with composable martial-art, location and audience filters, fixed experience ordering and offset pagination.
- `/masters` with the registry hero, filter bar, result cards, pagination, and loading, error and empty states.
- The `Masters` destination in the marketplace header.
- Pure pagination/filter-schema tests and live contract tests for first page, last page, no results and anonymous access.
- Browser verification at 1440, 980, 760 and 520 px.

### 2.2 Out of scope

- Master profile pages (Task 13), home page (Task 14), For Masters page (Task 15).
- Ratings, reviews, verification, fees, trials, booking, enquiries, photos on registry cards, distance/nearest sorting, saved masters and academy entities.
- A user-selectable sort. Experience is the release order; Recommended/Rating/Nearest are deferred.
- Native parity.

### 2.3 Boundaries

- Always: derive registry rows from stored profiles; filter with normalized shared names; derive audience tags from current classes; use a deterministic total order; keep filter and page in the URL; make no verification, rating, review or fee claims.
- Ask first: changing which profile states are public; exposing a master slug before Task 13; changing page size, sort order or audience source; adding a registry profile action that links to a missing route.
- Never: render a rating, review count, verification badge, fee, learner count or profile-completeness score; expose account email, user id, profile revision or drafts; invent a city or audience; render a dead `View profile` link.

## 3. Contract

### 3.1 Query

`directory.masters` is a public tRPC query. The input is optional and validated at the boundary:

```ts
interface DirectoryMasterFilters {
  martialArt?: string; // normalized shared discipline name
  location?: string; // normalized shared location name
  audience?: "children" | "adults" | "all";
  page?: number; // 1-based; default 1
}
```

Filters compose with AND. Martial arts and locations are per-profile child rows, so UUIDs are not public identities. Art and location options group every stored profile child by `lower(btrim(name))`; a selection resolves to every matching child id. The normalized filter schemas and limits are shared with `directory.classes` (`SPEC-directory` §3.1), including validation after normalization.

Audience matches profiles with at least one `active` or `full` class for that audience. Paused classes do not create an audience tag or match. A profile with no current classes remains listed with no audience tags.

The response:

```ts
interface DirectoryFilterOption {
  name: string; // canonical display name
  value: string; // normalized shared identity used by the URL and query
}

interface DirectoryMasterView {
  id: string; // public profile id
  displayName: string;
  city: string | null; // profile.homeCity only; never inferred
  yearsTeaching: number | null;
  martialArts: string[]; // profile order
  audiences: ("children" | "adults" | "all")[]; // current classes, canonical order
}

interface DirectoryMastersPayload {
  masters: DirectoryMasterView[];
  martialArts: DirectoryFilterOption[];
  locations: DirectoryFilterOption[];
  page: number; // effective page after clamping
  pageSize: 6;
  total: number;
  totalPages: number; // 0 when total is 0
}
```

Order: `yearsTeaching` descending with nulls last, then `displayName` ascending, then `id` ascending. This total order makes offsets deterministic. `page` greater than `totalPages` clamps to the last page; with zero results it clamps to 1. Filter options are global, not narrowed by active filters, so choices stay stable while filtering.

Only `displayName`, `homeCity`, `yearsTeaching`, ordered arts, current-class audiences, the profile id, and global filter name/value options cross the boundary. No email, user id, revision, introduction, per-profile location rows, fees, media or class rows are returned.

### 3.2 Shared browser contract

`packages/api/src/directory.ts` owns the Zod filter schema and response types. `packages/api/src/routers/directory.ts` performs the database reads:

1. Group art and location option rows from all profiles.
2. Resolve selected normalized names to all matching child ids.
3. Count profiles matching the AND filters.
4. Clamp the requested page and read only that page's profile columns.
5. Read ordered arts and current-class audiences for those profile ids only.

The query must not load every profile to filter or paginate in memory.

### 3.3 Screen

`/masters` is a marketplace route under `_marketplace`, sharing the existing header, footer and skip link. The hero contains the kicker `Master Registry`, the heading `Find a martial arts master`, and a sentence describing real master profiles. The filter bar has labelled selects for martial art, location and audience plus a visible `Clear filters` action when any filter is active. Selecting a filter writes `art`, `location` and `audience` to the URL and resets `page`; selecting a page writes `page`. Reloading or sharing restores both.

The result header shows the real count (`6 masters`, `1 master`) and `Sorted by experience`. The card grid uses two columns above the mobile breakpoint and one below. Each card shows:

- display name;
- all martial arts in profile order, joined for the subtitle;
- `homeCity` when supplied;
- `yearsTeaching` when supplied, as `18 years`;
- audience tags using the class labels.

Cards have no photo, rating, review count, verification badge, fee, profile-completeness score or action until Task 13 adds a real profile route. A card with no city, years or audiences simply omits those lines.

Pagination appears only when `totalPages > 1`: Previous, `Page X of Y`, Next. Buttons are keyboard accessible, disabled at the ends, and update only `page`, keeping filters.

States:

- Loading: card skeletons with `aria-busy`, no fabricated cards.
- Error: `Masters could not load` with Retry; preserve any loaded page if refresh fails.
- No profiles: `No masters yet` and an explanation that master profiles appear here; no filter-clear action.
- No matches: `No masters match these filters`, the active filter names, and Clear filters.
- Refresh error with cached data: a retry banner above the existing results.

## 4. Commands and structure

```text
Dev:                    bun run dev
Focused API tests:      bun test packages/api/src/directory.test.ts (from packages/api)
Live registry tests:    bun run test:db (from packages/api)
Web build/types:        bun run check-types --filter=web
Full gates:             bun run gates
```

| Path | Purpose |
| --- | --- |
| `docs/specs/SPEC-master-registry.md` | This contract |
| `packages/api/src/directory.ts` | Shared filter schema and registry view types |
| `packages/api/src/routers/directory.ts` | `masters` query, filter groups, count and page reads |
| `packages/api/src/directory.test.ts` | Filter-schema boundaries |
| `packages/api/src/routers/masters.integration.test.ts` | Live filter, order, pagination and privacy contract |
| `apps/web/src/routes/_marketplace/masters.index.tsx` | `/masters` route and search params |
| `apps/web/src/components/masters/registry-screen.tsx` | Hero, filters, cards, pagination and states |
| `apps/web/src/components/masters/master-card.tsx` | Public registry card |
| `apps/web/src/components/shell/header.tsx` | Masters navigation destination |

## 5. Code style

```ts
const conditions = [
  martialArtIds.length ? exists(artMatch) : sql`false`,
  locationIds.length ? exists(locationMatch) : sql`false`,
  input?.audience ? exists(audienceMatch) : undefined,
].filter((value): value is SQL => value !== undefined);

const [{ value: total }] = await ctx.db
  .select({ value: count() })
  .from(masterProfile)
  .where(and(...conditions));

const totalPages = Math.ceil(total / MASTER_PAGE_SIZE);
const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);

const rows = await ctx.db
  .select(PROFILE_COLUMNS)
  .from(masterProfile)
  .where(and(...conditions))
  .orderBy(
    sql`${masterProfile.yearsTeaching} desc nulls last`,
    asc(masterProfile.displayName),
    asc(masterProfile.id)
  )
  .limit(MASTER_PAGE_SIZE)
  .offset((page - 1) * MASTER_PAGE_SIZE);
```

Use the existing `publicProcedure`, Drizzle relational/data reads, TanStack Query `queryOptions`, TanStack Router `validateSearch`/`useNavigate`, semantic Tailwind roles and `ShellContainer`. Do not add a state library, Tailwind config or a new generic pagination abstraction.

## 6. Testing strategy

- Small: master filter schema accepts normalized art/location names and page numbers; rejects page 0 and invalid audience; inherited length limits remain enforced.
- Contract: anonymous caller sees stored masters ordered by experience with nulls last and stable id tie-breaks; first and last pages contain no duplicates or omissions; page beyond the end clamps; unknown filters return `total: 0`; shared art/location names resolve all profiles; audience matches current classes only, excludes paused classes, and leaves classless masters listed without tags; payload contains no email, user id, revision, fee or introduction.
- UI: browser check at 1440, 980, 760 and 520 px with seeded masters; inspect filter controls, cards, tags, pagination, filter reset, first/last page and empty state; confirm no horizontal page scroll, no rating/badge/fee/action, and keyboard-usable controls.
- No database schema change is expected. If one becomes necessary, generate and apply a versioned migration to the development branch first.

## 7. Success criteria

- `/masters` is reachable from the header and renders stored profiles only.
- Every card field traces to stored profile or current-class data.
- Art, location and audience filters and page are URL-restorable and server-applied.
- Pagination is deterministic under filtering and complete across pages.
- No fabricated trust, price, city, audience or action appears.
- `bun run gates` and the live registry suite pass on the development branch.

## 8. Open questions

None for Task 12. Photo-led cards, user-selectable sort, profile links and distance sorting are deferred to later tasks or phases.
