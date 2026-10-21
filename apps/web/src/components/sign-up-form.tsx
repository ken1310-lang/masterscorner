import { Button } from "@my-better-t-app/ui/components/button";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { safeRedirectPath } from "@/lib/auth-redirect";

import { AuthField } from "./auth/auth-field";
import Loader from "./loader";

export default function SignUpForm({ redirect }: { redirect?: string }) {
  const navigate = useNavigate();
  const { isPending } = authClient.useSession();
  const { sessionQueries } = useRouter().options.context;
  const [formError, setFormError] = useState<string | null>(null);
  const destination = safeRedirectPath(redirect);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setFormError(null);
      await authClient.signUp.email(
        {
          name: value.name,
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: async ({ data }) => {
            await sessionQueries.setIdentity(data.user.id);
            toast.success("Account created");
            await navigate({ href: destination ?? "/dashboard" });
          },
          onError: (error) => {
            setFormError(error.error.message || error.error.statusText);
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setFormError(null);
          form.handleSubmit();
        }}
      >
        <div className="space-y-4">
          <form.Field name="name">
            {(field) => (
              <AuthField autoComplete="name" field={field} label="Name" />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <AuthField
                autoComplete="email"
                field={field}
                label="Email"
                type="email"
              />
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <AuthField
                autoComplete="new-password"
                field={field}
                label="Password"
                type="password"
              />
            )}
          </form.Field>
        </div>

        {formError ? (
          <p
            className="mt-4 rounded-[10px] border border-brand/30 bg-brand/5 p-3 text-brand-strong text-xs"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <form.Subscribe
          selector={(state) => ({
            canSubmit: state.canSubmit,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              className="mt-6 h-auto w-full rounded-[11px] bg-navy px-3.5 py-[14px] font-black text-sm text-white hover:bg-navy-deep"
              disabled={!canSubmit || isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 space-y-1 text-[12px] text-muted-text">
        <p>
          Already have an account?{" "}
          <Link
            className="font-extrabold text-navy underline-offset-4 hover:underline"
            search={{ form: "signin", redirect: destination }}
            to="/login"
          >
            Sign in
          </Link>
          .
        </p>
        <Link
          className="inline-flex min-h-11 items-center font-extrabold text-muted-text underline-offset-4 hover:text-navy hover:underline"
          to="/"
        >
          ← Back to marketplace
        </Link>
      </div>
    </>
  );
}
