import type { Database } from "@my-better-t-app/db";
import {
  masterLocation,
  masterMartialArt,
  masterProfile,
  media,
} from "@my-better-t-app/db/schema/master";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import { protectedProcedure, router } from "../index";
import {
  type MasterProfileChild,
  type MasterProfilePayload,
  type MasterProfileSummary,
  planProfileChildren,
  saveProfileInputSchema,
} from "../master-profile";
import { type MediaStorage, toMediaViews } from "../media";

/**
 * Positions are unique per profile, and a martial-art name is unique per
 * profile after trimming and lowercasing. A reorder first moves the kept rows
 * out of the way, and a rename first vacates the kept art names, so no
 * intermediate update can collide with a row that has not moved yet.
 */
const VACATE_OFFSET = 1_000_000;

const PROFILE_CONFLICT_MESSAGE =
  "This profile changed in another session. Reload the page and save again.";
const DUPLICATE_KEY = /duplicate key value/i;

function profileConflict() {
  return new TRPCError({
    code: "CONFLICT",
    message: PROFILE_CONFLICT_MESSAGE,
  });
}

/** A concurrent first save hits the one-profile-per-user unique constraint. */
function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }
  if ("code" in error && error.code === "23505") {
    return true;
  }
  if (
    "cause" in error &&
    error.cause &&
    typeof error.cause === "object" &&
    "code" in error.cause &&
    error.cause.code === "23505"
  ) {
    return true;
  }
  return error instanceof Error && DUPLICATE_KEY.test(error.message);
}

function selectTemporaryArtNamePrefix(
  existing: readonly { name: string }[] | undefined,
  submitted: readonly { name: string }[],
  updates: readonly { id: string }[]
) {
  const occupiedArtNames = new Set(
    [...(existing ?? []), ...submitted].map((row) =>
      row.name.trim().toLowerCase()
    )
  );
  let temporaryNamePrefix = "vacated:";
  let suffix = 0;
  // Each rejected prefix collides with a distinct occupied name, so at
  // most occupiedArtNames.size retries are needed. UUIDs keep the
  // temporary names distinct from each other.
  while (
    updates.some((row) =>
      occupiedArtNames.has(`${temporaryNamePrefix}${row.id}`)
    )
  ) {
    temporaryNamePrefix = `vacated:${suffix}:`;
    suffix += 1;
  }
  return temporaryNamePrefix;
}

const profileIdForRevision = (userId: string, revision: string) =>
  sql`(select ${masterProfile.id} from ${masterProfile} where ${masterProfile.userId} = ${userId} and ${masterProfile.revision} = ${revision})`;

function toProfilePayload(
  profile: MasterProfileSummary,
  martialArts: MasterProfileChild[],
  locations: MasterProfileChild[],
  mediaRows: readonly {
    createdAt: Date | string;
    id: string;
    kind: "profile_photo" | "site_logo";
    objectKey: string;
  }[],
  storage: MediaStorage
): MasterProfilePayload {
  return {
    locations: locations.map(({ id, name, position }) => ({
      id,
      name,
      position,
    })),
    martialArts: martialArts.map(({ id, name, position }) => ({
      id,
      name,
      position,
    })),
    media: toMediaViews(mediaRows, storage.publicUrl),
    profile,
  };
}

export async function loadProfile(
  db: Database,
  userId: string,
  storage: MediaStorage
): Promise<MasterProfilePayload> {
  const profile = await db.query.masterProfile.findFirst({
    where: { userId },
    with: {
      martialArts: { orderBy: { position: "asc" } },
      locations: { orderBy: { position: "asc" } },
      media: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!profile) {
    return { locations: [], martialArts: [], media: [], profile: null };
  }

  return toProfilePayload(
    {
      displayName: profile.displayName,
      homeCity: profile.homeCity,
      id: profile.id,
      introduction: profile.introduction,
      revision: profile.revision,
      yearsTeaching: profile.yearsTeaching,
    },
    profile.martialArts,
    profile.locations,
    profile.media,
    storage
  );
}

export const masterRouter = router({
  getProfile: protectedProcedure.query(({ ctx }) =>
    loadProfile(ctx.db, ctx.session.user.id, ctx.mediaStorage)
  ),

  saveProfile: protectedProcedure
    .input(saveProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const existing = await ctx.db.query.masterProfile.findFirst({
        where: { userId },
        with: { locations: true, martialArts: true },
      });

      if ((existing?.revision ?? null) !== input.revision) {
        throw profileConflict();
      }

      const nextRevision = crypto.randomUUID();
      const artsPlan = planProfileChildren(
        existing?.martialArts ?? [],
        input.martialArts
      );
      const locationsPlan = planProfileChildren(
        existing?.locations ?? [],
        input.locations
      );
      const profileId = profileIdForRevision(userId, nextRevision);
      const profileWrite = existing
        ? ctx.db
            .update(masterProfile)
            .set({
              displayName: input.displayName,
              homeCity: input.homeCity,
              introduction: input.introduction,
              revision: nextRevision,
              updatedAt: new Date(),
              yearsTeaching: input.yearsTeaching,
            })
            .where(
              and(
                eq(masterProfile.userId, userId),
                eq(masterProfile.revision, existing.revision)
              )
            )
            .returning({ id: masterProfile.id })
        : ctx.db
            .insert(masterProfile)
            .values({
              displayName: input.displayName,
              homeCity: input.homeCity,
              introduction: input.introduction,
              revision: nextRevision,
              userId,
              yearsTeaching: input.yearsTeaching,
            })
            .returning({ id: masterProfile.id });
      const statements: BatchItem<"pg">[] = [profileWrite];

      if (artsPlan.deleteIds.length > 0) {
        statements.push(
          ctx.db
            .delete(masterMartialArt)
            .where(
              and(
                eq(masterMartialArt.profileId, profileId),
                inArray(masterMartialArt.id, artsPlan.deleteIds)
              )
            )
        );
      }
      if (locationsPlan.deleteIds.length > 0) {
        statements.push(
          ctx.db
            .delete(masterLocation)
            .where(
              and(
                eq(masterLocation.profileId, profileId),
                inArray(masterLocation.id, locationsPlan.deleteIds)
              )
            )
        );
      }

      if (artsPlan.updates.length > 0) {
        const temporaryNamePrefix = selectTemporaryArtNamePrefix(
          existing?.martialArts,
          input.martialArts,
          artsPlan.updates
        );
        statements.push(
          ctx.db
            .update(masterMartialArt)
            .set({
              name: sql`${temporaryNamePrefix} || ${masterMartialArt.id}::text`,
              position: sql`${masterMartialArt.position} + ${VACATE_OFFSET}`,
            })
            .where(
              and(
                eq(masterMartialArt.profileId, profileId),
                inArray(
                  masterMartialArt.id,
                  artsPlan.updates.map((row) => row.id)
                )
              )
            )
        );
      }
      if (locationsPlan.updates.length > 0) {
        statements.push(
          ctx.db
            .update(masterLocation)
            .set({
              position: sql`${masterLocation.position} + ${VACATE_OFFSET}`,
            })
            .where(eq(masterLocation.profileId, profileId))
        );
      }

      for (const row of artsPlan.updates) {
        statements.push(
          ctx.db
            .update(masterMartialArt)
            .set({ name: row.name, position: row.position })
            .where(
              and(
                eq(masterMartialArt.id, row.id),
                eq(masterMartialArt.profileId, profileId)
              )
            )
        );
      }
      for (const row of locationsPlan.updates) {
        statements.push(
          ctx.db
            .update(masterLocation)
            .set({ name: row.name, position: row.position })
            .where(
              and(
                eq(masterLocation.id, row.id),
                eq(masterLocation.profileId, profileId)
              )
            )
        );
      }

      for (const row of artsPlan.inserts) {
        statements.push(
          ctx.db.insert(masterMartialArt).select(
            ctx.db
              .select({
                name: sql<string>`${row.name}`.as("name"),
                position: sql<number>`${row.position}`.as("position"),
                profileId: masterProfile.id,
              })
              .from(masterProfile)
              .where(
                and(
                  eq(masterProfile.userId, userId),
                  eq(masterProfile.revision, nextRevision)
                )
              )
          )
        );
      }
      for (const row of locationsPlan.inserts) {
        statements.push(
          ctx.db.insert(masterLocation).select(
            ctx.db
              .select({
                name: sql<string>`${row.name}`.as("name"),
                position: sql<number>`${row.position}`.as("position"),
                profileId: masterProfile.id,
              })
              .from(masterProfile)
              .where(
                and(
                  eq(masterProfile.userId, userId),
                  eq(masterProfile.revision, nextRevision)
                )
              )
          )
        );
      }

      // Read the rows back inside the same transaction so the response is this
      // save's own writes, never a newer save that lands during a later reload.
      statements.push(
        ctx.db
          .select({
            displayName: masterProfile.displayName,
            homeCity: masterProfile.homeCity,
            id: masterProfile.id,
            introduction: masterProfile.introduction,
            revision: masterProfile.revision,
            yearsTeaching: masterProfile.yearsTeaching,
          })
          .from(masterProfile)
          .where(
            and(
              eq(masterProfile.userId, userId),
              eq(masterProfile.revision, nextRevision)
            )
          )
          .limit(1),
        ctx.db
          .select({
            id: masterMartialArt.id,
            name: masterMartialArt.name,
            position: masterMartialArt.position,
          })
          .from(masterMartialArt)
          .where(eq(masterMartialArt.profileId, profileId))
          .orderBy(masterMartialArt.position),
        ctx.db
          .select({
            id: masterLocation.id,
            name: masterLocation.name,
            position: masterLocation.position,
          })
          .from(masterLocation)
          .where(eq(masterLocation.profileId, profileId))
          .orderBy(masterLocation.position),
        ctx.db
          .select({
            createdAt: media.createdAt,
            id: media.id,
            kind: media.kind,
            objectKey: media.objectKey,
          })
          .from(media)
          .where(eq(media.profileId, profileId))
          .orderBy(media.createdAt)
      );

      const [first, ...rest] = statements;
      if (!first) {
        throw new Error("Profile save produced no statements");
      }
      let result: unknown[];
      try {
        result = await ctx.db.batch([first, ...rest]);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw profileConflict();
        }
        throw error;
      }
      // The batch preserves statement order; the four snapshot reads are
      // appended last. Writes without RETURNING come back as raw result
      // objects, so read the guard and the snapshot by position.
      const [guardRows] = result;
      const [profileRows, martialArts, locations, mediaRows] = result.slice(
        -4
      ) as [
        MasterProfileSummary[],
        MasterProfileChild[],
        MasterProfileChild[],
        {
          createdAt: Date | string;
          id: string;
          kind: "profile_photo" | "site_logo";
          objectKey: string;
        }[],
      ];
      const [profile] = profileRows;
      if (!Array.isArray(guardRows) || guardRows.length === 0 || !profile) {
        throw profileConflict();
      }

      return toProfilePayload(
        profile,
        martialArts,
        locations,
        mediaRows,
        ctx.mediaStorage
      );
    }),
});
