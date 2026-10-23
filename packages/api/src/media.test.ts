import { describe, expect, test } from "bun:test";

import {
  decodeMediaUpload,
  MEDIA_MAX_BYTES,
  MediaUploadError,
  mediaObjectKey,
  mediaPublicUrl,
  toMediaViews,
  validateMediaBytes,
} from "./media";

const PNG = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
]);
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const WEBP = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const TEXT = new TextEncoder().encode("not an image");

function base64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

describe("validateMediaBytes", () => {
  test("accepts the three allowed formats when the declaration matches", () => {
    expect(validateMediaBytes(PNG, "image/png")).toBe("image/png");
    expect(validateMediaBytes(JPEG, "image/jpeg")).toBe("image/jpeg");
    expect(validateMediaBytes(WEBP, "image/webp")).toBe("image/webp");
  });

  test("rejects bytes that are not an allowed image", () => {
    expect(() => validateMediaBytes(TEXT, "image/png")).toThrow(
      MediaUploadError
    );
    expect(() =>
      validateMediaBytes(new Uint8Array([0xff, 0xd8]), "image/jpeg")
    ).toThrow("not a JPEG, PNG or WebP");
  });

  test("rejects a real image declared as another format", () => {
    expect(() => validateMediaBytes(PNG, "image/jpeg")).toThrow(
      "does not match"
    );
  });

  test("rejects an empty or oversized file with a named limit", () => {
    expect(() => validateMediaBytes(new Uint8Array(), "image/png")).toThrow(
      "empty"
    );
    const oversized = new Uint8Array(MEDIA_MAX_BYTES + 1);
    oversized.set(PNG);
    expect(() => validateMediaBytes(oversized, "image/png")).toThrow("5 MB");
  });
});

describe("decodeMediaUpload", () => {
  test("decodes base64 into the exact bytes", () => {
    expect(
      decodeMediaUpload({ contentType: "image/png", data: base64(PNG) })
    ).toEqual(PNG);
  });

  test("rejects malformed base64 with an actionable message", () => {
    expect(() =>
      decodeMediaUpload({ contentType: "image/png", data: "not*base64" })
    ).toThrow("could not be read");
    expect(() =>
      decodeMediaUpload({ contentType: "image/png", data: "" })
    ).toThrow("could not be read");
  });
});

describe("mediaObjectKey", () => {
  test("versions the key under the profile with an extension from the type", () => {
    expect(mediaObjectKey("profile-1", "image/jpeg", "media-1")).toBe(
      "masters/profile-1/media-1.jpg"
    );
    expect(mediaObjectKey("profile-1", "image/png", "media-2")).toBe(
      "masters/profile-1/media-2.png"
    );
    expect(mediaObjectKey("profile-1", "image/webp", "media-3")).toBe(
      "masters/profile-1/media-3.webp"
    );
  });
});

describe("mediaPublicUrl", () => {
  test("joins the branch endpoint and the fixed bucket once", () => {
    expect(
      mediaPublicUrl("https://br-test.storage.example/", "masters/p/a.jpg")
    ).toBe("https://br-test.storage.example/media/masters/p/a.jpg");
  });
});

describe("toMediaViews", () => {
  test("keeps the newest row per kind and exposes the public URL", () => {
    const rows = [
      {
        createdAt: new Date("2026-10-23T10:00:00Z"),
        id: "new-photo",
        kind: "profile_photo" as const,
        objectKey: "masters/p/new.jpg",
      },
      {
        createdAt: new Date("2026-10-22T10:00:00Z"),
        id: "old-photo",
        kind: "profile_photo" as const,
        objectKey: "masters/p/old.jpg",
      },
      {
        createdAt: new Date("2026-10-21T10:00:00Z"),
        id: "logo",
        kind: "site_logo" as const,
        objectKey: "masters/p/logo.png",
      },
    ];

    expect(
      toMediaViews(rows, (key) => `https://cdn.example/media/${key}`)
    ).toEqual([
      {
        id: "new-photo",
        kind: "profile_photo",
        url: "https://cdn.example/media/masters/p/new.jpg",
      },
      {
        id: "logo",
        kind: "site_logo",
        url: "https://cdn.example/media/masters/p/logo.png",
      },
    ]);
  });
});
