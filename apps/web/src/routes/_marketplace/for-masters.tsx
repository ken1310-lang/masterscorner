import { cn } from "@my-better-t-app/ui/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Fragment } from "react";

import { RedesignContainer } from "@/components/shell/container";

const flow = [
  {
    body: "Add your arts, experience, city, introduction, locations and photo.",
    title: "Create your profile",
  },
  {
    body: "Students find you by martial art, location and audience.",
    title: "Appear in the directory",
  },
  {
    body: "Keep schedules, fees and availability next to your profile.",
    title: "Publish your classes",
  },
] as const;

const features = [
  {
    body: "Your name, arts, years teaching, home city, introduction, locations and photo.",
    title: "A public master profile",
  },
  {
    body: "Students search by martial art, location and audience, then open your profile.",
    title: "Directory discovery",
  },
  {
    body: "Publish weekly schedules, teaching locations, fees and whether a class is active, paused or full.",
    title: "Current classes",
  },
  {
    body: "Update your profile and classes from the same place.",
    title: "One console",
  },
] as const;

const consoleRows = [
  { detail: "Account · next step", label: "Overview" },
  { detail: "Arts · locations · introduction", label: "Profile" },
  { detail: "Schedules · fees · status", label: "Classes" },
] as const;

export const Route = createFileRoute("/_marketplace/for-masters")({
  component: ForMastersRoute,
  head: () => ({
    meta: [
      { title: "For Masters · MastersCorner" },
      {
        name: "description",
        content:
          "Create a master profile, appear in the directory and publish your current classes on MastersCorner.",
      },
    ],
  }),
});

function ForMastersRoute() {
  return (
    <>
      <section className="bg-canvas py-16 rx-md:py-24">
        <RedesignContainer className="grid grid-cols-1 rx-lg:grid-cols-[1.1fr_1fr] items-center gap-12 rx-lg:gap-20">
          <div>
            <p className="font-semibold text-[16px] text-brand-strong">
              For masters
            </p>
            <h1 className="mt-3 max-w-[760px] font-bold rx-lg:text-[80px] rx-sm:text-[64px] text-[46px] text-navy leading-[0.96] tracking-[-0.045em]">
              Your martial arts business, connected.
            </h1>
            <p className="mt-6 max-w-[520px] rx-sm:text-[19px] text-[17px] text-ink leading-relaxed">
              Get discovered by students, publish your current classes and keep
              your public profile up to date from one console.
            </p>
            <div className="mt-10 flex rx-sm:flex-row flex-col rx-sm:items-center gap-4 rx-sm:gap-6">
              <Link
                className="inline-flex min-h-12 rx-sm:w-auto w-full items-center justify-center rounded-full bg-brand-strong px-7 py-3.5 font-semibold text-[16px] text-white transition-colors duration-150 hover:bg-brand-deep"
                to="/signup"
              >
                Create your master profile
              </Link>
              <Link
                className="inline-flex min-h-11 rx-sm:w-auto w-full items-center justify-center font-semibold text-[16px] text-navy underline-offset-4 hover:underline"
                to="/masters"
              >
                Browse the directory
              </Link>
            </div>
          </div>

          <aside
            aria-label="Master console preview"
            className="rounded-[24px] rx-sm:rounded-[32px] bg-navy p-6 rx-sm:p-8 text-white shadow-mc"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-[14px] text-steel">Master console</p>
              <p className="font-semibold text-[14px]">MastersCorner</p>
            </div>
            <p className="mt-8 font-semibold text-[26px] leading-tight tracking-[-0.02em]">
              Everything starts with your profile.
            </p>
            <p className="mt-2 text-[14px] text-steel leading-relaxed">
              The details you add appear across your public listing and classes.
            </p>
            <ul className="mt-6 list-none p-0">
              {consoleRows.map((row) => (
                <li
                  className="flex items-baseline justify-between gap-4 border-white/15 border-t py-4"
                  key={row.label}
                >
                  <span className="font-semibold text-[16px]">{row.label}</span>
                  <span className="text-right text-[13px] text-steel">
                    {row.detail}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-white/15 border-t pt-5 text-[14px] text-steel">
              One place to keep your public details current.
            </p>
          </aside>
        </RedesignContainer>
      </section>

      <section className="bg-sand py-16 rx-md:py-24">
        <RedesignContainer>
          <h2 className="max-w-[700px] font-bold rx-lg:text-[52px] rx-sm:text-[42px] text-[34px] text-navy leading-[1.02] tracking-[-0.035em]">
            One profile keeps your public listing current.
          </h2>
          <div className="mt-12 rx-sm:mt-14 grid grid-cols-1 rx-lg:grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch gap-4 rx-lg:gap-5">
            {flow.map((step, index) => (
              <Fragment key={step.title}>
                <div
                  className={cn(
                    "rounded-[24px] p-6 rx-sm:p-7",
                    index === 0 ? "bg-navy text-white" : "bg-canvas text-navy"
                  )}
                >
                  <h3 className="font-semibold text-[22px] tracking-[-0.015em]">
                    {step.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-2 text-[15px] leading-relaxed",
                      index === 0 ? "text-steel" : "text-ink"
                    )}
                  >
                    {step.body}
                  </p>
                </div>
                {index < flow.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="rx-lg:grid hidden place-items-center text-ink-muted"
                  >
                    <ArrowRight className="size-6" />
                  </span>
                ) : null}
              </Fragment>
            ))}
          </div>

          <ul className="mt-16 rx-sm:mt-20 grid grid-cols-1 rx-md:grid-cols-2 gap-x-16">
            {features.map((feature) => (
              <li className="border-navy/15 border-t py-7" key={feature.title}>
                <h3 className="font-semibold text-[22px] tracking-[-0.015em]">
                  {feature.title}
                </h3>
                <p className="mt-2 max-w-[460px] text-[16px] text-ink leading-relaxed">
                  {feature.body}
                </p>
              </li>
            ))}
          </ul>
        </RedesignContainer>
      </section>
    </>
  );
}
