import type { Database } from "@my-better-t-app/db";
import { masterClass } from "@my-better-t-app/db/schema/classes";
import {
  masterLocation,
  masterMartialArt,
  masterProfile,
  media,
} from "@my-better-t-app/db/schema/master";
import {
  and,
  asc,
  count,
  eq,
  exists,
  inArray,
  type SQL,
  sql,
} from "drizzle-orm";

import { CLASS_AUDIENCES, type ClassAudience, toTimeInput } from "../classes";
import {
  DIRECTORY_CLASS_STATUSES,
  DIRECTORY_MASTER_PAGE_SIZE,
  type DirectoryClassesPayload,
  type DirectoryFilterOption,
  type DirectoryMasterClassView,
  type DirectoryMasterProfilePayload,
  type DirectoryMastersPayload,
  type DirectoryMasterView,
  directoryClassFiltersSchema,
  directoryMasterFiltersSchema,
  directoryMasterProfileInputSchema,
  masterProfileSlug,
  nextSessionStart,
  normalizeDirectoryFilter,
  profileIdFromSlug,
} from "../directory";
import { publicProcedure, router } from "../index";
import { toMediaViews } from "../media";

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

async function profilePhotoUrls(
  db: Database,
  ids: readonly string[],
  publicUrl: (key: string) => string
) {
  const urls = new Map<string, string>();
  if (ids.length === 0) {
    return urls;
  }
  const rows = await db
    .select({
      createdAt: media.createdAt,
      id: media.id,
      kind: media.kind,
      objectKey: media.objectKey,
      profileId: media.profileId,
    })
    .from(media)
    .where(inArray(media.profileId, [...ids]));

  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const values = grouped.get(row.profileId) ?? [];
    values.push(row);
    grouped.set(row.profileId, values);
  }
  for (const [profileId, profileMedia] of grouped) {
    const photo = toMediaViews(profileMedia, publicUrl).find(
      (item) => item.kind === "profile_photo"
    );
    if (photo) {
      urls.set(profileId, photo.url);
    }
  }
  return urls;
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
  masters: publicProcedure
    .input(directoryMasterFiltersSchema)
    .query(async ({ ctx, input }): Promise<DirectoryMastersPayload> => {
      const [martialArtRows, locationRows] = await Promise.all([
        ctx.db
          .select({ id: masterMartialArt.id, name: masterMartialArt.name })
          .from(masterMartialArt)
          .groupBy(masterMartialArt.id, masterMartialArt.name),
        ctx.db
          .select({ id: masterLocation.id, name: masterLocation.name })
          .from(masterLocation)
          .groupBy(masterLocation.id, masterLocation.name),
      ]);
      const martialArts = groupFilterOptions(martialArtRows);
      const locations = groupFilterOptions(locationRows);

      const conditions: SQL[] = [];
      if (input?.martialArt) {
        const ids =
          martialArts.find((item) => item.value === input.martialArt)?.ids ??
          [];
        conditions.push(
          ids.length
            ? exists(
                ctx.db
                  .select({ id: masterMartialArt.id })
                  .from(masterMartialArt)
                  .where(
                    and(
                      eq(masterMartialArt.profileId, masterProfile.id),
                      inArray(masterMartialArt.id, ids)
                    )
                  )
              )
            : sql`false`
        );
      }
      if (input?.location) {
        const ids =
          locations.find((item) => item.value === input.location)?.ids ?? [];
        conditions.push(
          ids.length
            ? exists(
                ctx.db
                  .select({ id: masterLocation.id })
                  .from(masterLocation)
                  .where(
                    and(
                      eq(masterLocation.profileId, masterProfile.id),
                      inArray(masterLocation.id, ids)
                    )
                  )
              )
            : sql`false`
        );
      }
      if (input?.audience) {
        conditions.push(
          exists(
            ctx.db
              .select({ id: masterClass.id })
              .from(masterClass)
              .where(
                and(
                  eq(masterClass.profileId, masterProfile.id),
                  inArray(masterClass.status, [...DIRECTORY_CLASS_STATUSES]),
                  eq(masterClass.audience, input.audience)
                )
              )
          )
        );
      }

      const where = and(...conditions);
      const countRows = await ctx.db
        .select({ value: count() })
        .from(masterProfile)
        .where(where);
      const total = countRows[0]?.value ?? 0;
      const totalPages = Math.ceil(total / DIRECTORY_MASTER_PAGE_SIZE);
      const page =
        totalPages === 0 ? 1 : Math.min(input?.page ?? 1, totalPages);

      const rows = await ctx.db
        .select({
          displayName: masterProfile.displayName,
          homeCity: masterProfile.homeCity,
          id: masterProfile.id,
          yearsTeaching: masterProfile.yearsTeaching,
        })
        .from(masterProfile)
        .where(where)
        .orderBy(
          sql`${masterProfile.yearsTeaching} desc nulls last`,
          asc(masterProfile.displayName),
          asc(masterProfile.id)
        )
        .limit(DIRECTORY_MASTER_PAGE_SIZE)
        .offset((page - 1) * DIRECTORY_MASTER_PAGE_SIZE);

      const ids = rows.map((row) => row.id);
      const [artRows, audienceRows, photoUrls] = ids.length
        ? await Promise.all([
            ctx.db
              .select({
                name: masterMartialArt.name,
                profileId: masterMartialArt.profileId,
              })
              .from(masterMartialArt)
              .where(inArray(masterMartialArt.profileId, ids))
              .orderBy(
                asc(masterMartialArt.profileId),
                asc(masterMartialArt.position)
              ),
            ctx.db
              .selectDistinct({
                audience: masterClass.audience,
                profileId: masterClass.profileId,
              })
              .from(masterClass)
              .where(
                and(
                  inArray(masterClass.profileId, ids),
                  inArray(masterClass.status, [...DIRECTORY_CLASS_STATUSES])
                )
              )
              .orderBy(asc(masterClass.profileId), asc(masterClass.audience)),
            profilePhotoUrls(ctx.db, ids, ctx.mediaStorage.publicUrl),
          ])
        : [[], [], new Map<string, string>()];

      const artNames = new Map<string, string[]>();
      for (const row of artRows) {
        const names = artNames.get(row.profileId) ?? [];
        names.push(row.name);
        artNames.set(row.profileId, names);
      }
      const audienceOrder = new Map(
        CLASS_AUDIENCES.map((audience, index) => [audience, index])
      );
      const audiences = new Map<string, ClassAudience[]>();
      for (const row of audienceRows) {
        const values = audiences.get(row.profileId) ?? [];
        values.push(row.audience);
        audiences.set(row.profileId, values);
      }
      for (const values of audiences.values()) {
        values.sort(
          (left, right) =>
            (audienceOrder.get(left) ?? 0) - (audienceOrder.get(right) ?? 0)
        );
      }

      const masters: DirectoryMasterView[] = rows.map((row) => ({
        audiences: audiences.get(row.id) ?? [],
        city: row.homeCity,
        displayName: row.displayName,
        id: row.id,
        martialArts: artNames.get(row.id) ?? [],
        photoUrl: photoUrls.get(row.id) ?? null,
        slug: masterProfileSlug(row.displayName, row.id),
        yearsTeaching: row.yearsTeaching,
      }));

      return {
        locations: locations.map(({ name, value }) => ({ name, value })),
        martialArts: martialArts.map(({ name, value }) => ({ name, value })),
        masters,
        page,
        pageSize: DIRECTORY_MASTER_PAGE_SIZE,
        total,
        totalPages,
      };
    }),
  masterProfile: publicProcedure
    .input(directoryMasterProfileInputSchema)
    .query(
      async ({ ctx, input }): Promise<DirectoryMasterProfilePayload | null> => {
        const profileId = profileIdFromSlug(input.slug);
        if (!profileId) {
          return null;
        }

        const profile = await ctx.db.query.masterProfile.findFirst({
          where: { id: profileId },
          with: {
            locations: { orderBy: { position: "asc" } },
            martialArts: { orderBy: { position: "asc" } },
            media: { orderBy: { createdAt: "desc" } },
          },
        });
        if (!profile) {
          return null;
        }

        const classRows = await ctx.db.query.masterClass.findMany({
          where: {
            profileId: profile.id,
            status: { in: [...DIRECTORY_CLASS_STATUSES] },
          },
          with: {
            location: true,
            martialArt: true,
            schedules: true,
          },
        });

        const classes: DirectoryMasterClassView[] = classRows
          .flatMap((row) => {
            if (row.status !== "active" && row.status !== "full") {
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
                name: row.name,
                schedules: [...row.schedules]
                  .sort(
                    (left, right) =>
                      left.dayOfWeek - right.dayOfWeek ||
                      left.startTime.localeCompare(right.startTime)
                  )
                  .map((schedule) => ({
                    dayOfWeek: schedule.dayOfWeek,
                    endTime: toTimeInput(schedule.endTime),
                    startTime: toTimeInput(schedule.startTime),
                  })),
                status: row.status,
              },
            ];
          })
          .sort(
            (left, right) =>
              left.name.localeCompare(right.name) ||
              left.id.localeCompare(right.id)
          );

        const photo = toMediaViews(
          profile.media,
          ctx.mediaStorage.publicUrl
        ).find((item) => item.kind === "profile_photo");

        return {
          classes,
          displayName: profile.displayName,
          homeCity: profile.homeCity,
          introduction: profile.introduction,
          locations: profile.locations.map(({ id, name }) => ({ id, name })),
          martialArts: profile.martialArts.map(({ name }) => name),
          photoUrl: photo?.url ?? null,
          slug: masterProfileSlug(profile.displayName, profile.id),
          yearsTeaching: profile.yearsTeaching,
        };
      }
    ),
});
