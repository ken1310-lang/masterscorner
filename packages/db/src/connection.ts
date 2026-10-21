const NEON_POOLER_HOST = /^(ep-[^.]+)-pooler(\..+\.neon\.tech)$/;

/** Endpoint identity, normalizing PostgreSQL's default port and Neon's pooler alias. */
export function canonicalDatabaseHost(url: URL): string {
  const hostname = url.hostname.toLowerCase().replace(NEON_POOLER_HOST, "$1$2");
  return url.port && url.port !== "5432" ? `${hostname}:${url.port}` : hostname;
}
