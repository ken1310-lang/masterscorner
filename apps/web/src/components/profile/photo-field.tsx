import type { MasterProfilePayload } from "@my-better-t-app/api/master-profile";
import {
  MEDIA_IMAGE_TYPES,
  MEDIA_MAX_BYTES,
  type MediaImageType,
  type MediaKind,
  type MediaView,
} from "@my-better-t-app/api/media";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { ChangeEvent } from "react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useTRPC } from "@/utils/trpc";

/** Declared here because NumberFormat is not involved; 5 MiB in a message. */
const SIZE_LABEL = "5 MB";
const NAME_SEPARATOR = /\s+/;
const TYPE_MESSAGE = "Choose a JPEG, PNG or WebP image.";

type MediaFieldStatus = "idle" | "reading" | "uploading" | "removing";

const STATUS_MESSAGES: Record<MediaFieldStatus, string> = {
  idle: "",
  reading: "Reading the image…",
  removing: "Removing…",
  uploading: "Uploading…",
};

interface MediaFieldCopy {
  added: string;
  choose: string;
  heading: string;
  hint: string;
  missingProfile: string;
  remove: string;
  removed: string;
  removeError: string;
  replace: string;
  replaced: string;
  uploadError: string;
}

const PROFILE_PHOTO_COPY: MediaFieldCopy = {
  added: "Photo added",
  choose: "Choose photo",
  heading: "Profile photo",
  hint: `JPEG, PNG or WebP, up to ${SIZE_LABEL}. Replacing it keeps the old image out of your profile.`,
  missingProfile: "Save your profile once to add a photo.",
  remove: "Remove photo",
  removed: "Photo removed",
  removeError: "The photo could not be removed. Try again.",
  replace: "Replace photo",
  replaced: "Photo replaced",
  uploadError: "The photo could not be uploaded. Try again.",
};

const SITE_LOGO_COPY: MediaFieldCopy = {
  added: "Logo added",
  choose: "Choose logo",
  heading: "Pro Site logo",
  hint: `JPEG, PNG or WebP, up to ${SIZE_LABEL}. Appears in the Pro Site header.`,
  missingProfile: "Save your profile once to add a logo.",
  remove: "Remove logo",
  removed: "Logo removed",
  removeError: "The logo could not be removed. Try again.",
  replace: "Replace logo",
  replaced: "Logo replaced",
  uploadError: "The logo could not be uploaded. Try again.",
};

function readBase64(file: File): Promise<string> {
  const { promise, reject, resolve } = Promise.withResolvers<string>();
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error ?? new Error("Read failed"));
  reader.onload = () => {
    const result = String(reader.result ?? "");
    resolve(result.slice(result.indexOf(",") + 1));
  };
  reader.readAsDataURL(file);
  return promise;
}

function fileProblem(file: File) {
  if (!MEDIA_IMAGE_TYPES.includes(file.type as MediaImageType)) {
    return TYPE_MESSAGE;
  }
  if (file.size === 0) {
    return "That file is empty. Choose another image.";
  }
  if (file.size > MEDIA_MAX_BYTES) {
    return `The image is larger than ${SIZE_LABEL}. Choose a smaller file.`;
  }
  return null;
}

function initialsFor(name: string) {
  const initials = name
    .split(NAME_SEPARATOR)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "MC";
}

function mergeMedia(
  current: readonly MediaView[],
  saved: readonly MediaView[],
  kind: MediaKind
): MediaView[] {
  const merged = new Map<string, MediaView>();
  // Each field owns one kind. A response may carry the other kind replaced
  // elsewhere; seeding it beside the cached row would leave two ids of the same
  // kind. Keep the cached other kind until a profile read adopts the server's
  // current row.
  for (const item of current) {
    if (item.kind !== kind) {
      merged.set(item.id, item);
    }
  }
  for (const item of saved) {
    if (item.kind === kind) {
      merged.set(item.id, item);
    }
  }
  return [...merged.values()].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt)
  );
}

interface PhotoFieldProps {
  accountName: string;
  disabled: boolean;
  hasProfile: boolean;
  kind?: MediaKind;
  media: MediaView[];
}

export function PhotoField({
  accountName,
  disabled,
  hasProfile,
  kind = "profile_photo",
  media,
}: PhotoFieldProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { sessionQueries } = useRouter().options.context;
  const upload = useMutation(trpc.media.upload.mutationOptions());
  const remove = useMutation(trpc.media.remove.mutationOptions());
  const [status, setStatus] = useState<MediaFieldStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const copy = kind === "site_logo" ? SITE_LOGO_COPY : PROFILE_PHOTO_COPY;
  const prefix = kind === "site_logo" ? "site-logo" : "profile-photo";
  const inputId = `${prefix}-input`;
  const hintId = `${prefix}-hint`;
  const errorId = `${prefix}-error`;

  const asset = media.find((item) => item.kind === kind) ?? null;
  const busy = status !== "idle";
  const canEdit = hasProfile && !disabled && !busy;

  const fail = useCallback((message: string) => {
    setError(message);
    setStatus("idle");
  }, []);

  const applyMedia = useCallback(
    (saved: MasterProfilePayload) => {
      queryClient.setQueryData<MasterProfilePayload>(
        trpc.master.getProfile.queryKey(),
        (current) =>
          current
            ? {
                ...current,
                media: mergeMedia(current.media, saved.media, kind),
              }
            : undefined
      );
    },
    [kind, queryClient, trpc.master.getProfile]
  );

  const proSiteBySlugKey = trpc.proSite.bySlug.queryKey();
  const proSitePreviewKey = trpc.proSite.preview.queryKey();
  const proSiteStatusKey = trpc.proSite.status.queryKey();

  const invalidatePublicProfile = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: trpc.directory.masterProfile.queryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: trpc.directory.masters.queryKey(),
        }),
        queryClient.invalidateQueries({ queryKey: proSiteBySlugKey }),
        queryClient.invalidateQueries({ queryKey: proSitePreviewKey }),
        queryClient.invalidateQueries({ queryKey: proSiteStatusKey }),
      ]),
    [
      proSiteBySlugKey,
      proSitePreviewKey,
      proSiteStatusKey,
      queryClient,
      trpc.directory.masterProfile,
      trpc.directory.masters,
    ]
  );

  const uploadImage = useCallback(
    async (
      contentType: MediaImageType,
      data: string,
      isCurrentSession: () => boolean
    ) => {
      setStatus("uploading");
      try {
        const queryKey = trpc.master.getProfile.queryKey();
        await queryClient.cancelQueries(
          { queryKey, exact: true },
          { silent: true }
        );
        if (!isCurrentSession()) {
          return;
        }
        const saved = await upload.mutateAsync({
          contentType,
          data,
          kind,
        });
        if (!isCurrentSession()) {
          return;
        }
        await queryClient.cancelQueries(
          { queryKey, exact: true },
          { silent: true }
        );
        if (!isCurrentSession()) {
          return;
        }
        applyMedia(saved);
        await invalidatePublicProfile();
        if (!isCurrentSession()) {
          return;
        }
        toast.success(asset ? copy.replaced : copy.added);
        setStatus("idle");
      } catch (uploadError) {
        if (isCurrentSession()) {
          fail(
            uploadError instanceof Error
              ? uploadError.message
              : copy.uploadError
          );
        }
      }
    },
    [
      applyMedia,
      asset,
      copy,
      fail,
      invalidatePublicProfile,
      kind,
      queryClient,
      trpc.master.getProfile,
      upload,
    ]
  );

  const uploadPhoto = useCallback(
    async (file: File) => {
      setError(null);
      const problem = fileProblem(file);
      if (problem) {
        fail(problem);
        return;
      }

      const isCurrentSession = sessionQueries.captureScope();
      setStatus("reading");
      let data: string;
      try {
        data = await readBase64(file);
      } catch {
        if (isCurrentSession()) {
          fail("The image could not be read. Choose the file again.");
        }
        return;
      }
      if (!isCurrentSession()) {
        return;
      }
      await uploadImage(file.type as MediaImageType, data, isCurrentSession);
    },
    [fail, sessionQueries, uploadImage]
  );

  const handleFile = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      event.currentTarget.value = "";
      if (file) {
        uploadPhoto(file);
      }
    },
    [uploadPhoto]
  );

  const removePhoto = useCallback(async () => {
    setError(null);
    const isCurrentSession = sessionQueries.captureScope();
    setStatus("removing");
    try {
      const queryKey = trpc.master.getProfile.queryKey();
      await queryClient.cancelQueries(
        { queryKey, exact: true },
        { silent: true }
      );
      if (!isCurrentSession()) {
        return;
      }
      const saved = await remove.mutateAsync({ kind });
      if (!isCurrentSession()) {
        return;
      }
      await queryClient.cancelQueries(
        { queryKey, exact: true },
        { silent: true }
      );
      if (!isCurrentSession()) {
        return;
      }
      applyMedia(saved);
      await invalidatePublicProfile();
      if (!isCurrentSession()) {
        return;
      }
      toast.success(copy.removed);
      setStatus("idle");
    } catch (removeError) {
      if (isCurrentSession()) {
        fail(
          removeError instanceof Error ? removeError.message : copy.removeError
        );
      }
    }
  }, [
    applyMedia,
    copy,
    fail,
    invalidatePublicProfile,
    kind,
    queryClient,
    remove,
    sessionQueries,
    trpc.master.getProfile,
  ]);

  return (
    <section
      aria-busy={busy}
      className="rounded-[14px] border border-line bg-card p-5"
    >
      <h2 className="mb-[18px] font-extrabold text-base">{copy.heading}</h2>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy font-extrabold text-white text-xl">
          {asset ? (
            <img
              alt={
                kind === "site_logo"
                  ? `${accountName} Pro Site logo`
                  : accountName
              }
              className="size-full object-cover"
              height={96}
              src={asset.url}
              width={96}
            />
          ) : (
            <span aria-hidden>{initialsFor(accountName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-[9px] focus-within:outline focus-within:outline-2 focus-within:outline-navy focus-within:outline-offset-2">
              <label
                className={`inline-flex min-h-11 items-center rounded-[9px] border border-line bg-card px-3.5 font-extrabold text-xs ${
                  canEdit
                    ? "cursor-pointer hover:border-navy"
                    : "cursor-not-allowed opacity-60"
                }`}
                htmlFor={inputId}
              >
                {asset ? copy.replace : copy.choose}
              </label>
              <input
                accept={MEDIA_IMAGE_TYPES.join(",")}
                aria-describedby={error ? `${hintId} ${errorId}` : hintId}
                aria-invalid={error ? true : undefined}
                className="sr-only"
                disabled={!canEdit}
                id={inputId}
                onChange={handleFile}
                type="file"
              />
            </div>
            {asset ? (
              <button
                className="min-h-11 rounded-[9px] px-3 font-extrabold text-brand-strong text-xs underline-offset-4 hover:underline disabled:opacity-60"
                disabled={!canEdit}
                onClick={removePhoto}
                type="button"
              >
                {copy.remove}
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-muted-text" id={hintId}>
            {hasProfile ? copy.hint : copy.missingProfile}
          </p>
          <p
            aria-live="polite"
            className="mt-1 text-[11px] text-muted-text"
            role="status"
          >
            {STATUS_MESSAGES[status]}
          </p>
          {error ? (
            <p
              className="mt-2 text-[11px] text-brand-strong"
              id={errorId}
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
