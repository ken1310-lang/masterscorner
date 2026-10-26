import { Input } from "@my-better-t-app/ui/components/input";
import type { AnyFieldApi } from "@tanstack/react-form";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { ChangeEvent } from "react";
import { useCallback } from "react";

import { fieldErrorMessages } from "./profile-field";

interface ProfileNameRowProps {
  arrayField: AnyFieldApi;
  index: number;
  label: string;
  nameField: AnyFieldApi;
  placeholder: string;
  primary?: boolean;
}

export function ProfileNameRow({
  arrayField,
  index,
  label,
  nameField,
  placeholder,
  primary,
}: ProfileNameRowProps) {
  const position = index + 1;
  const errorId = `${nameField.name}-error`;
  const [error] = fieldErrorMessages(nameField);
  const canMoveUp = index > 0;
  const canMoveDown = index < arrayField.state.value.length - 1;
  const handleChange = useCallback(
    (value: string) => nameField.handleChange(value),
    [nameField]
  );
  const handleMoveUp = useCallback(
    () => arrayField.moveValue(index, index - 1),
    [arrayField, index]
  );
  const handleMoveDown = useCallback(
    () => arrayField.moveValue(index, index + 1),
    [arrayField, index]
  );
  const handleRemove = useCallback(
    () => arrayField.removeValue(index),
    [arrayField, index]
  );
  const handleInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => handleChange(event.target.value),
    [handleChange]
  );

  return (
    <div className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-start sm:gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Input
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error)}
            aria-label={`${label} ${position}`}
            className="h-auto rounded-[10px] border-line bg-card px-3.5 py-[11px] text-sm focus-visible:border-navy focus-visible:ring-0"
            id={nameField.name}
            name={nameField.name}
            onBlur={nameField.handleBlur}
            onChange={handleInput}
            placeholder={placeholder}
            value={nameField.state.value as string}
          />
          {primary ? (
            <span className="shrink-0 rounded-full bg-surface-alt px-2.5 py-1 font-extrabold text-[9px] text-muted-text uppercase tracking-[.08em]">
              Primary
            </span>
          ) : null}
        </div>
        {error ? (
          <p
            className="mt-1.5 text-[11px] text-brand-strong"
            id={errorId}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-1.5 sm:pt-0.5">
        <button
          aria-label={`Move ${label.toLowerCase()} ${position} up`}
          className="grid size-9 place-items-center rounded-[8px] border border-line text-ink hover:bg-surface-alt disabled:pointer-events-none disabled:opacity-40"
          disabled={!canMoveUp}
          onClick={handleMoveUp}
          type="button"
        >
          <ArrowUp aria-hidden className="size-4" />
        </button>
        <button
          aria-label={`Move ${label.toLowerCase()} ${position} down`}
          className="grid size-9 place-items-center rounded-[8px] border border-line text-ink hover:bg-surface-alt disabled:pointer-events-none disabled:opacity-40"
          disabled={!canMoveDown}
          onClick={handleMoveDown}
          type="button"
        >
          <ArrowDown aria-hidden className="size-4" />
        </button>
        <button
          aria-label={`Remove ${label.toLowerCase()} ${position}`}
          className="min-h-9 rounded-[8px] px-2 font-black text-[11px] text-accent-text hover:underline"
          onClick={handleRemove}
          type="button"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

interface ProfileAddButtonProps {
  arrayField: AnyFieldApi;
  label: string;
  max: number;
}

export function ProfileAddButton({
  arrayField,
  label,
  max,
}: ProfileAddButtonProps) {
  const handleClick = useCallback(
    () => arrayField.pushValue({ name: "" }),
    [arrayField]
  );

  return (
    <button
      className="min-h-11 py-2.5 font-black text-[11px] text-accent-text hover:underline disabled:pointer-events-none disabled:opacity-40"
      disabled={arrayField.state.value.length >= max}
      onClick={handleClick}
      type="button"
    >
      + {label}
    </button>
  );
}
