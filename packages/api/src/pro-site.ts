import {
  PRO_SITE_STYLES,
  type ProSiteStyle,
} from "@my-better-t-app/db/schema/pro-site-kinds";
import { z } from "zod";

import type { DirectoryMasterProfilePayload } from "./directory";

export {
  DEFAULT_PRO_SITE_STYLE,
  PRO_SITE_STYLES,
  type ProSiteStyle,
} from "@my-better-t-app/db/schema/pro-site-kinds";

export const MAX_PRO_SITE_NAME = 80;

export interface ProSitePayload extends DirectoryMasterProfilePayload {
  /** Current site_logo URL, or null. */
  logoUrl: string | null;
  /** Stored site name, or the master's display name fallback. */
  siteName: string;
  style: ProSiteStyle;
}

export interface ProSiteSyncStatus {
  bio: boolean;
  classes: boolean;
  locations: boolean;
  media: boolean;
  schedule: boolean;
}

export interface ProSiteStatus {
  /** The address that is live, currently `/pro/{slug}`. */
  address: string;
  /** Profile-name fallback for the site-name field. */
  displayName: string;
  published: boolean;
  /** Stored override, or null when the profile name is used. */
  siteName: string | null;
  style: ProSiteStyle;
  sync: ProSiteSyncStatus;
}

export interface ProSiteSectionVisibility {
  about: boolean;
  contact: boolean;
  programs: boolean;
  schedule: boolean;
}

export const saveProSiteSettingsInputSchema = z.object({
  siteName: z
    .string()
    .trim()
    .max(
      MAX_PRO_SITE_NAME,
      `Site name must be ${MAX_PRO_SITE_NAME} characters or fewer`
    )
    .nullable()
    .transform((value) => value || null),
  style: z.enum(PRO_SITE_STYLES),
});

export const setProSitePublishedInputSchema = z.object({
  published: z.boolean(),
});

export type SaveProSiteSettingsInput = z.infer<
  typeof saveProSiteSettingsInputSchema
>;
export type SetProSitePublishedInput = z.infer<
  typeof setProSitePublishedInputSchema
>;

/** Stored null/blank names fall back to the master's profile name. */
export function effectiveSiteName(
  displayName: string,
  siteName: string | null
) {
  return siteName?.trim() || displayName;
}

/** Path address until the zone and wildcard certificate exist (ADR-004). */
export function proSiteAddress(slug: string) {
  return `/pro/${slug}`;
}

/**
 * A section exists only when it has stored content. The header nav, section
 * heading and body all key off this one result, so an absent section leaves no
 * anchor or gap.
 */
export function visibleProSiteSections(
  site: Pick<
    ProSitePayload,
    "classes" | "homeCity" | "introduction" | "locations"
  >
): ProSiteSectionVisibility {
  return {
    about: Boolean(site.introduction?.trim()),
    contact: Boolean(site.homeCity?.trim()) || site.locations.length > 0,
    programs: site.classes.length > 0,
    schedule: site.classes.some((item) => item.schedules.length > 0),
  };
}
