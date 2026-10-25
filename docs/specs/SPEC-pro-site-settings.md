# SPEC-pro-site-settings: owner controls for the Pro Site

## Status and provenance

Accepted on 2026-10-25 for Task 17 under the owner's instruction to proceed with the next planned task. This contract records the decisions required by the task before code, per `tasks/plan.md`'s specification-first rule. It extends `docs/specs/SPEC-pro-site.md`; that contract continues to govern the public renderer and read-only states.

Sources: `product-vision.md` §20.3, §20.8, §20.9 and §30.2; `docs/decisions/ADR-002-mvp-scope-and-free-pro-site.md`; `docs/decisions/ADR-004-first-release-infrastructure-decisions.md` §2; `docs/specs/SPEC-redesign.md` Phase R6; `docs/specs/SPEC-pro-site.md`.

### Design source

The Magic Patterns OS list on 2026-10-25 exposes only `8mSrQnjckjwek16BQjQewn` ("Magic Wardrobe - Example App"), an unrelated design. There is no Pro Site settings design in the OS. The console structure therefore follows the `masterscorner.html` `/dashboard/site` screen, using the existing console components and Pro Site tokens. The prototype's plan, premium custom-domain and Events rows are removed.

### Decisions

1. **Site name.** The stored site name is a Pro Site brand override. `null` means the public site uses `master_profile.display_name`. The hero `h1` and Contact continue to name the master; the header and footer carry the site brand.
2. **Style.** Style is a curated accent palette, not arbitrary colour input or a theme editor. Values are `ochre` (default), `terracotta` and `sage`. The base earth/parchment surfaces do not change. Each accent is used by the existing Pro Site accent roles (eyebrow, CTA, rules and underlines). A paired darker ink token keeps underlines on parchment at 3:1 or better while the bright accent remains on earth surfaces.
3. **Preview.** The owner can preview the current saved site whether or not it is published. Preview is an authenticated draft view, not a second public address.

## 1. Objective

A master can name the site, choose a supported accent, preview the result, publish or unpublish it, and see which profile-owned content feeds the public site.

Success: a saved name and style are visible on the public site; publishing makes the address readable without a session; unpublishing returns the same not-available screen as an unknown address; draft preview remains owner-only; sync rows mention only content the profile owns.

## 2. Scope

### 2.1 In scope

- `pro_site.site_name` (nullable) and `pro_site.style` (non-null, default `ochre`) with a checked, versioned migration.
- Protected settings save, publication change and draft preview procedures.
- `/dashboard/site` controls for site name, style, publish/unpublish, preview and sync.
- `/site-preview`, an authenticated standalone draft preview using the existing renderer.
- Public payload additions for the effective site name and style.
- Unit, contract and browser verification of the settings lifecycle.

### 2.2 Out of scope

- Plans, billing, custom domains, white-label controls, analytics, events, galleries, reviews, verification and section toggles.
- Arbitrary colours, uploaded fonts, a theme editor, a site builder or section-level content editing.
- Changing the profile's display name through Pro Site settings.
- A public preview address, share links or previews for another account.

### 2.3 Boundaries

- Always: derive the profile from `ctx.session.user.id`; keep profile-owned facts in the profile; use the existing public loader for preview and published payloads; sanitize/validate names at the API boundary; default missing or invalid legacy values safely.
- Never: create or publish a site on profile/class/photo writes; expose an unpublished site through `bySlug`; let another account preview or publish a site; render a plan, billing, custom-domain, verification or Events claim; mutate a published site's content from the settings form beyond name/style.

## 3. Data contract

```text
pro_site
  profile_id    uuid primary key references master_profile(id) on delete cascade
  published_at  timestamp null
  site_name     text null
  style         text not null default 'ochre'
  created_at    timestamp not null default now()
  updated_at    timestamp not null default now()
```

- `site_name` is trimmed before storage. `null` means "use the master's display name". An empty submitted value stores `null`.
- `style` is constrained to the supported values. The default is `ochre` so existing rows and pre-Task 17 publication rows keep their current look.
- A settings save may create the row with `published_at` null, but never changes publication state.
- Publishing sets `published_at` if needed; unpublishing clears it. Both are idempotent from the public reader's perspective.
- Existing migration history is not rewritten. The new migration only adds nullable/defaulted columns and constraints.

### 3.1 Public payload

`ProSitePayload` gains:

```ts
interface ProSitePayload {
  // existing fields unchanged
  siteName: string; // stored name, or the master's display name
  style: ProSiteStyle; // "ochre" | "terracotta" | "sage"
}
```

`displayName` remains the master identity and the source of the slug. `siteName` is used by the Pro Site header and footer. Public payloads still exclude account ids, email, revisions, media object keys, publication timestamps and drafts.

### 3.2 Console status

`proSite.status` returns `null` without a profile. Otherwise:

```ts
interface ProSiteStatus {
  address: string; // /pro/{slug}
  displayName: string; // profile-name fallback
  published: boolean;
  siteName: string | null; // stored override, null when using displayName
  style: ProSiteStyle;
  sync: {
    bio: boolean;
    classes: boolean;
    locations: boolean;
    media: boolean;
    schedule: boolean;
  };
}
```

`sync` is derived from the same current-class and media rules as the public payload:

- `bio`: stored introduction has non-whitespace text.
- `locations`: at least one stored teaching location.
- `classes`: at least one active/full class.
- `schedule`: at least one current class has a weekly slot.
- `media`: a current profile photo or site logo exists.

The UI labels these rows `Bio`, `Teaching locations`, `Classes`, `Schedule` and `Photo and logo`, with `Synced` or `Not added`. It does not show an Events row, plan, billing or custom-domain row.

## 4. Procedures

### 4.1 `proSite.saveSettings`

Protected mutation:

```ts
input: { siteName: string | null; style: ProSiteStyle }
```

- Trim and validate `siteName`: empty -> `null`; otherwise 1-80 characters after trim.
- Reject an unknown style at the boundary.
- Require a master profile; throw `PRECONDITION_FAILED` when absent.
- Upsert the caller's `pro_site` row, changing only `site_name` and `style`. Publication state is untouched.
- Return the updated `ProSiteStatus`.

### 4.2 `proSite.setPublished`

Protected mutation:

```ts
input: { published: boolean }
```

- Require a master profile; throw `PRECONDITION_FAILED` when absent.
- Publish: upsert the row and set `published_at` to now.
- Unpublish: update the caller's row to `published_at = null`; a missing row is already unpublished.
- Return the updated `ProSiteStatus`.

### 4.3 `proSite.preview`

Protected query returning `ProSitePayload | null` for the caller's own profile, regardless of `published_at`. This is the only read that returns an unpublished site and it never accepts a profile id or slug.

### 4.4 Public read

`proSite.bySlug` is unchanged in gate and privacy behavior. It joins the publication row for `site_name`/`style`, loads the shared public profile, and merges the effective site name and style. Unknown, malformed and unpublished slugs still return `null`.

## 5. UI contract

### 5.1 `/dashboard/site`

The page keeps the console shell and adds:

1. Header action: `Preview` opens `/site-preview` in a new tab. When published, `Open site` links to the live address.
2. **Publication** card: live/reserved path address, `Live`/`Not published` status, short truthful description, and `Publish site`/`Unpublish site`. Unpublish requires an inline confirmation.
3. **Site name** card/form: labelled input, hint that clearing uses the profile name, submit with `Save changes`.
4. **Site style** card/form: a radio group of the three supported accents with visible labels and swatches. No free colour picker.
5. **Data sync** card: the five rows and truthful `Synced`/`Not added` states from `status.sync`.
6. No plan, billing, premium, custom-domain, Events, verification or analytics claim.

Name/style share one save mutation. A successful save updates the cached status and invalidates public Pro Site queries after the identity-scope guard. A failed save preserves the draft and shows the error. Publication changes invalidate status and both public/preview queries. The existing no-profile empty state remains.

### 5.2 `/site-preview`

Auth-only, outside the console shell. It renders the existing `ProSitePage` with `proSite.preview`, a small `Back to settings` bar, and the branded loading/error states. It does not create a public link or expose the payload to another account.

### 5.3 Public renderer

- Root carries `data-style={site.style}`; CSS scopes the selected accent to the existing Pro Site accent token.
- Header and footer use `siteName`.
- Hero, About, Programs, Schedule and Contact keep using the master identity and stored facts.
- The fixed earth/parchment surfaces, typography, omission rules and accessibility behavior remain unchanged.

## 6. Testing

- Small: site-name normalization (trim, empty -> null, 80-character limit, 81 rejected), style enum, effective name fallback, sync derivation.
- Contract: settings insert/update preserves publication; publish/unpublish gate; preview is owner-only and returns draft data; another account cannot change or preview; no-profile behavior; public payload exact keys and values.
- Migration: generated SQL reviewed, applied to development, and existing `pro_site` rows read with default style and null name.
- UI: browser walkthrough at 1440/1024/768/390 of change -> save -> preview -> publish -> public -> unpublish -> not available; a style-only save preserves the unresolved profile-name fallback; style visibly changes; sync states; no plan/custom-domain copy; keyboard/focus, including the inline unpublish confirmation; no horizontal overflow.
- Gates: `bun run gates`, focused API tests, `bun run test:db` against development.

## 7. Success criteria

1. Saving a site name and style changes the public site without changing the master profile name.
2. An unpublished site cannot be read through `/pro/{slug}`; the owner can preview it.
3. Publishing makes the address public; unpublishing restores the indistinguishable unavailable state.
4. Sync rows describe only bio, locations, classes, schedule and media, and are accurate.
5. No plan, billing, custom-domain, Events or verification claim appears.
6. Existing public Pro Site behavior, privacy, class-status filtering and profile save rules remain intact.

## 8. Owner decisions recorded

1. **Name is a brand override.** The site name does not rename the master or alter the public slug.
2. **Style is curated.** Three accents only; no arbitrary brand colours in the first release.
3. **Preview is draft-capable.** It is authenticated and owner-scoped; the public address remains gated by publication.
