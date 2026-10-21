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

      <div className="grid gap-4 md:grid-cols-[1.2fr_.8fr]">
        <article className="rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-extrabold text-base">Your account</h2>
          <dl className="mt-3 text-sm">
            <div className="flex items-center justify-between gap-4 border-line border-t py-3">
              <dt className="text-muted-text">Account type</dt>
              <dd className="font-extrabold">{accountLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-line border-t py-3">
              <dt className="shrink-0 text-muted-text">Email</dt>
              <dd className="min-w-0 truncate text-right font-extrabold">
                {user.email}
              </dd>
            </div>
          </dl>
        </article>

        <article className="rounded-[14px] border border-line bg-card p-5">
          <h2 className="font-extrabold text-base">Next step</h2>
          <p className="mt-2 text-muted-text text-sm leading-relaxed">
            Your master profile will appear on the public site once the profile
            module ships. Nothing has been published yet.
          </p>
          <Link
            className="mt-4 inline-flex min-h-11 items-center font-extrabold text-accent-text text-sm underline-offset-4 hover:underline"
            to="/dashboard/profile"
          >
            Open profile
          </Link>
        </article>
      </div>
    </>
  );
}
