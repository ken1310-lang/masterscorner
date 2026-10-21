import type { ReactNode } from "react";

interface ConsoleEmptyStateProps {
  children: ReactNode;
  title: string;
}

export function ConsoleEmptyState({ children, title }: ConsoleEmptyStateProps) {
  return (
    <article className="rounded-[14px] border border-line bg-card p-5">
      <h2 className="font-extrabold text-base">{title}</h2>
      <div className="mt-2 max-w-[60ch] text-muted-text text-sm leading-relaxed">
        {children}
      </div>
    </article>
  );
}
