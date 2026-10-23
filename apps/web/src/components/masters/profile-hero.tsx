import type { DirectoryMasterProfilePayload } from "@my-better-t-app/api/directory";
import { cn } from "@my-better-t-app/ui/lib/utils";
import { Link } from "@tanstack/react-router";

import { ShellContainer } from "@/components/shell/container";

function profileStats(profile: DirectoryMasterProfilePayload) {
  return [
    profile.yearsTeaching === null
      ? null
      : {
          label:
            profile.yearsTeaching === 1 ? "Year teaching" : "Years teaching",
          value: profile.yearsTeaching,
        },
    profile.locations.length === 0
      ? null
      : {
          label:
            profile.locations.length === 1
              ? "Teaching location"
              : "Teaching locations",
          value: profile.locations.length,
        },
    profile.classes.length === 0
      ? null
      : {
          label:
            profile.classes.length === 1 ? "Current class" : "Current classes",
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

  return (
    <section className="bg-surface-alt py-10 lg:py-[42px] lg:pb-[58px]">
      <ShellContainer>
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-muted-text text-xs"
        >
          <Link
            activeOptions={{ exact: true }}
            className="font-extrabold text-accent-text underline-offset-4 hover:underline"
            to="/masters"
          >
            Masters
          </Link>
          <span aria-hidden="true">/</span>
          <span>{profile.displayName}</span>
        </nav>

        <div
          className={cn(
            "grid gap-8",
            profile.photoUrl &&
              "lg:grid-cols-[350px_minmax(0,1fr)] lg:items-center lg:gap-[58px]"
          )}
        >
          {profile.photoUrl ? (
            <img
              alt={profile.displayName}
              className="h-[360px] w-full max-w-[460px] rounded-[22px] object-cover shadow-[0_22px_50px_-24px_rgba(11,19,43,.38)] lg:h-[430px] lg:max-w-none"
              height={430}
              src={profile.photoUrl}
              width={350}
            />
          ) : null}

          <div className="min-w-0">
            <h1 className="break-words font-extrabold text-[clamp(42px,6vw,70px)] leading-[.98] tracking-[-.055em]">
              {profile.displayName}
            </h1>
            {arts ? (
              <p className="mt-3 text-lg text-muted-text leading-relaxed">
                {arts}
              </p>
            ) : null}
            {profile.homeCity ? (
              <p className="mt-2 text-muted-text text-sm">
                Based in {profile.homeCity}
              </p>
            ) : null}

            {stats.length > 0 ? (
              <div className="mt-7 flex flex-wrap gap-x-9 gap-y-4">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <strong className="block font-extrabold text-[28px] leading-none">
                      {stat.value}
                    </strong>
                    <span className="mt-1 block text-[11px] text-muted-text">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </ShellContainer>
    </section>
  );
}
