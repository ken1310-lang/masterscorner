import {
  type ClassAudience,
  type ClassFeePeriod,
  type ClassFormValues,
  type ClassLevel,
  type ClassOption,
  type ClassScheduleView,
  type ClassStatus,
  type MasterClassView,
  type SaveClassInput,
  saveClassInputSchema,
  toTimeInput,
} from "@my-better-t-app/api/classes";

export const WEEKDAYS = [
  { label: "Monday", short: "Mon", value: "1" },
  { label: "Tuesday", short: "Tue", value: "2" },
  { label: "Wednesday", short: "Wed", value: "3" },
  { label: "Thursday", short: "Thu", value: "4" },
  { label: "Friday", short: "Fri", value: "5" },
  { label: "Saturday", short: "Sat", value: "6" },
  { label: "Sunday", short: "Sun", value: "7" },
] as const;

export const AUDIENCE_LABELS: Record<ClassAudience, string> = {
  adults: "Adults",
  all: "All ages",
  children: "Children",
};

export const LEVEL_LABELS: Record<ClassLevel, string> = {
  advanced: "Advanced",
  all: "All levels",
  beginner: "Beginner",
  intermediate: "Intermediate",
};

export const STATUS_LABELS: Record<ClassStatus, string> = {
  active: "Active",
  full: "Full",
  paused: "Paused",
};

export const FEE_PERIOD_LABELS: Record<ClassFeePeriod, string> = {
  month: "month",
  session: "session",
  term: "term",
  week: "week",
};

const WEEKDAY_BY_NUMBER = new Map(
  WEEKDAYS.map((day) => [Number(day.value), day])
);
const FEE_FORMATTER = new Intl.NumberFormat("en-IN", {
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
  style: "currency",
});

function firstOption(options: readonly ClassOption[]) {
  return options[0]?.id ?? "";
}

export function initialClassValues(
  item: MasterClassView | null,
  options: { locations: ClassOption[]; martialArts: ClassOption[] }
): ClassFormValues {
  if (!item) {
    return {
      audience: "all",
      feeAmount: "",
      feePeriod: "",
      level: "all",
      locationId: firstOption(options.locations),
      martialArtId: firstOption(options.martialArts),
      name: "",
      schedules: [
        {
          dayOfWeek: "1",
          endTime: "",
          key: crypto.randomUUID(),
          startTime: "",
        },
      ],
      status: "active",
    };
  }

  return {
    audience: item.audience,
    feeAmount: item.feeAmount === null ? "" : String(item.feeAmount),
    feePeriod: item.feePeriod ?? "",
    id: item.id,
    level: item.level,
    locationId: item.location.id,
    martialArtId: item.martialArt.id,
    name: item.name,
    schedules: item.schedules.map((schedule) => ({
      dayOfWeek: String(schedule.dayOfWeek),
      endTime: toTimeInput(schedule.endTime),
      key: schedule.id,
      startTime: toTimeInput(schedule.startTime),
    })),
    status: item.status,
  };
}

export function classFormValuesToInput(
  values: ClassFormValues
): SaveClassInput {
  const id = values.id?.trim();
  return saveClassInputSchema.parse({
    ...(id ? { id } : {}),
    audience: values.audience,
    feeAmount: values.feeAmount.trim() === "" ? null : Number(values.feeAmount),
    feePeriod: values.feePeriod === "" ? null : values.feePeriod,
    level: values.level,
    locationId: values.locationId,
    martialArtId: values.martialArtId,
    name: values.name,
    schedules: values.schedules.map((schedule) => ({
      dayOfWeek: Number(schedule.dayOfWeek),
      endTime: schedule.endTime,
      startTime: schedule.startTime,
    })),
    status: values.status,
  });
}

export function formatFee(
  amount: number | null,
  period: ClassFeePeriod | null
) {
  if (amount === null) {
    return "Not set";
  }
  const formatted = FEE_FORMATTER.format(amount);
  return period ? `${formatted}/${FEE_PERIOD_LABELS[period]}` : formatted;
}

function formatSlot(schedule: ClassScheduleView) {
  const day = WEEKDAY_BY_NUMBER.get(schedule.dayOfWeek);
  return `${day?.short ?? "?"} ${toTimeInput(schedule.startTime)}–${toTimeInput(
    schedule.endTime
  )}`;
}

export function formatSchedules(schedules: readonly ClassScheduleView[]) {
  if (schedules.length === 0) {
    return "No schedule";
  }
  return schedules.map(formatSlot).join(" · ");
}
