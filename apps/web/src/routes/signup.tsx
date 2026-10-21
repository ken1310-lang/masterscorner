import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/components/auth/auth-screen";
import SignUpForm from "@/components/sign-up-form";
import { parseSignupSearch, safeRedirectPath } from "@/lib/auth-redirect";

export const Route = createFileRoute("/signup")({
  component: RouteComponent,
  validateSearch: parseSignupSearch,
});

function RouteComponent() {
  const { redirect } = Route.useSearch();
  const destination = safeRedirectPath(redirect);

  return (
    <AuthScreen title="Create account">
      <SignUpForm redirect={destination} />
    </AuthScreen>
  );
}
