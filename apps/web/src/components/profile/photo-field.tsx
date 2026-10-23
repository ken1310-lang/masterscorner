import {
  MEDIA_IMAGE_TYPES,
  MEDIA_MAX_BYTES,
  type MediaImageType,
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
const INPUT_ID = "profile-photo-input";
const HINT_ID = "profile-photo-hint";
const ERROR_ID = "profile-photo-error";

type PhotoStatus = "idle" | "reading" | "uploading" | "removing";

const STATUS_MESSAGES: Record<PhotoStatus, string> = {
  idle: "",
  reading: "Reading the image…",
  removing: "Removing…",
  uploading: "Uploading…",
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

interface PhotoFieldProps {
  accountName: string;
  disabled: boolean;
  hasProfile: boolean;
  media: MediaView[];
}

export function PhotoField({
  accountName,
  disabled,
  hasProfile,
  media,
}: PhotoFieldProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { sessionQueries } = useRouter().options.context;
  const upload = useMutation(trpc.media.upload.mutationOptions());
  const remove = useMutation(trpc.media.remove.mutationOptions());
  const [status, setStatus] = useState<PhotoStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const photo = media.find((item) => item.kind === "profile_photo") ?? null;
  const busy = status !== "idle";
  const canEdit = hasProfile && !disabled && !busy;

  const fail = useCallback((message: string) => {
    setError(message);
    setStatus("idle");
  }, []);

  const uploadPhoto = useCallback(
    async (file: File) => {
      setError(null);
      const problem = fileProblem(file);
      if (problem) {
        fail(problem);
        return;
      }

      const contentType = file.type as MediaImageType;
      const isCurrentSession = sessionQueries.captureScope();
      setStatus("reading");
      let data: string;
      try {
        data = await readBase64(file);
      } catch {
        fail("The image could not be read. Choose the file again.");
        return;
      }

      setStatus("uploading");
      try {
        const saved = await upload.mutateAsync({
          contentType,
          data,
          kind: "profile_photo",
        });
        if (isCurrentSession()) {
          queryClient.setQueryData(trpc.master.getProfile.queryKey(), saved);
          toast.success(photo ? "Photo replaced" : "Photo added");
          setStatus("idle");
        }
      } catch (uploadError) {
        if (isCurrentSession()) {
          fail(
            uploadError instanceof Error
              ? uploadError.message
              : "The photo could not be uploaded. Try again."
          );
        }
      }
    },
    [fail, photo, queryClient, sessionQueries, trpc.master.getProfile, upload]
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
      const saved = await remove.mutateAsync({ kind: "profile_photo" });
      if (isCurrentSession()) {
        queryClient.setQueryData(trpc.master.getProfile.queryKey(), saved);
        toast.success("Photo removed");
        setStatus("idle");
      }
    } catch (removeError) {
      if (isCurrentSession()) {
        fail(
          removeError instanceof Error
            ? removeError.message
            : "The photo could not be removed. Try again."
        );
      }
    }
  }, [fail, queryClient, remove, sessionQueries, trpc.master.getProfile]);

  return (
    <section
      aria-busy={busy}
      className="rounded-[14px] border border-line bg-card p-5"
    >
      <h2 className="mb-[18px] font-extrabold text-base">Profile photo</h2>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy font-extrabold text-white text-xl">
          {photo ? (
            <img
              alt={accountName}
              className="size-full object-cover"
              height={96}
              src={photo.url}
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
                htmlFor={INPUT_ID}
              >
                {photo ? "Replace photo" : "Choose photo"}
              </label>
              <input
                accept={MEDIA_IMAGE_TYPES.join(",")}
                aria-describedby={error ? `${HINT_ID} ${ERROR_ID}` : HINT_ID}
                aria-invalid={error ? true : undefined}
                className="sr-only"
                disabled={!canEdit}
                id={INPUT_ID}
                onChange={handleFile}
                type="file"
              />
            </div>
            {photo ? (
              <button
                className="min-h-11 rounded-[9px] px-3 font-extrabold text-brand-strong text-xs underline-offset-4 hover:underline disabled:opacity-60"
                disabled={!canEdit}
                onClick={removePhoto}
                type="button"
              >
                Remove photo
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-[11px] text-muted-text" id={HINT_ID}>
            {hasProfile
              ? `JPEG, PNG or WebP, up to ${SIZE_LABEL}. Replacing it keeps the old image out of your profile.`
              : "Save your profile once to add a photo."}
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
              id={ERROR_ID}
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
