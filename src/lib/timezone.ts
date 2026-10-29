// Calendar-date helpers that work in a specific IANA timezone (e.g. "Asia/Kolkata").
// Dates are passed around as "YYYY-MM-DD" keys; startOfDayInZone turns a key into the
// exact instant that day begins in that timezone. Works in both server and browser.

/** Used when a request carries no timezone (cron jobs, old clients). */
export const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Kolkata";

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** "YYYY-MM-DD" of the given instant as seen in the timezone. */
export function dateKeyInZone(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Milliseconds the timezone is ahead of UTC at the given instant. */
function zoneOffsetMs(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  const wallClockAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return wallClockAsUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** The instant midnight begins on the given day in the timezone. */
export function startOfDayInZone(dateKey: string, tz: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  // Two passes so days where the offset changes (DST) still land on local midnight
  let ts = utcMidnight - zoneOffsetMs(new Date(utcMidnight), tz);
  ts = utcMidnight - zoneOffsetMs(new Date(ts), tz);
  return new Date(ts);
}

function keyFromUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysToKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return keyFromUtc(new Date(Date.UTC(y, m - 1, d + days)));
}

/** Adds months, clamping to the last day of the target month (Jan 31 + 1 month = Feb 28/29). */
export function addMonthsToKey(dateKey: string, months: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const daysInTarget = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return keyFromUtc(new Date(Date.UTC(y, m - 1 + months, Math.min(d, daysInTarget))));
}

/** 0 = Sunday ... 6 = Saturday */
export function weekdayOfKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Calendar day a stored date refers to. Values saved before timezone support were
 * stored as UTC midnight, so an exact 00:00:00.000Z instant is read as that UTC date;
 * anything else is read in the given timezone.
 */
export function toDateKey(value: Date | string, tz: string): string {
  if (typeof value === "string" && DATE_KEY_RE.test(value)) return value;
  const date = new Date(value);
  if (date.getTime() % 86_400_000 === 0) return keyFromUtc(date);
  return dateKeyInZone(date, tz);
}
