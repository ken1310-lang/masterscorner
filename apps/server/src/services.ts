import type { MediaRateLimit, MediaStorage } from "@my-better-t-app/api/media";
import { createAuth as createConfiguredAuth } from "@my-better-t-app/auth";
import { createDb, type Database } from "@my-better-t-app/db";

import { ENV } from "./env.server";
import { createMediaStorage } from "./media-storage";

export function getDb(): Database {
  return createDb(ENV);
}

export function getMediaStorage(): MediaStorage {
  return createMediaStorage({
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    endpoint: ENV.AWS_ENDPOINT_URL_S3,
    region: ENV.AWS_REGION,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  });
}

export function getMediaRateLimit(): MediaRateLimit {
  return ENV.MEDIA_UPLOAD_RATE_LIMIT;
}

export async function createAuth(database?: Database) {
  return createConfiguredAuth(ENV, database ?? (await getDb()));
}
