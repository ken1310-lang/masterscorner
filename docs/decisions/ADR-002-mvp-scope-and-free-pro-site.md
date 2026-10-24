# ADR-002: MVP is master accounts, master-owned classes and a free Pro Site

## Status

Accepted — owner decisions confirmed 2026-10-20. **Partially superseded on 2026-10-23:** the owner selected the Magic Patterns redesign and asked to include reviews, verification, booking/trial and pricing as modules. See `ADR-005-magic-patterns-redesign.md` and `docs/specs/SPEC-redesign.md`; the original MVP exclusions remain historical, and each new feature needs its own approved spec before implementation.

## Date

2026-10-20

## Context

- The owner defined the first build as: masters can sign up and own an account, masters can list classes, and the Pro Site is given to them free. Everything else in the PRD is later scope.
- The PRD v1.0 (as drafted) gated a much larger first phase: homepage, master and academy directories, verification workflow, enquiry and trial flow, dashboard, lead inbox and admin moderation.
- The design mock (`masterscorner.html`) covers 25 screens, including pricing plans, an Experience Card with three paid passes, SchoolConnect and a request network. Building all of them at once is the scope risk the PRD itself names (Risk 7).
- The mock's commercial surfaces (Pro ₹799/mo, Premium ₹1,999/mo, Experience Card passes) are not validated and contradict the owner's decision that the Pro Site is free at launch.
- Fidelity note: the mock is the visual reference for the screens in scope, but no screen may display a claim the backend cannot substantiate (verification, ratings, plan tier, fees).

## Decision

1. **MVP modules** (ids are stable and used by specs, plans and PRs): `platform`, `identity`, `master-profile` (including `media`), `classes`, `directory`, `pro-site`. Their dependency order, build order and PR boundaries are recorded in `product-vision.md` §39 (Capability map).
2. **The Pro Site is free at MVP.** No plans, no billing, no paywall, no upgrade prompts. Custom domains and paid tiers remain in the PRD as Phase 3/Phase 4 scope.
3. **No unsubstantiated trust signals at MVP.** Verification badges, ratings, review counts and review quotes are not rendered at all until the corresponding data exists in the database.
4. **No dead conversion CTAs at MVP.** Trial booking, enquiry submission, event registration, Experience Card selection and pricing CTAs are hidden while their modules are unbuilt.
5. **Explicitly out of MVP:** leads/enquiries and trial booking (Phase 2), verification workflow and admin workspace (Phase 2), insights (Phase 2), academy entity and academy pages (Phase 3), events (Phase 3), reviews (Phase 3), Experience Card (Phase 3), billing and plans (Phase 3), student accounts and saved items (Phase 3), notifications (Phase 3), student records, attendance, memberships and payments (Phase 4), custom domains and white-label (Phase 4), SchoolConnect and the request network (Phase 4 at the earliest, conditional on demand — PRD §40), the Expo native app (deferred until a native-specific need exists).
6. **Web-first.** `apps/native` is not extended during MVP; the design mock contains no native design.

## Owner decisions (2026-10-20)

| Question | Decision | Alternative declined |
| --- | --- | --- |
| Does a visitor get a contact path in the first release? | No. Trial, enquiry and booking calls to action are hidden; nothing implies a reachable master until Phase 2 | Direct contact from master data; and pulling the trial-enquiry module forward |
| Are academies modelled as entities? | No. Locations are rows on the master profile; the academy entity, directory and pages are Phase 3 | A minimal academy record per master; the full multi-instructor academy entity |
| What happens to the Expo app? | Nothing. Web only; `apps/native` is left untouched | Native sign-in only; native built in parallel |
| Do masters receive a verification badge? | No badge and no verification interface until the workflow exists in Phase 2 | Founder-manual verification with a badge; building the verification workflow now |

## Alternatives Considered

- **Build the whole PRD P0 phase (directory + profiles + enquiries + leads + verification + admin) as the first release.** Rejected: it front-loads moderation, trust policy and workflow decisions that have no validated demand, and it multiplies the surfaces that must be pixel-accurate before any master can publish anything.
- **MVP plus the trial-enquiry loop (public `/book` form + minimal lead list).** The mock designs both screens and the loop is what makes the product commercially useful, but it adds a second public-facing module (request handling, state, master-side SLA) to the first PR series. Offered to the owner and declined for the first release: it is delivered in full in Phase 2.
- **Publish the mock as a static marketing site and build the console first.** Rejected: the Pro Site is generated from master data, so there is nothing to publish until profiles and classes exist.
- **Keep the mock's pricing page and show Pro as included-free of charge.** Rejected: a pricing page with plans implies purchasing paths that do not exist; pricing returns when billing is built.

## Consequences

- A master can, from MVP alone: create an account, build a profile with locations, publish classes, and get a branded site — the owner-defined MVP is fully deliverable.
- Masters cannot receive or manage enquiries at MVP, so the "measurable enquiries" goal (PRD §2.1 Goal C) is not achieved until Phase 2. This is the main commercial gap and the first thing to schedule after MVP.
- Trust features (verification, reviews) stay absent, so public pages must not imply them anywhere in copy.
- Several mock surfaces are intentionally not built, which is recorded in `docs/design-alignment.md` §8 (deviation register) so the port is not judged against screens that are out of scope.
- Because there is no billing, pricing validation (PRD §35.3) must happen through interviews, not through a live paywall.

## Verification

- Every MVP module exists end-to-end: a master can sign up, sign in, edit their profile, add a class, and see both the public listing and their Pro Site render their real data.
- No MVP screen renders a verification badge, a rating, a review, a plan name or a fee that is not stored in the database.
- Navigating every shipped screen finds no link to an unbuilt destination.
