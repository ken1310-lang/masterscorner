import { Link } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

import { BrandLogo } from "./brand-logo";
import { RedesignContainer } from "./container";

interface FooterLink {
  label: string;
  search?: { form: "signin" };
  to:
    | "/classes"
    | "/dashboard"
    | "/dashboard/profile"
    | "/for-masters"
    | "/login"
    | "/masters"
    | "/signup";
}

interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

const discoverColumn: FooterColumn = {
  heading: "Discover",
  links: [
    { label: "Masters", to: "/masters" },
    { label: "Classes", to: "/classes" },
  ],
};

const guestColumns: FooterColumn[] = [
  {
    heading: "For masters",
    links: [
      { label: "Platform", to: "/for-masters" },
      { label: "Create a profile", to: "/signup" },
      { label: "Sign in", to: "/login", search: { form: "signin" } },
    ],
  },
];

const signedInColumns: FooterColumn[] = [
  {
    heading: "For masters",
    links: [
      { label: "Platform", to: "/for-masters" },
      { label: "Your profile", to: "/dashboard/profile" },
    ],
  },
  {
    heading: "Console",
    links: [{ label: "Dashboard", to: "/dashboard" }],
  },
];

export function Footer() {
  const { data: session } = authClient.useSession();
  const columns = [
    discoverColumn,
    ...(session ? signedInColumns : guestColumns),
  ];

  return (
    <footer className="bg-navy text-white">
      <RedesignContainer className="pt-14 rx-md:pt-20 pb-10">
        <div className="grid grid-cols-1 rx-lg:grid-cols-[1.3fr_2fr] gap-12 rx-lg:gap-20">
          <div>
            <BrandLogo inverse />
            <p className="mt-5 max-w-[340px] text-[16px] text-steel leading-relaxed">
              Discover martial-arts masters, their current classes and training
              locations across India.
            </p>
          </div>
          <div className="grid grid-cols-2 rx-sm:grid-cols-3 rx-sm:gap-10 gap-x-6 gap-y-10">
            {columns.map((column) => (
              <div key={column.heading}>
                <h3 className="font-semibold text-[15px] text-white">
                  {column.heading}
                </h3>
                <ul className="mt-4 space-y-3 p-0">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        className="text-[15px] text-steel transition-colors duration-150 hover:text-white"
                        search={link.search}
                        to={link.to}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-12 rx-md:mt-16 flex rx-sm:flex-row flex-col rx-sm:justify-between gap-2 border-white/15 border-t pt-6 text-[14px] text-steel">
          <span>MastersCorner</span>
          <span>Martial arts network for India</span>
        </div>
      </RedesignContainer>
    </footer>
  );
}
