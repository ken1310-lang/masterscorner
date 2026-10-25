# SPEC-pro-site: public Pro Site renderer

## Status and provenance

Accepted on 2026-10-25 for Task 16 under the owner's decisions: read-only renderer and console status, city/locations-only Contact, and the site's existing native typography. The owner's instruction was to proceed with the next planned task; this contract records the approved boundaries before implementation, per `tasks/plan.md`'s specification-first rule. Task 17 controls are governed by `docs/specs/SPEC-pro-site-settings.md` and implemented on 2026-10-25.

Sources: `product-vision.md` §20.3, §20.5-§20.9 and §30.2; `docs/decisions/ADR-002-mvp-scope-and-free-pro-site.md` (free Pro Site, first-release scope); `docs/decisions/ADR-003-design-source-of-truth-and-port.md` (prototype layout); `docs/decisions/ADR-004-first-release-infrastructure-decisions.md` §2 (path address, subdomain target); `docs/specs/SPEC-redesign.md` §2 and Phase R6 (earth/parchment Pro Site); `docs/specs/SPEC-master-profile-page.md` (public slug and class payload).

### Zone check (Task 16 prerequisite)

Checked 2026-10-25 against the production Cloudflare account:

- `GET /zones` returned an empty list; the account has no zone for `masterscorner.in`.
- `nslookup -type=NS masterscorner.in 1.1.1.1` returned NXDOMAIN.

The subdomain and wildcard certificate cannot be enabled. Task 16 ships the path address `/pro/{slug}`. No `packages/infra/alchemy.run.ts` change is made until the zone exists. The console must display the path address that is actually live, never `{slug}.masterscorner.in`.

### Design source

The current Magic Patterns OS (`8mSrQnjckjwek16BQjQewn`) exposes only the unrelated "Magic Wardrobe - Example App"; it has no Pro Site design. The renderer therefore ports the Pro Site structure from `masterscorner.html` (the accepted ADR-003 source) and uses `SPEC-redesign.md`'s earth/parchment Pro Site phase for surfaces and typography. It is not a Magic Patterns port.

## 1. Objective

An anonymous visitor can open a master's published Pro Site and understand who the master is, what they teach, where and when training happens, and where to find the academy. Every section is generated from stored profile, class, schedule and media rows. The site is a standalone branded page: it has no marketplace header, footer, search, console navigation or account-dependent content.

Success: `/pro/{slug}` renders a published site with real About, Programs, Schedule and Contact sections; missing sections leave no gap; an unpublished or unknown site is indistinguishable from a missing site; the same host-independent component can later serve `{slug}.masterscorner.in` without changing the renderer.

## 2. Scope

### 2.1 In scope (Task 16)

- A `pro_site` publication record keyed by `master_profile.id`; publishing is opt-in and no profile is published automatically.
- A public `proSite.bySlug` query that returns only published sites and only public profile/class/media data.
- A protected read-only `proSite.status` query for the console's live address and publication state.
- `/pro/$slug`, outside `_marketplace`, with a skip link, branded anchor navigation, hero, About, Programs, Schedule, Contact and footer.
- Earth/parchment theme using the app's existing native Outfit typography, scoped to Pro Site. No new font dependency.
- A read-only `/dashboard/site` state showing the reserved/live path address and publication status. It has no publish, name, style or sync controls; Task 17 owns those.
- Pure and live contract tests for the publication gate, section data, privacy and omission rules.
- Browser verification at 1440/1024/768/390 px for two different masters, an unpublished site and an unknown slug.

### 2.2 Out of scope

- Publishing/unpublishing controls, site name editing, style choice, preview controls and the sync panel; these are implemented in Task 17 under `docs/specs/SPEC-pro-site-settings.md`.
- Subdomain DNS, wildcard routing, certificates and host-based Worker routing. The path address ships; the subdomain remains the canonical target once the zone exists (ADR-004).
- Contact forms, enquiry delivery, trial booking, phone numbers, public email addresses, ratings, reviews, verification badges, galleries, events, achievements, lineage, maps, geocoded addresses, analytics, plans, billing and custom domains.
- User-selected vanity slugs and site-specific slugs.
- Native parity.
- SEO/OpenGraph metadata beyond a static route title and description.

### 2.3 Boundaries

- Always: derive every visible fact from `master_profile`, `master_location`, `master_martial_art`, `master_class`, `master_class_schedule` or `media`; require a published `pro_site` row; reuse the public profile slug; reuse the directory's current-class rules; omit absent sections; keep the renderer host-independent; keep old path links resolving after a display-name change through the UUID suffix.
- Ask first: adding public contact fields, changing the publication model, adding a public action or CTA, adding a new theme, changing which class statuses are public, adding a schema column beyond publication state.
- Never: auto-publish a profile; render an unpublished site's data; expose account email, user id, profile revision, media object key, paused classes or draft data; render a Book Trial, enquiry, contact or MastersCorner profile action; use marketplace chrome; show a subdomain as live before the zone exists; invent a program description, rating, review, badge, metric or contact detail.

## 3. Contract

### 3.1 Publication state

Add one versioned migration for a `pro_site` table:

```text
pro_site
  profile_id    uuid primary key references master_profile(id) on delete cascade
  published_at  timestamp null
  created_at    timestamp not null default now()
  updated_at    timestamp not null default now()
```

- No row or `published_at is null` means the site is not published.
- A profile save, class save or photo upload never creates or publishes a row.
- Deleting the profile cascades the site record.
- Only Task 17 adds the write path that sets/clears `published_at`. Task 16 reads the state and uses a temporary fixture for browser verification.
- `published_at` is not exposed publicly; the public contract is the site payload or `null`.

### 3.2 Public query

`proSite.bySlug` is a public tRPC query. It accepts the same slug boundary as `directory.masterProfile` (trimmed, 1-200 characters; malformed input returns `null`). It resolves the embedded profile UUID, requires a published `pro_site` row, then returns:

```ts
interface ProSitePayload {
  classes: DirectoryMasterClassView[]; // active/full only, name then id
  displayName: string;
  homeCity: string | null;
  introduction: string | null;
  locations: { id: string; name: string }[]; // profile order
  logoUrl: string | null; // current site_logo, or null
  martialArts: string[]; // profile order
  photoUrl: string | null; // current profile_photo, or null
  slug: string;
  yearsTeaching: number | null;
}
```

`DirectoryMasterClassView` is the existing public directory type: class name, audience, level, status, optional fee pair, martial art, location and sorted weekly schedules. Classes include only `active` and `full`; paused classes are omitted. Missing optional values stay `null` or empty arrays rather than placeholders.

Implementation must not duplicate the profile/class mapping. Extract the existing read used by `directory.masterProfile` into a shared internal loader and call it from both procedures; `directory.masterProfile` keeps its current response and behavior. The Pro Site query adds the current `site_logo` URL from the same media rules that choose the profile photo.

Unknown, malformed and unpublished slugs all return `null`. The query must not reveal whether a profile exists but is unpublished.

### 3.3 Console status

`proSite.status` is a protected query scoped to `ctx.session.user.id`:

```ts
interface ProSiteStatus {
  address: string; // /pro/{slug} — the address that is live
  published: boolean;
}
```

It returns `null` when the account has no master profile. It never returns another account's profile or address. The address uses the current display-name slug; a previous name prefix still resolves because the UUID suffix is the identity.

`/dashboard/site` uses `proSite.status`:

- No profile: keep the existing truthful empty state.
- Profile, unpublished: show the reserved path address and `Not published`. Do not show a control that does nothing.
- Profile, published: show the path address and `Live`, with an **Open site** link to `/pro/{slug}`.
- No plan, billing, custom-domain, verification or sync claim. Task 16 has no publish button; Task 17 adds publication in `docs/specs/SPEC-pro-site-settings.md`.

### 3.4 Screen

`/pro/$slug` is a root file route, not under `_marketplace`. It renders no marketplace `Header`, `Footer`, `MobileNav`, search, console rail or account UI. The only MastersCorner navigation is the footer's `Powered by MastersCorner` link to `/`.

The page order and omission rules:

1. **Skip link** to `#pro-main`.
2. **Pro Site header**: brand mark (current `site_logo` if present, otherwise the master's initials), site/display name, arts·city subtitle when present, and anchor navigation. Navigation items render only for sections that will render: About, Programs, Schedule, Contact. No Book Trial, sign-in, console or marketplace links.
3. **Hero**: earth/parchment surface; the current profile photo when present with a contrast scrim, otherwise a deliberate typographic panel with no stock image. `h1` is the display name; arts and home city are metadata. No fabricated headline, claim or primary CTA. An internal `See programs`/`See schedule` link may appear only when that section exists.
4. **About**: the stored introduction with preserved line breaks. The section is absent when `introduction` is null or blank. Real stats (years teaching, locations, current classes) may sit beside it only when stored; no rating.
5. **Programs**: one card per current class, showing name, martial art, audience, level, optional fee and `Full` status. No invented description, duration, objective or outcome. Absent when there are no current classes.
6. **Schedule**: locations in profile order, each with its current classes and weekly slots from the existing `formatSchedules` helper. A location with no current class does not get a schedule claim. Absent when no current class has a schedule.
7. **Contact**: stored home city and teaching locations, with a same-page link to the schedule when it exists. A stored location may have no current class, so Contact labels the list as teaching locations and never claims that classes currently run there. This is the contact panel the first release can support: no email, phone, form, map, trial, booking or MastersCorner profile link. Absent when both city and locations are absent.
8. **Footer**: site/display name, city when present, and `Powered by MastersCorner` linking to `/`. No other links, badges or verification claims.

Every section is conditional; a missing section removes its heading, anchor and header navigation item, leaving no empty gap. Long names, arts, class names and locations wrap without horizontal page scroll.

States, all without marketplace chrome:

- Loading: a branded skeleton in the Pro Site surface with `aria-busy`; no fabricated content.
- Error without data: `This site could not load` with Retry.
- Unknown, malformed or unpublished slug: `This Pro Site is not available` plus the `Powered by MastersCorner` footer. Do not show partial profile data or distinguish unpublished from missing.
- Refresh error with cached data: a retry banner above the existing content.

### 3.5 Theme and address behaviour

Use `SPEC-redesign.md`'s Pro Site values: parchment `#f3e9da`, earth `#17110c`, earth-2 `#241a12`, ochre `#e0954a`, and the app's existing native Outfit typeface for display and body copy. The owner chose native typography over adding Fraunces; this is a recorded deviation from `SPEC-redesign.md`'s display-font note. Add semantic Pro Site tokens; do not change marketplace or console tokens. The page maximum width is `1180px` with 20px mobile gutters. Display headings use the prototype's Pro Site scale (hero `clamp(50px,7vw,88px)`, section headings near 40-48px) and reduced-motion rules apply.

The renderer is one component fed by one query. The path route supplies the slug. A future host-based route for `{slug}.masterscorner.in` must call the same component and query; the content, sections and styles do not change. No host detection or subdomain logic is added while the zone is absent.

The console's address is `/pro/{slug}` because that is the live address. When the zone and wildcard certificate exist, the canonical address can be switched to `{slug}.masterscorner.in`; this requires routing/DNS work, not a renderer change.

### 3.6 Freshness and privacy

Profile saves, class save/status/remove, photo upload/removal and (from Task 17) publication changes invalidate `proSite.bySlug` and `proSite.status` after the existing identity-scope check. Failed or superseded write responses do not invalidate public data.

Public payloads exclude account email and user id, profile revision, media id/object key, class revision, `pausedFromStatus`, timestamps, and all unpublished/private rows. The site's public address and content are readable without a session.

## 4. Commands and structure

```text
Dev (API + web + native): bun run dev
Focused API tests:        bun test packages/api/src/pro-site.test.ts
Live Pro Site tests:      bun run test:db  (from packages/api; development DATABASE_URL)
Web build/types:          bun run check-types --filter=web
Full gates:               bun run gates
Migration generation:     bun run db:generate
Migration apply:          bun run db:migrate
```

| Path | Purpose |
| --- | --- |
| `docs/specs/SPEC-pro-site.md` | This contract |
| `packages/db/src/schema/pro-site.ts` | `pro_site` table and relations |
| `packages/db/src/schema/index.ts`, `packages/db/src/relations.ts` | Schema/relation exports |
| `packages/db/src/migrations/*` | Generated publication migration |
| `packages/api/src/pro-site.ts` | Public payload, input, status types and pure section helpers |
| `packages/api/src/routers/pro-site.ts` | `bySlug` public query and `status` protected query |
| `packages/api/src/routers/directory.ts` | Shared public profile loader extraction; response unchanged |
| `packages/api/src/routers/pro-site.integration.test.ts` | Live publication, privacy and data contract |
| `apps/web/src/routes/pro.$slug.tsx` | Root-level Pro Site route |
| `apps/web/src/components/pro-site/pro-site-screen.tsx` | Host-independent renderer, states and sections |
| `apps/web/src/components/pro-site/*` | Header, hero, programs, schedule, contact and footer pieces |
| `apps/web/src/routes/_auth/dashboard/site.tsx` | Read-only path/status state |
| `packages/ui/src/styles/globals.css` | Scoped Pro Site earth/parchment tokens; existing Outfit typography |

No `packages/infra/alchemy.run.ts` change in Task 16: the zone check failed, so the path address ships and the subdomain work is deferred.

## 5. Code style

```ts
export const proSiteAddress = (slug: string) => `/pro/${slug}`;

export function visibleProSiteSections(site: ProSitePayload) {
  return {
    about: Boolean(site.introduction?.trim()),
    programs: site.classes.length > 0,
    schedule: site.classes.some((item) => item.schedules.length > 0),
    contact: Boolean(site.homeCity) || site.locations.length > 0,
  };
}
```

Use the existing public slug helpers, `DirectoryMasterClassView`, `formatFee`, `formatSchedules`, `publicProcedure`/`protectedProcedure`, Drizzle relational reads, TanStack Query `queryOptions`, Tailwind v4 semantic roles and the root skip-link pattern. Do not add a state library, a Tailwind config, a generic site builder, a theme editor or a new routing abstraction.

## 6. Testing strategy

- Small: the publication gate returns `null` without a row or with `published_at: null`; section visibility omits each empty section including a city-only/contact case; an address is `/pro/{slug}`; malformed and 201-character slugs are rejected before the query.
- Contract (live): a published fixture returns ordered arts/locations, active/full classes with sorted schedules, optional fees, profile photo and site logo; unpublished and unknown profiles return `null`; paused classes and private fields are absent; another master's site is not readable through a protected status query; deleting the profile removes the site.
- Console: no profile keeps the empty state; unpublished shows the path and `Not published`; published shows `Live` and an **Open site** link; no plan/custom-domain/sync claim.
- UI: browser at 1440/1024/768/390 px for two different masters (full and minimal), plus unpublished and unknown slugs. Assert no marketplace header/footer, the only MastersCorner link is `Powered by`, all nav anchors resolve to visible sections, absent sections leave no gap, no horizontal page scroll, focus is visible, and the console's address opens the same content. The subdomain comparison is deferred with the zone check.
- Freshness: profile/class/photo writes invalidate `proSite.bySlug` after the identity-scope check.
- `bun run gates`, the live API suite and the migration replay must pass. Hosted CI remains the documented account-level failure.

## 7. Success criteria

1. A published master's site renders real About, Programs, Schedule and Contact content at `/pro/{slug}` without a session.
2. A missing section removes its content, heading, nav item and gap.
3. An unpublished or unknown slug shows the same branded not-available screen and leaks no profile data.
4. The renderer has no marketplace chrome and no MastersCorner navigation beyond `Powered by MastersCorner`.
5. The console shows the live path address and publication status; Task 17 adds all editing/publishing controls under `docs/specs/SPEC-pro-site-settings.md`.
6. The same host-independent component can serve the future subdomain without a content rewrite.
7. `bun run gates` and the live Pro Site contract pass; browser checks at four widths have no overflow.

## 8. Owner decisions

1. **Publication boundary.** Task 16 is read-only: it adds the `pro_site` table, public read, publication gate and console status, but no publish/unpublish mutation or UI. Task 17 adds those controls under `docs/specs/SPEC-pro-site-settings.md`. The live suite and browser walkthrough use a temporary published fixture.
2. **Contact section.** Contact shows stored city and teaching locations with an internal schedule link. Email, phone, forms and booking stay out until the Phase 2 enquiry module; no public contact field is added.
3. **Typography.** Pro Site uses the app's existing native Outfit stack. No Fraunces package or face is added; this is a recorded deviation from the redesign's display-font note.
