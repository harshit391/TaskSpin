export type RecurrenceType = "weekly" | "monthly" | "quarterly" | "custom";

function addPeriod(date: Date, type: string, days: number | null): Date {
  const result = new Date(date);
  switch (type) {
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

export function calculateNextOccurrence(
  type: string,
  days: number | null,
  anchorDate?: Date | string | null
): Date {
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

export function recurrenceLabel(type: string, days?: number | null): string {
  switch (type) {
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

export function recurrenceDescription(type: string, days?: number | null): string {
  switch (type) {
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
