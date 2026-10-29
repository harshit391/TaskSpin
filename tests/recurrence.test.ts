import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateNextOccurrence, recurrenceLabel } from "@/lib/recurrence";

const TZ = "Asia/Kolkata";

describe("calculateNextOccurrence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Thursday 2026-10-29, 15:00 IST
    vi.setSystemTime(new Date("2026-10-29T09:30:00.000Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("daily: returns the next local midnight, not UTC midnight", () => {
    const next = calculateNextOccurrence("daily", null, "2026-10-20", null, TZ);
    expect(next.toISOString()).toBe("2026-10-29T18:30:00.000Z"); // Oct 30 00:00 IST
  });

  it("weekly: steps from the anchor in whole weeks", () => {
    // Oct 22 -> Oct 29 00:00 IST has already passed today -> Nov 5
    const next = calculateNextOccurrence("weekly", null, "2026-10-22", null, TZ);
    expect(next.toISOString()).toBe("2026-11-04T18:30:00.000Z");
  });

  it("monthly: clamps to month end", () => {
    vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));
    const next = calculateNextOccurrence("monthly", null, "2026-01-31", null, TZ);
    expect(next.toISOString()).toBe("2026-02-27T18:30:00.000Z"); // Feb 28 00:00 IST
  });

  it("custom interval uses recurrenceDays", () => {
    const next = calculateNextOccurrence("custom", 10, "2026-10-25", null, TZ);
    expect(next.toISOString()).toBe("2026-11-03T18:30:00.000Z"); // Nov 4 00:00 IST
  });

  it("custom weekdays: next matching weekday after today", () => {
    // Today is Thursday; Mon,Fri -> Friday Oct 30
    const next = calculateNextOccurrence("custom", null, null, "1,5", TZ);
    expect(next.toISOString()).toBe("2026-10-29T18:30:00.000Z");
  });

  it("custom weekdays: wraps to next week", () => {
    // Only Tuesday -> Tue Nov 3
    const next = calculateNextOccurrence("custom", null, null, "2", TZ);
    expect(next.toISOString()).toBe("2026-11-02T18:30:00.000Z");
  });

  it("future anchor is returned as-is (start date not reached yet)", () => {
    const next = calculateNextOccurrence("daily", null, "2026-11-05", null, TZ);
    expect(next.toISOString()).toBe("2026-11-04T18:30:00.000Z");
  });

  it("always returns a time strictly in the future", () => {
    for (const type of ["daily", "weekly", "monthly", "quarterly"]) {
      expect(calculateNextOccurrence(type, null, "2025-01-15", null, TZ).getTime()).toBeGreaterThan(Date.now());
    }
  });
});

describe("recurrenceLabel", () => {
  it("formats types and weekday sets", () => {
    expect(recurrenceLabel("daily")).toBe("Daily");
    expect(recurrenceLabel("custom", 10)).toBe("10d");
    expect(recurrenceLabel("custom", null, "1,3,5")).toBe("M,W,F");
  });
});
