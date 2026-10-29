import { describe, expect, it } from "vitest";
import { validateEnv } from "@/lib/env";

const base = {
  DATABASE_URL: "postgres://x",
  NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
};

const env = (extra: Record<string, string>, withBase = true) =>
  ({ ...(withBase ? base : {}), ...extra }) as unknown as NodeJS.ProcessEnv;

describe("validateEnv", () => {
  it("passes a complete dev config", () => {
    expect(validateEnv(env({ NODE_ENV: "development" }))).toEqual({ errors: [], warnings: [] });
  });

  it("reports each missing required variable as an error", () => {
    expect(validateEnv(env({ NODE_ENV: "development" }, false)).errors).toHaveLength(3);
  });

  it("only warns about a missing CRON_SECRET, and only in production", () => {
    const prod = validateEnv(env({ NODE_ENV: "production" }));
    expect(prod.errors).toEqual([]);
    expect(prod.warnings.join()).toMatch(/CRON_SECRET/);
    expect(validateEnv(env({ NODE_ENV: "development" })).warnings).toEqual([]);
    expect(validateEnv(env({ NODE_ENV: "production", CRON_SECRET: "s" })).warnings).toEqual([]);
  });

  it("rejects an invalid APP_TIMEZONE", () => {
    expect(validateEnv(env({ NODE_ENV: "development", APP_TIMEZONE: "Nowhere" })).errors.join()).toMatch(/APP_TIMEZONE/);
  });
});
