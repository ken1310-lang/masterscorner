import { describe, expect, test } from "bun:test";

import { createMediaStorage } from "./media-storage";

const PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  )
);

/**
 * An unreachable endpoint rejects the fetch itself, which is a different path
 * from a non-2xx response. Both must reach the router as MediaStorageError so
 * the console gets the documented SERVICE_UNAVAILABLE message.
 */
const storage = createMediaStorage({
  accessKeyId: "test-access-key",
  endpoint: "http://127.0.0.1:1",
  region: "us-east-1",
  secretAccessKey: "test-secret-key",
});

describe("createMediaStorage", () => {
  test("wraps a failed PUT as a 503 storage error", async () => {
    await expect(
      storage.putObject("masters/tests/unreachable.png", PNG, "image/png")
    ).rejects.toMatchObject({ status: 503 });
  });

  test("wraps a failed DELETE as a 503 storage error", async () => {
    await expect(
      storage.deleteObject("masters/tests/unreachable.png")
    ).rejects.toMatchObject({ status: 503 });
  });
});
