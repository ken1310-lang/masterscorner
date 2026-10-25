import type { ProSitePayload } from "@my-better-t-app/api/pro-site";
import { visibleProSiteSections } from "@my-better-t-app/api/pro-site";

import {
  AUDIENCE_LABELS,
  formatFee,
  formatSchedules,
  LEVEL_LABELS,
} from "@/components/classes/class-values";

import { ProSitePoweredBy, ProSiteSkipLink } from "./pro-site-chrome";

const focusOnEarth =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pro-ochre";
const focusOnParchment =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pro-earth";
const sectionHeading =
  "mt-3 font-bold text-[clamp(34px,4.4vw,52px)] leading-[1.02] tracking-[-.045em] [overflow-wrap:anywhere]";
const NAME_PARTS = /\s+/;

function initials(name: string) {
  const parts = name.trim().split(NAME_PARTS).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "MC";
}

function ProSiteHeader({ site }: { site: ProSitePayload }) {
  const sections = visibleProSiteSections(site);
  const navItems: { href: string; label: string }[] = [];
  if (sections.about) {
    navItems.push({ href: "#about", label: "About" });
  }
  if (sections.programs) {
    navItems.push({ href: "#programs", label: "Programs" });
  }
  if (sections.schedule) {
    navItems.push({ href: "#schedule", label: "Schedule" });
  }
  if (sections.contact) {
    navItems.push({ href: "#contact", label: "Contact" });
  }

  const arts = site.martialArts.join(" · ");
  const subtitle = [arts, site.homeCity].filter(Boolean).join(" · ");

  return (
    <header className="sticky top-0 z-40 border-pro-earth/15 border-b bg-pro-parchment/95 backdrop-blur">
      <div className="pro-container flex rx-lg:h-[78px] flex-wrap rx-lg:flex-nowrap items-center gap-x-8 gap-y-3 py-3 rx-lg:py-0">
        <a
          className={`flex min-w-0 items-center gap-3 rounded-sm ${focusOnParchment}`}
          href="#pro-main"
        >
          {site.logoUrl ? (
            <img
              alt=""
              className="h-10 w-10 shrink-0 rounded-full object-cover"
              height={40}
              src={site.logoUrl}
              width={40}
            />
          ) : (
            <span
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pro-earth font-bold text-[13px] text-pro-parchment tracking-[.04em]"
            >
              {initials(site.displayName)}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate font-bold text-[15px] uppercase tracking-[.14em]">
              {site.displayName}
            </span>
            {subtitle ? (
              <span className="mt-0.5 block truncate text-[10px] text-pro-muted uppercase tracking-[.1em]">
                {subtitle}
              </span>
            ) : null}
          </span>
        </a>

        {navItems.length > 0 ? (
          <nav
            aria-label="Pro Site sections"
            className="order-3 rx-lg:order-none rx-lg:ml-auto flex rx-lg:w-auto w-full items-center gap-5 overflow-x-auto text-[12px]"
          >
            {navItems.map((item) => (
              <a
                className={`whitespace-nowrap py-2 font-semibold text-pro-earth/80 transition-colors duration-150 hover:text-pro-earth motion-reduce:transition-none ${focusOnParchment}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}

function ProSiteHero({ site }: { site: ProSitePayload }) {
  const sections = visibleProSiteSections(site);
  const arts = site.martialArts.join(" · ");
  const eyebrow = [arts, site.homeCity].filter(Boolean).join(" · ");
  let nextSection: { href: string; label: string } | null = null;
  if (sections.programs) {
    nextSection = { href: "#programs", label: "View programs" };
  } else if (sections.schedule) {
    nextSection = { href: "#schedule", label: "View schedule" };
  }

  return (
    <section className="relative isolate flex min-h-[560px] rx-lg:min-h-[640px] items-end overflow-hidden bg-pro-earth text-pro-parchment">
      {site.photoUrl ? (
        <>
          <img
            alt={`${site.displayName} training`}
            className="absolute inset-0 -z-20 h-full w-full object-cover"
            height={800}
            src={site.photoUrl}
            width={1200}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(23,17,12,.9),rgba(23,17,12,.42)_62%,rgba(23,17,12,.12))]"
          />
        </>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 -z-10 h-1 bg-pro-ochre"
        />
      )}

      <div className="pro-container relative z-10 pt-36 pb-14 rx-lg:pb-20">
        {eyebrow ? (
          <p className="font-semibold text-[11px] text-pro-ochre uppercase tracking-[.18em]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-4 max-w-[820px] font-bold text-[clamp(50px,7vw,88px)] leading-[.92] tracking-[-.06em] [overflow-wrap:anywhere]">
          {site.displayName}
        </h1>
        {nextSection ? (
          <a
            className={`mt-8 inline-flex min-h-11 items-center rounded-full bg-pro-ochre px-6 font-semibold text-[13px] text-pro-earth transition-colors duration-150 hover:bg-pro-parchment motion-reduce:transition-none ${focusOnEarth}`}
            href={nextSection.href}
          >
            {nextSection.label}
          </a>
        ) : null}
      </div>
    </section>
  );
}

function ProSiteAbout({ site }: { site: ProSitePayload }) {
  const stats = [
    site.yearsTeaching === null
      ? null
      : {
          label: site.yearsTeaching === 1 ? "Year teaching" : "Years teaching",
          value: site.yearsTeaching,
        },
    site.locations.length === 0
      ? null
      : {
          label: site.locations.length === 1 ? "Location" : "Locations",
          value: site.locations.length,
        },
    site.classes.length === 0
      ? null
      : {
          label: site.classes.length === 1 ? "Program" : "Programs",
          value: site.classes.length,
        },
  ].filter((item): item is { label: string; value: number } => item !== null);

  return (
    <section
      aria-labelledby="pro-about-heading"
      className="pro-container grid scroll-mt-24 rx-lg:grid-cols-[.9fr_1.1fr] gap-10 rx-lg:gap-20 py-20 rx-lg:py-24"
      id="about"
    >
      <div>
        <p className="font-semibold text-[11px] text-pro-muted uppercase tracking-[.18em]">
          About
        </p>
        <h2 className={sectionHeading} id="pro-about-heading">
          About the master
        </h2>
      </div>
      <div>
        <p className="whitespace-pre-line break-words text-[17px] text-pro-earth/80 leading-[1.75]">
          {site.introduction}
        </p>
        {stats.length > 0 ? (
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5 border-pro-earth/15 border-t pt-7">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="text-[10px] text-pro-muted uppercase tracking-[.12em]">
                  {stat.label}
                </dt>
                <dd className="mt-1 font-bold text-[30px] leading-none tracking-[-.04em]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}

function FullBadge({ surface = "dark" }: { surface?: "dark" | "light" }) {
  const tone =
    surface === "light"
      ? "border-pro-earth/30 text-pro-earth"
      : "border-pro-ochre/40 text-pro-ochre";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-0.5 font-semibold text-[10px] uppercase tracking-[.08em] ${tone}`}
    >
      Full
    </span>
  );
}

function ProSitePrograms({ site }: { site: ProSitePayload }) {
  return (
    <section
      aria-labelledby="pro-programs-heading"
      className="scroll-mt-24 bg-pro-earth-2 text-pro-parchment"
      id="programs"
    >
      <div className="pro-container py-20 rx-lg:py-24">
        <div className="flex rx-lg:flex-row flex-col rx-lg:items-end rx-lg:justify-between gap-4">
          <div>
            <p className="font-semibold text-[11px] text-pro-ochre uppercase tracking-[.18em]">
              Programs
            </p>
            <h2 className={sectionHeading} id="pro-programs-heading">
              Current programs
            </h2>
          </div>
          <p className="max-w-[360px] text-[14px] text-pro-parchment/65 leading-relaxed">
            Every program below is currently offered by {site.displayName}.
          </p>
        </div>

        <div className="mt-10 grid rx-lg:grid-cols-3 rx-md:grid-cols-2 gap-4">
          {site.classes.map((item, index) => (
            <article
              className="min-w-0 rounded-[24px] border border-pro-parchment/15 bg-pro-earth-2 p-7 rx-lg:p-8"
              key={item.id}
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-semibold text-[11px] text-pro-ochre tracking-[.12em]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.status === "full" ? <FullBadge /> : null}
              </div>
              <h3 className="mt-7 break-words font-bold text-[26px] leading-[1.08] tracking-[-.035em] [overflow-wrap:anywhere]">
                {item.name}
              </h3>
              <p className="mt-3 text-[13px] text-pro-parchment/65 leading-relaxed">
                {item.martialArt.name} · {AUDIENCE_LABELS[item.audience]} ·{" "}
                {LEVEL_LABELS[item.level]}
              </p>
              {item.feeAmount === null ? null : (
                <p className="mt-5 font-semibold text-[14px] text-pro-parchment">
                  {formatFee(item.feeAmount, item.feePeriod)}
                </p>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProSiteSchedule({ site }: { site: ProSitePayload }) {
  return (
    <section
      aria-labelledby="pro-schedule-heading"
      className="pro-container scroll-mt-24 py-20 rx-lg:py-24"
      id="schedule"
    >
      <p className="font-semibold text-[11px] text-pro-muted uppercase tracking-[.18em]">
        Training week
      </p>
      <h2 className={sectionHeading} id="pro-schedule-heading">
        Choose your location
      </h2>

      <div className="mt-9 border-pro-earth/20 border-t">
        {site.locations.map((location) => {
          const classes = site.classes.filter(
            (item) =>
              item.location.id === location.id && item.schedules.length > 0
          );
          if (classes.length === 0) {
            return null;
          }

          return (
            <div
              className="grid rx-md:grid-cols-[.8fr_1.2fr] gap-4 rx-md:gap-10 border-pro-earth/20 border-b py-6"
              key={location.id}
            >
              <h3 className="break-words font-bold text-[22px] tracking-[-.025em] [overflow-wrap:anywhere]">
                {location.name}
              </h3>
              <ul className="space-y-3">
                {classes.map((item) => (
                  <li
                    className="flex rx-sm:flex-row flex-col rx-sm:items-baseline rx-sm:justify-between gap-1 rx-sm:gap-6"
                    key={item.id}
                  >
                    <span className="flex min-w-0 flex-wrap items-center gap-2 font-semibold text-[14px] [overflow-wrap:anywhere]">
                      {item.name}
                      {item.status === "full" ? (
                        <FullBadge surface="light" />
                      ) : null}
                    </span>
                    <span className="rx-sm:text-right text-[13px] text-pro-muted">
                      {formatSchedules(item.schedules)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProSiteContact({ site }: { site: ProSitePayload }) {
  const { schedule } = visibleProSiteSections(site);

  return (
    <section
      aria-labelledby="pro-contact-heading"
      className="scroll-mt-24 border-pro-earth/20 border-t"
      id="contact"
    >
      <div className="pro-container grid scroll-mt-24 rx-lg:grid-cols-[.9fr_1.1fr] gap-8 rx-lg:gap-20 py-16">
        <div>
          <p className="font-semibold text-[11px] text-pro-muted uppercase tracking-[.18em]">
            Contact
          </p>
          <h2 className={sectionHeading} id="pro-contact-heading">
            Train with {site.displayName}
          </h2>
        </div>
        <div className="text-[16px] text-pro-earth/80 leading-[1.75]">
          {site.homeCity ? <p>Based in {site.homeCity}.</p> : null}
          {site.locations.length > 0 ? (
            <p className="mt-3">
              Classes run at{" "}
              {site.locations.map((item) => item.name).join(", ")}.
            </p>
          ) : null}
          {schedule ? (
            <a
              className={`mt-6 inline-flex min-h-11 items-center font-semibold text-[13px] text-pro-earth underline decoration-2 decoration-pro-ochre underline-offset-4 ${focusOnParchment}`}
              href="#schedule"
            >
              See the weekly schedule
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ProSiteFooter({ site }: { site: ProSitePayload }) {
  return (
    <footer className="bg-pro-earth text-pro-parchment">
      <div className="pro-container grid rx-md:grid-cols-[1fr_auto] rx-md:items-end gap-8 py-12">
        <div className="min-w-0">
          <p className="break-words font-bold text-[15px] uppercase tracking-[.14em] [overflow-wrap:anywhere]">
            {site.displayName}
          </p>
          {site.martialArts.length > 0 ? (
            <p className="mt-2 text-[13px] text-pro-parchment/65">
              {site.martialArts.join(" · ")}
            </p>
          ) : null}
          {site.homeCity ? (
            <p className="mt-1 text-[13px] text-pro-parchment/65">
              {site.homeCity}
            </p>
          ) : null}
        </div>
        <ProSitePoweredBy />
      </div>
    </footer>
  );
}

export function ProSitePage({
  onRetry,
  refreshError,
  site,
}: {
  onRetry: () => void;
  refreshError: boolean;
  site: ProSitePayload;
}) {
  const sections = visibleProSiteSections(site);

  return (
    <div className="pro-site min-h-dvh bg-pro-parchment text-pro-earth">
      <ProSiteSkipLink />
      <ProSiteHeader site={site} />

      {refreshError ? (
        <div className="border-pro-earth/15 border-b bg-pro-parchment">
          <div className="pro-container flex flex-col gap-2 py-3 text-[13px] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-pro-muted">
              This site could not refresh. Showing the last loaded content.
            </p>
            <button
              className={`self-start font-semibold text-pro-earth underline decoration-2 decoration-pro-ochre underline-offset-4 ${focusOnParchment}`}
              onClick={onRetry}
              type="button"
            >
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <main id="pro-main" tabIndex={-1}>
        <ProSiteHero site={site} />
        {sections.about ? <ProSiteAbout site={site} /> : null}
        {sections.programs ? <ProSitePrograms site={site} /> : null}
        {sections.schedule ? <ProSiteSchedule site={site} /> : null}
        {sections.contact ? <ProSiteContact site={site} /> : null}
      </main>

      <ProSiteFooter site={site} />
    </div>
  );
}
