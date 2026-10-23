import { masterClass } from "@my-better-t-app/db/schema/classes";
import {
  masterLocation,
  masterMartialArt,
} from "@my-better-t-app/db/schema/master";
import { asc, eq, inArray } from "drizzle-orm";

import {
  DIRECTORY_CLASS_STATUSES,
  type DirectoryClassesPayload,
  directoryClassFiltersSchema,
  nextSessionStart,
} from "../directory";
import { publicProcedure, router } from "../index";

export const directoryRouter = router({
  classes: publicProcedure
    .input(directoryClassFiltersSchema)
    .query(async ({ ctx, input }): Promise<DirectoryClassesPayload> => {
      const eligible = inArray(masterClass.status, [
        ...DIRECTORY_CLASS_STATUSES,
      ]);
      const where = {
        status: { in: [...DIRECTORY_CLASS_STATUSES] },
        ...(input?.martialArtId ? { martialArtId: input.martialArtId } : {}),
        ...(input?.locationId ? { locationId: input.locationId } : {}),
        ...(input?.audience ? { audience: input.audience } : {}),
      };

      const [rows, martialArts, locations] = await Promise.all([
        ctx.db.query.masterClass.findMany({
          where,
          with: {
            location: true,
            martialArt: true,
            profile: { columns: { displayName: true } },
            schedules: true,
          },
        }),
        ctx.db
          .select({
            id: masterMartialArt.id,
            name: masterMartialArt.name,
          })
          .from(masterClass)
          .innerJoin(
            masterMartialArt,
            eq(masterClass.martialArtId, masterMartialArt.id)
          )
          .where(eligible)
          .groupBy(masterMartialArt.id, masterMartialArt.name)
          .orderBy(asc(masterMartialArt.name)),
        ctx.db
          .select({ id: masterLocation.id, name: masterLocation.name })
          .from(masterClass)
          .innerJoin(
            masterLocation,
            eq(masterClass.locationId, masterLocation.id)
          )
          .where(eligible)
          .groupBy(masterLocation.id, masterLocation.name)
          .orderBy(asc(masterLocation.name)),
      ]);

      const now = new Date();
      const classes = rows.flatMap((row) => {
        if (row.status === "paused") {
          return [];
        }
        const nextSession = nextSessionStart(row.schedules, now);
        if (!nextSession) {
          return [];
        }
        return [
          {
            audience: row.audience,
            feeAmount: row.feeAmount,
            feePeriod: row.feePeriod,
            id: row.id,
            level: row.level,
            location: { id: row.location.id, name: row.location.name },
            martialArt: {
              id: row.martialArt.id,
              name: row.martialArt.name,
            },
            master: { displayName: row.profile.displayName },
            name: row.name,
            nextSessionAt: nextSession.toISOString(),
            status: row.status,
          },
        ];
      });
      classes.sort(
        (left, right) =>
          left.nextSessionAt.localeCompare(right.nextSessionAt) ||
          left.name.localeCompare(right.name) ||
          left.id.localeCompare(right.id)
      );

      return { classes, locations, martialArts };
    }),
});
