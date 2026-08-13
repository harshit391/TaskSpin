import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextOccurrence } from "@/lib/recurrence";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";
  const priorityProjectId = searchParams.get("priorityProjectId");

  const tasks = await prisma.task.findMany({
    where: all ? { completed: false } : undefined,
    orderBy: { createdAt: "desc" },
    include: { project: true },
  });

  if (priorityProjectId) {
    tasks.sort((a, b) => {
      const aMatch = a.projectId === priorityProjectId ? 0 : 1;
      const bMatch = b.projectId === priorityProjectId ? 0 : 1;
      return aMatch - bMatch;
    });
  }

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }

  // Default recurrenceStartDate to today if recurrence type is set
  const startDate = body.recurrenceType
    ? (body.recurrenceStartDate || new Date().toISOString().split("T")[0])
    : null;

  // If recurring, calculate when it should next appear
  let hiddenUntil: Date | null = null;
  if (body.recurrenceType && startDate) {
    const nextOccurrence = calculateNextOccurrence(
      body.recurrenceType,
      body.recurrenceDays ?? null,
      startDate,
      body.recurrenceWeekdays ?? null
    );
    const now = new Date();
    if (nextOccurrence > now) {
      hiddenUntil = nextOccurrence;
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      ...(body.projectId ? { projectId: body.projectId } : {}),
      ...(body.recurrenceType ? { recurrenceType: body.recurrenceType } : {}),
      ...(body.recurrenceDays ? { recurrenceDays: body.recurrenceDays } : {}),
      ...(body.recurrenceWeekdays ? { recurrenceWeekdays: body.recurrenceWeekdays } : {}),
      ...(startDate ? { recurrenceStartDate: new Date(startDate) } : {}),
      ...(hiddenUntil ? { hiddenUntil } : {}),
    },
    include: { project: true },
  });

  return NextResponse.json(task, { status: 201 });
}
