import { masterClass } from "@my-better-t-app/db/schema/classes";
import {
  masterLocation,
  masterMartialArt,
} from "@my-better-t-app/db/schema/master";
import { eq, inArray } from "drizzle-orm";

import {
  DIRECTORY_CLASS_STATUSES,
  type DirectoryClassesPayload,
  type DirectoryFilterOption,
  directoryClassFiltersSchema,
  nextSessionStart,
  normalizeDirectoryFilter,
} from "../directory";
import { publicProcedure, router } from "../index";

interface FilterGroup extends DirectoryFilterOption {
  ids: string[];
}

/**
 * Filters are shared by normalized name, because every master owns separate
 * martial-art and location rows. A selection resolves to every matching child
 * id instead of one master's row.
 */
function groupFilterOptions(
  rows: readonly { id: string; name: string }[]
): FilterGroup[] {
  const groups = new Map<string, FilterGroup>();
  for (const row of [...rows].sort((left, right) =>
    left.name.localeCompare(right.name)
  )) {
    const value = normalizeDirectoryFilter(row.name);
    const existing = groups.get(value);
    if (existing) {
      existing.ids.push(row.id);
    } else {
      groups.set(value, { ids: [row.id], name: row.name.trim(), value });
    }
  }
  return [...groups.values()];
}

export const directoryRouter = router({
  classes: publicProcedure
    .input(directoryClassFiltersSchema)
    .query(async ({ ctx, input }): Promise<DirectoryClassesPayload> => {
      const eligible = inArray(masterClass.status, [
        ...DIRECTORY_CLASS_STATUSES,
      ]);

      const [martialArtRows, locationRows] = await Promise.all([
        ctx.db
          .select({ id: masterMartialArt.id, name: masterMartialArt.name })
          .from(masterClass)
          .innerJoin(
            masterMartialArt,
            eq(masterClass.martialArtId, masterMartialArt.id)
          )
          .where(eligible)
          .groupBy(masterMartialArt.id, masterMartialArt.name),
        ctx.db
          .select({ id: masterLocation.id, name: masterLocation.name })
          .from(masterClass)
          .innerJoin(
            masterLocation,
            eq(masterClass.locationId, masterLocation.id)
          )
          .where(eligible)
          .groupBy(masterLocation.id, masterLocation.name),
      ]);
      const martialArts = groupFilterOptions(martialArtRows);
      const locations = groupFilterOptions(locationRows);

      const martialArt = input?.martialArt ?? null;
      const location = input?.location ?? null;
      const martialArtIds = martialArt
        ? (martialArts.find((item) => item.value === martialArt)?.ids ?? [])
        : null;
      const locationIds = location
        ? (locations.find((item) => item.value === location)?.ids ?? [])
        : null;

      const rows = await ctx.db.query.masterClass.findMany({
        where: {
          status: { in: [...DIRECTORY_CLASS_STATUSES] },
          ...(martialArtIds ? { martialArtId: { in: martialArtIds } } : {}),
          ...(locationIds ? { locationId: { in: locationIds } } : {}),
          ...(input?.audience ? { audience: input.audience } : {}),
        },
        with: {
          location: true,
          martialArt: true,
          profile: { columns: { displayName: true } },
          schedules: true,
        },
      });

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

      return {
        classes,
        locations: locations.map(({ name, value }) => ({ name, value })),
        martialArts: martialArts.map(({ name, value }) => ({ name, value })),
      };
    }),
});
