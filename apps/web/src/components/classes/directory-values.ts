const NEXT_SESSION_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  hour12: true,
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
  weekday: "short",
});

/** A stored UTC instant rendered in the India wall clock. */
export function formatNextSession(instant: string) {
  const date = new Date(instant);
  if (Number.isNaN(date.getTime())) {
    return "Schedule unavailable";
  }
  const parts = NEXT_SESSION_FORMATTER.formatToParts(date);
  const weekday =
    parts.find((candidate) => candidate.type === "weekday")?.value ?? "";
  const hour =
    parts.find((candidate) => candidate.type === "hour")?.value ?? "";
  const minute =
    parts.find((candidate) => candidate.type === "minute")?.value ?? "";
  const dayPeriod = (
    parts.find((candidate) => candidate.type === "dayPeriod")?.value ?? ""
  ).toLowerCase();
  return `${weekday} ${hour}:${minute} ${dayPeriod}`.trim();
}
