import { createFileRoute } from "@tanstack/react-router";

import { ProSiteScreen } from "@/components/pro-site/pro-site-screen";

export const Route = createFileRoute("/pro/$slug")({
  component: ProSiteRoute,
  head: () => ({
    meta: [
      { title: "Pro Site · MastersCorner" },
      {
        name: "description",
        content:
          "A martial-arts master's standalone Pro Site, generated from their profile and current classes.",
      },
    ],
  }),
});

function ProSiteRoute() {
  const { slug } = Route.useParams();
  return <ProSiteScreen slug={slug} />;
}
