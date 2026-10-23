import type { DirectoryFilterOption } from "@my-better-t-app/api/directory";
import { Link } from "@tanstack/react-router";

import { RedesignContainer } from "@/components/shell/container";

import { HomeSearchBar, type HomeSearchFilters } from "./search-bar";
import { HomeWordCycle } from "./word-cycle";

const tiles = [
  {
    alt: "Kids practising karate punches in a dojo",
    className: "top-8 left-8 h-[176px] w-[220px]",
    src: "/redesign/karate-kids.jpg",
  },
  {
    alt: "Silambam practitioner spinning a bamboo staff",
    className:
      "top-[84px] left-[190px] h-[218px] w-[160px] shadow-[0_18px_40px_rgba(11,19,43,0.18)]",
    src: "/redesign/silambam.jpg",
  },
  {
    alt: "MMA coach holding pads for a kick",
    className: "top-[44px] right-[190px] h-[226px] w-[170px]",
    src: "/redesign/mma.jpg",
  },
  {
    alt: "Teen boxer training on a heavy bag",
    className:
      "top-6 right-8 h-[170px] w-[210px] shadow-[0_18px_40px_rgba(11,19,43,0.18)]",
    src: "/redesign/boxing.jpg",
  },
  {
    alt: "Women practising a self-defence wrist release",
    className: "bottom-12 left-[56px] h-[214px] w-[164px]",
    src: "/redesign/self-defence.jpg",
  },
  {
    alt: "Kalaripayattu practitioner mid-leap",
    className: "right-8 bottom-[88px] h-[160px] w-[214px]",
    src: "/redesign/kalari.jpg",
  },
] as const;

export function HomeHero({
  locations,
  martialArts,
  onSearch,
}: {
  locations: DirectoryFilterOption[];
  martialArts: DirectoryFilterOption[];
  onSearch: (filters: HomeSearchFilters) => void;
}) {
  return (
    <section className="relative overflow-hidden bg-canvas">
      <RedesignContainer className="relative rx-xl:h-[760px]">
        {tiles.map((tile, index) => (
          <img
            alt={tile.alt}
            className={`redesign-image-enter absolute rx-xl:block hidden rounded-[22px] object-cover ${tile.className}`}
            height={440}
            key={tile.src}
            loading="lazy"
            src={tile.src}
            style={{ animationDelay: `${index * 50}ms` }}
            width={440}
          />
        ))}

        <div className="relative z-10 flex h-full flex-col items-center pt-10 rx-sm:pt-16 rx-xl:pt-[132px] pb-10 rx-md:pb-14 rx-xl:pb-0 text-center">
          <h1 className="flex w-full flex-col items-center">
            <span className="font-bold rx-lg:text-[52px] rx-sm:text-[42px] text-[30px] text-navy leading-none tracking-[-0.03em]">
              One network for
            </span>
            <HomeWordCycle />
          </h1>
          <p className="mt-4 rx-sm:mt-6 max-w-[540px] rx-sm:text-[19px] text-[16px] text-ink leading-relaxed">
            Find the right master and train with confidence. Explore real master
            profiles, current classes and weekly schedules across India.
          </p>
          <HomeSearchBar
            locations={locations}
            martialArts={martialArts}
            onSearch={onSearch}
          />
          <Link
            className="mt-5 font-semibold text-[15px] text-brand-strong underline-offset-4 hover:underline"
            to="/signup"
          >
            I am a master →
          </Link>
        </div>
      </RedesignContainer>

      <ul className="flex rx-xl:hidden snap-x snap-mandatory gap-3 rx-sm:gap-4 overflow-x-auto px-5 rx-sm:px-8 pb-12 rx-md:pb-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tiles.map((tile) => (
          <li className="shrink-0 snap-start" key={tile.src}>
            <img
              alt={tile.alt}
              className="h-[180px] rx-sm:h-[220px] rx-sm:w-[176px] w-[140px] rounded-[18px] object-cover"
              height={220}
              loading="lazy"
              src={tile.src}
              width={176}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
