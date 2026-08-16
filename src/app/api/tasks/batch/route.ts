import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { calculateNextOccurrence } from "@/lib/recurrence";

const PROJECT_COLORS = [
  "#FF2D6F", "#6366F1", "#F59E0B", "#10B981", "#EC4899",
  "#8B5CF6", "#14B8A6", "#F97316", "#06B6D4", "#EF4444",
  "#84CC16", "#A855F7", "#0EA5E9", "#D946EF", "#22C55E",
];

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const titles: string[] = body.titles
    ?.map((t: string) => t.trim())
    .filter((t: string) => t.length > 0);

  if (!titles || titles.length === 0) {
    return NextResponse.json(
      { error: "At least one title is required" },
      { status: 400 }
    );
  }

  let projectId: string | null = body.projectId || null;

  if (body.projectName) {
    const name = body.projectName.trim();
    let project = await prisma.project.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, userId },
    });

    if (!project) {
      const count = await prisma.project.count({ where: { userId } });
      const color = body.projectColor || PROJECT_COLORS[count % PROJECT_COLORS.length];
      project = await prisma.project.create({
        data: { userId, name, color },
      });
    }

    projectId = project.id;
  }

  const recurrenceType = body.recurrenceType || null;
  const recurrenceDays = body.recurrenceDays || null;
  const recurrenceWeekdays = body.recurrenceWeekdays || null;
  const recurrenceStartDate = recurrenceType
    ? (body.recurrenceStartDate ? new Date(body.recurrenceStartDate) : new Date())
    : null;

  let hiddenUntil: Date | null = null;
  if (recurrenceType && recurrenceStartDate) {
    const nextOccurrence = calculateNextOccurrence(
      recurrenceType,
      recurrenceDays,
      recurrenceStartDate,
      recurrenceWeekdays
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
