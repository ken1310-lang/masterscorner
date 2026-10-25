/**
 * Supported Pro Site styles shared by the database schema, API validation and
 * the browser bundle. Keep this module dependency-free so importing the enum
 * does not pull Drizzle into client code.
 */
export const PRO_SITE_STYLES = ["ochre", "terracotta", "sage"] as const;
export type ProSiteStyle = (typeof PRO_SITE_STYLES)[number];
export const DEFAULT_PRO_SITE_STYLE: ProSiteStyle = "ochre";
