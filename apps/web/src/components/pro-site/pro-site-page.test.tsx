import { describe, expect, test } from "bun:test";
import type { DirectoryMasterClassView } from "@my-better-t-app/api/directory";
import type { ProSitePayload } from "@my-better-t-app/api/pro-site";
import { renderToStaticMarkup } from "react-dom/server";

import { ProSitePage } from "./pro-site-page";

const ADYAR = { id: "location-adyar", name: "Adyar" };
const VELACHERY = { id: "location-velachery", name: "Velachery" };
const SILAMBAM = { id: "art-silambam", name: "Silambam" };

const CLASS_AT_ADYAR: DirectoryMasterClassView = {
  audience: "all",
  feeAmount: null,
  feePeriod: null,
  id: "class-1",
  level: "all",
  location: ADYAR,
  martialArt: SILAMBAM,
  name: "Silambam Foundation",
  schedules: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:00" }],
  status: "active",
};

function site(overrides: Partial<ProSitePayload>): ProSitePayload {
  return {
    classes: [],
    displayName: "Audit Master",
    homeCity: null,
    introduction: null,
    locations: [],
    logoUrl: null,
    martialArts: [SILAMBAM.name],
    photoUrl: null,
    siteName: "Audit Master",
    slug: "audit-master-profile-id",
    style: "ochre",
    yearsTeaching: null,
    ...overrides,
  };
}

const noop = () => undefined;

function renderContact(overrides: Partial<ProSitePayload>) {
  return renderToStaticMarkup(
    <ProSitePage onRetry={noop} refreshError={false} site={site(overrides)} />
  );
}

describe("Pro Site contact", () => {
  test("labels stored locations without claiming current classes", () => {
    const html = renderContact({
      classes: [CLASS_AT_ADYAR],
      homeCity: "Chennai",
      locations: [ADYAR, VELACHERY],
    });

    expect(html).toContain("Teaching locations:");
    expect(html).toContain("Adyar, Velachery");
    expect(html).not.toContain("Classes run at");
  });

  test("preserves the location-only contact state", () => {
    const html = renderContact({ locations: [VELACHERY] });

    expect(html).toContain('id="contact"');
    expect(html).toContain("Teaching locations:");
    expect(html).toContain("Velachery");
    expect(html).not.toContain("See the weekly schedule");
  });

  test("preserves the city-only contact state", () => {
    const html = renderContact({ homeCity: "Chennai" });

    expect(html).toContain('id="contact"');
    expect(html).toContain("Based in Chennai.");
    expect(html).not.toContain("Teaching locations:");
  });
});

describe("Pro Site branding", () => {
  test("uses the site name in brand chrome and applies the selected style", () => {
    const html = renderContact({
      displayName: "Arun Vel",
      siteName: "Veeram Silambam",
      style: "terracotta",
    });

    expect(html).toContain('data-style="terracotta"');
    expect(html).toContain("Veeram Silambam");
    expect(html).toContain("Arun Vel");
  });
});
