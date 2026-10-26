import type { MasterClassView } from "@my-better-t-app/api/classes";
import { type MouseEvent, useCallback } from "react";

import { formatFee, formatSchedules, STATUS_LABELS } from "./class-values";

const STATUS_STYLES = {
  active: "bg-[#e5f1e8] text-[#40764d]",
  full: "bg-brand/10 text-brand-strong",
  paused: "bg-surface-alt text-muted-text",
} as const;

interface ClassRowProps {
  actionsDisabled: boolean;
  confirming: boolean;
  deletePending: boolean;
  item: MasterClassView;
  onCancelRemove: () => void;
  onConfirmRemove: (item: MasterClassView) => void;
  onEdit: (item: MasterClassView, trigger: HTMLButtonElement) => void;
  onRequestRemove: (id: string) => void;
  onToggleStatus: (item: MasterClassView) => void;
  statusPending: boolean;
}

function ClassRow({
  actionsDisabled,
  confirming,
  deletePending,
  item,
  onCancelRemove,
  onConfirmRemove,
  onEdit,
  onRequestRemove,
  onToggleStatus,
  statusPending,
}: ClassRowProps) {
  const handleEdit = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => onEdit(item, event.currentTarget),
    [item, onEdit]
  );
  const handleToggle = useCallback(
    () => onToggleStatus(item),
    [item, onToggleStatus]
  );
  const handleRequestRemove = useCallback(
    () => onRequestRemove(item.id),
    [item.id, onRequestRemove]
  );
  const handleConfirmRemove = useCallback(
    () => onConfirmRemove(item),
    [item, onConfirmRemove]
  );
  let toggleLabel = item.status === "paused" ? "Resume" : "Pause";
  if (statusPending) {
    toggleLabel = "Updating…";
  }
  const pauseLabel =
    item.status === "paused" ? `Resume ${item.name}` : `Pause ${item.name}`;
  const rowDisabled = actionsDisabled || statusPending || deletePending;

  return (
    <>
      <tr className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2 border-line border-b px-4 py-4 last:border-b-0 md:table-row md:px-0 md:py-0">
        <td className="col-span-3 min-w-0 md:col-span-1 md:table-cell md:px-4 md:py-4">
          <strong className="block font-extrabold text-sm [overflow-wrap:anywhere]">
            {item.name}
          </strong>
          <span className="mt-1 block text-[11px] text-muted-text [overflow-wrap:anywhere]">
            {item.martialArt.name} · {item.location.name}
          </span>
        </td>
        <td className="min-w-0 text-[11px] text-muted-text leading-relaxed md:table-cell md:px-4 md:py-4 md:text-xs">
          {formatSchedules(item.schedules)}
        </td>
        <td className="hidden whitespace-nowrap text-muted-text text-xs md:table-cell md:px-4 md:py-4">
          {formatFee(item.feeAmount, item.feePeriod)}
        </td>
        <td className="md:table-cell md:px-4 md:py-4">
          <span
            className={`inline-flex w-max rounded-full px-2 py-1 font-extrabold text-[10px] ${STATUS_STYLES[item.status]}`}
          >
            {STATUS_LABELS[item.status]}
          </span>
        </td>
        <td className="md:table-cell md:px-4 md:py-4">
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
            <button
              aria-label={`Edit ${item.name}`}
              className="min-h-9 rounded-[7px] px-2 font-black text-[11px] text-accent-text hover:underline disabled:pointer-events-none disabled:opacity-40"
              disabled={rowDisabled}
              onClick={handleEdit}
              type="button"
            >
              Edit
            </button>
            <button
              aria-label={pauseLabel}
              className="min-h-9 rounded-[7px] px-2 font-black text-[11px] text-accent-text hover:underline disabled:pointer-events-none disabled:opacity-50"
              disabled={rowDisabled}
              onClick={handleToggle}
              type="button"
            >
              {toggleLabel}
            </button>
            <button
              aria-label={`Remove ${item.name}`}
              className="min-h-9 rounded-[7px] px-2 font-black text-[11px] text-brand-strong hover:underline disabled:pointer-events-none disabled:opacity-40"
              disabled={rowDisabled}
              onClick={handleRequestRemove}
              type="button"
            >
              Remove
            </button>
          </div>
        </td>
      </tr>
      {confirming ? (
        <tr className="grid grid-cols-1 border-line border-b bg-brand/5 last:border-b-0 md:table-row">
          <td className="p-4 md:table-cell" colSpan={5}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[70ch] text-xs" role="alert">
                Remove <strong>{item.name}</strong>? Its weekly schedule will be
                removed too.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  className="min-h-9 rounded-[8px] bg-brand-strong px-3 font-black text-[11px] text-white hover:bg-brand disabled:pointer-events-none disabled:opacity-60"
                  disabled={deletePending}
                  onClick={handleConfirmRemove}
                  type="button"
                >
                  {deletePending ? "Removing…" : "Remove class"}
                </button>
                <button
                  className="min-h-9 rounded-[8px] border border-line bg-card px-3 font-black text-[11px] hover:bg-surface-alt"
                  disabled={deletePending}
                  onClick={onCancelRemove}
                  type="button"
                >
                  Keep class
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}

interface ClassesTableProps {
  actionsDisabled: boolean;
  classes: MasterClassView[];
  confirmingId: string | null;
  deletePendingId: string | null;
  onCancelRemove: () => void;
  onConfirmRemove: (item: MasterClassView) => void;
  onEdit: (item: MasterClassView, trigger: HTMLButtonElement) => void;
  onRequestRemove: (id: string) => void;
  onToggleStatus: (item: MasterClassView) => void;
  statusPendingId: string | null;
}

export function ClassesTable({
  actionsDisabled,
  classes,
  confirmingId,
  deletePendingId,
  onCancelRemove,
  onConfirmRemove,
  onEdit,
  onRequestRemove,
  onToggleStatus,
  statusPendingId,
}: ClassesTableProps) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-card">
      <table className="w-full border-collapse">
        <caption className="sr-only">Your classes</caption>
        <thead className="sr-only md:not-sr-only md:table-header-group md:bg-surface-alt/60">
          <tr className="border-line border-b">
            <th
              className="px-4 py-3 text-left font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em]"
              scope="col"
            >
              Class
            </th>
            <th
              className="px-4 py-3 text-left font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em]"
              scope="col"
            >
              Schedule
            </th>
            <th
              className="px-4 py-3 text-left font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em]"
              scope="col"
            >
              Fee
            </th>
            <th
              className="px-4 py-3 text-left font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em]"
              scope="col"
            >
              Status
            </th>
            <th
              className="px-4 py-3 text-right font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em]"
              scope="col"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {classes.map((item) => (
            <ClassRow
              actionsDisabled={actionsDisabled}
              confirming={confirmingId === item.id}
              deletePending={deletePendingId === item.id}
              item={item}
              key={item.id}
              onCancelRemove={onCancelRemove}
              onConfirmRemove={onConfirmRemove}
              onEdit={onEdit}
              onRequestRemove={onRequestRemove}
              onToggleStatus={onToggleStatus}
              statusPending={statusPendingId === item.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
