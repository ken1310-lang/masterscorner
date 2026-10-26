import { directoryMasterProfileInputSchema } from "@my-better-t-app/api/directory";
import { useQuery } from "@tanstack/react-query";

import { RedesignContainer } from "@/components/shell/container";
import { NotFoundContent } from "@/routes/not-found";
import { useTRPC } from "@/utils/trpc";

import { MasterProfileHero } from "./profile-hero";
import { MasterProfileSections } from "./profile-sections";

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading master profile" role="status">
      <section className="bg-canvas pt-6 rx-md:pt-10 pb-14 rx-md:pb-20">
        <RedesignContainer>
          <div className="h-4 w-36 animate-pulse rounded bg-sand motion-reduce:animate-none" />
          <div className="mt-8 grid rx-lg:grid-cols-[minmax(0,480px)_1fr] rx-md:grid-cols-[minmax(0,320px)_1fr] gap-8 rx-lg:gap-16 rx-md:gap-10">
            <div className="aspect-[4/5] animate-pulse rounded-[24px] rx-sm:rounded-[32px] bg-sand motion-reduce:animate-none" />
            <div>
              <div className="h-14 w-3/4 max-w-[520px] animate-pulse rounded bg-sand motion-reduce:animate-none" />
              <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-sand motion-reduce:animate-none" />
              <div className="mt-8 h-10 w-64 animate-pulse rounded bg-sand motion-reduce:animate-none" />
            </div>
          </div>
        </RedesignContainer>
      </section>
      <section className="border-hairline border-t bg-canvas py-14 rx-md:py-20">
        <RedesignContainer className="max-w-[920px]">
          <div className="h-9 w-52 animate-pulse rounded bg-sand motion-reduce:animate-none" />
          <div className="mt-5 h-4 w-full animate-pulse rounded bg-sand motion-reduce:animate-none" />
          <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-sand motion-reduce:animate-none" />
        </RedesignContainer>
      </section>
    </div>
  );
}

function ProfileError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="bg-canvas py-14 rx-md:py-20" role="status">
      <RedesignContainer className="max-w-[620px]">
        <p className="font-semibold text-[16px] text-brand-strong">
          Master profile
        </p>
        <h1 className="mt-3 font-bold text-[44px] text-navy leading-[0.98] tracking-[-0.045em]">
          Profile could not load
        </h1>
        <p className="mt-4 text-ink leading-relaxed">
          The profile request failed. Try again without losing this page.
        </p>
        <button
          className="mt-6 min-h-11 rounded-full bg-navy px-5 py-2.5 font-semibold text-[15px] text-white hover:bg-navy-deep"
          onClick={onRetry}
          type="button"
        >
          Retry
        </button>
      </RedesignContainer>
    </section>
  );
}

function ProfileNotFound() {
  return (
    <div className="grid min-h-[60vh] place-content-center gap-2.5 bg-canvas px-4 text-center">
      <NotFoundContent />
    </div>
  );
}

function RefreshBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="mb-8 flex rx-sm:flex-row flex-col rx-sm:items-center rx-sm:justify-between gap-2 rounded-[16px] border border-hairline bg-sand px-4 py-3"
      role="status"
    >
      <p className="text-ink-muted text-sm">
        This profile could not refresh. Showing the last loaded data.
      </p>
      <button
        className="min-h-9 rx-sm:self-auto self-start font-semibold text-accent-text text-sm underline-offset-4 hover:underline"
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
        <section className="border-hairline border-t bg-canvas py-14 rx-md:py-20">
          <RedesignContainer className="max-w-[920px]">
            {profileQuery.isError ? (
              <RefreshBanner onRetry={profileQuery.refetch} />
            ) : null}
            {hasDetails ? <MasterProfileSections profile={profile} /> : null}
          </RedesignContainer>
        </section>
      ) : null}
    </>
  );
}
