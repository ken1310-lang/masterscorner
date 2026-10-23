import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, House, LayoutDashboard, UsersRound } from "lucide-react";

import { authClient } from "@/lib/auth-client";

const TRAILING_SLASHES = /\/+$/;

export function MobileNav() {
  const { data: session } = authClient.useSession();
  const pathname = useRouterState({
    select: (state) =>
      state.location.pathname.replace(TRAILING_SLASHES, "") || "/",
  });
  const under = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);
  const consoleLink = session
    ? {
        active: under("/dashboard"),
        icon: LayoutDashboard,
        label: "Dashboard",
        to: "/dashboard" as const,
      }
    : {
        active: pathname === "/signup",
        icon: LayoutDashboard,
        label: "For Masters",
        to: "/signup" as const,
      };

  const items = [
    { active: pathname === "/", icon: House, label: "Home", to: "/" as const },
    {
      active: under("/masters"),
      icon: UsersRound,
      label: "Masters",
      to: "/masters" as const,
    },
    {
      active: under("/classes"),
      icon: CalendarDays,
      label: "Classes",
      to: "/classes" as const,
    },
    consoleLink,
  ];

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 rx-lg:hidden border-hairline border-t bg-canvas/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-16 max-w-[640px] items-stretch p-0">
        {items.map((item) => (
          <li className="flex-1" key={item.label}>
            <Link
              aria-current={item.active ? "page" : undefined}
              className={`relative flex h-full flex-col items-center justify-center gap-1 font-semibold text-[11px] transition-colors duration-150 active:opacity-70 ${
                item.active ? "text-navy" : "text-ink-muted"
              }`}
              to={item.to}
            >
              {item.active ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-[30%] top-0 h-[3px] rounded-b-full bg-brand-strong"
                />
              ) : null}
              <item.icon
                className="size-[22px]"
                strokeWidth={item.active ? 2.4 : 1.9}
              />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MobileNavSpacer() {
  return (
    <div
      aria-hidden="true"
      className="rx-lg:hidden h-[calc(4rem+env(safe-area-inset-bottom))]"
    />
  );
}
