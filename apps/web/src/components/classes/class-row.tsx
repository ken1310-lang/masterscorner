import type { DirectoryClassView } from "@my-better-t-app/api/directory";

import { AUDIENCE_LABELS, formatFee, LEVEL_LABELS } from "./class-values";
import { formatNextSession } from "./directory-values";

export function ClassRow({ item }: { item: DirectoryClassView }) {
  return (
    <li className="grid rx-md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,.8fr)] rx-md:items-center gap-2 rx-md:gap-4 border-hairline border-b py-5 rx-md:py-6">
      <div className="min-w-0">
        <h3 className="font-semibold rx-md:text-[20px] text-[18px] text-navy leading-snug tracking-[-0.015em] [overflow-wrap:anywhere]">
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
        <span className="rx-md:sr-only block font-semibold text-[13px] text-ink-muted">
          Master
        </span>
        <p className="mt-0.5 rx-md:mt-0 text-[15px] text-ink">
          {item.master.displayName}
        </p>
      </div>

      <div className="min-w-0">
        <span className="rx-md:sr-only block font-semibold text-[13px] text-ink-muted">
          Location
        </span>
        <p className="mt-0.5 rx-md:mt-0 text-[15px] text-ink">
          {item.location.name}
        </p>
      </div>

      <div className="min-w-0">
        <span className="rx-md:sr-only block font-semibold text-[13px] text-ink-muted">
          Next session
        </span>
        <p className="mt-0.5 rx-md:mt-0 font-medium text-[15px] text-ink">
          {formatNextSession(item.nextSessionAt)}
        </p>
      </div>

      {item.feeAmount === null ? null : (
        <div className="min-w-0">
          <span className="rx-md:sr-only block font-semibold text-[13px] text-ink-muted">
            Fee
          </span>
          <p className="mt-0.5 rx-md:mt-0 rx-md:text-right font-semibold text-[16px] text-navy">
            {formatFee(item.feeAmount, item.feePeriod)}
          </p>
        </div>
      )}
    </li>
  );
}
