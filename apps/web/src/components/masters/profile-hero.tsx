import type { DirectoryMasterProfilePayload } from "@my-better-t-app/api/directory";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { RedesignContainer } from "@/components/shell/container";

function profileStats(profile: DirectoryMasterProfilePayload) {
  return [
    profile.yearsTeaching === null
      ? null
      : {
          label:
            profile.yearsTeaching === 1 ? "year teaching" : "years teaching",
          value: profile.yearsTeaching,
        },
    profile.locations.length === 0
      ? null
      : {
          label:
            profile.locations.length === 1
              ? "teaching location"
              : "teaching locations",
          value: profile.locations.length,
        },
    profile.classes.length === 0
      ? null
      : {
          label:
            profile.classes.length === 1 ? "current class" : "current classes",
          value: profile.classes.length,
        },
  ].filter((item): item is { label: string; value: number } => item !== null);
}

export function MasterProfileHero({
  profile,
}: {
  profile: DirectoryMasterProfilePayload;
}) {
  const arts = profile.martialArts.join(" · ");
  const stats = profileStats(profile);
  const heroLayout = profile.photoUrl
    ? "mt-6 grid grid-cols-1 items-center gap-8 rx-md:mt-8 rx-md:grid-cols-[minmax(0,320px)_1fr] rx-md:gap-10 rx-lg:grid-cols-[minmax(0,480px)_1fr] rx-lg:gap-16"
    : "mt-6 rx-md:mt-8";

  return (
    <section className="bg-canvas pt-6 rx-md:pt-10 pb-14 rx-md:pb-20">
      <RedesignContainer>
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-[14px] text-ink-muted"
        >
          <Link
            activeOptions={{ exact: true }}
            className="font-medium text-ink underline-offset-4 hover:underline"
            to="/masters"
          >
            Masters
          </Link>
          <ChevronRight aria-hidden="true" className="size-3.5" />
          <span
            aria-current="page"
            className="min-w-0 break-words [overflow-wrap:anywhere]"
          >
            {profile.displayName}
          </span>
        </nav>

        <div className={heroLayout}>
          {profile.photoUrl ? (
            <img
              alt={profile.displayName}
              className="aspect-[4/5] w-full rounded-[24px] rx-sm:rounded-[32px] object-cover object-top"
              height={600}
              src={profile.photoUrl}
              width={480}
            />
          ) : null}

          <div className="min-w-0">
            <h1 className="break-words font-bold rx-lg:text-[80px] rx-sm:text-[64px] text-[46px] text-navy leading-[0.95] tracking-[-0.045em] [overflow-wrap:anywhere]">
              {profile.displayName}
            </h1>
            {arts ? (
              <p className="mt-4 break-words rx-sm:text-[19px] text-[16px] text-ink leading-relaxed [overflow-wrap:anywhere]">
                {arts}
              </p>
            ) : null}
            {profile.homeCity ? (
              <p className="mt-2 text-[15px] text-ink-muted">
                Based in {profile.homeCity}
              </p>
            ) : null}

            {stats.length > 0 ? (
              <div className="mt-6 rx-sm:mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 rx-sm:text-[16px] text-[15px] text-ink">
                {stats.map((stat) => (
                  <span key={stat.label}>
                    <b className="font-bold text-[22px] text-navy">
                      {stat.value}
                    </b>{" "}
                    {stat.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </RedesignContainer>
    </section>
  );
}
