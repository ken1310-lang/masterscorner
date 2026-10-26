import type { Session } from "@my-better-t-app/auth";
import type { Database } from "@my-better-t-app/db";

import type { MediaRateLimit, MediaStorage } from "./media";

// A type alias, not an interface: the tRPC context factory in `apps/server`
// assigns this to `Record<string, unknown>`, and an interface has no implicit
// index signature, so the assignment fails when this is an interface.
// biome-ignore lint/style/useConsistentTypeDefinitions: the Hono assignment needs the alias's implicit index signature
export type Context = {
  db: Database;
  mediaRateLimit: MediaRateLimit;
  mediaStorage: MediaStorage;
  session: Session | null;
};
