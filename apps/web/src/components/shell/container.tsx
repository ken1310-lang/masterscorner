import { cn } from "@my-better-t-app/ui/lib/utils";
import type { ComponentProps } from "react";

export function ShellContainer({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("shell-container", className)} {...props} />;
}

/** Magic Patterns content width: max 1240 px, 20/32 px gutters. */
export function RedesignContainer({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1240px] px-5 rx-sm:px-8", className)}
      {...props}
    />
  );
}
