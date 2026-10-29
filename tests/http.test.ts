import { afterEach, describe, expect, it, vi } from "vitest";
import { isCronAuthorized, isStringArray, parseRecurrence, pick, readJson, requestTimeZone } from "@/lib/http";

const req = (body?: string, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api", { method: "POST", body, headers });

describe("readJson", () => {
  it("parses objects and rejects everything else", async () => {
    expect(await readJson(req('{"a":1}'))).toEqual({ a: 1 });
    expect(await readJson(req("not json"))).toBeNull();
    expect(await readJson(req("[1,2]"))).toBeNull();
    expect(await readJson(req("null"))).toBeNull();
    expect(await readJson(req())).toBeNull();
  });
});

describe("pick", () => {
  it("keeps only whitelisted keys that are present", () => {
    const body = { title: "x", userId: "attacker", completed: false };
    expect(pick(body, ["title", "completed", "notes"] as const)).toEqual({ title: "x", completed: false });
  });
});

describe("isStringArray", () => {
  it("validates arrays of strings", () => {
    expect(isStringArray(["a", "b"])).toBe(true);
    expect(isStringArray(["a", 1])).toBe(false);
    expect(isStringArray("a")).toBe(false);
  });
});

describe("isCronAuthorized", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects everything when CRON_SECRET is unset", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isCronAuthorized(req(undefined, { authorization: "Bearer undefined" }))).toBe(false);
    expect(isCronAuthorized(req(undefined, { authorization: "Bearer " }))).toBe(false);
  });

  it("accepts only the exact bearer token", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isCronAuthorized(req(undefined, { authorization: "Bearer s3cret" }))).toBe(true);
    expect(isCronAuthorized(req(undefined, { authorization: "Bearer wrong" }))).toBe(false);
  });
});

describe("parseRecurrence", () => {
  it("accepts valid fields", () => {
    expect(parseRecurrence({ recurrenceType: "custom", recurrenceDays: 3.7, recurrenceStartDate: "2026-11-01" }))
      .toEqual({ type: "custom", days: 3, weekdays: null, start: "2026-11-01" });
  });

  it("drops invalid types and values", () => {
    expect(parseRecurrence({ recurrenceType: "hourly", recurrenceDays: -2, recurrenceStartDate: "nope" }))
      .toEqual({ type: null, days: null, weekdays: null, start: null });
  });
});

describe("requestTimeZone", () => {
  it("uses a valid x-timezone header and falls back otherwise", () => {
    expect(requestTimeZone(req(undefined, { "x-timezone": "America/New_York" }))).toBe("America/New_York");
    expect(requestTimeZone(req(undefined, { "x-timezone": "Mars/Base" }))).toBe("Asia/Kolkata");
    expect(requestTimeZone(req())).toBe("Asia/Kolkata");
  });
});
