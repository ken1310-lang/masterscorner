import { directoryMasterProfileInputSchema } from "@my-better-t-app/api/directory";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/utils/trpc";

import { ProSiteStateFrame } from "./pro-site-chrome";
import { ProSitePage } from "./pro-site-page";

const focusOnParchment =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pro-earth";

function ProSiteSkeleton() {
  return (
    <ProSiteStateFrame>
      <div
        aria-busy="true"
        aria-label="Loading Pro Site"
        className="grid gap-5"
        role="status"
      >
        <div className="h-3 w-48 rounded-full bg-pro-earth/15" />
        <div className="h-16 w-full max-w-[620px] rounded-[18px] bg-pro-earth/15" />
        <div className="h-16 w-full max-w-[460px] rounded-[18px] bg-pro-earth/10" />
        <div className="mt-8 grid rx-md:grid-cols-2 gap-5">
          <div className="h-44 rounded-[20px] bg-pro-earth/10" />
          <div className="h-44 rounded-[20px] bg-pro-earth/10" />
        </div>
      </div>
    </ProSiteStateFrame>
  );
}

function ProSiteUnavailable() {
  return (
    <ProSiteStateFrame>
      <p className="font-semibold text-[11px] text-pro-muted uppercase tracking-[.18em]">
        MastersCorner Pro Site
      </p>
      <h1 className="mt-3 max-w-[720px] font-bold text-[clamp(40px,6vw,72px)] leading-[.96] tracking-[-.055em]">
        This Pro Site is not available.
      </h1>
      <p className="mt-5 max-w-[520px] text-[16px] text-pro-muted leading-[1.7]">
        This address is unpublished or does not belong to a master's site.
      </p>
    </ProSiteStateFrame>
  );
}

function ProSiteError({ onRetry }: { onRetry: () => void }) {
  return (
    <ProSiteStateFrame>
      <p className="font-semibold text-[11px] text-pro-muted uppercase tracking-[.18em]">
        MastersCorner Pro Site
      </p>
      <h1 className="mt-3 max-w-[720px] font-bold text-[clamp(40px,6vw,72px)] leading-[.96] tracking-[-.055em]">
        This site could not load.
      </h1>
      <p className="mt-5 max-w-[520px] text-[16px] text-pro-muted leading-[1.7]">
        The site request failed. Try again without losing this address.
      </p>
      <button
        className={`mt-8 inline-flex min-h-11 items-center self-start rounded-full bg-pro-earth px-6 font-semibold text-[13px] text-pro-parchment ${focusOnParchment}`}
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </ProSiteStateFrame>
  );
}

function ProSiteQueryScreen({ slug }: { slug: string }) {
  const trpc = useTRPC();
  const siteQuery = useQuery(trpc.proSite.bySlug.queryOptions({ slug }));
  const site = siteQuery.data;

  if (siteQuery.status === "pending") {
    return <ProSiteSkeleton />;
  }

  if (siteQuery.isError && !site) {
    return <ProSiteError onRetry={siteQuery.refetch} />;
  }

  if (!site) {
    return <ProSiteUnavailable />;
  }

  return (
    <ProSitePage
      onRetry={siteQuery.refetch}
      refreshError={siteQuery.isError}
      site={site}
    />
  );
}

export function ProSiteScreen({ slug }: { slug: string }) {
  const input = directoryMasterProfileInputSchema.safeParse({ slug });
  if (!input.success) {
    return <ProSiteUnavailable />;
  }

  return <ProSiteQueryScreen slug={input.data.slug} />;
}
