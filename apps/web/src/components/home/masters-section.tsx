import type { DirectoryMasterView } from "@my-better-t-app/api/directory";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { MasterCard } from "@/components/masters/master-card";
import { RedesignContainer } from "@/components/shell/container";

import { HomeRefreshBanner } from "./home-refresh-banner";
import { SectionHead } from "./section-head";

const SKELETONS = ["one", "two", "three"] as const;

function MastersSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading featured masters"
      className="mt-10 rx-md:mt-12 grid grid-cols-1 rx-lg:grid-cols-3 rx-sm:grid-cols-2 rx-lg:gap-8 gap-x-6 gap-y-10"
      role="status"
    >
      {SKELETONS.map((item) => (
        <div key={item}>
          <div className="aspect-[4/5] animate-pulse rounded-[24px] bg-sand motion-reduce:animate-none" />
          <div className="mt-5 h-6 w-3/4 animate-pulse rounded bg-sand motion-reduce:animate-none" />
          <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-sand motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}

function MastersError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-10 rx-md:mt-12 rounded-[24px] bg-sand px-6 rx-sm:px-8 py-10">
      <p className="font-semibold text-[20px] text-navy">
        Masters could not load
      </p>
      <p className="mt-2 max-w-[60ch] text-ink-muted">
        The directory request failed. Try again.
      </p>
      <button
        className="mt-5 rounded-full bg-navy px-5 py-2.5 font-semibold text-[15px] text-white hover:bg-navy-deep"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}

function MastersEmpty() {
  return (
    <div className="mt-10 rx-md:mt-12 rounded-[24px] bg-sand px-6 rx-sm:px-8 py-12 rx-sm:py-16 text-center">
      <p className="font-semibold text-[20px] text-navy">No masters yet</p>
      <p className="mx-auto mt-2 max-w-[52ch] text-ink-muted">
        Master profiles appear here once a master publishes one.
      </p>
      <Link
        className="mt-5 inline-flex rounded-full bg-navy px-5 py-2.5 font-semibold text-[15px] text-white hover:bg-navy-deep"
        to="/for-masters"
      >
        Create a profile
      </Link>
    </div>
  );
}

function MastersGrid({ masters }: { masters: DirectoryMasterView[] }) {
  return (
    <div className="mt-10 rx-md:mt-12 grid grid-cols-1 rx-lg:grid-cols-3 rx-sm:grid-cols-2 rx-lg:gap-8 gap-x-6 gap-y-10">
      {masters.slice(0, 3).map((master) => (
        <MasterCard key={master.id} master={master} />
      ))}
    </div>
  );
}

export function HomeMastersSection({
  isError,
  masters,
  onRetry,
}: {
  isError: boolean;
  masters: DirectoryMasterView[] | undefined;
  onRetry: () => void;
}) {
  let content: ReactNode;
  if (masters === undefined) {
    content = isError ? (
      <MastersError onRetry={onRetry} />
    ) : (
      <MastersSkeleton />
    );
  } else if (masters.length === 0) {
    content = <MastersEmpty />;
  } else {
    content = <MastersGrid masters={masters} />;
  }

  return (
    <section className="border-hairline border-t bg-canvas py-16 rx-md:py-24">
      <RedesignContainer>
        <SectionHead
          body="Profiles that show real teaching context, locations, disciplines and current classes."
          link={{ label: "View all masters", to: "/masters" }}
          title="Masters worth discovering"
        />
        {isError && masters !== undefined ? (
          <HomeRefreshBanner
            message="Masters could not refresh."
            onRetry={onRetry}
          />
        ) : null}
        {content}
      </RedesignContainer>
    </section>
  );
}
