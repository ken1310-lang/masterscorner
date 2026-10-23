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

import { ShellContainer } from "@/components/shell/container";
import { useTRPC } from "@/utils/trpc";
import { ClassRow } from "./class-row";
import { AUDIENCE_LABELS } from "./class-values";

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
      ? (payload?.martialArts.find((item) => item.id === filters.art)?.name ??
        "selected martial art")
      : null,
    filters.location
      ? (payload?.locations.find((item) => item.id === filters.location)
          ?.name ?? "selected location")
      : null,
    filters.audience ? AUDIENCE_LABELS[filters.audience] : null,
  ].filter((name): name is string => name !== null);
}

function DirectoryHero() {
  return (
    <section className="bg-navy py-[62px] text-white md:py-[84px] md:pb-[72px]">
      <ShellContainer>
        <p className="font-extrabold text-[12px] text-brand-lifted uppercase tracking-[.16em]">
          Class Finder
        </p>
        <h1 className="mt-4 max-w-[760px] font-extrabold text-[clamp(42px,5.7vw,72px)] leading-[.98] tracking-[-.055em]">
          Find a class that fits your week
        </h1>
        <p className="mt-6 max-w-[690px] text-[#bdc7d8] text-lg leading-relaxed">
          Browse current training slots published by martial-arts masters across
          MastersCorner.
        </p>
      </ShellContainer>
    </section>
  );
}

function DirectorySkeleton() {
  return (
    <div aria-busy="true" className="space-y-3" role="status">
      <span className="sr-only">Loading classes</span>
      {SKELETON_ROWS.map((row) => (
        <div
          className="h-16 animate-pulse rounded-[10px] border border-line bg-surface-alt"
          key={row}
        />
      ))}
    </div>
  );
}

function DirectoryError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-[14px] border border-line bg-card p-6"
      role="status"
    >
      <h2 className="font-extrabold text-lg">Classes could not load</h2>
      <p className="mt-2 max-w-[60ch] text-muted-text text-sm">{message}</p>
      <button
        className="mt-4 min-h-11 rounded-[9px] bg-navy px-4 font-black text-white text-xs hover:bg-navy-deep"
        onClick={onRetry}
        type="button"
      >
        Try again
      </button>
    </div>
  );
}

function RefreshBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="mb-4 flex flex-col gap-2 rounded-[10px] border border-line bg-surface-alt px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="status"
    >
      <p className="text-muted-text text-xs">
        Could not refresh classes. Showing the last loaded list.
      </p>
      <button
        className="min-h-9 font-extrabold text-accent-text text-xs underline-offset-4 hover:underline"
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
    "min-h-11 w-full rounded-[9px] border border-line bg-card px-3 font-normal text-ink text-sm normal-case tracking-normal md:w-auto";
  const labelClass =
    "flex min-w-0 flex-col gap-1 font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em]";
  const unknownArt =
    filters.art && !payload.martialArts.some((item) => item.id === filters.art)
      ? filters.art
      : undefined;
  const unknownLocation =
    filters.location &&
    !payload.locations.some((item) => item.id === filters.location)
      ? filters.location
      : undefined;

  return (
    <div className="mb-6 flex flex-col gap-3 border-line border-t-[3px] border-t-navy pt-4 md:flex-row md:flex-wrap md:items-end">
      <div className="md:mr-auto">
        <strong className="text-sm">Filter classes</strong>
        <p className="mt-1 text-muted-text text-xs">
          Narrow the list by what and where you want to train.
        </p>
        {hasFilters ? (
          <p className="mt-1 text-muted-text text-xs">
            Showing {activeNames.join(", ")}
          </p>
        ) : null}
      </div>

      <label className={labelClass} htmlFor="filter-art">
        Martial art
        <select
          className={fieldClass}
          id="filter-art"
          onChange={handleArt}
          value={filters.art ?? ""}
        >
          <option value="">All martial arts</option>
          {unknownArt ? (
            <option value={unknownArt}>Selected martial art</option>
          ) : null}
          {payload.martialArts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass} htmlFor="filter-location">
        Location
        <select
          className={fieldClass}
          id="filter-location"
          onChange={handleLocation}
          value={filters.location ?? ""}
        >
          <option value="">All locations</option>
          {unknownLocation ? (
            <option value={unknownLocation}>Selected location</option>
          ) : null}
          {payload.locations.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass} htmlFor="filter-audience">
        Audience
        <select
          className={fieldClass}
          id="filter-audience"
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

      {hasFilters ? (
        <button
          className="min-h-11 self-start font-extrabold text-accent-text text-xs underline-offset-4 hover:underline md:self-end"
          onClick={onClear}
          type="button"
        >
          Clear filters
        </button>
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
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p aria-live="polite" className="text-muted-text text-xs">
          {classes.length} {classes.length === 1 ? "class" : "classes"}
        </p>
        {hasFilters ? (
          <p className="text-muted-text text-xs">
            Filtered by {activeNames.join(", ")}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-line bg-card">
        <div
          aria-hidden="true"
          className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.8fr)] gap-4 border-line border-b bg-surface-alt/60 px-2 py-3 font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em] md:grid"
        >
          <span>Class</span>
          <span>Master</span>
          <span>Location</span>
          <span>Next session</span>
          <span>Fee</span>
        </div>
        <ul aria-label="Published classes">
          {classes.map((item) => (
            <ClassRow item={item} key={item.id} />
          ))}
        </ul>
      </div>
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
      className="rounded-[14px] border border-line bg-card p-6"
      role="status"
    >
      <h2 className="font-extrabold text-lg">
        {hasFilters ? "No classes match these filters" : "No classes yet"}
      </h2>
      <p className="mt-2 max-w-[60ch] text-muted-text text-sm leading-relaxed">
        {hasFilters
          ? `No published class matches ${activeNames.join(", ")}. Try another martial art, location or audience.`
          : "No class has been published yet. When a master adds a class and schedule, it will appear here."}
      </p>
      {hasFilters ? (
        <button
          className="mt-4 min-h-11 rounded-[9px] bg-navy px-4 font-black text-white text-xs hover:bg-navy-deep"
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
      ...(filters.art ? { martialArtId: filters.art } : {}),
      ...(filters.location ? { locationId: filters.location } : {}),
      ...(filters.audience ? { audience: filters.audience } : {}),
    }),
    placeholderData: keepPreviousData,
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
      <DirectoryHero />
      <section className="py-[68px] md:py-[92px]">
        <ShellContainer>
          {classesQuery.status === "pending" ? <DirectorySkeleton /> : null}

          {classesQuery.isError && !payload ? (
            <DirectoryError
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
        </ShellContainer>
      </section>
    </>
  );
}
