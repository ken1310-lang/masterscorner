import type { Database } from "@my-better-t-app/db";

import { toTimeInput } from "./classes";
import {
  DIRECTORY_CLASS_STATUSES,
  type DirectoryMasterClassView,
  type DirectoryMasterProfilePayload,
  masterProfileSlug,
} from "./directory";
import { toMediaViews } from "./media";

export interface LoadedPublicMasterProfile {
  /** Current site_logo URL, or null. */
  logoUrl: string | null;
  profile: DirectoryMasterProfilePayload;
}

/**
 * The public profile read shared by the directory profile and the Pro Site.
 * Keeping one loader means both surfaces apply the same class-status,
 * ordering, schedule and media rules.
 */
export async function loadPublicMasterProfile(
  db: Database,
  profileId: string,
  publicUrl: (key: string) => string
): Promise<LoadedPublicMasterProfile | null> {
  const profile = await db.query.masterProfile.findFirst({
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

  const classRows = await db.query.masterClass.findMany({
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
        left.name.localeCompare(right.name) || left.id.localeCompare(right.id)
    );

  const media = toMediaViews(profile.media, publicUrl);
  const photo = media.find((item) => item.kind === "profile_photo");
  const logo = media.find((item) => item.kind === "site_logo");

  return {
    logoUrl: logo?.url ?? null,
    profile: {
      classes,
      displayName: profile.displayName,
      homeCity: profile.homeCity,
      introduction: profile.introduction,
      locations: profile.locations.map(({ id, name }) => ({ id, name })),
      martialArts: profile.martialArts.map(({ name }) => name),
      photoUrl: photo?.url ?? null,
      slug: masterProfileSlug(profile.displayName, profile.id),
      yearsTeaching: profile.yearsTeaching,
    },
  };
}
