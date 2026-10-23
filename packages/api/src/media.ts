import {
  MEDIA_KINDS,
  type MediaKind,
} from "@my-better-t-app/db/schema/media-kinds";
import { z } from "zod";

/** 5 MiB: well inside Neon's 5 GiB object limit and the Free plan's 5 GB cap. */
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const MEDIA_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type MediaImageType = (typeof MEDIA_IMAGE_TYPES)[number];

/** Base64 grows by 4/3; this is the largest legal payload, rounded up. */
export const MEDIA_BASE64_MAX_LENGTH = Math.ceil(MEDIA_MAX_BYTES / 3) * 4 + 4;

const TRAILING_SLASHES = /\/+$/;

const EXTENSIONS: Record<MediaImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const SIZE_MESSAGE = "The image is too large. Choose a file smaller than 5 MB.";
const TYPE_MESSAGE = "That file is not a JPEG, PNG or WebP image.";
const MISMATCH_MESSAGE =
  "The image does not match its file type. Choose the file again.";
const DECODE_MESSAGE = "The image could not be read. Choose the file again.";

/**
 * A rejection caused by the uploaded bytes, not by the caller's identity or
 * the storage provider. The router maps it to `BAD_REQUEST`.
 */
export class MediaUploadError extends Error {}

/** The provider refused or was unreachable after the client's retries. */
export class MediaStorageError extends Error {
  readonly status: number;

  constructor(message: string, status: number, options?: ErrorOptions) {
    super(message, options);
    this.status = status;
  }
}

export function sniffImageType(bytes: Uint8Array): MediaImageType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/**
 * Validates the decoded bytes before any storage call: non-empty, under the
 * cap, a known image signature, and the signature the caller declared. The
 * declared content type is a claim; these bytes are the evidence.
 */
export function validateMediaBytes(
  bytes: Uint8Array,
  declared: MediaImageType
): MediaImageType {
  if (bytes.length === 0) {
    throw new MediaUploadError("The image is empty. Choose another file.");
  }
  if (bytes.length > MEDIA_MAX_BYTES) {
    throw new MediaUploadError(SIZE_MESSAGE);
  }
  const actual = sniffImageType(bytes);
  if (!actual) {
    throw new MediaUploadError(TYPE_MESSAGE);
  }
  if (actual !== declared) {
    throw new MediaUploadError(MISMATCH_MESSAGE);
  }
  return actual;
}

export function decodeMediaUpload(input: {
  contentType: MediaImageType;
  data: string;
}): Uint8Array {
  let binary: string;
  try {
    binary = atob(input.data);
  } catch (error) {
    throw new MediaUploadError(DECODE_MESSAGE, { cause: error });
  }
  if (binary.length === 0) {
    throw new MediaUploadError(DECODE_MESSAGE);
  }
  if (binary.length > MEDIA_MAX_BYTES) {
    throw new MediaUploadError(SIZE_MESSAGE);
  }
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  validateMediaBytes(bytes, input.contentType);
  return bytes;
}

export function mediaObjectKey(
  profileId: string,
  contentType: MediaImageType,
  id: string
): string {
  return `masters/${profileId}/${id}.${EXTENSIONS[contentType]}`;
}

export function mediaPublicUrl(endpoint: string, objectKey: string): string {
  return `${endpoint.replace(TRAILING_SLASHES, "")}/media/${objectKey}`;
}

export interface StoredMedia {
  createdAt: Date | string;
  id: string;
  kind: MediaKind;
  objectKey: string;
}

export interface MediaView {
  id: string;
  kind: MediaKind;
  url: string;
}

/**
 * The media table may briefly hold two rows of a kind after concurrent
 * replacements. Reads are deterministic: newest wins, ties keep query order.
 */
export function toMediaViews(
  rows: readonly StoredMedia[],
  publicUrl: (objectKey: string) => string
): MediaView[] {
  const sorted = [...rows].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
  const seen = new Set<MediaKind>();
  const views: MediaView[] = [];
  for (const row of sorted) {
    if (seen.has(row.kind)) {
      continue;
    }
    seen.add(row.kind);
    views.push({ id: row.id, kind: row.kind, url: publicUrl(row.objectKey) });
  }
  return views;
}

export const uploadMediaInputSchema = z.object({
  kind: z.enum(MEDIA_KINDS),
  contentType: z.enum(MEDIA_IMAGE_TYPES),
  data: z
    .string()
    .min(1, "Choose an image to upload.")
    .max(MEDIA_BASE64_MAX_LENGTH, SIZE_MESSAGE),
});

export const removeMediaInputSchema = z.object({
  kind: z.enum(MEDIA_KINDS),
});

/** Implemented in `apps/server`; the API only needs these three operations. */
export interface MediaStorage {
  deleteObject: (key: string) => Promise<void>;
  publicUrl: (key: string) => string;
  putObject: (
    key: string,
    body: Uint8Array,
    contentType: MediaImageType
  ) => Promise<void>;
}

/** The subset of Cloudflare's RateLimit binding the upload path uses. */
export interface MediaRateLimit {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}
