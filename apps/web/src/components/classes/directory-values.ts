const NEXT_SESSION_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  hour12: true,
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
  weekday: "short",
});

const NEXT_SESSION_CUSHION_MS = 1000;
/** `nextSessionStart` selects by India wall-clock minute, not second. */
const NEXT_SESSION_MINUTE_MS = 60_000;

interface NextSessionPayload {
  classes: readonly { nextSessionAt: string }[];
}

/**
 * A stale cached class must be refreshed after its next session starts.
 * The API resolves sessions by India wall-clock minute, so refreshing during
 * that minute returns the same instant and would schedule another one-second
 * request. Wait until the start minute has elapsed instead.
 */
export function nextSessionRefetchInterval(
  payload: NextSessionPayload | undefined,
  now = Date.now()
): number | false {
  if (!payload || payload.classes.length === 0) {
    return false;
  }
  let earliest = Number.POSITIVE_INFINITY;
  for (const item of payload.classes) {
    const instant = Date.parse(item.nextSessionAt);
    if (Number.isFinite(instant) && instant < earliest) {
      earliest = instant;
    }
  }
  if (!Number.isFinite(earliest)) {
    return false;
  }
  return Math.max(
    NEXT_SESSION_CUSHION_MS,
    earliest + NEXT_SESSION_MINUTE_MS - now + NEXT_SESSION_CUSHION_MS
  );
}

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
