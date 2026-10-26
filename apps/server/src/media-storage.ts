import type { MediaImageType, MediaStorage } from "@my-better-t-app/api/media";
import { MediaStorageError, mediaPublicUrl } from "@my-better-t-app/api/media";
import { AwsClient } from "aws4fetch";

const CACHE_CONTROL = "public, max-age=31536000, immutable";
const RETRIES = 3;
const INIT_RETRY_MS = 100;

export interface MediaStorageConfig {
  accessKeyId: string;
  endpoint: string;
  region: string;
  secretAccessKey: string;
}

/**
 * Neon Object Storage speaks path-style S3 with SigV4. `aws4fetch` signs a
 * Worker-native fetch and retries 429/5xx, which is Neon's documented
 * `503 SlowDown` behaviour, with exponential backoff and jitter.
 */
export function createMediaStorage(config: MediaStorageConfig): MediaStorage {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    initRetryMs: INIT_RETRY_MS,
    region: config.region,
    retries: RETRIES,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
  });
  const publicUrl = (key: string) => mediaPublicUrl(config.endpoint, key);

  return {
    deleteObject: async (key) => {
      let response: Response;
      try {
        response = await client.fetch(publicUrl(key), { method: "DELETE" });
      } catch (error) {
        // biome-ignore lint/style/useErrorCause: MediaStorageError forwards options to Error
        throw new MediaStorageError("Object storage is unreachable", 503, {
          cause: error,
        });
      }
      // A missing object is already the desired state. Neon soft-deletes, so
      // repeated deletes are harmless.
      if (!response.ok && response.status !== 404) {
        throw new MediaStorageError(
          `Object storage returned ${response.status}`,
          response.status
        );
      }
    },
    publicUrl,
    putObject: async (
      key: string,
      body: Uint8Array,
      contentType: MediaImageType
    ) => {
      let response: Response;
      try {
        response = await client.fetch(publicUrl(key), {
          body,
          headers: {
            "cache-control": CACHE_CONTROL,
            "content-type": contentType,
          },
          method: "PUT",
        });
      } catch (error) {
        // biome-ignore lint/style/useErrorCause: MediaStorageError forwards options to Error
        throw new MediaStorageError("Object storage is unreachable", 503, {
          cause: error,
        });
      }
      if (!response.ok) {
        throw new MediaStorageError(
          `Object storage returned ${response.status}`,
          response.status
        );
      }
    },
  };
}
