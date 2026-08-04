import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextOccurrence } from "@/lib/recurrence";

export async function GET() {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ hiddenUntil: null }, { hiddenUntil: { lte: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    include: { project: true },
  });
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

  // If recurring with a start date, hide until the next occurrence
  let hiddenUntil: Date | null = null;
  if (body.recurrenceType && body.recurrenceStartDate) {
    const nextOccurrence = calculateNextOccurrence(
      body.recurrenceType,
      body.recurrenceDays ?? null,
      body.recurrenceStartDate
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
      ...(body.recurrenceStartDate ? { recurrenceStartDate: new Date(body.recurrenceStartDate) } : {}),
      ...(hiddenUntil ? { hiddenUntil } : {}),
    },
    include: { project: true },
  });

  return NextResponse.json(task, { status: 201 });
}
