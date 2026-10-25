import {
  CLASS_AUDIENCES,
  type ClassAudience,
} from "@my-better-t-app/api/classes";
import type {
  DirectoryClassesPayload,
  DirectoryClassView,
} from "@my-better-t-app/api/directory";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useCallback } from "react";

import { MarketplacePageHero } from "@/components/marketplace/page-hero";
import { RedesignContainer } from "@/components/shell/container";
import { useTRPC } from "@/utils/trpc";

import { ClassRow } from "./class-row";
import { AUDIENCE_LABELS } from "./class-values";
import { nextSessionRefetchInterval } from "./directory-values";

export interface DirectoryFilters {
  art?: string;
  audience?: ClassAudience;
  location?: string;
}

interface DirectoryScreenProps {
  filters: DirectoryFilters;
  onClear: () => void;
  onFilterChange: (next: DirectoryFilters) => void;
}

const SKELETON_ROWS = ["one", "two", "three", "four", "five"] as const;

function filterNames(
  payload: DirectoryClassesPayload | undefined,
  filters: DirectoryFilters
) {
  return [
    filters.art
      ? (payload?.martialArts.find((item) => item.value === filters.art)
          ?.name ?? "selected martial art")
      : null,
    filters.location
      ? (payload?.locations.find((item) => item.value === filters.location)
          ?.name ?? "selected location")
      : null,
    filters.audience ? AUDIENCE_LABELS[filters.audience] : null,
  ].filter((name): name is string => name !== null);
}

function DirectorySkeleton() {
  return (
    <div aria-busy="true" role="status">
      <span className="sr-only">Loading classes</span>
      {SKELETON_ROWS.map((row) => (
        <div
          className="h-20 animate-pulse border-hairline border-b bg-sand motion-reduce:animate-none"
          key={row}
        />
      ))}
    </div>
  );
}

function DirectoryErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-[24px] bg-sand px-6 rx-sm:px-8 py-12 rx-sm:py-16"
      role="status"
    >
      <h2 className="font-semibold text-[20px] text-navy">
        Classes could not load
      </h2>
      <p className="mt-2 max-w-[60ch] text-ink leading-relaxed">{message}</p>
      <button
        className="mt-6 min-h-11 rounded-full bg-navy px-5 py-2.5 font-semibold text-[15px] text-white hover:bg-navy-deep"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}

function RefreshBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="mb-6 flex rx-sm:flex-row flex-col rx-sm:items-center rx-sm:justify-between gap-2 rounded-[16px] border border-hairline bg-sand px-4 py-3"
      role="status"
    >
      <p className="text-ink-muted text-sm">
        Could not refresh classes. Showing the last loaded list.
      </p>
      <button
        className="min-h-9 rx-sm:self-auto self-start font-semibold text-accent-text text-sm underline-offset-4 hover:underline"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}

interface DirectoryFiltersBarProps {
  activeNames: string[];
  filters: DirectoryFilters;
  hasFilters: boolean;
  onClear: () => void;
  onFilterChange: (next: DirectoryFilters) => void;
  payload: DirectoryClassesPayload;
}

function DirectoryFiltersBar({
  activeNames,
  filters,
  hasFilters,
  onClear,
  onFilterChange,
  payload,
}: DirectoryFiltersBarProps) {
  const handleArt = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ art: event.currentTarget.value || undefined });
    },
    [onFilterChange]
  );
  const handleLocation = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({ location: event.currentTarget.value || undefined });
    },
    [onFilterChange]
  );
  const handleAudience = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({
        audience: (event.currentTarget.value || undefined) as
          | ClassAudience
          | undefined,
      });
    },
    [onFilterChange]
  );
  const fieldClass =
    "min-h-11 w-full rounded-full border border-hairline bg-canvas px-5 text-[15px] font-medium text-ink focus:border-navy";
  const unknownArt =
    filters.art &&
    !payload.martialArts.some((item) => item.value === filters.art)
      ? filters.art
      : undefined;
  const unknownLocation =
    filters.location &&
    !payload.locations.some((item) => item.value === filters.location)
      ? filters.location
      : undefined;

  return (
    <div className="border-hairline border-y py-4">
      <div className="grid grid-cols-1 rx-sm:grid-cols-3 gap-3">
        <label className="min-w-0">
          <span className="sr-only">Martial art</span>
          <select
            className={fieldClass}
            id="class-filter-art"
            onChange={handleArt}
            value={filters.art ?? ""}
          >
            <option value="">All martial arts</option>
            {unknownArt ? (
              <option value={unknownArt}>Selected martial art</option>
            ) : null}
            {payload.martialArts.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Location</span>
          <select
            className={fieldClass}
            id="class-filter-location"
            onChange={handleLocation}
            value={filters.location ?? ""}
          >
            <option value="">All locations</option>
            {unknownLocation ? (
              <option value={unknownLocation}>Selected location</option>
            ) : null}
            {payload.locations.map((item) => (
              <option key={item.value} value={item.value}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-0">
          <span className="sr-only">Audience</span>
          <select
            className={fieldClass}
            id="class-filter-audience"
            onChange={handleAudience}
            value={filters.audience ?? ""}
          >
            <option value="">All audiences</option>
            {CLASS_AUDIENCES.map((audience) => (
              <option key={audience} value={audience}>
                {AUDIENCE_LABELS[audience]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {hasFilters ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] text-ink-muted">
            Showing {activeNames.join(", ")}.
          </p>
          <button
            className="min-h-11 font-semibold text-[14px] text-brand-strong underline-offset-4 hover:underline"
            onClick={onClear}
            type="button"
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </div>
  );
}

function DirectoryResults({
  activeNames,
  classes,
  hasFilters,
}: {
  activeNames: string[];
  classes: DirectoryClassView[];
  hasFilters: boolean;
}) {
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-3 py-6">
        <h2
          aria-live="polite"
          className="font-semibold rx-sm:text-[22px] text-[20px] text-navy tracking-[-0.02em]"
        >
          {classes.length} {classes.length === 1 ? "class" : "classes"}
        </h2>
        {hasFilters ? (
          <p className="text-[14px] text-ink-muted">
            Filtered by {activeNames.join(", ")}
          </p>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="rx-md:grid hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.8fr)] gap-4 border-ink border-b pb-3 font-semibold text-[13px] text-ink-muted"
      >
        <span>Class</span>
        <span>Master</span>
        <span>Location</span>
        <span>Next session</span>
        <span className="text-right">Fee</span>
      </div>
      <ul aria-label="Published classes" className="list-none p-0">
        {classes.map((item) => (
          <ClassRow item={item} key={item.id} />
        ))}
      </ul>
    </>
  );
}

function DirectoryEmpty({
  activeNames,
  hasFilters,
  onClear,
}: {
  activeNames: string[];
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <div
      className="rounded-[24px] bg-sand px-6 rx-sm:px-8 py-12 rx-sm:py-16 text-center"
      role="status"
    >
      <h2 className="font-semibold text-[20px] text-navy">
        {hasFilters ? "No classes match these filters" : "No classes yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-[52ch] text-ink leading-relaxed">
        {hasFilters
          ? `No published class matches ${activeNames.join(", ")}. Try another martial art, location or audience.`
          : "No class has been published yet. When a master adds a class and schedule, it will appear here."}
      </p>
      {hasFilters ? (
        <button
          className="mt-6 min-h-11 rounded-full bg-navy px-5 py-2.5 font-semibold text-[15px] text-white hover:bg-navy-deep"
          onClick={onClear}
          type="button"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}

export function DirectoryScreen({
  filters,
  onClear,
  onFilterChange,
}: DirectoryScreenProps) {
  const trpc = useTRPC();
  const classesQuery = useQuery({
    ...trpc.directory.classes.queryOptions({
      ...(filters.art ? { martialArt: filters.art } : {}),
      ...(filters.location ? { location: filters.location } : {}),
      ...(filters.audience ? { audience: filters.audience } : {}),
    }),
    placeholderData: keepPreviousData,
    refetchInterval: (query) =>
      query.state.status === "error"
        ? false
        : nextSessionRefetchInterval(query.state.data),
  });
  const payload = classesQuery.data;
  const hasFilters = Boolean(
    filters.art || filters.location || filters.audience
  );
  const activeNames = filterNames(payload, filters);
  const showFilters = Boolean(
    payload && (payload.classes.length > 0 || hasFilters)
  );

  const handleRetry = useCallback(() => {
    classesQuery.refetch();
  }, [classesQuery]);

  return (
    <>
      <MarketplacePageHero
        body="Browse current training slots published by martial-arts masters across MastersCorner."
        eyebrow="Class finder"
        title="Find a class that fits your week"
      />
      <section className="bg-canvas pt-2 pb-16 rx-md:pb-24">
        <RedesignContainer>
          {classesQuery.status === "pending" ? <DirectorySkeleton /> : null}

          {classesQuery.isError && !payload ? (
            <DirectoryErrorState
              message={classesQuery.error.message}
              onRetry={handleRetry}
            />
          ) : null}

          {payload ? (
            <>
              {classesQuery.isError ? (
                <RefreshBanner onRetry={handleRetry} />
              ) : null}

              {showFilters ? (
                <DirectoryFiltersBar
                  activeNames={activeNames}
                  filters={filters}
                  hasFilters={hasFilters}
                  onClear={onClear}
                  onFilterChange={onFilterChange}
                  payload={payload}
                />
              ) : null}

              {payload.classes.length > 0 ? (
                <DirectoryResults
                  activeNames={activeNames}
                  classes={payload.classes}
                  hasFilters={hasFilters}
                />
              ) : (
                <DirectoryEmpty
                  activeNames={activeNames}
                  hasFilters={hasFilters}
                  onClear={onClear}
                />
              )}
            </>
          ) : null}
        </RedesignContainer>
      </section>
    </>
  );
}
