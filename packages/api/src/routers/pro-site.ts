import { proSite } from "@my-better-t-app/db/schema/pro-site";
import { and, eq, isNotNull } from "drizzle-orm";

import {
  directoryMasterProfileInputSchema,
  masterProfileSlug,
  profileIdFromSlug,
} from "../directory";
import { protectedProcedure, publicProcedure, router } from "../index";
import {
  type ProSitePayload,
  type ProSiteStatus,
  proSiteAddress,
} from "../pro-site";
import { loadPublicMasterProfile } from "../public-profile";

export const proSiteRouter = router({
  bySlug: publicProcedure
    .input(directoryMasterProfileInputSchema)
    .query(async ({ ctx, input }): Promise<ProSitePayload | null> => {
      const profileId = profileIdFromSlug(input.slug);
      if (!profileId) {
        return null;
      }

      const publication = await ctx.db
        .select({ profileId: proSite.profileId })
        .from(proSite)
        .where(
          and(eq(proSite.profileId, profileId), isNotNull(proSite.publishedAt))
        )
        .limit(1);
      if (publication.length === 0) {
        return null;
      }

      const loaded = await loadPublicMasterProfile(
        ctx.db,
        profileId,
        ctx.mediaStorage.publicUrl
      );
      return loaded ? { ...loaded.profile, logoUrl: loaded.logoUrl } : null;
    }),

  status: protectedProcedure.query(
    async ({ ctx }): Promise<ProSiteStatus | null> => {
      const profile = await ctx.db.query.masterProfile.findFirst({
        where: { userId: ctx.session.user.id },
        columns: { displayName: true, id: true },
      });
      if (!profile) {
        return null;
      }

      const publication = await ctx.db
        .select({ publishedAt: proSite.publishedAt })
        .from(proSite)
        .where(eq(proSite.profileId, profile.id))
        .limit(1);

      return {
        address: proSiteAddress(
          masterProfileSlug(profile.displayName, profile.id)
        ),
        published: Boolean(publication[0]?.publishedAt),
      };
    }
  ),
});
