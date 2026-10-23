import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { nextSessionRefetchInterval } from "@/components/classes/directory-values";
import { useTRPC } from "@/utils/trpc";

import { HomeClassesSection } from "./classes-section";
import { HomeHero } from "./hero";
import { HomeMasterCta } from "./master-cta";
import { HomeMastersSection } from "./masters-section";
import type { HomeSearchFilters } from "./search-bar";

export function HomeScreen() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const mastersQuery = useQuery(
    trpc.directory.masters.queryOptions({ page: 1 })
  );
  const classesQuery = useQuery({
    ...trpc.directory.classes.queryOptions(),
    refetchInterval: (query) =>
      query.state.status === "error"
        ? false
        : nextSessionRefetchInterval(query.state.data),
  });

  const handleSearch = useCallback(
    (filters: HomeSearchFilters) => {
      navigate({ search: filters, to: "/masters" });
    },
    [navigate]
  );

  return (
    <>
      <HomeHero
        locations={mastersQuery.data?.locations ?? []}
        martialArts={mastersQuery.data?.martialArts ?? []}
        onSearch={handleSearch}
      />
      <HomeMastersSection
        isError={mastersQuery.isError}
        masters={mastersQuery.data?.masters}
        onRetry={mastersQuery.refetch}
      />
      <HomeClassesSection
        classes={classesQuery.data?.classes}
        isError={classesQuery.isError}
        onRetry={classesQuery.refetch}
      />
      <HomeMasterCta />
    </>
  );
}
