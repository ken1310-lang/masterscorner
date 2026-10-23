import { media } from "@my-better-t-app/db/schema/master";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
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

      const id = crypto.randomUUID();
      const objectKey = mediaObjectKey(profile.id, input.contentType, id);
      try {
        await ctx.mediaStorage.putObject(objectKey, bytes, input.contentType);
      } catch (error) {
        storageUnavailable(error);
      }

      /**
       * Replacements for one profile and kind serialize on an advisory lock
       * held for the batch's transaction. The previous rows are read only
       * after the lock is held, and every row of that kind is deleted before
       * the insert, so two overlapping uploads cannot leave a hidden row (and
       * its object) behind. A failed insert rolls the delete back.
       */
      const lockKey = `media-replace:${profile.id}:${input.kind}`;
      const statements: BatchItem<"pg">[] = [
        ctx.db.execute(
          sql`select pg_advisory_xact_lock(hashtextextended(${lockKey}, 0))`
        ),
        ctx.db
          .select({ id: media.id, objectKey: media.objectKey })
          .from(media)
          .where(
            and(eq(media.profileId, profile.id), eq(media.kind, input.kind))
          ),
        ctx.db
          .delete(media)
          .where(
            and(eq(media.profileId, profile.id), eq(media.kind, input.kind))
          ),
        ctx.db.insert(media).values({
          byteSize: bytes.length,
          contentType: input.contentType,
          id,
          kind: input.kind,
          objectKey,
          profileId: profile.id,
        }),
      ];
      const [first, ...rest] = statements;
      if (!first) {
        throw new Error("Media upload produced no statements");
      }
      let result: unknown[];
      try {
        result = await ctx.db.batch([first, ...rest]);
      } catch (error) {
        await ctx.mediaStorage.deleteObject(objectKey).catch(() => undefined);
        throw error;
      }
      const previous = result[1] as
        | { id: string; objectKey: string }[]
        | undefined;
      await Promise.allSettled(
        (previous ?? []).map((row) =>
          ctx.mediaStorage.deleteObject(row.objectKey)
        )
      );

      return loadProfile(ctx.db, userId, ctx.mediaStorage);
    }),
});
