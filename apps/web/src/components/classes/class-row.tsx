import type { DirectoryClassView } from "@my-better-t-app/api/directory";

import { AUDIENCE_LABELS, formatFee, LEVEL_LABELS } from "./class-values";
import { formatNextSession } from "./directory-values";

export function ClassRow({ item }: { item: DirectoryClassView }) {
  return (
    <li className="grid gap-2 border-line border-b px-2 py-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.8fr)] md:items-center md:gap-4">
      <div className="min-w-0">
        <h3 className="font-extrabold text-[15px] text-ink leading-snug [overflow-wrap:anywhere]">
          {item.name}
        </h3>
        <p className="mt-1 text-muted-text text-xs">
          {item.martialArt.name} · {AUDIENCE_LABELS[item.audience]} ·{" "}
          {LEVEL_LABELS[item.level]}
        </p>
        {item.status === "full" ? (
          <span className="mt-2 inline-flex rounded-[5px] bg-[#f3e8e9] px-2 py-0.5 font-extrabold text-[10px] text-brand-strong uppercase tracking-[.08em]">
            Full
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <span className="block font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em] md:sr-only">
          Master
        </span>
        <p className="mt-0.5 text-sm md:mt-0">{item.master.displayName}</p>
      </div>

      <div className="min-w-0">
        <span className="block font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em] md:sr-only">
          Location
        </span>
        <p className="mt-0.5 text-sm md:mt-0">{item.location.name}</p>
      </div>

      <div className="min-w-0">
        <span className="block font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em] md:sr-only">
          Next session
        </span>
        <p className="mt-0.5 text-sm md:mt-0">
          {formatNextSession(item.nextSessionAt)}
        </p>
      </div>

      <div className="min-w-0">
        <span className="block font-extrabold text-[10px] text-muted-text uppercase tracking-[.1em] md:sr-only">
          Fee
        </span>
        <p className="mt-0.5 text-sm md:mt-0">
          {item.feeAmount === null
            ? null
            : formatFee(item.feeAmount, item.feePeriod)}
        </p>
      </div>
    </li>
  );
}
