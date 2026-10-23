import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export function SectionHead({
  body,
  link,
  title,
}: {
  body: string;
  link?: { label: string; to: "/classes" | "/masters" | "/signup" };
  title: string;
}) {
  return (
    <div className="flex rx-md:flex-row flex-col rx-md:items-end rx-md:justify-between gap-6 rx-md:gap-12">
      <div className="max-w-[640px]">
        <h2 className="font-bold rx-lg:text-[52px] rx-sm:text-[42px] text-[34px] leading-[1.02] tracking-[-0.035em]">
          {title}
        </h2>
        <p className="mt-3 rx-sm:mt-4 rx-sm:text-[18px] text-[16px] text-ink leading-relaxed">
          {body}
        </p>
      </div>
      {link ? (
        <Link
          className="group flex w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-navy/20 px-5 py-3 font-semibold text-[15px] text-navy transition-colors duration-150 hover:bg-sand"
          to={link.to}
        >
          {link.label}
          <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}
