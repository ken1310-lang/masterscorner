import { cn } from "@my-better-t-app/ui/lib/utils";
import type { ComponentProps } from "react";

export function ShellContainer({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("shell-container", className)} {...props} />;
}
