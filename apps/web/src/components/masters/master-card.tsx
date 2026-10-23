import type { DirectoryMasterView } from "@my-better-t-app/api/directory";
import { Link } from "@tanstack/react-router";

import { AUDIENCE_LABELS } from "@/components/classes/class-values";

/** Registry card with no fabricated trust signal or price. */
export function MasterCard({ master }: { master: DirectoryMasterView }) {
  const arts = master.martialArts.join(" & ");
  const years =
    master.yearsTeaching === null
      ? null
      : `${master.yearsTeaching} ${master.yearsTeaching === 1 ? "year" : "years"}`;

  return (
    <article className="flex h-full flex-col rounded-[16px] border border-line bg-card p-5">
      <div>
        <h3 className="font-extrabold text-[20px] tracking-[-.025em]">
          {master.displayName}
        </h3>
        {arts ? (
          <p className="mt-1 text-muted-text text-sm leading-relaxed">{arts}</p>
        ) : null}
      </div>

      {master.city || years ? (
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-text text-xs">
          {master.city ? <span>{master.city}</span> : null}
          {master.city && years ? <span aria-hidden="true">·</span> : null}
          {years ? <span>{years}</span> : null}
        </p>
      ) : null}

      {master.audiences.length > 0 ? (
        <ul
          aria-label="Audiences"
          className="mt-4 flex flex-wrap gap-[7px] p-0"
        >
          {master.audiences.map((audience) => (
            <li
              className="rounded-full bg-surface-alt px-[9px] py-[6px] font-bold text-[11px]"
              key={audience}
            >
              {AUDIENCE_LABELS[audience]}
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        className="mt-auto inline-flex min-h-9 items-center self-start pt-5 font-extrabold text-accent-text text-xs underline-offset-4 hover:underline"
        params={{ slug: master.slug }}
        to="/masters/$slug"
      >
        View profile
      </Link>
    </article>
  );
}
