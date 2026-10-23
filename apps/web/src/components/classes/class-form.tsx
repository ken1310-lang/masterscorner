import {
  type ClassOption,
  classFormSchema,
  type MasterClassView,
  type SaveClassInput,
} from "@my-better-t-app/api/classes";
import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback, useState } from "react";

import {
  AUDIENCE_LABELS,
  classFormValuesToInput,
  FEE_PERIOD_LABELS,
  initialClassValues,
  LEVEL_LABELS,
  STATUS_LABELS,
  WEEKDAYS,
} from "./class-values";

const FORM_ID = "class-form";
const sectionClassName = "rounded-[14px] border border-line bg-card p-5";

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

function fieldErrorMessages(field: AnyFieldApi) {
  return field.state.meta.errors
    .map(errorText)
    .filter((message): message is string => Boolean(message));
}

function ListErrors({ messages }: { messages: string[] }) {
  if (messages.length === 0) {
    return null;
  }
  return (
    <p className="mt-2 text-[11px] text-brand-strong" role="alert">
      {messages.join(" ")}
    </p>
  );
}

interface FieldChromeProps {
  children: ReactNode;
  field: AnyFieldApi;
  hint?: string;
  label: string;
}

function FieldChrome({ children, field, hint, label }: FieldChromeProps) {
  const errors = fieldErrorMessages(field);
  const hintId = hint ? `${field.name}-hint` : undefined;
  const errorId = errors.length > 0 ? `${field.name}-error` : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-[7px]">
      <Label
        className="font-extrabold text-[#4c576d] text-[11px]"
        htmlFor={field.name}
      >
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-[11px] text-muted-text" id={hintId}>
          {hint}
        </p>
      ) : null}
      {errors.length > 0 ? (
        <p className="text-[11px] text-brand-strong" id={errorId} role="alert">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

interface ClassSelectFieldProps {
  ariaLabel?: string;
  field: AnyFieldApi;
  hint?: string;
  label: string;
  options: readonly { label: string; value: string }[];
}

function ClassSelectField({
  ariaLabel,
  field,
  hint,
  label,
  options,
}: ClassSelectFieldProps) {
  const errors = fieldErrorMessages(field);
  const describedBy =
    [
      hint ? `${field.name}-hint` : "",
      errors.length > 0 ? `${field.name}-error` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) =>
      field.handleChange(event.target.value),
    [field]
  );
  return (
    <FieldChrome field={field} hint={hint} label={label}>
      <select
        aria-describedby={describedBy}
        aria-invalid={errors.length > 0}
        aria-label={ariaLabel}
        className="h-auto min-h-11 w-full rounded-[10px] border border-line bg-card px-3.5 py-[11px] text-sm outline-none focus-visible:border-navy focus-visible:ring-0 disabled:opacity-60"
        id={field.name}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={handleChange}
        value={field.state.value as string}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldChrome>
  );
}

interface ClassInputFieldProps {
  ariaLabel?: string;
  field: AnyFieldApi;
  hint?: string;
  inputMode?: "decimal" | "numeric" | "text";
  label: string;
  placeholder?: string;
  type?: "text" | "time";
}

function ClassInputField({
  ariaLabel,
  field,
  hint,
  inputMode,
  label,
  placeholder,
  type = "text",
}: ClassInputFieldProps) {
  const errors = fieldErrorMessages(field);
  const describedBy =
    [
      hint ? `${field.name}-hint` : "",
      errors.length > 0 ? `${field.name}-error` : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      field.handleChange(event.target.value),
    [field]
  );
  return (
    <FieldChrome field={field} hint={hint} label={label}>
      <Input
        aria-describedby={describedBy}
        aria-invalid={errors.length > 0}
        aria-label={ariaLabel}
        className="h-auto min-h-11 rounded-[10px] border-line bg-card px-3.5 py-[11px] text-sm focus-visible:border-navy focus-visible:ring-0"
        id={field.name}
        inputMode={inputMode}
        name={field.name}
        onBlur={field.handleBlur}
        onChange={handleChange}
        placeholder={placeholder}
        type={type}
        value={field.state.value as string}
      />
    </FieldChrome>
  );
}

const audienceOptions = Object.entries(AUDIENCE_LABELS).map(
  ([value, label]) => ({ label, value })
);
const levelOptions = Object.entries(LEVEL_LABELS).map(([value, label]) => ({
  label,
  value,
}));
const statusOptions = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  label,
  value,
}));
const feePeriodOptions = [
  { label: "No fee", value: "" },
  ...Object.entries(FEE_PERIOD_LABELS).map(([value, label]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value,
  })),
];

function submitLabel(isSubmitting: boolean, editing: boolean) {
  if (isSubmitting) {
    return "Saving…";
  }
  return editing ? "Save changes" : "Create class";
}

function selectSaveState(state: { canSubmit: boolean; isSubmitting: boolean }) {
  return { canSubmit: state.canSubmit, isSubmitting: state.isSubmitting };
}

interface ClassFormProps {
  initial: MasterClassView | null;
  onCancel: () => void;
  onSave: (input: SaveClassInput) => Promise<void>;
  options: { locations: ClassOption[]; martialArts: ClassOption[] };
}

export function ClassForm({
  initial,
  onCancel,
  onSave,
  options,
}: ClassFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: initialClassValues(initial, options),
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        await onSave(classFormValuesToInput(value));
      } catch (error) {
        setFormError(
          error instanceof Error
            ? error.message
            : "The class could not be saved. Try again."
        );
      }
    },
    validators: { onSubmit: classFormSchema },
    listeners: {
      onChange: ({ formApi }) => {
        if (formApi.state.submissionAttempts > 0) {
          formApi.validate("submit");
        }
      },
    },
  });
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setFormError(null);
      form.handleSubmit();
    },
    [form]
  );

  return (
    <section className={`${sectionClassName} mb-4`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-base">
            {initial ? "Edit class" : "New class"}
          </h2>
          <p className="mt-1 text-muted-text text-xs leading-relaxed">
            One weekly schedule is required. Changes appear in the console as
            soon as you save.
          </p>
        </div>
        <button
          className="min-h-9 rounded-[8px] border border-line px-3 font-black text-[11px] hover:bg-surface-alt"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>

      <form className="grid gap-4" id={FORM_ID} onSubmit={handleSubmit}>
        {formError ? (
          <p
            className="rounded-[10px] border border-brand/30 bg-brand/5 p-3 text-brand-strong text-xs"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <form.Subscribe selector={selectSaveState}>
          {({ canSubmit, isSubmitting }) => (
            <fieldset
              aria-busy={isSubmitting}
              className="m-0 grid min-w-0 gap-4 border-0 p-0"
              disabled={isSubmitting}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <form.Field name="name">
                    {(field) => (
                      <ClassInputField
                        field={field}
                        label="Class name"
                        placeholder="e.g. Silambam Foundation"
                      />
                    )}
                  </form.Field>
                </div>

                <form.Field name="martialArtId">
                  {(field) => (
                    <ClassSelectField
                      field={field}
                      label="Martial art"
                      options={options.martialArts.map((art) => ({
                        label: art.name,
                        value: art.id,
                      }))}
                    />
                  )}
                </form.Field>
                <form.Field name="locationId">
                  {(field) => (
                    <ClassSelectField
                      field={field}
                      label="Teaching location"
                      options={options.locations.map((location) => ({
                        label: location.name,
                        value: location.id,
                      }))}
                    />
                  )}
                </form.Field>

                <form.Field name="audience">
                  {(field) => (
                    <ClassSelectField
                      field={field}
                      label="Audience"
                      options={audienceOptions}
                    />
                  )}
                </form.Field>
                <form.Field name="level">
                  {(field) => (
                    <ClassSelectField
                      field={field}
                      label="Level"
                      options={levelOptions}
                    />
                  )}
                </form.Field>

                <form.Field name="status">
                  {(field) => (
                    <ClassSelectField
                      field={field}
                      label="Status"
                      options={statusOptions}
                    />
                  )}
                </form.Field>
                <div className="grid grid-cols-2 gap-3">
                  <form.Field name="feeAmount">
                    {(field) => (
                      <ClassInputField
                        field={field}
                        hint="Leave blank for no fee."
                        inputMode="decimal"
                        label="Fee (INR)"
                        placeholder="e.g. 1500"
                      />
                    )}
                  </form.Field>
                  <form.Field name="feePeriod">
                    {(field) => (
                      <ClassSelectField
                        field={field}
                        label="Period"
                        options={feePeriodOptions}
                      />
                    )}
                  </form.Field>
                </div>
              </div>

              <div className="border-line border-t pt-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-extrabold text-base">Weekly schedule</h3>
                  <span className="font-extrabold text-[9px] text-muted-text uppercase tracking-[.08em]">
                    Local time
                  </span>
                </div>
                <p className="mt-1 mb-3 text-muted-text text-xs leading-relaxed">
                  Add every weekly slot. A class needs at least one.
                </p>

                <form.Field mode="array" name="schedules">
                  {(field) => (
                    <>
                      <div className="divide-y divide-line border-line border-t">
                        {field.state.value.map((schedule, index) => (
                          <div
                            className="grid gap-3 py-3 sm:grid-cols-[1.1fr_1fr_1fr_auto] sm:items-end"
                            key={schedule.key}
                          >
                            <form.Field name={`schedules[${index}].dayOfWeek`}>
                              {(dayField) => (
                                <ClassSelectField
                                  ariaLabel={`Day for schedule ${index + 1}`}
                                  field={dayField}
                                  label="Day"
                                  options={WEEKDAYS.map((day) => ({
                                    label: day.label,
                                    value: day.value,
                                  }))}
                                />
                              )}
                            </form.Field>
                            <form.Field name={`schedules[${index}].startTime`}>
                              {(timeField) => (
                                <ClassInputField
                                  ariaLabel={`Start time for schedule ${
                                    index + 1
                                  }`}
                                  field={timeField}
                                  label="Starts"
                                  type="time"
                                />
                              )}
                            </form.Field>
                            <form.Field name={`schedules[${index}].endTime`}>
                              {(timeField) => (
                                <ClassInputField
                                  ariaLabel={`End time for schedule ${
                                    index + 1
                                  }`}
                                  field={timeField}
                                  label="Ends"
                                  type="time"
                                />
                              )}
                            </form.Field>
                            <button
                              aria-label={`Remove schedule ${index + 1}`}
                              className="min-h-9 rounded-[8px] px-2 font-black text-[11px] text-accent-text hover:underline disabled:pointer-events-none disabled:opacity-40"
                              disabled={field.state.value.length === 1}
                              // biome-ignore lint/performance/noJsxPropsBind: each row removes its own array index
                              onClick={() => field.removeValue(index)}
                              type="button"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <ListErrors messages={fieldErrorMessages(field)} />
                      <button
                        className="mt-2 min-h-11 font-black text-[11px] text-accent-text hover:underline"
                        // biome-ignore lint/performance/noJsxPropsBind: the array field owns the append mutation
                        onClick={() =>
                          field.pushValue({
                            dayOfWeek: "1",
                            endTime: "",
                            key: crypto.randomUUID(),
                            startTime: "",
                          })
                        }
                        type="button"
                      >
                        + Add schedule
                      </button>
                    </>
                  )}
                </form.Field>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-line border-t pt-4">
                <button
                  className="min-h-11 rounded-[9px] px-3 font-black text-[11px] text-muted-text hover:underline"
                  onClick={onCancel}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="min-h-11 rounded-[9px] bg-navy px-4 py-2.5 font-black text-white text-xs hover:bg-navy-deep disabled:pointer-events-none disabled:opacity-60"
                  disabled={!canSubmit || isSubmitting}
                  type="submit"
                >
                  {submitLabel(isSubmitting, Boolean(initial))}
                </button>
              </div>
            </fieldset>
          )}
        </form.Subscribe>
      </form>
    </section>
  );
}
