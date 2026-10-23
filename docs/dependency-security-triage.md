# Dependency security triage

Reviewed 2026-10-23 against the root Bun workspace (`bun@1.4.2`, `bun.lock`). Next review: **2026-11-06**, or immediately when an upstream fix is published or the affected tooling is exposed to untrusted input.

The initial audit reported 48 advisories (6 high, 39 moderate, 3 low). A machine-readable pre-change `bun audit --json` supplied exact package ranges; it exited 1 because findings exist. An advisory count is not a count of deployed exploits: Bun audits the complete workspace lock, including Expo, component-generator and infrastructure tooling. The classifications below are source/lock inspection, not a production exploit test or a certification of past deployments.

## Compatible remediation

Root `overrides` deliberately replace exact vulnerable transitive pins; ordinary range refreshes would leave Prisma/Chevrotain's pins behind. No major version was forced.

| Package | Before → selected | Reachability and compatibility basis |
| --- | --- | --- |
| `@hono/node-server` | `1.19.9` → `1.19.17` | Tooling: Alchemy → `@prisma/dev`; shadcn CLI → MCP SDK. Not the deployed Cloudflare Worker adapter. Prisma imports `serve({ createServer, fetch, overrideGlobalObjects, port })`; the selected 1.x patch retains that API. Addresses encoded-slash, repeated-slash and Windows-backslash static middleware findings. [1] |
| `hono` | Prisma's `4.11.4` → `4.13.13` | Prisma's tooling imports `hono/tiny`, `hono/http-exception` and `hono/validator`; these remain v4 APIs. The server already used `4.13.13`, so its deployed version does not change. Its entry imports `Hono`, `bodyLimit`, `cors`, `logger` and the tRPC adapter, with an explicit configured CORS origin; it does not import `serveStatic`. All pre-change Hono advisory ranges end below the selected version. `app.mount()` remains available in v4 despite deprecation; no v5 migration is attempted. [2] |
| `lodash` | `4.17.21` → `4.18.1` | Tooling: Alchemy → Prisma AST → Chevrotain and its gast/cst helpers. Installed consumers use CommonJS `lodash/<method>` imports, preserved in 4.x. `4.18.0` fixes template-import code injection and additional unset/omit prototype pollution; `4.18.1` fixes modular-build regressions, so `4.17.23` alone is insufficient. [3] |
| `valibot` | `1.2.0` → `1.4.2` | Tooling: Prisma state/request validation. Installed Prisma imports schema functions and `safeParse`; the 1.4.2 release fixes `flatten`/`intersect` collisions with `Object.prototype` keys without requiring an API migration. Drizzle also declares an optional peer; application boundary schemas use Zod, not Valibot. Select the first fixed release rather than add unrelated 1.5 changes. [4] |

`packages/infra` now explicitly declares `dotenv: ^17.4.2` as a development dependency for the production-deploy guard's pure `parse` import rather than relying on Varlock's transitive copy. The installed 17.4.2 declaration accepts `string | Buffer` and returns parsed string values; the guard does not call `config()` or mutate the process environment through dotenv. No dotenv 18 major upgrade is included. [5]

`apps/web` adds type-only `@types/jsdom: ^30.0.0` for component regression tests using the existing `jsdom@30.1.2`; the types match the installed runtime major and require TypeScript 5.6 or newer (the workspace uses 6.0.3). The official registry metadata declares no lifecycle scripts. Existing Testing Library/jsdom runtime dependencies are unchanged. [7]

## Remaining deferrals

Post-change `bun audit --json` reported exactly **three remaining advisories: two high and one moderate**, matching the deferrals below. It exits 1; the workspace is not audit-clean. All other 45 reported advisories were removed by the compatible resolutions above.

| Package / advisory | Exposure and decision | Review |
| --- | --- | --- |
| `braces@3.0.3` — **high**, [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), affected `<=3.0.3` | `micromatch` → `fast-glob`/Metro and generator/build tooling. Deeply nested attacker-controlled glob patterns can exhaust the process stack. No published patched version exists; 3.0.3 is registry latest. No application HTTP handler supplies user input as a glob pattern. Tooling is still an attack surface: use trusted patterns/configuration and do not run generator/dev tooling as a public service or with unreviewed project input. Defer pending an upstream release, not a downgrade or incompatible substitute. | 2026-11-06; earlier on fix or exposure change |
| `node-forge@1.4.0` — **high**, [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv), affected `<=1.4.0` | Native developer tooling only: Expo CLI and `@expo/code-signing-certificates`. Installed certificate code does call `certificate.verify`, `publicKey.verify` and `csr.verify`, so this is **not** dismissed as unreachable within Expo. Malformed PKCS#1 v1.5 signatures with low-exponent keys can bypass verification. No published patched version exists; 1.4.0 is registry latest. No web/server production source imports forge. Do not accept untrusted certificates/CSRs or expose the Expo signing/dev flow to untrusted clients; review this blocker before any native signing/distribution workflow. The web MVP does not ship the native app. | 2026-11-06; earlier on fix or native signing/distribution |
| `uuid@7.0.3` — **moderate**, [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq), affected `<11.1.1` | Expo → `xcode@3.0.1` project-generation tooling. Installed `xcode/lib/pbxProject.js` uses `uuid.v4()` without an output buffer; the advisory affects **v3/v5/v6 methods with supplied buffers/offsets**, not v4. No affected call was found in that consumer. First fixed line is 11.1.1, outside `xcode`'s `^7.0.3` range; a forced major override is intentionally excluded. Await an upstream xcode/Expo-compatible dependency migration. | 2026-11-06; earlier on upstream migration or changed UUID usage |

## Installation boundary and integration checks

The sole application lockfile belongs to the root workspace; `packageManager` and CI both pin Bun 1.4.2. Root/workspace postinstall scripts run Varlock environment code generation. The repository has no explicit `trustedDependencies` list, so ordinary installs still use Bun's built-in dependency-script allowlist; this change does not broaden it or claim a fully reviewed allowlist. Lock generation used:

```sh
bun install --lockfile-only --ignore-scripts
```

This command completed successfully twice: first for the security overrides/dotenv, then for the requested jsdom types; the final lock contains 1269 packages. Neither invocation installed dependencies or ran lifecycle scripts. The root overrides, infra dotenv declaration and web jsdom types are the intended manifest changes.

Integration verification:

1. `bun install --frozen-lockfile --ignore-scripts` completed successfully (15 packages installed), followed by successful explicit `bun run env:generate`. Dependency lifecycle scripts were not run.
2. `bun audit --json` reported only the three deferred IDs above. Re-run before release; the advisory database may change.
3. Existing lint, type, build and test gates. Exercise the infrastructure parser regressions with quoted `#`, multiline values and malformed/unclosed quotes; no production deployment is needed.
4. Browser/server smoke: sign-in/session cookies, credentialed CORS preflight from the configured origin, protected tRPC reads/writes, and the existing oversized-body rejection. These are consumer checks, not proof that every transitive tool was exercised.
5. Before using Prisma local tooling or shadcn MCP/generation, check it starts and handles its existing requests with the selected Hono/Node adapter/Valibot/Lodash exports, in an isolated local environment without production credentials. Native Expo certificate/CSR paths remain deferred as above; no native release is certified here.

The dependency-editing slice did not run builds, lint, formatters or tests; the consolidated remediation record reports integration checks separately.

## Sources

1. [Node adapter releases](https://github.com/honojs/node-server/releases), especially [1.19.10](https://github.com/honojs/node-server/releases/tag/v1.19.10), [1.19.13](https://github.com/honojs/node-server/releases/tag/v1.19.13), and [1.19.17](https://github.com/honojs/node-server/releases/tag/v1.19.17); [Windows static traversal advisory](https://github.com/advisories/GHSA-frvp-7c67-39w9).
2. [Hono 4.13.13 release/API compatibility](https://github.com/honojs/hono/releases/tag/v4.13.13); [static middleware](https://github.com/advisories/GHSA-q5qw-h33p-qvwr), [CORS wildcard](https://github.com/advisories/GHSA-88fw-hqm2-52qc), and [CORS ReDoS](https://github.com/advisories/GHSA-8j4g-w8fx-2239) advisory ranges.
3. [Official Lodash changelog](https://github.com/lodash/lodash/wiki/Changelog), including 4.17.23, 4.18.0 and 4.18.1.
4. [Valibot 1.4.2 release](https://github.com/open-circle/valibot/releases/tag/v1.4.2); [GHSA-5qjj-4xww-7phc](https://github.com/advisories/GHSA-5qjj-4xww-7phc).
5. [Dotenv 17.4.2 changelog](https://github.com/motdotla/dotenv/blob/v17.4.2/CHANGELOG.md); installed `dotenv/lib/main.d.ts` parser contract.
6. [Bun dependency lifecycle/ignore-scripts policy](https://bun.sh/docs/pm/lifecycle), [overrides](https://bun.sh/docs/pm/overrides), and [targeted updates](https://bun.sh/docs/pm/cli/update). Version availability was checked against the official [npm registry](https://registry.npmjs.org/).
7. [Official jsdom 30 type-package metadata](https://registry.npmjs.org/@types%2fjsdom/30.0.0) and [DefinitelyTyped declarations](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/jsdom/index.d.ts).
