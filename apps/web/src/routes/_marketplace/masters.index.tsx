import { CLASS_AUDIENCES } from "@my-better-t-app/api/classes";
import {
  directoryLocationFilterSchema,
  directoryMartialArtFilterSchema,
} from "@my-better-t-app/api/directory";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

import {
  type RegistryFilterChange,
  RegistryScreen,
} from "@/components/masters/registry-screen";

const artFilter = directoryMartialArtFilterSchema.optional().catch(undefined);
const locationFilter = directoryLocationFilterSchema
  .optional()
  .catch(undefined);
const pageFilter = z.coerce.number().int().min(1).optional().catch(undefined);

const mastersSearchSchema = z.object({
  art: artFilter,
  audience: z.enum(CLASS_AUDIENCES).optional().catch(undefined),
  location: locationFilter,
  page: pageFilter,
});

export const Route = createFileRoute("/_marketplace/masters/")({
  component: MastersRoute,
  head: () => ({
    meta: [
      { title: "Masters · MastersCorner" },
      {
        name: "description",
        content:
          "Discover martial-arts masters by discipline, location and audience.",
      },
    ],
  }),
  validateSearch: mastersSearchSchema,
});

function MastersRoute() {
  const filters = Route.useSearch();
  const navigate = useNavigate({ from: "/masters/" });

  const updateFilters = useCallback(
    (next: RegistryFilterChange) => {
      navigate({ search: (previous) => ({ ...previous, ...next, page: 1 }) });
    },
    [navigate]
  );
  const clearFilters = useCallback(() => {
    navigate({ search: {} });
  }, [navigate]);
  const changePage = useCallback(
    (page: number) => {
      navigate({ search: (previous) => ({ ...previous, page }) });
    },
    [navigate]
  );

  return (
    <RegistryScreen
      filters={filters}
      onClear={clearFilters}
      onFilterChange={updateFilters}
      onPageChange={changePage}
    />
  );
}
