import tzLookup from "tz-lookup";

export interface LocalDate {
  year: number;
  month: number;
  day: number;
}

const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dateTimeFormatters.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    calendar: "iso8601",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  dateTimeFormatters.set(timeZone, formatter);
  return formatter;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("de-DE", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(latitude: number, longitude: number): string {
  const timeZone = tzLookup(latitude, longitude);
  if (!isValidTimeZone(timeZone)) {
    throw new Error("Die ermittelte Zeitzone wird von diesem Browser nicht unterstützt.");
  }
  return timeZone;
}

export function localDateAt(instant: Date, timeZone: string): LocalDate {
  const fields = Object.fromEntries(
    partsFormatter(timeZone)
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: fields.year ?? 0,
    month: fields.month ?? 0,
    day: fields.day ?? 0,
  };
}

export function localDateKey(date: LocalDate): string {
  return `${date.year.toString().padStart(4, "0")}-${date.month
    .toString()
    .padStart(2, "0")}-${date.day.toString().padStart(2, "0")}`;
}

export function addLocalDays(date: LocalDate, days: number): LocalDate {
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day + days, 12));
  return {
    year: value.getUTCFullYear(),
    month: value.getUTCMonth() + 1,
    day: value.getUTCDate(),
  };
}

function compareLocalDates(left: LocalDate, right: LocalDate): number {
  return localDateKey(left).localeCompare(localDateKey(right));
}

export function firstInstantOfLocalDate(date: LocalDate, timeZone: string): Date {
  const center = Date.UTC(date.year, date.month - 1, date.day, 12);
  let low = center - 36 * 60 * 60 * 1000;
  let high = center + 36 * 60 * 60 * 1000;

  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (compareLocalDates(localDateAt(new Date(middle), timeZone), date) >= 0) {
      high = middle;
    } else {
      low = middle;
    }
  }

  const result = new Date(high);
  if (compareLocalDates(localDateAt(result, timeZone), date) !== 0) {
    throw new Error(`Das lokale Datum ${localDateKey(date)} existiert in ${timeZone} nicht.`);
  }
  return result;
}

export function localDayBounds(
  date: LocalDate,
  timeZone: string,
): { start: Date; end: Date; durationHours: number } {
  const start = firstInstantOfLocalDate(date, timeZone);
  const end = firstInstantOfLocalDate(addLocalDays(date, 1), timeZone);
  return {
    start,
    end,
    durationHours: (end.getTime() - start.getTime()) / 3_600_000,
  };
}

export function formatLocalTime(
  instant: Date,
  timeZone: string,
  locale = "de-DE",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}

export function formatLocalDate(
  date: LocalDate,
  timeZone: string,
  locale = "de-DE",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(firstInstantOfLocalDate(date, timeZone));
}

export function formatTimeZoneLabel(
  instant: Date,
  timeZone: string,
  locale = "de-DE",
): string {
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone,
    timeZoneName: "longOffset",
  });
  const offset =
    formatter.formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ??
    timeZone;
  return `${timeZone} (${offset})`;
}
