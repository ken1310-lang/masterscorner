import {
  CLASS_AUDIENCES,
  type ClassAudience,
} from "@my-better-t-app/api/classes";
import {
  type DirectoryFilterOption,
  directoryLocationFilterSchema,
  directoryMartialArtFilterSchema,
} from "@my-better-t-app/api/directory";
import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import { ChevronDown, Search } from "lucide-react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback } from "react";
import { z } from "zod";

import { AUDIENCE_LABELS } from "@/components/classes/class-values";

export interface HomeSearchFilters {
  art?: string;
  audience?: ClassAudience;
  location?: string;
}

const homeSearchSchema = z.object({
  art: z.union([z.literal(""), directoryMartialArtFilterSchema]),
  audience: z.union([z.literal(""), z.enum(CLASS_AUDIENCES)]),
  location: z.union([z.literal(""), directoryLocationFilterSchema]),
});

function selectSubmitting(state: { isSubmitting: boolean }) {
  return state.isSubmitting;
}

function errorText(error: unknown) {
  if (typeof error === "string") {
    return error;
  }
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
}

function fieldErrors(field: AnyFieldApi) {
  return field.state.meta.errors
    .map(errorText)
    .filter((message): message is string => Boolean(message));
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
  const form = useForm({
    defaultValues: { art: "", audience: "", location: "" },
    onSubmit: ({ value }) => {
      const art = value.art
        ? directoryMartialArtFilterSchema.parse(value.art)
        : undefined;
      const location = value.location
        ? directoryLocationFilterSchema.parse(value.location)
        : undefined;
      const audience = value.audience
        ? (value.audience as ClassAudience)
        : undefined;
      onSearch({
        ...(art ? { art } : {}),
        ...(audience ? { audience } : {}),
        ...(location ? { location } : {}),
      });
    },
    validators: { onSubmit: homeSearchSchema },
  });
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );

  return (
    <form
      className="mt-8 rx-sm:mt-9 flex rx-md:h-[68px] w-full max-w-[720px] rx-md:flex-row flex-col rx-md:items-center rounded-[24px] rx-md:rounded-full border border-hairline bg-canvas p-2 text-left shadow-[0_14px_40px_rgba(11,19,43,0.12)]"
      onSubmit={handleSubmit}
    >
      <form.Field name="art">
        {(field) => (
          <SearchSelect
            emptyLabel="All martial arts"
            field={field}
            id="home-search-art"
            label="Martial art"
            options={martialArts.map((option) => ({
              label: option.name,
              value: option.value,
            }))}
          />
        )}
      </form.Field>
      <Divider />
      <form.Field name="location">
        {(field) => (
          <SearchSelect
            emptyLabel="All locations"
            field={field}
            id="home-search-location"
            label="Location"
            options={locations.map((option) => ({
              label: option.name,
              value: option.value,
            }))}
          />
        )}
      </form.Field>
      <Divider />
      <form.Field name="audience">
        {(field) => (
          <SearchSelect
            emptyLabel="All audiences"
            field={field}
            id="home-search-audience"
            label="Audience"
            options={CLASS_AUDIENCES.map((value) => ({
              label: AUDIENCE_LABELS[value],
              value,
            }))}
          />
        )}
      </form.Field>
      <form.Subscribe selector={selectSubmitting}>
        {(isSubmitting) => (
          <button
            className="mt-2 rx-md:mt-0 flex h-[52px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand-strong px-6 font-semibold text-[16px] text-white transition-colors duration-150 hover:bg-brand-deep active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 motion-reduce:transform-none"
            disabled={isSubmitting}
            type="submit"
          >
            <Search className="size-4" strokeWidth={2.5} />
            {isSubmitting ? "Finding…" : "Find training"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}

function SearchSelect({
  emptyLabel,
  field,
  id,
  label,
  options,
}: {
  emptyLabel: string;
  field: AnyFieldApi;
  id: string;
  label: string;
  options: { label: string; value: string }[];
}) {
  const errors = fieldErrors(field);
  const errorId = errors.length > 0 ? `${id}-error` : undefined;
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      field.handleChange(event.currentTarget.value);
    },
    [field]
  );

  return (
    <Field errors={errors} id={id} label={label}>
      <select
        aria-describedby={errorId}
        aria-invalid={errors.length > 0 || undefined}
        className="w-full appearance-none bg-transparent font-medium text-[16px] text-navy focus-visible:outline-2 focus-visible:outline-brand-strong focus-visible:outline-offset-2"
        id={id}
        onBlur={field.handleBlur}
        onChange={handleChange}
        value={field.state.value}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-5 size-4 -translate-y-1/2 text-ink-muted" />
    </Field>
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
  errors = [],
  id,
  label,
}: {
  children: ReactNode;
  errors?: string[];
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
      {errors.length > 0 ? (
        <p
          className="mt-1 font-semibold text-[11px] text-brand-strong"
          id={`${id}-error`}
          role="alert"
        >
          {errors.join(" ")}
        </p>
      ) : null}
    </label>
  );
}
