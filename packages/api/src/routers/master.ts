import type { Database } from "@my-better-t-app/db";
import {
  masterLocation,
  masterMartialArt,
  masterProfile,
} from "@my-better-t-app/db/schema/master";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";

import { protectedProcedure, router } from "../index";
import {
  type MasterProfilePayload,
  planProfileChildren,
  saveProfileInputSchema,
} from "../master-profile";

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

const profileIdForRevision = (userId: string, revision: string) =>
  sql`(select ${masterProfile.id} from ${masterProfile} where ${masterProfile.userId} = ${userId} and ${masterProfile.revision} = ${revision})`;

async function loadProfile(
  db: Database,
  userId: string
): Promise<MasterProfilePayload> {
  const profile = await db.query.masterProfile.findFirst({
    where: { userId },
    with: {
      martialArts: { orderBy: { position: "asc" } },
      locations: { orderBy: { position: "asc" } },
    },
  });

  if (!profile) {
    return { locations: [], martialArts: [], profile: null };
  }

  return {
    locations: profile.locations.map(({ id, name, position }) => ({
      id,
      name,
      position,
    })),
    martialArts: profile.martialArts.map(({ id, name, position }) => ({
      id,
      name,
      position,
    })),
    profile: {
      displayName: profile.displayName,
      homeCity: profile.homeCity,
      id: profile.id,
      introduction: profile.introduction,
      revision: profile.revision,
      yearsTeaching: profile.yearsTeaching,
    },
  };
}

export const masterRouter = router({
  getProfile: protectedProcedure.query(({ ctx }) =>
    loadProfile(ctx.db, ctx.session.user.id)
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
        statements.push(
          ctx.db
            .update(masterMartialArt)
            .set({
              name: sql`'vacated:' || ${masterMartialArt.id}::text`,
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

      const [first, ...rest] = statements;
      if (!first) {
        throw new Error("Profile save produced no statements");
      }
      try {
        await ctx.db.batch([first, ...rest]);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw profileConflict();
        }
        throw error;
      }

      const saved = await loadProfile(ctx.db, userId);
      if (saved.profile?.revision !== nextRevision) {
        throw profileConflict();
      }
      return saved;
    }),
});
