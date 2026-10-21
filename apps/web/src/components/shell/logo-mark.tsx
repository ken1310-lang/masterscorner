import { cn } from "@my-better-t-app/ui/lib/utils";

interface LogoMarkProps {
  className?: string;
  inverse?: boolean;
}

/**
 * The prototype's three-bar mark (masterscorner.html 240-276): a rounded navy
 * tile with two paper-coloured bars and a crimson centre bar. Decorative, so it
 * is hidden from assistive technology; the link around it carries the label.
 */
export function LogoMark({ inverse = false, className }: LogoMarkProps) {
  const bar = cn(
    "absolute block h-4 w-1 rounded-[3px]",
    inverse ? "bg-navy" : "bg-paper"
  );

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block size-[31px] shrink-0 rounded-[9px]",
        inverse ? "bg-white" : "bg-navy",
        className
      )}
    >
      <i className={cn(bar, "top-2 left-2 -rotate-[24deg]")} />
      <i className={cn(bar, "top-2 right-2 rotate-[24deg]")} />
      <i className="absolute top-[10px] left-[14px] block h-[13px] w-1 rounded-[3px] bg-brand" />
    </span>
  );
}
