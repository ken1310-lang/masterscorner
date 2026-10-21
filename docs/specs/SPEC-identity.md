# SPEC-identity: master accounts, sessions and the console entry

**Module:** `identity` (PRD §39) — **Tasks 4–5, PRs 4–5**
**Status:** **Draft v1 for owner approval, 2026-10-21.** The owner decided on 2026-10-21 to **defer email verification and password reset** to a follow-up PR for Task 4; Tasks 4–5 ship the account type, sign-up/sign-in, the session boundary, the auth screens and the console guard. Task 4's "password reset works end to end" acceptance row moves with that decision.
**Sources:** `product-vision.md` v2.0 (§15.1–15.3, §30.2–30.4, §39), `docs/design-alignment.md` (§2, §3, §6–§8), `docs/decisions/ADR-001…004`, `tasks/plan.md`, `tasks/todo.md`, `AGENTS.md`, `docs/specs/SPEC-platform.md`.
**Prototype evidence:** `/login` screen div 2841 and markup 2842; auth layout CSS 1406–1475; auth mobile rules 2626–2636. Console screens `/dashboard` 2843/2844, `/dashboard/profile` 2845/2846, `/dashboard/leads` 2847/2848, `/dashboard/site` 2849/2850; console CSS 1621–1757. The mock has no sign-up screen and no password-reset screen (`docs/design-alignment.md` §2, §7). D7 records the Email label; D9 records the phase-gated console nav.

---

## 1. Objective

Give every account in the first release a master identity, and give that master a way in.

- **User:** a martial arts master who has no account yet, and the same master returning to the console.
- **Success:** sign-up creates a `user` row whose account type is `master`, server-owned and not client-selectable; the session survives a reload and carries the account type; anonymous tRPC callers are refused; a master signs up, signs in and reaches an empty console from the UI; a protected console route returns the master to the route they asked for after sign-in.
- **Why first:** every later module owns its data through this account. The profile belongs to the master, classes belong to the master, the console reads the session, and the Pro Site publishes the master. A weak identity boundary would be copied by all of them.

## 2. Scope

### 2.1 In scope (one PR per task)

| Task | Deliverable | PR |
| --- | --- | --- |
| 4 | `account_type` on `user` (not null, default `master`, typed as `AccountType`), declared as a Better Auth additional field with `input: false`; the generated migration; sign-up/sign-in kept on Better Auth; the protected-procedure contract test; runtime verification on the development branch | PR 4 |
| 5 | `/login` and `/signup` ported from the mock's auth layout; `?form=signin\|signup` kept as the one screen state; the `_auth` guard with a validated return path; the console shell and its four empty states (Overview, Profile, Classes, Pro Site); sign-out | PR 5 |

Also in scope: this spec, the Task 4/5 status rows in `tasks/todo.md`, and the README sentence that states the account type is server-owned.

### 2.2 Out of scope

- **Email verification and password reset** — owner decision 2026-10-21, deferred to a follow-up PR for Task 4. The follow-up owns the provider, `sendVerificationEmail`, `sendResetPassword`, `requireEmailVerification` and the reset screen. No stub, console-only link or fake sender ships in Tasks 4–5.
- Social, phone, passkey, 2FA and magic-link sign-in; admin roles; account deletion; email change.
- The console screens' content: the profile editor (Task 7), classes CRUD (Task 10), Pro Site settings (Task 17). Task 5 ships the shell and a truthful empty state for each destination, not the editors.
- The native Expo app (ADR-002: web only in the first release).
- Verification badges, plan badges, billing and custom domains (D2, D4): the console never renders "Pro plan", "Verified", or a fabricated metric.

### 2.3 Boundaries

**Always**

- Migrations are generated, reviewed and applied to the development branch before the PR merges; a committed migration is never edited.
- The account type is server-owned: `input: false` in Better Auth, a database default, and no write path from a client payload.
- Protected routes and procedures fail closed; a missing session is a redirect (web) or `UNAUTHORIZED` (tRPC), never an empty user.
- Auth screens follow the mock's auth layout and copy except D7 ("Email") and the removal of preview-only sentences.
- Every PR passes `bun run check`, `check-types`, `build`, `test` and the runtime checks in §8.

**Ask first**

- A second account type, a Postgres enum for the column, or any role/permission model.
- A new Better Auth plugin, a cookie/trusted-origin change, or an email provider.
- Touching `apps/native` or the Expo plugin.

**Never**

- Accept `accountType` (or any role) from sign-up, update or a tRPC input; a forged value must be ignored.
- Display a plan, verification or metric claim the database cannot support (D2, D4, C10).
- Enable email flows without a provider; log a reset token; ship a "check your email" state that sends nothing.
- Edit a historical migration, commit secrets, or remove the `UNAUTHORIZED` branch.

## 3. Stack and what changes

Better Auth **1.7.7**, Drizzle ORM/Kit **1.0.0-rc.4** on Neon HTTP, tRPC 11, TanStack Start/Router, TanStack Form with Zod, Better Auth's React client on the web. No new dependency.

| File | Change |
| --- | --- |
| `packages/db/src/schema/auth.ts` | `ACCOUNT_TYPES = ["master"] as const`, `AccountType`, `DEFAULT_ACCOUNT_TYPE = "master"`, and `accountType: text("account_type").$type<AccountType>().default(DEFAULT_ACCOUNT_TYPE).notNull()` on `user` |
| `packages/db/src/migrations/*` | One generated migration: add the column with its default and `NOT NULL` |
| `packages/auth/src/index.ts` | `user.additionalFields.accountType = { type: [...ACCOUNT_TYPES], required: true, defaultValue: DEFAULT_ACCOUNT_TYPE, input: false }`; no email config |
| `packages/api/src/routers/index.test.ts` | Session fixture gains `accountType: "master"`; the assertion names the literal, and a compile-time check pins the session type to `AccountType` |
| `apps/web/src/routes/login.tsx` | Port the mock's auth layout; sign-in card; the sign-up toggle updates the URL |
| `apps/web/src/routes/signup.tsx` | Canonical `/signup`, rendering the same layout and the sign-up card (the mock has no sign-up screen; layout is §7 of the alignment doc) |
| `apps/web/src/routes/_auth/route.tsx` | Guard with `redirect` search parameter and same-origin validation; session cache identity boundary kept |
| `apps/web/src/routes/_auth/dashboard/*` | Console shell plus `index`, `profile`, `classes`, `site` empty states; nav exactly Overview, Profile, Classes, Pro Site |
| `apps/web/src/components/auth/*` | Shared auth layout, fields and submit state extracted from the current forms |
| `README.md` | One paragraph: account type is server-owned; email flows deferred |
| `tasks/todo.md` | Task 4 and Task 5 status rows, with the deferral recorded |

What does not change: the Hono entry, `createContext`, the Drizzle/Neon factories, cookie attributes, the Expo plugin, the native client, the marketplace shell.

## 4. Commands

```bash
# Schema
cd packages/db && bun run db:generate --name identity_account_type
bun run db:migrate                          # development branch, unpooled connection
cd packages/db && bun run db:generate       # must report no changes

# Tests and gates
bun run test                                # turbo run test
bun run gates                               # check && check-types && build && test

# Runtime, against the development branch
bun run dev                                 # API :3000, web :3001
curl -i -X POST http://localhost:3000/api/auth/sign-up/email \
  -H 'content-type: application/json' \
  --data '{"name":"Probe Master","email":"probe@example.com","password":"correct-horse-battery"}'
curl -i -X POST http://localhost:3000/api/auth/sign-in/email \
  -H 'content-type: application/json' \
  --data '{"email":"probe@example.com","password":"correct-horse-battery"}'
```

The probe account is temporary and is removed after verification; no test depends on it. `bun run dev` reads the gitignored `apps/server/.env`, never a production value.

## 5. Design

### 5.1 Account type

- **Column.** `user.account_type` is `text NOT NULL DEFAULT 'master'`. A text column with a TypeScript union is deliberate for the first release: there is one value, and a Postgres enum would add an `ALTER TYPE` migration for every future account type. The union is `AccountType = "master"`, and `DEFAULT_ACCOUNT_TYPE` names the value once so the column default and Better Auth's `defaultValue` cannot drift.
- **Server-owned.** Better Auth's `additionalFields` entry sets `input: false`, so a sign-up or update payload containing `accountType` cannot write it. `defaultValue: DEFAULT_ACCOUNT_TYPE` applies at the auth layer; the column default covers direct inserts and the existing rows (the Task 3 probe user) when the migration runs.
- **Readable.** `returned` stays at its default (`true`), so `GET /api/auth/get-session`, `ctx.session.user` and `$Infer` carry `accountType`. Task 5 and the console need it to label the account truthfully.
- **One account type.** No authorization branch exists yet: every authenticated user is a master. Later modules check `accountType` when a second type exists; until then the field is recorded and displayed, not branched on.

### 5.2 Sign-up and sign-in

- Sign-up stays `authClient.signUp.email({ name, email, password })`; the server assigns the type.
- Sign-in stays `authClient.signIn.email({ email, password })`; `emailVerified` remains `false` by default and does **not** block sign-in, because no verification provider is configured. The follow-up flips `requireEmailVerification` only after a provider exists and existing accounts can verify.
- A forged `accountType: "admin"` in the sign-up body is ignored; the runtime check in §8 proves it and the account still reads `master`.
- Sessions keep the template's 7-day cookie (`SameSite=None; Secure; HttpOnly`), the Drizzle session table and the per-request `getSession` in `createContext`. No secondary storage is introduced.

### 5.3 Auth screens (Task 5)

- **Layout.** Two columns `1.05fr .95fr` (1408–1410): navy brand panel with the inverse logo, kicker `Master Portal`, h1 `Manage your presence from one place.`, paragraph; white card `min(440px, 100% - 40px)`, padding 38px, radius 20px, the one shadow (1437–1445). At `md` and below the layout is one column, the brand panel is at least 300px with 30px padding, its h1 is 40px, and the card is `30px auto` (2626–2637). The screen is full height, has the skip link, and no marketplace header or footer. The panel paragraph is `Your profile, classes and Pro Site in one console`; the mock's preview sentence is removed.
- **Sign-in card.** h2 `Sign in`; labels `Email`, `Password` (D7 replaces the mock's `Email or mobile`); submit `Sign in`; a link to `/signup`; the mock's `← Back to marketplace` link. The mock's preview sentences ("This preview login opens the sample master dashboard.", "Preview account. No real credentials required.") are prototype chrome and are removed; the button is not "Open Dashboard".
- **Sign-up card (no mock screen; design from §7 of the alignment doc).** h2 `Create account`; `Name`, `Email`, `Password`; submit `Create account`; a link back to `/login`. Validation mirrors the current forms: name ≥ 2, valid email, password ≥ 8. Server errors render as `error.error.message`.
- **One screen state.** `/login` keeps `validateSearch` for `form`, and `/signup` is the canonical sign-up address. The toggle navigates (`/login?form=signup`, `/signup?`), so reload and Back preserve the form; `_auth` and `UserMenu` callers keep `form=signin`.
- **After auth.** Success clears or establishes the query-cache identity through `sessionQueries.setIdentity` (PR 8's barrier), then navigates to the validated `redirect` or `/dashboard`.
- **Client typing.** The web auth client declares `accountType` to `inferAdditionalFields` with `input: false`, so `useSession()` and `getSession()` type it as a string; the runtime payload already carries it. The declaration is client-side only; the server remains the authority.

### 5.4 Console shell and guard (Task 5)

- **Guard.** `_auth` stays `ssr: false`. Its `beforeLoad` reads `authClient.getSession()`, applies the identity boundary, and on no session throws `redirect({ to: "/login", search: { form: "signin", redirect: <current path+search> } })`. The login screen accepts `redirect` only as an absolute path on this origin (a single leading `/`, no `//` or `\`, including paths that normalize to `//` through dot segments); anything else falls back to `/dashboard`. The router retains an unknown search key even when `validateSearch` drops it, so the screen re-sanitizes the value before rendering links and before navigating. After sign-in/sign-up, the form navigates to that path. The protected outlet stays keyed by user id (PR 8).
- **Shell.** Sidebar with the inverse logo, the signed-in master's name and initials, and the real account type (`Master account`); the mock's "Pro plan · Verified" block is removed under D2/D4. Nav links, `← Marketplace`, and a top bar naming the console and the current screen. Main region has the skip-link target and `tabindex={-1}`.
- **Nav.** Exactly `Overview` (`/dashboard`), `Profile` (`/dashboard/profile`), `Classes` (`/dashboard/classes`), `Pro Site` (`/dashboard/site`) — D9/C8. The mock's `Leads` is Phase 2 and is not rendered. Every destination exists in Task 5 as a real screen with a truthful empty state; no link points at an unbuilt route and no "coming soon" card substitutes for a screen.
- **Empty states.** Overview greets the master by name and shows what the account actually supports (account type, email, a pointer to the profile); no profile views, trial enquiries, booked trials, profile score or "Pro plan". Profile/Classes/Pro Site state that nothing has been created yet and what the next task will add, without controls that do nothing. No fabricated dates, metrics or addresses (C10, §6 of the alignment doc).
- **Sign-out.** `UserMenu` remains the only sign-out control; it calls `authClient.signOut`, then `sessionQueries.setIdentity(null)`, then navigates to `/` (or `/login`). The Task 3 behaviour is unchanged.

## 6. Where things land

```text
packages/db/src/schema/auth.ts            # ACCOUNT_TYPES, AccountType, DEFAULT_ACCOUNT_TYPE, accountType column
packages/db/src/migrations/<ts>_identity_account_type/
                                          # generated migration + snapshot
packages/auth/src/index.ts                # user.additionalFields.accountType
packages/api/src/routers/index.test.ts    # literal assertion + compile-time session check
apps/web/src/routes/login.tsx             # /login?form=signin|signup (sign-in card)
apps/web/src/routes/signup.tsx            # /signup (sign-up card; same layout)
apps/web/src/routes/_auth/route.tsx       # guard + redirect contract
apps/web/src/routes/_auth/dashboard/route.tsx
                                          # console shell for /dashboard/*
apps/web/src/routes/_auth/dashboard/index.tsx
apps/web/src/routes/_auth/dashboard/profile.tsx
apps/web/src/routes/_auth/dashboard/classes.tsx
apps/web/src/routes/_auth/dashboard/site.tsx
apps/web/src/components/auth/*            # shared layout, field, submit state
apps/web/src/components/console/*         # shell, page header, empty state
README.md                                 # server-owned account type; email deferred
tasks/todo.md                             # Task 4/5 status and deferral
```

Task 5 replaces the leaf `_auth/dashboard.tsx` with `_auth/dashboard/route.tsx` (the console shell) and moves the overview to `_auth/dashboard/index.tsx`; profile, classes and site are siblings. The route tree is regenerated by `vite build` / `vite dev`; `routeTree.gen.ts` stays gitignored.

## 7. Testing strategy

| Level | Tool | What it covers |
| --- | --- | --- |
| Contract | `appRouter.createCaller({ session, db })` | `privateData` still refuses `session: null` with `UNAUTHORIZED`; a signed-in caller's record includes `accountType: "master"`, and a compile-time check pins `Session["user"]["accountType"]` to `AccountType` |
| Schema | `bun run db:generate` + `bun run db:migrate` | One migration adds `account_type` with `DEFAULT 'master' NOT NULL`; a second generate reports no changes; migrate is clean on development |
| Runtime | `bun run dev` on the development branch | Sign-up returns a user with `accountType: "master"`; a forged `accountType` is ignored; `get-session` after reload keeps it; tRPC `privateData` with the session cookie returns it; without a cookie it refuses |
| UI (Task 5) | Browser at 1440, 980, 760, 520 px | Auth layout against 2842/1406–1475/2626–2636; D7 label; no preview copy; keyboard order and skip link; sign-up and sign-in; `/dashboard/profile` → `/login?form=signin&redirect=%2Fdashboard%2Fprofile` → sign-in returns to the profile; console nav is exactly four labels; every destination renders its empty state; sign-out returns to the public site |
| Web logic (Task 5) | `bun test` (`apps/web`) | `safeRedirectPath` accepts same-origin absolute paths and drops external, protocol-relative and backslash targets; login search defaults to sign-in and preserves a valid redirect; signup search drops invalid ones |
| Repository | `bun run gates` | `check` passes, `check-types` 8/8, `build` 2/2, `test` 5/5 (60 tests: API 4, db 16, infra 25, web 15) |

There is no database in the test seam: the API tests use `createCaller` with a stub DB, and the web tests use real `QueryClient`s without a server. Sign-up is Better Auth's integration behaviour, so it is proven at runtime on the development branch, not with a mock adapter. The permanent suite pins the field's presence and type; it does not re-test Better Auth's `input: false` parser. No permanent test depends on a real secret or the network.

## 8. Verification

### Task 4 (PR 9)

1. Generate and review the migration; apply it to the development branch; re-run generate and confirm "No schema changes".
2. Sign up a fresh account on the running development stack. The response and `GET /api/auth/get-session` both return `accountType: "master"`; the row's `account_type` is `master` (checked through the session, and through a one-off query if a direct read is available).
3. Repeat sign-up with `"accountType": "admin"` in the body. The account is still `master`; the forged value is absent from the response.
4. Sign out and sign in again; the session survives and still carries `master`.
5. Call `privateData` with the session cookie → the record with `accountType`; without the cookie → `UNAUTHORIZED`.
6. Run `bun run gates`; remove the probe account; confirm the diff contains only §3's files and no secret.

### Task 5 (PR 10)

1. On the development stack, `/login` and `/signup` render at 1440/980/760/520 with the `Email` label (D7), no preview copy, and no marketplace header or footer; Tab starts at the skip link, then the logo, fields, submit and switch/back links, and Enter on the skip link focuses `#main`.
2. Signed out, `/dashboard` lands on `/login?form=signin&redirect=%2Fdashboard`; creating an account from that screen returns to `/dashboard`.
3. An external or backslash `redirect` is dropped from the signup link and from post-auth navigation, including dot-segment inputs that normalize to `//`; a valid `/dashboard/profile` survives the signup/sign-in toggle.
4. Sign-in works; a duplicate email renders `User already exists. Use another email.`; sign-out returns to `/`, clears the session cookie, and `/dashboard` redirects again.
5. The console nav has exactly four labels with the active item and matching top-bar title; each destination renders its empty state; no horizontal overflow at 520; no dead links.
6. Run `bun run gates`; delete the probe account.

## 9. Success criteria

1. **Task 4.** A new sign-up row has `account_type = 'master'`, and a client-supplied `accountType` cannot change it.
2. **Task 4.** `GET /api/auth/get-session` after a reload returns the master account type; `ctx.session.user.accountType` is typed and present.
3. **Task 4.** `privateData` returns `UNAUTHORIZED` with no session and the caller's own record, including `accountType`, with one.
4. **Task 4.** `db:generate` produces exactly one reviewable migration, `db:migrate` applies it cleanly to development, and a second generate reports no changes.
5. **Task 4.** `bun run gates` passes; no email provider, verification, reset or email env var is added; the deferral is recorded in `tasks/todo.md`.
6. **Task 5.** `/login` and `/signup` match the mock's auth layout at 1440/980/760/520 with D7 applied and no preview copy.
7. **Task 5.** An unauthenticated `/dashboard/profile` visit lands on `/login?form=signin&redirect=%2Fdashboard%2Fprofile`, and a successful sign-in returns to `/dashboard/profile`; an external, backslash or normalized protocol-relative `redirect` is dropped from links and navigation.
8. **Task 5.** The console nav is exactly Overview, Profile, Classes and Pro Site; each destination renders a truthful empty state; no plan, verification, fabricated metric or dead link appears.
9. **Task 5.** Sign-out ends the session, clears the account's cached data and returns to the public site.

## 10. Open questions

1. **Email provider** (follow-up PR for Task 4): Resend, Cloudflare Email Service or SES. It needs a verified sender domain; the account currently has no Cloudflare zone, so `masterscorner.in` must be added before any provider can send to arbitrary addresses. The owner selected **defer** on 2026-10-21.
2. **Verification policy** (same follow-up): whether `requireEmailVerification` becomes true once a provider exists. Default: no until every existing account can verify, because enabling it would lock out the accounts created by Tasks 4–5.
3. **`/signup` and `/login?form=signup`**: Task 5 makes `/signup` canonical and keeps `?form=signup` working for existing callers. If the owner prefers a single URL, `/signup` can redirect to `/login?form=signup` instead of rendering the card; the screen, copy and layout are identical either way.
4. **Second account type**: none in the first release (ADR-002). When one arrives, promote the text union to whatever the authorization model needs — including a database `CHECK` or domain, which the first release omits because one value and no authorization branch make it redundant; the column name does not change.

---

## Verification of this spec

Before implementation starts, confirm: the six core areas are covered (§1 objective, §4 commands, §6 structure, §5 design and code shape, §7 testing, §2.3 boundaries); success criteria are specific and testable (§9); the module traces to the approved map (`identity`, PRD §39); the owner has approved it in a later turn.
