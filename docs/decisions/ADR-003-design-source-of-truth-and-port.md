# ADR-003: The HTML mock is the visual source of truth and is ported into the web app

## Status

Accepted in principle — pixel-perfect fidelity against the prototype is an owner requirement; the porting mechanism below (tokens, no mock CSS, real assets) is confirmed with the first UI PR. **Superseded for ported screens on 2026-10-23 by `ADR-005-magic-patterns-redesign.md`:** the Magic Patterns OS is now the visual source for the rebrand; this ADR remains the contract for unported screens.

## Date

2026-10-20

## Context

- `masterscorner.html` is a single 838 KB file: one inline `<style>`, base64-embedded Outfit/Manrope fonts, base64 images, 25 screens toggled by hash routing, and a small script that swaps `hidden` screens.
- The owner requires pixel-perfect fidelity for the screens that ship, and accepts that the mock is a prototype to iterate on later.
- The web app is TanStack Start + TanStack Router with Tailwind v4 configured CSS-first in `packages/ui/src/styles/globals.css`; `AGENTS.md` forbids `tailwind.config.*`, and shared primitives live in `packages/ui` (Base UI + `cva` + `cn`).
- The mock's own CSS is written in isolated `--mc-*` custom properties with `.mc-*` classes; it is not Tailwind and is not organised for reuse.
- The mock is light-only (`<meta name="color-scheme" content="light">`) while the template's `globals.css` also declares a dark variant.

## Decision

1. **`masterscorner.html` is the visual source of truth** for layout, spacing, type scale, colour and component structure of every screen listed as in-scope in `docs/design-alignment.md` §2.
2. **The mock's tokens become Tailwind v4 theme tokens.** The `--mc-*` palette, the Outfit/Manrope stack, the fluid `clamp()` type scale and the 980/760/520 px breakpoints are transcribed into `packages/ui/src/styles/globals.css`. Screens are then built with Tailwind utilities and, where a pattern repeats across screens, shared components in `packages/ui`.
3. **No mock CSS is shipped.** The inline `<style>` block, the `.mc-*` classes and the hash-screen switcher do not enter `apps/web`; screens become TanStack Router file routes mapped per `docs/design-alignment.md` §2.
4. **Assets become real assets.** Outfit and Manrope are self-hosted (package or Vite-managed font files) instead of base64 `@font-face`; images become normal files or uploaded media instead of base64 data URIs.
5. **Documented deviations are the only permitted differences.** The register in `docs/design-alignment.md` §8 lists each deviation (hidden trust signals, hidden CTAs, no plan surfaces, real data instead of sample rows, light theme only). A reviewer compares the ported screen against the mock plus that register — not against the mock alone.
6. **Screens the mock does not contain are designed in the same visual language before their PR** (`docs/design-alignment.md` §7): master signup, console classes CRUD, media upload, empty states, publish flow.
7. **Design iteration follows the mock's conventions.** When a screen must change (new states, new fields), extend the mock first (or add a screen to it) and port the change, so the mock stays the single reference.

## Alternatives Considered

- **Ship the mock's CSS file verbatim alongside Tailwind.** Rejected: two styling systems, no token reuse, `AGENTS.md` requires a CSS-first Tailwind v4 setup, and the file carries base64 assets that would bloat every build.
- **Rebuild the UI from the tokens without consulting screen markup.** Rejected: it cannot be verified as pixel-perfect and silently drifts on spacing and typography details.
- **Reuse the mock as an iframe or by rendering its HTML directly in the app.** Rejected: incompatible with routing, data binding, accessibility work and the component conventions in `packages/ui`; the prototype's screens are static and non-interactive.
- **Adopt a component library theme (shadcn defaults) and treat the mock as inspiration only.** Rejected: contradicts the pixel-perfect requirement and the owner's design work.
- **Keep the mock's dark-free palette but wire the template's dark variant anyway.** Rejected for MVP: the mock has no dark design, so shipping one would be invention. Revisit if a dark theme is designed.

## Consequences

- Every ported screen requires a fidelity pass (spacing, type scale, breakpoints, states) and is reviewed against the mock plus the deviation register.
- Design tokens live in one place, so palette or type changes propagate; screen-level styling stays in Tailwind classes.
- The mock remains a living artefact: new states and screens are added there first, which keeps iteration cheap but means the mock file grows.
- The prototype's sample data (ratings, fees, learner counts, reference numbers) must never be copied into components as literals — it is replaced by query data or removed.
- Fonts and images add real assets and cache rules to the web app, which is why they are part of the first UI PR rather than a later cleanup.

## Verification

- Side-by-side comparison of each ported screen against the mock at 1440 px, 980 px, 760 px and 520 px widths shows no unexplained difference beyond `docs/design-alignment.md` §8.
- `packages/ui/src/styles/globals.css` contains the mock's palette, font stack and type scale; no `tailwind.config.*` exists.
- The shipped bundle contains no base64 fonts, no base64 images and no `.mc-` class names.
- Keyboard navigation, focus visibility and mobile nav (horizontally scrollable link row, no hamburger) match the mock's behaviour.
