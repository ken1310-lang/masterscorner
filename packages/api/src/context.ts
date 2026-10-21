import type { Session } from "@my-better-t-app/auth";
import type { Database } from "@my-better-t-app/db";

// A type alias, not an interface: the tRPC context factory in `apps/server`
// assigns this to `Record<string, unknown>`, and an interface has no implicit
// index signature, so the assignment fails when this is an interface.
export type Context = {
  db: Database;
  session: Session | null;
};
