import { describe, expect, test } from "bun:test";

import { createMediaStorage } from "./media-storage";

const config = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  endpoint: process.env.AWS_ENDPOINT_URL_S3 ?? "",
  region: process.env.AWS_REGION ?? "",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
};
const describeLive =
  config.accessKeyId &&
  config.endpoint &&
  config.region &&
  config.secretAccessKey
    ? describe
    : describe.skip;

/** 1x1 transparent PNG. Small enough to prove signing without a fixture file. */
const PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  )
);

/**
 * Live bucket round trip. It runs only with the development branch's `AWS_*`
 * environment; the offline suite skips it, so `bun run gates` never needs the
 * bucket. The object is deleted even when an assertion fails.
 */
describeLive("Neon Object Storage", () => {
  const storage = createMediaStorage(config);
  const key = `masters/tests/${crypto.randomUUID()}.png`;

  test("writes, serves anonymously and deletes an object", async () => {
    try {
      await storage.putObject(key, PNG, "image/png");

      const served = await fetch(storage.publicUrl(key));
      expect(served.status).toBe(200);
      expect(served.headers.get("content-type")).toContain("image/png");
      expect(new Uint8Array(await served.arrayBuffer())).toEqual(PNG);

      await storage.deleteObject(key);

      const deleted = await fetch(storage.publicUrl(key));
      expect(deleted.status).toBe(404);
    } finally {
      await storage.deleteObject(key).catch(() => undefined);
    }
  });

  test("treats a repeated delete as success", async () => {
    await storage.deleteObject(`${key}.missing`);
  });
});
