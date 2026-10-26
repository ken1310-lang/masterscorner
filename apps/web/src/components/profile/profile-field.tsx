import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import { Textarea } from "@my-better-t-app/ui/components/textarea";
import type { AnyFieldApi } from "@tanstack/react-form";
import type { ChangeEvent } from "react";
import { useCallback } from "react";

interface ProfileFieldProps {
  autoComplete?: string;
  field: AnyFieldApi;
  hint?: string;
  inputMode?: "numeric" | "text";
  label: string;
  multiline?: boolean;
  placeholder?: string;
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

export function fieldErrorMessages(field: AnyFieldApi) {
  return field.state.meta.errors
    .map(errorText)
    .filter((message): message is string => Boolean(message));
}

export function ProfileField({
  autoComplete,
  field,
  hint,
  inputMode,
  label,
  multiline,
  placeholder,
}: ProfileFieldProps) {
  const id = field.name;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = `${id}-error`;
  const errors = fieldErrorMessages(field);
  const describedBy =
    [hintId, errors.length > 0 ? errorId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  const shared = {
    "aria-describedby": describedBy,
    "aria-invalid": errors.length > 0,
    autoComplete,
    id,
    name: id,
    onBlur: field.handleBlur,
    placeholder,
    value: field.state.value as string,
  };
  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) =>
      field.handleChange(event.target.value),
    [field]
  );
  const handleTextareaChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) =>
      field.handleChange(event.target.value),
    [field]
  );

  return (
    <div className="flex flex-col gap-[7px]">
      <Label className="font-extrabold text-[#4c576d] text-[11px]" htmlFor={id}>
        {label}
      </Label>
      {multiline ? (
        <Textarea
          {...shared}
          className="min-h-[100px] resize-y rounded-[10px] border-line bg-card px-3.5 py-[13px] text-sm focus-visible:border-navy focus-visible:ring-0"
          onChange={handleTextareaChange}
        />
      ) : (
        <Input
          {...shared}
          className="h-auto rounded-[10px] border-line bg-card px-3.5 py-[13px] text-sm focus-visible:border-navy focus-visible:ring-0"
          inputMode={inputMode}
          onChange={handleInputChange}
        />
      )}
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
