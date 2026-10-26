import type { ReactNode } from "react";

interface ConsolePageHeaderProps {
  action?: ReactNode;
  description: string;
  kicker: string;
  title: string;
}

export function ConsolePageHeader({
  action,
  description,
  kicker,
  title,
}: ConsolePageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between md:gap-[30px]">
      <div className="min-w-0 max-w-full">
        <span className="font-extrabold text-[10px] text-muted-text uppercase tracking-[.12em]">
          {kicker}
        </span>
        <h1 className="mt-[7px] mb-[5px] font-extrabold text-4xl tracking-[-.04em] [overflow-wrap:anywhere]">
          {title}
        </h1>
        <p className="m-0 text-muted-text text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
