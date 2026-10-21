# SPEC-platform: environments, quality gates and the web shell

**Module:** `platform` (PRD §39) — **Tasks 1–3, PRs 1–3**
**Status:** **Approved 2026-10-20.** The owner delegated the check ("everything fixed means approve, if not verify and fix"). Verification: every prototype citation resolves (144/144 line/value pairs against `masterscorner.html`), and the repo-derived claims were re-checked against the workspace — `dev:bare` exists in `apps/web/package.json` and is missing from `turbo.json`, `dev:server` filters `-F hono` which does not exist, `bun.lock` exists, `drizzle.config.ts` reads `process.env.DATABASE_URL`, `.env.schema` already carries `@currentEnv=$NODE_ENV` with `NODE_ENV=development|production|test`, `apps/web/public/` exists, `apps/web/src/index.css` already imports the UI globals, `globalEnv` already lists `_VARLOCK_ENV_KEY`/`DATABASE_URL`/`NODE_ENV`/`CI`, and `.github/` does not exist. Corrections made during that pass: branch names are `dev` → `master` (not `main`), the repository has no remote yet, and the footer's link columns grow with the modules. PR 1 may start.
**Sources:** `product-vision.md` v2.0 (§29, §30, §37, §38), `docs/design-alignment.md` (§2, §7, §8, §9), `docs/decisions/ADR-001…004`, `tasks/plan.md`, `tasks/todo.md`, `AGENTS.md`.
**Prototype evidence:** `masterscorner.html`, 3264 lines, 26 route screens with `data-screen` at 2813–3067. Token block `:root` 162–182; font faces 12–15; header markup 2814 (repeated 2814–2838, standalone 2857/2938/3024); mobile header rules 2371–2421 (≤980), 2491–2493 (≤760), 2730–2735 (≤520); footer CSS 745–787, markup 2814/2920/3006/3041; surface-aware roles 2314–2326; not-found 3057–3058; error 2853–2854; media queries 2370 (980), 2481 (760), 2720 (520), 2805 (640, prototype chrome only); reduced-motion blocks 2364, 2773, 2792, 2806. Re-verified against the file on 2026-10-20: 144 of 144 cited line/value pairs resolve.

---

## 1. Objective

Give the app a place to run, a way to prove a change is safe, and the prototype's visual system — before any product feature is built.

- **User:** the developer (Tasks 1–2) and every visitor who sees a MastersCorner screen (Task 3).
- **Success:** `bun run dev` boots the API and the web against the development database branch; a pull request cannot merge without checks passing; every later screen inherits the prototype's palette, type, breakpoints and shell instead of re-inventing them.
- **Why first:** every later module assumes an environment to exercise it in, a runner that can prove it, and tokens that make "pixel-perfect" checkable rather than arguable.

## 2. Scope

### 2.1 In scope (one PR per task)

| Task | Deliverable | PR |
| --- | --- | --- |
| 1 | Neon project in `aws-ap-southeast-1` with `development` and `production` branches, `neon.ts` declaring the `media` bucket, per-environment secrets, README onboarding, a guard that refuses to deploy with development credentials | PR 1 |
| 2 | `test` task in `turbo.json`, `bun:test` available where tests live, `.github/workflows/ci.yml` running the PRD §37.4 gates on every pull request | PR 2 |
| 3 | Prototype tokens in `packages/ui/src/styles/globals.css`, self-hosted Outfit/Manrope, `Container`/`Header`/`Footer`/`LogoMark` in `apps/web/src/components/shell/`, the `_marketplace` layout route, `/404` and `/error` screens, the root document | PR 3 |

Also in scope, because they are platform wiring the later modules step on: `globalEnv` in `turbo.json`, the two broken root scripts (§4.2), and the `routes/` skeleton (§5).

### 2.2 Out of scope

- Any product screen's content: the home page (Task 14), For Masters (Task 15), the registry, profiles, classes, Pro Site, console screens.
- Auth screens and guards: the template's `/login` and the sign-up/sign-in forms stay as they are until Task 5 replaces them. The console shell is Task 5.
- Academy, event, Experience Card and pricing surfaces: not in the first release.
- Dark mode: the prototype is light only (`<meta name="color-scheme" content="light">`, no `prefers-color-scheme` block, no `.dark` block) — deviation D10.
- A mobile navigation drawer: the prototype has no hamburger at any width; the nav row scrolls horizontally instead.
- Per-PR preview environments and any UI regression suite — ADR-004.
- Media upload itself (Task 8). This module only creates the bucket and its credentials.

### 2.3 Boundaries

**Always**

- Versioned migrations only; `drizzle-kit generate` → review → `migrate` against the development branch. Never `push` against a shared branch.
- Development values never reach a production deploy; production values never appear in a repo file.
- Tokens come from the prototype. A value that is not in `:root` (162–182) or in the documented literal list (§6.5) is a design change: update the prototype first, then the app (ADR-003).
- Every PR passes `check-types`, `check`, `build`, `test` and the manual browser comparison for screens it touches.

**Ask first**

- Creating or deleting Neon projects/branches, Cloudflare resources, or the GitHub repository and its protection rules.
- Adding a dependency (including font packages).
- Changing the breakpoint set or the token names in §6.
- Touching `apps/native` — the Expo app is untouched in the first release (ADR-002).

**Never**

- Commit secrets, `.env` files or the Varlock-generated `src/env.ts`.
- Change a historical migration, or edit a documented deviation instead of the prototype.
- Copy prototype CSS wholesale: no `mc-*`/`pro-*` class names, no base64 font or image data, no `data-screen` runtime hooks, no prototype chrome (`mc-screen`, `mc-skip`, `mc-preview-toast`, `mc-noscript`, `mc-screens-*`) in the app bundle.
- Render a navigation or footer destination that does not exist (deviation D6).

## 3. Stack and what changes

The template is unchanged in shape (`AGENTS.md`, plan.md): Bun + Turborepo, Hono on Cloudflare Workers (`nodejs_compat`), TanStack Start/Router, tRPC, Better Auth, Drizzle on Neon HTTP, Alchemy for deployment. Additions: `neon.ts` at the repository root (data plane: the media bucket), `.github/workflows/ci.yml`, `bun:test`, `@fontsource-variable/outfit` and `@fontsource-variable/manrope`.

Pin nothing new beyond the catalog: the font packages are the only runtime additions, and they are web-only.

## 4. Commands

### 4.1 Existing (verified in the repo today)

```bash
bun install                                  # runs varlock codegen postinstall for web, server, native, db
bun run dev                                  # turbo: native#dev + infra#dev → API :3000, web :3001
bun run build                                # web (vite build) + server (tsdown)
bun run check-types                          # turbo run check-types
bun run check                                # ultracite check (Biome)
bun run fix                                  # ultracite fix
bun run db:generate                          # drizzle-kit generate
bun run db:migrate                           # drizzle-kit migrate
bun run deploy                               # alchemy deploy (packages/infra)
bun run destroy                              # alchemy destroy
cd apps/web && bunx vite dev                 # web only, port 3001
```

### 4.2 Commands this module adds or fixes

```bash
bun run test                                 # NEW (PR 2): turbo run test → bun test per package
bun run deploy:production                    # NEW: guard → alchemy deploy --stage production
neon link --project-name masterscorner --region-id aws-ap-southeast-1
neon checkout development --create            # pins the branch and pulls DATABASE_URL / AWS_* into .env
neon deploy                                   # provisions the declared media bucket on the linked branch
neon env pull                                 # refresh the branch's credentials locally
neon bucket object list media                 # verify an uploaded object on the pinned branch
```

Broken today (documented in `AGENTS.md`, verified): `bun run dev:web` fails because the `dev:bare` task is missing from `turbo.json`, and `bun run dev:server` filters `-F hono`, a package that does not exist. This module registers `dev:bare` in `turbo.json`, which fixes `dev:web`, and deletes `dev:server` — `bun run dev` already serves the API through Alchemy, so the script has no working meaning.

## 5. Where things land

```text
neon.ts                                   # NEW: data plane — buckets (media), branch policy
.github/workflows/ci.yml                  # NEW: PRD §37.4 gates on every pull request
turbo.json                                # + test, + dev:bare, + AWS_*/DATABASE_URL_UNPOOLED in globalEnv
apps/server/.env.schema                   # + DATABASE_URL_UNPOOLED, + AWS_* (Varlock contract)
packages/db/drizzle.config.ts             # migrations use the unpooled URL
`apps/web/src/index.css`                  # unchanged — it already imports `@my-better-t-app/ui/globals.css`
packages/ui/src/styles/globals.css        # prototype tokens, @font-face, fonts, container utility (2 `@source` globs, 1 `@theme` today)
packages/ui/package.json                  # + the two fontsource packages (web-only consumers)
apps/web/src/routes/__root.tsx            # html/head/devtools/Toaster only
apps/web/src/routes/_marketplace/route.tsx# pathless layout: skip link + Header + main + Footer
apps/web/src/routes/_marketplace/index.tsx# MOVED from routes/index.tsx (template demo home)
apps/web/src/routes/not-found.tsx         # /404 screen
apps/web/src/routes/error.tsx             # /error screen (route error boundary + a standalone route)
apps/web/src/components/shell/container.tsx
apps/web/src/components/shell/header.tsx
apps/web/src/components/shell/footer.tsx
apps/web/src/components/shell/logo-mark.tsx
apps/web/src/components/header.tsx        # DELETED (template demo header) with its user-menu usage
README.md                                 # environment onboarding, deploy guard, CI gates
```

`apps/web/src/routes/index.tsx` moves under `_marketplace/`. Task 14's file list in `tasks/todo.md` therefore refers to `_marketplace/index.tsx`; the route path stays `/`.

## 6. Design tokens (Task 3)

### 6.1 Prototype tokens → app tokens

All seventeen prototype properties are declared in one `:root` (162, close 182); nineteen literals sit elsewhere in the stylesheet. The app keeps the shadcn semantic names the existing primitives already use and adds the prototype's own names where a semantic collision would be worse than a literal one. Every line reference below is the prototype's own.

| Prototype declaration | Line | Value | App token | Notes |
| --- | --- | --- | --- | --- |
| `--mc-navy` | 163 | `#0b132b` | `--primary`, `--color-navy`, `--ring` | console/dashboard surface, primary CTA fill; also the prototype's focus colour via `--mc-focus` (177) |
| `--mc-navy-2` | 164 | `#111c39` | `--color-navy-deep` | nav/console panels |
| `--mc-paper` | 165 | `#f6f5f2` | `--background` | page surface |
| `--mc-ink` | 166 | `#172033` | `--foreground`, `--card-foreground`, `--popover-foreground` | body text |
| `--mc-muted` | 167 | `#5f6a82` | `--muted-foreground`, `--color-ink-muted` | secondary text on light |
| `--mc-muted-text` | 168 | `var(--mc-muted)` | `--color-muted-text` | role: muted text on the current surface |
| `--mc-muted-on-navy` | 169 | `var(--mc-steel)` | `--color-muted-on-navy` | role: muted text on navy |
| `--mc-steel` | 170 | `#9aa6bc` | `--color-steel` | muted text on navy |
| `--mc-accent` | 171 | `#d14b5a` | `--color-brand` | brand mark, large display text, non-text fills (the prototype's own comment at 172–173 states this rule) |
| `--mc-accent-strong` | 174 | `#b83a48` | `--color-brand-strong`, `--destructive` | AA-safe small text on light |
| `--mc-accent-on-navy` | 175 | `#e0747f` | `--color-brand-lifted` | AA-safe small text on navy |
| `--mc-accent-text` | 176 | `var(--mc-accent-strong)` | `--color-accent-text` | role: accent text on the current surface |
| `--mc-focus` | 177 | `var(--mc-navy)` | `--color-focus` | role: focus ring on the current surface |
| `--mc-line` | 178 | `#dfe3ea` | `--border`, `--input`, `--color-line` | hairlines |
| `--mc-white` | 179 | `#fff` | `--card`, `--popover`, `--primary-foreground` | raised surfaces |
| `--mc-shadow` | 180 | `0 20px 60px rgba(11,19,43,.12)` | `--shadow-mc` | the one shadow token |
| `--mc-radius` | 181 | `18px` | `--radius` | card/panel radius |
| `#eef0f4` | 439 | `#eef0f4` | `--secondary`, `--muted`, `--accent`, `--color-surface-alt` | literal: alternating section and hover surface — not a declared token |
| `#070d1e` | 746 | `#070d1e` | `--color-footer` | literal: footer background |
| `#f3efe8`, `#1f2521`, `#8d968d` | 2080–2082, 2311 | as written | Pro Site and console-specific | literal surfaces owned by those modules, not shell tokens |

The surface-aware roles are the prototype's own mechanism, not an app invention: lines 2314–2320 re-map `--mc-accent-text`, `--mc-muted-text` and `--mc-focus` for every dark surface (`--mc-accent-text: var(--mc-accent-on-navy)`, `--mc-muted-text: var(--mc-muted-on-navy)`, `--mc-focus: var(--mc-paper)`), and 2323–2326 re-map them back for the light cards that sit inside a dark surface (`.mc-search`, `.mc-console-preview`). The app expresses this as two classes — `.on-navy { --color-accent-text: var(--color-brand-lifted); --color-muted-text: var(--color-muted-on-navy); --color-focus: var(--color-paper); }` and `.on-light { --color-accent-text: var(--color-brand-strong); --color-muted-text: var(--color-ink-muted); --color-focus: var(--color-navy); }` — applied per surface, replacing the prototype's eleven-selector selector list. PR 3 ships both because the header CTA sits on the light surface while the footer does not; the hero's search card (`.on-light` inside `.on-navy`) arrives with the home page.

`--accent` deliberately stays a neutral hover surface, not the brand crimson: the existing primitives use `bg-accent`/`accent-foreground` for hover surfaces (verified today in `packages/ui/src/components/dropdown-menu.tsx`), so mapping brand colour onto it would silently repaint every hover state. Brand colour is reached through `--color-brand*`. The ring follows the prototype's focus colour (`--mc-focus` = navy, 177), not the crimson.

### 6.2 Typography

| Prototype | Value | App |
| --- | --- | --- |
| `body` rule (189–195) | background `var(--mc-paper)`, colour `var(--mc-ink)`, stack `Outfit,Manrope,"Helvetica Neue",Arial,sans-serif` (193) | `--font-sans` — Manrope is a fallback in the mock, not a second display face |
| `@font-face` (12–15) | Outfit `300 900`, Manrope `400 800`; latin + latin-ext subsets each; `font-display:swap` | `@fontsource-variable/outfit` and `@fontsource-variable/manrope`, latin + latin-ext entry points; verify the exact subset import paths against the package at implementation time |
| monospace runs (667, 693, 1029, 1235, 1354, 1601) | `ui-monospace,monospace` | `--font-mono`. The remaining occurrences (53, 2804) are the preflight default and prototype chrome |
| `.pro-site` (2079–2083) | background `#f3efe8`, colour `#1f2521`, `"Helvetica Neue",Arial,sans-serif` | Pro Site theme override (Task 16), not a shell token |

`@font-face` data must not be base64-inlined (deviation D8): real woff2 files, self-hosted, `preload` the latin subsets in the root document.

Heading and body scale, taken verbatim from the prototype:

| Role | Value | Prototype line |
| --- | --- | --- |
| h1 (page hero) | `clamp(42px, 5.7vw, 72px)` / `.98` / `-.055em` | 350–354 |
| h1 ≤520px | `44px` | 2512–2514 |
| h2 (section head) | `clamp(32px, 4vw, 48px)` / `1.05` / `-.045em` | 448–452 |
| lead paragraph | `19px` / `1.6` | 356–360, 2736–2737 (≤520 → `16px`) |
| body | `16px` (the browser default, never declared) / `1.5` | 22–26 |
| kicker/eyebrow | `12px` / `800` / `.16em` uppercase | 342–347 |
| nav link | `14px`, colour `#3f4b63` | 287–289 |
| logo | `20px` / `800` / `-.03em`; ≤520 → `17px` | 229–236, 2733–2735 |
| footer column heading / link / bottom bar | `12px` / `13px` / `11px` | 771–787 |

### 6.3 Breakpoints

The prototype is desktop-first with four max-width queries (980, 760, 640, 520) and four `prefers-reduced-motion` blocks. The app authors mobile-first, so the theme defines the complements of the three shell thresholds — and only those:

| App token | Value | Reproduces |
| --- | --- | --- |
| `--breakpoint-sm` | `521px` | mock `@media (max-width: 520px)` |
| `--breakpoint-md` | `761px` | mock `@media (max-width: 760px)` |
| `--breakpoint-lg` | `981px` | mock `@media (max-width: 980px)` |

The mock's `640px` query styles the preview-screens dialog, which is prototype chrome and is not ported. Tailwind's default `xl`/`2xl` are unused by the design and stay unset until the prototype gains a threshold.

### 6.4 Shell geometry

| Element | Desktop | ≤980 | ≤760 | ≤520 |
| --- | --- | --- | --- | --- |
| Container (210–213, 2482–2484) | `min(1180px, calc(100% - 40px))` centred | — | `min(100% - 28px, 1180px)` | — |
| Section padding (435–437, 2544–2546) | `92px 0` | `92px 0` | `68px 0` | `68px 0` |
| Card grid (467–471, 2422–2424, 2551–2553) | 3 columns, `20px` gap (470) | 2 columns | 1 column | 1 column |
| Footer top (751–753, 2425–2427, 2581–2582) | `1.2fr 1fr`, `80px` gap | 1 column | `40px` gap | — |
| Footer links (762–764, 2578–2580, 2756–2758) | 3 columns, `28px` gap | 3 columns | 2 columns | 1 column |
| Footer bottom (779–787, 2584–2587) | row, `space-between` | — | column, `8px` gap | — |

The container becomes exactly one utility so the gutter rule has a single home: `width: min(1180px, calc(100% - 40px))`, overridden at `md` to `min(100% - 28px, 1180px)`.

### 6.5 Allowed literal values

The prototype has no spacing or type tokens; it uses literals. These are the ones the shell needs, copied without rounding:

| Literal | Where | Line |
| --- | --- | --- |
| `height:74px`, `background:rgba(246,245,242,.94)`, `border-bottom:1px solid rgba(23,32,51,.08)`, `position:sticky`, `z-index:50`, `backdrop-filter:blur(18px)` | `.mc-header` | 214–222 |
| `gap:28px` | `.mc-nav` | 223–228 |
| `display:flex; gap:23px; margin-left:auto` | `.mc-navlinks` | 282–286 |
| `display:flex; align-items:center; gap:18px` | `.mc-nav-actions` | 294–298 |
| `background:var(--mc-navy)`, `padding:11px 17px`, `border-radius:10px`, `font-size:14px`, `font-weight:700` | `.mc-nav-cta` (the `For Masters` button — the class is `.mc-nav-cta`, not `.mc-cta`) | 299–306 |
| `border-radius:26px` / `22px` / `999px` | card panels, mid panels, pills | 635, 883, 1151, 527 |

Any value outside this list and §6.1–§6.4 is a design change (§2.3).

### 6.6 Header and footer structure

Header markup (2814, repeated verbatim in every shell screen at 2814–2838, and as standalone lines 2857, 2938, 3024) — `a.mc-skip` → `header.mc-header` → `div.mc-wrap.mc-nav` → `a.mc-logo` (`aria-label="MastersCorner home"`, `.mc-mark` drawn as three `<i>` bars) → `nav.mc-navlinks[aria-label="Primary"]` → `div.mc-nav-actions` with `a.mc-login-link` (`Sign in`) and `a.mc-nav-cta` (`For Masters`, → `/for-masters`). The skip link targets the main region (`#main-home` here), which carries `tabindex="-1"`; the app keeps that pattern with its own id (`<main id="main" tabindex={-1}>`), and the prototype's focus treatment (`.mc-skip:focus-visible`, 2359–2363: slides into view, `outline:2px solid` + offset) is kept.

Mobile: at `lg` (2371–2417) the nav row wraps, `.mc-nav-actions` takes `margin-left:auto` (2419–2421) and the link row becomes horizontally scrollable (`overflow-x:auto` 2376, hidden scrollbar 2379–2381, `min-height:44px` 2416, `white-space:nowrap` 2417); at `md` `Sign in` is hidden (`.mc-login-link{display:none}`, 2491–2493); at `sm` the CTA shrinks to `11px` (2730–2732) and the logo to `17px` (2733–2735). No hamburger at any width.

Footer markup (CSS 745–787; markup 2814 for `/`, 2920, 3006, 3041 for the SchoolConnect screens) — brand block (`MastersCorner` logo, `aria-label="MastersCorner home"`, plus the paragraph `One trusted place to discover martial arts, verify masters, book training and grow an academy.`), three link columns with `<strong>` headings (`.mc-footer-links strong` 771–774, 12px; `.mc-footer-links a` 775–778, 13px), bottom bar with two spans (`.mc-footer-bottom` 779–787: `MastersCorner preview` and `Martial arts network for India`).

**Destinations (deviation D6).** The prototype's nav lists `Masters`, `Academies`, `Classes`, `Events`, `Experience Card`; its footer splits into three columns — `Discover` (`Masters`, `Academies`, `Classes`, `Events`, `For schools`, `Request support`), `For masters` (`Platform`, `Pricing`, `Sign in`, `Dashboard`) and `Preview` (`Master Pro Site`, `Experience Card`, `Book a Trial`). The app renders only destinations that exist in the shipping release, and each module adds its own label as it lands. A column is rendered only when it has at least one live link, so the footer grows from brand block + bottom bar to the prototype's full three-column geometry across the first release:

| PR | Header shows | Footer shows |
| --- | --- | --- |
| 3 | logo, `Sign in`, `For Masters` | brand block + bottom bar only (no live link yet except the header's own `Sign in`) |
| 5 | + nothing (console is not a header destination) | `For masters`: `Sign in`, `Dashboard` |
| 11–13 | + `Masters`, `Classes` | + `Discover`: `Masters`, `Classes` |
| 15 | + nothing | + `For masters`: `Platform` |
| later phases | + `Academies`, `Events`, `Experience Card` | + `Discover`: `Academies`, `Events`, `For schools`, `Request support`; + `For masters`: `Pricing`; + `Preview`: `Master Pro Site`, `Experience Card`, `Book a Trial` |

`For schools` and `Request support` are Phase-2/3 modules (PRD §40), so they stay out of the first release. The prototype's footer bottom bar left span reads `MastersCorner preview`; the app writes the product line without `preview` (same correction as the 404 copy, deviation D13).

### 6.7 Not-found and error screens

| Screen | Prototype copy | App |
| --- | --- | --- |
| `/404` (screen 3057, copy 3058) | h1 `Page not found`; p `This MastersCorner preview page does not exist.`; link `Return home` → `/` | Router not-found boundary, inside the marketplace layout when the route is a marketplace route |
| `/error` (screen 2853, copy 2854) | h1 `This page did not load`; p `Please try again or return to the marketplace.`; button `Try again`; link `Return home` → `/` | Router error boundary; `Try again` resets the boundary and re-runs the route, `Return home` navigates to `/` |

Two prototype defects are corrected rather than ported, recorded in `docs/design-alignment.md` §8 as **D13**: the prototype never styles these screens (its own preflight makes the `h1` render at 16px/400), so the app applies the §6.2 heading scale; and the word "preview" is dropped from the 404 body copy and the footer bottom bar, because the prototype is a preview and the product is not. Both screens keep the prototype's full-height centred layout (`.mc-route-redirect`, 1610–1616: `min-height:100dvh`, `display:grid`, `place-content:center`, `text-align:center`, `gap:10px`), the skip link, and no header or footer.

### 6.8 Root document

Prototype head, for reference: `lang="en"` (2), `viewport` (5), `<meta name="color-scheme" content="light">` (6), `<meta name="theme-color" content="#0b132b">` (7), a preview-worded description (8), `<title>MastersCorner · Martial arts network</title>` (9), a base64 data-URI favicon (10) — no `prefers-color-scheme` block and no `.dark` selector anywhere in the file.

The app: `lang="en"`, no `dark` class, `color-scheme: light`, `theme-color` `#0b132b`, the title above, a product description written for the real product (the prototype's description says "single-file preview", PRD §27.1 territory), a real favicon file rather than a data URI (deviation D8), the latin font preloads, stylesheet link, `Toaster`. Per-route head comes with each screen. The template's development chrome (`TanStackRouterDevtools`, `ReactQueryDevtools`) renders only when `import.meta.env.DEV`.

## 7. Environments and secrets (Task 1)

- **Neon project** `masterscorner` in `aws-ap-southeast-1`, branches `development` (long-lived) and `production` (default). Region is fixed at creation and Object Storage exists only in four regions (ADR-004).
- **`neon.ts`** declares `buckets: { media: { access: "public_read" } }` and the branch policy; `neon deploy` provisions it **on the pinned branch**, so development and production each have their own bucket and their own branch-scoped credentials. The policy exempts only the default branch and the two long-lived names; every other branch is a throwaway with a 7-day TTL and the cheapest compute, **including branches that already exist** — otherwise one created before `neon deploy` would keep no expiry. `neon deploy` will not change an existing branch unless it is run with `--update-existing`, which is how a preview picks the policy up.
- **Two database URLs.** `DATABASE_URL` (pooled, `-pooler` host) serves application traffic; `DATABASE_URL_UNPOOLED` (direct) is used by `drizzle-kit migrate`, because migrations over a pooled connection can fail in ways that never mention pooling. `neon env pull` writes both.
- **Object-storage variables.** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`. Locally they come from the pinned development branch; for the deployed production Worker they are deploy-time secrets **bound to the server Worker in `packages/infra/alchemy.run.ts`** — Varlock only makes them available to the deploy process, and a Worker sees nothing that is not in its `env` binding. No module reads them until Task 8, so the binding is verified by deploying and confirming the names reach the Worker without their values appearing in logs.
- **Dev/prod separation is enforced, not assumed.** Development values live in gitignored local env files and are read by `bun run dev`. Production has its own entry point, `bun run deploy:production`, which runs `packages/infra/src/guard-production.ts` before `alchemy deploy --stage production`; plain `bun run deploy` keeps the personal `dev_<username>` stage and is untouched. The guard loads the deploy environment the way `alchemy.run.ts` does and refuses when `NODE_ENV` is not `production`; when `NEON_BRANCH` is missing or names a branch other than `production` (the marker `neon env pull` writes, which states the branch in plain text, is the only signal that proves where the values came from, so the guard fails closed without it; observed as `NEON_BRANCH=development` on 2026-10-20); when `DATABASE_URL` or `AWS_ENDPOINT_URL_S3` is unset; or when `DATABASE_URL` names the same host as the value recorded in `apps/server/.env` — the development database, which is also what catches a laptop's local Postgres. It refuses the same way when `BETTER_AUTH_SECRET` or `CORS_ORIGIN` is still the development value from that file: production signs its own sessions, and the API must trust the deployed web origin rather than `localhost:3001`. It compares hosts rather than full URLs, because credentials rotate per branch and a branch's endpoint id is opaque. `assertProductionTarget`, `isSameDatabase` and `readDotenvValue` are pure and unit-tested in PR 2; behaviour is verified today by running the entry point in each state.
- **Varlock** stays the env contract: `.env.schema` gains the new variables, generated `src/env.ts` files stay gitignored, and `turbo.json` `globalEnv` gains the same names so caches invalidate.
- **README** documents: creating the project and branches, `neon link`/`checkout`/`deploy`, which file holds which value, how to deploy, and how the guard fails.

## 8. Test and CI (Task 2)

- `turbo.json` gains `test` (cached, `dependsOn: ["^build"]` where a package needs built output) and `dev:bare` (persistent, uncached).
- `bun:test` is available where tests live: `packages/api`, `packages/db`, `apps/web`, `apps/server` get a `test` script and `@types/bun`; the shared tsconfig either includes `bun` in `types` or excludes `*.test.ts` — decide once, in this PR, and apply it everywhere.
- `.github/workflows/ci.yml` runs on pull requests to `development` and `master`, and on pushes to `development`: `bun install --frozen-lockfile` (a `bun.lock` exists, so the lockfile check is meaningful), `bun run check`, `bun run check-types`, `bun run build`, `bun run test`.
- Expected first failure, to solve in this PR: `bun install` triggers Varlock codegen, which may require `_VARLOCK_ENV_KEY` and values for required variables in CI. The fix (placeholder key, CI env file, or a codegen path that needs neither) is documented in the README, and no test may depend on a real secret.
- Branch protection (require the workflow on `development` and `master`) is a repository setting: owner action, requested at the end of PR 2. The repository has no remote today (`git remote -v` is empty, one commit on `master`), so CI cannot run until the owner adds one.
- **Known baseline, found on 2026-10-20:** `bun run check` reports **984 errors across 117 files** on the tree as PR 1 leaves it (measured; the 4 files PR 1 adds are clean). The installed Ultracite/Biome version disagrees with the template's committed style — trailing commas in JSON and TS, `lint/performance/noBarrelFile` in `packages/ui`, `assist/source/useSortedPackageJson` in every `package.json` including untouched ones. A gate that fails on every file cannot gate anything, so one formatting-only PR running `bun run fix` must land before the workflow can be required on `development`. That PR touches formatting only; no behaviour changes.

## 9. Testing strategy

| Level | Tool | What it covers here |
| --- | --- | --- |
| Unit | `bun:test`, colocated `*.test.ts` | The deploy guard from §7 (accepts production input, rejects development input and a non-production `NODE_ENV`); token/breakpoint helpers if any are added |
| Contract | `appRouter.createCaller({ session: null, db })` | Unchanged from the template: `healthCheck` public, `privateData` `UNAUTHORIZED` — the gate that proves the runner works |
| Runtime | `bun run dev` on the development branch | Sign-up, sign-in and one protected read still work after the environment rewiring |
| UI | Browser comparison at 1440, 980, 760 and 520 px | Header (all four widths, including the scrolling nav row), footer (3→2→1 columns), `/404`, `/error`, keyboard tab order and skip link |
| Repository | `bun run check`, `check-types`, `build`, `test` | Every PR, locally and in CI |
| Deploy | `bunx alchemy deploy` from `master` | The rehearsal in Checkpoint A: both Workers publish, the API reports the production branch |

No UI regression suite in the first release (ADR-004); the browser checklist is the gate.

## 10. Success criteria

1. `bun run dev` serves the API on 3000 and the web on 3001 against the `development` branch; sign-up, sign-in and a protected read succeed; no production credential is read by that process.
2. `neon bucket object list media` resolves on the development branch, and the development branch's credentials cannot read a production object.
3. `bun run db:generate` produces SQL and `bun run db:migrate` applies it cleanly to a fresh branch over the unpooled connection.
4. A pull request with a deliberately failing test fails CI; reverting it passes. `check`, `check-types`, `build` and `test` all run in the workflow.
5. The tokens in `packages/ui/src/styles/globals.css` are traceable line-by-line to the prototype `:root` (162–182); no `mc-`/`pro-` class, base64 font, or prototype chrome exists in the built CSS or JS.
6. Header and footer match the prototype at 1440, 980, 760 and 520 px, including the scrolling nav row and the footer's 3→2→1 column progression.
7. `/404` and `/error` render inside the app with the prototype's copy as amended by D13, `Try again` resets the error boundary, and `Return home` reaches `/`.
8. `bun run deploy:production` (guard → `alchemy deploy --stage production`) publishes both Workers; the deployed API uses the production branch; the guard refuses a deploy that carries development values, and `bun run deploy` still deploys the personal dev stage.
9. No navigation or footer link points at a route that does not exist (D6).
10. README explains environment onboarding, the deploy guard and the CI gates well enough for a new machine to be productive without asking.

## 11. Open questions

1. **Remote and branches.** The repo is local-only (`master`, one commit, no `origin`). Before PR 1 opens, the owner creates the remote and a `development` integration branch (same word as the Neon branch it points at); `development` collects the feature PRs and `master` stays the stable branch. PR 2's CI and branch protection are unverifiable until the remote exists. The 205 pending deletions under `.agents/skills/` (the skill move to `.omp/skills/`) are the owner's to commit; they are unrelated to this module.
2. GitHub owner and repository name, and whether the workflow file needs anything environment-specific beyond `bun install`.
2. Email provider (Resend, SES, MailChannels) — owned by Task 4, not this module.
3. Varlock's per-environment file convention for a production deploy: verify against Varlock's documentation in PR 1 and record the outcome here. Until then the requirement holds (production values only in the deploy environment).

---

## Verification of this spec

Before implementation starts, confirm: the six core areas are covered (§1 objective, §4 commands, §5 structure, §6 code style by token table, §9 testing, §2.3 boundaries); success criteria are specific and testable (§10); the module traces to the approved map (`platform`, PRD §39); the owner has approved it in a later turn.
