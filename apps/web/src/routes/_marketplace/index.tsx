import { createFileRoute } from "@tanstack/react-router";

import { HomeScreen } from "@/components/home/home-screen";

export const Route = createFileRoute("/_marketplace/")({
  component: HomeScreen,
  head: () => ({
    meta: [
      { title: "MastersCorner · Martial arts network" },
      {
        name: "description",
        content:
          "Discover martial-arts masters, current classes and training locations across India.",
      },
    ],
  }),
});
