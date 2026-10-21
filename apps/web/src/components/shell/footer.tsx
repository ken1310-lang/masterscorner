import { Link } from "@tanstack/react-router";

import { ShellContainer } from "./container";
import { LogoMark } from "./logo-mark";

/**
 * Live footer destinations only (SPEC-platform §6.6, deviation D6). A column
 * renders only once it has a link; the footer grows from brand block and bottom
 * bar to the prototype's three columns as the routes ship.
 */
const footerColumns: {
  heading: string;
  links: {
    to: "/" | "/login" | "/dashboard";
    label: string;
    search?: { form: "signin" };
  }[];
}[] = [
  {
    heading: "For masters",
    links: [
      { to: "/login", label: "Sign in", search: { form: "signin" } },
      { to: "/dashboard", label: "Dashboard" },
    ],
  },
];

/** Prototype footer (745-787, footer markup at the end of each shell screen). */
export function Footer() {
  return (
    <footer className="bg-footer pt-[70px] pb-6 text-white">
      <ShellContainer>
        <div className="grid gap-10 md:gap-20 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Link
              aria-label="MastersCorner home"
              className="inline-flex items-center gap-2.5 whitespace-nowrap font-extrabold text-[17px] tracking-[-0.03em] sm:text-xl"
              to="/"
            >
              <LogoMark inverse />
              <span>MastersCorner</span>
            </Link>
            <p className="mt-[18px] max-w-[420px] text-[#98a4ba] leading-[1.6]">
              One trusted place to discover martial arts, verify masters, book
              training and grow an academy.
            </p>
          </div>

          {footerColumns.length > 0 && (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-3">
              {footerColumns.map((column) => (
                <div className="flex flex-col gap-[11px]" key={column.heading}>
                  <strong className="text-[#cbd3e1] text-xs leading-normal">
                    {column.heading}
                  </strong>
                  {column.links.map((link) => (
                    <Link
                      className="inline-flex min-h-11 items-center text-[#8f9bb1] text-[13px] md:block md:min-h-[auto]"
                      key={link.to}
                      search={link.search}
                      to={link.to}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-[55px] flex flex-col justify-between gap-2 border-white/10 border-t pt-[22px] text-[#77849b] text-[11px] md:flex-row md:[gap:normal]">
          <span>MastersCorner</span>
          <span>Martial arts network for India</span>
        </div>
      </ShellContainer>
    </footer>
  );
}
