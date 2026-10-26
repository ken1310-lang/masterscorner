import type { Database } from "@my-better-t-app/db";
import { proSite } from "@my-better-t-app/db/schema/pro-site";
import {
  DEFAULT_PRO_SITE_STYLE,
  type ProSiteStyle,
} from "@my-better-t-app/db/schema/pro-site-kinds";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

import {
  directoryMasterProfileInputSchema,
  masterProfileSlug,
  profileIdFromSlug,
} from "../directory";
import { protectedProcedure, publicProcedure, router } from "../index";
import {
  effectiveSiteName,
  type ProSitePayload,
  type ProSiteStatus,
  proSiteAddress,
  saveProSiteSettingsInputSchema,
  setProSitePublishedInputSchema,
} from "../pro-site";
import { loadPublicMasterProfile } from "../public-profile";

interface ProSitePublication {
  publishedAt: Date | null;
  siteName: string | null;
  style: ProSiteStyle;
}

const PRECONDITION_MESSAGE =
  "Create your master profile before changing the Pro Site.";

async function publicationFor(
  db: Database,
  profileId: string
): Promise<ProSitePublication | null> {
  const rows = await db
    .select({
      publishedAt: proSite.publishedAt,
      siteName: proSite.siteName,
      style: proSite.style,
    })
    .from(proSite)
    .where(eq(proSite.profileId, profileId))
    .limit(1);
  return rows[0] ?? null;
}

async function payloadFor(
  db: Database,
  profileId: string,
  publicUrl: (key: string) => string,
  publication: ProSitePublication | null
): Promise<ProSitePayload | null> {
  const loaded = await loadPublicMasterProfile(db, profileId, publicUrl);
  if (!loaded) {
    return null;
  }
  return {
    ...loaded.profile,
    logoUrl: loaded.logoUrl,
    siteName: effectiveSiteName(
      loaded.profile.displayName,
      publication?.siteName ?? null
    ),
    style: publication?.style ?? DEFAULT_PRO_SITE_STYLE,
  };
}

async function statusFor(
  db: Database,
  userId: string,
  publicUrl: (key: string) => string
): Promise<ProSiteStatus | null> {
  const profile = await db.query.masterProfile.findFirst({
    where: { userId },
    columns: { displayName: true, id: true },
  });
  if (!profile) {
    return null;
  }

  const publication = await publicationFor(db, profile.id);
  const payload = await payloadFor(db, profile.id, publicUrl, publication);
  if (!payload) {
    return null;
  }

  return {
    address: proSiteAddress(masterProfileSlug(profile.displayName, profile.id)),
    displayName: profile.displayName,
    published: Boolean(publication?.publishedAt),
    siteName: publication?.siteName ?? null,
    style: publication?.style ?? DEFAULT_PRO_SITE_STYLE,
    sync: {
      bio: Boolean(payload.introduction?.trim()),
      classes: payload.classes.length > 0,
      locations: payload.locations.length > 0,
      media: Boolean(payload.photoUrl || payload.logoUrl),
      schedule: payload.classes.some((item) => item.schedules.length > 0),
    },
  };
}

async function requireProfile(db: Database, userId: string) {
  const profile = await db.query.masterProfile.findFirst({
    where: { userId },
    columns: { id: true },
  });
  if (!profile) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: PRECONDITION_MESSAGE,
    });
  }
  return profile;
}

async function statusAfterWrite(
  db: Database,
  userId: string,
  publicUrl: (key: string) => string
) {
  const status = await statusFor(db, userId, publicUrl);
  if (!status) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: PRECONDITION_MESSAGE,
    });
  }
  return status;
}

export const proSiteRouter = router({
  bySlug: publicProcedure
    .input(directoryMasterProfileInputSchema)
    .query(async ({ ctx, input }): Promise<ProSitePayload | null> => {
      const profileId = profileIdFromSlug(input.slug);
      if (!profileId) {
        return null;
      }

      const publication = await publicationFor(ctx.db, profileId);
      if (!publication?.publishedAt) {
        return null;
      }

      return payloadFor(
        ctx.db,
        profileId,
        ctx.mediaStorage.publicUrl,
        publication
      );
    }),

  preview: protectedProcedure.query(
    async ({ ctx }): Promise<ProSitePayload | null> => {
      const profile = await ctx.db.query.masterProfile.findFirst({
        where: { userId: ctx.session.user.id },
        columns: { id: true },
      });
      if (!profile) {
        return null;
      }
      return payloadFor(
        ctx.db,
        profile.id,
        ctx.mediaStorage.publicUrl,
        await publicationFor(ctx.db, profile.id)
      );
    }
  ),

  saveSettings: protectedProcedure
    .input(saveProSiteSettingsInputSchema)
    .mutation(async ({ ctx, input }): Promise<ProSiteStatus> => {
      const userId = ctx.session.user.id;
      const profile = await requireProfile(ctx.db, userId);
      const updatedAt = new Date();

      await ctx.db
        .insert(proSite)
        .values({
          profileId: profile.id,
          siteName: input.siteName,
          style: input.style,
        })
        .onConflictDoUpdate({
          target: proSite.profileId,
          set: {
            siteName: input.siteName,
            style: input.style,
            updatedAt,
          },
        });

      return statusAfterWrite(ctx.db, userId, ctx.mediaStorage.publicUrl);
    }),

  setPublished: protectedProcedure
    .input(setProSitePublishedInputSchema)
    .mutation(async ({ ctx, input }): Promise<ProSiteStatus> => {
      const userId = ctx.session.user.id;
      const profile = await requireProfile(ctx.db, userId);
      const updatedAt = new Date();

      if (input.published) {
        await ctx.db
          .insert(proSite)
          .values({
            profileId: profile.id,
            publishedAt: updatedAt,
          })
          .onConflictDoUpdate({
            target: proSite.profileId,
            set: { publishedAt: updatedAt, updatedAt },
          });
      } else {
        await ctx.db
          .update(proSite)
          .set({ publishedAt: null, updatedAt })
          .where(eq(proSite.profileId, profile.id));
      }

      return statusAfterWrite(ctx.db, userId, ctx.mediaStorage.publicUrl);
    }),

  status: protectedProcedure.query(
    async ({ ctx }): Promise<ProSiteStatus | null> =>
      statusFor(ctx.db, ctx.session.user.id, ctx.mediaStorage.publicUrl)
  ),
});
