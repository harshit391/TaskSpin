import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { calculateNextOccurrence } from "@/lib/recurrence";
import { readJson, badRequest, parseRecurrence, requestTimeZone } from "@/lib/http";
import { dateKeyInZone, startOfDayInZone } from "@/lib/timezone";
import { ownsProject } from "@/lib/ownership";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // The client filters, groups and counts the full list locally (dashboard tabs,
  // home stats, spin), so every task is returned. Completed tasks are cleaned up
  // by the nightly delete-old-tasks cron, which keeps this list bounded.
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { project: true, roadmap: true },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);
  if (!body) return badRequest();
  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
  if (projectId && !(await ownsProject(userId, projectId))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const recurrence = parseRecurrence(body);
  const timeZone = requestTimeZone(request);
  const startKey = recurrence.type
    ? (recurrence.start?.slice(0, 10) || dateKeyInZone(new Date(), timeZone))
    : null;
  // Stored as local midnight of the chosen day
  const startDate = startKey ? startOfDayInZone(startKey, timeZone) : null;

  let hiddenUntil: Date | null = null;
  if (recurrence.type && startDate) {
    const nextOccurrence = calculateNextOccurrence(
      recurrence.type,
      recurrence.days,
      startDate,
      recurrence.weekdays,
      timeZone
    );
    const now = new Date();
    if (nextOccurrence > now) {
      hiddenUntil = nextOccurrence;
    }
  }

  const task = await prisma.task.create({
    data: {
      userId,
      title,
      ...(projectId ? { projectId } : {}),
      ...(recurrence.type ? { recurrenceType: recurrence.type } : {}),
      ...(recurrence.days ? { recurrenceDays: recurrence.days } : {}),
      ...(recurrence.weekdays ? { recurrenceWeekdays: recurrence.weekdays } : {}),
      ...(startDate ? { recurrenceStartDate: startDate } : {}),
      ...(hiddenUntil ? { hiddenUntil } : {}),
    },
    include: { project: true },
  });

  return NextResponse.json(task, { status: 201 });
}
