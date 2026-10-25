import type { DirectoryMasterProfilePayload } from "./directory";

export interface ProSitePayload extends DirectoryMasterProfilePayload {
  /** Current site_logo URL, or null. */
  logoUrl: string | null;
}

export interface ProSiteStatus {
  /** The address that is live, currently `/pro/{slug}`. */
  address: string;
  published: boolean;
}

export interface ProSiteSectionVisibility {
  about: boolean;
  contact: boolean;
  programs: boolean;
  schedule: boolean;
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
