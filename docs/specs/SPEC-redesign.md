# SPEC-redesign: Magic Patterns marketplace and console port

## Status

Accepted 2026-10-23. Owner decisions: full MVP rebrand; include reviews, verification, booking/trial and pricing as modules; use Magic Patterns images as temporary marketing assets. Phase R1 (tokens, shell and Home) is implemented; phases R2-R6 remain.

## 1. Objective

Replace the prototype-derived visual system with the Magic Patterns "MastersCorner redesign" for every shipped MVP screen, while keeping the app's real data, authorization and product invariants. The result should be recognisably the OS design at its breakpoints, with the design's unsupported or unbacked content omitted rather than faked.

Source: `https://www.magicpatterns.com/os/gywtehNats7LxFyJszknmE/pd9Jk5FBuQTvFHQE8qRjDm` (OS `gywtehNats7LxFyJszknmE`, file `pd9Jk5FBuQTvFHQE8qRjDm`).

Success: the in-scope routes use the new shell, type scale, spacing, card anatomy and surfaces; navigation reaches only live routes; every master, class, photo, fee and public count is stored data; the new feature modules are added only after their own contract exists.

## 2. Visual contract

Transcribe these values into `packages/ui/src/styles/globals.css` under new names so unported screens keep their current tokens.

| Role | Value | Notes |
| --- | --- | --- |
| Canvas | `#ffffff` | Page background; OS `paper` |
| Sand | `#f6f5f2` | Tinted sections and quiet cards; OS `sand` |
| Ink | `#0b132b` | Primary text and dark surfaces |
| Ink 2 | `#172033` | Secondary copy |
| Muted | `#5f6a82` | Meta copy |
| Steel | `#9aa6bc` | Muted text on dark |
| Line | `#e4e6ec` | Rules and card borders |
| Accent | `#d14b5a` | Logo centre mark |
| Accent strong | `#b83a48` | Primary buttons and links |
| Accent deep | `#9e2f3c` | Button hover |
| Saffron | `#f4c64e` | Master CTA surface |
| Earth / earth 2 / ochre / parchment | `#17110c` / `#241a12` / `#e0954a` / `#f3e9da` | Pro Site phase |
| Display | Fraunces | Pro Site phase only; the marketplace OS uses Outfit |
| Sans | Outfit | Existing self-hosted variable font |
| Container | `min(100% - 40px, 1240px)` | New `redesign-container`; old `shell-container` stays for unported screens |
| Breakpoints | 640 / 768 / 1024 / 1280 px | OS uses Tailwind defaults; add `dsm`/`dmd`/`dlg`/`dxl` tokens or exact arbitrary variants, do not reuse the old 521/761/981 tokens |
| Radii | 24 px cards, 32 px feature panels, full pills | Use exact classes from the OS |
| Motion | 150–300 ms, strong ease-out; reduced-motion respected | No layout-shifting animation |

The marketplace screen composition is: white page, sticky 64/72 px header, max 1240 px content, bordered section rules, large bold headings, sand panels, photo-led master cards, dark footer. The console is sand background with a dark 264 px rail and a white work area. Pro Site is the earth/parchment theme and follows its own task.

## 3. Route mapping

| OS route | App route | Disposition |
| --- | --- | --- |
| `/` | `/` | Port, with real featured masters and a class preview; omit Academies, Experience Card, Events, Requests and the Experience Card promo |
| `/masters` | `/masters` | Port the sidebar filters, search, result header and photo-led cards; no ratings, Verified, distance or unapproved sorts |
| `/masters/arun-vel` | `/masters/$slug` | Port the breadcrumb, editorial hero, training paths and schedule; omit reviews, Verified, Book Trial, Pro Site link and profile-ID note until their modules exist |
| `/classes` | `/classes` | Port the typographic table, chips and empty state; no Book action |
| `/for-masters` | `/for-masters` | Port the editorial platform layout; no pricing, fake dashboard metrics or plan claims |
| `/login` | `/login` | Port the split photo/form composition; real auth only, no demo credentials |
| absent | `/signup` | Design in the same language before implementation |
| `/dashboard` | `/dashboard` | Port the dark rail and overview composition; only real counts and shipped destinations |
| `/dashboard/profile` | `/dashboard/profile` | Port the editor panels; remove Verification, plan and fake times |
| absent | `/dashboard/classes` | Design in the same console language; keep existing CRUD behavior |
| `/dashboard/site` | `/dashboard/site` | Port the settings shell; no plan or custom-domain claim |
| `/academies`, `/events`, `/experience`, `/pricing`, `/book`, `/schools`, `/requests` | — | Omit: no backend and outside the selected MVP rebrand |
| `/pro/arun-vel` | `/pro/$slug` | Later Pro Site task, using the OS earth theme and real sections |
| `/404`, `/error` | app boundaries | Port the status treatment after the shell |

The OS sample data is not a contract. `data.ts`, the sample master names, review quotes, prices, learner counts, profile completeness and reference numbers must not be copied into components.

## 4. Content, imagery and interaction rules

- Every visible master, class, fee, count, schedule, location and photo comes from a tRPC query or the authenticated session.
- No rating, review, verification badge, trial price, plan name or completion score renders until its module is implemented and the row exists. Until then the associated element is absent, not a placeholder.
- All navigation and CTAs reach a built route. The OS nav's Academies, Events and Experience Card items are not shown; the footer is reduced to live destinations.
- Magic Patterns images may be downloaded into `apps/web/public/redesign/` for the Home hero/marketing collage. They are not used as real master portraits. A profile without a photo gets a deliberate sand/initial card, not a stock face.
- Photography uses fixed aspect ratios and `object-cover`; no layout shift. Alt text names the subject; decorative images are empty-alt.
- Search on Home writes `art`, `location` and `audience` to `/masters` using the existing normalized filter values. Options come from the directory query, not hardcoded lists.
- Header, footer, bottom navigation and console rail expose only live routes and respect the authenticated session state.
- Reduced motion disables word cycling and hover/entry transforms; focus rings stay visible; all controls are keyboard reachable.
- The old `shell-container` and old tokens remain for unported routes. A ported route uses `redesign-container`, `bg-canvas`, `bg-sand`, the existing `text-navy`/`text-ink`/`text-ink-muted` aliases (OS ink/ink-2/muted), `border-hairline` (OS line), `brand-*` (OS accent-*), and the new breakpoints. These aliases already carry the OS values; the redesign does not duplicate equivalent tokens.

## 5. Feature modules (committed after the visual foundation)

Each gets its own spec, schema/API work and tests; none is implemented as static design content.

| Module | Required decisions before implementation |
| --- | --- |
| Reviews | Who can review, proof of attendance, one-review-per-student, moderation/reporting, aggregate rating calculation, master replies? |
| Verification | Who verifies, evidence type, expiry, admin/manual process, badge eligibility, public evidence display, revocation |
| Booking / trial | Request lifecycle, student contact capture, consent, notifications, master lead inbox, conflict with classes, pricing |
| Pricing / plans | Plan names/prices, billing provider, free Pro Site conflict, custom domains, entitlement enforcement, cancellation |

The first four visual phases do not block on those decisions; they omit the unbacked elements. The modules follow once their specs are approved.

## 6. Phases and acceptance

### Phase R1 — Foundation, shell and Home

- Add the new semantic tokens, container utility and design breakpoints without changing old tokens.
- Add local Magic Patterns marketing images; record their source.
- Replace the marketplace header, footer and mobile navigation with the OS shell using live destinations only.
- Port Home: hero with word cycle, real search, featured masters from `directory.masters`, class preview from `directory.classes`, master CTA. Omit the OS's Academies, Experience, Events and Requests sections and the promo bar.
- Extend `DirectoryMasterView` with the current profile photo URL if needed for cards.
- Acceptance: real data; search navigates to filtered `/masters`; no dead links, fake counts, ratings, reviews, Verified or Book action; 1440/1024/768/390 px browser checks; reduced motion; `bun run gates` and live tests pass.

### Phase R2 — Public marketplace

- Restyle Masters registry, master profile, Classes and For Masters against the OS.
- Keep the existing query contracts and product omissions; add photo-led cards and no-photo fallbacks.
- Acceptance: full/minimal/unknown profiles; filters and pagination; no horizontal scroll; no unbacked trust or conversion content.

### Phase R3 — Auth

- Port login and design sign-up in the same split-brand language; real Better Auth flows, accessible errors and redirects.
- Acceptance: sign-in, sign-up, redirect validation, no demo credentials.

### Phase R4 — Console

- Port the dark rail, header and profile/classes/site work areas; remove plan, verification and fake metrics.
- Acceptance: existing CRUD and session-isolation behavior unchanged.

### Phase R5 — Feature modules

- Reviews, verification, booking/trial and pricing, each via its own spec and migration.
- Acceptance: real rows only, authorization, empty/error states, moderation/admin path where required.

### Phase R6 — Pro Site

- Port the earth/parchment Pro Site and settings to real data; path address first, subdomain when the zone check passes.

## 7. Testing strategy

- Repository: `bun run gates` per phase; `bun run test:db` for any API/schema phase.
- UI: browser comparison at 1440, 1024, 768 and 390 px; interaction checks for nav, search, filters, cards, forms and focus; reduced-motion check.
- Data: every rendered value traceable to a query or session; no sample `data.ts` values in the bundle.
- Links: crawl the ported routes and assert every internal destination resolves; no links to omitted modules.
- Privacy: public payload assertions continue to exclude email, user id, revision, object keys and drafts.
- Feature modules: contract and integration tests for their own state machines before UI enablement.

## 8. Boundaries

- Always: real data; live routes only; preserve auth/session isolation; preserve form/query cache behavior; keep the old tokens for unported screens; browser-check each phase.
- Ask first: any new schema, new public claim, new CTA, new route, plan/price, verification criterion or review policy.
- Never: ship sample ratings/reviews/Verified/learner counts/prices; use a stock face as a real master; copy the OS hash router or `data.ts`; hotlink the Magic Patterns CDN in production; mix two visual systems inside one ported screen.

## 9. Open questions

1. Reviews: student verification and moderation policy.
2. Verification: evidence and admin workflow.
3. Booking: lead ownership, notifications and pricing.
4. Pricing: billing provider and how paid plans coexist with the free Pro Site decision.
5. Magic Patterns image licensing for production use.

## Verification of this spec

- Every OS route is classified.
- The visual values and breakpoints are explicit.
- The owner's feature choices are recorded with the required follow-up specs.
- Phase R1 has observable acceptance criteria.
