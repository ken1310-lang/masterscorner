import {
  MAX_LOCATIONS,
  MAX_MARTIAL_ARTS,
  type MasterProfilePayload,
  profileFormSchema,
} from "@my-better-t-app/api/master-profile";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { FormEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { ConsolePageHeader } from "@/components/console/page-header";
import { useTRPC } from "@/utils/trpc";
import { PhotoField } from "./photo-field";
import { fieldErrorMessages, ProfileField } from "./profile-field";
import { ProfileAddButton, ProfileNameRow } from "./profile-name-row";
import { initialProfileValues, profileValuesToInput } from "./profile-values";

const FORM_ID = "profile-form";
const sectionClassName = "rounded-[14px] border border-line bg-card p-5";
const headingClassName = "font-extrabold text-base";

function selectSaveState(state: { canSubmit: boolean; isSubmitting: boolean }) {
  return { canSubmit: state.canSubmit, isSubmitting: state.isSubmitting };
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

interface ProfileFormProps {
  accountName: string;
  payload: MasterProfilePayload;
}

export function ProfileForm({ accountName, payload }: ProfileFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { sessionQueries } = useRouter().options.context;
  const [formError, setFormError] = useState<string | null>(null);

  const saveProfile = useMutation(trpc.master.saveProfile.mutationOptions());
  const directoryClassesKey = trpc.directory.classes.queryKey();
  const directoryMastersKey = trpc.directory.masters.queryKey();
  const directoryMasterProfileKey = trpc.directory.masterProfile.queryKey();
  const proSiteBySlugKey = trpc.proSite.bySlug.queryKey();
  const proSitePreviewKey = trpc.proSite.preview.queryKey();
  const proSiteStatusKey = trpc.proSite.status.queryKey();

  const form = useForm({
    defaultValues: initialProfileValues(accountName, payload),
    onSubmit: async ({ formApi, value }) => {
      setFormError(null);
      const isCurrentSession = sessionQueries.captureScope();
      const queryKey = trpc.master.getProfile.queryKey();
      try {
        await queryClient.cancelQueries(
          { queryKey, exact: true },
          { silent: true }
        );
        if (!isCurrentSession()) {
          return;
        }
        const saved = await saveProfile.mutateAsync(
          profileValuesToInput(value)
        );
        if (!isCurrentSession()) {
          return;
        }
        // A focus/reconnect refetch may have started while the save was pending.
        await queryClient.cancelQueries(
          { queryKey, exact: true },
          { silent: true }
        );
        if (!isCurrentSession()) {
          return;
        }
        queryClient.setQueryData<MasterProfilePayload>(queryKey, (current) =>
          current ? { ...saved, media: current.media } : undefined
        );
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: directoryClassesKey,
          }),
          queryClient.invalidateQueries({
            queryKey: directoryMastersKey,
          }),
          queryClient.invalidateQueries({
            queryKey: directoryMasterProfileKey,
          }),
          queryClient.invalidateQueries({ queryKey: proSiteBySlugKey }),
          queryClient.invalidateQueries({ queryKey: proSitePreviewKey }),
          queryClient.invalidateQueries({ queryKey: proSiteStatusKey }),
        ]);
        if (!isCurrentSession()) {
          return;
        }
        toast.success("Profile saved");
        formApi.reset(initialProfileValues(accountName, saved));
      } catch (error) {
        if (isCurrentSession()) {
          setFormError(
            error instanceof Error
              ? error.message
              : "The profile could not be saved. Try again."
          );
        }
      }
    },
    validators: { onSubmit: profileFormSchema },
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
    <>
      <form.Subscribe selector={selectSaveState}>
        {({ canSubmit, isSubmitting }) => (
          <ConsolePageHeader
            action={
              <button
                className="min-h-11 rounded-[9px] bg-navy px-3.5 py-[11px] font-black text-white text-xs hover:bg-navy-deep disabled:pointer-events-none disabled:opacity-60"
                disabled={!canSubmit || isSubmitting}
                form={FORM_ID}
                type="submit"
              >
                {isSubmitting ? "Saving…" : "Save changes"}
              </button>
            }
            description="Edit once. MastersCorner listing and Pro Site use the same data."
            kicker="Public identity"
            title="Master profile"
          />
        )}
      </form.Subscribe>

      <form className="grid gap-3.5" id={FORM_ID} onSubmit={handleSubmit}>
        {formError ? (
          <p
            className="rounded-[10px] border border-brand/30 bg-brand/5 p-3 text-brand-strong text-xs"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <form.Subscribe selector={selectSaveState}>
          {(isSubmittingState) => (
            <fieldset
              aria-busy={isSubmittingState.isSubmitting}
              className="m-0 grid min-w-0 gap-3.5 border-0 p-0"
              disabled={isSubmittingState.isSubmitting}
            >
              <section className={sectionClassName}>
                <h2 className={`mb-[18px] ${headingClassName}`}>Identity</h2>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <form.Field name="displayName">
                      {(field) => (
                        <ProfileField
                          autoComplete="name"
                          field={field}
                          label="Display name"
                          placeholder="e.g. Master Arun Vel"
                        />
                      )}
                    </form.Field>
                  </div>
                  <form.Field name="yearsTeaching">
                    {(field) => (
                      <ProfileField
                        field={field}
                        hint="Leave blank if you prefer not to say."
                        inputMode="numeric"
                        label="Years teaching"
                        placeholder="e.g. 18"
                      />
                    )}
                  </form.Field>
                  <form.Field name="homeCity">
                    {(field) => (
                      <ProfileField
                        autoComplete="address-level2"
                        field={field}
                        label="Home city"
                        placeholder="e.g. Chennai"
                      />
                    )}
                  </form.Field>
                </div>
                <div className="mt-3.5">
                  <form.Field name="introduction">
                    {(field) => (
                      <ProfileField
                        field={field}
                        label="Profile introduction"
                        multiline
                        placeholder="Describe how and who you teach."
                      />
                    )}
                  </form.Field>
                </div>
              </section>

              <PhotoField
                accountName={accountName}
                disabled={isSubmittingState.isSubmitting}
                hasProfile={payload.profile !== null}
                media={payload.media}
              />

              <section className={sectionClassName}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className={headingClassName}>Martial arts</h2>
                  <span className="font-extrabold text-[9px] text-muted-text uppercase tracking-[.08em]">
                    First is primary
                  </span>
                </div>
                <p className="mt-1 mb-[18px] text-muted-text text-xs leading-relaxed">
                  List only the disciplines you teach. The primary art leads
                  your public profile.
                </p>

                <form.Field mode="array" name="martialArts">
                  {(field) => (
                    <>
                      <div className="divide-y divide-line">
                        {field.state.value.map((row, index) => (
                          <form.Field
                            key={row.id ?? `new-art-${index}`}
                            name={`martialArts[${index}].name`}
                          >
                            {(nameField) => (
                              <ProfileNameRow
                                arrayField={field}
                                index={index}
                                label="Martial art"
                                nameField={nameField}
                                placeholder="e.g. Silambam"
                                primary={index === 0}
                              />
                            )}
                          </form.Field>
                        ))}
                      </div>
                      <ListErrors messages={fieldErrorMessages(field)} />
                      <ProfileAddButton
                        arrayField={field}
                        label="Add martial art"
                        max={MAX_MARTIAL_ARTS}
                      />
                    </>
                  )}
                </form.Field>
              </section>

              <section className={sectionClassName}>
                <h2 className={headingClassName}>Teaching locations</h2>
                <p className="mt-1 mb-[18px] text-muted-text text-xs leading-relaxed">
                  Add each place you teach. The order here is the order shown on
                  your profile.
                </p>

                <form.Field mode="array" name="locations">
                  {(field) => (
                    <>
                      {field.state.value.length === 0 ? (
                        <p className="text-muted-text text-xs">
                          No teaching locations yet.
                        </p>
                      ) : (
                        <div className="divide-y divide-line">
                          {field.state.value.map((row, index) => (
                            <form.Field
                              key={row.id ?? `new-location-${index}`}
                              name={`locations[${index}].name`}
                            >
                              {(nameField) => (
                                <ProfileNameRow
                                  arrayField={field}
                                  index={index}
                                  label="Location"
                                  nameField={nameField}
                                  placeholder="e.g. Nanganallur"
                                />
                              )}
                            </form.Field>
                          ))}
                        </div>
                      )}
                      <ListErrors messages={fieldErrorMessages(field)} />
                      <ProfileAddButton
                        arrayField={field}
                        label="Add location"
                        max={MAX_LOCATIONS}
                      />
                    </>
                  )}
                </form.Field>
              </section>
            </fieldset>
          )}
        </form.Subscribe>
      </form>
    </>
  );
}
