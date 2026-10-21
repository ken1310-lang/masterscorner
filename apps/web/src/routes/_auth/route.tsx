import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  component: AuthLayout,
  beforeLoad: async ({ context }) => {
    const session = await authClient.getSession();
    await context.sessionQueries.setIdentity(session.data?.user.id ?? null);
    if (!session.data) {
      throw redirect({
        search: { form: "signin" },
        to: "/login",
      });
    }
    return { session };
  },
});

function AuthLayout() {
  const { session } = Route.useRouteContext();
  return <Outlet key={session.data?.user.id} />;
}
