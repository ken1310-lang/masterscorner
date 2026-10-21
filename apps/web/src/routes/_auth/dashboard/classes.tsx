import { createFileRoute } from "@tanstack/react-router";

import { ConsoleEmptyState } from "@/components/console/empty-state";
import { ConsolePageHeader } from "@/components/console/page-header";

export const Route = createFileRoute("/_auth/dashboard/classes")({
  component: Classes,
});

function Classes() {
  return (
    <>
      <ConsolePageHeader
        description="Classes you publish will appear on the public class finder."
        kicker="Teaching"
        title="Classes"
      />
      <ConsoleEmptyState title="No classes yet">
        <p>
          The class editor and weekly schedule arrive with the classes module.
          Nothing has been published for this account.
        </p>
      </ConsoleEmptyState>
    </>
  );
}
