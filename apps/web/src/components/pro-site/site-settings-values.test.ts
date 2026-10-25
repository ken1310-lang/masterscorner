import { describe, expect, test } from "bun:test";

import { siteSettingsFormValues } from "./site-settings-values";

describe("site settings form values", () => {
  test("keeps a missing brand override blank", () => {
    expect(siteSettingsFormValues({ siteName: null, style: "ochre" })).toEqual({
      siteName: "",
      style: "ochre",
    });
  });

  test("trims a stored brand override and keeps its style", () => {
    expect(
      siteSettingsFormValues({ siteName: "  Veeram Silambam  ", style: "sage" })
    ).toEqual({ siteName: "Veeram Silambam", style: "sage" });
  });

  test("treats a legacy blank override as missing", () => {
    expect(
      siteSettingsFormValues({ siteName: "   ", style: "terracotta" })
    ).toEqual({ siteName: "", style: "terracotta" });
  });
});
