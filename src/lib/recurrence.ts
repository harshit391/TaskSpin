export type RecurrenceType = "daily" | "weekly" | "monthly" | "quarterly" | "custom";

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function addPeriod(date: Date, type: string, days: number | null): Date {
  const result = new Date(date);
  switch (type) {
    case "daily":
      result.setDate(result.getDate() + 1);
      break;
    case "weekly":
      result.setDate(result.getDate() + 7);
      break;
    case "monthly":
      result.setMonth(result.getMonth() + 1);
      break;
    case "quarterly":
      result.setMonth(result.getMonth() + 3);
      break;
    case "custom":
      result.setDate(result.getDate() + (days ?? 7));
      break;
  }
  return result;
}

function calculateNextWeekday(weekdays: number[]): Date {
  const now = new Date();
  const today = now.getDay();
  const sorted = [...weekdays].sort((a, b) => a - b);

  for (const day of sorted) {
    if (day > today) {
      const diff = day - today;
      const next = new Date(now);
      next.setDate(next.getDate() + diff);
      next.setHours(0, 0, 0, 0);
      return next;
    }
  }

  const diff = 7 - today + sorted[0];
  const next = new Date(now);
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function calculateNextOccurrence(
  type: string,
  days: number | null,
  anchorDate?: Date | string | null,
  weekdays?: string | null
): Date {
  if (type === "custom" && weekdays) {
    const dayIndices = weekdays.split(",").map(Number).filter((n) => n >= 0 && n <= 6);
    if (dayIndices.length > 0) {
      return calculateNextWeekday(dayIndices);
    }
  }

  const now = new Date();

  if (!anchorDate) {
    return addPeriod(now, type, days);
  }

  let anchor = new Date(anchorDate);
  if (anchor > now) return anchor;

  while (anchor <= now) {
    anchor = addPeriod(anchor, type, days);
  }
  return anchor;
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
