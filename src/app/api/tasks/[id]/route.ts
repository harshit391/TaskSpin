import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/auth";
import { calculateNextOccurrence } from "@/lib/recurrence";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const data = { ...body };
  if (data.recurrenceStartDate) {
    data.recurrenceStartDate = new Date(data.recurrenceStartDate);
  }

  if (data.recurrenceType === null) {
    data.hiddenUntil = null;
  } else if (data.recurrenceType && !existing.completed) {
    data.hiddenUntil = null;
  }

  if (body.completed === true && existing.recurrenceType) {
    const anchor = existing.recurrenceStartDate || new Date();
    const hiddenUntil = calculateNextOccurrence(
      existing.recurrenceType,
      existing.recurrenceDays,
      anchor,
      existing.recurrenceWeekdays
    );

    const task = await prisma.task.update({
      where: { id },
      data: {
        completed: false,
        hiddenUntil,
        recurrenceStartDate: hiddenUntil,
      },
      include: { project: true, roadmap: true },
    });

    return NextResponse.json({ ...task, _cloneHiddenUntil: hiddenUntil.toISOString() });
  }

  // If completing a task in a roadmap, remove it from roadmap and recompact positions
  if (body.completed === true && existing.roadmapId && existing.roadmapPosition !== null) {
    data.roadmapId = null;
    data.roadmapPosition = null;

    await prisma.task.updateMany({
      where: { roadmapId: existing.roadmapId, roadmapPosition: { gt: existing.roadmapPosition } },
      data: { roadmapPosition: { decrement: 1 } },
    });
  }

  // Mutual exclusion: setting projectId clears roadmap, setting roadmapId clears project
  if (data.projectId && existing.roadmapId) {
    data.roadmapId = null;
    data.roadmapPosition = null;
  }
  if (data.roadmapId && existing.projectId) {
    data.projectId = null;
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { project: true, roadmap: true },
  });

  return NextResponse.json(task);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  // If task is in a roadmap, recompact positions after deletion
  if (existing.roadmapId && existing.roadmapPosition !== null) {
    await prisma.task.updateMany({
      where: { roadmapId: existing.roadmapId, roadmapPosition: { gt: existing.roadmapPosition } },
      data: { roadmapPosition: { decrement: 1 } },
    });
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
