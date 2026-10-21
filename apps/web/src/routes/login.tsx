import { createFileRoute } from "@tanstack/react-router";

import { AuthScreen } from "@/components/auth/auth-screen";
import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { parseLoginSearch, safeRedirectPath } from "@/lib/auth-redirect";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  // The prototype's /login screen signs in; ?form=signup keeps the old
  // address working, and /signup is the canonical sign-up address.
  validateSearch: parseLoginSearch,
});

function RouteComponent() {
  const { form, redirect } = Route.useSearch();
  // The router keeps an unknown search key in useSearch even when
  // validateSearch drops it, so every consumer gets the sanitized value.
  const destination = safeRedirectPath(redirect);
  const signingUp = form === "signup";

  return (
    <AuthScreen title={signingUp ? "Create account" : "Sign in"}>
      {signingUp ? (
        <SignUpForm redirect={destination} />
      ) : (
        <SignInForm redirect={destination} />
      )}
    </AuthScreen>
  );
}
