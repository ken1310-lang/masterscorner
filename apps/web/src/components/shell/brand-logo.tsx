import { cn } from "@my-better-t-app/ui/lib/utils";
import { Link } from "@tanstack/react-router";

import { LogoMark } from "./logo-mark";

export function BrandLogo({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <Link
      aria-label="MastersCorner home"
      className={cn("flex items-center gap-2.5", className)}
      to="/"
    >
      <LogoMark inverse={inverse} />
      <span
        className={cn(
          "font-semibold text-[21px] tracking-[-0.02em]",
          inverse ? "text-white" : "text-navy"
        )}
      >
        masterscorner
      </span>
    </Link>
  );
}
