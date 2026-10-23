import type { DirectoryClassView } from "@my-better-t-app/api/directory";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { formatFee } from "@/components/classes/class-values";
import { formatNextSession } from "@/components/classes/directory-values";
import { RedesignContainer } from "@/components/shell/container";

import { SectionHead } from "./section-head";

const SKELETONS = ["one", "two", "three", "four"] as const;

function ClassFee({ item }: { item: DirectoryClassView }) {
  if (item.feeAmount === null) {
    return (
      <span className="font-normal text-[14px] text-ink-muted">Not listed</span>
    );
  }
  return <>{formatFee(item.feeAmount, item.feePeriod)}</>;
}

function ClassesSkeleton() {
  return (
    <div aria-busy="true" className="mt-10" role="status">
      <span className="sr-only">Loading classes</span>
      {SKELETONS.map((item) => (
        <div className="border-hairline border-t py-6" key={item}>
          <div className="h-5 w-1/2 animate-pulse rounded bg-sand motion-reduce:animate-none" />
          <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-sand motion-reduce:animate-none" />
        </div>
      ))}
    </div>
  );
}

function ClassesError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-10 rounded-[24px] bg-sand px-6 rx-sm:px-8 py-10">
      <p className="font-semibold text-[20px] text-navy">
        Classes could not load
      </p>
      <p className="mt-2 max-w-[60ch] text-ink-muted">
        The class request failed. Try again.
      </p>
      <button
        className="mt-5 rounded-full bg-navy px-5 py-2.5 font-semibold text-[15px] text-white hover:bg-navy-deep"
        onClick={onRetry}
        type="button"
      >
        Retry
      </button>
    </div>
  );
}

function ClassesEmpty() {
  return (
    <div className="mt-10 rounded-[24px] bg-sand px-6 rx-sm:px-8 py-12 rx-sm:py-16 text-center">
      <p className="font-semibold text-[20px] text-navy">No classes yet</p>
      <p className="mx-auto mt-2 max-w-[52ch] text-ink-muted">
        When a master publishes a weekly schedule, it appears here.
      </p>
      <Link
        className="mt-5 inline-flex rounded-full bg-navy px-5 py-2.5 font-semibold text-[15px] text-white hover:bg-navy-deep"
        to="/masters"
      >
        Browse masters
      </Link>
    </div>
  );
}

function ClassesList({ classes }: { classes: DirectoryClassView[] }) {
  return (
    <>
      <ul className="mt-10 rx-md:hidden border-navy border-t">
        {classes.slice(0, 4).map((item) => (
          <li className="border-hairline border-b py-5" key={item.id}>
            <p className="font-semibold text-[18px] text-navy tracking-[-0.015em]">
              {item.name}
            </p>
            <p className="mt-0.5 text-[14px] text-ink">
              {item.master.displayName} · {item.location.name}
            </p>
            <p className="mt-2 text-[14px]">
              <span className="font-semibold">
                {formatNextSession(item.nextSessionAt)}
              </span>
              <span className="text-ink-muted">
                {" "}
                ·{" "}
                {item.feeAmount === null
                  ? "Fee not listed"
                  : formatFee(item.feeAmount, item.feePeriod)}
              </span>
            </p>
          </li>
        ))}
      </ul>

      <table className="mt-10 rx-md:table hidden w-full text-left">
        <thead>
          <tr className="border-hairline border-b text-[13px] text-ink-muted">
            <th className="py-4 font-semibold">Class</th>
            <th className="py-4 font-semibold">Master</th>
            <th className="py-4 font-semibold">Location</th>
            <th className="py-4 font-semibold">Next session</th>
            <th className="py-4 text-right font-semibold">Fee</th>
          </tr>
        </thead>
        <tbody>
          {classes.slice(0, 4).map((item) => (
            <tr className="border-hairline border-b" key={item.id}>
              <td className="py-6 pr-4 font-semibold rx-lg:text-[20px] text-[18px] text-navy tracking-[-0.015em]">
                {item.name}
              </td>
              <td className="py-6 pr-4 rx-lg:text-[16px] text-[15px] text-ink">
                {item.master.displayName}
              </td>
              <td className="py-6 text-[16px] text-ink">
                {item.location.name}
              </td>
              <td className="py-6 font-medium text-[16px]">
                {formatNextSession(item.nextSessionAt)}
              </td>
              <td className="py-6 text-right font-semibold text-[18px]">
                <ClassFee item={item} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function HomeClassesSection({
  classes,
  isError,
  onRetry,
}: {
  classes: DirectoryClassView[] | undefined;
  isError: boolean;
  onRetry: () => void;
}) {
  let content: ReactNode;
  if (classes === undefined) {
    content = isError ? (
      <ClassesError onRetry={onRetry} />
    ) : (
      <ClassesSkeleton />
    );
  } else if (classes.length === 0) {
    content = <ClassesEmpty />;
  } else {
    content = <ClassesList classes={classes} />;
  }

  return (
    <section className="border-hairline border-t bg-canvas py-16 rx-md:py-24">
      <RedesignContainer>
        <SectionHead
          body="Current training slots published by martial-arts masters across MastersCorner."
          link={{ label: "View all classes", to: "/classes" }}
          title="Classes this week"
        />
        {content}
      </RedesignContainer>
    </section>
  );
}
