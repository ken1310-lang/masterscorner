import type {
  DirectoryMasterClassView,
  DirectoryMasterProfilePayload,
} from "@my-better-t-app/api/directory";
import { MapPin } from "lucide-react";

import {
  AUDIENCE_LABELS,
  formatFee,
  formatSchedules,
  LEVEL_LABELS,
} from "@/components/classes/class-values";

const sectionHeading =
  "font-bold text-[28px] text-navy leading-[1.05] tracking-[-0.03em] rx-sm:text-[36px]";

function FullBadge() {
  return (
    <span className="inline-flex shrink-0 rounded-full bg-brand/10 px-2.5 py-1 font-semibold text-[11px] text-brand-strong uppercase tracking-[.08em]">
      Full
    </span>
  );
}

function TrainingPathItem({ item }: { item: DirectoryMasterClassView }) {
  return (
    <li className="relative pb-7 pl-8 last:pb-0">
      <span
        aria-hidden="true"
        className="absolute top-1.5 -left-[9px] size-4 rounded-full border-2 border-canvas bg-navy"
      />
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="min-w-0 break-words font-semibold text-[20px] text-navy tracking-[-0.02em] [overflow-wrap:anywhere]">
          {item.name}
        </h3>
        {item.status === "full" ? <FullBadge /> : null}
      </div>
      <p className="mt-1 text-[16px] text-ink leading-relaxed">
        {item.martialArt.name} · {AUDIENCE_LABELS[item.audience]} ·{" "}
        {LEVEL_LABELS[item.level]}
      </p>
      {item.feeAmount === null ? null : (
        <p className="mt-2 font-semibold text-[16px] text-navy">
          {formatFee(item.feeAmount, item.feePeriod)}
        </p>
      )}
    </li>
  );
}

function LocationsAndSchedule({
  profile,
}: {
  profile: DirectoryMasterProfilePayload;
}) {
  let title = "Teaching locations";
  if (profile.classes.length > 0) {
    title = "Locations & schedule";
  } else if (profile.locations.length === 1) {
    title = "Teaching location";
  }

  return (
    <section aria-labelledby="profile-locations-heading">
      <h2 className={sectionHeading} id="profile-locations-heading">
        {title}
      </h2>
      <ul className="mt-5 list-none p-0">
        {profile.locations.map((location) => {
          const classes = profile.classes.filter(
            (item) =>
              item.location.id === location.id && item.schedules.length > 0
          );
          return (
            <li
              className="border-hairline border-t py-4 rx-sm:py-5 last:border-b"
              key={location.id}
            >
              <h3 className="flex items-center gap-2 break-words font-semibold text-[18px] text-navy [overflow-wrap:anywhere]">
                <MapPin aria-hidden="true" className="size-4 text-ink-muted" />
                {location.name}
              </h3>
              {classes.length > 0 ? (
                <ul className="mt-2 grid list-none gap-1.5 p-0">
                  {classes.map((item) => (
                    <li
                      className="flex rx-sm:flex-row flex-col rx-sm:items-baseline rx-sm:justify-between gap-0.5 rx-sm:gap-4 text-[16px] text-ink"
                      key={item.id}
                    >
                      <span className="flex min-w-0 flex-wrap items-center gap-2 break-words [overflow-wrap:anywhere]">
                        {item.name}
                        {item.status === "full" ? <FullBadge /> : null}
                      </span>
                      <span className="rx-sm:text-right text-[15px] text-ink-muted">
                        {formatSchedules(item.schedules)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function MasterProfileSections({
  profile,
}: {
  profile: DirectoryMasterProfilePayload;
}) {
  return (
    <div className="grid gap-12">
      {profile.introduction ? (
        <section aria-labelledby="profile-about-heading">
          <h2 className={sectionHeading} id="profile-about-heading">
            About the master
          </h2>
          <p className="mt-4 max-w-[720px] whitespace-pre-line break-words rx-sm:text-[18px] text-[16px] text-ink leading-[1.8] [overflow-wrap:anywhere]">
            {profile.introduction}
          </p>
        </section>
      ) : null}

      {profile.classes.length > 0 ? (
        <section aria-labelledby="profile-paths-heading">
          <h2 className={sectionHeading} id="profile-paths-heading">
            Training paths
          </h2>
          <ol className="mt-5 list-none border-hairline border-l-2 p-0">
            {profile.classes.map((item) => (
              <TrainingPathItem item={item} key={item.id} />
            ))}
          </ol>
        </section>
      ) : null}

      {profile.locations.length > 0 ? (
        <LocationsAndSchedule profile={profile} />
      ) : null}
    </div>
  );
}
