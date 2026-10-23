import { CLASS_AUDIENCES } from "@my-better-t-app/api/classes";
import {
  directoryLocationFilterSchema,
  directoryMartialArtFilterSchema,
} from "@my-better-t-app/api/directory";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

import {
  type DirectoryFilters,
  DirectoryScreen,
} from "@/components/classes/directory-screen";

const artFilter = directoryMartialArtFilterSchema.optional().catch(undefined);
const locationFilter = directoryLocationFilterSchema
  .optional()
  .catch(undefined);

const directorySearchSchema = z.object({
  art: artFilter,
  audience: z.enum(CLASS_AUDIENCES).optional().catch(undefined),
  location: locationFilter,
});

export const Route = createFileRoute("/_marketplace/classes")({
  component: ClassesRoute,
  head: () => ({
    meta: [
      { title: "Classes · MastersCorner" },
      {
        name: "description",
        content:
          "Browse martial-arts classes by discipline, location and audience.",
      },
    ],
  }),
  validateSearch: directorySearchSchema,
});

function ClassesRoute() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: "/classes" });

  const updateFilters = useCallback(
    (next: DirectoryFilters) => {
      navigate({ search: (previous) => ({ ...previous, ...next }) });
    },
    [navigate]
  );
  const clearFilters = useCallback(() => {
    navigate({ search: {} });
  }, [navigate]);

  return (
    <DirectoryScreen
      filters={filters}
      onClear={clearFilters}
      onFilterChange={updateFilters}
    />
  );
}
