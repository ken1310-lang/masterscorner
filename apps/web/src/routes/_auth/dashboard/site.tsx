import {
  MAX_PRO_SITE_NAME,
  PRO_SITE_STYLES,
  type ProSiteStatus,
  type ProSiteStyle,
  type SaveProSiteSettingsInput,
} from "@my-better-t-app/api/pro-site";
import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { type AnyFieldApi, useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { ConsoleEmptyState } from "@/components/console/empty-state";
import { ConsolePageHeader } from "@/components/console/page-header";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/site")({
  component: ProSite,
});

const STYLE_OPTIONS: Record<
  ProSiteStyle,
  { label: string; note: string; swatch: string }
> = {
  ochre: {
    label: "Ochre",
    note: "Warm gold",
    swatch: "#e0954a",
  },
  terracotta: {
    label: "Terracotta",
    note: "Burnt clay",
    swatch: "#d67a52",
  },
  sage: {
    label: "Sage",
    note: "Muted green",
    swatch: "#a8b497",
  },
};

const STYLE_VALUES = PRO_SITE_STYLES.map((value) => ({
  ...STYLE_OPTIONS[value],
  value,
}));

const siteSettingsFormSchema = z.object({
  siteName: z
    .string()
    .trim()
    .max(
      MAX_PRO_SITE_NAME,
      `Site name must be ${MAX_PRO_SITE_NAME} characters or fewer`
    ),
  style: z.enum(PRO_SITE_STYLES),
});

function selectSiteSaveState(state: {
  canSubmit: boolean;
  isSubmitting: boolean;
}) {
  return {
    canSubmit: state.canSubmit,
    isSubmitting: state.isSubmitting,
  };
}

const SYNC_ROWS = [
  { key: "bio", label: "Bio" },
  { key: "locations", label: "Teaching locations" },
  { key: "classes", label: "Classes" },
  { key: "schedule", label: "Schedule" },
  { key: "media", label: "Photo and logo" },
] as const;

function messageFor(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The Pro Site could not be updated. Try again.";
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

function fieldErrorMessages(field: AnyFieldApi) {
  return field.state.meta.errors
    .map(errorText)
    .filter((message): message is string => Boolean(message));
}

function FieldErrors({ field }: { field: AnyFieldApi }) {
  const messages = fieldErrorMessages(field);
  if (messages.length === 0) {
    return null;
  }
  return (
    <p className="text-[11px] text-brand-strong" role="alert">
      {messages.join(" ")}
    </p>
  );
}

function publicationActionLabel(pending: boolean, published: boolean) {
  if (pending) {
    return published ? "Unpublishing…" : "Publishing…";
  }
  return published ? "Unpublish site" : "Publish site";
}

function ProSiteStatusSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Pro Site status"
      className="grid gap-4 rounded-[14px] border border-line bg-card p-5"
      role="status"
    >
      <div className="h-3 w-24 rounded-full bg-line" />
      <div className="h-8 w-full max-w-[420px] rounded-full bg-line" />
      <div className="h-4 w-full max-w-[520px] rounded-full bg-line" />
    </div>
  );
}

function ProSiteStatusError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[14px] border border-line bg-card p-5">
      <h2 className="font-extrabold text-base">Pro Site status unavailable</h2>
      <p className="mt-2 text-muted-text text-sm leading-relaxed">
        The address request failed. Try again without changing your profile.
      </p>
      <button
        className="mt-4 min-h-11 rounded-[9px] bg-navy px-4 font-black text-white text-xs hover:bg-navy-deep"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}

function ProSiteActions({ status }: { status: ProSiteStatus }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        className="inline-flex min-h-11 items-center rounded-[9px] border border-line bg-card px-3.5 font-black text-xs hover:bg-surface-alt"
        href="/site-preview"
        rel="noreferrer"
        target="_blank"
      >
        Preview
      </a>
      {status.published ? (
        <a
          className="inline-flex min-h-11 items-center rounded-[9px] bg-navy px-3.5 font-black text-white text-xs hover:bg-navy-deep"
          href={status.address}
        >
          Open site
        </a>
      ) : null}
    </div>
  );
}

function PublicationCard({
  onChange,
  status,
}: {
  onChange: (published: boolean) => Promise<boolean>;
  status: ProSiteStatus;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  const changePublication = useCallback(
    async (published: boolean) => {
      setPending(true);
      try {
        if (await onChange(published)) {
          setConfirming(false);
        }
      } finally {
        setPending(false);
      }
    },
    [onChange]
  );

  const actionLabel = publicationActionLabel(pending, status.published);
  const cancelConfirmation = useCallback(() => setConfirming(false), []);
  const confirmUnpublish = useCallback(() => {
    changePublication(false).catch(() => undefined);
  }, [changePublication]);
  const primaryAction = useCallback(() => {
    if (status.published) {
      setConfirming(true);
      return;
    }
    changePublication(true).catch(() => undefined);
  }, [changePublication, status.published]);

  return (
    <article className="rounded-[14px] border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-extrabold text-[11px] text-muted-text uppercase tracking-[.14em]">
            {status.published ? "Live address" : "Reserved address"}
          </p>
          <p className="mt-2 break-words font-extrabold text-lg [overflow-wrap:anywhere]">
            {status.address}
          </p>
        </div>
        <span
          aria-live="polite"
          className="inline-flex shrink-0 rounded-full border border-line px-3 py-1 font-extrabold text-[10px] uppercase tracking-[.12em]"
        >
          {status.published ? "Live" : "Not published"}
        </span>
      </div>

      <p className="mt-3 text-muted-text text-sm leading-relaxed">
        {status.published
          ? "Visitors can open this address without an account."
          : "Publish when your profile and classes are ready. The address stays reserved."}
      </p>

      {confirming ? (
        <div
          className="mt-4 rounded-[10px] border border-brand/30 bg-brand/5 p-3"
          role="alert"
        >
          <p className="font-extrabold text-brand-strong text-xs">
            Unpublish this site?
          </p>
          <p className="mt-1 text-muted-text text-xs leading-relaxed">
            The public address will show the not-available screen. You can
            publish it again later.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="min-h-9 rounded-[8px] border border-line bg-card px-3 font-black text-[11px] hover:bg-surface-alt"
              disabled={pending}
              onClick={cancelConfirmation}
              type="button"
            >
              Keep published
            </button>
            <button
              className="min-h-9 rounded-[8px] bg-brand-strong px-3 font-black text-[11px] text-white hover:bg-brand-deep disabled:opacity-60"
              disabled={pending}
              onClick={confirmUnpublish}
              type="button"
            >
              {pending ? "Unpublishing…" : "Unpublish site"}
            </button>
          </div>
        </div>
      ) : (
        <button
          className={`mt-4 min-h-11 rounded-[9px] px-3.5 font-black text-xs disabled:pointer-events-none disabled:opacity-60 ${
            status.published
              ? "border border-line bg-card hover:bg-surface-alt"
              : "bg-navy text-white hover:bg-navy-deep"
          }`}
          disabled={pending}
          onClick={primaryAction}
          type="button"
        >
          {actionLabel}
        </button>
      )}
    </article>
  );
}

function DataSyncCard({ sync }: { sync: ProSiteStatus["sync"] }) {
  return (
    <article className="rounded-[14px] border border-line bg-card p-5 lg:col-span-2">
      <h2 className="font-extrabold text-base">Data sync</h2>
      <p className="mt-1 text-muted-text text-sm leading-relaxed">
        The public site reads these fields from your profile and current
        classes. Empty sections are omitted.
      </p>
      <dl className="mt-3 divide-y divide-line border-line border-t">
        {SYNC_ROWS.map((row) => {
          const synced = sync[row.key];
          return (
            <div
              className="flex items-center justify-between gap-4 py-3"
              key={row.key}
            >
              <dt className="text-muted-text text-sm">{row.label}</dt>
              <dd
                className={`font-extrabold text-xs ${
                  synced ? "text-[#3f7350]" : "text-muted-text"
                }`}
              >
                {synced ? "Synced" : "Not added"}
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}

function SiteNameField({
  displayName,
  field,
}: {
  displayName: string;
  field: AnyFieldApi;
}) {
  const errors = fieldErrorMessages(field);
  const describedBy =
    ["site-name-hint", errors.length > 0 ? "site-name-error" : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      field.handleChange(event.currentTarget.value),
    [field]
  );

  return (
    <div className="grid gap-[7px]">
      <Label
        className="font-extrabold text-[#4c576d] text-[11px]"
        htmlFor="site-name"
      >
        Site name
      </Label>
      <Input
        aria-describedby={describedBy}
        aria-invalid={errors.length > 0}
        className="min-h-11 rounded-[10px] border-line bg-card px-3.5 py-[11px] text-sm focus-visible:border-navy focus-visible:ring-0"
        id="site-name"
        maxLength={MAX_PRO_SITE_NAME}
        onBlur={field.handleBlur}
        onChange={handleChange}
        placeholder={displayName}
        value={field.state.value}
      />
      <p className="text-[11px] text-muted-text" id="site-name-hint">
        Leave blank to use {displayName}.
      </p>
      {errors.length > 0 ? (
        <p
          className="text-[11px] text-brand-strong"
          id="site-name-error"
          role="alert"
        >
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}

function StyleOption({
  checked,
  field,
  option,
}: {
  checked: boolean;
  field: AnyFieldApi;
  option: (typeof STYLE_VALUES)[number];
}) {
  const handleChange = useCallback(
    () => field.handleChange(option.value),
    [field, option.value]
  );

  return (
    <label
      className={`cursor-pointer rounded-[10px] border p-3 focus-within:outline-2 focus-within:outline-navy focus-within:outline-offset-2 ${
        checked
          ? "border-navy bg-surface-alt"
          : "border-line bg-card hover:bg-surface-alt"
      }`}
    >
      <input
        checked={checked}
        className="sr-only"
        name={field.name}
        onBlur={field.handleBlur}
        onChange={handleChange}
        type="radio"
        value={option.value}
      />
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="size-5 rounded-full border border-black/10"
          style={{ backgroundColor: option.swatch }}
        />
        <span className="font-extrabold text-xs">{option.label}</span>
      </span>
      <span className="mt-1 block text-[11px] text-muted-text">
        {option.note}
      </span>
    </label>
  );
}

function StyleField({ field }: { field: AnyFieldApi }) {
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="font-extrabold text-[#4c576d] text-[11px]">
        Site style
      </legend>
      <p className="mt-1 text-[11px] text-muted-text">
        A supported accent. Your choice appears on the public site.
      </p>
      <div className="mt-2 grid gap-2 sm:grid-cols-3">
        {STYLE_VALUES.map((option) => (
          <StyleOption
            checked={field.state.value === option.value}
            field={field}
            key={option.value}
            option={option}
          />
        ))}
      </div>
      <FieldErrors field={field} />
    </fieldset>
  );
}

function SiteSettingsCard({
  onSave,
  status,
}: {
  onSave: (input: SaveProSiteSettingsInput) => Promise<ProSiteStatus>;
  status: ProSiteStatus;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    defaultValues: {
      siteName: status.siteName ?? status.displayName,
      style: status.style,
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const updated = await onSave({
          siteName: value.siteName.trim() || null,
          style: value.style,
        });
        form.reset({
          siteName: updated.siteName ?? updated.displayName,
          style: updated.style,
        });
      } catch (error) {
        setFormError(messageFor(error));
      }
    },
    validators: { onSubmit: siteSettingsFormSchema },
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
    <article className="rounded-[14px] border border-line bg-card p-5">
      <h2 className="font-extrabold text-base">Site name and style</h2>
      <p className="mt-1 text-muted-text text-sm leading-relaxed">
        The site name is the brand shown in the site header and footer.
      </p>

      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        {formError ? (
          <p
            className="rounded-[10px] border border-brand/30 bg-brand/5 p-3 text-brand-strong text-xs"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <form.Subscribe selector={selectSiteSaveState}>
          {({ canSubmit, isSubmitting }) => (
            <fieldset
              aria-busy={isSubmitting}
              className="m-0 grid min-w-0 gap-4 border-0 p-0"
              disabled={isSubmitting}
            >
              <form.Field name="siteName">
                {(field) => (
                  <SiteNameField
                    displayName={status.displayName}
                    field={field}
                  />
                )}
              </form.Field>

              <form.Field name="style">
                {(field) => <StyleField field={field} />}
              </form.Field>

              <div className="flex justify-end border-line border-t pt-4">
                <button
                  className="min-h-11 rounded-[9px] bg-navy px-4 font-black text-white text-xs hover:bg-navy-deep disabled:pointer-events-none disabled:opacity-60"
                  disabled={!canSubmit || isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Saving…" : "Save changes"}
                </button>
              </div>
            </fieldset>
          )}
        </form.Subscribe>
      </form>
    </article>
  );
}

function ProSite() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { sessionQueries } = useRouter().options.context;
  const statusQuery = useQuery(trpc.proSite.status.queryOptions());
  const status = statusQuery.data;

  const saveSettings = useMutation(trpc.proSite.saveSettings.mutationOptions());
  const setPublished = useMutation(trpc.proSite.setPublished.mutationOptions());
  const statusKey = trpc.proSite.status.queryKey();
  const bySlugKey = trpc.proSite.bySlug.queryKey();
  const previewKey = trpc.proSite.preview.queryKey();

  const refreshPublicSite = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: bySlugKey }),
        queryClient.invalidateQueries({ queryKey: previewKey }),
      ]),
    [bySlugKey, previewKey, queryClient]
  );

  const handleSave = useCallback(
    async (input: SaveProSiteSettingsInput) => {
      const isCurrentSession = sessionQueries.captureScope();
      const updated = await saveSettings.mutateAsync(input);
      if (!isCurrentSession()) {
        return updated;
      }
      queryClient.setQueryData(statusKey, updated);
      await refreshPublicSite();
      if (!isCurrentSession()) {
        return updated;
      }
      toast.success("Site settings saved");
      return updated;
    },
    [queryClient, refreshPublicSite, saveSettings, sessionQueries, statusKey]
  );

  const handlePublished = useCallback(
    async (published: boolean) => {
      const isCurrentSession = sessionQueries.captureScope();
      try {
        const updated = await setPublished.mutateAsync({ published });
        if (!isCurrentSession()) {
          return true;
        }
        queryClient.setQueryData(statusKey, updated);
        await refreshPublicSite();
        if (!isCurrentSession()) {
          return true;
        }
        toast.success(
          published ? "Pro Site published" : "Pro Site unpublished"
        );
        return true;
      } catch (error) {
        if (isCurrentSession()) {
          toast.error(messageFor(error));
        }
        return false;
      }
    },
    [queryClient, refreshPublicSite, sessionQueries, setPublished, statusKey]
  );

  let content: ReactNode;
  if (statusQuery.status === "pending") {
    content = <ProSiteStatusSkeleton />;
  } else if (statusQuery.isError && (status === null || status === undefined)) {
    content = <ProSiteStatusError onRetry={statusQuery.refetch} />;
  } else if (status === null || status === undefined) {
    content = (
      <ConsoleEmptyState title="No Pro Site yet">
        <p>
          Create your master profile first. Your free Pro Site address is
          reserved once the profile exists.
        </p>
      </ConsoleEmptyState>
    );
  } else {
    content = (
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PublicationCard onChange={handlePublished} status={status} />
        <SiteSettingsCard onSave={handleSave} status={status} />
        <DataSyncCard sync={status.sync} />
      </div>
    );
  }

  return (
    <>
      <ConsolePageHeader
        action={status ? <ProSiteActions status={status} /> : undefined}
        description="Your Pro Site is generated from your master profile and current classes."
        kicker="Website"
        title="Pro Site"
      />
      {content}
    </>
  );
}
