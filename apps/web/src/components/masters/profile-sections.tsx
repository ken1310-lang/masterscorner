import type {
  DirectoryMasterClassView,
  DirectoryMasterProfilePayload,
} from "@my-better-t-app/api/directory";

import {
  AUDIENCE_LABELS,
  formatFee,
  formatSchedules,
  LEVEL_LABELS,
} from "@/components/classes/class-values";

const sectionHeading =
  "font-extrabold text-[clamp(28px,3.5vw,40px)] leading-[1.02] tracking-[-.045em]";

function TrainingPathCard({ item }: { item: DirectoryMasterClassView }) {
  return (
    <article className="rounded-[16px] border border-line bg-card p-5">
      <h3 className="break-words font-extrabold text-[18px] tracking-[-.02em]">
        {item.name}
      </h3>
      <p className="mt-1 text-muted-text text-xs leading-relaxed">
        {item.martialArt.name} · {AUDIENCE_LABELS[item.audience]} ·{" "}
        {LEVEL_LABELS[item.level]}
      </p>
      {item.feeAmount === null ? null : (
        <p className="mt-3 font-bold text-sm">
          {formatFee(item.feeAmount, item.feePeriod)}
        </p>
      )}
    </article>
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
    <section aria-labelledby="profile-locations-heading" className="mt-12">
      <h2 className={sectionHeading} id="profile-locations-heading">
        {title}
      </h2>
      <div className="mt-5 border-line border-t">
        {profile.locations.map((location) => {
          const classes = profile.classes.filter(
            (item) =>
              item.location.id === location.id && item.schedules.length > 0
          );
          return (
            <div className="border-line border-b py-5" key={location.id}>
              <h3 className="break-words font-extrabold text-[18px]">
                {location.name}
              </h3>
              {classes.length > 0 ? (
                <ul className="mt-2 space-y-1.5 p-0">
                  {classes.map((item) => (
                    <li
                      className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                      key={item.id}
                    >
                      <span className="font-bold text-sm">{item.name}</span>
                      <span className="text-muted-text text-xs sm:text-right sm:text-sm">
                        {formatSchedules(item.schedules)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MasterProfileSections({
  profile,
}: {
  profile: DirectoryMasterProfilePayload;
}) {
  return (
    <>
      {profile.introduction ? (
        <section aria-labelledby="profile-about-heading">
          <h2 className={sectionHeading} id="profile-about-heading">
            About the master
          </h2>
          <p className="mt-4 whitespace-pre-line break-words text-[17px] text-ink-muted leading-[1.8]">
            {profile.introduction}
          </p>
        </section>
      ) : null}

      {profile.classes.length > 0 ? (
        <section aria-labelledby="profile-paths-heading" className="mt-12">
          <h2 className={sectionHeading} id="profile-paths-heading">
            Training paths
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {profile.classes.map((item) => (
              <TrainingPathCard item={item} key={item.id} />
            ))}
          </div>
        </section>
      ) : null}

      {profile.locations.length > 0 ? (
        <LocationsAndSchedule profile={profile} />
      ) : null}
    </>
  );
}
