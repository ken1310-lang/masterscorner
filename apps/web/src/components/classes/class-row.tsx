import type { DirectoryClassView } from "@my-better-t-app/api/directory";

import { AUDIENCE_LABELS, formatFee, LEVEL_LABELS } from "./class-values";
import { formatNextSession } from "./directory-values";

export function ClassRow({ item }: { item: DirectoryClassView }) {
  return (
    <li className="grid gap-2 border-hairline border-b py-5 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.8fr)] md:items-center md:gap-4 md:py-6">
      <div className="min-w-0">
        <h3 className="font-semibold text-[18px] text-navy leading-snug tracking-[-0.015em] [overflow-wrap:anywhere] md:text-[20px]">
          {item.name}
        </h3>
        <p className="mt-1 text-[14px] text-ink">
          {item.martialArt.name} · {AUDIENCE_LABELS[item.audience]} ·{" "}
          {LEVEL_LABELS[item.level]}
        </p>
        {item.status === "full" ? (
          <span className="mt-2 inline-flex rounded-full bg-brand/10 px-2.5 py-1 font-semibold text-[11px] text-brand-strong uppercase tracking-[.08em]">
            Full
          </span>
        ) : null}
      </div>

      <div className="min-w-0">
        <span className="block font-semibold text-[13px] text-ink-muted md:sr-only">
          Master
        </span>
        <p className="mt-0.5 text-[15px] text-ink md:mt-0">
          {item.master.displayName}
        </p>
      </div>

      <div className="min-w-0">
        <span className="block font-semibold text-[13px] text-ink-muted md:sr-only">
          Location
        </span>
        <p className="mt-0.5 text-[15px] text-ink md:mt-0">
          {item.location.name}
        </p>
      </div>

      <div className="min-w-0">
        <span className="block font-semibold text-[13px] text-ink-muted md:sr-only">
          Next session
        </span>
        <p className="mt-0.5 font-medium text-[15px] text-ink md:mt-0">
          {formatNextSession(item.nextSessionAt)}
        </p>
      </div>

      {item.feeAmount === null ? null : (
        <div className="min-w-0">
          <span className="block font-semibold text-[13px] text-ink-muted md:sr-only">
            Fee
          </span>
          <p className="mt-0.5 font-semibold text-[16px] text-navy md:mt-0 md:text-right">
            {formatFee(item.feeAmount, item.feePeriod)}
          </p>
        </div>
      )}
    </li>
  );
}
