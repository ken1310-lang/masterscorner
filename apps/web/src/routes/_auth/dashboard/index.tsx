import { createFileRoute, Link } from "@tanstack/react-router";

import { ConsolePageHeader } from "@/components/console/page-header";
import { accountTypeLabel } from "@/lib/account-type";

export const Route = createFileRoute("/_auth/dashboard/")({
  component: Overview,
});

function Overview() {
  const { session } = Route.useRouteContext();
  const user = session.data?.user;

  if (!user) {
    return null;
  }

  const accountLabel = accountTypeLabel(user.accountType);

  return (
    <>
      <ConsolePageHeader
        description="This is what your account supports today."
        kicker="Master console"
        title={`Welcome, ${user.name}.`}
      />

      <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,.8fr)]">
        <article className="min-w-0 rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-extrabold text-base">Your account</h2>
          <dl className="mt-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-line border-t py-3">
              <dt className="text-muted-text">Account type</dt>
              <dd className="font-extrabold">{accountLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-line border-t py-3">
              <dt className="shrink-0 text-muted-text">Email</dt>
              <dd className="min-w-0 text-right font-extrabold [overflow-wrap:anywhere]">
                {user.email}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-extrabold text-base">Next step</h2>
          <p className="mt-2 text-muted-text text-sm leading-relaxed">
            Keep your master profile and current classes up to date. Open Pro
            Site to see your address and whether the site is published.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <Link
              className="inline-flex min-h-11 items-center font-extrabold text-accent-text text-sm underline-offset-4 hover:underline"
              to="/dashboard/profile"
            >
              Open profile
            </Link>
            <Link
              className="inline-flex min-h-11 items-center font-extrabold text-accent-text text-sm underline-offset-4 hover:underline"
              to="/dashboard/site"
            >
              Open Pro Site
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
