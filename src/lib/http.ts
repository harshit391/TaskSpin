import { NextResponse } from "next/server";
import { DEFAULT_TIMEZONE, isValidTimeZone } from "@/lib/timezone";

/** Parse a JSON object body; returns null for missing/malformed/non-object bodies. */
export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

/** Copy only whitelisted keys that are present on the body. */
export function pick<K extends string>(body: Record<string, unknown>, keys: readonly K[]): Partial<Record<K, unknown>> {
  const out: Partial<Record<K, unknown>> = {};
  for (const key of keys) {
    if (key in body) out[key] = body[key];
  }
  return out;
}

export function badRequest(error = "Invalid request body") {
  return NextResponse.json({ error }, { status: 400 });
}

export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export const isString = (v: unknown): v is string => typeof v === "string";
export const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

const RECURRENCE_TYPES = ["daily", "weekly", "monthly", "quarterly", "custom"];

/** Validated recurrence fields from a create-task body (all null when not recurring). */
export function parseRecurrence(body: Record<string, unknown>) {
  const type = isString(body.recurrenceType) && RECURRENCE_TYPES.includes(body.recurrenceType) ? body.recurrenceType : null;
  const days = typeof body.recurrenceDays === "number" && body.recurrenceDays > 0 ? Math.floor(body.recurrenceDays) : null;
  const weekdays = isString(body.recurrenceWeekdays) && body.recurrenceWeekdays ? body.recurrenceWeekdays : null;
  const startRaw = isString(body.recurrenceStartDate) && body.recurrenceStartDate ? body.recurrenceStartDate : null;
  const start = startRaw && !isNaN(new Date(startRaw).getTime()) ? startRaw : null;
  return { type, days, weekdays, start };
}

/** The user's IANA timezone, sent by the client as an x-timezone header on every API call. */
export function requestTimeZone(request: Request): string {
  const tz = request.headers.get("x-timezone");
  return tz && isValidTimeZone(tz) ? tz : DEFAULT_TIMEZONE;
}
