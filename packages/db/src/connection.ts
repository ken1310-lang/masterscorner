const NEON_POOLER_HOST = /^(ep-[^.]+)-pooler(\..+\.neon\.tech)$/;

/** Endpoint identity, retaining the port and normalizing only Neon's pooler alias. */
export function canonicalDatabaseHost(url: URL): string {
  const hostname = url.hostname.toLowerCase().replace(NEON_POOLER_HOST, "$1$2");
  return url.port ? `${hostname}:${url.port}` : hostname;
}
