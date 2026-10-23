import { cn } from "@my-better-t-app/ui/lib/utils";
import type { ComponentProps } from "react";

export function ShellContainer({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("shell-container", className)} {...props} />;
}

/** Magic Patterns content width: min(100% - 40px, 1240px). */
export function RedesignContainer({
  className,
  ...props
}: ComponentProps<"div">) {
  return <div className={cn("redesign-container", className)} {...props} />;
}
