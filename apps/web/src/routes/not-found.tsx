import { createFileRoute, Link } from "@tanstack/react-router";

import { SkipLink } from "@/components/shell/header";

const screenClass = "grid min-h-dvh place-content-center gap-2.5 text-center";
const headingClass =
  "text-[44px] leading-[.98] tracking-[-.055em] sm:text-[clamp(42px,5.7vw,72px)]";

/**
 * Prototype `/404` copy (masterscorner.html 3057-3058), with the word
 * "preview" dropped and the heading scale applied (deviation D13).
 */
export function NotFoundContent() {
  return (
    <>
      <h1 className={headingClass}>Page not found</h1>
      <p>This MastersCorner page does not exist.</p>
      <Link className="font-black text-accent-text" to="/">
        Return home
      </Link>
    </>
  );
}

export function NotFoundScreen() {
  return (
    <>
      <SkipLink />
      <main className={screenClass} id="main" tabIndex={-1}>
        <NotFoundContent />
      </main>
    </>
  );
}

export const Route = createFileRoute("/not-found")({
  component: NotFoundScreen,
});
