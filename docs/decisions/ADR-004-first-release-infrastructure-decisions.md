# ADR-004: First-release infrastructure decisions — media, Pro Site addressing, preview environments, UI regression tooling

## Status

Accepted — decided on 2026-10-20 under the owner's instruction to close the flagged open items rather than carry them into implementation.

Revised on 2026-10-20: decision 1 changed from Cloudflare R2 to Neon Object Storage at the owner's instruction. The owner's requirement ("images saved in Neon storage") is satisfied by Neon's S3-compatible object storage, not by storing image bytes in Postgres rows; the rejection of the latter is part of the decision below.

## Date

2026-10-20

## Context

Four items were carried as "spike or fallback" in `tasks/plan.md`, which is not a decision. Each of them changes the shape of a task, so each is settled here:

1. Where uploaded media (profile photo, Pro Site logo, later gallery) is stored.
2. What address a Pro Site is served from. The prototype shows `arun-vel.masterscorner.in`; a subdomain needs the `masterscorner.in` zone delegated to Cloudflare with a wildcard route and a certificate, which may not be ready when the module is built.
3. Whether per-pull-request preview environments ship in the first release (per ADR-001 they were optional).
4. Whether the first release carries a UI regression suite.

## Decision

### 1. Media is stored in Neon Object Storage

Uploaded files live in an S3-compatible bucket inside the same Neon project that holds the data. The bucket is declared in `neon.ts` (`buckets: { media: { access: "public_read" } }`) and provisioned with `neon deploy`; Neon injects AWS-standard credentials into the environment (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`). Postgres stores the object key on the media record, never the bytes.

- **One vendor for data and files.** The same Neon project, credential system and CLI back the database and the media, so there is no second provider, second billing relationship or second credential to rotate.
- **Environment isolation is structural.** Buckets branch copy-on-write with the database branch, and credentials are branch-scoped. The development branch's images are not production's, and the development and production Workers receive their own branch credentials. This is ADR-001's "environments never share credentials or data" enforced by the platform instead of by convention.
- **Upload path.** The Worker validates size and content-type, applies rate limiting, writes the object, and stores the key — one request, one choke point, one place to reject bad input. A browser-to-bucket presigned PUT is a later optimisation, not the first release.
- **Serving.** The bucket is `public_read`, so objects are served from `${AWS_ENDPOINT_URL_S3}/<bucket>/<key>` with no credential and no Worker in the path. Keys are versioned (`masters/<masterId>/<uuid>.<ext>`) and never overwritten, and `Cache-Control` is set on upload, so a CDN can be placed in front of the branch endpoint when image traffic justifies it.
- **Region is a precondition, and it is fixed.** Object Storage exists in `aws-us-east-1`, `aws-us-east-2`, `aws-eu-central-1` and `aws-ap-southeast-1` only, and a project's region cannot be changed after creation. The project is therefore created in `aws-ap-southeast-1` (Singapore) — the only supported region in Asia-Pacific and the closest to the product's market. Task 1 creates the project, so this is decided before any project exists.
- **Known limits, accepted.** 5 GB of object storage on the Free plan, 5 GiB maximum object, and request throttling that returns `503 SlowDown`. Photo-sized objects stay far below the object limit; the upload path retries on `503` with backoff, and the size limit on upload is the guard against the plan cap.

Alternatives:

- **Cloudflare R2** (the previous decision) — zero egress and already configured in the Alchemy stack, but a second provider, a second credential set and a manual development/production bucket split, when the project already has branch-scoped storage that isolates environments for free. Rejected. The accepted cost of this reversal is metered object egress, which is why media is served from the bucket endpoint directly and never proxied through the Worker.
- **`bytea` columns in Postgres** — every image read would ride the Neon HTTP driver, inflate branch storage and backup size, and have no cacheable URL. Rejected.

References: [Object Storage overview](https://neon.com/docs/storage/overview.md), [S3 compatibility](https://neon.com/docs/storage/s3-compatibility.md), [Regions and product availability](https://neon.com/docs/introduction/regions.md), [Plans and object-storage rates](https://neon.com/docs/introduction/plans.md).

### 2. Pro Site ships path-addressed, with the subdomain as the canonical target

The renderer is one component fed by one query. It is reachable at `/pro/{slug}` from the first PR, and the canonical address is `{slug}.masterscorner.in`, enabled by a wildcard route on the Cloudflare zone. Task 16 begins with a zone check (domain delegated, wildcard record, certificate); if the check fails, the path address ships and the console displays it, and switching to the subdomain later changes routing only — not the renderer, the data or the console screen.

Alternatives: subdomain-only (blocks the whole Pro Site module on a DNS prerequisite); path-only (loses the branded address the product is built around and contradicts the prototype and PRD §20.1).

### 3. Preview environments are deferred

The first release uses one shared development database branch, exercised from the developer's machine; production is the only deployment (ADR-001). Per-PR environments would add a second deployment path that nobody has proven on this stack, and there is nothing worth previewing before the modules exist. Residual risk — two changes in review sharing one database — is handled by additive-first migrations, a review gate before a migration touches development, and a throwaway Neon branch created on demand for a risky change. Revisit after launch.

### 4. No UI regression suite in the first release

`bun:test` covers pure logic and contract tests cover procedures; UI fidelity is verified by the browser comparison checklist in `tasks/plan.md` (four widths against the prototype plus the deviation register). Browser automation is revisited when UI churn makes a manual pass the bottleneck, not before.

## Consequences

- Two infrastructure planes, each with one owner: `neon.ts` declares data-plane services (the media bucket) and `packages/infra/alchemy.run.ts` declares Cloudflare compute (Worker, website). Neither file provisions the other's resources.
- Task 8 has a concrete storage target and a concrete SDK task: an S3 client that works inside a Cloudflare Worker with path-style addressing (`forcePathStyle: true`). The AWS SDK is heavy for a Worker bundle; `aws4fetch` or the bundled approach is chosen in that task's spec, verified against the provider's documentation.
- Development and production media are isolated by the platform, so a development upload can never appear on a production Pro Site.
- Task 1 must create the Neon project in `aws-ap-southeast-1` and declare the bucket on both branches; the region cannot be corrected later without recreating the project.
- The Free plan's 5 GB object-storage cap and metered egress are the accepted cost of dropping R2; both are monitored through the project's usage panel rather than through application code.
- The Pro Site module can be built and reviewed before DNS exists, and its public address is a configuration change rather than a rewrite.
- Development is the only pre-production environment, so a change that breaks it blocks other work; the mitigation above is a process control, not an environment.
- UI regressions in already-ported screens are caught by review, not by automation — an accepted cost at this size.

## Verification

- Media: upload, render and delete a file through the console against the development branch's bucket; oversized and wrong-type uploads are rejected; the stored object is readable without credentials while the key lives on the media record; a production-branch credential cannot read a development object.
- Addressing: the Pro Site renders with no session at its live address; the console shows the same address; enabling the subdomain does not change rendered content.
- Environments: `bun run dev` targets the development branch; production configuration is untouched by development runs.
