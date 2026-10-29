import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { calculateNextOccurrence } from "@/lib/recurrence";
import { readJson, badRequest, isStringArray, parseRecurrence, requestTimeZone } from "@/lib/http";
import { dateKeyInZone, startOfDayInZone } from "@/lib/timezone";
import { ownsProject } from "@/lib/ownership";

const PROJECT_COLORS = [
  "#FF2D6F", "#6366F1", "#F59E0B", "#10B981", "#EC4899",
  "#8B5CF6", "#14B8A6", "#F97316", "#06B6D4", "#EF4444",
  "#84CC16", "#A855F7", "#0EA5E9", "#D946EF", "#22C55E",
];

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readJson(request);
  if (!body) return badRequest();
  const titles = isStringArray(body.titles)
    ? body.titles.map((t) => t.trim()).filter((t) => t.length > 0)
    : [];

  if (titles.length === 0) {
    return NextResponse.json(
      { error: "At least one title is required" },
      { status: 400 }
    );
  }

  let projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
  if (projectId && !(await ownsProject(userId, projectId))) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (typeof body.projectName === "string" && body.projectName.trim()) {
    const name = body.projectName.trim();
    let project = await prisma.project.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, userId },
    });

    if (!project) {
      const count = await prisma.project.count({ where: { userId } });
      const color = (typeof body.projectColor === "string" && body.projectColor) || PROJECT_COLORS[count % PROJECT_COLORS.length];
      project = await prisma.project.create({
        data: { userId, name, color },
      });
    }

    projectId = project.id;
  }

  const recurrence = parseRecurrence(body);
  const recurrenceType = recurrence.type;
  const recurrenceDays = recurrence.days;
  const recurrenceWeekdays = recurrence.weekdays;
  const timeZone = requestTimeZone(request);
  const recurrenceStartDate = recurrenceType
    ? startOfDayInZone(recurrence.start?.slice(0, 10) || dateKeyInZone(new Date(), timeZone), timeZone)
    : null;

  let hiddenUntil: Date | null = null;
  if (recurrenceType && recurrenceStartDate) {
    const nextOccurrence = calculateNextOccurrence(
      recurrenceType,
      recurrenceDays,
      recurrenceStartDate,
      recurrenceWeekdays,
      timeZone
    );
    if (nextOccurrence > new Date()) {
      hiddenUntil = nextOccurrence;
    }
  }

  const tasks = await prisma.task.createManyAndReturn({
    data: titles.map((title) => ({
      userId,
      title,
      projectId,
      ...(recurrenceType ? { recurrenceType } : {}),
      ...(recurrenceDays ? { recurrenceDays } : {}),
      ...(recurrenceWeekdays ? { recurrenceWeekdays } : {}),
      ...(recurrenceStartDate ? { recurrenceStartDate } : {}),
      ...(hiddenUntil ? { hiddenUntil } : {}),
    })),
  });

  return NextResponse.json(tasks, { status: 201 });
}
