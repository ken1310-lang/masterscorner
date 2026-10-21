import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  // The prototype's /login screen signs in; ?form=signup reaches the other
  // form, and every caller states which one it means.
  validateSearch: (
    search: Record<string, unknown>
  ): { form: "signin" | "signup" } => ({
    form: search.form === "signup" ? "signup" : "signin",
  }),
});

function RouteComponent() {
  const { form } = Route.useSearch();
  const [showSignIn, setShowSignIn] = useState(form !== "signup");

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
