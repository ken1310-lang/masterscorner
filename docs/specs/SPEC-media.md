# SPEC-media: profile photo and Pro Site logo upload

## 1. Objective

A signed-in master can upload, replace and remove the image assets the first release promises (PRD §30.2): a profile photo now, and the same storage path for the Pro Site logo when Task 17 consumes it. Images live in the branch's Neon Object Storage bucket; Postgres stores only the object key and its metadata. The console renders the current image, and public screens can rely on the same payload.

Success: an uploaded JPEG, PNG or WebP is visible after a reload, an oversized or non-image upload is rejected with a specific message, replacing an image never overwrites the previous object key, removing the photo leaves the profile valid, and the object is served from the branch endpoint without credentials. Cross-branch isolation is endpoint-scoped: Neon storage credentials are project-wide (ADR-004 revision, 2026-10-23), so each Worker's `AWS_ENDPOINT_URL_S3` is the boundary.

## 2. Scope

### 2.1 In scope (one PR, Task 8)

- `media.upload` and `media.remove` tRPC procedures, owner-scoped through the session.
- Server-side validation: declared type allowlist, magic-byte check, byte cap, kind allowlist.
- Object storage adapter over `aws4fetch` (SigV4, path style) configured from `AWS_*`.
- Cloudflare Rate Limiting binding keyed by account id, plus provider `503 SlowDown` retry.
- Versioned keys, `Cache-Control: public, max-age=31536000, immutable`, best-effort object deletion.
- `MasterProfilePayload.media` with a public URL per current asset.
- Console photo field in `/dashboard/profile` with preview, upload, replace and remove.
- Tests: pure validation/URL/key helpers, router behavior against a fake store, live database round trip, live bucket round trip.

### 2.2 Out of scope

- Gallery uploads, video links, cropping, resizing, EXIF stripping and image transformation (Phase 3).
- Browser-to-bucket presigned PUT (ADR-004 defers it).
- Pro Site logo UI: the storage kind and procedure accept it; Task 17 adds the screen.
- Public profile and Pro Site rendering: Tasks 13 and 16 consume `media`; this task proves the console and the URL.
- Object lifecycle cleanup for orphaned keys. Failed best-effort deletes leave an unreachable object; it is not referenced by any row.

### 2.3 Boundaries

- Always: authenticate and derive the profile from `ctx.session.user.id`; validate bytes before writing; scope every row by the caller's profile; generate keys server-side; store the key, never bytes, in Postgres; test against the development branch.
- Ask first: changing the byte cap, allowed formats, bucket access level, rate-limit threshold, or key layout; adding another media kind.
- Never: trust `File.type` or the extension; write to a user-supplied key; make the bucket private without changing serving; proxy image reads through the Worker; log credentials or object bodies; commit `AWS_*` values.

## 3. Contract

`packages/api/src/media.ts` owns the shared contract:

```ts
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const uploadMediaInputSchema = z.object({
  kind: z.enum(MEDIA_KINDS),
  contentType: z.enum(MEDIA_IMAGE_TYPES),
  data: z.string().min(1).max(MAX_BASE64_LENGTH),
});

export interface MediaView {
  id: string;
  kind: MediaKind;
  url: string;
}
```

Procedures, both `protectedProcedure`:

| Procedure | Input | Output | Errors |
|---|---|---|---|
| `media.upload` | `{ kind, contentType, data }` where `data` is base64 without a data-URL prefix | `MasterProfilePayload` (same shape as `master.saveProfile`) | `UNAUTHORIZED`, `BAD_REQUEST` (malformed/oversized/mismatched bytes), `TOO_MANY_REQUESTS`, `PRECONDITION_FAILED` (no profile yet), `SERVICE_UNAVAILABLE` (storage refused) |
| `media.remove` | `{ kind }` | `MasterProfilePayload` | `UNAUTHORIZED`, `NOT_FOUND` (no current asset), `PRECONDITION_FAILED` |

`MasterProfilePayload` gains `media: MediaView[]`, ordered newest first. `getProfile` and `saveProfile` both return the current assets; a profile save cannot drop a just-uploaded photo from the client cache.

Bytes are decoded and sniffed server-side. JPEG (`FF D8 FF`), PNG (`89 50 4E 47 0D 0A 1A 0A`) and WebP (`RIFF` + `WEBP`) signatures must match the declared `contentType`; anything else is rejected before storage is touched.

## 4. Storage and configuration

- Bucket: `media`, declared `public_read` in `neon.ts`; name is a server constant, not an env var.
- Endpoint: `AWS_ENDPOINT_URL_S3`; public URL is `${endpoint}/${bucket}/${key}` with a single slash join. Region and credentials come from `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (already bound to the server Worker in `packages/infra/alchemy.run.ts`). Credentials are project-wide, so the endpoint bound to each Worker is the isolation boundary; a production credential can reach another branch's endpoint (ADR-004 revision, 2026-10-23).
- Client: `aws4fetch` with `service: "s3"`, path-style URL, `retries: 3`, `initRetryMs: 100`. It retries `429` and `5xx`, which covers Neon's `503 SlowDown`; the final non-2xx response becomes `SERVICE_UNAVAILABLE`.
- Key: `masters/<profileId>/<uuid>.<ext>`, where the extension is derived from the sniffed type. A replacement always creates a new key; the previous object is deleted after the database commits.
- Upload headers: exact `Content-Type`, `Cache-Control: public, max-age=31536000, immutable`. No user filename or metadata is stored.
- Rate limit: Cloudflare binding `MEDIA_UPLOAD_RATE_LIMIT`, namespace `1001`, `10` per `60` seconds, key `media-upload:<userId>` (per colo, approximate — the platform contract).

## 5. Data flow

1. The browser checks `file.size` and `file.type`, reads the file as a data URL, strips the prefix and calls `media.upload`.
2. The procedure checks the rate limiter, decodes base64, enforces the 5 MiB cap, sniffs the bytes and looks up the caller's profile.
3. It writes the new object, then in one Neon HTTP batch inserts the new row, deletes the previous row of that kind for the profile, and reads the profile/children/media snapshot back.
4. If the batch fails, the new object is deleted best-effort and the error surfaces. If it succeeds, the previous object is deleted best-effort.
5. `media.remove` deletes the row(s) of that kind for the caller's profile, reads the snapshot back, then deletes the objects best-effort.
6. Reads never touch storage; the URL is computed from the stored key.

The profile revision is deliberately untouched by media writes: the profile form stays saveable while a photo upload completes. The existing `touch_master_profile` trigger still bumps `updated_at`.

## 6. Console UI

`apps/web/src/components/profile/photo-field.tsx`, rendered as a "Profile photo" card inside the profile form:

- 96 px circular preview with the image or account initials, plus a visible `Choose photo` file input (`accept="image/jpeg,image/png,image/webp"`, keyboard reachable).
- Hint: formats and the 5 MiB cap. Server messages surface inline with `role="alert"`.
- States: idle, reading, uploading, error; `aria-busy` while uploading. `Save changes` and the photo controls are disabled together while the profile form submits.
- Without a profile row, controls are disabled and explain "Save your profile once to add a photo."
- Success replaces the cached `master.getProfile` payload, scoped through `sessionQueries.captureScope()` so a response from a superseded account cannot write cache. Same guard on remove.
- Remove is available only when a photo exists and returns to the initials preview.

## 7. Commands

```bash
bun run check
bun run check-types
bun run build
bun run test
cd packages/api && bun run test:db
cd apps/server && bun --env-file=.env test src/media-storage.integration.test.ts
```

## 8. Structure

| Path | Purpose |
|---|---|
| `docs/specs/SPEC-media.md` | This spec |
| `packages/api/src/media.ts` | Limits, schema, sniffing, key/URL helpers, storage and limiter interfaces |
| `packages/db/src/schema/media-kinds.ts` | Dependency-free kind list shared by the schema and the browser bundle |
| `packages/api/src/media.test.ts` | Pure tests |
| `packages/api/src/routers/media.ts` | Upload and remove procedures |
| `packages/api/src/routers/media.integration.test.ts` | Live database round trip with a fake store |
| `packages/api/src/master-profile.ts` | Payload gains `media` |
| `packages/api/src/routers/master.ts` | Snapshot includes current media |
| `packages/api/src/context.ts` | Context gains `mediaStorage` and `mediaRateLimit` |
| `apps/server/src/media-storage.ts` | `aws4fetch` adapter and integration test |
| `apps/server/src/services.ts` | Builds storage and exposes the rate-limit binding |
| `apps/server/src/context.ts` | Injects both |
| `packages/infra/alchemy.run.ts` | Declares the rate-limit binding |
| `apps/web/src/components/profile/photo-field.tsx` | Console component |
| `apps/web/src/components/profile/profile-form.tsx` | Mounts the field |
| `tasks/todo.md` | Task 8 status |

## 9. Testing strategy

| Level | Evidence |
|---|---|
| Unit | Signature sniffing for all three formats and mismatches, malformed base64, byte cap, key shape, URL join, newest-per-kind selection |
| Contract | Anonymous calls rejected before validation; invalid input rejected before the database; missing profile rejected before storage; rate-limit refusal; write calls in order (write → row → cleanup) through a fake store |
| Integration (database) | Real user/profile, fake storage: upload inserts and returns a URL; replacement changes key and deletes the old object; remove clears the row and leaves the profile readable; another account's profile is untouched |
| Integration (bucket) | Real PUT through `aws4fetch`, anonymous GET of the returned URL with matching bytes and content type, DELETE, then 404; skipped without `AWS_*` |
| UI | Browser: sign-up/sign-in, save profile, upload a PNG, reload, replace, remove, wrong-type and oversized errors, no layout overflow at 1440/760 |
| Repository | `bun run check`, `check-types`, `build`, `test` |

## 10. Success criteria

1. Uploading a valid image returns a `media` entry whose URL loads anonymously and matches the uploaded bytes.
2. A second upload of the same kind changes the object key; the old URL eventually 404s and the row count for that kind stays at one.
3. Removing the photo deletes the row, and `getProfile` still returns the profile, children and revision.
4. A text file renamed `.png`, a PNG declared as JPEG, a file over 5 MiB and malformed base64 are rejected with messages naming the problem; no object is written.
5. An anonymous caller gets `UNAUTHORIZED`; a caller without a profile gets `PRECONDITION_FAILED`; another master cannot see or remove the asset.
6. Eleven uploads in a minute return `TOO_MANY_REQUESTS` (platform accuracy permitted).
7. `bun run gates` is clean and the live bucket test passes on the development branch.

## 11. Open questions

None. The bucket, region, access level and endpoint are fixed by ADR-004; credentials are project-wide on this platform, so endpoint configuration is the isolation boundary. The byte cap and formats are specified here and deliberately generous enough for phone photos while protecting the Free-plan 5 GB cap.

## Verification of this spec

- Objective, commands, structure, style, testing and boundaries are covered; success criteria are observable.
- The spec traces to module `media` and Task 8 in `tasks/plan.md` and `tasks/todo.md`.
- The implementation follows only after the owner's instruction to proceed with the next task; assumptions are recorded in the task status if any change during implementation.
