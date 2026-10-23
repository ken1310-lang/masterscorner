import {
  CLASS_AUDIENCES,
  type ClassAudience,
} from "@my-better-t-app/api/classes";
import type { DirectoryFilterOption } from "@my-better-t-app/api/directory";
import { ChevronDown, Search } from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback, useState } from "react";

import { AUDIENCE_LABELS } from "@/components/classes/class-values";

export interface HomeSearchFilters {
  art?: string;
  audience?: ClassAudience;
  location?: string;
}

export function HomeSearchBar({
  martialArts,
  locations,
  onSearch,
}: {
  martialArts: DirectoryFilterOption[];
  locations: DirectoryFilterOption[];
  onSearch: (filters: HomeSearchFilters) => void;
}) {
  const [art, setArt] = useState("");
  const [location, setLocation] = useState("");
  const [audience, setAudience] = useState("");

  const handleArt = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    setArt(event.currentTarget.value);
  }, []);
  const handleLocation = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setLocation(event.currentTarget.value);
    },
    []
  );
  const handleAudience = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setAudience(event.currentTarget.value);
    },
    []
  );
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      onSearch({
        ...(art ? { art } : {}),
        ...(audience ? { audience: audience as ClassAudience } : {}),
        ...(location ? { location } : {}),
      });
    },
    [art, audience, location, onSearch]
  );

  return (
    <form
      className="mt-8 rx-sm:mt-9 flex rx-md:h-[68px] w-full max-w-[720px] rx-md:flex-row flex-col rx-md:items-center rounded-[24px] rx-md:rounded-full border border-hairline bg-canvas p-2 text-left shadow-[0_14px_40px_rgba(11,19,43,0.12)]"
      onSubmit={handleSubmit}
    >
      <Field id="home-search-art" label="Martial art">
        <select
          className="w-full appearance-none bg-transparent font-medium text-[16px] text-navy focus-visible:outline-2 focus-visible:outline-brand-strong focus-visible:outline-offset-2"
          id="home-search-art"
          onChange={handleArt}
          value={art}
        >
          <option value="">All martial arts</option>
          {martialArts.map((option) => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-5 size-4 -translate-y-1/2 text-ink-muted" />
      </Field>
      <Divider />
      <Field id="home-search-location" label="Location">
        <select
          className="w-full appearance-none bg-transparent font-medium text-[16px] text-navy focus-visible:outline-2 focus-visible:outline-brand-strong focus-visible:outline-offset-2"
          id="home-search-location"
          onChange={handleLocation}
          value={location}
        >
          <option value="">All locations</option>
          {locations.map((option) => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-5 size-4 -translate-y-1/2 text-ink-muted" />
      </Field>
      <Divider />
      <Field id="home-search-audience" label="Audience">
        <select
          className="w-full appearance-none bg-transparent font-medium text-[16px] text-navy focus-visible:outline-2 focus-visible:outline-brand-strong focus-visible:outline-offset-2"
          id="home-search-audience"
          onChange={handleAudience}
          value={audience}
        >
          <option value="">All audiences</option>
          {CLASS_AUDIENCES.map((value) => (
            <option key={value} value={value}>
              {AUDIENCE_LABELS[value]}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-5 size-4 -translate-y-1/2 text-ink-muted" />
      </Field>
      <button
        className="mt-2 rx-md:mt-0 flex h-[52px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-strong px-6 font-semibold text-[16px] text-white transition-colors duration-150 hover:bg-brand-deep active:scale-[0.98]"
        type="submit"
      >
        <Search className="size-4" strokeWidth={2.5} />
        Find training
      </button>
    </form>
  );
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="mx-4 rx-md:mx-0 h-px rx-md:h-8 rx-md:w-px bg-hairline"
    />
  );
}

function Field({
  children,
  id,
  label,
}: {
  children: ReactNode;
  id: string;
  label: string;
}) {
  return (
    <label
      className="relative flex min-w-0 flex-1 flex-col justify-center rounded-[16px] rx-md:rounded-full px-4 rx-md:px-6 py-2.5 rx-md:py-2 focus-within:bg-sand"
      htmlFor={id}
    >
      <span className="font-semibold text-[12px] text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
