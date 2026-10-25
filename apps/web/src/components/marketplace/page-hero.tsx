import type { ReactNode } from "react";

import { RedesignContainer } from "@/components/shell/container";

/**
 * SPEC-redesign §2/§6 R2: the marketplace hero shared by the public directory
 * routes. The OS uses the same hierarchy for Masters and Classes.
 */
export function MarketplacePageHero({
  body,
  children,
  eyebrow,
  title,
}: {
  body: string;
  children?: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section className="bg-canvas pt-12 rx-md:pt-20 pb-10 rx-md:pb-14">
      <RedesignContainer>
        <p className="font-semibold text-[16px] text-brand-strong">{eyebrow}</p>
        <h1 className="mt-3 max-w-[900px] font-bold rx-lg:text-[76px] rx-sm:text-[60px] text-[44px] text-navy leading-[0.98] tracking-[-0.045em]">
          {title}
        </h1>
        <p className="mt-4 rx-sm:mt-6 max-w-[620px] rx-sm:text-[20px] text-[17px] text-ink leading-relaxed">
          {body}
        </p>
        {children}
      </RedesignContainer>
    </section>
  );
}
