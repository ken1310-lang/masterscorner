import type {
  ClassesPayload,
  MasterClassView,
  SaveClassInput,
} from "@my-better-t-app/api/classes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { ConsoleEmptyState } from "@/components/console/empty-state";
import { ConsolePageHeader } from "@/components/console/page-header";
import Loader from "@/components/loader";
import { useTRPC } from "@/utils/trpc";
import { ClassForm } from "./class-form";
import { statusAfterToggle } from "./class-values";
import { ClassesTable } from "./classes-table";

type EditorState =
  | { mode: "new" }
  | { item: MasterClassView; mode: "edit" }
  | null;

function messageFor(error: unknown) {
  return error instanceof Error
    ? error.message
    : "The class could not be updated. Try again.";
}

function upsertClass(payload: ClassesPayload, saved: MasterClassView) {
  const exists = payload.classes.some((item) => item.id === saved.id);
  return {
    ...payload,
    classes: exists
      ? payload.classes.map((item) => (item.id === saved.id ? saved : item))
      : [saved, ...payload.classes],
  };
}

export function ClassesScreen() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { sessionQueries } = useRouter().options.context;
  const classesQuery = useQuery({
    ...trpc.classes.list.queryOptions(),
    staleTime: 0,
  });
  const [editor, setEditor] = useState<EditorState>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [statusPendingId, setStatusPendingId] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

  const saveClass = useMutation(trpc.classes.save.mutationOptions());
  const setStatus = useMutation(trpc.classes.setStatus.mutationOptions());
  const removeClass = useMutation(trpc.classes.remove.mutationOptions());
  const queryKey = trpc.classes.list.queryKey();
  const directoryClassesKey = trpc.directory.classes.queryKey();
  const directoryMastersKey = trpc.directory.masters.queryKey();
  const directoryMasterProfileKey = trpc.directory.masterProfile.queryKey();

  const invalidatePublicDirectory = useCallback(
    () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: directoryClassesKey }),
        queryClient.invalidateQueries({ queryKey: directoryMastersKey }),
        queryClient.invalidateQueries({
          queryKey: directoryMasterProfileKey,
        }),
      ]),
    [
      directoryClassesKey,
      directoryMasterProfileKey,
      directoryMastersKey,
      queryClient,
    ]
  );

  const handleRetry = useCallback(() => {
    classesQuery.refetch();
  }, [classesQuery]);
  const closeEditor = useCallback(() => setEditor(null), []);
  const startNewClass = useCallback(() => {
    setConfirmingId(null);
    setEditor({ mode: "new" });
  }, []);
  const editClass = useCallback((item: MasterClassView) => {
    setConfirmingId(null);
    setEditor({ item, mode: "edit" });
  }, []);
  const cancelRemove = useCallback(() => setConfirmingId(null), []);

  const handleSave = useCallback(
    async (input: SaveClassInput) => {
      const isCurrentSession = sessionQueries.captureScope();
      await queryClient.cancelQueries(
        { exact: true, queryKey },
        { silent: true }
      );
      if (!isCurrentSession()) {
        return;
      }
      const saved = await saveClass.mutateAsync(input);
      if (!isCurrentSession()) {
        return;
      }
      await queryClient.cancelQueries(
        { exact: true, queryKey },
        { silent: true }
      );
      if (!isCurrentSession()) {
        return;
      }
      queryClient.setQueryData<ClassesPayload>(queryKey, (current) =>
        current ? upsertClass(current, saved) : current
      );
      await invalidatePublicDirectory();
      if (!isCurrentSession()) {
        return;
      }
      toast.success(input.id ? "Class updated" : "Class added");
      setEditor(null);
    },
    [
      invalidatePublicDirectory,
      queryClient,
      queryKey,
      saveClass,
      sessionQueries,
    ]
  );

  const handleToggleStatus = useCallback(
    async (item: MasterClassView) => {
      const isCurrentSession = sessionQueries.captureScope();
      const nextStatus = statusAfterToggle(item.status, item.pausedFromStatus);
      setStatusPendingId(item.id);
      try {
        const updated = await setStatus.mutateAsync({
          id: item.id,
          status: nextStatus,
        });
        if (!isCurrentSession()) {
          return;
        }
        await queryClient.cancelQueries(
          { exact: true, queryKey },
          { silent: true }
        );
        if (!isCurrentSession()) {
          return;
        }
        queryClient.setQueryData<ClassesPayload>(queryKey, (current) =>
          current
            ? {
                ...current,
                classes: current.classes.map((candidate) =>
                  candidate.id === updated.id
                    ? {
                        ...candidate,
                        pausedFromStatus: updated.pausedFromStatus,
                        status: updated.status,
                      }
                    : candidate
                ),
              }
            : current
        );
        await invalidatePublicDirectory();
        if (!isCurrentSession()) {
          return;
        }
        let message = "Class resumed";
        if (nextStatus === "paused") {
          message = "Class paused";
        } else if (nextStatus === "full") {
          message = "Class resumed as full";
        }
        toast.success(message);
      } catch (error) {
        if (isCurrentSession()) {
          toast.error(messageFor(error));
        }
      } finally {
        setStatusPendingId(null);
      }
    },
    [
      invalidatePublicDirectory,
      queryClient,
      queryKey,
      sessionQueries,
      setStatus,
    ]
  );

  const handleRemove = useCallback(
    async (item: MasterClassView) => {
      const isCurrentSession = sessionQueries.captureScope();
      setDeletePendingId(item.id);
      try {
        await removeClass.mutateAsync({ id: item.id });
        if (!isCurrentSession()) {
          return;
        }
        await queryClient.cancelQueries(
          { exact: true, queryKey },
          { silent: true }
        );
        if (!isCurrentSession()) {
          return;
        }
        queryClient.setQueryData<ClassesPayload>(queryKey, (current) =>
          current
            ? {
                ...current,
                classes: current.classes.filter(
                  (candidate) => candidate.id !== item.id
                ),
              }
            : current
        );
        await invalidatePublicDirectory();
        if (!isCurrentSession()) {
          return;
        }
        setConfirmingId(null);
        toast.success("Class removed");
      } catch (error) {
        if (isCurrentSession()) {
          toast.error(messageFor(error));
        }
      } finally {
        setDeletePendingId(null);
      }
    },
    [
      invalidatePublicDirectory,
      queryClient,
      queryKey,
      removeClass,
      sessionQueries,
    ]
  );

  if (classesQuery.status === "pending") {
    return <Loader />;
  }
  if (classesQuery.isError && !classesQuery.data) {
    return (
      <ConsoleEmptyState title="Classes could not load">
        <p>{classesQuery.error.message}</p>
        <button
          className="mt-3 min-h-11 font-extrabold text-accent-text text-sm underline-offset-4 hover:underline"
          onClick={handleRetry}
          type="button"
        >
          Try again
        </button>
      </ConsoleEmptyState>
    );
  }
  if (!classesQuery.data) {
    return <Loader />;
  }

  const payload = classesQuery.data;
  const canCreate =
    payload.martialArts.length > 0 && payload.locations.length > 0;
  const action =
    !editor && canCreate ? (
      <button
        className="min-h-11 rounded-[9px] bg-navy px-3.5 py-[11px] font-black text-white text-xs hover:bg-navy-deep"
        onClick={startNewClass}
        type="button"
      >
        New class
      </button>
    ) : null;

  return (
    <>
      <ConsolePageHeader
        action={action}
        description="Publish the classes you teach and keep their weekly schedule current."
        kicker="Teaching"
        title="Classes"
      />

      {classesQuery.isError ? (
        <div
          className="mb-4 flex flex-col gap-2 rounded-[10px] border border-line bg-surface-alt px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          role="status"
        >
          <p className="text-muted-text text-xs">
            Could not refresh classes. Showing the last loaded list.
          </p>
          <button
            className="min-h-9 font-extrabold text-accent-text text-xs underline-offset-4 hover:underline"
            onClick={handleRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : null}

      {editor ? (
        <ClassForm
          initial={editor.mode === "edit" ? editor.item : null}
          key={editor.mode === "edit" ? editor.item.id : "new-class"}
          onCancel={closeEditor}
          onSave={handleSave}
          options={{
            locations: payload.locations,
            martialArts: payload.martialArts,
          }}
        />
      ) : null}

      {payload.classes.length > 0 ? (
        <ClassesTable
          actionsDisabled={editor !== null}
          classes={payload.classes}
          confirmingId={confirmingId}
          deletePendingId={deletePendingId}
          onCancelRemove={cancelRemove}
          onConfirmRemove={handleRemove}
          onEdit={editClass}
          onRequestRemove={setConfirmingId}
          onToggleStatus={handleToggleStatus}
          statusPendingId={statusPendingId}
        />
      ) : null}

      {payload.classes.length === 0 && !editor ? (
        <ConsoleEmptyState
          title={canCreate ? "No classes yet" : "Add teaching details first"}
        >
          {canCreate ? (
            <>
              <p>
                Publish your first class with a weekly schedule so students can
                see when and where you teach.
              </p>
              <button
                className="mt-3 min-h-11 font-extrabold text-accent-text text-sm underline-offset-4 hover:underline"
                onClick={startNewClass}
                type="button"
              >
                Create your first class
              </button>
            </>
          ) : (
            <>
              <p>
                A class needs one of your martial arts and a teaching location.
                Add both to your master profile, then return here.
              </p>
              <Link
                className="mt-3 inline-flex min-h-11 items-center font-extrabold text-accent-text text-sm underline-offset-4 hover:underline"
                to="/dashboard/profile"
              >
                Open profile
              </Link>
            </>
          )}
        </ConsoleEmptyState>
      ) : null}
    </>
  );
}
