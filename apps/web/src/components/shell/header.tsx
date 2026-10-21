import { cn } from "@my-better-t-app/ui/lib/utils";
import { Link } from "@tanstack/react-router";

import UserMenu from "@/components/user-menu";
import { authClient } from "@/lib/auth-client";

import { LogoMark } from "./logo-mark";

/**
 * Live header destinations only (SPEC-platform §6.6, deviation D6). The
 * prototype lists `Masters`, `Academies`, `Classes`, `Events` and
 * `Experience Card`; each is added here by the task that ships its route.
 */
const navLinks: { to: "/"; label: string }[] = [];

const navLinkClass =
  "inline-flex min-h-11 items-center whitespace-nowrap text-sm leading-normal text-[#3f4b63] hover:text-navy lg:block lg:min-h-[auto] lg:whitespace-normal";

/** Prototype `.mc-skip` (2350-2363): off-canvas until focused. */
export function SkipLink() {
  return (
    <a
      className="absolute -top-16 left-3 z-60 inline-flex min-h-11 items-center rounded-[10px] bg-navy px-[18px] font-extrabold text-[13px] text-white transition-[top] duration-150 ease-out focus-visible:top-3 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 motion-reduce:transition-none"
      href="#main"
    >
      Skip to content
    </a>
  );
}

/** Prototype header (214-306, 2814): sticky bar, logo, nav row, actions. */
export function Header() {
  const { data: session } = authClient.useSession();

  return (
    <header className="sticky top-0 z-50 border-[rgba(23,32,51,0.08)] border-b bg-[rgba(246,245,242,0.94)] backdrop-blur-[18px] lg:h-[74px]">
      <div className="shell-container flex h-full flex-wrap items-center gap-3 py-2 md:gap-7 md:gap-y-[2px] lg:flex-nowrap lg:py-0">
        <Link
          aria-label="MastersCorner home"
          className="inline-flex items-center gap-2.5 whitespace-nowrap font-extrabold text-[17px] tracking-[-0.03em] sm:text-xl"
          to="/"
        >
          <LogoMark />
          <span>MastersCorner</span>
        </Link>

        {navLinks.length > 0 && (
          <nav
            aria-label="Primary"
            className="lg:[&::-webkit-scrollbar]:initial order-3 flex w-full gap-[18px] overflow-x-auto [scrollbar-width:none] lg:order-none lg:ml-auto lg:w-auto lg:gap-[23px] lg:overflow-visible lg:[scrollbar-width:auto] [&::-webkit-scrollbar]:hidden"
          >
            {navLinks.map((link) => (
              <Link className={navLinkClass} key={link.to} to={link.to}>
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-[18px] lg:ml-0">
          {session ? (
            <UserMenu />
          ) : (
            <Link
              className="hidden text-[#3f4b63] text-sm hover:text-navy md:inline"
              to="/login"
            >
              Sign in
            </Link>
          )}
          {/* `For Masters` becomes a Link when its route ships (Task 15, D6). */}
          <span
            className={cn(
              "inline-flex min-h-11 items-center rounded-[10px] bg-navy px-3 py-2.5 font-bold text-[11px] text-white",
              "sm:text-sm sm:leading-normal md:inline md:min-h-[auto] md:px-[17px] md:py-[11px]"
            )}
          >
            For Masters
          </span>
        </div>
      </div>
    </header>
  );
}
