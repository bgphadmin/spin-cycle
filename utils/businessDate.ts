const BUSINESS_TIME_ZONE = process.env.APP_TIME_ZONE ?? "Asia/Manila";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  second?: number;
};

function getDateParts(date: Date, timeZone: string): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function dateKeyFromParts({ year, month, day }: DateParts) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function localDateToUtc(parts: DateParts, timeZone: string) {
  const utcGuess = Date.UTC(parts.year, parts.month - 1, parts.day);
  const zonedParts = getDateParts(new Date(utcGuess), timeZone);
  const zonedAsUtc = Date.UTC(
    zonedParts.year,
    zonedParts.month - 1,
    zonedParts.day,
    zonedParts.hour ?? 0,
    zonedParts.minute ?? 0,
    zonedParts.second ?? 0,
  );
  return new Date(utcGuess - (zonedAsUtc - utcGuess));
}

function nextDate({ year, month, day }: DateParts): DateParts {
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
}

export function getBusinessDayRange(now = new Date(), timeZone = BUSINESS_TIME_ZONE) {
  const today = getDateParts(now, timeZone);
  return {
    start: localDateToUtc(today, timeZone),
    end: localDateToUtc(nextDate(today), timeZone),
  };
}

export function getBusinessYearStart(now = new Date(), timeZone = BUSINESS_TIME_ZONE) {
  const { year } = getDateParts(now, timeZone);
  return localDateToUtc({ year, month: 1, day: 1 }, timeZone);
}

export function businessDateKey(date: Date, timeZone = BUSINESS_TIME_ZONE) {
  return dateKeyFromParts(getDateParts(date, timeZone));
}

export function businessDateLabel(date: Date, timeZone = BUSINESS_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
  }).format(date);
}

export { BUSINESS_TIME_ZONE };
