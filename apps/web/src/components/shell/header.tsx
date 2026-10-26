import { cn } from "@my-better-t-app/ui/lib/utils";
import { Link } from "@tanstack/react-router";

import UserMenu from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";

import { BrandLogo } from "./brand-logo";
import { RedesignContainer } from "./container";

const navLinks: { to: "/classes" | "/masters"; label: string }[] = [
  { label: "Masters", to: "/masters" },
  { label: "Classes", to: "/classes" },
];

const navLinkClass =
  "whitespace-nowrap border-b-2 py-1 font-medium text-[15px] text-ink transition-colors duration-150 hover:text-brand-strong";

/** Off-canvas until focused. */
export function SkipLink() {
  return (
    <a
      className="absolute -top-16 left-3 z-60 inline-flex min-h-11 items-center rounded-full bg-navy px-4 font-semibold text-[13px] text-white transition-[top] duration-150 ease-out focus-visible:top-3 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 motion-reduce:transition-none"
      href="#main"
    >
      Skip to content
    </a>
  );
}

export function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-40 border-hairline border-b bg-canvas/95 backdrop-blur">
      <RedesignContainer className="flex h-16 rx-lg:h-[72px] items-center justify-between gap-4">
        <BrandLogo />

        <nav
          aria-label="Primary"
          className="rx-lg:flex hidden items-center gap-6 rx-xl:gap-8"
        >
          {navLinks.map((link) => (
            <Link
              activeOptions={{ exact: false, includeSearch: false }}
              activeProps={{
                "aria-current": "page",
                className: cn(navLinkClass, "border-navy text-navy"),
              }}
              className={navLinkClass}
              inactiveProps={{ className: "border-transparent" }}
              key={link.to}
              to={link.to}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 rx-sm:gap-6">
          {session ? (
            <UserMenu />
          ) : (
            <>
              <Link
                className="rx-sm:inline hidden whitespace-nowrap font-medium text-[15px] text-ink transition-colors duration-150 hover:text-brand-strong"
                search={{ form: "signin" }}
                to="/login"
              >
                Sign in
              </Link>
              <Link
                className="whitespace-nowrap rounded-full bg-brand-strong px-4 rx-sm:px-5 py-2 rx-sm:py-2.5 font-semibold rx-sm:text-[15px] text-[14px] text-white transition-colors duration-150 hover:bg-brand-deep"
                to="/for-masters"
              >
                For Masters
              </Link>
            </>
          )}
        </div>
      </RedesignContainer>
    </header>
  );
}
