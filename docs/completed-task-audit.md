# Completed-task audit remediation — 2026-10-23

## Scope

Tasks 1–3 and 5–8, the implemented portion of Task 4, and associated PRs #1–19. The audit reviewed current integrated behavior, Codegraph callers/contracts and recorded historical evidence. It cannot certify that every skill was invoked historically or retroactively establish pre-implementation approval. No production deployment or production database writes were performed during remediation.

## Findings addressed

| Finding | Remediation |
| --- | --- |
| FileReader crosses account boundaries | Recheck the captured generation after file reading and cancellation before sending bytes; stale read errors also have no effects. Covers A → B → A. |
| Profile/photo response ordering | Cancel exact profile queries before sending/applying mutations. Functional cache updates merge only owned fields: profile/children versus profile-photo entries. Missing cache is not resurrected. Media views carry an ISO `createdAt`, and the merged list is sorted newest-first, so a replacement photo cannot be appended behind an older logo. A differing other-kind row in the photo response is not merged beside the cached row, preserving one current row per kind. |
| Long-name console overflow | Shrink/truncate the accessible account trigger; zero-minimum grid tracks and wrap long overview/account text. |
| Dark-surface keyboard focus | Apply `on-navy` to dark containers and use the surface-aware `--focus` token in the global focus-visible outline. |
| Commented dotenv comparisons | Use explicit `dotenv.parse` without loading process values. Guard tests cover commented secret/origin values, quoted literal hashes, exports, BOM and last-wins duplicates. |
| Worker-name stage collision | Resolve the Effect `Stage` service. Only `production` receives stable names; `NODE_ENV` cannot override the actual stage. |

The earlier suspected DATABASE_URL bypass from trailing comments was disproved: URL hostname canonicalization still rejected the development host. Only the demonstrated secret/origin equality failure was fixed; no database-bypass claim is retained.

## Runtime and regression evidence

- The component regression suite exercises real React components, QueryClient and tRPC transport with held boundary responses: stale FileReader success/error, A → B → A, both profile/photo response orders, upload/remove, cache removal, background cancellation, revisions, drafts and failures. No module mocks or warning suppression.
- Browser: held A's FileReader, signed out, created/saved B, released A's read: **zero upload requests** and no photo on B.
- Browser: held the upload request, saved profile data and held its old response, released/uploaded the photo, then released the save response: the new photo remained visible.
- Browser: held a photo response, saved newer profile data, edited an unsaved city draft, then released the photo: the name and draft remained. The next save sent the city and persisted it on reload, proving the current revision stayed usable.
- Browser: 100-character unbroken account name; no profile document overflow at observed CSS widths 520, 760, 762 (the requested 761 rounded under device scaling), 980 and 1440. Overview at 520 also stayed within the viewport. The menu trigger retained the full accessible name while visually truncated.
- Keyboard: sidebar Profile link, footer home link and auth-brand home link had a light focus-visible outline on navy (`rgb(246,245,242)`); screenshots inspected.
- HTTP smoke after dependency changes: configured-origin preflight **204**, exact origin plus credentials allowed; anonymous protected read **401**; 9 MiB tRPC body **413**. Signup, signin/session and authenticated profile/media operations worked in the browser.
- Storage adapter tests: loopback refusal responses and exhausted retries, network rejection and DELETE-404 behavior. Live bucket roundtrip: **2 passed**.
- Infra parser/stage regressions: **21 passed**; the full infra suite passes **39**. Removing the `Output.fromEffect` wrapper (leaving the nested Effect opaque to Alchemy) caused **3 provider-input failures**, and inverting the production-stage condition also caused **3 failures**; both were restored. Disabling the captured upload session guard caused **4 held-read failures**, then was restored. These experiments establish regression sensitivity, not a project-wide mutation score.
- Compatible dependency resolutions and remaining exposure limits are in `dependency-security-triage.md`: post-change audit **3 advisories (2 high, 1 moderate)** versus the original 48.

## Fresh migration replay

Created `audit-migrations-20261023` (`br-wandering-cloud-az4m25fs`) explicitly from `development`, with a 0.25-CU compute and expiration. Created an empty `audit_empty` database on that branch rather than dropping inherited schemas. Validated the connection host and database before migration; no local Neon context or development env file was repinned or overwritten.

`bun run db:migrate` from `packages/db`, with both connection variables explicitly naming the isolated direct endpoint, exited 0. The ledger contained **7 migrations**. The resulting public schema contained account/session/user/verification plus master_profile/master_location/master_martial_art/media. The live profile/media suite, including real transaction-abort rollback and best-effort cleanup failures, passed **16 tests / 97 assertions** against that schema. Fixtures were cleaned by the suite; the entire rehearsal branch was then deleted.

## Specification and workflow corrections

- Added `SPEC-master-profile.md` as an explicitly retrospective contract, not fabricated historical approval.
- Corrected `SPEC-media.md`: media reloads occur after mutation/cleanup; only profile saves promise their own transactional response snapshot. Documented lock-before-read replacement and owned-slice cache updates.
- Synchronized the task-plan index with the authoritative tracker, preserving Task 4's email/reset deferral and the hosted-CI deferral. Endpoint-scoped storage isolation remains the accepted owner decision.
- Historical prototype-first compliance cannot be repaired after the fact. The new profile specification records the current composition/states and retains the requirement to specify future states before implementation; no historical approval or missing prototype screen is invented.

## External prerequisites still open

1. **GitHub Actions billing lock.** The latest inspected merge run `39906574719`, job `120259804722`, has no executed steps and the annotation: "The job was not started because your account is locked due to a billing issue." A repository-code change cannot clear account billing. Hosted deliberate red→green and branch protection stay deferred until a real run can execute; local gates are not relabeled as hosted CI.
2. **Unpublished dependency fixes / upstream migration.** `braces` and `node-forge` have no published fixed release; the remaining UUID fix crosses the installed consumer's major range. Exposure, restrictions and review dates are documented, not suppressed. Native signing/distribution is not certified by the web remediation.
3. **Owner decisions remain owner decisions.** Email provider/sender setup and reset/verification flows are outside the completed scope. This remediation does not silently implement or mark them complete.

Temporary browser accounts, uploaded objects and local image fixtures were removed, browser tabs closed, and the development smoke service stopped. Production secrets and the user's `AGENTS.md` edits were not changed.
