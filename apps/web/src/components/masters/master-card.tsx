import type { DirectoryMasterView } from "@my-better-t-app/api/directory";
import { Link } from "@tanstack/react-router";

import { AUDIENCE_LABELS } from "@/components/classes/class-values";

const NAME_SEPARATOR = /\s+/;

function initialsFor(name: string) {
  const initials = name
    .split(NAME_SEPARATOR)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "MC";
}

export function MasterCard({ master }: { master: DirectoryMasterView }) {
  const arts = master.martialArts.join(" & ");
  const years =
    master.yearsTeaching === null
      ? null
      : `${master.yearsTeaching} ${
          master.yearsTeaching === 1 ? "year" : "years"
        } teaching`;
  const audiences = master.audiences.map(
    (audience) => AUDIENCE_LABELS[audience]
  );
  const meta = [master.city, years, audiences.join(", ")]
    .filter((item): item is string => Boolean(item))
    .join(" · ");

  return (
    <Link
      className="group grid min-w-0 grid-cols-1 grid-rows-[auto_1fr] rounded-[24px] outline-offset-4"
      params={{ slug: master.slug }}
      to="/masters/$slug"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-sand">
        {master.photoUrl ? (
          <img
            alt={master.displayName}
            className="size-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:group-hover:scale-100"
            height={500}
            loading="lazy"
            src={master.photoUrl}
            width={400}
          />
        ) : (
          <div
            aria-hidden="true"
            className="grid size-full place-items-center bg-sand font-black text-[72px] text-navy/15"
          >
            {initialsFor(master.displayName)}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col pt-5">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="break-words font-semibold rx-sm:text-[24px] text-[22px] text-navy leading-tight tracking-[-0.02em] [overflow-wrap:anywhere] group-hover:underline group-hover:underline-offset-4">
              {master.displayName}
            </h3>
            {arts ? (
              <p className="mt-1 break-words text-[16px] text-ink [overflow-wrap:anywhere]">
                {arts}
              </p>
            ) : null}
          </div>
        </div>
        {meta ? (
          <p className="mt-auto break-words pt-4 text-[15px] text-ink-muted [overflow-wrap:anywhere]">
            {meta}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
