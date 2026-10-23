# ADR-005: The Magic Patterns redesign supersedes the HTML mock as the visual source

## Status

Accepted on 2026-10-23 after the owner approved Phase R1. The full program scope is recorded here and in `SPEC-redesign.md`; Phase R1 (tokens, shell and Home) is implemented on `task/14-home-redesign`.

## Date

2026-10-23

## Context

- The shipped web app follows `masterscorner.html` through ADR-003: a navy/paper low-contrast marketplace with photo-free registry cards and a prototype-derived console.
- The owner supplied a new Magic Patterns OS design: `https://www.magicpatterns.com/os/gywtehNats7LxFyJszknmE/pd9Jk5FBuQTvFHQE8qRjDm` ("MastersCorner redesign"). It contains 54 files and 24 routes.
- The redesign is not a repaint. It changes the shell, page hierarchy, spacing, radii, photography, filter placement, card anatomy, console layout and dark/earth Pro Site. It also shows routes and features the backend does not have.
- The owner's choices on 2026-10-23 were: full MVP rebrand; include the design's reviews, verification, booking and pricing features; use the Magic Patterns images as temporary assets.
- Those feature choices reverse parts of ADR-002 (which excluded reviews, verification, trial booking and plans). They require new schema, API, authorization and workflow decisions; they cannot be delivered as static UI.
- The redesign includes out-of-scope product modules: academies, events, Experience Card, SchoolConnect and the request network. They are not part of this decision.

## Decision

1. **The Magic Patterns OS is the visual source of truth for screens as they are ported.** The old `masterscorner.html` remains the contract only for screens not yet ported. Once a screen is ported, its OS implementation plus the deviations in `docs/specs/SPEC-redesign.md` is authoritative.
2. **The visual language is transcribed, not copied as a second styling system.** Tailwind v4 tokens and utilities remain in `packages/ui/src/styles/globals.css`; no Magic Patterns CSS file, React runtime or OS hash router enters the app. Existing design tokens stay until every consumer is ported, so the redesign adds new semantic tokens rather than silently changing old screens.
3. **The program covers the shipped MVP surface**: marketplace shell, Home, Masters, master profile, Classes, For Masters, login/sign-up, console shell, profile, classes and Pro Site settings. It excludes academies, events, Experience Card, SchoolConnect, the request network and the OS screens built only for those modules.
4. **Reviews, verification, booking/trial and pricing are included as product modules, not as mock content.** Each requires its own specification before implementation, covering ownership, moderation, state transitions, privacy, notifications and failure behavior. No badge, rating, review, trial price or plan is rendered until backed by stored, authorized data.
5. **Real data remains mandatory.** The OS's sample masters, ratings, review quotes, learner counts, completeness scores, plan prices and profile IDs are design fixtures and must not ship as literals. Empty states replace absent data.
6. **Magic Patterns images are temporary marketing assets only.** They may be copied into the web app for the hero and other decorative marketing surfaces. They must not be used as the portrait of a real master; master cards use stored profile photos and an intentional no-photo treatment. Licensing/provenance is recorded before launch.
7. **The port is incremental and route-scoped.** Each phase leaves the app building and working. The old design is not mixed arbitrarily inside a single screen; a screen is either fully ported or still on the old contract.

## Consequences

- The old deviation register in `docs/design-alignment.md` stops applying to ported screens; `SPEC-redesign.md` records the new visual contract and deviations.
- The first phase adds a second set of semantic tokens and a new shell. Until the remaining screens are ported, the app intentionally shows the new shell around some old content; the rollout should not be deployed as a finished redesign until the in-scope routes are complete.
- Reviews, verification, booking and pricing are now committed scope. They add schema migrations, API procedures, moderation/authorization decisions, tests and likely an admin path. They are sequenced after the visual foundation, one module spec at a time.
- The external Magic Patterns images must be reviewed for acceptable use and either retained with a recorded source or replaced before production. Hotlinking the CDN is not a production strategy.
- The old mock remains in the repository as history and as a reference for unported screens; it is no longer extended for new work.

## Alternatives considered

- **Treat the OS as inspiration only and keep the old visual system.** Rejected by the owner's explicit design choice.
- **Copy the OS code and styling wholesale.** Rejected: it is a standalone hash-routed prototype with sample data, a second styling system and unsupported routes; it would bypass the app's routing, authorization and data contracts.
- **Port every OS screen, including academies/events/experience/requests.** Rejected: those modules still have no backend or accepted product scope; the owner selected the MVP rebrand, not a literal full-OS port.
- **Add ratings, reviews, verification and booking as static visuals first.** Rejected: it would fabricate trust signals and conversion paths, violating the project's data-integrity rule.
- **Replace the old tokens globally in one commit.** Rejected: it would break unported screens and make regressions hard to isolate. New tokens plus route-by-route migration is safer.

## Verification

- The spec maps every OS route to port, replace, omit or defer.
- No ported screen displays a value not returned by the database or a dead destination.
- `bun run gates` passes for every phase; each ported screen is browser-checked at the design breakpoints.
- Feature modules meet their own specs before their UI is enabled.
