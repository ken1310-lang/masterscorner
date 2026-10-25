import type { ProSiteStatus } from "@my-better-t-app/api/pro-site";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { ConsoleEmptyState } from "@/components/console/empty-state";
import { ConsolePageHeader } from "@/components/console/page-header";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/site")({
  component: ProSite,
});

function ProSiteStatusSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading Pro Site status"
      className="grid gap-4 rounded-[14px] border border-line bg-card p-5"
      role="status"
    >
      <div className="h-3 w-24 rounded-full bg-line" />
      <div className="h-8 w-full max-w-[420px] rounded-full bg-line" />
      <div className="h-4 w-full max-w-[520px] rounded-full bg-line" />
    </div>
  );
}

function ProSiteStatusError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[14px] border border-line bg-card p-5">
      <h2 className="font-extrabold text-base">Pro Site status unavailable</h2>
      <p className="mt-2 text-muted-text text-sm leading-relaxed">
        The address request failed. Try again without changing your profile.
      </p>
      <button
        className="mt-4 min-h-11 rounded-[9px] bg-navy px-4 font-black text-white text-xs hover:bg-navy-deep"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}

function ProSiteStatusCard({ status }: { status: ProSiteStatus }) {
  let addressLabel = "Reserved address";
  let body = "This site is not published.";
  let badge = "Not published";
  if (status.published) {
    addressLabel = "Live address";
    body = "Visitors can open your site without an account.";
    badge = "Live";
  }

  return (
    <article className="rounded-[14px] border border-line bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-extrabold text-[11px] text-muted-text uppercase tracking-[.14em]">
            {addressLabel}
          </p>
          <p className="mt-2 break-words font-extrabold text-lg [overflow-wrap:anywhere]">
            {status.address}
          </p>
          <p className="mt-2 text-muted-text text-sm leading-relaxed">{body}</p>
        </div>
        <span className="inline-flex shrink-0 rounded-full border border-line px-3 py-1 font-extrabold text-[10px] uppercase tracking-[.12em]">
          {badge}
        </span>
      </div>
      {status.published ? (
        <a
          className="mt-5 inline-flex min-h-11 items-center font-extrabold text-accent-text text-sm underline-offset-4 hover:underline"
          href={status.address}
        >
          Open site
        </a>
      ) : null}
    </article>
  );
}

function ProSiteStatusContent() {
  const trpc = useTRPC();
  const statusQuery = useQuery(trpc.proSite.status.queryOptions());
  const status = statusQuery.data;

  if (statusQuery.status === "pending") {
    return <ProSiteStatusSkeleton />;
  }

  if (statusQuery.isError && !status) {
    return <ProSiteStatusError onRetry={statusQuery.refetch} />;
  }

  if (!status) {
    return (
      <ConsoleEmptyState title="No Pro Site yet">
        <p>
          Create your master profile first. Your free Pro Site address is
          reserved once the profile exists.
        </p>
      </ConsoleEmptyState>
    );
  }

  return <ProSiteStatusCard status={status} />;
}

function ProSite() {
  return (
    <>
      <ConsolePageHeader
        description="Your Pro Site is generated from your master profile."
        kicker="Website"
        title="Pro Site"
      />
      <ProSiteStatusContent />
    </>
  );
}
