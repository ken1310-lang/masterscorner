import { media } from "@my-better-t-app/db/schema/master";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import { protectedProcedure, router } from "../index";
import {
  decodeMediaUpload,
  MediaStorageError,
  MediaUploadError,
  mediaObjectKey,
  removeMediaInputSchema,
  uploadMediaInputSchema,
} from "../media";
import { loadProfile } from "./master";

function badUpload(error: unknown): never {
  if (error instanceof MediaUploadError) {
    throw new TRPCError({
      cause: error,
      code: "BAD_REQUEST",
      message: error.message,
    });
  }
  throw error;
}

function storageUnavailable(error: unknown): never {
  if (error instanceof MediaStorageError) {
    throw new TRPCError({
      cause: error,
      code: "SERVICE_UNAVAILABLE",
      message: "Image storage is busy. Try again in a moment.",
    });
  }
  throw error;
}

export const mediaRouter = router({
  remove: protectedProcedure
    .input(removeMediaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const profile = await ctx.db.query.masterProfile.findFirst({
        columns: { id: true },
        where: { userId },
      });
      if (!profile) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Save your profile before changing its images.",
        });
      }

      const current = await ctx.db
        .select({ id: media.id, objectKey: media.objectKey })
        .from(media)
        .where(
          and(eq(media.profileId, profile.id), eq(media.kind, input.kind))
        );
      if (current.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "That image is not on your profile.",
        });
      }

      // Scope the delete to the rows just read, so a concurrent upload of the
      // same kind cannot be removed by this request.
      await ctx.db.delete(media).where(
        and(
          eq(media.profileId, profile.id),
          inArray(
            media.id,
            current.map((row) => row.id)
          )
        )
      );
      await Promise.allSettled(
        current.map((row) => ctx.mediaStorage.deleteObject(row.objectKey))
      );

      return loadProfile(ctx.db, userId, ctx.mediaStorage);
    }),

  upload: protectedProcedure
    .input(uploadMediaInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const decision = await ctx.mediaRateLimit.limit({
        key: `media-upload:${userId}`,
      });
      if (!decision.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many uploads. Wait a minute and try again.",
        });
      }

      let bytes: Uint8Array;
      try {
        bytes = decodeMediaUpload(input);
      } catch (error) {
        badUpload(error);
      }

      const profile = await ctx.db.query.masterProfile.findFirst({
        columns: { id: true },
        where: { userId },
      });
      if (!profile) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Save your profile before adding a photo.",
        });
      }

      const previous = await ctx.db
        .select({ id: media.id, objectKey: media.objectKey })
        .from(media)
        .where(
          and(eq(media.profileId, profile.id), eq(media.kind, input.kind))
        );

      const id = crypto.randomUUID();
      const objectKey = mediaObjectKey(profile.id, input.contentType, id);
      try {
        await ctx.mediaStorage.putObject(objectKey, bytes, input.contentType);
      } catch (error) {
        storageUnavailable(error);
      }

      const statements: BatchItem<"pg">[] = [
        ctx.db.insert(media).values({
          byteSize: bytes.length,
          contentType: input.contentType,
          id,
          kind: input.kind,
          objectKey,
          profileId: profile.id,
        }),
      ];
      if (previous.length > 0) {
        // New object first, then remove the rows it replaces in the same
        // transaction. A failure leaves the old image intact.
        statements.push(
          ctx.db.delete(media).where(
            and(
              eq(media.profileId, profile.id),
              eq(media.kind, input.kind),
              inArray(
                media.id,
                previous.map((row) => row.id)
              )
            )
          )
        );
      }
      const [first, ...rest] = statements;
      if (!first) {
        throw new Error("Media upload produced no statements");
      }
      try {
        await ctx.db.batch([first, ...rest]);
      } catch (error) {
        await ctx.mediaStorage.deleteObject(objectKey).catch(() => undefined);
        throw error;
      }
      await Promise.allSettled(
        previous.map((row) => ctx.mediaStorage.deleteObject(row.objectKey))
      );

      return loadProfile(ctx.db, userId, ctx.mediaStorage);
    }),
});
