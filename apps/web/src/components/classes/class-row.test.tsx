import { expect, test } from "bun:test";

import type { DirectoryClassView } from "@my-better-t-app/api/directory";
import { renderToStaticMarkup } from "react-dom/server";

import { ClassRow } from "./class-row";

const base: DirectoryClassView = {
  audience: "all",
  feeAmount: null,
  feePeriod: null,
  id: "6e8e3f5e-3d1e-4d0e-9a1f-2c3b4a5d6e7f",
  level: "all",
  location: { id: "location", name: "Nanganallur" },
  martialArt: { id: "art", name: "Silambam" },
  master: { displayName: "Audit Master" },
  name: "Silambam Foundations",
  nextSessionAt: "2026-10-26T12:30:00.000Z",
  status: "active",
};

test("omits a fee when the class has no stored fee", () => {
  const html = renderToStaticMarkup(<ClassRow item={base} />);

  expect(html).not.toContain("Not listed");
  expect(html).not.toContain("Not set");
  expect(html).not.toContain("₹");
});

test("renders a stored fee", () => {
  const html = renderToStaticMarkup(
    <ClassRow item={{ ...base, feeAmount: 1500, feePeriod: "month" }} />
  );

  expect(html).toContain("₹1,500/month");
});
