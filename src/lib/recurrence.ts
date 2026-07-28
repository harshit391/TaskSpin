export type RecurrenceType = "weekly" | "monthly" | "quarterly" | "custom";

export function calculateNextOccurrence(type: string, days: number | null): Date {
  const next = new Date();
  switch (type) {
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "custom":
      next.setDate(next.getDate() + (days ?? 7));
      break;
  }
  return next;
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
