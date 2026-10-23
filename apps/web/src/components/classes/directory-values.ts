const NEXT_SESSION_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  hour12: true,
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
  weekday: "short",
});

const NEXT_SESSION_CUSHION_MS = 1000;

interface NextSessionPayload {
  classes: readonly { nextSessionAt: string }[];
}

/**
 * A stale cached class must be refreshed as soon as its next session starts.
 * Returning the interval to the nearest start keeps the public lists from
 * showing yesterday's slot after a page has stayed open across the boundary.
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
    earliest - now + NEXT_SESSION_CUSHION_MS
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
