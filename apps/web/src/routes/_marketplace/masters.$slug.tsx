import { createFileRoute } from "@tanstack/react-router";

import { MasterProfileScreen } from "@/components/masters/profile-screen";

export const Route = createFileRoute("/_marketplace/masters/$slug")({
  component: MasterProfileRoute,
  head: () => ({
    meta: [
      { title: "Master profile · MastersCorner" },
      {
        name: "description",
        content:
          "Read a martial-arts master's public profile, current classes and weekly schedule.",
      },
    ],
  }),
});

function MasterProfileRoute() {
  const { slug } = Route.useParams();
  return <MasterProfileScreen slug={slug} />;
}
