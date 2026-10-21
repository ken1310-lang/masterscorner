import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SkipLink } from "@/components/shell/header";
import { LogoMark } from "@/components/shell/logo-mark";
import UserMenu from "@/components/user-menu";

interface ConsoleUser {
  accountType: string;
  email: string;
  name: string;
}

interface ConsoleShellProps {
  children: ReactNode;
  user: ConsoleUser;
}

const WHITESPACE = /\s+/;
const TRAILING_SLASHES = /\/+$/;

const navItems = [
  { label: "Overview", to: "/dashboard" },
  { label: "Profile", to: "/dashboard/profile" },
  { label: "Classes", to: "/dashboard/classes" },
  { label: "Pro Site", to: "/dashboard/site" },
] as const;

const screenTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/classes": "Classes",
  "/dashboard/profile": "Profile",
  "/dashboard/site": "Pro Site",
};

function initials(name: string) {
  const parts = name.trim().split(WHITESPACE).filter(Boolean);
  const relevant =
    parts.length > 1 && parts[0].toLowerCase() === "master"
      ? parts.slice(1)
      : parts;
  if (relevant.length === 0) {
    return "MC";
  }
  if (relevant.length === 1) {
    return relevant[0].slice(0, 2).toUpperCase();
  }
  const last = relevant.at(-1) ?? "";
  return `${relevant[0][0]}${last[0]}`.toUpperCase();
}

/** The prototype console shell (masterscorner.html 1621-1725, 2645-2673). */
export function ConsoleShell({ children, user }: ConsoleShellProps) {
  const pathname = useRouterState({
    select: (state) =>
      state.location.pathname.replace(TRAILING_SLASHES, "") || "/",
  });
  const title = screenTitles[pathname] ?? "Console";
  const accountLabel =
    user.accountType === "master" ? "Master account" : "Account";

  return (
    <>
      <SkipLink />
      <div className="min-h-dvh bg-surface-alt md:grid md:grid-cols-[250px_1fr]">
        <aside className="flex flex-col bg-navy p-4 text-white md:sticky md:top-0 md:h-dvh md:p-[25px_20px]">
          <Link
            aria-label="MastersCorner home"
            className="inline-flex w-fit items-center gap-2.5 whitespace-nowrap px-1.5 font-extrabold text-[17px] tracking-[-0.03em] sm:text-xl"
            to="/"
          >
            <LogoMark inverse />
            <span>MastersCorner</span>
          </Link>

          <div className="mt-[18px] mb-2.5 flex items-center gap-[11px] border-white/[.08] border-y px-2 py-[17px] md:mt-[34px] md:mb-6">
            <div className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-brand-strong font-black text-[11px]">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <strong className="block truncate text-xs">{user.name}</strong>
              <span className="mt-1 block text-[9px] text-steel">
                {accountLabel}
              </span>
            </div>
          </div>

          <nav
            aria-label="Console"
            className="flex gap-1.5 overflow-x-auto md:flex-col md:overflow-visible"
          >
            {navItems.map((item) => (
              <Link
                activeOptions={{ exact: true }}
                activeProps={{
                  className: "bg-white/[.08] text-white",
                }}
                className="flex min-h-11 items-center whitespace-nowrap rounded-[9px] px-3 py-[11px] text-[#aeb8c9] text-[13px] hover:bg-white/[.08] hover:text-white"
                key={item.to}
                to={item.to}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            className="mt-auto hidden p-2.5 text-[#8e9bb0] text-xs hover:text-white md:block"
            to="/"
          >
            ← Marketplace
          </Link>
        </aside>

        <div className="min-w-0">
          <header className="relative flex h-[72px] items-center justify-between gap-4 border-line border-b bg-card px-[18px] md:sticky md:top-0 md:z-30 md:px-8">
            <div className="flex min-w-0 flex-col">
              <span className="font-extrabold text-[9px] text-muted-text uppercase tracking-[.12em]">
                MastersCorner Console
              </span>
              <strong className="mt-0.5 truncate font-extrabold text-base">
                {title}
              </strong>
            </div>
            <UserMenu />
          </header>

          <main
            className="max-w-[1250px] p-[22px_16px] md:p-[34px]"
            id="main"
            tabIndex={-1}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
