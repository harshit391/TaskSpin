import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  addMonthsToKey,
  dateKeyInZone,
  isValidTimeZone,
  startOfDayInZone,
  toDateKey,
  weekdayOfKey,
} from "@/lib/timezone";

describe("startOfDayInZone", () => {
  it("returns local midnight for a fixed-offset zone", () => {
    expect(startOfDayInZone("2026-10-30", "Asia/Kolkata").toISOString()).toBe("2026-10-29T18:30:00.000Z");
  });

  it("handles a DST transition day", () => {
    // US clocks fall back on 2026-11-01; midnight that day is still EDT (UTC-4)
    expect(startOfDayInZone("2026-11-01", "America/New_York").toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(startOfDayInZone("2026-11-02", "America/New_York").toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });

  it("is UTC midnight in UTC", () => {
    expect(startOfDayInZone("2026-01-01", "UTC").toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("dateKeyInZone", () => {
  it("reads the calendar day in the given zone", () => {
    const instant = new Date("2026-10-29T20:00:00Z");
    expect(dateKeyInZone(instant, "Asia/Kolkata")).toBe("2026-10-30");
    expect(dateKeyInZone(instant, "UTC")).toBe("2026-10-29");
  });
});

describe("date key arithmetic", () => {
  it("adds days across month and year ends", () => {
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("clamps month addition to the last day of the target month", () => {
    expect(addMonthsToKey("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsToKey("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonthsToKey("2026-11-30", 3)).toBe("2027-02-28");
  });

  it("computes weekdays", () => {
    expect(weekdayOfKey("2026-10-29")).toBe(4); // Thursday
    expect(weekdayOfKey("2026-11-01")).toBe(0); // Sunday
  });
});

describe("toDateKey", () => {
  it("passes plain date keys through", () => {
    expect(toDateKey("2026-10-30", "Asia/Kolkata")).toBe("2026-10-30");
  });

  it("reads legacy UTC-midnight values as that UTC date", () => {
    expect(toDateKey(new Date("2026-10-30T00:00:00.000Z"), "Asia/Kolkata")).toBe("2026-10-30");
  });

  it("reads timezone-aware values in the zone", () => {
    expect(toDateKey(new Date("2026-10-29T18:30:00.000Z"), "Asia/Kolkata")).toBe("2026-10-30");
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA names and rejects garbage", () => {
    expect(isValidTimeZone("Asia/Kolkata")).toBe(true);
    expect(isValidTimeZone("Not/AZone")).toBe(false);
  });
});
