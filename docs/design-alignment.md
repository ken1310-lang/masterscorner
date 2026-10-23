# MastersCorner — Design ↔ PRD Alignment

**Status:** Ready for review
**Date:** 2026-10-20
**Sources**

| Source | Role | Notes |
| --- | --- | --- |
| `masterscorner.html` | UI design reference (source of truth for visuals) | Single-file prototype, 838 KB, 25 screens, hash-routed, no backend |
| `product-vision.md` | Product scope (PRD v2.0) | Updated in this change |
| `AGENTS.md` | Stack and tooling constraints | Bun + Turborepo, TanStack Start, Hono/Workers, Drizzle + Neon HTTP |
| `docs/decisions/ADR-001..003` | Decisions behind this alignment | Environments, MVP scope, design port |

Scope rule applied: **features that exist in the PRD but not in the mock stay in the PRD** (built in a later phase). Only **contradictory or infeasible** items were changed or dropped. Mock-only features were kept in the PRD as future scope, never as MVP scope.

---

## 1. Design tokens extracted from the mock

| Token | Value | Use in mock |
| --- | --- | --- |
| `--mc-navy` | `#0b132b` | Primary dark surface (header, hero overlay, dashboard rail, pro-site) |
| `--mc-navy-2` | `#111c39` | Secondary dark surface |
| `--mc-accent` | `#d14b5a` | Primary accent (CTAs, marks) |
| `--mc-accent-strong` | `#b83a48` | Accent hover/emphasis |
| `--mc-accent-on-navy` | `#e0747f` | Accent text on dark |
| `--mc-paper` | `#f6f5f2` | Page background |
| `--mc-white` | `#fff` | Card surface |
| `--mc-ink` | `#172033` | Body text |
| `--mc-muted` | `#5f6a82` | Secondary text |
| `--mc-line` | `#dfe3ea` | Borders/rules |
| `--mc-steel` | `#9aa6bc` | Meta text on dark |

- Type: **Outfit** (primary) with **Manrope** fallback; both embedded base64 in the mock.
- Fluid display type via `clamp()`: hero `clamp(42px,5.7vw,72px)`, section head `clamp(32px,4vw,48px)`, pro-site hero `clamp(50px,7vw,88px)`; negative letter-spacing (-0.045em to -0.06em).
- Breakpoints: `980px`, `760px`, `520px`, plus `prefers-reduced-motion` handling.
- Mobile navigation = horizontally scrollable nav link row riding inside the wrapped header (`@media max-width:980px`); **there is no hamburger menu**. `Sign in` is hidden below 760px; the `For Masters` CTA remains.
- Layout container: `.mc-wrap` = `min(100% - 28px, 1180px)`.

These map onto Tailwind v4 theme tokens in `packages/ui/src/styles/globals.css`; no `tailwind.config.*` is introduced (`AGENTS.md`).

## 2. Screen inventory and disposition

"Phase" = the release phase in `product-vision.md` §29. `MVP` = first build.

| Mock screen (hash) | App route | Phase | Notes / data needed |
| --- | --- | --- | --- |
| `/` | `/` | MVP | Trimmed to sections with real destinations; academy / events / experience sections hidden until their phase |
| `/masters` | `/masters` | MVP | Registry; filters: martial art, location, training audience; sort recommended/experience/rating(deferred)/nearest(deferred) |
| `/masters/arun-vel` | `/masters/$slug` | MVP | Profile; ratings, reviews, Book Trial hidden until Phase 2 |
| `/academies` | `/academies` | Phase 3 | Requires academy entity |
| `/academies/veeram-silambam` | `/academies/$slug` | Phase 3 | Timetable, fees, trial availability |
| `/classes` | `/classes` | MVP | Class finder reading master-owned classes |
| `/events` | `/events` | Phase 3 | Event directory |
| `/events/grand-open-silambam` | `/events/$slug` | Phase 3 | Event detail; "Register interest" needs registration capture |
| `/experience` | `/experience` | Phase 3 | Experience Card passes and pricing are unresolved commercially |
| `/pricing` | `/pricing` | Phase 3 | Only meaningful once billing exists; plans are deferred |
| `/for-masters` | `/for-masters` | MVP | Static acquisition page; console stat panel shows real or omitted numbers |
| `/book` | `/book` | Phase 2 | Trial request form (name, age, mobile, location, slot, goal) |
| `/booking-success` | `/booking-success` | Phase 2 | Acknowledgement + reference |
| `/pro/arun-vel` | `/pro/$slug` at launch; `{slug}.masterscorner.in` once the zone check passes (ADR-004) | MVP | Free Pro Site generated from profile + classes |
| `/login` | `/login` | MVP | Email + password (mock's "Email or mobile" is not implementable — no SMS provider) |
| — (absent) | `/signup` | MVP | Master account creation; **mock has no signup screen** |
| `/dashboard` | `/_auth/dashboard` | MVP | Overview; lead/analytics tiles hidden until Phase 2 |
| `/dashboard/profile` | `/_auth/dashboard/profile` | MVP | Identity, locations, media; verification rows hidden |
| `/dashboard/leads` | `/_auth/dashboard/leads` | Phase 2 | Lead inbox |
| — (absent) | `/_auth/dashboard/classes` | MVP | Class CRUD; **mock has no classes management screen** (console nav has 4 items only) |
| `/dashboard/site` | `/_auth/dashboard/site` | MVP | Pro Site settings, free tier, no plan/custom-domain claims |
| `/schools` | `/schools` | Phase 4 at the earliest, conditional (§40) | SchoolConnect; not in PRD v1 — now recorded as future scope |
| `/requests` | `/requests` | Phase 4 at the earliest, conditional (§40) | Request network (officials, coaches, crews); not in PRD v1 — now recorded |
| `/request-success` | `/request-success` | Phase 4 at the earliest, conditional (§40) | Acknowledgement for the above |
| `/404` | catch-all | MVP | Screen exists in mock |
| `/error` | error boundary | MVP | Screen exists in mock |
| `/app` | — | Dropped | Prototype-only workspace redirect |

## 3. Contradictions and how they were resolved

| # | Mock says | PRD (v1.0) says | Resolution |
| --- | --- | --- | --- |
| C1 | `/pricing`: Listing free, Pro ₹799/mo, Premium ₹1,999/mo; console badge "Pro plan · Verified"; site page "Included with the Pro plan", "Custom domain PREMIUM" | §21 Pro ₹499–₹999/mo, Premium ₹1,499–₹2,999/mo, paid plans at launch | **Pro Site is free at MVP** (owner decision). Billing, plans and custom domains move to Phase 3/Phase 4. The console must not display a plan badge or paid claims at MVP. PRD §21 rewritten as deferred. |
| C2 | Cards show "Verified" badges; profile shows "MastersCorner Verified"; console profile lists Identity/Primary academy/Credential verification rows | §16 verification with evidence, badges only after checks exist | MVP ships **no verification badge** and no verification UI. Badges appear only for records whose verification was actually completed. Verification workflow → Phase 2. |
| C3 | Ratings such as `4.9 (62)`, a review quote, "62 reviews" | §14.3: ratings must come from real submitted reviews | Ratings/reviews hidden at MVP; reviews module → Phase 3. Mock values are prototype data. |
| C4 | Repeated list rows (same 3 masters/academies twice per page) | §7.5: no fabricated results | Prototype artefact. Real pages render one row per record and need designed empty states. |
| C5 | Fees presented as facts (`From ₹1,500/mo`, `₹500` trial, `₹1,200–₹2,400/mo`) | §31.3: no invented prices | Fees render only when master-entered; otherwise omitted. |
| C6 | `/login` field label "Email or mobile" | Email/password auth in `packages/auth` | Label becomes "Email"; phone login needs an SMS provider — out of scope. |
| C7 | Hash routes + `hidden` screens + `data-skip`/`data-scroll` JS | TanStack Router file routes | Route mapping is in §2. Screens are ported as route components, not as a single-file switcher. |
| C8 | Console nav = Overview, Profile, Leads, Pro Site; PRD §5.2 lists Academies, Classes, Bookings, Students, Events, Reviews, Insights, Plan & billing, Settings | §5.2 is aspirational | Console nav is phase-gated: MVP shows Overview, Profile, Classes, Pro Site; Leads → Phase 2; the rest as their modules land. |
| C9 | Fonts and all images inlined as base64 (838 KB page) | — | Self-host Outfit/Manrope as packages; real image assets, no base64 in shipped bundles. |
| C10 | Mock shows learner counts ("86 learners"), "Profile completeness 92%", "Site setup 86%", "Profile views 284", "61% from enquiries" | §24.2: no estimated metrics presented as precise outcomes | MVP omits or computes these from real rows; insight tiles → Phase 2 (basic), Phase 4 (advanced). |
| C11 | Dark theme absent (`color-scheme: light`) while the template supports a dark variant | §26.1 dark navy identity | MVP ships the mock's light theme only; dark mode is a later decision, flagged in ADR-003. |
| C12 | Nav/footer link to Schools, Requests, Pricing, Experience Card, Dashboard | — | Links to unbuilt screens must not ship in MVP; footer/nav render only available destinations. |

## 4. In the PRD but not in the mock (kept, phase-gated)

| PRD item | Mock status | Handling |
| --- | --- | --- |
| Browse by location / city pages (§6.2, §27.2) | Only a location `<select>` | Kept; city landing pages added in Phase 3 |
| Master verification workflow + admin review (§16, §25) | No submission UI, no admin screens | Kept; Phase 2 (workflow) and Phase 2 (admin), manual process before that |
| Reviews: write, report, moderate, master reply (§14) | Display only | Kept; Phase 3 |
| Enquiry form `Ask a question` (§13.5) | Absent | Kept; Phase 2 |
| Booking states and lifecycle (§13.3) | Success screen only | Kept; Phase 2 |
| Student accounts, saved masters, booking history (§22) | Absent | Kept; Phase 3 |
| Notifications (§23) | Absent | Kept; Phase 3 |
| Pro Site sections: Gallery, Reviews, Achievements/Lineage, Custom domain, white-label (§20.4, §20.10) | Pro site shows About, Programs, Schedule, Events, Contact | Kept; sections in Phase 3, custom domain and white-label in Phase 4 |
| Multi-branch academy management (§9.4, §19) | Location rows only | Kept; Phase 3 |
| Event organiser tooling and paid registration (§11.4) | "Register interest" only | Kept; Phase 3 |
| Admin/moderation workspace and reporting (§25) | Absent | Kept, reduced: manual admin before Phase 2; workspace Phase 2 |
| Insights & recommended actions (§24) | Static tiles | Kept; Phase 2 (basic insights), Phase 4 (advanced tooling) |
| Accessibility specifics (§26.5) | Partially present (skip links, `aria-live`, focus styles) | Kept as a requirement on every ported screen |

## 5. In the mock but not in the PRD (now recorded)

| Mock item | Assessment | Disposition |
| --- | --- | --- |
| `/schools` — SchoolConnect: structured school programs, instructor matching, replacement instructors | Operational service business, not marketplace software. Large supply/coordination burden | Recorded as future scope (Phase 4 at the earliest, conditional on demand — PRD §40). Not built; links removed until it exists |
| `/requests` + `/request-success` — request network for referees, instructors, volunteers, demo teams, tournament ops | Same: an ops/brokerage workflow with matching and staffing | Recorded as future scope (Phase 4 at the earliest, conditional on demand — PRD §40) |
| Experience Card pass tiers with prices (₹500/₹999/₹1,499) | Commercial terms unresolved (PRD §35.1) | Recorded as PRD Phase 3 with prices as illustrative only |
| Distance filter (5/10/20 km) | Needs geocoded locations | Phase 3; MVP filters by location name |
| "Women instructors" filter | Needs instructor attributes | Phase 2; MVP keeps audience filter |
| Profile completeness score | Useful onboarding affordance | Phase 2, computed from real fields only |
| Pro Site "Data sync" panel (Bio/Locations/Schedule/Events synced) | Valuable trust signal; cheap once Pro Site is generated from profile | MVP: show sync status for the fields that exist (bio, locations, classes) |
| Console "Preview public site" action, Pro Site style/brand controls | Needed for Pro Site module | MVP keeps `Change site name` and `Edit site style` |
| System screens `/404`, `/error` | Standard | MVP |

## 6. Prototype artefacts to remove during the port

1. Fabricated ratings, review counts and review quotes (C3).
2. Duplicated list rows standing in for pagination (C4).
3. Hardcoded fees and learner counts (C5, C10).
4. "MastersCorner Verified" and "Verified academy" claims (C2).
5. Plan/billing claims: "Pro plan", "Included with the Pro plan", "PREMIUM", `/pricing` tiers (C1).
6. Base64 fonts and images (C9).
7. Mock sample dates ("Tuesday · 16 September", "10-11 OCT", reference numbers `MC-TR-10821`, `MC-M-10821`) — replaced by real data or omitted.
8. Dead navigation to unbuilt destinations (C12).

## 7. Screens the mock does not contain (design before their PR)

| Needed screen | Why the mock is insufficient | Nearest mock pattern to follow |
| --- | --- | --- |
| Master signup / account creation | Only `/login` exists | `/login` two-column brand + card |
| Console → Classes (list, create, edit schedule/fees/audience, status) | Console nav has no classes entry | `/dashboard/profile` form sections + `/classes` table styling |
| Media upload (profile photo, logo, gallery) | Images are hardcoded | `/dashboard/profile` + `/dashboard/site` panels |
| Empty / zero-result states for registry, classes, leads | Mock only shows populated states | Registry hero + card grid, muted copy |
| Pro Site publish/unpublish flow | Only a live site + settings panel | `/dashboard/site` |
| Public enquiry/trial capture (Phase 2) | Form exists, but lead-side contract is not designed end-to-end | `/book` + `/dashboard/leads` |
| Class listing filter bar (first release, Task 11) | The mock's `/classes` is a bare table with no controls | `/masters` control bar, adapted to class filters |
| For Masters composition (first release, Task 15) | The mock's page exists but leans on plan-adjacent claims the first release cannot make | `/for-masters` plus the console panels |
| Live Pro Site address in the console (first release, Task 17) | The mock always shows a subdomain as live | `/dashboard/site` live-address panel |
| Lead detail (Phase 2) | The mock lists leads and has no detail view | `/dashboard/leads`, using registry field styles |
| Report and moderation affordances (Phase 2) | No report control exists anywhere in the mock | Master profile and review rows |
| Event registration form (Phase 3) | Only "Register interest", which routes to the trial booking form | `/events/$slug` |
| Gallery on the profile and Pro Site (Phase 3) | Images are hardcoded; no gallery surface | `/dashboard/profile` and pro-site sections |
| Notification centre (Phase 3) | Absent | Console shell |
| Student account area (Phase 3) | Absent | `/masters/$slug` and the booking screens |
| Admin screens (Phase 2) | Absent | Console patterns |

The console classes screen was designed and implemented in Task 10; `docs/specs/SPEC-classes.md` §5 records its layout, states, responsive rules and confirmation flow.

## 8. Deviation register ("pixel-perfect" exceptions)

Pixel fidelity applies to layout, spacing, type scale, colour tokens and component structure. The following deviations are required for correctness and are the only allowed differences at MVP. Every deviation below was confirmed by the owner on 2026-10-20 as part of the strict first-release scope:

| Id | Deviation | Reason |
| --- | --- | --- |
| D1 | Ratings/reviews omitted | No genuine reviews exist yet (PRD §14.3) |
| D2 | Verification badges omitted | No verification has been performed (PRD §16.2) |
| D3 | Trial/Booking CTAs omitted on profile, pro site, class rows | Booking is Phase 2; shipping dead CTAs misleads users |
| D4 | Plan/billing surfaces omitted (`Pro plan` badge, `/pricing`, custom-domain card) | No billing at MVP (C1) |
| D5 | Fees/learner counts hidden when not supplied | PRD §31.3 |
| D6 | Nav/footer show only implemented destinations | No dead links |
| D7 | "Email or mobile" → "Email" | Auth method |
| D8 | Fonts/images served as real assets | Bundle size, caching |
| D9 | Console nav phase-gated | C8 |
| D10 | Light theme only (mock is light; template also has a dark variant) | Match mock; dark mode undecided |
| D11 | `<select>`/filter values come from the database, not the mock's fixed lists | Data-driven pages |
| D12 | Empty states added where the mock is always populated | Real data can be empty |
| D13 | `/404` and `/error` headings styled with the app heading scale, and the word "preview" dropped from product copy (the 404 body, the footer bottom bar) | The prototype never styles these screens (its `h1` inherits 16px/400) and its copy describes the preview, not the product |

Every deviation above is recorded so reviewers do not read it as a regression against the mock.

---

## 9. Two-way coverage verification

Method: every capability section of the PRD (§6-§27) was matched against the mock's markup for an equivalent screen or section, and every mock screen was matched back through §2, §3 and §5. The evidence is the mock's 25 screens with their headings, kickers, form labels and calls to action.

### 9.1 PRD to design

| PRD section | Mock evidence | Verdict |
| --- | --- | --- |
| §6 Homepage | hero, search (art, location, training for), "Masters worth discovering", "Academies near you", Experience Card block, "Train beyond the weekly class", "Need more than a class?", masters panel, "Verified registry" kicker | Partial — no search by master or academy name, no browse-by-art grid, no browse-by-location, the trust explainer is a single line |
| §7 Master directory | `/masters`: control bar, filter pills (Verified, Kids, Competition, Women), distance select, sort row (Recommended, Rating, Experience, Nearest), result cards, "18 masters in Chennai" | Partial — no empty state, no price filter, no day or time filter, no online or in-person filter, no labelled paid placement, no bio on cards |
| §8 Master profile | `/masters/arun-vel`: badge, 18 years, 4.9 (62), 3 locations, about, training paths, locations and schedule, one review, profile-ID note, Book Trial, Visit Pro Site | Partial — no gallery or media section, no lineage and qualifications block, no achievements, no associated events, no review policy text |
| §9 Academy directory and profiles | `/academies`, `/academies/veeram-silambam`: programs, weekly timetable, monthly fee, trial availability | Partial — no map or directions, no instructor list, no gallery, no reviews, no parent and branch structure |
| §10 Class finder | `/classes` table: class, academy, location, next session, fee, Book | Partial — no filter bar, no duration, no master column, no audience or level column, no trial flag, no description, no empty state |
| §11 Events | `/events`, `/events/grand-open-silambam`: dates, type, venue, days, "Registration: Via MastersCorner", "Register interest" | Partial — no banner, organiser, agenda, eligibility, categories, fees, deadline, contact, refund terms or results; the call to action routes to the trial booking form (prototype shortcut) |
| §12 Experience Card | `/experience`: how it works in four steps, three passes with prices | Partial — no student card area, no master-side view, no validity, refund or redemption terms |
| §13 Trial booking and enquiry | `/book` (student name, age, mobile, location, slot, goal), `/booking-success`, request states in the console | Partial — three of the seven statuses in §18.3, no enquiry-without-booking form, no notifications |
| §14 Reviews | rating and count on cards, one quote on the profile | Partial — no write, report, reply or moderation, no verified-student label |
| §15 Onboarding | none for sign-up; console profile form; "Profile score 92%", "Add one credential" | No design — sign-up and progress guidance must be designed (§7) |
| §16 Verification | badges on cards, profile and academy; console rows (Identity, Primary academy, Credential document) | Partial — no submission, evidence, status or review flow |
| §17 Master dashboard | `/dashboard`: greeting, three tiles, recent enquiries, Pro Site card, "Review new leads" | Partial — no quick actions (add class, add location, publish event), no Classes destination in the console navigation |
| §18 Leads | `/dashboard/leads`: reference, student, age, location, slot, status; tabs All, New, Follow up, Booked | Partial — no contact method, message, source column, notes or next action |
| §19 Students, classes and academy operations | no class, student, attendance or membership screen in the console | No design |
| §20 Pro Site | `/pro/arun-vel` plus console `/dashboard/site`: live address, site name, style, custom domain, data sync | Partial — no setup wizard or theme choice, no publish or unpublish control, no section toggles, no gallery |
| §21 Subscriptions | `/pricing`: Listing free, Pro at 799 per month, Premium at 1,999 per month | Partial — no lifecycle, billing history or cancellation; Phase 3 |
| §22 Student accounts and saved items | none | No design |
| §23 Notifications | none | No design |
| §24 Pro Site insights | dashboard tiles, "Pro Site setup 86%", "Add one credential" | Covered for the basic set — no metric definitions, no per-plan scope |
| §25 Administration and moderation | none; no report affordance anywhere in the mock | No design |
| §26 Visual identity | the mock is the identity (§1) | Covered |
| §27 Search visibility | one file-level title and meta description; no city or discipline landing pages | Partial |

Totals: 2 covered, 15 partial, 5 with no design.

### 9.2 Design to PRD

Every mock screen maps to a PRD section in §2. Mock elements with no PRD counterpart are in §5, and the claims the PRD forbids are in §3. Two additions from this pass:

| Mock element | PRD position | Action |
| --- | --- | --- |
| Event "Register interest" routes to `/book`, the trial booking form | §11.4 requires an event registration path of its own | Do not port the shortcut; event registration is designed with §11 in Phase 3 |
| Home "Verified registry" kicker and the profile's "reviewed by MastersCorner" line | §16.2 and §31.9 forbid implying verification before it is performed | Copy is dropped or replaced with the unverified reality until Phase 2 (deviation D2) |

### 9.3 Conclusion

The mock is a complete visual system (§26), covers the basic insight tiles (§24) and covers every discovery surface the first release needs at least in part. It has no design for five PRD areas: sign-up (§15), academy operations (§19), student accounts (§22), notifications (§23) and administration (§25) — the first of those blocks the first release and is listed in §7; the other four belong to later phases. The PRD has no counterpart for two mock flows (SchoolConnect and the request network, recorded in §5 and PRD §40) and for the prototype's `/app` redirect, which is dropped (§2).

