import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { RedesignContainer } from "@/components/shell/container";

export function HomeMasterCta() {
  return (
    <section className="bg-canvas pb-16 rx-md:pb-24">
      <RedesignContainer>
        <div className="grid grid-cols-1 rx-lg:grid-cols-[1.2fr_1fr] items-end gap-6 rx-lg:gap-16 rounded-[24px] rx-sm:rounded-[32px] bg-saffron px-6 rx-lg:px-14 rx-sm:px-10 py-10 rx-lg:py-16 rx-sm:py-14">
          <div>
            <p className="font-semibold text-[16px] text-navy">For masters</p>
            <h2 className="mt-3 font-bold rx-lg:text-[56px] rx-sm:text-[46px] text-[36px] text-navy leading-[1] tracking-[-0.04em]">
              Your profile and classes in one place.
            </h2>
          </div>
          <div>
            <p className="rx-sm:text-[18px] text-[16px] text-navy leading-relaxed">
              Create a public master profile, publish your current classes and
              keep your teaching locations current. Your profile and schedule
              stay in one place.
            </p>
            <Link
              className="group mt-7 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-navy px-6 py-3.5 font-semibold text-[16px] text-white transition-colors duration-150 hover:bg-navy-deep"
              to="/signup"
            >
              Create your master profile
              <ArrowRight className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
            </Link>
          </div>
        </div>
      </RedesignContainer>
    </section>
  );
}
