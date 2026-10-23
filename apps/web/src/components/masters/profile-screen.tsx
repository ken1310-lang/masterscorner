import { directoryMasterProfileInputSchema } from "@my-better-t-app/api/directory";
import { useQuery } from "@tanstack/react-query";

import { ShellContainer } from "@/components/shell/container";
import { NotFoundContent } from "@/routes/not-found";
import { useTRPC } from "@/utils/trpc";

import { MasterProfileHero } from "./profile-hero";
import { MasterProfileSections } from "./profile-sections";

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading master profile" role="status">
      <section className="bg-surface-alt py-10 lg:py-[42px] lg:pb-[58px]">
        <ShellContainer>
          <div className="h-4 w-36 animate-pulse rounded bg-card" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[350px_minmax(0,1fr)] lg:gap-[58px]">
            <div className="h-[360px] w-full max-w-[460px] animate-pulse rounded-[22px] bg-card lg:h-[430px] lg:max-w-none" />
            <div>
              <div className="h-14 w-3/4 max-w-[520px] animate-pulse rounded bg-card" />
              <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-card" />
              <div className="mt-8 h-10 w-64 animate-pulse rounded bg-card" />
            </div>
          </div>
        </ShellContainer>
      </section>
      <section className="py-[68px] md:py-[92px]">
        <ShellContainer>
          <div className="max-w-[920px]">
            <div className="h-9 w-52 animate-pulse rounded bg-surface-alt" />
            <div className="mt-5 h-4 w-full animate-pulse rounded bg-surface-alt" />
            <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-surface-alt" />
          </div>
        </ShellContainer>
      </section>
    </div>
  );
}

function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="py-[68px] md:py-[92px]">
      <ShellContainer>
        <div className="max-w-[620px]">
          <p className="font-extrabold text-[12px] text-accent-text uppercase tracking-[.16em]">
            Master profile
          </p>
          <h1 className="mt-3 font-extrabold text-[clamp(32px,4vw,48px)] leading-none tracking-[-.05em]">
            Profile could not load
          </h1>
          <p className="mt-4 text-muted-text">
            The profile request failed. Try again without losing this page.
          </p>
          <button
            className="mt-6 min-h-11 rounded-[9px] bg-navy px-4 font-black text-white text-xs hover:bg-navy-deep"
            onClick={onRetry}
            type="button"
          >
            Retry
          </button>
        </div>
      </ShellContainer>
    </section>
  );
}

function ProfileNotFound() {
  return (
    <div className="grid min-h-[60vh] place-content-center gap-2.5 px-4 text-center">
      <NotFoundContent />
    </div>
  );
}

function RefreshBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mb-6 flex flex-col gap-2 rounded-[10px] border border-line bg-surface-alt px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-text text-sm">
        This profile could not refresh. Showing the last loaded data.
      </p>
      <button
        className="min-h-9 self-start font-extrabold text-accent-text text-xs underline-offset-4 hover:underline"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}

export function MasterProfileScreen({ slug }: { slug: string }) {
  const input = directoryMasterProfileInputSchema.safeParse({ slug });
  if (!input.success) {
    return <ProfileNotFound />;
  }
  return <MasterProfileQueryScreen slug={input.data.slug} />;
}

function MasterProfileQueryScreen({ slug }: { slug: string }) {
  const trpc = useTRPC();
  const profileQuery = useQuery(
    trpc.directory.masterProfile.queryOptions({ slug })
  );
  const profile = profileQuery.data;

  if (profileQuery.status === "pending") {
    return <ProfileSkeleton />;
  }

  if (profileQuery.isError && !profile) {
    return <ProfileError onRetry={profileQuery.refetch} />;
  }

  if (!profile) {
    return <ProfileNotFound />;
  }

  const hasDetails =
    Boolean(profile.introduction) ||
    profile.classes.length > 0 ||
    profile.locations.length > 0;

  return (
    <>
      <MasterProfileHero profile={profile} />
      {hasDetails || profileQuery.isError ? (
        <section className="py-[68px] md:py-[92px]">
          <ShellContainer>
            <div className="max-w-[920px]">
              {profileQuery.isError ? (
                <RefreshBanner onRetry={profileQuery.refetch} />
              ) : null}
              {hasDetails ? <MasterProfileSections profile={profile} /> : null}
            </div>
          </ShellContainer>
        </section>
      ) : null}
    </>
  );
}
