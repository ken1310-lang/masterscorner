import {
  CLASS_AUDIENCES,
  type ClassAudience,
} from "@my-better-t-app/api/classes";
import type {
  DirectoryMastersPayload,
  DirectoryMasterView,
} from "@my-better-t-app/api/directory";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type ChangeEvent, useCallback } from "react";

import { AUDIENCE_LABELS } from "@/components/classes/class-values";
import { MarketplacePageHero } from "@/components/marketplace/page-hero";
import { RedesignContainer } from "@/components/shell/container";
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

function RegistrySkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading masters"
      className="grid grid-cols-1 rx-sm:grid-cols-2 gap-x-6 gap-y-10"
      role="status"
    >
      {SKELETON_CARDS.map((card) => (
        <div key={card}>
          <div className="aspect-[4/5] animate-pulse rounded-[24px] bg-sand motion-reduce:animate-none" />
          <div className="mt-5 h-6 w-3/4 animate-pulse rounded bg-sand motion-reduce:animate-none" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-sand motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}

function RegistryErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-[24px] bg-sand px-6 rx-sm:px-8 py-12 rx-sm:py-16">
      <h2 className="font-semibold text-[20px] text-navy">
        Masters could not load
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
        Could not refresh masters. Showing the last loaded page.
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
    "mt-2 min-h-11 w-full rounded-full border border-hairline bg-canvas px-4 text-[15px] font-medium text-ink outline-none focus:border-navy rx-lg:rounded-[10px]";
  const labelClass =
    "flex min-w-0 flex-col text-[14px] font-semibold text-ink-muted";
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
    <aside className="self-start">
      <h2 className="font-semibold text-[17px] text-navy">Filter results</h2>
      <div className="mt-3 grid grid-cols-1 rx-lg:grid-cols-1 rx-sm:grid-cols-3 gap-3">
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
      </div>

      {hasFilters ? (
        <button
          className="mt-5 min-h-11 font-semibold text-[14px] text-brand-strong underline-offset-4 hover:underline"
          onClick={onClear}
          type="button"
        >
          Clear filters
        </button>
      ) : null}
      {hasFilters ? (
        <p className="mt-4 text-[13px] text-ink-muted leading-relaxed">
          Showing {activeNames.join(", ")}.
        </p>
      ) : null}
    </aside>
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
      <div className="flex flex-wrap items-center justify-between gap-3 border-hairline rx-lg:border-0 border-t pt-6 rx-lg:pt-0">
        <h2
          aria-live="polite"
          className="font-semibold rx-sm:text-[22px] text-[20px] text-navy tracking-[-0.02em]"
        >
          {total} {total === 1 ? "master" : "masters"}
        </h2>
        <p className="text-[14px] text-ink-muted">Sorted by experience</p>
      </div>

      <h3 className="sr-only">Masters</h3>
      <div className="mt-8 grid grid-cols-1 rx-sm:grid-cols-2 rx-xl:gap-7 gap-x-6 gap-y-10">
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
      className="mt-10 flex items-center justify-between gap-3"
    >
      <button
        className="min-h-11 rounded-full border border-hairline bg-canvas px-5 font-semibold text-[14px] text-navy hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
        disabled={page <= 1}
        onClick={previousPage}
        type="button"
      >
        Previous
      </button>
      <span aria-live="polite" className="text-ink-muted text-sm">
        Page {page} of {totalPages}
      </span>
      <button
        className="min-h-11 rounded-full border border-hairline bg-canvas px-5 font-semibold text-[14px] text-navy hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
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
      className="rounded-[24px] bg-sand px-6 rx-sm:px-8 py-12 rx-sm:py-16 text-center"
      role="status"
    >
      <h2 className="font-semibold text-[20px] text-navy">
        {hasFilters ? "No masters match these filters" : "No masters yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-[52ch] text-ink leading-relaxed">
        {hasFilters
          ? `No stored master matches ${activeNames.join(", ")}. Try another martial art, location or audience.`
          : "No master profile has been created yet. When a master completes their profile, they will appear here."}
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

export function RegistryScreen({
  filters,
  onClear,
  onFilterChange,
  onPageChange,
}: RegistryScreenProps) {
  const trpc = useTRPC();
  const mastersQuery = useQuery({
    ...trpc.directory.masters.queryOptions({
      ...(filters.art ? { martialArt: filters.art } : {}),
      ...(filters.location ? { location: filters.location } : {}),
      ...(filters.audience ? { audience: filters.audience } : {}),
      ...(filters.page ? { page: filters.page } : {}),
    }),
    placeholderData: keepPreviousData,
  });
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
      <MarketplacePageHero
        body="Search by discipline, area and audience, then compare real profiles built by martial-arts masters."
        eyebrow="Master registry"
        title="Find a martial arts master"
      />
      <section className="border-hairline border-t bg-canvas pt-12 pb-16 rx-md:pb-24">
        <RedesignContainer
          className={
            showFilters
              ? "grid grid-cols-1 rx-lg:grid-cols-[232px_minmax(0,1fr)] gap-8 rx-lg:gap-14"
              : undefined
          }
        >
          {mastersQuery.status === "pending" ? <RegistrySkeleton /> : null}

          {mastersQuery.isError && !payload ? (
            <RegistryErrorState
              message={mastersQuery.error.message}
              onRetry={handleRetry}
            />
          ) : null}

          {payload ? (
            <>
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

              <div className="min-w-0">
                {mastersQuery.isError ? (
                  <RefreshBanner onRetry={handleRetry} />
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
              </div>
            </>
          ) : null}
        </RedesignContainer>
      </section>
    </>
  );
}
