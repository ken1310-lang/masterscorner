import { Input } from "@my-better-t-app/ui/components/input";
import { Label } from "@my-better-t-app/ui/components/label";
import type { AnyFieldApi } from "@tanstack/react-form";
import { type ChangeEvent, useCallback } from "react";

interface AuthFieldProps {
  autoComplete: string;
  field: AnyFieldApi;
  label: string;
  type?: string;
}

export function AuthField({
  autoComplete,
  field,
  label,
  type = "text",
}: AuthFieldProps) {
  const id = field.name;
  const errorId = `${id}-error`;
  const errors = field.state.meta.errors
    .map((error) => error?.message)
    .filter((message): message is string => Boolean(message));
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      field.handleChange(event.target.value);
    },
    [field]
  );

  return (
    <div className="flex flex-col gap-[7px]">
      <Label className="font-extrabold text-xs" htmlFor={id}>
        {label}
      </Label>
      <Input
        aria-describedby={errors.length > 0 ? errorId : undefined}
        aria-invalid={errors.length > 0}
        autoComplete={autoComplete}
        className="h-auto rounded-[10px] px-3.5 py-[13px] text-sm focus-visible:border-navy focus-visible:ring-0"
        id={id}
        name={id}
        onBlur={field.handleBlur}
        onChange={handleChange}
        type={type}
        value={field.state.value as string}
      />
      {errors.length > 0 ? (
        <p className="text-brand-strong text-xs" id={errorId} role="alert">
          {errors.join(" ")}
        </p>
      ) : null}
    </div>
  );
}
