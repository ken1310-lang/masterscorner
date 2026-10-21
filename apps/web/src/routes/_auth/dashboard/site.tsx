import { createFileRoute } from "@tanstack/react-router";

import { ConsoleEmptyState } from "@/components/console/empty-state";
import { ConsolePageHeader } from "@/components/console/page-header";

export const Route = createFileRoute("/_auth/dashboard/site")({
  component: ProSite,
});

function ProSite() {
  return (
    <>
      <ConsolePageHeader
        description="Your Pro Site is generated from your master profile."
        kicker="Website"
        title="Pro Site"
      />
      <ConsoleEmptyState title="No Pro Site yet">
        <p>
          Once your profile exists, the free Pro Site is generated from it. No
          address has been assigned yet.
        </p>
      </ConsoleEmptyState>
    </>
  );
}
