import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { SkipLink } from "@/components/shell/header";
import { LogoMark } from "@/components/shell/logo-mark";

interface AuthScreenProps {
  children: ReactNode;
  title: string;
}

/**
 * The prototype's `/login` shell (masterscorner.html 1406-1481): a navy brand
 * panel and one white card. The marketplace header and footer are absent.
 */
export function AuthScreen({ children, title }: AuthScreenProps) {
  return (
    <>
      <SkipLink />
      <main
        className="grid min-h-dvh bg-paper md:grid-cols-[1.05fr_.95fr]"
        id="main"
        tabIndex={-1}
      >
        <div className="on-navy flex min-h-[300px] flex-col justify-between bg-navy p-[30px] text-white md:min-h-0 md:p-14">
          <Link
            aria-label="MastersCorner home"
            className="inline-flex w-fit items-center gap-2.5 whitespace-nowrap font-extrabold text-[17px] tracking-[-0.03em] sm:text-xl"
            to="/"
          >
            <LogoMark inverse />
            <span>MastersCorner</span>
          </Link>
          <div>
            <span className="font-black text-[11px] text-brand-lifted uppercase tracking-[.14em]">
              Master Portal
            </span>
            <h1 className="mt-2.5 mb-5 max-w-[550px] font-extrabold text-[40px] leading-none tracking-[-.05em] md:text-[54px]">
              Manage your presence from one place.
            </h1>
            <p className="text-[#bfc9da]">
              Your profile, classes and Pro Site in one console.
            </p>
          </div>
        </div>

        <section className="my-[30px] w-[min(440px,calc(100%_-_40px))] self-center justify-self-center rounded-[20px] bg-card p-[38px] shadow-mc md:my-auto">
          <h2 className="font-extrabold text-[32px] leading-tight tracking-[-.04em]">
            {title}
          </h2>
          {children}
        </section>
      </main>
    </>
  );
}
