import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback } from "react";

import Loader from "@/components/loader";
import { ProSitePage } from "@/components/pro-site/pro-site-page";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/site-preview")({
  component: SitePreview,
  head: () => ({
    meta: [{ title: "Pro Site preview · MastersCorner" }],
  }),
});

function PreviewBackLink() {
  return (
    <Link
      className="inline-flex min-h-9 items-center rounded-full border border-pro-parchment/30 px-3 font-semibold text-[11px] text-pro-parchment hover:bg-pro-parchment/10"
      to="/dashboard/site"
    >
      ← Back to settings
    </Link>
  );
}

function SitePreview() {
  const trpc = useTRPC();
  const preview = useQuery(trpc.proSite.preview.queryOptions());
  const site = preview.data;
  const refetchPreview = preview.refetch;
  const handleRetry = useCallback(() => {
    refetchPreview().catch(() => undefined);
  }, [refetchPreview]);

  if (preview.status === "pending") {
    return (
      <div className="grid min-h-dvh place-items-center bg-pro-parchment">
        <Loader />
      </div>
    );
  }

  if (preview.isError && !site) {
    return (
      <main className="grid min-h-dvh place-items-center bg-pro-parchment px-5 text-pro-earth">
        <div className="max-w-[520px]">
          <p className="font-semibold text-[11px] text-pro-muted uppercase tracking-[.18em]">
            Preview
          </p>
          <h1 className="mt-3 font-bold text-[clamp(36px,5vw,56px)] leading-[.98] tracking-[-.05em]">
            The preview could not load.
          </h1>
          <p className="mt-4 text-pro-muted text-sm leading-relaxed">
            The draft request failed. Try again without publishing the site.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="inline-flex min-h-11 items-center rounded-full bg-pro-earth px-5 font-semibold text-[13px] text-pro-parchment"
              onClick={handleRetry}
              type="button"
            >
              Retry
            </button>
            <Link
              className="inline-flex min-h-11 items-center font-semibold text-pro-earth text-sm underline decoration-2 decoration-pro-ochre underline-offset-4"
              to="/dashboard/site"
            >
              Back to settings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!site) {
    return (
      <main className="grid min-h-dvh place-items-center bg-pro-parchment px-5 text-pro-earth">
        <div className="max-w-[520px]">
          <p className="font-semibold text-[11px] text-pro-muted uppercase tracking-[.18em]">
            Preview
          </p>
          <h1 className="mt-3 font-bold text-[clamp(36px,5vw,56px)] leading-[.98] tracking-[-.05em]">
            There is no site to preview yet.
          </h1>
          <p className="mt-4 text-pro-muted text-sm leading-relaxed">
            Create your master profile first, then return to the Pro Site
            settings.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center font-semibold text-pro-earth text-sm underline decoration-2 decoration-pro-ochre underline-offset-4"
            to="/dashboard/site"
          >
            Back to settings
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div>
      <div className="flex min-h-10 flex-wrap items-center justify-between gap-2 bg-pro-earth px-5 py-2 text-pro-parchment">
        <PreviewBackLink />
        <span className="font-semibold text-[10px] text-pro-parchment/70 uppercase tracking-[.16em]">
          Draft preview
        </span>
      </div>
      <ProSitePage
        onRetry={preview.refetch}
        refreshError={preview.isError}
        site={site}
      />
    </div>
  );
}
