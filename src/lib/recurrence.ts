import {
  addDaysToKey,
  addMonthsToKey,
  dateKeyInZone,
  startOfDayInZone,
  toDateKey,
  weekdayOfKey,
} from "@/lib/timezone";

export type RecurrenceType = "daily" | "weekly" | "monthly" | "quarterly" | "custom";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function addPeriod(dateKey: string, type: string, days: number | null): string {
  switch (type) {
    case "daily":
      return addDaysToKey(dateKey, 1);
    case "weekly":
      return addDaysToKey(dateKey, 7);
    case "monthly":
      return addMonthsToKey(dateKey, 1);
    case "quarterly":
      return addMonthsToKey(dateKey, 3);
    case "custom":
      return addDaysToKey(dateKey, days ?? 7);
    default:
      return addDaysToKey(dateKey, 1);
  }
}

function nextWeekday(todayKey: string, weekdays: number[]): string {
  const today = weekdayOfKey(todayKey);
  const sorted = [...weekdays].sort((a, b) => a - b);
  const later = sorted.find((day) => day > today);
  const diff = later !== undefined ? later - today : 7 - today + sorted[0];
  return addDaysToKey(todayKey, diff);
}

/**
 * When a recurring task should reappear: local midnight (in timeZone) of the next
 * occurrence that is strictly in the future.
 */
export function calculateNextOccurrence(
  type: string,
  days: number | null,
  anchorDate?: Date | string | null,
  weekdays?: string | null,
  timeZone = "UTC"
): Date {
  const now = new Date();
  const todayKey = dateKeyInZone(now, timeZone);

  if (type === "custom" && weekdays) {
    const dayIndices = weekdays.split(",").map(Number).filter((n) => n >= 0 && n <= 6);
    if (dayIndices.length > 0) {
      return startOfDayInZone(nextWeekday(todayKey, dayIndices), timeZone);
    }
  }

  if (!anchorDate) {
    return startOfDayInZone(addPeriod(todayKey, type, days), timeZone);
  }

  let key = toDateKey(anchorDate, timeZone);
  let next = startOfDayInZone(key, timeZone);
  while (next <= now) {
    key = addPeriod(key, type, days);
    next = startOfDayInZone(key, timeZone);
  }
  return next;
}

export function recurrenceLabel(type: string, days?: number | null, weekdays?: string | null): string {
  if (type === "custom" && weekdays) {
    const indices = weekdays.split(",").map(Number);
    return indices.map((i) => DAY_SHORT[i]).join(",");
  }
  switch (type) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "custom":
      return `${days ?? 7}d`;
    default:
      return "";
  }
}

export function recurrenceDescription(type: string, days?: number | null, weekdays?: string | null): string {
  if (type === "custom" && weekdays) {
    const indices = weekdays.split(",").map(Number);
    return "on " + indices.map((i) => DAY_ABBR[i]).join(", ");
  }
  switch (type) {
    case "daily":
      return "tomorrow";
    case "weekly":
      return "in 7 days";
    case "monthly":
      return "in 1 month";
    case "quarterly":
      return "in 3 months";
    case "custom":
      return `in ${days ?? 7} days`;
    default:
      return "";
  }
}

export { DAY_ABBR, DAY_SHORT };
