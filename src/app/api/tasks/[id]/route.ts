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

    // Delete any legacy clone from the old clone-on-complete system
    const legacyClone = await prisma.task.findUnique({
      where: { sourceTaskId: id },
    });
    if (legacyClone && legacyClone.recurrenceType) {
      await prisma.task.delete({ where: { id: legacyClone.id } });
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        completed: false,
        hiddenUntil,
        recurrenceStartDate: hiddenUntil,
      },
      include: { project: true },
    });

    return NextResponse.json({ ...task, _cloneHiddenUntil: hiddenUntil.toISOString() });
  }

  const task = await prisma.task.update({
    where: { id },
    data,
    include: { project: true },
  });

  if (body.completed === true) {
    const child = await prisma.task.findUnique({
      where: { sourceTaskId: id },
    });
    if (child) {
      await prisma.task.update({
        where: { id: child.id },
        data: { sourceTaskId: null },
      });
    }
  }

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

  const child = await prisma.task.findUnique({
    where: { sourceTaskId: id },
  });

  if (child) {
    await prisma.task.update({
      where: { id: child.id },
      data: { sourceTaskId: existing.sourceTaskId ?? null },
    });
  }

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
