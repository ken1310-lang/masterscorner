import { defineConfig } from "drizzle-kit";
import "varlock/auto-load";

/**
 * Migrations run over the direct (unpooled) connection. PgBouncer runs in
 * transaction mode, where DDL and session state fail in ways that never name
 * pooling — see docs/specs/SPEC-platform.md §7. `neon env pull` writes both
 * URLs for the pinned branch.
 */
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || "";
if (!process.env.DATABASE_URL_UNPOOLED && url) {
  console.warn(
    "[db] DATABASE_URL_UNPOOLED is unset; migrating over the pooled connection. Run `neon env pull` on the branch."
  );
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials: {
    url,
  },
});
