import { CLASS_AUDIENCES } from "@my-better-t-app/api/classes";
import { normalizeDirectoryFilter } from "@my-better-t-app/api/directory";
import {
  MAX_LOCATION_NAME,
  MAX_MARTIAL_ART_NAME,
} from "@my-better-t-app/api/master-profile";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

import {
  type DirectoryFilters,
  DirectoryScreen,
} from "@/components/classes/directory-screen";

const searchFilter = z.string().trim().min(1);
const artFilter = searchFilter
  .max(MAX_MARTIAL_ART_NAME)
  .transform(normalizeDirectoryFilter)
  .optional()
  .catch(undefined);
const locationFilter = searchFilter
  .max(MAX_LOCATION_NAME)
  .transform(normalizeDirectoryFilter)
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
