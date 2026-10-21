import { createAuth as createConfiguredAuth } from "@my-better-t-app/auth";
import { createDb, type Database } from "@my-better-t-app/db";

import { ENV } from "./env.server";

export function getDb(): Database {
  return createDb(ENV);
}
export async function createAuth(database?: Database) {
  return createConfiguredAuth(ENV, database ?? (await getDb()));
}
