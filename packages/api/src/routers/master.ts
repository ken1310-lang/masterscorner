import type { Database } from "@my-better-t-app/db";
import {
  masterLocation,
  masterMartialArt,
  masterProfile,
} from "@my-better-t-app/db/schema/master";
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

const profileIdFor = (userId: string) =>
  sql`(select ${masterProfile.id} from ${masterProfile} where ${masterProfile.userId} = ${userId})`;

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

      const artsPlan = planProfileChildren(
        existing?.martialArts ?? [],
        input.martialArts
      );
      const locationsPlan = planProfileChildren(
        existing?.locations ?? [],
        input.locations
      );
      const profileId = profileIdFor(userId);
      const statements: BatchItem<"pg">[] = [
        ctx.db
          .insert(masterProfile)
          .values({
            displayName: input.displayName,
            homeCity: input.homeCity,
            introduction: input.introduction,
            userId,
            yearsTeaching: input.yearsTeaching,
          })
          .onConflictDoUpdate({
            target: masterProfile.userId,
            set: {
              displayName: input.displayName,
              homeCity: input.homeCity,
              introduction: input.introduction,
              updatedAt: new Date(),
              yearsTeaching: input.yearsTeaching,
            },
          }),
      ];

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

      if (artsPlan.inserts.length > 0) {
        statements.push(
          ctx.db.insert(masterMartialArt).values(
            artsPlan.inserts.map((row) => ({
              name: row.name,
              position: row.position,
              profileId,
            }))
          )
        );
      }
      if (locationsPlan.inserts.length > 0) {
        statements.push(
          ctx.db.insert(masterLocation).values(
            locationsPlan.inserts.map((row) => ({
              name: row.name,
              position: row.position,
              profileId,
            }))
          )
        );
      }

      const [first, ...rest] = statements;
      if (first) {
        await ctx.db.batch([first, ...rest]);
      }

      return loadProfile(ctx.db, userId);
    }),
});
