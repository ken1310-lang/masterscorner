import { createFileRoute, Outlet } from "@tanstack/react-router";

import { ConsoleShell } from "@/components/console/console-shell";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const { session } = Route.useRouteContext();
  const user = session.data?.user;

  if (!user) {
    return null;
  }

  return (
    <ConsoleShell user={user}>
      <Outlet />
    </ConsoleShell>
  );
}
