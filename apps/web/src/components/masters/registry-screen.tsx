import {
  CLASS_AUDIENCES,
  type ClassAudience,
} from "@my-better-t-app/api/classes";
import type {
  DirectoryMastersPayload,
  DirectoryMasterView,
} from "@my-better-t-app/api/directory";
import { useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useCallback } from "react";

import { AUDIENCE_LABELS } from "@/components/classes/class-values";
import { ShellContainer } from "@/components/shell/container";
import { useTRPC } from "@/utils/trpc";

import { MasterCard } from "./master-card";

export interface RegistryFilters {
  art?: string;
  audience?: ClassAudience;
  location?: string;
  page?: number;
}

export type RegistryFilterChange = Omit<RegistryFilters, "page">;

interface RegistryScreenProps {
  filters: RegistryFilters;
  onClear: () => void;
  onFilterChange: (next: RegistryFilterChange) => void;
  onPageChange: (page: number) => void;
}

const SKELETON_CARDS = ["one", "two", "three", "four", "five", "six"] as const;

function filterNames(
  payload: DirectoryMastersPayload | undefined,
  filters: RegistryFilters
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

function RegistryHero() {
  return (
    <section className="bg-navy py-[62px] text-white md:py-[84px] md:pb-[72px]">
      <ShellContainer>
        <p className="font-extrabold text-[12px] text-brand-lifted uppercase tracking-[.16em]">
          Master Registry
        </p>
        <h1 className="mt-4 max-w-[760px] font-extrabold text-[clamp(42px,5.7vw,72px)] leading-[.98] tracking-[-.055em]">
          Find a martial arts master
        </h1>
        <p className="mt-6 max-w-[690px] text-[#bdc7d8] text-lg leading-relaxed">
          Search by discipline, area and audience, then compare real profiles
          built by martial-arts masters.
        </p>
      </ShellContainer>
    </section>
  );
}

function RegistrySkeleton() {
  return (
    <div aria-busy="true" className="grid gap-5 md:grid-cols-2" role="status">
      <span className="sr-only">Loading masters</span>
      {SKELETON_CARDS.map((card) => (
        <div
          className="h-[220px] animate-pulse rounded-[16px] border border-line bg-surface-alt"
          key={card}
        />
      ))}
    </div>
  );
}

function RegistryError({
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
      <h2 className="font-extrabold text-lg">Masters could not load</h2>
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
        Could not refresh masters. Showing the last loaded page.
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

interface RegistryFiltersBarProps {
  activeNames: string[];
  filters: RegistryFilters;
  hasFilters: boolean;
  onClear: () => void;
  onFilterChange: (next: RegistryFilterChange) => void;
  payload: DirectoryMastersPayload;
}

function RegistryFiltersBar({
  activeNames,
  filters,
  hasFilters,
  onClear,
  onFilterChange,
  payload,
}: RegistryFiltersBarProps) {
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
    <div className="mb-6 flex flex-col gap-3 border-line border-t-[3px] border-t-navy pt-4 md:flex-row md:flex-wrap md:items-end">
      <div className="md:mr-auto">
        <strong className="text-sm">Filter masters</strong>
        <p className="mt-1 text-muted-text text-xs">
          Narrow the list by discipline, area and who the classes are for.
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
            <option key={item.value} value={item.value}>
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
            <option key={item.value} value={item.value}>
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

function RegistryResults({
  masters,
  total,
}: {
  masters: DirectoryMasterView[];
  total: number;
}) {
  return (
    <>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <p aria-live="polite" className="text-muted-text text-xs">
          {total} {total === 1 ? "master" : "masters"}
        </p>
        <p className="text-muted-text text-xs">Sorted by experience</p>
      </div>

      <h2 className="sr-only">Masters</h2>
      <div className="grid gap-5 md:grid-cols-2">
        {masters.map((master) => (
          <MasterCard key={master.id} master={master} />
        ))}
      </div>
    </>
  );
}

function RegistryPagination({
  onPageChange,
  page,
  totalPages,
}: {
  onPageChange: (page: number) => void;
  page: number;
  totalPages: number;
}) {
  const previousPage = useCallback(() => {
    onPageChange(page - 1);
  }, [onPageChange, page]);
  const nextPage = useCallback(() => {
    onPageChange(page + 1);
  }, [onPageChange, page]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Master pages"
      className="mt-8 flex items-center justify-between gap-3"
    >
      <button
        className="min-h-11 rounded-[9px] border border-line bg-card px-4 font-extrabold text-xs disabled:cursor-not-allowed disabled:opacity-50"
        disabled={page <= 1}
        onClick={previousPage}
        type="button"
      >
        Previous
      </button>
      <span aria-live="polite" className="text-muted-text text-xs">
        Page {page} of {totalPages}
      </span>
      <button
        className="min-h-11 rounded-[9px] border border-line bg-card px-4 font-extrabold text-xs disabled:cursor-not-allowed disabled:opacity-50"
        disabled={page >= totalPages}
        onClick={nextPage}
        type="button"
      >
        Next
      </button>
    </nav>
  );
}

function RegistryEmpty({
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
        {hasFilters ? "No masters match these filters" : "No masters yet"}
      </h2>
      <p className="mt-2 max-w-[60ch] text-muted-text text-sm leading-relaxed">
        {hasFilters
          ? `No stored master matches ${activeNames.join(", ")}. Try another martial art, location or audience.`
          : "No master profile has been created yet. When a master completes their profile, they will appear here."}
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

export function RegistryScreen({
  filters,
  onClear,
  onFilterChange,
  onPageChange,
}: RegistryScreenProps) {
  const trpc = useTRPC();
  const mastersQuery = useQuery(
    trpc.directory.masters.queryOptions({
      ...(filters.art ? { martialArt: filters.art } : {}),
      ...(filters.location ? { location: filters.location } : {}),
      ...(filters.audience ? { audience: filters.audience } : {}),
      ...(filters.page ? { page: filters.page } : {}),
    })
  );
  const payload = mastersQuery.data;
  const hasFilters = Boolean(
    filters.art || filters.location || filters.audience
  );
  const activeNames = filterNames(payload, filters);
  const showFilters = Boolean(payload && (payload.total > 0 || hasFilters));

  const handleRetry = useCallback(() => {
    mastersQuery.refetch();
  }, [mastersQuery]);

  return (
    <>
      <RegistryHero />
      <section className="py-[68px] md:py-[92px]">
        <ShellContainer>
          {mastersQuery.status === "pending" ? <RegistrySkeleton /> : null}

          {mastersQuery.isError && !payload ? (
            <RegistryError
              message={mastersQuery.error.message}
              onRetry={handleRetry}
            />
          ) : null}

          {payload ? (
            <>
              {mastersQuery.isError ? (
                <RefreshBanner onRetry={handleRetry} />
              ) : null}

              {showFilters ? (
                <RegistryFiltersBar
                  activeNames={activeNames}
                  filters={filters}
                  hasFilters={hasFilters}
                  onClear={onClear}
                  onFilterChange={onFilterChange}
                  payload={payload}
                />
              ) : null}

              {payload.total > 0 ? (
                <>
                  <RegistryResults
                    masters={payload.masters}
                    total={payload.total}
                  />
                  <RegistryPagination
                    onPageChange={onPageChange}
                    page={payload.page}
                    totalPages={payload.totalPages}
                  />
                </>
              ) : (
                <RegistryEmpty
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
