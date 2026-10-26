import type {
  ProSiteStatus,
  ProSiteStyle,
} from "@my-better-t-app/api/pro-site";

export interface SiteSettingsFormValues {
  siteName: string;
  style: ProSiteStyle;
}

/**
 * A missing override stays blank in the form. Showing the profile name as the
 * value would pin it as an explicit brand on a style-only save.
 */
export function siteSettingsFormValues(
  status: Pick<ProSiteStatus, "siteName" | "style">
): SiteSettingsFormValues {
  return {
    siteName: status.siteName?.trim() || "",
    style: status.style,
  };
}
