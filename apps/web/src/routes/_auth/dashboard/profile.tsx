import { createFileRoute } from "@tanstack/react-router";

import { ConsoleEmptyState } from "@/components/console/empty-state";
import { ConsolePageHeader } from "@/components/console/page-header";

export const Route = createFileRoute("/_auth/dashboard/profile")({
  component: Profile,
});

function Profile() {
  return (
    <>
      <ConsolePageHeader
        description="Your listing and Pro Site use the same data."
        kicker="Public identity"
        title="Master profile"
      />
      <ConsoleEmptyState title="No profile yet">
        <p>
          Your name, martial arts, teaching locations and introduction will
          appear here once the profile module ships.
        </p>
        <p className="mt-2">Nothing has been saved for this account.</p>
      </ConsoleEmptyState>
    </>
  );
}
