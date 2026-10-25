import type { ReactNode } from "react";

const focusOnEarth =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pro-ochre";

/** Off-canvas until focused; the Pro Site has no marketplace skip target. */
export function ProSiteSkipLink() {
  return (
    <a
      className={`absolute -top-16 left-3 z-50 inline-flex min-h-11 items-center rounded-full bg-pro-earth px-4 font-semibold text-[13px] text-pro-parchment transition-[top] duration-150 ease-out focus-visible:top-3 motion-reduce:transition-none ${focusOnEarth}`}
      href="#pro-main"
    >
      Skip to content
    </a>
  );
}

export function ProSitePoweredBy() {
  return (
    <p className="text-[12px] text-pro-parchment/60">
      Powered by{" "}
      <a
        className={`font-semibold text-pro-ochre underline-offset-4 hover:underline ${focusOnEarth}`}
        href="/"
      >
        MastersCorner
      </a>
    </p>
  );
}

export function ProSiteStateFrame({ children }: { children: ReactNode }) {
  return (
    <div className="pro-site min-h-dvh bg-pro-parchment text-pro-earth">
      <ProSiteSkipLink />
      <main
        className="pro-container flex min-h-[calc(100dvh-92px)] flex-col justify-center py-20"
        id="pro-main"
        tabIndex={-1}
      >
        {children}
      </main>
      <footer className="bg-pro-earth text-pro-parchment">
        <div className="pro-container py-8">
          <ProSitePoweredBy />
        </div>
      </footer>
    </div>
  );
}
